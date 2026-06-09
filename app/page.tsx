import Link from "next/link";
import { ArrowRight, Activity, Sparkles, Zap } from "lucide-react";

import { Topbar } from "@/components/Topbar";
import { TOOL_LIST, colorClasses } from "@/lib/tools";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" subtitle="Pick a tool to begin" />
      <main className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-bg-surface p-8 lg:p-12 mb-8">
          <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 chip bg-accent/10 text-accent border-accent/30 mb-4">
              <Sparkles className="w-3 h-3" />
              Powered by Gemini · Strict JSON · Zod validated
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-fg leading-tight">
              Your senior QA engineer,
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                on demand.
              </span>
            </h1>
            <p className="mt-4 text-base lg:text-lg text-fg-muted max-w-2xl leading-relaxed">
              Turn a plain-English user story into coverage reports, edge cases,
              exploratory checklists, and runnable Playwright scripts in seconds.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/tools/analyze" className="btn-primary">
                <Zap className="w-4 h-4" />
                Try a tool
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/tools/playwright" className="btn-secondary">
                Generate a Playwright spec
              </Link>
            </div>
          </div>
        </section>

        {/* Tools grid */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-4">
            Tools
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {TOOL_LIST.map((t) => {
              const c = colorClasses(t.color);
              const Icon = t.icon;
              return (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border bg-bg-surface p-6",
                    "transition-all duration-200 hover:border-border-strong hover:-translate-y-0.5",
                    c.glow
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", c.gradient)} />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl grid place-items-center border",
                          c.bg,
                          c.border
                        )}
                      >
                        <Icon className={cn("w-5 h-5", c.text)} />
                      </div>
                      <ArrowRight
                        className={cn(
                          "w-5 h-5 text-fg-faint transition-all",
                          "group-hover:text-fg group-hover:translate-x-0.5"
                        )}
                      />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-fg">{t.name}</h3>
                    <p className="mt-1 text-sm text-fg-muted">{t.tagline}</p>
                    <p className="mt-3 text-xs text-fg-faint leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="card p-6 lg:p-8 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider">
              How it works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Step
              n={1}
              title="Paste a user story"
              body="Free-form text or Gherkin. Optionally add existing test cases, focus areas, or a target URL."
            />
            <Step
              n={2}
              title="Pick a model, run the tool"
              body="Switch Gemini models from the top bar. Server pins a senior-QA system prompt and uses JSON mode."
            />
            <Step
              n={3}
              title="Get a real artifact"
              body="Coverage scored 0-100, severity-ranked gaps, time-boxed charters, or a runnable .spec.ts file. Validated against a Zod schema before render."
            />
          </div>
        </section>
      </main>
    </>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div>
      <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border text-accent font-mono text-sm grid place-items-center mb-3">
        {n}
      </div>
      <h3 className="text-sm font-semibold text-fg mb-1">{title}</h3>
      <p className="text-xs text-fg-muted leading-relaxed">{body}</p>
    </div>
  );
}
