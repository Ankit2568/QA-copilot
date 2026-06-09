"use client";

import { AlertOctagon, CheckCircle2, ListChecks, ShieldAlert } from "lucide-react";
import { ExportMenu } from "@/components/ExportMenu";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { TestCoverageReport } from "@/lib/schemas";

export function CoverageReportView({ data }: { data: TestCoverageReport }) {
  return (
    <div className="space-y-5">
      {/* Hero: score + summary */}
      <div className="card p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="shrink-0">
          <ScoreRing score={Math.round(data.coverage_score)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-base font-semibold text-fg">Executive summary</h2>
            <ExportMenu tool="analyze" data={data} />
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">{data.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Stat label="Covered" value={data.covered_scenarios.length} tone="emerald" />
            <Stat label="Missing" value={data.missing_scenarios.length} tone="orange" />
            <Stat label="Risks" value={data.risks.length} tone="red" />
            <Stat label="Recos" value={data.recommendations.length} tone="violet" />
          </div>
        </div>
      </div>

      {/* Missing scenarios — most important section, leads */}
      <Section
        icon={<AlertOctagon className="w-4 h-4 text-orange-400" />}
        title={`Missing scenarios (${data.missing_scenarios.length})`}
      >
        <div className="space-y-3">
          {data.missing_scenarios.map((m, i) => (
            <div key={i} className="card-elevated p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-fg">{m.scenario}</h4>
                <SeverityBadge severity={m.severity} />
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">{m.rationale}</p>
              {m.suggested_test_steps && m.suggested_test_steps.length > 0 && (
                <ol className="mt-3 space-y-1.5 text-xs text-fg-muted list-decimal list-inside marker:text-fg-faint">
                  {m.suggested_test_steps.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
          {data.missing_scenarios.length === 0 && (
            <p className="text-sm text-fg-muted">No missing scenarios detected.</p>
          )}
        </div>
      </Section>

      {/* Risks */}
      <Section
        icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
        title={`Risks (${data.risks.length})`}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {data.risks.map((r, i) => (
            <div key={i} className="card-elevated p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-fg-faint">
                  {r.area}
                </span>
                <SeverityBadge severity={r.severity} />
              </div>
              <p className="text-sm text-fg-muted">{r.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Recommendations */}
      <Section
        icon={<ListChecks className="w-4 h-4 text-violet-400" />}
        title="Recommendations"
      >
        <ul className="space-y-2">
          {data.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-fg-muted">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Covered scenarios — collapsible-feel section last */}
      <Section
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        title={`Already covered (${data.covered_scenarios.length})`}
      >
        <div className="space-y-2">
          {data.covered_scenarios.map((c, i) => (
            <div key={i} className="card-elevated p-3 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-fg">{c.scenario}</p>
                <p className="text-xs text-fg-faint mt-0.5">Evidence: {c.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "orange" | "red" | "violet";
}) {
  const map = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  };
  return (
    <span className={`chip ${map[tone]}`}>
      <span className="tabular-nums font-bold">{value}</span>
      <span className="text-fg-muted">{label}</span>
    </span>
  );
}
