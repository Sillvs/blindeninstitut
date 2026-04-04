"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/header";
import { UploadZone } from "@/components/upload-zone";
import { InterviewPanel } from "@/components/interview-panel";
import { ReportPreview } from "@/components/report-preview";
import { ExportButton } from "@/components/export-button";
import { ChatPanel } from "@/components/chat-panel";
import {
  ElternInfobogen,
  InterviewQuestion,
  ChatMessage,
  SuggestedChange,
  Finding,
} from "@/lib/types";
import { ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppState =
  | "upload"
  | "extracting"
  | "interview"
  | "generating"
  | "review"
  | "error";

export default function Home() {
  // Core state
  const [state, setState] = useState<AppState>("upload");
  const [error, setError] = useState<string | null>(null);

  // Data
  const [pdfText, setPdfText] = useState<string>("");
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [report, setReport] = useState<ElternInfobogen | null>(null);
  const [anmerkungen, setAnmerkungen] = useState("");

  // Review state
  const [sectionChecks, setSectionChecks] = useState({
    sensorik: false,
    motorik: false,
    kognition: false,
  });
  const [editingCount, setEditingCount] = useState(0);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const allChecked = sectionChecks.sensorik && sectionChecks.motorik && sectionChecks.kognition;
  const isAnyEditing = editingCount > 0;

  // --- Handlers ---

  const handleReset = () => {
    setState("upload");
    setError(null);
    setPdfText("");
    setInterviewQuestions([]);
    setReport(null);
    setAnmerkungen("");
    setSectionChecks({ sensorik: false, motorik: false, kognition: false });
    setEditingCount(0);
    setChatOpen(false);
    setChatMessages([]);
  };

  const handleFileSelected = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Die Datei ist zu groß (max. 10 MB).");
      setState("error");
      return;
    }

    setState("extracting");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload fehlgeschlagen");
      }

      const data = await res.json();
      setPdfText(data.pdfText);

      if (data.questions && data.questions.length > 0) {
        setInterviewQuestions(data.questions);
        setState("interview");
      } else {
        // No questions generated — skip interview, go straight to generating
        await generateReport(data.pdfText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      setState("error");
    }
  };

  const generateReport = async (
    text: string,
    answers?: Record<string, string>
  ) => {
    setState("generating");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfText: text,
          interviewAnswers: answers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generierung fehlgeschlagen");
      }

      const data: ElternInfobogen = await res.json();
      setReport(data);
      setState("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      setState("error");
    }
  };

  const handleInterviewSubmit = (answers: Record<string, string>) => {
    generateReport(pdfText, answers);
  };

  const handleInterviewSkip = () => {
    generateReport(pdfText);
  };

  const handleSectionCheckChange = (
    section: "sensorik" | "motorik" | "kognition",
    checked: boolean
  ) => {
    setSectionChecks((prev) => ({ ...prev, [section]: checked }));
  };

  const handleEditingChange = useCallback((isEditing: boolean) => {
    setEditingCount((prev) => prev + (isEditing ? 1 : -1));
  }, []);

  // --- Chat ---

  const handleSendChat = async (message: string) => {
    if (!report) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatHistory: chatMessages,
          context: {
            pdfText,
            report,
            anmerkungen,
          },
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        suggestedChanges: data.suggestedChanges || [],
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyChange = (change: SuggestedChange) => {
    if (!report) return;

    const section = change.section as "sensorik" | "motorik" | "kognition";

    if (change.type === "edit_finding" && change.field && change.newValue != null) {
      const newFindings = [...report[section].findings];
      const idx = change.findingIndex ?? 0;
      if (newFindings[idx]) {
        newFindings[idx] = {
          ...newFindings[idx],
          [change.field]: change.newValue,
        };
        setReport({
          ...report,
          [section]: { ...report[section], findings: newFindings },
        });
      }
    } else if (change.type === "add_finding" && change.newFinding) {
      const newFinding: Finding = {
        ...change.newFinding,
        source: "needs_review",
        hidden: false,
      };
      setReport({
        ...report,
        [section]: {
          ...report[section],
          findings: [...report[section].findings, newFinding],
        },
      });
    } else if (change.type === "remove_finding") {
      const newFindings = [...report[section].findings];
      const idx = change.findingIndex ?? 0;
      if (newFindings[idx]) {
        newFindings[idx] = { ...newFindings[idx], hidden: true };
        setReport({
          ...report,
          [section]: { ...report[section], findings: newFindings },
        });
      }
    }
  };

  const updateChangeStatus = (
    changeId: string,
    status: "accepted" | "rejected"
  ) => {
    setChatMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        suggestedChanges: msg.suggestedChanges?.map((c) =>
          c.id === changeId ? { ...c, status } : c
        ),
      }))
    );
  };

  const handleAcceptChange = (change: SuggestedChange) => {
    applyChange(change);
    updateChangeStatus(change.id, "accepted");
  };

  const handleRejectChange = (change: SuggestedChange) => {
    updateChangeStatus(change.id, "rejected");
  };

  // --- Filename ---

  const exportFilename = report
    ? `Eltern-Infobogen_${report.kindName.replace(/\s+/g, "_")}.pdf`
    : "Eltern-Infobogen.pdf";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* UPLOAD STATE */}
        {state === "upload" && (
          <div className="mx-auto max-w-2xl px-6 py-16">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Eltern-Infobogen erstellen
              </h1>
              <p className="mt-2 text-gray-600">
                Laden Sie einen orthoptischen Bericht hoch, um einen
                verständlichen Infobogen für Eltern zu generieren.
              </p>
            </div>

            <UploadZone
              onFileSelected={handleFileSelected}
              isAnalyzing={false}
            />

            <div className="mt-8 rounded-lg bg-white p-6 text-sm text-gray-600">
              <h3 className="mb-2 font-semibold text-gray-900">
                So funktioniert es:
              </h3>
              <ol className="list-inside list-decimal space-y-1">
                <li>Orthoptischen Bericht als PDF hochladen</li>
                <li>Kurze Rückfragen beantworten (optional)</li>
                <li>Die KI erstellt den Eltern-Infobogen</li>
                <li>Ergebnisse prüfen, bearbeiten und als PDF herunterladen</li>
              </ol>
            </div>
          </div>
        )}

        {/* EXTRACTING STATE */}
        {state === "extracting" && (
          <div className="mx-auto max-w-2xl px-6 py-24 text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#005ca9]" />
            <p className="text-lg font-medium text-gray-700">
              PDF wird verarbeitet...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Der Bericht wird analysiert und Rückfragen vorbereitet.
            </p>
          </div>
        )}

        {/* INTERVIEW STATE */}
        {state === "interview" && interviewQuestions.length > 0 && (
          <InterviewPanel
            questions={interviewQuestions}
            onSubmit={handleInterviewSubmit}
            onSkip={handleInterviewSkip}
          />
        )}

        {/* GENERATING STATE */}
        {state === "generating" && (
          <div className="mx-auto max-w-2xl px-6 py-24 text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#005ca9]" />
            <p className="text-lg font-medium text-gray-700">
              Infobogen wird erstellt...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Die KI erstellt den Eltern-Infobogen aus dem orthoptischen Bericht.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Dies dauert etwa 10–15 Sekunden.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <div className="mx-auto max-w-lg px-6 py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Etwas ist schiefgelaufen
            </h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={handleReset}
                className="bg-[#005ca9] hover:bg-[#004a87]"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
            </div>
          </div>
        )}

        {/* REVIEW STATE */}
        {state === "review" && report && (
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 print:hidden">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Neuen Bericht laden
              </Button>
              <ExportButton
                allChecked={allChecked}
                isAnyEditing={isAnyEditing}
                filename={exportFilename}
              />
            </div>

            <ReportPreview
              report={report}
              onReportChange={setReport}
              anmerkungen={anmerkungen}
              onAnmerkungenChange={setAnmerkungen}
              sectionChecks={sectionChecks}
              onSectionCheckChange={handleSectionCheckChange}
              onEditingChange={handleEditingChange}
            />

            <ChatPanel
              open={chatOpen}
              onToggle={() => setChatOpen((prev) => !prev)}
              messages={chatMessages}
              onSend={handleSendChat}
              onAcceptChange={handleAcceptChange}
              onRejectChange={handleRejectChange}
              isLoading={chatLoading}
            />
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-4 text-center text-xs text-gray-500 print:hidden">
        Blindeninstitutsstiftung · Stiftung des öffentlichen Rechts ·{" "}
        <a
          href="https://www.blindeninstitut.de"
          className="text-[#005ca9] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.blindeninstitut.de
        </a>
      </footer>
    </div>
  );
}
