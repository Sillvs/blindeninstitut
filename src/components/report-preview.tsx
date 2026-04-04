"use client";

import { ElternInfobogen, Finding } from "@/lib/types";
import { ReportSection } from "./report-section";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, Move, Brain } from "lucide-react";
import Image from "next/image";

interface ReportPreviewProps {
  report: ElternInfobogen;
  onReportChange: (report: ElternInfobogen) => void;
  anmerkungen: string;
  onAnmerkungenChange: (text: string) => void;
  sectionChecks: { sensorik: boolean; motorik: boolean; kognition: boolean };
  onSectionCheckChange: (
    section: "sensorik" | "motorik" | "kognition",
    checked: boolean
  ) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export function ReportPreview({
  report,
  onReportChange,
  anmerkungen,
  onAnmerkungenChange,
  sectionChecks,
  onSectionCheckChange,
  onEditingChange,
}: ReportPreviewProps) {
  const toggleHidden = (
    section: "sensorik" | "motorik" | "kognition",
    index: number
  ) => {
    const newFindings = [...report[section].findings];
    newFindings[index] = {
      ...newFindings[index],
      hidden: !newFindings[index].hidden,
    };
    onReportChange({
      ...report,
      [section]: { ...report[section], findings: newFindings },
    });
  };

  const saveFinding = (
    section: "sensorik" | "motorik" | "kognition",
    index: number,
    updated: Pick<Finding, "beobachtung" | "bedeutung" | "empfehlung">
  ) => {
    const newFindings = [...report[section].findings];
    newFindings[index] = { ...newFindings[index], ...updated };
    onReportChange({
      ...report,
      [section]: { ...report[section], findings: newFindings },
    });
  };

  const hasHiddenFindings =
    report.sensorik.findings.some((f) => f.hidden) ||
    report.motorik.findings.some((f) => f.hidden) ||
    report.kognition.findings.some((f) => f.hidden);

  return (
    <div className="space-y-6" id="elternbrief">
      {/* Header */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.jpg"
                alt="Blindeninstitut"
                width={140}
                height={46}
                className="h-10 w-auto"
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[#005ca9]">
              Infobogen für Eltern
            </h1>
            <p className="text-sm text-gray-500">
              Ergebnisse der orthoptischen Überprüfung – verständlich erklärt
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
          <div>
            <span className="text-gray-500">Kind:</span>{" "}
            <span className="font-medium">{report.kindName}</span>
          </div>
          <div>
            <span className="text-gray-500">Geburtsdatum:</span>{" "}
            <span className="font-medium">{report.geburtsdatum}</span>
          </div>
          <div>
            <span className="text-gray-500">Untersuchung am:</span>{" "}
            <span className="font-medium">{report.untersuchungsdatum}</span>
          </div>
          <div>
            <span className="text-gray-500">Orthoptistin:</span>{" "}
            <span className="font-medium">{report.orthoptistin}</span>
          </div>
        </div>

        {report.diagnosen.length > 0 && (
          <div className="mt-4">
            <span className="text-sm text-gray-500">Diagnosen:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {report.diagnosen.map((d, i) => (
                <Badge key={i} variant="outline">
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trust Legend */}
      <div className="flex gap-4 rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-600" data-export-hide>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          Aus fachlicher Wissensbasis
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
          KI-generiert (bitte prüfen)
        </span>
      </div>

      {/* Page 1: Sensorik */}
      <div data-pdf-section>
        <ReportSection
          title="Sensorik"
          icon={<Eye className="h-5 w-5 text-[#005ca9]" />}
          color="bg-blue-50"
          findings={report.sensorik.findings}
          checked={sectionChecks.sensorik}
          onCheckedChange={(c) => onSectionCheckChange("sensorik", c)}
          onToggleHidden={(i) => toggleHidden("sensorik", i)}
          onSaveFinding={(i, u) => saveFinding("sensorik", i, u)}
          onEditingChange={onEditingChange}
        />
      </div>

      {/* Page 2: Motorik */}
      <div data-pdf-section>
        <ReportSection
          title="Motorik"
          icon={<Move className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
          findings={report.motorik.findings}
          checked={sectionChecks.motorik}
          onCheckedChange={(c) => onSectionCheckChange("motorik", c)}
          onToggleHidden={(i) => toggleHidden("motorik", i)}
          onSaveFinding={(i, u) => saveFinding("motorik", i, u)}
          onEditingChange={onEditingChange}
        />
      </div>

      {/* Page 3: Kognition + Anmerkungen */}
      <div data-pdf-section>
        <ReportSection
          title="Kognition & Entwicklung"
          icon={<Brain className="h-5 w-5 text-emerald-600" />}
          color="bg-emerald-50"
          findings={report.kognition.findings}
          checked={sectionChecks.kognition}
          onCheckedChange={(c) => onSectionCheckChange("kognition", c)}
          onToggleHidden={(i) => toggleHidden("kognition", i)}
          onSaveFinding={(i, u) => saveFinding("kognition", i, u)}
          onEditingChange={onEditingChange}
        />

        {/* Hidden findings note for print */}
        {hasHiddenFindings && (
          <p className="mt-4 text-sm italic text-gray-500">
            Weitere Befunde wurden im persönlichen Gespräch besprochen.
          </p>
        )}

        {/* Anmerkungen */}
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Anmerkungen der Frühförderin
          </h3>
          <p className="mb-2 text-xs text-gray-500" data-export-hide>
            Optionale persönliche Ergänzungen, die im PDF erscheinen.
          </p>
          <textarea
            value={anmerkungen}
            onChange={(e) => onAnmerkungenChange(e.target.value)}
            placeholder="z.B. 'Mathilda zeigt im Alltag besonders bei Wimmelbüchern Vermeidungsverhalten. Wir empfehlen...'"
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-[#005ca9] focus:outline-none focus:ring-1 focus:ring-[#005ca9]"
            rows={3}
          />
        </div>
      </div>

      {/* PDF footer (rendered on last page by export-pdf) */}
      <div className="text-center text-xs text-gray-400 pt-4" data-pdf-footer style={{ display: "none" }}>
        <Separator className="mb-3" />
        Erstellt mit Blindi | Blindeninstitutsstiftung |{" "}
        {new Date().toLocaleDateString("de-DE")}
      </div>
    </div>
  );
}
