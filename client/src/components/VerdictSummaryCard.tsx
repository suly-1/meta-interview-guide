// VerdictSummaryCard — persistent readiness widget for the Overview tab.
// Reads the latest verdict from "verdict-engine-result" and the latest weak
// signal analysis from "weak-signal-analysis" (both stored by their respective
// tabs). Shows IC level projection, overall score, verdict badge, and top weak
// signal with its targeted drill — all without any network call.
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Minus } from "lucide-react";

// ── Types (mirrored from VerdictEngineTab / WeakSignalDetectorTab) ────────────
interface VerdictResult {
  overallScore: number;
  verdict: "strong_pass" | "pass" | "borderline" | "fail" | "strong_fail";
  icLevel: "IC5" | "IC6" | "IC7";
  strengths: string[];
  criticalGaps: string[];
  hiringRecommendation: string;
}

interface WeakSignalAnalysis {
  topWeakSignals: Array<{
    signalId: string;
    score: number;
    evidence: string[];
    targetedDrill: string;
  }>;
  overallPattern: string;
  priorityAction: string;
}

// ── Signal name lookup (matches WeakSignalDetectorTab SIGNALS array) ──────────
const SIGNAL_NAMES: Record<string, string> = {
  nfr: "Non-Functional Requirements",
  tradeoffs: "Tradeoff Articulation",
  requirements: "Requirements Clarification",
  complexity: "Complexity Analysis",
  edge_cases: "Edge Case Coverage",
  star_specificity: "STAR Answer Specificity",
  ownership: "Ownership Signals",
  monitoring: "Observability & Monitoring",
  deep_dive: "Deep Dive Readiness",
  time_management: "Time Management",
};

// ── Verdict badge config ──────────────────────────────────────────────────────
const VERDICT_CONFIG: Record<
  VerdictResult["verdict"],
  { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle }
> = {
  strong_pass: {
    label: "Strong Pass",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    Icon: CheckCircle,
  },
  pass: {
    label: "Pass",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    Icon: CheckCircle,
  },
  borderline: {
    label: "Borderline",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    Icon: Minus,
  },
  fail: {
    label: "Fail",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    Icon: XCircle,
  },
  strong_fail: {
    label: "Strong Fail",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    Icon: XCircle,
  },
};

// ── IC level color ────────────────────────────────────────────────────────────
const icColor = (level: string) =>
  level === "IC7"
    ? "text-violet-400"
    : level === "IC6"
      ? "text-blue-400"
      : "text-muted-foreground";

// ── Score ring (0–100) ────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color =
    pct >= 75 ? "#34d399" : pct >= 55 ? "#60a5fa" : pct >= 40 ? "#fbbf24" : "#f87171";
  return (
    <svg width={72} height={72} className="shrink-0">
      <circle cx={36} cy={36} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-secondary" />
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x={36} y={40} textAnchor="middle" className="fill-foreground" fontSize={14} fontWeight={700}>
        {Math.round(pct)}
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function VerdictSummaryCard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [verdict] = useLocalStorage<VerdictResult | null>("verdict-engine-result", null);
  const [weakAnalysis] = useLocalStorage<WeakSignalAnalysis | null>("weak-signal-analysis", null);
  const [analysisDate] = useLocalStorage<number | null>("weak-signal-analysis-date", null);

  const hasVerdict = verdict !== null;
  const hasWeakSignal = weakAnalysis && weakAnalysis.topWeakSignals.length > 0;
  const topWeak = hasWeakSignal ? weakAnalysis.topWeakSignals[0] : null;
  const topWeakName = topWeak ? (SIGNAL_NAMES[topWeak.signalId] ?? topWeak.signalId) : null;

  // Don't render if neither verdict nor weak signal analysis exists yet
  if (!hasVerdict && !hasWeakSignal) {
    return (
      <div className="prep-card p-5 border-dashed border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">IC Readiness Snapshot</span>
          <span className="badge badge-gray">No data yet</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Run the{" "}
          <button
            onClick={() => onNavigate?.("verdict")}
            className="text-blue-400 hover:underline font-semibold"
          >
            Verdict Engine
          </button>{" "}
          and{" "}
          <button
            onClick={() => onNavigate?.("weak-signals")}
            className="text-blue-400 hover:underline font-semibold"
          >
            Weak Signal Detector
          </button>{" "}
          to populate this card with your IC level projection and top weak signal.
        </p>
      </div>
    );
  }

  const cfg = verdict ? VERDICT_CONFIG[verdict.verdict] : null;

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-400" />
          <span className="text-sm font-bold text-foreground">IC Readiness Snapshot</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onNavigate?.("verdict")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Update →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Verdict + IC Level */}
        {hasVerdict && verdict && cfg && (
          <div className="flex items-center gap-4">
            <ScoreRing score={verdict.overallScore} />
            <div className="space-y-1.5">
              <div className={`text-2xl font-black ${icColor(verdict.icLevel)}`}>
                {verdict.icLevel}
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
              >
                <cfg.Icon size={11} />
                {cfg.label}
              </div>
              <div className="text-[10px] text-muted-foreground leading-snug max-w-[160px]">
                {verdict.hiringRecommendation.slice(0, 80)}
                {verdict.hiringRecommendation.length > 80 ? "…" : ""}
              </div>
            </div>
          </div>
        )}

        {/* Right: Top Weak Signal */}
        {topWeak && topWeakName && (
          <div
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 cursor-pointer hover:bg-amber-500/15 transition-all"
            onClick={() => onNavigate?.("weak-signals")}
            title="Click to open Weak Signal Detector"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-400">Top Weak Signal</span>
              <span className="ml-auto text-xs font-bold text-amber-400">
                {Math.round(topWeak.score)}%
              </span>
            </div>
            <div className="text-xs font-semibold text-foreground">{topWeakName}</div>
            <div className="text-[10px] text-muted-foreground leading-snug">
              <span className="font-semibold text-amber-300">Drill: </span>
              {topWeak.targetedDrill.slice(0, 100)}
              {topWeak.targetedDrill.length > 100 ? "…" : ""}
            </div>
            {analysisDate && (
              <div className="text-[9px] text-muted-foreground/60">
                Analyzed {new Date(analysisDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Critical gaps strip */}
      {verdict && verdict.criticalGaps.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-[10px] font-bold text-red-400 mb-1.5">Critical Gaps</div>
          <ul className="space-y-0.5">
            {verdict.criticalGaps.slice(0, 2).map((gap, i) => (
              <li key={i} className="text-[10px] text-foreground flex gap-1.5">
                <span className="text-red-400 shrink-0">•</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
