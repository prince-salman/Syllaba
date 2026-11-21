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

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-omni-1.2-flash",
  "gemini-3.8-flash",
];
const AGENT_TIMEOUT_MS = 16000;

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

function splitLineToPoints(rawLine: string): string[] {
  const cleaned = rawLine.replace(/^[-*•●▪▸\d.)]+\s*/, "").trim();
  if (!cleaned) return [];
  if (cleaned.length <= 160) return [cleaned];
  return cleaned
    .split(/(?:[•●▪▸;|]|\.\s+)/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 3)
    .slice(0, 8);
}

function parseSyllabusFallback(syllabusText: string, courseTitle?: string): SyllabusExtraction {
  const lines = syllabusText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const detectedTitle =
    courseTitle ||
    lines
      .map((l) => l.replace(/^(slide|page|halaman)\s*\d+\s*[:-]?\s*/i, "").trim())
      .find((line) => line.length > 3 && line.length < 85 && !line.includes("http")) ||
    "Academic Course Plan";

  const modules: ExtractedModule[] = [];
  const headingPattern =
    /^(slide\s*\d+|page\s*\d+|halaman\s*\d+|week\s*\d+|minggu\s*\d+|pertemuan\s*\d+|module\s*\d+|modul\s*\d+|chapter\s*\d+|bab\s*\d+|unit\s*\d+|part\s*\d+|bagian\s*\d+|topic\s*\d+|topik\s*\d+|sesi\s*\d+|section\s*\d+)\b/i;

  let current: ExtractedModule | null = null;

  for (const line of lines) {
    if (headingPattern.test(line)) {
      if (current && (current.topics.length > 0 || current.title)) {
        modules.push(current);
      }
      current = {
        title: line.slice(0, 100),
        topics: [],
        estimatedHours: 2,
      };
      continue;
    }

    const points = splitLineToPoints(line);
    if (points.length === 0) continue;

    if (!current) {
      current = {
        title: points[0].slice(0, 90),
        topics: points.slice(1, 9),
        estimatedHours: 2,
      };
      continue;
    }

    if (/^(slide|page|halaman)\s*\d+$/i.test(current.title) && points.length > 0) {
      current.title = `${current.title}: ${points[0].slice(0, 80)}`;
      for (const pt of points.slice(1)) {
        if (current.topics.length < 8) current.topics.push(pt);
      }
    } else {
      for (const pt of points) {
        if (current.topics.length < 8) current.topics.push(pt);
      }
    }
  }

  if (current && (current.topics.length > 0 || current.title)) {
    modules.push(current);
  }

  for (const mod of modules) {
    if (mod.topics.length === 0) {
      const topicCore =
        mod.title.replace(/^(slide|page|halaman)\s*\d+\s*[:-]?\s*/i, "").trim() ||
        mod.title;
      mod.topics.push(topicCore);
    }
  }

  if (modules.length === 0) {
    const fallbackTopics = lines.flatMap(splitLineToPoints).slice(0, 8);
    modules.push({
      title: detectedTitle,
      topics: fallbackTopics.length > 0 ? fallbackTopics : [detectedTitle],
      estimatedHours: 3,
    });
  }

  return {
    courseTitle: detectedTitle,
    modules: modules.slice(0, 16),
  };
}

