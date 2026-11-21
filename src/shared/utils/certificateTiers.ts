import {
  CertificateTierId,
  PptDifficultyAnalysis,
  Roadmap,
} from "@/shared/types/roadmap";

export interface CertificateTierMeta {
  id: CertificateTierId;
  name: string;
  badgeTitle: string;
  credentialTitle: string;
  minPoints: number;
  nextPoints: number | null;
  primaryHex: string;
  secondaryHex: string;
  borderClass: string;
  bgGradientClass: string;
  pillBgClass: string;
  pillTextClass: string;
  glowRgba: string;
  description: string;
}

export const CERTIFICATE_TIERS: CertificateTierMeta[] = [
  {
    id: "bronze",
    name: "Bronze",
    badgeTitle: "Bronze Tier · 10+ Poin",
    credentialTitle: "BRONZE SCHOLAR BLOCKCHAIN CREDENTIAL",
    minPoints: 10,
    nextPoints: 25,
    primaryHex: "#E09F67",
    secondaryHex: "#CD7F32",
    borderClass: "border-[#CD7F32]",
    bgGradientClass: "from-[#1C130D] via-[#110C08] to-[#1C130D]",
    pillBgClass: "bg-[#CD7F32]/20 border-[#E09F67]/50",
    pillTextClass: "text-[#F5CBA7]",
    glowRgba: "rgba(205,127,50,0.8)",
    description:
      "Diberikan setelah mengumpulkan minimal 10 Poin Kesulitan PPT & Evaluasi AI.",
  },
  {
    id: "silver",
    name: "Silver",
    badgeTitle: "Silver Tier · 25+ Poin",
    credentialTitle: "SILVER SPECIALIST BLOCKCHAIN CREDENTIAL",
    minPoints: 25,
    nextPoints: 45,
    primaryHex: "#E2E8F0",
    secondaryHex: "#94A3B8",
    borderClass: "border-[#94A3B8]",
    bgGradientClass: "from-[#131822] via-[#0C0F17] to-[#131822]",
    pillBgClass: "bg-[#94A3B8]/20 border-[#E2E8F0]/50",
    pillTextClass: "text-[#F1F5F9]",
    glowRgba: "rgba(226,232,240,0.75)",
    description:
      "Diberikan setelah mengumpulkan minimal 25 Poin Kesulitan PPT lintas modul.",
  },
  {
    id: "gold",
    name: "Gold",
    badgeTitle: "Gold Tier · 45+ Poin",
    credentialTitle: "GOLD MASTER BLOCKCHAIN CREDENTIAL",
    minPoints: 45,
    nextPoints: 70,
    primaryHex: "#FACC15",
    secondaryHex: "#CA8A04",
    borderClass: "border-[#D4AF37]",
    bgGradientClass: "from-[#17140B] via-[#0E0C07] to-[#17140B]",
    pillBgClass: "bg-[#FACC15]/20 border-[#FACC15]/50",
    pillTextClass: "text-[#FEF08A]",
    glowRgba: "rgba(250,204,21,0.85)",
    description:
      "Diberikan setelah mengumpulkan minimal 45 Poin Kesulitan PPT dengan penguasaan tinggi.",
  },
  {
    id: "platinum",
    name: "Platinum",
    badgeTitle: "Platinum Tier · 70+ Poin",
    credentialTitle: "PLATINUM VANGUARD BLOCKCHAIN CREDENTIAL",
    minPoints: 70,
    nextPoints: 100,
    primaryHex: "#38BDF8",
    secondaryHex: "#0284C7",
    borderClass: "border-[#38BDF8]",
    bgGradientClass: "from-[#0A1826] via-[#061019] to-[#0A1826]",
    pillBgClass: "bg-[#38BDF8]/20 border-[#7DD3FC]/50",
    pillTextClass: "text-[#BAE6FD]",
    glowRgba: "rgba(56,189,248,0.8)",
    description:
      "Diberikan setelah mengumpulkan minimal 70 Poin Kesulitan PPT tingkat lanjut.",
  },
  {
    id: "diamond",
    name: "Diamond",
    badgeTitle: "Diamond Tier · 100+ Poin",
    credentialTitle: "DIAMOND LUMINARY BLOCKCHAIN CREDENTIAL",
    minPoints: 100,
    nextPoints: 140,
    primaryHex: "#C084FC",
    secondaryHex: "#9333EA",
    borderClass: "border-[#C084FC]",
    bgGradientClass: "from-[#190D26] via-[#100819] to-[#190D26]",
    pillBgClass: "bg-[#C084FC]/20 border-[#E9D5FF]/50",
    pillTextClass: "text-[#F3E8FF]",
    glowRgba: "rgba(192,132,252,0.85)",
    description:
      "Diberikan setelah mengumpulkan minimal 100 Poin Kesulitan PPT dengan penguasaan komprehensif.",
  },
  {
    id: "emerald",
    name: "Emerald",
    badgeTitle: "Emerald Tier · 140+ Poin",
    credentialTitle: "EMERALD SOVEREIGN BLOCKCHAIN CREDENTIAL",
    minPoints: 140,
    nextPoints: null,
    primaryHex: "#34D399",
    secondaryHex: "#059669",
    borderClass: "border-[#10B981]",
    bgGradientClass: "from-[#071D15] via-[#04120D] to-[#071D15]",
    pillBgClass: "bg-[#10B981]/20 border-[#6EE7B7]/50",
    pillTextClass: "text-[#A7F3D0]",
    glowRgba: "rgba(16,185,129,0.85)",
    description:
      "Tingkat tertinggi Syllaba Sovereign yang diberikan setelah mencapai 140+ Poin Kesulitan PPT.",
  },
];

