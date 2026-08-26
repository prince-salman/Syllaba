import { NextRequest, NextResponse } from "next/server";
import { generateRoadmapWithGemini } from "@/server/services/gemini.service";
import { GenerationRequest } from "@/shared/types/roadmap";

export async function POST(req: NextRequest) {
  try {
    const body: GenerationRequest = await req.json();

    if (!body.syllabusText || body.syllabusText.trim().length === 0) {
      return NextResponse.json(
        { error: "Syllabus content is required." },
        { status: 400 }
      );
    }

    const roadmap = await generateRoadmapWithGemini(body);
    return NextResponse.json(roadmap);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate roadmap." },
      { status: 500 }
    );
  }
}
