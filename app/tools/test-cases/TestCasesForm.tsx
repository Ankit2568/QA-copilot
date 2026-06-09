"use client";

import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ToolForm } from "@/components/ToolForm";
import { TestCasesView } from "@/components/results/TestCasesView";
import type { TestCaseSuite, TestCaseType } from "@/lib/schemas";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

const TOOL = TOOLS["test-cases"];

const ALL_TYPES: TestCaseType[] = [
  "functional",
  "negative",
  "edge",
  "security",
  "performance",
  "usability",
  "accessibility",
  "i18n",
  "compatibility",
];

const TYPE_LABELS: Record<TestCaseType, string> = {
  functional: "Functional",
  negative: "Negative",
  edge: "Edge",
  security: "Security",
  performance: "Performance",
  usability: "Usability",
  accessibility: "A11y",
  i18n: "i18n",
  compatibility: "Compat.",
};

const EXAMPLE = {
  user_story:
    "As a buyer, I want to checkout with multiple payment methods (card, UPI, wallet) so I can pay however I prefer. The flow includes address selection, payment, OTP verification, and order confirmation.",
  max_cases: "25",
  focus_areas: "mobile, network errors, payment failures",
  types: "functional,negative,edge,security",
};

export function TestCasesForm() {
  return (
    <ToolForm
      apiPath={TOOL.apiPath}
      defaultValues={{
        existing_test_cases: "",
        max_cases: "25",
        focus_areas: "",
        types: "",
      }}
      example={EXAMPLE}
      extraFields={(form, set) => {
        const selectedTypes = (form.types || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean) as TestCaseType[];

        function toggleType(t: TestCaseType) {
          const has = selectedTypes.includes(t);
          const next = has
            ? selectedTypes.filter((x) => x !== t)
            : [...selectedTypes, t];
          set("types", next.join(","));
        }

        return (
          <>
            <div>
              <label className="label-base">Test types</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((t) => {
                  const active = selectedTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      aria-pressed={active}
                      className={cn(
                        "chip transition-colors",
                        active
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                          : "bg-bg-elevated text-fg-muted border-border hover:border-border-strong"
                      )}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-fg-faint mt-1.5">
                Leave all unselected to let Gemini pick the relevant mix.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="max-cases" className="label-base">
                  Max cases
                </label>
                <input
                  id="max-cases"
                  type="number"
                  min={1}
                  max={100}
                  value={form.max_cases ?? "25"}
                  onChange={(e) => set("max_cases", e.target.value)}
                  aria-label="Maximum number of test cases"
                  className="input-base"
                />
              </div>
              <div>
                <label htmlFor="focus-areas" className="label-base">
                  Focus areas
                </label>
                <input
                  id="focus-areas"
                  type="text"
                  value={form.focus_areas ?? ""}
                  onChange={(e) => set("focus_areas", e.target.value)}
                  placeholder="mobile, a11y"
                  aria-label="Comma-separated focus areas"
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor="existing-test-cases" className="label-base">
                Existing test cases (optional)
              </label>
              <textarea
                id="existing-test-cases"
                value={form.existing_test_cases ?? ""}
                onChange={(e) => set("existing_test_cases", e.target.value)}
                rows={3}
                placeholder="Used as context. Gemini will fill gaps and avoid duplicates."
                className="input-base resize-y font-mono text-[13px]"
              />
            </div>
          </>
        );
      }}
      buildBody={(form) => {
        const types = (form.types || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean) as TestCaseType[];
        return {
          user_story: form.user_story,
          existing_test_cases: form.existing_test_cases || undefined,
          max_cases: form.max_cases ? Number(form.max_cases) : undefined,
          types: types.length ? types : undefined,
          focus_areas: form.focus_areas
            ? form.focus_areas
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        };
      }}
      renderResult={(result) => {
        if (result === "__loading__")
          return <LoadingState message="Generating test suite…" />;
        if (!result)
          return (
            <EmptyState
              icon={ListChecks}
              title="No test cases yet"
              description="Describe a feature and Gemini will produce a complete, prioritized test suite — functional, negative, edge, and non-functional cases — ready to export as Excel/CSV for your TMS."
            />
          );
        return <TestCasesView data={result as TestCaseSuite} />;
      }}
    />
  );
}
