"use client";

import { Circle, Download, FilmIcon, Loader2, Maximize2, MonitorPlay } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface VideoInfo {
  runId: string;
  mime: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
}

/**
 * Shows the recorded run video.
 *
 * Lifecycle:
 *   - running, no video yet  → red "Recording…" overlay (the live browser
 *     window the user is already watching is the real-time view).
 *   - run finished, video ready  → inline <video> playback with download.
 *   - never ran                  → empty state.
 */
export function VideoPlayer({
  video,
  running,
  durationLabel,
}: {
  video: VideoInfo | null;
  running: boolean;
  durationLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zoomed, setZoomed] = useState(false);

  // Auto-load when a new run finishes (cache-bust by runId in the URL).
  useEffect(() => {
    if (!video || !videoRef.current) return;
    videoRef.current.load();
  }, [video?.runId, video]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <div className="card overflow-hidden flex flex-col h-full min-h-0">
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated/50">
        <FilmIcon className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-mono text-fg-muted">recording</span>
        {running && (
          <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] text-red-400">
            <Circle className="w-2 h-2 fill-current animate-pulse" />
            REC
          </span>
        )}
        {video && !running && (
          <span className="ml-2 text-[11px] text-fg-faint">
            {video.width}×{video.height} · {(video.sizeBytes / 1024 / 1024).toFixed(2)} MB
            {durationLabel ? ` · ${durationLabel}` : ""}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {video && (
            <>
              <button
                type="button"
                onClick={() => setZoomed(true)}
                className="btn-ghost"
                aria-label="Zoom"
                title="Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <a
                href={video.url}
                download={`qa-copilot-run-${video.runId}.webm`}
                className="btn-ghost"
                aria-label="Download video"
                title="Download .webm"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 min-h-[320px] grid place-items-center bg-black/40 p-3 overflow-hidden">
        {video ? (
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            className="max-w-full max-h-[60vh] rounded-md border border-border bg-black"
          >
            <source src={video.url} type={video.mime} />
            Your browser cannot play webm video.{" "}
            <a href={video.url} className="text-cyan-400 underline">
              Download the file
            </a>{" "}
            instead.
          </video>
        ) : running ? (
          <RecordingPlaceholder />
        ) : (
          <EmptyPlaceholder />
        )}
      </div>

      {/* zoom modal */}
      {zoomed && video && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm grid place-items-center p-6"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Video zoom"
        >
          <video
            controls
            autoPlay
            playsInline
            className="max-w-[95vw] max-h-[90vh] rounded-lg border border-border bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <source src={video.url} type={video.mime} />
          </video>
        </div>
      )}
    </div>
  );
}

function RecordingPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 text-fg-muted">
      <div className="relative w-12 h-12 grid place-items-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500/30 absolute inset-0" />
        <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
      </div>
      <p className="text-xs">
        Recording in progress · watch the Chromium window for the live action.
      </p>
      <p className="text-[10px] text-fg-faint">
        The video will appear here the moment the run finishes.
      </p>
    </div>
  );
}

function EmptyPlaceholder() {
  return (
    <div className={cn("flex flex-col items-center gap-2 text-fg-faint")}>
      <MonitorPlay className="w-7 h-7" />
      <span className="text-xs">No recording yet — hit Run on the spot.</span>
    </div>
  );
}
