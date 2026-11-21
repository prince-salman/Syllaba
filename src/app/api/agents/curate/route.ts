import { NextRequest, NextResponse } from "next/server";
import { curateResourcesWithAgent } from "@/server/services/agents.service";
import { ExtractedModule } from "@/shared/types/roadmap";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roadmapId = typeof body.roadmapId === "string" ? body.roadmapId : "";
    const modules = Array.isArray(body.modules) ? (body.modules as ExtractedModule[]) : [];

    if (!roadmapId || modules.length === 0) {
      return NextResponse.json({ error: "roadmapId and modules are required." }, { status: 400 });
    }

    const resources = await curateResourcesWithAgent(roadmapId, modules);
    return NextResponse.json({ resources });
  } catch {
    return NextResponse.json({ error: "Failed to curate scholarly materials." }, { status: 500 });
  }
}
