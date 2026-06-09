import "server-only";
import { FinishReason, GoogleGenAI, type GenerateContentResponse } from "@google/genai";

import { resolveModel } from "@/lib/models";

let cached: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and restart `npm run dev`."
    );
  }
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export interface LlmJsonOptions {
  system: string;
  user: string;
  /** Optional per-call model override. Must be in lib/models.ts catalog or it is ignored. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callLlmJson<T>(opts: LlmJsonOptions): Promise<T> {
  const model = resolveModel(opts.model);
  const temperature =
    opts.temperature ?? Number(process.env.GEMINI_TEMPERATURE ?? 0.2);
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 60_000);
  const maxRetries = Math.max(0, Number(process.env.GEMINI_MAX_RETRIES ?? 2));

  let raw;
  try {
    raw = await withRetries(
      () =>
        withTimeout(
          client().models.generateContent({
            model,
            contents: opts.user,
            config: {
              systemInstruction: opts.system,
              responseMimeType: "application/json",
              temperature,
              ...(opts.maxTokens ? { maxOutputTokens: opts.maxTokens } : {}),
            },
          }),
          timeoutMs
        ),
      maxRetries
    );
  } catch (err) {
    throw rewriteApiError(err, model);
  }

  assertCleanFinish(raw, model);

  const text = raw.text?.trim();
  if (!text) {
    throw new Error(
      `Gemini (${model}) returned an empty response. Try again, or switch model in the top bar.`
    );
  }
  return parseJsonLoose<T>(text, model, raw.candidates?.[0]?.finishReason);
}

/**
 * Inspect the response's `finishReason`. Anything other than STOP means the
 * model didn't produce a complete answer — partial JSON is unparseable, so
 * we throw a clear, actionable error here rather than letting JSON.parse
 * crash later with something like "Unterminated string in JSON at position N".
 */
function assertCleanFinish(res: GenerateContentResponse, model: string): void {
  const reason = res.candidates?.[0]?.finishReason;
  if (!reason || reason === FinishReason.STOP) return;

  if (reason === FinishReason.MAX_TOKENS) {
    throw new Error(
      `Gemini (${model}) hit its output-token limit before finishing the JSON response. ` +
        `Try a higher-capacity model (e.g. Gemini 2.5 Pro) from the top bar, or shorten the input.`
    );
  }
  if (reason === FinishReason.SAFETY || reason === FinishReason.BLOCKLIST) {
    throw new Error(
      `Gemini (${model}) blocked the response due to its safety filter (${reason}). ` +
        `Rephrase the user story without language the safety filter might flag, or try a different model.`
    );
  }
  if (reason === FinishReason.RECITATION) {
    throw new Error(
      `Gemini (${model}) stopped generation due to a recitation match. Try rephrasing the input.`
    );
  }
  throw new Error(
    `Gemini (${model}) stopped unexpectedly (finishReason=${reason}). Try again or switch model.`
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Gemini request timed out after ${ms}ms.`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withRetries<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) break;
      const backoffMs = 400 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

function isRetryable(err: unknown): boolean {
  const status = readStatus(err);
  if (typeof status === "number") {
    // Per-day quota walls don't recover within seconds — retrying just wastes
    // latency and clutters logs. Only retry 429s that look like per-minute /
    // per-second throttles (i.e. NOT a "PerDay" quotaId).
    if (status === 429) return !isPerDayQuota(err);
    return status === 408 || status >= 500;
  }
  const message = err instanceof Error ? err.message : String(err);
  return /timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed/i.test(message);
}

/** Best-effort HTTP status extraction from whatever shape the SDK throws. */
function readStatus(err: unknown): number | undefined {
  const direct = (err as { status?: unknown })?.status;
  if (typeof direct === "number") return direct;
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.match(/"code":\s*(\d{3})/);
  return m ? Number(m[1]) : undefined;
}

function isPerDayQuota(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /PerDay|GenerateRequestsPerDay/i.test(msg);
}

/**
 * Convert raw Google API errors into actionable, model-aware messages.
 *
 * Without this the UI just shows Google's giant JSON blob for things like
 * quota exhaustion, which is opaque and tells the user nothing about what to
 * do. We special-case the failure modes a user can realistically hit:
 *   - 429 + per-day quota   → "switch model / wait / add billing"
 *   - 429 + per-minute       → "you're sending requests too fast"
 *   - 403 + key issues       → permission / API-not-enabled hint
 *   - 503 unavailable        → model is busy; switch
 *
 * Falls back to passing the error through unchanged so we never hide useful
 * info accidentally.
 */
function rewriteApiError(err: unknown, model: string): Error {
  const status = readStatus(err);
  const original = err instanceof Error ? err : new Error(String(err));

  if (status === 429) {
    if (isPerDayQuota(err)) {
      return new Error(
        `Daily free-tier quota exhausted for ${model}. ` +
          `Switch to a different model in the top bar (each model has its own daily quota), ` +
          `wait until the quota resets (~midnight Pacific time), ` +
          `or enable billing at https://aistudio.google.com/apikey to remove the cap.`
      );
    }
    return new Error(
      `Rate-limited on ${model} (too many requests in a short window). ` +
        `Wait a few seconds and retry, or switch model in the top bar.`
    );
  }

  if (status === 503) {
    return new Error(
      `${model} is temporarily overloaded on Google's side (503). ` +
        `Switch to a different model in the top bar — they're separate capacity pools.`
    );
  }

  if (status === 403) {
    return new Error(
      `Gemini rejected the request as forbidden (403) for ${model}. ` +
        `Likely causes: API key restricted, Generative Language API not enabled on the project, ` +
        `or this model isn't available in your region. Try a different key from https://aistudio.google.com/apikey.`
    );
  }

  if (status === 400 && /API key/i.test(original.message)) {
    return new Error(
      `Gemini rejected your API key as invalid. ` +
        `Double-check the value in .env.local (no quotes, no spaces), or generate a fresh key at https://aistudio.google.com/apikey and restart \`npm run dev\`.`
    );
  }

  return original;
}

function parseJsonLoose<T>(raw: string, model: string, finishReason?: FinishReason | string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (primaryErr) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]) as T;
      } catch {
        /* fall through to block match */
      }
    }
    const block = raw.match(/[\{\[][\s\S]*[\}\]]/);
    if (block) {
      try {
        return JSON.parse(block[0]) as T;
      } catch {
        /* fall through to final throw */
      }
    }

    // All parse attempts failed. Build the most helpful error we can.
    const reasonHint =
      finishReason && finishReason !== FinishReason.STOP
        ? ` (finishReason=${finishReason})`
        : "";
    const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    const looksTruncated = /Unterminated|Unexpected end of JSON/i.test(primaryMsg);
    const hint = looksTruncated
      ? "Response appears truncated mid-string — Gemini likely hit its output limit. Try a higher-capacity model (Gemini 2.5 Pro) or simplify the input."
      : "Model returned malformed JSON.";

    throw new Error(
      `${hint} Gemini=${model}${reasonHint}. Raw first 200 chars: ${raw.slice(0, 200)}`
    );
  }
}
