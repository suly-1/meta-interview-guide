/**
 * DensityContext — manages compact/comfortable/spacious density toggle
 * Applies density class to <html> element and persists to localStorage
 */
import React, { createContext, useContext, useEffect, useState } from "react";

export type Density = "compact" | "comfortable" | "spacious";

interface DensityContextType {
  density: Density;
  setDensity: (d: Density) => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

const DENSITY_KEY = "meta-guide-density";
const DENSITY_CLASSES: Density[] = ["compact", "comfortable", "spacious"];

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>(() => {
    const stored = localStorage.getItem(DENSITY_KEY) as Density | null;
    return stored && DENSITY_CLASSES.includes(stored) ? stored : "comfortable";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all density classes first
    DENSITY_CLASSES.forEach(d => root.classList.remove(`density-${d}`));
    root.classList.add(`density-${density}`);
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  const setDensity = (d: Density) => setDensityState(d);

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity must be used within DensityProvider");
  return ctx;
}
