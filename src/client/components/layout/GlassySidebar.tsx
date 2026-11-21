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
  Menu,
  PanelLeftClose,
  Plus,
  Settings,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";

export type SidebarView =
  | "dashboard"
  | "uploader"
  | "history"
  | "settings-account"
  | "settings-language"
  | "help";

interface GlassySidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
  onDisconnectWallet: () => void;
}

export function GlassySidebar({
  isOpen,
  onClose,
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
  onDisconnectWallet,
}: GlassySidebarProps) {
  const { lang } = useLanguage();
  const isId = lang === "id";

  const isSettingsActive =
    activeView === "settings-account" || activeView === "settings-language";
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  if (!isOpen) return null;

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

  const isAuthenticated = Boolean(user || isWalletConnected);

  return (
    <aside
      className={`hidden lg:flex w-64 xl:w-72 shrink-0 border-r p-4 xl:p-5 flex-col justify-between gap-5 transition-all duration-200 ${
        isAuthenticated
          ? "border-white/50 bg-gradient-to-b from-white/85 via-[#FFFDF5]/80 to-[#FEF9C3]/65 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.6)]"
          : "border-[#E5E5E0] bg-[#FFFDF8]/90 backdrop-blur-xl"
      }`}
    >
      <div className="space-y-5">
        {/* Collapse Toggle Row */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666660]">
            {isId ? "Navigasi" : "Navigation"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white/80 px-2 py-1 text-[11px] font-semibold text-[#111111] hover:bg-[#FEF3C7] transition cursor-pointer"
            title={isId ? "Tutup Sidebar" : "Collapse Sidebar"}
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
            <span>{isId ? "Tutup" : "Hide"}</span>
          </button>
        </div>

        {/* Glassy Profile Header (Name ID / Username) */}
        <div
          className={`rounded-2xl p-3.5 border transition-all ${
            isAuthenticated
              ? "border-white/60 bg-gradient-to-br from-[#09090B]/95 via-[#18181B]/95 to-[#27272A]/90 text-white shadow-[0_12px_28px_-14px_rgba(17,17,17,0.45)] backdrop-blur-md"
              : "border-[#E5E5E0] bg-white/80 text-[#111111] shadow-xs"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold border ${
                isAuthenticated
                  ? "bg-white/20 border-white/30 text-white"
                  : "bg-[#FEF3C7] border-[#F5B700]/30 text-[#111111]"
              }`}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold truncate">{displayName}</p>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[9px] font-mono font-semibold shrink-0 ${
                    isAuthenticated ? "bg-white/15 text-[#FEF3C7]" : "bg-[#F7F7F5] text-[#666660]"
                  }`}
                >
                  {shortUserId}
                </span>
              </div>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  isAuthenticated ? "text-[#E5E5E0]" : "text-[#666660]"
                }`}
              >
                {secondaryIdentifier}
              </p>
            </div>
          </div>
        </div>

        {/* Core Study Workspace */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#666660] mb-2">
            {isId ? "Ruang Belajar" : "Workspace"}
          </p>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectView("dashboard")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition relative cursor-pointer ${
                activeView === "dashboard"
                  ? "bg-white/95 text-[#111111] shadow-xs border border-[#F5B700]/40"
                  : "text-[#52524C] hover:bg-white/60 hover:text-[#111111]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="h-4 w-4" />
                <span>{isId ? "Dasbor" : "Dashboard"}</span>
              </span>
              {activeView === "dashboard" && (
                <ChevronRight className="h-3.5 w-3.5 text-[#111111]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectView("uploader")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition relative cursor-pointer ${
                activeView === "uploader"
                  ? "bg-white/95 text-[#111111] shadow-xs border border-[#F5B700]/40"
                  : "text-[#52524C] hover:bg-white/60 hover:text-[#111111]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4" />
                <span>{isId ? "Silabus Baru" : "New Syllabus"}</span>
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] text-[#FACC15] text-[10px] font-bold">
                +
              </span>
            </button>
          </nav>
        </div>

        {/* Quick Courses */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#666660]">
              {isId ? "Kursus" : "Courses"}
            </p>
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#111111]">
              {storedRoadmaps.length}
            </span>
          </div>

          {storedRoadmaps.length === 0 ? (
            <p className="px-3 text-[11px] text-[#666660] leading-relaxed">
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
                        ? "bg-[#111111] text-[#FACC15] shadow-xs"
                        : "text-[#52524C] hover:bg-white/70 hover:text-[#111111]"
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
        <div className="pt-3 border-t border-[#E5E5E0]/80 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#666660] mb-2">
            {isId ? "Menu Akun" : "Account & Tools"}
          </p>

          {/* 1. Login (if not logged in) */}
          {!user && !isWalletConnected && (
            <Link
              href="/login"
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold bg-[#FEF3C7]/90 text-[#111111] hover:bg-[#FEF3C7] border border-[#FACC15]/50 transition"
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
                ? "bg-white/95 text-[#111111] shadow-xs border border-[#F5B700]/40"
                : "text-[#52524C] hover:bg-white/60 hover:text-[#111111]"
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
                  ? "bg-white/95 text-[#111111] shadow-xs border border-[#F5B700]/40"
                  : "text-[#52524C] hover:bg-white/60 hover:text-[#111111]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="h-4 w-4" />
                <span>Setting</span>
              </span>
              {settingsOpen || isSettingsActive ? (
                <ChevronDown className="h-3.5 w-3.5 text-[#111111]" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-[#9AA6A0]" />
              )}
            </button>

            {(settingsOpen || isSettingsActive) && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#D4D4D0] space-y-1">
                <button
                  type="button"
                  onClick={() => onSelectView("settings-account")}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeView === "settings-account"
                      ? "bg-[#FEF3C7]/80 text-[#111111]"
                      : "text-[#666660] hover:bg-white/60 hover:text-[#111111]"
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
                      ? "bg-[#FEF3C7]/80 text-[#111111]"
                      : "text-[#666660] hover:bg-white/60 hover:text-[#111111]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Language</span>
                  </span>
                  <span className="rounded bg-white/80 px-1.5 py-0.2 text-[10px] font-mono uppercase text-[#111111] border border-[#E5E5E0]">
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
                ? "bg-white/95 text-[#111111] shadow-xs border border-[#F5B700]/40"
                : "text-[#52524C] hover:bg-white/60 hover:text-[#111111]"
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

      {/* Bottom Glass Card + Logout */}
      <div className="space-y-3">
        <div className="rounded-2xl bg-emerald-bento p-3.5 text-white relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#F5B700]/25 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#FEF3C7]">
              <Sparkles className="h-3 w-3 text-[#F5B700]" />
              5-Agent Pipeline
            </span>
            <p className="mt-2 text-xs font-bold leading-snug">
              {isId ? "Mulai Sprint Baru" : "Start a New Sprint"}
            </p>
            <button
              type="button"
              onClick={() => onSelectView("uploader")}
              className="mt-2.5 w-full rounded-xl bg-[#F5B700] hover:bg-[#EAB308] text-[#0A0A0A] font-bold py-1.5 text-xs transition cursor-pointer"
            >
              {isId ? "+ Buat Roadmap" : "+ Generate Plan"}
            </button>
          </div>
        </div>

        {/* 5. Logout (when signed in) or Disconnect Wallet */}
        {user ? (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-between rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#FEF3C7] transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4 text-[#D97706]" />
              <span>Logout</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : isWalletConnected ? (
          <button
            type="button"
            onClick={onDisconnectWallet}
            className="w-full flex items-center justify-between rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#FEF3C7] transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4 text-[#D97706]" />
              <span>Disconnect Wallet</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <p className="px-2 text-[10px] text-[#666660] leading-tight">
          Copyright © 2026 Syllaba · ITSPIRIT
        </p>
      </div>
    </aside>
  );
}

interface MobileBottomNavProps {
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
  onDisconnectWallet: () => void;
}

export function MobileBottomNav({
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
  onDisconnectWallet,
}: MobileBottomNavProps) {
  const { lang, setLang } = useLanguage();
  const isId = lang === "id";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isSettingsActive =
    activeView === "settings-account" || activeView === "settings-language";

  const handleSelect = (view: SidebarView) => {
    onSelectView(view);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Slide-up Glassy Drawer for Mobile Account, Courses, Language, Help, Login/Logout */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-white/60 bg-white/95 backdrop-blur-2xl p-5 pb-24 space-y-4 max-h-[82vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-[#FACC15] font-extrabold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#111111] truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-[#666660] truncate">
                    {user?.email
                      ? `@${user.email.split("@")[0]}`
                      : isWalletConnected && walletAddress
                      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                      : isId
                      ? "Mode Tamu"
                      : "Guest Session"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 bg-[#F7F7F5] text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {storedRoadmaps.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#666660]">
                  {isId ? "Kursus Tersimpan" : "Saved Courses"} ({storedRoadmaps.length})
                </p>
                <div className="space-y-1">
                  {storedRoadmaps.slice(0, 4).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onSelectRoadmap(r.id);
                        setDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                        activeRoadmapId === r.id
                          ? "bg-[#111111] text-[#FACC15]"
                          : "bg-[#F7F7F5] text-[#111111]"
                      }`}
                    >
                      <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{r.courseTitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#E5E5E0]">
              {!user && !isWalletConnected && (
                <Link
                  href="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full flex items-center justify-between rounded-xl bg-[#FACC15] px-4 py-2.5 text-xs font-bold text-[#111111]"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}

              <button
                type="button"
                onClick={() => handleSelect("settings-account")}
                className="w-full flex items-center justify-between rounded-xl bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#111111]"
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Setting &gt; Account</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#666660]" />
              </button>

              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "id" : "en")}
                className="w-full flex items-center justify-between rounded-xl bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#111111]"
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Setting &gt; Language</span>
                </span>
                <span className="rounded-md bg-[#111111] text-[#FACC15] px-2 py-0.5 text-[10px] font-mono uppercase">
                  {lang}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect("help")}
                className="w-full flex items-center justify-between rounded-xl bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#111111]"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help / Contact Us</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#666660]" />
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold text-[#111111]"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-[#D97706]" />
                    <span>Logout</span>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : isWalletConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    onDisconnectWallet();
                    setDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-bold text-[#111111]"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-[#D97706]" />
                    <span>Disconnect Wallet</span>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Dock for Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-black/10 bg-white/95 backdrop-blur-xl px-2 py-1.5 shadow-[0_-8px_30px_-14px_rgba(0,0,0,0.2)]">
        <div className="mx-auto max-w-md grid grid-cols-5 items-center gap-1">
          <button
            type="button"
            onClick={() => handleSelect("dashboard")}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              activeView === "dashboard" ? "text-[#111111]" : "text-[#666660]"
            }`}
          >
            <LayoutDashboard
              className={`h-4 w-4 mb-0.5 ${
                activeView === "dashboard" ? "text-[#D97706]" : "text-[#666660]"
              }`}
            />
            <span>{isId ? "Dasbor" : "Home"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("history")}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              activeView === "history" ? "text-[#111111]" : "text-[#666660]"
            }`}
          >
            <History
              className={`h-4 w-4 mb-0.5 ${
                activeView === "history" ? "text-[#D97706]" : "text-[#666660]"
              }`}
            />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("uploader")}
            className="flex flex-col items-center justify-center -mt-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111111] text-[#FACC15] shadow-md border-2 border-[#FACC15]">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-extrabold text-[#111111] mt-0.5">
              {isId ? "Baru" : "New"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("settings-account")}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              isSettingsActive ? "text-[#111111]" : "text-[#666660]"
            }`}
          >
            <Settings
              className={`h-4 w-4 mb-0.5 ${
                isSettingsActive ? "text-[#D97706]" : "text-[#666660]"
              }`}
            />
            <span>Setting</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold transition ${
              drawerOpen || activeView === "help" ? "text-[#111111]" : "text-[#666660]"
            }`}
          >
            <Menu
              className={`h-4 w-4 mb-0.5 ${
                drawerOpen || activeView === "help" ? "text-[#D97706]" : "text-[#666660]"
              }`}
            />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
