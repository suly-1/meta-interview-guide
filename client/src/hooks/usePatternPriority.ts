import { useState, useEffect } from "react";
import { PATTERNS } from "@/lib/guideData";

const STORAGE_KEY = "meta-guide-pattern-priority";

export function usePatternPriority() {
  const defaultOrder = PATTERNS.map(p => p.id);

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        // Ensure all current patterns are included
        const merged = [...parsed.filter(id => defaultOrder.includes(id))];
        defaultOrder.forEach(id => { if (!merged.includes(id)) merged.push(id); });
        return merged;
      }
    } catch {}
    return defaultOrder;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {}
  }, [order]);

  const moveUp = (id: string) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const resetOrder = () => setOrder(defaultOrder);

  return { order, moveUp, moveDown, resetOrder };
}
