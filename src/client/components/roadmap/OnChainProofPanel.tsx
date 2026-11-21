"use client";

import React, { useEffect, useMemo, useState } from "react";
import { OnChainProofRecord, Roadmap } from "@/shared/types/roadmap";
import { keccak256, stringToHex } from "viem";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { Button } from "@/client/components/common/Button";
import { CheckCircle2, ExternalLink, FileKey2, Lock, ShieldCheck, Wallet } from "lucide-react";

interface OnChainProofPanelProps {
  roadmap: Roadmap;
}

export function OnChainProofPanel({ roadmap }: OnChainProofPanelProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [proofs, setProofs] = useState<OnChainProofRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const handleSignCommitment = async () => {
    if (!isConnected || !address) {
      setStatusMessage("Connect your wallet in the top navigation bar to sign a commitment proof.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const signature = await signMessageAsync({
        message: `Syllaba Study Commitment\nCourse: ${roadmap.courseTitle}\nRoadmap ID: ${roadmap.id}\nHash: ${roadmapHash}\nCompleted: ${roadmap.completedTasks}/${roadmap.totalTasks}`,
      });

      const res = await fetch("/api/proofs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          walletAddress: address,
          roadmapHash,
          txHash: signature,
          chainId: chainId || 84532,
          status: "signed-attestation",
        }),
      });

      if (res.ok) {
        const saved: OnChainProofRecord = await res.json();
        setProofs((prev) => [saved, ...prev]);
        setStatusMessage("Cryptographic study commitment signed and archived to Supabase.");
      }
    } catch {
      setStatusMessage("Wallet signature cancelled.");
    } finally {
      setIsSubmitting(false);
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
                Cryptographic Roadmap Fingerprint (keccak256)
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic digest anchored for SyllabaProofVault verification
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            <Lock className="h-3 w-3 text-slate-500" />
            <span>Chain ID: {chainId || 84532}</span>
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 break-all">
          {roadmapHash}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Wallet className="h-4 w-4 text-slate-500" />
            <span>
              {isConnected && address
                ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
                : "Wallet not connected"}
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleSignCommitment}
            disabled={!isConnected}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Sign Study Commitment Proof</span>
          </Button>
        </div>

        {statusMessage && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
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
            No study proofs recorded for this roadmap yet. Sign a commitment above to log your first cryptographic record.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {proofs.map((proof) => {
              const isTxHash = proof.txHash.length === 66;
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
                    <p className="font-mono text-[11px] text-slate-500 truncate">
                      Proof: {proof.txHash}
                    </p>
                  </div>

                  {isTxHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${proof.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                    >
                      <span>BaseScan</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
