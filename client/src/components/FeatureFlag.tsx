/**
 * FeatureFlag — declarative wrapper for feature-flagged UI sections.
 *
 * Renders children only when the flag VITE_FEATURE_{name} is set to "true".
 * Optionally renders a fallback when the flag is disabled.
 *
 * Usage:
 *   <FeatureFlag name="NEW_SCORING_UI">
 *     <NewScoringComponent />
 *   </FeatureFlag>
 *
 *   <FeatureFlag name="EXPERIMENTAL_AI" fallback={<LegacyAI />}>
 *     <ExperimentalAI />
 *   </FeatureFlag>
 */

import { ReactNode } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface FeatureFlagProps {
  /** Flag name without the VITE_FEATURE_ prefix. Case-insensitive. */
  name: string;
  /** Content to render when the flag is enabled. */
  children: ReactNode;
  /** Optional fallback to render when the flag is disabled. Defaults to null. */
  fallback?: ReactNode;
}

export default function FeatureFlag({ name, children, fallback = null }: FeatureFlagProps) {
  const enabled = useFeatureFlag(name);
  return <>{enabled ? children : fallback}</>;
}