/** Agent 1: Extract structured modules, topics, weights, and hard deadlines from raw syllabus or PPT slide text. */
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
      "You are Agent 1 (PPT & Syllabus Content Extractor). Extract the exact slide-by-slide or section-by-section academic structure, preserving verbatim slide titles, technical concepts, definitions, formulas, case studies, and bullet points from the uploaded PPT or document. Never invent generic topics. Return ONLY valid JSON.";

    const prompt = `Extract the detailed, specific slide/module breakdown from this uploaded presentation (PPT), PDF, or syllabus document.
Provided courseTitle hint: ${courseTitle || "Auto-detect"}
Document / Slide Content:
${syllabusText.slice(0, 14000)}

Rules:
1. Group content by the actual slides or sections in the document (e.g., "Slide 1-2: <Exact Slide Heading>" or "Slide 3: <Exact Slide Heading>").
2. Each module's "topics" array MUST contain the exact specific bullet points, definitions, formulas, examples, or sub-concepts written on those slides (4 to 8 specific items per module).
3. Wrap all mathematical formulas, complexities, equations, Greek symbols, or chemical notations in inline LaTeX delimiters $...$ (for example: $T(n) = aT(n/b) + f(n)$, $O(n \\log n)$, $(4n+2)\\ \\pi$, $MRS = \\frac{MU_x}{MU_y}$).
4. Do NOT output generic placeholders like "Core concepts" or "Introduction". Use the exact terminology and language of the document.

Return JSON matching:
{
  "courseTitle": "string",
  "courseCode": "string or empty",
  "hardDeadline": "YYYY-MM-DD or empty string",
  "modules": [
    {
      "title": "Slide/Section title with exact topic",
      "topics": ["Specific concept/bullet 1 from slide", "Specific formula/example 2 from slide"],
      "weightPercentage": 15,
      "deadlineHint": "Slide group or week",
      "estimatedHours": 2
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
      modules: parsed.modules.slice(0, 16).map((m: Record<string, unknown>) => ({
        title: String(m.title || "Study Module"),
        topics: Array.isArray(m.topics) && m.topics.length > 0
          ? m.topics.map(String).slice(0, 8)
          : [String(m.title || "Specific Slide Topic")],
        weightPercentage: typeof m.weightPercentage === "number" ? m.weightPercentage : undefined,
        deadlineHint: m.deadlineHint ? String(m.deadlineHint) : undefined,
        estimatedHours: typeof m.estimatedHours === "number" ? m.estimatedHours : 2,
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
    targetDays?: number;
    dailyHoursLimit?: number;
    includeRestDays?: boolean;
    hardDeadline?: string;
    modulesSummary?: ExtractedModule[];
  }
): Roadmap {
  const maxDailyMinutes = Math.min(Math.round((options.dailyHoursLimit || 2) * 60), 150);
  const desiredDays =
    typeof options.targetDays === "number"
      ? Math.max(3, Math.min(60, Math.round(options.targetDays)))
      : undefined;
  const includeRestDays = options.includeRestDays ?? true;
  const startDate = new Date();
  let totalTasks = 0;

  let sourceSchedules = [...roadmap.dailySchedules];
  if (desiredDays) {
    if (sourceSchedules.length > desiredDays) {
      sourceSchedules = sourceSchedules.slice(0, desiredDays);
    } else if (sourceSchedules.length < desiredDays) {
      const studyDaysPool = sourceSchedules.filter((d) => !d.isRestDay && d.tasks.length > 0);
      while (sourceSchedules.length < desiredDays) {
        const nextDayNum = sourceSchedules.length + 1;
        const shouldRest = includeRestDays && nextDayNum >= 7 && nextDayNum % 7 === 0;
        if (shouldRest || studyDaysPool.length === 0) {
          sourceSchedules.push({
            dayNumber: nextDayNum,
            date: new Date().toISOString().split("T")[0],
            isRestDay: true,
            totalEstimatedMinutes: 0,
            cognitiveLoadSummary: "light",
            tasks: [],
          });
        } else {
          const templateDay = studyDaysPool[(nextDayNum - 1) % studyDaysPool.length];
          const templateTask = templateDay.tasks[0];
          const preservedSubtasks =
            templateTask.subtasks && templateTask.subtasks.length > 0
              ? templateTask.subtasks.map((st) => ({
                  id: generateId("subtask"),
                  title: st.title,
                  isCompleted: false,
                }))
              : [
                  {
                    id: generateId("subtask"),
                    title: `[${templateTask.moduleTitle || roadmap.courseTitle}] Evaluasi penguasaan materi: "${templateTask.title}" ($\\eta \\ge 90\\%$)`,
                    isCompleted: false,
                  },
                ];
          sourceSchedules.push({
            dayNumber: nextDayNum,
            date: new Date().toISOString().split("T")[0],
            isRestDay: false,
            totalEstimatedMinutes: 25,
            cognitiveLoadSummary: "moderate",
            tasks: [
              {
                id: generateId("task"),
                title: `Pendalaman & Sintesis: ${templateTask.title}`,
                description:
                  templateTask.description ||
                  `Evaluasi mendalam materi ${templateTask.moduleTitle || roadmap.courseTitle} ($\\eta_{\\text{target}} = 100\\%$).`,
                moduleTitle: templateTask.moduleTitle,
                dayNumber: nextDayNum,
                date: new Date().toISOString().split("T")[0],
                estimatedMinutes: 25,
                cognitiveLoad: "moderate",
                category: "review",
                isCompleted: false,
                subtasks: preservedSubtasks,
              },
            ],
          });
        }
      }
    }
  }

  const normalizedSchedules: DailySchedule[] = sourceSchedules.map((day, index) => {
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
    targetEndDate:
      desiredDays ? endDate.toISOString().split("T")[0] : options.hardDeadline || endDate.toISOString().split("T")[0],
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
    targetDays?: number;
    dailyHoursLimit?: number;
    includeRestDays?: boolean;
  }
): Promise<Roadmap> {
  const apiKey = process.env.GEMINI_API_KEY;
  const targetDays =
    typeof options.targetDays === "number"
      ? Math.max(3, Math.min(60, Math.round(options.targetDays)))
      : 14;
  const dailyHoursLimit = options.dailyHoursLimit || 2;
  const includeRestDays = options.includeRestDays ?? true;

  if (!apiKey) {
    const fallback = generateHeuristicRoadmap(
      options.syllabusText || extraction.modules.map((m) => `${m.title}\n${m.topics.join("\n")}`).join("\n"),
      {
        courseTitle: extraction.courseTitle,
        targetDays,
        dailyHoursLimit,
        includeRestDays,
      }
    );
    const validated = validateAndNormalizeRoadmap(fallback, {
      targetDays,
      dailyHoursLimit,
      includeRestDays,
      hardDeadline: extraction.hardDeadline,
      modulesSummary: extraction.modules,
    });
    await saveRoadmapToDb(validated);
    return validated;
  }

  try {
    const systemInstruction =
      "You are Agent 2 (Slide-Specific Micro-Task Decomposition Planner). Slice the uploaded PPT slides or syllabus modules into hyper-specific 15-30 minute daily study micro-tasks. Every task title, description, moduleTitle, and subtask MUST directly quote and teach the exact slide headings, bullet points, definitions, formulas, and examples from the uploaded document. Never use generic placeholders. Never exceed 150 minutes/day. Return ONLY valid JSON.";

    const rawSlideContext = (options.syllabusText || "").slice(0, 12000);

    const prompt = `Build an exact ${targetDays}-day micro-task roadmap for "${extraction.courseTitle}".
