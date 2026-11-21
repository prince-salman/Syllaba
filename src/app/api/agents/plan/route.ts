import { NextRequest, NextResponse } from "next/server";
import { planMicroTasksWithAgent } from "@/server/services/agents.service";
import { SyllabusExtraction } from "@/shared/types/roadmap";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const extraction = body.extraction as SyllabusExtraction | undefined;

    if (!extraction || !Array.isArray(extraction.modules) || extraction.modules.length === 0) {
      return NextResponse.json({ error: "Valid syllabus extraction is required." }, { status: 400 });
    }

    const roadmap = await planMicroTasksWithAgent(extraction, {
      syllabusText: typeof body.syllabusText === "string" ? body.syllabusText : undefined,
      dailyHoursLimit: typeof body.dailyHoursLimit === "number" ? body.dailyHoursLimit : 2,
      includeRestDays: typeof body.includeRestDays === "boolean" ? body.includeRestDays : true,
    });

    return NextResponse.json(roadmap);
  } catch {
    return NextResponse.json({ error: "Failed to generate validated micro-task roadmap." }, { status: 500 });
  }
}
