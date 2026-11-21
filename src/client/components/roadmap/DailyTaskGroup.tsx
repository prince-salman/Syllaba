"use client";

import React from "react";
import { DailySchedule, RoadmapTask } from "@/shared/types/roadmap";
import { TaskItem } from "./TaskItem";
import { formatDate, formatMinutes } from "@/shared/utils";
import { CalendarClock, Coffee, Clock, CheckCircle2, Lock } from "lucide-react";
import { CognitiveBadge } from "@/client/components/common/Badge";
import { useLanguage } from "@/client/context/LanguageContext";
import { getWorkspaceCopy } from "@/client/i18n/workspaceCopy";

interface DailyTaskGroupProps {
  schedule: DailySchedule;
  isLocked?: boolean;
  isWaitingNextDay?: boolean;
  lockReason?: string;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  onOpenFocusTimer: (task: RoadmapTask) => void;
}

export function DailyTaskGroup({
  schedule,
  isLocked = false,
  isWaitingNextDay = false,
  lockReason,
  onToggleTask,
  onToggleSubtask,
  onOpenFocusTimer,
}: DailyTaskGroupProps) {
  const { lang } = useLanguage();
  const wcopy = getWorkspaceCopy(lang);

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
                  {wcopy.dayLabel(schedule.dayNumber)}
                </span>
                <span className="text-xs text-emerald-700">
                  {formatDate(schedule.date)}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                {wcopy.restDayDesc}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
            {wcopy.restDayBadge}
          </span>
        </div>
      </div>
    );
  }

  const completedCount = schedule.tasks.filter((t) => t.isCompleted).length;
  const isDayFullyCompleted = schedule.tasks.length > 0 && completedCount === schedule.tasks.length;

  return (
    <div
      className={`rounded-xl border bg-white shadow-xs overflow-hidden transition-opacity ${
        isLocked ? "border-slate-200/80 opacity-85" : "border-slate-200"
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b ${
          isLocked
            ? "bg-slate-100/90 border-slate-200"
            : "bg-slate-50/80 border-slate-200/80"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs ${
              isLocked
                ? "bg-slate-200 text-slate-600 border border-slate-300"
                : isDayFullyCompleted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-white text-slate-800 border border-slate-200"
            }`}
          >
            {isLocked ? (
              isWaitingNextDay ? (
                <CalendarClock className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )
            ) : isDayFullyCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              `D${schedule.dayNumber}`
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">
              {wcopy.dayLabel(schedule.dayNumber)}
            </h3>
            <span className="text-xs text-slate-500">
              {formatDate(schedule.date)}
            </span>
            {isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                {isWaitingNextDay ? (
                  <>
                    <CalendarClock className="w-2.5 h-2.5" />
                    <span>{wcopy.nextDayWaitBadge(formatDate(schedule.date))}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5" />
                    <span>{wcopy.sequentialLockBadge}</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            {wcopy.doneCount(completedCount, schedule.tasks.length)}
          </span>
          <CognitiveBadge load={schedule.cognitiveLoadSummary} />
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-slate-400" />
            {formatMinutes(schedule.totalEstimatedMinutes)}
          </span>
        </div>
      </div>

      {isLocked && lockReason && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center gap-2 text-xs font-medium text-amber-900">
          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{lockReason}</span>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {schedule.tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isLocked={isLocked}
            onToggleTask={onToggleTask}
            onToggleSubtask={onToggleSubtask}
            onOpenFocusTimer={onOpenFocusTimer}
          />
        ))}
      </div>
    </div>
  );
}
