/**
 * Curated catalog of Gemini models exposed to end users via the model picker.
 *
 * Single source of truth for:
 *   - what users see in the dropdown
 *   - what model IDs the server will accept (allow-list, defense in depth)
 *
 * Add/remove models here. Anything not in this list is rejected by the server
 * even if a stale localStorage value tries to sneak it through.
 */

export type ModelTier = "default" | "fast" | "quality" | "fallback";

export interface ModelInfo {
  /** Exact model ID sent to the Gemini API. */
  id: string;
  /** Short label for the dropdown. */
  label: string;
  /** ~50-char one-liner shown under the label. */
  description: string;
  /** Rough quality vs. speed signal. */
  tier: ModelTier;
}

export const MODELS: readonly ModelInfo[] = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Balanced quality & speed — recommended default.",
    tier: "default",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    description: "Fastest & cheapest — great for quick iterations.",
    tier: "fast",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Highest reasoning quality — slower, costs more.",
    tier: "quality",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Older but rock-solid. Useful when 2.5 is overloaded.",
    tier: "fallback",
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash-Lite",
    description: "Older, cheapest fallback.",
    tier: "fallback",
  },
] as const;

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

/** True iff the given id is in our curated catalog. */
export function isKnownModel(id: string): boolean {
  return MODELS.some((m) => m.id === id);
}

/**
 * Server-side resolver. Accepts an (optional) user-requested model id and
 * returns a model id that is safe to send to the Gemini API:
 *   1. user's request, if it's in the catalog
 *   2. else GEMINI_MODEL env var, if it's in the catalog
 *   3. else DEFAULT_MODEL_ID
 */
export function resolveModel(requested?: string | null): string {
  const fromRequest = requested?.trim();
  if (fromRequest && isKnownModel(fromRequest)) return fromRequest;

  const fromEnv = process.env.GEMINI_MODEL?.trim();
  if (fromEnv && isKnownModel(fromEnv)) return fromEnv;

  return DEFAULT_MODEL_ID;
}

/** Used by the API route Zod schemas. */
export const MODEL_IDS = MODELS.map((m) => m.id) as readonly string[];
