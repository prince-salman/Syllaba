export type CognitiveLoad = "light" | "moderate" | "deep";

export type TaskCategory =
  | "reading"
  | "practice"
  | "research"
  | "writing"
  | "coding"
  | "review";

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  dayNumber: number;
  date: string;
  estimatedMinutes: number;
  cognitiveLoad: CognitiveLoad;
  category: TaskCategory;
  isCompleted: boolean;
  subtasks: Subtask[];
  resources?: string[];
  moduleTitle?: string;
}

export interface DailySchedule {
  dayNumber: number;
  date: string;
  isRestDay: boolean;
  totalEstimatedMinutes: number;
  cognitiveLoadSummary: CognitiveLoad;
  tasks: RoadmapTask[];
}

export interface BurnoutMetrics {
  riskScore: number;
  riskLevel: "low" | "moderate" | "high";
  weeklyPeakHours: number;
  recommendedRestDays: number;
  burnoutFactors: string[];
}

export interface ExtractedModule {
  title: string;
  topics: string[];
  weightPercentage?: number;
  deadlineHint?: string;
  estimatedHours?: number;
}

export interface SyllabusExtraction {
  courseTitle: string;
  courseCode?: string;
  hardDeadline?: string;
  modules: ExtractedModule[];
}

export interface CuratedResource {
  id: string;
  roadmapId: string;
  moduleTopic: string;
  title: string;
  url: string;
  sourceType: "openalex" | "wikipedia";
  summary?: string;
  year?: number;
}

export interface OnChainProofRecord {
  id: string;
  roadmapId: string;
  walletAddress: string;
  roadmapHash: string;
  ipfsCid?: string;
  txHash: string;
  chainId: number;
  status: string;
  createdAt: string;
}

export type ExamStage = "mid" | "final";

export interface ExamMultipleChoiceQuestion {
  id: string;
  number: number;
  slideReference: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface ExamEssayQuestion {
  id: string;
  number: number;
  slideReference: string;
  prompt: string;
  expectedKeywords: string[];
  sampleAnswer: string;
}

export interface ExamSubmission {
  mcAnswers: Record<string, number>;
  essayAnswers: Record<string, string>;
  mcScore: number;
  essayScore: number;
  totalScore: number;
  passed: boolean;
  essayFeedback: Record<string, string>;
  submittedAt: string;
}

export interface MilestoneExam {
  id: string;
  stage: ExamStage;
  triggerDayNumber: number;
  title: string;
  multipleChoice: ExamMultipleChoiceQuestion[];
  essays: ExamEssayQuestion[];
  submission?: ExamSubmission;
}

export type CertificateTierId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "emerald";

export interface PptDifficultyAnalysis {
  difficultyPoints: 1 | 2 | 3 | 4 | 5;
  difficultyLabel: string;
  rationale: string;
  latexDensityCount: number;
  deepTasksCount: number;
}

export interface BlockchainCertificateRecord {
  certificateId: string;
  ownerScope?: string;
  tier: CertificateTierId;
  totalPointsAtIssue: number;
  totalSylCoinsAtIssue?: number;
  pptDifficultyPoints: number;
  recipientName: string;
  walletAddress: string;
  courseTitle: string;
  midExamScore: number;
  finalExamScore: number;
  finalGradeScore: number;
  totalDays: number;
  totalTasks: number;
  certificateHash: string;
  ipfsCid: string;
  txHash: string;
  vaultAddress?: string;
  chainId: number;
  proofType: "onchain-tx" | "eip191-signature";
  issuedAt: string;
}

export interface SyllabaCoinClaimRecord {
  id: string;
  ownerScope: string;
  walletAddress: string;
  amountSyl: number;
  txHash: string;
  chainId: number;
  proofType: "onchain-tx" | "eip191-signature";
  claimedAt: string;
}

export type SylPerkId = "ai_exam_boost" | "burnout_shield" | "gasless_sponsorship";

export interface SyllabaCoinRedemptionRecord {
  id: string;
  ownerScope: string;
  perkId: SylPerkId;
  perkTitle: string;
  costSyl: number;
  redeemedAt: string;
}

export interface Roadmap {
  id: string;
  ownerScope?: string;
  courseTitle: string;
  courseCode?: string;
  targetEndDate: string;
  startDate: string;
  totalDays: number;
  totalTasks: number;
  completedTasks: number;
  dailySchedules: DailySchedule[];
  burnoutMetrics: BurnoutMetrics;
  modulesSummary?: ExtractedModule[];
  curatedResources?: CuratedResource[];
  difficultyAnalysis?: PptDifficultyAnalysis;
  exams?: {
    mid?: MilestoneExam;
    final?: MilestoneExam;
  };
  certificate?: BlockchainCertificateRecord;
  walletAddress?: string;
  roadmapHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationRequest {
  syllabusText: string;
  courseTitle?: string;
  targetDays?: number;
  targetEndDate?: string;
  dailyHoursLimit?: number;
  includeRestDays?: boolean;
  apiKey?: string;
}

export interface RescheduleRequest {
  roadmap: Roadmap;
  delayDays: number;
  reason?: string;
}
