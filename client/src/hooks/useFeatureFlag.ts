/**
 * useFeatureFlag — reads VITE_FEATURE_* environment variables to gate features.
 *
 * Usage:
 *   const enabled = useFeatureFlag('MY_FEATURE');
 *   // reads import.meta.env.VITE_FEATURE_MY_FEATURE
 *   // returns true  when the value is "true" (case-insensitive)
 *   // returns false for any other value or when the variable is absent
 *
 * In .env (or Manus Secrets):
 *   VITE_FEATURE_MY_FEATURE=true
 *
 * This hook is intentionally synchronous — env vars are baked in at build time
 * so there is no async loading state to manage.
 */
export function useFeatureFlag(name: string): boolean {
  const key = `VITE_FEATURE_${name.toUpperCase()}`;
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value?.toLowerCase() === "true";
}

/**
 * Imperative helper for use outside React components (e.g. in utility functions).
 */
export function isFeatureEnabled(name: string): boolean {
  const key = `VITE_FEATURE_${name.toUpperCase()}`;
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value?.toLowerCase() === "true";
}
