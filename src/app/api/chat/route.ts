import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import { ChatRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, chatHistory, context } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Keine Nachricht" },
        { status: 400 }
      );
    }

    // Build system prompt with full context
    const systemWithContext = `${CHAT_SYSTEM_PROMPT}

--- ORIGINALER ORTHOPTISCHER BERICHT ---
${context.pdfText}

--- AKTUELLER ELTERN-INFOBOGEN ---
${JSON.stringify(context.report, null, 2)}

--- ANMERKUNGEN DER FRÜHFÖRDERIN ---
${context.anmerkungen || "(keine)"}`;

    // Sliding window: last 10 messages
    const recentHistory = chatHistory.slice(-10);

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemWithContext },
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json({
        reply: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        suggestedChanges: [],
      });
    }

    // Parse with fallback
    try {
      const parsed = JSON.parse(content);
      // Assign IDs to suggested changes
      if (Array.isArray(parsed.suggestedChanges)) {
        parsed.suggestedChanges = parsed.suggestedChanges.map(
          (c: Record<string, unknown>, i: number) => ({
            ...c,
            id: `change-${Date.now()}-${i}`,
            status: "pending",
          })
        );
      }
      return NextResponse.json({
        reply: parsed.reply || content,
        suggestedChanges: parsed.suggestedChanges || [],
      });
    } catch {
      // JSON parse failed — return raw text as reply
      return NextResponse.json({
        reply: content,
        suggestedChanges: [],
      });
    }
  } catch (error: unknown) {
    console.error("Chat error:", error);
    return NextResponse.json({
      reply: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      suggestedChanges: [],
    });
  }
}
