import { NextResponse } from "next/server";

import { APP_VERSION } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health probe used by Vercel / uptime monitors. Returns 200 even when the
 * Gemini key is missing — the field `gemini_key_configured` lets you alert
 * on misconfiguration without flagging the deployment as down.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "qa-copilot-ui",
      version: APP_VERSION,
      provider: "google-gemini",
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
      gemini_key_configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      region: process.env.VERCEL_REGION ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
