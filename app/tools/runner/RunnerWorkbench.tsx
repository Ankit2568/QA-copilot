"use client";

import {
  Code2,
  ExternalLink,
  Globe,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getSelectedModel } from "@/components/ModelPicker";
import { LiveLog, eventToEntries, type LogEntry } from "@/components/runner/LiveLog";
import { RunSummary } from "@/components/runner/RunSummary";
import { ScreenshotGallery, type Shot } from "@/components/runner/ScreenshotGallery";
import type { RunnerEvent } from "@/lib/runner-events";
import { cn } from "@/lib/utils";

type Mode = "generate" | "manual";

const EXAMPLE_DESCRIPTION =
  "Open the home page, accept any cookie banner if shown, then click the primary call-to-action (Sign up / Get started / Try it). Verify the next page contains a sign-up form (email field).";

const EXAMPLE_SCRIPT = `// page, expect, browser, context, step, log, URL_BASE are already in scope.
await step("Page loaded", async () => {
  await expect(page).toHaveURL(/.*/);
});

await step("Primary CTA visible", async () => {
  const cta = page.getByRole("link", { name: /sign\\s*up|get\\s*started|try/i }).first();
  await expect(cta).toBeVisible({ timeout: 5000 });
  log("Found CTA: " + (await cta.textContent()));
});`;

interface DoneState {
  ok: boolean;
  passed: number;
  failed: number;
  durationMs: number;
  error?: string;
}

