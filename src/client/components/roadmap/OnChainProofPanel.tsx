"use client";

import React, { useEffect, useMemo, useState } from "react";
import { OnChainProofRecord, Roadmap } from "@/shared/types/roadmap";
import { keccak256, stringToHex } from "viem";
import { useWeb3 } from "@/components/Web3Providers";
import { SYLLABA_VAULT_ADDRESS } from "@/shared/contracts/syllabaVault";
import { Button } from "@/client/components/common/Button";
import {
  Award,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  FileKey2,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { computeMilestoneProofHash } from "@/shared/utils/hash";
import { syncRoadmapToCentral } from "@/client/utils/centralRoadmapSync";

const STORAGE_VAULT_KEY = "syllaba_deployed_vault_address";

interface OnChainProofPanelProps {
  roadmap: Roadmap;
}

export function OnChainProofPanel({ roadmap }: OnChainProofPanelProps) {
  const {
    address,
    chainId,
    balanceEth,
    isConnected,
    openConnectModal,
    signPersonalMessage,
    deployVaultContractOnChain,
    commitStudyPlanOnChain,
    verifyMilestoneOnChain,
    claimStudyCredentialOnChain,
  } = useWeb3();

  const [proofs, setProofs] = useState<OnChainProofRecord[]>([]);
  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | undefined>(SYLLABA_VAULT_ADDRESS);
  const [latestCid, setLatestCid] = useState<string | null>(null);
  const [stakeEth, setStakeEth] = useState<string>("0");
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingMilestone, setIsVerifyingMilestone] = useState(false);
  const [isClaimingCredential, setIsClaimingCredential] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!SYLLABA_VAULT_ADDRESS && typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_VAULT_KEY);
      if (saved && saved.startsWith("0x") && saved.length === 42) {
        setVaultAddress(saved as `0x${string}`);
      }
    }
  }, []);

  const roadmapHash = useMemo(() => {
    const canonicalPayload = JSON.stringify({
      id: roadmap.id,
      courseTitle: roadmap.courseTitle,
      totalDays: roadmap.totalDays,
      totalTasks: roadmap.totalTasks,
      targetEndDate: roadmap.targetEndDate,
    });
    return keccak256(stringToHex(canonicalPayload));
  }, [roadmap.id, roadmap.courseTitle, roadmap.totalDays, roadmap.totalTasks, roadmap.targetEndDate]);

  useEffect(() => {
    let active = true;
    fetch(`/api/proofs?roadmapId=${encodeURIComponent(roadmap.id)}`)
      .then((res) => (res.ok ? res.json() : { proofs: [] }))
      .then((data) => {
        if (active && Array.isArray(data.proofs)) {
          setProofs(data.proofs);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [roadmap.id]);

  const handleDeployVault = async () => {
    if (!isConnected || !address) {
      openConnectModal();
      return;
    }

    setIsDeploying(true);
    setStatusMessage("Deploying SyllabaProofVault.sol to Base Sepolia...");

    try {
      const { txHash, contractAddress } = await deployVaultContractOnChain();
      if (contractAddress) {
        setVaultAddress(contractAddress);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_VAULT_KEY, contractAddress);
        }
        setStatusMessage(`SyllabaProofVault deployed on Base Sepolia at ${contractAddress}`);
      } else {
        setStatusMessage(`Deployment TX broadcast (${txHash.slice(0, 14)}...). Waiting for block confirmation.`);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "";
      if (msg.toLowerCase().includes("insufficient funds")) {
        setStatusMessage(
          "Insufficient Base Sepolia ETH for contract deployment gas. Fund your wallet via a Base Sepolia faucet or click 'Snapshot & Sign Study Proof' for zero-gas EIP-191 cryptographic attestation."
        );
      } else {
        setStatusMessage("Contract deployment cancelled or insufficient Base Sepolia ETH.");
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCommitProof = async () => {
    if (!isConnected || !address) {
      openConnectModal();
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const snapRes = await fetch("/api/ipfs/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap }),
      });

      let resolvedCid = `snapshot-${roadmap.id}`;
      let resolvedHash: `0x${string}` = roadmapHash;

      if (snapRes.ok) {
        const snap = await snapRes.json();
        if (snap.ipfsCid) resolvedCid = snap.ipfsCid;
        if (snap.roadmapHash) resolvedHash = snap.roadmapHash;
        setLatestCid(resolvedCid);
      }

      let txOrSigHash: string;
      let proofStatus: string;

      if (vaultAddress) {
        const deadlineSec = BigInt(
          Math.floor(new Date(roadmap.targetEndDate || Date.now() + 14 * 86400000).getTime() / 1000) +
            86400
        );
        const totalMilestones = BigInt(Math.max(1, roadmap.dailySchedules.length));

        txOrSigHash = await commitStudyPlanOnChain({
          vaultAddress,
          roadmapHash: resolvedHash,
          ipfsCid: resolvedCid,
          totalMilestones,
          deadline: deadlineSec,
          stakeEth,
        });
        proofStatus = "onchain-tx";
      } else {
        txOrSigHash = await signPersonalMessage(
          `Syllaba Study Commitment\nCourse: ${roadmap.courseTitle}\nRoadmap ID: ${roadmap.id}\nHash: ${resolvedHash}\nSnapshot: ${resolvedCid}\nCompleted: ${roadmap.completedTasks}/${roadmap.totalTasks}`
        );
        proofStatus = "signed-attestation";
      }

      const res = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          walletAddress: address,
          roadmapHash: resolvedHash,
          ipfsCid: resolvedCid,
          txHash: txOrSigHash,
          chainId: chainId || 84532,
          status: proofStatus,
        }),
      });

      if (res.ok) {
        const saved: OnChainProofRecord = await res.json();
        setProofs((prev) => [saved, ...prev]);
        void syncRoadmapToCentral(address, roadmap, txOrSigHash);
        setStatusMessage(
          vaultAddress
            ? "On-chain commitment broadcast to Base Sepolia and logged to Supabase."
            : "Snapshot hashed and cryptographic commitment signed."
        );
      }
    } catch {
      setStatusMessage("Transaction or wallet signature cancelled.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMilestone = async () => {
    if (!isConnected || !address) {
      openConnectModal();
      return;
    }

    setIsVerifyingMilestone(true);
    setStatusMessage(null);

    try {
      const milestoneIndex = Math.max(
        0,
        roadmap.dailySchedules.findIndex((d) => d.tasks.some((t) => t.isCompleted))
      );
      const activeIdx = milestoneIndex === -1 ? 0 : milestoneIndex;
      const proofHash = computeMilestoneProofHash({
        roadmapId: roadmap.id,
        milestoneIndex: activeIdx,
        completedTasks: roadmap.completedTasks,
        walletAddress: address,
      });

      let txOrSigHash: string;
      let proofStatus: string;

      if (vaultAddress) {
        txOrSigHash = await verifyMilestoneOnChain({
          vaultAddress,
          roadmapHash,
          milestoneIndex: BigInt(activeIdx),
          proofHash,
        });
        proofStatus = "milestone-onchain";
      } else {
        txOrSigHash = await signPersonalMessage(
          `Syllaba Milestone Verification\nCourse: ${roadmap.courseTitle}\nMilestone Index: ${activeIdx + 1}\nProof Hash: ${proofHash}\nCompleted Tasks: ${roadmap.completedTasks}/${roadmap.totalTasks}`
        );
        proofStatus = "milestone-verified";
      }

      const res = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          walletAddress: address,
          roadmapHash: proofHash,
          ipfsCid: latestCid || `milestone-${activeIdx + 1}-${roadmap.id}`,
          txHash: txOrSigHash,
          chainId: chainId || 84532,
          status: proofStatus,
        }),
      });

      if (res.ok) {
        const saved: OnChainProofRecord = await res.json();
        setProofs((prev) => [saved, ...prev]);
        setStatusMessage(`Milestone #${activeIdx + 1} verified and recorded to proof ledger.`);
      }
    } catch {
      setStatusMessage("Milestone verification cancelled or requires prior on-chain commitment.");
    } finally {
      setIsVerifyingMilestone(false);
    }
  };

  const handleClaimCredential = async () => {
    if (!isConnected || !address) {
      openConnectModal();
      return;
    }

    setIsClaimingCredential(true);
    setStatusMessage(null);

    try {
      let txOrSigHash: string;
      let proofStatus: string;

      if (vaultAddress) {
        txOrSigHash = await claimStudyCredentialOnChain({
          vaultAddress,
          roadmapHash,
        });
        proofStatus = "credential-claimed-onchain";
      } else {
        txOrSigHash = await signPersonalMessage(
          `Syllaba Proof-of-Study Credential Claim\nCourse: ${roadmap.courseTitle}\nRoadmap Hash: ${roadmapHash}\nHolder: ${address}\nTasks Completed: ${roadmap.completedTasks}/${roadmap.totalTasks}`
        );
        proofStatus = "credential-claimed";
      }

      const res = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          walletAddress: address,
          roadmapHash,
          ipfsCid: latestCid || `credential-${roadmap.id}`,
          txHash: txOrSigHash,
          chainId: chainId || 84532,
          status: proofStatus,
        }),
      });

      if (res.ok) {
        const saved: OnChainProofRecord = await res.json();
        setProofs((prev) => [saved, ...prev]);
        setStatusMessage("Proof-of-Study Credential claimed and anchored to ledger.");
      }
    } catch {
      setStatusMessage("Credential claim requires all milestones verified before deadline.");
    } finally {
      setIsClaimingCredential(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
              <FileKey2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                SyllabaProofVault Commitment &amp; Snapshot
              </h3>
              <p className="text-xs text-slate-500">
                {vaultAddress
                  ? `Contract active on Base Sepolia: ${vaultAddress.slice(0, 8)}...${vaultAddress.slice(-6)}`
                  : "Deploy SyllabaProofVault in 1 click or sign cryptographic EIP-191 attestation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vaultAddress && (
              <a
                href={`https://sepolia.basescan.org/address/${vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <span>Vault Contract</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              <Lock className="h-3 w-3 text-slate-500" />
              <span>Chain ID: {chainId || 84532}</span>
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 break-all">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              keccak256 Roadmap Digest
            </span>
            {roadmapHash}
          </div>

          {latestCid && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 font-mono text-xs text-emerald-900 break-all flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span>Snapshot CID: {latestCid}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {isConnected && address ? (
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>
                  Connected: <span className="font-mono font-semibold">{address.slice(0, 6)}...{address.slice(-4)}</span>
                </span>
                {balanceEth !== null && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                    {balanceEth} ETH
                  </span>
                )}
              </span>
            ) : (
              <button
                type="button"
                onClick={openConnectModal}
                className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 font-semibold underline cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>Wallet not connected (Click to Connect)</span>
              </button>
            )}

            {vaultAddress && (
              <label className="inline-flex items-center gap-1.5">
                <span className="text-slate-500">Micro-stake (ETH):</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={stakeEth}
                  onChange={(e) => setStakeEth(e.target.value)}
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-xs font-mono text-slate-800"
                />
              </label>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!vaultAddress && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isDeploying}
                onClick={handleDeployVault}
              >
                <Cpu className="h-4 w-4 text-brand-600" />
                <span>1-Click Deploy Vault (Base Sepolia)</span>
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCommitProof}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {vaultAddress
                  ? "Commit Study Plan On-Chain"
                  : "Snapshot & Sign Study Proof"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isVerifyingMilestone}
              onClick={handleVerifyMilestone}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Verify Milestone</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isClaimingCredential}
              onClick={handleClaimCredential}
            >
              <Award className="h-4 w-4 text-brand-600" />
              <span>Claim Study Credential</span>
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800 break-all">
            {statusMessage}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Verification Ledger
          </h4>
          <span className="text-[11px] font-medium text-slate-500">
            {proofs.length} records
          </span>
        </div>

        {proofs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No study proofs recorded for this roadmap yet. Create a snapshot and sign above to log your commitment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {proofs.map((proof) => {
              const isTxHash =
                proof.txHash.startsWith("0x") &&
                proof.txHash.length === 66 &&
                (proof.status.includes("onchain") ||
                  proof.status.includes("deployed"));
              const isIpfsCid =
                Boolean(proof.ipfsCid) &&
                (proof.ipfsCid!.startsWith("Qm") || proof.ipfsCid!.startsWith("bafy"));

              return (
                <div key={proof.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{proof.status}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(proof.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-700 truncate">
                      Signer: {proof.walletAddress}
                    </p>
                    {proof.ipfsCid && (
                      <p className="font-mono text-[11px] text-slate-500 truncate">
                        Snapshot: {proof.ipfsCid}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-slate-500 truncate">
                      Proof: {proof.txHash}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isIpfsCid && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${proof.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <span>IPFS</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {isTxHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${proof.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <span>BaseScan</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
