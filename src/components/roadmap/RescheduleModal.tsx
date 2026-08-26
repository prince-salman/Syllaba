"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Roadmap } from "@/types/roadmap";
import { CalendarClock, AlertCircle, Sparkles } from "lucide-react";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Dynamic Anti-Burnout Reschedule" maxWidth="md">
      <div className="space-y-4 text-slate-700">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200">
          <CalendarClock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            Falling behind is completely normal. Syllaba shifts your upcoming tasks smoothly across your calendar so you can restart with zero guilt or panic.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            How many days would you like to shift your remaining schedule?
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
                <div className="text-base font-bold">+{days} Day{days > 1 ? "s" : ""}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Buffer shift</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Current end date: <span className="font-medium text-slate-700">{roadmap.targetEndDate}</span>
        </p>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} isLoading={isLoading}>
            <Sparkles className="w-4 h-4" />
            <span>Apply Schedule Shift</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
