"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createPublicClient,
  encodeFunctionData,
  formatEther,
  http,
  parseEther,
  toHex,
} from "viem";
import { baseSepolia } from "viem/chains";
import { SYLLABA_VAULT_ABI, SYLLABA_VAULT_BYTECODE } from "@/shared/contracts/syllabaVault";
import {
  AlertCircle,
  ExternalLink,
  Layers,
  Loader2,
  QrCode,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_HEX = "0x14a34";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const WALLET_ID_STORAGE_KEY = "syllaba_connected_wallet_id";

export type SupportedWalletId =
  | "rabbyWallet"
  | "metaMaskWallet"
  | "coinbaseWallet"
  | "rainbowWallet"
  | "walletConnectWallet";

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  disconnect?: () => Promise<void>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isRainbow?: boolean;
  isPhantom?: boolean;
  isBraveWallet?: boolean;
  providers?: EthereumProvider[];
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EthereumProvider;
}

interface WalletOptionSpec {
  id: SupportedWalletId;
  name: string;
  subtitle: string;
  badgeText: string;
  badgeClass: string;
  downloadUrl: string;
  rdnsHints: string[];
}

export const SUPPORTED_WALLETS: WalletOptionSpec[] = [
  {
    id: "rabbyWallet",
    name: "Rabby Wallet",
    subtitle: "rabbyWallet (EIP-6963 & Injected Extension)",
    badgeText: "RB",
    badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-700",
    downloadUrl: "https://rabby.io/",
    rdnsHints: ["io.rabby", "rabby"],
  },
  {
    id: "metaMaskWallet",
    name: "MetaMask",
    subtitle: "metaMaskWallet (Browser Extension & Mobile)",
    badgeText: "MM",
    badgeClass: "bg-orange-50 border-orange-200 text-orange-600",
    downloadUrl: "https://metamask.io/download/",
    rdnsHints: ["io.metamask", "metamask"],
  },
  {
    id: "coinbaseWallet",
    name: "Coinbase Wallet",
    subtitle: "coinbaseWallet (Base & Coinbase Extension)",
    badgeText: "CB",
    badgeClass: "bg-blue-50 border-blue-200 text-blue-700",
    downloadUrl: "https://www.coinbase.com/wallet/downloads",
    rdnsHints: ["com.coinbase.wallet", "coinbase"],
  },
  {
    id: "rainbowWallet",
    name: "Rainbow Wallet",
    subtitle: "rainbowWallet (Rainbow Browser Extension)",
    badgeText: "RW",
    badgeClass: "bg-sky-50 border-sky-200 text-sky-700",
    downloadUrl: "https://rainbow.me/extension",
    rdnsHints: ["me.rainbow", "rainbow"],
  },
  {
    id: "walletConnectWallet",
    name: "WalletConnect",
    subtitle: "walletConnectWallet (Scan QR with Mobile Wallet)",
    badgeText: "WC",
    badgeClass: "bg-brand-50 border-brand-200 text-brand-700",
    downloadUrl: "https://walletconnect.network/",
    rdnsHints: ["walletconnect"],
  },
];

function getWindowEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
});

interface Web3ContextValue {
  address: string | null;
  chainId: number;
  chainName: string;
  connectedWalletId: SupportedWalletId | null;
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
}

