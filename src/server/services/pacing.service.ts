import { Roadmap, DailySchedule, RoadmapTask, BurnoutMetrics, CognitiveLoad, TaskCategory } from "@/shared/types/roadmap";
import { generateId } from "@/shared/utils";

interface SyllabusSection {
  title: string;
  items: string[];
}

function parseSyllabusLines(text: string): { courseTitle: string; sections: SyllabusSection[] } {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let courseTitle = "Academic Study Plan";

  const titleCandidates = lines.slice(0, 5);
  for (const line of titleCandidates) {
    if (/^(course|syllabus|cs\s*\d+|chem\s*\d+|math\s*\d+|econ\s*\d+|bio\s*\d+|eng\s*\d+|introduction|principles|advanced)/i.test(line)) {
      courseTitle = line.replace(/^(course\s*:?|syllabus\s*:?)/i, "").trim();
      break;
    } else if (line.length > 5 && line.length < 60 && !line.includes("http")) {
      courseTitle = line;
      break;
    }
  }

  const sections: SyllabusSection[] = [];
  let currentSection: SyllabusSection = { title: "Foundations & Orientation", items: [] };

  const sectionPattern = /^(week\s*\d+|module\s*\d+|chapter\s*\d+|unit\s*\d+|part\s*\d+|topic\s*\d+|assignment\s*\d+|exam|project)/i;

  for (const line of lines) {
    if (sectionPattern.test(line)) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: line, items: [] };
    } else if (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)) {
      const cleanItem = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (cleanItem.length > 3) {
        currentSection.items.push(cleanItem);
      }
    } else if (line.length > 10 && line.length < 150) {
      currentSection.items.push(line);
    }
  }

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    sections.push({
      title: "Core Module Breakdown",
      items: [
        "Review syllabus and course requirements",
        "Read foundational textbook chapters",
        "Complete problem sets and analytical exercises",
        "Synthesize notes into comprehensive summary",
        "Self-assessment and milestone review",
      ],
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
  const targetDays = Math.max(7, Math.min(30, options?.targetDays || 14));
  const dailyMinutesCap = (options?.dailyHoursLimit || 2) * 60;
  const includeRestDays = options?.includeRestDays ?? true;

  const rawTasks: Array<{
    title: string;
    description: string;
    category: TaskCategory;
    load: CognitiveLoad;
    minutes: number;
    subtasks: string[];
  }> = [];

  sections.forEach((section) => {
    rawTasks.push({
      title: `Conceptual Foundation: ${section.title}`,
      description: `Understand the core definitions, theoretical frameworks, and essential reading for ${section.title}.`,
      category: "reading",
      load: "light",
      minutes: 45,
      subtasks: [
        "Skim main chapter headings and summary",
        "Annotate key terms and formulas",
        "Note down 2 clarifying questions",
      ],
    });

    if (section.items.length > 0) {
      const primaryItems = section.items.slice(0, 3).join(", ");
      rawTasks.push({
        title: `Deep Application: ${section.title}`,
        description: `Execute practical exercises and assigned deliverables: ${primaryItems}`,
        category: "practice",
        load: "deep",
        minutes: 75,
        subtasks: [
          "Set up workspace and required tools",
          "Work through step-by-step problem sets",
          "Check solution reasoning against examples",
        ],
      });
    }

    rawTasks.push({
      title: `Synthesis & Active Recall: ${section.title}`,
      description: `Test retention with active recall flashcards, practice problems, or summary synthesis without checking notes.`,
      category: "review",
      load: "moderate",
      minutes: 40,
      subtasks: [
        "Create concise 1-page formula or concept cheat sheet",
        "Solve 3 practice questions under timed conditions",
        "Review mistakes and adjust understanding",
      ],
    });
  });

  const startDate = new Date();
  const dailySchedules: DailySchedule[] = [];
  let taskIndex = 0;
  let totalTasks = 0;

  for (let day = 1; day <= targetDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (day - 1));
    const dateStr = dayDate.toISOString().split("T")[0];

    const isRestDay = includeRestDays && (day % 7 === 0 || (targetDays > 10 && day % 4 === 0 && taskIndex > 4));

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

    while (taskIndex < rawTasks.length && currentDayMinutes + rawTasks[taskIndex].minutes <= dailyMinutesCap) {
      const t = rawTasks[taskIndex];
      const taskId = generateId("task");

      dayTasks.push({
        id: taskId,
        title: t.title,
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

    if (dayTasks.length === 0 && taskIndex < rawTasks.length) {
      const t = rawTasks[taskIndex];
      dayTasks.push({
        id: generateId("task"),
        title: t.title,
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
