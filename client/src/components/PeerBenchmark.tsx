/**
 * Peer Benchmark Mode
 * After a scored session the user can see how their scores compare to an
 * anonymised cohort of candidates at the same target L-level.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function readLatestFullMockScores(): {
  codingScore: number;
  systemDesignScore: number;
  behavioralScore: number;
  xfnScore: number;
  overallScore: number;
} | null {
  try {
    const raw = localStorage.getItem("meta_full_mock_history_v1");
    if (!raw) return null;
    const arr = JSON.parse(raw) as Array<{
      overallScore?: number;
      roundResults?: Array<{ label: string; overallScore: number }>;
    }>;
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    const rounds = last.roundResults ?? [];
    const get = (label: string) =>
      rounds.find(r => r.label.toLowerCase().includes(label))?.overallScore ??
      3;
    const coding = get("coding");
    const sysdesign = get("system") || get("design");
    const behavioral = get("behavioral") || get("star");
    const xfn = get("xfn");
    const overall =
      last.overallScore ?? (coding + sysdesign + behavioral + xfn) / 4;
    return {
      codingScore: coding,
      systemDesignScore: sysdesign,
      behavioralScore: behavioral,
      xfnScore: xfn,
      overallScore: overall,
    };
  } catch {
    return null;
  }
}

function percentileLabel(p: number) {
  if (p >= 90) return { text: "Top 10%", color: "text-emerald-400" };
  if (p >= 75) return { text: "Top 25%", color: "text-blue-400" };
  if (p >= 50) return { text: "Above Median", color: "text-amber-400" };
  return { text: "Below Median", color: "text-red-400" };
}

interface BenchmarkResult {
  overallPercentile: number;
  dimensions: {
    name: string;
    userScore: number;
    percentile: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    insight: string;
  }[];
  cohortSize: number;
  topPerformerThreshold: number;
  standoutStrength: string;
  biggestGap: string;
}

// ── component ─────────────────────────────────────────────────────────────────

export function PeerBenchmark() {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [targetLevel, setTargetLevel] = useState("L6");
  const [isOpen, setIsOpen] = useState(false);
  const [manualScores, setManualScores] = useState({
    coding: 3,
    sysdesign: 3,
    behavioral: 3,
    xfn: 3,
  });

  const latestScores = readLatestFullMockScores();

  const mutation = trpc.ai.peerBenchmark.useMutation({
    onSuccess: data => {
      setResult(data);
      toast.success("Benchmark data loaded!");
    },
    onError: () => toast.error("Failed to load benchmark. Try again."),
  });

  const handleRun = () => {
    const scores = latestScores ?? {
      codingScore: manualScores.coding,
      systemDesignScore: manualScores.sysdesign,
      behavioralScore: manualScores.behavioral,
      xfnScore: manualScores.xfn,
      overallScore:
        (manualScores.coding +
          manualScores.sysdesign +
          manualScores.behavioral +
          manualScores.xfn) /
        4,
    };
    mutation.mutate({ ...scores, targetLevel });
  };

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">
            Peer Benchmark
          </span>
        </div>
        <button
          onClick={() => setIsOpen(o => !o)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {isOpen ? "Collapse" : "Configure"}
        </button>
      </div>

      {/* Config */}
      {isOpen && (
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Target Level
            </label>
            <select
              value={targetLevel}
              onChange={e => setTargetLevel(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-foreground"
            >
              {["L4", "L5", "L6", "L7"].map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {!latestScores && (
            <div className="space-y-2">
              <p className="text-xs text-amber-400">
                No Full Mock Day scores found — enter scores manually:
              </p>
              {(
                [
                  ["coding", "Coding"],
                  ["sysdesign", "System Design"],
                  ["behavioral", "Behavioral"],
                  ["xfn", "XFN"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28">
                    {label}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={manualScores[key]}
                    onChange={e =>
                      setManualScores(s => ({
                        ...s,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-xs font-bold text-foreground w-8 text-right">
                    {manualScores[key]}/5
                  </span>
                </div>
              ))}
            </div>
          )}

          {latestScores && (
            <p className="text-xs text-emerald-400">
              ✓ Using your latest Full Mock Day scores
            </p>
          )}

          <button
            onClick={handleRun}
            disabled={mutation.isPending}
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Loading
                benchmark...
              </>
            ) : (
              <>
                <BarChart3 size={13} /> Compare to Peers
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Overall percentile */}
          <div className="rounded-xl bg-gradient-to-br from-purple-900/40 to-slate-800/60 border border-purple-500/30 p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              Overall Percentile vs {result.cohortSize.toLocaleString()}{" "}
              {targetLevel} candidates
            </div>
            <div
              className={`text-4xl font-black mb-1 ${percentileLabel(result.overallPercentile).color}`}
            >
              {result.overallPercentile}
              <span className="text-lg">th</span>
            </div>
            <div
              className={`text-sm font-semibold ${percentileLabel(result.overallPercentile).color}`}
            >
              {percentileLabel(result.overallPercentile).text}
            </div>
          </div>

          {/* Dimension breakdown */}
          <div className="space-y-2">
            {result.dimensions.map(dim => {
              const pct = dim.percentile;
              const label = percentileLabel(pct);
              const userPct = ((dim.userScore - 1) / 4) * 100;
              const p25Pct = ((dim.p25 - 1) / 4) * 100;
              const p50Pct = ((dim.p50 - 1) / 4) * 100;
              const p75Pct = ((dim.p75 - 1) / 4) * 100;
              const p90Pct = ((dim.p90 - 1) / 4) * 100;
              const trend =
                pct >= 75 ? (
                  <TrendingUp size={12} className="text-emerald-400" />
                ) : pct >= 50 ? (
                  <Minus size={12} className="text-amber-400" />
                ) : (
                  <TrendingDown size={12} className="text-red-400" />
                );

              return (
                <div
                  key={dim.name}
                  className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {trend}
                      <span className="text-xs font-semibold text-foreground">
                        {dim.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {dim.userScore}/5
                      </span>
                      <span className={`text-xs font-semibold ${label.color}`}>
                        {pct}th %ile
                      </span>
                    </div>
                  </div>

                  {/* Distribution bar */}
                  <div className="relative h-3 bg-slate-700 rounded-full overflow-visible mb-2">
                    {/* p25-p75 band */}
                    <div
                      className="absolute top-0 h-full bg-slate-600 rounded-full"
                      style={{
                        left: `${p25Pct}%`,
                        width: `${p75Pct - p25Pct}%`,
                      }}
                    />
                    {/* p50 marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-slate-400"
                      style={{ left: `${p50Pct}%` }}
                    />
                    {/* p90 marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-400/60"
                      style={{ left: `${p90Pct}%` }}
                    />
                    {/* User dot */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ left: `calc(${userPct}% - 6px)` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground/60 mb-1">
                    <span>p25: {dim.p25}</span>
                    <span>p50: {dim.p50}</span>
                    <span>p75: {dim.p75}</span>
                    <span className="text-amber-400/70">p90: {dim.p90}</span>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    {dim.insight}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Callouts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="text-xs text-emerald-400 font-semibold mb-1">
                💪 Standout Strength
              </div>
              <p className="text-xs text-muted-foreground">
                {result.standoutStrength}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <div className="text-xs text-red-400 font-semibold mb-1">
                📈 Biggest Gap vs Peers
              </div>
              <p className="text-xs text-muted-foreground">
                {result.biggestGap}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground/50 text-center">
            Top performer threshold for {targetLevel}:{" "}
            {result.topPerformerThreshold}/5
          </div>
        </div>
      )}

      {!result && !isOpen && (
        <div className="text-center py-6 text-muted-foreground">
          <BarChart3 size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            See how your scores compare to other {targetLevel} candidates.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-3 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-all"
          >
            View Benchmark
          </button>
        </div>
      )}
    </div>
  );
}
