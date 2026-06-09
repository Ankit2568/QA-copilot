"use client";

import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ToolForm } from "@/components/ToolForm";
import { EdgeCasesView } from "@/components/results/EdgeCasesView";
import type { EdgeCaseList } from "@/lib/schemas";
import { TOOLS } from "@/lib/tools";

const TOOL = TOOLS["edge-cases"];

const EXAMPLE = {
  user_story:
    "As a user, I want to upload a CSV of up to 10,000 contacts so I can import my mailing list.",
  max_cases: "15",
  focus_areas: "security, performance, i18n",
};

export function EdgeCasesForm() {
  return (
    <ToolForm
      apiPath={TOOL.apiPath}
      defaultValues={{ existing_test_cases: "", max_cases: "15", focus_areas: "" }}
      example={EXAMPLE}
      extraFields={(form, set) => (
        <>
          <div>
            <label htmlFor="existing-test-cases" className="label-base">
              Existing test cases (optional)
            </label>
            <textarea
              id="existing-test-cases"
              value={form.existing_test_cases ?? ""}
              onChange={(e) => set("existing_test_cases", e.target.value)}
              rows={3}
              placeholder="Used to de-duplicate. Leave blank to skip."
              className="input-base resize-y font-mono text-[13px]"
            />
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
                max={50}
                value={form.max_cases ?? "15"}
                onChange={(e) => set("max_cases", e.target.value)}
                aria-label="Maximum number of edge cases"
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
                placeholder="security, a11y"
                aria-label="Comma-separated focus areas"
                className="input-base"
              />
            </div>
          </div>
        </>
      )}
      buildBody={(form) => ({
        user_story: form.user_story,
        existing_test_cases: form.existing_test_cases || undefined,
        max_cases: form.max_cases ? Number(form.max_cases) : undefined,
        focus_areas: form.focus_areas
          ? form.focus_areas.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      })}
      renderResult={(result) => {
        if (result === "__loading__")
          return <LoadingState message="Generating edge cases…" />;
        if (!result)
          return (
            <EmptyState
              icon={Sparkles}
              title="No edge cases yet"
              description="Describe a feature and (optionally) the tests you already have. QA Copilot will surface up to 50 high-value edge cases ranked by severity."
            />
          );
        return <EdgeCasesView data={result as EdgeCaseList} />;
      }}
    />
  );
}
