"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Roadmap } from "@/shared/types/roadmap";
import { SyllabusUploader } from "@/client/components/uploader/SyllabusUploader";
import { RoadmapTimeline } from "@/client/components/roadmap/RoadmapTimeline";
import {
  getActiveRoadmap,
  saveRoadmap,
  getStoredRoadmaps,
  setActiveRoadmapId,
  hydrateRoadmapsFromSupabase,
} from "@/client/utils/storage";
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
  BookOpen,
  ShieldCheck,
  Cpu,
  LogOut,
  LogIn,
  Flame,
  Coffee,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [storedRoadmaps, setStoredRoadmaps] = useState<Roadmap[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const initial = getActiveRoadmap();
    const all = getStoredRoadmaps();
    setActiveRoadmap(initial);
    setStoredRoadmaps(all);
    if (!initial) {
      setShowUploader(true);
    }

    hydrateRoadmapsFromSupabase()
      .then((synced) => {
        if (synced.length > 0) {
          setStoredRoadmaps(synced);
          setActiveRoadmap((prev) => prev ?? synced[0]);
        }
      })
      .catch(() => {
        // Non-blocking fallback to localStorage
      });
  }, []);

  const handleRoadmapGenerated = (roadmap: Roadmap) => {
    saveRoadmap(roadmap);
    setActiveRoadmap(roadmap);
    setStoredRoadmaps(getStoredRoadmaps());
    setShowUploader(false);
  };

  const handleSelectStoredRoadmap = (roadmapId: string) => {
    setActiveRoadmapId(roadmapId);
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
    return "Scholar";
  }, [user]);

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

    const schedules = Array.isArray(activeRoadmap.dailySchedules) ? activeRoadmap.dailySchedules : [];
    const totalMinutes = schedules.reduce(
      (sum, d) => sum + (d.totalEstimatedMinutes || 0),
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
      <div className="flex h-[65vh] items-center justify-center bg-[#F4F7F5]">
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F4F7F5] py-5 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1380px] rounded-[28px] border border-[#E5ECE8] bg-white shadow-[0_20px_60px_-28px_rgba(13,25,19,0.12)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-7.5rem)]">
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
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition relative ${
                      isWorkspaceView
                        ? "bg-[#DDF1E4]/70 text-[#125B3A]"
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
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition relative ${
                      !isWorkspaceView
                        ? "bg-[#DDF1E4]/70 text-[#125B3A]"
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
                    Courses
                  </p>
                  <span className="rounded-full bg-[#E5ECE8] px-2 py-0.5 text-[10px] font-bold text-[#125B3A]">
                    {storedRoadmaps.length}
                  </span>
                </div>

                {storedRoadmaps.length === 0 ? (
                  <p className="px-3 text-xs text-[#6B7872] leading-relaxed">
                    No roadmaps yet. Upload your first syllabus to generate tasks.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {storedRoadmaps.map((r) => {
                      const isSelected =
                        isWorkspaceView && activeRoadmap?.id === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectStoredRoadmap(r.id)}
                          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
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

            {/* Bottom Dark Bento Card + Auth Action */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-bento p-4 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#52B788]/25 blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#DDF1E4]">
                    <Sparkles className="h-3 w-3 text-[#52B788]" />
                    5-Agent Pipeline
                  </span>
                  <p className="mt-2.5 text-sm font-bold leading-snug">
                    Start a New Sprint
                  </p>
                  <p className="mt-1 text-[11px] text-[#CBE3D6] leading-relaxed">
                    Slice heavy syllabi into calm 15–30m micro-tasks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowUploader(true)}
                    className="mt-3 w-full rounded-xl bg-[#52B788] hover:bg-[#3FA474] text-[#0D1913] font-bold py-2 text-xs transition"
                  >
                    + Generate Plan
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5ECE8]">
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#6B7872] hover:bg-[#F4E0E6]/60 hover:text-[#9B1C44] transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
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
            </div>
          </aside>

          {/* Main Workspace Area */}
          <section className="lg:col-span-9 xl:col-span-10 p-5 sm:p-7 lg:p-8 bg-white">
            {/* Top Greeting & Date Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5ECE8]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111815]">
                  Hello, {displayName}
                </h1>
                <p className="mt-1 text-sm text-[#6B7872]">
                  {isWorkspaceView
                    ? `Tracking "${activeRoadmap?.courseTitle}" — stay steady, avoid burnout.`
                    : "Upload your syllabus or brief to generate an anti-burnout study roadmap."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <div className="inline-flex items-center gap-2 rounded-xl border border-[#E5ECE8] bg-[#F4F7F5] px-3.5 py-2 text-xs font-semibold text-[#111815]">
                  <Calendar className="h-3.5 w-3.5 text-[#125B3A]" />
                  <span>{todayFormatted}</span>
                </div>
                {isWorkspaceView && (
                  <button
                    type="button"
                    onClick={() => setShowUploader(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#52B788] hover:bg-[#1F7A4F] text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Course
                  </button>
                )}
              </div>
            </div>

            {isWorkspaceView && activeRoadmap ? (
              <div className="mt-6 space-y-6">
                {/* 3 Reference-Aligned KPI Bento Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Forest Emerald Gradient KPI */}
                  <div className="rounded-2xl bg-emerald-kpi p-5 text-white shadow-sm relative overflow-hidden">
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
                      <span>micro-tasks completed</span>
                    </div>
                  </div>

                  {/* Card 2: Tracked Study Load */}
                  <div className="rounded-2xl border border-[#E5ECE8] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7872]">
                        Tracked Load
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F7F5] border border-[#E5ECE8] text-[#111815]">
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#111815]">
                      {metrics.trackedHours}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7872]">
                      <span className="rounded-md bg-[#F4E0E6] text-[#9B1C44] px-2 py-0.5 font-semibold">
                        {activeRoadmap.totalDays} days
                      </span>
                      <span>anti-burnout span</span>
                    </div>
                  </div>

                  {/* Card 3: Completion Efficiency */}
                  <div className="rounded-2xl border border-[#E5ECE8] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#6B7872]">
                        Efficiency
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
                          (activeRoadmap.burnoutMetrics?.riskLevel ?? "low") === "low"
                            ? "bg-[#DDF1E4] text-[#125B3A]"
                            : (activeRoadmap.burnoutMetrics?.riskLevel ?? "low") === "moderate"
                            ? "bg-[#F6EDCA] text-[#8B6B15]"
                            : "bg-[#F4E0E6] text-[#9B1C44]"
                        }`}
                      >
                        {(activeRoadmap.burnoutMetrics?.riskLevel ?? "low")} risk
                      </span>
                      <span>burnout index</span>
                    </div>
                  </div>
                </div>

                {/* 4 Mobile-Reference Pastel Progress Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-[#DDF1E4] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#125B3A]">
                        Completed
                      </p>
                      <p className="text-xl font-extrabold text-[#111815] mt-0.5">
                        {metrics.finished}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-[#125B3A]" />
                  </div>

                  <div className="rounded-2xl bg-[#DCEBF7] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#235789]">
                        In Progress
                      </p>
                      <p className="text-xl font-extrabold text-[#111815] mt-0.5">
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
                      <p className="text-xl font-extrabold text-[#111815] mt-0.5">
                        {metrics.deepTasks}
                      </p>
                    </div>
                    <Flame className="h-5 w-5 text-[#4A4DC7]" />
                  </div>

                  <div className="rounded-2xl bg-[#F6EDCA] px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#8B6B15]">
                        Rest Days
                      </p>
                      <p className="text-xl font-extrabold text-[#111815] mt-0.5">
                        {metrics.restDays}
                      </p>
                    </div>
                    <Coffee className="h-5 w-5 text-[#8B6B15]" />
                  </div>
                </div>

                {/* Existing Interactive Roadmap Timeline, Curated Resources & On-Chain Proof Vault */}
                <RoadmapTimeline
                  roadmap={activeRoadmap}
                  onUpdateRoadmap={(updated) => {
                    setActiveRoadmap(updated);
                    setStoredRoadmaps(getStoredRoadmaps());
                  }}
                  onNewRoadmap={() => setShowUploader(true)}
                />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Pitch & Pastel Agent Overview */}
                <div className="xl:col-span-5 space-y-4">
                  <div className="rounded-2xl bg-emerald-bento p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-[#52B788]/20 blur-2xl pointer-events-none" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-[#DDF1E4]">
                      <Sparkles className="h-3.5 w-3.5 text-[#52B788]" />
                      Multi-Agent Academic Pacing
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight">
                      Turn Dense Syllabi Into Verified 15-Minute Daily Sprints
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#CBE3D6] leading-relaxed">
                      Extract deadlines automatically, slice heavy modules into
                      anti-burnout micro-tasks, pair open-access papers, and
                      anchor your study commitment on-chain.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="rounded-2xl bg-[#DDF1E4]/75 border border-[#52B788]/25 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#125B3A] text-white">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111815]">
                          Agent 1, 2 &amp; 4: Slicer + Pacing Validator
                        </p>
                        <p className="text-[#4D5A54] mt-0.5">
                          Caps daily cognitive load at 150 mins with 15–30m micro-tasks.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#E9E9FD]/80 border border-[#8D90F2]/30 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5B5ED6] text-white">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111815]">
                          Agent 3: OpenAlex &amp; Wikipedia Curator
                        </p>
                        <p className="text-[#4D5A54] mt-0.5">
                          Pairs verified open-access literature directly to each module.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F6EDCA]/85 border border-[#8B6B15]/20 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111815] text-white">
                        <ShieldCheck className="h-4 w-4 text-[#52B788]" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-[#111815]">
                          On-Chain Study Proof Vault
                        </p>
                        <p className="text-[#4D5A54] mt-0.5">
                          Deterministic keccak256 commitment + IPFS snapshot on Base Sepolia.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Syllabus Uploader */}
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
