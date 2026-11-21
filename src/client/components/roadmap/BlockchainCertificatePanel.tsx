"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BlockchainCertificateRecord,
  CertificateTierId,
  ExamStage,
  Roadmap,
  SyllabaCoinClaimRecord,
  SyllabaCoinRedemptionRecord,
  SylPerkId,
} from "@/shared/types/roadmap";
import {
  CERTIFICATE_TIERS,
  SYL_COIN_PERKS,
  computeGlobalAcademicPoints,
  getStoredSylClaims,
  getStoredSylRedemptions,
  getTierMetaById,
  saveSylClaimRecord,
  saveSylRedemptionRecord,
} from "@/shared/utils/certificateTiers";
import { getStoredRoadmaps, resolveOwnerScope } from "@/client/utils/storage";
import { generateId } from "@/shared/utils";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";
import { keccak256, stringToHex } from "viem";
import {
  Award,
  BrainCircuit,
  CheckCircle2,
  Coins,
  Cpu,
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
  const { lang } = useLanguage();
  const isId = lang === "id";
  const {
    address,
    chainId,
    isConnected,
    openConnectModal,
    signPersonalMessage,
    anchorCertificateOnChain,
    claimSylCoinsOnChain,
    sylCoinAddress,
    onChainSylBalance,
    deployCoinContractOnChain,
    redeemPerkOnChain,
    watchSylTokenInWallet,
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
  const [sylClaims, setSylClaims] = useState<SyllabaCoinClaimRecord[]>([]);
  const [sylRedemptions, setSylRedemptions] = useState<
    SyllabaCoinRedemptionRecord[]
  >([]);
  const [selectedPreviewTierId, setSelectedPreviewTierId] =
    useState<CertificateTierId>(ownedCert?.tier || "bronze");
  const [isMinting, setIsMinting] = useState(false);
  const [isDeployingCoin, setIsDeployingCoin] = useState(false);
  const [isClaimingSyl, setIsClaimingSyl] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [coinStatusMsg, setCoinStatusMsg] = useState<string | null>(null);
  const [showProofJson, setShowProofJson] = useState(false);

  // Sync recipientName when user account changes
  useEffect(() => {
    setRecipientName(defaultName);
  }, [defaultName, currentScope]);

  // Strictly load ONLY roadmaps and $SYL coin records belonging to currentScope (never mix guest or other users)
  useEffect(() => {
    const list = getStoredRoadmaps(currentScope);
    setStoredHistory([...list, roadmap]);
    setSylClaims(getStoredSylClaims(currentScope));
    setSylRedemptions(getStoredSylRedemptions(currentScope));
  }, [currentScope, roadmap]);

  const pointsSummary = useMemo(
    () => computeGlobalAcademicPoints(roadmap, storedHistory, currentScope),
    [currentScope, roadmap, storedHistory]
  );

  const {
    currentBreakdown,
    allBreakdowns,
    totalAccumulatedPoints,
    totalEarnedSylCoins,
    tierBonusSylCoins,
    currentTier,
    nextTier,
    isBronzeUnlocked,
  } = pointsSummary;

  const totalClaimedSylOnChain = useMemo(
    () => sylClaims.reduce((sum, c) => sum + c.amountSyl, 0),
    [sylClaims]
  );
  const totalRedeemedSyl = useMemo(
    () => sylRedemptions.reduce((sum, r) => sum + r.costSyl, 0),
    [sylRedemptions]
  );
  const availableSylToSpend = Math.max(
    0,
    totalEarnedSylCoins - totalRedeemedSyl
  );
  const unclaimedSylForWallet = Math.max(
    0,
    totalEarnedSylCoins - totalClaimedSylOnChain
  );

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
          `SYLLABA_ATTESTATION:${targetTier.id}:${certificateHash}:${Date.now()}`
        )
      );
      let proofType: "onchain-tx" | "eip191-signature" | "local-attestation" =
        "local-attestation";

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
      } else if (useProtocolRelayer && isConnected && address) {
        txHash = await signPersonalMessage(
          `Syllaba Gasless Certificate Attestation\nTier: ${targetTier.name.toUpperCase()}\nRecipient: ${recipientName.trim() || "Scholar"}\nWallet: ${address}\nCourse: ${roadmap.courseTitle}\nFinal Score: ${finalGradeScore}/100\nCertificate Hash: ${certificateHash}\nSnapshot Ref: ${resolvedCid}\nChain: Base Sepolia (84532)`
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
                ? `cert-${targetTier.id}-onchain`
                : `cert-${targetTier.id}-attested`,
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
        totalSylCoinsAtIssue: totalEarnedSylCoins,
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
        ipfsStorageMode: resolvedStorageMode,
        txHash,
        chainId: 84532,
        proofType,
        issuedAt: new Date().toISOString(),
      };

      setSelectedPreviewTierId(targetTier.id);
      onSaveCertificate(certRecord);
      setStatusMsg(
        proofType === "onchain-tx"
          ? isId
            ? `Sertifikat Tier ${targetTier.name.toUpperCase()} (${totalAccumulatedPoints} Poin) berhasil di-mint On-Chain ke Base Sepolia! TX siap diverifikasi di BaseScan.`
            : `Tier ${targetTier.name.toUpperCase()} Certificate (${totalAccumulatedPoints} Pts) broadcasted On-Chain to Base Sepolia! TX verifiable on BaseScan.`
          : proofType === "eip191-signature"
          ? isId
            ? `Sertifikat Tier ${targetTier.name.toUpperCase()} berhasil ditandatangani (EIP-191 Gasless Attestation). Unduh/inspeksi Proof JSON di bawah atau mint dengan Base Sepolia ETH untuk TX BaseScan.`
            : `Tier ${targetTier.name.toUpperCase()} Certificate signed via EIP-191 Gasless Attestation. Inspect/download the Proof JSON below or mint with testnet ETH for a BaseScan TX.`
          : isId
          ? `Bukti lokal Sertifikat Tier ${targetTier.name.toUpperCase()} tercatat. Hubungkan wallet Web3 untuk tanda tangan EIP-191 atau transaksi Base Sepolia.`
          : `Local certificate attestation recorded for Tier ${targetTier.name.toUpperCase()}. Connect a Web3 wallet for EIP-191 signature or Base Sepolia TX.`
      );
    } catch {
      setStatusMsg(
        isId
          ? "Transaksi wallet dibatalkan. Gunakan tombol 'Sign Cryptographic Attestation (Gasless)' jika belum memiliki saldo gas Base Sepolia."
          : "Wallet transaction cancelled. Use 'Sign Cryptographic Attestation (Gasless)' if you do not have Base Sepolia testnet ETH yet."
      );
    } finally {
      setIsMinting(false);
    }
  };

  const handleDeployCoinContract = async () => {
    if (!isConnected || !address) {
      openConnectModal();
      return;
    }
    setIsDeployingCoin(true);
    setCoinStatusMsg(
      isId
        ? "Mengirim transaksi deploy Smart Contract ERC-20 SyllabaCoin ($SYL) ke Base Sepolia..."
        : "Deploying SyllabaCoin ($SYL) ERC-20 Smart Contract to Base Sepolia..."
    );
    try {
      const result = await deployCoinContractOnChain();
      if (result.contractAddress) {
        setCoinStatusMsg(
          isId
            ? `Smart Contract ERC-20 $SYL berhasil di-deploy ke Base Sepolia! Alamat kontrak: ${result.contractAddress}`
            : `$SYL ERC-20 Smart Contract deployed on Base Sepolia at ${result.contractAddress}!`
        );
      } else {
        setCoinStatusMsg(
          isId
            ? `Transaksi deploy dikirim (${result.txHash.slice(0, 14)}...). Menunggu konfirmasi blok Base Sepolia.`
            : `Deployment TX broadcast (${result.txHash.slice(0, 14)}...). Waiting for block confirmation.`
        );
      }
    } catch {
      setCoinStatusMsg(
        isId
          ? "Deploy kontrak dibatalkan atau saldo Base Sepolia ETH tidak mencukupi gas."
          : "Deployment cancelled or insufficient Base Sepolia ETH for gas."
      );
    } finally {
      setIsDeployingCoin(false);
    }
  };

  const handleWatchTokenInWallet = async () => {
    if (!sylCoinAddress) return;
    const added = await watchSylTokenInWallet();
    setCoinStatusMsg(
      added
        ? isId
          ? "Token $SYL (ERC-20) berhasil ditambahkan ke daftar token wallet kamu!"
          : "$SYL (ERC-20) token added to your wallet asset list!"
        : isId
        ? "Permintaan tambah token dibatalkan atau wallet belum aktif."
        : "Watch asset request dismissed or wallet not connected."
    );
  };

  const handleClaimSylCoins = async (useRelayer = false) => {
    if (unclaimedSylForWallet <= 0) {
      setCoinStatusMsg(
        isId
          ? "Seluruh $SYL Coin yang terkumpul sudah diklaim. Selesaikan tugas & ujian PPT berikutnya untuk menambah $SYL!"
          : "All earned $SYL coins have been claimed. Complete the next PPT to earn more $SYL!"
      );
      return;
    }

    if (!useRelayer && (!isConnected || !address)) {
      openConnectModal();
      return;
    }

    setIsClaimingSyl(true);
    setCoinStatusMsg(
      sylCoinAddress && !useRelayer
        ? isId
          ? `Memanggil claimStudyReward() pada Smart Contract ERC-20 $SYL (+${unclaimedSylForWallet} $SYL) di Base Sepolia...`
          : `Calling claimStudyReward() on $SYL ERC-20 Smart Contract (+${unclaimedSylForWallet} $SYL) on Base Sepolia...`
        : isId
        ? `Mencatat klaim +${unclaimedSylForWallet} $SYL Coin ke Base Sepolia...`
        : `Anchoring +${unclaimedSylForWallet} $SYL Coin claim to Base Sepolia...`
    );

    try {
      const signerAddress =
        address || "0x71C95911E9a5D330f4D621842EC243EE1343292e";
      const claimDigest = keccak256(
        stringToHex(
          `SYL_CLAIM:${currentScope}:${signerAddress}:${unclaimedSylForWallet}:${Date.now()}`
        )
      );

      let txHash: string = claimDigest;
      let proofType: "onchain-tx" | "eip191-signature" | "local-attestation" =
        "local-attestation";

      if (!useRelayer && isConnected && address) {
        const res = await claimSylCoinsOnChain({
          coinAddress: sylCoinAddress,
          amountSyl: unclaimedSylForWallet,
          claimHash: claimDigest,
          courseTitle: roadmap.courseTitle,
          totalPoints: totalAccumulatedPoints,
          tierName: currentTier.name,
        });
        txHash = res.txHash;
        proofType = res.proofType;
      } else if (useRelayer && isConnected && address) {
        txHash = await signPersonalMessage(
          `SyllabaCoin ($SYL) Gasless Claim\nWallet: ${address}\nAmount: +${unclaimedSylForWallet} $SYL\nTier: ${currentTier.name}\nTotal Points: ${totalAccumulatedPoints}\nClaim Hash: ${claimDigest}\nNetwork: Base Sepolia (84532)`
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
            roadmapHash: claimDigest,
            ipfsCid: sylCoinAddress
              ? `erc20:${sylCoinAddress}:mint:${unclaimedSylForWallet}`
              : `syl-mint-${unclaimedSylForWallet}-coins`,
            txHash,
            chainId: chainId || 84532,
            status:
              proofType === "onchain-tx"
                ? `syl-coin-onchain-${unclaimedSylForWallet}`
                : `syl-coin-claimed-${unclaimedSylForWallet}`,
          }),
        });
      } catch {
        // Non-blocking ledger log
      }

      const newClaim: SyllabaCoinClaimRecord = {
        id: generateId("syl_claim"),
        ownerScope: currentScope,
        walletAddress: signerAddress,
        amountSyl: unclaimedSylForWallet,
        txHash,
        chainId: 84532,
        proofType,
        claimedAt: new Date().toISOString(),
      };

      const nextClaims = saveSylClaimRecord(newClaim, currentScope);
      setSylClaims(nextClaims);
      setCoinStatusMsg(
        sylCoinAddress && !useRelayer
          ? isId
            ? `Berhasil me-mint +${newClaim.amountSyl} token ERC-20 $SYL langsung ke wallet kamu di Base Sepolia!`
            : `Minted +${newClaim.amountSyl} $SYL ERC-20 tokens directly to your wallet on Base Sepolia!`
          : isId
          ? `Berhasil mencatat klaim +${newClaim.amountSyl} $SYL Coin di jaringan Base Sepolia!`
          : `Claimed +${newClaim.amountSyl} $SYL Coin on Base Sepolia!`
      );
    } catch {
      setCoinStatusMsg(
        isId
          ? "Klaim via wallet dibatalkan. Kamu dapat menggunakan 'Instant Gasless $SYL Claim' untuk mencatat klaim tanpa gas."
          : "Wallet transaction cancelled. You can use 'Instant Gasless $SYL Claim' if you don't have testnet gas."
      );
    } finally {
      setIsClaimingSyl(false);
    }
  };

  const handleRedeemPerk = async (perk: {
    id: SylPerkId;
    title: string;
    costSyl: number;
  }) => {
    if (availableSylToSpend < perk.costSyl) {
      setCoinStatusMsg(
        isId
          ? `Saldo $SYL belum mencukupi (${availableSylToSpend} / ${perk.costSyl} $SYL). Selesaikan PPT dan Ujian AI untuk menambah $SYL!`
          : `Insufficient $SYL balance (${availableSylToSpend} / ${perk.costSyl} $SYL). Complete PPTs & AI exams to earn more!`
      );
      return;
    }

    if (
      sylCoinAddress &&
      isConnected &&
      onChainSylBalance !== null &&
      Number(onChainSylBalance) >= perk.costSyl
    ) {
      try {
        await redeemPerkOnChain({
          coinAddress: sylCoinAddress,
          perkId: perk.id,
          amountSyl: perk.costSyl,
        });
      } catch {
        // Proceed with local utility ledger if user cancels gas burn
      }
    }

    const record: SyllabaCoinRedemptionRecord = {
      id: generateId("syl_redeem"),
      ownerScope: currentScope,
      perkId: perk.id,
      perkTitle: perk.title,
      costSyl: perk.costSyl,
      redeemedAt: new Date().toISOString(),
    };

    const next = saveSylRedemptionRecord(record, currentScope);
    setSylRedemptions(next);
    setCoinStatusMsg(
      isId
        ? `Perk "${perk.title}" berhasil diaktifkan (-${perk.costSyl} $SYL) untuk akun kamu!`
        : `Perk "${perk.title}" activated (-${perk.costSyl} $SYL) for your account!`
    );
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
    "Connect Web3 Wallet to Bind Address";
  const displayTxHash =
    cert?.txHash || "Preview Mode (Not Minted Yet)";
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

  const proofMetadataPayload = useMemo(
    () => ({
      schema: "syllaba.academic.credential.v1",
      certificateId: displayCertId,
      tier: activeTierMeta.id,
      tierName: activeTierMeta.name,
      recipientName: cert?.recipientName || recipientName.trim() || "Scholar",
      walletAddress: displayWallet,
      courseTitle: roadmap.courseTitle,
      roadmapId: roadmap.id,
      totalPoints: cert?.totalPointsAtIssue ?? totalAccumulatedPoints,
      totalSylCoins: cert?.totalSylCoinsAtIssue ?? totalEarnedSylCoins,
      pptDifficultyPoints:
        cert?.pptDifficultyPoints ?? currentBreakdown.pptDifficultyPoints,
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
      activeTierMeta.id,
      activeTierMeta.name,
      cert,
      certificateHash,
      currentBreakdown.pptDifficultyPoints,
      displayCertId,
      displayIpfsCid,
      displayTxHash,
      displayWallet,
      finalScore,
      finalGradeScore,
      hasRealOnChainTx,
      hasRealPinataIpfs,
      midScore,
      recipientName,
      roadmap.courseTitle,
      roadmap.id,
      totalAccumulatedPoints,
      totalEarnedSylCoins,
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
              {currentBreakdown.isFullyCompletedAtEnd
                ? `+${currentBreakdown.pptDifficultyPoints} / 5 Poin Cair!`
                : `${currentBreakdown.pptDifficultyPoints} / 5 Poin (Cair di Akhir)`}
            </div>
          </div>
        </div>

        {/* Final-Only Point Evaluation Checkpoints for Current PPT */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <div
            className={`rounded-xl border p-3 ${
              currentBreakdown.allTasksDone
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              Syarat 1 &middot; Tugas Harian Runtut
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {roadmap.completedTasks} / {roadmap.totalTasks} Selesai
            </div>
            <div className="text-[11px] text-slate-500">
              {currentBreakdown.allTasksDone
                ? "Seluruh hari telah tuntas"
                : "Belum ada poin di tengah sesi"}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              currentBreakdown.midExamPassed
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              Syarat 2 &middot; Ujian Tengah Sesi
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
              currentBreakdown.finalExamPassed
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-600">
              Syarat 3 &middot; Ujian Akhir Sesi
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

          <div
            className={`rounded-xl border-2 p-3 ${
              currentBreakdown.isFullyCompletedAtEnd
                ? "border-emerald-400 bg-emerald-50"
                : "border-amber-300 bg-amber-50/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-700">
              Evaluasi Poin Akhir PPT
            </div>
            <div className="text-base font-black text-slate-950 mt-0.5">
              {currentBreakdown.isFullyCompletedAtEnd
                ? `+${currentBreakdown.pptDifficultyPoints} Poin Diterima`
                : `0 Poin (Menunggu Akhir)`}
            </div>
            <div className="text-[11px] font-semibold text-slate-600">
              {currentBreakdown.isFullyCompletedAtEnd
                ? `PPT Selesai 100%`
                : `Cair +${currentBreakdown.pptDifficultyPoints} Poin saat PPT selesai`}
            </div>
          </div>
        </div>
      </div>

      {/* 1B. $SYL LEARN-TO-EARN COIN TREASURY & UTILITY MARKETPLACE (BASE SEPOLIA) */}
      <div className="rounded-2xl border-2 border-[#FACC15]/70 bg-gradient-to-br from-[#111111] via-[#18181D] to-[#111111] text-white p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] text-[#111111] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider">
                <Coins className="w-3.5 h-3.5" />
                <span>$SYL Learn-to-Earn Academic Coin</span>
              </span>
              <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FEF08A]">
                Final-Completion Reward Ledger
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Reward $SYL Coin &amp; Poin PPT Cair di Akhir Setelah Modul Selesai
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap PPT memiliki bobot kesulitan <strong>1-5 Poin</strong> hasil analisis AI. Poin dan <strong>$SYL Coin</strong> baru diberikan di akhir sesi setelah seluruh tugas harian serta Ujian Tengah &amp; Ujian Akhir PPT tersebut tuntas.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Total Earned
              </div>
              <div className="text-base sm:text-lg font-black text-[#FACC15]">
                {totalEarnedSylCoins}
              </div>
              <div className="text-[10px] text-slate-300">$SYL</div>
            </div>

            <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-center">
              <div className="text-[10px] font-bold uppercase text-emerald-300">
                Saldo Aktif
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-300">
                {availableSylToSpend}
              </div>
              <div className="text-[10px] text-emerald-200">Siap Pakai</div>
            </div>

            <div className="rounded-xl bg-[#FACC15]/15 border border-[#FACC15]/40 px-3 py-2 text-center">
              <div className="text-[10px] font-bold uppercase text-[#FEF08A]">
                On-Chain
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                {totalClaimedSylOnChain}
              </div>
              <div className="text-[10px] text-[#FACC15]">Claimed</div>
            </div>
          </div>
        </div>

        {/* Final-Only $SYL Evaluation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              Bobot Kesulitan PPT Ini
            </div>
            <div className="text-sm font-black text-[#FACC15] mt-0.5">
              Level {currentBreakdown.pptDifficultyPoints} / 5 Poin
            </div>
            <div className="text-[11px] text-slate-400">
              Hasil Analisis AI terhadap PPT
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              Reward Akhir PPT Ini
            </div>
            <div className="text-sm font-black text-[#FACC15] mt-0.5">
              {currentBreakdown.isFullyCompletedAtEnd
                ? `+${currentBreakdown.totalSylFromRoadmap} $SYL (Sudah Cair)`
                : `0 $SYL (+${currentBreakdown.pendingSylCoins} $SYL di Akhir)`}
            </div>
            <div className="text-[11px] text-slate-400">
              50 $SYL &times; Bobot Kesulitan {currentBreakdown.pptDifficultyPoints}/5
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              Bonus Tier {currentTier.name}
            </div>
            <div className="text-sm font-black text-emerald-300 mt-0.5">
              +{tierBonusSylCoins} $SYL
            </div>
            <div className="text-[11px] text-slate-400">
              Aktif setelah mencapai minimal 20 Poin (Bronze)
            </div>
          </div>
        </div>

        {/* Real ERC-20 SyllabaCoin ($SYL) Smart Contract Bar */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                <Cpu className="w-3 h-3" />
                <span>SyllabaCoin.sol · ERC-20 Standard</span>
              </span>
              {sylCoinAddress && onChainSylBalance !== null && (
                <span className="rounded-md bg-[#FACC15]/20 border border-[#FACC15]/40 px-2 py-0.5 text-[10px] font-extrabold text-[#FACC15]">
                  Live Wallet ERC-20: {onChainSylBalance} $SYL
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-300 truncate">
              {sylCoinAddress
                ? `ERC-20 Contract (Base Sepolia): ${sylCoinAddress}`
                : isId
                ? "Smart Contract ERC-20 $SYL (SyllabaCoin.sol) siap di-deploy ke Base Sepolia dalam 1 klik."
                : "$SYL ERC-20 Smart Contract (SyllabaCoin.sol) ready for 1-click deployment on Base Sepolia."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {sylCoinAddress ? (
              <>
                <a
                  href={`https://sepolia.basescan.org/token/${sylCoinAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-[11px] font-bold text-white transition"
                >
                  <span>BaseScan ERC-20</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={handleWatchTokenInWallet}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#FACC15] hover:bg-[#FDE047] text-[#111111] px-2.5 py-1.5 text-[11px] font-extrabold transition cursor-pointer"
                >
                  <Wallet className="w-3 h-3" />
                  <span>{isId ? "Tambah $SYL ke Wallet" : "Add $SYL to Wallet"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isDeployingCoin}
                onClick={handleDeployCoinContract}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#FACC15]/50 px-3 py-1.5 text-[11px] font-extrabold text-[#FEF08A] transition cursor-pointer disabled:opacity-60"
              >
                {isDeployingCoin ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isId ? "Deploying ERC-20..." : "Deploying ERC-20..."}</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>
                      {isId
                        ? "1-Klik Deploy Kontrak ERC-20 $SYL"
                        : "1-Click Deploy $SYL ERC-20 Contract"}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Claim $SYL Coins On-Chain Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/10">
          <div className="text-xs text-slate-300">
            Siap Diklaim ke Wallet Base Sepolia:{" "}
            <strong className="text-[#FACC15]">
              +{unclaimedSylForWallet} $SYL Coin
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isClaimingSyl || unclaimedSylForWallet <= 0}
              onClick={() => handleClaimSylCoins(false)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                unclaimedSylForWallet <= 0
                  ? "bg-white/10 text-slate-400 cursor-not-allowed"
                  : "bg-[#FACC15] text-[#111111] hover:bg-[#FDE047] cursor-pointer shadow-sm"
              }`}
            >
              {isClaimingSyl ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Claiming $SYL...</span>
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  <span>
                    Claim +{unclaimedSylForWallet} $SYL to Wallet (Base Sepolia)
                  </span>
                </>
              )}
            </button>

            {unclaimedSylForWallet > 0 && (
              <button
                type="button"
                disabled={isClaimingSyl}
                onClick={() => handleClaimSylCoins(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15]/50 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-[#FEF08A] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Gasless $SYL Claim</span>
              </button>
            )}
          </div>
        </div>

        {/* $SYL Coin Utility Perks Marketplace */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FEF08A]">
              Utilitas $SYL Coin · Tukarkan Koin untuk Fitur Akademik
            </span>
            <span className="text-[11px] text-slate-400">
              Terpakai: {totalRedeemedSyl} $SYL ({sylRedemptions.length} item)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SYL_COIN_PERKS.map((perk) => {
              const countOwned = sylRedemptions.filter(
                (r) => r.perkId === perk.id
              ).length;
              return (
                <div
                  key={perk.id}
                  className="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white">
                        {perk.title}
                      </span>
                      <span className="rounded-full bg-[#FACC15]/20 border border-[#FACC15]/40 px-2 py-0.5 text-[10px] font-black text-[#FACC15] shrink-0">
                        {perk.costSyl} $SYL
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {perk.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-emerald-300">
                      {countOwned > 0 ? `Aktif (${countOwned}x)` : "Tersedia"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRedeemPerk(perk)}
                      className="rounded-lg bg-[#FACC15] hover:bg-[#FDE047] text-[#111111] px-2.5 py-1 text-[11px] font-extrabold transition cursor-pointer"
                    >
                      Tukar {perk.costSyl} $SYL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent On-Chain $SYL Coin Claims */}
        {sylClaims.length > 0 && (
          <div className="rounded-xl bg-black/40 border border-white/10 p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Riwayat Klaim On-Chain $SYL Coin (Base Sepolia)
            </div>
            {sylClaims.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300"
              >
                <span>
                  <strong className="text-[#FACC15]">+{c.amountSyl} $SYL</strong>{" "}
                  &middot; {c.walletAddress.slice(0, 6)}...
                  {c.walletAddress.slice(-4)}
                </span>
                {c.proofType === "onchain-tx" &&
                c.txHash.startsWith("0x") &&
                c.txHash.length === 66 ? (
                  <a
                    href={`https://sepolia.basescan.org/tx/${c.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate max-w-[220px] text-emerald-300 hover:underline inline-flex items-center gap-1"
                  >
                    <span>TX: {c.txHash.slice(0, 16)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="truncate max-w-[240px] text-slate-400">
                    {c.proofType === "eip191-signature" ? "EIP-191 SIG:" : "PROOF:"}{" "}
                    {c.txHash.slice(0, 16)}...
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {coinStatusMsg && (
          <div className="rounded-xl border border-[#FACC15]/50 bg-[#FACC15]/15 px-3.5 py-2 text-xs font-semibold text-[#FEF08A]">
            {coinStatusMsg}
          </div>
        )}
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
                    20 - totalAccumulatedPoints
                  )} poin lagi (total 20 Poin) dari penyelesaian akhir PPT & Ujian AI untuk membuka Sertifikat Bronze!`
                : nextTier
                ? `Tier ${currentTier.name} telah terbuka! Kumpulkan ${Math.max(
                    0,
                    nextTier.minPoints - totalAccumulatedPoints
                  )} poin lagi untuk naik ke Tier ${nextTier.name} (${
                    nextTier.minPoints
                  } Poin).`
                : "Selamat! Kamu telah mencapai tingkat tertinggi: EMERALD SOVEREIGN (175+ Poin)!"}
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
                <span>Sign Cryptographic Attestation (Gasless)</span>
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
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/40 px-3 py-1 text-[11px] font-extrabold text-[#FACC15]">
                <Coins className="w-3 h-3" />
                <span>+{totalEarnedSylCoins} $SYL Coin Allocation</span>
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
                    style={{ color: activeTierMeta.primaryHex }}
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
                    style={{ color: activeTierMeta.primaryHex }}
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
                    {hasRealOnChainTx
                      ? `${activeTierMeta.name.toUpperCase()} ON-CHAIN`
                      : cert?.proofType === "eip191-signature"
                      ? `${activeTierMeta.name.toUpperCase()} EIP-191 SIGNED`
                      : cert
                      ? `${activeTierMeta.name.toUpperCase()} ATTESTED`
                      : `${activeTierMeta.name.toUpperCase()} PREVIEW`}
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
