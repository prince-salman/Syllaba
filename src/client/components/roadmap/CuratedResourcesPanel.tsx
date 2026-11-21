"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CuratedResource,
  ExtractedModule,
  Roadmap,
} from "@/shared/types/roadmap";
import { LatexText } from "@/client/components/common/LatexText";
import { useLanguage } from "@/client/context/LanguageContext";
import { getWorkspaceCopy } from "@/client/i18n/workspaceCopy";
import {
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface CuratedResourcesPanelProps {
  resources: CuratedResource[];
  roadmap?: Roadmap;
  onUpdateResources?: (resources: CuratedResource[]) => void;
}

export function CuratedResourcesPanel({
  resources,
  roadmap,
  onUpdateResources,
}: CuratedResourcesPanelProps) {
  const { lang } = useLanguage();
  const wcopy = getWorkspaceCopy(lang);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const autoRefreshedKey = useRef<string | null>(null);

  // Extract slide modules directly from the roadmap (modulesSummary + dailySchedules tasks)
  const pptSlideModules = useMemo<
    Array<{
      slideTitle: string;
      description: string;
      bullets: string[];
      dayNumber?: number;
    }>
  >(() => {
    if (!roadmap) return [];

    const tasks = roadmap.dailySchedules.flatMap((d) => d.tasks);
    if (tasks.length > 0) {
      const groupedMap = new Map<
        string,
        {
          slideTitle: string;
          description: string;
          bullets: string[];
          dayNumber?: number;
        }
      >();

      for (const t of tasks) {
        const key = (t.moduleTitle || t.title).trim();
        const existing = groupedMap.get(key);
        const subtaskTitles = (t.subtasks || []).map((s) => s.title);
        if (!existing) {
          groupedMap.set(key, {
            slideTitle: key,
            description: t.description || t.title,
            bullets:
              subtaskTitles.length > 0 ? subtaskTitles : [t.description || t.title],
            dayNumber: t.dayNumber,
          });
        } else {
          for (const st of subtaskTitles) {
            if (!existing.bullets.includes(st)) {
              existing.bullets.push(st);
            }
          }
        }
      }
      return Array.from(groupedMap.values());
    }

    return (roadmap.modulesSummary || []).map((m) => ({
      slideTitle: m.title,
      description: (m.topics || [])[0] || m.title,
      bullets: m.topics || [],
    }));
  }, [roadmap]);

  const handleRecurateFromPpt = async () => {
    if (!roadmap || isRefreshing) return;

    const modulesToCurate: ExtractedModule[] =
      roadmap.modulesSummary && roadmap.modulesSummary.length > 0
        ? roadmap.modulesSummary
        : pptSlideModules.map((s) => ({
            title: s.slideTitle,
            topics: s.bullets,
          }));

    if (modulesToCurate.length === 0) return;

    const synthesizedPptText = pptSlideModules
      .map(
        (s) =>
          `${s.slideTitle}\n${s.description}\n${s.bullets.map((b) => `- ${b}`).join("\n")}`
      )
      .join("\n\n");

    setIsRefreshing(true);
    try {
      const res = await fetch("/api/agents/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          courseTitle: roadmap.courseTitle,
          syllabusText: synthesizedPptText,
          language: lang,
          modules: modulesToCurate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.resources) && onUpdateResources) {
          onUpdateResources(data.resources);
        }
      }
    } catch {
      // Keep existing resources on error
    } finally {
      setIsRefreshing(false);
    }
  };

  // Automatically curate AI PPT reading guides whenever missing ai_notes or switching roadmap
  useEffect(() => {
    if (!roadmap || !onUpdateResources) return;
    const key = `${roadmap.id}:${lang}`;
    if (autoRefreshedKey.current === key) return;

    const hasAiNotes =
      Array.isArray(resources) &&
      resources.some((r) => r.sourceType === "ai_notes");

    if (!hasAiNotes && pptSlideModules.length > 0) {
      autoRefreshedKey.current = key;
      void handleRecurateFromPpt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap?.id, lang]);

  const aiReadingGuides = useMemo(
    () => (resources || []).filter((r) => r.sourceType === "ai_notes"),
    [resources]
  );

  const externalResources = useMemo(
    () => (resources || []).filter((r) => r.sourceType !== "ai_notes"),
    [resources]
  );

  const groupedExternal = useMemo(() => {
    return externalResources.reduce<Record<string, CuratedResource[]>>(
      (acc, item) => {
        const key = item.moduleTopic || roadmap?.courseTitle || "PPT References";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {}
    );
  }, [externalResources, roadmap?.courseTitle]);

  return (
    <div className="space-y-5">
      {/* Header Banner with Re-Sync AI Materials from PPT Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#FACC15]/50 bg-[#FFFDF5] px-4 py-3.5 shadow-2xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[#FACC15]">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#111111]">
              {wcopy.materialsHeaderTitle}
            </h3>
            <p className="text-[11px] text-[#666660]">
              {wcopy.materialsHeaderDesc}
            </p>
          </div>
        </div>

        {roadmap && (
          <button
            type="button"
            disabled={isRefreshing}
            onClick={handleRecurateFromPpt}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#111111] text-[#FACC15] hover:bg-slate-800 px-3.5 py-2 text-xs font-extrabold shrink-0 transition cursor-pointer disabled:opacity-60"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{wcopy.syncingMaterialsBtn}</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{wcopy.syncMaterialsBtn}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* SECTION 1: AI READING COMPANION & SLIDE FORMULAS SYNTHESIZED FROM THE UPLOADED PPT */}
      {(aiReadingGuides.length > 0 || pptSlideModules.length > 0) && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#111111]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                {wcopy.section1Title(
                  aiReadingGuides.length > 0
                    ? aiReadingGuides.length
                    : pptSlideModules.length
                )}
              </h4>
            </div>
            <span className="rounded-full bg-[#FEF3C7] border border-[#FACC15]/50 px-2.5 py-0.5 text-[10px] font-bold text-[#111111]">
              {wcopy.section1Badge}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {aiReadingGuides.length > 0
              ? aiReadingGuides.map((guide, idx) => {
                  const cleanQuery = guide.moduleTopic
                    .replace(
                      /^(slide|page|halaman)\s*\d+(?:\s*[-–]\s*\d+)?\s*[—:-]?\s*/i,
                      ""
                    )
                    .replace(/\$[^$]*\$/g, "")
                    .trim();
                  const scholarQuery = encodeURIComponent(
                    `${cleanQuery} ${roadmap?.courseTitle || ""}`.trim()
                  );

                  return (
                    <div
                      key={guide.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#111111] text-[#FACC15] px-2 py-0.5 text-[11px] font-extrabold">
                            <Sparkles className="w-3 h-3" />
                            <span>{wcopy.aiNotesBadge}</span>
                          </span>
                          <h5 className="text-sm font-extrabold text-slate-900">
                            <LatexText text={guide.title || `${idx + 1}. ${guide.moduleTopic}`} />
                          </h5>
                        </div>

                        <a
                          href={`https://scholar.google.com/scholar?q=${scholarQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#FEF3C7]/60 px-2.5 py-1 text-[11px] font-bold text-slate-800 transition"
                        >
                          <span>{wcopy.searchPaperBtn}</span>
                          <ExternalLink className="h-3 w-3 text-slate-500" />
                        </a>
                      </div>

                      <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] border-l-4 border-l-[#FACC15] p-3 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                        <LatexText text={guide.summary || guide.moduleTopic} />
                      </div>
                    </div>
                  );
                })
              : pptSlideModules.map((slide, idx) => {
                  const cleanSearchTerm = slide.slideTitle
                    .replace(
                      /^(slide|page|halaman)\s*\d+(?:\s*[-–]\s*\d+)?\s*[—:-]?\s*/i,
                      ""
                    )
                    .replace(/\$[^$]*\$/g, "")
                    .trim();
                  const scholarQuery = encodeURIComponent(
                    `${cleanSearchTerm} ${roadmap?.courseTitle || ""}`.trim()
                  );

                  return (
                    <div
                      key={`${slide.slideTitle}-${idx}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[#111111] text-[#FACC15] px-2 py-0.5 text-[11px] font-extrabold">
                            {slide.dayNumber
                              ? wcopy.dayLabel(slide.dayNumber)
                              : `#${idx + 1}`}
                          </span>
                          <h5 className="text-sm font-extrabold text-slate-900">
                            <LatexText text={slide.slideTitle} />
                          </h5>
                        </div>

                        <a
                          href={`https://scholar.google.com/scholar?q=${scholarQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#FEF3C7]/60 px-2.5 py-1 text-[11px] font-bold text-slate-800 transition"
                        >
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          <span>{wcopy.searchPaperBtn}</span>
                          <ExternalLink className="h-3 w-3 text-slate-500" />
                        </a>
                      </div>

                      {slide.description && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-[#FFFDF8] border border-[#E5E5E0] rounded-xl p-2.5">
                          <LatexText text={slide.description} />
                        </p>
                      )}

                      {slide.bullets.length > 0 && (
                        <ul className="space-y-1.5 pl-1">
                          {slide.bullets.slice(0, 4).map((b, bIdx) => (
                            <li
                              key={bIdx}
                              className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                            >
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#111111] shrink-0" />
                              <span>
                                <LatexText text={b} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* SECTION 2: VERIFIED OPEN-ACCESS PAPERS (OPENALEX) & CONCEPT ENCYCLOPEDIA */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#111111]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {wcopy.section2Title}
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {wcopy.verifiedSourcesCount(externalResources.length)}
          </span>
        </div>

        {externalResources.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-2">
            <p className="text-xs text-slate-600">
              {isRefreshing
                ? wcopy.emptyMaterialsSyncing
                : wcopy.emptyMaterialsIdle}
            </p>
          </div>
        ) : (
          Object.entries(groupedExternal).map(([topic, items]) => (
            <div
              key={topic}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
            >
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold text-slate-800">
                  <LatexText text={topic} />
                </h4>
                <span className="text-[11px] font-medium text-slate-500 shrink-0">
                  {wcopy.verifiedSourcesCount(items.length)}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                            resource.sourceType === "openalex"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {resource.sourceType === "openalex" ? (
                            <GraduationCap className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          <span>
                            {resource.sourceType === "openalex"
                              ? wcopy.openAlexBadge
                              : wcopy.wikiBadge}
                          </span>
                        </span>
                        {resource.year && (
                          <span className="text-[11px] font-medium text-slate-400">
                            {resource.year}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                        <LatexText text={resource.title} />
                      </p>

                      {resource.summary && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <LatexText text={resource.summary} />
                        </p>
                      )}
                    </div>

                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-amber-600 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
