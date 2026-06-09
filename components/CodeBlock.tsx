"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { copyToClipboard, downloadText } from "@/lib/utils";

export function CodeBlock({
  code,
  language = "typescript",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  function handleDownload() {
    if (!filename) return;
    downloadText(filename, code, "text/plain");
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-elevated/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          {filename && (
            <span className="ml-2 font-mono text-xs text-fg-muted truncate">
              {filename}
            </span>
          )}
          <span className="ml-auto md:ml-3 chip bg-bg-surface text-fg-muted border-border">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {filename && (
            <button
              onClick={handleDownload}
              className="btn-ghost"
              aria-label="Download file"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="btn-ghost"
            aria-label="Copy code"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto text-xs font-mono leading-relaxed p-4 max-h-[60vh]">
        <code className="text-fg whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
