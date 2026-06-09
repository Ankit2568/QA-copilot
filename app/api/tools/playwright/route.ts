import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { GENERATE_PLAYWRIGHT_TESTS_SYSTEM } from "@/lib/prompts";
import { PlaywrightScript } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  user_story: z.string().min(10),
  existing_test_cases: z.string().optional(),
  target_url: z.string().url().optional().or(z.literal("")),
  language: z.enum(["typescript", "javascript"]).optional(),
  scenarios: z.array(z.string()).optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    requireGeminiKey();
    const args = await parseJsonBody(req, Body);
    const language = args.language ?? "typescript";

    const parts = [
      `LANGUAGE: ${language}`,
      "FRAMEWORK: @playwright/test",
      "",
      "USER_STORY:",
      args.user_story.trim(),
    ];
    if (args.target_url) parts.push("", `TARGET_URL: ${args.target_url}`);
    if (args.existing_test_cases?.trim()) {
      parts.push("", "EXISTING_TEST_CASES:", args.existing_test_cases.trim());
    }
    if (args.scenarios?.length) {
      parts.push("", "REQUIRED_SCENARIOS:", `- ${args.scenarios.join("\n- ")}`);
    }

    const parsed = await callLlmJson<unknown>({
      system: GENERATE_PLAYWRIGHT_TESTS_SYSTEM,
      user: parts.join("\n"),
      // Playwright spec files (full .spec.ts source inside JSON `code` field)
      // routinely exceed 4k output tokens. Keep this generous so the JSON
      // doesn't get truncated mid-string and crash JSON.parse downstream.
      maxTokens: 8192,
      model: args.model,
    });
    const result = PlaywrightScript.parse(parsed);
    const ext = result.language === "typescript" ? ".spec.ts" : ".spec.js";
    if (!result.filename.endsWith(ext)) {
      const base = result.filename.replace(/\.(spec\.)?[tj]s$/i, "") || "qa-copilot-generated";
      result.filename = `${base}${ext}`;
    }
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
