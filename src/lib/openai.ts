import OpenAI from "openai";
import { LIMITS } from "@/lib/security/limits";

/**
 * LLM client with swappable backend.
 *
 * Default backend is OpenAI's hosted API. For DSGVO-conform deployments the
 * institution can point at any OpenAI-compatible endpoint without code change
 * via env vars:
 *
 *   OPENAI_BASE_URL      — endpoint URL (e.g. an Azure OpenAI EU resource,
 *                          an internal vLLM/Ollama server, a self-hosted
 *                          llama.cpp instance). When set, requests go there
 *                          instead of api.openai.com.
 *   OPENAI_API_KEY       — bearer token. Required (Azure uses its own key,
 *                          self-hosted setups can use any non-empty value).
 *   LLM_MODEL            — model name. Defaults to "gpt-4o". For local
 *                          deployments set to e.g. "llama3.1:70b" or
 *                          "qwen2.5-72b-instruct".
 *
 * Lazy initialization: constructing the client at module-load throws when
 * OPENAI_API_KEY is missing, which would break `next build`. We defer the
 * error to request time and catch it in the route handlers.
 *
 * Timeout: 30 s wall-clock per request. SDK default is 10 minutes, which
 * pins billable function slots open during slow upstream calls.
 */
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const baseURL = process.env.OPENAI_BASE_URL;
  _client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    timeout: LIMITS.OPENAI_TIMEOUT_MS,
    maxRetries: 1,
  });
  return _client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});

/**
 * Resolve the model name to use. Lets the institution swap to a local
 * model name (e.g. "llama3.1:70b") via LLM_MODEL env var.
 */
export function getModel(): string {
  return process.env.LLM_MODEL || "gpt-4o";
}
