"use client";

import { ChevronDown, Copy, Hash, Tag } from "lucide-react";
import { useMemo, useState } from "react";

import { ExportMenu } from "@/components/ExportMenu";
import type {
  TestCase,
  TestCasePriority,
  TestCaseSuite,
  TestCaseType,
} from "@/lib/schemas";
import { cn, copyToClipboard } from "@/lib/utils";

const PRIORITY_ORDER: Record<TestCasePriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

const TYPE_LABELS: Record<TestCaseType, string> = {
  functional: "Functional",
  negative: "Negative",
  edge: "Edge",
  security: "Security",
  performance: "Performance",
  usability: "Usability",
  accessibility: "A11y",
  i18n: "i18n",
  compatibility: "Compatibility",
};

export function TestCasesView({ data }: { data: TestCaseSuite }) {
  const [sortBy, setSortBy] = useState<"priority" | "type" | "id">("priority");
  const [typeFilter, setTypeFilter] = useState<TestCaseType | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TestCasePriority | null>(
    null
  );

  const types = useMemo(
    () => Array.from(new Set(data.test_cases.map((c) => c.type))) as TestCaseType[],
    [data.test_cases]
  );
  const priorities = useMemo(
    () =>
      Array.from(new Set(data.test_cases.map((c) => c.priority))).sort(
        (a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b]
      ) as TestCasePriority[],
    [data.test_cases]
  );

  const filtered = data.test_cases.filter(
    (c) =>
      (!typeFilter || c.type === typeFilter) &&
      (!priorityFilter || c.priority === priorityFilter)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "priority")
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sortBy === "type") return a.type.localeCompare(b.type);
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="space-y-5">
      {/* Header summary */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-fg-faint font-semibold mb-1">
              Feature
            </p>
            <h2 className="text-base font-semibold text-fg truncate">
              {data.feature}
            </h2>
          </div>
          <span className="chip bg-rose-500/10 text-rose-400 border-rose-500/30 shrink-0">
            <Hash className="w-3 h-3" />
            {data.test_cases.length} cases
          </span>
        </div>
        <p className="text-sm text-fg-muted leading-relaxed">{data.summary}</p>

        {/* Quick counts by priority */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {(["P0", "P1", "P2", "P3"] as TestCasePriority[]).map((p) => {
            const count = data.test_cases.filter((c) => c.priority === p).length;
            return (
              <div
                key={p}
                className="rounded-lg bg-bg-elevated/60 border border-border p-3 text-center"
              >
                <PriorityBadge priority={p} className="mx-auto" />
                <div className="mt-1.5 text-xs text-fg-muted">
                  <span className="tabular-nums font-mono text-fg">{count}</span>{" "}
                  case{count === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-fg-faint px-2">
          {sorted.length} of {data.test_cases.length}
        </span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <SortButton current={sortBy} value="priority" set={setSortBy} label="Priority" />
          <SortButton current={sortBy} value="type" set={setSortBy} label="Type" />
          <SortButton current={sortBy} value="id" set={setSortBy} label="ID" />
          <div className="w-px h-5 bg-border mx-1" />
          <ExportMenu tool="test-cases" data={data} />
        </div>
      </div>

      {/* Filter chips */}
      <div className="space-y-2">
        {types.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-fg-faint font-semibold pr-1">
              Type
            </span>
            <FilterChip
              label="All"
              active={!typeFilter}
              onClick={() => setTypeFilter(null)}
              count={data.test_cases.length}
            />
            {types.map((t) => (
              <FilterChip
                key={t}
                label={TYPE_LABELS[t]}
                active={typeFilter === t}
                onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                count={data.test_cases.filter((c) => c.type === t).length}
              />
            ))}
          </div>
        )}
        {priorities.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-fg-faint font-semibold pr-1">
              Priority
            </span>
            <FilterChip
              label="All"
              active={!priorityFilter}
              onClick={() => setPriorityFilter(null)}
              count={data.test_cases.length}
            />
            {priorities.map((p) => (
              <FilterChip
                key={p}
                label={p}
                active={priorityFilter === p}
                onClick={() =>
                  setPriorityFilter(priorityFilter === p ? null : p)
                }
                count={data.test_cases.filter((c) => c.priority === p).length}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {sorted.map((tc) => (
          <TestCaseCard key={tc.id} tc={tc} />
        ))}
      </div>

      {/* Coverage notes */}
      {data.coverage_notes?.length ? (
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wider text-fg-muted font-semibold mb-3">
            Coverage notes
          </h3>
          <ul className="space-y-1.5">
            {data.coverage_notes.map((n, i) => (
              <li key={i} className="text-sm text-fg-muted flex gap-2">
                <span className="text-fg-faint">·</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TestCaseCard({ tc }: { tc: TestCase }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const block = [
      `${tc.id}: ${tc.title}`,
      `Type: ${tc.type} | Priority: ${tc.priority}`,
      ...(tc.preconditions?.length
        ? ["Preconditions:", ...tc.preconditions.map((p) => `- ${p}`)]
        : []),
      "Steps:",
      ...tc.steps.map((s, i) => `${i + 1}. ${s}`),
      ...(tc.test_data ? [`Test data: ${tc.test_data}`] : []),
      `Expected: ${tc.expected_result}`,
      ...(tc.tags?.length ? [`Tags: ${tc.tags.join(", ")}`] : []),
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
              {tc.id}
            </span>
            <h4 className="text-sm font-semibold text-fg">{tc.title}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={tc.priority} />
            <span className="chip bg-bg-elevated text-fg-muted border-border">
              <Tag className="w-3 h-3" />
              {TYPE_LABELS[tc.type]}
            </span>
            {tc.tags?.map((t) => (
              <span
                key={t}
                className="chip bg-bg-elevated/50 text-fg-faint border-border text-[10px]"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pl-11 border-t border-border bg-bg-subtle/40 animate-slide-up">
          {tc.preconditions?.length ? (
            <div className="mt-4">
              <h5 className="label-base">Preconditions</h5>
              <ul className="space-y-1">
                {tc.preconditions.map((p, i) => (
                  <li key={i} className="text-xs text-fg-muted flex gap-2">
                    <span className="text-fg-faint">·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-4">
            <h5 className="label-base">Steps</h5>
            <ol className="space-y-1.5">
              {tc.steps.map((s, i) => (
                <li key={i} className="text-xs text-fg-muted flex gap-2.5">
                  <span className="font-mono text-fg-faint shrink-0">
                    {i + 1}.
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <h5 className="label-base">Expected result</h5>
              <p className="text-xs text-fg-muted">{tc.expected_result}</p>
            </div>
            {tc.test_data ? (
              <div>
                <h5 className="label-base">Test data</h5>
                <p className="text-xs text-fg-muted font-mono break-words">
                  {tc.test_data}
                </p>
              </div>
            ) : null}
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

function PriorityBadge({
  priority,
  className,
}: {
  priority: TestCasePriority;
  className?: string;
}) {
  const map: Record<TestCasePriority, string> = {
    P0: "bg-red-500/15 text-red-400 border-red-500/40",
    P1: "bg-orange-500/15 text-orange-400 border-orange-500/40",
    P2: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
    P3: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  };
  return (
    <span
      className={cn(
        "chip font-mono",
        map[priority],
        className
      )}
    >
      {priority}
    </span>
  );
}

function SortButton({
  current,
  value,
  set,
  label,
}: {
  current: string;
  value: "priority" | "type" | "id";
  set: (v: "priority" | "type" | "id") => void;
  label: string;
}) {
  return (
    <button
      onClick={() => set(value)}
      className={cn("btn-ghost", current === value && "bg-bg-elevated text-fg")}
    >
      <span className="text-xs">{label}</span>
    </button>
  );
}

function FilterChip({
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
          ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
          : "bg-bg-elevated text-fg-muted border-border hover:border-border-strong"
      )}
    >
      {label}
      <span className="text-fg-faint">{count}</span>
    </button>
  );
}
