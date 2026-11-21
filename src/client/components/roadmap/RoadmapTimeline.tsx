"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BlockchainCertificateRecord,
  DailySchedule,
  ExamStage,
  MilestoneExam,
  Roadmap,
  RoadmapTask,
} from "@/shared/types/roadmap";
import { RoadmapHeader } from "./RoadmapHeader";
import { DailyTaskGroup } from "./DailyTaskGroup";
import { CuratedResourcesPanel } from "./CuratedResourcesPanel";
import { OnChainProofPanel } from "./OnChainProofPanel";
import {
  MilestoneExamCard,
  MilestoneExamModal,
} from "./MilestoneExamModal";
import { BlockchainCertificatePanel } from "./BlockchainCertificatePanel";
import { computeRoadmapPointBreakdown } from "@/shared/utils/certificateTiers";
import { BurnoutRiskMeter } from "@/client/components/analytics/BurnoutRiskMeter";
import { FocusTimerModal } from "@/client/components/focus/FocusTimerModal";
import { RescheduleModal } from "./RescheduleModal";
import { ScrollReveal } from "@/client/components/common/ScrollReveal";
import {
  Award,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  FileKey2,
  ArrowUpRight,
  ChevronDown,
  Lock,
} from "lucide-react";
import { keccak256, stringToHex } from "viem";
import { useWeb3 } from "@/components/Web3Providers";

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  onUpdateRoadmap: (updated: Roadmap) => void;
  onNewRoadmap: () => void;
}

type WorkspaceTab = "timeline" | "certificate" | "materials" | "proofs";

const INITIAL_DAYS_BATCH = 8;
const LOAD_MORE_STEP = 7;

function isScheduleDone(schedule: DailySchedule): boolean {
  return (
    schedule.isRestDay ||
    schedule.tasks.length === 0 ||
    schedule.tasks.every((t) => t.isCompleted)
  );
}

