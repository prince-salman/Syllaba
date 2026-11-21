"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Roadmap } from "@/shared/types/roadmap";
import { useLanguage } from "@/client/context/LanguageContext";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Globe,
  HelpCircle,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

export type SidebarView =
  | "dashboard"
  | "uploader"
  | "history"
  | "settings-account"
  | "settings-language"
  | "help";

interface GlassySidebarProps {
  user: User | null;
  walletAddress: string | null;
  isWalletConnected: boolean;
  displayName: string;
  activeView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  storedRoadmaps: Roadmap[];
  activeRoadmapId?: string | null;
  onSelectRoadmap: (roadmapId: string) => void;
  onSignOut: () => void;
}

export function GlassySidebar({
  user,
  walletAddress,
  isWalletConnected,
  displayName,
  activeView,
  onSelectView,
  storedRoadmaps,
  activeRoadmapId,
  onSelectRoadmap,
  onSignOut,
}: GlassySidebarProps) {
  const { lang } = useLanguage();
  const isId = lang === "id";

  const isSettingsActive =
    activeView === "settings-account" || activeView === "settings-language";
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const handleToggleSettings = () => {
    setSettingsOpen((prev) => !prev);
    if (!isSettingsActive) {
      onSelectView("settings-account");
    }
  };

  const secondaryIdentifier = user?.email
    ? `@${user.email.split("@")[0]}`
    : isWalletConnected && walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : isId
    ? "Mode Tamu"
    : "Guest Session";

  const shortUserId = user?.id
    ? `ID #${user.id.slice(0, 6).toUpperCase()}`
    : isWalletConnected
    ? "Base Sepolia"
    : "Syllaba";

  return (
    <aside
      className={`lg:col-span-3 xl:col-span-2 border-b lg:border-b-0 lg:border-r p-4 sm:p-5 flex flex-col justify-between gap-5 transition-colors ${
        user
          ? "border-white/50 bg-gradient-to-b from-white/80 via-[#F2F8F4]/75 to-[#E5F2EA]/75 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.6)]"
          : "border-[#E5ECE8] bg-[#FAFDFB]/90 backdrop-blur-xl"
      }`}
    >
      <div className="space-y-5">
        {/* Glassy Profile Header (Name ID / Username) */}
        <div
          className={`rounded-2xl p-3.5 border transition-all ${
            user
              ? "border-white/60 bg-gradient-to-br from-[#0D1913]/90 via-[#125B3A]/90 to-[#1F7A4F]/85 text-white shadow-[0_12px_28px_-14px_rgba(18,91,58,0.6)] backdrop-blur-md"
              : "border-[#E5ECE8] bg-white/80 text-[#111815] shadow-xs"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold border ${
                user
                  ? "bg-white/20 border-white/30 text-white"
                  : "bg-[#DDF1E4] border-[#52B788]/30 text-[#125B3A]"
              }`}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold truncate">{displayName}</p>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[9px] font-mono font-semibold shrink-0 ${
                    user ? "bg-white/15 text-[#DDF1E4]" : "bg-[#F4F7F5] text-[#6B7872]"
                  }`}
                >
                  {shortUserId}
                </span>
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  user ? "text-[#CBE3D6]" : "text-[#6B7872]"
                }`}
              >
                {secondaryIdentifier}
              </p>
            </div>
          </div>
        </div>

        {/* Core Study Workspace */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7872] mb-2">
            {isId ? "Ruang Belajar" : "Workspace"}
          </p>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectView("dashboard")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition relative cursor-pointer ${
                activeView === "dashboard"
                  ? "bg-white/95 text-[#125B3A] shadow-xs border border-[#52B788]/25"
                  : "text-[#4D5A54] hover:bg-white/60 hover:text-[#111815]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" />
                <span>{isId ? "Dasbor" : "Dashboard"}</span>
              </span>
              {activeView === "dashboard" && (
                <ChevronRight className="h-3.5 w-3.5 text-[#125B3A]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectView("uploader")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition relative cursor-pointer ${
                activeView === "uploader"
                  ? "bg-white/95 text-[#125B3A] shadow-xs border border-[#52B788]/25"
                  : "text-[#4D5A54] hover:bg-white/60 hover:text-[#111815]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4" />
                <span>{isId ? "Silabus Baru" : "New Syllabus"}</span>
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#125B3A] text-white text-[10px]">
                +
              </span>
            </button>
          </nav>
        </div>

        {/* Quick Courses */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7872]">
              {isId ? "Kursus" : "Courses"}
            </p>
            <span className="rounded-full bg-[#DDF1E4] px-2 py-0.5 text-[10px] font-bold text-[#125B3A]">
              {storedRoadmaps.length}
            </span>
          </div>

          {storedRoadmaps.length === 0 ? (
            <p className="px-3 text-[11px] text-[#6B7872] leading-relaxed">
              {isId
                ? "Belum ada roadmap. Unggah silabus pertama Anda."
                : "No roadmaps yet. Upload your first syllabus."}
            </p>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {storedRoadmaps.slice(0, 6).map((r) => {
                const isSelected =
                  activeView === "dashboard" && activeRoadmapId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRoadmap(r.id)}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-[#125B3A] text-white shadow-xs"
                        : "text-[#4D5A54] hover:bg-white/70 hover:text-[#111815]"
                    }`}
                  >
                    <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{r.courseTitle}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 1-5 Menu: Login (if not signed in), History, Setting (> Account, > Language), Help/Contact Us, Logout */}
        <div className="pt-3 border-t border-[#E5ECE8]/80 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7872] mb-2">
            {isId ? "Menu Akun" : "Account & Tools"}
          </p>

          {/* 1. Login (if not logged in) */}
          {!user && (
            <Link
              href="/login"
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold bg-[#DDF1E4]/80 text-[#125B3A] hover:bg-[#DDF1E4] transition"
            >
              <span className="flex items-center gap-2.5">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* 2. History */}
          <button
            type="button"
            onClick={() => onSelectView("history")}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              activeView === "history"
                ? "bg-white/95 text-[#125B3A] shadow-xs border border-[#52B788]/25"
                : "text-[#4D5A54] hover:bg-white/60 hover:text-[#111815]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <History className="h-4 w-4" />
              <span>History</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#9AA6A0]" />
          </button>

          {/* 3. Setting (> Account, > Language) */}
          <div>
            <button
              type="button"
              onClick={handleToggleSettings}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                isSettingsActive
                  ? "bg-white/95 text-[#125B3A] shadow-xs border border-[#52B788]/25"
                  : "text-[#4D5A54] hover:bg-white/60 hover:text-[#111815]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="h-4 w-4" />
                <span>Setting</span>
              </span>
              {settingsOpen || isSettingsActive ? (
                <ChevronDown className="h-3.5 w-3.5 text-[#125B3A]" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-[#9AA6A0]" />
              )}
            </button>

            {(settingsOpen || isSettingsActive) && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#D3DED8] space-y-1">
                <button
                  type="button"
                  onClick={() => onSelectView("settings-account")}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeView === "settings-account"
                      ? "bg-[#DDF1E4]/80 text-[#125B3A]"
                      : "text-[#6B7872] hover:bg-white/60 hover:text-[#111815]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Account</span>
                  </span>
                  <ChevronRight className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectView("settings-language")}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeView === "settings-language"
                      ? "bg-[#DDF1E4]/80 text-[#125B3A]"
                      : "text-[#6B7872] hover:bg-white/60 hover:text-[#111815]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Language</span>
                  </span>
                  <span className="rounded bg-white/80 px-1.5 py-0.2 text-[10px] font-mono uppercase text-[#125B3A] border border-[#E5ECE8]">
                    {lang}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Help / Contact Us */}
          <button
            type="button"
            onClick={() => onSelectView("help")}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              activeView === "help"
                ? "bg-white/95 text-[#125B3A] shadow-xs border border-[#52B788]/25"
                : "text-[#4D5A54] hover:bg-white/60 hover:text-[#111815]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4" />
              <span>Help / Contact Us</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#9AA6A0]" />
          </button>
        </div>
      </div>

      {/* Bottom Glass Card + Logout (if logged in) */}
      <div className="space-y-3">
        <div className="rounded-2xl bg-emerald-bento p-3.5 text-white relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#52B788]/25 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#DDF1E4]">
              <Sparkles className="h-3 w-3 text-[#52B788]" />
              5-Agent Pipeline
            </span>
            <p className="mt-2 text-xs font-bold leading-snug">
              {isId ? "Mulai Sprint Baru" : "Start a New Sprint"}
            </p>
            <button
              type="button"
              onClick={() => onSelectView("uploader")}
              className="mt-2.5 w-full rounded-xl bg-[#52B788] hover:bg-[#3FA474] text-[#0D1913] font-bold py-1.5 text-xs transition cursor-pointer"
            >
              {isId ? "+ Buat Roadmap" : "+ Generate Plan"}
            </button>
          </div>
        </div>

        {/* 5. Logout (only when logged in) */}
        {user && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-between rounded-xl border border-[#F4E0E6] bg-white/75 px-3 py-2 text-xs font-semibold text-[#9B1C44] hover:bg-[#F4E0E6]/70 transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        <p className="px-2 text-[10px] text-[#6B7872] leading-tight">
          Copyright © 2026 Syllaba · ITSPIRIT
        </p>
      </div>
    </aside>
  );
}
