"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Roadmap } from "@/shared/types/roadmap";
import { useLanguage } from "@/client/context/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/client/i18n/translations";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";
import { updatePublicUserProfileName } from "@/client/utils/usersSync";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Globe,
  HelpCircle,
  KeyRound,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Wallet,
  X,
} from "lucide-react";

interface HistoryPanelProps {
  roadmaps: Roadmap[];
  activeRoadmapId?: string | null;
  onSelectRoadmap: (roadmapId: string) => void;
  onRenameRoadmap?: (roadmapId: string, newTitle: string) => void;
  onDeleteRoadmap?: (roadmapId: string) => void;
  onCreateNew: () => void;
}

export function HistoryPanel({
  roadmaps,
  activeRoadmapId,
  onSelectRoadmap,
  onRenameRoadmap,
  onDeleteRoadmap,
  onCreateNew,
}: HistoryPanelProps) {
  const { lang, copy } = useLanguage();
  const localeMeta = LANGUAGE_OPTIONS.find((l) => l.code === lang);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111111]">{copy.historyTitle}</h2>
          <p className="text-xs text-[#666660] mt-0.5">{copy.historyDesc}</p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-3.5 py-2 text-xs font-semibold text-[#FACC15] shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{copy.newSyllabus}</span>
        </button>
      </div>

      {roadmaps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D4D4D0] bg-[#FFFDF8] p-8 text-center space-y-3">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#111111]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111111]">{copy.noHistory}</p>
            <p className="text-xs text-[#666660] mt-1">{copy.noRoadmaps}</p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] px-4 py-2 text-xs font-semibold text-[#FACC15] hover:bg-[#262626] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{copy.newSyllabus}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmaps.map((rm) => {
            const total = rm.totalTasks || 0;
            const completed = rm.completedTasks || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isActive = activeRoadmapId === rm.id;
            const updatedLabel = rm.updatedAt
              ? new Date(rm.updatedAt).toLocaleDateString(
                  localeMeta?.intlLocale ?? "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )
              : rm.startDate;

            return (
              <div
                key={rm.id}
                className={`rounded-2xl border p-4 transition-all flex flex-col justify-between gap-4 ${
                  isActive
                    ? "border-[#111111]/40 bg-[#FFFBEB] shadow-xs"
                    : "border-[#E5E5E0] bg-white hover:border-[#F5B700]/60"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {editingId === rm.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (draftTitle.trim() && onRenameRoadmap) {
                              onRenameRoadmap(rm.id, draftTitle.trim());
                            }
                            setEditingId(null);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            autoFocus
                            className="w-full rounded-lg border border-[#111111]/30 bg-white px-2.5 py-1 text-xs font-bold text-[#111111] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#111111] text-[#FACC15] cursor-pointer"
                            title={copy.save}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7F7F5] text-[#666660] cursor-pointer"
                            title={copy.cancel}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      ) : (
                        <h3 className="text-sm font-bold text-[#111111] truncate">
                          {rm.courseTitle}
                        </h3>
                      )}
                      <p className="text-[11px] text-[#666660] mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-[#D97706]" />
                        <span>
                          {updatedLabel} · {rm.totalDays} {copy.daysWord}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && (
                        <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#111111]">
                          Active
                        </span>
                      )}
                      {onRenameRoadmap && editingId !== rm.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(rm.id);
                            setDraftTitle(rm.courseTitle);
                            setConfirmDeleteId(null);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#666660] hover:bg-[#FEF3C7] hover:text-[#111111] transition cursor-pointer"
                          title={copy.renameCourse}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDeleteRoadmap && (
                        confirmDeleteId === rm.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteRoadmap(rm.id);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white cursor-pointer"
                            >
                              {copy.deleteCourse}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg bg-[#F7F7F5] px-1.5 py-1 text-[10px] font-semibold text-[#52524C] cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(rm.id);
                              setEditingId(null);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#666660] hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                            title={copy.deleteCourse}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-[#52524C]">
                        {completed}/{total}
                      </span>
                      <span className="text-[#111111]">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E5E5E0] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#111111] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRoadmap(rm.id)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#111111] hover:text-[#FACC15] hover:border-[#111111] py-2 text-xs font-semibold text-[#111111] transition cursor-pointer"
                >
                  <span>{copy.openRoadmap}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SettingsPanelProps {
  activeSubTab: "account" | "language";
  onChangeSubTab: (tab: "account" | "language") => void;
  user: User | null;
  walletAddress: string | null;
  isWalletConnected: boolean;
  onOpenWalletModal: () => void;
}

export function SettingsPanel({
  activeSubTab,
  onChangeSubTab,
  user,
  walletAddress,
  isWalletConnected,
  onOpenWalletModal,
}: SettingsPanelProps) {
  const { lang, copy, setLang } = useLanguage();

  const initialFullName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || "";
  const [fullNameInput, setFullNameInput] = useState(initialFullName);
  const [savingName, setSavingName] = useState(false);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isSupabaseConfigured || !supabase) return;
    setSavingName(true);
    setAccountNotice(null);
    try {
      const cleanName = fullNameInput.trim();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: cleanName },
      });
      if (error) {
        setAccountNotice(error.message);
      } else {
        await updatePublicUserProfileName(`user_${user.id}`, cleanName);
        setAccountNotice("Profile updated.");
      }
    } catch {
      setAccountNotice("Could not save profile changes.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111111]">{copy.settingsTitle}</h2>
          <p className="text-xs text-[#666660] mt-0.5">{copy.settingsDesc}</p>
        </div>

        <div className="inline-flex rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChangeSubTab("account")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeSubTab === "account"
                ? "bg-white text-[#111111] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>{copy.account}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab("language")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeSubTab === "language"
                ? "bg-white text-[#111111] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{copy.language}</span>
          </button>
        </div>
      </div>

      {activeSubTab === "account" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#111111]">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  {copy.accountProfileTitle}
                </h3>
                <p className="text-[11px] text-[#666660]">Supabase Auth</p>
              </div>
            </div>

            {user ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#52524C] mb-1">
                    {copy.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E5E0] bg-[#FFFDF8] px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-xl bg-[#F7F7F5] p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#666660]">Email</span>
                    <span className="font-mono font-semibold text-[#111111] truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#666660]">User ID</span>
                    <span className="font-mono text-[11px] text-[#52524C] truncate">
                      {user.id}
                    </span>
                  </div>
                </div>

                {accountNotice && (
                  <p className="rounded-xl bg-[#FEF3C7]/70 px-3 py-2 text-xs font-semibold text-[#111111]">
                    {accountNotice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingName}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-semibold text-[#FACC15] transition cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{copy.saveProfile}</span>
                </button>
              </form>
            ) : (
              <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-4 space-y-3">
                <p className="text-xs text-[#666660] leading-relaxed">
                  {copy.guestSession}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-semibold text-[#FACC15] transition"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{copy.signIn}</span>
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#F7F7F5] px-4 py-2 text-xs font-semibold text-[#111111] transition"
                  >
                    <span>{copy.register}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCEBF7] text-[#235789]">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">
                  {copy.walletConnTitle}
                </h3>
                <p className="text-[11px] text-[#666660]">
                  Base Sepolia Testnet (Chain ID: 84532)
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#F7F7F5] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#666660]">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold ${
                    isWalletConnected ? "text-[#111111]" : "text-[#8B6B15]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isWalletConnected ? "bg-[#FACC15]" : "bg-amber-500"
                    }`}
                  />
                  {isWalletConnected ? copy.connected : copy.notConnected}
                </span>
              </div>
              {walletAddress && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#666660]">Address</span>
                  <span className="font-mono text-[11px] text-[#111111] truncate">
                    {walletAddress}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenWalletModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#F7F7F5] px-4 py-2 text-xs font-semibold text-[#111111] transition cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5 text-[#D97706]" />
              <span>{isWalletConnected ? copy.manageWallet : copy.connectWallet}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#111111]">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">{copy.langTitle}</h3>
              <p className="text-[11px] text-[#666660]">{copy.langDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LANGUAGE_OPTIONS.map((opt) => {
              const selected = lang === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLang(opt.code)}
                  className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    selected
                      ? "border-[#111111] bg-[#111111] text-white shadow-xs"
                      : "border-[#E5E5E0] bg-white text-[#111111] hover:border-[#F5B700]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                        selected
                          ? "bg-[#FACC15] text-[#111111]"
                          : "bg-[#F7F7F5] text-[#666660]"
                      }`}
                    >
                      {opt.shortCode}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1.5 ${
                      selected ? "text-[#E5E5E0]" : "text-[#666660]"
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpContactPanel() {
  const { copy } = useLanguage();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#111111]">{copy.helpTitle}</h2>
        <p className="text-xs text-[#666660] mt-0.5">{copy.helpDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#D97706]" />
            <h3 className="text-sm font-bold text-[#111111]">{copy.faqTitle}</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-3">
              <p className="font-bold text-[#111111]">{copy.step2Title}</p>
              <p className="text-[#666660] mt-1 leading-relaxed">{copy.step2Desc}</p>
            </div>

            <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-3">
              <p className="font-bold text-[#111111]">{copy.step3Title}</p>
              <p className="text-[#666660] mt-1 leading-relaxed">{copy.step3Desc}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#D97706]" />
            <h3 className="text-sm font-bold text-[#111111]">{copy.contactTitle}</h3>
          </div>

          <div className="rounded-xl bg-[#F7F7F5] p-3 text-xs space-y-1.5">
            <p className="flex items-center gap-2 text-[#111111] font-semibold">
              <Mail className="h-3.5 w-3.5 text-[#D97706]" />
              <span>support@syllaba.xyz</span>
            </p>
            <p className="flex items-center gap-2 text-[#666660]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#D97706]" />
              <span>COMPSPHERE 12 Finalist · Team ITSPIRIT (President University)</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (sent) setSent(false);
              }}
              placeholder={copy.helpDesc}
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#FFFDF8] p-3 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
            />
            {sent && (
              <p className="rounded-xl bg-[#FEF3C7] px-3 py-2 text-xs font-semibold text-[#111111]">
                {copy.messageSent}
              </p>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-semibold text-[#FACC15] transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{copy.sendMessage}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
