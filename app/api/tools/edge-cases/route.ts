import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { GENERATE_EDGE_CASES_SYSTEM } from "@/lib/prompts";
import { EdgeCaseList } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  user_story: z.string().min(10),
  existing_test_cases: z.string().optional(),
  max_cases: z.number().int().min(1).max(50).optional(),
  focus_areas: z.array(z.string()).optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    requireGeminiKey();
    const args = await parseJsonBody(req, Body);
    const max = args.max_cases ?? 15;

    const parts = [
      "USER_STORY:",
      args.user_story.trim(),
      "",
      `MAX_CASES: ${max} (quality > quantity).`,
    ];
    if (args.existing_test_cases?.trim()) {
      parts.push("", "EXISTING_TEST_CASES (do not duplicate):", args.existing_test_cases.trim());
    }
    if (args.focus_areas?.length) {
      parts.push("", "FOCUS_AREAS:", `- ${args.focus_areas.join("\n- ")}`);
    }

    const parsed = await callLlmJson<unknown>({
      system: GENERATE_EDGE_CASES_SYSTEM,
      user: parts.join("\n"),
      model: args.model,
    });
    const result = EdgeCaseList.parse(parsed);
    if (result.edge_cases.length > max) result.edge_cases = result.edge_cases.slice(0, max);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
