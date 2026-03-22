/**
 * useXPContext — hook to consume XPContext
 * Kept in a separate file from XPContext.tsx so Vite Fast Refresh
 * can handle the provider (component) and hook separately.
 */
import { useContext } from "react";
import { XPContext } from "./XPContext";
import type { XPContextType } from "./XPContext";

export function useXPContext(): XPContextType {
  const ctx = useContext(XPContext);
  if (!ctx) throw new Error("useXPContext must be used within XPProvider");
  return ctx;
}
