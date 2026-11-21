"use client";

import { createClient } from "@supabase/supabase-js";
import { Roadmap } from "@/shared/types/roadmap";
import {
  saveRoadmap as saveLocalRoadmap,
  getStoredRoadmaps as getLocalRoadmaps,
} from "@/client/utils/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  if (!normalized || !supabase || !roadmap?.id) return;

  try {
    const payload: Record<string, unknown> = {
      id: `${normalized}_${roadmap.id}`,
      wallet_address: normalized,
      course_title: roadmap.courseTitle,
      roadmap_data: roadmap,
      updated_at: new Date().toISOString(),
    };

    if (onchainProofTx) {
      payload.onchain_proof_tx = onchainProofTx;
    }

    const { error } = await supabase
      .from("user_roadmaps")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("[centralSync] Could not upsert user_roadmaps:", error.message);
    }
  } catch (err) {
    console.warn("[centralSync] Unexpected error syncing roadmap:", err);
  }
}

export async function fetchCentralRoadmapsByWallet(
  walletAddress: string
): Promise<Roadmap[]> {
  const normalized = normalizeWalletAddress(walletAddress);
  const localRoadmaps = getLocalRoadmaps();

  if (!normalized || !supabase) {
    return localRoadmaps;
  }

  try {
    const { data, error } = await supabase
      .from("user_roadmaps")
      .select("roadmap_data, updated_at")
      .eq("wallet_address", normalized)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[centralSync] Could not fetch user_roadmaps:", error.message);
      return localRoadmaps;
    }

    const remoteRoadmaps = (data ?? [])
      .map((row) => row.roadmap_data as Roadmap | null)
      .filter((item): item is Roadmap => Boolean(item && item.id));

    if (remoteRoadmaps.length === 0) {
      return localRoadmaps;
    }

    const merged = new Map<string, Roadmap>();
    for (const rm of remoteRoadmaps) {
      merged.set(rm.id, rm);
      saveLocalRoadmap(rm);
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
