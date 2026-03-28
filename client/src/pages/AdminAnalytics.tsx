/**
 * AdminAnalytics — site-wide usage analytics dashboard.
 * Shows sessions, page views, avg session, total time, daily active users,
 * hourly activity, top pages, device breakdown, browser breakdown,
 * invite code usage, and top unactioned feedback.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft, TrendingUp, Users, Eye, Clock, Timer,
  RefreshCw, Send, AlertCircle, BarChart2, Smartphone,
  Globe, Key, Monitor, Tablet
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

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
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
      <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wider">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// ── MiniBarChart (daily) ──────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { date: string; sessions?: number; count?: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-700 text-sm">
        No session data yet for this period.
      </div>
    );
  }
  const max = Math.max(...data.map(d => (d.count ?? d.sessions ?? 0)), 1);
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d, i) => {
        const val = d.count ?? d.sessions ?? 0;
        const pct = (val / max) * 100;
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all ${isToday ? "bg-blue-500" : "bg-gray-700 group-hover:bg-gray-600"}`}
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700">
                {d.date}: {val} session{val !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── HourlyBarChart ────────────────────────────────────────────────────────────

function HourlyBarChart({ data }: { data: { hour: number; count: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-24 text-gray-700 text-sm">No data yet.</div>;
  }
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-24 w-full">
      {data.map(d => {
        const pct = (d.count / max) * 100;
        const isPeak = d.count === max && max > 0;
        return (
          <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className={`w-full rounded-t transition-all ${isPeak ? "bg-amber-500" : "bg-gray-700 group-hover:bg-gray-600"}`}
              style={{ height: `${Math.max(pct, 3)}%` }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700">
                {formatHour(d.hour)}: {d.count} session{d.count !== 1 ? "s" : ""}
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
    { days }, { refetchOnWindowFocus: false }
  );

  const { data: chartData } = trpc.analytics.getSiteAnalytics.useQuery(
    { days: chartDays }, { refetchOnWindowFocus: false }
  );

  const { data: hourlyData } = trpc.analytics.getHourlyActivity.useQuery(
    { days }, { refetchOnWindowFocus: false }
  );

  const { data: topPages } = trpc.analytics.getTopPages.useQuery(
    { days, limit: 10 }, { refetchOnWindowFocus: false }
  );

  const { data: inviteCodes } = trpc.analytics.getInviteCodeStats.useQuery(
    undefined, { refetchOnWindowFocus: false }
  );

  const { data: unactioned } = trpc.analytics.getTopUnactionedFeedback.useQuery(
    { limit: 3 }, { refetchOnWindowFocus: false }
  );

  const sendReport = trpc.analytics.sendAnalyticsReport.useMutation({
    onSuccess: () => {
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    },
  });

  const handleSendReport = async () => {
    setReportLoading(true);
    try { await sendReport.mutateAsync({ days }); }
    finally { setReportLoading(false); }
  };

  // Device icon helper
  const deviceIcon = (type: string) => {
    if (type === "mobile") return <Smartphone size={12} />;
    if (type === "tablet") return <Tablet size={12} />;
    return <Monitor size={12} />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/admin/feedback">
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-white text-sm transition-colors">
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Feedback</span>
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400 flex-shrink-0" />
              <h1 className="text-sm font-bold text-white truncate">Site Analytics</h1>
            </div>
            <p className="text-xs text-gray-700 hidden sm:block">First-party usage data · No PII collected</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {([7, 14, 30] as const).map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${days === d ? "bg-blue-600 text-white" : "text-gray-600 hover:text-white"}`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all disabled:opacity-50">
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={handleSendReport} disabled={reportLoading || reportSent}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${reportSent ? "bg-green-600 border-green-500 text-white" : "bg-green-700 hover:bg-green-600 border-green-600 text-white"} disabled:opacity-60`}>
            <Send size={13} className={reportLoading ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">{reportSent ? "Sent!" : "Send Report"}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={<Users size={14} />} label="Sessions" value={isLoading ? "…" : (stats?.sessions ?? 0)} color="text-blue-400" />
          <StatCard icon={<Users size={14} />} label="Logged-in Users" value={isLoading ? "…" : (stats?.loggedInUsers ?? 0)} color="text-green-400" />
          <StatCard icon={<Eye size={14} />} label="Page Views" value={isLoading ? "…" : (stats?.pageViews ?? 0)} color="text-purple-400" />
          <StatCard icon={<Clock size={14} />} label="Avg Session" value={isLoading ? "…" : formatMinutes(stats?.avgSessionMinutes ?? 0)} color="text-amber-400" />
          <StatCard icon={<Timer size={14} />} label="Total Time" value={isLoading ? "…" : formatHours(stats?.totalTimeHours ?? 0)} color="text-rose-400" />
        </div>

        {/* Daily Active Users Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-400" />
              <span className="text-sm font-semibold text-white">Daily Active Users</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              {([7, 30] as const).map(d => (
                <button key={d} onClick={() => setChartDays(d)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${chartDays === d ? "bg-blue-600 text-white" : "text-gray-600 hover:text-white"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={chartData?.dailyActive ?? []} />
          {(chartData?.dailyActive ?? []).length > 0 && (
            <div className="flex justify-between mt-1 text-gray-600 text-[10px]">
              <span>{chartData?.dailyActive[0]?.date?.slice(5)}</span>
              <span>{chartData?.dailyActive[Math.floor((chartData?.dailyActive.length ?? 0) / 2)]?.date?.slice(5)}</span>
              <span>{chartData?.dailyActive[chartData?.dailyActive.length - 1]?.date?.slice(5)}</span>
            </div>
          )}
        </div>

        {/* Hourly Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-amber-400" />
            <span className="text-sm font-semibold text-white">Hourly Activity (When Users Visit)</span>
            <span className="text-xs text-gray-600 ml-1">— peak hour highlighted in amber</span>
          </div>
          <HourlyBarChart data={hourlyData ?? []} />
          <div className="flex justify-between mt-1 text-gray-600 text-[10px]">
            <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span>
          </div>
        </div>

        {/* Top Pages + Device/Browser Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Top Pages */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">Top Pages</span>
            </div>
            {!topPages || topPages.length === 0 ? (
              <p className="text-gray-700 text-sm">No page view data yet.</p>
            ) : (
              <div className="space-y-2">
                {topPages.slice(0, 8).map((p, i) => {
                  const maxCount = topPages[0]?.count ?? 1;
                  const pct = Math.round((p.count / maxCount) * 100);
                  return (
                    <div key={p.page} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate max-w-[180px]" title={p.page}>
                          <span className="text-gray-600 mr-1.5">#{i + 1}</span>{p.page || "/"}
                        </span>
                        <span className="text-gray-500 font-semibold ml-2 flex-shrink-0">{p.count}</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Device & Browser Breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={14} className="text-green-400" />
                <span className="text-sm font-semibold text-white">Device Breakdown</span>
              </div>
              {!stats?.deviceBreakdown || (stats.deviceBreakdown as any[]).length === 0 ? (
                <p className="text-gray-700 text-xs">No data yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(stats.deviceBreakdown as { deviceType: string; count: number }[]).map(d => (
                    <div key={d.deviceType} className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
                      <span className="text-green-400">{deviceIcon(d.deviceType)}</span>
                      <span className="text-gray-300 capitalize">{d.deviceType}</span>
                      <span className="text-gray-500 font-bold">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-blue-400" />
                <span className="text-sm font-semibold text-white">Browser Breakdown</span>
              </div>
              {!stats?.browserBreakdown || (stats.browserBreakdown as any[]).length === 0 ? (
                <p className="text-gray-700 text-xs">No data yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(stats.browserBreakdown as { browser: string; count: number }[]).slice(0, 6).map(b => (
                    <div key={b.browser} className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
                      <span className="text-blue-400"><Globe size={11} /></span>
                      <span className="text-gray-300">{b.browser}</span>
                      <span className="text-gray-500 font-bold">{b.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invite Code Usage */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-yellow-400" />
              <span className="text-sm font-semibold text-white">Invite Code Usage</span>
            </div>
            <Link href="/admin/invite-codes">
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Manage →</button>
            </Link>
          </div>
          {!inviteCodes || inviteCodes.length === 0 ? (
            <p className="text-gray-700 text-sm">No invite codes created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 uppercase tracking-wider border-b border-gray-800">
                    <th className="text-left pb-2 font-semibold">Code</th>
                    <th className="text-left pb-2 font-semibold">Label</th>
                    <th className="text-center pb-2 font-semibold">Uses</th>
                    <th className="text-center pb-2 font-semibold">Max</th>
                    <th className="text-center pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {inviteCodes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-2 font-mono font-bold text-yellow-400">{c.code}</td>
                      <td className="py-2 text-gray-500">{c.label ?? "—"}</td>
                      <td className="py-2 text-center">
                        <span className={`font-bold ${c.useCount > 0 ? "text-green-400" : "text-gray-600"}`}>
                          {c.useCount}
                        </span>
                      </td>
                      <td className="py-2 text-center text-gray-600">{c.maxUses === 0 ? "∞" : c.maxUses}</td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                          {c.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Unactioned Feedback */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">Top 3 Unactioned Feedback</span>
            </div>
            <Link href="/admin/feedback">
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</button>
            </Link>
          </div>
          {!unactioned || unactioned.length === 0 ? (
            <p className="text-gray-700 text-sm">No unactioned feedback — backlog is clear! 🎉</p>
          ) : (
            <div className="space-y-3">
              {unactioned.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <AlertCircle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">{item.category}</span>
                    <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{item.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs pb-4">
          {isLoading ? "Loading analytics data…" : `Analytics for the last ${days} days · Updates in real-time`}
        </p>
      </div>
    </div>
  );
}
