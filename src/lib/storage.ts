import { Roadmap, RoadmapTask } from "@/types/roadmap";
import { supabase, isSupabaseConfigured } from "./supabase";

const STORAGE_KEY_ROADMAPS = "syllaba_roadmaps_v1";
const STORAGE_KEY_ACTIVE_ID = "syllaba_active_roadmap_id";
const STORAGE_KEY_API_KEY = "syllaba_gemini_api_key";

export function getStoredRoadmaps(): Roadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROADMAPS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRoadmaps(roadmaps: Roadmap[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ROADMAPS, JSON.stringify(roadmaps));
  } catch {
    // Ignore storage quota errors
  }
}

export function saveRoadmap(roadmap: Roadmap): void {
  const roadmaps = getStoredRoadmaps();
  const index = roadmaps.findIndex((r) => r.id === roadmap.id);
  if (index >= 0) {
    roadmaps[index] = roadmap;
  } else {
    roadmaps.unshift(roadmap);
  }
  saveRoadmaps(roadmaps);
  setActiveRoadmapId(roadmap.id);

  if (isSupabaseConfigured && supabase) {
    supabase
      .from("roadmaps")
      .upsert({
        id: roadmap.id,
        course_title: roadmap.courseTitle,
        payload: roadmap,
        updated_at: new Date().toISOString(),
      })
      .then(() => {});
  }
}

export function getActiveRoadmapId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
}

export function setActiveRoadmapId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

export function getActiveRoadmap(): Roadmap | null {
  const id = getActiveRoadmapId();
  const roadmaps = getStoredRoadmaps();
  if (id) {
    const found = roadmaps.find((r) => r.id === id);
    if (found) return found;
  }
  return roadmaps.length > 0 ? roadmaps[0] : null;
}

export function updateTaskCompletion(roadmapId: string, taskId: string, completed: boolean): Roadmap | null {
  const roadmaps = getStoredRoadmaps();
  const roadmap = roadmaps.find((r) => r.id === roadmapId);
  if (!roadmap) return null;

  let totalCompleted = 0;
  roadmap.dailySchedules.forEach((schedule) => {
    schedule.tasks.forEach((task) => {
      if (task.id === taskId) {
        task.isCompleted = completed;
        task.subtasks.forEach((s) => (s.isCompleted = completed));
      }
      if (task.isCompleted) totalCompleted++;
    });
  });

  roadmap.completedTasks = totalCompleted;
  roadmap.updatedAt = new Date().toISOString();
  saveRoadmap(roadmap);
  return roadmap;
}

export function updateSubtaskCompletion(
  roadmapId: string,
  taskId: string,
  subtaskId: string,
  completed: boolean
): Roadmap | null {
  const roadmaps = getStoredRoadmaps();
  const roadmap = roadmaps.find((r) => r.id === roadmapId);
  if (!roadmap) return null;

  let totalCompleted = 0;
  roadmap.dailySchedules.forEach((schedule) => {
    schedule.tasks.forEach((task) => {
      if (task.id === taskId) {
        const sub = task.subtasks.find((s) => s.id === subtaskId);
        if (sub) sub.isCompleted = completed;
        task.isCompleted = task.subtasks.length > 0 && task.subtasks.every((s) => s.isCompleted);
      }
      if (task.isCompleted) totalCompleted++;
    });
  });

  roadmap.completedTasks = totalCompleted;
  roadmap.updatedAt = new Date().toISOString();
  saveRoadmap(roadmap);
  return roadmap;
}

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY_API_KEY) || "";
}

export function saveStoredApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  if (!apiKey) {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  }
}
