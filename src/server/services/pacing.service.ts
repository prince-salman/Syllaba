import { Roadmap, DailySchedule, RoadmapTask, BurnoutMetrics, CognitiveLoad, TaskCategory } from "@/shared/types/roadmap";
import { generateId } from "@/shared/utils";

interface SyllabusSection {
  title: string;
  items: string[];
}

function enrichWithLatex(input: string): string {
  if (!input || input.includes("$")) return input;
  return input
    .replace(/\b(O|Theta|Omega)\(n\s*log\s*n\)/gi, "$$\\$1(n \\log n)$$")
    .replace(/\b(O|Theta|Omega)\(n\^2\)/gi, "$$\\$1(n^2)$$")
    .replace(/\b(O|Theta|Omega)\(2\^n\)/gi, "$$\\$1(2^n)$$")
    .replace(/\bT\(n\)\s*=\s*a\s*T\(n\/b\)\s*\+\s*f\(n\)/gi, "$$T(n) = aT(n/b) + f(n)$$")
    .replace(/\((4n\s*\+\s*2)\)/gi, "$$(4n + 2)$$")
    .replace(/\[4\+2\]/g, "$$[4+2]$$");
}

function splitIntoSpecificPoints(rawLine: string): string[] {
  const cleaned = enrichWithLatex(rawLine.replace(/^[-*•●▪▸\d.)]+\s*/, "").trim());
  if (!cleaned) return [];
  if (cleaned.length <= 180) return [cleaned];

  return cleaned
    .split(/(?:[•●▪▸;|]|\.\s+)/)
    .map((chunk) => enrichWithLatex(chunk.trim()))
    .filter((chunk) => chunk.length > 3)
    .slice(0, 8);
}

function parseSyllabusLines(text: string): { courseTitle: string; sections: SyllabusSection[] } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let courseTitle = "Academic Study Plan";

  const sectionPattern =
    /^(slide\s*\d+|page\s*\d+|halaman\s*\d+|week\s*\d+|minggu\s*\d+|pertemuan\s*\d+|module\s*\d+|modul\s*\d+|chapter\s*\d+|bab\s*\d+|unit\s*\d+|part\s*\d+|bagian\s*\d+|topic\s*\d+|topik\s*\d+|sesi\s*\d+|section\s*\d+|assignment\s*\d+|exam|project)\b/i;

  const titleCandidates = lines.slice(0, 6);
  for (const line of titleCandidates) {
    const strippedSlidePrefix = line
      .replace(/^(slide|page|halaman)\s*\d+\s*[:-]?\s*/i, "")
      .replace(/^(course\s*:?|syllabus\s*:?)/i, "")
      .trim();
    if (strippedSlidePrefix.length > 3 && strippedSlidePrefix.length < 85 && !strippedSlidePrefix.includes("http")) {
      courseTitle = strippedSlidePrefix;
      break;
    }
  }

  const sections: SyllabusSection[] = [];
  let currentSection: SyllabusSection | null = null;

  for (const line of lines) {
    if (sectionPattern.test(line)) {
      if (currentSection && (currentSection.items.length > 0 || currentSection.title)) {
        sections.push(currentSection);
      }
      currentSection = { title: line.slice(0, 100), items: [] };
      continue;
    }

    const points = splitIntoSpecificPoints(line);
    if (points.length === 0) continue;

    if (!currentSection) {
      currentSection = {
        title: points[0].slice(0, 90),
        items: points.slice(1),
      };
      continue;
    }

    // If current section header is bare "Slide N" or "Page N", promote the first point to its title
    if (/^(slide|page|halaman)\s*\d+$/i.test(currentSection.title) && points.length > 0) {
      currentSection.title = `${currentSection.title}: ${points[0].slice(0, 80)}`;
      currentSection.items.push(...points.slice(1));
    } else {
      currentSection.items.push(...points);
    }
  }

  if (currentSection && (currentSection.items.length > 0 || currentSection.title)) {
    sections.push(currentSection);
  }

  // Ensure every section has at least one concrete item derived from its own title
  for (const sec of sections) {
    if (sec.items.length === 0) {
      const topicCore = sec.title.replace(/^(slide|page|halaman)\s*\d+\s*[:-]?\s*/i, "").trim() || sec.title;
      sec.items.push(topicCore);
    }
  }

  if (sections.length === 0) {
    const fallbackPoints = lines.flatMap(splitIntoSpecificPoints).slice(0, 12);
    sections.push({
      title: courseTitle,
      items:
        fallbackPoints.length > 0
          ? fallbackPoints
          : [`Master core concepts of ${courseTitle}`],
    });
  }

  return { courseTitle, sections };
}

