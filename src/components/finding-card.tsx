"use client";

import { useState } from "react";
import { Finding } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Lightbulb, Heart, EyeOff, Pencil, X, Check } from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  onToggleHidden: () => void;
  onSave: (updated: Pick<Finding, "beobachtung" | "bedeutung" | "empfehlung">) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

function TrustDot({ source }: { source: Finding["source"] }) {
  if (source === "knowledge_base") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-green-700"
        title="Aus fachlicher Wissensbasis"
        data-trust-dot
      >
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-amber-600"
      title="KI-generiert, bitte prüfen"
      data-trust-dot
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
    </span>
  );
}

export function FindingCard({
  finding,
  onToggleHidden,
  onSave,
  onEditingChange,
}: FindingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    beobachtung: finding.beobachtung,
    bedeutung: finding.bedeutung,
    empfehlung: finding.empfehlung,
  });

  const startEditing = () => {
    setDraft({
      beobachtung: finding.beobachtung,
      bedeutung: finding.bedeutung,
      empfehlung: finding.empfehlung,
    });
    setIsEditing(true);
    onEditingChange?.(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const saveEditing = () => {
    onSave(draft);
    setIsEditing(false);
    onEditingChange?.(false);
  };

  if (isEditing) {
    return (
      <Card className="overflow-hidden border-[#005ca9]/30">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#005ca9]">Befund bearbeiten</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600"
                onClick={cancelEditing}
              >
                <X className="mr-1 h-3 w-3" />
                Abbrechen
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-xs bg-[#005ca9] hover:bg-[#004a87]"
                onClick={saveEditing}
              >
                <Check className="mr-1 h-3 w-3" />
                Speichern
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#005ca9] flex items-center gap-1 mb-1">
              <Eye className="h-3.5 w-3.5" /> Beobachtung
            </label>
            <textarea
              value={draft.beobachtung}
              onChange={(e) => setDraft((d) => ({ ...d, beobachtung: e.target.value }))}
              className="w-full rounded-md border border-gray-200 p-2 text-sm focus:border-[#005ca9] focus:outline-none focus:ring-1 focus:ring-[#005ca9]"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1">
              <Lightbulb className="h-3.5 w-3.5" /> Was bedeutet das?
            </label>
            <textarea
              value={draft.bedeutung}
              onChange={(e) => setDraft((d) => ({ ...d, bedeutung: e.target.value }))}
              className="w-full rounded-md border border-gray-200 p-2 text-sm focus:border-[#005ca9] focus:outline-none focus:ring-1 focus:ring-[#005ca9]"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-green-600 flex items-center gap-1 mb-1">
              <Heart className="h-3.5 w-3.5" /> Was Sie tun können
            </label>
            <textarea
              value={draft.empfehlung}
              onChange={(e) => setDraft((d) => ({ ...d, empfehlung: e.target.value }))}
              className="w-full rounded-md border border-gray-200 p-2 text-sm focus:border-[#005ca9] focus:outline-none focus:ring-1 focus:ring-[#005ca9]"
              rows={3}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#005ca9]" />
            <div>
              <p className="text-xs font-medium text-[#005ca9]">Beobachtung</p>
              <p className="text-sm text-gray-800">{finding.beobachtung}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-medium text-amber-600">Was bedeutet das?</p>
              <p className="text-sm text-gray-800">{finding.bedeutung}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <div>
              <p className="text-xs font-medium text-green-600">Was Sie tun können</p>
              <p className="text-sm text-gray-800">{finding.empfehlung}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-2" data-export-hide>
          <TrustDot source={finding.source} />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-400 hover:text-[#005ca9]"
              onClick={startEditing}
              title="Befund bearbeiten"
            >
              <Pencil className="mr-1 h-3 w-3" />
              Bearbeiten
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-400 hover:text-red-500"
              onClick={onToggleHidden}
              title="Befund ausblenden"
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Ausblenden
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
