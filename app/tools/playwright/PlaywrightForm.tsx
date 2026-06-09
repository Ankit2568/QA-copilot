"use client";

import { TestTube2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ToolForm } from "@/components/ToolForm";
import { PlaywrightView } from "@/components/results/PlaywrightView";
import type { PlaywrightScript } from "@/lib/schemas";
import { TOOLS } from "@/lib/tools";

const TOOL = TOOLS["playwright"];

const EXAMPLE = {
  user_story:
    "As a new user, I want to sign up with email and OTP so I can access the dashboard.",
  target_url: "https://example.com/signup",
  language: "typescript",
  scenarios: "happy path, wrong OTP, OTP expired",
};

export function PlaywrightForm() {
  return (
    <ToolForm
      apiPath={TOOL.apiPath}
      defaultValues={{
        target_url: "",
        language: "typescript",
        scenarios: "",
        existing_test_cases: "",
      }}
      example={EXAMPLE}
      extraFields={(form, set) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
            <div>
              <label htmlFor="target-url" className="label-base">
                Target URL (optional)
              </label>
              <input
                id="target-url"
                type="url"
                value={form.target_url ?? ""}
                onChange={(e) => set("target_url", e.target.value)}
                placeholder="https://staging.example.com/signup"
                aria-label="Target URL for the generated Playwright script"
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="language" className="label-base">
                Language
              </label>
              <select
                id="language"
                value={form.language ?? "typescript"}
                onChange={(e) => set("language", e.target.value)}
                aria-label="Output language"
                className="input-base"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="scenarios" className="label-base">
              Required scenarios (optional)
            </label>
            <input
              id="scenarios"
              type="text"
              value={form.scenarios ?? ""}
              onChange={(e) => set("scenarios", e.target.value)}
              placeholder="happy path, wrong OTP, expired OTP"
              aria-label="Comma-separated scenario list"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="existing-test-cases" className="label-base">
              Existing tests (optional)
            </label>
            <textarea
              id="existing-test-cases"
              value={form.existing_test_cases ?? ""}
              onChange={(e) => set("existing_test_cases", e.target.value)}
              rows={3}
              placeholder="Used as context, not blindly duplicated."
              className="input-base resize-y font-mono text-[13px]"
            />
          </div>
        </>
      )}
      buildBody={(form) => ({
        user_story: form.user_story,
        target_url: form.target_url || undefined,
        language: (form.language || "typescript") as "typescript" | "javascript",
        scenarios: form.scenarios
          ? form.scenarios.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        existing_test_cases: form.existing_test_cases || undefined,
      })}
      renderResult={(result) => {
        if (result === "__loading__")
          return <LoadingState message="Generating Playwright spec…" />;
        if (!result)
          return (
            <EmptyState
              icon={TestTube2}
              title="No script yet"
              description="QA Copilot will produce a complete .spec.ts file (web-first locators, auto-waiting assertions, happy + negative paths) plus install and run commands."
            />
          );
        return <PlaywrightView data={result as PlaywrightScript} />;
      }}
    />
  );
}
