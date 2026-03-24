/**
 * AdminFeedback — owner-only dashboard at /admin/feedback.
 * Shows all site feedback sorted by category and rating.
 * Gated by ctx.user.role === 'admin' on the server.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Bug, Lightbulb, BookOpen, Palette, HelpCircle,
  Star, Filter, ArrowLeft, RefreshCw, BarChart2,
  TrendingUp, MessageSquare, Clock, Users, Trophy, Zap
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const FEATURE_LABELS: Record<string, { label: string; emoji: string; domain: string }> = {
  ai_interrupt:    { label: "AI Interrupt Mode",     emoji: "🤖", domain: "System Design" },
  boe_grader:      { label: "BoE Grader",            emoji: "🔢", domain: "System Design" },
  adversarial:     { label: "Adversarial Review",    emoji: "⚔️", domain: "System Design" },
  think_out_loud:  { label: "Think Out Loud",        emoji: "🎙️", domain: "Coding" },
  pattern_drill:   { label: "Pattern Speed Drill",   emoji: "⚡", domain: "Coding" },
  remediation:     { label: "Remediation Plan",      emoji: "🗺️", domain: "Coding" },
  story_matrix:    { label: "Story Matrix",          emoji: "🗂️", domain: "Behavioral" },
  persona_stress:  { label: "Persona Stress Test",   emoji: "🎭", domain: "Behavioral" },
  impact_coach:    { label: "Impact Coach",          emoji: "📊", domain: "Behavioral" },
  readiness:       { label: "Readiness Report",      emoji: "📈", domain: "Cross-domain" },
};

const DOMAIN_COLORS: Record<string, string> = {
  "System Design": "text-violet-600 bg-violet-50 border-violet-200",
  "Coding":        "text-blue-600 bg-blue-50 border-blue-200",
  "Behavioral":    "text-amber-600 bg-amber-50 border-amber-200",
  "Cross-domain":  "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bug:     { label: "Bug",     icon: <Bug size={13} />,        color: "text-red-700",    bg: "bg-red-100 border-red-200" },
  feature: { label: "Feature", icon: <Lightbulb size={13} />,  color: "text-amber-700",  bg: "bg-amber-100 border-amber-200" },
  content: { label: "Content", icon: <BookOpen size={13} />,   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  ux:      { label: "UX",      icon: <Palette size={13} />,    color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  other:   { label: "Other",   icon: <HelpCircle size={13} />, color: "text-gray-700",   bg: "bg-gray-100 border-gray-200" },
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new:         { label: "New",         color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  in_progress: { label: "In Progress", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  done:        { label: "Done",        color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  dismissed:   { label: "Dismissed",   color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200" },
};

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-gray-400">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{RATING_LABELS[rating]}</span>
    </div>
  );
}

export default function AdminFeedback() {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "rating_high" | "rating_low">("newest");

  const { data: feedback, isLoading, refetch } = trpc.feedback.getAllSiteFeedback.useQuery(undefined);

  const { data: aggregateStats } = trpc.scores.getAggregate.useQuery(undefined);

  const utils = trpc.useUtils();
  const updateStatus = trpc.feedback.updateFeedbackStatus.useMutation({
    onSuccess: () => utils.feedback.getAllSiteFeedback.invalidate(),
  });

  const filtered = useMemo(() => {
    if (!feedback?.length) return [];
    let items = [...feedback];
    if (categoryFilter !== "all") items = items.filter(f => f.category === categoryFilter);
    if (sortBy === "rating_high") items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sortBy === "rating_low") items.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    // newest is default (already sorted by createdAt desc from server)
    return items;
  }, [feedback, categoryFilter, sortBy]);

  // Category counts for the summary bar
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, bug: 0, feature: 0, content: 0, ux: 0, other: 0 };
    for (const f of feedback ?? []) {
      c.all++;
      c[f.category] = (c[f.category] ?? 0) + 1;
    }
    return c;
  }, [feedback]);

  const avgRating = useMemo(() => {
    const rated = (feedback ?? []).filter(f => f.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [feedback]);

  // Always accessible via admin token — no auth guard needed

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              <ArrowLeft size={15} />
              Back to guide
            </button>
          </Link>
          <div className="flex-1" />
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart2 size={18} className="text-indigo-600" />
            Feedback Dashboard
          </h1>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{counts.all}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><MessageSquare size={11} /> Total</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-black text-amber-500">{avgRating ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><Star size={11} /> Avg Rating</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{counts.feature ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><Lightbulb size={11} /> Features</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className="text-2xl font-black text-red-500">{counts.bug ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><Bug size={11} /> Bugs</p>
          </div>
        </div>

        {/* Aggregate Anonymous Pass-Rate Stats */}
        {aggregateStats && aggregateStats.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <TrendingUp size={15} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Feature Engagement &amp; Pass-Rate Stats</h2>
                <p className="text-xs text-gray-500">Anonymized — candidates who scored ≥70 are counted as "passing"</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(
                aggregateStats.reduce((acc, row) => {
                  if (!acc[row.feature]) acc[row.feature] = { totalSessions: 0, passRate: 0, avgScore: 0, count: 0 };
                  acc[row.feature].totalSessions += row.totalSessions;
                  acc[row.feature].passRate = Math.max(acc[row.feature].passRate, row.passRate);
                  acc[row.feature].avgScore += row.avgScore;
                  acc[row.feature].count += 1;
                  return acc;
                }, {} as Record<string, { totalSessions: number; passRate: number; avgScore: number; count: number }>)
              )
                .sort((a, b) => b[1].passRate - a[1].passRate)
                .map(([feature, stats]) => {
                  const meta = FEATURE_LABELS[feature];
                  const label = meta?.label ?? feature;
                  const domain = meta?.domain ?? "Other";
                  const emoji = meta?.emoji ?? "📊";
                  const domainColor = DOMAIN_COLORS[domain] ?? "text-gray-600 bg-gray-50 border-gray-200";
                  const avgScore = stats.count > 0 ? Math.round(stats.avgScore / stats.count) : 0;
                  const passColor = stats.passRate >= 60 ? "text-emerald-600" : stats.passRate >= 40 ? "text-amber-600" : "text-red-500";
                  return (
                    <div key={feature} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{emoji} {label}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${domainColor}`}>{domain}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xl font-black ${passColor}`}>{stats.passRate}%</p>
                          <p className="text-xs text-gray-400">pass rate</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
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
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Zap size={11} /> Stats update in real-time as candidates complete sessions. Minimum 5 sessions required per feature for reliable data.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mr-1">
            <Filter size={13} /> Filter:
          </div>
          {["all", "bug", "feature", "content", "ux", "other"].map(cat => {
            const meta = cat === "all" ? null : CATEGORY_META[cat];
            const count = counts[cat] ?? 0;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  categoryFilter === cat
                    ? cat === "all"
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300 ring-2 ring-indigo-300 ring-offset-1"
                      : `${meta?.bg} ${meta?.color} ring-2 ring-current ring-offset-1`
                    : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                {meta?.icon}
                {cat === "all" ? "All" : meta?.label}
                <span className="ml-0.5 opacity-70">({count})</span>
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-1.5">
            <TrendingUp size={13} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="newest">Newest first</option>
              <option value="rating_high">Highest rating</option>
              <option value="rating_low">Lowest rating</option>
            </select>
          </div>
        </div>

        {/* Feedback list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No feedback yet</p>
            <p className="text-sm mt-1">
              {categoryFilter !== "all" ? "No items in this category." : "Feedback will appear here once users submit it."}
            </p>
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
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Category badge */}
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Message */}
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{item.message}</p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <StarRow rating={item.rating} />
                        {item.page && (
                          <span className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            {item.page}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {item.userId && (
                          <span className="text-xs text-gray-400">User #{item.userId}</span>
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
      </div>
    </div>
  );
}
