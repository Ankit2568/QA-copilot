import "server-only";

import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type RunnerEvent, type LogLevel, now } from "@/lib/runner-events";

/**
 * Run a Playwright script body in-process and emit events as it executes.
 *
 * What the user sees:
 *   1. A real, visible Chromium window (headed mode by default) so they can
 *      watch every click/keystroke in real time.
 *   2. A streaming live log in the dashboard with per-step pass/fail, console
 *      output, page errors, and failed requests.
 *   3. After the run finishes — a recorded video of the entire session, played
 *      back inline in the dashboard. Video is captured at viewport resolution
 *      via Playwright's recordVideo context option and served by GET
 *      /api/tools/run/video/[runId].
 *
 * Security note: the script body executes in this process via AsyncFunction
 * with full Node access (fs, etc.). This is acceptable for a LOCAL DEV tool —
 * the same process that runs `npm run dev`. We refuse to run this route on
 * Vercel/Lambda; do not enable it on a public-facing deployment.
 */

export interface RunOptions {
  url: string;
  scriptBody: string;
  runId: string;
  browser?: "chromium" | "firefox" | "webkit";
  headless?: boolean;
  slowMo?: number;
  timeoutMs?: number;
  emit: (event: RunnerEvent) => void;
  signal?: AbortSignal;
}

interface RunStats {
  ok: boolean;
  passedSteps: number;
  failedSteps: number;
  error?: string;
}

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 800;
const VIDEO_TTL_MS = 2 * 60 * 60 * 1000; // 2h on disk before garbage collection

const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

/** Root tempdir for all live-runner artifacts. Each run gets its own subdir. */
export function runsRootDir(): string {
  return join(tmpdir(), "qa-copilot-runs");
}

/** Absolute dir for a single run's artifacts (video, etc.). */
export function runDir(runId: string): string {
  return join(runsRootDir(), runId);
}

/** Best-effort: drop run dirs older than VIDEO_TTL_MS so /tmp doesn't bloat. */
export function gcOldRuns(): void {
  const root = runsRootDir();
  if (!existsSync(root)) return;
  const cutoff = Date.now() - VIDEO_TTL_MS;
  for (const name of readdirSync(root)) {
    const dir = join(root, name);
    try {
      const st = statSync(dir);
      if (st.isDirectory() && st.mtimeMs < cutoff) {
        rmSync(dir, { recursive: true, force: true });
      }
    } catch {
      /* ignore — another process may have deleted it */
    }
  }
}

