import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerationRequest, Roadmap } from "@/shared/types/roadmap";
import { generateHeuristicRoadmap } from "./pacing.service";
import { generateId } from "@/shared/utils";

const SYSTEM_INSTRUCTION = `You are Syllaba, an expert academic strategist and learning scientist.
Your job is to break down academic course syllabi, assignment rubrics, and project guidelines into an anti-procrastination, anti-burnout daily roadmap.
Rules:
1. Divide large assignments into bite-sized daily tasks of 30 to 75 minutes.
2. Balance cognitive load: label each task as "light", "moderate", or "deep".
3. Category must be one of: "reading", "practice", "research", "writing", "coding", "review".
4. Never schedule more than 150 minutes of study in a single day.
5. Embed rest days (isRestDay: true) periodically so the student does not burn out.
6. Provide clear, actionable subtasks for every task.
7. Return ONLY valid JSON adhering to the specified schema.`;

export async function generateRoadmapWithGemini(request: GenerationRequest): Promise<Roadmap> {
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicRoadmap(request.syllabusText, {
      courseTitle: request.courseTitle,
      dailyHoursLimit: request.dailyHoursLimit,
      includeRestDays: request.includeRestDays,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const prompt = `Analyze this syllabus text and construct a step-by-step daily study roadmap.
Target course title: ${request.courseTitle || "Auto-detect"}
Target daily study limit: ${request.dailyHoursLimit || 2} hours
Include rest days: ${request.includeRestDays ?? true}

Syllabus Content:
${request.syllabusText.slice(0, 12000)}

Return JSON with this exact structure:
{
  "courseTitle": "Course Name",
  "totalDays": 14,
  "dailySchedules": [
    {
      "dayNumber": 1,
      "dateOffset": 0,
      "isRestDay": false,
      "totalEstimatedMinutes": 90,
      "cognitiveLoadSummary": "moderate",
      "tasks": [
        {
          "title": "Task title",
          "description": "Task description",
          "estimatedMinutes": 45,
          "cognitiveLoad": "moderate",
          "category": "reading",
          "subtasks": ["Subtask 1", "Subtask 2"]
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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

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
      dailyHoursLimit: request.dailyHoursLimit,
      includeRestDays: request.includeRestDays,
    });
  }
}
