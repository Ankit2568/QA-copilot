"use client";

import { Play, RotateCcw } from "lucide-react";
import { useState, type ReactNode, type FormEvent } from "react";

import { getSelectedModel } from "@/components/ModelPicker";
import { cn } from "@/lib/utils";

interface Props {
  apiPath: string;
  defaultValues?: Record<string, string>;
  /** Render-prop for extra form fields beyond user_story. */
  extraFields?: (form: Record<string, string>, set: (k: string, v: string) => void) => ReactNode;
  /** Build the JSON body sent to the API. */
  buildBody: (form: Record<string, string>) => Record<string, unknown>;
  /** Render the successful result. */
  renderResult: (result: unknown) => ReactNode;
  /** Optional example to prefill. */
  example?: { user_story: string; [k: string]: string };
}

export function ToolForm({
  apiPath,
  defaultValues = {},
  extraFields,
  buildBody,
  renderResult,
  example,
}: Props) {
  const [form, setForm] = useState<Record<string, string>>({
    user_story: "",
    ...defaultValues,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body = { ...buildBody(form), model: getSelectedModel() };
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function loadExample() {
    if (example) setForm({ ...defaultValues, ...example });
  }

  function reset() {
    setForm({ user_story: "", ...defaultValues });
    setResult(null);
    setError(null);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="card p-5 xl:sticky xl:top-20 space-y-4"
        aria-busy={loading}
        noValidate
      >
        <div>
          <label htmlFor="user-story" className="label-base flex items-center justify-between">
            <span>User Story</span>
            {example && (
              <button
                type="button"
                onClick={loadExample}
                className="text-[10px] normal-case tracking-normal text-accent hover:text-accent-hover transition-colors"
                aria-label="Fill the form with the example values"
              >
                Use example
              </button>
            )}
          </label>
          <textarea
            id="user-story"
            value={form.user_story}
            onChange={(e) => set("user_story", e.target.value)}
            rows={6}
            required
            aria-required="true"
            minLength={10}
            placeholder="As a <persona>, I want to <action> so that <benefit>…"
            className="input-base resize-y font-mono text-[13px] leading-relaxed"
          />
        </div>

        {extraFields?.(form, set)}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-xs text-red-300"
          >
            <span className="font-semibold">Error: </span>
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={loading || form.user_story.length < 10}
            className={cn("btn-primary flex-1", loading && "cursor-progress")}
            aria-label={loading ? "Running the tool" : "Run the tool"}
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            {loading ? "Running…" : "Run Tool"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="btn-secondary"
            title="Reset"
            aria-label="Reset the form"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[11px] text-fg-faint">
          Uses the model selected in the top bar. Output is validated with Zod
          before render.
        </p>
      </form>

      {/* Result */}
      <div
        className="min-w-0 animate-fade-in"
        aria-live="polite"
        aria-busy={loading}
      >
        {renderResult(loading ? "__loading__" : result)}
      </div>
    </div>
  );
}
