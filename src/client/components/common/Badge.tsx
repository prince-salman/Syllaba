import React from "react";
import { cn } from "@/shared/utils";
import { CognitiveLoad, TaskCategory } from "@/shared/types/roadmap";
import { BookOpen, Code, FileText, CheckCircle2, Dumbbell, Compass } from "lucide-react";

interface CognitiveBadgeProps {
  load: CognitiveLoad;
  className?: string;
}

export function CognitiveBadge({ load, className }: CognitiveBadgeProps) {
  const styles = {
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
    moderate: "bg-blue-50 text-blue-700 border-blue-200",
    deep: "bg-amber-50 text-amber-800 border-amber-200",
  };

  const labels = {
    light: "Light",
    moderate: "Moderate",
    deep: "Deep Focus",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        styles[load],
        className
      )}
    >
      {labels[load]}
    </span>
  );
}

interface CategoryBadgeProps {
  category: TaskCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const icons = {
    reading: BookOpen,
    practice: Dumbbell,
    research: Compass,
    writing: FileText,
    coding: Code,
    review: CheckCircle2,
  };

  const IconComponent = icons[category] || FileText;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize",
        className
      )}
    >
      <IconComponent className="w-3 h-3" />
      {category}
    </span>
  );
}
