"use client";

import { Clock, Compass, Eye, ListChecks, User } from "lucide-react";
import { ExportMenu } from "@/components/ExportMenu";
import type { ExploratoryChecklist } from "@/lib/schemas";

export function ExploratoryView({ data }: { data: ExploratoryChecklist }) {
  return (
    <div className="space-y-5">
      <div className="card p-5 flex items-start justify-between gap-3">
        <div>
          {data.persona && (
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="chip bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <User className="w-3 h-3" />
                Persona
              </span>
              <span className="text-fg-muted">{data.persona}</span>
            </div>
          )}
          <h2 className="text-base font-semibold text-fg">
            {data.charters.length} testing charters · {data.checklist.length} areas · {data.oracles.length} oracles
          </h2>
          <p className="text-xs text-fg-muted mt-1">
            Session-based exploratory plan in the Rapid Software Testing style.
          </p>
        </div>
        <ExportMenu tool="exploratory" data={data} />
      </div>

      {/* Charters */}
      <Section icon={<Compass className="w-4 h-4 text-emerald-400" />} title="Testing charters">
        <div className="grid sm:grid-cols-2 gap-3">
          {data.charters.map((c, i) => (
            <div key={i} className="card-elevated p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-fg">{c.title}</h4>
                <span className="chip bg-bg-surface text-fg-muted border-border whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {c.time_box_minutes} min
                </span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed mb-3">{c.objective}</p>
              <div className="space-y-2 text-xs">
                <Field label="Areas">
                  <div className="flex flex-wrap gap-1">
                    {c.areas_to_explore.map((a, j) => (
                      <span key={j} className="chip bg-bg-surface text-fg-muted border-border">
                        {a}
                      </span>
                    ))}
                  </div>
                </Field>
                <Field label="Heuristics">
                  <div className="flex flex-wrap gap-1">
                    {c.heuristics.map((h, j) => (
                      <span
                        key={j}
                        className="chip bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Checklist */}
      <Section icon={<ListChecks className="w-4 h-4 text-blue-400" />} title="Per-area checklist">
        <div className="grid sm:grid-cols-2 gap-3">
          {data.checklist.map((c, i) => (
            <div key={i} className="card-elevated p-4">
              <h4 className="text-xs uppercase tracking-wider text-fg-faint font-semibold mb-2">
                {c.area}
              </h4>
              <ul className="space-y-1.5">
                {c.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-xs text-fg-muted">
                    <span className="mt-1 w-3 h-3 rounded border border-border bg-bg-surface shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Oracles */}
      <Section icon={<Eye className="w-4 h-4 text-violet-400" />} title="Bug-recognition oracles">
        <div className="card-elevated p-4">
          <ul className="space-y-2">
            {data.oracles.map((o, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-fg-muted">
                <Eye className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-fg-faint font-semibold mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
