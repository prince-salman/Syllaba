"use client";

import React, { useState, useEffect } from "react";
import { Roadmap } from "@/types/roadmap";
import { SyllabusUploader } from "@/components/uploader/SyllabusUploader";
import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";
import { getActiveRoadmap, saveRoadmap, getStoredRoadmaps, setActiveRoadmapId } from "@/lib/storage";
import { BookOpen, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [storedRoadmaps, setStoredRoadmaps] = useState<Roadmap[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const initial = getActiveRoadmap();
    const all = getStoredRoadmaps();
    setActiveRoadmap(initial);
    setStoredRoadmaps(all);
  }, []);

  const handleRoadmapGenerated = (roadmap: Roadmap) => {
    saveRoadmap(roadmap);
    setActiveRoadmap(roadmap);
    setStoredRoadmaps(getStoredRoadmaps());
  };

  const handleSelectStoredRoadmap = (roadmapId: string) => {
    setActiveRoadmapId(roadmapId);
    const found = storedRoadmaps.find((r) => r.id === roadmapId);
    if (found) setActiveRoadmap(found);
  };

  if (!isClient) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {activeRoadmap ? (
        <div className="space-y-6">
          {storedRoadmaps.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-semibold text-slate-500 shrink-0">
                Saved Courses:
              </span>
              {storedRoadmaps.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectStoredRoadmap(r.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    r.id === activeRoadmap.id
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {r.courseTitle}
                </button>
              ))}
            </div>
          )}

          <RoadmapTimeline
            roadmap={activeRoadmap}
            onUpdateRoadmap={(updated) => {
              setActiveRoadmap(updated);
              setStoredRoadmaps(getStoredRoadmaps());
            }}
            onNewRoadmap={() => setActiveRoadmap(null)}
          />
        </div>
      ) : (
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-medium text-brand-800 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anti-Burnout Academic Pacing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Turn Overwhelming Syllabi Into Daily Step-by-Step Roadmaps
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Beat procrastination and eliminate academic burnout. Upload assignment guidelines or course syllabi to generate paced, low-stress daily study tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Syllabus Breakdown</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Converts 10-page course PDFs into digestible daily micro-milestones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Fatigue Prevention</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Limits daily study to manageable sessions with mandatory rest days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Zero-Guilt Reschedule</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Falling behind shifts dates automatically without panic or backlogs.
                </p>
              </div>
            </div>
          </div>

          <SyllabusUploader onRoadmapGenerated={handleRoadmapGenerated} />
        </div>
      )}
    </div>
  );
}
