import { NextRequest, NextResponse } from "next/server";
import { extractSyllabusWithAgent } from "@/server/services/agents.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const syllabusText = typeof body.syllabusText === "string" ? body.syllabusText : "";
    const courseTitle = typeof body.courseTitle === "string" ? body.courseTitle : undefined;
    const language = typeof body.language === "string" ? body.language : undefined;

    if (!syllabusText.trim()) {
      return NextResponse.json({ error: "Syllabus content is required." }, { status: 400 });
    }

    const extraction = await extractSyllabusWithAgent(syllabusText, courseTitle, language);
    return NextResponse.json(extraction);
  } catch {
    return NextResponse.json({ error: "Failed to extract syllabus modules." }, { status: 500 });
  }
}
