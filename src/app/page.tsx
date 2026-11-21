"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  UploadCloud,
  ListChecks,
  BookOpen,
  LogOut,
  LogIn,
  Wallet,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected, disconnectWallet } = useWeb3();
  const { user, signOut } = useAuth();
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [storedRoadmaps, setStoredRoadmaps] = useState<Roadmap[]>([]);
  const [showUploader, setShowUploader] = useState(false);
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
      setShowUploader(!activeInitial);

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
          setShowUploader(false);
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
        setShowUploader(false);
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
    setShowUploader(false);
  };

  const handleSelectStoredRoadmap = (roadmapId: string) => {
    setActiveRoadmapId(roadmapId, currentScope);
    const found = storedRoadmaps.find((r) => r.id === roadmapId);
    if (found) {
      setActiveRoadmap(found);
      setShowUploader(false);
    }
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
      <div className="flex h-[65vh] items-center justify-center bg-white">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#125B3A] border-t-transparent" />
      </div>
    );
  }

  const todayFormatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const isWorkspaceView = Boolean(activeRoadmap && !showUploader);
  const riskLevel = activeRoadmap?.burnoutMetrics?.riskLevel ?? "low";

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)] w-full">
        {/* Left Navigation Sidebar */}
        <aside className="lg:col-span-3 xl:col-span-2 border-b lg:border-b-0 lg:border-r border-[#E5ECE8] bg-[#FAFDFB] p-5 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7872] mb-2.5">
                Menu
              </p>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (activeRoadmap) setShowUploader(false);
                  }}
                  disabled={!activeRoadmap}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition relative cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    isWorkspaceView
                      ? "bg-[#DDF1E4]/75 text-[#125B3A]"
                      : "text-[#6B7872] hover:bg-[#F4F7F5] hover:text-[#111815]"
                  }`}
                >
                  {isWorkspaceView && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#125B3A]" />
                  )}
                  <span className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUploader(true)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition relative cursor-pointer ${
                    !isWorkspaceView
                      ? "bg-[#DDF1E4]/75 text-[#125B3A]"
                      : "text-[#6B7872] hover:bg-[#F4F7F5] hover:text-[#111815]"
                  }`}
                >
                  {!isWorkspaceView && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#125B3A]" />
                  )}
                  <span className="flex items-center gap-2.5">
                    <Plus className="h-4 w-4" />
                    New Syllabus
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#125B3A] text-white text-[10px]">
                    +
                  </span>
                </button>
              </nav>
            </div>

            {/* Saved Courses List */}
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7872]">
                  My Courses
                </p>
                <span className="rounded-full bg-[#E5ECE8] px-2 py-0.5 text-[10px] font-bold text-[#125B3A]">
                  {storedRoadmaps.length}
                </span>
              </div>

              {storedRoadmaps.length === 0 ? (
                <p className="px-3 text-xs text-[#6B7872] leading-relaxed">
                  No study plans yet. Upload a syllabus or pick a sample course to begin.
                </p>
              ) : (
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {storedRoadmaps.map((r) => {
                    const isSelected =
                      isWorkspaceView && activeRoadmap?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectStoredRoadmap(r.id)}
                        className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-[#125B3A] text-white shadow-xs"
                            : "text-[#4D5A54] hover:bg-[#F4F7F5] hover:text-[#111815]"
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
          </div>

          {/* Clean Auth Footer — Mutually Exclusive */}
          <div className="pt-4 border-t border-[#E5ECE8]">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#6B7872] hover:bg-[#F4E0E6]/60 hover:text-[#9B1C44] transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            ) : isConnected && address ? (
              <button
                type="button"
                onClick={disconnectWallet}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#6B7872] hover:bg-[#F4E0E6]/60 hover:text-[#9B1C44] transition cursor-pointer"
              >
                <Wallet className="h-4 w-4 text-[#125B3A]" />
                Disconnect Wallet
              </button>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#125B3A] hover:bg-[#DDF1E4]/70 transition"
              >
                <LogIn className="h-4 w-4" />
                Sign in / Register
              </Link>
            )}
          </div>
        </aside>

        {/* Full-Width Main Workspace Area */}
        <section className="lg:col-span-9 xl:col-span-10 px-5 py-6 sm:px-8 lg:px-10 bg-white">
          {/* Top Greeting & Date Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5ECE8]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111815]">
                Hello, {displayName}
              </h1>
              <p className="mt-1 text-sm text-[#6B7872]">
                {isWorkspaceView
                  ? `Your daily study plan for "${activeRoadmap?.courseTitle}".`
                  : "Upload your syllabus, Word doc, or slides to build a calm daily study schedule."}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-[#E5ECE8] bg-[#F4F7F5] px-3.5 py-2 text-xs font-semibold text-[#111815]">
              <Calendar className="h-3.5 w-3.5 text-[#125B3A]" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          {isWorkspaceView && activeRoadmap ? (
            <div className="mt-6 space-y-6">
              {/* 3 Focused KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ScrollReveal delayMs={0}>
                  <div className="rounded-2xl bg-emerald-kpi p-5 text-white shadow-sm h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#DDF1E4]">
                        Finished Tasks
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 border border-white/20">
                        <CheckCircle2 className="h-4 w-4 text-[#DDF1E4]" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight">
                      {metrics.finished}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#DDF1E4]">
                      <span className="rounded-md bg-white/15 px-2 py-0.5 font-semibold">
                        of {metrics.total}
                      </span>
                      <span>daily steps done</span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={90}>
                  <div className="rounded-2xl border border-[#E5ECE8] bg-white p-5 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7872]">
                        Total Study Time
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F7F5] border border-[#E5ECE8] text-[#111815]">
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#111815]">
                      {metrics.trackedHours}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7872]">
                      <span className="rounded-md bg-[#F6EDCA] text-[#8B6B15] px-2 py-0.5 font-semibold">
                        {activeRoadmap.totalDays} days
                      </span>
                      <span>
                        incl. {metrics.restDays} rest{" "}
                        {metrics.restDays === 1 ? "day" : "days"}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delayMs={180}>
                  <div className="rounded-2xl border border-[#E5ECE8] bg-white p-5 shadow-xs h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7872]">
                        Overall Progress
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F7F5] border border-[#E5ECE8] text-[#111815]">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#111815]">
                      {metrics.efficiency}%
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7872]">
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold capitalize ${
                          riskLevel === "low"
                            ? "bg-[#DDF1E4] text-[#125B3A]"
                            : riskLevel === "moderate"
                            ? "bg-[#F6EDCA] text-[#8B6B15]"
                            : "bg-[#F4E0E6] text-[#9B1C44]"
                        }`}
                      >
                        {riskLevel} burnout risk
                      </span>
                      <span>healthy pace</span>
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
                onNewRoadmap={() => setShowUploader(true)}
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
              {/* Simple 3-Step Guide for First-Time Users */}
              <div className="xl:col-span-5 space-y-4">
                <ScrollReveal delayMs={0}>
                  <div className="rounded-2xl bg-emerald-bento p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[#52B788]/20 blur-2xl pointer-events-none" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-[#DDF1E4]">
                      <Sparkles className="h-3.5 w-3.5 text-[#52B788]" />
                      How Syllaba Works
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight">
                      Turn Any Syllabus Into Bite-Sized Daily Study Steps
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#CBE3D6] leading-relaxed">
                      Stop stressing over thick course outlines. Drop your file
                      on the right and get an easy-to-follow daily schedule in
                      seconds.
                    </p>
                  </div>
                </ScrollReveal>

                <div className="space-y-3">
                  <ScrollReveal delayMs={80}>
                    <div className="rounded-2xl bg-[#DDF1E4]/75 border border-[#52B788]/25 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#125B3A] text-white">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111815]">
                          1. Upload File or Pick a Sample
                        </p>
                        <p className="text-[#4D5A54] mt-0.5">
                          Supports PDF, Word (.docx), PowerPoint (.pptx), or plain text.
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delayMs={160}>
                    <div className="rounded-2xl bg-[#E9E9FD]/80 border border-[#8D90F2]/30 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5B5ED6] text-white">
                        <ListChecks className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111815]">
                          2. Follow 15–30 Minute Daily Steps
                        </p>
                        <p className="text-[#4D5A54] mt-0.5">
                          Tasks are paced automatically with built-in rest days to prevent burnout.
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delayMs={240}>
                    <div className="rounded-2xl bg-[#F6EDCA]/85 border border-[#8B6B15]/20 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111815] text-white">
                        <BookOpen className="h-4 w-4 text-[#52B788]" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111815]">
                          3. Study With Matched Reading Links
                        </p>
                        <p className="text-[#4D5A54] mt-0.5">
                          Get free reference articles per topic and optionally save your progress proof.
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
