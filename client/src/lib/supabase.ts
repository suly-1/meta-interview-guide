// supabase.ts — stub that replaces Supabase with our own tRPC-backed implementations.
// CrossDeviceSync and Leaderboard components import from here.
// These are no-ops or localStorage-backed since we use our own DB via tRPC.

export type LeaderboardEntry = {
  handle: string;
  xp?: number;
  streak: number;
  patterns_mastered: number;
  stories_ready?: number;
  bq_ready: number;
  mock_sessions: number;
  rank?: number;
};

// CrossDeviceSync stubs — data sync is handled via tRPC onboarding/ctciProgress routers
export async function pushSync(_code: string, _data: Record<string, unknown>): Promise<void> {
  // No-op: sync is handled server-side via tRPC
}

export async function pullSync(_code: string): Promise<Record<string, unknown> | null> {
  // No-op: pull is handled server-side via tRPC
  return null;
}

// Leaderboard stubs — use tRPC leaderboard router instead
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return [];
}

export async function upsertLeaderboard(_entry: Omit<LeaderboardEntry, "rank">): Promise<void> {
  // No-op: use trpc.leaderboard.upsert instead
}

export async function removeFromLeaderboard(_handle: string): Promise<void> {
  // No-op: use trpc.leaderboard.remove instead
}
