"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, LogOut, User } from "lucide-react";
import { WalletLogin } from "@/components/WalletLogin";
import { useAuth } from "@/client/components/auth/AuthProvider";

export function Header() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5ECE8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 min-w-0 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-kpi text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#111815] group-hover:text-[#125B3A] transition">
                Syllaba
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-[#DDF1E4] px-2 py-0.5 text-[10px] font-semibold text-[#125B3A] border border-[#52B788]/30">
                Multi-Agent AI
              </span>
            </div>
            <p className="hidden text-xs text-[#6B7872] sm:block truncate">
              Adaptive Academic Roadmap &amp; On-Chain Study Proof
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <WalletLogin />

          <div className="hidden sm:block h-5 w-px bg-[#E5ECE8] mx-0.5" />

          {!loading && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-xl bg-[#F4F7F5] border border-[#E5ECE8] px-3 py-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#125B3A] text-white text-[11px] font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-[#111815] max-w-[120px] truncate">
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5ECE8] bg-white hover:bg-[#F4E0E6]/60 hover:border-[#D9386A]/30 hover:text-[#9B1C44] px-3 py-2 text-xs font-semibold text-[#6B7872] transition"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : !loading ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5ECE8] bg-white hover:bg-[#F4F7F5] px-3 py-2 text-xs font-semibold text-[#111815] transition"
              >
                <User className="h-3.5 w-3.5 text-[#125B3A]" />
                <span>Sign in</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center rounded-xl bg-[#125B3A] hover:bg-[#1F7A4F] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
              >
                Register
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
