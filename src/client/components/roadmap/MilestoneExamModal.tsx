"use client";

import React, { useEffect, useState } from "react";
import {
  ExamStage,
  ExamSubmission,
  MilestoneExam,
  RoadmapTask,
} from "@/shared/types/roadmap";
import { LatexText } from "@/client/components/common/LatexText";
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
                {stage === "mid"
                  ? "Mid-Session AI Exam (Pertengahan Sesi)"
                  : "Final-Session AI Exam (Akhir Sesi)"}
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
              7 Soal: 5 Pilihan Ganda + 2 Esai · LaTeX Enabled
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
            {stage === "mid"
              ? `Evaluasi Tengah Sesi (Setelah Hari ${triggerDayNumber})`
              : `Evaluasi Komprehensif Akhir Sesi (Setelah Hari ${triggerDayNumber})`}
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
              ? `Ujian telah diselesaikan dengan skor ${submission?.totalScore}/100 (PG: ${submission?.mcScore}/70, Esai: ${submission?.essayScore}/30). ${
                  stage === "mid"
                    ? "Hari belajar berikutnya telah terbuka."
                    : "Sertifikat Blockchain kini siap diklaim!"
                }`
              : isLocked
              ? lockReason ||
                `Selesaikan seluruh tugas hingga Hari ${triggerDayNumber} untuk membuka ujian ini.`
              : stage === "mid"
              ? "Uji pemahaman materi slide paruh pertama (5 PG + 2 Esai) untuk membuka kunci hari belajar berikutnya."
              : "Uji penguasaan seluruh modul slide (5 PG + 2 Esai) untuk menerbitkan Sertifikat Akademik Blockchain di Base Sepolia."}
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
                {isPassed ? "LULUS" : "PERLU REMEDIAL"}
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
                <span>Terkunci</span>
              </>
            ) : isPassed ? (
              <>
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Lihat Pembahasan / Ulangi</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mulai Ujian (5 PG + 2 Esai)</span>
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
  const [exam, setExam] = useState<MilestoneExam | null>(existingExam || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [mcAnswers, setMcAnswers] = useState<Record<string, number>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          tasks: coveredTasks,
        }),
      });
      if (!res.ok) {
        throw new Error("Gagal membuat soal ujian dari materi slide.");
      }
      const generated: MilestoneExam = await res.json();
      setExam(generated);
      setMcAnswers({});
      setEssayAnswers({});
      onSaveExam(stage, generated);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memuat soal ujian AI."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!exam) return;

    const unansweredMc = exam.multipleChoice.filter(
      (q) => mcAnswers[q.id] === undefined
    );
    const unansweredEssay = exam.essays.filter(
      (q) => !(essayAnswers[q.id] || "").trim()
    );

    if (unansweredMc.length > 0 || unansweredEssay.length > 0) {
      setErrorMessage(
        `Harap jawab seluruh 7 soal terlebih dahulu (${unansweredMc.length} PG dan ${unansweredEssay.length} Esai belum dijawab).`
      );
      return;
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
          exam,
          mcAnswers,
          essayAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menilai jawaban ujian.");
      }

      const submission: ExamSubmission = await res.json();
      const updatedExam: MilestoneExam = {
        ...exam,
        submission,
      };
      setExam(updatedExam);
      onSaveExam(stage, updatedExam);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 bg-[#111111] text-white px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FACC15] text-[#111111] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                <BrainCircuit className="w-3 h-3" />
                <span>
                  {stage === "mid" ? "Mid-Session Exam" : "Final-Session Exam"}
                </span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                7 Soal Spesifik Slide (5 PG + 2 Esai) · Passing Grade 60/100
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-1 truncate">
              {exam?.title ||
                (stage === "mid"
                  ? `Ujian Tengah Sesi — ${courseTitle}`
                  : `Ujian Akhir Sesi — ${courseTitle}`)}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateExam}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-[#FEF08A] transition cursor-pointer"
              title="Buat Paket Soal Baru dari Slide"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Regenerate Soal AI</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F9F9F7]">
          {isGenerating ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-9 h-9 text-[#111111] animate-spin" />
              <h4 className="text-base font-extrabold text-slate-900">
                Syllaba Examiner AI Sedang Menyusun 7 Soal dari Slide PPT/PDF...
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Mengekstrak definisi, konsep teknis, dan rumus LaTeX dari tugas
                Hari {stage === "mid" ? `1 s/d ${triggerDayNumber}` : "keseluruhan modul"} menjadi 5 Soal Pilihan Ganda &amp; 2 Soal Esai.
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
                          ? "Selamat! Kamu Lulus Evaluasi Ini"
                          : "Skor Belum Mencapai Passing Grade (60/100)"}
                      </span>
                    </div>
                    <p className="text-xs">
                      Skor Pilihan Ganda: <strong>{submission.mcScore}/70</strong> · Skor
                      Esai Analitis: <strong>{submission.essayScore}/30</strong>
                      {submission.passed
                        ? stage === "mid"
                          ? " — Hari belajar berikutnya sekarang telah terbuka!"
                          : " — Sertifikat Akademik Blockchain di Base Sepolia sekarang telah terbuka!"
                        : " — Silakan tinjau pembahasan di bawah atau klik Regenerate Soal AI untuk mencoba kembali."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/90 border border-black/10 px-4 py-2 text-center shrink-0">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Total Skor Akhir
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
                    Bagian A · 5 Soal Pilihan Ganda (70 Poin)
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    14 Poin per Soal
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
                          Soal PG #{idx + 1}
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
                              ? `Jawaban Benar (+14 Poin)`
                              : `Jawaban Kurang Tepat — Kunci Jawaban: ${optionLabels[q.correctIndex]}`}
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
                    Bagian B · 2 Soal Esai Analitis &amp; Derivasi (30 Poin)
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    15 Poin per Soal
                  </span>
                </div>

                {exam.essays.map((eq, idx) => (
                  <div
                    key={eq.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] text-[#FACC15] px-2.5 py-0.5 text-xs font-extrabold">
                        Soal Esai #{idx + 6}
                      </span>
                      <span className="rounded-md bg-[#FEF3C7] border border-[#FACC15]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#111111]">
                        <LatexText text={eq.slideReference} />
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                      <LatexText text={eq.prompt} />
                    </div>

                    {eq.expectedKeywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Konsep Kunci Slide:
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
                      placeholder="Tuliskan analisis, penjelasan mekanisme slide, dan rumus terkait di sini..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-900 focus:border-[#111111] focus:outline-none"
                    />

                    {submission && submission.essayFeedback[eq.id] && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 leading-relaxed">
                        <div className="font-bold mb-1">
                          Evaluasi AI Examiner:
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
            Terjawab:{" "}
            <strong>
              {Object.keys(mcAnswers).length}/5 PG &middot;{" "}
              {
                Object.values(essayAnswers).filter((v) => v && v.trim().length > 0)
                  .length
              }
              /2 Esai
            </strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Tutup
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
                  <span>Menilai Jawaban...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>
                    {submission
                      ? "Kumpulkan Ulang & Perbarui Skor"
                      : "Kumpulkan & Nilai Ujian (Submit)"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
