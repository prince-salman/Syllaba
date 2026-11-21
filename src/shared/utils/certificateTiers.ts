import {
  BlockchainCertificateRecord,
  CertificateTierId,
  PptDifficultyAnalysis,
  Roadmap,
  SyllabaCoinClaimRecord,
  SyllabaCoinRedemptionRecord,
  SylPerkId,
} from "@/shared/types/roadmap";
import { OFFICIAL_SYL_MODULE_REWARD } from "@/shared/contracts/syllabaCoin";

function roundSyl(val: number): number {
  return Math.round(val * 10000) / 10000;
}

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
    badgeTitle: "Bronze Tier · 5 Poin",
    credentialTitle: "BRONZE SCHOLAR BLOCKCHAIN CREDENTIAL",
    minPoints: 5,
    nextPoints: 40,
    primaryHex: "#E09F67",
    secondaryHex: "#CD7F32",
    borderClass: "border-[#CD7F32]",
    bgGradientClass: "from-[#1C130D] via-[#110C08] to-[#1C130D]",
    pillBgClass: "bg-[#CD7F32]/20 border-[#E09F67]/50",
    pillTextClass: "text-[#F5CBA7]",
    glowRgba: "rgba(205,127,50,0.8)",
    description:
      "Terbuka setelah mengumpulkan 5 Poin dari penyelesaian akhir PPT (1-5 Poin per PPT).",
  },
  {
    id: "silver",
    name: "Silver",
    badgeTitle: "Silver Tier · 40 Poin",
    credentialTitle: "SILVER SPECIALIST BLOCKCHAIN CREDENTIAL",
    minPoints: 40,
    nextPoints: 65,
    primaryHex: "#E2E8F0",
    secondaryHex: "#94A3B8",
    borderClass: "border-[#94A3B8]",
    bgGradientClass: "from-[#131822] via-[#0C0F17] to-[#131822]",
    pillBgClass: "bg-[#94A3B8]/20 border-[#E2E8F0]/50",
    pillTextClass: "text-[#F1F5F9]",
    glowRgba: "rgba(226,232,240,0.75)",
    description:
      "Terbuka setelah mengumpulkan 40 Poin dari penyelesaian akhir PPT.",
  },
  {
    id: "gold",
    name: "Gold",
    badgeTitle: "Gold Tier · 65 Poin",
    credentialTitle: "GOLD MASTER BLOCKCHAIN CREDENTIAL",
    minPoints: 65,
    nextPoints: 95,
    primaryHex: "#FACC15",
    secondaryHex: "#CA8A04",
    borderClass: "border-[#D4AF37]",
    bgGradientClass: "from-[#17140B] via-[#0E0C07] to-[#17140B]",
    pillBgClass: "bg-[#FACC15]/20 border-[#FACC15]/50",
    pillTextClass: "text-[#FEF08A]",
    glowRgba: "rgba(250,204,21,0.85)",
    description:
      "Terbuka setelah mengumpulkan 65 Poin dari penyelesaian akhir PPT.",
  },
  {
    id: "platinum",
    name: "Platinum",
    badgeTitle: "Platinum Tier · 95 Poin",
    credentialTitle: "PLATINUM VANGUARD BLOCKCHAIN CREDENTIAL",
    minPoints: 95,
    nextPoints: 130,
    primaryHex: "#38BDF8",
    secondaryHex: "#0284C7",
    borderClass: "border-[#38BDF8]",
    bgGradientClass: "from-[#0A1826] via-[#061019] to-[#0A1826]",
    pillBgClass: "bg-[#38BDF8]/20 border-[#7DD3FC]/50",
    pillTextClass: "text-[#BAE6FD]",
    glowRgba: "rgba(56,189,248,0.8)",
    description:
      "Terbuka setelah mengumpulkan 95 Poin dari penyelesaian akhir PPT.",
  },
  {
    id: "diamond",
    name: "Diamond",
    badgeTitle: "Diamond Tier · 130 Poin",
    credentialTitle: "DIAMOND LUMINARY BLOCKCHAIN CREDENTIAL",
    minPoints: 130,
    nextPoints: 175,
    primaryHex: "#C084FC",
    secondaryHex: "#9333EA",
    borderClass: "border-[#C084FC]",
    bgGradientClass: "from-[#190D26] via-[#100819] to-[#190D26]",
    pillBgClass: "bg-[#C084FC]/20 border-[#E9D5FF]/50",
    pillTextClass: "text-[#F3E8FF]",
    glowRgba: "rgba(192,132,252,0.85)",
    description:
      "Terbuka setelah mengumpulkan 130 Poin dari penyelesaian akhir PPT.",
  },
  {
    id: "emerald",
    name: "Emerald",
    badgeTitle: "Emerald Tier · 175 Poin",
    credentialTitle: "EMERALD SOVEREIGN BLOCKCHAIN CREDENTIAL",
    minPoints: 175,
    nextPoints: null,
    primaryHex: "#34D399",
    secondaryHex: "#059669",
    borderClass: "border-[#10B981]",
    bgGradientClass: "from-[#071D15] via-[#04120D] to-[#071D15]",
    pillBgClass: "bg-[#10B981]/20 border-[#6EE7B7]/50",
    pillTextClass: "text-[#A7F3D0]",
    glowRgba: "rgba(16,185,129,0.85)",
    description:
      "Tingkat tertinggi Syllaba Sovereign setelah mengumpulkan 175+ Poin dari penyelesaian akhir PPT.",
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
  isFullyCompletedAtEnd: boolean;
  allTasksDone: boolean;
  midExamPassed: boolean;
  finalExamPassed: boolean;
  totalEarnedFromRoadmap: number;
  maxPossibleFromRoadmap: number;
  pendingSylCoins: number;
  totalSylFromRoadmap: number;
}

