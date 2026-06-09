"use client";

import { ChevronDown, Copy, Tag } from "lucide-react";
import { useState } from "react";
import { ExportMenu } from "@/components/ExportMenu";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { EdgeCaseList, Severity } from "@/lib/schemas";
import { cn, copyToClipboard } from "@/lib/utils";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function EdgeCasesView({ data }: { data: EdgeCaseList }) {
  const [sortBy, setSortBy] = useState<"severity" | "category">("severity");
  const [filter, setFilter] = useState<string | null>(null);

  const categories = Array.from(new Set(data.edge_cases.map((e) => e.category)));

  const filtered = filter
    ? data.edge_cases.filter((e) => e.category === filter)
    : data.edge_cases;

  const sorted = [...filtered].sort((a, b) =>
    sortBy === "severity"
      ? SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      : a.category.localeCompare(b.category)
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-fg-faint px-2">
          {sorted.length} of {data.edge_cases.length} edge cases
        </span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <SortButton current={sortBy} value="severity" set={setSortBy} label="Severity" />
          <SortButton current={sortBy} value="category" set={setSortBy} label="Category" />
          <div className="w-px h-5 bg-border mx-1" />
          <ExportMenu tool="edge-cases" data={data} />
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip
            label="All"
            active={!filter}
            onClick={() => setFilter(null)}
            count={data.edge_cases.length}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              active={filter === c}
              onClick={() => setFilter(c)}
              count={data.edge_cases.filter((e) => e.category === c).length}
            />
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {sorted.map((ec) => (
          <EdgeCaseCard key={ec.id} ec={ec} />
        ))}
      </div>
    </div>
  );
}

function EdgeCaseCard({ ec }: { ec: EdgeCaseList["edge_cases"][number] }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const block = [
      `${ec.id}: ${ec.title}`,
      `Severity: ${ec.severity} | Category: ${ec.category}`,
      ...(ec.preconditions?.length ? ["Preconditions:", ...ec.preconditions.map((p) => `- ${p}`)] : []),
      "Steps:",
      ...ec.steps.map((s, i) => `${i + 1}. ${s}`),
      `Expected: ${ec.expected_result}`,
      `Rationale: ${ec.rationale}`,
    ].join("\n");
    if (await copyToClipboard(block)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-bg-elevated/40 transition-colors"
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 mt-1 text-fg-faint shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 mb-1.5">
            <span className="font-mono text-[10px] text-fg-faint bg-bg-elevated border border-border rounded px-1.5 py-0.5 shrink-0 mt-0.5">
              {ec.id}
            </span>
            <h4 className="text-sm font-semibold text-fg">{ec.title}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={ec.severity} />
            <span className="chip bg-bg-elevated text-fg-muted border-border">
              <Tag className="w-3 h-3" />
              {ec.category}
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pl-11 border-t border-border bg-bg-subtle/40 animate-slide-up">
          {ec.preconditions && ec.preconditions.length > 0 && (
            <div className="mt-4">
              <h5 className="label-base">Preconditions</h5>
              <ul className="space-y-1">
                {ec.preconditions.map((p, i) => (
                  <li key={i} className="text-xs text-fg-muted flex gap-2">
                    <span className="text-fg-faint">·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4">
            <h5 className="label-base">Steps</h5>
            <ol className="space-y-1.5">
              {ec.steps.map((s, i) => (
                <li key={i} className="text-xs text-fg-muted flex gap-2.5">
                  <span className="font-mono text-fg-faint shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <h5 className="label-base">Expected result</h5>
              <p className="text-xs text-fg-muted">{ec.expected_result}</p>
            </div>
            <div>
              <h5 className="label-base">Rationale</h5>
              <p className="text-xs text-fg-muted">{ec.rationale}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={copyAll} className="btn-ghost">
              <Copy className="w-3 h-3" />
              <span className="text-xs">{copied ? "Copied" : "Copy as text"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortButton({
  current,
  value,
  set,
  label,
}: {
  current: string;
  value: "severity" | "category";
  set: (v: "severity" | "category") => void;
  label: string;
}) {
  return (
    <button
      onClick={() => set(value)}
      className={cn(
        "btn-ghost",
        current === value && "bg-bg-elevated text-fg"
      )}
    >
      <span className="text-xs">{label}</span>
    </button>
  );
}

function CategoryChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "chip transition-colors",
        active
          ? "bg-accent/15 text-accent-hover border-accent/40"
          : "bg-bg-elevated text-fg-muted border-border hover:border-border-strong"
      )}
    >
      {label}
      <span className="text-fg-faint">{count}</span>
    </button>
  );
}
