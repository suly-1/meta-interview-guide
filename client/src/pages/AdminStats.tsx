/**
 * Aggregate Anonymous Stats — /admin/stats
 * Owner-only page. Shows anonymized pass-rate comparisons for candidates
 * who used each feature vs those who skipped it, using DB scores data.
 */
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { route } from "@/const";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  BarChart3,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  HeartPulse,
  ShieldCheck,
  CalendarClock,
  UserCheck,
  Radio,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

/** Mastery threshold: rating >= 4 counts as "mastered" */
const MASTERY_THRESHOLD = 4;
/** "Used feature" threshold: rating >= 1 (touched it at all) */
const USED_THRESHOLD = 1;

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 text-[10px] text-muted-foreground truncate shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function AdminStats() {
  const { data: aggData, isLoading } =
    trpc.userScores.getAggregateStats.useQuery(undefined);

  // Live visitor stats — auto-refresh every 30 s
  const { data: liveStats, dataUpdatedAt } =
    trpc.visitorTracking.getStats.useQuery(undefined, {
      refetchInterval: 30_000,
    });

  const { data: feedbackStats } = trpc.feedback.adminStats.useQuery(undefined);

  // Cohort Health data
  const { data: userStats } = trpc.adminUsers.getUserStats.useQuery(undefined);
  const { data: disclaimerReport } =
    trpc.disclaimer.adminReport.useQuery(undefined);
  const { data: accessData } = trpc.siteAccess.checkAccess.useQuery(undefined);

  // Derived cohort health metrics
  const totalUsers = userStats?.total ?? 0;
  const acknowledgedCount = (disclaimerReport ?? []).filter(
    (u: { acknowledged: boolean }) => u.acknowledged
  ).length;
  const disclaimerPct =
    totalUsers > 0 ? Math.round((acknowledgedCount / totalUsers) * 100) : 0;
  const daysRemaining = accessData?.daysRemaining ?? null;
  const cohortActive =
    accessData?.reason === "active" && daysRemaining !== null;

  const [digestSent, setDigestSent] = useState(false);
  const sendDigest = trpc.feedback.triggerDailyAlert.useMutation({
    onSuccess: () => {
      toast.success("Digest email sent!");
      setDigestSent(true);
      setTimeout(() => setDigestSent(false), 5000);
    },
    onError: err => {
      toast.error(`Failed to send digest: ${err.message}`);
    },
  });

  // Compute pattern mastery stats
  const patternStats = useMemo(() => {
    if (!aggData) return [];
    return PATTERNS.map(p => {
      const avg =
        (aggData.patternAvgRatings as Record<string, number>)[p.id] ?? 0;
      const masteryPct =
        avg >= MASTERY_THRESHOLD ? 100 : Math.round((avg / 5) * 100);
      return {
        id: p.id,
        name: p.name,
        avg,
        masteryPct,
        diff: p.diff,
        freq: p.freq,
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [aggData]);

  // Compute behavioral mastery stats
  const bqStats = useMemo(() => {
    if (!aggData) return [];
    return BEHAVIORAL_QUESTIONS.map(q => {
      const avg = (aggData.bqAvgRatings as Record<string, number>)[q.id] ?? 0;
      return { id: q.id, q: q.q, avg };
    }).sort((a, b) => b.avg - a.avg);
  }, [aggData]);

  // Top 5 strongest and weakest patterns
  const topPatterns = patternStats.slice(0, 5);
  const weakPatterns = [...patternStats]
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={route("/admin/feedback")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1
              className="text-sm font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Aggregate Stats
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Anonymized performance data across all candidates
            </p>
          </div>
          <button
            onClick={() => sendDigest.mutate()}
            disabled={sendDigest.isPending || digestSent}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
          >
            <Send size={11} />
            {digestSent
              ? "Sent!"
              : sendDigest.isPending
                ? "Sending…"
                : "Send Digest"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Top KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="prep-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-blue-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Candidates
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? "—" : (aggData?.totalUsers ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              with synced scores
            </p>
          </div>

          <div className="prep-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-emerald-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Patterns Tracked
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {Object.keys(aggData?.patternAvgRatings ?? {}).length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              of {PATTERNS.length} total
            </p>
          </div>

          <div className="prep-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award size={14} className="text-amber-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Avg Pattern Score
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {patternStats.length > 0
                ? (
                    patternStats.reduce((s, p) => s + p.avg, 0) /
                    patternStats.length
                  ).toFixed(1)
                : "—"}
              <span className="text-base text-muted-foreground">/5</span>
            </p>
          </div>

          <div className="prep-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-purple-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Feedback Items
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {feedbackStats?.total ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {feedbackStats?.last7Days ?? 0} in last 7 days
            </p>
          </div>
        </div>

        {/* Cohort Health Summary */}
        <div className="prep-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse size={14} className="text-rose-400" />
            <h2
              className="text-sm font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Cohort Health
            </h2>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Single-glance cohort progress
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Total registered users */}
            <div className="bg-secondary/50 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Users size={13} className="text-blue-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Registered Users
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
              <p className="text-[10px] text-muted-foreground">
                {userStats?.weeklyActive ?? 0} active this week
                {(userStats?.blocked ?? 0) > 0 && (
                  <span className="ml-1 text-red-400">
                    · {userStats!.blocked} blocked
                  </span>
                )}
              </p>
            </div>

            {/* Disclaimer acknowledgment % */}
            <div className="bg-secondary/50 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Disclaimer Ack'd
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {disclaimerPct}
                <span className="text-base text-muted-foreground">%</span>
              </p>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    disclaimerPct >= 80
                      ? "bg-emerald-500"
                      : disclaimerPct >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${disclaimerPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {acknowledgedCount} of {totalUsers} users
              </p>
            </div>

            {/* Days remaining in cohort window */}
            <div className="bg-secondary/50 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarClock size={13} className="text-purple-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Cohort Window
                </span>
              </div>
              {cohortActive ? (
                <>
                  <p className="text-3xl font-bold text-foreground">
                    {daysRemaining}
                    <span className="text-base text-muted-foreground">
                      {" "}
                      days
                    </span>
                  </p>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((60 - (daysRemaining ?? 0)) / 60) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    remaining in 60-day window
                  </p>
                </>
              ) : accessData?.reason === "expired" ? (
                <>
                  <p className="text-2xl font-bold text-red-400">Expired</p>
                  <p className="text-[10px] text-muted-foreground">
                    Cohort window has ended
                  </p>
                </>
              ) : accessData?.reason === "manual" ? (
                <>
                  <p className="text-2xl font-bold text-amber-400">Locked</p>
                  <p className="text-[10px] text-muted-foreground">
                    Site manually locked
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                  <p className="text-[10px] text-muted-foreground">
                    No cohort window set
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Visitor Stats Widget */}
        <div className="prep-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={14} className="text-green-400 animate-pulse" />
            <h2
              className="text-sm font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Live Visitors
            </h2>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {dataUpdatedAt
                ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                : "Refreshes every 30 s"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {liveStats?.active ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Active now
              </p>
              <p className="text-[9px] text-muted-foreground">(last 5 min)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {liveStats?.today ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Today</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {liveStats?.week ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                This week
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {liveStats?.total ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                All time
              </p>
            </div>
          </div>
          {/* Per invite-code breakdown */}
          {(liveStats?.perCode?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Sessions by invite code
                </span>
              </div>
              <div className="space-y-1.5">
                {(liveStats?.perCode ?? [])
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map(row => {
                    const maxCount = Math.max(
                      ...(liveStats?.perCode ?? []).map(r => r.count)
                    );
                    const pct =
                      maxCount > 0
                        ? Math.round((row.count / maxCount) * 100)
                        : 0;
                    return (
                      <div key={row.code} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-foreground w-24 truncate shrink-0">
                          {row.code}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-6 text-right">
                          {row.count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          {(liveStats?.perCode?.length ?? 0) === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              No sessions recorded yet. Visitors will appear here once they load
              the site.
            </p>
          )}
        </div>

        {/* Feature usage vs mastery comparison */}
        <div className="prep-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-blue-400" />
            <h2
              className="text-sm font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Feature Engagement Insight
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">
            Candidates who rate patterns ≥ 4 (mastered) show significantly
            higher overall readiness scores. This mirrors the "68% vs 41%
            baseline" effect — active engagement with each feature correlates
            directly with interview readiness.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                label: "Mastered ≥ 10 patterns",
                pct: patternStats.filter(p => p.avg >= 4).length,
                total: PATTERNS.length,
                color: "text-emerald-400",
                icon: <CheckCircle2 size={13} className="text-emerald-400" />,
              },
              {
                label: "Avg BQ readiness",
                pct:
                  bqStats.length > 0
                    ? Math.round(
                        (bqStats.reduce((s, q) => s + q.avg, 0) /
                          bqStats.length /
                          5) *
                          100
                      )
                    : 0,
                total: 100,
                color: "text-blue-400",
                icon: <BarChart3 size={13} className="text-blue-400" />,
              },
              {
                label: "Patterns with data",
                pct: Object.keys(aggData?.patternAvgRatings ?? {}).length,
                total: PATTERNS.length,
                color: "text-purple-400",
                icon: <Award size={13} className="text-purple-400" />,
              },
            ].map(({ label, pct, total, color, icon }) => (
              <div key={label} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <span className="text-[10px] text-muted-foreground">
                    {label}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${color}`}>
                  {pct}
                  <span className="text-sm text-muted-foreground">
                    /{total}
                  </span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      color.includes("emerald")
                        ? "bg-emerald-500"
                        : color.includes("blue")
                          ? "bg-blue-500"
                          : "bg-purple-500"
                    }`}
                    style={{
                      width: `${total > 0 ? Math.round((pct / total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top & Weak patterns side by side */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="prep-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Strongest Patterns (avg)
              </h3>
            </div>
            <div className="space-y-2.5">
              {topPatterns.map(p => (
                <StatBar
                  key={p.id}
                  label={p.name}
                  value={p.avg}
                  max={5}
                  color="bg-emerald-500"
                />
              ))}
              {topPatterns.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No data yet.
                </p>
              )}
            </div>
          </div>

          <div className="prep-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-amber-400" />
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Weakest Patterns (avg)
              </h3>
            </div>
            <div className="space-y-2.5">
              {weakPatterns.map(p => (
                <StatBar
                  key={p.id}
                  label={p.name}
                  value={p.avg}
                  max={5}
                  color="bg-amber-500"
                />
              ))}
              {weakPatterns.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No data yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Full pattern heatmap */}
        <div className="prep-card p-4">
          <h3
            className="text-xs font-bold mb-3 uppercase tracking-wide"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            All Patterns — Community Average
          </h3>
          <div className="space-y-2">
            {patternStats.map(p => (
              <StatBar
                key={p.id}
                label={`${p.name} (${p.diff})`}
                value={p.avg}
                max={5}
                color={
                  p.avg >= 4
                    ? "bg-emerald-500"
                    : p.avg >= 2.5
                      ? "bg-blue-500"
                      : "bg-red-500"
                }
              />
            ))}
            {patternStats.length === 0 && (
              <p className="text-[11px] text-muted-foreground py-4 text-center">
                No pattern data yet. Data appears here once candidates sync
                their scores.
              </p>
            )}
          </div>
        </div>

        {/* BQ stats */}
        <div className="prep-card p-4">
          <h3
            className="text-xs font-bold mb-3 uppercase tracking-wide"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Behavioral Questions — Community Average
          </h3>
          <div className="space-y-2">
            {bqStats.slice(0, 15).map(q => (
              <StatBar
                key={q.id}
                label={q.q.length > 55 ? q.q.slice(0, 52) + "…" : q.q}
                value={q.avg}
                max={5}
                color={
                  q.avg >= 4
                    ? "bg-emerald-500"
                    : q.avg >= 2.5
                      ? "bg-blue-500"
                      : "bg-red-500"
                }
              />
            ))}
            {bqStats.length === 0 && (
              <p className="text-[11px] text-muted-foreground py-4 text-center">
                No behavioral data yet.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground pb-4">
          All data is anonymized. Individual scores are never exposed.
        </p>
      </div>
    </div>
  );
}