const Web3Context = createContext<Web3ContextValue>({
  address: null,
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: "Base Sepolia",
  connectedWalletId: null,
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
  const [connectedWalletId, setConnectedWalletId] = useState<SupportedWalletId | null>(null);
  const [activeProvider, setActiveProvider] = useState<EthereumProvider | null>(null);
  const [balanceEth, setBalanceEth] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingId, setConnectingId] = useState<SupportedWalletId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDownloadUrl, setErrorDownloadUrl] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const [discoveredWallets, setDiscoveredWallets] = useState<EIP6963ProviderDetail[]>([]);

  const readChainId = useCallback(async (eth: EthereumProvider) => {
    try {
      const rawChain = await eth.request({ method: "eth_chainId" });
      if (typeof rawChain === "string") {
        const parsed = parseInt(rawChain, 16);
        if (!Number.isNaN(parsed)) {
          setChainId(parsed);
        }
      } else if (typeof rawChain === "number") {
        setChainId(rawChain);
      }
    } catch {
      // Ignore read errors
    }
  }, []);

  // Discover EIP-6963 and window.ethereum providers
  useEffect(() => {
    if (typeof window === "undefined") return;

    const map = new Map<string, EIP6963ProviderDetail>();

    const onAnnounce = (event: Event) => {
      const custom = event as CustomEvent<EIP6963ProviderDetail>;
      if (custom.detail?.info?.uuid && custom.detail?.provider) {
        map.set(custom.detail.info.uuid, custom.detail);
        setDiscoveredWallets(Array.from(map.values()));
      }
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const winEth = getWindowEthereum();
    if (winEth) {
      const list =
        Array.isArray(winEth.providers) && winEth.providers.length > 0
          ? winEth.providers
          : [winEth];

      list.forEach((prov, idx) => {
        const name = prov.isRabby
          ? "Rabby Wallet"
          : prov.isRainbow
          ? "Rainbow Wallet"
          : prov.isCoinbaseWallet
          ? "Coinbase Wallet"
          : prov.isMetaMask
          ? "MetaMask"
          : "Browser Wallet";
        const rdns = `injected.${name.toLowerCase().replace(/\s+/g, "-")}.${idx}`;
        map.set(rdns, {
          info: {
            uuid: rdns,
            name,
            icon: "",
            rdns,
          },
          provider: prov,
        });
      });
      setDiscoveredWallets(Array.from(map.values()));
    }

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  // Resolve specific wallet provider by SupportedWalletId
  const resolveProviderForWallet = useCallback(
    (walletId: SupportedWalletId): { provider: EthereumProvider | null; isSpecificallyDetected: boolean } => {
      if (typeof window === "undefined") {
        return { provider: null, isSpecificallyDetected: false };
      }

      const win = window as unknown as {
        ethereum?: EthereumProvider;
        rabby?: EthereumProvider;
        coinbaseWalletExtension?: EthereumProvider;
        rainbow?: EthereumProvider;
      };

      const eipMatch = discoveredWallets.find((w) => {
        const rdns = w.info.rdns.toLowerCase();
        const name = w.info.name.toLowerCase();
        if (walletId === "rabbyWallet") {
          return rdns.includes("rabby") || name.includes("rabby") || Boolean(w.provider.isRabby);
        }
        if (walletId === "metaMaskWallet") {
          return (
            rdns.includes("metamask") ||
            name.includes("metamask") ||
            (Boolean(w.provider.isMetaMask) && !w.provider.isRabby && !w.provider.isRainbow)
          );
        }
        if (walletId === "coinbaseWallet") {
          return rdns.includes("coinbase") || name.includes("coinbase") || Boolean(w.provider.isCoinbaseWallet);
        }
        if (walletId === "rainbowWallet") {
          return rdns.includes("rainbow") || name.includes("rainbow") || Boolean(w.provider.isRainbow);
        }
        return false;
      });

      if (eipMatch) {
        return { provider: eipMatch.provider, isSpecificallyDetected: true };
      }

      if (walletId === "rabbyWallet" && win.rabby && typeof win.rabby.request === "function") {
        return { provider: win.rabby, isSpecificallyDetected: true };
      }
      if (
        walletId === "coinbaseWallet" &&
        win.coinbaseWalletExtension &&
        typeof win.coinbaseWalletExtension.request === "function"
      ) {
        return { provider: win.coinbaseWalletExtension, isSpecificallyDetected: true };
      }
      if (walletId === "rainbowWallet" && win.rainbow && typeof win.rainbow.request === "function") {
        return { provider: win.rainbow, isSpecificallyDetected: true };
      }

      const fallbackEth = getWindowEthereum();
      if (fallbackEth) {
        const matchesFlag =
          (walletId === "rabbyWallet" && Boolean(fallbackEth.isRabby)) ||
          (walletId === "metaMaskWallet" && Boolean(fallbackEth.isMetaMask)) ||
          (walletId === "coinbaseWallet" && Boolean(fallbackEth.isCoinbaseWallet)) ||
          (walletId === "rainbowWallet" && Boolean(fallbackEth.isRainbow));
        return { provider: fallbackEth, isSpecificallyDetected: matchesFlag };
      }

      return { provider: null, isSpecificallyDetected: false };
    },
    [discoveredWallets]
  );

  // Restore active wallet session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedWalletId = localStorage.getItem(WALLET_ID_STORAGE_KEY) as SupportedWalletId | null;
    const eth = getWindowEthereum();
    if (!eth) return;

    let active = true;
    eth
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (!active) return;
        if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
          setAddress(accounts[0]);
          setActiveProvider(eth);
          setConnectedWalletId(savedWalletId || "metaMaskWallet");
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
        setConnectedWalletId(null);
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

  // Fetch Base Sepolia balance whenever address changes
  useEffect(() => {
    if (!address || !address.startsWith("0x")) {
      setBalanceEth(null);
      return;
    }

    let active = true;
    publicClient
      .getBalance({ address: address as `0x${string}` })
      .then((wei) => {
        if (!active) return;
        const formatted = Number(formatEther(wei)).toFixed(4);
        setBalanceEth(formatted);
      })
      .catch(() => {
        if (active) setBalanceEth(null);
      });

    return () => {
      active = false;
    };
  }, [address, chainId]);

  const openConnectModal = useCallback(() => {
    setErrorMessage(null);
    setErrorDownloadUrl(null);
    setStatusHint(null);
    setIsModalOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setIsModalOpen(false);
    setErrorMessage(null);
    setErrorDownloadUrl(null);
    setStatusHint(null);
  }, []);

  const connectWallet = useCallback(async () => {
    openConnectModal();
  }, [openConnectModal]);

  const connectWalletOption = useCallback(
    async (spec: WalletOptionSpec, forcePermissionPrompt = false) => {
      setErrorMessage(null);
      setErrorDownloadUrl(null);
      setStatusHint(null);
      setIsConnecting(true);
      setConnectingId(spec.id);

      try {
        if (spec.id === "walletConnectWallet") {
          setStatusHint("Initializing WalletConnect QR modal for Base Sepolia...");
          const wcModule = await import("@walletconnect/ethereum-provider");
          const EthereumProviderCtor = wcModule.EthereumProvider || wcModule.default;
          const projectId =
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
            "3a8170812b534d0ff9d794f19a901d64";

          const wcProvider = await EthereumProviderCtor.init({
            projectId,
            chains: [BASE_SEPOLIA_CHAIN_ID],
            optionalChains: [1, 8453, 11155111],
            showQrModal: true,
            rpcMap: {
              [BASE_SEPOLIA_CHAIN_ID]: BASE_SEPOLIA_RPC,
            },
            metadata: {
              name: "Syllaba",
              description: "Multi-Agent Academic Task Decomposition & Base Sepolia Study Proofs",
              url: typeof window !== "undefined" ? window.location.origin : "https://syllaba.xyz",
              icons: ["https://syllaba.xyz/favicon.ico"],
            },
          });

          await wcProvider.enable();
          const accounts = (await wcProvider.request({ method: "eth_accounts" })) as string[];
          if (Array.isArray(accounts) && accounts[0]) {
            const castProvider = wcProvider as unknown as EthereumProvider;
            setAddress(accounts[0]);
            setActiveProvider(castProvider);
            setConnectedWalletId("walletConnectWallet");
            if (typeof window !== "undefined") {
              localStorage.setItem(WALLET_ID_STORAGE_KEY, "walletConnectWallet");
            }
            await readChainId(castProvider);
            setStatusHint(null);
            setIsModalOpen(false);
          }
          return;
        }

        const { provider } = resolveProviderForWallet(spec.id);
        if (!provider) {
          setErrorMessage(
            `${spec.name} extension was not detected in this browser. Install ${spec.name} or choose WalletConnect to scan a QR code from your mobile wallet.`
          );
          setErrorDownloadUrl(spec.downloadUrl);
          return;
        }

        setStatusHint(
          `Opening ${spec.name}... If the extension popup does not appear automatically, click the ${spec.name} icon in your browser toolbar.`
        );

        if (forcePermissionPrompt) {
          await provider.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        }

        const accounts = await provider.request({ method: "eth_requestAccounts" });
        if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
          setAddress(accounts[0]);
          setActiveProvider(provider);
          setConnectedWalletId(spec.id);
          if (typeof window !== "undefined") {
            localStorage.setItem(WALLET_ID_STORAGE_KEY, spec.id);
          }
          await readChainId(provider);
          setStatusHint(null);
          setIsModalOpen(false);
        } else {
          setErrorMessage(`No account returned from ${spec.name}.`);
        }
      } catch (err: unknown) {
        const code = (err as { code?: number })?.code;
        const rawMsg = (err as { message?: string })?.message || `Could not connect to ${spec.name}.`;
        if (code === -32002) {
          setErrorMessage(
            `${spec.name} already has a pending connection request open. Click the ${spec.name} extension icon in the top-right toolbar of your browser to approve it.`
          );
        } else if (code === 4001 || rawMsg.toLowerCase().includes("user rejected")) {
          setErrorMessage(`Connection request was cancelled in ${spec.name}.`);
        } else {
          setErrorMessage(rawMsg);
        }
      } finally {
        setIsConnecting(false);
        setConnectingId(null);
      }
    },
    [readChainId, resolveProviderForWallet]
  );

  const disconnectWallet = useCallback(() => {
    try {
      void activeProvider?.disconnect?.();
    } catch {
      // Ignore disconnect errors
    }
    setAddress(null);
    setConnectedWalletId(null);
    setActiveProvider(null);
    setErrorMessage(null);
    setStatusHint(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_ID_STORAGE_KEY);
    }
  }, [activeProvider]);

  const switchToBaseSepolia = useCallback(async (): Promise<boolean> => {
    const eth = activeProvider || getWindowEthereum();
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
                rpcUrls: [BASE_SEPOLIA_RPC],
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
  }, [activeProvider]);

  const signPersonalMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      const eth = activeProvider || getWindowEthereum();
      if (!eth) {
        throw new Error("Wallet provider is not connected.");
      }

      const hexMessage = toHex(message);
      const signature = await eth.request({
        method: "personal_sign",
        params: [hexMessage, address],
      });
      return String(signature);
    },
    [activeProvider, address]
  );

  const deployVaultContractOnChain = useCallback(async (): Promise<{
    txHash: string;
    contractAddress: `0x${string}` | null;
  }> => {
    if (!address) {
      throw new Error("Wallet is not connected.");
    }

    const eth = activeProvider || getWindowEthereum();
    if (!eth) {
      throw new Error("Wallet is not connected.");
    }

    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      await switchToBaseSepolia();
    }

    const txHashRaw = await eth.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: address,
          data: SYLLABA_VAULT_BYTECODE,
        },
      ],
    });
    const txHash = String(txHashRaw);

    for (let attempt = 0; attempt < 25; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const receipt = (await eth.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        })) as { contractAddress?: string } | null;

        if (receipt && typeof receipt.contractAddress === "string" && receipt.contractAddress) {
          return {
            txHash,
            contractAddress: receipt.contractAddress as `0x${string}`,
          };
        }
      } catch {
        // Keep polling while block mines
      }
    }

    return { txHash, contractAddress: null };
  }, [activeProvider, address, chainId, switchToBaseSepolia]);

  const commitStudyPlanOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
      ipfsCid: string;
      totalMilestones: bigint;
      deadline: bigint;
      stakeEth: string;
    }): Promise<string> => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      const data = encodeFunctionData({
        abi: SYLLABA_VAULT_ABI,
        functionName: "commitStudyPlan",
        args: [params.roadmapHash, params.ipfsCid, params.totalMilestones, params.deadline],
      });

      const valueWei = Number(params.stakeEth) > 0 ? parseEther(params.stakeEth) : BigInt(0);

      const eth = activeProvider || getWindowEthereum();
      if (!eth) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

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
    [activeProvider, address, chainId, switchToBaseSepolia]
  );

  const verifyMilestoneOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
      milestoneIndex: bigint;
      proofHash: `0x${string}`;
    }): Promise<string> => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      const data = encodeFunctionData({
        abi: SYLLABA_VAULT_ABI,
        functionName: "verifyMilestone",
        args: [params.roadmapHash, params.milestoneIndex, params.proofHash],
      });

      const eth = activeProvider || getWindowEthereum();
      if (!eth) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: params.vaultAddress,
            data,
          },
        ],
      });

      return String(txHash);
    },
    [activeProvider, address, chainId, switchToBaseSepolia]
  );

  const claimStudyCredentialOnChain = useCallback(
    async (params: {
      vaultAddress: `0x${string}`;
      roadmapHash: `0x${string}`;
    }): Promise<string> => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      const data = encodeFunctionData({
        abi: SYLLABA_VAULT_ABI,
        functionName: "claimStudyCredential",
        args: [params.roadmapHash],
      });

      const eth = activeProvider || getWindowEthereum();
      if (!eth) {
        throw new Error("Wallet is not connected.");
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepolia();
      }

      const txHash = await eth.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: params.vaultAddress,
            data,
          },
        ],
      });

      return String(txHash);
    },
    [activeProvider, address, chainId, switchToBaseSepolia]
  );

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        chainName: resolveChainName(chainId),
        connectedWalletId,
        balanceEth,
        isConnected: Boolean(address),
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
      }}
    >
      {children}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={closeConnectModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Wallet className="h-4 w-4 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Connect a Wallet</h3>
                  <p className="text-[11px] text-slate-500">
                    Base Sepolia Network (Chain ID: 84532)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeConnectModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body: 5 Requested Wallets */}
            <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Popular Wallets
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  EIP-6963 &amp; WalletConnect v2
                </span>
              </div>

              <div className="space-y-2">
                {SUPPORTED_WALLETS.map((spec) => {
                  const isWc = spec.id === "walletConnectWallet";
                  const { isSpecificallyDetected } = isWc
                    ? { isSpecificallyDetected: false }
                    : resolveProviderForWallet(spec.id);
                  const isThisLoading = isConnecting && connectingId === spec.id;

                  return (
                    <button
                      key={spec.id}
                      type="button"
                      disabled={isConnecting}
                      onClick={() => void connectWalletOption(spec)}
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border font-bold text-xs ${spec.badgeClass}`}
                        >
                          {isWc ? <QrCode className="h-4 w-4" /> : spec.badgeText}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{spec.name}</span>
                            {isSpecificallyDetected && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                                Installed
                              </span>
                            )}
                            {isWc && (
                              <span className="rounded bg-brand-100 px-1.5 py-0.2 text-[10px] font-semibold text-brand-800">
                                QR Code
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{spec.subtitle}</p>
                        </div>
                      </div>
                      {isThisLoading ? (
                        <Loader2 className="h-4 w-4 text-brand-600 animate-spin" />
                      ) : (
                        <span className="text-xs font-semibold text-brand-600">Connect</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status or Error Banner */}
              {statusHint && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900 flex items-start gap-2.5">
                  <Loader2 className="h-4 w-4 text-brand-600 animate-spin shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Waiting for Wallet Confirmation...</p>
                    <p className="text-[11px] text-brand-800 leading-relaxed">{statusHint}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">Wallet Connection Notice</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">{errorMessage}</p>
                    {errorDownloadUrl && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        <a
                          href={errorDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-900"
                        >
                          <span>Get Wallet Extension</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>EIP-1193 &amp; EIP-6963 Verified</span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Layers className="h-3 w-3 text-brand-600" />
                <span>Base Sepolia (84532)</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </Web3Context.Provider>
  );
}
