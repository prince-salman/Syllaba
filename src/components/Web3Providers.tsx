"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { encodeFunctionData, parseEther, toHex } from "viem";
import { SYLLABA_VAULT_ABI } from "@/shared/contracts/syllabaVault";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_HEX = "0x14a34";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

interface Web3ContextValue {
  address: string | null;
  chainId: number;
  chainName: string;
  isConnected: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBaseSepolia: () => Promise<boolean>;
  signPersonalMessage: (message: string) => Promise<string>;
  commitStudyPlanOnChain: (params: {
    vaultAddress: `0x${string}`;
    roadmapHash: `0x${string}`;
    ipfsCid: string;
    totalMilestones: bigint;
    deadline: bigint;
    stakeEth: string;
  }) => Promise<string>;
}

const Web3Context = createContext<Web3ContextValue>({
  address: null,
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: "Base Sepolia",
  isConnected: false,
  isConnecting: false,
  errorMessage: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToBaseSepolia: async () => false,
  signPersonalMessage: async () => "",
  commitStudyPlanOnChain: async () => "",
});

export function useWeb3() {
  return useContext(Web3Context);
}

function resolveChainName(id: number): string {
  switch (id) {
    case 84532:
      return "Base Sepolia";
    case 8453:
      return "Base Mainnet";
    case 11155111:
      return "Sepolia";
    case 421614:
      return "Arbitrum Sepolia";
    case 1:
      return "Ethereum";
    default:
      return `Chain ${id}`;
  }
}

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(BASE_SEPOLIA_CHAIN_ID);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const readChainId = useCallback(async (eth: EthereumProvider) => {
    try {
      const rawChain = await eth.request({ method: "eth_chainId" });
      if (typeof rawChain === "string") {
        const parsed = parseInt(rawChain, 16);
        if (!Number.isNaN(parsed)) {
          setChainId(parsed);
        }
      }
    } catch {
      // Ignore read errors
    }
  }, []);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;

    let active = true;

    eth
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (!active) return;
        if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
          setAddress(accounts[0]);
        }
      })
      .catch(() => {});

    void readChainId(eth);

    const handleAccountsChanged = (accounts: unknown) => {
      if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
        setAddress(accounts[0]);
        setErrorMessage(null);
      } else {
        setAddress(null);
      }
    };

    const handleChainChanged = (hexChainId: unknown) => {
      if (typeof hexChainId === "string") {
        const parsed = parseInt(hexChainId, 16);
        if (!Number.isNaN(parsed)) {
          setChainId(parsed);
        }
      }
    };

    try {
      eth.on?.("accountsChanged", handleAccountsChanged);
      eth.on?.("chainChanged", handleChainChanged);
    } catch {
      // Ignore listener errors
    }

    return () => {
      active = false;
      try {
        eth.removeListener?.("accountsChanged", handleAccountsChanged);
        eth.removeListener?.("chainChanged", handleChainChanged);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [readChainId]);

  const switchToBaseSepolia = useCallback(async (): Promise<boolean> => {
    const eth = getEthereum();
    if (!eth) return false;

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_HEX }],
      });
      setChainId(BASE_SEPOLIA_CHAIN_ID);
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_SEPOLIA_HEX,
                chainName: "Base Sepolia",
                nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              },
            ],
          });
          setChainId(BASE_SEPOLIA_CHAIN_ID);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setErrorMessage(null);
    const eth = getEthereum();
    if (!eth) {
      setErrorMessage("No browser wallet found. Please install or enable MetaMask.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
        setAddress(accounts[0]);
        await readChainId(eth);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Wallet connection cancelled.";
      setErrorMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [readChainId]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setErrorMessage(null);
  }, []);

  const signPersonalMessage = useCallback(
    async (message: string): Promise<string> => {
      const eth = getEthereum();
      if (!eth || !address) {
        throw new Error("Wallet is not connected.");
      }
      const hexMessage = toHex(message);
      const signature = await eth.request({
        method: "personal_sign",
        params: [hexMessage, address],
      });
      return String(signature);
    },
    [address]
  );

  const commitStudyPlanOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
      ipfsCid: string;
      totalMilestones: bigint;
      deadline: bigint;
      stakeEth: string;
    }): Promise<string> => {
      const eth = getEthereum();
      if (!eth || !address) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const data = encodeFunctionData({
        abi: SYLLABA_VAULT_ABI,
        functionName: "commitStudyPlan",
        args: [params.roadmapHash, params.ipfsCid, params.totalMilestones, params.deadline],
      });

      const valueWei = Number(params.stakeEth) > 0 ? parseEther(params.stakeEth) : BigInt(0);
      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: params.vaultAddress,
            data,
            value: toHex(valueWei),
          },
        ],
      });

      return String(txHash);
    },
    [address, chainId, switchToBaseSepolia]
  );

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        chainName: resolveChainName(chainId),
        isConnected: Boolean(address),
        isConnecting,
        errorMessage,
        connectWallet,
        disconnectWallet,
        switchToBaseSepolia,
        signPersonalMessage,
        commitStudyPlanOnChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
