/**
 * ICLevelContext — manages IC level filter with three tiers:
 *
 * "junior"  -> IC4              (hides senior-only and staff-only content)
 * "mid"     -> IC5 / Senior     (hides staff-only content, shows IC5-relevant sections)
 * "senior"  -> IC6 / IC7 / Staff+ (shows everything, default)
 */
import React, { createContext, useContext, useEffect, useState } from "react";

export type ICLevel = "junior" | "mid" | "senior";

interface ICLevelContextType {
  icLevel: ICLevel;
  setICLevel: (level: ICLevel) => void;
  /** true when IC6/IC7 (Staff+) — shows all senior/staff content */
  isSenior: boolean;
  /** true when IC5 or higher — shows IC5+ content but hides staff-only */
  isMidOrAbove: boolean;
  /** true when IC4 only — most restrictive view */
  isJunior: boolean;
}

const ICLevelContext = createContext<ICLevelContextType | undefined>(undefined);

const STORAGE_KEY = "meta-guide-ic-level-v1";

export function ICLevelProvider({ children }: { children: React.ReactNode }) {
  const [icLevel, setICLevelState] = useState<ICLevel>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ICLevel | null;
      if (stored === "junior" || stored === "mid" || stored === "senior") return stored;
    } catch {
      // ignore
    }
    return "senior";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, icLevel);
    } catch {
      // ignore
    }
  }, [icLevel]);

  const setICLevel = (level: ICLevel) => setICLevelState(level);

  return (
    <ICLevelContext.Provider value={{
      icLevel,
      setICLevel,
      isSenior: icLevel === "senior",
      isMidOrAbove: icLevel === "mid" || icLevel === "senior",
      isJunior: icLevel === "junior",
    }}>
      {children}
    </ICLevelContext.Provider>
  );
}

export function useICLevel() {
  const ctx = useContext(ICLevelContext);
  if (!ctx) throw new Error("useICLevel must be used within ICLevelProvider");
  return ctx;
}
