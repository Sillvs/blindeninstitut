/**
 * Edge proxy (Next 16 — formerly `middleware`): auth + rate limiting +
 * body-size cap for every /api/* route.
 *
 * Why proxy, not per-route: defense in depth. New /api/foo routes are
 * automatically covered.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientId,
  LIMITS_BY_ROUTE,
  type RateLimitConfig,
} from "@/lib/security/rate-limit";
import { checkApiAuth } from "@/lib/security/auth";
import { LIMITS } from "@/lib/security/limits";

function pickLimit(pathname: string): RateLimitConfig {
  if (pathname.startsWith("/api/extract")) return LIMITS_BY_ROUTE.extract;
  if (pathname.startsWith("/api/generate")) return LIMITS_BY_ROUTE.generate;
  if (pathname.startsWith("/api/chat")) return LIMITS_BY_ROUTE.chat;
  return { capacity: 10, refillPerMinute: 5 };
}

function pickBodyCap(pathname: string): number {
  if (pathname.startsWith("/api/extract")) return LIMITS.MAX_BODY_BYTES_UPLOAD;
  return LIMITS.MAX_BODY_BYTES_JSON;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // 1. Body size cap — refuse oversized bodies before they reach Route Handlers.
  //    Streaming requests without content-length get rejected, intentional.
  if (request.method === "POST" || request.method === "PUT") {
    const clHeader = request.headers.get("content-length");
    const max = pickBodyCap(pathname);
    if (!clHeader) {
      return NextResponse.json(
        { error: "Content-Length-Header fehlt" },
        { status: 411 }
      );
    }
    const cl = Number(clHeader);
    if (!Number.isFinite(cl) || cl < 0 || cl > max) {
      return NextResponse.json(
        { error: "Request-Body zu groß" },
        { status: 413 }
      );
    }
  }

  // 2. Auth. When API_TOKEN is set, enforce bearer. When unset, allow —
  //    rate-limit is the cost gate. See src/lib/security/auth.ts for the
  //    posture rationale.
  const auth = checkApiAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Nicht autorisiert" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }

  // 3. Rate limit
  const clientId = getClientId(request);
  const limit = pickLimit(pathname);
  const rl = checkRateLimit(clientId, limit);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error:
          "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
