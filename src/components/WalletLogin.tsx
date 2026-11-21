"use client";

import React, { useEffect, useState } from "react";
import { BASE_SEPOLIA_CHAIN_ID, useWeb3 } from "@/components/Web3Providers";
import { useLanguage } from "@/client/context/LanguageContext";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

export function WalletLogin() {
  const {
    address,
    chainId,
    chainName,
    balanceEth,
    isConnected,
    isConnecting,
    openConnectModal,
    disconnectWallet,
    switchToBaseSepolia,
  } = useWeb3();
  const { copy } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-36 rounded-full bg-[#F7F7F5] animate-pulse" />;
  }

  if (isConnected && address) {
    const isWrongNetwork = chainId !== BASE_SEPOLIA_CHAIN_ID;

    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork ? (
          <button
            type="button"
            onClick={() => void switchToBaseSepolia()}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Switch to Base Sepolia</span>
          </button>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#FACC15]/60 bg-[#FEF3C7]/70 px-3 py-1.5 text-xs font-semibold text-[#111111]">
            <span className="h-2 w-2 rounded-full bg-[#EAB308]" />
            <span>{chainName}</span>
            {balanceEth !== null && (
              <span className="text-[11px] font-mono text-[#78350F] pl-1.5 border-l border-[#F5B700]/40">
                {balanceEth} ETH
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={openConnectModal}
          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-black/15 bg-white hover:bg-[#F7F7F5] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-mono font-semibold text-[#111111] transition-colors cursor-pointer"
          title="Click to switch wallet"
        >
          <Wallet className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
          <span className="sm:hidden">
            {address.slice(0, 4)}..{address.slice(-3)}
          </span>
          <span className="hidden sm:inline">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="h-3 w-3 text-[#666660] shrink-0" />
        </button>

        <button
          type="button"
          onClick={disconnectWallet}
          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white p-1.5 text-[#666660] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
          title={copy.disconnectWallet}
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={openConnectModal}
        disabled={isConnecting}
        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#FACC15] hover:bg-[#F5B700] border border-[#EAB308] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-[#111111] shadow-xs disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
      >
        <Wallet className="h-3.5 w-3.5 text-[#111111] shrink-0" />
        <span className="sm:hidden">{isConnecting ? "..." : "Wallet"}</span>
        <span className="hidden sm:inline">
          {isConnecting ? "..." : copy.connectWallet}
        </span>
      </button>
    </div>
  );
}
