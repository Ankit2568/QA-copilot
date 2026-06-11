"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function RunSummary({
  done,
  passed,
  failed,
  durationMs,
  error,
}: {
  done: { ok: boolean } | null;
  passed: number;
  failed: number;
  durationMs: number;
  error?: string;
}) {
  if (!done) return null;
  const ok = done.ok;
  return (
    <div
      className={cn(
        "card p-5 border-l-4",
        ok ? "border-l-emerald-500" : "border-l-red-500"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-11 h-11 rounded-xl grid place-items-center border shrink-0",
            ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}
        >
          {ok ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-fg">
            {ok ? "All steps passed" : "Run failed"}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {passed} passed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              {failed} failed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-fg-faint" />
              {formatDuration(durationMs)}
            </span>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-xs text-red-200 whitespace-pre-wrap break-words">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}
