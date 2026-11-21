"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Roadmap } from "@/shared/types/roadmap";
import { SyllabusUploader } from "@/client/components/uploader/SyllabusUploader";
import { RoadmapTimeline } from "@/client/components/roadmap/RoadmapTimeline";
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
  Flame,
  Coffee,
  Layers,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected, openConnectModal } = useWeb3();
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
        remaining: 0,
        trackedHours: "0h",
        efficiency: 0,
        deepTasks: 0,
        restDays: 0,
        curatedCount: 0,
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
    const remaining = Math.max(0, total - finished);
    const efficiency = total > 0 ? Math.round((finished / total) * 100) : 0;

    let deepTasks = 0;
    let restDays = 0;
    schedules.forEach((day) => {
      if (day?.isRestDay) restDays++;
      (Array.isArray(day?.tasks) ? day.tasks : []).forEach((t) => {
        if (t.cognitiveLoad === "deep") deepTasks++;
      });
    });

    return {
      finished,
      total,
      remaining,
      trackedHours,
      efficiency,
      deepTasks,
      restDays,
      curatedCount: activeRoadmap.curatedResources?.length ?? 0,
    };
  }, [activeRoadmap]);

  if (!isClient) {
    return (
      <div className="flex h-[65vh] items-center justify-center bg-[#F7F7F5]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
      </div>
    );
  }

  const todayFormatted = new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const riskLevel = activeRoadmap?.burnoutMetrics?.riskLevel ?? "low";

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
        ? `Memantau "${activeRoadmap.courseTitle}" — jaga ritme belajar anti-burnout.`
        : `Tracking "${activeRoadmap.courseTitle}" — stay steady, avoid burnout.`;
    }
    return isId
      ? "Unggah silabus atau ringkasan tugas untuk menyusun roadmap anti-burnout."
      : "Upload your syllabus or brief to generate an anti-burnout study roadmap.";
  })();

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] py-5 px-3 sm:px-6 lg:px-8 ${
        user ? "bg-glass-canvas" : "bg-[#F7F7F5]"
      }`}
    >
      <div
        className={`mx-auto max-w-[1380px] rounded-[28px] border overflow-hidden ${
          user
            ? "border-white/70 bg-white/80 backdrop-blur-2xl shadow-[0_24px_70px_-24px_rgba(13,25,19,0.18)]"
            : "border-[#E5E5E0] bg-white shadow-[0_20px_60px_-28px_rgba(13,25,19,0.12)]"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-7.5rem)]">
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
          />

          {/* Main Workspace Area */}
          <section className="lg:col-span-9 xl:col-span-10 p-5 sm:p-7 lg:p-8 bg-white/95">
            {/* Top Greeting & Date Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E0]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                  {isId ? `Halo, ${displayName}` : `Hello, ${displayName}`}
                </h1>
                <p className="mt-1 text-sm text-[#666660]">{greetingSubtitle}</p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <div className="inline-flex items-center gap-2 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] px-3.5 py-2 text-xs font-semibold text-[#111111]">
                  <Calendar className="h-3.5 w-3.5 text-[#111111]" />
                  <span>{todayFormatted}</span>
                </div>
                {sidebarView !== "uploader" && (
                  <button
                    type="button"
                    onClick={() => setSidebarView("uploader")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] text-[#FACC15] px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isId ? "Tambah Silabus" : "Add Course"}</span>
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
                {/* 3 KPI Bento Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-emerald-kpi p-5 text-white shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#FEF3C7]">
                        {isId ? "Tugas Selesai" : "Finished Tasks"}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 border border-white/20">
                        <CheckCircle2 className="h-4 w-4 text-[#FEF3C7]" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight">
                      {metrics.finished}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#FEF3C7]">
                      <span className="rounded-md bg-white/15 px-2 py-0.5 font-semibold">
                        {isId ? `dari ${metrics.total}` : `of ${metrics.total}`}
                      </span>
                      <span>
                        {isId ? "micro-task selesai" : "micro-tasks completed"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#666660]">
                        {isId ? "Total Beban Belajar" : "Tracked Load"}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F5] border border-[#E5E5E0] text-[#111111]">
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#111111]">
                      {metrics.trackedHours}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#666660]">
                      <span className="rounded-md bg-[#F4E0E6] text-[#9B1C44] px-2 py-0.5 font-semibold">
                        {activeRoadmap.totalDays} {isId ? "hari" : "days"}
                      </span>
                      <span>
                        {isId ? "durasi anti-burnout" : "anti-burnout span"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#666660]">
                        {isId ? "Efisiensi" : "Efficiency"}
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
                            ? "bg-[#F6EDCA] text-[#8B6B15]"
                            : "bg-[#F4E0E6] text-[#9B1C44]"
                        }`}
                      >
                        {riskLevel} risk
                      </span>
                      <span>
                        {isId ? "indeks kelelahan" : "burnout index"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Pastel Progress Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-[#FEF3C7] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#111111]">
                        {isId ? "Selesai" : "Completed"}
                      </p>
                      <p className="text-xl font-extrabold text-[#111111] mt-0.5">
                        {metrics.finished}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-[#111111]" />
                  </div>

                  <div className="rounded-2xl bg-[#DCEBF7] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#235789]">
                        {isId ? "Tersisa" : "In Progress"}
                      </p>
                      <p className="text-xl font-extrabold text-[#111111] mt-0.5">
                        {metrics.remaining}
                      </p>
                    </div>
                    <Layers className="h-5 w-5 text-[#235789]" />
                  </div>

                  <div className="rounded-2xl bg-[#E9E9FD] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#4A4DC7]">
                        Deep Focus
                      </p>
                      <p className="text-xl font-extrabold text-[#111111] mt-0.5">
                        {metrics.deepTasks}
                      </p>
                    </div>
                    <Flame className="h-5 w-5 text-[#4A4DC7]" />
                  </div>

                  <div className="rounded-2xl bg-[#F6EDCA] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#8B6B15]">
                        {isId ? "Hari Istirahat" : "Rest Days"}
                      </p>
                      <p className="text-xl font-extrabold text-[#111111] mt-0.5">
                        {metrics.restDays}
                      </p>
                    </div>
                    <Coffee className="h-5 w-5 text-[#8B6B15]" />
                  </div>
                </div>

                {/* Interactive Roadmap Timeline + Central Wallet Sync */}
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
              <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-5 space-y-4">
                  <div className="rounded-2xl bg-emerald-bento p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[#F5B700]/20 blur-2xl pointer-events-none" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-[#FEF3C7]">
                      <Sparkles className="h-3.5 w-3.5 text-[#F5B700]" />
                      Multi-Agent Academic Pacing
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight">
                      {isId
                        ? "Ubah Silabus Padat Menjadi Sprint 15-Menit Terverifikasi"
                        : "Turn Dense Syllabi Into Verified 15-Minute Daily Sprints"}
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#E5E5E0] leading-relaxed">
                      {isId
                        ? "Dirancang agar mahasiswa menjaga konsistensi belajar tanpa begadang maupun burnout."
                        : "Designed for students who want steady academic momentum without late-night cramming or burnout."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-[#E5E5E0] bg-[#FFFDF8] p-4 flex items-start gap-3">
                      <div className="rounded-xl bg-[#FEF3C7] p-2.5 text-[#111111]">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#111111]">
                          {isId
                            ? "Dekomposisi Silabus Cerdas"
                            : "Smart Syllabus Decomposition"}
                        </h3>
                        <p className="text-[11px] text-[#666660] mt-0.5 leading-relaxed">
                          {isId
                            ? "Memecah PDF, DOCX, PPTX, dan catatan menjadi micro-task harian 15-30 menit."
                            : "Breaks complex PDFs and briefs into daily micro-tasks with clear time estimates."}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E5E5E0] bg-[#FFFDF8] p-4 flex items-start gap-3">
                      <div className="rounded-xl bg-[#E9E9FD] p-2.5 text-[#4A4DC7]">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#111111]">
                          {isId
                            ? "Penjaga Anti-Burnout"
                            : "Anti-Burnout Guardrails"}
                        </h3>
                        <p className="text-[11px] text-[#666660] mt-0.5 leading-relaxed">
                          {isId
                            ? "Menyeimbangkan sesi fokus mendalam, hari istirahat, dan penjadwalan ulang otomatis."
                            : "Balances deep focus tasks, scheduled rest days, and guilt-free rescheduling."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-7">
                  <SyllabusUploader onRoadmapGenerated={handleRoadmapGenerated} />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
