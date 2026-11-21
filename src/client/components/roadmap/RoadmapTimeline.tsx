"use client";

import React, { useState } from "react";
import { Roadmap, RoadmapTask } from "@/shared/types/roadmap";
import { RoadmapHeader } from "./RoadmapHeader";
import { DailyTaskGroup } from "./DailyTaskGroup";
import { CuratedResourcesPanel } from "./CuratedResourcesPanel";
import { OnChainProofPanel } from "./OnChainProofPanel";
import { ProgressOverview } from "@/client/components/analytics/ProgressOverview";
import { BurnoutRiskMeter } from "@/client/components/analytics/BurnoutRiskMeter";
import { FocusTimerModal } from "@/client/components/focus/FocusTimerModal";
import { RescheduleModal } from "./RescheduleModal";
import { updateTaskCompletion, updateSubtaskCompletion, saveRoadmap } from "@/client/utils/storage";
import { BookOpen, CalendarDays, ShieldCheck } from "lucide-react";

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  onUpdateRoadmap: (updated: Roadmap) => void;
  onNewRoadmap: () => void;
}

type WorkspaceTab = "timeline" | "materials" | "proofs";

export function RoadmapTimeline({
  roadmap,
  onUpdateRoadmap,
  onNewRoadmap,
}: RoadmapTimelineProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("timeline");
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<RoadmapTask | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const handleToggleTask = (taskId: string, completed: boolean) => {
    const updated = updateTaskCompletion(roadmap.id, taskId, completed);
    if (updated) onUpdateRoadmap(updated);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string, completed: boolean) => {
    const updated = updateSubtaskCompletion(roadmap.id, taskId, subtaskId, completed);
    if (updated) onUpdateRoadmap(updated);
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
        saveRoadmap(updated);
        onUpdateRoadmap(updated);
      }
    } catch {
      const { rescheduleRoadmap } = await import("@/server/services/pacing.service");
      const fallbackUpdated = rescheduleRoadmap(roadmap, delayDays);
      saveRoadmap(fallbackUpdated);
      onUpdateRoadmap(fallbackUpdated);
    }
  };

  const curatedCount = roadmap.curatedResources?.length || 0;
  const completionPct =
    roadmap.totalTasks > 0 ? Math.round((roadmap.completedTasks / roadmap.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <RoadmapHeader
        roadmap={roadmap}
        onOpenReschedule={() => setIsRescheduleOpen(true)}
        onNewRoadmap={onNewRoadmap}
      />

      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
            activeTab === "timeline"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Daily Micro-Tasks</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {roadmap.totalTasks}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
            activeTab === "materials"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Curated Materials</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {curatedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("proofs")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
            activeTab === "proofs"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>On-Chain Proofs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          {activeTab === "timeline" && (
            <>
              <ProgressOverview roadmap={roadmap} />
              <div className="space-y-4 pt-2">
                {roadmap.dailySchedules.map((schedule) => (
                  <DailyTaskGroup
                    key={schedule.dayNumber}
                    schedule={schedule}
                    onToggleTask={handleToggleTask}
                    onToggleSubtask={handleToggleSubtask}
                    onOpenFocusTimer={handleOpenFocusTimer}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === "materials" && (
            <CuratedResourcesPanel resources={roadmap.curatedResources || []} />
          )}

          {activeTab === "proofs" && <OnChainProofPanel roadmap={roadmap} />}
        </div>

        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Course Velocity
              </h3>
              <span className="text-sm font-bold text-brand-700">{completionPct}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Completed Micro-Tasks</span>
                <span className="font-semibold text-slate-900">{roadmap.completedTasks}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Pending Micro-Tasks</span>
                <span className="font-semibold text-slate-900">
                  {Math.max(0, roadmap.totalTasks - roadmap.completedTasks)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Curated Open-Access Papers</span>
                <span className="font-semibold text-slate-900">{curatedCount}</span>
              </div>
            </div>
          </div>

          <BurnoutRiskMeter metrics={roadmap.burnoutMetrics} />
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
