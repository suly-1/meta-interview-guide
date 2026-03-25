/**
 * PinGateContext
 *
 * Stores the short-lived admin PIN token in React state only.
 * The token is NEVER written to localStorage, sessionStorage, or cookies.
 * It disappears the moment the user closes or refreshes the tab.
 *
 * Usage:
 *   const { pinToken, setPinToken, clearPinToken } = usePinGate();
 */
import { createContext, useContext, useState, type ReactNode } from "react";

interface PinGateContextValue {
  /** The signed JWT returned by trpc.admin.verifyPin, or null if not authenticated. */
  pinToken: string | null;
  /** Store a valid token after successful PIN verification. */
  setPinToken: (token: string) => void;
  /** Clear the token (e.g. on logout or expiry). */
  clearPinToken: () => void;
}

const PinGateContext = createContext<PinGateContextValue | null>(null);

export function PinGateProvider({ children }: { children: ReactNode }) {
  const [pinToken, setPinTokenState] = useState<string | null>(null);

  const setPinToken = (token: string) => setPinTokenState(token);
  const clearPinToken = () => setPinTokenState(null);

  return (
    <PinGateContext.Provider value={{ pinToken, setPinToken, clearPinToken }}>
      {children}
    </PinGateContext.Provider>
  );
}

export function usePinGate(): PinGateContextValue {
  const ctx = useContext(PinGateContext);
  if (!ctx) {
    throw new Error("usePinGate must be used inside <PinGateProvider>");
  }
  return ctx;
}
