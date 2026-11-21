"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Roadmap } from "@/shared/types/roadmap";
import { AppLanguage, useLanguage } from "@/client/context/LanguageContext";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Globe,
  HelpCircle,
  KeyRound,
  Mail,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  User as UserIcon,
  Wallet,
} from "lucide-react";

interface HistoryPanelProps {
  roadmaps: Roadmap[];
  activeRoadmapId?: string | null;
  onSelectRoadmap: (roadmapId: string) => void;
  onCreateNew: () => void;
}

export function HistoryPanel({
  roadmaps,
  activeRoadmapId,
  onSelectRoadmap,
  onCreateNew,
}: HistoryPanelProps) {
  const { lang } = useLanguage();
  const isId = lang === "id";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111111]">
            {isId ? "Riwayat Roadmap & Sesi Belajar" : "Study & Roadmap History"}
          </h2>
          <p className="text-xs text-[#666660] mt-0.5">
            {isId
              ? "Pilih kursus sebelumnya untuk melanjutkan progres atau melihat bukti on-chain."
              : "Reopen any generated syllabus roadmap to continue micro-tasks or inspect proofs."}
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isId ? "Buat Silabus Baru" : "New Syllabus"}</span>
        </button>
      </div>

      {roadmaps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D4D4D0] bg-[#FFFDF8] p-8 text-center space-y-3">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#111111]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111111]">
              {isId ? "Belum ada riwayat roadmap" : "No study history yet"}
            </p>
            <p className="text-xs text-[#666660] mt-1">
              {isId
                ? "Unggah silabus pertama Anda untuk membuat roadmap micro-task anti-burnout."
                : "Upload your first course syllabus to build a verified anti-burnout roadmap."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] px-4 py-2 text-xs font-semibold text-white hover:bg-[#262626] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isId ? "Unggah Silabus" : "Upload Syllabus"}</span>
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
              ? new Date(rm.updatedAt).toLocaleDateString(isId ? "id-ID" : "en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
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
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#111111] truncate">
                        {rm.courseTitle}
                      </h3>
                      <p className="text-[11px] text-[#666660] mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-[#111111]" />
                        <span>
                          {isId ? "Diperbarui" : "Updated"} {updatedLabel} · {rm.totalDays}{" "}
                          {isId ? "hari" : "days"}
                        </span>
                      </p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#111111]">
                        {isId ? "Aktif" : "Active"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-[#52524C]">
                        {completed}/{total} {isId ? "micro-task selesai" : "tasks completed"}
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
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#111111] hover:text-white hover:border-[#111111] py-2 text-xs font-semibold text-[#111111] transition cursor-pointer"
                >
                  <span>{isId ? "Buka Roadmap" : "Open Roadmap"}</span>
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
  const { lang, setLang } = useLanguage();
  const isId = lang === "id";

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
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullNameInput.trim() },
      });
      if (error) {
        setAccountNotice(error.message);
      } else {
        setAccountNotice(
          isId ? "Nama profil berhasil diperbarui." : "Profile name updated successfully."
        );
      }
    } catch {
      setAccountNotice(
        isId ? "Gagal menyimpan perubahan profil." : "Could not save profile changes."
      );
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111111]">
            {isId ? "Pengaturan" : "Settings"}
          </h2>
          <p className="text-xs text-[#666660] mt-0.5">
            {isId
              ? "Kelola preferensi akun pelajar, wallet Web3, dan bahasa aplikasi."
              : "Manage your student account, connected Web3 wallet, and interface language."}
          </p>
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
            <span>{isId ? "Akun" : "Account"}</span>
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
            <span>{isId ? "Bahasa" : "Language"}</span>
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
                  {isId ? "Profil Akun" : "Account Profile"}
                </h3>
                <p className="text-[11px] text-[#666660]">
                  {isId
                    ? "Autentikasi tersinkron dengan Supabase"
                    : "Synced with Supabase authentication"}
                </p>
              </div>
            </div>

            {user ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#52524C] mb-1">
                    {isId ? "Nama Lengkap" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder={isId ? "Masukkan nama Anda" : "Enter your name"}
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {savingName
                      ? isId
                        ? "Menyimpan..."
                        : "Saving..."
                      : isId
                      ? "Simpan Profil"
                      : "Save Profile"}
                  </span>
                </button>
              </form>
            ) : (
              <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-4 space-y-3">
                <p className="text-xs text-[#666660] leading-relaxed">
                  {isId
                    ? "Anda belum masuk ke akun Syllaba. Masuk untuk menyinkronkan riwayat silabus ke akun cloud pribadi Anda."
                    : "You are not signed in yet. Sign in to sync your study roadmaps and profile across devices."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-semibold text-white transition"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{isId ? "Masuk Sekarang" : "Sign In"}</span>
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E0] bg-white hover:bg-[#F7F7F5] px-4 py-2 text-xs font-semibold text-[#111111] transition"
                  >
                    <span>{isId ? "Daftar Akun" : "Register"}</span>
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
                  {isId ? "Koneksi Dompet Web3" : "Web3 Wallet Connection"}
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
                      isWalletConnected ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {isWalletConnected
                    ? isId
                      ? "Terhubung"
                      : "Connected"
                    : isId
                    ? "Belum terhubung"
                    : "Not connected"}
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
              <Wallet className="h-3.5 w-3.5 text-[#111111]" />
              <span>
                {isWalletConnected
                  ? isId
                    ? "Ganti / Kelola Wallet"
                    : "Manage / Switch Wallet"
                  : isId
                  ? "Hubungkan Wallet"
                  : "Connect Wallet"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9E9FD] text-[#4A4DC7]">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                {isId ? "Pilihan Bahasa Antarmuka" : "Interface Language"}
              </h3>
              <p className="text-[11px] text-[#666660]">
                {isId
                  ? "Perubahan langsung diterapkan ke menu dan ringkasan dashboard."
                  : "Changes apply immediately across navigation and dashboard cards."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  code: "en" as AppLanguage,
                  title: "English (US)",
                  desc: "Default hackathon and international academic interface",
                },
                {
                  code: "id" as AppLanguage,
                  title: "Bahasa Indonesia",
                  desc: "Tampilan dashboard dan panduan dalam Bahasa Indonesia",
                },
              ] as const
            ).map((opt) => {
              const selected = lang === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLang(opt.code)}
                  className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    selected
                      ? "border-[#111111] bg-[#FFFBEB] shadow-xs"
                      : "border-[#E5E5E0] bg-white hover:border-[#F5B700]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#111111]">{opt.title}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 text-[#111111]" />}
                  </div>
                  <p className="text-xs text-[#666660] mt-1">{opt.desc}</p>
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
  const { lang } = useLanguage();
  const isId = lang === "id";
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
        <h2 className="text-lg font-bold text-[#111111]">
          {isId ? "Bantuan & Hubungi Kami" : "Help & Contact Us"}
        </h2>
        <p className="text-xs text-[#666660] mt-0.5">
          {isId
            ? "Panduan cepat penggunaan multi-agent Syllaba, koneksi Web3, serta kontak tim ITSPIRIT."
            : "Quick answers on multi-agent pacing, Base Sepolia proofs, and contacting Team ITSPIRIT."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#111111]" />
            <h3 className="text-sm font-bold text-[#111111]">
              {isId ? "Pertanyaan Umum (FAQ)" : "Frequently Asked Questions"}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-3">
              <p className="font-bold text-[#111111]">
                {isId
                  ? "Bagaimana cara menghubungkan dompet di HP tanpa ekstensi?"
                  : "How do I connect a mobile wallet without a browser extension?"}
              </p>
              <p className="text-[#666660] mt-1 leading-relaxed">
                {isId
                  ? "Klik Connect Wallet di kanan atas, pilih Rainbow atau WalletConnect, lalu pindai kode QR langsung dari aplikasi dompet HP Anda."
                  : "Click Connect Wallet in the top bar, choose Rainbow or WalletConnect, and scan the inline QR code from your mobile wallet app."}
              </p>
            </div>

            <div className="rounded-xl bg-[#FFFDF8] border border-[#E5E5E0] p-3">
              <p className="font-bold text-[#111111]">
                {isId
                  ? "Apakah bukti komitmen belajar tercatat di blockchain?"
                  : "Are study commitments verified on-chain?"}
              </p>
              <p className="text-[#666660] mt-1 leading-relaxed">
                {isId
                  ? "Ya. Hash keccak256 roadmap Anda dicatat melalui kontrak SyllabaProofVault di Base Sepolia (Chain ID 84532) dan dapat dicek di BaseScan."
                  : "Yes. Your canonical keccak256 roadmap digest is anchored via SyllabaProofVault on Base Sepolia (Chain ID 84532) with direct BaseScan links."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#111111]" />
            <h3 className="text-sm font-bold text-[#111111]">
              {isId ? "Hubungi Tim Syllaba (ITSPIRIT)" : "Contact Syllaba Team (ITSPIRIT)"}
            </h3>
          </div>

          <div className="rounded-xl bg-[#F7F7F5] p-3 text-xs space-y-1.5">
            <p className="flex items-center gap-2 text-[#111111] font-semibold">
              <Mail className="h-3.5 w-3.5 text-[#111111]" />
              <span>support@syllaba.xyz</span>
            </p>
            <p className="flex items-center gap-2 text-[#666660]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#111111]" />
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
              placeholder={
                isId
                  ? "Tulis pertanyaan, kendala domain/wallet, atau masukan Anda..."
                  : "Write your question, issue report, or feedback..."
              }
              className="w-full rounded-xl border border-[#E5E5E0] bg-[#FFFDF8] p-3 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
            />
            {sent && (
              <p className="rounded-xl bg-[#FEF3C7] px-3 py-2 text-xs font-semibold text-[#111111]">
                {isId
                  ? "Pesan Anda telah dicatat. Tim ITSPIRIT akan menindaklanjuti segera."
                  : "Message received. Team ITSPIRIT will review and respond promptly."}
              </p>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#111111] hover:bg-[#262626] px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isId ? "Kirim Pesan" : "Send Message"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
