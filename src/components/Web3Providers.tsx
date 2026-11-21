"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatEther,
  http,
  parseEther,
  toHex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { SYLLABA_VAULT_ABI, SYLLABA_VAULT_BYTECODE } from "@/shared/contracts/syllabaVault";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_HEX = "0x14a34";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const EMBEDDED_PK_STORAGE_KEY = "syllaba_embedded_wallet_pk";
const WALLET_MODE_STORAGE_KEY = "syllaba_wallet_mode";

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
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

type WalletMode = "injected" | "embedded" | null;

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
  walletMode: WalletMode;
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
}

const Web3Context = createContext<Web3ContextValue>({
  address: null,
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: "Base Sepolia",
  walletMode: null,
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
  const [walletMode, setWalletMode] = useState<WalletMode>(null);
  const [activeProvider, setActiveProvider] = useState<EthereumProvider | null>(null);
  const [embeddedPrivateKey, setEmbeddedPrivateKey] = useState<`0x${string}` | null>(null);
  const [balanceEth, setBalanceEth] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const [discoveredWallets, setDiscoveredWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [showImportKey, setShowImportKey] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState("");

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
      const list = Array.isArray(winEth.providers) && winEth.providers.length > 0
        ? winEth.providers
        : [winEth];

      list.forEach((prov, idx) => {
        const name = prov.isMetaMask
          ? "MetaMask"
          : prov.isCoinbaseWallet
          ? "Coinbase Wallet"
          : prov.isRabby
          ? "Rabby Wallet"
          : prov.isPhantom
          ? "Phantom"
          : prov.isBraveWallet
          ? "Brave Wallet"
          : "Browser Wallet";
        const rdns = `injected.${name.toLowerCase().replace(/\s+/g, "-")}.${idx}`;
        const alreadyListed = Array.from(map.values()).some(
          (item) => item.provider === prov || item.info.name.toLowerCase() === name.toLowerCase()
        );
        if (!alreadyListed) {
          map.set(rdns, {
            info: {
              uuid: rdns,
              name,
              icon: "",
              rdns,
            },
            provider: prov,
          });
        }
      });
      setDiscoveredWallets(Array.from(map.values()));
    }

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  // Restore active wallet session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedMode = localStorage.getItem(WALLET_MODE_STORAGE_KEY) as WalletMode;
    const savedPk = localStorage.getItem(EMBEDDED_PK_STORAGE_KEY) as `0x${string}` | null;

    if (savedMode === "embedded" && savedPk && savedPk.startsWith("0x") && savedPk.length === 66) {
      try {
        const account = privateKeyToAccount(savedPk);
        setEmbeddedPrivateKey(savedPk);
        setAddress(account.address);
        setWalletMode("embedded");
        setChainId(BASE_SEPOLIA_CHAIN_ID);
        return;
      } catch {
        // Ignore invalid key
      }
    }

    const eth = getWindowEthereum();
    if (!eth) return;

    let active = true;
    if (savedMode !== "embedded") {
      eth
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (!active) return;
          if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
            setAddress(accounts[0]);
            setActiveProvider(eth);
            setWalletMode("injected");
          }
        })
        .catch(() => {});

      void readChainId(eth);
    }

    const handleAccountsChanged = (accounts: unknown) => {
      if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
        setAddress(accounts[0]);
        setWalletMode("injected");
        setErrorMessage(null);
      } else if (walletMode === "injected") {
        setAddress(null);
        setWalletMode(null);
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
  }, [readChainId, walletMode]);

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
    setStatusHint(null);
    setIsModalOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setIsModalOpen(false);
    setErrorMessage(null);
    setStatusHint(null);
  }, []);

  const connectWallet = useCallback(async () => {
    openConnectModal();
  }, [openConnectModal]);

  const connectWithProvider = useCallback(
    async (provider: EthereumProvider | null, label: string, forcePermissionPrompt = false) => {
      setErrorMessage(null);
      setStatusHint(null);

      const target = provider || getWindowEthereum();
      if (!target) {
        setErrorMessage(
          `No ${label} extension detected in this browser. Install MetaMask or click "Instant Base Sepolia Sandbox Wallet" below to connect immediately without an extension.`
        );
        return;
      }

      setIsConnecting(true);
      setStatusHint(
        `Requesting connection from ${label}... If the popup does not appear automatically, click the ${label} extension icon in the top-right corner of your browser.`
      );

      try {
        if (forcePermissionPrompt) {
          await target.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        }

        const accounts = await target.request({ method: "eth_requestAccounts" });
        if (Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0]) {
          setAddress(accounts[0]);
          setActiveProvider(target);
          setWalletMode("injected");
          if (typeof window !== "undefined") {
            localStorage.setItem(WALLET_MODE_STORAGE_KEY, "injected");
          }
          await readChainId(target);
          setStatusHint(null);
          setIsModalOpen(false);
        } else {
          setErrorMessage("No account returned from wallet extension.");
        }
      } catch (err: unknown) {
        const code = (err as { code?: number })?.code;
        const rawMsg = (err as { message?: string })?.message || "Wallet connection failed.";
        if (code === -32002) {
          setErrorMessage(
            `${label} already has a pending connection request open. Click the ${label} extension icon in the top-right toolbar of your browser to approve it.`
          );
        } else if (code === 4001) {
          setErrorMessage("Connection request was rejected in the wallet popup.");
        } else {
          setErrorMessage(rawMsg);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [readChainId]
  );

  const connectEmbeddedWallet = useCallback((customPk?: string) => {
    setErrorMessage(null);
    setStatusHint(null);

    try {
      let pk: `0x${string}`;
      if (customPk && customPk.trim()) {
        const cleaned = customPk.trim().startsWith("0x")
          ? customPk.trim()
          : `0x${customPk.trim()}`;
        if (cleaned.length !== 66) {
          setErrorMessage("Private key must be a 64-character hex string (with or without 0x prefix).");
          return;
        }
        pk = cleaned as `0x${string}`;
      } else {
        const existing =
          typeof window !== "undefined"
            ? (localStorage.getItem(EMBEDDED_PK_STORAGE_KEY) as `0x${string}` | null)
            : null;
        pk =
          existing && existing.startsWith("0x") && existing.length === 66
            ? existing
            : generatePrivateKey();
      }

      const account = privateKeyToAccount(pk);
      if (typeof window !== "undefined") {
        localStorage.setItem(EMBEDDED_PK_STORAGE_KEY, pk);
        localStorage.setItem(WALLET_MODE_STORAGE_KEY, "embedded");
      }

      setEmbeddedPrivateKey(pk);
      setAddress(account.address);
      setWalletMode("embedded");
      setChainId(BASE_SEPOLIA_CHAIN_ID);
      setCustomKeyInput("");
      setShowImportKey(false);
      setIsModalOpen(false);
    } catch {
      setErrorMessage("Could not initialize Base Sepolia embedded wallet.");
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setWalletMode(null);
    setActiveProvider(null);
    setErrorMessage(null);
    setStatusHint(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_MODE_STORAGE_KEY);
    }
  }, []);

  const switchToBaseSepolia = useCallback(async (): Promise<boolean> => {
    if (walletMode === "embedded") {
      setChainId(BASE_SEPOLIA_CHAIN_ID);
      return true;
    }

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
  }, [activeProvider, walletMode]);

  const signPersonalMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      if (walletMode === "embedded" && embeddedPrivateKey) {
        const account = privateKeyToAccount(embeddedPrivateKey);
        return await account.signMessage({ message });
      }

      const eth = activeProvider || getWindowEthereum();
      if (!eth) {
        throw new Error("Browser wallet extension is not connected.");
      }

      const hexMessage = toHex(message);
      const signature = await eth.request({
        method: "personal_sign",
        params: [hexMessage, address],
      });
      return String(signature);
    },
    [activeProvider, address, embeddedPrivateKey, walletMode]
  );

  const deployVaultContractOnChain = useCallback(async (): Promise<{
    txHash: string;
    contractAddress: `0x${string}` | null;
  }> => {
    if (!address) {
      throw new Error("Wallet is not connected.");
    }

    if (walletMode === "embedded" && embeddedPrivateKey) {
      const account = privateKeyToAccount(embeddedPrivateKey);
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(BASE_SEPOLIA_RPC),
      });

      const txHash = await walletClient.sendTransaction({
        data: SYLLABA_VAULT_BYTECODE,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      return {
        txHash,
        contractAddress: (receipt.contractAddress as `0x${string}`) || null,
      };
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
  }, [activeProvider, address, chainId, embeddedPrivateKey, switchToBaseSepolia, walletMode]);

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

      if (walletMode === "embedded" && embeddedPrivateKey) {
        const account = privateKeyToAccount(embeddedPrivateKey);
        const walletClient = createWalletClient({
          account,
          chain: baseSepolia,
          transport: http(BASE_SEPOLIA_RPC),
        });

        const txHash = await walletClient.sendTransaction({
          to: params.vaultAddress,
          data,
          value: valueWei,
        });
        return txHash;
      }

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
    [activeProvider, address, chainId, embeddedPrivateKey, switchToBaseSepolia, walletMode]
  );

  // Locate explicit MetaMask provider if available
  const metaMaskProvider =
    discoveredWallets.find(
      (w) =>
        w.info.name.toLowerCase().includes("metamask") ||
        w.info.rdns.toLowerCase().includes("metamask") ||
        w.provider.isMetaMask
    )?.provider || getWindowEthereum();

  const hasInjectedWallet = Boolean(metaMaskProvider) || discoveredWallets.length > 0;

  return (
    <Web3Context.Provider
      value={{
        address,
        chainId,
        chainName: resolveChainName(chainId),
        walletMode,
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
                  <h3 className="text-sm font-bold text-slate-900">Connect Web3 Wallet</h3>
                  <p className="text-[11px] text-slate-500">
                    Base Sepolia Testnet (Chain ID: 84532)
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

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Browser Extension Wallets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Browser Wallet Extensions
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      hasInjectedWallet
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        hasInjectedWallet ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    {hasInjectedWallet ? "Extension Detected" : "No Extension Detected"}
                  </span>
                </div>

                {/* Primary MetaMask / Injected Button */}
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => void connectWithProvider(metaMaskProvider, "MetaMask")}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs">
                      MM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>MetaMask / Browser Wallet</span>
                        {hasInjectedWallet && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                            Ready
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {hasInjectedWallet
                          ? "Click to open MetaMask connection prompt"
                          : "Requires MetaMask extension in this browser"}
                      </p>
                    </div>
                  </div>
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 text-brand-600 animate-spin" />
                  ) : (
                    <span className="text-xs font-semibold text-brand-600">Connect</span>
                  )}
                </button>

                {/* Additional EIP-6963 Wallets if multiple extensions are installed */}
                {discoveredWallets
                  .filter((w) => !w.info.name.toLowerCase().includes("metamask"))
                  .map((w) => (
                    <button
                      key={w.info.uuid}
                      type="button"
                      disabled={isConnecting}
                      onClick={() => void connectWithProvider(w.provider, w.info.name)}
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                          {w.info.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{w.info.name}</div>
                          <p className="text-[10px] text-slate-500">Detected EIP-6963 Wallet</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand-600">Connect</span>
                    </button>
                  ))}

                {hasInjectedWallet && (
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={() => void connectWithProvider(metaMaskProvider, "MetaMask", true)}
                      className="text-[11px] font-medium text-brand-600 hover:text-brand-800 underline cursor-pointer"
                    >
                      Force MetaMask Account Picker Popup
                    </button>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      <span>MetaMask Help</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Status or Error Banner */}
              {statusHint && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-900 flex items-start gap-2.5">
                  <Loader2 className="h-4 w-4 text-brand-600 animate-spin shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Waiting for Wallet Extension...</p>
                    <p className="text-[11px] text-brand-800 leading-relaxed">{statusHint}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">Browser Wallet Notice</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">{errorMessage}</p>
                    {!hasInjectedWallet && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        <a
                          href="https://metamask.io/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-900"
                        >
                          <span>Install MetaMask</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {typeof window !== "undefined" && (
                          <a
                            href={`https://metamask.app.link/dapp/${window.location.host}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                          >
                            <span>Open in MetaMask Mobile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Or Instant Zero-Extension Mode
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              {/* Section 2: Instant Base Sepolia Sandbox / Embedded Wallet */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => connectEmbeddedWallet()}
                  className="w-full flex items-center justify-between rounded-xl border-2 border-brand-200 bg-brand-50/50 px-4 py-3 text-left hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Instant Base Sepolia Wallet</span>
                        <span className="rounded bg-brand-100 px-1.5 py-0.2 text-[10px] font-semibold text-brand-800">
                          1-Click
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Embedded cryptographic secp256k1 wallet (works without extensions)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-700">Activate</span>
                </button>

                {/* Optional Private Key Import for Direct RPC Deployment */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowImportKey((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>
                      {showImportKey
                        ? "Hide Base Sepolia Testnet Key Import"
                        : "Connect with Base Sepolia Testnet Private Key"}
                    </span>
                  </button>

                  {showImportKey && (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <p className="text-[11px] text-slate-600">
                        Paste a funded Base Sepolia testnet private key (kept locally in browser) to deploy{" "}
                        <span className="font-mono font-semibold">SyllabaProofVault.sol</span> directly via Base Sepolia RPC without popup extensions:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={customKeyInput}
                          onChange={(e) => setCustomKeyInput(e.target.value)}
                          placeholder="0x... (Base Sepolia testnet key only)"
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => connectEmbeddedWallet(customKeyInput)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                        >
                          Connect Key
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>EIP-1193 &amp; EIP-191 Verified</span>
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
