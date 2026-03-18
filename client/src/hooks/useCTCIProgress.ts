import { useState, useEffect, useCallback } from 'react';

export interface ProblemProgress {
  solved: boolean;
  starred: boolean;
  notes: string;
  solvedAt?: string;
}

export type CTCIProgressMap = Record<number, ProblemProgress>;

const STORAGE_KEY = 'ctci_progress_v1';

export function useCTCIProgress() {
  const [progress, setProgress] = useState<CTCIProgressMap>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {}
  }, [progress]);

  const toggleSolved = useCallback((id: number) => {
    setProgress(prev => {
      const cur = prev[id] || { solved: false, starred: false, notes: '' };
      return {
        ...prev,
        [id]: {
          ...cur,
          solved: !cur.solved,
          solvedAt: !cur.solved ? new Date().toISOString() : undefined,
        },
      };
    });
  }, []);

  const toggleStarred = useCallback((id: number) => {
    setProgress(prev => {
      const cur = prev[id] || { solved: false, starred: false, notes: '' };
      return { ...prev, [id]: { ...cur, starred: !cur.starred } };
    });
  }, []);

  const setNotes = useCallback((id: number, notes: string) => {
    setProgress(prev => {
      const cur = prev[id] || { solved: false, starred: false, notes: '' };
      return { ...prev, [id]: { ...cur, notes } };
    });
  }, []);

  const resetAll = useCallback(() => {
    if (confirm('Reset all CTCI progress? This cannot be undone.')) {
      setProgress({});
    }
  }, []);

  const getSolvedCount = useCallback(() =>
    Object.values(progress).filter(p => p.solved).length, [progress]);

  const getStarredCount = useCallback(() =>
    Object.values(progress).filter(p => p.starred).length, [progress]);

  return { progress, toggleSolved, toggleStarred, setNotes, resetAll, getSolvedCount, getStarredCount };
}
