import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ExamEssayQuestion,
  ExamMultipleChoiceQuestion,
  ExamStage,
  ExamSubmission,
  MilestoneExam,
  RoadmapTask,
} from "@/shared/types/roadmap";
import { generateId } from "@/shared/utils";

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-omni-1.2-flash",
  "gemini-3.8-flash",
];

function detectIndonesianText(text: string): boolean {
  const sample = text.toLowerCase();
  const idMarkers = [
    " yang ",
    " dan ",
    " pada ",
    " untuk ",
    " dengan ",
    " dari ",
    " adalah ",
    " konsep ",
    " analisis ",
    " rumus ",
    " materi ",
  ];
  let hits = 0;
  for (const m of idMarkers) {
    if (sample.includes(m)) hits++;
  }
  return hits >= 2;
}

function buildFallbackExam(
  courseTitle: string,
  stage: ExamStage,
  triggerDayNumber: number,
  tasks: RoadmapTask[],
  language?: string
): MilestoneExam {
  const combinedText = `${courseTitle} ${tasks.map((t) => `${t.title} ${t.description}`).join(" ")}`;
  const isId = language ? language === "id" : detectIndonesianText(combinedText);

  const sourceTasks =
    tasks.length > 0
      ? tasks
      : [
          {
            id: "fallback-1",
            title: `Slide 1: ${courseTitle}`,
            moduleTitle: `Slide 1: ${courseTitle}`,
            description: isId
              ? `Analisis konsep inti dan hubungan formal $\\text{Input} \\longrightarrow \\text{Proses} \\longrightarrow \\text{Output}$ pada ${courseTitle}.`
              : `Analyze core concepts and formal mapping $\\text{Input} \\longrightarrow \\text{Process} \\longrightarrow \\text{Output}$ in ${courseTitle}.`,
            dayNumber: 1,
            date: new Date().toISOString().split("T")[0],
            estimatedMinutes: 45,
            cognitiveLoad: "moderate" as const,
            category: "reading" as const,
            isCompleted: false,
            subtasks: [],
          },
        ];

  const multipleChoice: ExamMultipleChoiceQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    const task = sourceTasks[i % sourceTasks.length];
    const nextTask = sourceTasks[(i + 1) % sourceTasks.length];
    const slideRef = task.moduleTitle || task.title || `Slide ${i + 1}`;
    const primarySubtask =
      task.subtasks?.[i % Math.max(1, task.subtasks?.length || 1)]?.title ||
      task.description ||
      task.title;
    const correctConcept = primarySubtask.replace(/^Slide\s*\d+\s*[—:-]\s*/i, "").trim();

    const correctIdx = i % 4;
    const baseOptions: [string, string, string, string] = isId
      ? [
          `Mengabaikan ketergantungan variabel $\\Delta x \\to 0$ dan mengasumsikan sistem statis tanpa umpan balik`,
          `Hanya menerapkan aproksimasi heuristik linear $f(x) = c$ tanpa validasi parameter pada ${slideRef}`,
          `Memisahkan evaluasi metrik dari struktur utama sehingga fungsi objektif $L(\\theta)$ tidak terkonvergensi`,
          `Menghapus tahap verifikasi empiris dan menggantinya dengan asumsi konstan $\\eta = 0$`,
        ]
      : [
          `Ignoring variable dependency $\\Delta x \\to 0$ and assuming a static open-loop state without feedback`,
          `Applying only a constant linear heuristic $f(x) = c$ without parameter validation on ${slideRef}`,
          `Decoupling metric evaluation from the core architecture so the objective $L(\\theta)$ diverges`,
          `Omitting empirical verification steps and substituting a zero-efficiency assumption $\\eta = 0$`,
        ];

    const correctOption = isId
      ? `${correctConcept} sesuai prinsip dan formulasi matematis pada ${slideRef}`
      : `${correctConcept} in accordance with the formal formulation on ${slideRef}`;

    baseOptions[correctIdx] = correctOption;

    multipleChoice.push({
      id: generateId("mc"),
      number: i + 1,
      slideReference: slideRef,
      prompt: isId
        ? `Berdasarkan materi **${slideRef}** (${task.title}), pernyataan manakah yang paling tepat menjelaskan mekanisme teknis dan hubungan formal $\\mathcal{M}_{${i + 1}}$ yang dipelajari pada bagian tersebut?`
        : `Based on **${slideRef}** (${task.title}), which statement most accurately describes the technical mechanism and formal relationship $\\mathcal{M}_{${i + 1}}$ covered in this section?`,
      options: baseOptions,
      correctIndex: correctIdx,
      explanation: isId
        ? `Pada ${slideRef}, fokus utama materi adalah: ${task.description || correctConcept}. Pilihan yang benar secara langsung merepresentasikan langkah analisis dan rumus pada slide tersebut dibanding opsi pengacau dari ${nextTask.title}.`
        : `In ${slideRef}, the core technical premise is: ${task.description || correctConcept}. The correct option directly reflects the slide's analytical derivation and formula.`,
    });
  }

  const essayTask1 = sourceTasks[0];
  const essayTask2 = sourceTasks[Math.min(1, sourceTasks.length - 1)];

  const essays: ExamEssayQuestion[] = [
    {
      id: generateId("essay"),
      number: 6,
      slideReference: essayTask1.moduleTitle || essayTask1.title,
      prompt: isId
        ? `Jelaskan secara komprehensif konsep utama pada **${essayTask1.moduleTitle || essayTask1.title}** (${essayTask1.description || essayTask1.title}). Bagaimana hubungan antar komponen formal $\\text{Input} \\longrightarrow \\text{Transformasi} \\longrightarrow \\text{Evaluasi}$ bekerja pada materi slide tersebut, dan berikan contoh penerapannya!`
        : `Comprehensively explain the core mechanism in **${essayTask1.moduleTitle || essayTask1.title}** (${essayTask1.description || essayTask1.title}). How does the formal pipeline $\\text{Input} \\longrightarrow \\text{Transformation} \\longrightarrow \\text{Evaluation}$ operate in this slide, and provide a concrete application example!`,
      expectedKeywords: essayTask1.title
        .split(/[\s,:&()-]+/)
        .filter((w) => w.length >= 4)
        .slice(0, 5),
      sampleAnswer: isId
        ? `Pada ${essayTask1.title}, sistem memproses komponen utama melalui tahapan ${essayTask1.subtasks?.map((s) => s.title).join("; ") || essayTask1.description} sehingga tercapai efisiensi $\\eta \\ge 90\\%$.`
        : `In ${essayTask1.title}, the system processes key components through ${essayTask1.subtasks?.map((s) => s.title).join("; ") || essayTask1.description} achieving target convergence $\\eta \\ge 90\\%$.`,
    },
    {
      id: generateId("essay"),
      number: 7,
      slideReference: essayTask2.moduleTitle || essayTask2.title,
      prompt: isId
        ? `Berdasarkan **${essayTask2.moduleTitle || essayTask2.title}**, analisis bagaimana optimasi parameter dan evaluasi konvergensi $L(\\theta) = \\frac{1}{N}\\sum_{i=1}^{N}(y_i - \\hat{y}_i)^2$ diterapkan untuk mencegah kegagalan sistem pada studi kasus **${courseTitle}**!`
        : `Based on **${essayTask2.moduleTitle || essayTask2.title}**, analyze how parameter optimization and convergence evaluation $L(\\theta) = \\frac{1}{N}\\sum_{i=1}^{N}(y_i - \\hat{y}_i)^2$ are applied to prevent system failure in **${courseTitle}**!`,
      expectedKeywords: essayTask2.title
        .split(/[\s,:&()-]+/)
        .filter((w) => w.length >= 4)
        .slice(0, 5),
      sampleAnswer: isId
        ? `Analisis pada ${essayTask2.title} menggabungkan ${essayTask2.subtasks?.map((s) => s.title).join("; ") || essayTask2.description} untuk meminimalkan galat $(y_i - \\hat{y}_i)^2$.`
        : `The analysis in ${essayTask2.title} integrates ${essayTask2.subtasks?.map((s) => s.title).join("; ") || essayTask2.description} to minimize the error term $(y_i - \\hat{y}_i)^2$.`,
    },
  ];

  return {
    id: generateId(`exam_${stage}`),
    stage,
    triggerDayNumber,
    title: isId
      ? stage === "mid"
        ? `Ujian Tengah Sesi (Mid-Session Exam) — Hari 1 s/d Hari ${triggerDayNumber}`
        : `Ujian Akhir Sesi (Final Exam) — Evaluasi Komprehensif`
      : stage === "mid"
      ? `Mid-Session AI Assessment — Days 1 to ${triggerDayNumber}`
      : `Final Comprehensive AI Assessment — Full Course Mastery`,
    multipleChoice,
    essays,
  };
}