export function computeRoadmapPointBreakdown(
  roadmap: Roadmap
): RoadmapPointBreakdown {
  const analysis = analyzeRoadmapPptDifficulty(roadmap);
  const d = analysis.difficultyPoints;

  const allTasksDone =
    roadmap.totalTasks > 0 && roadmap.completedTasks >= roadmap.totalTasks;
  const midSub = roadmap.exams?.mid?.submission;
  const finalSub = roadmap.exams?.final?.submission;
  const midExamPassed = Boolean(midSub?.passed);
  const finalExamPassed = Boolean(finalSub?.passed);

  // Penilaian poin (1-5 Poin per PPT) & $SYL Coin HANYA diberikan di AKHIR setelah seluruh tugas + Ujian Tengah + Ujian Akhir PPT tersebut tuntas
  const isFullyCompletedAtEnd =
    allTasksDone && midExamPassed && finalExamPassed;

  const totalEarnedFromRoadmap = isFullyCompletedAtEnd ? d : 0;
  const maxPossibleFromRoadmap = d;

  // Sinkron 1:1 dengan kontrak Base Sepolia (0x95f9...0BFA7) -> MODULE_REWARD = 0.25 SYL per PPT lulus
  const pendingSylCoins = OFFICIAL_SYL_MODULE_REWARD;
  const totalSylFromRoadmap = isFullyCompletedAtEnd ? pendingSylCoins : 0;

  return {
    roadmapId: roadmap.id,
    courseTitle: roadmap.courseTitle,
    pptDifficultyPoints: d,
    difficultyLabel: analysis.difficultyLabel,
    rationale: analysis.rationale,
    isFullyCompletedAtEnd,
    allTasksDone,
    midExamPassed,
    finalExamPassed,
    totalEarnedFromRoadmap,
    maxPossibleFromRoadmap,
    pendingSylCoins,
    totalSylFromRoadmap,
  };
}

export function computeGlobalAcademicPoints(
  currentRoadmap: Roadmap,
  historyRoadmaps: Roadmap[],
  activeOwnerScope?: string
): {
  currentBreakdown: RoadmapPointBreakdown;
  allBreakdowns: RoadmapPointBreakdown[];
  totalAccumulatedPoints: number;
  totalEarnedSylCoins: number;
  tierBonusSylCoins: number;
  currentTier: CertificateTierMeta;
  nextTier: CertificateTierMeta | null;
  isBronzeUnlocked: boolean;
} {
  const map = new Map<string, Roadmap>();
  for (const r of historyRoadmaps) {
    if (!r || !r.id) continue;
    const rScope =
      r.ownerScope || (r as Roadmap & { _ownerScope?: string })._ownerScope;
    if (activeOwnerScope && rScope && rScope !== activeOwnerScope) {
      continue;
    }
    map.set(r.id, r);
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

  const tierBonusMap: Record<CertificateTierId, number> = {
    bronze: 0.5,
    silver: 1,
    gold: 2,
    platinum: 3.5,
    diamond: 5,
    emerald: 10,
  };
  const tierBonusSylCoins = tierResolution.isBronzeUnlocked
    ? tierBonusMap[tierResolution.currentTier.id]
    : 0;

  const roadmapSylSum = roundSyl(
    allBreakdowns.reduce((sum, item) => sum + item.totalSylFromRoadmap, 0)
  );
  const totalEarnedSylCoins = roundSyl(roadmapSylSum + tierBonusSylCoins);

  return {
    currentBreakdown,
    allBreakdowns,
    totalAccumulatedPoints,
    totalEarnedSylCoins,
    tierBonusSylCoins,
    currentTier: tierResolution.currentTier,
    nextTier: tierResolution.nextTier,
    isBronzeUnlocked: tierResolution.isBronzeUnlocked,
  };
}

const SYL_CLAIMS_PREFIX = "syllaba_coin_claims_v1";
const SYL_REDEMPTIONS_PREFIX = "syllaba_coin_redemptions_v1";
const SYL_TIER_CERTS_PREFIX = "syllaba_tier_certs_v1";

export function computeGlobalPointsAcrossRoadmaps(
  historyRoadmaps: Roadmap[],
  activeOwnerScope?: string
): {
  allBreakdowns: RoadmapPointBreakdown[];
  totalAccumulatedPoints: number;
  totalEarnedSylCoins: number;
  tierBonusSylCoins: number;
  currentTier: CertificateTierMeta;
  nextTier: CertificateTierMeta | null;
  isBronzeUnlocked: boolean;
} {
  const map = new Map<string, Roadmap>();
  for (const r of historyRoadmaps) {
    if (!r || !r.id) continue;
    const rScope =
      r.ownerScope || (r as Roadmap & { _ownerScope?: string })._ownerScope;
    if (activeOwnerScope && rScope && rScope !== activeOwnerScope) {
      continue;
    }
    map.set(r.id, r);
  }

  const allBreakdowns = Array.from(map.values()).map(
    computeRoadmapPointBreakdown
  );
  const totalAccumulatedPoints = allBreakdowns.reduce(
    (sum, item) => sum + item.totalEarnedFromRoadmap,
    0
  );
  const tierResolution = resolveTierByPoints(totalAccumulatedPoints);
  const tierBonusMap: Record<CertificateTierId, number> = {
    bronze: 0.5,
    silver: 1,
    gold: 2,
    platinum: 3.5,
    diamond: 5,
    emerald: 10,
  };
  const tierBonusSylCoins = tierResolution.isBronzeUnlocked
    ? tierBonusMap[tierResolution.currentTier.id]
    : 0;
  const roadmapSylSum = roundSyl(
    allBreakdowns.reduce((sum, item) => sum + item.totalSylFromRoadmap, 0)
  );

  return {
    allBreakdowns,
    totalAccumulatedPoints,
    totalEarnedSylCoins: roundSyl(roadmapSylSum + tierBonusSylCoins),
    tierBonusSylCoins,
    currentTier: tierResolution.currentTier,
    nextTier: tierResolution.nextTier,
    isBronzeUnlocked: tierResolution.isBronzeUnlocked,
  };
}

export function getStoredTierCertificates(
  scope = "guest"
): Partial<Record<CertificateTierId, BlockchainCertificateRecord>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${SYL_TIER_CERTS_PREFIX}:${scope}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Partial<
      Record<CertificateTierId, BlockchainCertificateRecord>
    >;
  } catch {
    return {};
  }
}

