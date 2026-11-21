import { API_BASE_URL } from "@/theme/tokens";
import {
  CuratedResource,
  Roadmap,
  SyllabusExtraction,
} from "@/types/roadmap";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(errText || `HTTP ${response.status} from ${path}`);
  }

  return (await response.json()) as T;
}

export async function generateMobileRoadmap(
  syllabusText: string,
  options: { courseTitle?: string; dailyHoursLimit?: number } = {},
  onStage?: (stage: "extract" | "plan" | "curate") => void
): Promise<Roadmap> {
  onStage?.("extract");
  const { extraction } = await postJson<{ extraction: SyllabusExtraction }>(
    "/api/agents/extract",
    {
      syllabusText,
      courseTitle: options.courseTitle,
    }
  );

  onStage?.("plan");
  const { roadmap } = await postJson<{ roadmap: Roadmap }>(
    "/api/agents/plan",
    {
      extraction,
      syllabusText,
      dailyHoursLimit: options.dailyHoursLimit ?? 2,
      includeRestDays: true,
    }
  );

  onStage?.("curate");
  try {
    const curated = await postJson<{ resources: CuratedResource[] }>(
      "/api/agents/curate",
      {
        roadmapId: roadmap.id,
        modules: extraction.modules,
      }
    );
    roadmap.curatedResources = curated.resources;
  } catch {
    // Gracefully continue with planned roadmap even if external curation times out
  }

  return roadmap;
}

export async function rescheduleMobileRoadmap(
  roadmap: Roadmap,
  delayDays = 2
): Promise<Roadmap> {
  const result = await postJson<{ roadmap: Roadmap }>(
    "/api/roadmap/reschedule",
    {
      roadmap,
      delayDays,
      reason: "Mobile adaptive catch-up",
    }
  );
  return result.roadmap;
}
