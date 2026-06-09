"use client";

import { Compass } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ToolForm } from "@/components/ToolForm";
import { ExploratoryView } from "@/components/results/ExploratoryView";
import type { ExploratoryChecklist } from "@/lib/schemas";
import { TOOLS } from "@/lib/tools";

const TOOL = TOOLS["exploratory"];

const EXAMPLE = {
  user_story:
    "As a buyer, I want to checkout with multiple payment methods (card, UPI, wallet) so I can pay however I prefer.",
  persona: "non-technical first-time buyer on a flaky 3G connection",
  focus_areas: "mobile, errors",
};

export function ExploratoryForm() {
  return (
    <ToolForm
      apiPath={TOOL.apiPath}
      defaultValues={{ persona: "", focus_areas: "" }}
      example={EXAMPLE}
      extraFields={(form, set) => (
        <>
          <div>
            <label htmlFor="persona" className="label-base">
              Persona (optional)
            </label>
            <input
              id="persona"
              type="text"
              value={form.persona ?? ""}
              onChange={(e) => set("persona", e.target.value)}
              placeholder="e.g. screen-reader user, malicious actor"
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
              placeholder="mobile, errors, performance"
              aria-label="Comma-separated focus areas"
              className="input-base"
            />
          </div>
        </>
      )}
      buildBody={(form) => ({
        user_story: form.user_story,
        persona: form.persona || undefined,
        focus_areas: form.focus_areas
          ? form.focus_areas.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      })}
      renderResult={(result) => {
        if (result === "__loading__")
          return <LoadingState message="Building exploratory plan…" />;
        if (!result)
          return (
            <EmptyState
              icon={Compass}
              title="No plan yet"
              description="QA Copilot will produce time-boxed testing charters, a per-area checklist, and bug-recognition oracles inspired by Rapid Software Testing."
            />
          );
        return <ExploratoryView data={result as ExploratoryChecklist} />;
      }}
    />
  );
}
