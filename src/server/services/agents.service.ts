import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BurnoutMetrics,
  CognitiveLoad,
  CuratedResource,
  DailySchedule,
  ExtractedModule,
  Roadmap,
  RoadmapTask,
  SyllabusExtraction,
  TaskCategory,
} from "@/shared/types/roadmap";
import { generateId } from "@/shared/utils";
import { generateHeuristicRoadmap } from "./pacing.service";
import { saveCuratedResourcesToDb, saveRoadmapToDb } from "@/server/db/proofs.repo";

const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.8-flash"];
const AGENT_TIMEOUT_MS = 8000;

async function generateJsonWithGemini(
  apiKey: string,
  systemInstruction: string,
  prompt: string,
  temperature: number
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
        },
        systemInstruction,
      });
      const result = await withTimeout(model.generateContent(prompt), AGENT_TIMEOUT_MS);
      return result.response.text();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Agent timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function parseSyllabusFallback(syllabusText: string, courseTitle?: string): SyllabusExtraction {
  const lines = syllabusText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const detectedTitle =
    courseTitle ||
    lines.find((line) => line.length > 4 && line.length < 72 && !line.includes("http")) ||
    "Academic Course Plan";

  const modules: ExtractedModule[] = [];
  const headingPattern = /^(week\s*\d+|module\s*\d+|chapter\s*\d+|unit\s*\d+|part\s*\d+|topic\s*\d+)/i;

  let current: ExtractedModule = {
    title: "Foundations and Core Concepts",
    topics: [],
    estimatedHours: 3,
  };

  for (const line of lines) {
    if (headingPattern.test(line)) {
      if (current.topics.length > 0) {
        modules.push(current);
      }
      current = {
        title: line.slice(0, 80),
        topics: [],
        estimatedHours: 3,
      };
    } else if (line.length > 8 && line.length < 140) {
      const cleaned = line.replace(/^[-*\d.]+\s*/, "").trim();
      if (cleaned && current.topics.length < 5) {
        current.topics.push(cleaned);
      }
    }
  }

  if (current.topics.length > 0) {
    modules.push(current);
  }

  if (modules.length === 0) {
    modules.push({
      title: detectedTitle,
      topics: ["Core definitions", "Problem sets", "Exam synthesis"],
      estimatedHours: 4,
    });
  }

  return {
    courseTitle: detectedTitle,
    modules: modules.slice(0, 8),
  };
}

/** Agent 1: Extract structured modules, topics, weights, and hard deadlines from raw syllabus text. */
export async function extractSyllabusWithAgent(
  syllabusText: string,
  courseTitle?: string
): Promise<SyllabusExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return parseSyllabusFallback(syllabusText, courseTitle);
  }

  try {
    const systemInstruction =
      "You are Agent 1 (Syllabus Extractor). Extract academic modules, key subtopics, weight percentages, and hard deadlines. Return ONLY valid JSON.";

    const prompt = `Extract course structure from this syllabus.
Provided courseTitle hint: ${courseTitle || "Auto-detect"}
Syllabus text:
${syllabusText.slice(0, 10000)}

Return JSON matching:
{
  "courseTitle": "string",
  "courseCode": "string or empty",
  "hardDeadline": "YYYY-MM-DD or empty string",
  "modules": [
    {
      "title": "Module title",
      "topics": ["Topic 1", "Topic 2"],
      "weightPercentage": 20,
      "deadlineHint": "Week 2 or date",
      "estimatedHours": 3
    }
  ]
}`;

    const rawText = await generateJsonWithGemini(apiKey, systemInstruction, prompt, 0.1);
    const parsed = JSON.parse(rawText);

    if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      return parseSyllabusFallback(syllabusText, courseTitle);
    }

    return {
      courseTitle: parsed.courseTitle || courseTitle || "Academic Course Plan",
      courseCode: parsed.courseCode || undefined,
      hardDeadline: parsed.hardDeadline || undefined,
      modules: parsed.modules.slice(0, 8).map((m: Record<string, unknown>) => ({
        title: String(m.title || "Study Module"),
        topics: Array.isArray(m.topics) ? m.topics.map(String).slice(0, 5) : ["Core concepts"],
        weightPercentage: typeof m.weightPercentage === "number" ? m.weightPercentage : undefined,
        deadlineHint: m.deadlineHint ? String(m.deadlineHint) : undefined,
        estimatedHours: typeof m.estimatedHours === "number" ? m.estimatedHours : 3,
      })),
    };
  } catch {
    return parseSyllabusFallback(syllabusText, courseTitle);
  }
}

