/**
 * In-memory token-bucket rate limiter.
 *
 * Per-IP buckets. Works on a single Node.js instance; on serverless platforms
 * (Vercel etc.) buckets are not shared across cold-started instances. That
 * still attenuates abuse meaningfully. For stronger guarantees, swap in
 * Upstash Ratelimit or a Redis backend.
 *
 * Buckets auto-evict after 1h of inactivity to bound memory.
 *
 * Trusted IP header: by default we read `x-forwarded-for` (Vercel, Cloudflare,
 * standard reverse-proxy setups). For self-hosted deployments behind a
 * different proxy, the operator can set TRUSTED_CLIENT_IP_HEADER to e.g.
 * `cf-connecting-ip` or `x-real-ip`. If neither the configured header nor
 * x-forwarded-for is present, the request gets a shared "unknown" bucket
 * (fail-closed: all anonymous traffic shares one limit, attacker cannot
 * rotate header values to escape rate limit).
 */

import { NextRequest } from "next/server";

interface Bucket {
  tokens: number;
  lastRefillMs: number;
  lastUsedMs: number;
}

const BUCKETS = new Map<string, Bucket>();
const EVICT_AFTER_MS = 60 * 60 * 1000; // 1h
const MAX_BUCKETS = 10_000;

let lastSweepMs = 0;

function sweep(nowMs: number) {
  if (nowMs - lastSweepMs < 60_000) return;
  lastSweepMs = nowMs;
  for (const [key, b] of BUCKETS) {
    if (nowMs - b.lastUsedMs > EVICT_AFTER_MS) BUCKETS.delete(key);
  }
  if (BUCKETS.size > MAX_BUCKETS) {
    const sorted = [...BUCKETS.entries()].sort(
      (a, b) => a[1].lastUsedMs - b[1].lastUsedMs
    );
    for (let i = 0; i < sorted.length - MAX_BUCKETS; i++) {
      BUCKETS.delete(sorted[i][0]);
    }
  }
}

export interface RateLimitConfig {
  capacity: number;
  refillPerMinute: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

/**
 * Extract a stable client identifier.
 *
 * Reads ONE configured trusted header (default: x-forwarded-for last hop).
 * Self-hosted deployments behind a non-XFF proxy must set
 * TRUSTED_CLIENT_IP_HEADER. Spoofed values are still bucketed, but the
 * operator is explicitly opting into the security model of "this header
 * is set by my edge, not by the client".
 *
 * Fallback when no IP can be determined: a single shared "unknown" bucket.
 * This is intentionally fail-closed — an attacker that strips all headers
 * lands in the shared bucket and competes with all other anonymous traffic
 * for the same per-minute budget.
 */
export function getClientId(request: NextRequest): string {
  const customHeader = process.env.TRUSTED_CLIENT_IP_HEADER;
  if (customHeader) {
    const v = request.headers.get(customHeader);
    if (v) return v.trim().split(",")[0].trim();
  }

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // Last hop = closest to our edge, hardest for client to spoof when behind
    // a properly-configured proxy that appends its own IP.
    const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }

  // No identifying header → shared bucket (fail-closed)
  return "shared::unknown";
}

export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${clientId}::${config.capacity}::${config.refillPerMinute}`;
  let bucket = BUCKETS.get(key);
  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefillMs: now, lastUsedMs: now };
    BUCKETS.set(key, bucket);
  }

  const elapsedMin = (now - bucket.lastRefillMs) / 60_000;
  bucket.tokens = Math.min(
    config.capacity,
    bucket.tokens + elapsedMin * config.refillPerMinute
  );
  bucket.lastRefillMs = now;
  bucket.lastUsedMs = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true, retryAfterSec: 0 };
  }

  const tokensNeeded = 1 - bucket.tokens;
  const retryAfterSec = Math.ceil(
    (tokensNeeded / config.refillPerMinute) * 60
  );
  return { ok: false, retryAfterSec };
}

export const LIMITS_BY_ROUTE = {
  extract: { capacity: 5, refillPerMinute: 2 },
  generate: { capacity: 5, refillPerMinute: 2 },
  chat: { capacity: 15, refillPerMinute: 10 },
} as const;
