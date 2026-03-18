// useSessionLog — records mock interview timer sessions to localStorage
// Each session: { id, date, durationSec, patternId, patternName, rating | null }
import { useState, useCallback } from "react";

const STORAGE_KEY = "meta-guide-session-log";

export type SessionEntry = {
  id: string;
  date: string;       // ISO datetime string
  durationSec: number;
  patternId?: string;
  patternName?: string;
  rating?: number | null;
  type: "coding" | "behavioral";
  label?: string;     // for behavioral sessions
};

function loadLog(): SessionEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveLog(log: SessionEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch { /* ignore */ }
}

export function useSessionLog() {
  const [log, setLog] = useState<SessionEntry[]>(loadLog);

  const addSession = useCallback((entry: Omit<SessionEntry, "id" | "date">) => {
    const newEntry: SessionEntry = {
      ...entry,
      id:   Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
    };
    setLog((prev) => {
      const next = [newEntry, ...prev].slice(0, 100); // keep last 100 sessions
      saveLog(next);
      return next;
    });
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
    saveLog([]);
  }, []);

  return { log, addSession, clearLog };
}
