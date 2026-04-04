import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { INTERVIEW_QUESTIONS_PROMPT } from "@/lib/prompts";
import pdfParse from "pdf-parse";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "Die Datei ist zu groß (max. 10 MB). Orthoptische Protokolle sind normalerweise kleiner.",
        },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
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

    // Generate interview questions (graceful degradation on failure)
    let questions: { id: string; question: string; placeholder: string }[] = [];
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: INTERVIEW_QUESTIONS_PROMPT },
          { role: "user", content: pdfText },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        }
      }
    } catch {
      // Questions generation failed — skip interview, return empty array
      console.error("Interview question generation failed, skipping");
    }

    return NextResponse.json({ pdfText, questions });
  } catch (error: unknown) {
    console.error("Extract error:", error);

    if (error instanceof Error && error.message.includes("timeout")) {
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
