"use client";

import "@rainbow-me/rainbowkit/styles.css";
import React, { Component, createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  RainbowKitProvider,
  connectorsForWallets,
  lightTheme,
  useConnectModal,
  type Locale,
} from "@rainbow-me/rainbowkit";
import { useLanguage, type AppLanguage } from "@/client/context/LanguageContext";
import {
  coinbaseWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useBalance,
  useChainId,
  useDisconnect,
  usePublicClient,
  useSignMessage,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { base, baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { encodeFunctionData, formatEther, formatUnits, parseEther, stringToHex } from "viem";
import { SYLLABA_VAULT_ABI, SYLLABA_VAULT_BYTECODE } from "@/shared/contracts/syllabaVault";
import {
  OFFICIAL_SYLLABA_COIN_ADDRESS,
  OFFICIAL_SYLLABA_COIN_OWNER,
  SYLLABA_COIN_ABI,
  SYLLABA_COIN_ADDRESS,
  SYLLABA_COIN_BYTECODE,
} from "@/shared/contracts/syllabaCoin";
import {
  SYLLABA_SBT_ABI,
  SYLLABA_SBT_ADDRESS,
  SYLLABA_SBT_BYTECODE,
} from "@/shared/contracts/syllabaCertificateSbt";

const STORAGE_COIN_KEY = "syllaba_deployed_coin_address";
const STORAGE_SBT_KEY = "syllaba_deployed_sbt_address";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID &&
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID !== "YOUR_PROJECT_ID"
    ? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    : "3a8170812b534d0ff9d794f19a901d64";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended Wallets",
      wallets: [
        rabbyWallet,
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "Syllaba",
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet, base, baseSepolia, sepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
    [sepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

interface Web3ContextValue {
  address: string | null;
  chainId: number;
  chainName: string;
  balanceEth: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  connectWallet: () => Promise<void>;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  disconnectWallet: () => void;
  switchToBaseSepolia: () => Promise<boolean>;
  signPersonalMessage: (message: string) => Promise<string>;
  deployVaultContractOnChain: () => Promise<{ txHash: string; contractAddress: `0x${string}` | null }>;
  commitStudyPlanOnChain: (params: {
    vaultAddress: `0x${string}`;
    roadmapHash: `0x${string}`;
    ipfsCid: string;
    totalMilestones: bigint;
    deadline: bigint;
    stakeEth: string;
  }) => Promise<string>;
  verifyMilestoneOnChain: (params: {
    vaultAddress: `0x${string}`;
    roadmapHash: `0x${string}`;
    milestoneIndex: bigint;
    proofHash: `0x${string}`;
  }) => Promise<string>;
  claimStudyCredentialOnChain: (params: {
    vaultAddress: `0x${string}`;
    roadmapHash: `0x${string}`;
  }) => Promise<string>;
  anchorCertificateOnChain: (params: {
    certificateHash: `0x${string}`;
    ipfsCid: string;
    courseTitle: string;
    recipientName: string;
    finalGradeScore: number;
    certKind?: string;
    points?: number;
  }) => Promise<{ txHash: string; proofType: "onchain-tx" | "eip191-signature"; sbtAddress?: `0x${string}` }>;
  syllabaSbtAddress: `0x${string}` | undefined;
  setSyllabaSbtAddress: (addr: `0x${string}` | undefined) => void;
  deploySbtContractOnChain: () => Promise<{ txHash: string; contractAddress: `0x${string}` | null }>;
  claimSylCoinsOnChain: (params: {
    coinAddress?: `0x${string}`;
    amountSyl: number;
    claimHash: `0x${string}`;
    courseTitle?: string;
    totalPoints: number;
    tierName: string;
  }) => Promise<{ txHash: string; proofType: "onchain-tx" | "eip191-signature"; contractAddress?: `0x${string}` }>;
  sylCoinAddress: `0x${string}` | undefined;
  setSylCoinAddress: (addr: `0x${string}` | undefined) => void;
  isSylContractOwner: boolean;
  onChainSylBalance: string | null;
  refreshSylBalance: () => Promise<void>;
  deployCoinContractOnChain: () => Promise<{ txHash: string; contractAddress: `0x${string}` | null }>;
  redeemPerkOnChain: (params: {
    coinAddress?: `0x${string}`;
    perkId: string;
    amountSyl: number;
  }) => Promise<string | null>;
  watchSylTokenInWallet: () => Promise<boolean>;
}

const DEFAULT_WEB3_CONTEXT: Web3ContextValue = {
  address: null,
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: "Base Sepolia",
  balanceEth: null,
  isConnected: false,
  isConnecting: false,
  errorMessage: null,
  connectWallet: async () => {},
  openConnectModal: () => {},
  closeConnectModal: () => {},
  disconnectWallet: () => {},
  switchToBaseSepolia: async () => false,
  signPersonalMessage: async () => "",
  deployVaultContractOnChain: async () => ({ txHash: "", contractAddress: null }),
  commitStudyPlanOnChain: async () => "",
  verifyMilestoneOnChain: async () => "",
  claimStudyCredentialOnChain: async () => "",
  anchorCertificateOnChain: async () => ({ txHash: "", proofType: "eip191-signature" }),
  syllabaSbtAddress: undefined,
  setSyllabaSbtAddress: () => {},
  deploySbtContractOnChain: async () => ({ txHash: "", contractAddress: null }),
  claimSylCoinsOnChain: async () => ({ txHash: "", proofType: "eip191-signature" }),
  sylCoinAddress: OFFICIAL_SYLLABA_COIN_ADDRESS,
  setSylCoinAddress: () => {},
  isSylContractOwner: false,
  onChainSylBalance: null,
  refreshSylBalance: async () => {},
  deployCoinContractOnChain: async () => ({ txHash: "", contractAddress: null }),
  redeemPerkOnChain: async () => null,
  watchSylTokenInWallet: async () => false,
};

const Web3Context = createContext<Web3ContextValue>(DEFAULT_WEB3_CONTEXT);

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

class Web3ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Web3Context.Provider value={DEFAULT_WEB3_CONTEXT}>
          {this.props.children}
        </Web3Context.Provider>
      );
    }
    return this.props.children;
  }
}

