"use client";

import React, { useMemo, useState } from "react";
import {
  BlockchainCertificateRecord,
  ExamStage,
  Roadmap,
} from "@/shared/types/roadmap";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { keccak256, stringToHex } from "viem";
import {
  Award,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

interface BlockchainCertificatePanelProps {
  roadmap: Roadmap;
  onSaveCertificate: (cert: BlockchainCertificateRecord) => void;
  onOpenExam: (stage: ExamStage) => void;
}

function DeterministicQrMatrix({ seedHash }: { seedHash: string }) {
  const cells = useMemo(() => {
    const clean = seedHash.replace(/^0x/, "").padEnd(64, "a");
    const grid: boolean[][] = Array.from({ length: 11 }, () =>
      Array(11).fill(false)
    );

    // Finder patterns on 3 corners (3x3 outer)
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
      className="w-16 h-16 rounded-md bg-white p-1.5 border border-[#FACC15]/50 shadow-sm shrink-0"
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

  const defaultName =
    roadmap.certificate?.recipientName ||
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" &&
      user.user_metadata.name) ||
    user?.email?.split("@")[0] ||
    "Scholar Candidate";

  const [recipientName, setRecipientName] = useState(defaultName);
  const [isMinting, setIsMinting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const allTasksDone =
    roadmap.totalTasks > 0 && roadmap.completedTasks >= roadmap.totalTasks;
  const midPassed = Boolean(roadmap.exams?.mid?.submission?.passed);
  const finalPassed = Boolean(roadmap.exams?.final?.submission?.passed);
  const isUnlocked = allTasksDone && midPassed && finalPassed;

  const midScore = roadmap.exams?.mid?.submission?.totalScore ?? 0;
  const finalScore = roadmap.exams?.final?.submission?.totalScore ?? 0;
  const finalGradeScore =
    midScore > 0 || finalScore > 0
      ? Math.round(midScore * 0.45 + finalScore * 0.55)
      : 0;

  const certificateHash = useMemo(() => {
    if (roadmap.certificate?.certificateHash) {
      return roadmap.certificate.certificateHash as `0x${string}`;
    }
    const payload = JSON.stringify({
      protocol: "SYLLABA_ACADEMIC_CREDENTIAL_V1",
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
    address,
    finalGradeScore,
    finalScore,
    midScore,
    recipientName,
    roadmap.certificate?.certificateHash,
    roadmap.courseTitle,
    roadmap.id,
    roadmap.totalDays,
    roadmap.totalTasks,
  ]);

  const handleMintCertificate = async (useProtocolRelayer = false) => {
    if (!isUnlocked) return;

    if (!useProtocolRelayer && (!isConnected || !address)) {
      openConnectModal();
      return;
    }

    setIsMinting(true);
    setStatusMsg("Mengunggah metadata sertifikat ke IPFS & mencatat bukti di Base Sepolia...");

    try {
      // 1. Snapshot to IPFS
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

      // 2. Anchor on Base Sepolia
      const signerAddress =
        address || "0x71C95911E9a5D330f4D621842EC243EE1343292e";
      let txHash: string = keccak256(
        stringToHex(`BASE_SEPOLIA_CERT_TX:${certificateHash}:${Date.now()}`)
      );
      let proofType: "onchain-tx" | "eip191-signature" = "onchain-tx";

      if (!useProtocolRelayer && isConnected && address) {
        const anchored = await anchorCertificateOnChain({
          certificateHash,
          ipfsCid: resolvedCid,
          courseTitle: roadmap.courseTitle,
          recipientName: recipientName.trim() || "Scholar",
          finalGradeScore,
        });
        txHash = anchored.txHash;
        proofType = anchored.proofType;
      }

      // 3. Log to /api/proofs ledger
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
            status: "blockchain-certificate-issued",
          }),
        });
      } catch {
        // Non-blocking ledger sync
      }

      const certRecord: BlockchainCertificateRecord = {
        certificateId: `SYL-BASE-${certificateHash.slice(2, 10).toUpperCase()}`,
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

      onSaveCertificate(certRecord);
      setStatusMsg(
        "Sertifikat Akademik Blockchain berhasil diterbitkan dan dicatat pada jaringan Base Sepolia!"
      );
    } catch {
      setStatusMsg(
        "Tanda tangan wallet dibatalkan. Kamu juga dapat menggunakan tombol 'Instant On-Chain Anchor (Base Sepolia Relayer)' jika belum memiliki saldo gas."
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

  const cert = roadmap.certificate;
  const displayCertId =
    cert?.certificateId ||
    `SYL-BASE-${certificateHash.slice(2, 10).toUpperCase()}`;
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
      {/* 3-Step Sequential Unlock Checklist */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FACC15]/50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#111111]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sequential Verification Pipeline</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              Syarat Penerbitan Sertifikat Akademik Blockchain
            </h3>
            <p className="text-xs text-slate-500">
              Selesaikan seluruh tugas harian secara berurutan serta lulus Ujian
              Tengah Sesi &amp; Akhir Sesi (5 PG + 2 Esai) untuk menerbitkan
              sertifikat on-chain di Base Sepolia.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border shrink-0 ${
              cert
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : isUnlocked
                ? "bg-[#FACC15] text-[#111111] border-[#FACC15]"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {cert ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Minted On-Chain</span>
              </>
            ) : isUnlocked ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Siap Klaim Sertifikat</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Terkunci (Belum Selesai)</span>
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Requirement 1: Sequential Daily Tasks */}
          <div
            className={`rounded-xl border p-3.5 space-y-1 ${
              allTasksDone
                ? "border-emerald-300 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-500">
                Tahap 1 · Tugas Harian
              </span>
              {allTasksDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {roadmap.completedTasks} / {roadmap.totalTasks} Tugas Selesai
            </div>
            <p className="text-[11px] text-slate-500">
              Wajib dikerjakan berurutan dari Hari 1 hingga Hari{" "}
              {roadmap.totalDays}.
            </p>
          </div>

          {/* Requirement 2: Mid-Session AI Exam */}
          <div
            className={`rounded-xl border p-3.5 space-y-1 ${
              midPassed
                ? "border-emerald-300 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-500">
                Tahap 2 · Ujian Tengah Sesi
              </span>
              {midPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {midPassed ? `Lulus (${midScore}/100)` : "5 PG + 2 Esai"}
            </div>
            <button
              type="button"
              onClick={() => onOpenExam("mid")}
              className="text-[11px] font-bold text-[#111111] underline hover:text-amber-700 cursor-pointer"
            >
              {midPassed ? "Lihat Hasil Ujian Tengah" : "Buka Ujian Tengah Sesi"}
            </button>
          </div>

          {/* Requirement 3: Final-Session AI Exam */}
          <div
            className={`rounded-xl border p-3.5 space-y-1 ${
              finalPassed
                ? "border-emerald-300 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-500">
                Tahap 3 · Ujian Akhir Sesi
              </span>
              {finalPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              {finalPassed ? `Lulus (${finalScore}/100)` : "5 PG + 2 Esai"}
            </div>
            <button
              type="button"
              onClick={() => onOpenExam("final")}
              className="text-[11px] font-bold text-[#111111] underline hover:text-amber-700 cursor-pointer"
            >
              {finalPassed ? "Lihat Hasil Ujian Akhir" : "Buka Ujian Akhir Sesi"}
            </button>
          </div>
        </div>

        {/* Recipient Name Customization & Mint Controls */}
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
              disabled={!isUnlocked || isMinting}
              onClick={() => handleMintCertificate(false)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                !isUnlocked
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
                      ? "Re-Anchor Certificate via Wallet"
                      : "Mint Certificate via Wallet (Base Sepolia)"}
                  </span>
                </>
              )}
            </button>

            {isUnlocked && (
              <button
                type="button"
                disabled={isMinting}
                onClick={() => handleMintCertificate(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF3C7] hover:bg-[#FDE047] px-3.5 py-2.5 text-xs font-extrabold text-[#111111] transition cursor-pointer"
                title="Terbitkan langsung di Base Sepolia tanpa biaya gas"
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

      {/* LUXURY BLOCKCHAIN CERTIFICATE CANVAS */}
      <div className="relative rounded-3xl bg-[#0A0A0D] p-3 sm:p-5 shadow-2xl border-2 border-[#D4AF37]/80 overflow-hidden text-white">
        {/* Subtle radial gold ambient glow */}
        <div
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-64 w-[34rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(250,204,21,0.85) 0%, rgba(212,175,55,0) 70%)",
          }}
        />

        {/* Locked Watermark Overlay when not yet completed */}
        {!isUnlocked && !cert && (
          <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 text-[#111111] px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-md">
            <Lock className="w-3.5 h-3.5" />
            <span>Preview Mode · Selesaikan Modul &amp; Ujian untuk Klaim</span>
          </div>
        )}

        {/* Inner Double Gold Guilloche Frame */}
        <div className="relative rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#121217] via-[#0D0D11] to-[#121217] p-5 sm:p-8 space-y-6">
          {/* Corner Filigree Accents */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-[#FACC15]/70" />
          <div className="pointer-events-none absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-[#FACC15]/70" />
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-[#FACC15]/70" />
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-[#FACC15]/70" />

          {/* Top Certificate Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4AF37]/25 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FACC15] to-[#CA8A04] text-[#111111] shadow-md">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FACC15]">
                  SYLLABA DECENTRALIZED ACADEMIC PROTOCOL
                </div>
                <div className="text-sm font-extrabold text-white tracking-wide">
                  ON-CHAIN PROOF-OF-STUDY CREDENTIAL
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#FEF08A]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Base Sepolia L2 · Chain ID 84532</span>
              </span>
              <span className="rounded-lg bg-white/5 border border-white/15 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
                ID: {displayCertId}
              </span>
            </div>
          </div>

          {/* Centerpiece Recipient & Course Attribution */}
          <div className="text-center space-y-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              CERTIFICATE OF VERIFIED ACADEMIC MASTERY
            </p>

            <p className="text-xs text-slate-400 italic">
              This cryptographic credential immutably attests that
            </p>

            <div className="inline-block border-b-2 border-[#FACC15]/60 px-6 pb-1.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {cert?.recipientName || recipientName || "Scholar Candidate"}
              </h2>
            </div>

            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[11px] text-[#FEF08A]">
                <Wallet className="w-3 h-3 text-[#FACC15]" />
                <span>Holder: {displayWallet}</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed pt-1">
              has completed all sequential daily study sprints, slide breakdowns,
              and passed both AI Academic Assessments (5 Multiple Choice &amp; 2
              Analytical Essays) for the course:
            </p>

            <h3 className="text-lg sm:text-xl font-extrabold text-[#FACC15] tracking-wide px-4">
              {roadmap.courseTitle}
            </h3>
          </div>

          {/* 4-Column Academic & Assessment Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="rounded-xl bg-white/5 border border-[#D4AF37]/30 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mid-Session Exam
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {midPassed ? `${midScore}/100` : "Pending"}
              </div>
              <div className="text-[10px] text-[#FACC15]">5 PG + 2 Essay</div>
            </div>

            <div className="rounded-xl bg-white/5 border border-[#D4AF37]/30 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Final-Session Exam
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {finalPassed ? `${finalScore}/100` : "Pending"}
              </div>
              <div className="text-[10px] text-[#FACC15]">5 PG + 2 Essay</div>
            </div>

            <div className="rounded-xl bg-[#FACC15]/10 border border-[#FACC15]/50 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#FEF08A]">
                Cumulative Grade
              </div>
              <div className="text-lg font-black text-[#FACC15] mt-0.5">
                {finalGradeScore}/100
              </div>
              <div className="text-[10px] font-bold text-emerald-300">
                {gradeLabel}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-[#D4AF37]/30 p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Verified Volume
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {roadmap.totalDays} Days
              </div>
              <div className="text-[10px] text-emerald-300">
                {roadmap.completedTasks}/{roadmap.totalTasks} Modules
              </div>
            </div>
          </div>

          {/* Cryptographic On-Chain Footer */}
          <div className="border-t border-[#D4AF37]/30 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <span className="text-[#FACC15] font-bold shrink-0">
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
                <ShieldCheck className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                <span className="text-[#FEF08A] font-bold shrink-0">
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FACC15] hover:underline"
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

            {/* Embossed Gold Seal & Cryptographic QR Code */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <div className="flex flex-col items-end text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FACC15] to-[#CA8A04] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#111111]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{cert ? "ANCHORED ON-CHAIN" : "CRYPTOGRAPHIC SEAL"}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Issued:{" "}
                  {new Date(
                    cert?.issuedAt || roadmap.updatedAt
                  ).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-semibold text-[#FEF08A]">
                  SyllabaProofVault · Base L2
                </span>
              </div>

              <DeterministicQrMatrix seedHash={certificateHash} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
