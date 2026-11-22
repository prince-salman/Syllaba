import { keccak256, stringToHex } from "viem";
import { anchorCertificateViaRelayer } from "@/client/lib/anchorCertificateViaRelayer";
import { SYLLABA_SBT_ADDRESS } from "@/shared/contracts/syllabaCertificateSbt";
import { BlockchainCertificateRecord, Roadmap } from "@/shared/types/roadmap";
import {
  CertificateTierMeta,
  computeRoadmapPointBreakdown,
} from "@/shared/utils/certificateTiers";

const inFlightAutoMints = new Map<string, Promise<BlockchainCertificateRecord | null>>();

interface SnapshotResult {
  ipfsCid: string;
  storageMode: "pinata-ipfs" | "canonical-digest";
}

async function resolveSnapshotCid(
  certificateHash: `0x${string}`,
  roadmap?: Roadmap
): Promise<SnapshotResult> {
  let ipfsCid = `snapshot-${certificateHash.slice(2, 34).toLowerCase()}`;
  let storageMode: "pinata-ipfs" | "canonical-digest" = "canonical-digest";
  if (!roadmap) return { ipfsCid, storageMode };

  try {
    const snapRes = await fetch("/api/ipfs/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roadmap }),
    });
    if (snapRes.ok) {
      const snap = await snapRes.json();
      if (snap.ipfsCid) ipfsCid = snap.ipfsCid;
      if (snap.storageMode === "pinata-ipfs") {
        storageMode = "pinata-ipfs";
      }
    }
  } catch {
    // Non-blocking fallback to deterministic canonical digest
  }
  return { ipfsCid, storageMode };
}

