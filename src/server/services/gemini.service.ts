import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationRequest, Roadmap } from "@/shared/types/roadmap";
import { generateHeuristicRoadmap } from "./pacing.service";
import { generateId } from "@/shared/utils";

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-omni-1.2-flash",
  "gemini-3.8-flash",
];

const SYSTEM_INSTRUCTION = `You are Syllaba, an expert academic strategist and learning scientist.
Your job is to break down uploaded PPT/PDF slide decks, course syllabi, and technical materials into a 100% slide-specific, anti-burnout daily study roadmap.
Strict Rules:
1. Divide material into daily tasks of 30 to 75 minutes that cite the EXACT Slide/Module number and heading from the uploaded text (e.g., "Slide 3: ReAct Loop & Utility Function").
2. Every task MUST include 3 to 4 highly specific Breakdown Steps (subtasks) that directly reference the exact definitions, technical terms, bullet points, or worked examples from that slide. NEVER output generic filler like "Subtask 1", "Summarize key takeaways", or "Review notes".
3. MANDATORY LATEX FORMULAS: Whenever a slide or concept involves an equation, complexity bound, symbolic relationship, or quantitative metric, write it using valid inline LaTeX ($...$) or block LaTeX ($$...$$) inside BOTH the task description and at least one subtask (e.g., "$E[U(s,a)] = \\sum_{s'} P(s'|s,a)R(s,a,s')$", "$\\mathcal{O}(n \\log n)$", "$L(\\theta) = \\frac{1}{N}\\sum_{i=1}^N (y_i - \\hat{y}_i)^2$"). Even for qualitative slides, formalize relationships using inline LaTeX notation (e.g., "$\\text{Input} \\longrightarrow \\text{Process} \\longrightarrow \\text{Output}$").
4. Balance cognitive load: label each task as "light", "moderate", or "deep".
5. Category must be one of: "reading", "practice", "research", "writing", "coding", "review".
6. Never schedule more than 150 minutes of study in a single day.
7. Return ONLY valid JSON adhering to the specified schema.`;

export async function generateRoadmapWithGemini(request: GenerationRequest): Promise<Roadmap> {
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY;
  const requestedDays =
    typeof request.targetDays === "number"
      ? Math.max(1, Math.min(60, Math.round(request.targetDays)))
      : 14;

  if (!apiKey) {
    return generateHeuristicRoadmap(request.syllabusText, {
      courseTitle: request.courseTitle,
      targetDays: requestedDays,
      dailyHoursLimit: request.dailyHoursLimit,
      includeRestDays: request.includeRestDays,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Analyze this uploaded PPT/PDF slide deck or syllabus text and construct a 100% content-specific daily study roadmap.
Target course title: ${request.courseTitle || "Auto-detect"}
Target total duration: ${requestedDays} days
Target daily study limit: ${request.dailyHoursLimit || 2} hours
Include rest days: ${request.includeRestDays ?? true}

CRITICAL REQUIREMENTS:
- Every task title MUST reference the exact Slide/Module number and topic from the uploaded content (e.g., "Slide 1: Pendahuluan Agentic AI & ReAct Loop").
- Every task description and its 3 to 4 subtasks MUST quote or explain the specific bullet points, definitions, mechanisms, and formulas from that slide.
- Include valid inline LaTeX math ($...$) in task descriptions and subtasks for all equations, variables, complexity bounds, or formal relationships.
- Respond in the same language (Indonesian or English) as the uploaded slide content.

Uploaded Slide / Syllabus Content:
${request.syllabusText.slice(0, 15000)}

Return JSON with this exact structure (dailySchedules MUST contain exactly ${requestedDays} entries):
{
  "courseTitle": "Course Name",
  "totalDays": ${requestedDays},
  "dailySchedules": [
    {
      "dayNumber": 1,
      "dateOffset": 0,
      "isRestDay": false,
      "totalEstimatedMinutes": 90,
      "cognitiveLoadSummary": "moderate",
      "tasks": [
        {
          "title": "Slide 1: Exact Topic Title",
          "moduleTitle": "Slide 1: Slide Heading",
          "description": "Specific explanation citing slide concepts and inline LaTeX formula $E[U(s,a)] = \\sum_{s'} P(s'|s,a)R(s,a,s')$",
          "estimatedMinutes": 45,
          "cognitiveLoad": "moderate",
          "category": "reading",
          "subtasks": [
            "Slide 1 — Bedah definisi spesifik dan komponen utama dari slide",
            "Turunkan dan verifikasi persamaan $E[U(s,a)] = \\sum_{s'} P(s'|s,a)R(s,a,s')$ pada contoh kasus slide",
            "Uji pemahaman mekanisme teknis melalui latihan aplikasi konsep Slide 1"
          ]
        }
      ]
    }
  ],
  "burnoutMetrics": {
    "riskScore": 25,
    "riskLevel": "low",
    "weeklyPeakHours": 10.5,
    "recommendedRestDays": 2,
    "burnoutFactors": ["Analysis factor"]
  }
}`;

    let parsed: any = null;
    let lastError: unknown = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        parsed = JSON.parse(responseText);
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (!parsed) {
      throw lastError || new Error("All Gemini models failed");
    }

    const startDate = new Date();
    const totalDays = parsed.totalDays || parsed.dailySchedules?.length || 14;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (totalDays - 1));

    let totalTasksCount = 0;

    const dailySchedules = (parsed.dailySchedules || []).map((ds: any, idx: number) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + idx);
      const dateStr = d.toISOString().split("T")[0];

      const tasks = (ds.tasks || []).map((t: any) => {
        totalTasksCount++;
        return {
          id: generateId("task"),
          title: t.title || "Study Session",
          description: t.description || "",
          dayNumber: idx + 1,
          date: dateStr,
          estimatedMinutes: Number(t.estimatedMinutes) || 45,
          cognitiveLoad: t.cognitiveLoad || "moderate",
          category: t.category || "reading",
          isCompleted: false,
          subtasks: (t.subtasks || []).map((st: string) => ({
            id: generateId("subtask"),
            title: typeof st === "string" ? st : (st as any).title || "Step",
            isCompleted: false,
          })),
        };
      });

      return {
        dayNumber: idx + 1,
        date: dateStr,
        isRestDay: Boolean(ds.isRestDay),
        totalEstimatedMinutes: Number(ds.totalEstimatedMinutes) || tasks.reduce((sum: number, cur: any) => sum + cur.estimatedMinutes, 0),
        cognitiveLoadSummary: ds.cognitiveLoadSummary || "moderate",
        tasks,
      };
    });

    return {
      id: generateId("roadmap"),
      courseTitle: parsed.courseTitle || request.courseTitle || "Course Study Roadmap",
      startDate: startDate.toISOString().split("T")[0],
      targetEndDate: endDate.toISOString().split("T")[0],
      totalDays,
      totalTasks: totalTasksCount,
      completedTasks: 0,
      dailySchedules,
      burnoutMetrics: parsed.burnoutMetrics || {
        riskScore: 25,
        riskLevel: "low",
        weeklyPeakHours: 8,
        recommendedRestDays: 2,
        burnoutFactors: ["Automated balanced scheduling applied."],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    return generateHeuristicRoadmap(request.syllabusText, {
      courseTitle: request.courseTitle,
      targetDays: requestedDays,
      dailyHoursLimit: request.dailyHoursLimit,
      includeRestDays: request.includeRestDays,
    });
  }
}
