import React from "react";
import { DailySchedule, RoadmapTask } from "@/types/roadmap";
import { TaskItem } from "./TaskItem";
import { formatDate, formatMinutes } from "@/lib/utils";
import { Coffee, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { CognitiveBadge } from "@/components/common/Badge";

interface DailyTaskGroupProps {
  schedule: DailySchedule;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  onOpenFocusTimer: (task: RoadmapTask) => void;
}

export function DailyTaskGroup({
  schedule,
  onToggleTask,
  onToggleSubtask,
  onOpenFocusTimer,
}: DailyTaskGroupProps) {
  if (schedule.isRestDay) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-950">
                  Day {schedule.dayNumber}
                </span>
                <span className="text-xs text-emerald-700">
                  {formatDate(schedule.date)}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Cognitive Recovery Day &middot; Brain reset to consolidate memories and prevent burnout.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
            Rest & Rebalance
          </span>
        </div>
      </div>
    );
  }

  const completedCount = schedule.tasks.filter((t) => t.isCompleted).length;
  const isDayFullyCompleted = schedule.tasks.length > 0 && completedCount === schedule.tasks.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm ${
            isDayFullyCompleted
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-800"
          }`}>
            {isDayFullyCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : `D${schedule.dayNumber}`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Day {schedule.dayNumber}
              </h3>
              <span className="text-xs text-slate-500">
                {formatDate(schedule.date)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {completedCount} of {schedule.tasks.length} tasks completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CognitiveBadge load={schedule.cognitiveLoadSummary} />
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            <Clock className="w-3.5 h-3.5" />
            {formatMinutes(schedule.totalEstimatedMinutes)}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {schedule.tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleTask={onToggleTask}
            onToggleSubtask={onToggleSubtask}
            onOpenFocusTimer={onOpenFocusTimer}
          />
        ))}
      </div>
    </div>
  );
}
