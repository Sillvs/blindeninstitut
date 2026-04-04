import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts";
import { classifyFindingSource } from "@/lib/knowledge-base";
import { Finding } from "@/lib/types";

function classifyFindings(
  findings: Omit<Finding, "source" | "hidden">[]
): Finding[] {
  return findings.map((f) => {
    const combinedText = `${f.beobachtung} ${f.bedeutung} ${f.empfehlung}`;
    return {
      ...f,
      source: classifyFindingSource(combinedText),
      hidden: false,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfText, interviewAnswers } = body;

    if (!pdfText || !pdfText.trim()) {
      return NextResponse.json(
        { error: "Kein Berichtstext vorhanden" },
        { status: 400 }
      );
    }

    // Build user message with optional interview context
    let userMessage = `Bitte analysiere den folgenden orthoptischen Bericht und erstelle einen Eltern-Infobogen:\n\n${pdfText}`;

    if (interviewAnswers && Object.keys(interviewAnswers).length > 0) {
      const answersText = Object.values(interviewAnswers)
        .filter((a) => typeof a === "string" && (a as string).trim())
        .map((a) => `- ${a}`)
        .join("\n");

      if (answersText) {
        userMessage += `\n\nZusätzliche Kontextinformationen der Frühförderin:\n${answersText}`;
      }
    }

    // Call OpenAI with retry on JSON parse failure
    let report;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        if (attempts >= maxAttempts) {
          return NextResponse.json(
            {
              error:
                "Die Analyse konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
            },
            { status: 500 }
          );
        }
        continue;
      }

      try {
        report = JSON.parse(content);
        break;
      } catch {
        if (attempts >= maxAttempts) {
          return NextResponse.json(
            {
              error:
                "Die Analyse konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
            },
            { status: 500 }
          );
        }
      }
    }

    if (!report) {
      return NextResponse.json(
        {
          error:
            "Die Analyse konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
        },
        { status: 500 }
      );
    }

    // Post-processing: deterministic source classification
    if (report.sensorik?.findings) {
      report.sensorik.findings = classifyFindings(report.sensorik.findings);
    }
    if (report.motorik?.findings) {
      report.motorik.findings = classifyFindings(report.motorik.findings);
    }
    if (report.kognition?.findings) {
      report.kognition.findings = classifyFindings(report.kognition.findings);
    }

    return NextResponse.json(report);
  } catch (error: unknown) {
    console.error("Generate error:", error);

    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          error:
            "Die Analyse dauert zu lange. Bitte versuchen Sie es erneut.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Die Analyse konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
      },
      { status: 500 }
    );
  }
}
