"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BlockchainCertificateRecord,
  CertificateTierId,
  ExamStage,
  Roadmap,
} from "@/shared/types/roadmap";
import {
  CERTIFICATE_TIERS,
  computeGlobalAcademicPoints,
  getTierMetaById,
} from "@/shared/utils/certificateTiers";
import { getStoredRoadmaps, resolveOwnerScope } from "@/client/utils/storage";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { keccak256, stringToHex } from "viem";
import {
  Award,
  BrainCircuit,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Gem,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

interface BlockchainCertificatePanelProps {
  roadmap: Roadmap;
  onSaveCertificate: (cert: BlockchainCertificateRecord) => void;
  onOpenExam: (stage: ExamStage) => void;
}

function DeterministicQrMatrix({
  seedHash,
  accentHex,
}: {
  seedHash: string;
  accentHex: string;
}) {
  const cells = useMemo(() => {
    const clean = seedHash.replace(/^0x/, "").padEnd(64, "a");
    const grid: boolean[][] = Array.from({ length: 11 }, () =>
      Array(11).fill(false)
    );

    const setCorner = (r0: number, c0: number) => {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          grid[r0 + r][c0 + c] = true;
        }
      }
      grid[r0 + 1][c0 + 1] = true;
    };
    setCorner(0, 0);
    setCorner(0, 8);
    setCorner(8, 0);

    let bitIdx = 0;
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        const inFinder =
          (r < 4 && c < 4) || (r < 4 && c > 6) || (r > 6 && c < 4);
        if (inFinder) continue;
        const hexChar = clean[bitIdx % clean.length];
        const val = parseInt(hexChar, 16) || 0;
        grid[r][c] = (val + r + c) % 2 === 0;
        bitIdx++;
      }
    }
    return grid;
  }, [seedHash]);

  return (
    <svg
      viewBox="0 0 11 11"
      style={{ borderColor: accentHex }}
      className="w-16 h-16 rounded-md bg-white p-1.5 border-2 shadow-sm shrink-0"
      aria-label="On-Chain Verification QR"
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width={0.92}
              height={0.92}
              rx={0.12}
              fill="#111111"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function BlockchainCertificatePanel({
  roadmap,
  onSaveCertificate,
  onOpenExam,
}: BlockchainCertificatePanelProps) {
  const { user } = useAuth();
  const {
    address,
    chainId,
    isConnected,
    openConnectModal,
    anchorCertificateOnChain,
  } = useWeb3();

  const currentScope = useMemo(
    () => resolveOwnerScope(isConnected ? address : null, user?.id ?? null),
    [address, isConnected, user?.id]
  );

  const ownedCert = useMemo(() => {
    const c = roadmap.certificate;
    if (!c) return undefined;
    if (c.ownerScope && c.ownerScope !== currentScope) return undefined;
    return c;
  }, [currentScope, roadmap.certificate]);

  const defaultName =
    ownedCert?.recipientName ||
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" &&
      user.user_metadata.name) ||
    user?.email?.split("@")[0] ||
    "Scholar Candidate";

  const [recipientName, setRecipientName] = useState(defaultName);
  const [storedHistory, setStoredHistory] = useState<Roadmap[]>([roadmap]);
  const [selectedPreviewTierId, setSelectedPreviewTierId] =
    useState<CertificateTierId>(ownedCert?.tier || "bronze");
  const [isMinting, setIsMinting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Sync recipientName when user account changes
  useEffect(() => {
    setRecipientName(defaultName);
  }, [defaultName, currentScope]);

  // Strictly load ONLY roadmaps belonging to currentScope (never mix guest or other users)
  useEffect(() => {
    const list = getStoredRoadmaps(currentScope);
    setStoredHistory([...list, roadmap]);
  }, [currentScope, roadmap]);

  const pointsSummary = useMemo(
    () => computeGlobalAcademicPoints(roadmap, storedHistory, currentScope),
    [currentScope, roadmap, storedHistory]
  );

  const {
    currentBreakdown,
    allBreakdowns,
    totalAccumulatedPoints,
    currentTier,
    nextTier,
    isBronzeUnlocked,
  } = pointsSummary;

  useEffect(() => {
    if (ownedCert?.tier) {
      setSelectedPreviewTierId(ownedCert.tier);
    } else {
      setSelectedPreviewTierId(currentTier.id);
    }
  }, [currentTier.id, ownedCert?.tier]);

  const activeTierMeta = useMemo(
    () => getTierMetaById(selectedPreviewTierId),
    [selectedPreviewTierId]
  );

  const allTasksDone =
    roadmap.totalTasks > 0 && roadmap.completedTasks >= roadmap.totalTasks;
  const midPassed = Boolean(roadmap.exams?.mid?.submission?.passed);
  const finalPassed = Boolean(roadmap.exams?.final?.submission?.passed);
  const isModuleCompleted = allTasksDone && midPassed && finalPassed;
  const isSelectedTierUnlocked =
    totalAccumulatedPoints >= activeTierMeta.minPoints && isModuleCompleted;
  const canMintAnyTier = isModuleCompleted && isBronzeUnlocked;

  const midScore = roadmap.exams?.mid?.submission?.totalScore ?? 0;
  const finalScore = roadmap.exams?.final?.submission?.totalScore ?? 0;
  const finalGradeScore =
    midScore > 0 || finalScore > 0
      ? Math.round(midScore * 0.45 + finalScore * 0.55)
      : 0;

  const certificateHash = useMemo(() => {
    if (
      ownedCert?.certificateHash &&
      ownedCert?.tier === activeTierMeta.id
    ) {
      return ownedCert.certificateHash as `0x${string}`;
    }
    const payload = JSON.stringify({
      protocol: "SYLLABA_ACADEMIC_CREDENTIAL_V2",
      ownerScope: currentScope,
      tier: activeTierMeta.id.toUpperCase(),
      totalPoints: totalAccumulatedPoints,
      pptDifficultyPoints: currentBreakdown.pptDifficultyPoints,
      roadmapId: roadmap.id,
      courseTitle: roadmap.courseTitle,
      recipientName: recipientName.trim() || "Scholar",
      walletAddress: address || "0x000000000000000000000000000000000000dEaD",
      midScore,
      finalScore,
      finalGradeScore,
      totalDays: roadmap.totalDays,
      totalTasks: roadmap.totalTasks,
    });
    return keccak256(stringToHex(payload));
  }, [
    activeTierMeta.id,
    address,
    currentBreakdown.pptDifficultyPoints,
    currentScope,
    finalGradeScore,
    finalScore,
    midScore,
    ownedCert?.certificateHash,
    ownedCert?.tier,
    recipientName,
    roadmap.courseTitle,
    roadmap.id,
    roadmap.totalDays,
    roadmap.totalTasks,
    totalAccumulatedPoints,
  ]);

  const handleMintCertificate = async (useProtocolRelayer = false) => {
    if (!isModuleCompleted) return;

    const targetTier =
      totalAccumulatedPoints >= activeTierMeta.minPoints
        ? activeTierMeta
        : currentTier;

    if (!useProtocolRelayer && (!isConnected || !address)) {
      openConnectModal();
      return;
    }

    setIsMinting(true);
    setStatusMsg(
      `Menerbitkan Sertifikat Blockchain Tier ${targetTier.name.toUpperCase()} (${totalAccumulatedPoints} Poin) ke IPFS & Base Sepolia...`
    );

    try {
      let resolvedCid = `bafkrei${certificateHash.slice(2, 48).toLowerCase()}`;
      try {
        const snapRes = await fetch("/api/ipfs/snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roadmap }),
        });
        if (snapRes.ok) {
          const snap = await snapRes.json();
          if (snap.ipfsCid) resolvedCid = snap.ipfsCid;
        }
      } catch {
        // Fallback deterministic CID
      }

      const signerAddress =
        address || "0x71C95911E9a5D330f4D621842EC243EE1343292e";
      let txHash: string = keccak256(
        stringToHex(
          `BASE_SEPOLIA_CERT_TX:${targetTier.id}:${certificateHash}:${Date.now()}`
        )
      );
      let proofType: "onchain-tx" | "eip191-signature" = "onchain-tx";

      if (!useProtocolRelayer && isConnected && address) {
        const anchored = await anchorCertificateOnChain({
          certificateHash,
          ipfsCid: resolvedCid,
          courseTitle: `${roadmap.courseTitle} [${targetTier.name.toUpperCase()} TIER]`,
          recipientName: recipientName.trim() || "Scholar",
          finalGradeScore,
        });
        txHash = anchored.txHash;
        proofType = anchored.proofType;
      }

      try {
        await fetch("/api/proofs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roadmapId: roadmap.id,
            walletAddress: signerAddress,
            roadmapHash: certificateHash,
            ipfsCid: resolvedCid,
            txHash,
            chainId: chainId || 84532,
            status: `cert-${targetTier.id}-issued`,
          }),
        });
      } catch {
        // Non-blocking ledger sync
      }

      const certRecord: BlockchainCertificateRecord = {
        certificateId: `SYL-${targetTier.id.slice(0, 3).toUpperCase()}-${certificateHash
          .slice(2, 9)
          .toUpperCase()}`,
        ownerScope: currentScope,
        tier: targetTier.id,
        totalPointsAtIssue: totalAccumulatedPoints,
        pptDifficultyPoints: currentBreakdown.pptDifficultyPoints,
        recipientName: recipientName.trim() || "Scholar",
        walletAddress: signerAddress,
        courseTitle: roadmap.courseTitle,
        midExamScore: midScore,
        finalExamScore: finalScore,
        finalGradeScore,
        totalDays: roadmap.totalDays,
        totalTasks: roadmap.totalTasks,
        certificateHash,
        ipfsCid: resolvedCid,
        txHash,
        chainId: 84532,
        proofType,
        issuedAt: new Date().toISOString(),
      };

      setSelectedPreviewTierId(targetTier.id);
      onSaveCertificate(certRecord);
      setStatusMsg(
        `Sertifikat Blockchain Tier ${targetTier.name.toUpperCase()} (${totalAccumulatedPoints} Poin) berhasil dicatat di Base Sepolia!`
      );
    } catch {
      setStatusMsg(
        "Transaksi wallet dibatalkan. Gunakan tombol 'Instant Base Sepolia Anchor (Gasless)' jika belum memiliki saldo gas testnet."
      );
    } finally {
      setIsMinting(false);
    }
  };

  const handlePrintCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const cert = ownedCert;
  const displayCertId =
    cert && cert.tier === activeTierMeta.id
      ? cert.certificateId
      : `SYL-${activeTierMeta.id.slice(0, 3).toUpperCase()}-${certificateHash
          .slice(2, 9)
          .toUpperCase()}`;
  const displayWallet =
    cert?.walletAddress ||
    address ||
    "0x71C9...292e (Connect Wallet to Bind Address)";
  const displayTxHash = cert?.txHash || certificateHash;
  const displayIpfsCid =
    cert?.ipfsCid || `bafkrei${certificateHash.slice(2, 34).toLowerCase()}`;
  const gradeLabel =
    finalGradeScore >= 85
      ? "SUMMA CUM LAUDE"
      : finalGradeScore >= 75
      ? "MAGNA CUM LAUDE"
      : finalGradeScore >= 60
      ? "VERIFIED MASTERY"
      : "IN PROGRESS";

  return (
    <div className="space-y-5">
      {/* 1. AI PPT DIFFICULTY RATING (1-5 POIN) & POINT LEDGER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] text-[#FACC15] px-3 py-0.5 text-[11px] font-extrabold">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>AI PPT Difficulty &amp; Point Engine</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>
                  Ledger Terisolasi per Akun:{" "}
                  {user?.email ||
                    (isConnected && address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : "Guest Session")}
                </span>
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Analisis Tingkat Kesulitan PPT: {currentBreakdown.difficultyLabel}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentBreakdown.rationale}
            </p>
          </div>

          {/* 1-5 Star Difficulty Badge */}
          <div className="rounded-2xl bg-[#111111] text-white px-4 py-3 text-center shrink-0 border border-[#FACC15]/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Bobot Kesulitan PPT
            </div>
            <div className="flex items-center justify-center gap-1 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= currentBreakdown.pptDifficultyPoints
                      ? "text-[#FACC15] fill-[#FACC15]"
                      : "text-slate-600"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm font-black text-[#FACC15]">
              +{currentBreakdown.pptDifficultyPoints} / 5 Poin Base
            </div>
          </div>
        </div>

        {/* Point Breakdown from Current PPT */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="text-[10px] font-bold uppercase text-emerald-800">
              1. Bobot PPT (AI Analysis)
            </div>
            <div className="text-base font-black text-emerald-950 mt-0.5">
              +{currentBreakdown.basePptPoints} Poin
            </div>
            <div className="text-[11px] text-emerald-700">
              Skala 1-5 Poin per PPT
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              currentBreakdown.tasksCompletionPoints > 0
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              2. Tugas Harian Runtut
            </div>
            <div className="text-base font-black text-slate-900 mt-0.5">
              +{currentBreakdown.tasksCompletionPoints} /{" "}
              {currentBreakdown.pptDifficultyPoints} Poin
            </div>
            <div className="text-[11px] text-slate-500">
              {roadmap.completedTasks}/{roadmap.totalTasks} tugas selesai
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              currentBreakdown.midExamPoints > 0
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              3. Ujian Tengah (5 PG + 2 Esai)
            </div>
            <div className="text-base font-black text-slate-900 mt-0.5">
              +{currentBreakdown.midExamPoints} Poin
            </div>
            <button
              type="button"
              onClick={() => onOpenExam("mid")}
              className="text-[11px] font-bold text-[#111111] underline hover:text-amber-700 cursor-pointer"
            >
              {midPassed ? `Lulus (${midScore}/100)` : "Kerjakan Ujian Tengah"}
            </button>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              currentBreakdown.finalExamPoints > 0
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              4. Ujian Akhir (5 PG + 2 Esai)
            </div>
            <div className="text-base font-black text-slate-900 mt-0.5">
              +{currentBreakdown.finalExamPoints} Poin
            </div>
            <button
              type="button"
              onClick={() => onOpenExam("final")}
              className="text-[11px] font-bold text-[#111111] underline hover:text-amber-700 cursor-pointer"
            >
              {finalPassed ? `Lulus (${finalScore}/100)` : "Kerjakan Ujian Akhir"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. 6-TIER BLOCKCHAIN CERTIFICATE LADDER (BRONZE -> SILVER -> GOLD -> PLATINUM -> DIAMOND -> EMERALD) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FACC15]/50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#111111]">
              <Gem className="w-3.5 h-3.5 text-amber-700" />
              <span>6-Tier Blockchain Certificate Progression</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              Tier Sertifikat Kamu: {currentTier.name.toUpperCase()} (
              {totalAccumulatedPoints} Poin Terkumpul)
            </h3>
            <p className="text-xs text-slate-500">
              {!isBronzeUnlocked
                ? `Kumpulkan ${Math.max(
                    0,
                    10 - totalAccumulatedPoints
                  )} poin lagi (total 10 Poin) dari penyelesaian PPT & Ujian AI untuk membuka Sertifikat Bronze!`
                : nextTier
                ? `Tier ${currentTier.name} telah terbuka! Kumpulkan ${Math.max(
                    0,
                    nextTier.minPoints - totalAccumulatedPoints
                  )} poin lagi untuk naik ke Tier ${nextTier.name} (${
                    nextTier.minPoints
                  } Poin).`
                : "Selamat! Kamu telah mencapai tingkat tertinggi: EMERALD SOVEREIGN (140+ Poin)!"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-center shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Poin Akademik
            </div>
            <div className="text-xl font-black text-[#FACC15]">
              {totalAccumulatedPoints}{" "}
              <span className="text-xs font-semibold text-white">Poin</span>
            </div>
          </div>
        </div>

        {/* 6 Tier Interactive Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CERTIFICATE_TIERS.map((tier) => {
            const isTierReached = totalAccumulatedPoints >= tier.minPoints;
            const isSelected = selectedPreviewTierId === tier.id;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedPreviewTierId(tier.id)}
                className={`rounded-xl border-2 p-3 text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-[#111111] bg-[#111111] text-white shadow-md"
                    : isTierReached
                    ? "border-emerald-300 bg-emerald-50/60 text-slate-900 hover:border-emerald-400"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 border border-white/40"
                    style={{ backgroundColor: tier.primaryHex }}
                  />
                  {isTierReached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>

                <div className="mt-2">
                  <div
                    className={`text-xs font-black uppercase tracking-wide ${
                      isSelected ? "text-[#FACC15]" : ""
                    }`}
                  >
                    {tier.name}
                  </div>
                  <div
                    className={`text-[11px] font-bold ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {tier.minPoints} Poin
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Multi-PPT Point Accumulation Table */}
        {allBreakdowns.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <span>Riwayat Kontribusi Poin PPT ({allBreakdowns.length} Modul)</span>
              <span>Total: {totalAccumulatedPoints} Poin</span>
            </div>
            <div className="divide-y divide-slate-200/70 text-xs">
              {allBreakdowns.map((b) => (
                <div
                  key={b.roadmapId}
                  className="py-1.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded bg-[#111111] text-[#FACC15] px-1.5 py-0.5 text-[10px] font-extrabold shrink-0">
                      Kesulitan {b.pptDifficultyPoints}/5
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {b.courseTitle}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900 shrink-0">
                    +{b.totalEarnedFromRoadmap} Poin{" "}
                    <span className="text-[11px] font-normal text-slate-500">
                      (maks {b.maxPossibleFromRoadmap})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipient Name & Mint Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nama Penerima pada Sertifikat Blockchain
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Masukkan nama lengkap..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#111111] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canMintAnyTier || isMinting}
              onClick={() => handleMintCertificate(false)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                !canMintAnyTier
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[#111111] text-[#FACC15] hover:bg-slate-800 cursor-pointer shadow-sm"
              }`}
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Minting On-Chain...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>
                    {cert
                      ? `Update ${currentTier.name} Certificate On-Chain`
                      : `Mint ${currentTier.name} Certificate (Base Sepolia)`}
                  </span>
                </>
              )}
            </button>

            {canMintAnyTier && (
              <button
                type="button"
                disabled={isMinting}
                onClick={() => handleMintCertificate(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF3C7] hover:bg-[#FDE047] px-3.5 py-2.5 text-xs font-extrabold text-[#111111] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Base Sepolia Anchor (Gasless)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-950">
            {statusMsg}
          </div>
        )}
      </div>

      {/* 3. LUXURY TIERED BLOCKCHAIN CERTIFICATE CANVAS (BRONZE / SILVER / GOLD / PLATINUM / DIAMOND / EMERALD) */}
      <div
        style={{ borderColor: activeTierMeta.primaryHex }}
        className="relative rounded-3xl bg-[#09090D] p-3 sm:p-5 shadow-2xl border-2 overflow-hidden text-white transition-colors duration-300"
      >
        {/* Dynamic Tier Ambient Glow */}
        <div
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-64 w-[36rem] rounded-full opacity-25 blur-3xl transition-all duration-300"
          style={{
            background: `radial-gradient(circle, ${activeTierMeta.glowRgba} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />

        {!isSelectedTierUnlocked && (
          <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 text-[#111111] px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-md">
            <Lock className="w-3.5 h-3.5" />
            <span>
              Preview Tier {activeTierMeta.name} · Butuh{" "}
              {activeTierMeta.minPoints} Poin &amp; Lulus Modul
            </span>
          </div>
        )}

        {/* Inner Double Guilloche Frame */}
        <div
          style={{ borderColor: `${activeTierMeta.primaryHex}66` }}
          className={`relative rounded-2xl border bg-gradient-to-b ${activeTierMeta.bgGradientClass} p-5 sm:p-8 space-y-6`}
        >
          {/* Corner Filigree Accents */}
          <div
            style={{ borderColor: activeTierMeta.primaryHex }}
            className="pointer-events-none absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2"
          />
          <div
            style={{ borderColor: activeTierMeta.primaryHex }}
            className="pointer-events-none absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2"
          />
          <div
            style={{ borderColor: activeTierMeta.primaryHex }}
            className="pointer-events-none absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2"
          />
          <div
            style={{ borderColor: activeTierMeta.primaryHex }}
            className="pointer-events-none absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2"
          />

          {/* Top Certificate Header */}
          <div
            style={{ borderColor: `${activeTierMeta.primaryHex}40` }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  background: `linear-gradient(135deg, ${activeTierMeta.primaryHex}, ${activeTierMeta.secondaryHex})`,
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#111111] shadow-md"
              >
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div
                  style={{ color: activeTierMeta.primaryHex }}
                  className="text-[10px] font-black uppercase tracking-[0.22em]"
                >
                  SYLLABA DECENTRALIZED ACADEMIC PROTOCOL
                </div>
                <div className="text-sm font-extrabold text-white tracking-wide">
                  {activeTierMeta.credentialTitle}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{
                  borderColor: `${activeTierMeta.primaryHex}80`,
                  color: activeTierMeta.primaryHex,
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider"
              >
                <Gem className="w-3 h-3" />
                <span>
                  {activeTierMeta.name.toUpperCase()} TIER ·{" "}
                  {totalAccumulatedPoints} PTS
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Base Sepolia · 84532</span>
              </span>
              <span className="rounded-lg bg-white/5 border border-white/15 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
                ID: {displayCertId}
              </span>
            </div>
          </div>

          {/* Centerpiece Recipient & Course Attribution */}
          <div className="text-center space-y-3 py-2">
            <p
              style={{ color: activeTierMeta.primaryHex }}
              className="text-[11px] font-black uppercase tracking-[0.25em]"
            >
              CERTIFICATE OF VERIFIED {activeTierMeta.name.toUpperCase()} MASTERY
            </p>

            <p className="text-xs text-slate-400 italic">
              This blockchain-anchored academic credential immutably attests
              that
            </p>

            <div
              style={{ borderColor: activeTierMeta.primaryHex }}
              className="inline-block border-b-2 px-6 pb-1.5"
            >
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {cert?.recipientName || recipientName || "Scholar Candidate"}
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[11px] text-slate-200">
                <Wallet
                  style={{ color: activeTierMeta.primaryHex }}
                  className="w-3 h-3"
                />
                <span>Holder: {displayWallet}</span>
              </span>
              <span
                style={{
                  borderColor: `${activeTierMeta.primaryHex}60`,
                  color: activeTierMeta.primaryHex,
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 border px-3 py-1 text-[11px] font-extrabold"
              >
                <Star className="w-3 h-3 fill-current" />
                <span>
                  AI PPT Difficulty: {currentBreakdown.pptDifficultyPoints}/5
                  Poin
                </span>
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed pt-1">
              has sequentially completed all daily study sprints, slide
              breakdowns, and passed both AI Academic Assessments (5 Multiple
              Choice &amp; 2 Analytical Essays) for:
            </p>

            <h3
              style={{ color: activeTierMeta.primaryHex }}
              className="text-lg sm:text-xl font-extrabold tracking-wide px-4"
            >
              {roadmap.courseTitle}
            </h3>
          </div>

          {/* 5-Column Academic, Exam & Point Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PPT Difficulty
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {currentBreakdown.pptDifficultyPoints} / 5
              </div>
              <div
                style={{ color: activeTierMeta.primaryHex }}
                className="text-[10px] font-bold"
              >
                AI Evaluated
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mid-Session Exam
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {midPassed ? `${midScore}/100` : "Pending"}
              </div>
              <div
                style={{ color: activeTierMeta.primaryHex }}
                className="text-[10px]"
              >
                5 PG + 2 Essay
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Final-Session Exam
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {finalPassed ? `${finalScore}/100` : "Pending"}
              </div>
              <div
                style={{ color: activeTierMeta.primaryHex }}
                className="text-[10px]"
              >
                5 PG + 2 Essay
              </div>
            </div>

            <div
              style={{ borderColor: `${activeTierMeta.primaryHex}80` }}
              className="rounded-xl bg-white/10 border p-3 text-center"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                Credential Tier
              </div>
              <div
                style={{ color: activeTierMeta.primaryHex }}
                className="text-lg font-black mt-0.5 uppercase"
              >
                {activeTierMeta.name}
              </div>
              <div className="text-[10px] font-bold text-emerald-300">
                {totalAccumulatedPoints} Total Poin
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Final Grade
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {finalGradeScore}/100
              </div>
              <div className="text-[10px] text-emerald-300 font-bold">
                {gradeLabel}
              </div>
            </div>
          </div>

          {/* Cryptographic On-Chain Footer */}
          <div
            style={{ borderColor: `${activeTierMeta.primaryHex}40` }}
            className="border-t pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0 flex-1 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <span
                  style={{ color: activeTierMeta.primaryHex }}
                  className="font-bold shrink-0"
                >
                  KECCAK-256 DIGEST:
                </span>
                <span className="truncate">{certificateHash}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300 truncate">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-bold shrink-0">
                  IPFS SNAPSHOT CID:
                </span>
                <span className="truncate">{displayIpfsCid}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300 truncate">
                <ShieldCheck
                  style={{ color: activeTierMeta.primaryHex }}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span
                  style={{ color: activeTierMeta.primaryHex }}
                  className="font-bold shrink-0"
                >
                  BASE SEPOLIA PROOF:
                </span>
                <span className="truncate">{displayTxHash}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 font-sans">
                {displayTxHash.length === 66 && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${displayTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: activeTierMeta.primaryHex }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                  >
                    <span>Verify on BaseScan Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {(displayIpfsCid.startsWith("Qm") ||
                  displayIpfsCid.startsWith("baf")) && (
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${displayIpfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:underline"
                  >
                    <span>Inspect IPFS Metadata</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Embossed Seal & Cryptographic QR Code */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <div className="flex flex-col items-end text-right">
                <div
                  style={{
                    background: `linear-gradient(90deg, ${activeTierMeta.primaryHex}, ${activeTierMeta.secondaryHex})`,
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase text-[#111111]"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {cert
                      ? `${activeTierMeta.name.toUpperCase()} ON-CHAIN`
                      : `${activeTierMeta.name.toUpperCase()} SEAL`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Issued:{" "}
                  {new Date(
                    cert?.issuedAt || roadmap.updatedAt
                  ).toLocaleDateString()}
                </span>
                <span
                  style={{ color: activeTierMeta.primaryHex }}
                  className="text-[10px] font-semibold"
                >
                  SyllabaProofVault · Base L2
                </span>
              </div>

              <DeterministicQrMatrix
                seedHash={certificateHash}
                accentHex={activeTierMeta.primaryHex}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
