import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { INTERVIEW_QUESTIONS_PROMPT } from "@/lib/prompts";
import pdfParse from "pdf-parse";
import { validatePdfFile } from "@/lib/security/validate";
import { clampString, LIMITS } from "@/lib/security/limits";
import { logError } from "@/lib/security/log";

export const runtime = "nodejs";

/**
 * Race pdf-parse against a wall-clock timeout.
 *
 * pdf-parse@1.1.1 is unmaintained and has no built-in timeout. A malformed
 * PDF (PDF bomb — cyclic object refs, oversized /Length declarations) can
 * pin a CPU indefinitely. We reject any parse taking longer than
 * PDF_PARSE_TIMEOUT_MS so a function slot can't be held open by an attacker.
 *
 * Caveat: the underlying pdf-parse callback continues to run after we
 * resolve the race; it just gets garbage-collected when the serverless
 * function instance recycles. For long-running Node servers this is
 * acceptable since the work isn't on the request path.
 */
async function parsePdfWithTimeout(
  buffer: Buffer
): Promise<{ text: string }> {
  return Promise.race([
    pdfParse(buffer),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("pdf-parse timeout")),
        LIMITS.PDF_PARSE_TIMEOUT_MS
      )
    ),
  ]) as Promise<{ text: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    const validated = await validatePdfFile(file);
    if ("error" in validated) {
      return NextResponse.json(
        { error: validated.error },
        { status: validated.status }
      );
    }

    const pdfData = await parsePdfWithTimeout(validated.buffer);
    const pdfText = pdfData.text;

    if (!pdfText.trim()) {
      return NextResponse.json(
        {
          error:
            "Das PDF enthält keinen lesbaren Text. Bitte laden Sie das digitale Original hoch (nicht den Scan).",
        },
        { status: 400 }
      );
    }

    const safePdfText = clampString(pdfText, LIMITS.MAX_PDF_TEXT_CHARS);

    let questions: { id: string; question: string; placeholder: string }[] = [];
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: INTERVIEW_QUESTIONS_PROMPT },
          { role: "user", content: safePdfText },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: LIMITS.MAX_OUTPUT_TOKENS_QUESTIONS,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        }
      }
    } catch (err) {
      logError("extract/questions", err);
    }

    return NextResponse.json({ pdfText: safePdfText, questions });
  } catch (err: unknown) {
    logError("extract", err);

    if (err instanceof Error && err.message.includes("timeout")) {
      return NextResponse.json(
        { error: "Die Verarbeitung dauert zu lange. Bitte versuchen Sie es erneut." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Der Upload hat nicht funktioniert. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}
