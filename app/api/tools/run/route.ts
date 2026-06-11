import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { GENERATE_RUNNABLE_SCRIPT_SYSTEM } from "@/lib/prompts";
import { RunnableScript, RunnerInput } from "@/lib/schemas";
import {
  encodeSse,
  now,
  type RunnerEvent,
} from "@/lib/runner-events";
import { runScript, validateScript } from "@/lib/playwright-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Live runs can take a while — give them as long as the platform allows.
export const maxDuration = 300;

/**
 * Streaming Server-Sent Events endpoint for the Live Runner.
 *
 * Request body: RunnerInput
 * Response:     text/event-stream of RunnerEvent JSON objects.
 *
 * Local-only: this route launches a real (headed) browser process, which only
 * makes sense on the user's machine. We refuse to run on Vercel (or any
 * detectable serverless host) to fail fast with a clear message.
 */
export async function POST(req: Request) {
  // Pre-stream validation (must short-circuit cleanly, before we open the stream)
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return NextResponse.json(
        {
          error:
            "Live Runner cannot execute on serverless deployments (Vercel/Lambda) — there is no display for a headed browser, and Chromium binaries aren't shipped to the runtime. Run `npm run dev` locally and use Live Runner from http://localhost:3030/tools/runner.",
        },
        { status: 501 }
      );
    }

    const input = await parseJsonBody(req, RunnerInput);

    // Both modes need a key — generate mode obviously; manual mode only when
    // we ALSO use Gemini for anything later. Today we don't, so only enforce
    // the key when actually calling Gemini.
    let code: string;
    let summary: string | undefined;
    let steps: string[] | undefined;
    if (input.mode === "generate") {
      requireGeminiKey();
      const userPrompt = [
        `TARGET_URL: ${input.url}`,
        "",
        "SCENARIO:",
        (input.description ?? "").trim(),
      ].join("\n");
      const parsed = await callLlmJson<unknown>({
        system: GENERATE_RUNNABLE_SCRIPT_SYSTEM,
        user: userPrompt,
        maxTokens: 4096,
        model: input.model,
      });
      const result = RunnableScript.parse(parsed);
      code = result.code;
      summary = result.summary;
      steps = result.steps;
    } else {
      code = (input.script ?? "").trim();
      summary = undefined;
      steps = undefined;
    }

    const guard = validateScript(code);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }

    // OK — open the stream and start running. From this point we communicate
    // exclusively via SSE events; no thrown errors after stream-open.
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sentinel = { closed: false };
        const closeOnce = () => {
          if (sentinel.closed) return;
          sentinel.closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };

        const emit = (event: RunnerEvent) => {
          if (sentinel.closed) return;
          try {
            controller.enqueue(encodeSse(event));
          } catch {
            sentinel.closed = true;
          }
        };

        // Best-effort: drop the run if the client disconnects.
        const abort = new AbortController();
        req.signal.addEventListener(
          "abort",
          () => {
            abort.abort();
            emit({ type: "log", ts: now(), level: "warn", message: "Client disconnected. Aborting run." });
            closeOnce();
          },
          { once: true }
        );

        const runId = randomUUID();

        emit({
          type: "meta",
          ts: now(),
          url: input.url,
          browser: input.browser,
          headless: input.headless,
          slowMo: input.slow_mo,
          mode: input.mode,
          codePreview: code.length > 800 ? code.slice(0, 800) + "\n…" : code,
          runId,
        });

        if (input.mode === "generate") {
          emit({ type: "generated", ts: now(), code, summary, steps });
        }

        try {
          await runScript({
            url: input.url,
            scriptBody: code,
            runId,
            browser: input.browser,
            headless: input.headless,
            slowMo: input.slow_mo,
            timeoutMs: input.timeout_ms,
            emit,
            signal: abort.signal,
          });
        } catch (err) {
          emit({
            type: "fatal",
            ts: now(),
            message: err instanceof Error ? err.message : String(err),
          });
        } finally {
          closeOnce();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // disable nginx buffering if behind one
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