You MUST return exact ${targetDays} entries in dailySchedules (dayNumber 1 through ${targetDays}).
Daily study cap: ${Math.min(dailyHoursLimit * 60, 150)} minutes/day.
Include rest days: ${includeRestDays}.

Extracted Slide / Module Structure:
${JSON.stringify(extraction.modules)}

Raw Uploaded PPT / Document Content:
${rawSlideContext}

STRICT SPECIFICITY & LATEX RULES:
1. Every task "title" MUST name the specific slide/section and exact concept from the PPT (e.g., "Slide 3-4: Thesis Statement & Controlling Idea in Essay Introductions" or "Slide 2: Master Theorem $T(n) = aT(n/b) + f(n)$").
2. Every task "description" MUST summarize the actual bullet points, definitions, mechanisms, or formulas from those slides, and include at least 1 inline LaTeX expression $...$.
3. Every item in "subtasks" (3 to 4 detailed breakdown steps per task) MUST be a step-by-step micro-guide quoting the specific concepts, terms, formulas, and examples on that slide:
   - Step 1: Specific concept/definition quoted from the slide
   - Step 2: Technical mechanism, formula derivation, or structural relationship in inline LaTeX $...$
   - Step 3: Concrete example or practice application directly based on the slide
4. Format ALL mathematical formulas, equations, asymptotic bounds, Greek symbols, chemical notations, or structural models in inline LaTeX delimiters $...$ (e.g. $O(n \\log n)$, $\\frac{\\partial U}{\\partial x}$, $(4n+2)\\ \\pi$, or for writing/qualitative slides: $\\text{Thesis} = \\text{Topic} + \\text{Controlling Idea}$, $\\text{Essay} = \\text{Intro} + \\sum_{i=1}^{n} \\text{Body}_i + \\text{Conclusion}$).
5. Distribute the slides progressively from Day 1 to Day ${targetDays}. Never write generic text like "Step 1", "Read chapter", or "Complete focused sprint".

