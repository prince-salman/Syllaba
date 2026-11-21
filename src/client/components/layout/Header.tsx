"use client";

import React from "react";
import { Layers } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export function Header() {
  const { isConnected, chain } = useAccount();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">Syllaba</span>
              <span className="hidden sm:inline-flex rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200">
                Multi-Agent AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block truncate">
              Adaptive Academic Roadmap &amp; On-Chain Study Proof
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <span>{isConnected && chain ? chain.name : "Base Sepolia Ready"}</span>
          </div>

          <ConnectButton
            label="Connect Wallet"
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}