async function generateExamWithGemini(
  courseTitle: string,
  stage: ExamStage,
  triggerDayNumber: number,
  tasks: RoadmapTask[],
  language?: string
): Promise<MilestoneExam> {
  const fallback = buildFallbackExam(courseTitle, stage, triggerDayNumber, tasks, language);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;

  const taskDigest = tasks
    .map(
      (t, idx) =>
        `Task ${idx + 1} [Day ${t.dayNumber} | ${t.moduleTitle || t.title}]:\nTitle: ${t.title}\nDescription: ${t.description}\nBreakdown Steps:\n${(t.subtasks || []).map((s) => `- ${s.title}`).join("\n")}`
    )
    .join("\n\n");

  const combinedText = `${courseTitle} ${taskDigest}`;
  const isId = language ? language === "id" : detectIndonesianText(combinedText);
  const langName =
    language === "zh"
      ? "Simplified Chinese (简体中文)"
      : language === "ar"
      ? "Modern Standard Arabic (العربية)"
      : language === "es"
      ? "Spanish (Español)"
      : language === "pt"
      ? "Portuguese (Português)"
      : isId
      ? "natural academic Bahasa Indonesia (100% Indonesian, do NOT mix English)"
      : "clear academic English (100% English, do NOT mix Indonesian)";

  const systemInstruction = `You are Syllaba Academic Examiner AI.
Your job is to create a rigorous, 100% slide-specific academic assessment consisting of EXACTLY 7 questions:
- 5 Multiple Choice Questions (numbered 1 to 5, each with 4 options, correctIndex 0-3, and detailed explanation)
- 2 Analytical Essay Questions (numbered 6 to 7, with expectedKeywords and comprehensive sampleAnswer)

STRICT RULES:
1. Every single question MUST directly test the specific slide concepts, definitions, mechanisms, and mathematical formulas found in the provided study tasks.
2. Every question MUST cite the exact Slide/Module reference in "slideReference".
3. MANDATORY LATEX FORMULAS: Use valid inline LaTeX ($...$) in prompts, options, explanations, and sampleAnswers for equations, variables, functions, complexity bounds, or formal relationships.
4. CRITICAL LANGUAGE RULE: Write EVERY field (title, prompts, options, explanations, expectedKeywords, sampleAnswers) 100% in ${langName}.
5. Return ONLY valid JSON matching the schema.`;

  const prompt = `Generate the ${stage === "mid" ? "Mid-Session Exam (first half of course)" : "Final Comprehensive Exam (second half & synthesis of course)"} for:
Course: ${courseTitle}
Milestone Trigger Day: Day ${triggerDayNumber}

Covered Study Tasks & Slide Material:
${taskDigest.slice(0, 12000)}

Return JSON with this exact structure:
{
  "title": "${fallback.title}",
  "multipleChoice": [
    {
      "number": 1,
      "slideReference": "Slide 1: Exact Heading",
      "prompt": "Question text with inline LaTeX $...$",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation referencing Slide 1 and formula $...$"
    }
  ],
  "essays": [
    {
      "number": 6,
      "slideReference": "Slide 2: Exact Heading",
      "prompt": "Analytical essay question with inline LaTeX $...$",
      "expectedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "sampleAnswer": "Model answer explaining the derivation and concept with inline LaTeX $...$"
    }
  ]
}`;

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.25,
        },
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      const rawMc = Array.isArray(parsed.multipleChoice) ? parsed.multipleChoice : [];
      const rawEssays = Array.isArray(parsed.essays) ? parsed.essays : [];

      const multipleChoice: ExamMultipleChoiceQuestion[] = [];
      for (let i = 0; i < 5; i++) {
        const item = rawMc[i];
        const fb = fallback.multipleChoice[i];
        if (
          item &&
          typeof item.prompt === "string" &&
          Array.isArray(item.options) &&
          item.options.length >= 4
        ) {
          multipleChoice.push({
            id: generateId("mc"),
            number: i + 1,
            slideReference: item.slideReference || fb.slideReference,
            prompt: item.prompt,
            options: [
              String(item.options[0]),
              String(item.options[1]),
              String(item.options[2]),
              String(item.options[3]),
            ],
            correctIndex:
              typeof item.correctIndex === "number" &&
              item.correctIndex >= 0 &&
              item.correctIndex <= 3
                ? item.correctIndex
                : fb.correctIndex,
            explanation: item.explanation || fb.explanation,
          });
        } else {
          multipleChoice.push(fb);
        }
      }

      const essays: ExamEssayQuestion[] = [];
      for (let i = 0; i < 2; i++) {
        const item = rawEssays[i];
        const fb = fallback.essays[i];
        if (item && typeof item.prompt === "string") {
          essays.push({
            id: generateId("essay"),
            number: 6 + i,
            slideReference: item.slideReference || fb.slideReference,
            prompt: item.prompt,
            expectedKeywords:
              Array.isArray(item.expectedKeywords) && item.expectedKeywords.length > 0
                ? item.expectedKeywords.map(String)
                : fb.expectedKeywords,
            sampleAnswer: item.sampleAnswer || fb.sampleAnswer,
          });
        } else {
          essays.push(fb);
        }
      }

      return {
        id: generateId(`exam_${stage}`),
        stage,
        triggerDayNumber,
        title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title : fallback.title,
        multipleChoice,
        essays,
      };
    } catch {
      // Try next active Gemini model
    }
  }

  return fallback;
}