export function RoadmapTimeline({
  roadmap,
  onUpdateRoadmap,
  onNewRoadmap,
}: RoadmapTimelineProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("timeline");
  const [selectedTaskForTimer, setSelectedTaskForTimer] =
    useState<RoadmapTask | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [activeExamModalStage, setActiveExamModalStage] =
    useState<ExamStage | null>(null);
  const [visibleDaysCount, setVisibleDaysCount] = useState(INITIAL_DAYS_BATCH);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useWeb3();

  // Reset progressive batch whenever user switches to another course
  useEffect(() => {
    setVisibleDaysCount(INITIAL_DAYS_BATCH);
  }, [roadmap.id]);

  // Progressive scroll-loading for DailyTaskGroup cards
  useEffect(() => {
    if (activeTab !== "timeline") return;
    const totalDays = roadmap.dailySchedules.length;
    if (visibleDaysCount >= totalDays) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            setVisibleDaysCount((prev) =>
              Math.min(prev + LOAD_MORE_STEP, totalDays)
            );
          }, 180);
        }
      },
      { rootMargin: "120px 0px" }
    );

    observer.observe(sentinel);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [activeTab, visibleDaysCount, roadmap.dailySchedules.length]);

  const { midExamDay, finalExamDay } = useMemo(() => {
    const activeDays = roadmap.dailySchedules.filter(
      (d) => !d.isRestDay && d.tasks.length > 0
    );
    if (activeDays.length === 0) {
      const total = Math.max(1, roadmap.dailySchedules.length);
      return {
        midExamDay: Math.max(1, Math.ceil(total / 2)),
        finalExamDay: total,
      };
    }
    const midIdx = Math.floor((activeDays.length - 1) / 2);
    return {
      midExamDay: activeDays[midIdx].dayNumber,
      finalExamDay: activeDays[activeDays.length - 1].dayNumber,
    };
  }, [roadmap.dailySchedules]);

  const areDaysCompletedUpTo = (targetDayNumber: number): boolean => {
    return roadmap.dailySchedules
      .filter((d) => d.dayNumber <= targetDayNumber)
      .every(isScheduleDone);
  };

  const getDayLockState = (
    dayNumber: number
  ): { isLocked: boolean; lockReason?: string } => {
    if (dayNumber <= 1) return { isLocked: false };

    const firstIncompletePrior = roadmap.dailySchedules.find(
      (d) => d.dayNumber < dayNumber && !isScheduleDone(d)
    );
    if (firstIncompletePrior) {
      return {
        isLocked: true,
        lockReason: `Terkunci — Selesaikan seluruh tugas pada Hari ${firstIncompletePrior.dayNumber} terlebih dahulu secara berurutan.`,
      };
    }

    if (dayNumber > midExamDay && !roadmap.exams?.mid?.submission?.passed) {
      return {
        isLocked: true,
        lockReason: `Terkunci — Selesaikan & lulus Ujian Tengah Sesi (5 PG + 2 Esai) setelah Hari ${midExamDay} terlebih dahulu untuk membuka Hari ${dayNumber}.`,
      };
    }

    return { isLocked: false };
  };

  const roadmapHash = useMemo(() => {
    const canonical = JSON.stringify({
      id: roadmap.id,
      courseTitle: roadmap.courseTitle,
      totalDays: roadmap.totalDays,
      totalTasks: roadmap.totalTasks,
      targetEndDate: roadmap.targetEndDate,
    });
    return keccak256(stringToHex(canonical));
  }, [
    roadmap.id,
    roadmap.courseTitle,
    roadmap.totalDays,
    roadmap.totalTasks,
    roadmap.targetEndDate,
  ]);

  const handleToggleTask = (taskId: string, completed: boolean) => {
    // Prevent toggling tasks on a locked day
    const ownerSchedule = roadmap.dailySchedules.find((s) =>
      s.tasks.some((t) => t.id === taskId)
    );
    if (ownerSchedule && getDayLockState(ownerSchedule.dayNumber).isLocked) {
      return;
    }

    let totalCompleted = 0;
    const nextSchedules = roadmap.dailySchedules.map((schedule) => ({
      ...schedule,
      tasks: schedule.tasks.map((task) => {
        const nextTask =
          task.id === taskId
            ? {
                ...task,
                isCompleted: completed,
                subtasks: task.subtasks.map((s) => ({
                  ...s,
                  isCompleted: completed,
                })),
              }
            : task;
        if (nextTask.isCompleted) totalCompleted++;
        return nextTask;
      }),
    }));

    onUpdateRoadmap({
      ...roadmap,
      completedTasks: totalCompleted,
      dailySchedules: nextSchedules,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleSubtask = (
    taskId: string,
    subtaskId: string,
    completed: boolean
  ) => {
    const ownerSchedule = roadmap.dailySchedules.find((s) =>
      s.tasks.some((t) => t.id === taskId)
    );
    if (ownerSchedule && getDayLockState(ownerSchedule.dayNumber).isLocked) {
      return;
    }

    let totalCompleted = 0;
    const nextSchedules = roadmap.dailySchedules.map((schedule) => ({
      ...schedule,
      tasks: schedule.tasks.map((task) => {
        if (task.id !== taskId) {
          if (task.isCompleted) totalCompleted++;
          return task;
        }
        const nextSubtasks = task.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, isCompleted: completed } : s
        );
        const allSubtasksDone =
          nextSubtasks.length > 0 && nextSubtasks.every((s) => s.isCompleted);
        if (allSubtasksDone) totalCompleted++;
        return {
          ...task,
          isCompleted: allSubtasksDone,
          subtasks: nextSubtasks,
        };
      }),
    }));

    onUpdateRoadmap({
      ...roadmap,
      completedTasks: totalCompleted,
      dailySchedules: nextSchedules,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveExam = (stage: ExamStage, updatedExam: MilestoneExam) => {
    onUpdateRoadmap({
      ...roadmap,
      exams: {
        ...(roadmap.exams || {}),
        [stage]: updatedExam,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveCertificate = (cert: BlockchainCertificateRecord) => {
    onUpdateRoadmap({
      ...roadmap,
      certificate: cert,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleOpenFocusTimer = (task: RoadmapTask) => {
    setSelectedTaskForTimer(task);
    setIsTimerOpen(true);
  };

  const handleCompleteFromTimer = (taskId: string) => {
    handleToggleTask(taskId, true);
  };

  const handleRescheduleConfirm = async (delayDays: number) => {
    try {
      const res = await fetch("/api/roadmap/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap, delayDays }),
      });
      if (res.ok) {
        const updated: Roadmap = await res.json();
        onUpdateRoadmap(updated);
      }
    } catch {
      const { rescheduleRoadmap } = await import(
        "@/server/services/pacing.service"
      );
      const fallbackUpdated = rescheduleRoadmap(roadmap, delayDays);
      onUpdateRoadmap(fallbackUpdated);
    }
  };

  const curatedCount = roadmap.curatedResources?.length || 0;
  const visibleSchedules = roadmap.dailySchedules.slice(0, visibleDaysCount);
  const hasMoreDays = visibleDaysCount < roadmap.dailySchedules.length;

  const midPassed = Boolean(roadmap.exams?.mid?.submission?.passed);
  const finalPassed = Boolean(roadmap.exams?.final?.submission?.passed);
  const allTasksDone =
    roadmap.totalTasks > 0 && roadmap.completedTasks >= roadmap.totalTasks;
  const isCertificateUnlocked = allTasksDone && midPassed && finalPassed;
  const pptPointBreakdown = useMemo(
    () => computeRoadmapPointBreakdown(roadmap),
    [roadmap]
  );

  const coveredTasksForModal = useMemo(() => {
    if (!activeExamModalStage) return [];
    if (activeExamModalStage === "mid") {
      return roadmap.dailySchedules
        .filter((d) => d.dayNumber <= midExamDay)
        .flatMap((d) => d.tasks);
    }
    const secondHalf = roadmap.dailySchedules
      .filter((d) => d.dayNumber > midExamDay)
      .flatMap((d) => d.tasks);
    return secondHalf.length > 0
      ? secondHalf
      : roadmap.dailySchedules.flatMap((d) => d.tasks);
  }, [activeExamModalStage, midExamDay, roadmap.dailySchedules]);

  return (
    <div className="space-y-6">
      <RoadmapHeader
        roadmap={roadmap}
        onOpenReschedule={() => setIsRescheduleOpen(true)}
        onNewRoadmap={onNewRoadmap}
      />

      <div className="flex items-center gap-1 border-b border-[#E5E5E0] overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "timeline"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#666660] hover:text-[#111111]"
          }`}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span>Daily Study Plan</span>
          <span className="rounded-full bg-[#F7F7F5] px-2 py-0.5 text-[11px] font-semibold text-[#52524C]">
            {roadmap.totalTasks}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("certificate")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "certificate"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#666660] hover:text-[#111111]"
          }`}
        >
          <Award className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Certificate &amp; $SYL Coin</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              roadmap.certificate
                ? "bg-emerald-100 text-emerald-800"
                : pptPointBreakdown.isFullyCompletedAtEnd
                ? "bg-[#FACC15] text-[#111111]"
                : "bg-[#FEF3C7] text-[#111111]"
            }`}
          >
            {pptPointBreakdown.isFullyCompletedAtEnd
              ? `+${pptPointBreakdown.pptDifficultyPoints} Poin · +${pptPointBreakdown.totalSylFromRoadmap} $SYL`
              : `${pptPointBreakdown.pptDifficultyPoints}/5 Poin (Akhir)`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "materials"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#666660] hover:text-[#111111]"
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Reading Materials</span>
          <span className="rounded-full bg-[#F7F7F5] px-2 py-0.5 text-[11px] font-semibold text-[#52524C]">
            {curatedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proofs")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "proofs"
              ? "border-[#111111] text-[#111111]"
              : "border-transparent text-[#666660] hover:text-[#111111]"
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Progress Proof</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 min-w-0 space-y-4">
          {activeTab === "timeline" && (
            <>
              <div className="space-y-4">
                {visibleSchedules.map((schedule, index) => {
                  const lockState = getDayLockState(schedule.dayNumber);
                  const isMidDay = schedule.dayNumber === midExamDay;
                  const isFinalDay = schedule.dayNumber === finalExamDay;
                  const midExamLocked = !areDaysCompletedUpTo(midExamDay);
                  const finalExamLocked =
                    !areDaysCompletedUpTo(finalExamDay) || !midPassed;

                  return (
                    <React.Fragment key={schedule.dayNumber}>
                      <ScrollReveal delayMs={(index % LOAD_MORE_STEP) * 70}>
                        <DailyTaskGroup
                          schedule={schedule}
                          isLocked={lockState.isLocked}
                          lockReason={lockState.lockReason}
                          onToggleTask={handleToggleTask}
                          onToggleSubtask={handleToggleSubtask}
                          onOpenFocusTimer={handleOpenFocusTimer}
                        />
                      </ScrollReveal>

                      {isMidDay && (
                        <ScrollReveal delayMs={90}>
                          <MilestoneExamCard
                            stage="mid"
                            triggerDayNumber={midExamDay}
                            isLocked={midExamLocked}
                            lockReason={`Terkunci — Selesaikan seluruh tugas Hari 1 s/d Hari ${midExamDay} terlebih dahulu untuk membuka Ujian Tengah Sesi (5 PG + 2 Esai).`}
                            exam={roadmap.exams?.mid}
                            onOpenExam={(stg) => setActiveExamModalStage(stg)}
                          />
                        </ScrollReveal>
                      )}

                      {isFinalDay && (
                        <>
                          <ScrollReveal delayMs={110}>
                            <MilestoneExamCard
                              stage="final"
                              triggerDayNumber={finalExamDay}
                              isLocked={finalExamLocked}
                              lockReason={`Terkunci — Selesaikan seluruh tugas hingga Hari ${finalExamDay} dan lulus Ujian Tengah Sesi untuk membuka Ujian Akhir Sesi (5 PG + 2 Esai).`}
                              exam={roadmap.exams?.final}
                              onOpenExam={(stg) => setActiveExamModalStage(stg)}
                            />
                          </ScrollReveal>

                          {/* Final Blockchain Certificate Milestone Banner */}
                          <ScrollReveal delayMs={140}>
                            <div
                              className={`rounded-2xl border-2 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                roadmap.certificate || isCertificateUnlocked
                                  ? "border-[#D4AF37] bg-gradient-to-r from-[#0D0D11] via-[#17171F] to-[#0D0D11] text-white shadow-lg"
                                  : "border-dashed border-slate-300 bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FACC15] text-[#111111] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Base Sepolia On-Chain Credential</span>
                                </div>
                                <h4
                                  className={`text-base font-extrabold ${
                                    roadmap.certificate || isCertificateUnlocked
                                      ? "text-white"
                                      : "text-slate-900"
                                  }`}
                                >
                                  Sertifikat Akademik Blockchain —{" "}
                                  {roadmap.courseTitle}
                                </h4>
                                <p
                                  className={`text-xs ${
                                    roadmap.certificate || isCertificateUnlocked
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {roadmap.certificate
                                    ? `Sertifikat telah diterbitkan di Base Sepolia (ID: ${roadmap.certificate.certificateId}).`
                                    : isCertificateUnlocked
                                    ? "Seluruh tugas harian, Ujian Tengah Sesi, dan Ujian Akhir Sesi telah tuntas! Klaim Sertifikat Blockchain sekarang."
                                    : "Selesaikan seluruh hari belajar secara berurutan serta lulus Ujian Tengah Sesi & Akhir Sesi untuk membuka sertifikat ini."}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveTab("certificate")}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shrink-0 transition cursor-pointer ${
                                  roadmap.certificate || isCertificateUnlocked
                                    ? "bg-[#FACC15] text-[#111111] hover:bg-[#FDE047]"
                                    : "bg-slate-900 text-[#FACC15] hover:bg-slate-800"
                                }`}
                              >
                                <Award className="w-4 h-4" />
                                <span>
                                  {roadmap.certificate
                                    ? "Lihat Sertifikat Blockchain"
                                    : isCertificateUnlocked
                                    ? "Klaim Sertifikat Blockchain"
                                    : "Lihat Preview Sertifikat"}
                                </span>
                              </button>
                            </div>
                          </ScrollReveal>
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {hasMoreDays && (
                <div
                  ref={loadMoreRef}
                  className="pt-2 flex flex-col items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleDaysCount((prev) =>
                        Math.min(
                          prev + LOAD_MORE_STEP,
                          roadmap.dailySchedules.length
                        )
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] hover:bg-[#FEF3C7]/70 hover:border-[#F5B700]/40 px-4 py-2.5 text-xs font-semibold text-[#111111] transition cursor-pointer"
                  >
                    <span>
                      Showing {visibleDaysCount} of{" "}
                      {roadmap.dailySchedules.length} days — Scroll or click to
                      reveal more
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "certificate" && (
            <ScrollReveal>
              <BlockchainCertificatePanel
                roadmap={roadmap}
                onSaveCertificate={handleSaveCertificate}
                onOpenExam={(stg) => setActiveExamModalStage(stg)}
              />
            </ScrollReveal>
          )}

          {activeTab === "materials" && (
            <ScrollReveal>
              <CuratedResourcesPanel
                resources={roadmap.curatedResources || []}
              />
            </ScrollReveal>
          )}

          {activeTab === "proofs" && (
            <ScrollReveal>
              <OnChainProofPanel roadmap={roadmap} />
            </ScrollReveal>
          )}
        </div>

        <aside className="lg:col-span-4 min-w-0 space-y-4 lg:sticky lg:top-20">
          <ScrollReveal delayMs={60}>
            <div className="rounded-2xl border border-[#E5E5E0] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-[#111111]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660]">
                    Sequential Exams &amp; Certificate
                  </h3>
                </div>
                <span className="rounded-full bg-[#FEF3C7] border border-[#FACC15]/50 px-2 py-0.5 text-[10px] font-bold text-[#111111]">
                  PPT Difficulty: {pptPointBreakdown.pptDifficultyPoints}/5 Poin
                </span>
              </div>

              <div className="rounded-xl bg-[#111111] text-white p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#FACC15] font-extrabold">
                    Bobot PPT (AI): {pptPointBreakdown.pptDifficultyPoints}/5 Poin
                  </span>
                  <span className="font-bold text-emerald-300">
                    {pptPointBreakdown.isFullyCompletedAtEnd
                      ? `+${pptPointBreakdown.totalEarnedFromRoadmap} Poin Cair!`
                      : `Cair di Akhir (+${pptPointBreakdown.pptDifficultyPoints} Poin)`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Tier: Bronze (20) &middot; Silver (40) &middot; Gold (65) &middot; Platinum (95) &middot; Diamond (130) &middot; Emerald (175)
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  disabled={!areDaysCompletedUpTo(midExamDay)}
                  onClick={() => setActiveExamModalStage("mid")}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    midPassed
                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 cursor-pointer"
                      : areDaysCompletedUpTo(midExamDay)
                      ? "border-[#FACC15] bg-[#FEF3C7]/60 text-[#111111] font-semibold cursor-pointer"
                      : "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <div>
                    <div className="font-bold">
                      1. Mid-Session Exam (Hari {midExamDay})
                    </div>
                    <div className="text-[11px] opacity-80">
                      {midPassed
                        ? `Lulus · Skor ${roadmap.exams?.mid?.submission?.totalScore}/100`
                        : areDaysCompletedUpTo(midExamDay)
                        ? "Siap Dikerjakan (5 PG + 2 Esai)"
                        : `Terkunci (Selesaikan Hari 1-${midExamDay})`}
                    </div>
                  </div>
                  {midPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : areDaysCompletedUpTo(midExamDay) ? (
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={!areDaysCompletedUpTo(finalExamDay) || !midPassed}
                  onClick={() => setActiveExamModalStage("final")}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    finalPassed
                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 cursor-pointer"
                      : areDaysCompletedUpTo(finalExamDay) && midPassed
                      ? "border-[#FACC15] bg-[#FEF3C7]/60 text-[#111111] font-semibold cursor-pointer"
                      : "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <div>
                    <div className="font-bold">
                      2. Final-Session Exam (Hari {finalExamDay})
                    </div>
                    <div className="text-[11px] opacity-80">
                      {finalPassed
                        ? `Lulus · Skor ${roadmap.exams?.final?.submission?.totalScore}/100`
                        : areDaysCompletedUpTo(finalExamDay) && midPassed
                        ? "Siap Dikerjakan (5 PG + 2 Esai)"
                        : `Terkunci (Selesaikan Hari 1-${finalExamDay})`}
                    </div>
                  </div>
                  {finalPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : areDaysCompletedUpTo(finalExamDay) && midPassed ? (
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("certificate")}
                  className="w-full flex items-center justify-between rounded-xl border border-[#D4AF37]/60 bg-[#111111] text-white px-3 py-2.5 text-left hover:bg-slate-900 transition cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-[#FACC15]">
                      3. Blockchain Certificate
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {roadmap.certificate
                        ? `Minted (${roadmap.certificate.certificateId})`
                        : isCertificateUnlocked
                        ? "Siap Klaim di Base Sepolia!"
                        : "Preview Sertifikat On-Chain"}
                    </div>
                  </div>
                  <Award className="w-4 h-4 text-[#FACC15] shrink-0" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={100}>
            <BurnoutRiskMeter metrics={roadmap.burnoutMetrics} />
          </ScrollReveal>

          <ScrollReveal delayMs={160}>
            <div className="rounded-2xl border border-[#E5E5E0] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileKey2 className="h-4 w-4 text-[#111111]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666660]">
                    Study Proof
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    isConnected
                      ? "bg-[#FEF3C7] text-[#111111] border-[#F5B700]/40"
                      : "bg-[#F7F7F5] text-[#666660] border-[#E5E5E0]"
                  }`}
                >
                  {isConnected ? "Wallet Connected" : "Optional"}
                </span>
              </div>

              <p className="text-xs text-[#666660] leading-relaxed">
                Save a tamper-proof snapshot of this study roadmap on-chain.
              </p>

              <p className="font-mono text-[11px] text-[#52524C] bg-[#F7F7F5] border border-[#E5E5E0] rounded-lg px-2.5 py-2 truncate">
                {roadmapHash}
              </p>

              <button
                type="button"
                onClick={() => setActiveTab("proofs")}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#FEF3C7]/70 hover:border-[#F5B700]/40 transition-colors cursor-pointer"
              >
                <span>Open Progress Proof</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </ScrollReveal>
        </aside>
      </div>

      <FocusTimerModal
        task={selectedTaskForTimer}
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        onCompleteTask={handleCompleteFromTimer}
      />

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        roadmap={roadmap}
        onRescheduleConfirm={handleRescheduleConfirm}
      />

      {activeExamModalStage && (
        <MilestoneExamModal
          isOpen={Boolean(activeExamModalStage)}
          stage={activeExamModalStage}
          courseTitle={roadmap.courseTitle}
          triggerDayNumber={
            activeExamModalStage === "mid" ? midExamDay : finalExamDay
          }
          coveredTasks={coveredTasksForModal}
          existingExam={
            activeExamModalStage === "mid"
              ? roadmap.exams?.mid
              : roadmap.exams?.final
          }
          onClose={() => setActiveExamModalStage(null)}
          onSaveExam={handleSaveExam}
        />
      )}
    </div>
  );
}
