/**
 * ICLevelContext — manages IC level filter (IC4/IC5 vs IC6/IC7)
 * Persisted to localStorage so the preference survives page reloads.
 *
 * "junior"  → IC4 / IC5  (hides senior-only content)
 * "senior"  → IC6 / IC7  (shows everything, default)
 */
import React, { createContext, useContext, useEffect, useState } from "react";

export type ICLevel = "junior" | "senior";

interface ICLevelContextType {
  icLevel: ICLevel;
  setICLevel: (level: ICLevel) => void;
  isSenior: boolean;
}

const ICLevelContext = createContext<ICLevelContextType | undefined>(undefined);

const STORAGE_KEY = "meta-guide-ic-level-v1";

export function ICLevelProvider({ children }: { children: React.ReactNode }) {
  const [icLevel, setICLevelState] = useState<ICLevel>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ICLevel | null;
      return stored === "junior" || stored === "senior" ? stored : "senior";
    } catch {
      return "senior";
    }
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
    <ICLevelContext.Provider value={{ icLevel, setICLevel, isSenior: icLevel === "senior" }}>
      {children}
    </ICLevelContext.Provider>
  );
}

export function useICLevel() {
  const ctx = useContext(ICLevelContext);
  if (!ctx) throw new Error("useICLevel must be used within ICLevelProvider");
  return ctx;
}
