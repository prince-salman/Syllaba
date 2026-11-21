"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { WalletLogin } from "@/components/WalletLogin";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useWeb3 } from "@/components/Web3Providers";

export function Header() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { isConnected } = useWeb3();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  // Mutually exclusive auth visibility:
  // - Logged in via email only -> hide Connect Wallet
  // - Logged in via wallet only -> hide Sign in / Register
  const showWalletControl = isConnected || (!loading && !user);
  const showEmailAuthButtons = !loading && !user && !isConnected;
  const showEmailUserProfile = !loading && Boolean(user);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5ECE8] bg-white/95 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 min-w-0 group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5ECE8] bg-white p-1 shadow-sm">
            <img
              src="/syllaba-mark.png"
              alt="Syllaba Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#111815] group-hover:text-[#125B3A] transition">
                Syllaba
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-[#DDF1E4] px-2 py-0.5 text-[10px] font-semibold text-[#125B3A] border border-[#52B788]/30">
                AI Study Planner
              </span>
            </div>
            <p className="hidden text-xs text-[#6B7872] sm:block truncate">
              Turn dense syllabi into calm daily study plans
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {showWalletControl && <WalletLogin />}

          {showWalletControl && showEmailAuthButtons && (
            <div className="hidden sm:block h-5 w-px bg-[#E5ECE8] mx-0.5" />
          )}

          {showEmailUserProfile && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-xl bg-[#F4F7F5] border border-[#E5ECE8] px-3 py-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#125B3A] text-white text-[11px] font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-[#111815] max-w-[140px] truncate">
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5ECE8] bg-white hover:bg-[#F4E0E6]/60 hover:border-[#D9386A]/30 hover:text-[#9B1C44] px-3 py-2 text-xs font-semibold text-[#6B7872] transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}

          {showEmailAuthButtons && (
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
          )}
        </div>
      </div>
    </header>
  );
}
