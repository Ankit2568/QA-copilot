"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") console.error("[qa-copilot] tool error:", error);
  }, [error]);

  return (
    <main className="px-4 lg:px-8 py-12 max-w-3xl mx-auto">
      <div className="card p-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 grid place-items-center">
            <AlertOctagon className="w-6 h-6 text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-fg mb-1">This tool failed to load</h1>
            <p className="text-sm text-fg-muted mb-4 break-words">
              {error.message || "An unexpected error occurred."}
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-fg-faint mb-4">digest: {error.digest}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={reset} className="btn-primary">
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
              <Link href="/" className="btn-secondary">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
