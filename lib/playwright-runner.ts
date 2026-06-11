import "server-only";

import { type RunnerEvent, type LogLevel, now } from "@/lib/runner-events";

/**
 * Run a Playwright script body in-process and emit events as it executes.
 *
 * Why in-process (and not spawning `playwright test` CLI):
 *  - We need a streaming, structured event protocol (step-start/end, console,
 *    screenshots) — far easier when we own the Page object directly.
 *  - We need headed mode on the user's machine, not in a worker subprocess.
 *  - We need the user-provided script body (no surrounding test() / import())
 *    so they don't have to know the runner-spec format.
 *
 * Security note: the script body executes in this process via AsyncFunction.
 * That means it has full Node access (fs, child_process, …). This is acceptable
 * because the Live Runner is a LOCAL DEV tool — the same process the user owns
 * already runs `npm run dev`. We block this route from production runtime
 * separately. Do not enable this route on a public-facing deployment.
 */

export interface RunOptions {
  url: string;
  scriptBody: string;
  /** Default chromium. */
  browser?: "chromium" | "firefox" | "webkit";
  /** Default false (headed). */
  headless?: boolean;
  /** Default 250ms. */
  slowMo?: number;
  /** Hard ceiling for the whole script. Default 60_000. */
  timeoutMs?: number;
  /** Emit callback. The route streams these as SSE chunks. */
  emit: (event: RunnerEvent) => void;
  /** AbortSignal forwarded from the HTTP request, so closing the tab kills the run. */
  signal?: AbortSignal;
}

interface RunStats {
  ok: boolean;
  passedSteps: number;
  failedSteps: number;
  error?: string;
}

const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

export async function runScript(opts: RunOptions): Promise<void> {
  const start = now();
  const emit = opts.emit;
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const browserName = opts.browser ?? "chromium";
  const headless = opts.headless ?? false;
  const slowMo = opts.slowMo ?? 250;

  // Dynamic import — keeps Playwright out of the Edge bundle and out of the
  // critical-path bundle for routes that don't need it.
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

  let browser: import("@playwright/test").Browser | null = null;
  let context: import("@playwright/test").BrowserContext | null = null;
  let page: import("@playwright/test").Page | null = null;
  let screenshotIndex = 0;
  let stepIndex = 0;
  const stats: RunStats = { ok: false, passedSteps: 0, failedSteps: 0 };

  const log = (message: string, level: LogLevel = "info", source: "runner" | "browser" | "script" = "runner") => {
    emit({ type: "log", ts: now(), level, message, source });
  };

  try {
    log(`Launching ${browserName} (${headless ? "headless" : "headed"}, slowMo=${slowMo}ms)…`);
    browser = await launcher.launch({ headless, slowMo });
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });

    // Wire context-level diagnostics → SSE
    page = await context.newPage();

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
        location: loc?.url ? `${loc.url}:${loc.lineNumber ?? "?"}:${loc.columnNumber ?? "?"}` : undefined,
      });
    });
    page.on("pageerror", (err) => {
      emit({
        type: "pageerror",
        ts: now(),
        message: err.message,
        stack: err.stack,
      });
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

    // Auto-screenshot on navigation
    page.on("framenavigated", async (frame) => {
      if (frame !== page!.mainFrame()) return;
      try {
        const buf = await page!.screenshot({ type: "jpeg", quality: 70, fullPage: false });
        emit({
          type: "screenshot",
          ts: now(),
          index: ++screenshotIndex,
          label: `nav: ${frame.url()}`,
          dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
        });
      } catch {
        /* navigation screenshots are best-effort */
      }
    });

    log(`Navigating to ${opts.url}…`);
    await page.goto(opts.url, { waitUntil: "domcontentloaded", timeout: Math.min(30_000, timeoutMs) });

    // Helpers exposed to the user script
    const step = async (name: string, fn: () => Promise<void> | void): Promise<void> => {
      const myIndex = ++stepIndex;
      const t0 = now();
      emit({ type: "step-start", ts: t0, index: myIndex, name });
      try {
        await fn();
        const durationMs = now() - t0;
        emit({ type: "step-end", ts: now(), index: myIndex, name, ok: true, durationMs });
        stats.passedSteps += 1;
        // Snapshot at the end of every successful step.
        try {
          const buf = await page!.screenshot({ type: "jpeg", quality: 70, fullPage: false });
          emit({
            type: "screenshot",
            ts: now(),
            index: ++screenshotIndex,
            label: `✓ ${name}`,
            dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
          });
        } catch {
          /* best-effort */
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const durationMs = now() - t0;
        emit({ type: "step-end", ts: now(), index: myIndex, name, ok: false, durationMs, error: message });
        stats.failedSteps += 1;
        // Failure screenshot
        try {
          const buf = await page!.screenshot({ type: "jpeg", quality: 70, fullPage: true });
          emit({
            type: "screenshot",
            ts: now(),
            index: ++screenshotIndex,
            label: `✗ ${name}`,
            dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
          });
        } catch {
          /* best-effort */
        }
        throw err;
      }
    };

    const scriptLog = (msg: string, level: LogLevel = "info") => {
      emit({ type: "log", ts: now(), level, message: msg, source: "script" });
    };

    // Honor a hard wall-clock timeout for the whole script.
    const aborter = new AbortController();
    const onSignal = () => aborter.abort();
    opts.signal?.addEventListener("abort", onSignal, { once: true });
    const timeoutHandle = setTimeout(() => aborter.abort(), timeoutMs);

    const scriptPromise = (async () => {
      // SECURITY: arbitrary JS executed with full Node privileges. Local dev only.
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
    // Final screenshot (whatever the page is showing right now)
    if (page) {
      try {
        const buf = await page.screenshot({ type: "jpeg", quality: 70, fullPage: false });
        emit({
          type: "screenshot",
          ts: now(),
          index: ++screenshotIndex,
          label: "final",
          dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
        });
      } catch {
        /* best-effort */
      }
    }
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
 *
 * AsyncFunction won't actually fail on `import` / `require` (it parses them
 * as keywords and throws at runtime), so we surface a friendlier error early.
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
    return { ok: false, reason: "Disallowed API in script (process.exit/child_process/fs.unlink/eval)." };
  }
  return { ok: true };
}
