"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Cpu,
} from "lucide-react";
import { Button } from "@/client/components/common/Button";
import { Card } from "@/client/components/common/Card";
import { SyllabusDropzone } from "./SyllabusDropzone";
import { CoursePresets, PRESET_COURSES, PresetCourse } from "./CoursePresets";
import { CuratedResource, Roadmap, SyllabusExtraction } from "@/shared/types/roadmap";

interface SyllabusUploaderProps {
  onRoadmapGenerated: (roadmap: Roadmap) => void;
}

type PipelineStage = "idle" | "extracting" | "planning" | "curating" | "done";

export function SyllabusUploader({ onRoadmapGenerated }: SyllabusUploaderProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "paste" | "presets">("presets");
  const [syllabusText, setSyllabusText] = useState(PRESET_COURSES[0].text);
  const [courseTitle, setCourseTitle] = useState(PRESET_COURSES[0].title);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_COURSES[0].id);
  const [fileName, setFileName] = useState<string>("");
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [includeRestDays, setIncludeRestDays] = useState<boolean>(true);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isGenerating = stage !== "idle" && stage !== "done";

  const handleSelectPreset = (preset: PresetCourse) => {
    setSelectedPresetId(preset.id);
    setSyllabusText(preset.text);
    setCourseTitle(preset.title);
    setFileName("");
  };

  const handleExtractedText = (text: string, name: string) => {
    setSyllabusText(text);
    setFileName(name);
    setSelectedPresetId("");
    const detectedTitle = name.replace(/\.(pdf|docx|pptx|txt)$/i, "").replace(/[-_]/g, " ");
    setCourseTitle(detectedTitle);
  };

  const handleClearFile = () => {
    setFileName("");
    setSyllabusText("");
    setCourseTitle("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusText.trim()) {
      setErrorMessage("Please upload a PDF/DOCX/PPTX file, select a preset course, or paste your syllabus content.");
      return;
    }

    setErrorMessage(null);

    try {
      setStage("extracting");
      const extractRes = await fetch("/api/agents/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabusText,
          courseTitle: courseTitle.trim() || undefined,
        }),
      });

      if (!extractRes.ok) {
        throw new Error("Agent 1 extraction failed");
      }
      const extraction: SyllabusExtraction = await extractRes.json();

      setStage("planning");
      const planRes = await fetch("/api/agents/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction,
          syllabusText,
          dailyHoursLimit: dailyHours,
          includeRestDays,
        }),
      });

      if (!planRes.ok) {
        throw new Error("Agent 2 planning failed");
      }
      const roadmap: Roadmap = await planRes.json();

      setStage("curating");
      let resources: CuratedResource[] = [];
      try {
        const curateRes = await fetch("/api/agents/curate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roadmapId: roadmap.id,
            modules: extraction.modules,
          }),
        });
        if (curateRes.ok) {
          const data = await curateRes.json();
          resources = Array.isArray(data.resources) ? data.resources : [];
        }
      } catch {
        // Curated references are non-blocking enhancements
      }

      setStage("done");
      onRoadmapGenerated({
        ...roadmap,
        curatedResources: resources,
      });
    } catch {
      setErrorMessage("Network fallback active: generating offline heuristic roadmap...");
      const { generateHeuristicRoadmap } = await import("@/server/services/pacing.service");
      const fallbackRoadmap = generateHeuristicRoadmap(syllabusText, {
        courseTitle: courseTitle.trim() || "Course Roadmap",
        targetDays: 14,
        dailyHoursLimit: dailyHours,
        includeRestDays,
      });
      setStage("idle");
      onRoadmapGenerated(fallbackRoadmap);
    }
  };

  const agentSteps = [
    {
      key: "extracting",
      label: "Agent 1: Syllabus Extractor",
      detail: "Extracting modules, topics, and hard deadlines",
    },
    {
      key: "planning",
      label: "Agent 2 & 4: Micro-Task Planner",
      detail: "Slicing into 15-30m tasks and validating daily cap",
    },
    {
      key: "curating",
      label: "Agent 3: OpenAlex Material Curator",
      detail: "Fetching open-access papers and concept references",
    },
  ];

  const stageOrder: Record<PipelineStage, number> = {
    idle: 0,
    extracting: 1,
    planning: 2,
    curating: 3,
    done: 4,
  };

  return (
    <Card className="max-w-4xl mx-auto border-slate-200 shadow-md">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Generate Anti-Burnout Study Roadmap
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Three specialized AI agents decompose your syllabus into 15-30 minute micro-tasks with curated scholarly sources.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 shrink-0">
          <Cpu className="h-3.5 w-3.5" />
          <span>3-Agent Pipeline</span>
        </span>
      </div>

      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "presets"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Quick Presets</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "pdf"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("paste")}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "paste"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Text</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "presets" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Sample Course
            </label>
            <CoursePresets onSelectPreset={handleSelectPreset} selectedId={selectedPresetId} />
          </div>
        )}

        {activeTab === "pdf" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Syllabus Document
            </label>
            <SyllabusDropzone
              onExtractedText={handleExtractedText}
              currentFileName={fileName}
              onClear={handleClearFile}
            />
          </div>
        )}

        {activeTab === "paste" && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Syllabus or Assignment Rubric Text
            </label>
            <textarea
              rows={6}
              value={syllabusText}
              onChange={(e) => {
                setSyllabusText(e.target.value);
                setSelectedPresetId("");
              }}
              placeholder="Paste schedule, reading list, weekly milestones, or assignment specs here..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g. CS 161 Algorithms"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Max Daily Study Limit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
              <span className="text-xs font-semibold text-slate-700 w-14 text-right">
                {dailyHours} hrs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Hard-capped at 150 min/day</p>
          </div>

          <div className="flex flex-col justify-between">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pacing Preferences
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeRestDays}
                onChange={(e) => setIncludeRestDays(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Include weekly rest days</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1">Active recovery to sustain focus</p>
          </div>
        </div>

        {isGenerating && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-800">
              Live Multi-Agent Execution
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {agentSteps.map((step, idx) => {
                const currentNum = stageOrder[stage];
                const stepNum = idx + 1;
                const isDone = currentNum > stepNum;
                const isActive = currentNum === stepNum;

                return (
                  <div
                    key={step.key}
                    className={`rounded-lg border p-3 transition-colors ${
                      isActive
                        ? "border-brand-500 bg-white shadow-xs"
                        : isDone
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 bg-white/60 opacity-65"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{step.label}</span>
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 text-brand-600 animate-spin shrink-0" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500">{step.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>15-30m micro-task validator active</span>
          </div>

          <Button type="submit" size="lg" isLoading={isGenerating} className="w-full sm:w-auto">
            <Calendar className="w-4 h-4" />
            <span>{isGenerating ? "Running Agents..." : "Launch Agent Pipeline"}</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
