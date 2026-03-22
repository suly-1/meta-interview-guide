/**
 * XPContext — provides XP state and addXP function to the entire app
 * Also renders the XPToast queue
 *
 * NOTE: useXPContext hook is in ./useXPContext.ts (split for Vite Fast Refresh compatibility)
 */
import React, { createContext, useCallback, useState } from "react";
import { useXP } from "@/hooks/useXP";
import type { XPEvent } from "@/hooks/useXP";
import XPToast from "@/components/XPToast";

export interface XPContextType {
  totalXP: number;
  events: XPEvent[];
  todayXP: number;
  levelInfo: ReturnType<typeof import("@/hooks/useXP").getLevelInfo>;
  addXP: (type: XPEvent["type"], label: string, customAmount?: number) => number;
}

export const XPContext = createContext<XPContextType | undefined>(undefined);

interface ToastItem {
  id: string;
  amount: number;
  label: string;
}

export function XPProvider({ children }: { children: React.ReactNode }) {
  const { totalXP, events, todayXP, levelInfo, addXP: rawAddXP } = useXP();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addXP = useCallback((type: XPEvent["type"], label: string, customAmount?: number) => {
    const amount = rawAddXP(type, label, customAmount);
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, amount, label }]);
    return amount;
  }, [rawAddXP]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <XPContext.Provider value={{ totalXP, events, todayXP, levelInfo, addXP }}>
      {children}
      {/* Toast queue — only show the most recent one at a time */}
      {toasts.slice(-1).map(toast => (
        <XPToast
          key={toast.id}
          amount={toast.amount}
          label={toast.label}
          onDone={() => removeToast(toast.id)}
        />
      ))}
    </XPContext.Provider>
  );
}
