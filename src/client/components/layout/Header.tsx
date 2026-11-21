"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, LogOut, Sparkles, User } from "lucide-react";
import { WalletLogin } from "@/components/WalletLogin";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useWeb3 } from "@/components/Web3Providers";
import { useLanguage, AppLanguage } from "@/client/context/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/client/i18n/translations";

export function Header() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { isConnected } = useWeb3();
  const { lang, copy, setLang } = useLanguage();

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
    <header className="sticky top-0 z-40 w-full px-2.5 sm:px-6 pt-2 sm:pt-3">
      <div className="w-full rounded-2xl border border-black/10 bg-white/85 backdrop-blur-xl shadow-[0_10px_35px_-18px_rgba(0,0,0,0.22)]">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8">
          {/* Brand Logo (Direct Frameless Mark - No Box/Border) */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <img
              src="/syllaba-mark.png"
              alt="Syllaba"
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#111111] truncate">
                  Syllaba
                </span>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[10px] font-bold text-[#92400E] border border-[#FACC15]/60">
                  <Sparkles className="h-2.5 w-2.5 text-[#D97706]" />
                  <span>AI Study Planner</span>
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-[#666660] truncate">
                {copy.headerSubtitle}
              </p>
            </div>
          </Link>

          {/* Center Floating 6-Language Switcher Dock */}
          <div className="hidden xl:flex items-center rounded-full border border-black/10 bg-[#F7F7F5]/90 p-1">
            <label className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-[#111111] hover:bg-white transition cursor-pointer">
              <Globe className="h-3.5 w-3.5 text-[#666660]" />
              <select
                aria-label="Select interface language"
                value={lang}
                onChange={(e) => setLang(e.target.value as AppLanguage)}
                className="bg-transparent text-[11px] font-bold text-[#111111] focus:outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.shortCode} · {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Right User-Friendly Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <label className="xl:hidden inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#F7F7F5] px-2 py-1 text-[10px] sm:text-[11px] font-bold text-[#111111] cursor-pointer">
              <Globe className="h-3 w-3 text-[#666660] shrink-0" />
              <select
                aria-label="Language"
                value={lang}
                onChange={(e) => setLang(e.target.value as AppLanguage)}
                className="bg-transparent font-mono uppercase text-[#111111] focus:outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.shortCode}
                  </option>
                ))}
              </select>
            </label>

            {showWalletControl && <WalletLogin />}

            {showWalletControl && showEmailAuthButtons && (
              <div className="hidden sm:block h-5 w-px bg-black/10 mx-0.5" />
            )}

            {showEmailUserProfile && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="hidden md:flex items-center gap-2 rounded-full bg-[#F7F7F5] border border-black/10 pl-1.5 pr-3 py-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] text-[#FACC15] text-[11px] font-extrabold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-[#111111] max-w-[130px] truncate">
                    {displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white hover:bg-[#FEF3C7] hover:border-[#F5B700] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-[#111111] transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{copy.logout}</span>
                </button>
              </div>
            )}

            {showEmailAuthButtons && (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white hover:bg-[#F7F7F5] px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-[#111111] transition whitespace-nowrap"
                >
                  <User className="h-3.5 w-3.5 text-[#111111] shrink-0" />
                  <span>{copy.signIn}</span>
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center rounded-full bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-bold text-[#FACC15] shadow-xs transition whitespace-nowrap"
                >
                  {copy.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
