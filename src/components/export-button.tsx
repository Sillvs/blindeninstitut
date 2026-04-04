"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportToPdf } from "@/lib/export-pdf";

interface ExportButtonProps {
  allChecked: boolean;
  isAnyEditing: boolean;
  filename: string;
}

export function ExportButton({ allChecked, isAnyEditing, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const disabled = !allChecked || isAnyEditing || isExporting;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPdf("elternbrief", filename);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("PDF-Export fehlgeschlagen. Verwenden Sie Strg+P / Cmd+P als Alternative.");
    } finally {
      setIsExporting(false);
    }
  };

  let tooltip = "";
  if (isAnyEditing) {
    tooltip = "Bitte beenden Sie zuerst die Bearbeitung";
  } else if (!allChecked) {
    tooltip = "Bitte markieren Sie alle Abschnitte als geprüft";
  }

  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      className="bg-[#005ca9] hover:bg-[#004a87] disabled:opacity-50"
      title={tooltip}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      PDF herunterladen
    </Button>
  );
}
