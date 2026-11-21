"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { RoadmapTask } from "@/shared/types/roadmap";
import { useLanguage } from "@/client/context/LanguageContext";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  Timer,
} from "lucide-react";
import { formatMinutes } from "@/shared/utils";

interface FocusTimerModalProps {
  task: RoadmapTask | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
}

export function FocusTimerModal({
  task,
  isOpen,
  onClose,
  onCompleteTask,
}: FocusTimerModalProps) {
  const { lang } = useLanguage();
  const isId = lang === "id";
  const defaultTotalSeconds =
    Math.min(45, Math.max(15, task?.estimatedMinutes || 25)) * 60;

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(defaultTotalSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (task) {
      const defaultMinutes = Math.min(45, Math.max(15, task.estimatedMinutes));
      setTimeLeft(defaultMinutes * 60);
      setIsActive(false);
      setIsMinimized(false);
    }
  }, [task]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playCompletionTone();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const playCompletionTone = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio context may be restricted before user gesture
    }
  };

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(defaultTotalSeconds);
  };

  const handleMarkComplete = () => {
    if (task) {
      setIsActive(false);
      onCompleteTask(task.id);
      onClose();
    }
  };

  const handleClose = () => {
    setIsActive(false);
    onClose();
  };

  if (!isOpen || !task || !mounted) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPct =
    defaultTotalSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((defaultTotalSeconds - timeLeft) / defaultTotalSeconds) * 100)
          )
        )
      : 0;

  if (isMinimized) {
    return createPortal(
      <div className="fixed right-3 sm:right-5 top-[4.75rem] sm:top-24 z-50 flex items-center gap-2 rounded-full border border-[#FACC15]/70 bg-[#111111]/95 text-white pl-3 pr-2 py-1.5 shadow-[0_14px_34px_-10px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            isActive ? "bg-emerald-400 animate-pulse" : "bg-[#FACC15]"
          }`}
        />
        <span className="font-mono text-sm font-black tracking-tight text-[#FACC15]">
          {timeString}
        </span>
        <button
          type="button"
          onClick={toggleTimer}
          className="rounded-full p-1.5 hover:bg-white/15 text-white transition cursor-pointer"
          aria-label={isActive ? "Pause timer" : "Start timer"}
          title={isActive ? "Pause" : "Start"}
        >
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="rounded-full p-1.5 hover:bg-white/15 text-slate-200 transition cursor-pointer"
          aria-label="Expand focus widget"
          title={isId ? "Perbesar Timer" : "Expand Timer"}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-1.5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
          aria-label="Close focus widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>,
      document.body
    );
  }

  return createPortal(
    <aside
      aria-label="Floating Deep Focus Timer"
      className="fixed right-3 sm:right-5 top-[4.75rem] sm:top-24 z-50 w-[min(19.5rem,calc(100vw-1.5rem))] sm:w-80 rounded-2xl border border-[#111111]/15 bg-white/95 backdrop-blur-xl shadow-[0_22px_50px_-14px_rgba(0,0,0,0.32)] overflow-hidden"
    >
      {/* Sleek Obsidian Top Bar */}
      <div className="flex items-center justify-between gap-2 bg-[#111111] px-3.5 py-2.5 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FACC15] text-[#111111] shrink-0">
            <Timer className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-extrabold tracking-tight truncate">
            {isId ? "Mode Fokus" : "Deep Focus"}
          </span>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title={soundEnabled ? "Mute bell" : "Enable bell"}
            aria-label={soundEnabled ? "Mute bell" : "Enable bell"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#FACC15]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title={isId ? "Perkecil ke sudut kanan" : "Minimize"}
            aria-label="Minimize focus widget"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            aria-label="Close focus widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compact Interactive Timer Body */}
      <div className="p-4 space-y-3.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-[#FEF3C7] border border-[#FACC15]/50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#111111]">
              {task.category}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Target {formatMinutes(task.estimatedMinutes)}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
            {task.title}
          </h4>
        </div>

        {/* Countdown Display + Progress Strip */}
        <div className="rounded-xl bg-[#F7F7F5] border border-[#E5E5E0] px-4 py-3 text-center space-y-2">
          <div className="text-4xl font-black tracking-tight text-[#111111] font-mono leading-none">
            {timeString}
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#111111] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetTimer}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Reset"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleTimer}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl px-3 text-xs font-extrabold transition cursor-pointer shadow-xs ${
              isActive
                ? "bg-amber-100 text-[#111111] border border-[#FACC15] hover:bg-amber-200"
                : "bg-[#111111] text-[#FACC15] hover:bg-slate-800"
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>{isId ? "Jeda" : "Pause"}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{isId ? "Mulai Fokus" : "Start Focus"}</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleMarkComplete}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-extrabold text-emerald-900 transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {isId ? "Selesai & Centang Tugas" : "Mark Task Complete"}
          </span>
        </button>

        <p className="text-[10px] text-center text-slate-400 leading-tight">
          {isId
            ? "Timer berjalan di samping — halaman tetap bisa digulir & dibaca bebas."
            : "Timer docks cleanly on the side — scroll & study freely."}
        </p>
      </div>
    </aside>,
    document.body
  );
}
