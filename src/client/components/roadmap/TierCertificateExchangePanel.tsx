"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BlockchainCertificateRecord,
  CertificateTierId,
  Roadmap,
  SyllabaCoinClaimRecord,
  SyllabaCoinRedemptionRecord,
  SylPerkId,
} from "@/shared/types/roadmap";
import {
  CERTIFICATE_TIERS,
  SYL_COIN_PERKS,
  computeGlobalPointsAcrossRoadmaps,
  getStoredSylClaims,
  getStoredSylRedemptions,
  getStoredTierCertificates,
  getTierMetaById,
  saveSylClaimRecord,
  saveSylRedemptionRecord,
  saveTierCertificateRecord,
} from "@/shared/utils/certificateTiers";
import { generateId } from "@/shared/utils";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";
import { ScannableQrCode } from "@/client/components/common/ScannableQrCode";
import { keccak256, stringToHex } from "viem";
import {
  Award,
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
  Wallet,
} from "lucide-react";

interface TierCertificateExchangePanelProps {
  roadmaps: Roadmap[];
  currentScope: string;
}

export function TierCertificateExchangePanel({
  roadmaps,
  currentScope,
}: TierCertificateExchangePanelProps) {
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
    claimSylCoinsOnChain,
    sylCoinAddress,
    isSylContractOwner,
    onChainSylBalance,
    deployCoinContractOnChain,
    watchSylTokenInWallet,
  } = useWeb3();
  const [isDeployingSbt, setIsDeployingSbt] = useState(false);

  const defaultName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" &&
      user.user_metadata.name) ||
    user?.email?.split("@")[0] ||
    "Scholar Candidate";

  const [recipientName, setRecipientName] = useState(defaultName);
  const [tierCerts, setTierCerts] = useState<
    Partial<Record<CertificateTierId, BlockchainCertificateRecord>>
  >({});
  const [sylClaims, setSylClaims] = useState<SyllabaCoinClaimRecord[]>([]);
  const [sylRedemptions, setSylRedemptions] = useState<
    SyllabaCoinRedemptionRecord[]
  >([]);
  const [selectedTierId, setSelectedTierId] =
    useState<CertificateTierId>("bronze");
  const [isMinting, setIsMinting] = useState(false);
  const [isDeployingCoin, setIsDeployingCoin] = useState(false);
  const [isClaimingSyl, setIsClaimingSyl] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [coinStatusMsg, setCoinStatusMsg] = useState<string | null>(null);
  const [showProofJson, setShowProofJson] = useState(false);

  useEffect(() => {
    setRecipientName(defaultName);
  }, [defaultName, currentScope]);

  useEffect(() => {
    setTierCerts(getStoredTierCertificates(currentScope));
    setSylClaims(getStoredSylClaims(currentScope));
    setSylRedemptions(getStoredSylRedemptions(currentScope));
  }, [currentScope, roadmaps]);

  const pointsSummary = useMemo(
    () => computeGlobalPointsAcrossRoadmaps(roadmaps, currentScope),
    [currentScope, roadmaps]
  );

  const {
    allBreakdowns,
    totalAccumulatedPoints,
    totalEarnedSylCoins,
    tierBonusSylCoins,
    currentTier,
    nextTier,
    isBronzeUnlocked,
  } = pointsSummary;

  useEffect(() => {
    setSelectedTierId(currentTier.id);
  }, [currentTier.id]);

  const activeTierMeta = getTierMetaById(selectedTierId);
  const ownedTierCert = tierCerts[activeTierMeta.id];
  const isSelectedTierUnlocked =
    totalAccumulatedPoints >= activeTierMeta.minPoints;

  const totalRedeemedSyl = useMemo(
    () => sylRedemptions.reduce((s, r) => s + r.costSyl, 0),
    [sylRedemptions]
  );
  const totalClaimedSylOnChain = useMemo(
    () => sylClaims.reduce((s, c) => s + c.amountSyl, 0),
    [sylClaims]
  );
  const availableSylToSpend = Math.max(0, totalEarnedSylCoins - totalRedeemedSyl);
  const unclaimedSylForWallet = Math.max(
    0,
    totalEarnedSylCoins - totalClaimedSylOnChain
  );

  const completedCoursesCount = allBreakdowns.filter(
    (b) => b.isFullyCompletedAtEnd
  ).length;

  const certificateHash = useMemo(() => {
    if (ownedTierCert?.certificateHash) {
      return ownedTierCert.certificateHash as `0x${string}`;
    }
    const payload = JSON.stringify({
      protocol: "SYLLABA_TIER_EXCHANGE_CREDENTIAL_V2",
      ownerScope: currentScope,
      tier: activeTierMeta.id.toUpperCase(),
      minPointsRequired: activeTierMeta.minPoints,
      totalAccumulatedPoints,
      completedCoursesCount,
      recipientName: recipientName.trim() || "Scholar",
      walletAddress: address || "0x000000000000000000000000000000000000dEaD",
    });
    return keccak256(stringToHex(payload));
  }, [
    activeTierMeta.id,
    activeTierMeta.minPoints,
    address,
    completedCoursesCount,
    currentScope,
    ownedTierCert?.certificateHash,
    recipientName,
    totalAccumulatedPoints,
  ]);

  const displayCertId =
    ownedTierCert?.certificateId ||
    `SYL-TIER-${activeTierMeta.id.slice(0, 3).toUpperCase()}-${certificateHash
      .slice(2, 9)
      .toUpperCase()}`;
  const displayWallet =
    ownedTierCert?.walletAddress ||
    address ||
    "Connect Web3 Wallet to Bind Address";
  const displayTxHash =
    ownedTierCert?.txHash || "Preview Mode (Not Exchanged / Minted Yet)";
  const displayIpfsCid =
    ownedTierCert?.ipfsCid ||
    `snapshot-${certificateHash.slice(2, 34).toLowerCase()}`;

  const hasRealOnChainTx = Boolean(
    ownedTierCert &&
      ownedTierCert.proofType === "onchain-tx" &&
      ownedTierCert.txHash.startsWith("0x") &&
      ownedTierCert.txHash.length === 66 &&
      ownedTierCert.walletAddress !==
        "0x71C95911E9a5D330f4D621842EC243EE1343292e"
  );
  const hasRealPinataIpfs = Boolean(
    ownedTierCert &&
      ownedTierCert.ipfsStorageMode === "pinata-ipfs" &&
      (ownedTierCert.ipfsCid.startsWith("Qm") ||
        ownedTierCert.ipfsCid.startsWith("baf"))
  );
  const hasValidWalletAddr =
    /^0x[0-9a-fA-F]{40}$/.test(displayWallet) &&
    displayWallet !== "0x71C95911E9a5D330f4D621842EC243EE1343292e";

  const qrVerificationUrl = useMemo(() => {
    if (hasRealOnChainTx) {
      return `https://sepolia.basescan.org/tx/${displayTxHash}`;
    }
    const proofCode =
      ownedTierCert?.proofType === "eip191-signature"
        ? "sig"
        : ownedTierCert?.proofType === "local-attestation"
        ? "loc"
        : "pre";
    const qs = new URLSearchParams({
      i: displayCertId,
      t: activeTierMeta.id,
      p: String(
        ownedTierCert?.totalPointsAtIssue ?? totalAccumulatedPoints
      ),
      g: String(ownedTierCert?.finalGradeScore ?? 100),
      n: (
        ownedTierCert?.recipientName ||
        recipientName.trim() ||
        "Scholar"
      ).slice(0, 12),
      h: certificateHash.slice(2, 10),
      m: proofCode,
    });
    return `https://syllaba.xyz/v?${qs.toString()}`;
  }, [
    activeTierMeta.id,
    certificateHash,
    displayCertId,
    displayTxHash,
    hasRealOnChainTx,
    ownedTierCert,
    recipientName,
    totalAccumulatedPoints,
  ]);

  const proofMetadataPayload = useMemo(
    () => ({
      schema: "syllaba.tier.certificate.v1",
      certificateId: displayCertId,
      tier: activeTierMeta.id,
      tierName: activeTierMeta.name,
      minPointsRequired: activeTierMeta.minPoints,
      recipientName:
        ownedTierCert?.recipientName || recipientName.trim() || "Scholar",
      walletAddress: displayWallet,
      accumulatedPoints:
        ownedTierCert?.totalPointsAtIssue ?? totalAccumulatedPoints,
      completedPptModules: completedCoursesCount,
      totalSylCoins:
        ownedTierCert?.totalSylCoinsAtIssue ?? totalEarnedSylCoins,
      cryptography: {
        network: "Base Sepolia",
        chainId: ownedTierCert?.chainId ?? 84532,
        proofType: ownedTierCert?.proofType ?? "preview",
        certificateHash,
        snapshotRef: displayIpfsCid,
        ipfsStorageMode: ownedTierCert?.ipfsStorageMode ?? "canonical-digest",
        txOrSignature: ownedTierCert?.txHash ?? null,
      },
      issuedAt: ownedTierCert?.issuedAt ?? null,
      basescanTxUrl: hasRealOnChainTx
        ? `https://sepolia.basescan.org/tx/${displayTxHash}`
        : null,
      pinataIpfsUrl: hasRealPinataIpfs
        ? `https://gateway.pinata.cloud/ipfs/${displayIpfsCid}`
        : null,
    }),
    [
      activeTierMeta.id,
      activeTierMeta.minPoints,
      activeTierMeta.name,
      certificateHash,
      completedCoursesCount,
      displayCertId,
      displayIpfsCid,
      displayTxHash,
      displayWallet,
      hasRealOnChainTx,
      hasRealPinataIpfs,
      ownedTierCert,
      recipientName,
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

  const handleExchangeTierCertificate = async (useGasless = false) => {
    if (!isSelectedTierUnlocked) return;

    if (!useGasless && (!isConnected || !address)) {
      openConnectModal();
      return;
    }

    setIsMinting(true);
    setStatusMsg(
      isId
        ? `Memproses penukaran Sertifikat Tier ${activeTierMeta.name.toUpperCase()} (${totalAccumulatedPoints} Poin)...`
        : `Exchanging ${activeTierMeta.name.toUpperCase()} Tier Certificate (${totalAccumulatedPoints} Points)...`
    );

    try {
      let resolvedCid = `snapshot-${certificateHash.slice(2, 34).toLowerCase()}`;
      let resolvedStorageMode: "pinata-ipfs" | "canonical-digest" =
        "canonical-digest";
      const representativeRoadmap = roadmaps[0];
      if (representativeRoadmap) {
        try {
          const snapRes = await fetch("/api/ipfs/snapshot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roadmap: representativeRoadmap }),
          });
          if (snapRes.ok) {
            const snap = await snapRes.json();
            if (snap.ipfsCid) resolvedCid = snap.ipfsCid;
            if (snap.storageMode === "pinata-ipfs") {
              resolvedStorageMode = "pinata-ipfs";
            }
          }
        } catch {
          // Canonical digest fallback
        }
      }
      const signerAddress =
        address || "0x71C95911E9a5D330f4D621842EC243EE1343292e";
      let txHash: string = keccak256(
        stringToHex(
          `SYLLABA_TIER_EXCHANGE:${activeTierMeta.id}:${certificateHash}:${Date.now()}`
        )
      );
      let proofType: "onchain-tx" | "eip191-signature" | "local-attestation" =
        "local-attestation";
      let sbtAddressUsed: string | undefined;

      if (!useGasless && isConnected && address) {
        const anchored = await anchorCertificateOnChain({
          certificateHash,
          ipfsCid: resolvedCid,
          courseTitle: `Syllaba ${activeTierMeta.name.toUpperCase()} Tier Credential (${completedCoursesCount} PPTs)`,
          recipientName: recipientName.trim() || "Scholar",
          finalGradeScore: Math.min(100, totalAccumulatedPoints),
          certKind: `TIER_${activeTierMeta.id.toUpperCase()}`,
          points: totalAccumulatedPoints,
        });
        txHash = anchored.txHash;
        proofType = anchored.proofType;
        sbtAddressUsed = anchored.sbtAddress;
      } else if (useGasless && isConnected && address) {
        txHash = await signPersonalMessage(
          `Syllaba Tier Certificate Redemption\nTier: ${activeTierMeta.name.toUpperCase()} (${activeTierMeta.minPoints}+ Points)\nAccumulated Points: ${totalAccumulatedPoints}\nHolder: ${recipientName.trim() || "Scholar"}\nWallet: ${address}\nCertificate Hash: ${certificateHash}\nNetwork: Base Sepolia (84532)`
        );
        proofType = "eip191-signature";
      }

      const certRecord: BlockchainCertificateRecord = {
        certificateId: `SYL-TIER-${activeTierMeta.id
          .slice(0, 3)
          .toUpperCase()}-${certificateHash.slice(2, 9).toUpperCase()}`,
        ownerScope: currentScope,
        tier: activeTierMeta.id,
        totalPointsAtIssue: totalAccumulatedPoints,
        totalSylCoinsAtIssue: totalEarnedSylCoins,
        pptDifficultyPoints: 5,
        recipientName: recipientName.trim() || "Scholar",
        walletAddress: signerAddress,
        courseTitle: `${activeTierMeta.name} Tier Academic Progression (${completedCoursesCount} PPT Lulus)`,
        midExamScore: 100,
        finalExamScore: 100,
        finalGradeScore: 100,
        totalDays: completedCoursesCount,
        totalTasks: totalAccumulatedPoints,
        certificateHash,
        ipfsCid: resolvedCid,
        ipfsStorageMode: resolvedStorageMode,
        txHash,
        sbtContractAddress: sbtAddressUsed || syllabaSbtAddress,
        chainId: chainId || 84532,
        proofType,
        issuedAt: new Date().toISOString(),
      };

      const nextMap = saveTierCertificateRecord(certRecord, currentScope);
      setTierCerts(nextMap);
      setStatusMsg(
        proofType === "onchain-tx"
          ? isId
            ? `Berhasil menukar & mint Sertifikat Tier ${activeTierMeta.name.toUpperCase()} On-Chain ke Base Sepolia!`
            : `Successfully exchanged & minted ${activeTierMeta.name.toUpperCase()} Tier Certificate on Base Sepolia!`
          : proofType === "eip191-signature"
          ? isId
            ? `Sertifikat Tier ${activeTierMeta.name.toUpperCase()} berhasil ditukar & ditandatangani (EIP-191 Gasless).`
            : `${activeTierMeta.name.toUpperCase()} Tier Certificate exchanged & signed via EIP-191.`
          : isId
          ? `Sertifikat Tier ${activeTierMeta.name.toUpperCase()} berhasil ditukar secara lokal. Hubungkan wallet untuk verifikasi EIP-191 / Base Sepolia.`
          : `${activeTierMeta.name.toUpperCase()} Tier Certificate exchanged locally. Connect wallet for EIP-191 or Base Sepolia TX.`
      );
    } catch {
      setStatusMsg(
        isId
          ? "Transaksi dibatalkan. Gunakan tombol 'Sign Cryptographic Attestation (Gasless)' jika belum memiliki saldo ETH testnet."
          : "Transaction cancelled. Use 'Sign Cryptographic Attestation (Gasless)' if you have no testnet ETH."
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
      const res = await deployCoinContractOnChain();
      setCoinStatusMsg(
        res.contractAddress
          ? isId
            ? `Smart Contract ERC-20 SyllabaCoin ($SYL) resmi aktif di Base Sepolia! Alamat kontrak: ${res.contractAddress}`
            : `SyllabaCoin ($SYL) ERC-20 Smart Contract is now live on Base Sepolia at ${res.contractAddress}!`
          : isId
          ? `Transaksi deploy dikirim (${res.txHash.slice(0, 14)}...). Menunggu konfirmasi Base Sepolia.`
          : `Deployment TX sent (${res.txHash.slice(0, 14)}...).`
      );
    } catch {
      setCoinStatusMsg(
        isId
          ? "Deploy ERC-20 dibatalkan atau membutuhkan sedikit saldo ETH Sepolia."
          : "ERC-20 deployment cancelled or needs a small Base Sepolia ETH gas balance."
      );
    } finally {
      setIsDeployingCoin(false);
    }
  };

  const handleClaimSylCoins = async (useRelayer = false) => {
    if (unclaimedSylForWallet <= 0) return;

    if (!useRelayer && (!isConnected || !address)) {
      openConnectModal();
      return;
    }

    setIsClaimingSyl(true);
    setCoinStatusMsg(
      isId
        ? `Memproses klaim +${unclaimedSylForWallet} $SYL Coin ke Base Sepolia...`
        : `Processing claim of +${unclaimedSylForWallet} $SYL Coin on Base Sepolia...`
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
          courseTitle: `Global Progression (${completedCoursesCount} PPT)`,
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

      const newClaim: SyllabaCoinClaimRecord = {
        id: generateId("syl_claim"),
        ownerScope: currentScope,
        walletAddress: signerAddress,
        amountSyl: unclaimedSylForWallet,
        txHash,
        chainId: chainId || 84532,
        proofType,
        claimedAt: new Date().toISOString(),
      };

      const nextClaims = saveSylClaimRecord(newClaim, currentScope);
      setSylClaims(nextClaims);
      setCoinStatusMsg(
        isId
          ? `Berhasil mencatat klaim +${newClaim.amountSyl} $SYL Coin!`
          : `Claimed +${newClaim.amountSyl} $SYL Coin!`
      );
    } catch {
      setCoinStatusMsg(
        isId
          ? "Klaim dibatalkan. Gunakan 'Instant Gasless $SYL Claim' jika belum memiliki saldo testnet ETH."
          : "Claim cancelled. Use 'Instant Gasless $SYL Claim' if you don't have testnet gas."
      );
    } finally {
      setIsClaimingSyl(false);
    }
  };

  const handleRedeemPerk = (perk: {
    id: SylPerkId;
    title: string;
    costSyl: number;
  }) => {
    if (availableSylToSpend < perk.costSyl) {
      setCoinStatusMsg(
        isId
          ? `Saldo $SYL aktif (${availableSylToSpend} $SYL) belum mencukupi untuk "${perk.title}" (${perk.costSyl} $SYL). Selesaikan PPT sampai ujian akhir untuk menambah saldo!`
          : `Insufficient $SYL balance (${availableSylToSpend} $SYL) for "${perk.title}" (${perk.costSyl} $SYL). Complete PPT modules through their final exams to earn $SYL!`
      );
      return;
    }

    const record: SyllabaCoinRedemptionRecord = {
      id: generateId("syl_perk"),
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
        ? `Perk "${perk.title}" berhasil diaktifkan (-${perk.costSyl} $SYL)!`
        : `Perk "${perk.title}" activated (-${perk.costSyl} $SYL)!`
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. 6-TIER BLOCKCHAIN CERTIFICATE EXCHANGE (BRONZE 20 PTS -> EMERALD 175 PTS) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FACC15]/50 px-2.5 py-0.5 text-[11px] font-extrabold text-[#111111]">
              <Gem className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {isId
                  ? "Penukaran Sertifikat Tier Akumulasi (Bronze → Emerald)"
                  : "Accumulated Tier Certificate Exchange (Bronze → Emerald)"}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              {isId
                ? `Total Poin Kamu: ${totalAccumulatedPoints} Poin · Tier Aktif: ${
                    isBronzeUnlocked ? currentTier.name.toUpperCase() : "Belum Bronze (Min. 20 Poin)"
                  }`
                : `Total Points: ${totalAccumulatedPoints} Pts · Tier: ${
                    isBronzeUnlocked ? currentTier.name.toUpperCase() : "Below Bronze (Min. 20 Pts)"
                  }`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {!isBronzeUnlocked
                ? isId
                  ? `Kumpulkan ${Math.max(
                      0,
                      20 - totalAccumulatedPoints
                    )} poin lagi dari kelulusan berbagai PPT (1-5 Poin per PPT lulus) untuk menukar Sertifikat Bronze.`
                  : `Earn ${Math.max(
                      0,
                      20 - totalAccumulatedPoints
                    )} more points by graduating from PPT courses to unlock Bronze Tier exchange.`
                : nextTier
                ? isId
                  ? `Tier ${currentTier.name} sudah bisa ditukar! Kumpulkan ${Math.max(
                      0,
                      nextTier.minPoints - totalAccumulatedPoints
                    )} poin lagi untuk naik ke ${nextTier.name} (${nextTier.minPoints} Poin).`
                  : `${currentTier.name} Tier ready to exchange! Collect ${Math.max(
                      0,
                      nextTier.minPoints - totalAccumulatedPoints
                    )} more points for ${nextTier.name} (${nextTier.minPoints} Pts).`
                : isId
                ? "Puncak tertinggi! Seluruh tier Bronze hingga Emerald telah terbuka."
                : "Maximum tier reached! Bronze through Emerald are unlocked."}
            </p>
          </div>

          <div className="rounded-xl bg-[#111111] text-[#FACC15] px-4 py-2.5 text-right shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isId ? "Total Akumulasi Poin" : "Accumulated Points"}
            </div>
            <div className="text-xl font-black">
              {totalAccumulatedPoints} Poin
            </div>
            <div className="text-[10px] text-slate-300">
              {completedCoursesCount} / {allBreakdowns.length} PPT Lulus
            </div>
          </div>
        </div>

        {/* 6-Tier Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CERTIFICATE_TIERS.map((tier) => {
            const unlocked = totalAccumulatedPoints >= tier.minPoints;
            const claimed = Boolean(tierCerts[tier.id]);
            const isSelected = activeTierMeta.id === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTierId(tier.id)}
                style={{
                  borderColor: isSelected ? tier.primaryHex : undefined,
                }}
                className={`rounded-xl border-2 p-3 text-left transition cursor-pointer ${
                  isSelected
                    ? "bg-[#111111] text-white shadow-md scale-[1.01]"
                    : unlocked
                    ? "border-emerald-200 bg-emerald-50/60 text-slate-900 hover:border-slate-400"
                    : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    style={{ color: isSelected ? tier.primaryHex : undefined }}
                    className="text-xs font-black uppercase tracking-wide"
                  >
                    {tier.name}
                  </span>
                  {claimed || unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-bold mt-1">
                  {tier.minPoints} Poin
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {claimed
                    ? isId
                      ? "Sudah Ditukar"
                      : "Exchanged"
                    : unlocked
                    ? isId
                      ? "Siap Tukar"
                      : "Unlocked"
                    : isId
                    ? `Kurang ${tier.minPoints - totalAccumulatedPoints} pts`
                    : `Need ${tier.minPoints - totalAccumulatedPoints} pts`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Source of Points Breakdown Across User's PPTs */}
        {allBreakdowns.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {isId
                ? "Kontribusi Poin dari Masing-Masing PPT (Cair Saat Lulus PPT)"
                : "Points Contributed per PPT Course (Awarded at Graduation)"}
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              {allBreakdowns.map((b) => (
                <div
                  key={b.roadmapId}
                  className="py-1.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded bg-[#111111] text-[#FACC15] px-1.5 py-0.5 text-[10px] font-extrabold shrink-0">
                      Bobot {b.pptDifficultyPoints}/5
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {b.courseTitle}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900 shrink-0">
                    {b.isFullyCompletedAtEnd
                      ? `+${b.totalEarnedFromRoadmap} Poin ✓`
                      : `0 / ${b.maxPossibleFromRoadmap} Poin (Belum Lulus PPT)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipient Name + Exchange Controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isId
                ? "Nama Pemegang Sertifikat Tier"
                : "Tier Certificate Holder Name"}
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
              disabled={!isSelectedTierUnlocked || isMinting}
              onClick={() => handleExchangeTierCertificate(false)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                !isSelectedTierUnlocked
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[#111111] text-[#FACC15] hover:bg-slate-800 cursor-pointer shadow-sm"
              }`}
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>
                    {ownedTierCert
                      ? `Update ${activeTierMeta.name} Tier On-Chain`
                      : `Tukar & Mint ${activeTierMeta.name} (${activeTierMeta.minPoints}+ Poin)`}
                  </span>
                </>
              )}
            </button>

            {isSelectedTierUnlocked && (
              <button
                type="button"
                disabled={isMinting}
                onClick={() => handleExchangeTierCertificate(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15] bg-[#FEF3C7] hover:bg-[#FDE047] px-3.5 py-2.5 text-xs font-extrabold text-[#111111] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign Cryptographic Attestation (Gasless)</span>
              </button>
            )}

            {isSelectedTierUnlocked && (
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
                          ? `Smart Contract ERC-721 SBT Sertifikat aktif di Base Sepolia: ${res.contractAddress}!`
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

      {/* 2. TIER CERTIFICATE VAULT (LOCKED UNTIL POINTS REACHED SO CANNOT BE SCREENSHOT-STOLEN) */}
      <div
        style={{ borderColor: activeTierMeta.primaryHex }}
        className="relative rounded-3xl bg-[#09090D] p-3 sm:p-5 shadow-2xl border-2 overflow-hidden text-white transition-colors duration-300"
      >
        {!isSelectedTierUnlocked ? (
          <div
            style={{ borderColor: `${activeTierMeta.primaryHex}44` }}
            className={`relative rounded-2xl border bg-gradient-to-b ${activeTierMeta.bgGradientClass} p-8 sm:p-12 text-center space-y-4`}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${activeTierMeta.primaryHex}, ${activeTierMeta.secondaryHex})`,
              }}
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-[#111111] shadow-lg"
            >
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <div
                style={{ color: activeTierMeta.primaryHex }}
                className="text-xs font-black uppercase tracking-[0.22em]"
              >
                {activeTierMeta.name.toUpperCase()} TIER VAULT TERKUNCI
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isId
                  ? `Sertifikat Tier ${activeTierMeta.name} Belum Terbuka`
                  : `${activeTierMeta.name} Tier Certificate Locked`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isId
                  ? `Demi mencegah pemalsuan/screenshot sebelum waktunya, sertifikat, QR verifikasi, Proof JSON, dan tombol Print disembunyikan sampai poin kamu cukup dan diverifikasi Web3.`
                  : `To prevent unauthorized screenshots before mastery, this certificate, verification QR, Proof JSON, and Print button stay sealed until unlocked.`}
              </p>
            </div>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-bold">
              <span style={{ color: activeTierMeta.primaryHex }}>
                Poin Kamu: {totalAccumulatedPoints} / {activeTierMeta.minPoints} Poin
              </span>
              <span className="text-slate-400">&middot;</span>
              <span className="text-amber-300">
                Kurang {Math.max(0, activeTierMeta.minPoints - totalAccumulatedPoints)} Poin lagi
              </span>
            </div>
          </div>
        ) : (
        <div
          style={{ borderColor: `${activeTierMeta.primaryHex}66` }}
          className={`relative rounded-2xl border bg-gradient-to-b ${activeTierMeta.bgGradientClass} p-5 sm:p-8 space-y-6`}
        >
          <div
            style={{ borderColor: `${activeTierMeta.primaryHex}40` }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  background: `linear-gradient(135deg, ${activeTierMeta.primaryHex}, ${activeTierMeta.secondaryHex})`,
                }}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#111111] shadow-md shrink-0"
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">
                  Syllaba Decentralized Academic Protocol
                </p>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  {activeTierMeta.credentialTitle}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-bold ${activeTierMeta.pillBgClass} ${activeTierMeta.pillTextClass}`}
              >
                <Gem className="w-3 h-3" />
                <span>
                  {activeTierMeta.name.toUpperCase()} &middot;{" "}
                  {activeTierMeta.minPoints}+ POIN
                </span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-slate-200">
                ID: {displayCertId}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2 py-2">
            <p
              style={{ color: activeTierMeta.primaryHex }}
              className="text-xs uppercase tracking-[0.25em] font-semibold"
            >
              Certificate of {activeTierMeta.name} Tier Achievement
            </p>
            <p className="text-xs text-slate-300 italic">
              This multi-module academic tier credential attests that
            </p>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white pt-1">
              {ownedTierCert?.recipientName ||
                recipientName.trim() ||
                "Scholar Candidate"}
            </div>
            <div
              style={{
                background: `linear-gradient(90deg, transparent, ${activeTierMeta.primaryHex}, transparent)`,
              }}
              className="mx-auto w-56 h-[1.5px]"
            />
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 font-mono text-[11px] text-slate-200">
                <Wallet
                  style={{ color: activeTierMeta.primaryHex }}
                  className="w-3 h-3"
                />
                <span>Holder: {displayWallet}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-[11px] font-bold text-[#FEF08A]">
                <Award className="w-3 h-3" />
                <span>
                  {totalAccumulatedPoints} Poin Akumulasi &middot;{" "}
                  {completedCoursesCount} PPT Lulus
                </span>
              </span>
            </div>
          </div>

          <div
            style={{ borderColor: `${activeTierMeta.primaryHex}40` }}
            className="border-t pt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div className="space-y-1.5 font-mono text-[11px] min-w-0 flex-1">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <ShieldCheck
                  style={{ color: activeTierMeta.primaryHex }}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span
                  style={{ color: activeTierMeta.primaryHex }}
                  className="font-bold shrink-0"
                >
                  KECCAK-256 DIGEST:
                </span>
                <span className="truncate">{certificateHash}</span>
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
                    : ownedTierCert?.proofType === "eip191-signature"
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

                {hasRealOnChainTx && ownedTierCert?.sbtContractAddress && (
                  <a
                    href={`https://sepolia.basescan.org/token/${ownedTierCert.sbtContractAddress}`}
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
                    background: `linear-gradient(90deg, ${activeTierMeta.primaryHex}, ${activeTierMeta.secondaryHex})`,
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase text-[#111111]"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {hasRealOnChainTx
                      ? `${activeTierMeta.name.toUpperCase()} ON-CHAIN`
                      : ownedTierCert?.proofType === "eip191-signature"
                      ? `${activeTierMeta.name.toUpperCase()} EIP-191 SIGNED`
                      : ownedTierCert
                      ? `${activeTierMeta.name.toUpperCase()} EXCHANGED`
                      : `${activeTierMeta.name.toUpperCase()} PREVIEW`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  {ownedTierCert?.issuedAt
                    ? `Issued: ${new Date(
                        ownedTierCert.issuedAt
                      ).toLocaleDateString()}`
                    : "Ready at 20+ Pts"}
                </span>
                <span
                  style={{ color: activeTierMeta.primaryHex }}
                  className="text-[10px] font-semibold"
                >
                  SyllabaProofVault &middot; Base L2
                </span>
              </div>

              <ScannableQrCode
                value={qrVerificationUrl}
                accentHex={activeTierMeta.primaryHex}
                title={
                  isId
                    ? "Scan QR dengan kamera HP atau klik untuk verifikasi sertifikat tier"
                    : "Scan QR with phone camera or click to verify tier certificate"
                }
              />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 3. $SYL LEARN-TO-EARN COIN TREASURY & PERKS EXCHANGE */}
      <div className="rounded-2xl border-2 border-[#FACC15]/70 bg-gradient-to-br from-[#111111] via-[#18181D] to-[#111111] text-white p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] text-[#111111] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5" />
              <span>$SYL Learn-to-Earn Academic Coin &amp; Perks</span>
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Saldo Akumulasi $SYL Coin &amp; Penukaran Perks Akademik
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap PPT yang kamu selesaikan menyumbang <strong>50 &times; Bobot Kesulitan PPT</strong> $SYL Coin plus bonus tier otomatis (+{tierBonusSylCoins} $SYL saat Bronze+ terbuka).
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

        <div className="rounded-xl border border-white/15 bg-white/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-white">
              <Cpu className="w-4 h-4 text-[#FACC15] shrink-0" />
              <span>ERC-20 Smart Contract: Syllaba Coin (SYL)</span>
              {sylCoinAddress ? (
                <a
                  href={`https://sepolia.basescan.org/token/${sylCoinAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300 hover:bg-emerald-500/30 transition"
                >
                  <span>
                    {sylCoinAddress.slice(0, 8)}...{sylCoinAddress.slice(-6)}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-[#FEF08A]">
                  Siap Deploy ke Base Sepolia
                </span>
              )}
              {isSylContractOwner && (
                <span className="rounded-full bg-[#FACC15] text-[#111111] px-2 py-0.5 text-[10px] font-black">
                  Owner Connected (0.25 SYL / Modul)
                </span>
              )}
            </div>
            {onChainSylBalance !== null && (
              <div className="text-[11px] text-emerald-300 font-bold">
                Saldo Asli On-Chain di Base Sepolia: {onChainSylBalance} SYL (Reward Kontrak: 0.25 SYL/modul)
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!sylCoinAddress && (
              <button
                type="button"
                disabled={isDeployingCoin}
                onClick={handleDeployCoinContract}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 text-[11px] font-extrabold text-emerald-200 transition cursor-pointer"
              >
                {isDeployingCoin ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploying $SYL...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Deploy ERC-20 $SYL</span>
                  </>
                )}
              </button>
            )}

            {sylCoinAddress && isConnected && (
              <button
                type="button"
                onClick={() => void watchSylTokenInWallet()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white transition cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Add $SYL to Wallet</span>
              </button>
            )}

            <button
              type="button"
              disabled={unclaimedSylForWallet <= 0 || isClaimingSyl}
              onClick={() => handleClaimSylCoins(false)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                unclaimedSylForWallet <= 0
                  ? "bg-white/10 text-slate-400 cursor-not-allowed"
                  : "bg-[#FACC15] hover:bg-[#FDE047] text-[#111111] cursor-pointer"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Claim +{unclaimedSylForWallet} $SYL</span>
            </button>

            {unclaimedSylForWallet > 0 && (
              <button
                type="button"
                disabled={isClaimingSyl}
                onClick={() => handleClaimSylCoins(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FACC15]/50 bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold text-[#FEF08A] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gasless Attest</span>
              </button>
            )}
          </div>
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

        {coinStatusMsg && (
          <div className="rounded-xl border border-[#FACC15]/50 bg-[#FACC15]/15 px-3.5 py-2 text-xs font-semibold text-[#FEF08A]">
            {coinStatusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