export function getTierMetaById(tierId: CertificateTierId): CertificateTierMeta {
  return (
    CERTIFICATE_TIERS.find((t) => t.id === tierId) || CERTIFICATE_TIERS[0]
  );
}

export function resolveTierByPoints(totalPoints: number): {
  currentTier: CertificateTierMeta;
  nextTier: CertificateTierMeta | null;
  isBronzeUnlocked: boolean;
} {
  let matched = CERTIFICATE_TIERS[0];
  for (const tier of CERTIFICATE_TIERS) {
    if (totalPoints >= tier.minPoints) {
      matched = tier;
    }
  }
  const currentIdx = CERTIFICATE_TIERS.findIndex((t) => t.id === matched.id);
  const nextTier =
    totalPoints < CERTIFICATE_TIERS[0].minPoints
      ? CERTIFICATE_TIERS[0]
      : currentIdx + 1 < CERTIFICATE_TIERS.length
      ? CERTIFICATE_TIERS[currentIdx + 1]
      : null;

  return {
    currentTier: matched,
    nextTier,
    isBronzeUnlocked: totalPoints >= CERTIFICATE_TIERS[0].minPoints,
  };
}

export function analyzeRoadmapPptDifficulty(
  roadmap: Roadmap
): PptDifficultyAnalysis {
  if (
    roadmap.difficultyAnalysis &&
    roadmap.difficultyAnalysis.difficultyPoints >= 1 &&
    roadmap.difficultyAnalysis.difficultyPoints <= 5
  ) {
    return roadmap.difficultyAnalysis;
  }

  const allTasks = roadmap.dailySchedules.flatMap((d) => d.tasks);
  const fullText = allTasks
    .map(
      (t) =>
        `${t.title} ${t.description} ${(t.subtasks || []).map((s) => s.title).join(" ")}`
    )
    .join(" ");

  const latexMatches = fullText.match(/\$[^$]+\$/g) || [];
  const latexDensityCount = latexMatches.length;
  const deepTasksCount = allTasks.filter((t) => t.cognitiveLoad === "deep").length;
  const moderateTasksCount = allTasks.filter(
    (t) => t.cognitiveLoad === "moderate"
  ).length;
  const uniqueSlidesCount = new Set(
    allTasks.map((t) => t.moduleTitle || t.title)
  ).size;

  // Compute 1-5 difficulty points deterministically from complexity signals
  let rawScore = 1;
  if (allTasks.length >= 4 || uniqueSlidesCount >= 3) rawScore += 1;
  if (latexDensityCount >= 4 || moderateTasksCount >= 3) rawScore += 1;
  if (latexDensityCount >= 10 || deepTasksCount >= 2) rawScore += 1;
  if (
    (latexDensityCount >= 16 && deepTasksCount >= 3) ||
    roadmap.burnoutMetrics?.riskScore >= 55
  ) {
    rawScore += 1;
  }

  const difficultyPoints = Math.max(1, Math.min(5, rawScore)) as
    | 1
    | 2
    | 3
    | 4
    | 5;

  const labels: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "Level 1/5 · Foundational Slide Deck (+1 Poin Base)",
    2: "Level 2/5 · Standard Academic PPT (+2 Poin Base)",
    3: "Level 3/5 · Intermediate Analytical PPT (+3 Poin Base)",
    4: "Level 4/5 · Advanced Quantitative & LaTeX PPT (+4 Poin Base)",
    5: "Level 5/5 · Expert Research-Grade PPT (+5 Poin Base)",
  };

  const rationales: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: `AI menilai PPT ini memiliki tingkat kesulitan 1/5 Poin (Foundational) dengan ${uniqueSlidesCount} bagian materi dan pengenalan konsep dasar.`,
    2: `AI menilai PPT ini memiliki tingkat kesulitan 2/5 Poin (Standard Academic) mencakup ${allTasks.length} tugas terstruktur dan ${latexDensityCount} notasi formal.`,
    3: `AI menilai PPT ini memiliki tingkat kesulitan 3/5 Poin (Intermediate Analytical) karena memuat ${uniqueSlidesCount} topik slide teknis, ${latexDensityCount} ekspresi matematika LaTeX, dan analisis studi kasus.`,
    4: `AI menilai PPT ini memiliki tingkat kesulitan 4/5 Poin (Advanced Quantitative) karena kepadatan rumus LaTeX yang tinggi (${latexDensityCount} formula), ${deepTasksCount} sesi beban kognitif mendalam (deep load), dan penurunan persamaan teknis.`,
    5: `AI menilai PPT ini memiliki tingkat kesulitan tertinggi 5/5 Poin (Expert Research-Grade) dengan ${latexDensityCount} persamaan LaTeX kompleks, ${deepTasksCount} modul analisis mendalam, dan sintesis arsitektur tingkat lanjut.`,
  };

  return {
    difficultyPoints,
    difficultyLabel: labels[difficultyPoints],
    rationale: rationales[difficultyPoints],
    latexDensityCount,
    deepTasksCount,
  };
}