Return JSON:
{
  "dailySchedules": [
    {
      "dayNumber": 1,
      "isRestDay": false,
      "tasks": [
        {
          "title": "Specific slide/topic micro-task title from PPT",
          "description": "Concrete explanation of the exact slide bullet points to master with inline LaTeX $...$",
          "moduleTitle": "Exact Slide/Module title",
          "estimatedMinutes": 25,
          "cognitiveLoad": "light",
          "category": "reading",
          "subtasks": ["Specific point 1 from slide", "Specific mechanism/formula 2 with $...$ from slide", "Specific application 3 from slide"]
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
        const fallbackMod =
          extraction.modules[idx % Math.max(1, extraction.modules.length)];
        const tasks: RoadmapTask[] = rawTasks.map((t: Record<string, unknown>) => {
          const modTitle = t.moduleTitle
            ? String(t.moduleTitle)
            : fallbackMod?.title || extraction.courseTitle;
          const rawSubtasks = Array.isArray(t.subtasks)
            ? t.subtasks.filter((st) => typeof st === "string" && st.trim().length > 0)
            : [];
          const resolvedSubtasks =
            rawSubtasks.length > 0
              ? rawSubtasks.map(String)
              : (fallbackMod?.topics || [String(t.title || extraction.courseTitle)]).map(
                  (tp, sIdx) =>
                    `[${modTitle} · Langkah ${sIdx + 1}] Bedah & kuasai poin: "${tp}" ($w_{${
                      sIdx + 1
                    }} = \\frac{1}{${Math.max(1, fallbackMod?.topics?.length || 1)}}$)`
                );

          return {
            id: generateId("task"),
            title: String(t.title || `${modTitle}: ${fallbackMod?.topics?.[0] || "Materi Inti"}`),
            description: String(
              t.description ||
                `Bedah materi spesifik ${modTitle}: ${(fallbackMod?.topics || []).join(" · ")}`
            ),
            moduleTitle: modTitle,
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
            subtasks: resolvedSubtasks.map((stTitle) => ({
              id: generateId("subtask"),
              title: stTitle,
              isCompleted: false,
            })),
          };
        });

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
      targetDays,
      dailyHoursLimit,
      includeRestDays,
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
        targetDays,
        dailyHoursLimit,
        includeRestDays,
      }
    );
    const validated = validateAndNormalizeRoadmap(fallback, {
      targetDays,
      dailyHoursLimit,
      includeRestDays,
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
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SyllabaAcademicCurator/1.0 (https://syllaba.xyz; contact@syllaba.xyz)" },
    });
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
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "SyllabaAcademicCurator/1.0 (https://syllaba.xyz; contact@syllaba.xyz)" },
    });
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
    .slice(0, 6)
    .map((m) => {
      const cleanTitle = m.title
        .replace(
          /^(slide|page|halaman|week|minggu|pertemuan|module|modul|chapter|bab|unit|topic|topik|part|bagian|sesi|section)\s*\d+(?:\s*[-–]\s*\d+)?\s*[:-]?\s*/i,
          ""
        )
        .trim();
      const firstSpecificTopic = (m.topics?.[0] || "")
        .replace(/^[-*•●▪▸\d.)]+\s*/, "")
        .slice(0, 70)
        .trim();

      if (cleanTitle && cleanTitle.length > 4) {
        return firstSpecificTopic &&
          !cleanTitle.toLowerCase().includes(firstSpecificTopic.toLowerCase().slice(0, 12))
          ? `${cleanTitle} ${firstSpecificTopic}`.slice(0, 90)
          : cleanTitle;
      }
      return firstSpecificTopic || m.title;
    })
    .filter(Boolean);

  const uniqueTopics = Array.from(new Set(topics)).slice(0, 5);

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
