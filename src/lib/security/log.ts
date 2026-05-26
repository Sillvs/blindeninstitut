/**
 * Safe error logging.
 *
 * Standard `console.error("Foo:", err)` dumps the full Error object, which on
 * Next.js API routes often includes the request body, file paths, or — worse
 * for DSGVO Art. 9 — content from LLM responses surfaced in JSON.parse
 * errors (`Unexpected token K in JSON at "kindName":"Klara Müller"`).
 *
 * `logError` strips to error.name + a heavily redacted, length-bounded
 * message snippet. It does NOT log err.message verbatim and does NOT log
 * the stack lines (which can contain user-controlled fragments via V8
 * column markers in Templated-literal errors).
 */

const MAX_MSG_CHARS = 80;

/**
 * Heuristic PII filter for error messages. Replaces date-of-birth patterns,
 * email-shaped tokens, and long digit runs. Defense-in-depth, not a guarantee.
 */
function redactPii(s: string): string {
  return s
    // dd.mm.yyyy / dd/mm/yyyy
    .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, "[DATE]")
    // emails
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
    // 5+ digit runs (phone, SSN-like)
    .replace(/\b\d{5,}\b/g, "[NUM]")
    // strip newlines (keep one-liner)
    .replace(/[\r\n\t]+/g, " ");
}

export function logError(label: string, err: unknown): void {
  if (err instanceof Error) {
    const safeMsg = redactPii(err.message)
      .slice(0, MAX_MSG_CHARS)
      .replace(/[^\x20-\x7E äöüÄÖÜß[\]]/g, "?");
    console.error(`[${label}] ${err.name}: ${safeMsg}`);
    return;
  }
  // Non-Error throw — log type only, never the value itself
  console.error(`[${label}] non-error thrown: ${typeof err}`);
}
