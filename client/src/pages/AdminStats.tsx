/**
 * AdminStats — owner-only feedback statistics dashboard at /admin/stats.
 * Shows category breakdown, total counts, recent activity, and quick actions.
 * Gated by ctx.user.role === 'admin' on the server.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart2, RefreshCw, ArrowLeft, Send, Bell,
  Bug, Lightbulb, BookOpen, Palette, HelpCircle,
  CheckCircle2, AlertCircle, TrendingUp, Users, ShieldCheck, Timer
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bug:     { label: "Bug",         icon: <Bug size={14} />,        color: "text-red-700",    bg: "bg-red-100 border-red-200" },
  feature: { label: "Feature Req", icon: <Lightbulb size={14} />,  color: "text-amber-900",  bg: "bg-amber-100 border-amber-200" },
  content: { label: "Content",     icon: <BookOpen size={14} />,   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  ux:      { label: "UX",          icon: <Palette size={14} />,    color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  other:   { label: "Other",       icon: <HelpCircle size={14} />, color: "text-gray-700",   bg: "bg-gray-100 border-gray-200" },
};

export default function AdminStats() {
  const [digestLoading, setDigestLoading] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const { data: stats, isLoading, refetch } = trpc.feedback.adminStats.useQuery(undefined);
  const { data: cohortHealth, isLoading: cohortLoading } = trpc.siteSettings.getCohortHealth.useQuery(undefined);

  const triggerDigest = trpc.feedback.triggerDigest.useMutation({
    onMutate: () => setDigestLoading(true),
    onSuccess: () => {
      toast.success("Weekly digest sent successfully.");
      setDigestLoading(false);
    },
    onError: () => {
      toast.error("Failed to send digest.");
      setDigestLoading(false);
    },
  });

  const triggerAlert = trpc.feedback.triggerDailyAlert.useMutation({
    onMutate: () => setAlertLoading(true),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Daily alert sent — unactioned items threshold met.");
      } else {
        toast.info("No alert sent — below threshold or no unactioned items.");
      }
      setAlertLoading(false);
    },
    onError: () => {
      toast.error("Failed to trigger alert.");
      setAlertLoading(false);
    },
  });

  const markAllNew = trpc.feedback.markAllNew.useMutation({
    onSuccess: (data) => {
      toast.success(`Marked ${data.updated} item(s) as In Progress.`);
      refetch();
    },
    onError: () => toast.error("Failed to mark items."),
  });

  // Always accessible via admin token — no auth guard needed

  const total = stats?.total ?? 0;
  const last7Days = stats?.last7Days ?? 0;
  const newCount = stats?.newCount ?? 0;
  const byCategory = stats?.byCategory ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/disclaimer" className="text-gray-600 hover:text-gray-600 dark:hover:text-gray-700 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" />
                Feedback Stats
              </h1>
              <p className="text-xs text-gray-700 mt-0.5">Summary statistics and quick actions</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Cohort Health card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={15} className="text-indigo-500" />
            Cohort Health
          </h2>
          {cohortLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total users */}
              <div className="flex flex-col gap-1 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100 dark:border-indigo-900">
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  <Users size={13} /> Total Users
                </div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {cohortHealth?.totalUsers ?? 0}
                </div>
              </div>
              {/* Disclaimer acknowledgement */}
              <div className="flex flex-col gap-1 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={13} /> Disclaimer Acknowledged
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {cohortHealth?.acknowledgedPct ?? 0}%
                </div>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  {cohortHealth?.acknowledgedCount ?? 0} of {cohortHealth?.totalUsers ?? 0} users
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${cohortHealth?.acknowledgedPct ?? 0}%` }}
                  />
                </div>
              </div>
              {/* Days remaining */}
              <div className={`flex flex-col gap-1 p-4 rounded-lg border ${
                cohortHealth?.daysRemaining == null
                  ? "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700"
                  : (cohortHealth.daysRemaining ?? 999) <= 7
                  ? "bg-red-100 dark:bg-red-950/30 border-red-100 dark:border-red-900"
                  : (cohortHealth.daysRemaining ?? 999) <= 14
                  ? "bg-amber-100 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900"
                  : "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900"
              }`}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  cohortHealth?.daysRemaining == null ? "text-gray-700" :
                  (cohortHealth?.daysRemaining ?? 999) <= 7 ? "text-red-600 dark:text-red-400" :
                  (cohortHealth?.daysRemaining ?? 999) <= 14 ? "text-amber-800 dark:text-amber-900" :
                  "text-blue-600 dark:text-blue-400"
                }`}>
                  <Timer size={13} /> Days Remaining
                </div>
                <div className={`text-2xl font-bold ${
                  cohortHealth?.daysRemaining == null ? "text-gray-600" :
                  (cohortHealth?.daysRemaining ?? 999) <= 7 ? "text-red-700 dark:text-red-300" :
                  (cohortHealth?.daysRemaining ?? 999) <= 14 ? "text-amber-900 dark:text-amber-800" :
                  "text-blue-700 dark:text-blue-300"
                }`}>
                  {cohortHealth?.daysRemaining == null ? "—" : cohortHealth?.daysRemaining}
                </div>
                {cohortHealth?.lockStartDate && (
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    Started {new Date(cohortHealth.lockStartDate).toLocaleDateString()}
                  </div>
                )}
                {!cohortHealth?.lockEnabled && (
                  <div className="text-xs text-gray-600 italic">Cohort window not active</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{isLoading ? "—" : total}</div>
            <div className="text-xs text-gray-700 mt-1 flex items-center gap-1">
              <BarChart2 size={12} />
              Total feedback items
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="text-2xl font-bold text-blue-600">{isLoading ? "—" : last7Days}</div>
            <div className="text-xs text-gray-700 mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              Last 7 days
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className={`text-2xl font-bold ${newCount > 0 ? "text-amber-800" : "text-emerald-600"}`}>
              {isLoading ? "—" : newCount}
            </div>
            <div className="text-xs text-gray-700 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              Unactioned (new)
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Category</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : byCategory.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">No feedback yet.</p>
          ) : (
            <div className="space-y-3">
              {byCategory
                .sort((a, b) => b.count - a.count)
                .map(({ category, count }) => {
                  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium w-32 flex-shrink-0 ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                        {meta.label}
                      </div>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 w-16 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => triggerDigest.mutate()}
              disabled={digestLoading}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Send size={14} />
              {digestLoading ? "Sending…" : "Send Weekly Digest"}
            </button>
            <button
              onClick={() => triggerAlert.mutate()}
              disabled={alertLoading}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Bell size={14} />
              {alertLoading ? "Checking…" : "Check Daily Alert"}
            </button>
            <button
              onClick={() => {
                if (newCount === 0) {
                  toast.info("No new items to mark.");
                  return;
                }
                markAllNew.mutate();
              }}
              disabled={markAllNew.isPending}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <CheckCircle2 size={14} />
              {markAllNew.isPending ? "Marking…" : `Mark All New → In Progress`}
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/feedback" className="flex items-center gap-1.5 text-blue-600 hover:underline">
            <BarChart2 size={13} />
            View all feedback items →
          </Link>
          <Link href="/admin/users" className="flex items-center gap-1.5 text-blue-600 hover:underline">
            View user management →
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-1.5 text-blue-600 hover:underline">
            View site settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
