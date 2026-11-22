declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

async function loadPdfJsFromCdn(): Promise<any> {
  if (typeof window === "undefined") return null;
  if (window.pdfjsLib) return window.pdfjsLib;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        resolve(null);
      }
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

async function ocrScannedPdfPages(pdf: any): Promise<string> {
  if (typeof document === "undefined") return "";
  const totalPages = Math.min(pdf.numPages || 0, 24);
  if (totalPages === 0) return "";

  const renderedPages: Array<{ pageNum: number; base64Jpeg: string }> = [];
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      await page.render({ canvasContext: ctx, viewport }).promise;
      const base64Jpeg = canvas.toDataURL("image/jpeg", 0.72);
      renderedPages.push({ pageNum, base64Jpeg });
    } catch {
      // Skip unrenderable page cleanly
    }
  }

  if (renderedPages.length === 0) return "";

  // Send in batches of 8 pages so payload stays fast & within serverless limits
  const batchOutputs: string[] = [];
  for (let i = 0; i < renderedPages.length; i += 8) {
    const batch = renderedPages.slice(i, i + 8);
    try {
      const res = await fetch("/api/agents/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: batch }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.text === "string" && data.text.trim()) {
          batchOutputs.push(data.text.trim());
        }
      }
    } catch {
      // Continue remaining batches
    }
  }

  return batchOutputs.join("\n\n").trim();
}

export async function extractTextFromPdf(file: File): Promise<string> {
  if (file.name.endsWith(".txt")) {
    return await file.text();
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await loadPdfJsFromCdn();

    if (pdfjsLib) {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const textChunks: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const lines: string[] = [];
        let currentLine = "";
        let lastY: number | null = null;

        for (const item of textContent.items as Array<{
          str?: string;
          hasEOL?: boolean;
          transform?: number[];
        }>) {
          const text = (item.str ?? "").trim();
          const y = Array.isArray(item.transform) ? item.transform[5] : null;

          if (
            lastY !== null &&
            y !== null &&
            Math.abs(y - lastY) > 3 &&
            currentLine.trim()
          ) {
            lines.push(currentLine.trim());
            currentLine = "";
          }

          if (text) {
            currentLine = currentLine ? `${currentLine} ${text}` : text;
          }

          if (item.hasEOL && currentLine.trim()) {
            lines.push(currentLine.trim());
            currentLine = "";
          }

          if (y !== null) {
            lastY = y;
          }
        }

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        const cleanedLines = lines
          .flatMap((line) =>
            line.length > 200
              ? line
                  .split(/(?:[•●▪▸]|\.\s+)/)
                  .map((part) => part.trim())
                  .filter((part) => part.length > 2)
              : [line]
          )
          .filter(Boolean);

        if (cleanedLines.length > 0) {
          const heading = cleanedLines[0];
          const body = cleanedLines.slice(1).join("\n");
          textChunks.push(
            body
              ? `Slide ${pageNum}: ${heading}\n${body}`
              : `Slide ${pageNum}: ${heading}`
          );
        }
      }

      const fullText = textChunks.join("\n\n").trim();
      if (fullText.length >= 80) {
        return fullText;
      }

      // Image-based / scanned / Canva-flattened PDF: extract cleanly via Gemini Vision OCR
      const ocrText = await ocrScannedPdfPages(pdf);
      if (ocrText.length >= 40) {
        return ocrText;
      }
      if (fullText.length > 0) {
        return fullText;
      }
    }
  } catch {
    // Continue to stream parser fallback
  }

  try {
    const rawText = await file.text();
    const matches = rawText.match(/\(([^()]+)\)\s*Tj/g) || [];
    if (matches.length > 5) {
      return matches
        .map((m) => m.replace(/[()]/g, "").replace(/\s*Tj$/, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    const cleanPrintable = rawText
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (cleanPrintable.length > 50) {
      return cleanPrintable.slice(0, 48000);
    }
  } catch {
    // Return document header fallback
  }

  return `Course Syllabus: ${file.name.replace(/\.[^/.]+$/, "")}\nUploaded document ready for roadmap analysis.`;
}
