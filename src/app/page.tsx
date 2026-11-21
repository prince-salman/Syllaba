"use client";

import React, { useState, useEffect } from "react";
import { Roadmap } from "@/shared/types/roadmap";
import { SyllabusUploader } from "@/client/components/uploader/SyllabusUploader";
import { RoadmapTimeline } from "@/client/components/roadmap/RoadmapTimeline";
import { getActiveRoadmap, saveRoadmap, getStoredRoadmaps, setActiveRoadmapId } from "@/client/utils/storage";
import { BookOpen, Cpu, ShieldCheck, CheckCircle2 } from "lucide-react";

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
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
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-medium text-brand-800 mb-4">
              <Cpu className="w-3.5 h-3.5" />
              <span>Multi-Agent Academic Pacing &amp; On-Chain Proof</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Turn Overwhelming Syllabi Into Verified 15-Minute Daily Roadmaps
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Upload course syllabi or rubrics. Syllaba extracts modules, slices deep work into anti-burnout micro-tasks, curates open-access scholarly references, and anchors study commitments on-chain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">15-30m Micro-Task Slicing</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Deterministic TypeScript validator caps daily study at 150 minutes with rest intervals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">OpenAlex &amp; Wikipedia Curator</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically matches verified open-access research papers to each course module.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Cryptographic Study Proof</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sign verifiable study commitments with MetaMask on Base Sepolia and archive proofs.
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
