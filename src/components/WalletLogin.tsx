"use client";

import React, { useEffect, useState } from "react";
import { BASE_SEPOLIA_CHAIN_ID, useWeb3 } from "@/components/Web3Providers";
import { Wallet, LogOut, AlertCircle } from "lucide-react";

export function WalletLogin() {
  const {
    address,
    chainId,
    chainName,
    isConnected,
    isConnecting,
    errorMessage,
    connectWallet,
    disconnectWallet,
    switchToBaseSepolia,
  } = useWeb3();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-36 rounded-lg bg-slate-100 animate-pulse" />;
  }

  if (isConnected && address) {
    const isWrongNetwork = chainId !== BASE_SEPOLIA_CHAIN_ID;

    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork ? (
          <button
            type="button"
            onClick={() => void switchToBaseSepolia()}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Switch to Base Sepolia</span>
          </button>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{chainName}</span>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800">
          <Wallet className="h-3.5 w-3.5 text-brand-600" />
          <span>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>

        <button
          type="button"
          onClick={disconnectWallet}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
          title="Disconnect Wallet"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void connectWallet()}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
      >
        <Wallet className="h-3.5 w-3.5 text-brand-400" />
        <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
      </button>

      {errorMessage && (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800"
          title={errorMessage}
        >
          <AlertCircle className="h-3 w-3" />
          <span>Open MetaMask</span>
        </a>
      )}
    </div>
  );
}
