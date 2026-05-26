/**
 * Runtime validators for API request bodies.
 *
 * Why hand-rolled, not zod: keeps dependency surface small for an app that
 * processes special-category health data (DSGVO Art. 9). Every transitive
 * dep is supply-chain risk.
 */

import { LIMITS, clampString } from "./limits";

export type ValidationError = { error: string; status: number };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export interface ValidatedGenerateBody {
  pdfText: string;
  interviewAnswers: Record<string, string>;
}

export function validateGenerateBody(
  body: unknown
): ValidatedGenerateBody | ValidationError {
  if (!isPlainObject(body)) {
    return { error: "Ungültiger Request", status: 400 };
  }
  const { pdfText, interviewAnswers } = body;

  if (!isString(pdfText) || !pdfText.trim()) {
    return { error: "Kein Berichtstext vorhanden", status: 400 };
  }

  const cleanAnswers: Record<string, string> = {};
  if (interviewAnswers !== undefined) {
    if (!isPlainObject(interviewAnswers)) {
      return { error: "Ungültige Interview-Antworten", status: 400 };
    }
    let count = 0;
    for (const [k, v] of Object.entries(interviewAnswers)) {
      if (count >= LIMITS.MAX_INTERVIEW_ANSWERS) break;
      if (!isString(k) || !isString(v)) continue;
      cleanAnswers[k.slice(0, 64)] = clampString(
        v,
        LIMITS.MAX_INTERVIEW_ANSWER_CHARS
      );
      count++;
    }
  }

  return {
    pdfText: clampString(pdfText, LIMITS.MAX_PDF_TEXT_CHARS),
    interviewAnswers: cleanAnswers,
  };
}

export interface ValidatedChatBody {
  message: string;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  context: {
    pdfText: string;
    reportJson: string;
    anmerkungen: string;
  };
}

export function validateChatBody(
  body: unknown
): ValidatedChatBody | ValidationError {
  if (!isPlainObject(body)) {
    return { error: "Ungültiger Request", status: 400 };
  }
  const { message, chatHistory, context } = body;

  if (!isString(message) || !message.trim()) {
    return { error: "Keine Nachricht", status: 400 };
  }

  // Strict role validation — never trust client to label its own role
  const cleanHistory: Array<{ role: "user" | "assistant"; content: string }> =
    [];
  if (Array.isArray(chatHistory)) {
    for (const item of chatHistory.slice(-LIMITS.MAX_CHAT_HISTORY_ITEMS)) {
      if (!isPlainObject(item)) continue;
      const role = item.role;
      const content = item.content;
      if (!isString(content)) continue;
      // Only user/assistant — never system, never developer, never tool
      if (role !== "user" && role !== "assistant") continue;
      cleanHistory.push({
        role,
        content: clampString(content, LIMITS.MAX_CHAT_HISTORY_ITEM_CHARS),
      });
    }
  }

  if (!isPlainObject(context)) {
    return { error: "Ungültiger Kontext", status: 400 };
  }

  const pdfText = isString(context.pdfText) ? context.pdfText : "";
  const anmerkungen = isString(context.anmerkungen) ? context.anmerkungen : "";
  // report can be a complex object — stringify defensively, bounded
  let reportJson = "";
  try {
    reportJson = JSON.stringify(context.report ?? {});
  } catch {
    reportJson = "{}";
  }

  return {
    message: clampString(message, LIMITS.MAX_CHAT_MESSAGE_CHARS),
    chatHistory: cleanHistory,
    context: {
      pdfText: clampString(pdfText, LIMITS.MAX_PDF_TEXT_CHARS),
      reportJson: clampString(reportJson, LIMITS.MAX_PDF_TEXT_CHARS),
      anmerkungen: clampString(anmerkungen, LIMITS.MAX_ANMERKUNGEN_CHARS),
    },
  };
}

/**
 * Verify file is actually a PDF.
 * Checks MIME type AND magic bytes ("%PDF-") to defeat MIME spoofing.
 */
export async function validatePdfFile(
  file: File
): Promise<{ buffer: Buffer } | ValidationError> {
  if (file.size === 0) {
    return { error: "Leere Datei", status: 400 };
  }
  if (file.size > LIMITS.MAX_PDF_BYTES) {
    return {
      error:
        "Die Datei ist zu groß (max. 10 MB). Orthoptische Protokolle sind normalerweise kleiner.",
      status: 400,
    };
  }

  // MIME type check (advisory — easily spoofed by client)
  if (file.type && file.type !== "application/pdf") {
    return { error: "Bitte nur PDF-Dateien hochladen", status: 400 };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Magic byte check — authoritative
  // PDF files start with "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
  if (buffer.length < 5 || buffer.subarray(0, 5).toString() !== "%PDF-") {
    return { error: "Datei ist kein gültiges PDF", status: 400 };
  }

  return { buffer };
}
