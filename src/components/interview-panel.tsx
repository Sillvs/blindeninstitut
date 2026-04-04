"use client";

import { useState } from "react";
import { InterviewQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MessageSquareText, SkipForward, ArrowRight } from "lucide-react";

interface InterviewPanelProps {
  questions: InterviewQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export function InterviewPanel({ questions, onSubmit, onSkip }: InterviewPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const hasAnyAnswer = Object.values(answers).some((v) => v.trim());

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <MessageSquareText className="h-7 w-7 text-[#005ca9]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Kurze Rückfragen
        </h2>
        <p className="mt-2 text-gray-600">
          Diese Informationen helfen der KI, einen besseren Eltern-Infobogen zu erstellen.
          Sie können die Fragen auch überspringen.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border bg-white p-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {q.question}
            </label>
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => handleChange(q.id, e.target.value)}
              placeholder={q.placeholder}
              className="w-full rounded-md border border-gray-200 p-2.5 text-sm focus:border-[#005ca9] focus:outline-none focus:ring-1 focus:ring-[#005ca9]"
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button variant="outline" onClick={onSkip}>
          <SkipForward className="mr-1.5 h-4 w-4" />
          Überspringen
        </Button>
        <Button
          onClick={() => onSubmit(answers)}
          disabled={!hasAnyAnswer}
          className="bg-[#005ca9] hover:bg-[#004a87]"
        >
          Weiter
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
