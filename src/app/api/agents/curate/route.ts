import { NextRequest, NextResponse } from "next/server";
import { curateResourcesWithAgent } from "@/server/services/agents.service";
import { ExtractedModule } from "@/shared/types/roadmap";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    const courseTitle = typeof body.courseTitle === "string" ? body.courseTitle : undefined;
    const syllabusText = typeof body.syllabusText === "string" ? body.syllabusText : undefined;
    const language = typeof body.language === "string" ? body.language : undefined;
    const modules = Array.isArray(body.modules) ? (body.modules as ExtractedModule[]) : [];

    if (!roadmapId || modules.length === 0) {
      return NextResponse.json({ error: "roadmapId and modules are required." }, { status: 400 });
    }

    const resources = await curateResourcesWithAgent(
      roadmapId,
      modules,
      courseTitle,
      syllabusText,
      language
    );
    return NextResponse.json({ resources });
  } catch {
    return NextResponse.json({ error: "Failed to curate scholarly materials." }, { status: 500 });
  }
}
