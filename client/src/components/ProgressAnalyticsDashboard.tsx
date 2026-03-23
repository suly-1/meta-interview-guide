/**
 * ProgressAnalyticsDashboard — shows per-user performance analytics from DB scores.
 * Radar chart across 3 domains + per-feature score cards + trend sparklines.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, Tooltip, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart2, Lock } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader } from "@/components/HighImpactBadge";
import { getLoginUrl } from "@/const";

const FEATURE_META: Record<string, { label: string; domain: "coding" | "behavioral" | "system_design"; color: string }> = {
  ai_interrupt_mode:   { label: "AI Interrupt Mode",      domain: "system_design", color: "#6366f1" },
  boe_grader:          { label: "BoE Calculator",         domain: "system_design", color: "#8b5cf6" },
  adversarial_review:  { label: "Adversarial Review",     domain: "system_design", color: "#a78bfa" },
  think_out_loud:      { label: "Think Out Loud",         domain: "coding",        color: "#3b82f6" },
  pattern_drill:       { label: "Pattern Drill",          domain: "coding",        color: "#06b6d4" },
  remediation_plan:    { label: "Remediation Plan",       domain: "coding",        color: "#0ea5e9" },
  story_coverage:      { label: "Story Coverage",         domain: "behavioral",    color: "#f59e0b" },
  persona_stress:      { label: "Persona Stress Test",    domain: "behavioral",    color: "#f97316" },
  impact_coach:        { label: "Impact Coach",           domain: "behavioral",    color: "#ef4444" },
};

const DOMAIN_COLORS = {
  system_design: "#6366f1",
  coding:        "#3b82f6",
  behavioral:    "#f59e0b",
};

const DOMAIN_LABELS = {
  system_design: "System Design",
  coding:        "Coding",
  behavioral:    "Behavioral",
};

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")   return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === "down") return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

export default function ProgressAnalyticsDashboard() {
  const { isAuthenticated } = useAuth();
  const { data: scores, isLoading } = trpc.scores.getMyScores.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Aggregate scores per feature — scores is Record<feature, {latest, history, scoreType, lastAt}>
  const featureAverages = useMemo(() => {
    if (!scores || typeof scores !== 'object') return {};
    return Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [
        k,
        v.history.length
          ? Math.round(v.history.reduce((a: number, b: number) => a + b, 0) / v.history.length)
          : v.latest,
      ])
    );
  }, [scores]);

  // Domain averages for radar chart
  const radarData = useMemo(() => {
    const domains: Record<string, number[]> = { system_design: [], coding: [], behavioral: [] };
    for (const [feature, avg] of Object.entries(featureAverages)) {
      const meta = FEATURE_META[feature];
      if (meta) domains[meta.domain].push(avg as number);
    }
    return [
      { subject: "System Design", score: domains.system_design.length ? Math.round(domains.system_design.reduce((a, b) => a + b, 0) / domains.system_design.length) : 0, fullMark: 100 },
      { subject: "Coding",        score: domains.coding.length ? Math.round(domains.coding.reduce((a, b) => a + b, 0) / domains.coding.length) : 0, fullMark: 100 },
      { subject: "Behavioral",    score: domains.behavioral.length ? Math.round(domains.behavioral.reduce((a, b) => a + b, 0) / domains.behavioral.length) : 0, fullMark: 100 },
    ];
  }, [featureAverages]);

  // Per-feature trend from history array
  const featureTrends = useMemo(() => {
    if (!scores || typeof scores !== 'object') return {};
    return Object.fromEntries(
      Object.entries(scores).map(([k, v]) => {
        const hist = v.history.slice(-5);
        const trend: "up" | "down" | "flat" =
          hist.length < 2 ? "flat" :
          hist[hist.length - 1] > hist[0] ? "up" :
          hist[hist.length - 1] < hist[0] ? "down" : "flat";
        return [k, { data: hist.map((val: number, i: number) => ({ i, v: val })), trend }];
      })
    );
  }, [scores]);

  if (!isAuthenticated) {
    return (
      <HighImpactWrapper>
        <HighImpactSectionHeader
          icon={<BarChart2 size={20} />}
          title="Progress & Analytics Dashboard"
          subtitle="Track your improvement across all 10 HIGH IMPACT features over time"
        />
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <Lock size={40} className="text-gray-300 dark:text-gray-600" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">Sign in to track your progress</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Your scores are saved to the cloud so you can track improvement across sessions and devices.</p>
          <a href={getLoginUrl()} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all">
            Sign In Free
          </a>
        </div>
      </HighImpactWrapper>
    );
  }

  if (isLoading) {
    return (
      <HighImpactWrapper>
        <HighImpactSectionHeader
          icon={<BarChart2 size={20} />}
          title="Progress & Analytics Dashboard"
          subtitle="Loading your scores..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </HighImpactWrapper>
    );
  }

  const hasData = scores && typeof scores === 'object' && Object.keys(scores).length > 0;

  return (
    <HighImpactWrapper>
      <div className="flex items-center gap-3 mb-6">
        <HighImpactBadge />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Progress & Analytics Dashboard
          </h2>
          <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold">
            Your performance across all 10 HIGH IMPACT features — updated after every session
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No scores yet</p>
          <p className="text-sm mt-1">Complete any HIGH IMPACT feature above to start tracking your progress.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Radar chart */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Domain Readiness Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600, fill: "#6b7280" }} />
                  <Radar
                    name="Your Score"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-2">
              {radarData.map((d) => (
                <div key={d.subject} className="text-center">
                  <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{d.score}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d.subject}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-feature score cards */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Feature Scores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(FEATURE_META).map(([featureId, meta]) => {
                const avg = featureAverages[featureId];
                const trend = featureTrends[featureId];
                if (avg === undefined) return null;
                const pct = Math.min(100, avg);
                return (
                  <div
                    key={featureId}
                    className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{meta.label}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{DOMAIN_LABELS[meta.domain]}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {trend && <TrendIcon trend={trend.trend} />}
                        <span className="text-xl font-black" style={{ color: meta.color }}>{pct}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    {/* Sparkline */}
                    {trend && trend.data.length > 1 && (
                      <div className="h-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trend.data}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke={meta.color}
                              strokeWidth={2}
                              dot={false}
                            />
                            <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
                            <XAxis dataKey="i" hide />
                            <Tooltip
                              contentStyle={{ fontSize: 11, padding: "2px 6px", borderRadius: 6 }}
                              formatter={(v: number) => [`${v}`, "Score"]}
                              labelFormatter={() => ""}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </HighImpactWrapper>
  );
}
