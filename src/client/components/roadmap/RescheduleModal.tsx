"use client";

import React, { useState } from "react";
import { Modal } from "@/client/components/common/Modal";
import { Button } from "@/client/components/common/Button";
import { Roadmap } from "@/shared/types/roadmap";
import { CalendarClock, Sparkles } from "lucide-react";
import { useLanguage, AppLanguage } from "@/client/context/LanguageContext";

const RESCHEDULE_COPY: Record<
  AppLanguage,
  {
    modalTitle: string;
    reassure: string;
    question: string;
    daySingular: string;
    dayPlural: string;
    bufferShift: string;
    currentEnd: string;
    cancel: string;
    apply: string;
  }
> = {
  en: {
    modalTitle: "Dynamic Anti-Burnout Reschedule",
    reassure:
      "Falling behind is completely normal. Syllaba shifts your upcoming tasks smoothly across your calendar so you can restart with zero guilt or panic.",
    question: "How many days would you like to shift your remaining schedule?",
    daySingular: "Day",
    dayPlural: "Days",
    bufferShift: "Buffer shift",
    currentEnd: "Current end date:",
    cancel: "Cancel",
    apply: "Apply Schedule Shift",
  },
  id: {
    modalTitle: "Penjadwalan Ulang Anti-Burnout",
    reassure:
      "Tertinggal jadwal itu wajar. Syllaba menggeser tugas berikutnya secara rapi di kalender agar kamu bisa lanjut belajar tanpa stres atau panik.",
    question: "Ingin menggeser sisa jadwal berapa hari ke depan?",
    daySingular: "Hari",
    dayPlural: "Hari",
    bufferShift: "Geser buffer",
    currentEnd: "Tanggal selesai saat ini:",
    cancel: "Batal",
    apply: "Terapkan Pergeseran Jadwal",
  },
  zh: {
    modalTitle: "防倦怠动态顺延日程",
    reassure:
      "进度稍有落后非常正常。Syllaba 会将你的后续学习任务平滑顺延到日历中，让你毫无压力地继续。",
    question: "你想将剩余学习计划向后顺延几天？",
    daySingular: "天",
    dayPlural: "天",
    bufferShift: "缓冲顺延",
    currentEnd: "当前结束日期：",
    cancel: "取消",
    apply: "应用日程顺延",
  },
  ar: {
    modalTitle: "إعادة الجدولة المرنة ضد الإرهاق",
    reassure:
      "التأخر عن الجدول أمر طبيعي تمامًا. سيقوم Syllaba بإزاحة المهام القادمة بسلاسة عبر تقويمك لتكمل بدون ضغط.",
    question: "كم يومًا تود تأجيل ما تبقى من جدولك الدراسي؟",
    daySingular: "يوم",
    dayPlural: "أيام",
    bufferShift: "إزاحة مرنة",
    currentEnd: "تاريخ الانتهاء الحالي:",
    cancel: "إلغاء",
    apply: "تطبيق تعديل الجدول",
  },
  es: {
    modalTitle: "Reprogramación Dinámica Anti-Agotamiento",
    reassure:
      "Atrasarse es completamente normal. Syllaba mueve tus próximas tareas suavemente en el calendario para retomar sin estrés.",
    question: "¿Cuántos días deseas desplazar tu horario restante?",
    daySingular: "Día",
    dayPlural: "Días",
    bufferShift: "Margen extra",
    currentEnd: "Fecha de cierre actual:",
    cancel: "Cancelar",
    apply: "Aplicar Cambio",
  },
  pt: {
    modalTitle: "Reagendamento Dinâmico Anti-Esgotamento",
    reassure:
      "Atrasar faz parte do processo. O Syllaba ajusta suas próximas tarefas no calendário para você retomar com tranquilidade.",
    question: "Quantos dias deseja adiar o restante do seu cronograma?",
    daySingular: "Dia",
    dayPlural: "Dias",
    bufferShift: "Margem extra",
    currentEnd: "Data final atual:",
    cancel: "Cancelar",
    apply: "Aplicar Reagendamento",
  },
};

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: Roadmap;
  onRescheduleConfirm: (delayDays: number) => Promise<void>;
}

export function RescheduleModal({
  isOpen,
  onClose,
  roadmap,
  onRescheduleConfirm,
}: RescheduleModalProps) {
  const { lang } = useLanguage();
  const rc = RESCHEDULE_COPY[lang] ?? RESCHEDULE_COPY.en;
  const [delayDays, setDelayDays] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onRescheduleConfirm(delayDays);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={rc.modalTitle} maxWidth="md">
      <div className="space-y-4 text-slate-700">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200">
          <CalendarClock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            {rc.reassure}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            {rc.question}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDelayDays(days)}
                className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${
                  delayDays === days
                    ? "border-brand-600 bg-brand-50/80 text-brand-900 font-bold ring-1 ring-brand-500"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="text-base font-bold">
                  +{days} {days > 1 ? rc.dayPlural : rc.daySingular}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{rc.bufferShift}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {rc.currentEnd}{" "}
          <span className="font-medium text-slate-700">{roadmap.targetEndDate}</span>
        </p>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {rc.cancel}
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} isLoading={isLoading}>
            <Sparkles className="w-4 h-4" />
            <span>{rc.apply}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
