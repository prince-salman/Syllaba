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
} from "@/client/utils/storage";
import {
  fetchCentralRoadmapsByWallet,
  syncRoadmapToCentral,
} from "@/client/utils/centralRoadmapSync";
import { useWeb3 } from "@/components/Web3Providers";
import { useAuth } from "@/client/components/auth/AuthProvider";
import { useLanguage } from "@/client/context/LanguageContext";
import {
  GlassySidebar,
  SidebarView,
} from "@/client/components/layout/GlassySidebar";
import {
  HelpContactPanel,
  HistoryPanel,
  SettingsPanel,
} from "@/client/components/dashboard/WorkspacePanels";
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
  const { lang } = useLanguage();
  const isId = lang === "id";

  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [storedRoadmaps, setStoredRoadmaps] = useState<Roadmap[]>([]);
  const [sidebarView, setSidebarView] = useState<SidebarView>("dashboard");
  const [isClient, setIsClient] = useState(false);

  const currentScope = useMemo(
    () => resolveOwnerScope(isConnected ? address : null, user?.id ?? null),
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
    setActiveRoadmap(null);
    setStoredRoadmaps([]);
    void hydrateScopeRoadmaps(currentScope, isConnected ? address : null);
  }, [isClient, currentScope, isConnected, address, hydrateScopeRoadmaps]);

  const handleRoadmapGenerated = (roadmap: Roadmap) => {
    saveRoadmap(roadmap, currentScope);
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

  const todayFormatted = new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const riskLevel = activeRoadmap?.burnoutMetrics?.riskLevel ?? "low";
  const isGlassActive = Boolean(user || isConnected);

  const greetingSubtitle = (() => {
    if (sidebarView === "history") {
      return isId
        ? "Kelola dan buka kembali seluruh roadmap kursus Anda."
        : "Browse and reopen all of your generated study roadmaps.";
    }
    if (sidebarView === "settings-account" || sidebarView === "settings-language") {
      return isId
        ? "Atur informasi akun, koneksi dompet, dan bahasa antarmuka."
        : "Configure account profile, Web3 wallet connection, and language.";
    }
    if (sidebarView === "help") {
      return isId
        ? "Pusat bantuan cepat dan kontak resmi tim ITSPIRIT."
        : "Quick answers and direct contact with Team ITSPIRIT.";
    }
    if (sidebarView === "dashboard" && activeRoadmap) {
      return isId
        ? `Jadwal harian Anda untuk "${activeRoadmap.courseTitle}".`
        : `Your daily study plan for "${activeRoadmap.courseTitle}".`;
    }
    return isId
      ? "Unggah silabus PDF, Word, atau slide untuk menyusun jadwal belajar harian."
      : "Upload your syllabus, Word doc, or slides to build a calm daily study schedule.";
  })();

  return (
    <div
      className={`w-full min-h-[calc(100vh-4rem)] pt-3 ${
        isGlassActive ? "bg-glass-canvas" : "bg-[#F7F7F5]"
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4.75rem)] w-full">
        <GlassySidebar
          user={user}
          walletAddress={address}
          isWalletConnected={isConnected}
          displayName={displayName}
          activeView={sidebarView}
          onSelectView={handleSelectSidebarView}
          storedRoadmaps={storedRoadmaps}
          activeRoadmapId={activeRoadmap?.id}
          onSelectRoadmap={handleSelectStoredRoadmap}
          onSignOut={() => void handleSignOut()}
          onDisconnectWallet={disconnectWallet}
        />

        {/* Full-Width Main Workspace Area */}
        <section className="lg:col-span-9 xl:col-span-10 px-5 py-6 sm:px-8 lg:px-10 bg-white/95">
          {/* Top Greeting & Date Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E0]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                {isId ? `Halo, ${displayName}` : `Hello, ${displayName}`}
              </h1>
              <p className="mt-1 text-sm text-[#666660]">{greetingSubtitle}</p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F5] px-3.5 py-2 text-xs font-semibold text-[#111111]">
                <Calendar className="h-3.5 w-3.5 text-[#D97706]" />
                <span>{todayFormatted}</span>
              </div>
              {sidebarView !== "uploader" && (
                <button
                  type="button"
                  onClick={() => setSidebarView("uploader")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] hover:bg-[#262626] text-[#FACC15] px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isId ? "Tambah Kursus" : "Add Course"}</span>
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
                onCreateNew={() => setSidebarView("uploader")}
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
            <div className="mt-6 space-y-6">
              {/* 3 Focused KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ScrollReveal delayMs={0}>
                  <div className="rounded-2xl bg-emerald-kpi p-5 text-white shadow-sm h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#FEF3C7]">
                        {isId ? "Tugas Selesai" : "Finished Tasks"}
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
                        {isId ? `dari ${metrics.total}` : `of ${metrics.total}`}
                      </span>
                      <span>{isId ? "sesi selesai" : "daily steps done"}</span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={90}>
                  <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#666660]">
                        {isId ? "Total Waktu Belajar" : "Total Study Time"}
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
                        {activeRoadmap.totalDays} {isId ? "hari" : "days"}
                      </span>
                      <span>
                        {isId
                          ? `termasuk ${metrics.restDays} hari istirahat`
                          : `incl. ${metrics.restDays} rest ${
                              metrics.restDays === 1 ? "day" : "days"
                            }`}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={180}>
                  <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#666660]">
                        {isId ? "Progres Keseluruhan" : "Overall Progress"}
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
                        {riskLevel} burnout risk
                      </span>
                      <span>{isId ? "ritme sehat" : "healthy pace"}</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Interactive Roadmap Timeline with Scoped Sync */}
              <RoadmapTimeline
                roadmap={activeRoadmap}
                onUpdateRoadmap={(updated) => {
                  saveRoadmap(updated, currentScope);
                  setActiveRoadmap(updated);
                  setStoredRoadmaps(getStoredRoadmaps(currentScope));
                  if (isConnected && address) {
                    void syncRoadmapToCentral(address, updated);
                  }
                }}
                onNewRoadmap={() => setSidebarView("uploader")}
              />
            </div>
          )}

          {(sidebarView === "uploader" ||
            (sidebarView === "dashboard" && !activeRoadmap)) && (
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
              {/* Simple 3-Step Guide for First-Time Users */}
              <div className="xl:col-span-5 space-y-4">
                <ScrollReveal delayMs={0}>
                  <div className="rounded-2xl bg-emerald-bento p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[#FACC15]/20 blur-2xl pointer-events-none" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-[#FEF3C7]">
                      <Sparkles className="h-3.5 w-3.5 text-[#FACC15]" />
                      {isId ? "Cara Kerja Syllaba" : "How Syllaba Works"}
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight">
                      {isId
                        ? "Ubah Silabus Apa Pun Menjadi Langkah Belajar Harian Ringkas"
                        : "Turn Any Syllabus Into Bite-Sized Daily Study Steps"}
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#E5E5E0] leading-relaxed">
                      {isId
                        ? "Berhenti stres melihat silabus tebal. Unggah file Anda dan dapatkan jadwal harian terukur dalam hitungan detik."
                        : "Stop stressing over thick course outlines. Drop your file on the right and get an easy-to-follow daily schedule in seconds."}
                    </p>
                  </div>
                </ScrollReveal>

                <div className="space-y-3">
                  <ScrollReveal delayMs={80}>
                    <div className="rounded-2xl bg-[#FEF3C7]/75 border border-[#FACC15]/40 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[#FACC15]">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111111]">
                          {isId
                            ? "1. Unggah File atau Pilih Contoh"
                            : "1. Upload File or Pick a Sample"}
                        </p>
                        <p className="text-[#52524C] mt-0.5">
                          {isId
                            ? "Mendukung PDF, Word (.docx), PowerPoint (.pptx), atau teks."
                            : "Supports PDF, Word (.docx), PowerPoint (.pptx), or plain text."}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delayMs={160}>
                    <div className="rounded-2xl bg-[#F7F7F5] border border-[#E5E5E0] p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FACC15] text-[#111111]">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111111]">
                          {isId
                            ? "2. Ikuti Langkah Harian 15-30 Menit"
                            : "2. Follow 15-30 Minute Daily Steps"}
                        </p>
                        <p className="text-[#52524C] mt-0.5">
                          {isId
                            ? "Tugas dibagi otomatis lengkap dengan hari istirahat anti-burnout."
                            : "Tasks are paced automatically with built-in rest days to prevent burnout."}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delayMs={240}>
                    <div className="rounded-2xl bg-[#FFFDF5] border border-[#FDE68A] p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-white">
                        <BookOpen className="h-4 w-4 text-[#FACC15]" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111111]">
                          {isId
                            ? "3. Belajar dengan Referensi Open-Access"
                            : "3. Study With Matched Reading Links"}
                        </p>
                        <p className="text-[#52524C] mt-0.5">
                          {isId
                            ? "Dapatkan artikel referensi gratis per topik serta bukti progres on-chain."
                            : "Get free reference articles per topic and optionally save your progress proof."}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>

              {/* Right Syllabus Uploader */}
              <div className="xl:col-span-7">
                <ScrollReveal delayMs={100}>
                  <SyllabusUploader onRoadmapGenerated={handleRoadmapGenerated} />
                </ScrollReveal>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