export interface RoadmapPointBreakdown {
  roadmapId: string;
  courseTitle: string;
  pptDifficultyPoints: 1 | 2 | 3 | 4 | 5;
  difficultyLabel: string;
  rationale: string;
  basePptPoints: number;
  tasksCompletionPoints: number;
  midExamPoints: number;
  finalExamPoints: number;
  totalEarnedFromRoadmap: number;
  maxPossibleFromRoadmap: number;
}

export function computeRoadmapPointBreakdown(
  roadmap: Roadmap
): RoadmapPointBreakdown {
  const analysis = analyzeRoadmapPptDifficulty(roadmap);
  const d = analysis.difficultyPoints;

  // 1. Base PPT Difficulty Points (1-5 Poin analyzed by AI from the PPT)
  const basePptPoints = d;

  // 2. Daily Tasks Sequential Completion Points (0 to d Poin)
  const completionRatio =
    roadmap.totalTasks > 0
      ? Math.min(1, roadmap.completedTasks / roadmap.totalTasks)
      : 0;
  const tasksCompletionPoints = Math.round(d * completionRatio);

  // 3. Mid-Session AI Exam Mastery Points (d Poin when passed, +1 bonus for >=85)
  const midSub = roadmap.exams?.mid?.submission;
  const midExamPoints = midSub?.passed
    ? d + (midSub.totalScore >= 85 ? 1 : 0)
    : 0;

  // 4. Final-Session AI Exam Mastery Points (d Poin when passed, +1 bonus for >=85)
  const finalSub = roadmap.exams?.final?.submission;
  const finalExamPoints = finalSub?.passed
    ? d + (finalSub.totalScore >= 85 ? 1 : 0)
    : 0;

  const totalEarnedFromRoadmap =
    basePptPoints + tasksCompletionPoints + midExamPoints + finalExamPoints;
  const maxPossibleFromRoadmap = d * 4 + 2;

  return {
    roadmapId: roadmap.id,
    courseTitle: roadmap.courseTitle,
    pptDifficultyPoints: d,
    difficultyLabel: analysis.difficultyLabel,
    rationale: analysis.rationale,
    basePptPoints,
    tasksCompletionPoints,
    midExamPoints,
    finalExamPoints,
    totalEarnedFromRoadmap,
    maxPossibleFromRoadmap,
  };
}

export function computeGlobalAcademicPoints(
  currentRoadmap: Roadmap,
  historyRoadmaps: Roadmap[]
): {
  currentBreakdown: RoadmapPointBreakdown;
  allBreakdowns: RoadmapPointBreakdown[];
  totalAccumulatedPoints: number;
  currentTier: CertificateTierMeta;
  nextTier: CertificateTierMeta | null;
  isBronzeUnlocked: boolean;
} {
  const map = new Map<string, Roadmap>();
  for (const r of historyRoadmaps) {
    if (r && r.id) map.set(r.id, r);
  }
  // Always ensure currentRoadmap has the freshest state
  map.set(currentRoadmap.id, currentRoadmap);

  const allBreakdowns = Array.from(map.values()).map(
    computeRoadmapPointBreakdown
  );
  const currentBreakdown =
    allBreakdowns.find((b) => b.roadmapId === currentRoadmap.id) ||
    computeRoadmapPointBreakdown(currentRoadmap);

  const totalAccumulatedPoints = allBreakdowns.reduce(
    (sum, item) => sum + item.totalEarnedFromRoadmap,
    0
  );

  const tierResolution = resolveTierByPoints(totalAccumulatedPoints);

  return {
    currentBreakdown,
    allBreakdowns,
    totalAccumulatedPoints,
    currentTier: tierResolution.currentTier,
    nextTier: tierResolution.nextTier,
    isBronzeUnlocked: tierResolution.isBronzeUnlocked,
  };
}
