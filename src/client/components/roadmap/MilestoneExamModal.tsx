"use client";

import React, { Component, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ExamStage,
  ExamSubmission,
  MilestoneExam,
  RoadmapTask,
} from "@/shared/types/roadmap";
import { LatexText } from "@/client/components/common/LatexText";
import { useLanguage } from "@/client/context/LanguageContext";
import {
  Award,
  BrainCircuit,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

class ExamModalErrorBoundary extends Component<
  { children: React.ReactNode; onClose: () => void; isId: boolean },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void; isId: boolean }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-3 bg-white">
          <p className="text-sm font-bold text-slate-900">
            {this.props.isId
              ? "Terjadi kendala saat menampilkan hasil ujian."
              : "Something went wrong displaying the exam result."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onClose();
            }}
            className="rounded-xl bg-[#111111] text-[#FACC15] px-4 py-2 text-xs font-extrabold cursor-pointer"
          >
            {this.props.isId ? "Tutup & Muat Ulang" : "Close & Reload"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface MilestoneExamCardProps {
  stage: ExamStage;
  triggerDayNumber: number;
  isLocked: boolean;
  lockReason?: string;
  exam?: MilestoneExam;
  onOpenExam: (stage: ExamStage) => void;
}

export function MilestoneExamCard({
  stage,
  triggerDayNumber,
  isLocked,
  lockReason,
  exam,
  onOpenExam,
}: MilestoneExamCardProps) {
  const { lang } = useLanguage();
  const isId = lang === "id";
  const submission = exam?.submission;
  const isPassed = Boolean(submission?.passed);

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 transition-all ${
        isPassed
          ? "border-emerald-400 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 shadow-xs"
          : isLocked
          ? "border-dashed border-slate-300 bg-slate-50/80 opacity-85"
          : "border-[#FACC15] bg-gradient-to-br from-[#111111] via-[#191919] to-[#111111] text-white shadow-md"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                isPassed
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : isLocked
                  ? "bg-slate-200 text-slate-700"
                  : "bg-[#FACC15] text-[#111111]"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>
                {isId
                  ? stage === "mid"
                    ? "Ujian Tengah Sesi AI"
                    : "Ujian Akhir Sesi AI"
                  : stage === "mid"
                  ? "Mid-Session AI Exam"
                  : "Final-Session AI Exam"}
              </span>
            </span>

            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                isPassed
                  ? "bg-white text-emerald-800 border border-emerald-200"
                  : isLocked
                  ? "bg-white text-slate-600 border border-slate-200"
                  : "bg-white/10 text-[#FEF08A] border border-white/15"
              }`}
            >
              {isId
                ? "7 Soal: 5 Pilihan Ganda + 2 Esai · LaTeX Aktif"
                : "7 Questions: 5 Multiple Choice + 2 Essays · LaTeX Enabled"}
            </span>
          </div>

          <h4
            className={`text-base font-extrabold tracking-tight ${
              isPassed
                ? "text-slate-900"
                : isLocked
                ? "text-slate-800"
                : "text-white"
            }`}
          >
            {isId
              ? stage === "mid"
                ? `Evaluasi Tengah Sesi (Setelah Hari ${triggerDayNumber})`
                : `Evaluasi Komprehensif Akhir Sesi (Setelah Hari ${triggerDayNumber})`
              : stage === "mid"
              ? `Mid-Session Evaluation (After Day ${triggerDayNumber})`
              : `Final Comprehensive Evaluation (After Day ${triggerDayNumber})`}
          </h4>

          <p
            className={`text-xs leading-relaxed ${
              isPassed
                ? "text-slate-600"
                : isLocked
                ? "text-slate-500"
                : "text-slate-300"
            }`}
          >
            {isPassed
              ? isId
                ? `Ujian selesai dengan skor ${submission?.totalScore}/100 (PG: ${submission?.mcScore}/70, Esai: ${submission?.essayScore}/30). ${
                    stage === "mid"
                      ? "Hari belajar berikutnya telah terbuka."
                      : "Poin akhir PPT & Sertifikat Blockchain kini aktif!"
                  }`
                : `Completed with score ${submission?.totalScore}/100 (MC: ${submission?.mcScore}/70, Essay: ${submission?.essayScore}/30). ${
                    stage === "mid"
                      ? "Next study phase is unlocked."
                      : "Final PPT points & Blockchain Certificate unlocked!"
                  }`
              : isLocked
              ? lockReason ||
                (isId
                  ? `Selesaikan seluruh tugas hingga Hari ${triggerDayNumber} untuk membuka ujian ini.`
                  : `Complete all tasks through Day ${triggerDayNumber} to unlock this exam.`)
              : isId
              ? stage === "mid"
                ? "Uji pemahaman materi slide paruh pertama (5 PG + 2 Esai) untuk membuka kunci hari belajar berikutnya."
                : "Uji penguasaan seluruh modul slide (5 PG + 2 Esai) untuk mencairkan Poin PPT & Sertifikat Akademik Blockchain."
              : stage === "mid"
              ? "Verify your mastery of first-half slides (5 MC + 2 Essays) to unlock subsequent days."
              : "Verify mastery of the entire PPT deck (5 MC + 2 Essays) to earn your PPT Points & Blockchain Certificate."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {submission && (
            <div
              className={`rounded-xl px-3 py-2 text-center border ${
                isPassed
                  ? "bg-emerald-100/90 border-emerald-300 text-emerald-900"
                  : "bg-rose-100 border-rose-300 text-rose-900"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider">
                {isId
                  ? isPassed
                    ? "LULUS"
                    : "PERLU REMEDIAL"
                  : isPassed
                  ? "PASSED"
                  : "RETRY NEEDED"}
              </div>
              <div className="text-lg font-black leading-none mt-0.5">
                {submission.totalScore}
                <span className="text-xs font-semibold">/100</span>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isLocked}
            onClick={() => {
              if (!isLocked) onOpenExam(stage);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all ${
              isLocked
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : isPassed
                ? "bg-slate-900 text-[#FACC15] hover:bg-slate-800 cursor-pointer"
                : "bg-[#FACC15] text-[#111111] hover:bg-[#FDE047] shadow-sm cursor-pointer"
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{isId ? "Terkunci" : "Locked"}</span>
              </>
            ) : isPassed ? (
              <>
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{isId ? "Lihat Pembahasan / Ulangi" : "Review / Retake"}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isId ? "Mulai Ujian (5 PG + 2 Esai)" : "Start Exam (5 MC + 2 Essays)"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MilestoneExamModalProps {
  isOpen: boolean;
  stage: ExamStage;
  courseTitle: string;
  triggerDayNumber: number;
  coveredTasks: RoadmapTask[];
  existingExam?: MilestoneExam;
  onClose: () => void;
  onSaveExam: (stage: ExamStage, exam: MilestoneExam) => void;
}

export function MilestoneExamModal({
  isOpen,
  stage,
  courseTitle,
  triggerDayNumber,
  coveredTasks,
  existingExam,
  onClose,
  onSaveExam,
}: MilestoneExamModalProps) {
  const { lang } = useLanguage();
  const isId = lang === "id";
  const [exam, setExam] = useState<MilestoneExam | null>(existingExam || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [mcAnswers, setMcAnswers] = useState<Record<string, number>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (existingExam) {
      setExam(existingExam);
      setMcAnswers(existingExam.submission?.mcAnswers || {});
      setEssayAnswers(existingExam.submission?.essayAnswers || {});
      return;
    }
    void handleGenerateExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stage, existingExam?.id]);

  const handleGenerateExam = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/agents/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          courseTitle,
          stage,
          triggerDayNumber,
          language: lang,
          tasks: coveredTasks,
        }),
      });
      if (!res.ok) {
        throw new Error(
          isId
            ? "Gagal membuat soal ujian dari materi slide."
            : "Failed to generate exam questions from slides."
        );
      }
      const generated: MilestoneExam = await res.json();
      setExam(generated);
      setMcAnswers({});
      setEssayAnswers({});
      onSaveExam(stage, generated);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : isId
          ? "Gagal memuat soal ujian AI."
          : "Failed to load AI exam questions."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!exam) return;

    const mcList = Array.isArray(exam.multipleChoice) ? exam.multipleChoice : [];
    const essayList = Array.isArray(exam.essays) ? exam.essays : [];

    const unansweredMc = mcList.filter(
      (q) => mcAnswers[q.id] === undefined
    );
    const unansweredEssay = essayList.filter(
      (q) => !(essayAnswers[q.id] || "").trim()
    );

    if (unansweredMc.length > 0 || unansweredEssay.length > 0) {
      setErrorMessage(
        isId
          ? `Harap jawab seluruh 7 soal terlebih dahulu (${unansweredMc.length} PG dan ${unansweredEssay.length} Esai belum dijawab).`
          : `Please answer all 7 questions first (${unansweredMc.length} MC and ${unansweredEssay.length} Essay remaining).`
      );
      return;
    }

    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsGrading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/agents/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade",
          courseTitle,
          language: lang,
          exam,
          mcAnswers,
          essayAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error(isId ? "Gagal menilai jawaban ujian." : "Failed to grade exam answers.");
      }

      const rawSub = (await res.json()) as Partial<ExamSubmission> | null;
      const submission: ExamSubmission = {
        mcAnswers: rawSub?.mcAnswers || mcAnswers,
        essayAnswers: rawSub?.essayAnswers || essayAnswers,
        mcScore: typeof rawSub?.mcScore === "number" ? rawSub.mcScore : 0,
        essayScore: typeof rawSub?.essayScore === "number" ? rawSub.essayScore : 0,
        totalScore: typeof rawSub?.totalScore === "number" ? rawSub.totalScore : 0,
        passed: Boolean(rawSub?.passed),
        essayFeedback:
          rawSub?.essayFeedback && typeof rawSub.essayFeedback === "object"
            ? rawSub.essayFeedback
            : {},
        submittedAt: rawSub?.submittedAt || new Date().toISOString(),
      };
      const updatedExam: MilestoneExam = {
        ...exam,
        submission,
      };
      setExam(updatedExam);
      onSaveExam(stage, updatedExam);

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          bodyScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menilai ujian."
      );
    } finally {
      setIsGrading(false);
    }
  };

  if (!isOpen) return null;

  const submission = exam?.submission;
  const optionLabels = ["A", "B", "C", "D"];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 sm:backdrop-blur-xs p-0 sm:p-6 overflow-hidden">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90dvh] flex flex-col rounded-none sm:rounded-2xl bg-white border-0 sm:border sm:border-slate-200 shadow-2xl overflow-hidden">
        <ExamModalErrorBoundary onClose={onClose} isId={isId}>
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 bg-[#111111] text-white px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FACC15] text-[#111111] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                <BrainCircuit className="w-3 h-3" />
                <span>
                  {isId
                    ? stage === "mid"
                      ? "Ujian Tengah Sesi"
                      : "Ujian Akhir Sesi"
                    : stage === "mid"
                    ? "Mid-Session Exam"
                    : "Final-Session Exam"}
                </span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {isId
                  ? "7 Soal Spesifik Slide (5 PG + 2 Esai) · Passing Grade 60/100"
                  : "7 Slide-Specific Questions (5 MC + 2 Essays) · Passing Grade 60/100"}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-1 truncate">
              {exam?.title ||
                (isId
                  ? stage === "mid"
                    ? `Ujian Tengah Sesi — ${courseTitle}`
                    : `Ujian Akhir Sesi — ${courseTitle}`
                  : stage === "mid"
                  ? `Mid-Session Exam — ${courseTitle}`
                  : `Final Comprehensive Exam — ${courseTitle}`)}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateExam}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-[#FEF08A] transition cursor-pointer"
              title={isId ? "Buat Paket Soal Baru dari Slide" : "Generate New AI Questions"}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isId ? "Regenerate Soal AI" : "Regenerate AI Exam"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              aria-label="Close exam modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Exam Body */}
        <div
          ref={bodyScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 bg-[#F9F9F7]"
        >
          {isGenerating ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-9 h-9 text-[#111111] animate-spin" />
              <h4 className="text-base font-extrabold text-slate-900">
                {isId
                  ? "Syllaba Examiner AI Sedang Menyusun 7 Soal dari Slide PPT/PDF..."
                  : "Syllaba Examiner AI is Crafting 7 Questions from Your PPT Slides..."}
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                {isId
                  ? `Mengekstrak definisi, konsep teknis, dan rumus LaTeX dari tugas Hari ${
                      stage === "mid" ? `1 s/d ${triggerDayNumber}` : "keseluruhan modul"
                    } menjadi 5 Soal Pilihan Ganda & 2 Soal Esai.`
                  : `Extracting definitions, mechanisms, and LaTeX equations from Days ${
                      stage === "mid" ? `1 to ${triggerDayNumber}` : "across the full module"
                    } into 5 Multiple Choice & 2 Analytical Essays.`}
              </p>
            </div>
          ) : exam ? (
            <>
              {submission && (
                <div
                  className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    submission.passed
                      ? "border-emerald-400 bg-emerald-50/90 text-emerald-950"
                      : "border-rose-300 bg-rose-50 text-rose-950"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {submission.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <span className="text-sm font-black uppercase tracking-wide">
                        {submission.passed
                          ? isId
                            ? "Selamat! Kamu Lulus Evaluasi Ini"
                            : "Congratulations! Evaluation Passed"
                          : isId
                          ? "Skor Belum Mencapai Passing Grade (60/100)"
                          : "Score Below Passing Grade (60/100)"}
                      </span>
                    </div>
                    <p className="text-xs">
                      {isId ? "Skor Pilihan Ganda" : "Multiple Choice"}:{" "}
                      <strong>{submission.mcScore}/70</strong> ·{" "}
                      {isId ? "Skor Esai Analitis" : "Analytical Essays"}:{" "}
                      <strong>{submission.essayScore}/30</strong>
                      {submission.passed
                        ? isId
                          ? stage === "mid"
                            ? " — Hari belajar berikutnya sekarang telah terbuka!"
                            : " — Poin Akhir PPT & Sertifikat Akademik Blockchain sekarang telah terbuka!"
                          : stage === "mid"
                          ? " — Next study days are now unlocked!"
                          : " — Final PPT Points & Blockchain Academic Certificate are now unlocked!"
                        : isId
                        ? " — Silakan tinjau pembahasan di bawah atau klik Regenerate Soal AI untuk mencoba kembali."
                        : " — Review the explanations below or click Regenerate AI Exam to try again."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/90 border border-black/10 px-4 py-2 text-center shrink-0">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      {isId ? "Total Skor Akhir" : "Total Final Score"}
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {submission.totalScore}
                      <span className="text-xs font-semibold text-slate-500">
                        /100
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PART A: 5 MULTIPLE CHOICE QUESTIONS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    {isId
                      ? "Bagian A · 5 Soal Pilihan Ganda (70 Poin)"
                      : "Part A · 5 Multiple Choice Questions (70 Points)"}
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    {isId ? "14 Poin per Soal" : "14 Points per Question"}
                  </span>
                </div>

                {exam.multipleChoice.map((q, idx) => {
                  const selectedIdx = mcAnswers[q.id];
                  const isSubmitted = Boolean(submission);
                  const isCorrect =
                    isSubmitted && selectedIdx === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] text-[#FACC15] px-2.5 py-0.5 text-xs font-extrabold">
                          {isId ? `Soal PG #${idx + 1}` : `MC Question #${idx + 1}`}
                        </span>
                        <span className="rounded-md bg-[#FEF3C7] border border-[#FACC15]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#111111]">
                          <LatexText text={q.slideReference} />
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                        <LatexText text={q.prompt} />
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedIdx === optIdx;
                          const isRightOption = q.correctIndex === optIdx;

                          let optionStyle =
                            "border-slate-200 bg-slate-50/70 hover:bg-[#FEF3C7]/40 hover:border-[#FACC15] text-slate-800";
                          if (isSubmitted) {
                            if (isRightOption) {
                              optionStyle =
                                "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold";
                            } else if (isSelected && !isRightOption) {
                              optionStyle =
                                "border-rose-400 bg-rose-50 text-rose-900";
                            }
                          } else if (isSelected) {
                            optionStyle =
                              "border-[#111111] bg-[#FEF3C7] text-[#111111] font-semibold shadow-2xs";
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setMcAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: optIdx,
                                }))
                              }
                              className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 text-xs sm:text-sm transition cursor-pointer ${optionStyle}`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-extrabold border ${
                                  isSelected
                                    ? "bg-[#111111] text-[#FACC15] border-[#111111]"
                                    : "bg-white text-slate-700 border-slate-300"
                                }`}
                              >
                                {optionLabels[optIdx]}
                              </span>
                              <span className="flex-1 leading-relaxed">
                                <LatexText text={opt} />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {isSubmitted && (
                        <div
                          className={`rounded-xl border p-3 text-xs leading-relaxed ${
                            isCorrect
                              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                              : "border-amber-200 bg-amber-50/80 text-amber-950"
                          }`}
                        >
                          <div className="font-bold mb-1">
                            {isCorrect
                              ? isId
                                ? "Jawaban Benar (+14 Poin)"
                                : "Correct Answer (+14 Points)"
                              : isId
                              ? `Jawaban Kurang Tepat — Kunci Jawaban: ${optionLabels[q.correctIndex] ?? "A"}`
                              : `Incorrect Answer — Correct Option: ${optionLabels[q.correctIndex] ?? "A"}`}
                          </div>
                          <LatexText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PART B: 2 ESSAY QUESTIONS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    {isId
                      ? "Bagian B · 2 Soal Esai Analitis & Derivasi (30 Poin)"
                      : "Part B · 2 Analytical & Derivation Essays (30 Points)"}
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    {isId ? "15 Poin per Soal" : "15 Points per Question"}
                  </span>
                </div>

                {(exam.essays || []).map((eq, idx) => (
                  <div
                    key={eq.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] text-[#FACC15] px-2.5 py-0.5 text-xs font-extrabold">
                        {isId ? `Soal Esai #${idx + 6}` : `Essay #${idx + 6}`}
                      </span>
                      <span className="rounded-md bg-[#FEF3C7] border border-[#FACC15]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#111111]">
                        <LatexText text={eq.slideReference} />
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                      <LatexText text={eq.prompt} />
                    </div>

                    {Array.isArray(eq.expectedKeywords) && eq.expectedKeywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {isId ? "Konsep Kunci Slide:" : "Key Slide Concepts:"}
                        </span>
                        {eq.expectedKeywords.map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            <LatexText text={kw} />
                          </span>
                        ))}
                      </div>
                    )}

                    <textarea
                      rows={4}
                      value={essayAnswers[eq.id] || ""}
                      onChange={(e) =>
                        setEssayAnswers((prev) => ({
                          ...prev,
                          [eq.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        isId
                          ? "Tuliskan analisis, penjelasan mekanisme slide, dan rumus terkait di sini..."
                          : "Write your analysis, slide mechanism explanation, and relevant equations here..."
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-sm text-slate-900 focus:border-[#111111] focus:outline-none"
                    />

                    {submission?.essayFeedback?.[eq.id] && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 leading-relaxed">
                        <div className="font-bold mb-1">
                          {isId ? "Evaluasi AI Examiner:" : "AI Examiner Evaluation:"}
                        </div>
                        <LatexText text={submission.essayFeedback[eq.id]} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {errorMessage && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 border-t border-slate-200 shrink-0">
          <div className="text-xs text-slate-600">
            {isId ? "Terjawab:" : "Answered:"}{" "}
            <strong>
              {Object.keys(mcAnswers).length}/5 {isId ? "PG" : "MC"} &middot;{" "}
              {
                Object.values(essayAnswers).filter((v) => v && v.trim().length > 0)
                  .length
              }
              /2 {isId ? "Esai" : "Essays"}
            </strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {isId ? "Tutup" : "Close"}
            </button>

            <button
              type="button"
              disabled={isGenerating || isGrading || !exam}
              onClick={handleSubmitExam}
              className="inline-flex items-center gap-2 rounded-xl bg-[#111111] text-[#FACC15] hover:bg-slate-800 px-5 py-2.5 text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
            >
              {isGrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isId ? "Menilai Jawaban..." : "Grading Answers..."}</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>
                    {submission
                      ? isId
                        ? "Kumpulkan Ulang & Perbarui Skor"
                        : "Resubmit & Update Score"
                      : isId
                      ? "Kumpulkan & Nilai Ujian (Submit)"
                      : "Submit & Grade Exam"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
        </ExamModalErrorBoundary>
      </div>
    </div>,
    document.body
  );
}