/** Agent 4: Deterministic TypeScript validator enforcing micro-task sizing (15-30m) and daily cognitive cap (<=150m). */
export function validateAndNormalizeRoadmap(
  roadmap: Roadmap,
  options: {
    dailyHoursLimit?: number;
    hardDeadline?: string;
    modulesSummary?: ExtractedModule[];
  }
): Roadmap {
  const maxDailyMinutes = Math.min(Math.round((options.dailyHoursLimit || 2) * 60), 150);
  const startDate = new Date();
  let totalTasks = 0;

  const normalizedSchedules: DailySchedule[] = roadmap.dailySchedules.map((day, index) => {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + index);
    const dateStr = dayDate.toISOString().split("T")[0];

    if (day.isRestDay) {
      return {
        dayNumber: index + 1,
        date: dateStr,
        isRestDay: true,
        totalEstimatedMinutes: 0,
        cognitiveLoadSummary: "light",
        tasks: [],
      };
    }

    const cappedTasks: RoadmapTask[] = [];
    let dayMinutes = 0;

    for (const task of day.tasks) {
      const normalizedMins = Math.max(15, Math.min(30, Math.round(task.estimatedMinutes || 25)));
      if (dayMinutes + normalizedMins > maxDailyMinutes && cappedTasks.length > 0) {
        continue;
      }

      cappedTasks.push({
        ...task,
        dayNumber: index + 1,
        date: dateStr,
        estimatedMinutes: normalizedMins,
      });
      dayMinutes += normalizedMins;
      totalTasks++;
    }

    const hasDeep = cappedTasks.some((t) => t.cognitiveLoad === "deep");
    const hasModerate = cappedTasks.some((t) => t.cognitiveLoad === "moderate");
    const loadSummary: CognitiveLoad = hasDeep ? "deep" : hasModerate ? "moderate" : "light";

    return {
      dayNumber: index + 1,
      date: dateStr,
      isRestDay: cappedTasks.length === 0,
      totalEstimatedMinutes: dayMinutes,
      cognitiveLoadSummary: loadSummary,
      tasks: cappedTasks,
    };
  });

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + Math.max(0, normalizedSchedules.length - 1));

  const activeDays = normalizedSchedules.filter((d) => !d.isRestDay);
  const totalMinutes = activeDays.reduce((acc, d) => acc + d.totalEstimatedMinutes, 0);
  const avgMins = activeDays.length > 0 ? totalMinutes / activeDays.length : 0;
  const restCount = normalizedSchedules.filter((d) => d.isRestDay).length;

  const riskScore = Math.max(
    12,
    Math.min(90, Math.round((avgMins / 150) * 55 + (restCount === 0 ? 25 : 0)))
  );

  const burnoutMetrics: BurnoutMetrics = {
    riskScore,
    riskLevel: riskScore >= 70 ? "high" : riskScore >= 40 ? "moderate" : "low",
    weeklyPeakHours: Math.round((totalMinutes / 60) * 10) / 10,
    recommendedRestDays: Math.max(1, restCount),
    burnoutFactors:
      roadmap.burnoutMetrics?.burnoutFactors?.length > 0
        ? roadmap.burnoutMetrics.burnoutFactors
        : ["Deterministic validator confirmed <=150 min/day cap with 15-30m micro-tasks."],
  };

  return {
    ...roadmap,
    startDate: startDate.toISOString().split("T")[0],
    targetEndDate: options.hardDeadline || endDate.toISOString().split("T")[0],
    totalDays: normalizedSchedules.length,
    totalTasks,
    dailySchedules: normalizedSchedules,
    burnoutMetrics,
    modulesSummary: options.modulesSummary ?? roadmap.modulesSummary,
    updatedAt: new Date().toISOString(),
  };
}

