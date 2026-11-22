import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const OCR_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
];

interface OcrPageInput {
  pageNum: number;
  base64Jpeg: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "GEMINI_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPages = Array.isArray(body.pages) ? body.pages : [];
    const pages: OcrPageInput[] = rawPages
      .filter(
        (p: unknown): p is OcrPageInput =>
          Boolean(p) &&
          typeof (p as OcrPageInput).pageNum === "number" &&
          typeof (p as OcrPageInput).base64Jpeg === "string" &&
          (p as OcrPageInput).base64Jpeg.length > 50
      )
      .slice(0, 10);

    if (pages.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid PDF page images provided." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [
      {
        text: `Transcribe ALL readable text, headings, bullet points, equations (in inline LaTeX $...$), and diagram labels from these PDF pages completely and verbatim. Label each page clearly as "Slide <pageNum>: <Heading>\\n<bullets/details>". Do NOT summarize or skip any page. Pages included: ${pages
          .map((p) => p.pageNum)
          .join(", ")}.`,
      },
    ];

    for (const page of pages) {
      const cleanedBase64 = page.base64Jpeg.replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        ""
      );
      parts.push({ text: `--- Page ${page.pageNum} ---` });
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanedBase64,
        },
      });
    }

    for (const modelName of OCR_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(parts);
        const text = result.response.text()?.trim();
        if (text) {
          return NextResponse.json({ ok: true, text });
        }
      } catch {
        // Try next available vision model
      }
    }

    return NextResponse.json(
      { ok: false, error: "OCR models failed to transcribe PDF pages." },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF OCR failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
