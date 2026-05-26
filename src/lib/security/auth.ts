/**
 * Optional shared-secret auth gate for API routes.
 *
 * If `API_TOKEN` env var is set, every /api/* call must include
 * `Authorization: Bearer <API_TOKEN>` (or `x-api-token: <API_TOKEN>`).
 *
 * In production, API_TOKEN MUST be set. `assertAuthConfigured()` is called
 * from the proxy and FAILS CLOSED (returns false) when API_TOKEN is missing
 * in production, so /api/* gets a hard 503 instead of silently being open.
 *
 * Edge-runtime compatible: pure JS, no node:crypto.
 */

import { NextRequest } from "next/server";

/**
 * Constant-time string comparison.
 *
 * Edge runtime (where Next.js proxy runs) does not expose node:crypto.
 * We implement the standard XOR-accumulate pattern manually. Bytes are
 * encoded first so multibyte characters can't shortcut the comparison.
 *
 * Length leakage: the loop runs for max(a.length, b.length) iterations.
 * For 64-char hex tokens that's not exploitable over HTTP timing, but we
 * still mix the length into the diff so a length mismatch fails fast in
 * value-comparison terms.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    const ai = i < aBytes.length ? aBytes[i] : 0;
    const bi = i < bBytes.length ? bBytes[i] : 0;
    diff |= ai ^ bi;
  }
  return diff === 0;
}

export interface AuthResult {
  ok: boolean;
  reason?: "missing-credentials" | "invalid-credentials" | "misconfigured";
}

/**
 * Fail-closed in any non-development environment. Allowed in dev for
 * convenience. Read NODE_ENV each call so the proxy doesn't cache a stale
 * module-load value.
 *
 * Whitelist `development` only. Anything else — production, staging,
 * preview, test, undefined — fails closed. Matches the principle of least
 * surprise for operators: if NODE_ENV isn't explicitly `development`, the
 * server is not a dev box.
 */
export function isAuthConfigured(): { ok: boolean; reason?: string } {
  const expected = process.env.API_TOKEN;
  if (expected && expected.length >= 16) return { ok: true };
  const env = process.env.NODE_ENV;
  if (env === "development") return { ok: true };
  return { ok: false, reason: "api-token-missing-or-weak" };
}

export function checkApiAuth(request: NextRequest): AuthResult {
  const cfg = isAuthConfigured();
  if (!cfg.ok) return { ok: false, reason: "misconfigured" };

  const expected = process.env.API_TOKEN;
  // Dev mode: no token set, allow all.
  if (!expected) return { ok: true };

  const authHeader = request.headers.get("authorization") ?? "";
  const xApiToken = request.headers.get("x-api-token") ?? "";

  let presented = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    presented = authHeader.slice(7).trim();
  } else if (xApiToken) {
    presented = xApiToken.trim();
  }

  if (!presented) return { ok: false, reason: "missing-credentials" };
  if (!constantTimeEquals(presented, expected)) {
    return { ok: false, reason: "invalid-credentials" };
  }
  return { ok: true };
}
