import { useState, useEffect, useCallback } from "react";

export function useProgress(key: string, total: number) {
  const storageKey = `meta-guide-progress-${key}`;

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(checked)));
    } catch {
      // ignore storage errors
    }
  }, [checked, storageKey]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setChecked(new Set());
  }, []);

  const count = checked.size;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return { checked, toggle, reset, count, total, pct };
}
