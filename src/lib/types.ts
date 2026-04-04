export interface Finding {
  beobachtung: string;
  bedeutung: string;
  empfehlung: string;
  source: "knowledge_base" | "needs_review";
  hidden: boolean;
}

export interface ReportSection {
  title: string;
  findings: Finding[];
}

export interface ElternInfobogen {
  kindName: string;
  geburtsdatum: string;
  untersuchungsdatum: string;
  orthoptistin: string;
  diagnosen: string[];
  sensorik: ReportSection;
  motorik: ReportSection;
  kognition: ReportSection;
}

// Interview types

export interface InterviewQuestion {
  id: string;
  question: string;
  placeholder: string;
}

export interface ExtractResponse {
  pdfText: string;
  questions: InterviewQuestion[];
}

export interface GenerateRequest {
  pdfText: string;
  interviewAnswers?: Record<string, string>;
}

// Chat types

export interface SuggestedChange {
  id: string;
  type: "edit_finding" | "add_finding" | "remove_finding";
  section?: "sensorik" | "motorik" | "kognition";
  findingIndex?: number;
  field?: "beobachtung" | "bedeutung" | "empfehlung";
  newValue?: string;
  newFinding?: Omit<Finding, "source" | "hidden">;
  status: "pending" | "accepted" | "rejected";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestedChanges?: SuggestedChange[];
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  chatHistory: ChatMessage[];
  context: {
    pdfText: string;
    report: ElternInfobogen;
    anmerkungen: string;
  };
}

export interface ChatResponse {
  reply: string;
  suggestedChanges?: SuggestedChange[];
}
