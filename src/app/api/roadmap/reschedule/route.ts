import { NextRequest, NextResponse } from "next/server";
import { rescheduleRoadmap } from "@/lib/heuristics";
import { RescheduleRequest } from "@/types/roadmap";

export async function POST(req: NextRequest) {
  try {
    const body: RescheduleRequest = await req.json();

    if (!body.roadmap || typeof body.delayDays !== "number") {
      return NextResponse.json(
        { error: "Invalid reschedule request." },
        { status: 400 }
      );
    }

    const updated = rescheduleRoadmap(body.roadmap, body.delayDays);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reschedule roadmap." },
      { status: 500 }
    );
  }
}