function WagmiWeb3Bridge({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId() || BASE_SEPOLIA_CHAIN_ID;
  const { openConnectModal: rkOpenConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: BASE_SEPOLIA_CHAIN_ID });
  const { data: balanceData } = useBalance({
    address,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sylCoinAddress, setSylCoinAddressState] = useState<`0x${string}` | undefined>(
    SYLLABA_COIN_ADDRESS
  );
  const [syllabaSbtAddress, setSyllabaSbtAddressState] = useState<
    `0x${string}` | undefined
  >(SYLLABA_SBT_ADDRESS);
  const [onChainSylBalance, setOnChainSylBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!SYLLABA_COIN_ADDRESS && typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_COIN_KEY);
      if (saved && saved.startsWith("0x") && saved.length === 42) {
        setSylCoinAddressState(saved as `0x${string}`);
      }
    }
    if (!SYLLABA_SBT_ADDRESS && typeof window !== "undefined") {
      const savedSbt = localStorage.getItem(STORAGE_SBT_KEY);
      if (savedSbt && savedSbt.startsWith("0x") && savedSbt.length === 42) {
        setSyllabaSbtAddressState(savedSbt as `0x${string}`);
      }
    }
  }, []);

  const setSylCoinAddress = useCallback((addr: `0x${string}` | undefined) => {
    setSylCoinAddressState(addr);
    if (typeof window !== "undefined") {
      if (addr) {
        localStorage.setItem(STORAGE_COIN_KEY, addr);
      } else {
        localStorage.removeItem(STORAGE_COIN_KEY);
      }
    }
  }, []);

  const setSyllabaSbtAddress = useCallback((addr: `0x${string}` | undefined) => {
    setSyllabaSbtAddressState(addr);
    if (typeof window !== "undefined") {
      if (addr) {
        localStorage.setItem(STORAGE_SBT_KEY, addr);
      } else {
        localStorage.removeItem(STORAGE_SBT_KEY);
      }
    }
  }, []);

  const refreshSylBalance = useCallback(async () => {
    if (!publicClient || !address || !sylCoinAddress) {
      setOnChainSylBalance(null);
      return;
    }
    try {
      const rawBal = (await publicClient.readContract({
        address: sylCoinAddress,
        abi: SYLLABA_COIN_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      const parsed = Number(formatUnits(rawBal, 18));
      const formatted = Number.isInteger(parsed)
        ? String(parsed)
        : parsed.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
      setOnChainSylBalance(formatted);
    } catch {
      setOnChainSylBalance(null);
    }
  }, [address, publicClient, sylCoinAddress]);

  useEffect(() => {
    void refreshSylBalance();
  }, [refreshSylBalance]);

  const balanceEth =
    balanceData?.value !== undefined
      ? Number(formatEther(balanceData.value)).toFixed(4)
      : null;

  const openConnectModal = useCallback(() => {
    setErrorMessage(null);
    if (rkOpenConnectModal) {
      rkOpenConnectModal();
    }
  }, [rkOpenConnectModal]);

  const closeConnectModal = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const connectWallet = useCallback(async () => {
    openConnectModal();
  }, [openConnectModal]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setErrorMessage(null);
  }, [disconnect]);

  const switchToBaseSepolia = useCallback(async (): Promise<boolean> => {
    try {
      await switchChainAsync({ chainId: BASE_SEPOLIA_CHAIN_ID });
      return true;
    } catch {
      return false;
    }
  }, [switchChainAsync]);

  const signPersonalMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!isConnected || !address) {
        throw new Error("Wallet is not connected.");
      }
      return await signMessageAsync({ message });
    },
    [address, isConnected, signMessageAsync]
  );

  const deployVaultContractOnChain = useCallback(async (): Promise<{
    txHash: string;
    contractAddress: `0x${string}` | null;
  }> => {
    if (!walletClient || !address) {
      throw new Error("Wallet is not connected.");
    }

    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      await switchToBaseSepolia();
    }

    const txHash = await walletClient.sendTransaction({
      account: address,
      chain: baseSepolia,
      data: SYLLABA_VAULT_BYTECODE,
    });

    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      return {
        txHash,
        contractAddress: (receipt.contractAddress as `0x${string}`) || null,
      };
    }

    return { txHash, contractAddress: null };
  }, [address, chainId, publicClient, switchToBaseSepolia, walletClient]);

  const commitStudyPlanOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
      ipfsCid: string;
      totalMilestones: bigint;
      deadline: bigint;
      stakeEth: string;
    }): Promise<string> => {
      if (!walletClient || !address) {
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

      return await walletClient.sendTransaction({
        account: address,
        chain: baseSepolia,
        to: params.vaultAddress,
        data,
        value: valueWei,
      });
    },
    [address, chainId, switchToBaseSepolia, walletClient]
  );

  const verifyMilestoneOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
      milestoneIndex: bigint;
      proofHash: `0x${string}`;
    }): Promise<string> => {
      if (!walletClient || !address) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const data = encodeFunctionData({
        abi: SYLLABA_VAULT_ABI,
        functionName: "verifyMilestone",
        args: [params.roadmapHash, params.milestoneIndex, params.proofHash],
      });

      return await walletClient.sendTransaction({
        account: address,
        chain: baseSepolia,
        to: params.vaultAddress,
        data,
      });
    },
    [address, chainId, switchToBaseSepolia, walletClient]
  );

  const claimStudyCredentialOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
    }): Promise<string> => {
      if (!walletClient || !address) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const data = encodeFunctionData({
        abi: SYLLABA_VAULT_ABI,
        functionName: "claimStudyCredential",
        args: [params.roadmapHash],
      });

      return await walletClient.sendTransaction({
        account: address,
        chain: baseSepolia,
        to: params.vaultAddress,
        data,
      });
    },
    [address, chainId, switchToBaseSepolia, walletClient]
  );

  const deploySbtContractOnChain = useCallback(async (): Promise<{
    txHash: string;
    contractAddress: `0x${string}` | null;
  }> => {
    if (!walletClient || !address) {
      throw new Error("Wallet is not connected.");
    }

    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      await switchToBaseSepolia();
    }

    const txHash = await walletClient.sendTransaction({
      account: address,
      chain: baseSepolia,
      data: SYLLABA_SBT_BYTECODE,
    });

    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const deployed = (receipt.contractAddress as `0x${string}`) || null;
      if (deployed) {
        setSyllabaSbtAddress(deployed);
      }
      return {
        txHash,
        contractAddress: deployed,
      };
    }

    return { txHash, contractAddress: null };
  }, [address, chainId, publicClient, setSyllabaSbtAddress, switchToBaseSepolia, walletClient]);

  const anchorCertificateOnChain = useCallback(
    async (params: {
      certificateHash: `0x${string}`;
      ipfsCid: string;
      courseTitle: string;
      recipientName: string;
      finalGradeScore: number;
      certKind?: string;
      points?: number;
    }): Promise<{ txHash: string; proofType: "onchain-tx" | "eip191-signature"; sbtAddress?: `0x${string}` }> => {
      if (!isConnected || !address) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const hasGasBalance = balanceData?.value !== undefined && balanceData.value > BigInt(30000000000000);

      // Priority 1: Real ERC-721 Soulbound NFT Mint on SyllabaCertificateSBT.sol
      if (walletClient && syllabaSbtAddress && hasGasBalance) {
        try {
          const data = encodeFunctionData({
            abi: SYLLABA_SBT_ABI,
            functionName: "mintCertificate",
            args: [
              params.certificateHash,
              (params.certKind || "COURSE_PASS").slice(0, 32),
              params.courseTitle.slice(0, 80),
              params.recipientName.slice(0, 48),
              BigInt(Math.max(0, Math.round(params.points ?? 0))),
              BigInt(Math.max(0, Math.round(params.finalGradeScore))),
              params.ipfsCid.slice(0, 80),
            ],
          });
          const txHash = await walletClient.sendTransaction({
            account: address,
            chain: baseSepolia,
            to: syllabaSbtAddress,
            data,
            value: BigInt(0),
          });
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          }
          return { txHash, proofType: "onchain-tx", sbtAddress: syllabaSbtAddress };
        } catch {
          // Fall back if user rejects or digest already minted
        }
      }

      // Priority 2: Direct Base Sepolia calldata TX if SBT contract not deployed yet
      if (walletClient && hasGasBalance) {
        try {
          const calldata = stringToHex(
            `SYLLABA_CERT|${params.certificateHash}|${params.ipfsCid}|${params.finalGradeScore}`
          );
          const txHash = await walletClient.sendTransaction({
            account: address,
            chain: baseSepolia,
            to: address,
            data: calldata,
            value: BigInt(0),
          });
          return { txHash, proofType: "onchain-tx" };
        } catch {
          // Fall back to cryptographic EIP-191 attestation if user rejects gas TX
        }
      }

      const sigHash = await signMessageAsync({
        message: `Syllaba On-Chain Academic Certificate\nRecipient: ${params.recipientName}\nWallet: ${address}\nCourse: ${params.courseTitle}\nFinal Score: ${params.finalGradeScore}/100\nCertificate Hash: ${params.certificateHash}\nIPFS CID: ${params.ipfsCid}\nNetwork: Base Sepolia (84532)`,
      });

      return { txHash: sigHash, proofType: "eip191-signature" };
    },
    [address, balanceData?.value, chainId, isConnected, publicClient, signMessageAsync, switchToBaseSepolia, syllabaSbtAddress, walletClient]
  );

  const deployCoinContractOnChain = useCallback(async (): Promise<{
    txHash: string;
    contractAddress: `0x${string}` | null;
  }> => {
    if (!walletClient || !address) {
      throw new Error("Wallet is not connected.");
    }

    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      await switchToBaseSepolia();
    }

    const txHash = await walletClient.sendTransaction({
      account: address,
      chain: baseSepolia,
      data: SYLLABA_COIN_BYTECODE,
    });

    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const deployed = (receipt.contractAddress as `0x${string}`) || null;
      if (deployed) {
        setSylCoinAddress(deployed);
        await refreshSylBalance();
      }
      return {
        txHash,
        contractAddress: deployed,
      };
    }

    return { txHash, contractAddress: null };
  }, [address, chainId, publicClient, refreshSylBalance, setSylCoinAddress, switchToBaseSepolia, walletClient]);

  const claimSylCoinsOnChain = useCallback(
    async (params: {
      coinAddress?: `0x${string}`;
      amountSyl: number;
      claimHash: `0x${string}`;
      courseTitle?: string;
      totalPoints: number;
      tierName: string;
    }): Promise<{ txHash: string; proofType: "onchain-tx" | "eip191-signature"; contractAddress?: `0x${string}` }> => {
      if (!isConnected || !address) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const targetContract = params.coinAddress || sylCoinAddress;
      const hasGasBalance = balanceData?.value !== undefined && balanceData.value > BigInt(30000000000000);
      const isOfficialDeployedSyl =
        targetContract?.toLowerCase() === OFFICIAL_SYLLABA_COIN_ADDRESS.toLowerCase();
      const isOwnerWallet =
        Boolean(address) &&
        address.toLowerCase() === OFFICIAL_SYLLABA_COIN_OWNER.toLowerCase();

      // Priority 1A: Official Base Sepolia Syllaba Coin (0x95f9...0BFA7) -> rewardCompletedModule(address)
      if (isOfficialDeployedSyl && targetContract) {
        if (walletClient && isOwnerWallet && hasGasBalance) {
          try {
            const data = encodeFunctionData({
              abi: SYLLABA_COIN_ABI,
              functionName: "rewardCompletedModule",
              args: [address],
            });
            const txHash = await walletClient.sendTransaction({
              account: address,
              chain: baseSepolia,
              to: targetContract,
              data,
              value: BigInt(0),
            });
            if (publicClient) {
              await publicClient.waitForTransactionReceipt({ hash: txHash });
              await refreshSylBalance();
            }
            return { txHash, proofType: "onchain-tx", contractAddress: targetContract };
          } catch {
            // Continue to relayer or calldata fallback
          }
        }

        // Priority 1B: Optional server relayer for 0.25 SYL official contract
        try {
          const relayRes = await fetch("/api/syl/reward", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentAddress: address }),
          });
          if (relayRes.ok) {
            const relay = await relayRes.json();
            if (relay?.ok && relay?.txHash) {
              await refreshSylBalance();
              return {
                txHash: relay.txHash,
                proofType: "onchain-tx",
                contractAddress: targetContract,
              };
            }
          }
        } catch {
          // Fall back if server relayer key is unset
        }
      }

      // Priority 1C: Custom self-deployed SyllabaCoin.sol -> claimStudyReward(...)
      if (walletClient && targetContract && !isOfficialDeployedSyl && hasGasBalance) {
        try {
          const data = encodeFunctionData({
            abi: SYLLABA_COIN_ABI,
            functionName: "claimStudyReward",
            args: [
              params.claimHash,
              BigInt(Math.max(1, Math.min(5000, Math.round(params.amountSyl)))),
              (params.courseTitle || "Syllaba Course").slice(0, 80),
            ],
          });

          const txHash = await walletClient.sendTransaction({
            account: address,
            chain: baseSepolia,
            to: targetContract,
            data,
            value: BigInt(0),
          });

          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
            await refreshSylBalance();
          }

          return { txHash, proofType: "onchain-tx", contractAddress: targetContract };
        } catch {
          // Fall back cleanly if user rejects or reverts
        }
      }

      // Priority 2: Direct Base Sepolia calldata TX if wallet has gas
      if (walletClient && hasGasBalance) {
        try {
          const calldata = stringToHex(
            `SYLLABA_ERC20_MINT|SYL|${params.amountSyl}|${params.tierName}|${params.claimHash}`
          );
          const txHash = await walletClient.sendTransaction({
            account: address,
            chain: baseSepolia,
            to: address,
            data: calldata,
            value: BigInt(0),
          });
          return { txHash, proofType: "onchain-tx" };
        } catch {
          // Fall back to cryptographic EIP-191 signature if gas TX is rejected
        }
      }

      const sigHash = await signMessageAsync({
        message: `Syllaba Learn-to-Earn Token Claim ($SYL)\nRecipient Wallet: ${address}\nClaim Amount: ${params.amountSyl} $SYL\nAcademic Points: ${params.totalPoints} pts (${params.tierName} Tier)\nClaim Digest: ${params.claimHash}\nNetwork: Base Sepolia (84532)`,
      });

      return { txHash: sigHash, proofType: "eip191-signature" };
    },
    [address, balanceData?.value, chainId, isConnected, publicClient, refreshSylBalance, signMessageAsync, switchToBaseSepolia, sylCoinAddress, walletClient]
  );

  const redeemPerkOnChain = useCallback(
    async (params: {
      coinAddress?: `0x${string}`;
      perkId: string;
      amountSyl: number;
    }): Promise<string | null> => {
      const targetContract = params.coinAddress || sylCoinAddress;
      if (!walletClient || !address || !targetContract) return null;

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const data = encodeFunctionData({
        abi: SYLLABA_COIN_ABI,
        functionName: "redeemPerk",
        args: [params.perkId, BigInt(Math.max(1, Math.round(params.amountSyl)))],
      });

      const txHash = await walletClient.sendTransaction({
        account: address,
        chain: baseSepolia,
        to: targetContract,
        data,
        value: BigInt(0),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        await refreshSylBalance();
      }

      return txHash;
    },
    [address, chainId, publicClient, refreshSylBalance, switchToBaseSepolia, sylCoinAddress, walletClient]
  );

  const watchSylTokenInWallet = useCallback(async (): Promise<boolean> => {
    if (!sylCoinAddress || !walletClient) return false;
    try {
      const ok = await walletClient.watchAsset({
        type: "ERC20",
        options: {
          address: sylCoinAddress,
          symbol: "SYL",
          decimals: 18,
        },
      });
      return Boolean(ok);
    } catch {
      return false;
    }
  }, [sylCoinAddress, walletClient]);

  return (
    <Web3Context.Provider
      value={{
        address: address || null,
        chainId,
        chainName: resolveChainName(chainId),
        balanceEth,
        isConnected,
        isConnecting,
        errorMessage,
        connectWallet,
        openConnectModal,
        closeConnectModal,
        disconnectWallet,
        switchToBaseSepolia,
        signPersonalMessage,
        deployVaultContractOnChain,
        commitStudyPlanOnChain,
        verifyMilestoneOnChain,
        claimStudyCredentialOnChain,
        anchorCertificateOnChain,
        syllabaSbtAddress,
        setSyllabaSbtAddress,
        deploySbtContractOnChain,
        claimSylCoinsOnChain,
        sylCoinAddress,
        setSylCoinAddress,
        isSylContractOwner:
          address?.toLowerCase() === OFFICIAL_SYLLABA_COIN_OWNER.toLowerCase(),
        onChainSylBalance,
        refreshSylBalance,
        deployCoinContractOnChain,
        redeemPerkOnChain,
        watchSylTokenInWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

const RAINBOWKIT_LOCALE_MAP: Record<AppLanguage, Locale> = {
  en: "en-US",
  id: "id-ID",
  zh: "zh-CN",
  ar: "ar",
  es: "es",
  pt: "pt-BR",
};

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Web3Context.Provider value={DEFAULT_WEB3_CONTEXT}>
        {children}
      </Web3Context.Provider>
    );
  }

  return (
    <Web3ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            initialChain={baseSepolia}
            locale={RAINBOWKIT_LOCALE_MAP[lang] ?? "en-US"}
            modalSize="compact"
            theme={lightTheme({
              accentColor: "#111111",
              accentColorForeground: "#FACC15",
              borderRadius: "medium",
            })}
          >
            <WagmiWeb3Bridge>{children}</WagmiWeb3Bridge>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Web3ErrorBoundary>
  );
}
