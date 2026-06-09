"use client";

import {
  Check,
  ChevronDown,
  Download,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  exportResult,
  type ExportFormat,
  type ToolSlug,
} from "@/lib/exporters";
import { cn } from "@/lib/utils";

interface Props {
  tool: ToolSlug;
  data: unknown;
  /** Variant: "primary" = filled violet button, "ghost" = subtle. */
  variant?: "primary" | "ghost";
  /** Override the visible label. Defaults to "Export". */
  label?: string;
}

const OPTIONS: Array<{
  format: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileSpreadsheet;
  accent: string;
}> = [
  {
    format: "xlsx",
    label: "Excel workbook",
    hint: ".xlsx · multi-sheet, styled, with filters",
    icon: FileSpreadsheet,
    accent: "text-emerald-400",
  },
  {
    format: "csv",
    label: "CSV spreadsheet",
    hint: ".csv · Google Sheets / Excel / any TMS",
    icon: FileText,
    accent: "text-blue-400",
  },
  {
    format: "md",
    label: "Markdown document",
    hint: ".md · Jira / Confluence / GitHub-friendly",
    icon: FileCode,
    accent: "text-violet-400",
  },
  {
    format: "json",
    label: "Raw JSON",
    hint: ".json · for pipelines & scripts",
    icon: FileJson,
    accent: "text-amber-400",
  },
];

export function ExportMenu({ tool, data, variant = "ghost", label = "Export" }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [done, setDone] = useState<ExportFormat | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const hasData = data !== null && data !== undefined;
  const disabled = !hasData || !!busy;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  async function handleExport(format: ExportFormat) {
    if (busy || !hasData) return;
    setBusy(format);
    setDone(null);
    try {
      await exportResult(tool, format, data);
      setDone(format);
      setTimeout(() => setDone(null), 1500);
    } catch (err) {
      console.error("Export failed", err);
      const message = err instanceof Error ? err.message : String(err);
      if (typeof window !== "undefined") {
        window.alert(`Export failed: ${message}`);
      }
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  const trigger =
    variant === "primary" ? (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-primary"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={hasData ? "Export results" : "Export disabled — no data yet"}
        title={hasData ? "Export results" : "Run a tool to enable export"}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        <span>{busy ? "Exporting…" : label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={hasData ? "Export results" : "Export disabled — no data yet"}
        title={hasData ? "Export results" : "Run a tool to enable export"}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        <span className="text-xs">{busy ? "Exporting…" : label}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>
    );

  return (
    <div ref={wrapRef} className="relative">
      {trigger}
      {open && hasData && (
        <div
          role="menu"
          aria-label="Export format"
          className={cn(
            "absolute right-0 mt-2 w-72 z-40",
            "rounded-xl border border-border bg-bg-elevated shadow-2xl shadow-black/60",
            "backdrop-blur-xl animate-fade-in overflow-hidden"
          )}
        >
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-wider text-fg-faint font-semibold">
              Export results as…
            </p>
          </div>
          <ul className="pb-2">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isBusy = busy === opt.format;
              const isDone = done === opt.format;
              return (
                <li key={opt.format}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!!busy}
                    onClick={() => handleExport(opt.format)}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 text-left",
                      "hover:bg-bg-surface transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div className="w-8 h-8 shrink-0 rounded-md bg-bg-surface border border-border grid place-items-center">
                      {isBusy ? (
                        <Loader2 className={cn("w-4 h-4 animate-spin", opt.accent)} />
                      ) : isDone ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Icon className={cn("w-4 h-4", opt.accent)} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-fg">{opt.label}</div>
                      <div className="text-[11px] text-fg-faint mt-0.5">{opt.hint}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="px-3 py-2 border-t border-border bg-bg-surface/40">
            <p className="text-[10px] text-fg-faint">
              Files download instantly. Excel exports include styling, filters &amp; severity colors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
