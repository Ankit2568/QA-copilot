import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { GENERATE_TEST_CASES_SYSTEM } from "@/lib/prompts";
import { TestCasePriority, TestCaseSuite, TestCaseType } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  user_story: z.string().min(10, "user_story must be at least 10 characters."),
  /** Optional: limit to specific types of test cases. */
  types: z.array(TestCaseType).optional(),
  /** Optional: bias the suite toward these priorities. */
  priorities: z.array(TestCasePriority).optional(),
  /** Hard cap on cases. Defaults to 30. */
  max_cases: z.number().int().min(1).max(100).optional(),
  /** Optional context — won't be duplicated, but informs gap-filling. */
  existing_test_cases: z.string().optional(),
  /** Optional focus areas (e.g. "mobile, dark mode"). */
  focus_areas: z.array(z.string()).optional(),
  /** Per-call model override (validated server-side via resolveModel). */
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    requireGeminiKey();
    const args = await parseJsonBody(req, Body);
    const max = args.max_cases ?? 30;

    const parts = [
      "USER_STORY:",
      args.user_story.trim(),
      "",
      `MAX_CASES: ${max} (quality > quantity; cap is a hard limit).`,
    ];
    if (args.types?.length) {
      parts.push("", `TYPES (only emit these): ${args.types.join(", ")}`);
    }
    if (args.priorities?.length) {
      parts.push("", `PRIORITY_FOCUS: bias toward ${args.priorities.join(", ")}`);
    }
    if (args.focus_areas?.length) {
      parts.push("", "FOCUS_AREAS:", `- ${args.focus_areas.join("\n- ")}`);
    }
    if (args.existing_test_cases?.trim()) {
      parts.push(
        "",
        "EXISTING_TEST_CASES (do not duplicate; fill gaps around these):",
        args.existing_test_cases.trim()
      );
    }

    const parsed = await callLlmJson<unknown>({
      system: GENERATE_TEST_CASES_SYSTEM,
      user: parts.join("\n"),
      // A 30-case suite with detailed steps is large; keep headroom.
      maxTokens: 8192,
      model: args.model,
    });

    const result = TestCaseSuite.parse(parsed);
    if (result.test_cases.length > max) {
      result.test_cases = result.test_cases.slice(0, max);
    }
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
