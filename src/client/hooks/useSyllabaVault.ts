"use client";

import { useCallback, useState } from "react";
import { useWeb3 } from "@/components/Web3Providers";
import { SYLLABA_VAULT_ADDRESS } from "@/shared/contracts/syllabaVault";

export type VaultTxStatus = "idle" | "signing" | "confirming" | "confirmed" | "error";

export function useSyllabaVault(initialVaultAddress?: `0x${string}`) {
  const {
    address,
    chainId,
    isConnected,
    openConnectModal,
    deployVaultContractOnChain,
    commitStudyPlanOnChain,
    verifyMilestoneOnChain,
    claimStudyCredentialOnChain,
  } = useWeb3();

  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | undefined>(
    initialVaultAddress || SYLLABA_VAULT_ADDRESS
  );
  const [status, setStatus] = useState<VaultTxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deployVault = useCallback(async () => {
    if (!isConnected || !address) {
      openConnectModal();
      return null;
    }

    setStatus("signing");
    setError(null);
    try {
      const result = await deployVaultContractOnChain();
      setTxHash(result.txHash);
      if (result.contractAddress) {
        setVaultAddress(result.contractAddress);
      }
      setStatus("confirmed");
      return result;
    } catch (err: unknown) {
      setStatus("error");
      setError((err as { message?: string })?.message || "Failed to deploy SyllabaProofVault.");
      throw err;
    }
  }, [address, deployVaultContractOnChain, isConnected, openConnectModal]);

  const commitStudyPlan = useCallback(
    async (params: {
      targetVault?: `0x${string}`;
      roadmapHash: `0x${string}`;
      ipfsCid: string;
      totalMilestones: bigint;
      deadline: bigint;
      stakeEth: string;
    }) => {
      const activeVault = params.targetVault || vaultAddress;
      if (!activeVault) {
        throw new Error("Vault contract address is not configured.");
      }

      setStatus("signing");
      setError(null);
      try {
        const hash = await commitStudyPlanOnChain({
          vaultAddress: activeVault,
          roadmapHash: params.roadmapHash,
          ipfsCid: params.ipfsCid,
          totalMilestones: params.totalMilestones,
          deadline: params.deadline,
          stakeEth: params.stakeEth,
        });
        setTxHash(hash);
        setStatus("confirmed");
        return hash;
      } catch (err: unknown) {
        setStatus("error");
        setError((err as { message?: string })?.message || "Failed to commit study plan.");
        throw err;
      }
    },
    [commitStudyPlanOnChain, vaultAddress]
  );

  const verifyMilestone = useCallback(
    async (params: {
      targetVault?: `0x${string}`;
      roadmapHash: `0x${string}`;
      milestoneIndex: bigint;
      proofHash: `0x${string}`;
    }) => {
      const activeVault = params.targetVault || vaultAddress;
      if (!activeVault) {
        throw new Error("Vault contract address is not configured.");
      }

      setStatus("signing");
      setError(null);
      try {
        const hash = await verifyMilestoneOnChain({
          vaultAddress: activeVault,
          roadmapHash: params.roadmapHash,
          milestoneIndex: params.milestoneIndex,
          proofHash: params.proofHash,
        });
        setTxHash(hash);
        setStatus("confirmed");
        return hash;
      } catch (err: unknown) {
        setStatus("error");
        setError((err as { message?: string })?.message || "Failed to verify milestone.");
        throw err;
      }
    },
    [vaultAddress, verifyMilestoneOnChain]
  );

  const claimStudyCredential = useCallback(
    async (params: { targetVault?: `0x${string}`; roadmapHash: `0x${string}` }) => {
      const activeVault = params.targetVault || vaultAddress;
      if (!activeVault) {
        throw new Error("Vault contract address is not configured.");
      }

      setStatus("signing");
      setError(null);
      try {
        const hash = await claimStudyCredentialOnChain({
          vaultAddress: activeVault,
          roadmapHash: params.roadmapHash,
        });
        setTxHash(hash);
        setStatus("confirmed");
        return hash;
      } catch (err: unknown) {
        setStatus("error");
        setError((err as { message?: string })?.message || "Failed to claim study credential.");
        throw err;
      }
    },
    [claimStudyCredentialOnChain, vaultAddress]
  );

  return {
    address,
    chainId,
    isConnected,
    vaultAddress,
    setVaultAddress,
    status,
    txHash,
    explorerUrl: txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null,
    error,
    deployVault,
    commitStudyPlan,
    verifyMilestone,
    claimStudyCredential,
  };
}
