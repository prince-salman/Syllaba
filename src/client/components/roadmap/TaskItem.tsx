"use client";

import React, { useState } from "react";
import { RoadmapTask } from "@/shared/types/roadmap";
import { CategoryBadge, CognitiveBadge } from "@/client/components/common/Badge";
import { LatexText } from "@/client/components/common/LatexText";
import { formatMinutes } from "@/shared/utils";
import { Check, Clock, ChevronDown, ChevronUp, Lock, Timer } from "lucide-react";
import { useLanguage } from "@/client/context/LanguageContext";
import { getWorkspaceCopy } from "@/client/i18n/workspaceCopy";

interface TaskItemProps {
  task: RoadmapTask;
  isLocked?: boolean;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  onOpenFocusTimer: (task: RoadmapTask) => void;
}

export function TaskItem({
  task,
  isLocked = false,
  onToggleTask,
  onToggleSubtask,
  onOpenFocusTimer,
}: TaskItemProps) {
  const { lang } = useLanguage();
  const wcopy = getWorkspaceCopy(lang);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`px-4 py-3.5 transition-colors ${
        isLocked
          ? "bg-slate-50/50 text-slate-500"
          : task.isCompleted
          ? "bg-slate-50/70 text-slate-500"
          : "bg-white hover:bg-slate-50/40 text-slate-900"
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            if (!isLocked) onToggleTask(task.id, !task.isCompleted);
          }}
          className={`-m-1.5 p-1.5 touch-manipulation flex items-center justify-center shrink-0 ${
            isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer group/check"
          }`}
          aria-label={
            isLocked
              ? "Locked until previous day is complete"
              : task.isCompleted
              ? "Mark incomplete"
              : "Mark complete"
          }
          aria-pressed={task.isCompleted}
        >
          <span
            className={`flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-md border transition-all duration-150 ${
              isLocked
                ? "border-slate-300 bg-slate-100 text-slate-400"
                : task.isCompleted
                ? "border-[#111111] bg-[#111111] text-[#FACC15] shadow-2xs scale-100 group-active/check:scale-90"
                : "border-slate-300 bg-white hover:border-[#111111] group-active/check:scale-90"
            }`}
          >
            {isLocked ? (
              <Lock className="w-3 h-3 text-slate-400" />
            ) : (
              task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-semibold leading-snug ${
                task.isCompleted ? "line-through text-slate-400" : "text-slate-900"
              }`}
            >
              <LatexText text={task.title} />
            </h4>
            {task.moduleTitle && (
              <span className="rounded-md bg-[#FEF3C7] border border-[#FACC15]/40 px-2 py-0.5 text-[10px] font-bold text-[#111111]">
                <LatexText text={task.moduleTitle} />
              </span>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              <LatexText text={task.description} />
            </p>
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
                className="inline-flex items-center gap-1 rounded-md bg-[#F7F7F5] hover:bg-[#FEF3C7]/70 px-2 py-0.5 text-xs font-bold text-[#111111] transition-colors cursor-pointer ml-1"
              >
                <span>
                  {wcopy.breakdownStepsLabel(
                    task.subtasks.filter((s) => s.isCompleted).length,
                    task.subtasks.length
                  )}
                </span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {isExpanded && task.subtasks.length > 0 && (
            <ul className="mt-2.5 space-y-2 rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-3 pl-3.5 border-l-4 border-l-[#FACC15]">
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) onToggleSubtask(task.id, subtask.id, !subtask.isCompleted);
                    }}
                    className={`mt-0.5 -m-1 p-1 touch-manipulation flex items-center justify-center shrink-0 ${
                      isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                    }`}
                    aria-pressed={subtask.isCompleted}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        isLocked
                          ? "border-slate-300 bg-slate-100 text-slate-400"
                          : subtask.isCompleted
                          ? "border-[#111111] bg-[#111111] text-[#FACC15]"
                          : "border-slate-300 bg-white hover:border-[#111111]"
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      ) : (
                        subtask.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                    </span>
                  </button>
                  <span className={subtask.isCompleted ? "line-through text-slate-400" : "text-slate-800"}>
                    <LatexText text={subtask.title} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0">
          <button
            type="button"
            disabled={isLocked}
            onClick={() => {
              if (!isLocked) onOpenFocusTimer(task);
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors shadow-2xs ${
              isLocked
                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border-slate-200 bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 cursor-pointer"
            }`}
            title={isLocked ? "Complete previous days to unlock" : "Launch Focus Timer"}
          >
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Timer className="w-3.5 h-3.5 text-brand-600" />
            )}
            <span className="hidden sm:inline">
              {isLocked ? wcopy.lockedBtn : wcopy.focusBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
