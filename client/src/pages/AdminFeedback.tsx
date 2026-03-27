/**
 * AdminFeedback — owner-only dashboard at /admin/feedback.
 * Shows all site feedback with full admin nav bar matching the design.
 * Gated by tokenAdminProcedure on the server.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bug, Lightbulb, BookOpen, Palette, HelpCircle,
  Star, Filter, ArrowLeft, RefreshCw, BarChart2,
  TrendingUp, MessageSquare, Clock, Users, Trophy, Zap,
  Download, Bell, Send, Search, Lock, ChevronDown,
  Eye, X, Mail, CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bug:     { label: "Bug",     icon: <Bug size={13} />,        color: "text-red-700",    bg: "bg-red-100 border-red-200" },
  feature: { label: "Feature", icon: <Lightbulb size={13} />,  color: "text-amber-900",  bg: "bg-amber-100 border-amber-200" },
  content: { label: "Content", icon: <BookOpen size={13} />,   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  ux:      { label: "UX",      icon: <Palette size={13} />,    color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  other:   { label: "Other",   icon: <HelpCircle size={13} />, color: "text-gray-700",   bg: "bg-gray-100 border-gray-200" },
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new:         { label: "New",         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  in_progress: { label: "In Progress", color: "text-amber-900",   bg: "bg-amber-100",   border: "border-amber-200" },
  done:        { label: "Done",        color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  dismissed:   { label: "Dismissed",   color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200" },
};

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-gray-600">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? "text-amber-900 fill-amber-400" : "text-gray-200"}
        />
      ))}
      <span className="ml-1 text-xs text-gray-700">{RATING_LABELS[rating]}</span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function exportToCSV(items: Array<Record<string, unknown>>) {
  if (!items.length) return;
  const headers = Object.keys(items[0]);
  const rows = items.map(item =>
    headers.map(h => {
      const val = item[h];
      const str = val == null ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${color}`}>
        {icon}
        {label}
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// ── Digest Preview Modal ──────────────────────────────────────────────────────

type DigestPreviewData = {
  subject: string;
  to: string;
  body: string;
  itemCount: number;
  items: Array<{
    id: number;
    category: string;
    rating: number | null;
    message: string;
    page: string | null;
    createdAt: Date;
    status: string;
  }>;
};

function DigestPreviewModal({
  data,
  onClose,
  onSend,
  isSending,
  sent,
}: {
  data: DigestPreviewData;
  onClose: () => void;
  onSend: () => void;
  isSending: boolean;
  sent: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.18 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blue-400" />
            <span className="font-bold text-white text-sm">Digest Preview</span>
            <span className="text-xs text-gray-700 ml-1">— review before sending</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-white transition-colors rounded-lg p-1 hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Email metadata */}
        <div className="px-5 py-3 border-b border-gray-800 space-y-1.5 bg-gray-950/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-700 w-14 flex-shrink-0">To:</span>
            <span className="text-gray-200 font-mono bg-gray-800 px-2 py-0.5 rounded">{data.to}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-700 w-14 flex-shrink-0">Subject:</span>
            <span className="text-gray-200 font-semibold">{data.subject}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-700 w-14 flex-shrink-0">Items:</span>
            <span className={`font-bold ${data.itemCount === 0 ? "text-gray-700" : "text-blue-400"}`}>
              {data.itemCount} feedback item{data.itemCount !== 1 ? "s" : ""} from the last 7 days
            </span>
          </div>
        </div>

        {/* Email body preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {data.itemCount === 0 ? (
            <div className="text-center py-8 text-gray-700">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-gray-600">No new feedback this week</p>
              <p className="text-xs mt-1">The digest will say: "No new feedback this week."</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-700 mb-3 italic">
                Email body preview — formatted as plain text in the actual email:
              </p>
              {data.items.map((item, idx) => {
                const meta = CATEGORY_META[item.category] ?? CATEGORY_META.other;
                const statusMeta = STATUS_META[item.status] ?? STATUS_META.new;
                return (
                  <div
                    key={item.id}
                    className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                        {meta.label.toUpperCase()}
                      </span>
                      {item.rating && (
                        <span className="text-amber-900 text-xs font-bold">{item.rating}★</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${statusMeta.color} ${statusMeta.bg} ${statusMeta.border}`}>
                        {statusMeta.label}
                      </span>
                      <span className="text-xs text-gray-700 ml-auto">
                        #{idx + 1} of {data.itemCount}
                      </span>
                    </div>
                    <p className="text-gray-200 leading-relaxed text-sm">{item.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-700">
                      {item.page && (
                        <span className="font-mono bg-gray-700 px-1.5 py-0.5 rounded">{item.page}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-700">
            {data.itemCount > 0
              ? "This digest will be sent via email (if SMTP configured) or to your Manus inbox."
              : "Sending will notify you that there is no new feedback this week."}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={isSending || sent}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                sent
                  ? "bg-green-700 border-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white"
              } disabled:opacity-60`}
            >
              {sent ? (
                <>
                  <CheckCircle size={13} />
                  Sent!
                </>
              ) : (
                <>
                  <Send size={13} className={isSending ? "animate-pulse" : ""} />
                  {isSending ? "Sending…" : "Send Now"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminFeedback() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "rating_high" | "rating_low">("newest");
  const [alertSent, setAlertSent] = useState(false);
  const [digestSent, setDigestSent] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { data: feedback, isLoading, refetch, isFetching } = trpc.feedback.getAllSiteFeedback.useQuery(undefined);
  const { data: stats } = trpc.feedback.adminStats.useQuery(undefined);
  const { data: aggregateStats } = trpc.scores.getAggregate.useQuery(undefined);
  const { data: digestPreview, isLoading: isLoadingPreview } = trpc.feedback.getDigestPreview.useQuery(
    undefined,
    { enabled: showPreviewModal }
  );
  const utils = trpc.useUtils();

  const updateStatus = trpc.feedback.updateFeedbackStatus.useMutation({
    onSuccess: () => utils.feedback.getAllSiteFeedback.invalidate(),
  });

  const triggerAlert = trpc.feedback.triggerDailyAlert.useMutation({
    onSuccess: () => {
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 3000);
    },
  });

  const triggerDigest = trpc.feedback.triggerDigest.useMutation({
    onSuccess: () => {
      setDigestSent(true);
      setTimeout(() => {
        setDigestSent(false);
        setShowPreviewModal(false);
      }, 2500);
    },
  });

  const filtered = useMemo(() => {
    if (!feedback?.length) return [];
    let items = [...feedback];
    if (categoryFilter !== "all") items = items.filter(f => f.category === categoryFilter);
    if (statusFilter !== "all") items = items.filter(f => (f as { status?: string }).status === statusFilter);
    if (typeFilter !== "all") items = items.filter(f => f.category === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(f =>
        f.message?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.page?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "rating_high") items.sort((a, b) => ((b as { rating?: number }).rating ?? 0) - ((a as { rating?: number }).rating ?? 0));
    else if (sortBy === "rating_low") items.sort((a, b) => ((a as { rating?: number }).rating ?? 0) - ((b as { rating?: number }).rating ?? 0));
    return items;
  }, [feedback, categoryFilter, typeFilter, statusFilter, searchQuery, sortBy]);

  const topCategory = useMemo(() => {
    if (!stats?.byCategory?.length) return "—";
    const sorted = [...stats.byCategory].sort((a, b) => b.count - a.count);
    return sorted[0]?.category ?? "—";
  }, [stats]);

  const last7Days = stats?.last7Days ?? 0;
  const total = stats?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Digest Preview Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreviewModal && (
          isLoadingPreview ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 flex flex-col items-center gap-3">
                <RefreshCw size={24} className="text-blue-400 animate-spin" />
                <p className="text-sm text-gray-700">Loading digest preview…</p>
              </div>
            </div>
          ) : digestPreview ? (
            <DigestPreviewModal
              data={digestPreview as unknown as DigestPreviewData}
              onClose={() => { setShowPreviewModal(false); setDigestSent(false); }}
              onSend={() => triggerDigest.mutate(undefined)}
              isSending={triggerDigest.isPending}
              sent={digestSent}
            />
          ) : null
        )}
      </AnimatePresence>

      {/* ── Header Nav ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-gray-600 hover:text-white text-sm transition-colors flex-shrink-0 mr-1">
              <ArrowLeft size={15} />
            </button>
          </Link>
          <div className="flex-shrink-0 mr-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={15} className="text-indigo-400" />
              <span className="text-sm font-bold text-white whitespace-nowrap">Feedback Dashboard</span>
            </div>
            <p className="text-[10px] text-gray-700 hidden sm:block">Admin view · All submitted feedback</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link href="/admin/stats">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                <BarChart2 size={13} />
                <span className="hidden sm:inline">Stats</span>
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                <TrendingUp size={13} />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </Link>
            <Link href="/admin/settings">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                <Lock size={13} />
                <span className="hidden sm:inline">Access</span>
              </button>
            </Link>
            <Link href="/admin/users">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                <Users size={13} />
                <span className="hidden sm:inline">Users</span>
              </button>
            </Link>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => exportToCSV((feedback ?? []) as Array<Record<string, unknown>>)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => triggerAlert.mutate(undefined)}
              disabled={triggerAlert.isPending || alertSent}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                alertSent
                  ? "bg-green-700 border-green-600 text-white"
                  : "bg-amber-700 hover:bg-amber-600 border-amber-600 text-white"
              } disabled:opacity-60`}
            >
              <Bell size={13} className={triggerAlert.isPending ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{alertSent ? "Sent!" : "Test Alert"}</span>
            </button>
            {/* Preview Digest button */}
            <button
              onClick={() => { setDigestSent(false); setShowPreviewModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-200"
            >
              <Eye size={13} />
              <span className="hidden sm:inline">Preview</span>
            </button>
            {/* Send Digest button (direct, no preview) */}
            <button
              onClick={() => triggerDigest.mutate(undefined)}
              disabled={triggerDigest.isPending || digestSent}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                digestSent
                  ? "bg-green-700 border-green-600 text-white"
                  : "bg-blue-700 hover:bg-blue-600 border-blue-600 text-white"
              } disabled:opacity-60`}
            >
              <Send size={13} className={triggerDigest.isPending ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{digestSent ? "Sent!" : "Send Digest"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<MessageSquare size={12} />} label="Total" value={isLoading ? "…" : total} color="text-gray-700" />
          <StatCard icon={<Clock size={12} />} label="Last 7 Days" value={isLoading ? "…" : last7Days} color="text-green-400" />
          <StatCard icon={<Star size={12} />} label="Top Category" value={isLoading ? "…" : topCategory} color="text-amber-900" />
          <StatCard icon={<TrendingUp size={12} />} label="Showing" value={filtered.length} color="text-blue-400" />
        </div>

        {/* Aggregate Anonymous Pass-Rate Stats */}
        {aggregateStats && aggregateStats.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <TrendingUp size={15} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Feature Performance</h3>
                <p className="text-xs text-gray-700">Anonymous pass rates across all AI features</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(aggregateStats as Array<{ feature: string; passRate: number; totalSessions: number; avgScore: number }>)
                .filter(s => s.totalSessions >= 5)
                .sort((a, b) => b.passRate - a.passRate)
                .slice(0, 6)
                .map(stats => {
                  const avgScore = Math.round(stats.avgScore);
                  return (
                    <div key={stats.feature} className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 capitalize">
                          {stats.feature.replace(/_/g, " ")}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.passRate}%</p>
                          <p className="text-[10px] text-gray-600">pass rate</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-700">
                        <span className="flex items-center gap-1"><Users size={11} /> {stats.totalSessions} sessions</span>
                        <span className="flex items-center gap-1"><Trophy size={11} /> avg {avgScore}/100</span>
                      </div>
                      {/* Pass rate bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stats.passRate >= 60 ? "bg-emerald-500" : stats.passRate >= 40 ? "bg-amber-500" : "bg-red-400"
                          }`}
                          style={{ width: `${stats.passRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
              <Zap size={11} /> Stats update in real-time as candidates complete sessions. Minimum 5 sessions required per feature for reliable data.
            </p>
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={13} className="text-gray-700 flex-shrink-0" />
          <div className="relative">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none text-xs font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="all">All Categories</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="content">Content</option>
              <option value="ux">UX</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none text-xs font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="all">All Types</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="content">Content Issue</option>
              <option value="ux">UX Feedback</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none text-xs font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>
          <div className="flex-1 min-w-[180px] relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
            <input type="text" placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-gray-800 text-gray-200 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600" />
          </div>
          <div className="relative ml-auto">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none text-xs font-semibold bg-gray-800 text-gray-200 border border-gray-700 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="rating_high">Highest rating</option>
              <option value="rating_low">Lowest rating</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>
        </div>

        {/* Feedback list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-16 text-gray-700">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-gray-600">No feedback entries yet. They will appear here once users submit feedback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, idx) => {
              const meta = CATEGORY_META[item.category] ?? CATEGORY_META.other;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Category badge */}
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      {/* Message */}
                      <p className="text-sm text-gray-200 leading-relaxed">{item.message}</p>
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <StarRow rating={(item as { rating?: number }).rating ?? null} />
                        {/* Sentiment badge */}
                        {(item as { sentiment?: string }).sentiment && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            (item as { sentiment?: string }).sentiment === "positive"
                              ? "bg-emerald-900/40 text-emerald-400 border-emerald-700"
                              : (item as { sentiment?: string }).sentiment === "negative"
                              ? "bg-rose-900/40 text-rose-400 border-rose-700"
                              : "bg-gray-700/60 text-gray-600 border-gray-600"
                          }`}>
                            {(item as { sentiment?: string }).sentiment === "positive" ? "😊 Positive"
                              : (item as { sentiment?: string }).sentiment === "negative" ? "😞 Negative"
                              : "😐 Neutral"}
                          </span>
                        )}
                        {item.page && (
                          <span className="text-xs text-gray-700 font-mono bg-gray-800 px-2 py-0.5 rounded-md">
                            {item.page}
                          </span>
                        )}
                        <span className="text-xs text-gray-700 flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {item.userId && (
                          <span className="text-xs text-gray-700">User #{item.userId}</span>
                        )}
                      </div>
                    </div>
                    {/* Triage status dropdown */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const s = STATUS_META[(item as { status?: string }).status ?? "new"] ?? STATUS_META.new;
                        return (
                          <select
                            value={(item as { status?: string }).status ?? "new"}
                            onChange={e => updateStatus.mutate({ id: item.id, status: e.target.value as "new" | "in_progress" | "done" | "dismissed" })}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${s.color} ${s.bg} ${s.border}`}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <p className="text-center text-gray-600 text-xs pb-4">
          Showing {filtered.length} of {total} entries · Click any row to expand full message
        </p>
      </div>
    </div>
  );
}
