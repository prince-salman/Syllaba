import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import {
  extractTextFromDocument,
  getSupportedExtension,
} from "@/client/utils/document-extractor";
import { useLanguage } from "@/client/context/LanguageContext";
import { getWorkspaceCopy } from "@/client/i18n/workspaceCopy";

interface SyllabusDropzoneProps {
  onExtractedText: (text: string, fileName: string) => void;
  currentFileName?: string;
  onClear: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function SyllabusDropzone({
  onExtractedText,
  currentFileName,
  onClear,
}: SyllabusDropzoneProps) {
  const { lang } = useLanguage();
  const wcopy = getWorkspaceCopy(lang);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const ext = getSupportedExtension(file.name);
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".doc") || lowerName.endsWith(".ppt")) {
      setError(
        "Legacy .doc/.ppt format is not supported. Please re-save as .docx, .pptx, or .pdf."
      );
      return;
    }

    if (!ext) {
      setError(
        "Unsupported file type. Please upload a .pdf, .docx, .pptx, or .txt document."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds 15 MB limit. Please upload a smaller document.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const extracted = await extractTextFromDocument(file);
      if (!extracted || extracted.length < 20) {
        setError(
          "Could not extract enough readable text (file may be image-only or encrypted). Try pasting the text directly."
        );
        return;
      }
      onExtractedText(extracted, file.name);
    } catch {
      setError(
        "Failed to parse file. Please make sure it is not password-protected, or paste the syllabus text directly."
      );
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
      e.target.value = "";
    }
  };

  if (currentFileName) {
    const extLabel = getSupportedExtension(currentFileName).toUpperCase() || "FILE";
    return (
      <div className="flex items-center justify-between rounded-xl border border-[#F5B700]/40 bg-[#FEF3C7]/55 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111111] text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111111] truncate">
              {currentFileName}
            </p>
            <p className="text-xs text-[#111111]">
              {extLabel} parsed and ready for roadmap generation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg p-2 text-[#666660] hover:bg-[#FEF3C7] hover:text-[#111111] transition-colors cursor-pointer shrink-0"
          title={wcopy.dropzoneRemoveTitle}
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
            ? "border-[#111111] bg-[#FEF3C7]/40"
            : "border-[#D4D4D0] hover:border-[#F5B700] hover:bg-[#F7F7F5]/80"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3C7]/70 text-[#111111] mb-3">
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#111111]" />
          )}
        </div>

        <p className="text-sm font-semibold text-[#111111]">
          {isLoading ? wcopy.dropzoneLoadingTitle : wcopy.dropzoneIdleTitle}
        </p>
        <p className="mt-1 text-xs text-[#666660]">
          {wcopy.dropzoneFormatsHint}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {["PDF", "DOCX", "PPTX", "TXT"].map((fmt) => (
            <span
              key={fmt}
              className="rounded-md bg-[#F7F7F5] border border-[#E5E5E0] px-2 py-0.5 text-[10px] font-bold text-[#111111]"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-[#F4E0E6]/70 p-3 text-xs text-[#9B1C44] border border-[#D9386A]/25">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
