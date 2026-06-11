import {
  BarChart3,
  Compass,
  ListChecks,
  MonitorPlay,
  Sparkles,
  TestTube2,
  type LucideIcon,
} from "lucide-react";

export type ToolSlug =
  | "analyze"
  | "edge-cases"
  | "exploratory"
  | "playwright"
  | "test-cases"
  | "runner";

export interface ToolMeta {
  slug: ToolSlug;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  icon: LucideIcon;
  /** Tailwind color name suffix (e.g. "blue" -> bg-blue-500). */
  color: "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan";
  /** ~50 char tagline for cards. */
  tagline: string;
  apiPath: string;
}

export const TOOLS: Record<ToolSlug, ToolMeta> = {
  analyze: {
    slug: "analyze",
    name: "Analyze Test Cases",
    shortName: "Analyze",
    tagline: "Grade your existing test suite against a user story.",
    description:
      "Scores coverage, identifies what's covered, what's missing (with severity), risks, and prioritized recommendations.",
    longDescription:
      "Paste a user story and your existing test cases (any format). Get back a 0-100 coverage score, a list of covered scenarios with evidence, missing scenarios ranked by severity, risk areas, and a prioritized action list.",
    icon: BarChart3,
    color: "blue",
    apiPath: "/api/tools/analyze",
  },
  "edge-cases": {
    slug: "edge-cases",
    name: "Generate Edge Cases",
    shortName: "Edge Cases",
    tagline: "Adversarial scenarios across 10+ risk categories.",
    description:
      "Generates high-value edge cases (boundary, security, concurrency, i18n, a11y, network, performance, data integrity, …).",
    longDescription:
      "Goes beyond happy paths. Each edge case includes preconditions, steps, expected result, severity, and rationale — ready to paste into your TMS. Optionally de-duplicates against existing test cases.",
    icon: Sparkles,
    color: "violet",
    apiPath: "/api/tools/edge-cases",
  },
  exploratory: {
    slug: "exploratory",
    name: "Exploratory Checklist",
    shortName: "Exploratory",
    tagline: "Session-based testing plan with charters & oracles.",
    description:
      "Creates Rapid-Software-Testing-style charters (time-boxed missions), per-area checklists, and bug-recognition oracles.",
    longDescription:
      "Inspired by James Bach / Michael Bolton's RST school. Provides 3-6 exploration charters with heuristics (SFDPOT, FEW HICCUPPS), an actionable per-area checklist, and concrete oracles so testers know what 'a bug' looks like. Optionally tailored to a tester persona.",
    icon: Compass,
    color: "emerald",
    apiPath: "/api/tools/exploratory",
  },
  playwright: {
    slug: "playwright",
    name: "Playwright Tests",
    shortName: "Playwright",
    tagline: "Runnable @playwright/test spec from a user story.",
    description:
      "Generates a production-quality Playwright spec (TS or JS) using web-first locators and auto-waiting assertions.",
    longDescription:
      "Produces a complete .spec.ts file you can save and run. Uses only modern Playwright best practices: getByRole / getByLabel locators, web-first assertions, test.describe + beforeEach structure, and at least 2 negative scenarios. Returns the code plus install & run commands.",
    icon: TestTube2,
    color: "amber",
    apiPath: "/api/tools/playwright",
  },
  "test-cases": {
    slug: "test-cases",
    name: "Test Case Suite",
    shortName: "Test Cases",
    tagline: "Full TMS-ready test suite — happy paths, negatives, edge cases.",
    description:
      "Generates a complete, prioritized test case suite (functional + negative + edge + non-functional) ready to import into Jira, TestRail, Zephyr.",
    longDescription:
      "One artifact, the whole story. Mix of test types (functional, negative, edge, security, performance, a11y, i18n…) with P0–P3 priority, atomic steps, test data, expected results, and tags. Built for the Excel export — every row is a TMS-import-ready test case.",
    icon: ListChecks,
    color: "rose",
    apiPath: "/api/tools/test-cases",
  },
  runner: {
    slug: "runner",
    name: "Live Runner",
    shortName: "Live Runner",
    tagline: "Paste a URL, describe the test, watch a real browser run it.",
    description:
      "Generate or paste a Playwright script and execute it against any URL in a real, headed Chromium window. Streams live logs and screenshots as the test runs.",
    longDescription:
      "An interactive Playwright cockpit. Give it a URL plus either a plain-English scenario (Gemini writes the script) or your own JavaScript. Click Run — a real Chromium window opens on your machine, the script executes step-by-step, and you see live logs, per-step screenshots, console errors, and a pass/fail summary in this dashboard. Local-only: a visible browser window can't be spawned on Vercel.",
    icon: MonitorPlay,
    color: "cyan",
    apiPath: "/api/tools/run",
  },
};

export const TOOL_LIST: ToolMeta[] = Object.values(TOOLS);

export function colorClasses(color: ToolMeta["color"]): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  gradient: string;
} {
  switch (color) {
    case "blue":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        glow: "shadow-[0_0_40px_-12px_rgba(59,130,246,0.4)]",
        gradient: "from-blue-500/20 to-cyan-500/0",
      };
    case "violet":
      return {
        bg: "bg-violet-500/10",
        text: "text-violet-400",
        border: "border-violet-500/30",
        glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.4)]",
        gradient: "from-violet-500/20 to-fuchsia-500/0",
      };
    case "emerald":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        glow: "shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]",
        gradient: "from-emerald-500/20 to-teal-500/0",
      };
    case "amber":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        glow: "shadow-[0_0_40px_-12px_rgba(245,158,11,0.4)]",
        gradient: "from-amber-500/20 to-orange-500/0",
      };
    case "rose":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
        glow: "shadow-[0_0_40px_-12px_rgba(244,63,94,0.4)]",
        gradient: "from-rose-500/20 to-pink-500/0",
      };
    case "cyan":
      return {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        glow: "shadow-[0_0_40px_-12px_rgba(34,211,238,0.4)]",
        gradient: "from-cyan-500/20 to-sky-500/0",
      };
  }
}
