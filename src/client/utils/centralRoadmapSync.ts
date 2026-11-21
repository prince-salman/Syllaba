"use client";

import { Roadmap } from "@/shared/types/roadmap";
import { supabase, isSupabaseConfigured } from "@/server/db/supabase";
import {
  saveRoadmap as saveLocalRoadmap,
  getStoredRoadmaps as getLocalRoadmaps,
  resolveOwnerScope,
} from "@/client/utils/storage";
import { upsertWalletUserToPublicUsers } from "@/client/utils/usersSync";

export function normalizeWalletAddress(address?: string | null): string | null {
  if (!address) return null;
  return address.trim().toLowerCase();
}

export async function syncRoadmapToCentral(
  walletAddress: string,
  roadmap: Roadmap,
  onchainProofTx?: string
): Promise<void> {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized || !isSupabaseConfigured || !supabase || !roadmap?.id) return;

  const ownerScope = `wallet_${normalized}`;

  try {
    await upsertWalletUserToPublicUsers({ walletAddress: normalized });

    const enrichedPayload: Roadmap & {
      _ownerScope: string;
      onchainProofTx?: string;
    } = {
      ...roadmap,
      walletAddress: normalized,
      _ownerScope: ownerScope,
      ...(onchainProofTx ? { onchainProofTx } : {}),
    };

    const { error } = await supabase.from("roadmaps").upsert(
      {
        id: roadmap.id,
        course_title: roadmap.courseTitle,
        user_id: ownerScope,
        owner_scope: ownerScope,
        payload: enrichedPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error && (error.code === "42703" || error.code === "23503")) {
      await supabase.from("roadmaps").upsert(
        {
          id: roadmap.id,
          course_title: roadmap.courseTitle,
          payload: enrichedPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } else if (error) {
      console.warn("[centralSync] Could not upsert roadmaps:", error.message);
    }
  } catch (err) {
    console.warn("[centralSync] Unexpected error syncing roadmap:", err);
  }
}

export async function fetchCentralRoadmapsByWallet(
  walletAddress: string
): Promise<Roadmap[]> {
  const normalized = normalizeWalletAddress(walletAddress);
  if (!normalized) return [];

  const scope = resolveOwnerScope(normalized, null);
  const localRoadmaps = getLocalRoadmaps(scope);

  if (!isSupabaseConfigured || !supabase) {
    return localRoadmaps;
  }

  try {
    const merged = new Map<string, Roadmap>();

    // Primary relational source: public.roadmaps with owner_scope column
    const { data: relationalData, error: relError } = await supabase
      .from("roadmaps")
      .select("id, course_title, payload, updated_at")
      .eq("owner_scope", scope)
      .order("updated_at", { ascending: false });

    if (!relError && relationalData) {
      for (const row of relationalData) {
        const rm = row.payload as Roadmap | null;
        if (rm && rm.id) {
          merged.set(rm.id, {
            ...rm,
            courseTitle: row.course_title || rm.courseTitle,
          });
        }
      }
    }

    // Legacy read fallback: old user_roadmaps rows + prefixed roadmaps rows
    const [{ data: legacyWalletData }, { data: legacyPrefixedData }] =
      await Promise.all([
        supabase
          .from("user_roadmaps")
          .select("roadmap_data, updated_at")
          .eq("wallet_address", normalized)
          .order("updated_at", { ascending: false }),
        supabase
          .from("roadmaps")
          .select("id, payload, updated_at")
          .like("id", `${scope}__%`)
          .order("updated_at", { ascending: false }),
      ]);

    for (const row of legacyWalletData ?? []) {
      const rm = row.roadmap_data as Roadmap | null;
      if (rm && rm.id && !merged.has(rm.id)) {
        merged.set(rm.id, rm);
      }
    }

    for (const row of legacyPrefixedData ?? []) {
      const rm = row.payload as Roadmap | null;
      if (rm && rm.id && !merged.has(rm.id)) {
        merged.set(rm.id, rm);
      }
    }

    if (merged.size === 0) {
      return localRoadmaps;
    }

    for (const rm of merged.values()) {
      saveLocalRoadmap(rm, scope, scope);
    }
    for (const local of localRoadmaps) {
      if (!merged.has(local.id)) {
        merged.set(local.id, local);
      }
    }

    return Array.from(merged.values());
  } catch (err) {
    console.warn("[centralSync] Unexpected fetch error:", err);
    return localRoadmaps;
  }
}
