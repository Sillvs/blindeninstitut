"use client";

import { useState } from "react";
import { Finding } from "@/lib/types";
import { FindingCard } from "./finding-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ReportSectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  findings: Finding[];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onToggleHidden: (index: number) => void;
  onSaveFinding: (index: number, updated: Pick<Finding, "beobachtung" | "bedeutung" | "empfehlung">) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

export function ReportSection({
  title,
  icon,
  color,
  findings,
  checked,
  onCheckedChange,
  onToggleHidden,
  onSaveFinding,
  onEditingChange,
}: ReportSectionProps) {
  const visibleFindings = findings.filter((f) => !f.hidden);
  const hiddenCount = findings.length - visibleFindings.length;
  const [showHidden, setShowHidden] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className="ml-auto" data-export-hide>
          {visibleFindings.length} {visibleFindings.length === 1 ? "Befund" : "Befunde"}
          {hiddenCount > 0 && ` (${hiddenCount} ausgeblendet)`}
        </Badge>
        <label className="flex cursor-pointer items-center gap-1.5" data-export-hide>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="h-4 w-4 accent-[#005ca9]"
          />
          <span className="text-xs text-gray-500">Geprüft</span>
          {checked && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
        </label>
      </div>

      <div className="space-y-3">
        {visibleFindings.map((finding) => {
          const realIndex = findings.indexOf(finding);
          return (
            <FindingCard
              key={realIndex}
              finding={finding}
              onToggleHidden={() => onToggleHidden(realIndex)}
              onSave={(updated) => onSaveFinding(realIndex, updated)}
              onEditingChange={onEditingChange}
            />
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <div data-export-hide>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? "Ausgeblendete verbergen" : `${hiddenCount} ausgeblendete Befunde anzeigen`}
          </Button>
          {showHidden && (
            <div className="mt-2 space-y-2 opacity-50">
              {findings
                .filter((f) => f.hidden)
                .map((finding) => {
                  const realIndex = findings.indexOf(finding);
                  return (
                    <Card key={realIndex} className="overflow-hidden border-dashed">
                      <div className="flex items-center justify-between p-3">
                        <p className="text-sm text-gray-500 line-through">
                          {finding.beobachtung}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onToggleHidden(realIndex)}
                        >
                          Wiederherstellen
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
