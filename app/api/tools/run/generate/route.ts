import { NextResponse } from "next/server";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { GENERATE_RUNNABLE_SCRIPT_SYSTEM } from "@/lib/prompts";
import { RunnableScript, RunnerGenerateInput } from "@/lib/schemas";
import { validateScript } from "@/lib/playwright-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Generate-only endpoint. Returns the runnable script so the UI can render it
 * in the editor; the user can tweak and hit Run to execute it via /api/tools/run.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    requireGeminiKey();
    const input = await parseJsonBody(req, RunnerGenerateInput);

    const userPrompt = [`TARGET_URL: ${input.url}`, "", "SCENARIO:", input.description.trim()].join(
      "\n"
    );

    const parsed = await callLlmJson<unknown>({
      system: GENERATE_RUNNABLE_SCRIPT_SYSTEM,
      user: userPrompt,
      maxTokens: 4096,
      model: input.model,
    });
    const result = RunnableScript.parse(parsed);

    const guard = validateScript(result.code);
    if (!guard.ok) {
      return NextResponse.json(
        {
          error:
            "Generated script violated runner rules: " +
            guard.reason +
            " Try a more specific scenario, or switch model.",
          code: result.code,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
