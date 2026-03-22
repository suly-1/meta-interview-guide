import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ieonbqiwzdvcwxvzjhhm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllb25icWl3emR2Y3d4dnpqaGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDg2NzAsImV4cCI6MjA4OTcyNDY3MH0.VeO9QtJwjHJ0cUxGHWskVUoWxQn4kw701U49PQgDnAk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Leaderboard helpers ────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  id?: string;
  handle: string;
  patterns_mastered: number;
  bq_ready: number;
  mock_sessions: number;
  streak: number;
  updated_at?: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("patterns_mastered", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function upsertLeaderboard(
  entry: LeaderboardEntry
): Promise<void> {
  const { error } = await supabase
    .from("leaderboard")
    .upsert(
      { ...entry, updated_at: new Date().toISOString() },
      { onConflict: "handle" }
    );
  if (error) throw error;
}

export async function removeFromLeaderboard(handle: string): Promise<void> {
  const { error } = await supabase
    .from("leaderboard")
    .delete()
    .eq("handle", handle);
  if (error) throw error;
}

// ── Cross-device sync helpers ──────────────────────────────────────────────────
export async function pushSync(
  syncCode: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("user_sync").upsert(
    {
      sync_code: syncCode.toUpperCase(),
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sync_code" }
  );
  if (error) throw error;
}

export async function pullSync(
  syncCode: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("user_sync")
    .select("data, updated_at")
    .eq("sync_code", syncCode.toUpperCase())
    .single();
  if (error) return null;
  return data?.data ?? null;
}
