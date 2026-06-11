"use client";

import { Camera, Download, ImageOff, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface Shot {
  id: string;
  ts: number;
  index: number;
  label: string;
  dataUrl: string;
}

export function ScreenshotGallery({ shots }: { shots: Shot[] }) {
  const latest = shots[shots.length - 1];
  const [zoomed, setZoomed] = useState<Shot | null>(null);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <div className="card overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated/50">
        <Camera className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-mono text-fg-muted">screenshots</span>
        <span className="ml-auto text-xs text-fg-faint">{shots.length}</span>
      </div>

      {/* Latest screenshot — large preview */}
      <div className="flex-1 min-h-[240px] max-h-[60vh] grid place-items-center bg-bg-elevated/30 p-3 overflow-hidden">
        {latest ? (
          <button
            type="button"
            onClick={() => setZoomed(latest)}
            className="group relative max-w-full max-h-full block rounded-lg overflow-hidden border border-border hover:border-border-strong transition-colors"
            title="Click to zoom"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latest.dataUrl}
              alt={latest.label}
              className="max-w-full max-h-[55vh] object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent text-left">
              <div className="text-[11px] text-white truncate">{latest.label}</div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-black/60 text-white">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 text-fg-faint">
            <ImageOff className="w-6 h-6" />
            <span className="text-xs">No screenshots yet.</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {shots.length > 1 && (
        <div className="border-t border-border bg-bg-surface px-3 py-2 overflow-x-auto">
          <ul className="flex gap-2">
            {shots.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setZoomed(s)}
                  className={cn(
                    "block shrink-0 rounded-md overflow-hidden border transition-colors",
                    "border-border hover:border-border-strong"
                  )}
                  title={s.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.dataUrl} alt={s.label} className="h-14 w-auto object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-6"
          onClick={() => setZoomed(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot zoom"
        >
          <div
            className="relative max-w-[95vw] max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomed.dataUrl}
              alt={zoomed.label}
              className="max-w-[95vw] max-h-[88vh] object-contain rounded-lg border border-border"
            />
            <div className="absolute -top-2 -right-2 flex gap-2">
              <a
                href={zoomed.dataUrl}
                download={`qa-copilot-${zoomed.index}-${zoomed.label.replace(/\W+/g, "-")}.jpg`}
                onClick={(e) => e.stopPropagation()}
                className="btn-ghost bg-bg-surface border border-border"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setZoomed(null)}
                className="btn-ghost bg-bg-surface border border-border"
                aria-label="Close"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-4 py-3 bg-black/60 rounded-b-lg text-white text-xs">
              {zoomed.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
