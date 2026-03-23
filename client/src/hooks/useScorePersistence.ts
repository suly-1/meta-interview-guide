/**
 * useScorePersistence — thin wrapper around trpc.scores.save
 *
 * Saves a score to the DB if the user is authenticated.
 * Silently falls back (no-op) for unauthenticated users.
 *
 * Usage:
 *   const { saveScore, isSaving } = useScorePersistence("ai_interrupt_mode");
 *   saveScore("response_quality", 85, { question: "..." });
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function useScorePersistence(feature: string) {
  const { isAuthenticated } = useAuth();
  const saveMutation = trpc.scores.save.useMutation();

  const saveScore = useCallback(
    (
      scoreType: string,
      scoreValue: number,
      metadata?: Record<string, unknown>
    ) => {
      if (!isAuthenticated) return; // silent no-op for guests
      saveMutation.mutate({ feature, scoreType, scoreValue, metadata });
    },
    [isAuthenticated, feature, saveMutation]
  );

  return {
    saveScore,
    isSaving: saveMutation.isPending,
  };
}

/**
 * useMyScores — loads all persisted scores for the current user.
 * Returns a map of feature → { latest, history, scoreType, lastAt }
 */
export function useMyScores() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.scores.getMyScores.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  return { scores: data ?? {}, isLoading };
}
