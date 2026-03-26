/**
 * FeatureFlag — render-prop / children wrapper that gates UI behind a flag.
 *
 * Usage:
 *   <FeatureFlag name="MY_FEATURE">
 *     <MyNewComponent />
 *   </FeatureFlag>
 *
 *   // With a fallback for when the flag is off:
 *   <FeatureFlag name="MY_FEATURE" fallback={<ComingSoon />}>
 *     <MyNewComponent />
 *   </FeatureFlag>
 *
 * The flag is read from import.meta.env.VITE_FEATURE_MY_FEATURE.
 * Set it to "true" in .env or Manus Secrets to enable the feature.
 *
 * Why this exists:
 *   Every new feature should be hidden behind a flag until fully tested.
 *   If a broken feature ships, flip the flag off — no rollback needed.
 */
import { ReactNode } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface FeatureFlagProps {
  /** Flag name (without the VITE_FEATURE_ prefix), e.g. "MY_FEATURE" */
  name: string;
  /** Content to render when the flag is ON */
  children: ReactNode;
  /** Optional content to render when the flag is OFF (default: nothing) */
  fallback?: ReactNode;
}

export function FeatureFlag({
  name,
  children,
  fallback = null,
}: FeatureFlagProps) {
  const enabled = useFeatureFlag(name);
  return <>{enabled ? children : fallback}</>;
}

export default FeatureFlag;
