/**
 * Feature Flag System
 *
 * Flags are controlled via Vite environment variables prefixed with VITE_FEATURE_.
 * Set a flag to "true" to enable it, anything else (or absent) disables it.
 *
 * Example .env:
 *   VITE_FEATURE_NEW_SCORING_UI=true
 *   VITE_FEATURE_EXPERIMENTAL_AI=true
 *
 * Usage in components:
 *   const isEnabled = useFeatureFlag("NEW_SCORING_UI");
 *   if (!isEnabled) return null;
 *
 * Usage with FeatureFlag wrapper (see FeatureFlag.tsx):
 *   <FeatureFlag name="EXPERIMENTAL_AI">
 *     <ExperimentalAIComponent />
 *   </FeatureFlag>
 *
 * Benefits:
 * - A broken new feature can be disabled instantly by setting the env var to "false"
 *   and redeploying — no code rollback needed.
 * - Flags default to OFF (false) if not set, so new features are hidden until
 *   explicitly enabled.
 * - All flags are evaluated at build time (Vite replaces them), so there is zero
 *   runtime cost.
 */

/**
 * Returns true if the feature flag VITE_FEATURE_{name} is set to "true".
 * Flags default to false (disabled) if not set.
 */
export function useFeatureFlag(name: string): boolean {
  const key = `VITE_FEATURE_${name.toUpperCase()}`;
  // import.meta.env is replaced at build time by Vite
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value === "true";
}

/**
 * Returns a map of all currently enabled feature flags.
 * Useful for debugging — call getAllFeatureFlags() in the browser console.
 */
export function getAllFeatureFlags(): Record<string, boolean> {
  const env = import.meta.env as Record<string, string | undefined>;
  const flags: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("VITE_FEATURE_")) {
      const name = key.replace("VITE_FEATURE_", "");
      flags[name] = value === "true";
    }
  }
  return flags;
}
