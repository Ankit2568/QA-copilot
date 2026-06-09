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
