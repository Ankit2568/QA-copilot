import { z } from "zod";

const severity = z.enum(["low", "medium", "high", "critical"]);

export const TestCoverageReport = z.object({
  summary: z.string(),
  coverage_score: z.number().min(0).max(100),
  covered_scenarios: z.array(
    z.object({
      scenario: z.string(),
      evidence: z.string(),
    })
  ),
  missing_scenarios: z.array(
    z.object({
      scenario: z.string(),
      severity,
      rationale: z.string(),
      suggested_test_steps: z.array(z.string()).optional(),
    })
  ),
  risks: z.array(
    z.object({
      area: z.string(),
      description: z.string(),
      severity,
    })
  ),
  recommendations: z.array(z.string()),
});
export type TestCoverageReport = z.infer<typeof TestCoverageReport>;

export const EdgeCaseList = z.object({
  edge_cases: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      severity,
      preconditions: z.array(z.string()).optional(),
      steps: z.array(z.string()),
      expected_result: z.string(),
      rationale: z.string(),
    })
  ),
});
export type EdgeCaseList = z.infer<typeof EdgeCaseList>;

export const ExploratoryChecklist = z.object({
  persona: z.string().optional(),
  charters: z.array(
    z.object({
      title: z.string(),
      objective: z.string(),
      areas_to_explore: z.array(z.string()),
      heuristics: z.array(z.string()),
      time_box_minutes: z.number().int().min(15).max(180),
    })
  ),
  checklist: z.array(
    z.object({
      area: z.string(),
      items: z.array(z.string()),
    })
  ),
  oracles: z.array(z.string()),
});
export type ExploratoryChecklist = z.infer<typeof ExploratoryChecklist>;

export const PlaywrightScript = z.object({
  language: z.enum(["typescript", "javascript"]),
  filename: z.string(),
  code: z.string(),
  install_commands: z.array(z.string()),
  run_commands: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});
export type PlaywrightScript = z.infer<typeof PlaywrightScript>;

export type Severity = z.infer<typeof severity>;

/** Test case "type" — what category of test this is. */
export const TestCaseType = z.enum([
  "functional",
  "negative",
  "edge",
  "security",
  "performance",
  "usability",
  "accessibility",
  "i18n",
  "compatibility",
]);
export type TestCaseType = z.infer<typeof TestCaseType>;

/** Test case priority — industry-standard P0..P3 levels. */
export const TestCasePriority = z.enum(["P0", "P1", "P2", "P3"]);
export type TestCasePriority = z.infer<typeof TestCasePriority>;

/**
 * Complete test case suite for a feature. Designed to be imported into a TMS
 * (Jira/Xray, TestRail, Zephyr) — one row per test case in the Excel export.
 */
export const TestCaseSuite = z.object({
  feature: z.string(),
  summary: z.string(),
  test_cases: z.array(
    z.object({
      id: z.string(), // e.g. "TC-001"
      title: z.string(),
      type: TestCaseType,
      priority: TestCasePriority,
      preconditions: z.array(z.string()).optional(),
      steps: z.array(z.string()),
      test_data: z.string().optional(),
      expected_result: z.string(),
      tags: z.array(z.string()).optional(),
    })
  ),
  coverage_notes: z.array(z.string()).optional(),
});
export type TestCaseSuite = z.infer<typeof TestCaseSuite>;
export type TestCase = TestCaseSuite["test_cases"][number];

/* ------------------------------------------------------------------ */
/*  Live Runner — runs a Playwright script on a URL in a real browser */
/* ------------------------------------------------------------------ */

/** Input from the UI to the Live Runner. */
export const RunnerInput = z
  .object({
    url: z.string().url("Enter a valid URL including http:// or https://"),
    mode: z.enum(["generate", "manual"]),
    description: z.string().optional(), // when mode === "generate"
    script: z.string().optional(), // when mode === "manual" (or pre-generated, then edited)
    headless: z.boolean().optional().default(false),
    slow_mo: z.number().int().min(0).max(2000).optional().default(250),
    timeout_ms: z.number().int().min(5_000).max(180_000).optional().default(60_000),
    browser: z.enum(["chromium", "firefox", "webkit"]).optional().default("chromium"),
    model: z.string().optional(),
  })
  .refine(
    (v) =>
      (v.mode === "generate" && (v.description?.trim().length ?? 0) >= 10) ||
      (v.mode === "manual" && (v.script?.trim().length ?? 0) >= 10),
    {
      message:
        "Provide a description (generate mode) or a Playwright script (manual mode) of at least 10 characters.",
      path: ["mode"],
    }
  );
export type RunnerInput = z.infer<typeof RunnerInput>;

/** Just the AI-script generation step (used by /api/tools/run/generate). */
export const RunnerGenerateInput = z.object({
  url: z.string().url(),
  description: z.string().min(10),
  model: z.string().optional(),
});
export type RunnerGenerateInput = z.infer<typeof RunnerGenerateInput>;

/** Shape Gemini returns when generating a runnable script for the live runner. */
export const RunnableScript = z.object({
  code: z.string().min(1),
  summary: z.string().optional(),
  steps: z.array(z.string()).optional(),
});
export type RunnableScript = z.infer<typeof RunnableScript>;
