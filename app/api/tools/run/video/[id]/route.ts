import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { runDir } from "@/lib/playwright-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams the recorded video for a given run id back to the browser.
 *
 * Path: GET /api/tools/run/video/<runId>
 * Response: video/webm (Playwright's default recording container)
 *
 * The runId is a server-issued UUID generated when the live run starts, so
 * external callers can't enumerate or guess other users' recordings. The video
 * lives under os.tmpdir()/qa-copilot-runs/<runId>/ and is garbage-collected by
 * the runner after 2h.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const id = params.id;
  if (!/^[0-9a-fA-F-]{8,64}$/.test(id)) {
    return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
  }

  const dir = runDir(id);
  if (!existsSync(dir)) {
    return NextResponse.json({ error: "Recording not found (expired or never created)." }, { status: 404 });
  }

  // Playwright assigns a random filename like "<page-id>.webm". Pick the
  // largest .webm file in the dir (in practice there is exactly one).
  let target: { path: string; size: number } | null = null;
  for (const name of readdirSync(dir)) {
    if (!name.toLowerCase().endsWith(".webm")) continue;
    const full = join(dir, name);
    try {
      const st = statSync(full);
      if (!st.isFile()) continue;
      if (!target || st.size > target.size) target = { path: full, size: st.size };
    } catch {
      /* skip */
    }
  }

  if (!target) {
    return NextResponse.json({ error: "Recording is still finalizing. Try again in a moment." }, { status: 425 });
  }

  // Convert Node Readable → Web ReadableStream so Next.js can ship it.
  const nodeStream = createReadStream(target.path);
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        controller.enqueue(chunk instanceof Buffer ? new Uint8Array(chunk) : (chunk as Uint8Array));
      });
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "video/webm",
      "Content-Length": String(target.size),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="qa-copilot-run-${id}.webm"`,
    },
  });
}
