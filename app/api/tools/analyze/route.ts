import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { ANALYZE_TEST_CASES_SYSTEM } from "@/lib/prompts";
import { TestCoverageReport } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  user_story: z.string().min(10, "user_story must be at least 10 characters."),
  existing_test_cases: z.string().min(1, "existing_test_cases is required."),
  focus_areas: z.array(z.string()).optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    requireGeminiKey();
    const args = await parseJsonBody(req, Body);

    const focus = args.focus_areas?.length
      ? `\n\nFOCUS_AREAS:\n- ${args.focus_areas.join("\n- ")}`
      : "";

    const user = [
      "USER_STORY:",
      args.user_story.trim(),
      "",
      "EXISTING_TEST_CASES:",
      args.existing_test_cases.trim(),
      focus,
    ].join("\n");

    const parsed = await callLlmJson<unknown>({
      system: ANALYZE_TEST_CASES_SYSTEM,
      user,
      model: args.model,
    });
    const report = TestCoverageReport.parse(parsed);
    return NextResponse.json(report);
  } catch (err) {
    return errorResponse(err);
  }
}
