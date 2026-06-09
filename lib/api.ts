import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";

import { ipFromRequest, rateLimit, RATE_LIMIT_HEADERS } from "@/lib/rate-limit";

/** Wrap any error into a sensible HTTP response. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join(".") || "(root)",
      message: i.message,
    }));
    const message = issues
      .map((i) => `${i.path}: ${i.message}`)
      .join("; ");
    return NextResponse.json(
      { error: `Invalid request body: ${message}`, issues },
      { status: 400 }
    );
  }

  const message = err instanceof Error ? err.message : String(err);

  // Missing API key → 500 with a clear message the UI can surface.
  if (/GEMINI_API_KEY/.test(message)) {
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Gen AI SDK errors expose .status; surface their HTTP code when available.
  const status =
    typeof (err as { status?: unknown })?.status === "number"
      ? ((err as { status: number }).status as number)
      : 500;
  return NextResponse.json({ error: message }, { status });
}

/** Assert GEMINI_API_KEY is present (and not a placeholder) at the start of every API route. */
export function requireGeminiKey(): void {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set on the server. Add it to your Vercel project (Settings → Environment Variables) or to .env.local for local development, then redeploy."
    );
  }
  if (isPlaceholderKey(key)) {
    throw new Error(
      "GEMINI_API_KEY is still set to the placeholder value in .env.local. Get a real key at https://aistudio.google.com/apikey, paste it into .env.local (must start with `AIza`), and restart `npm run dev`."
    );
  }
}

/**
 * Heuristic: does the env value look like a README placeholder rather than a
 * real credential? We intentionally accept any non-trivial token shape (not just
 * the canonical `AIza...` API key) so OAuth / ephemeral tokens can also be
 * tried — Google will tell us if the credential is wrong; our job here is only
 * to catch the "user pasted the literal placeholder text" mistake.
 */
function isPlaceholderKey(key: string): boolean {
  if (/^(REPLACE_ME|YOUR_|your-|<.*>|xxx+|sk-)/i.test(key)) return true;
  if (key.startsWith("AIza...")) return true;
  if (key.length < 20) return true;
  return false;
}

/** Standard rate-limit gate — call at top of API route. Returns 429 NextResponse if rejected. */
export function rateLimitOrReject(req: Request): NextResponse | null {
  const ip = ipFromRequest(req);
  const result = rateLimit(`api:${ip}`);
  if (!result.ok) {
    const retrySeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: `Rate limit exceeded. You can run up to ${result.limit} requests per 10 minutes per IP. Try again in ~${retrySeconds}s.`,
      },
      {
        status: 429,
        headers: {
          ...RATE_LIMIT_HEADERS.build(result),
          "Retry-After": String(retrySeconds),
        },
      }
    );
  }
  return null;
}

/** Parse + validate JSON body against a Zod schema. */
export async function parseJsonBody<T extends ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
  return schema.parse(raw);
}
