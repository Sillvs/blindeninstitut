"use client";

import { SuggestedChange } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Trash2, Pencil } from "lucide-react";

interface SuggestedChangeCardProps {
  change: SuggestedChange;
  onAccept: () => void;
  onReject: () => void;
}

function ChangeTypeIcon({ type }: { type: SuggestedChange["type"] }) {
  switch (type) {
    case "edit_finding":
      return <Pencil className="h-3.5 w-3.5 text-blue-500" />;
    case "add_finding":
      return <Plus className="h-3.5 w-3.5 text-green-500" />;
    case "remove_finding":
      return <Trash2 className="h-3.5 w-3.5 text-red-500" />;
  }
}

function changeLabel(change: SuggestedChange): string {
  const sectionName =
    change.section === "sensorik"
      ? "Sensorik"
      : change.section === "motorik"
        ? "Motorik"
        : "Kognition";

  switch (change.type) {
    case "edit_finding":
      return `${sectionName}, Befund ${(change.findingIndex ?? 0) + 1}: ${change.field}`;
    case "add_finding":
      return `Neuer Befund in ${sectionName}`;
    case "remove_finding":
      return `Befund ${(change.findingIndex ?? 0) + 1} aus ${sectionName} entfernen`;
  }
}

export function SuggestedChangeCard({
  change,
  onAccept,
  onReject,
}: SuggestedChangeCardProps) {
  if (change.status !== "pending") {
    return (
      <div className="rounded-md border border-dashed px-3 py-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <ChangeTypeIcon type={change.type} />
          {changeLabel(change)} —{" "}
          {change.status === "accepted" ? "Angenommen" : "Abgelehnt"}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <ChangeTypeIcon type={change.type} />
          {changeLabel(change)}
        </span>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={onAccept}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onReject}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {change.type === "edit_finding" && change.newValue && (
        <p className="mt-1 text-xs text-gray-600 border-l-2 border-green-400 pl-2">
          {change.newValue}
        </p>
      )}

      {change.type === "add_finding" && change.newFinding && (
        <div className="mt-1 text-xs text-gray-600 space-y-0.5 border-l-2 border-green-400 pl-2">
          <p><strong>Beobachtung:</strong> {change.newFinding.beobachtung}</p>
          <p><strong>Bedeutung:</strong> {change.newFinding.bedeutung}</p>
          <p><strong>Empfehlung:</strong> {change.newFinding.empfehlung}</p>
        </div>
      )}
    </div>
  );
}
