/**
 * Centralized input size limits. Caps protect against:
 * - cost amplification attacks against OpenAI (token-billable input + output)
 * - memory exhaustion before validators run
 * - pdf-parse PDF-bomb-style payloads
 * - prompt-injection payload bulk
 */

export const LIMITS = {
  // Upload
  MAX_PDF_BYTES: 6 * 1024 * 1024, // 6 MB — real orthoptic reports are <1 MB

  // Hard request-body byte caps enforced in the proxy BEFORE JSON parsing
  MAX_BODY_BYTES_JSON: 256 * 1024, // 256 KB for chat/generate
  MAX_BODY_BYTES_UPLOAD: 7 * 1024 * 1024, // 7 MB for extract (PDF + multipart overhead)

  // Extracted PDF text fed into LLM. ~80k chars ≈ 25k tokens
  MAX_PDF_TEXT_CHARS: 80_000,

  // Chat
  MAX_CHAT_MESSAGE_CHARS: 4_000,
  MAX_CHAT_HISTORY_ITEMS: 10,
  MAX_CHAT_HISTORY_ITEM_CHARS: 4_000,
  MAX_ANMERKUNGEN_CHARS: 8_000,

  // Interview
  MAX_INTERVIEW_ANSWERS: 8,
  MAX_INTERVIEW_ANSWER_CHARS: 2_000,

  // OpenAI output caps — bills $10/M output tokens on gpt-4o, so cap tight
  MAX_OUTPUT_TOKENS_QUESTIONS: 512,
  MAX_OUTPUT_TOKENS_GENERATE: 4096,
  MAX_OUTPUT_TOKENS_CHAT: 2048,

  // Wall-clock timeouts (ms)
  OPENAI_TIMEOUT_MS: 30_000,
  PDF_PARSE_TIMEOUT_MS: 15_000,
} as const;

/**
 * Truncate a string to `max` chars with a marker.
 * Used to bound LLM input cost without throwing.
 */
export function clampString(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max) + "\n…[gekürzt]";
}

/**
 * Strip control characters that could break log formatting or prompt fences.
 * Keeps printable Unicode (incl. German umlauts) but drops NUL, BEL, ESC, etc.
 */
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}
