import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import {
  extractTextFromDocument,
  getSupportedExtension,
} from "@/client/utils/document-extractor";

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
      <div className="flex items-center justify-between rounded-xl border border-[#52B788]/40 bg-[#DDF1E4]/55 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#125B3A] text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#111815] truncate">
              {currentFileName}
            </p>
            <p className="text-xs text-[#125B3A]">
              {extLabel} parsed and ready for roadmap generation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg p-2 text-[#6B7872] hover:bg-[#DDF1E4] hover:text-[#111815] transition-colors cursor-pointer shrink-0"
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
            ? "border-[#125B3A] bg-[#DDF1E4]/40"
            : "border-[#D3DFD8] hover:border-[#52B788] hover:bg-[#F4F7F5]/80"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DDF1E4]/70 text-[#125B3A] mb-3">
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#125B3A] border-t-transparent" />
          ) : (
            <UploadCloud className="w-6 h-6 text-[#125B3A]" />
          )}
        </div>

        <p className="text-sm font-semibold text-[#111815]">
          {isLoading
            ? "Extracting document text..."
            : "Click or drag syllabus / deck here"}
        </p>
        <p className="mt-1 text-xs text-[#6B7872]">
          Supports .pdf, .docx, .pptx, or .txt (maximum 15 MB)
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {["PDF", "DOCX", "PPTX", "TXT"].map((fmt) => (
            <span
              key={fmt}
              className="rounded-md bg-[#F4F7F5] border border-[#E5ECE8] px-2 py-0.5 text-[10px] font-bold text-[#125B3A]"
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
