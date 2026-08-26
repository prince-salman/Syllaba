import React from "react";
import { cn } from "@/shared/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  showPercentage = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        {showPercentage && <span className="font-medium text-slate-700">{percentage}% Completed</span>}
        <span className="ml-auto">{value} / {max}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
        <div
          className={cn(
            "h-full rounded-full bg-brand-600 transition-all duration-300 ease-out",
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
