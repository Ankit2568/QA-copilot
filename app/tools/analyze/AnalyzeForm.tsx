"use client";

import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ToolForm } from "@/components/ToolForm";
import { CoverageReportView } from "@/components/results/CoverageReportView";
import type { TestCoverageReport } from "@/lib/schemas";
import { TOOLS } from "@/lib/tools";

const TOOL = TOOLS["analyze"];

const EXAMPLE = {
  user_story:
    "As a returning customer, I want to log in with my email and password so I can access my account dashboard.",
  existing_test_cases: [
    "TC-1: User logs in with valid credentials and lands on /dashboard.",
    "TC-2: User enters wrong password and sees an error message.",
    "TC-3: User clicks 'forgot password' and receives a reset email.",
  ].join("\n"),
};

export function AnalyzeForm() {
  return (
    <ToolForm
      apiPath={TOOL.apiPath}
      defaultValues={{ existing_test_cases: "" }}
      example={EXAMPLE}
      extraFields={(form, set) => (
        <div>
          <label htmlFor="existing-test-cases" className="label-base">
            Existing test cases
          </label>
          <textarea
            id="existing-test-cases"
            value={form.existing_test_cases ?? ""}
            onChange={(e) => set("existing_test_cases", e.target.value)}
            rows={6}
            required
            aria-required="true"
            placeholder="TC-1: ...&#10;TC-2: ...&#10;Any format (numbered list, Gherkin, table…)"
            className="input-base resize-y font-mono text-[13px]"
          />
        </div>
      )}
      buildBody={(form) => ({
        user_story: form.user_story,
        existing_test_cases: form.existing_test_cases,
      })}
      renderResult={(result) => {
        if (result === "__loading__") return <LoadingState message="Analyzing coverage…" />;
        if (!result)
          return (
            <EmptyState
              icon={BarChart3}
              title="No analysis yet"
              description="Paste a user story and your existing test cases, then click Run to get a coverage score, missing scenarios, risks, and recommendations."
            />
          );
        return <CoverageReportView data={result as TestCoverageReport} />;
      }}
    />
  );
}
