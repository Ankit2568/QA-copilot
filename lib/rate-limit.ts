import "server-only";
import { LRUCache } from "lru-cache";
import type { NextRequest } from "next/server";

/**
 * In-memory sliding-window rate limiter for /api/tools/*.
 *
 * NOTE: This is fine for single-instance Vercel functions but does NOT share
 * state across regions or warm/cold invocations. For multi-instance production
 * traffic, swap to Upstash Redis (https://upstash.com/redis) — the public
 * `rateLimit()` API stays identical.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 30; // per IP, per window
const MAX_TRACKED_IPS = 5_000;

interface Bucket {
  /** Unix-ms timestamps of recent hits inside the window. */
  hits: number[];
}

const buckets = new LRUCache<string, Bucket>({
  max: MAX_TRACKED_IPS,
  ttl: WINDOW_MS,
});

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function ipFromRequest(req: Request | NextRequest): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const existing = buckets.get(key);
  const recent = existing ? existing.hits.filter((t) => t > cutoff) : [];

  if (recent.length >= MAX_REQUESTS) {
    const oldest = recent[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      resetAt: oldest + WINDOW_MS,
      limit: MAX_REQUESTS,
    };
  }

  recent.push(now);
  buckets.set(key, { hits: recent });

  return {
    ok: true,
    remaining: Math.max(0, MAX_REQUESTS - recent.length),
    resetAt: now + WINDOW_MS,
    limit: MAX_REQUESTS,
  };
}

export const RATE_LIMIT_HEADERS = {
  build(r: RateLimitResult): Record<string, string> {
    return {
      "X-RateLimit-Limit": String(r.limit),
      "X-RateLimit-Remaining": String(r.remaining),
      "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
    };
  },
};
