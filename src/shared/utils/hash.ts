import { keccak256, stringToHex } from "viem";
import { Roadmap } from "@/shared/types/roadmap";

export function computeRoadmapHash(roadmap: Roadmap): `0x${string}` {
  const canonicalPayload = JSON.stringify({
    id: roadmap.id,
    courseTitle: roadmap.courseTitle,
    totalDays: roadmap.totalDays,
    totalTasks: roadmap.totalTasks,
    targetEndDate: roadmap.targetEndDate,
  });
  return keccak256(stringToHex(canonicalPayload));
}

export function computeMilestoneProofHash(params: {
  roadmapId: string;
  milestoneIndex: number;
  completedTasks: number;
  walletAddress: string;
}): `0x${string}` {
  const canonicalPayload = JSON.stringify({
    roadmapId: params.roadmapId,
    milestoneIndex: params.milestoneIndex,
    completedTasks: params.completedTasks,
    walletAddress: params.walletAddress.toLowerCase(),
  });
  return keccak256(stringToHex(canonicalPayload));
}
