"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, SuggestedChange } from "@/lib/types";
import { SuggestedChangeCard } from "./suggested-change-card";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface ChatPanelProps {
  open: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onAcceptChange: (change: SuggestedChange) => void;
  onRejectChange: (change: SuggestedChange) => void;
  isLoading: boolean;
}

export function ChatPanel({
  open,
  onToggle,
  messages,
  onSend,
  onAcceptChange,
  onRejectChange,
  isLoading,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#005ca9] text-white shadow-lg hover:bg-[#004a87] transition-colors print:hidden"
        title="KI-Chat öffnen"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-40 flex flex-col border bg-white shadow-2xl print:hidden sm:bottom-6 sm:right-6 sm:rounded-2xl sm:max-w-[400px] w-full sm:w-[400px] h-[70vh] sm:h-[520px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b px-4 py-3 bg-[#005ca9]">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">KI-Assistent</span>
        </div>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          onClick={onToggle}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            Stellen Sie Fragen zum Bericht oder bitten Sie um Änderungen.
            <br />
            <span className="text-xs">z.B. &quot;Mach die Empfehlung bei Sensorik Befund 1 konkreter&quot;</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-[#005ca9] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.suggestedChanges && msg.suggestedChanges.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.suggestedChanges.map((change) => (
                    <SuggestedChangeCard
                      key={change.id}
                      change={change}
                      onAccept={() => onAcceptChange(change)}
                      onReject={() => onRejectChange(change)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t rounded-b-2xl px-3 py-2.5">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#005ca9] focus:outline-none focus:ring-1 focus:ring-[#005ca9]"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="bg-[#005ca9] hover:bg-[#004a87] shrink-0"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
