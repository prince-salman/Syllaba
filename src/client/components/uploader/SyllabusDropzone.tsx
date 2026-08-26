import React, { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { extractTextFromPdf } from "@/client/utils/pdf-extractor";

interface SyllabusDropzoneProps {
  onExtractedText: (text: string, fileName: string) => void;
  currentFileName?: string;
  onClear: () => void;
}

export function SyllabusDropzone({ onExtractedText, currentFileName, onClear }: SyllabusDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      setError("Please upload a valid PDF or text document (.pdf, .txt)");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const extracted = await extractTextFromPdf(file);
      if (!extracted || extracted.length < 20) {
        setError("Could not extract readable text from this file. Try pasting the text directly.");
        return;
      }
      onExtractedText(extracted, file.name);
    } catch {
      setError("Failed to parse file. You can paste the syllabus text directly into the text tab.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  if (currentFileName) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-950">{currentFileName}</p>
            <p className="text-xs text-emerald-700">PDF parsed and ready for roadmap generation</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg p-2 text-slate-400 hover:bg-emerald-100 hover:text-slate-700 transition-colors cursor-pointer"
          title="Remove file"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-brand-500 bg-brand-50/50"
            : "border-slate-300 hover:border-brand-400 hover:bg-slate-50/80"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-3">
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          ) : (
            <UploadCloud className="w-6 h-6 text-brand-600" />
          )}
        </div>

        <p className="text-sm font-semibold text-slate-800">
          {isLoading ? "Extracting syllabus text..." : "Click or drag course syllabus PDF here"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Supports .pdf or .txt (maximum 10 MB)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