export function generateHeuristicRoadmap(
  syllabusText: string,
  options?: {
    courseTitle?: string;
    targetDays?: number;
    dailyHoursLimit?: number;
    includeRestDays?: boolean;
  }
): Roadmap {
  const { courseTitle: parsedTitle, sections } = parseSyllabusLines(syllabusText);
  const courseTitle = options?.courseTitle || parsedTitle;
  const targetDays = Math.max(3, Math.min(60, Math.round(options?.targetDays || 14)));
  const dailyMinutesCap = (options?.dailyHoursLimit || 2) * 60;
  const includeRestDays = options?.includeRestDays ?? true;

  const rawTasks: Array<{
    title: string;
    moduleTitle: string;
    description: string;
    category: TaskCategory;
    load: CognitiveLoad;
    minutes: number;
    subtasks: string[];
  }> = [];

  sections.forEach((section) => {
    const cleanSectionTopic =
      section.title.replace(/^(slide|page|halaman)\s*\d+\s*[:-]?\s*/i, "").trim() ||
      section.title;
    const items = section.items.filter(Boolean);

    // Chunk slide/section bullet points into specific micro-tasks (2-3 concrete points per task)
    const chunkSize = items.length > 4 ? 3 : Math.max(1, items.length);
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const leadPoint = chunk[0] || cleanSectionTopic;
      const shortLead =
        leadPoint.length > 58 ? `${leadPoint.slice(0, 55).trim()}...` : leadPoint;

      const taskTitle =
        i === 0
          ? `${section.title}${
              shortLead.toLowerCase() !== cleanSectionTopic.toLowerCase()
                ? ` — ${shortLead}`
                : ""
            }`
          : `${section.title}: ${shortLead}`;

      const stagePrefixes = [
        `Langkah 1 (Konsep & Definisi ${section.title})`,
        `Langkah 2 (Analisis Struktur / Rumus)`,
        `Langkah 3 (Bedah Contoh & Implementasi Slide)`,
        `Langkah 4 (Latihan & Pembuktian Mandiri)`,
      ];

      const specificSubtasks =
        chunk.length >= 2
          ? [
              ...chunk.map(
                (pt, idx) => `${stagePrefixes[idx % stagePrefixes.length]}: ${pt}`
              ),
              ...(chunk.length === 2
                ? [
                    `Langkah 3 (Sintesis & Evaluasi ${cleanSectionTopic}): Rangkum keterkaitan antara "${chunk[0].slice(
                      0,
                      55
                    )}" dan "${chunk[1].slice(0, 55)}"`,
                  ]
                : []),
            ]
          : [
              `Langkah 1 (Konsep Utama ${section.title}): ${leadPoint}`,
              `Langkah 2 (Analisis Mendalam): Bedah komponen teknis, definisi, atau rumus pada "${cleanSectionTopic}"`,
              `Langkah 3 (Aplikasi & Latihan): Kerjakan contoh kasus dari ${section.title} terkait "${shortLead}"`,
            ];

      rawTasks.push({
        title: taskTitle,
        moduleTitle: section.title,
        description: `Materi spesifik dari ${section.title}: ${chunk.join(" · ")}`,
        category: i === 0 ? "reading" : "practice",
        load: chunk.length >= 3 ? "deep" : "moderate",
        minutes: 25,
        subtasks: specificSubtasks,
      });
    }

    if (items.length >= 2) {
      rawTasks.push({
        title: `Latihan & Review Materi: ${cleanSectionTopic}`,
        moduleTitle: section.title,
        description: `Evaluasi dan terapkan poin-poin dari ${section.title}: ${items
          .slice(0, 4)
          .join(" · ")}`,
        category: "review",
        load: "moderate",
        minutes: 20,
        subtasks: items.slice(0, 4).map((pt) => `Review & praktikkan konsep: ${pt}`),
      });
    }
  });

  const startDate = new Date();
  const dailySchedules: DailySchedule[] = [];
  let taskIndex = 0;
  let totalTasks = 0;

  const estimatedRestDays = includeRestDays ? Math.floor(targetDays / 7) : 0;
  const estimatedActiveDays = Math.max(1, targetDays - estimatedRestDays);
  const maxTasksPerDayByCap = Math.max(1, Math.floor(dailyMinutesCap / 20));
  const targetTasksPerActiveDay = Math.max(
    1,
    Math.min(maxTasksPerDayByCap, Math.ceil(rawTasks.length / estimatedActiveDays))
  );

  for (let day = 1; day <= targetDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (day - 1));
    const dateStr = dayDate.toISOString().split("T")[0];

    const isRestDay = includeRestDays && day % 7 === 0;

    if (isRestDay) {
      dailySchedules.push({
        dayNumber: day,
        date: dateStr,
        isRestDay: true,
        totalEstimatedMinutes: 0,
        cognitiveLoadSummary: "light",
        tasks: [],
      });
      continue;
    }

    const dayTasks: RoadmapTask[] = [];
    let currentDayMinutes = 0;

    while (
      taskIndex < rawTasks.length &&
      dayTasks.length < targetTasksPerActiveDay &&
      currentDayMinutes + rawTasks[taskIndex].minutes <= dailyMinutesCap
    ) {
      const t = rawTasks[taskIndex];
      const taskId = generateId("task");

      dayTasks.push({
        id: taskId,
        title: t.title,
        moduleTitle: t.moduleTitle,
        description: t.description,
        dayNumber: day,
        date: dateStr,
        estimatedMinutes: t.minutes,
        cognitiveLoad: t.load,
        category: t.category,
        isCompleted: false,
        subtasks: t.subtasks.map((st) => ({
          id: generateId("subtask"),
          title: st,
          isCompleted: false,
        })),
      });

      currentDayMinutes += t.minutes;
      taskIndex++;
    }

    if (dayTasks.length === 0 && rawTasks.length > 0) {
      const isSpacedReview = taskIndex >= rawTasks.length;
      const sourceTask =
        taskIndex < rawTasks.length
          ? rawTasks[taskIndex++]
          : rawTasks[(day - 1) % rawTasks.length];
      dayTasks.push({
        id: generateId("task"),
        title: isSpacedReview ? `Pendalaman & Review: ${sourceTask.title}` : sourceTask.title,
        moduleTitle: sourceTask.moduleTitle,
        description: sourceTask.description,
        dayNumber: day,
        date: dateStr,
        estimatedMinutes: isSpacedReview ? 25 : sourceTask.minutes,
        cognitiveLoad: isSpacedReview ? "moderate" : sourceTask.load,
        category: isSpacedReview ? "review" : sourceTask.category,
        isCompleted: false,
        subtasks: sourceTask.subtasks.map((st) => ({
          id: generateId("subtask"),
          title: st,
          isCompleted: false,
        })),
      });
      currentDayMinutes += isSpacedReview ? 25 : sourceTask.minutes;
    }

    const hasDeep = dayTasks.some((t) => t.cognitiveLoad === "deep");
    const hasModerate = dayTasks.some((t) => t.cognitiveLoad === "moderate");
    const dayLoad: CognitiveLoad = hasDeep ? "deep" : hasModerate ? "moderate" : "light";

    dailySchedules.push({
      dayNumber: day,
      date: dateStr,
      isRestDay: false,
      totalEstimatedMinutes: currentDayMinutes,
      cognitiveLoadSummary: dayLoad,
      tasks: dayTasks,
    });

    totalTasks += dayTasks.length;
  }

  const activeDays = dailySchedules.filter((d) => !d.isRestDay);
  const totalMinutes = activeDays.reduce((acc, d) => acc + d.totalEstimatedMinutes, 0);
  const avgDailyMinutes = activeDays.length > 0 ? totalMinutes / activeDays.length : 0;
  const deepWorkDays = activeDays.filter((d) => d.cognitiveLoadSummary === "deep").length;

  let riskScore = 20;
  if (avgDailyMinutes > 150) riskScore += 35;
  else if (avgDailyMinutes > 100) riskScore += 20;

  if (deepWorkDays > activeDays.length * 0.6) riskScore += 25;
  const restDayCount = dailySchedules.filter((d) => d.isRestDay).length;
  if (restDayCount === 0) riskScore += 20;
  else riskScore = Math.max(10, riskScore - restDayCount * 8);

  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "moderate" : "low";

  const burnoutFactors: string[] = [];
  if (avgDailyMinutes > 120) burnoutFactors.push("Daily study volume exceeds 2 hours consistently.");
  if (deepWorkDays > 5) burnoutFactors.push("High density of consecutive deep-focus sessions.");
  if (restDayCount < 2) burnoutFactors.push("Insufficient cognitive recovery intervals.");
  if (burnoutFactors.length === 0) burnoutFactors.push("Well-balanced pace with scheduled micro-breaks.");

  const burnoutMetrics: BurnoutMetrics = {
    riskScore: Math.min(95, riskScore),
    riskLevel,
    weeklyPeakHours: Math.round((totalMinutes / 60) * 10) / 10,
    recommendedRestDays: Math.max(1, Math.floor(targetDays / 6)),
    burnoutFactors,
  };

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (targetDays - 1));

  return {
    id: generateId("roadmap"),
    courseTitle,
    startDate: startDate.toISOString().split("T")[0],
    targetEndDate: endDate.toISOString().split("T")[0],
    totalDays: targetDays,
    totalTasks,
    completedTasks: 0,
    dailySchedules,
    burnoutMetrics,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function rescheduleRoadmap(currentRoadmap: Roadmap, delayDays: number): Roadmap {
  const updatedSchedules: DailySchedule[] = [];
  const shiftMs = delayDays * 24 * 60 * 60 * 1000;

  currentRoadmap.dailySchedules.forEach((schedule, index) => {
    const oldDate = new Date(schedule.date);
    const newDate = new Date(oldDate.getTime() + shiftMs);
    const newDateStr = newDate.toISOString().split("T")[0];

    const updatedTasks = schedule.tasks.map((task) => ({
      ...task,
      date: newDateStr,
      dayNumber: index + 1,
    }));

    updatedSchedules.push({
      ...schedule,
      dayNumber: index + 1,
      date: newDateStr,
      tasks: updatedTasks,
    });
  });

  const newStartDate = updatedSchedules[0]?.date || currentRoadmap.startDate;
  const newEndDate = updatedSchedules[updatedSchedules.length - 1]?.date || currentRoadmap.targetEndDate;

  return {
    ...currentRoadmap,
    startDate: newStartDate,
    targetEndDate: newEndDate,
    dailySchedules: updatedSchedules,
    updatedAt: new Date().toISOString(),
  };
}
