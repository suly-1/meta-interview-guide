/**
 * useAuth.standalone.ts — Standalone mock for the static GitHub Pages build.
 *
 * This file is aliased to replace @/_core/hooks/useAuth in vite.standalone.config.ts.
 * Returns a mock admin user so all admin pages render without a server.
 * No real authentication is performed in standalone mode.
 */

export function useAuth(_options?: { redirectOnUnauthenticated?: boolean; redirectPath?: string }) {
  return {
    user: {
      id: 1,
      name: "Admin",
      email: "",
      role: "admin" as const,
      openId: "standalone-admin",
      isBanned: 0,
      bannedUntil: null,
      banReason: null,
      disclaimerAcknowledgedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}

export function getLoginUrl(_returnPath?: string): string {
  return "#";
}