export function RunnerWorkbench() {
  // form
  const [url, setUrl] = useState("https://playwright.dev/");
  const [mode, setMode] = useState<Mode>("generate");
  const [description, setDescription] = useState(EXAMPLE_DESCRIPTION);
  const [script, setScript] = useState(EXAMPLE_SCRIPT);
  const [headless, setHeadless] = useState(false);
  const [slowMo, setSlowMo] = useState(250);
  const [browser, setBrowser] = useState<"chromium" | "firefox" | "webkit">("chromium");
  const [timeoutMs, setTimeoutMs] = useState(60_000);

  // generation
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSummary, setGenerationSummary] = useState<string | null>(null);

  // run
  const [running, setRunning] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [done, setDone] = useState<DoneState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derived: the script we'll actually run. In "generate" mode, the user can
  // edit the AI-produced script before hitting Run.
  const canRun = useMemo(() => {
    if (running) return false;
    if (!url.trim()) return false;
    if (mode === "generate") return script.trim().length >= 10;
    return script.trim().length >= 10;
  }, [running, url, mode, script]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setEntries([]);
    setShots([]);
    setDone(null);
    setError(null);
    setGenerationError(null);
    setGenerationSummary(null);
  }, []);

  // Clean up the stream on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  /** Hit /api/tools/run/generate to pre-fill the script editor. */
  async function generate() {
    if (!url.trim() || description.trim().length < 10) return;
    setGenerating(true);
    setGenerationError(null);
    setGenerationSummary(null);
    try {
      const res = await fetch("/api/tools/run/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          description,
          model: getSelectedModel(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Generation failed (${res.status}).`);
      setScript(data.code);
      setGenerationSummary(data.summary ?? null);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  /** Kick off the live run — streams SSE events into state. */
  async function run() {
    if (!canRun) return;
    reset();
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      // By the time we Run, the script is fully materialized in the editor
      // (either typed by the user or generated and possibly edited). Always
      // send it as "manual" so the server doesn't re-call Gemini.
      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          mode: "manual",
          script,
          headless,
          slow_mo: slowMo,
          timeout_ms: timeoutMs,
          browser,
          model: getSelectedModel(),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        let parsed: { error?: string } | null = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          /* not json */
        }
        throw new Error(parsed?.error || text || `Run failed (${res.status}).`);
      }

      await consumeEventStream(res.body, (event) => {
        applyEvent(event, { setEntries, setShots, setDone, setError });
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        setEntries((prev) => [
          ...prev,
          {
            id: `abort-${Date.now()}`,
            ts: Date.now(),
            kind: "warn",
            message: "Run aborted by user.",
          },
        ]);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div className="space-y-6">
      {/* Local-only banner */}
      <div
        role="note"
        className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-200 flex items-start gap-3"
      >
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" />
        <div className="leading-relaxed">
          <span className="font-semibold">Local-only feature.</span> Live Runner
          opens a real Chromium window on the machine running{" "}
          <code className="px-1 py-0.5 rounded bg-bg-elevated text-cyan-300">npm run dev</code>.
          It does not work on Vercel — serverless hosts have no display. First
          time? Install the browser binary once:{" "}
          <code className="px-1 py-0.5 rounded bg-bg-elevated text-cyan-300">npx playwright install chromium</code>.
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left: URL + mode + content */}
        <div className="card p-5 space-y-4">
          {/* URL */}
          <div>
            <label htmlFor="runner-url" className="label-base flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Target URL
            </label>
            <div className="flex gap-2">
              <input
                id="runner-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="input-base flex-1"
                aria-required="true"
              />
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost border border-border"
                  title="Open in new tab"
                  aria-label="Open URL in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="label-base">Source</label>
            <div className="inline-flex rounded-lg border border-border bg-bg-elevated p-1">
              <ModeButton
                active={mode === "generate"}
                onClick={() => setMode("generate")}
                icon={<Wand2 className="w-3.5 h-3.5" />}
                label="Generate from description"
              />
              <ModeButton
                active={mode === "manual"}
                onClick={() => setMode("manual")}
                icon={<Code2 className="w-3.5 h-3.5" />}
                label="Write my own script"
              />
            </div>
          </div>

          {/* Description (generate mode) */}
          {mode === "generate" && (
            <div className="space-y-2">
              <label htmlFor="runner-description" className="label-base">
                What should the script do?
              </label>
              <textarea
                id="runner-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the scenario in plain English. Example: Log in with test@example.com / Hunter2, then verify the dashboard greets the user by name."
                className="input-base resize-y text-[13px] leading-relaxed"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating || description.trim().length < 10 || !url.trim()}
                  className="btn-secondary"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {generating ? "Generating…" : "Generate script"}
                </button>
                {generationSummary && (
                  <p className="text-[11px] text-fg-muted truncate" title={generationSummary}>
                    {generationSummary}
                  </p>
                )}
              </div>
              {generationError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300"
                >
                  {generationError}
                </div>
              )}
            </div>
          )}

          {/* Script editor (always visible — generate fills it, manual edits directly) */}
          <div className="space-y-2">
            <label htmlFor="runner-script" className="label-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code2 className="w-3 h-3" />
                {mode === "generate" ? "Generated script (editable)" : "Script body"}
              </span>
              <span className="text-[10px] normal-case tracking-normal text-fg-faint">
                in scope: page · expect · browser · context · step · log · URL_BASE
              </span>
            </label>
            <textarea
              id="runner-script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder='await step("Page loaded", async () => { await expect(page).toHaveURL(/.*/); });'
              className="input-base resize-y font-mono text-[12px] leading-relaxed"
            />
            <p className="text-[10px] text-fg-faint">
              JavaScript only. No imports. No <code className="text-fg-muted">test(...)</code>{" "}
              wrapper. Wrap actions in{" "}
              <code className="text-fg-muted">await step(name, async () =&gt; {`{`}…{`}`})</code>{" "}
              to surface them in the live log.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-xs text-red-300"
            >
              <span className="font-semibold">Error: </span>
              {error}
            </div>
          )}

          {/* Run row */}
          <div className="flex items-center gap-2 pt-1">
            {running ? (
              <button type="button" onClick={stop} className="btn-secondary flex-1 !text-red-300 !border-red-500/30">
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop run
              </button>
            ) : (
              <button
                type="button"
                onClick={run}
                disabled={!canRun}
                className={cn("btn-primary flex-1", running && "cursor-progress")}
                aria-label="Run the script"
              >
                <Play className="w-3.5 h-3.5" />
                Run on the spot
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                reset();
                setScript(EXAMPLE_SCRIPT);
                setDescription(EXAMPLE_DESCRIPTION);
              }}
              className="btn-secondary"
              title="Reset everything"
              aria-label="Reset"
              disabled={running}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: settings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-fg uppercase tracking-wider">Run options</h3>

          <div>
            <label htmlFor="runner-browser" className="label-base">Browser</label>
            <select
              id="runner-browser"
              value={browser}
              onChange={(e) => setBrowser(e.target.value as "chromium" | "firefox" | "webkit")}
              className="input-base"
            >
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
            <p className="text-[10px] text-fg-faint mt-1.5">
              Install browsers with <code className="text-fg-muted">npx playwright install</code>.
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-xs text-fg-muted">Headless (no visible window)</span>
            <input
              type="checkbox"
              checked={headless}
              onChange={(e) => setHeadless(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <div>
            <label htmlFor="runner-slowmo" className="label-base">
              Slow motion ({slowMo}ms / action)
            </label>
            <input
              id="runner-slowmo"
              type="range"
              min={0}
              max={1500}
              step={50}
              value={slowMo}
              onChange={(e) => setSlowMo(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[10px] text-fg-faint mt-1">
              Adds delay between actions so the browser is easier to watch.
            </p>
          </div>

          <div>
            <label htmlFor="runner-timeout" className="label-base">
              Timeout (sec)
            </label>
            <input
              id="runner-timeout"
              type="number"
              min={5}
              max={180}
              value={Math.round(timeoutMs / 1000)}
              onChange={(e) => setTimeoutMs(Math.max(5, Math.min(180, Number(e.target.value))) * 1000)}
              className="input-base"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {done && (
        <RunSummary
          done={done}
          passed={done.passed}
          failed={done.failed}
          durationMs={done.durationMs}
          error={done.error}
        />
      )}

      {/* Live panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[420px]">
        <LiveLog entries={entries} running={running} />
        <ScreenshotGallery shots={shots} />
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-bg-surface text-fg shadow-sm border border-border"
          : "text-fg-muted hover:text-fg"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- stream helpers ---------------- */

/** Read a `text/event-stream` ReadableStream and dispatch RunnerEvents. */
async function consumeEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: RunnerEvent) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE records are separated by a blank line ("\n\n"). Split, keep tail.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const record = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = record
        .split("\n")
        .find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json) continue;
      try {
        const event = JSON.parse(json) as RunnerEvent;
        onEvent(event);
      } catch {
        /* malformed — skip */
      }
    }
  }
}

interface ApplyTargets {
  setEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
  setDone: React.Dispatch<React.SetStateAction<DoneState | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function applyEvent(event: RunnerEvent, t: ApplyTargets): void {
  switch (event.type) {
    case "meta":
    case "generated":
      // No-op (we already have the script locally; could log if desired).
      return;
    case "screenshot":
      t.setShots((prev) => [
        ...prev,
        {
          id: `shot-${event.index}-${event.ts}`,
          ts: event.ts,
          index: event.index,
          label: event.label,
          dataUrl: event.dataUrl,
        },
      ]);
      return;
    case "done":
      t.setDone({
        ok: event.ok,
        passed: event.passedSteps,
        failed: event.failedSteps,
        durationMs: event.durationMs,
        error: event.error,
      });
      if (!event.ok && event.error) {
        t.setError(event.error);
      }
      return;
    case "fatal":
      t.setError(event.message);
      t.setEntries((prev) => [...prev, ...eventToEntries(event)]);
      return;
    default: {
      const rows = eventToEntries(event);
      if (rows.length) t.setEntries((prev) => [...prev, ...rows]);
    }
  }
}