function gradeExamDeterministically(
  exam: MilestoneExam,
  mcAnswers: Record<string, number>,
  essayAnswers: Record<string, string>,
  language?: string
): ExamSubmission {
  // 5 MC questions: 14 points each = 70 points max
  let correctMcCount = 0;
  for (const q of exam.multipleChoice) {
    if (mcAnswers[q.id] === q.correctIndex) {
      correctMcCount++;
    }
  }
  const mcScore = correctMcCount * 14;

  // 2 Essay questions: 15 points each = 30 points max
  let essayScore = 0;
  const essayFeedback: Record<string, string> = {};
  const isId = language ? language === "id" : detectIndonesianText(exam.title);

  for (const eq of exam.essays) {
    const rawAns = (essayAnswers[eq.id] || "").trim();
    const wordCount = rawAns.split(/\s+/).filter(Boolean).length;
    const lowerAns = rawAns.toLowerCase();

    let matchedKeywords = 0;
    for (const kw of eq.expectedKeywords) {
      if (kw && lowerAns.includes(kw.toLowerCase())) {
        matchedKeywords++;
      }
    }

    let qPoints = 0;
    if (wordCount >= 25) qPoints += 9;
    else if (wordCount >= 12) qPoints += 6;
    else if (wordCount >= 4) qPoints += 3;

    const kwBonus = Math.min(6, matchedKeywords * 2 + (wordCount >= 15 ? 2 : 0));
    qPoints = Math.min(15, qPoints + kwBonus);
    essayScore += qPoints;

    essayFeedback[eq.id] = isId
      ? `Skor Esai: ${qPoints}/15 poin. Jawaban mencakup ${wordCount} kata dan ${matchedKeywords} konsep kunci dari ${eq.slideReference}. Referensi jawaban ideal: ${eq.sampleAnswer}`
      : `Essay Score: ${qPoints}/15 pts. Response contains ${wordCount} words and ${matchedKeywords} key concepts from ${eq.slideReference}. Model answer reference: ${eq.sampleAnswer}`;
  }

  const totalScore = Math.min(100, mcScore + essayScore);
  return {
    mcAnswers,
    essayAnswers,
    mcScore,
    essayScore,
    totalScore,
    passed: totalScore >= 60,
    essayFeedback,
    submittedAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action === "grade" ? "grade" : "generate";

    if (action === "generate") {
      const courseTitle =
        typeof body.courseTitle === "string" && body.courseTitle.trim()
          ? body.courseTitle.trim()
          : "Course Assessment";
      const stage: ExamStage = body.stage === "final" ? "final" : "mid";
      const triggerDayNumber =
        typeof body.triggerDayNumber === "number" ? body.triggerDayNumber : 1;
      const tasks: RoadmapTask[] = Array.isArray(body.tasks) ? body.tasks : [];
      const language = typeof body.language === "string" ? body.language : undefined;

      const exam = await generateExamWithGemini(
        courseTitle,
        stage,
        triggerDayNumber,
        tasks,
        language
      );
      return NextResponse.json(exam);
    }

    // action === "grade"
    const exam = body.exam as MilestoneExam | undefined;
    if (!exam || !Array.isArray(exam.multipleChoice) || !Array.isArray(exam.essays)) {
      return NextResponse.json({ error: "Valid exam object is required." }, { status: 400 });
    }

    const mcAnswers = (body.mcAnswers || {}) as Record<string, number>;
    const essayAnswers = (body.essayAnswers || {}) as Record<string, string>;
    const language = typeof body.language === "string" ? body.language : undefined;
    const submission = gradeExamDeterministically(exam, mcAnswers, essayAnswers, language);

    return NextResponse.json(submission);
  } catch {
    return NextResponse.json(
      { error: "Failed to process AI exam request." },
      { status: 500 }
    );
  }
}
