"use client";

import React from "react";
import { CuratedResource } from "@/shared/types/roadmap";
import { BookOpen, ExternalLink, GraduationCap, Globe } from "lucide-react";

interface CuratedResourcesPanelProps {
  resources: CuratedResource[];
}

export function CuratedResourcesPanel({ resources }: CuratedResourcesPanelProps) {
  if (!resources || resources.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <BookOpen className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">No Curated Materials Yet</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Generate a roadmap through the multi-agent pipeline to fetch verified Open-Access scholarly papers from OpenAlex and conceptual guides from Wikipedia.
        </p>
      </div>
    );
  }

  const grouped = resources.reduce<Record<string, CuratedResource[]>>((acc, item) => {
    const key = item.moduleTopic || "General Course References";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="h-4 w-4 text-brand-700 shrink-0" />
          <p className="text-xs font-medium text-brand-900">
            Agent 3 autonomously verified {resources.length} open-access references matched to your syllabus modules.
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([topic, items]) => (
        <div key={topic} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {topic}
            </h4>
            <span className="text-[11px] font-medium text-slate-500">
              {items.length} sources
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
                        {resource.sourceType === "openalex" ? "OpenAlex Paper" : "Wikipedia Concept"}
                      </span>
                    </span>
                    {resource.year && (
                      <span className="text-[11px] font-medium text-slate-400">
                        {resource.year}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {resource.title}
                  </p>

                  {resource.summary && (
                    <p className="text-xs text-slate-500 line-clamp-2">{resource.summary}</p>
                  )}
                </div>

                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-600 mt-1" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
