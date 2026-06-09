import { BookOpen } from "lucide-react";

import { ModelPicker } from "@/components/ModelPicker";

export function Topbar({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {title && (
            <h1
              className="text-sm font-semibold text-fg truncate"
              aria-live="polite"
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-fg-muted truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModelPicker />
          <a
            href="https://ai.google.dev/gemini-api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            aria-label="Open Gemini API documentation"
            title="Gemini docs"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Docs</span>
          </a>
        </div>
      </div>
    </header>
  );
}