export function saveTierCertificateRecord(
  cert: BlockchainCertificateRecord,
  scope = "guest"
): Partial<Record<CertificateTierId, BlockchainCertificateRecord>> {
  const existing = getStoredTierCertificates(scope);
  const next: Partial<Record<CertificateTierId, BlockchainCertificateRecord>> = {
    ...existing,
    [cert.tier]: { ...cert, ownerScope: scope },
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${SYL_TIER_CERTS_PREFIX}:${scope}`,
        JSON.stringify(next)
      );
    } catch {
      // Ignore storage quota error
    }
  }
  return next;
}

export function getStoredSylClaims(scope = "guest"): SyllabaCoinClaimRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${SYL_CLAIMS_PREFIX}:${scope}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: SyllabaCoinClaimRecord) =>
        item && item.ownerScope === scope && typeof item.amountSyl === "number"
    );
  } catch {
    return [];
  }
}

export function saveSylClaimRecord(
  record: SyllabaCoinClaimRecord,
  scope = "guest"
): SyllabaCoinClaimRecord[] {
  const existing = getStoredSylClaims(scope);
  const next = [{ ...record, ownerScope: scope }, ...existing];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${SYL_CLAIMS_PREFIX}:${scope}`, JSON.stringify(next));
    } catch {
      // Ignore storage quota error
    }
  }
  return next;
}

export function getStoredSylRedemptions(
  scope = "guest"
): SyllabaCoinRedemptionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${SYL_REDEMPTIONS_PREFIX}:${scope}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: SyllabaCoinRedemptionRecord) =>
        item && item.ownerScope === scope && typeof item.costSyl === "number"
    );
  } catch {
    return [];
  }
}

export function saveSylRedemptionRecord(
  record: SyllabaCoinRedemptionRecord,
  scope = "guest"
): SyllabaCoinRedemptionRecord[] {
  const existing = getStoredSylRedemptions(scope);
  const next = [{ ...record, ownerScope: scope }, ...existing];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${SYL_REDEMPTIONS_PREFIX}:${scope}`,
        JSON.stringify(next)
      );
    } catch {
      // Ignore storage quota error
    }
  }
  return next;
}

export const SYL_COIN_PERKS: Array<{
  id: SylPerkId;
  title: string;
  costSyl: number;
  description: string;
}> = [
  {
    id: "ai_exam_boost",
    title: "AI Exam Formula Hint & Remedial Shield",
    costSyl: 0.25,
    description:
      "Membuka petunjuk rumus LaTeX & kesempatan remedial instan pada Ujian AI 5 PG + 2 Esai (setara 1 PPT lulus).",
  },
  {
    id: "burnout_shield",
    title: "Burnout Recovery Streak Shield",
    costSyl: 0.5,
    description:
      "Menjaga konsistensi poin kesulitan PPT saat melakukan Reschedule jadwal belajar (setara 2 PPT lulus).",
  },
  {
    id: "gasless_sponsorship",
    title: "Base Sepolia On-Chain Gas Sponsorship",
    costSyl: 1,
    description:
      "Prioritas relayer transaksi on-chain Sertifikat SBT di jaringan Base Sepolia.",
  },
];
