"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Roadmap, RoadmapTask } from "@/shared/types/roadmap";
import { RoadmapHeader } from "./RoadmapHeader";
import { DailyTaskGroup } from "./DailyTaskGroup";
import { CuratedResourcesPanel } from "./CuratedResourcesPanel";
import { OnChainProofPanel } from "./OnChainProofPanel";
import { BurnoutRiskMeter } from "@/client/components/analytics/BurnoutRiskMeter";
import { FocusTimerModal } from "@/client/components/focus/FocusTimerModal";
import { RescheduleModal } from "./RescheduleModal";
import { ScrollReveal } from "@/client/components/common/ScrollReveal";
import {
  BookOpen,
  CalendarDays,
  ShieldCheck,
  FileKey2,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { keccak256, stringToHex } from "viem";
import { useWeb3 } from "@/components/Web3Providers";

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  onUpdateRoadmap: (updated: Roadmap) => void;
  onNewRoadmap: () => void;
}

type WorkspaceTab = "timeline" | "materials" | "proofs";

const INITIAL_DAYS_BATCH = 2;
const LOAD_MORE_STEP = 2;

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
                {visibleSchedules.map((schedule, index) => (
                  <ScrollReveal
                    key={schedule.dayNumber}
                    delayMs={(index % LOAD_MORE_STEP) * 90}
                  >
                    <DailyTaskGroup
                      schedule={schedule}
                      onToggleTask={handleToggleTask}
                      onToggleSubtask={handleToggleSubtask}
                      onOpenFocusTimer={handleOpenFocusTimer}
                    />
                  </ScrollReveal>
                ))}
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
          <ScrollReveal delayMs={80}>
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
    </div>
  );
}
