"use client";

import { FileCode2, PackageOpen, Play, StickyNote } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { ExportMenu } from "@/components/ExportMenu";
import type { PlaywrightScript } from "@/lib/schemas";

export function PlaywrightView({ data }: { data: PlaywrightScript }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 grid place-items-center shrink-0">
          <FileCode2 className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="chip bg-amber-500/10 text-amber-400 border-amber-500/30">
              {data.language}
            </span>
            <span className="chip bg-bg-elevated text-fg-muted border-border">
              @playwright/test
            </span>
          </div>
          <h2 className="mt-2 text-base font-mono font-semibold text-fg break-all">
            {data.filename}
          </h2>
        </div>
        <div className="shrink-0">
          <ExportMenu tool="playwright" data={data} label="Export report" />
        </div>
      </div>

      {/* Code */}
      <CodeBlock code={data.code} language={data.language} filename={data.filename} />

      {/* Commands */}
      <div className="grid md:grid-cols-2 gap-4">
        <CommandPanel
          icon={<PackageOpen className="w-4 h-4 text-blue-400" />}
          title="Install"
          commands={data.install_commands}
        />
        <CommandPanel
          icon={<Play className="w-4 h-4 text-emerald-400" />}
          title="Run"
          commands={data.run_commands}
        />
      </div>

      {/* Notes */}
      {data.notes && data.notes.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-fg">Notes</h3>
          </div>
          <ul className="space-y-1.5">
            {data.notes.map((n, i) => (
              <li key={i} className="text-xs text-fg-muted flex gap-2">
                <span className="text-fg-faint">·</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CommandPanel({
  icon,
  title,
  commands,
}: {
  icon: React.ReactNode;
  title: string;
  commands: string[];
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
      </div>
      <div className="space-y-1.5">
        {commands.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-elevated border border-border font-mono text-xs text-fg"
          >
            <span className="text-fg-faint shrink-0">$</span>
            <code className="overflow-x-auto whitespace-nowrap">{c}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
