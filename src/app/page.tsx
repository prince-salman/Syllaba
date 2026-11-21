"use client";

import React, { useState, useEffect } from "react";
import { Roadmap } from "@/shared/types/roadmap";
import { SyllabusUploader } from "@/client/components/uploader/SyllabusUploader";
import { RoadmapTimeline } from "@/client/components/roadmap/RoadmapTimeline";
import { getActiveRoadmap, saveRoadmap, getStoredRoadmaps, setActiveRoadmapId } from "@/client/utils/storage";
import { Cpu, ShieldCheck, BookOpen, Clock, ArrowRight } from "lucide-react";

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
    <div className={activeRoadmap ? "bg-slate-50/70 min-h-[calc(100vh-4rem)]" : "bg-dot-matrix min-h-[calc(100vh-4rem)]"}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {activeRoadmap ? (
          <div className="space-y-6">
            {storedRoadmaps.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Saved Courses
                </span>
                {storedRoadmaps.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectStoredRoadmap(r.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                      r.id === activeRoadmap.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2 lg:pt-6">
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                <span>Multi-Agent Academic Pacing</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Turn Dense Syllabi Into Verified 15-Minute Daily Sprints
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Syllaba extracts course deadlines, breaks heavy modules into anti-burnout micro-tasks, curates open-access research papers, and anchors your study commitment hash on-chain.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Autonomous Execution Architecture
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
                      <Cpu className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900">Agent 1, 2 &amp; 4: Slicer + Pacing Validator</p>
                      <p className="text-slate-500 mt-0.5">Caps daily load at 150 mins with 15-30m micro-tasks.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900">Agent 3: OpenAlex &amp; Wikipedia Curator</p>
                      <p className="text-slate-500 mt-0.5">Pairs verified open-access literature directly to modules.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900">On-Chain Proof Ledger</p>
                      <p className="text-slate-500 mt-0.5">Deterministic keccak256 commitment signed via MetaMask.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand-600" />
                  15-30m micro-tasks
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5 text-brand-600" />
                  Zero-guilt auto reschedule
                </span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SyllabusUploader onRoadmapGenerated={handleRoadmapGenerated} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
