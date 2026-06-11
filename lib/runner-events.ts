/**
 * Server-Sent Event protocol for the Live Runner.
 *
 * The /api/tools/run route streams a sequence of these as `data: <json>\n\n`.
 * The client (RunnerWorkbench) reads them with EventSource-like fetch-streaming
 * and renders each into the live log / screenshot gallery / final summary.
 *
 * Keep this file dependency-free — it's imported on both server and client.
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

/** Discriminated-union of every event the server can emit. */
export type RunnerEvent =
  | { type: "meta"; ts: number; url: string; browser: string; headless: boolean; slowMo: number; mode: "generate" | "manual"; codePreview: string }
  | { type: "generated"; ts: number; code: string; summary?: string; steps?: string[] }
  | { type: "log"; ts: number; level: LogLevel; message: string; source?: "runner" | "browser" | "script" }
  | { type: "step-start"; ts: number; index: number; name: string }
  | { type: "step-end"; ts: number; index: number; name: string; ok: boolean; durationMs: number; error?: string }
  | { type: "screenshot"; ts: number; index: number; label: string; dataUrl: string }
  | { type: "console"; ts: number; level: LogLevel; message: string; location?: string }
  | { type: "pageerror"; ts: number; message: string; stack?: string }
  | { type: "requestfailed"; ts: number; url: string; method: string; failure: string }
  | { type: "done"; ts: number; ok: boolean; passedSteps: number; failedSteps: number; durationMs: number; error?: string }
  | { type: "fatal"; ts: number; message: string };

export type RunnerEventType = RunnerEvent["type"];

/** Standard SSE wire-format encoder. One event per chunk. */
export function encodeSse(event: RunnerEvent): Uint8Array {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  return new TextEncoder().encode(payload);
}

/** Convenience: timestamp helper used by the engine. */
export const now = (): number => Date.now();
