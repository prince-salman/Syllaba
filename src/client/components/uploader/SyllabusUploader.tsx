"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, Sparkles, Clock, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/client/components/common/Button";
import { Card } from "@/client/components/common/Card";
import { SyllabusDropzone } from "./SyllabusDropzone";
import { CoursePresets, PRESET_COURSES, PresetCourse } from "./CoursePresets";
import { GenerationRequest, Roadmap } from "@/shared/types/roadmap";

interface SyllabusUploaderProps {
  onRoadmapGenerated: (roadmap: Roadmap) => void;
}

export function SyllabusUploader({ onRoadmapGenerated }: SyllabusUploaderProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "paste" | "presets">("presets");
  const [syllabusText, setSyllabusText] = useState(PRESET_COURSES[0].text);
  const [courseTitle, setCourseTitle] = useState(PRESET_COURSES[0].title);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_COURSES[0].id);
  const [fileName, setFileName] = useState<string>("");
  const [targetDays, setTargetDays] = useState<number>(14);
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [includeRestDays, setIncludeRestDays] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const detectedTitle = name.replace(/\.(pdf|txt)$/i, "").replace(/[-_]/g, " ");
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
      setErrorMessage("Please upload a PDF, select a preset course, or paste your syllabus content.");
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const payload: GenerationRequest = {
        syllabusText,
        courseTitle: courseTitle.trim() || undefined,
        dailyHoursLimit: dailyHours,
        includeRestDays,
      };

      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to process syllabus.");
      }

      const roadmap: Roadmap = await res.json();
      onRoadmapGenerated(roadmap);
    } catch {
      setErrorMessage("An error occurred during generation. Falling back to local offline heuristic...");
      const { generateHeuristicRoadmap } = await import("@/server/services/pacing.service");
      const fallbackRoadmap = generateHeuristicRoadmap(syllabusText, {
        courseTitle: courseTitle.trim() || "Course Roadmap",
        targetDays,
        dailyHoursLimit: dailyHours,
        includeRestDays,
      });
      onRoadmapGenerated(fallbackRoadmap);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-slate-200 shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Generate Anti-Burnout Study Roadmap
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Turn dense syllabi and assignment instructions into paced, achievable daily micro-tasks.
        </p>
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
          <span>Upload PDF</span>
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
            <CoursePresets
              onSelectPreset={handleSelectPreset}
              selectedId={selectedPresetId}
            />
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Course Title
            </label>
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
                max={4}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
              <span className="text-xs font-semibold text-slate-700 w-12 text-right">
                {dailyHours} hrs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Prevents cognitive burnout</p>
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

        {errorMessage && (
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Anti-burnout scheduling enabled</span>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isGenerating}
            className="w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4" />
            <span>{isGenerating ? "Synthesizing Roadmap..." : "Generate Study Roadmap"}</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
