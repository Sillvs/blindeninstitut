/**
 * Optional shared-secret auth gate for API routes.
 *
 * Auth posture is opt-in, not on by default:
 *
 *   API_TOKEN unset  → anonymous mode. Rate-limit is the only cost gate.
 *                      Intended for public PoC / demo deployments.
 *   API_TOKEN set    → every /api/* call must present a matching bearer token.
 *                      Intended for institutional deployments behind a reverse
 *                      proxy that injects the header.
 *
 * Earlier versions of this module FAILED CLOSED in production when API_TOKEN
 * was unset. That broke the Vercel demo URL the foundation was sent. The
 * design intent was always "anonymous mode for demos, bearer mode for
 * institutional reverse proxies" — the fail-closed behavior was over-fit to
 * the institutional case and is removed here. The remaining defenses
 * (rate-limit, max_tokens caps, body-size cap, prompt-injection nonce
 * fences, CSP, PII-redacted logs) still apply in anonymous mode.
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
  reason?: "missing-credentials" | "invalid-credentials";
}

/**
 * True when bearer-token enforcement is active for this deployment.
 * The proxy uses this to decide whether to demand a token.
 */
export function isBearerAuthEnabled(): boolean {
  const t = process.env.API_TOKEN;
  return typeof t === "string" && t.length >= 16;
}

export function checkApiAuth(request: NextRequest): AuthResult {
  // Anonymous mode — no token configured, anyone can call /api/*.
  // Rate-limit in the proxy is the cost gate.
  if (!isBearerAuthEnabled()) return { ok: true };

  const expected = process.env.API_TOKEN!;
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
