import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import { validateChatBody } from "@/lib/security/validate";
import { logError } from "@/lib/security/log";
import { LIMITS } from "@/lib/security/limits";
import { fence, renderFence, FENCE_PREAMBLE } from "@/lib/security/fence";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const v = validateChatBody(raw);
    if ("error" in v) {
      return NextResponse.json({ error: v.error }, { status: v.status });
    }
    const { message, chatHistory, context } = v;

    /**
     * Prompt-injection hardening:
     * - SYSTEM message contains ONLY the trusted system prompt + the fence
     *   preamble. No user-controlled fields are interpolated into it.
     * - User-controlled content (PDF text, current report JSON, anmerkungen)
     *   is passed in a USER message inside random-nonce fences (see
     *   src/lib/security/fence.ts). An attacker cannot include the closing
     *   tag because they cannot predict the per-request nonce.
     * - chatHistory roles are runtime-validated in validateChatBody.
     */
    const blocks = [
      fence("orthoptischer_bericht", context.pdfText),
      fence("aktueller_infobogen_json", context.reportJson),
      fence("anmerkungen_fruehfoerderin", context.anmerkungen),
    ];
    const contextBlock = `${FENCE_PREAMBLE}\n\n${renderFence(blocks)}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: contextBlock },
      ...chatHistory,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: LIMITS.MAX_OUTPUT_TOKENS_CHAT,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json({
        reply: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        suggestedChanges: [],
      });
    }

    try {
      const parsed = JSON.parse(content);
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
        reply: typeof parsed.reply === "string" ? parsed.reply : content,
        suggestedChanges: Array.isArray(parsed.suggestedChanges)
          ? parsed.suggestedChanges
          : [],
      });
    } catch {
      return NextResponse.json({
        reply: content,
        suggestedChanges: [],
      });
    }
  } catch (err: unknown) {
    logError("chat", err);
    return NextResponse.json({
      reply: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
      suggestedChanges: [],
    });
  }
}
