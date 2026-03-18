// usePatternNotes — localStorage-persisted notes for each coding pattern
import { useState, useCallback } from "react";

const STORAGE_KEY = "meta-guide-pattern-notes";

function load(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

function save(notes: Record<string, string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch { /* ignore */ }
}

export function usePatternNotes() {
  const [notes, setNotes] = useState<Record<string, string>>(load);

  const setNote = useCallback((patternId: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev, [patternId]: text };
      save(next);
      return next;
    });
  }, []);

  const clearNote = useCallback((patternId: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      delete next[patternId];
      save(next);
      return next;
    });
  }, []);

  const getNote = useCallback((patternId: string): string => {
    return notes[patternId] ?? "";
  }, [notes]);

  return { getNote, setNote, clearNote };
}