/** Agent 2 & 4: Decompose extracted modules into validated 15-30 minute anti-burnout micro-tasks. */
export async function planMicroTasksWithAgent(
  extraction: SyllabusExtraction,
  options: {
    syllabusText?: string;
    dailyHoursLimit?: number;
    includeRestDays?: boolean;
  }
): Promise<Roadmap> {
  const apiKey = process.env.GEMINI_API_KEY;
  const dailyHoursLimit = options.dailyHoursLimit || 2;
  const includeRestDays = options.includeRestDays ?? true;

  if (!apiKey) {
    const fallback = generateHeuristicRoadmap(
      options.syllabusText || extraction.modules.map((m) => `${m.title}\n${m.topics.join("\n")}`).join("\n"),
      {
        courseTitle: extraction.courseTitle,
        dailyHoursLimit,
        includeRestDays,
      }
    );
    const validated = validateAndNormalizeRoadmap(fallback, {
      dailyHoursLimit,
      hardDeadline: extraction.hardDeadline,
      modulesSummary: extraction.modules,
    });
    await saveRoadmapToDb(validated);
    return validated;
  }

  try {
    const systemInstruction =
      "You are Agent 2 (Micro-Task Decomposition Planner). Slice modules into crisp 15-30 minute daily study micro-tasks. Never exceed 150 minutes/day. Include periodic rest days. Return ONLY valid JSON.";

    const prompt = `Build a 7-to-14 day micro-task roadmap for "${extraction.courseTitle}".
Daily study cap: ${Math.min(dailyHoursLimit * 60, 150)} minutes/day.
Include rest days: ${includeRestDays}.
Extracted Modules:
${JSON.stringify(extraction.modules)}

Return JSON:
{
  "dailySchedules": [
    {
      "dayNumber": 1,
      "isRestDay": false,
      "tasks": [
        {
          "title": "Actionable 15-30m micro-task",
          "description": "Concrete focus goal",
          "moduleTitle": "Module name",
          "estimatedMinutes": 25,
          "cognitiveLoad": "light",
          "category": "reading",
          "subtasks": ["Step 1", "Step 2"]
        }
      ]
    }
  ],
  "burnoutFactors": ["Brief pacing observation"]
}`;

    const rawText = await generateJsonWithGemini(apiKey, systemInstruction, prompt, 0.2);
    const parsed = JSON.parse(rawText);

    const schedules: DailySchedule[] = (parsed.dailySchedules || []).map(
      (ds: Record<string, unknown>, idx: number) => {
        const rawTasks = Array.isArray(ds.tasks) ? ds.tasks : [];
        const tasks: RoadmapTask[] = rawTasks.map((t: Record<string, unknown>) => ({
          id: generateId("task"),
          title: String(t.title || "Focused Micro-Session"),
          description: String(t.description || ""),
          moduleTitle: t.moduleTitle ? String(t.moduleTitle) : undefined,
          dayNumber: idx + 1,
          date: new Date().toISOString().split("T")[0],
          estimatedMinutes: Number(t.estimatedMinutes) || 25,
          cognitiveLoad: (["light", "moderate", "deep"].includes(String(t.cognitiveLoad))
            ? String(t.cognitiveLoad)
            : "moderate") as CognitiveLoad,
          category: ([
            "reading",
            "practice",
            "research",
            "writing",
            "coding",
            "review",
          ].includes(String(t.category))
            ? String(t.category)
            : "reading") as TaskCategory,
          isCompleted: false,
          subtasks: (Array.isArray(t.subtasks) ? t.subtasks : ["Complete focused sprint"]).map(
            (st: unknown) => ({
              id: generateId("subtask"),
              title: typeof st === "string" ? st : "Complete micro-step",
              isCompleted: false,
            })
          ),
        }));

        return {
          dayNumber: idx + 1,
          date: new Date().toISOString().split("T")[0],
          isRestDay: Boolean(ds.isRestDay),
          totalEstimatedMinutes: 0,
          cognitiveLoadSummary: "moderate",
          tasks,
        };
      }
    );

    const draft: Roadmap = {
      id: generateId("roadmap"),
      courseTitle: extraction.courseTitle,
      courseCode: extraction.courseCode,
      startDate: new Date().toISOString().split("T")[0],
      targetEndDate: extraction.hardDeadline || new Date().toISOString().split("T")[0],
      totalDays: schedules.length,
      totalTasks: 0,
      completedTasks: 0,
      dailySchedules: schedules,
      burnoutMetrics: {
        riskScore: 22,
        riskLevel: "low",
        weeklyPeakHours: 8,
        recommendedRestDays: 2,
        burnoutFactors: Array.isArray(parsed.burnoutFactors)
          ? parsed.burnoutFactors.map(String)
          : ["Micro-tasks calibrated to 15-30 minutes."],
      },
      modulesSummary: extraction.modules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validated = validateAndNormalizeRoadmap(draft, {
      dailyHoursLimit,
      hardDeadline: extraction.hardDeadline,
      modulesSummary: extraction.modules,
    });
    await saveRoadmapToDb(validated);
    return validated;
  } catch {
    const fallback = generateHeuristicRoadmap(
      options.syllabusText || extraction.modules.map((m) => `${m.title}\n${m.topics.join("\n")}`).join("\n"),
      {
        courseTitle: extraction.courseTitle,
        dailyHoursLimit,
        includeRestDays,
      }
    );
    const validated = validateAndNormalizeRoadmap(fallback, {
      dailyHoursLimit,
      hardDeadline: extraction.hardDeadline,
      modulesSummary: extraction.modules,
    });
    await saveRoadmapToDb(validated);
    return validated;
  }
}

async function fetchOpenAlexForTopic(roadmapId: string, topic: string): Promise<CuratedResource[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(
      topic
    )}&filter=is_oa:true&per-page=2&select=id,title,publication_year,open_access,doi,primary_location`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];

    const data = await res.json();
    const works = Array.isArray(data.results) ? data.results : [];

    return works
      .map((work: Record<string, unknown>): CuratedResource | null => {
        const oa = work.open_access as Record<string, unknown> | undefined;
        const primaryLoc = work.primary_location as Record<string, unknown> | undefined;
        const resolvedUrl =
          (oa?.oa_url as string) ||
          (primaryLoc?.landing_page_url as string) ||
          (work.doi as string);

        if (!resolvedUrl || !work.title) return null;

        return {
          id: generateId("res"),
          roadmapId,
          moduleTopic: topic,
          title: String(work.title),
          url: String(resolvedUrl),
          sourceType: "openalex",
          year: typeof work.publication_year === "number" ? work.publication_year : undefined,
        };
      })
      .filter((item: CuratedResource | null): item is CuratedResource => item !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWikipediaForTopic(roadmapId: string, topic: string): Promise<CuratedResource[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      topic
    )}&limit=1&namespace=0&format=json`;
    const res = await fetch(searchUrl, { signal: controller.signal });
    if (!res.ok) return [];

    const data = await res.json();
    const titles: string[] = Array.isArray(data[1]) ? data[1] : [];
    const descriptions: string[] = Array.isArray(data[2]) ? data[2] : [];
    const urls: string[] = Array.isArray(data[3]) ? data[3] : [];

    if (!titles[0] || !urls[0]) return [];

    return [
      {
        id: generateId("res"),
        roadmapId,
        moduleTopic: topic,
        title: `${titles[0]} (Concept Reference)`,
        url: urls[0],
        sourceType: "wikipedia",
        summary: descriptions[0] || undefined,
      },
    ];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Agent 3: Fetch verified Open-Access scholarly papers (OpenAlex) and encyclopedic summaries (Wikipedia). */
export async function curateResourcesWithAgent(
  roadmapId: string,
  modules: ExtractedModule[]
): Promise<CuratedResource[]> {
  const topics = modules
    .slice(0, 4)
    .map((m) => {
      const cleanTitle = m.title.replace(/^(week|module|chapter|unit)\s*\d+\s*[:-]?\s*/i, "").trim();
      return cleanTitle || m.topics[0] || m.title;
    })
    .filter(Boolean);

  const uniqueTopics = Array.from(new Set(topics)).slice(0, 4);

  const results = await Promise.allSettled(
    uniqueTopics.flatMap((topic) => [
      fetchOpenAlexForTopic(roadmapId, topic),
      fetchWikipediaForTopic(roadmapId, topic),
    ])
  );

  const curated: CuratedResource[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      curated.push(...r.value);
    }
  }

  await saveCuratedResourcesToDb(roadmapId, curated);
  return curated;
}
