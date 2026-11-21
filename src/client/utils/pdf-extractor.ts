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
            line.length > 160
              ? line
                  .split(/(?:[•●▪▸]|\.\s+)/)
                  .map((part) => part.trim())
                  .filter((part) => part.length > 2)
              : [line]
          )
          .filter(Boolean);

        if (cleanedLines.length > 0) {
          const heading = cleanedLines[0].slice(0, 90);
          const body = cleanedLines.slice(1).join("\n");
          textChunks.push(
            body
              ? `Slide ${pageNum}: ${heading}\n${body}`
              : `Slide ${pageNum}: ${heading}`
          );
        }
      }

      const fullText = textChunks.join("\n\n").trim();
      if (fullText.length > 30) {
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

    const cleanPrintable = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{2,}/g, " ").trim();
    if (cleanPrintable.length > 50) {
      return cleanPrintable.slice(0, 8000);
    }
  } catch {
    // Return document header fallback
  }

  return `Course Syllabus: ${file.name.replace(/\.[^/.]+$/, "")}\nUploaded document ready for roadmap analysis.`;
}
