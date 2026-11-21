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
import { useLanguage } from "@/client/context/LanguageContext";
import { getWorkspaceCopy } from "@/client/i18n/workspaceCopy";

function getLocalTodayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface SyllabusUploaderProps {
  onRoadmapGenerated: (roadmap: Roadmap) => void;
}

type PipelineStage = "idle" | "extracting" | "planning" | "curating" | "done";

const PRESET_DAYS = [1, 7, 14, 21, 30] as const;

export function SyllabusUploader({ onRoadmapGenerated }: SyllabusUploaderProps) {
  const { lang, copy } = useLanguage();
  const wcopy = getWorkspaceCopy(lang);
  const [activeTab, setActiveTab] = useState<"pdf" | "paste" | "presets">("presets");
  const [syllabusText, setSyllabusText] = useState(PRESET_COURSES[0].text);
  const [courseTitle, setCourseTitle] = useState(PRESET_COURSES[0].title);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_COURSES[0].id);
  const [fileName, setFileName] = useState<string>("");
  const [targetDays, setTargetDays] = useState<number>(14);
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
          language: lang,
        }),
      });

      if (!extractRes.ok) {
        throw new Error("Agent 1 extraction failed");
      }
      const extraction: SyllabusExtraction = await extractRes.json();

      setStage("planning");
      const normalizedDays = Math.max(1, Math.min(60, Math.round(targetDays || 14)));
      const clientStartDate = getLocalTodayYmd();
      const planRes = await fetch("/api/agents/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction,
          syllabusText,
          targetDays: normalizedDays,
          dailyHoursLimit: dailyHours,
          includeRestDays,
          language: lang,
          clientStartDate,
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
            courseTitle: roadmap.courseTitle,
            syllabusText,
            language: lang,
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
      const normalizedDays = Math.max(1, Math.min(60, Math.round(targetDays || 14)));
      const fallbackRoadmap = generateHeuristicRoadmap(syllabusText, {
        courseTitle: courseTitle.trim() || "Course Roadmap",
        targetDays: normalizedDays,
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
      label: wcopy.agent1Label,
      detail: wcopy.agent1Detail,
    },
    {
      key: "planning",
      label: wcopy.agent2Label,
      detail: wcopy.agent2Detail,
    },
    {
      key: "curating",
      label: wcopy.agent3Label,
      detail: wcopy.agent3Detail,
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
    <Card className="w-full max-w-4xl mx-auto p-4 sm:p-5 border-slate-200 shadow-md overflow-hidden">
      <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {wcopy.uploaderTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {wcopy.uploaderSubtitle}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800 shrink-0">
          <Cpu className="h-3.5 w-3.5" />
          <span>{wcopy.pipelineBadge}</span>
        </span>
      </div>

      <div className="flex border-b border-slate-200 mb-5 sm:mb-6 gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex items-center gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "presets"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{wcopy.tabPresets}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={`flex items-center gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "pdf"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <UploadCloud className="w-4 h-4 shrink-0" />
          <span>{wcopy.tabUploadFile}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("paste")}
          className={`flex items-center gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 px-2.5 sm:px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "paste"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>{wcopy.tabPasteText}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "presets" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {wcopy.selectSampleCourse}
            </label>
            <CoursePresets onSelectPreset={handleSelectPreset} selectedId={selectedPresetId} />
          </div>
        )}

        {activeTab === "pdf" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {wcopy.syllabusDocLabel}
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
              {wcopy.pasteSyllabusLabel}
            </label>
            <textarea
              rows={6}
              value={syllabusText}
              onChange={(e) => {
                setSyllabusText(e.target.value);
                setSelectedPresetId("");
              }}
              placeholder={wcopy.pastePlaceholder}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {wcopy.courseTitleLabel}
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder={wcopy.courseTitlePlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-xs font-medium text-slate-700">
                {wcopy.totalDurationLabel}
              </label>
              <div className="flex items-center gap-1">
                {PRESET_DAYS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetDays(preset)}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                      targetDays === preset
                        ? "bg-[#111111] text-[#FACC15]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {preset}d
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={targetDays}
                onChange={(e) => setTargetDays(parseInt(e.target.value, 10) || 1)}
                className="w-full accent-[#111111]"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={targetDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!Number.isNaN(val)) {
                      setTargetDays(Math.max(1, Math.min(60, val)));
                    }
                  }}
                  aria-label="Custom study days"
                  className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[11px] font-medium text-slate-500">
                  {copy.daysWord}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {wcopy.customDurationHint(copy.daysWord)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {wcopy.maxDailyLimitLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-[#111111]"
              />
              <span className="text-xs font-semibold text-slate-700 w-14 text-right shrink-0">
                {dailyHours} {wcopy.hrsSuffix}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{wcopy.hardCapHint}</p>
          </div>

          <div className="flex flex-col justify-between">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {wcopy.pacingPrefsLabel}
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeRestDays}
                onChange={(e) => setIncludeRestDays(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{wcopy.includeRestDaysLabel}</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1">{wcopy.restDaysHint}</p>
          </div>
        </div>

        {isGenerating && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-800">
              {wcopy.liveExecutionTitle}
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
            <span>{wcopy.validatorActive}</span>
          </div>

          <Button type="submit" size="lg" isLoading={isGenerating} className="w-full sm:w-auto">
            <Calendar className="w-4 h-4" />
            <span>{isGenerating ? wcopy.runningAgentsBtn : wcopy.launchPipelineBtn}</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
