"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BlockchainCertificateRecord,
  ExamStage,
  Roadmap,
} from "@/shared/types/roadmap";
import { computeRoadmapPointBreakdown } from "@/shared/utils/certificateTiers";
import { resolveOwnerScope } from "@/client/utils/storage";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";
import { ScannableQrCode } from "@/client/components/common/ScannableQrCode";
import { keccak256, stringToHex } from "viem";
import {
  ArrowRight,
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
  onOpenTierExchange?: () => void;
}

export function BlockchainCertificatePanel({
  roadmap,
  onSaveCertificate,
  onOpenExam,
  onOpenTierExchange,
}: BlockchainCertificatePanelProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isId = lang === "id";
  const {
    address,
    chainId,
    isConnected,
    openConnectModal,
    signPersonalMessage,
    anchorCertificateOnChain,
    syllabaSbtAddress,
    deploySbtContractOnChain,
  } = useWeb3();
  const [isDeployingSbt, setIsDeployingSbt] = useState(false);

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
  const [isMinting, setIsMinting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showProofJson, setShowProofJson] = useState(false);

  useEffect(() => {
    setRecipientName(defaultName);
  }, [defaultName, currentScope]);

  const breakdown = useMemo(
    () => computeRoadmapPointBreakdown(roadmap),
    [roadmap]
  );

  const allTasksDone = breakdown.allTasksDone;
  const midPassed = breakdown.midExamPassed;
  const finalPassed = breakdown.finalExamPassed;
  const isModuleCompleted = breakdown.isFullyCompletedAtEnd;

  const midScore = roadmap.exams?.mid?.submission?.totalScore ?? 0;
  const finalScore = roadmap.exams?.final?.submission?.totalScore ?? 0;
  const finalGradeScore =
    midScore > 0 || finalScore > 0
      ? Math.round(midScore * 0.45 + finalScore * 0.55)
      : 0;

  const certificateHash = useMemo(() => {
    if (ownedCert?.certificateHash) {
      return ownedCert.certificateHash as `0x${string}`;
    }
    const payload = JSON.stringify({
      protocol: "SYLLABA_COURSE_GRADUATION_V2",
      ownerScope: currentScope,
      roadmapId: roadmap.id,
      courseTitle: roadmap.courseTitle,
      pptDifficultyPoints: breakdown.pptDifficultyPoints,
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
    address,
    breakdown.pptDifficultyPoints,
    currentScope,
    finalGradeScore,
    finalScore,
    midScore,
    ownedCert?.certificateHash,
    recipientName,
    roadmap.courseTitle,
    roadmap.id,
    roadmap.totalDays,
    roadmap.totalTasks,
  ]);

  const handleMintCertificate = async (useProtocolRelayer = false) => {
    if (!isModuleCompleted) return;

    if (!useProtocolRelayer && (!isConnected || !address)) {
      openConnectModal();
      return;
    }

    setIsMinting(true);
    setStatusMsg(
      isId
        ? `Menerbitkan Sertifikat Kelulusan PPT "${roadmap.courseTitle}"...`
        : `Issuing Course Completion Certificate for "${roadmap.courseTitle}"...`
    );

    try {
      let resolvedCid = `snapshot-${certificateHash.slice(2, 34).toLowerCase()}`;
      let resolvedStorageMode: "pinata-ipfs" | "canonical-digest" =
        "canonical-digest";
      try {
        const snapRes = await fetch("/api/ipfs/snapshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roadmap }),
        });
        if (snapRes.ok) {
          const snap = await snapRes.json();
          if (snap.ipfsCid) resolvedCid = snap.ipfsCid;
          if (snap.storageMode === "pinata-ipfs") {
            resolvedStorageMode = "pinata-ipfs";
          }
        }
      } catch {
        // Fallback deterministic canonical digest
      }

      const signerAddress =
        address || "0x71C95911E9a5D330f4D621842EC243EE1343292e";
      let txHash: string = keccak256(
        stringToHex(
          `SYLLABA_COURSE_ATTEST:${roadmap.id}:${certificateHash}:${Date.now()}`
        )
      );
      let proofType: "onchain-tx" | "eip191-signature" | "local-attestation" =
        "local-attestation";
      let sbtAddressUsed: string | undefined;

      if (!useProtocolRelayer && isConnected && address) {
        const anchored = await anchorCertificateOnChain({
          certificateHash,
          ipfsCid: resolvedCid,
          courseTitle: `${roadmap.courseTitle} [PPT COMPLETION]`,
          recipientName: recipientName.trim() || "Scholar",
          finalGradeScore,
          certKind: "COURSE_PASS",
          points: breakdown.pptDifficultyPoints,
        });
        txHash = anchored.txHash;
        proofType = anchored.proofType;
        sbtAddressUsed = anchored.sbtAddress;
      } else if (useProtocolRelayer && isConnected && address) {
        txHash = await signPersonalMessage(
          `Syllaba Course Completion Certificate\nCourse: ${roadmap.courseTitle}\nRecipient: ${recipientName.trim() || "Scholar"}\nWallet: ${address}\nFinal Score: ${finalGradeScore}/100\nCertificate Hash: ${certificateHash}\nSnapshot Ref: ${resolvedCid}\nChain: Base Sepolia (84532)`
        );
        proofType = "eip191-signature";
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
            status:
              proofType === "onchain-tx"
                ? "cert-course-onchain"
                : "cert-course-attested",
          }),
        });
      } catch {
        // Non-blocking ledger sync
      }

      const certRecord: BlockchainCertificateRecord = {
        certificateId: `SYL-PPT-${certificateHash.slice(2, 9).toUpperCase()}`,
        ownerScope: currentScope,
        tier: "bronze",
        totalPointsAtIssue: breakdown.totalEarnedFromRoadmap,
        totalSylCoinsAtIssue: breakdown.totalSylFromRoadmap,
        pptDifficultyPoints: breakdown.pptDifficultyPoints,
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
        ipfsStorageMode: resolvedStorageMode,
        txHash,
        sbtContractAddress: sbtAddressUsed || syllabaSbtAddress,
        chainId: 84532,
        proofType,
        issuedAt: new Date().toISOString(),
      };

      onSaveCertificate(certRecord);
      setStatusMsg(
        proofType === "onchain-tx"
          ? isId
            ? `Sertifikat Kelulusan PPT "${roadmap.courseTitle}" berhasil di-mint On-Chain ke Base Sepolia! TX siap dicek di BaseScan.`
            : `Course Completion Certificate broadcasted On-Chain to Base Sepolia! Verifiable on BaseScan.`
          : proofType === "eip191-signature"
          ? isId
            ? `Sertifikat Kelulusan PPT berhasil ditandatangani (EIP-191 Gasless Attestation). Unduh/inspeksi Proof JSON atau mint TX dengan Base Sepolia ETH.`
            : `Course Completion Certificate signed via EIP-191 Gasless Attestation.`
          : isId
          ? `Sertifikat Kelulusan PPT tercatat secara lokal. Hubungkan wallet Web3 untuk tanda tangan EIP-191 atau transaksi Base Sepolia.`
          : `Local Course Certificate recorded. Connect a Web3 wallet for EIP-191 or Base Sepolia TX.`
      );
    } catch {
      setStatusMsg(
        isId
          ? "Transaksi wallet dibatalkan. Gunakan tombol 'Sign Cryptographic Attestation (Gasless)' jika belum memiliki saldo ETH testnet."
          : "Wallet transaction cancelled. Use 'Sign Cryptographic Attestation (Gasless)' if you do not have testnet ETH."
      );
    } finally {
      setIsMinting(false);
    }
  };

  const cert = ownedCert;
  const displayCertId =
    cert?.certificateId ||
    `SYL-PPT-${certificateHash.slice(2, 9).toUpperCase()}`;
  const displayWallet =
    cert?.walletAddress || address || "Connect Web3 Wallet to Bind Address";
  const displayTxHash = cert?.txHash || "Preview Mode (Not Minted Yet)";
  const displayIpfsCid =
    cert?.ipfsCid || `snapshot-${certificateHash.slice(2, 34).toLowerCase()}`;

  const hasRealOnChainTx = Boolean(
    cert &&
      cert.proofType === "onchain-tx" &&
      cert.txHash.startsWith("0x") &&
      cert.txHash.length === 66 &&
      cert.walletAddress !== "0x71C95911E9a5D330f4D621842EC243EE1343292e"
  );
  const hasRealPinataIpfs = Boolean(
    cert &&
      cert.ipfsStorageMode === "pinata-ipfs" &&
      (cert.ipfsCid.startsWith("Qm") || cert.ipfsCid.startsWith("baf"))
  );
  const hasValidWalletAddr =
    /^0x[0-9a-fA-F]{40}$/.test(displayWallet) &&
    displayWallet !== "0x71C95911E9a5D330f4D621842EC243EE1343292e";

  const qrVerificationUrl = useMemo(() => {
    if (hasRealOnChainTx) {
      return `https://sepolia.basescan.org/tx/${displayTxHash}`;
    }
    const proofCode =
      cert?.proofType === "eip191-signature"
        ? "sig"
        : cert?.proofType === "local-attestation"
        ? "loc"
        : "pre";
    const qs = new URLSearchParams({
      i: displayCertId,
      t: "ppt",
      p: String(cert?.totalPointsAtIssue ?? breakdown.pptDifficultyPoints),
      g: String(cert?.finalGradeScore ?? finalGradeScore),
      n: (cert?.recipientName || recipientName.trim() || "Scholar").slice(
        0,
        12
      ),
      h: certificateHash.slice(2, 10),
      m: proofCode,
    });
    return `https://syllaba.xyz/v?${qs.toString()}`;
  }, [
    breakdown.pptDifficultyPoints,
    cert,
    certificateHash,
    displayCertId,
    displayTxHash,
    finalGradeScore,
    hasRealOnChainTx,
    recipientName,
  ]);

  const proofMetadataPayload = useMemo(
    () => ({
      schema: "syllaba.course.certificate.v1",
      certificateId: displayCertId,
      type: "COURSE_COMPLETION",
      recipientName: cert?.recipientName || recipientName.trim() || "Scholar",
      walletAddress: displayWallet,
      courseTitle: roadmap.courseTitle,
      roadmapId: roadmap.id,
      pptDifficultyPoints: breakdown.pptDifficultyPoints,
      creditedSylCoins: breakdown.totalSylFromRoadmap,
      scores: {
        midExam: cert?.midExamScore ?? midScore,
        finalExam: cert?.finalExamScore ?? finalScore,
        finalGrade: cert?.finalGradeScore ?? finalGradeScore,
      },
      cryptography: {
        network: "Base Sepolia",
        chainId: cert?.chainId ?? 84532,
        proofType: cert?.proofType ?? "preview",
        certificateHash,
        snapshotRef: displayIpfsCid,
        ipfsStorageMode: cert?.ipfsStorageMode ?? "canonical-digest",
        txOrSignature: cert?.txHash ?? null,
      },
      issuedAt: cert?.issuedAt ?? null,
      basescanTxUrl: hasRealOnChainTx
        ? `https://sepolia.basescan.org/tx/${displayTxHash}`
        : null,
      pinataIpfsUrl: hasRealPinataIpfs
        ? `https://gateway.pinata.cloud/ipfs/${displayIpfsCid}`
        : null,
    }),
    [
      breakdown.pptDifficultyPoints,
      breakdown.totalSylFromRoadmap,
      cert,
      certificateHash,
      displayCertId,
      displayIpfsCid,
      displayTxHash,
      displayWallet,
      finalGradeScore,
      finalScore,
      hasRealOnChainTx,
      hasRealPinataIpfs,
      midScore,
      recipientName,
      roadmap.courseTitle,
      roadmap.id,
    ]
  );

  const handleDownloadProofJson = () => {
    if (typeof window === "undefined") return;
    const blob = new Blob([JSON.stringify(proofMetadataPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayCertId}-proof.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gradeLabel =
    finalGradeScore >= 85
      ? "SUMMA CUM LAUDE"
      : finalGradeScore >= 75
      ? "MAGNA CUM LAUDE"
      : finalGradeScore >= 60
      ? "VERIFIED GRADUATE"
      : "IN PROGRESS";

  const accentHex = "#FACC15";
  const secondaryHex = "#CA8A04";

  return (
    <div className="space-y-5">
      {/* 1. PER-PPT COMPLETION STATUS & CONTRIBUTION TO SIDEBAR TIER EXCHANGE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] text-[#FACC15] px-3 py-0.5 text-[11px] font-extrabold">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>
                  {isId
                    ? "Sertifikat Kelulusan PPT Ini"
                    : "Course Completion Certificate"}
                </span>
              </div>
              {onOpenTierExchange && (
                <button
                  type="button"
                  onClick={onOpenTierExchange}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] hover:bg-[#FDE047] border border-[#FACC15]/70 px-2.5 py-0.5 text-[10px] font-extrabold text-[#111111] transition cursor-pointer"
                >
                  <Gem className="w-3 h-3 text-amber-700" />
                  <span>
                    {isId
                      ? "Tukar Sertifikat Bronze (20+ Poin) & $SYL di Sidebar"
                      : "Exchange Bronze Tier (20+ Pts) & $SYL in Sidebar"}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {roadmap.courseTitle}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isId
                ? `Sertifikat ini khusus membuktikan kelulusan kamu pada materi PPT "${roadmap.courseTitle}". Setelah lulus semua tugas & 2 ujian AI, sertifikat kelulusan PPT ini langsung terbuka — sekaligus menyetor +${breakdown.pptDifficultyPoints} Poin dan +${breakdown.pendingSylCoins} $SYL ke menu Tukar Sertifikat (Bronze 20 Poin+) di Sidebar.`
                : `This certificate exclusively certifies your graduation for "${roadmap.courseTitle}", while contributing +${breakdown.pptDifficultyPoints} Pts and +${breakdown.pendingSylCoins} $SYL toward Tier Exchange in the Sidebar.`}
            </p>
          </div>

          <div className="rounded-2xl bg-[#111111] text-white px-4 py-3 text-center shrink-0 border border-[#FACC15]/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Bobot Kesulitan PPT
            </div>
            <div className="flex items-center justify-center gap-1 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= breakdown.pptDifficultyPoints
                      ? "text-[#FACC15] fill-[#FACC15]"
                      : "text-slate-600"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs font-black text-[#FACC15]">
              {isModuleCompleted
                ? `+${breakdown.pptDifficultyPoints} Poin Disetor ✓`
                : `+${breakdown.pptDifficultyPoints} Poin Saat Lulus`}
            </div>
          </div>
        </div>

        {/* 3 Checkpoints for THIS PPT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div
            className={`rounded-xl border p-3 ${
              allTasksDone
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              1 &middot; Tugas Harian PPT Ini
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {roadmap.completedTasks} / {roadmap.totalTasks} Selesai
            </div>
            <div className="text-[11px] text-slate-500">
              {allTasksDone ? "Seluruh materi tuntas" : "Selesaikan berurutan"}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              midPassed
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              2 &middot; Ujian Tengah Sesi (5 PG + 2 Esai)
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {midPassed ? `Lulus (${midScore}/100)` : "Belum Lulus"}
            </div>
            <button
              type="button"
              onClick={() => onOpenExam("mid")}
              className="text-[11px] font-bold text-[#111111] underline hover:text-amber-700 cursor-pointer"
            >
              {midPassed ? "Lihat Pembahasan UTS" : "Kerjakan Ujian Tengah"}
            </button>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              finalPassed
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              3 &middot; Ujian Akhir Sesi (5 PG + 2 Esai)
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {finalPassed ? `Lulus (${finalScore}/100)` : "Belum Lulus"}
            </div>
            <button
              type="button"
              onClick={() => onOpenExam("final")}
              className="text-[11px] font-bold text-[#111111] underline hover:text-amber-700 cursor-pointer"
            >
              {finalPassed ? "Lihat Pembahasan UAS" : "Kerjakan Ujian Akhir"}
            </button>
          </div>
        </div>

        {/* Recipient Name & Mint Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isId
                ? "Nama Penerima Sertifikat Kelulusan PPT"
                : "Course Certificate Recipient Name"}
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
              disabled={!isModuleCompleted || isMinting}
              onClick={() => handleMintCertificate(false)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                !isModuleCompleted
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[#111111] text-[#FACC15] hover:bg-slate-800 cursor-pointer shadow-sm"
              }`}
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Issuing...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>
                    {cert
                      ? "Update Sertifikat PPT (Base Sepolia)"
                      : "Mint Sertifikat Lulus PPT (Base Sepolia)"}
                  </span>
                </>
              )}
            </button>

            {isModuleCompleted && (
              <button
                type="button"
                disabled={isMinting}
                onClick={() => handleMintCertificate(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF3C7] hover:bg-[#FDE047] px-3.5 py-2.5 text-xs font-extrabold text-[#111111] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign Cryptographic Attestation (Gasless)</span>
              </button>
            )}

            {isModuleCompleted && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            )}

            {!syllabaSbtAddress && (
              <button
                type="button"
                disabled={isDeployingSbt}
                onClick={async () => {
                  if (!isConnected || !address) {
                    openConnectModal();
                    return;
                  }
                  setIsDeployingSbt(true);
                  setStatusMsg(
                    isId
                      ? "Mengirim transaksi deploy ERC-721 SyllabaCertificateSBT ke Base Sepolia..."
                      : "Deploying ERC-721 SyllabaCertificateSBT to Base Sepolia..."
                  );
                  try {
                    const res = await deploySbtContractOnChain();
                    setStatusMsg(
                      res.contractAddress
                        ? isId
                          ? `Smart Contract ERC-721 SBT Sertifikat aktif di Base Sepolia: ${res.contractAddress}. Klik Mint Sertifikat untuk menerima NFT!`
                          : `ERC-721 SBT Certificate Contract deployed at ${res.contractAddress}!`
                        : `SBT deploy TX sent (${res.txHash.slice(0, 14)}...).`
                    );
                  } catch {
                    setStatusMsg(
                      isId
                        ? "Deploy SBT dibatalkan atau membutuhkan sedikit ETH Base Sepolia."
                        : "SBT deploy cancelled or needs Base Sepolia ETH gas."
                    );
                  } finally {
                    setIsDeployingSbt(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/60 bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 text-xs font-extrabold text-emerald-900 transition cursor-pointer"
              >
                {isDeployingSbt ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploying SBT...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Deploy ERC-721 SBT</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {statusMsg && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-950">
            {statusMsg}
          </div>
        )}
      </div>

      {/* 2. COURSE COMPLETION CERTIFICATE VAULT (SEALED UNTIL TASKS + 2 EXAMS PASSED) */}
      <div
        style={{ borderColor: accentHex }}
        className="relative rounded-3xl bg-[#09090D] p-3 sm:p-5 shadow-2xl border-2 overflow-hidden text-white"
      >
        {!isModuleCompleted ? (
          <div
            style={{ borderColor: `${accentHex}44` }}
            className="relative rounded-2xl border bg-gradient-to-b from-[#17140B] via-[#0E0C07] to-[#17140B] p-8 sm:p-12 text-center space-y-4"
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${accentHex}, ${secondaryHex})`,
              }}
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-[#111111] shadow-lg"
            >
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <div
                style={{ color: accentHex }}
                className="text-xs font-black uppercase tracking-[0.22em]"
              >
                SERTIFIKAT KELULUSAN PPT TERKUNCI
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {roadmap.courseTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isId
                  ? "Sertifikat Kelulusan PPT, QR Code verifikasi, Proof JSON, dan tombol Print disegel hingga seluruh tugas harian serta Ujian Tengah & Ujian Akhir Sesi dinyatakan lulus."
                  : "This Course Completion Certificate, QR Code, Proof JSON, and Print button stay sealed until all daily tasks, Mid Exam, and Final Exam pass."}
              </p>
            </div>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-bold text-slate-200">
              <span>
                Tugas: {roadmap.completedTasks}/{roadmap.totalTasks}
              </span>
              <span>&middot;</span>
              <span>UTS: {midPassed ? "Lulus" : "Belum"}</span>
              <span>&middot;</span>
              <span>UAS: {finalPassed ? "Lulus" : "Belum"}</span>
            </div>
          </div>
        ) : (
        <div
          style={{ borderColor: `${accentHex}55` }}
          className="relative rounded-2xl border bg-gradient-to-b from-[#17140B] via-[#0E0C07] to-[#17140B] p-5 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div
            style={{ borderColor: `${accentHex}40` }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  background: `linear-gradient(135deg, ${accentHex}, ${secondaryHex})`,
                }}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#111111] shadow-md shrink-0"
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
                  Syllaba Course Completion Credential
                </p>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  SERTIFIKAT KELULUSAN MODUL PPT
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-0.5 font-bold text-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>BASE SEPOLIA &middot; 84532</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-slate-200">
                ID: {displayCertId}
              </span>
            </div>
          </div>

          {/* Recipient & Course Statement */}
          <div className="text-center space-y-2 py-2">
            <p
              style={{ color: accentHex }}
              className="text-xs uppercase tracking-[0.25em] font-semibold"
            >
              Certificate of Verified Course Mastery
            </p>
            <p className="text-xs text-slate-300 italic">
              This academic credential certifies that
            </p>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white pt-1">
              {cert?.recipientName || recipientName.trim() || "Scholar Candidate"}
            </div>
            <div
              style={{
                background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`,
              }}
              className="mx-auto w-56 h-[1.5px]"
            />
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 font-mono text-[11px] text-slate-200">
                <Wallet style={{ color: accentHex }} className="w-3 h-3" />
                <span>Holder: {displayWallet}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-[11px] font-bold text-[#FEF08A]">
                <Star className="w-3 h-3" />
                <span>Bobot PPT: {breakdown.pptDifficultyPoints}/5 Poin</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 pt-2 max-w-2xl mx-auto leading-relaxed">
              has completed all sequential daily study sprints and passed both the
              Mid-Session Exam and Final-Session Exam for the PPT module:
            </p>
            <div
              style={{ color: accentHex }}
              className="text-base sm:text-lg font-extrabold"
            >
              {roadmap.courseTitle}
            </div>
          </div>

          {/* Per-PPT Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Tasks Completed
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {roadmap.completedTasks} / {roadmap.totalTasks}
              </div>
              <div className="text-[10px] text-slate-400">
                {roadmap.totalDays} Days
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Mid-Session Exam
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {midPassed ? `${midScore}/100` : "Pending"}
              </div>
              <div className="text-[10px] text-slate-400">5 PG + 2 Esai</div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Final-Session Exam
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {finalPassed ? `${finalScore}/100` : "Pending"}
              </div>
              <div className="text-[10px] text-slate-400">5 PG + 2 Esai</div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Final Grade
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {finalGradeScore}/100
              </div>
              <div className="text-[10px] font-bold text-emerald-400">
                {gradeLabel}
              </div>
            </div>
          </div>

          {/* Cryptographic Footer & Scannable QR Code */}
          <div
            style={{ borderColor: `${accentHex}40` }}
            className="border-t pt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div className="space-y-1.5 font-mono text-[11px] min-w-0 flex-1">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <ShieldCheck
                  style={{ color: accentHex }}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span style={{ color: accentHex }} className="font-bold shrink-0">
                  KECCAK-256 DIGEST:
                </span>
                <span className="truncate">{certificateHash}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300 truncate">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-bold shrink-0">
                  SNAPSHOT REF:
                </span>
                <span className="truncate">{displayIpfsCid}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-300 truncate">
                <ShieldCheck
                  style={{ color: accentHex }}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span style={{ color: accentHex }} className="font-bold shrink-0">
                  {hasRealOnChainTx
                    ? "BASE SEPOLIA TX:"
                    : cert?.proofType === "eip191-signature"
                    ? "EIP-191 SIGNATURE:"
                    : "VERIFICATION PROOF:"}
                </span>
                <span className="truncate">{displayTxHash}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 font-sans">
                {hasRealOnChainTx ? (
                  <a
                    href={`https://sepolia.basescan.org/tx/${displayTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: accentHex }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                  >
                    <span>Verify TX on BaseScan Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : hasValidWalletAddr ? (
                  <a
                    href={`https://sepolia.basescan.org/address/${displayWallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: accentHex }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                  >
                    <span>Verify Wallet on BaseScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}

                {hasRealPinataIpfs && (
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

                {hasRealOnChainTx && cert?.sbtContractAddress && (
                  <a
                    href={`https://sepolia.basescan.org/token/${cert.sbtContractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FACC15] hover:underline"
                  >
                    <span>Inspect ERC-721 SBT Contract</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowProofJson((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:underline cursor-pointer"
                >
                  <Database className="w-3 h-3" />
                  <span>
                    {showProofJson
                      ? "Hide Proof Metadata (.json)"
                      : "Inspect Proof Metadata (.json)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadProofJson}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-200 hover:text-white hover:underline cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Proof (.json)</span>
                </button>
              </div>

              {showProofJson && (
                <pre className="mt-2 max-h-56 overflow-auto rounded-xl border border-white/15 bg-black/70 p-3 text-[10px] leading-relaxed text-emerald-200 whitespace-pre-wrap break-all">
                  {JSON.stringify(proofMetadataPayload, null, 2)}
                </pre>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <div className="flex flex-col items-end text-right">
                <div
                  style={{
                    background: `linear-gradient(90deg, ${accentHex}, ${secondaryHex})`,
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase text-[#111111]"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {hasRealOnChainTx
                      ? "PPT GRADUATED ON-CHAIN"
                      : cert?.proofType === "eip191-signature"
                      ? "PPT EIP-191 SIGNED"
                      : cert
                      ? "PPT GRADUATED ATTESTED"
                      : "PPT GRADUATION PREVIEW"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Issued:{" "}
                  {new Date(
                    cert?.issuedAt || roadmap.updatedAt
                  ).toLocaleDateString()}
                </span>
                <span
                  style={{ color: accentHex }}
                  className="text-[10px] font-semibold"
                >
                  SyllabaProofVault &middot; Base L2
                </span>
              </div>

              <ScannableQrCode
                value={qrVerificationUrl}
                accentHex={accentHex}
                title={
                  isId
                    ? "Scan QR dengan kamera HP atau klik untuk verifikasi kelulusan PPT ini"
                    : "Scan QR with phone camera or click to verify course completion"
                }
              />
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
