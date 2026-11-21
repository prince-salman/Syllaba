import { Roadmap } from "@/shared/types/roadmap";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";

const STORAGE_PREFIX = "syllaba_roadmaps_v2";
const ACTIVE_ID_PREFIX = "syllaba_active_roadmap_id_v2";
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

export function resolveOwnerScope(
  walletAddress?: string | null,
  authUserId?: string | null
): string {
  const wallet = walletAddress?.trim().toLowerCase();
  if (wallet) return `wallet_${wallet}`;
  const uid = authUserId?.trim();
  if (uid) return `user_${uid}`;
  return "guest";
}

function roadmapsKey(scope = "guest"): string {
  return `${STORAGE_PREFIX}:${scope}`;
}

function activeIdKey(scope = "guest"): string {
  return `${ACTIVE_ID_PREFIX}:${scope}`;
}

export function getLastSupabaseSyncStatus(): SupabaseSyncStatus | null {
  return lastSyncStatus;
}

export function getStoredRoadmaps(scope = "guest"): Roadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(roadmapsKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRoadmap);
  } catch (err) {
    console.error("[storage] Failed to parse localStorage roadmaps:", err);
    return [];
  }
}

export function saveRoadmaps(roadmaps: Roadmap[], scope = "guest"): void {
  if (typeof window === "undefined") return;
  try {
    const valid = roadmaps.filter(isValidRoadmap);
    localStorage.setItem(roadmapsKey(scope), JSON.stringify(valid));
  } catch (err) {
    console.error("[storage] Failed to write roadmaps to localStorage:", err);
  }
}

export async function syncRoadmapToSupabase(
  roadmap: Roadmap,
  scope = "guest"
): Promise<SupabaseSyncStatus> {
  const now = new Date().toISOString();
  const scopedId = `${scope}__${roadmap.id}`;

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
        id: scopedId,
        course_title: roadmap.courseTitle,
        payload: { ...roadmap, _ownerScope: scope },
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

export async function hydrateRoadmapsFromSupabase(
  scope = "guest"
): Promise<Roadmap[]> {
  const localRoadmaps = getStoredRoadmaps(scope);

  if (!isSupabaseConfigured || !supabase) {
    return localRoadmaps;
  }

  try {
    const { data, error } = await supabase
      .from("roadmaps")
      .select("id, payload")
      .like("id", `${scope}__%`)
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
    saveRoadmaps(merged, scope);
    return merged;
  } catch (err) {
    console.error("[storage] Unexpected error reading Supabase roadmaps:", err);
    return localRoadmaps;
  }
}

export function saveRoadmap(roadmap: Roadmap, scope = "guest"): void {
  if (!isValidRoadmap(roadmap)) return;
  const roadmaps = getStoredRoadmaps(scope);
  const index = roadmaps.findIndex((r) => r.id === roadmap.id);
  if (index >= 0) {
    roadmaps[index] = roadmap;
  } else {
    roadmaps.unshift(roadmap);
  }
  saveRoadmaps(roadmaps, scope);
  setActiveRoadmapId(roadmap.id, scope);

  void syncRoadmapToSupabase(roadmap, scope);
}

export function getActiveRoadmapId(scope = "guest"): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(activeIdKey(scope));
}

export function setActiveRoadmapId(id: string, scope = "guest"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(activeIdKey(scope), id);
}

export function getActiveRoadmap(scope = "guest"): Roadmap | null {
  const id = getActiveRoadmapId(scope);
  const roadmaps = getStoredRoadmaps(scope);
  if (id) {
    const found = roadmaps.find((r) => r.id === id);
    if (found) return found;
  }
  return roadmaps.length > 0 ? roadmaps[0] : null;
}

export function updateTaskCompletion(
  roadmapId: string,
  taskId: string,
  completed: boolean,
  scope = "guest"
): Roadmap | null {
  const roadmaps = getStoredRoadmaps(scope);
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
  saveRoadmap(roadmap, scope);
  return roadmap;
}

export function updateSubtaskCompletion(
  roadmapId: string,
  taskId: string,
  subtaskId: string,
  completed: boolean,
  scope = "guest"
): Roadmap | null {
  const roadmaps = getStoredRoadmaps(scope);
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
  saveRoadmap(roadmap, scope);
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
