import OpenAI from "openai";
import { LIMITS } from "@/lib/security/limits";

/**
 * Lazy OpenAI client.
 *
 * Why lazy: constructing OpenAI at module-load throws when OPENAI_API_KEY is
 * missing, which breaks `next build` (it imports every route to collect page
 * data, even without an env). Lazy init defers the error to request time.
 *
 * Timeout: 30s wall-clock per request. Default SDK timeout is 10 minutes,
 * which on Vercel pins a billable function slot per slow OpenAI call.
 */
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  _client = new OpenAI({
    apiKey,
    timeout: LIMITS.OPENAI_TIMEOUT_MS,
    maxRetries: 1, // SDK default is 2 — halve worst-case latency
  });
  return _client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
