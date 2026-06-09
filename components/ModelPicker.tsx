"use client";

import { ChevronDown, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DEFAULT_MODEL_ID, MODELS, isKnownModel } from "@/lib/models";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "qa-copilot:model";
/** Custom DOM event so all model-aware components on the page can re-render in sync. */
const CHANGE_EVENT = "qa-copilot:model-change";

/**
 * Reads the user's current model choice and subscribes to changes.
 *
 * Returns the canonical DEFAULT_MODEL_ID during SSR / first client paint to
 * keep markup deterministic; it then upgrades to the persisted value (if any)
 * after mount. Listens for our custom CHANGE_EVENT and the browser's native
 * `storage` event so changes made in another tab also propagate.
 */
export function useSelectedModel(): string {
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);

  useEffect(() => {
    const stored = readStoredModel();
    if (stored && stored !== model) setModel(stored);

    function onChange() {
      const next = readStoredModel() ?? DEFAULT_MODEL_ID;
      setModel(next);
    }
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) onChange();
    });
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return model;
}

/** Non-hook getter for use at form-submit time. Safe in both SSR & client. */
export function getSelectedModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL_ID;
  return readStoredModel() ?? DEFAULT_MODEL_ID;
}

function readStoredModel(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return isKnownModel(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredModel(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* localStorage blocked / private mode — fall through silently */
  }
}

/**
 * Dropdown that lets the user pick which Gemini model the next API call will
 * use. Renders inert markup during SSR, hydrates with the persisted choice.
 */
export function ModelPicker({ className }: { className?: string }) {
  const current = useSelectedModel();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const currentInfo = MODELS.find((m) => m.id === current) ?? MODELS[0];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Model: ${currentInfo.label}. Click to change.`}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "bg-bg-elevated border border-border text-fg-muted text-xs",
          "hover:border-border-strong hover:text-fg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
          open && "border-accent text-fg"
        )}
      >
        <Cpu className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
        <span className="font-mono text-fg">{currentInfo.label}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Gemini model"
          className={cn(
            "absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)]",
            "rounded-xl border border-border bg-bg-surface shadow-card",
            "p-1.5 animate-fade-in"
          )}
        >
          {MODELS.map((m) => {
            const active = m.id === current;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  writeStoredModel(m.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                  "flex flex-col gap-0.5",
                  active
                    ? "bg-accent-subtle"
                    : "hover:bg-bg-elevated/80"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg font-mono">
                    {m.label}
                  </span>
                  {m.tier === "default" && (
                    <span className="text-[10px] uppercase tracking-wider text-accent">
                      Recommended
                    </span>
                  )}
                  {active && m.tier !== "default" && (
                    <span className="text-[10px] uppercase tracking-wider text-accent">
                      Selected
                    </span>
                  )}
                </div>
                <span className="text-xs text-fg-muted">{m.description}</span>
              </button>
            );
          })}
          <div className="border-t border-border mt-1.5 pt-1.5 px-3 py-1.5 text-[10px] text-fg-faint">
            Choice persists in this browser. Applies to your next run.
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact non-interactive badge showing the current model (for the sidebar). */
export function ModelBadge() {
  const current = useSelectedModel();
  const info = MODELS.find((m) => m.id === current) ?? MODELS[0];
  return (
    <div className="px-3 py-2.5 rounded-lg bg-bg-elevated/50 border border-border">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-fg-muted">
          Model:{" "}
          <span className="font-mono text-fg">{info.label}</span>
        </span>
      </div>
    </div>
  );
}
