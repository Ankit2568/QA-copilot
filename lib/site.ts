/**
 * Site-level constants. Pulled from env at build / request time so
 * deployments can override them via Vercel project env.
 */

export const SITE = {
  name: "QA Copilot",
  shortName: "QA Copilot",
  description:
    "Generate test coverage reports, edge cases, exploratory checklists, and runnable Playwright scripts from a single user story — powered by Gemini.",
  /** Canonical URL of the deployed site. Override with NEXT_PUBLIC_SITE_URL in Vercel. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3030"),
  twitter: "@qa_copilot",
  ogImageAlt: "QA Copilot — your senior QA engineer, on demand.",
  themeColor: "#8b5cf6",
  bgColor: "#09090b",
} as const;

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
