"use client";

import { supabase, isSupabaseConfigured } from "@/server/db/supabase";

export function normalizeWallet(address?: string | null): string | null {
  const trimmed = address?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export function resolveOwnerUserId(
  walletAddress?: string | null,
  authUserId?: string | null
): string | null {
  const uid = authUserId?.trim();
  if (uid) return `user_${uid}`;
  const wallet = normalizeWallet(walletAddress);
  if (wallet) return `wallet_${wallet}`;
  return null;
}

export async function upsertEmailUserToPublicUsers(params: {
  authUserId: string;
  email?: string | null;
  fullName?: string | null;
  walletAddress?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !params.authUserId) return;

  const userId = `user_${params.authUserId}`;
  const wallet = normalizeWallet(params.walletAddress);
  const now = new Date().toISOString();

  try {
    const payload: Record<string, unknown> = {
      id: userId,
      auth_user_id: params.authUserId,
      email: params.email ?? null,
      full_name:
        params.fullName?.trim() ||
        (params.email ? params.email.split("@")[0] : "Scholar"),
      auth_provider: wallet ? "both" : "email",
      updated_at: now,
    };

    if (wallet) {
      payload.wallet_address = wallet;
    }

    const { error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "id" });

    if (error && error.code !== "42P01") {
      console.warn("[usersSync] Email user upsert warning:", error.message);
    }
  } catch (err) {
    console.warn("[usersSync] Email user sync exception:", err);
  }
}

export async function upsertWalletUserToPublicUsers(params: {
  walletAddress: string;
  fullName?: string | null;
  authUserId?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const wallet = normalizeWallet(params.walletAddress);
  if (!wallet) return;

  const now = new Date().toISOString();

  try {
    if (params.authUserId) {
      const userId = `user_${params.authUserId}`;
      const { error } = await supabase
        .from("users")
        .update({
          wallet_address: wallet,
          auth_provider: "both",
          updated_at: now,
        })
        .eq("id", userId);

      if (!error) return;
    }

    const shortLabel = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    const { error } = await supabase.from("users").upsert(
      {
        id: `wallet_${wallet}`,
        wallet_address: wallet,
        full_name: params.fullName?.trim() || shortLabel,
        auth_provider: "wallet",
        updated_at: now,
      },
      { onConflict: "id" }
    );

    if (error && error.code !== "42P01") {
      console.warn("[usersSync] Wallet user upsert warning:", error.message);
    }
  } catch (err) {
    console.warn("[usersSync] Wallet user sync exception:", err);
  }
}

export async function updatePublicUserProfileName(
  userId: string,
  fullName: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId || !fullName.trim()) return;

  try {
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error && error.code !== "42P01") {
      console.warn("[usersSync] Profile name update warning:", error.message);
    }
  } catch {
    // Non-blocking profile mirror
  }
}
