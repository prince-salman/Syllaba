import { extractTextFromPdf } from "./pdf-extractor";

interface ZipEntry {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const textDecoder = new TextDecoder("utf-8");

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_m, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    );
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "Browser does not support DecompressionStream for Office files."
    );
  }
  const stream = new Blob([compressed.slice()])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function parseZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  const minOffset = Math.max(0, bytes.length - 22 - 65535);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      const commentLen = view.getUint16(i + 20, true);
      if (i + 22 + commentLen === bytes.length) {
        eocdOffset = i;
        break;
      }
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Invalid Office archive (ZIP header not found).");
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const entries: ZipEntry[] = [];
  let offset = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      break;
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    const fileName = textDecoder.decode(
      bytes.subarray(offset + 46, offset + 46 + fileNameLen)
    );

    entries.push({
      fileName,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
}

async function readZipEntryText(
  bytes: Uint8Array,
  entry: ZipEntry
): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lhOffset = entry.localHeaderOffset;

  if (lhOffset + 30 > bytes.length || view.getUint32(lhOffset, true) !== 0x04034b50) {
    throw new Error(`Corrupt entry: ${entry.fileName}`);
  }

  const localNameLen = view.getUint16(lhOffset + 26, true);
  const localExtraLen = view.getUint16(lhOffset + 28, true);
  const dataStart = lhOffset + 30 + localNameLen + localExtraLen;
  const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);

  let raw: Uint8Array;
  if (entry.compressionMethod === 0) {
    raw = compressed;
  } else if (entry.compressionMethod === 8) {
    raw = await inflateRawBytes(compressed);
  } else {
    throw new Error(
      `Unsupported compression method (${entry.compressionMethod}) in ${entry.fileName}`
    );
  }

  return textDecoder.decode(raw);
}

function extractTextFromWordXml(xml: string): string {
  const tokenRegex =
    /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<\/w:p>|<w:br\b[^>]*\/>|<w:tab\b[^>]*\/>|<\/w:tc>/g;
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(xml)) !== null) {
    if (match[1] !== undefined) {
      parts.push(decodeXmlEntities(match[1]));
    } else if (match[0].startsWith("</w:tc")) {
      parts.push(" | ");
    } else if (match[0].startsWith("<w:tab")) {
      parts.push(" ");
    } else {
      parts.push("\n");
    }
  }

  return parts
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTextFromSlideXml(xml: string): string {
  const tokenRegex =
    /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<\/a:p>|<a:br\b[^>]*\/>|<\/a:tc>/g;
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(xml)) !== null) {
    if (match[1] !== undefined) {
      parts.push(decodeXmlEntities(match[1]));
    } else if (match[0].startsWith("</a:tc")) {
      parts.push(" | ");
    } else {
      parts.push("\n");
    }
  }

  return parts
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractTextFromDocx(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(bytes);

  const docEntry = entries.find((e) => e.fileName === "word/document.xml");
  if (!docEntry) {
    throw new Error("Could not find word/document.xml inside DOCX file.");
  }

  const xml = await readZipEntryText(bytes, docEntry);
  return extractTextFromWordXml(xml);
}

async function extractTextFromPptx(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(bytes);

  const slideEntries = entries
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.fileName))
    .sort((a, b) => {
      const numA = parseInt(a.fileName.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
      const numB = parseInt(b.fileName.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
      return numA - numB;
    });

  if (slideEntries.length === 0) {
    throw new Error("No slides found inside PPTX file.");
  }

  const notesBySlide = new Map<number, ZipEntry>();
  for (const entry of entries) {
    const m = entry.fileName.match(/^ppt\/notesSlides\/notesSlide(\d+)\.xml$/i);
    if (m) {
      notesBySlide.set(parseInt(m[1], 10), entry);
    }
  }

  const sections: string[] = [];
  for (const slide of slideEntries) {
    const slideNum = parseInt(
      slide.fileName.match(/slide(\d+)\.xml/i)?.[1] || "0",
      10
    );
    const slideXml = await readZipEntryText(bytes, slide);
    const slideText = extractTextFromSlideXml(slideXml);

    let noteText = "";
    const noteEntry = notesBySlide.get(slideNum);
    if (noteEntry) {
      try {
        const noteXml = await readZipEntryText(bytes, noteEntry);
        noteText = extractTextFromSlideXml(noteXml);
      } catch {
        // Notes are optional
      }
    }

    const combined = [slideText, noteText ? `Notes: ${noteText}` : ""]
      .filter(Boolean)
      .join("\n");

    if (combined) {
      sections.push(`Slide ${slideNum}\n${combined}`);
    }
  }

  return sections.join("\n\n").trim();
}

export function getSupportedExtension(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".pptx")) return "pptx";
  if (lower.endsWith(".txt")) return "txt";
  return "";
}

export async function extractTextFromDocument(file: File): Promise<string> {
  const ext = getSupportedExtension(file.name);

  if (ext === "docx") {
    return extractTextFromDocx(file);
  }

  if (ext === "pptx") {
    return extractTextFromPptx(file);
  }

  if (ext === "pdf" || ext === "txt") {
    return extractTextFromPdf(file);
  }

  throw new Error("Unsupported file format.");
}
