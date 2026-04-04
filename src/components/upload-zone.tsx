"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
}

export function UploadZone({ onFileSelected, isAnalyzing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "application/pdf") {
          setFileName(file.name);
          onFileSelected(file);
        }
      }
    },
    [onFileSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setFileName(files[0].name);
        onFileSelected(files[0]);
      }
    },
    [onFileSelected]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
        isDragging
          ? "border-[#005ca9] bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      } ${isAnalyzing ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
      onClick={() => {
        if (!isAnalyzing) {
          document.getElementById("file-input")?.click();
        }
      }}
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInput}
        disabled={isAnalyzing}
      />

      {isAnalyzing ? (
        <>
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#005ca9]" />
          <p className="text-lg font-medium text-gray-700">
            Bericht wird analysiert...
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Die KI analysiert den orthoptischen Bericht und erstellt den
            Eltern-Infobogen.
          </p>
        </>
      ) : fileName ? (
        <>
          <FileText className="mb-4 h-12 w-12 text-[#005ca9]" />
          <p className="text-lg font-medium text-gray-700">{fileName}</p>
          <p className="mt-1 text-sm text-gray-500">
            Klicken oder ziehen Sie eine neue Datei hierher, um sie zu ersetzen.
          </p>
        </>
      ) : (
        <>
          <Upload className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-700">
            Orthoptischen Bericht hochladen
          </p>
          <p className="mt-1 text-sm text-gray-500">
            PDF-Datei hierher ziehen oder klicken zum Auswählen
          </p>
          <Button variant="outline" className="mt-4" type="button">
            Datei auswählen
          </Button>
        </>
      )}
    </div>
  );
}
