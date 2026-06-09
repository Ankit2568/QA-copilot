import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, parseJsonBody, rateLimitOrReject, requireGeminiKey } from "@/lib/api";
import { callLlmJson } from "@/lib/gemini";
import { EXPLORATORY_CHECKLIST_SYSTEM } from "@/lib/prompts";
import { ExploratoryChecklist } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  user_story: z.string().min(10),
  persona: z.string().optional(),
  focus_areas: z.array(z.string()).optional(),
  model: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimitOrReject(req);
    if (limited) return limited;

    requireGeminiKey();
    const args = await parseJsonBody(req, Body);

    const parts = ["USER_STORY:", args.user_story.trim()];
    if (args.persona?.trim()) parts.push("", "PERSONA:", args.persona.trim());
    if (args.focus_areas?.length) parts.push("", "FOCUS_AREAS:", `- ${args.focus_areas.join("\n- ")}`);

    const parsed = await callLlmJson<unknown>({
      system: EXPLORATORY_CHECKLIST_SYSTEM,
      user: parts.join("\n"),
      model: args.model,
    });
    const result = ExploratoryChecklist.parse(parsed);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
