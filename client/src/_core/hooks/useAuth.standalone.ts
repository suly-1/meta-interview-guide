/**
 * Standalone useAuth mock — used in the self-contained HTML export.
 * Returns a mock admin user so admin pages (feedback, users, access, etc.)
 * render correctly. No real auth is performed; all data is from localStorage.
 */

export function useAuth() {
  return {
    user: {
      id: 1,
      name: "Admin",
      email: "",
      role: "admin" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSignedIn: new Date().toISOString(),
      disclaimerAcknowledgedAt: null,
      blocked: 0,
      blockReason: null,
      blockedUntil: null,
    },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: () => {},
  };
}

export function getLoginUrl(returnPath?: string) {
  return "#";
}
