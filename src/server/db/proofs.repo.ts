import { supabase, isSupabaseConfigured } from "./supabase";
import { CuratedResource, OnChainProofRecord, Roadmap } from "@/shared/types/roadmap";

/** Persist roadmap JSON payload to Supabase when configured. */
export async function saveRoadmapToDb(roadmap: Roadmap): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    await supabase.from("roadmaps").upsert({
      id: roadmap.id,
      course_title: roadmap.courseTitle,
      payload: roadmap,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking fallback: client retains localStorage copy
  }
}

/** Save curated open-access learning resources linked to a roadmap. */
export async function saveCuratedResourcesToDb(
  roadmapId: string,
  resources: CuratedResource[]
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || resources.length === 0) return;

  try {
    const rows = resources.map((item) => ({
      id: item.id,
      roadmap_id: roadmapId,
      module_topic: item.moduleTopic,
      title: item.title,
      url: item.url,
      source_type: item.sourceType,
    }));

    await supabase.from("curated_resources").upsert(rows, { onConflict: "id" });
  } catch {
    // Non-blocking persistence
  }
}

/** Fetch curated learning resources for a roadmap from Supabase. */
export async function getCuratedResourcesFromDb(roadmapId: string): Promise<CuratedResource[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from("curated_resources")
      .select("id, roadmap_id, module_topic, title, url, source_type")
      .eq("roadmap_id", roadmapId);

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      roadmapId: row.roadmap_id,
      moduleTopic: row.module_topic,
      title: row.title,
      url: row.url,
      sourceType: row.source_type === "wikipedia" ? "wikipedia" : "openalex",
    }));
  } catch {
    return [];
  }
}

/** Record an on-chain commitment or milestone verification proof in Supabase. */
export async function saveOnChainProofToDb(proof: OnChainProofRecord): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase.from("onchain_proofs").upsert({
      id: proof.id,
      roadmap_id: proof.roadmapId,
      wallet_address: proof.walletAddress,
      roadmap_hash: proof.roadmapHash,
      ipfs_cid: proof.ipfsCid ?? null,
      tx_hash: proof.txHash,
      chain_id: proof.chainId,
      status: proof.status,
      created_at: proof.createdAt,
    });
    if (error) {
      console.error("[proofs.repo] Failed to persist onchain_proofs:", error.message);
    }
  } catch {
    // Non-blocking persistence
  }
}

/** Retrieve on-chain proof logs filtered by roadmapId or walletAddress. */
export async function getOnChainProofsFromDb(filters?: {
  roadmapId?: string;
  walletAddress?: string;
}): Promise<OnChainProofRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let query = supabase
      .from("onchain_proofs")
      .select("id, roadmap_id, wallet_address, roadmap_hash, ipfs_cid, tx_hash, chain_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (filters?.roadmapId) {
      query = query.eq("roadmap_id", filters.roadmapId);
    }
    if (filters?.walletAddress) {
      query = query.eq("wallet_address", filters.walletAddress);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      roadmapId: row.roadmap_id,
      walletAddress: row.wallet_address,
      roadmapHash: row.roadmap_hash,
      ipfsCid: row.ipfs_cid ?? undefined,
      txHash: row.tx_hash,
      chainId: row.chain_id,
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
