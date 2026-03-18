import { useState, useCallback } from "react";

const STORAGE_KEY = "meta-guide-story-notes";

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
}

export function useStoryNotes() {
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);

  const setNote = useCallback((id: string, value: string) => {
    setNotes((prev) => {
      const next = { ...prev, [id]: value };
      saveNotes(next);
      return next;
    });
  }, []);

  const getNote = useCallback(
    (id: string) => notes[id] ?? "",
    [notes]
  );

  return { getNote, setNote };
}
