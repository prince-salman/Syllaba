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
  const uid = authUserId?.trim();
  if (uid) return `user_${uid}`;
  const wallet = walletAddress?.trim().toLowerCase();
  if (wallet) return `wallet_${wallet}`;
  return "guest";
}

function inferUserIdFromScope(scope: string, explicitUserId?: string | null): string | null {
  if (explicitUserId && explicitUserId.trim()) return explicitUserId.trim();
  if (scope.startsWith("user_") || scope.startsWith("wallet_")) return scope;
  return null;
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
    return parsed
      .filter(isValidRoadmap)
      .filter((r) => {
        const taggedScope =
          r.ownerScope || (r as Roadmap & { _ownerScope?: string })._ownerScope;
        return !taggedScope || taggedScope === scope;
      });
  } catch (err) {
    console.error("[storage] Failed to parse localStorage roadmaps:", err);
    return [];
  }
}

export function saveRoadmaps(roadmaps: Roadmap[], scope = "guest"): void {
  if (typeof window === "undefined") return;
  try {
    const valid = roadmaps
      .filter(isValidRoadmap)
      .map((r) => ({ ...r, ownerScope: scope }));
    localStorage.setItem(roadmapsKey(scope), JSON.stringify(valid));
  } catch (err) {
    console.error("[storage] Failed to write roadmaps to localStorage:", err);
  }
}

export async function syncRoadmapToSupabase(
  roadmap: Roadmap,
  scope = "guest",
  explicitUserId?: string | null
): Promise<SupabaseSyncStatus> {
  const now = new Date().toISOString();
  const userId = inferUserIdFromScope(scope, explicitUserId);

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
    let { error } = await supabase.from("roadmaps").upsert(
      {
        id: roadmap.id,
        course_title: roadmap.courseTitle,
        user_id: userId,
        owner_scope: scope,
        payload: { ...roadmap, _ownerScope: scope },
        updated_at: now,
      },
      { onConflict: "id" }
    );

    // Graceful fallback if relational columns or FK row are not yet applied in DB
    if (error && (error.code === "42703" || error.code === "23503")) {
      const retry = await supabase.from("roadmaps").upsert(
        {
          id: roadmap.id,
          course_title: roadmap.courseTitle,
          payload: { ...roadmap, _ownerScope: scope },
          updated_at: now,
        },
        { onConflict: "id" }
      );
      error = retry.error;
    }

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
    const mergedMap = new Map<string, Roadmap>();

    // Primary relational query by owner_scope
    const { data: scopedRows, error: scopedError } = await supabase
      .from("roadmaps")
      .select("id, course_title, payload")
      .eq("owner_scope", scope)
      .order("updated_at", { ascending: false });

    if (!scopedError && scopedRows) {
      for (const row of scopedRows) {
        const item = row.payload as unknown;
        if (isValidRoadmap(item)) {
          const itemScope =
            item.ownerScope ||
            (item as Roadmap & { _ownerScope?: string })._ownerScope;
          if (itemScope && itemScope !== scope) continue;
          mergedMap.set(item.id, {
            ...item,
            ownerScope: scope,
            courseTitle: row.course_title || item.courseTitle,
          });
        }
      }
    }

    // Read-only merge for legacy `${scope}__roadmap_...` rows if present
    const { data: legacyRows, error: legacyError } = await supabase
      .from("roadmaps")
      .select("id, course_title, payload")
      .like("id", `${scope}__%`)
      .order("updated_at", { ascending: false });

    if (!legacyError && legacyRows) {
      for (const row of legacyRows) {
        const item = row.payload as unknown;
        if (isValidRoadmap(item) && !mergedMap.has(item.id)) {
          const itemScope =
            item.ownerScope ||
            (item as Roadmap & { _ownerScope?: string })._ownerScope;
          if (itemScope && itemScope !== scope) continue;
          mergedMap.set(item.id, {
            ...item,
            ownerScope: scope,
            courseTitle: row.course_title || item.courseTitle,
          });
        }
      }
    }

    if (mergedMap.size === 0) {
      return localRoadmaps;
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

export function saveRoadmap(
  roadmap: Roadmap,
  scope = "guest",
  explicitUserId?: string | null
): void {
  if (!isValidRoadmap(roadmap)) return;
  const scopedRoadmap: Roadmap = {
    ...roadmap,
    ownerScope: scope,
  };
  const roadmaps = getStoredRoadmaps(scope);
  const index = roadmaps.findIndex((r) => r.id === scopedRoadmap.id);
  if (index >= 0) {
    roadmaps[index] = scopedRoadmap;
  } else {
    roadmaps.unshift(scopedRoadmap);
  }
  saveRoadmaps(roadmaps, scope);
  setActiveRoadmapId(scopedRoadmap.id, scope);

  void syncRoadmapToSupabase(scopedRoadmap, scope, explicitUserId);
}

export async function renameRoadmapInStorage(
  roadmapId: string,
  newTitle: string,
  scope = "guest",
  explicitUserId?: string | null
): Promise<Roadmap | null> {
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) return null;

  const roadmaps = getStoredRoadmaps(scope);
  const target = roadmaps.find((r) => r.id === roadmapId);
  if (!target) return null;

  const updated: Roadmap = {
    ...target,
    courseTitle: cleanTitle,
    updatedAt: new Date().toISOString(),
  };

  saveRoadmap(updated, scope, explicitUserId);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("roadmaps")
        .update({
          course_title: cleanTitle,
          payload: { ...updated, _ownerScope: scope },
          updated_at: updated.updatedAt,
        })
        .eq("id", `${scope}__${roadmapId}`);
    } catch {
      // Non-blocking cleanup for legacy prefixed row if any
    }
  }

  return updated;
}

export async function deleteRoadmapFromStorage(
  roadmapId: string,
  scope = "guest"
): Promise<Roadmap[]> {
  const current = getStoredRoadmaps(scope);
  const remaining = current.filter((r) => r.id !== roadmapId);
  saveRoadmaps(remaining, scope);

  if (getActiveRoadmapId(scope) === roadmapId) {
    if (remaining.length > 0) {
      setActiveRoadmapId(remaining[0].id, scope);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem(activeIdKey(scope));
    }
  }

  if (isSupabaseConfigured && supabase) {
    const deleteTasks: Array<PromiseLike<unknown>> = [
      supabase.from("roadmaps").delete().eq("id", roadmapId),
      supabase.from("roadmaps").delete().eq("id", `${scope}__${roadmapId}`),
    ];

    if (scope.startsWith("wallet_")) {
      const wallet = scope.slice("wallet_".length);
      deleteTasks.push(
        supabase
          .from("user_roadmaps")
          .delete()
          .eq("id", `${wallet}_${roadmapId}`)
      );
    }

    try {
      await Promise.all(deleteTasks);
    } catch (err) {
      console.warn("[storage] Failed deleting roadmap from Supabase:", err);
    }
  }

  return remaining;
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