export async function runScript(opts: RunOptions): Promise<void> {
  const start = now();
  const emit = opts.emit;
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const browserName = opts.browser ?? "chromium";
  const headless = opts.headless ?? false;
  const slowMo = opts.slowMo ?? 250;

  // Dynamic import — keeps Playwright out of the Edge bundle / cold-start path
  // of any other route.
  let chromium: typeof import("@playwright/test")["chromium"];
  let firefox: typeof import("@playwright/test")["firefox"];
  let webkit: typeof import("@playwright/test")["webkit"];
  let expect: typeof import("@playwright/test")["expect"];
  try {
    const pw = await import("@playwright/test");
    chromium = pw.chromium;
    firefox = pw.firefox;
    webkit = pw.webkit;
    expect = pw.expect;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({
      type: "fatal",
      ts: now(),
      message:
        "Playwright is not installed in this project. Run `npm install` to install dependencies, then `npx playwright install chromium` to download the browser. Original error: " +
        msg,
    });
    return;
  }

  const launcher =
    browserName === "firefox" ? firefox : browserName === "webkit" ? webkit : chromium;

  // Prepare per-run video directory.
  gcOldRuns();
  const videoDir = runDir(opts.runId);
  mkdirSync(videoDir, { recursive: true });

  let browser: import("@playwright/test").Browser | null = null;
  let context: import("@playwright/test").BrowserContext | null = null;
  let page: import("@playwright/test").Page | null = null;
  let videoHandle: import("@playwright/test").Video | null = null;
  let stepIndex = 0;
  const stats: RunStats = { ok: false, passedSteps: 0, failedSteps: 0 };

  const log = (
    message: string,
    level: LogLevel = "info",
    source: "runner" | "browser" | "script" = "runner"
  ) => {
    emit({ type: "log", ts: now(), level, message, source });
  };

  try {
    log(`Launching ${browserName} (${headless ? "headless" : "headed"}, slowMo=${slowMo}ms)…`);
    browser = await launcher.launch({ headless, slowMo });
    context = await browser.newContext({
      viewport: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
      ignoreHTTPSErrors: true,
      recordVideo: { dir: videoDir, size: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } },
    });
    page = await context.newPage();
    videoHandle = page.video();
    log(`Recording video to ${videoDir}`);

    page.on("console", (msg) => {
      const type = msg.type();
      const level: LogLevel =
        type === "error" ? "error" : type === "warning" ? "warn" : type === "debug" ? "debug" : "info";
      const loc = msg.location();
      emit({
        type: "console",
        ts: now(),
        level,
        message: msg.text(),
        location: loc?.url
          ? `${loc.url}:${loc.lineNumber ?? "?"}:${loc.columnNumber ?? "?"}`
          : undefined,
      });
    });
    page.on("pageerror", (err) => {
      emit({ type: "pageerror", ts: now(), message: err.message, stack: err.stack });
    });
    page.on("requestfailed", (req) => {
      const failure = req.failure()?.errorText ?? "unknown";
      emit({
        type: "requestfailed",
        ts: now(),
        url: req.url(),
        method: req.method(),
        failure,
      });
    });

    log(`Navigating to ${opts.url}…`);
    await page.goto(opts.url, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(30_000, timeoutMs),
    });

    // Helpers exposed to the user script. Wrapping actions in step() makes the
    // live log readable and groups assertions by intent.
    const step = async (name: string, fn: () => Promise<void> | void): Promise<void> => {
      const myIndex = ++stepIndex;
      const t0 = now();
      emit({ type: "step-start", ts: t0, index: myIndex, name });
      try {
        await fn();
        stats.passedSteps += 1;
        emit({
          type: "step-end",
          ts: now(),
          index: myIndex,
          name,
          ok: true,
          durationMs: now() - t0,
        });
      } catch (err) {
        stats.failedSteps += 1;
        const message = err instanceof Error ? err.message : String(err);
        emit({
          type: "step-end",
          ts: now(),
          index: myIndex,
          name,
          ok: false,
          durationMs: now() - t0,
          error: message,
        });
        throw err;
      }
    };

    const scriptLog = (msg: string, level: LogLevel = "info") => {
      emit({ type: "log", ts: now(), level, message: msg, source: "script" });
    };

    const aborter = new AbortController();
    const onSignal = () => aborter.abort();
    opts.signal?.addEventListener("abort", onSignal, { once: true });
    const timeoutHandle = setTimeout(() => aborter.abort(), timeoutMs);

    const scriptPromise = (async () => {
      const fn = new AsyncFunction(
        "page",
        "expect",
        "browser",
        "context",
        "request",
        "step",
        "log",
        "URL_BASE",
        opts.scriptBody
      );
      await fn(page, expect, browser, context, context!.request, step, scriptLog, opts.url);
    })();

    const abortPromise = new Promise<never>((_, reject) => {
      aborter.signal.addEventListener("abort", () => {
        reject(new Error(`Script aborted (timeout after ${timeoutMs}ms or client disconnect).`));
      });
    });

    try {
      await Promise.race([scriptPromise, abortPromise]);
      stats.ok = stats.failedSteps === 0;
    } catch (err) {
      stats.ok = false;
      stats.error = err instanceof Error ? err.message : String(err);
      log(stats.error, "error");
    } finally {
      clearTimeout(timeoutHandle);
      opts.signal?.removeEventListener("abort", onSignal);
    }
  } catch (err) {
    stats.ok = false;
    stats.error = err instanceof Error ? err.message : String(err);
    log(stats.error, "error");
  } finally {
    // IMPORTANT: closing the context finalizes the video file. Video.path()
    // returns the on-disk location only after this resolves.
    try {
      await context?.close();
    } catch {
      /* ignore */
    }
    try {
      await browser?.close();
    } catch {
      /* ignore */
    }

    // Resolve and report the video file.
    if (videoHandle) {
      try {
        const videoPath = await videoHandle.path();
        const st = statSync(videoPath);
        emit({
          type: "video-ready",
          ts: now(),
          runId: opts.runId,
          mime: "video/webm",
          sizeBytes: st.size,
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
          url: `/api/tools/run/video/${opts.runId}`,
        });
        log(`Video saved (${(st.size / 1024 / 1024).toFixed(2)} MB).`);
      } catch (err) {
        log(
          `Video finalization failed: ${err instanceof Error ? err.message : String(err)}`,
          "warn"
        );
      }
    }
  }

  emit({
    type: "done",
    ts: now(),
    ok: stats.ok,
    passedSteps: stats.passedSteps,
    failedSteps: stats.failedSteps,
    durationMs: now() - start,
    error: stats.ok ? undefined : stats.error,
  });
}

/**
 * Quick syntactic guardrails before we send the script into AsyncFunction.
 * AsyncFunction parses but doesn't reject `import` / `require` at compile
 * time — we surface a friendlier error here.
 */
export function validateScript(scriptBody: string): { ok: true } | { ok: false; reason: string } {
  if (!scriptBody.trim()) return { ok: false, reason: "Script body is empty." };
  if (/(^|\n)\s*import\s+/.test(scriptBody)) {
    return {
      ok: false,
      reason:
        "Remove `import` statements. `page`, `expect`, `browser`, `context`, `step`, `log` are already in scope.",
    };
  }
  if (/\brequire\s*\(/.test(scriptBody)) {
    return {
      ok: false,
      reason: "Remove `require(...)` calls. Use only the helpers already in scope.",
    };
  }
  if (/\btest\s*\(/.test(scriptBody)) {
    return {
      ok: false,
      reason:
        "Don't wrap actions in `test(...)`. Use `await step('name', async () => { ... })` instead.",
    };
  }
  if (/(?:^|\W)(?:process\.exit|child_process|fs\.unlink|eval\s*\()/i.test(scriptBody)) {
    return {
      ok: false,
      reason: "Disallowed API in script (process.exit/child_process/fs.unlink/eval).",
    };
  }
  return { ok: true };
}
