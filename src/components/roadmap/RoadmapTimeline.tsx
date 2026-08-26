"use client";

import React, { useState } from "react";
import { Roadmap, RoadmapTask } from "@/types/roadmap";
import { RoadmapHeader } from "./RoadmapHeader";
import { DailyTaskGroup } from "./DailyTaskGroup";
import { ProgressOverview } from "@/components/analytics/ProgressOverview";
import { BurnoutRiskMeter } from "@/components/analytics/BurnoutRiskMeter";
import { FocusTimerModal } from "@/components/focus/FocusTimerModal";
import { RescheduleModal } from "./RescheduleModal";
import { updateTaskCompletion, updateSubtaskCompletion, saveRoadmap } from "@/lib/storage";

interface RoadmapTimelineProps {
  roadmap: Roadmap;
  onUpdateRoadmap: (updated: Roadmap) => void;
  onNewRoadmap: () => void;
}

export function RoadmapTimeline({
  roadmap,
  onUpdateRoadmap,
  onNewRoadmap,
}: RoadmapTimelineProps) {
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
      const { rescheduleRoadmap } = await import("@/lib/heuristics");
      const fallbackUpdated = rescheduleRoadmap(roadmap, delayDays);
      saveRoadmap(fallbackUpdated);
      onUpdateRoadmap(fallbackUpdated);
    }
  };

  return (
    <div className="space-y-6">
      <RoadmapHeader
        roadmap={roadmap}
        onOpenReschedule={() => setIsRescheduleOpen(true)}
        onNewRoadmap={onNewRoadmap}
      />

      <ProgressOverview roadmap={roadmap} />

      <BurnoutRiskMeter metrics={roadmap.burnoutMetrics} />

      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Daily Study Timeline
        </h2>

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
