import React, { useEffect, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Trash2, Plus } from "lucide-react";
import {
  extractTextFromDocument,
  getSupportedExtension,
} from "@/client/utils/document-extractor";
import { useLanguage } from "@/client/context/LanguageContext";
import { getWorkspaceCopy } from "@/client/i18n/workspaceCopy";

interface UploadedDeckItem {
  id: string;
  name: string;
  ext: string;
  text: string;
}

interface SyllabusDropzoneProps {
  onExtractedText: (text: string, fileName: string) => void;
  currentFileName?: string;
  onClear: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB per file
const MAX_FILES = 10;

const QUEUE_LABELS: Record<
  string,
  { queued: string; add: string; clear: string; maxErr: string }
> = {
  en: {
    queued: "Files Queued",
    add: "Add Files",
    clear: "Clear All",
    maxErr: `Maximum ${MAX_FILES} slide files allowed per upload.`,
  },
  id: {
    queued: "File Slide Siap Dianalisis",
    add: "Tambah File",
    clear: "Hapus Semua",
    maxErr: `Maksimal ${MAX_FILES} file slide dalam satu unggahan.`,
  },
  zh: {
    queued: "个课件已就绪",
    add: "继续添加",
    clear: "全部清空",
    maxErr: `单次最多可上传 ${MAX_FILES} 个课件文件。`,
  },
  ar: {
    queued: "ملفات جاهزة للتحليل",
    add: "إضافة ملفات",
    clear: "مسح الكل",
    maxErr: `الحد الأقصى ${MAX_FILES} ملفات شرائح لكل عملية رفع.`,
  },
  es: {
    queued: "Archivos Listos",
    add: "Añadir Archivos",
    clear: "Limpiar Todo",
    maxErr: `Máximo ${MAX_FILES} archivos de diapositivas por carga.`,
  },
  pt: {
    queued: "Arquivos Prontos",
    add: "Adicionar Arquivos",
    clear: "Limpar Tudo",
    maxErr: `Máximo de ${MAX_FILES} arquivos de slides por envio.`,
  },
};

export function SyllabusDropzone({
  onExtractedText,
  currentFileName,
  onClear,
}: SyllabusDropzoneProps) {
  const { lang } = useLanguage();
  const wcopy = getWorkspaceCopy(lang);
  const qlabel = QUEUE_LABELS[lang] ?? QUEUE_LABELS.en;
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<UploadedDeckItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentFileName && items.length > 0) {
      setItems([]);
    }
  }, [currentFileName, items.length]);

  const emitCombined = (nextItems: UploadedDeckItem[]) => {
    if (nextItems.length === 0) {
      onClear();
      return;
    }

    if (nextItems.length === 1) {
      onExtractedText(nextItems[0].text, nextItems[0].name);
      return;
    }

    const combinedText = nextItems
      .map(
        (item, idx) =>
          `Deck ${idx + 1}: ${item.name.replace(/\.[^/.]+$/, "")}\n${item.text}`
      )
      .join("\n\n");

    const baseTitle = nextItems[0].name.replace(/\.[^/.]+$/, "");
    const summaryName = `${baseTitle} (+${nextItems.length - 1})`;
    onExtractedText(combinedText, summaryName);
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const remainingSlots = MAX_FILES - items.length;
    if (remainingSlots <= 0) {
      setError(qlabel.maxErr);
      return;
    }

    const batch = incoming.slice(0, remainingSlots);
    const overLimit = incoming.length > remainingSlots;

    setError(null);
    setIsLoading(true);

    const nextItems = [...items];
    const errors: string[] = [];

    try {
      for (const file of batch) {
        const ext = getSupportedExtension(file.name);
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith(".doc") || lowerName.endsWith(".ppt")) {
          errors.push(
            `${file.name}: legacy .doc/.ppt is not supported (use .docx, .pptx, or .pdf).`
          );
          continue;
        }

        if (!ext) {
          errors.push(`${file.name}: unsupported format.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          errors.push(`${file.name}: exceeds 15 MB limit.`);
          continue;
        }

        try {
          const extracted = await extractTextFromDocument(file);
          if (!extracted || extracted.length < 20) {
            errors.push(`${file.name}: could not extract readable text.`);
            continue;
          }
          nextItems.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            ext: ext.toUpperCase(),
            text: extracted,
          });
        } catch {
          errors.push(`${file.name}: failed to parse file.`);
        }
      }

      if (overLimit) {
        errors.push(qlabel.maxErr);
      }

      setItems(nextItems);
      emitCombined(nextItems);

      if (errors.length > 0) {
        setError(errors.join(" "));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    const filtered = items.filter((it) => it.id !== id);
    setItems(filtered);
    setError(null);
    emitCombined(filtered);
  };

  const handleClearAll = () => {
    setItems([]);
    setError(null);
    onClear();
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = "";
    }
  };

  if (items.length > 0 || currentFileName) {
    const displayList: UploadedDeckItem[] =
      items.length > 0
        ? items
        : [
            {
              id: "single",
              name: currentFileName || "Document",
              ext: getSupportedExtension(currentFileName || "").toUpperCase() || "FILE",
              text: "",
            },
          ];

    return (
      <div className="space-y-2.5">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
          onChange={handleChange}
          className="hidden"
        />

        <div className="rounded-xl border border-[#F5B700]/45 bg-[#FEF3C7]/45 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]">
              {displayList.length} / {MAX_FILES} {qlabel.queued}
            </span>
            <div className="flex items-center gap-2">
              {displayList.length < MAX_FILES && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#111111] text-[#FACC15] hover:bg-slate-800 px-2.5 py-1 text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3 h-3" />
                  <span>
                    {isLoading
                      ? wcopy.dropzoneLoadingTitle
                      : `${qlabel.add} (${displayList.length}/${MAX_FILES})`}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-lg border border-black/10 bg-white/80 hover:bg-white px-2 py-1 text-[11px] font-semibold text-[#111111] transition cursor-pointer"
                title={wcopy.dropzoneRemoveTitle}
              >
                {qlabel.clear}
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
            {displayList.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[#F5B700]/30 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#111111] text-[#FACC15] text-[10px] font-black">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#111111] truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[#666660] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{item.ext}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    items.length > 0 ? handleRemoveItem(item.id) : handleClearAll()
                  }
                  className="rounded-md p-1.5 text-[#666660] hover:bg-[#FEF3C7] hover:text-[#111111] transition-colors cursor-pointer shrink-0"
                  title={wcopy.dropzoneRemoveTitle}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
          multiple
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
