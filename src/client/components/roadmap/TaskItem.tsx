"use client";

import React, { useState } from "react";
import { RoadmapTask } from "@/shared/types/roadmap";
import { CategoryBadge, CognitiveBadge } from "@/client/components/common/Badge";
import { formatMinutes } from "@/shared/utils";
import { Check, Clock, ChevronDown, ChevronUp, Timer } from "lucide-react";

interface TaskItemProps {
  task: RoadmapTask;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  onOpenFocusTimer: (task: RoadmapTask) => void;
}

export function TaskItem({
  task,
  onToggleTask,
  onToggleSubtask,
  onOpenFocusTimer,
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`px-4 py-3.5 transition-colors ${
        task.isCompleted ? "bg-slate-50/70 text-slate-500" : "bg-white hover:bg-slate-50/40 text-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggleTask(task.id, !task.isCompleted)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
            task.isCompleted
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-300 bg-white hover:border-brand-500"
          }`}
          aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-semibold leading-snug ${
                task.isCompleted ? "line-through text-slate-400" : "text-slate-900"
              }`}
            >
              {task.title}
            </h4>
            {task.moduleTitle && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                {task.moduleTitle}
              </span>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <CategoryBadge category={task.category} />
            <CognitiveBadge load={task.cognitiveLoad} />
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatMinutes(task.estimatedMinutes)}
            </span>

            {task.subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors cursor-pointer ml-1"
              >
                <span>
                  {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} steps
                </span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {isExpanded && task.subtasks.length > 0 && (
            <ul className="mt-2.5 space-y-1.5 pl-2.5 border-l-2 border-brand-200">
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2 text-xs text-slate-700">
                  <button
                    type="button"
                    onClick={() => onToggleSubtask(task.id, subtask.id, !subtask.isCompleted)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border cursor-pointer ${
                      subtask.isCompleted
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white hover:border-brand-500"
                    }`}
                  >
                    {subtask.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <span className={subtask.isCompleted ? "line-through text-slate-400" : "text-slate-700"}>
                    {subtask.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onOpenFocusTimer(task)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors cursor-pointer shadow-2xs"
            title="Launch Focus Timer"
          >
            <Timer className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Focus</span>
          </button>
        </div>
      </div>
    </div>
  );
}
