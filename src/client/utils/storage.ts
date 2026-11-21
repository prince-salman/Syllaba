import { Roadmap } from "@/shared/types/roadmap";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";

const STORAGE_KEY_ROADMAPS = "syllaba_roadmaps_v1";
const STORAGE_KEY_ACTIVE_ID = "syllaba_active_roadmap_id";
const STORAGE_KEY_API_KEY = "syllaba_gemini_api_key";

export interface SupabaseSyncStatus {
  ok: boolean;
  roadmapId: string;
  error: string | null;
  syncedAt: string;
}

let lastSyncStatus: SupabaseSyncStatus | null = null;

function isValidRoadmap(item: unknown): item is Roadmap {
  if (!item || typeof item !== "object") return false;
  const r = item as Partial<Roadmap>;
  return (
    typeof r.id === "string" &&
    r.id.trim().length > 0 &&
    typeof r.courseTitle === "string" &&
    Array.isArray(r.dailySchedules)
  );
}

export function getLastSupabaseSyncStatus(): SupabaseSyncStatus | null {
  return lastSyncStatus;
}

export function getStoredRoadmaps(): Roadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROADMAPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRoadmap);
  } catch (err) {
    console.error("[storage] Failed to parse localStorage roadmaps:", err);
    return [];
  }
}

export function saveRoadmaps(roadmaps: Roadmap[]): void {
  if (typeof window === "undefined") return;
  try {
    const valid = roadmaps.filter(isValidRoadmap);
    localStorage.setItem(STORAGE_KEY_ROADMAPS, JSON.stringify(valid));
  } catch (err) {
    console.error("[storage] Failed to write roadmaps to localStorage:", err);
  }
}

export async function syncRoadmapToSupabase(
  roadmap: Roadmap
): Promise<SupabaseSyncStatus> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured || !supabase) {
    const status: SupabaseSyncStatus = {
      ok: false,
      roadmapId: roadmap.id,
      error: "Supabase is not configured; persisted to localStorage only.",
      syncedAt: now,
    };
    lastSyncStatus = status;
    console.warn(`[storage] ${status.error}`);
    return status;
  }

  try {
    const { error } = await supabase.from("roadmaps").upsert(
      {
        id: roadmap.id,
        course_title: roadmap.courseTitle,
        payload: roadmap,
        updated_at: now,
      },
      { onConflict: "id" }
    );

    if (error) {
      const status: SupabaseSyncStatus = {
        ok: false,
        roadmapId: roadmap.id,
        error: `Supabase upsert failed (${error.code ?? "unknown"}): ${error.message}`,
        syncedAt: now,
      };
      lastSyncStatus = status;
      console.error("[storage]", status.error);
      return status;
    }

    const status: SupabaseSyncStatus = {
      ok: true,
      roadmapId: roadmap.id,
      error: null,
      syncedAt: now,
    };
    lastSyncStatus = status;
    return status;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected Supabase sync error";
    const status: SupabaseSyncStatus = {
      ok: false,
      roadmapId: roadmap.id,
      error: message,
      syncedAt: now,
    };
    lastSyncStatus = status;
    console.error("[storage] Supabase upsert exception:", message);
    return status;
  }
}

export async function hydrateRoadmapsFromSupabase(): Promise<Roadmap[]> {
  const localRoadmaps = getStoredRoadmaps();

  if (!isSupabaseConfigured || !supabase) {
    return localRoadmaps;
  }

  try {
    const { data, error } = await supabase
      .from("roadmaps")
      .select("payload")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(
        `[storage] Failed to read roadmaps from Supabase (${error.code ?? "unknown"}): ${error.message}`
      );
      return localRoadmaps;
    }

    const remoteRoadmaps = (data ?? [])
      .map((row) => row.payload as unknown)
      .filter(isValidRoadmap);

    if (remoteRoadmaps.length === 0) {
      saveRoadmaps(localRoadmaps);
      return localRoadmaps;
    }

    const mergedMap = new Map<string, Roadmap>();
    for (const item of remoteRoadmaps) {
      mergedMap.set(item.id, item);
    }
    for (const item of localRoadmaps) {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    }

    const merged = Array.from(mergedMap.values());
    saveRoadmaps(merged);
    return merged;
  } catch (err) {
    console.error("[storage] Unexpected error reading Supabase roadmaps:", err);
    return localRoadmaps;
  }
}

export function saveRoadmap(roadmap: Roadmap): void {
  if (!isValidRoadmap(roadmap)) return;
  const roadmaps = getStoredRoadmaps();
  const index = roadmaps.findIndex((r) => r.id === roadmap.id);
  if (index >= 0) {
    roadmaps[index] = roadmap;
  } else {
    roadmaps.unshift(roadmap);
  }
  saveRoadmaps(roadmaps);
  setActiveRoadmapId(roadmap.id);

  void syncRoadmapToSupabase(roadmap);
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

export function updateTaskCompletion(
  roadmapId: string,
  taskId: string,
  completed: boolean
): Roadmap | null {
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
        task.isCompleted =
          task.subtasks.length > 0 && task.subtasks.every((s) => s.isCompleted);
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
