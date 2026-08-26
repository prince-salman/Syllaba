"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/client/components/common/Modal";
import { Button } from "@/client/components/common/Button";
import { RoadmapTask } from "@/shared/types/roadmap";
import { Play, Pause, RotateCcw, CheckCircle2, Volume2, VolumeX } from "lucide-react";
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
  const initialSeconds = (task?.estimatedMinutes || 25) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (task) {
      const defaultMinutes = Math.min(45, Math.max(15, task.estimatedMinutes));
      setTimeLeft(defaultMinutes * 60);
      setIsActive(false);
    }
  }, [task]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playCompletionTone();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playCompletionTone = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    const defaultMinutes = Math.min(45, Math.max(15, task?.estimatedMinutes || 25));
    setTimeLeft(defaultMinutes * 60);
  };

  const handleMarkComplete = () => {
    if (task) {
      onCompleteTask(task.id);
      onClose();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deep Focus Session" maxWidth="md">
      <div className="text-center space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
            {task.category}
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-2">{task.title}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto line-clamp-2">
            {task.description}
          </p>
        </div>

        <div className="py-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="text-5xl font-black tracking-tight text-slate-900 font-mono">
            {timeString}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Target duration: {formatMinutes(task.estimatedMinutes)}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTimer}
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={toggleTimer}
            className="w-36"
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isActive ? "Pause" : "Start Focus"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute audio" : "Enable audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" size="sm" onClick={handleMarkComplete}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark Task Complete</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
