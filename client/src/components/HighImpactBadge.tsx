/**
 * HighImpactBadge — shared visual system for the 10 high-impact features.
 *
 * Components:
 *   <HighImpactBadge />          — "★ HIGH IMPACT" pill badge
 *   <HighImpactWrapper>          — glowing card wrapper with animated border
 *   <HighImpactSectionHeader />  — section header with flame icon and stats
 */

import { ReactNode } from "react";
import { Flame, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

// ── Badge ──────────────────────────────────────────────────────────────────
interface HighImpactBadgeProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "orange" | "red" | "violet" | "emerald";
}

export function HighImpactBadge({
  label = "HIGH IMPACT",
  size = "md",
  variant = "orange",
}: HighImpactBadgeProps) {
  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5 gap-1",
    md: "text-[10px] px-2 py-1 gap-1",
    lg: "text-xs px-3 py-1.5 gap-1.5",
  };
  const variantClasses = {
    orange: "bg-orange-500/15 text-orange-600 border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40",
    red: "bg-red-500/15 text-red-600 border-red-400/40 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40",
    violet: "bg-violet-500/15 text-violet-600 border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/40",
    emerald: "bg-emerald-500/15 text-emerald-600 border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40",
  };
  return (
    <span
      className={`inline-flex items-center font-bold tracking-widest uppercase rounded-full border ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      <Flame size={size === "sm" ? 9 : size === "lg" ? 13 : 11} className="flex-shrink-0" />
      {label}
    </span>
  );
}

// ── Wrapper ────────────────────────────────────────────────────────────────
interface HighImpactWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: "orange" | "violet" | "emerald" | "blue";
  animate?: boolean;
}

export function HighImpactWrapper({
  children,
  className = "",
  variant = "orange",
  animate = true,
}: HighImpactWrapperProps) {
  const glowMap = {
    orange: "shadow-[0_0_0_1px_rgba(249,115,22,0.3),0_0_20px_rgba(249,115,22,0.08)] dark:shadow-[0_0_0_1px_rgba(249,115,22,0.4),0_0_24px_rgba(249,115,22,0.12)]",
    violet: "shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_20px_rgba(139,92,246,0.08)] dark:shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_24px_rgba(139,92,246,0.12)]",
    emerald: "shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_0_20px_rgba(16,185,129,0.08)] dark:shadow-[0_0_0_1px_rgba(16,185,129,0.4),0_0_24px_rgba(16,185,129,0.12)]",
    blue: "shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.08)] dark:shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_24px_rgba(59,130,246,0.12)]",
  };
  const borderMap = {
    orange: "border-orange-200/60 dark:border-orange-800/40",
    violet: "border-violet-200/60 dark:border-violet-800/40",
    emerald: "border-emerald-200/60 dark:border-emerald-800/40",
    blue: "border-blue-200/60 dark:border-blue-800/40",
  };

  const Wrapper = animate ? motion.div : "div";
  const animProps = animate
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : {};

  return (
    <Wrapper
      {...(animProps as Record<string, unknown>)}
      className={`rounded-xl border ${borderMap[variant]} ${glowMap[variant]} bg-white dark:bg-gray-900/80 ${className}`}
    >
      {children}
    </Wrapper>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
interface HighImpactSectionHeaderProps {
  title: string;
  subtitle?: string;
  stat?: string;
  icon?: ReactNode;
  variant?: "orange" | "violet" | "emerald" | "blue";
}

export function HighImpactSectionHeader({
  title,
  subtitle,
  stat,
  icon,
  variant = "orange",
}: HighImpactSectionHeaderProps) {
  const bgMap = {
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border-orange-100 dark:border-orange-900/30",
    violet: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-100 dark:border-violet-900/30",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-100 dark:border-emerald-900/30",
    blue: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/30",
  };
  const textMap = {
    orange: "text-orange-700 dark:text-orange-400",
    violet: "text-violet-700 dark:text-violet-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
    blue: "text-blue-700 dark:text-blue-400",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-r ${bgMap[variant]} p-4 mb-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${textMap[variant]}`}>
            {icon ?? <Flame size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className={`font-bold text-sm ${textMap[variant]}`}>{title}</h3>
              <HighImpactBadge size="sm" variant={variant === "blue" ? "violet" : variant} />
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        {stat && (
          <div className={`flex items-center gap-1 text-xs font-bold ${textMap[variant]} flex-shrink-0`}>
            <TrendingUp size={12} />
            {stat}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Impact Callout Banner ──────────────────────────────────────────────────
interface ImpactCalloutProps {
  children: ReactNode;
  variant?: "orange" | "red" | "violet" | "emerald";
}

export function ImpactCallout({ children, variant = "orange" }: ImpactCalloutProps) {
  const map = {
    orange: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-300",
    red: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800/40 dark:text-red-300",
    violet: "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-950/30 dark:border-violet-800/40 dark:text-violet-300",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-300",
  };
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${map[variant]}`}>
      <Zap size={13} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
