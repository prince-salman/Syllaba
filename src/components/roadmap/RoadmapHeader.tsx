"use client";

import React, { useState } from "react";
import { Roadmap } from "@/types/roadmap";
import { Button } from "@/components/common/Button";
import { Download, CalendarClock, PlusCircle, Check } from "lucide-react";
import { downloadCalendarFile } from "@/lib/calendar";

interface RoadmapHeaderProps {
  roadmap: Roadmap;
  onOpenReschedule: () => void;
  onNewRoadmap: () => void;
}

export function RoadmapHeader({
  roadmap,
  onOpenReschedule,
  onNewRoadmap,
}: RoadmapHeaderProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    downloadCalendarFile(roadmap);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
            Active Study Plan
          </span>
          <span className="text-xs text-slate-500">
            {roadmap.startDate} &mdash; {roadmap.targetEndDate}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {roadmap.courseTitle}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          title="Export to Apple Calendar, Google Calendar, or Outlook"
        >
          {downloadSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4 text-slate-600" />}
          <span>{downloadSuccess ? "Exported .ics" : "Export Calendar"}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenReschedule}
          title="Recalibrate timeline smoothly"
        >
          <CalendarClock className="w-4 h-4 text-amber-700" />
          <span>I'm Falling Behind</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewRoadmap}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Plan</span>
        </Button>
      </div>
    </div>
  );
}
