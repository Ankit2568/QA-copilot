"use client";

import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  Info,
  Loader2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";

import type { RunnerEvent } from "@/lib/runner-events";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id: string;
  ts: number;
  kind:
    | "info"
    | "warn"
    | "error"
    | "debug"
    | "step-start"
    | "step-end-ok"
    | "step-end-fail"
    | "console"
    | "pageerror"
    | "requestfailed";
  message: string;
  detail?: string;
  source?: string;
}

/** Convert a RunnerEvent into one (or more) LogEntry rows. Pure. */
export function eventToEntries(e: RunnerEvent): LogEntry[] {
  const id = `${e.ts}-${Math.random().toString(36).slice(2, 8)}`;
  switch (e.type) {
    case "log":
      return [
        {
          id,
          ts: e.ts,
          kind: e.level,
          message: e.message,
          source: e.source,
        },
      ];
    case "step-start":
      return [
        {
          id,
          ts: e.ts,
          kind: "step-start",
          message: `Step ${e.index}: ${e.name}`,
        },
      ];
    case "step-end":
      return [
        {
          id,
          ts: e.ts,
          kind: e.ok ? "step-end-ok" : "step-end-fail",
          message: `Step ${e.index}: ${e.name} ${e.ok ? "✓" : "✗"} (${e.durationMs}ms)`,
          detail: e.error,
        },
      ];
    case "console":
      return [
        {
          id,
          ts: e.ts,
          kind: "console",
          message: `[console.${e.level}] ${e.message}`,
          detail: e.location,
        },
      ];
    case "pageerror":
      return [
        {
          id,
          ts: e.ts,
          kind: "pageerror",
          message: `Page error: ${e.message}`,
          detail: e.stack,
        },
      ];
    case "requestfailed":
      return [
        {
          id,
          ts: e.ts,
          kind: "requestfailed",
          message: `Request failed: ${e.method} ${e.url}`,
          detail: e.failure,
        },
      ];
    case "fatal":
      return [{ id, ts: e.ts, kind: "error", message: `Fatal: ${e.message}` }];
    default:
      return [];
  }
}

export function LiveLog({ entries, running }: { entries: LogEntry[]; running: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastEntryId = entries.length ? entries[entries.length - 1].id : null;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Auto-scroll only when user is near the bottom (don't yank them away if they scrolled up).
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [lastEntryId]);

  return (
    <div className="card overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated/50">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="ml-2 text-xs font-mono text-fg-muted">live log</span>
        {running ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-cyan-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            running
          </span>
        ) : entries.length > 0 ? (
          <span className="ml-auto text-xs text-fg-faint">idle</span>
        ) : null}
      </div>
      <div
        ref={scrollerRef}
        className="flex-1 min-h-[240px] max-h-[60vh] overflow-y-auto font-mono text-[12px] leading-relaxed bg-bg-surface"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-fg-faint text-xs">
            Logs will stream here as the script runs.
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {entries.map((e) => (
              <LogRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.ts).toLocaleTimeString([], { hour12: false });
  const { icon, color } = iconFor(entry.kind);
  return (
    <li className="px-3 py-1.5 flex items-start gap-2.5 hover:bg-bg-elevated/30 transition-colors">
      <span className="shrink-0 text-fg-faint w-[68px] tabular-nums">{time}</span>
      <span className={cn("shrink-0 mt-[3px]", color)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={cn("break-words", color)}>{entry.message}</div>
        {entry.detail && (
          <div className="mt-0.5 text-fg-faint break-words whitespace-pre-wrap">{entry.detail}</div>
        )}
        {entry.source && (
          <span className="text-[10px] text-fg-faint uppercase tracking-wider">[{entry.source}]</span>
        )}
      </div>
    </li>
  );
}

function iconFor(kind: LogEntry["kind"]): { icon: React.ReactNode; color: string } {
  switch (kind) {
    case "info":
      return { icon: <Info className="w-3.5 h-3.5" />, color: "text-fg-muted" };
    case "warn":
      return { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400" };
    case "error":
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-red-400" };
    case "debug":
      return { icon: <ChevronRight className="w-3.5 h-3.5" />, color: "text-fg-faint" };
    case "step-start":
      return { icon: <Zap className="w-3.5 h-3.5" />, color: "text-cyan-400" };
    case "step-end-ok":
      return { icon: <Check className="w-3.5 h-3.5" />, color: "text-emerald-400" };
    case "step-end-fail":
      return { icon: <X className="w-3.5 h-3.5" />, color: "text-red-400" };
    case "console":
      return { icon: <Info className="w-3.5 h-3.5" />, color: "text-violet-300" };
    case "pageerror":
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-red-400" };
    case "requestfailed":
      return { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400" };
  }
}
