# QA Copilot

> An AI-powered QA assistant for product teams. Paste a user story, get a full coverage report, edge cases, exploratory checklist, Playwright tests, **and a complete TMS-ready test case suite**. Export everything to Excel, CSV, Markdown, or JSON.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06b6d4?style=flat-square&logo=tailwindcss)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google)
![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Live demo:** https://qa-copilot-ui.vercel.app

---

## Table of contents

- [What it does](#what-it-does)
- [The tools](#the-tools)
- [Quick start (local dev)](#quick-start-local-dev)
- [Live Runner — extra setup (local only)](#live-runner--extra-setup-local-only)
- [Get a free Gemini API key](#get-a-free-gemini-api-key)
- [Environment variables](#environment-variables)
- [Choosing a model](#choosing-a-model)
- [Export formats](#export-formats)
- [Deploy your own copy to Vercel](#deploy-your-own-copy-to-vercel)
- [How it works (architecture)](#how-it-works-architecture)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

QA Copilot turns one input — a user story or feature description — into the full QA artifact suite a senior tester would normally produce in 1–2 hours of work:

1. **Test coverage analysis** of your existing test cases — what's missing, what's risky, what to add next.
2. **High-value edge cases** beyond the happy path (boundary, security, concurrency, network, permissions, a11y, i18n, perf, data-integrity).
3. **Session-based exploratory testing plan** — charters, checklists, oracles in the James Bach / Rapid Software Testing style.
4. **Runnable Playwright test spec** — production-quality TypeScript/JavaScript using web-first locators and auto-waiting assertions.
5. **Complete TMS-ready test case suite** — every scenario you need (functional, negative, edge, security, performance, a11y, i18n, compatibility) with P0–P3 priorities, atomic steps, expected results, and test data. Exports to Excel with a `Status` dropdown column ready to import into Jira/Xray, TestRail, or Zephyr.
6. **Live Runner** — paste a URL, describe what to test (or write the script yourself), and watch a real Chromium window execute it live with streaming logs and a full video recording you can replay inline when the run finishes. (Local dev only.)

Every static result is **exportable in 4 formats**: Excel (styled, multi-sheet), CSV, Markdown (Jira/Confluence-friendly), and raw JSON for pipelines.

---

## The tools

| Tool | What you give it | What you get back | Best for |
|---|---|---|---|
| **Analyze Test Cases** | A user story + your existing test cases | A coverage score (0–100), what's covered, what's missing (with severity & rationale), risks, recommendations | Auditing an existing test plan before a release |
| **Generate Edge Cases** | A user story (+ optionally existing tests to dedupe) | A list of high-value edge cases tagged by category, severity, with steps, preconditions, expected result, rationale | Filling gaps after writing happy-path tests |
| **Exploratory Checklist** | A user story (+ optional persona) | Charters with time-boxes, area checklists, heuristics, oracles | Planning a 30-minute or 2-hour exploratory session |
| **Playwright Tests** | A user story (+ optional target URL) | A runnable `.spec.ts` file using `getByRole`/`getByLabel`/web-first assertions, plus install & run commands | Bootstrapping E2E coverage in minutes |
| **Test Case Suite** | A user story + optional types/priority focus + max cases | A complete, prioritized suite (mix of types, P0–P3) with steps, expected results, test data, tags — exportable as TMS-importable Excel | The everyday "I need test cases for this feature" workflow |
| **Live Runner** *(local only)* | A URL + plain-English scenario *or* your own JavaScript | A live-streaming run inside a real Chromium window — per-step logs, console errors, request failures, a pass/fail summary, and a full video recording you can replay or download | Smoke-testing a URL on the spot, debugging a flaky flow, or running a one-off check without standing up a Playwright project |

---

## Quick start (local dev)

You need **Node.js 18.17+** (Node 20 LTS recommended) and **npm**.

```bash
git clone https://github.com/Ankit2568/QA-copilot.git
cd QA-copilot

npm install

cp .env.example .env.local
# open .env.local and paste your GEMINI_API_KEY (see next section)

npm run dev
```

Open http://localhost:3030 — you should see the dashboard.

### Useful commands

```bash
npm run dev         # next dev on port 3030
npm run build       # production build
npm run start       # serve production build (after npm run build)
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
npm run verify      # lint + typecheck + build (run before pushing)
```

---

## Live Runner — extra setup (local only)

The **Live Runner** tool spawns a real Chromium window on the machine running `npm run dev`. It cannot work on Vercel (or any serverless host) because serverless functions have no display and Chromium binaries aren't shipped to that runtime — the route fails fast with a clear `501` in that case.

Two one-time setup steps before first use:

```bash
# 1. Pull the @playwright/test dependency (already in package.json — covered by npm install)
npm install

# 2. Download the actual Chromium binary Playwright drives (~120 MB).
#    Add `firefox webkit` to the end if you want those browsers too.
npx playwright install chromium
```

Then go to **http://localhost:3030/tools/runner** and:

1. Paste a URL (e.g. `https://playwright.dev/`).
2. Pick a source mode:
   - **Generate from description** — write what to test in plain English; Gemini produces a runnable Playwright script. Edit it before running if you want.
   - **Write my own script** — paste/write your own. Use the helpers `page`, `expect`, `browser`, `context`, `step(name, fn)`, `log(msg)` — all already in scope. **No `import`, no `test(...)` wrapper.**
3. Tweak run options (browser, headed/headless, slow-motion, timeout).
4. Click **Run on the spot** — a Chromium window opens, the script executes, and the dashboard streams:
   - Per-step pass/fail with duration
   - Console messages and page errors from the target site
   - Failed network requests
   - A full video recording of the run, played back inline (and downloadable as `.webm`) the moment the run finishes
   - Final pass/fail summary with totals

**Security note:** the user-provided script runs as JavaScript inside the same Node process as `npm run dev`. That process can already touch your filesystem, so this is acceptable for local dev — but **do not enable the `/api/tools/run` route on a public-facing deployment**. The route refuses to run when it detects `VERCEL=1` or `AWS_LAMBDA_FUNCTION_NAME`.

---

## Get a free Gemini API key

1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key**.
3. Pick a Google Cloud project (or let it create one for you).
4. Copy the key — it starts with `AIza...`.
5. Paste it into `.env.local`:

```bash
GEMINI_API_KEY=AIza...your-key-here...
```

6. Restart `npm run dev`.

**Free tier limits**: each model gets its own daily quota (~20 requests/day for `gemini-2.5-flash` on free tier). If you hit the wall, switch models in the top-bar model picker — `gemini-2.5-flash-lite`, `gemini-2.5-pro`, `gemini-2.0-flash`, and `gemini-2.0-flash-lite` are all separate quota buckets. Or [enable billing](https://aistudio.google.com/apikey) for higher limits.

---

## Environment variables

Only `GEMINI_API_KEY` is required. Everything else is optional.

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `GEMINI_API_KEY` | yes | — | Your Google AI Studio key |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | Default model (user can override via the in-app picker) |
| `GEMINI_TEMPERATURE` | no | `0.2` | `0` = deterministic, `1` = creative |
| `GEMINI_TIMEOUT_MS` | no | `60000` | Per-request timeout (ms) |
| `GEMINI_MAX_RETRIES` | no | `2` | Retry budget for 5xx, timeout, and per-minute 429s (per-day quota errors are never retried) |
| `NEXT_PUBLIC_SITE_URL` | no | derived from `VERCEL_URL` | Canonical URL for OG images, sitemap, robots |
| `NEXT_PUBLIC_APP_VERSION` | no | `1.0.0` | Surfaced by `/api/health` for monitoring |

Never commit `.env.local` — it's gitignored.

---

## Choosing a model

The model picker in the top bar lets every user choose at runtime; the choice persists in `localStorage`. Curated catalog:

| Model | Tier | When to use |
|---|---|---|
| `gemini-2.5-flash` | Default | Balanced quality & speed — start here |
| `gemini-2.5-flash-lite` | Fast | Cheapest, fastest — quick iterations, low-stakes generation |
| `gemini-2.5-pro` | Quality | Highest reasoning quality — slower, more expensive. Use for hairy edge cases or large suites |
| `gemini-2.0-flash` | Fallback | Older but rock-solid. Useful when 2.5 is overloaded |
| `gemini-2.0-flash-lite` | Fallback | Older, cheapest fallback |

The catalog is defined in [`lib/models.ts`](./lib/models.ts) and is the single source of truth — the server rejects any model not in this list (defense in depth against stale `localStorage` values).

---

## Export formats

Every tool result has an **Export** button with four options:

| Format | What you get | Best for |
|---|---|---|
| **Excel (.xlsx)** | Multi-sheet workbook with styled headers, color-coded severity/priority cells, autofilters, frozen header rows. For the Test Case Suite, includes a `Status` column with a Pass/Fail/Blocked/N/A dropdown ready for testers to fill | Daily TMS work — import directly into Jira/Xray, TestRail, Zephyr |
| **CSV (.csv)** | Flat single-sheet, RFC-4180-safe quoting | Google Sheets, any tool that imports CSV |
| **Markdown (.md)** | GitHub-flavored, with tables and code fences | Jira / Confluence / GitHub issues / PR descriptions |
| **JSON (.json)** | Raw structured payload | Pipelines, scripts, programmatic consumption |

The `exceljs` dependency (~700KB) is **dynamically imported** only when the user clicks "Export to Excel" — initial page bundle stays tiny.

---

## Deploy your own copy to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAnkit2568%2FQA-copilot&project-name=qa-copilot&repository-name=qa-copilot&env=GEMINI_API_KEY&envDescription=Google%20AI%20Studio%20API%20key%20for%20server-side%20Gemini%20calls&envLink=https%3A%2F%2Faistudio.google.com%2Fapikey)

### CLI (fastest)

```bash
npm i -g vercel

vercel login
vercel link            # answer prompts: link to a new or existing project

# Required — pipe your key in (Vercel strips trailing newline):
"AIza...your-key..." | vercel env add GEMINI_API_KEY production
"AIza...your-key..." | vercel env add GEMINI_API_KEY preview
"AIza...your-key..." | vercel env add GEMINI_API_KEY development

vercel --prod
```

The default `vercel.json` pins functions to `iad1` (US East) and sets `maxDuration` to 60s. Edit if you want a different region or longer timeouts.

### GitHub integration

1. Push the repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add env var `GEMINI_API_KEY` for all three environments.
5. Click **Deploy**.

Subsequent pushes to `main` deploy automatically; PRs get preview URLs with their own env.

---

## How it works (architecture)

```
┌──────────────────────┐    POST /api/tools/<tool>     ┌─────────────────────────┐
│  Client (browser)    │ ─────── { user_story, model, … } ──────► │  Next.js API route       │
│  - React form        │                                           │  - Zod-validates body    │
│  - ModelPicker       │                                           │  - Requires GEMINI key   │
│  - Result view       │                                           │  - Rate limits (30/10m)  │
└──────────────────────┘                                           │  - Calls callLlmJson()   │
            ▲                                                      └──────────┬──────────────┘
            │                                                                 │
            │     JSON-validated result                                       │
            └─────────────────────────────────────────────────────────────────┤
                                                                              │
                                                            ┌─────────────────▼──────────────────┐
                                                            │  lib/gemini.ts                     │
                                                            │  - resolves model via lib/models   │
                                                            │  - withTimeout + withRetries       │
                                                            │  - assertCleanFinish (MAX_TOKENS,  │
                                                            │    SAFETY, RECITATION → typed err) │
                                                            │  - rewriteApiError (429/503/403)   │
                                                            │  - parseJsonLoose                  │
                                                            └─────────────────┬──────────────────┘
                                                                              │
                                                            ┌─────────────────▼──────────────────┐
                                                            │  @google/genai (Gemini API)        │
                                                            │  responseMimeType: application/json│
                                                            └────────────────────────────────────┘
```

Highlights:

- **Server-side LLM calls only.** Your `GEMINI_API_KEY` never reaches the browser.
- **Zod validation on both ends.** Request body is Zod-validated before calling Gemini; the response is Zod-validated before reaching the UI. Malformed JSON never gets rendered.
- **Smart error rewriting.** Gemini's giant raw JSON error blobs get translated into actionable user messages (`"Daily free-tier quota exhausted for gemini-2.5-flash. Switch to a different model…"` instead of a 200-line stack trace).
- **finishReason awareness.** If Gemini stops mid-response (`MAX_TOKENS`, `SAFETY`, `RECITATION`), the user gets a specific message before any JSON-parse failure.
- **Retry budget honors per-day quotas.** A per-day 429 fails fast (no point retrying); per-minute throttles, timeouts, and 5xx errors get exponential backoff.
- **In-memory rate limiter** (`lru-cache`) caps each IP to 30 requests / 10 minutes per function instance. Swap to Upstash Redis for multi-region traffic — the public API in `lib/rate-limit.ts` is identical.

---

## Project structure

```
QA-copilot/
├── app/
│   ├── layout.tsx                  # root layout, metadata, fonts
│   ├── page.tsx                    # dashboard home
│   ├── globals.css                 # Tailwind + design tokens
│   ├── icon.tsx                    # 64x64 violet "Q" favicon
│   ├── apple-icon.tsx              # 180x180 apple touch icon
│   ├── opengraph-image.tsx         # 1200x630 OG / Twitter card
│   ├── robots.ts                   # /robots.txt
│   ├── sitemap.ts                  # /sitemap.xml
│   ├── error.tsx / not-found.tsx   # route boundaries
│   ├── tools/
│   │   ├── analyze/{page,AnalyzeForm}.tsx
│   │   ├── edge-cases/{page,EdgeCasesForm}.tsx
│   │   ├── exploratory/{page,ExploratoryForm}.tsx
│   │   ├── playwright/{page,PlaywrightForm}.tsx
│   │   ├── test-cases/{page,TestCasesForm}.tsx
│   │   └── runner/{page,RunnerWorkbench}.tsx   # NEW: live in-browser Playwright runner
│   └── api/
│       ├── health/route.ts
│       └── tools/
│           ├── analyze/route.ts
│           ├── edge-cases/route.ts
│           ├── exploratory/route.ts
│           ├── playwright/route.ts
│           ├── test-cases/route.ts
│           └── run/
│               ├── route.ts                    # NEW: SSE streaming live-run endpoint
│               ├── generate/route.ts           # NEW: script-only generation (preview before run)
│               └── video/[id]/route.ts         # NEW: streams the recorded .webm video back to the player
├── components/
│   ├── Topbar.tsx, Sidebar.tsx     # chrome
│   ├── ModelPicker.tsx             # top-bar Gemini model dropdown + useSelectedModel hook
│   ├── ToolForm.tsx                # generic form wiring (model, body, loading, error, result)
│   ├── ExportMenu.tsx              # XLSX / CSV / MD / JSON export dropdown
│   ├── results/                    # per-tool result views
│   │   ├── AnalyzeView.tsx
│   │   ├── EdgeCasesView.tsx
│   │   ├── ExploratoryView.tsx
│   │   ├── PlaywrightView.tsx
│   │   └── TestCasesView.tsx       # filter by type + priority, expandable cards
│   └── runner/                     # NEW: Live Runner UI
│       ├── LiveLog.tsx             # terminal-style streaming log
│       ├── VideoPlayer.tsx         # inline .webm playback (recording indicator while running)
│       └── RunSummary.tsx          # pass/fail summary card
├── lib/
│   ├── api.ts                      # errorResponse, rateLimitOrReject, requireGeminiKey
│   ├── gemini.ts                   # server-only Google Gen AI client + retry/timeout/error rewriting
│   ├── models.ts                   # curated Gemini model catalog + resolveModel allow-list
│   ├── prompts.ts                  # senior-QA system prompts (one per tool)
│   ├── schemas.ts                  # Zod schemas for every tool's response shape
│   ├── exporters.ts                # XLSX / CSV / MD generators (per tool)
│   ├── rate-limit.ts               # in-memory LRU rate limiter
│   ├── site.ts                     # site-level constants
│   ├── tools.ts                    # tool metadata (icons, colors, descriptions)
│   ├── runner-events.ts            # NEW: SSE event protocol (shared client+server)
│   ├── playwright-runner.ts        # NEW: in-process Playwright execution engine
│   └── utils.ts
├── next.config.mjs                 # security headers
├── vercel.json                     # function regions, maxDuration
├── tailwind.config.ts              # design tokens, custom colors
├── tsconfig.json                   # strict mode
└── package.json
```

---

## Tech stack

- **[Next.js 14](https://nextjs.org/)** — App Router, React Server Components, API routes
- **[TypeScript](https://www.typescriptlang.org/)** strict mode
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** with custom design tokens
- **[Lucide React](https://lucide.dev/)** icons
- **[Zod](https://zod.dev/)** runtime validation
- **[@google/genai](https://www.npmjs.com/package/@google/genai)** Google Gen AI SDK
- **[ExcelJS](https://github.com/exceljs/exceljs)** styled XLSX export (dynamically imported)
- **[lru-cache](https://www.npmjs.com/package/lru-cache)** in-memory rate limiting

---

## Troubleshooting

### `GEMINI_API_KEY is not set on the server`

- **Local**: your `.env.local` is missing the key, or you started `npm run dev` before saving the file. Open `.env.local`, paste the key, and restart.
- **Vercel**: env var isn't set on the project. Run `"AIza..." | vercel env add GEMINI_API_KEY production` then `vercel --prod`.

### `API key not valid (400 / INVALID_ARGUMENT)`

The key value is wrong, has extra whitespace, has quotes around it, or is a placeholder. Generate a fresh one at https://aistudio.google.com/apikey and paste only the raw key (no quotes, no newline).

### `Daily free-tier quota exhausted for gemini-2.5-flash (429)`

Each model has its own daily quota on the free tier. **Switch models in the top-bar picker** — `gemini-2.5-flash-lite`, `gemini-2.5-pro`, etc. are separate buckets. Or wait until the quota resets (~midnight Pacific) or [enable billing](https://aistudio.google.com/apikey).

### `Model is temporarily overloaded (503)`

Google's capacity hiccup. Retry in a few seconds or switch models — different models live in different capacity pools.

### `Gemini hit its output-token limit before finishing the JSON response`

The output got truncated mid-generation. Switch to `gemini-2.5-pro` (more headroom) or shorten/simplify the input. The Playwright and Test Case Suite tools are most prone to this for large stories.

### `npm run build` fails with OOM on Windows

A common Windows-specific issue when the Next.js dev server is still running. Kill it first:

```powershell
(Get-NetTCPConnection -LocalPort 3030).OwningProcess | Stop-Process -Force
npm run build
```

If still OOM, bump Node's heap: `$env:NODE_OPTIONS = "--max-old-space-size=6144"; npm run build`.

### `Module not found` after pulling changes

`npm install` — dependencies changed.

### Live Runner — `Playwright is not installed in this project`

You ran `npm install` but skipped the browser-binary install. Fix:

```bash
npx playwright install chromium
# (add `firefox webkit` if you want those browsers as well)
```

### Live Runner — `Live Runner cannot execute on serverless deployments`

Expected on Vercel/Lambda. Live Runner needs a real display and the Chromium binary — neither exists in a serverless runtime. Use it from a local `npm run dev`.

### Live Runner — script generation failed validation

The model emitted disallowed syntax (e.g. an `import` line, a `test(...)` wrapper, or a banned API like `process.exit`). Regenerate with a more specific scenario description, or switch to `gemini-2.5-pro` for better instruction-following.

### Live Runner — Chromium opens but the script throws immediately

Two common causes:

1. The selector doesn't exist on the page. Open DevTools on the target site, find a more stable locator (`getByRole`, `getByTestId`), and edit the script in the editor before re-running.
2. The page hasn't fully loaded. Add a step like:
   ```js
   await step("Wait for hero", async () => {
     await expect(page.getByRole("heading").first()).toBeVisible();
   });
   ```

---

## Roadmap

- [ ] Streaming responses (token-by-token render) for the Playwright tool
- [ ] Side-by-side diff view in Analyze (existing vs. suggested tests)
- [ ] Save & share — persist runs to a database for team collaboration
- [ ] OpenAI / Anthropic fallback providers via a unified `lib/llm.ts` adapter
- [ ] CLI (`npx qa-copilot`) for terminal-first workflows
- [ ] Cypress / WebdriverIO targets alongside Playwright

---

## Contributing

PRs welcome. Before pushing:

```bash
npm run verify   # lint + typecheck + production build
```

Conventions:
- TypeScript strict mode — no `any` without a comment justifying it.
- Tailwind via the design tokens in `tailwind.config.ts`, not arbitrary hex.
- New tools: add the Zod schema in `lib/schemas.ts`, prompt in `lib/prompts.ts`, route in `app/api/tools/<slug>/route.ts`, page+form in `app/tools/<slug>/`, result view in `components/results/`, exporter cases in `lib/exporters.ts`, and metadata in `lib/tools.ts`.

---

## License

[MIT](./LICENSE) © Ankit Kumar
