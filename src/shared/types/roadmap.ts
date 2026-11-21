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

export interface Roadmap {
  id: string;
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
  walletAddress?: string;
  roadmapHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationRequest {
  syllabusText: string;
  courseTitle?: string;
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
