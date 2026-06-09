"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[qa-copilot] route error:", error);
    }
  }, [error]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="card p-8 max-w-lg w-full text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 grid place-items-center mb-4">
          <AlertOctagon className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-fg mb-2">Something went wrong</h1>
        <p className="text-sm text-fg-muted mb-4">
          {error.message || "An unexpected error occurred while rendering this page."}
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-fg-faint mb-4">
            digest: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <button onClick={reset} className="btn-primary" aria-label="Try again">
            <RotateCcw className="w-3.5 h-3.5" />
            Try again
          </button>
          <a href="/" className="btn-secondary" aria-label="Go to dashboard">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
