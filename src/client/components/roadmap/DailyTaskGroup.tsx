import React from "react";
import { DailySchedule, RoadmapTask } from "@/shared/types/roadmap";
import { TaskItem } from "./TaskItem";
import { formatDate, formatMinutes } from "@/shared/utils";
import { Coffee, Clock, CheckCircle2 } from "lucide-react";
import { CognitiveBadge } from "@/client/components/common/Badge";

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
      <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
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
                Cognitive Recovery Day &middot; Scheduled rest interval to prevent academic burnout.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
            Rest &amp; Rebalance
          </span>
        </div>
      </div>
    );
  }

  const completedCount = schedule.tasks.filter((t) => t.isCompleted).length;
  const isDayFullyCompleted = schedule.tasks.length > 0 && completedCount === schedule.tasks.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/80 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs ${
              isDayFullyCompleted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-white text-slate-800 border border-slate-200"
            }`}
          >
            {isDayFullyCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : `D${schedule.dayNumber}`}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Day {schedule.dayNumber}
            </h3>
            <span className="text-xs text-slate-500">
              {formatDate(schedule.date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            {completedCount}/{schedule.tasks.length} done
          </span>
          <CognitiveBadge load={schedule.cognitiveLoadSummary} />
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-slate-400" />
            {formatMinutes(schedule.totalEstimatedMinutes)}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
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