async function syncProofLedger(params: {
  roadmapId: string;
  walletAddress: string;
  roadmapHash: `0x${string}`;
  ipfsCid: string;
  txHash: string;
  chainId: number;
  status: string;
}) {
  try {
    await fetch("/api/proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // Non-blocking ledger sync
  }
}

export function buildCourseCertificateHash(params: {
  ownerScope: string;
  roadmap: Roadmap;
  recipientName: string;
  walletAddress?: string | null;
}): `0x${string}` {
  const { ownerScope, roadmap, recipientName, walletAddress } = params;
  const breakdown = computeRoadmapPointBreakdown(roadmap);
  const midScore = roadmap.exams?.mid?.submission?.totalScore ?? 0;
  const finalScore = roadmap.exams?.final?.submission?.totalScore ?? 0;
  const finalGradeScore =
    midScore > 0 || finalScore > 0
      ? Math.round(midScore * 0.45 + finalScore * 0.55)
      : 0;

  return keccak256(
    stringToHex(
      JSON.stringify({
        protocol: "SYLLABA_COURSE_GRADUATION_V2",
        ownerScope,
        roadmapId: roadmap.id,
        courseTitle: roadmap.courseTitle,
        pptDifficultyPoints: breakdown.pptDifficultyPoints,
        recipientName: recipientName.trim() || "Scholar",
        walletAddress: walletAddress || "0x000000000000000000000000000000000000dEaD",
        midScore,
        finalScore,
        finalGradeScore,
        totalDays: roadmap.totalDays,
        totalTasks: roadmap.totalTasks,
      })
    )
  );
}

/**
 * Automatically anchors a graduated course certificate onto Base Sepolia via
 * the sponsored SBT relayer, deduplicated per roadmap+ownerScope so concurrent
 * mounts never submit duplicate transactions.
 */
export function autoAnchorCourseCertificate(params: {
  roadmap: Roadmap;
  recipientName: string;
  ownerScope: string;
  walletAddress?: string | null;
  chainId?: number;
}): Promise<BlockchainCertificateRecord | null> {
  const dedupeKey = `course:${params.roadmap.id}:${params.ownerScope}`;
  const existing = inFlightAutoMints.get(dedupeKey);
  if (existing) return existing;

  const task = (async (): Promise<BlockchainCertificateRecord | null> => {
    try {
      const breakdown = computeRoadmapPointBreakdown(params.roadmap);
      if (!breakdown.isFullyCompletedAtEnd) return null;

      const midScore = params.roadmap.exams?.mid?.submission?.totalScore ?? 0;
      const finalScore = params.roadmap.exams?.final?.submission?.totalScore ?? 0;
      const finalGradeScore =
        midScore > 0 || finalScore > 0
          ? Math.round(midScore * 0.45 + finalScore * 0.55)
          : 100;

      const certHash = buildCourseCertificateHash({
        ownerScope: params.ownerScope,
        roadmap: params.roadmap,
        recipientName: params.recipientName,
        walletAddress: params.walletAddress,
      });

      const snapshot = await resolveSnapshotCid(certHash, params.roadmap);
      const relay = await anchorCertificateViaRelayer({
        certHash,
        ipfsCid: snapshot.ipfsCid,
        courseTitle: `${params.roadmap.courseTitle} [PPT COMPLETION]`,
        recipientName: params.recipientName.trim() || "Scholar",
        finalGradeScore,
        certKind: "COURSE_PASS",
        points: breakdown.pptDifficultyPoints,
        studentAddress: params.walletAddress || undefined,
      });

      if (!relay) return null;

      const resolvedWallet = params.walletAddress || relay.relayerAddress;
      const resolvedChainId = params.chainId || 84532;

      await syncProofLedger({
        roadmapId: params.roadmap.id,
        walletAddress: resolvedWallet,
        roadmapHash: relay.certHash,
        ipfsCid: snapshot.ipfsCid,
        txHash: relay.txHash,
        chainId: resolvedChainId,
        status: "cert-course-onchain",
      });

      return {
        certificateId: `SYL-PPT-${relay.certHash.slice(2, 9).toUpperCase()}`,
        ownerScope: params.ownerScope,
        tier: "bronze",
        totalPointsAtIssue: breakdown.totalEarnedFromRoadmap,
        totalSylCoinsAtIssue: breakdown.totalSylFromRoadmap,
        pptDifficultyPoints: breakdown.pptDifficultyPoints,
        recipientName: params.recipientName.trim() || "Scholar",
        walletAddress: resolvedWallet,
        courseTitle: params.roadmap.courseTitle,
        midExamScore: midScore,
        finalExamScore: finalScore,
        finalGradeScore,
        totalDays: params.roadmap.totalDays,
        totalTasks: params.roadmap.totalTasks,
        certificateHash: relay.certHash,
        ipfsCid: snapshot.ipfsCid,
        ipfsStorageMode: snapshot.storageMode,
        txHash: relay.txHash,
        sbtContractAddress: relay.sbtContractAddress || SYLLABA_SBT_ADDRESS,
        chainId: resolvedChainId,
        proofType: "onchain-tx",
        issuedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    } finally {
      inFlightAutoMints.delete(dedupeKey);
    }
  })();

  inFlightAutoMints.set(dedupeKey, task);
  return task;
}

/**
 * Automatically anchors an unlocked Tier Certificate onto Base Sepolia via the
 * sponsored SBT relayer, deduplicated per tier+ownerScope.
 */
export function autoAnchorTierCertificate(params: {
  tierMeta: CertificateTierMeta;
  representativeRoadmap?: Roadmap;
  certificateHash: `0x${string}`;
  totalAccumulatedPoints: number;
  totalEarnedSylCoins: number;
  completedCoursesCount: number;
  recipientName: string;
  ownerScope: string;
  walletAddress?: string | null;
  chainId?: number;
}): Promise<BlockchainCertificateRecord | null> {
  const dedupeKey = `tier:${params.tierMeta.id}:${params.ownerScope}`;
  const existing = inFlightAutoMints.get(dedupeKey);
  if (existing) return existing;

  const task = (async (): Promise<BlockchainCertificateRecord | null> => {
    try {
      const snapshot = await resolveSnapshotCid(
        params.certificateHash,
        params.representativeRoadmap
      );
      const relay = await anchorCertificateViaRelayer({
        certHash: params.certificateHash,
        ipfsCid: snapshot.ipfsCid,
        courseTitle: `Syllaba ${params.tierMeta.name.toUpperCase()} Tier Credential (${params.completedCoursesCount} PPTs)`,
        recipientName: params.recipientName.trim() || "Scholar",
        finalGradeScore: Math.min(100, params.totalAccumulatedPoints),
        certKind: `TIER_${params.tierMeta.id.toUpperCase()}`,
        points: params.totalAccumulatedPoints,
        studentAddress: params.walletAddress || undefined,
      });

      if (!relay) return null;

      const resolvedWallet = params.walletAddress || relay.relayerAddress;
      const resolvedChainId = params.chainId || 84532;

      await syncProofLedger({
        roadmapId: `tier-${params.tierMeta.id}`,
        walletAddress: resolvedWallet,
        roadmapHash: relay.certHash,
        ipfsCid: snapshot.ipfsCid,
        txHash: relay.txHash,
        chainId: resolvedChainId,
        status: `cert-tier-${params.tierMeta.id}-onchain`,
      });

      return {
        certificateId: `SYL-TIER-${params.tierMeta.id
          .slice(0, 3)
          .toUpperCase()}-${relay.certHash.slice(2, 9).toUpperCase()}`,
        ownerScope: params.ownerScope,
        tier: params.tierMeta.id,
        totalPointsAtIssue: params.totalAccumulatedPoints,
        totalSylCoinsAtIssue: params.totalEarnedSylCoins,
        pptDifficultyPoints: 5,
        recipientName: params.recipientName.trim() || "Scholar",
        walletAddress: resolvedWallet,
        courseTitle: `${params.tierMeta.name} Tier Academic Progression (${params.completedCoursesCount} PPT Lulus)`,
        midExamScore: 100,
        finalExamScore: 100,
        finalGradeScore: 100,
        totalDays: params.completedCoursesCount,
        totalTasks: params.totalAccumulatedPoints,
        certificateHash: relay.certHash,
        ipfsCid: snapshot.ipfsCid,
        ipfsStorageMode: snapshot.storageMode,
        txHash: relay.txHash,
        sbtContractAddress: relay.sbtContractAddress || SYLLABA_SBT_ADDRESS,
        chainId: resolvedChainId,
        proofType: "onchain-tx",
        issuedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    } finally {
      inFlightAutoMints.delete(dedupeKey);
    }
  })();

  inFlightAutoMints.set(dedupeKey, task);
  return task;
}
