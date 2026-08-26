import React from "react";
import { Roadmap } from "@/types/roadmap";
import { CheckCircle2, Clock, CalendarDays, Award } from "lucide-react";
import { formatMinutes } from "@/lib/utils";

interface ProgressOverviewProps {
  roadmap: Roadmap;
}

export function ProgressOverview({ roadmap }: ProgressOverviewProps) {
  const percentage = roadmap.totalTasks > 0
    ? Math.round((roadmap.completedTasks / roadmap.totalTasks) * 100)
    : 0;

  let totalMinutesRemaining = 0;
  roadmap.dailySchedules.forEach((schedule) => {
    schedule.tasks.forEach((task) => {
      if (!task.isCompleted) {
        totalMinutesRemaining += task.estimatedMinutes;
      }
    });
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Completion</span>
          <Award className="w-4 h-4 text-brand-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{percentage}%</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Tasks</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">
          {roadmap.completedTasks}
          <span className="text-xs font-normal text-slate-400"> / {roadmap.totalTasks}</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {roadmap.totalTasks - roadmap.completedTasks} pending
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Remaining Time</span>
          <Clock className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">
          {formatMinutes(totalMinutesRemaining)}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Paced over active days</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Timeline</span>
          <CalendarDays className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-xl font-bold text-slate-900">{roadmap.totalDays} Days</div>
        <p className="text-[11px] text-slate-500 mt-2">
          Target: {roadmap.targetEndDate}
        </p>
      </div>
    </div>
  );
}
