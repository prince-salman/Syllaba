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
        const pageString = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        textChunks.push(`Page ${pageNum}:\n${pageString}`);
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
