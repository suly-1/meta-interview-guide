/**
 * AdminPinGate — transparent passthrough.
 * PIN requirement removed: all users with site access can use admin features.
 * The exported helpers are kept for backward-compat with pages that import them.
 */
import type { ReactNode } from "react";

// Always returns a truthy string so existing `!!getAdminToken()` checks pass
export function getAdminToken(): string {
  return "open";
}

export function clearAdminToken(): void {
  // no-op
}

interface AdminPinGateProps {
  children: ReactNode;
}

export default function AdminPinGate({ children }: AdminPinGateProps) {
  return <>{children}</>;
}
