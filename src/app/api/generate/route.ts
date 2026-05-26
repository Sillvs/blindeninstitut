import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts";
import { classifyFindingSource } from "@/lib/knowledge-base";
import { Finding } from "@/lib/types";
import { validateGenerateBody } from "@/lib/security/validate";
import { logError } from "@/lib/security/log";
import { LIMITS } from "@/lib/security/limits";
import { fence, renderFence, FENCE_PREAMBLE } from "@/lib/security/fence";

export const runtime = "nodejs";

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
    const raw = await request.json();
    const v = validateGenerateBody(raw);
    if ("error" in v) {
      return NextResponse.json({ error: v.error }, { status: v.status });
    }
    const { pdfText, interviewAnswers } = v;

    const answers = Object.values(interviewAnswers)
      .filter((a) => a.trim())
      .join("\n");

    const blocks = [
      fence("orthoptischer_bericht", pdfText),
      fence("kontext_fruehfoerderin", answers),
    ];
    const userMessage =
      "Bitte analysiere den folgenden orthoptischen Bericht und erstelle " +
      "einen Eltern-Infobogen.\n\n" +
      `${FENCE_PREAMBLE}\n\n${renderFence(blocks)}`;

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
        max_tokens: LIMITS.MAX_OUTPUT_TOKENS_GENERATE,
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
  } catch (err: unknown) {
    logError("generate", err);

    if (err instanceof Error && err.message.includes("timeout")) {
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
