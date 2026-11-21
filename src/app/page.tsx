"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Roadmap } from "@/shared/types/roadmap";
import { SyllabusUploader } from "@/client/components/uploader/SyllabusUploader";
import { RoadmapTimeline } from "@/client/components/roadmap/RoadmapTimeline";
import { ScrollReveal } from "@/client/components/common/ScrollReveal";
import {
  getActiveRoadmap,
  getActiveRoadmapId,
  saveRoadmap,
  getStoredRoadmaps,
  setActiveRoadmapId,
  hydrateRoadmapsFromSupabase,
  resolveOwnerScope,
  renameRoadmapInStorage,
  deleteRoadmapFromStorage,
} from "@/client/utils/storage";
import {
  fetchCentralRoadmapsByWallet,
  syncRoadmapToCentral,
} from "@/client/utils/centralRoadmapSync";
import {
  resolveOwnerUserId,
  upsertEmailUserToPublicUsers,
  upsertWalletUserToPublicUsers,
} from "@/client/utils/usersSync";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/client/i18n/translations";
import {
  GlassySidebar,
  MobileBottomNav,
  SidebarView,
} from "@/client/components/layout/GlassySidebar";
import {
  HelpContactPanel,
  HistoryPanel,
  SettingsPanel,
} from "@/client/components/dashboard/WorkspacePanels";
import { TierCertificateExchangePanel } from "@/client/components/roadmap/TierCertificateExchangePanel";
import {
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  UploadCloud,
  ListChecks,
  BookOpen,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected, openConnectModal, disconnectWallet } = useWeb3();
  const { user, signOut } = useAuth();
  const { lang, copy } = useLanguage();

  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [storedRoadmaps, setStoredRoadmaps] = useState<Roadmap[]>([]);
  const [sidebarView, setSidebarView] = useState<SidebarView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isClient, setIsClient] = useState(false);

  const currentScope = useMemo(
    () => resolveOwnerScope(isConnected ? address : null, user?.id ?? null),
    [isConnected, address, user?.id]
  );

  const currentUserId = useMemo(
    () => resolveOwnerUserId(isConnected ? address : null, user?.id ?? null),
    [isConnected, address, user?.id]
  );

  const hydrateScopeRoadmaps = useCallback(
    async (scope: string, walletAddr?: string | null) => {
      const localInitial = getStoredRoadmaps(scope);
      const activeInitial = getActiveRoadmap(scope);

      setStoredRoadmaps(localInitial);
      setActiveRoadmap(activeInitial);
      setSidebarView(activeInitial ? "dashboard" : "uploader");

      if (walletAddr && isConnected) {
        const merged = (await fetchCentralRoadmapsByWallet(walletAddr)).filter(
          (r) => r && Array.isArray(r.dailySchedules)
        );
        setStoredRoadmaps(merged);
        if (merged.length > 0) {
          const savedActiveId = getActiveRoadmapId(scope);
          const nextActive =
            merged.find((r) => r.id === savedActiveId) ?? merged[0];
          setActiveRoadmapId(nextActive.id, scope);
          setActiveRoadmap(nextActive);
          setSidebarView("dashboard");
        }
        return;
      }

      const synced = (await hydrateRoadmapsFromSupabase(scope)).filter(
        (r) => r && Array.isArray(r.dailySchedules)
      );
      setStoredRoadmaps(synced);
      if (synced.length > 0) {
        const savedActiveId = getActiveRoadmapId(scope);
        const nextActive =
          synced.find((r) => r.id === savedActiveId) ?? synced[0];
        setActiveRoadmapId(nextActive.id, scope);
        setActiveRoadmap(nextActive);
        setSidebarView("dashboard");
      }
    },
    [isConnected]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (user) {
      void upsertEmailUserToPublicUsers({
        authUserId: user.id,
        email: user.email,
        fullName:
          (user.user_metadata?.full_name as string | undefined) ?? null,
        walletAddress: isConnected ? address : null,
      });
    } else if (isConnected && address) {
      void upsertWalletUserToPublicUsers({
        walletAddress: address,
      });
    }
  }, [isClient, user, isConnected, address]);

  useEffect(() => {
    if (!isClient) return;
    setActiveRoadmap(null);
    setStoredRoadmaps([]);
    void hydrateScopeRoadmaps(currentScope, isConnected ? address : null);
  }, [isClient, currentScope, isConnected, address, hydrateScopeRoadmaps]);

  const handleRoadmapGenerated = (roadmap: Roadmap) => {
    saveRoadmap(roadmap, currentScope, currentUserId);
    if (isConnected && address) {
      void syncRoadmapToCentral(address, roadmap);
    }
    setActiveRoadmap(roadmap);
    setStoredRoadmaps(getStoredRoadmaps(currentScope));
    setSidebarView("dashboard");
  };

  const handleSelectStoredRoadmap = (roadmapId: string) => {
    setActiveRoadmapId(roadmapId, currentScope);
    const found = storedRoadmaps.find((r) => r.id === roadmapId);
    if (found) {
      setActiveRoadmap(found);
      setSidebarView("dashboard");
    }
  };

  const handleRenameRoadmap = async (roadmapId: string, newTitle: string) => {
    const updated = await renameRoadmapInStorage(
      roadmapId,
      newTitle,
      currentScope,
      currentUserId
    );
    if (!updated) return;
    setStoredRoadmaps(getStoredRoadmaps(currentScope));
    if (activeRoadmap?.id === roadmapId) {
      setActiveRoadmap(updated);
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    const remaining = await deleteRoadmapFromStorage(roadmapId, currentScope);
    setStoredRoadmaps(remaining);
    if (activeRoadmap?.id === roadmapId) {
      const next = remaining.length > 0 ? remaining[0] : null;
      setActiveRoadmap(next);
      if (!next) {
        setSidebarView("uploader");
      }
    }
  };

  const handleSelectSidebarView = (view: SidebarView) => {
    if (view === "dashboard" && !activeRoadmap) {
      setSidebarView("uploader");
      return;
    }
    setSidebarView(view);
  };

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  const displayName = useMemo(() => {
    const full = (user?.user_metadata?.full_name as string | undefined)?.trim();
    if (full) return full.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    if (isConnected && address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return "Scholar";
  }, [user, isConnected, address]);

  const metrics = useMemo(() => {
    if (!activeRoadmap) {
      return {
        finished: 0,
        total: 0,
        trackedHours: "0h",
        efficiency: 0,
        restDays: 0,
      };
    }

    const schedules = Array.isArray(activeRoadmap.dailySchedules)
      ? activeRoadmap.dailySchedules
      : [];
    const totalMinutes = schedules.reduce(
      (sum, d) => sum + (d?.totalEstimatedMinutes || 0),
      0
    );
    const hours = totalMinutes / 60;
    const trackedHours =
      hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;

    const finished = activeRoadmap.completedTasks || 0;
    const total = activeRoadmap.totalTasks || 0;
    const efficiency = total > 0 ? Math.round((finished / total) * 100) : 0;
    const restDays = schedules.filter((day) => day?.isRestDay).length;

    return {
      finished,
      total,
      trackedHours,
      efficiency,
      restDays,
    };
  }, [activeRoadmap]);

  if (!isClient) {
    return (
      <div className="flex h-[65vh] items-center justify-center bg-[#F7F7F5]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#111111] border-t-[#FACC15]" />
      </div>
    );
  }

  const activeIntlLocale =
    LANGUAGE_OPTIONS.find((item) => item.code === lang)?.intlLocale ?? "en-GB";

  const todayFormatted = new Intl.DateTimeFormat(activeIntlLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const riskLevel = activeRoadmap?.burnoutMetrics?.riskLevel ?? "low";
  const isGlassActive = Boolean(user || isConnected);

  const greetingSubtitle = (() => {
    if (sidebarView === "history") {
      return copy.historySub;
    }
    if (sidebarView === "tier-exchange") {
      return lang === "id"
        ? "Akumulasi poin lintas PPT untuk menukar Sertifikat Tier (Bronze 5+ → Emerald) & $SYL Coin."
        : "Accumulate points across PPT courses to exchange Tier Certificates (Bronze 5+ → Emerald) & $SYL Coins.";
    }
    if (sidebarView === "settings-account" || sidebarView === "settings-language") {
      return copy.settingsSub;
    }
    if (sidebarView === "help") {
      return copy.helpSub;
    }
    if (sidebarView === "dashboard" && activeRoadmap) {
      return activeRoadmap.courseTitle;
    }
    return copy.uploadSub;
  })();

  return (
    <div
      className={`w-full min-h-[calc(100vh-4rem)] pt-3 ${
        isGlassActive ? "bg-glass-canvas" : "bg-[#F7F7F5]"
      }`}
    >
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4.75rem)] w-full">
        <GlassySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          user={user}
          walletAddress={address}
          isWalletConnected={isConnected}
          displayName={displayName}
          activeView={sidebarView}
          onSelectView={handleSelectSidebarView}
          storedRoadmaps={storedRoadmaps}
          activeRoadmapId={activeRoadmap?.id}
          onSelectRoadmap={handleSelectStoredRoadmap}
          onRenameRoadmap={(id, title) => void handleRenameRoadmap(id, title)}
          onDeleteRoadmap={(id) => void handleDeleteRoadmap(id)}
          onSignOut={() => void handleSignOut()}
          onDisconnectWallet={disconnectWallet}
        />

        {/* Full-Width Main Workspace Area */}
        <section className="flex-1 min-w-0 overflow-x-clip px-3 py-4 pb-28 sm:px-8 sm:py-6 lg:px-10 lg:pb-10 bg-white/95">
          {/* Top Greeting & Date Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-[#E5E5E0]">
            <div className="flex items-start gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#111111] break-words">
                  {copy.hello}, {displayName}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-[#666660] break-words">{greetingSubtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#F7F7F5] px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-[#111111]">
                <Calendar className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
                <span>{todayFormatted}</span>
              </div>
              {sidebarView !== "uploader" && (
                <button
                  type="button"
                  onClick={() => setSidebarView("uploader")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] hover:bg-[#262626] text-[#FACC15] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.addCourse}</span>
                </button>
              )}
            </div>
          </div>

          {sidebarView === "history" && (
            <div className="mt-6">
              <HistoryPanel
                roadmaps={storedRoadmaps}
                activeRoadmapId={activeRoadmap?.id}
                onSelectRoadmap={handleSelectStoredRoadmap}
                onRenameRoadmap={(id, title) => void handleRenameRoadmap(id, title)}
                onDeleteRoadmap={(id) => void handleDeleteRoadmap(id)}
                onCreateNew={() => setSidebarView("uploader")}
              />
            </div>
          )}

          {sidebarView === "tier-exchange" && (
            <div className="mt-6">
              <TierCertificateExchangePanel
                roadmaps={storedRoadmaps}
                currentScope={currentScope}
              />
            </div>
          )}

          {(sidebarView === "settings-account" ||
            sidebarView === "settings-language") && (
            <div className="mt-6">
              <SettingsPanel
                activeSubTab={
                  sidebarView === "settings-language" ? "language" : "account"
                }
                onChangeSubTab={(tab) =>
                  setSidebarView(
                    tab === "language" ? "settings-language" : "settings-account"
                  )
                }
                user={user}
                walletAddress={address}
                isWalletConnected={isConnected}
                onOpenWalletModal={openConnectModal}
              />
            </div>
          )}

          {sidebarView === "help" && (
            <div className="mt-6">
              <HelpContactPanel />
            </div>
          )}

          {sidebarView === "dashboard" && activeRoadmap && (
            <div className="mt-6 space-y-6 animate-syllaba-enter">
              {/* 3 Focused KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ScrollReveal delayMs={0}>
                  <div className="syllaba-card-hover rounded-2xl bg-emerald-kpi p-5 text-white shadow-sm h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#FEF3C7]">
                        {copy.finishedTasks}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-[#FACC15]/30">
                        <CheckCircle2 className="h-4 w-4 text-[#FACC15]" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-white">
                      {metrics.finished}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#E5E5E0]">
                      <span className="rounded-md bg-[#FACC15] text-[#111111] px-2 py-0.5 font-bold">
                        / {metrics.total}
                      </span>
                      <span>{copy.stepsDone}</span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={90}>
                  <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#666660]">
                        {copy.totalStudyTime}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F5] border border-[#E5E5E0] text-[#111111]">
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#111111]">
                      {metrics.trackedHours}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#666660]">
                      <span className="rounded-md bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 font-semibold">
                        {activeRoadmap.totalDays} {copy.daysWord}
                      </span>
                      <span>
                        {metrics.restDays} {copy.daysWord}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={180}>
                  <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#666660]">
                        {copy.overallProgress}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F5] border border-[#E5E5E0] text-[#111111]">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#111111]">
                      {metrics.efficiency}%
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#666660]">
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold capitalize ${
                          riskLevel === "low"
                            ? "bg-[#FEF3C7] text-[#111111]"
                            : riskLevel === "moderate"
                            ? "bg-[#FDE68A] text-[#92400E]"
                            : "bg-[#FFE4E6] text-[#9F1239]"
                        }`}
                      >
                        {lang === "id"
                          ? `Risiko Burnout ${
                              riskLevel === "low"
                                ? "Rendah"
                                : riskLevel === "moderate"
                                ? "Sedang"
                                : "Tinggi"
                            }`
                          : `${riskLevel} burnout risk`}
                      </span>
                      <span>{copy.healthyPace}</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Interactive Roadmap Timeline with Scoped Sync */}
              <RoadmapTimeline
                roadmap={activeRoadmap}
                onUpdateRoadmap={(updated) => {
                  saveRoadmap(updated, currentScope, currentUserId);
                  setActiveRoadmap(updated);
                  setStoredRoadmaps(getStoredRoadmaps(currentScope));
                  if (isConnected && address) {
                    void syncRoadmapToCentral(address, updated);
                  }
                }}
                onNewRoadmap={() => setSidebarView("uploader")}
                onOpenTierExchange={() => setSidebarView("tier-exchange")}
              />
            </div>
          )}

          {(sidebarView === "uploader" ||
            (sidebarView === "dashboard" && !activeRoadmap)) && (
            <div className="mt-5 sm:mt-6 grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-7 items-start">
              {/* Simple 3-Step Guide for First-Time Users */}
              <div className="xl:col-span-5 min-w-0 space-y-4">
                <ScrollReveal delayMs={0}>
                  <div className="rounded-2xl bg-emerald-bento p-5 sm:p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[#FACC15]/20 blur-2xl pointer-events-none" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-[#FEF3C7]">
                      <Sparkles className="h-3.5 w-3.5 text-[#FACC15]" />
                      {copy.howWorks}
                    </span>
                    <h2 className="mt-3 text-xl sm:text-2xl font-extrabold leading-tight tracking-tight">
                      {copy.heroTitle}
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#E5E5E0] leading-relaxed">
                      {copy.heroDesc}
                    </p>
                  </div>
                </ScrollReveal>

                <div className="space-y-3">
                  <ScrollReveal delayMs={80}>
                    <div className="rounded-2xl bg-[#FEF3C7]/75 border border-[#FACC15]/40 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[#FACC15]">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-[#111111]">
                          {copy.step1Title}
                        </p>
                        <p className="text-[#52524C] mt-0.5">
                          {copy.step1Desc}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delayMs={160}>
                    <div className="rounded-2xl bg-[#F7F7F5] border border-[#E5E5E0] p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FACC15] text-[#111111]">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-[#111111]">
                          {copy.step2Title}
                        </p>
                        <p className="text-[#52524C] mt-0.5">
                          {copy.step2Desc}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delayMs={240}>
                    <div className="rounded-2xl bg-[#FFFDF5] border border-[#FDE68A] p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-white">
                        <BookOpen className="h-4 w-4 text-[#FACC15]" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-[#111111]">
                          {copy.step3Title}
                        </p>
                        <p className="text-[#52524C] mt-0.5">
                          {copy.step3Desc}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>

              {/* Right Syllabus Uploader */}
              <div className="xl:col-span-7 min-w-0">
                <ScrollReveal delayMs={100}>
                  <SyllabusUploader onRoadmapGenerated={handleRoadmapGenerated} />
                </ScrollReveal>
              </div>
            </div>
          )}
        </section>
      </div>

      <MobileBottomNav
        user={user}
        walletAddress={address}
        isWalletConnected={isConnected}
        displayName={displayName}
        activeView={sidebarView}
        onSelectView={handleSelectSidebarView}
        storedRoadmaps={storedRoadmaps}
        activeRoadmapId={activeRoadmap?.id}
        onSelectRoadmap={handleSelectStoredRoadmap}
        onRenameRoadmap={(id, title) => void handleRenameRoadmap(id, title)}
        onDeleteRoadmap={(id) => void handleDeleteRoadmap(id)}
        onSignOut={() => void handleSignOut()}
        onDisconnectWallet={disconnectWallet}
      />
    </div>
  );
}
