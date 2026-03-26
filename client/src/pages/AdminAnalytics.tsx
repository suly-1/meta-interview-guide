/**
 * AdminAnalytics — site-wide usage analytics dashboard.
 * Shows sessions, logged-in users, page views, avg session, total time,
 * daily active users chart, and top unactioned feedback items.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft, TrendingUp, Users, Eye, Clock, Timer,
  RefreshCw, Send, AlertCircle, BarChart2
} from "lucide-react";
import { motion } from "framer-motion";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMinutes(mins: number): string {
  if (mins === 0) return "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatHours(hours: number): string {
  if (hours === 0) return "0h";
  return `${hours}h`;
}

// ── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// ── MiniBarChart ─────────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { date: string; sessions?: number; count?: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        No session data yet for this period.
      </div>
    );
  }

  const max = Math.max(...data.map(d => (d.count ?? d.sessions ?? 0)), 1);

  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d, i) => {
        const val = d.count ?? d.sessions ?? 0; const pct = (val / max) * 100;
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all ${
                isToday ? "bg-blue-500" : "bg-gray-700 group-hover:bg-gray-600"
              }`}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700">
                {d.date}: {d.sessions} session{d.sessions !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── AdminAnalytics ────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [chartDays, setChartDays] = useState<7 | 30>(7);
  const [reportSent, setReportSent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const { data: stats, isLoading, refetch, isFetching } = trpc.analytics.getSiteAnalytics.useQuery(
    { days },
    { enabled: true, refetchOnWindowFocus: false }
  );

  const { data: chartData } = trpc.analytics.getSiteAnalytics.useQuery(
    { days: chartDays },
    { enabled: true, refetchOnWindowFocus: false }
  );

  const { data: unactioned } = trpc.analytics.getTopUnactionedFeedback.useQuery(
    { limit: 3 },
    { enabled: true, refetchOnWindowFocus: false }
  );

  const sendReport = trpc.analytics.sendAnalyticsReport.useMutation({
    onSuccess: () => {
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    },
  });

  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      await sendReport.mutateAsync({ days });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Back to Feedback */}
          <Link href="/admin/feedback">
            <button className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Feedback</span>
            </button>
          </Link>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400 flex-shrink-0" />
              <h1 className="text-sm font-bold text-white truncate">Site Analytics</h1>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">First-party usage data · No PII collected</p>
          </div>

          {/* Day range selector */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {([7, 14, 30] as const).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  days === d
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Send Report Now */}
          <button
            onClick={handleSendReport}
            disabled={reportLoading || reportSent}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              reportSent
                ? "bg-green-600 border-green-500 text-white"
                : "bg-green-700 hover:bg-green-600 border-green-600 text-white"
            } disabled:opacity-60`}
          >
            <Send size={13} className={reportLoading ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">{reportSent ? "Sent!" : "Send Report Now"}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={<Users size={14} />}
            label="Sessions"
            value={isLoading ? "…" : (stats?.sessions ?? 0)}
            color="text-blue-400"
          />
          <StatCard
            icon={<Users size={14} />}
            label="Logged-in Users"
            value={isLoading ? "…" : (stats?.loggedInUsers ?? 0)}
            color="text-green-400"
          />
          <StatCard
            icon={<Eye size={14} />}
            label="Page Views"
            value={isLoading ? "…" : (stats?.pageViews ?? 0)}
            color="text-purple-400"
          />
          <StatCard
            icon={<Clock size={14} />}
            label="Avg Session"
            value={isLoading ? "…" : formatMinutes(stats?.avgSessionMinutes ?? 0)}
            color="text-amber-400"
          />
          <StatCard
            icon={<Timer size={14} />}
            label="Total Time"
            value={isLoading ? "…" : formatHours(stats?.totalTimeHours ?? 0)}
            color="text-rose-400"
          />
        </div>

        {/* Daily Active Users Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-400" />
              <span className="text-sm font-semibold text-white">Daily Active Users (Sessions / Day)</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              {([7, 30] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    chartDays === d
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={chartData?.dailyActive ?? []} />
          {/* X-axis labels */}
          {(chartData?.dailyActive ?? []).length > 0 && (
            <div className="flex justify-between mt-1 text-gray-600 text-[10px]">
              <span>{chartData?.dailyActive[0]?.date?.slice(5)}</span>
              <span>{chartData?.dailyActive[Math.floor((chartData?.dailyActive.length ?? 0) / 2)]?.date?.slice(5)}</span>
              <span>{chartData?.dailyActive[chartData?.dailyActive.length - 1]?.date?.slice(5)}</span>
            </div>
          )}
        </div>

        {/* Top Unactioned Feedback */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">
                Top 3 Unactioned Feedback Items
              </span>
            </div>
            <Link href="/admin/feedback">
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View all →
              </button>
            </Link>
          </div>

          {!unactioned || unactioned.length === 0 ? (
            <p className="text-gray-500 text-sm">No unactioned feedback — backlog is clear! 🎉</p>
          ) : (
            <div className="space-y-3">
              {unactioned.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <AlertCircle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <p className="text-sm text-gray-300 mt-0.5 line-clamp-2">{item.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs pb-4">
          {isLoading
            ? "Loading analytics data…"
            : `Analytics data for the last ${days} days. Data updates in real-time.`}
        </p>
      </div>
    </div>
  );
}
