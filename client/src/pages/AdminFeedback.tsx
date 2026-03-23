/**
 * AdminFeedback — owner-only dashboard at /admin/feedback.
 * Shows all site feedback sorted by category and rating.
 * Gated by ctx.user.role === 'admin' on the server.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Bug, Lightbulb, BookOpen, Palette, HelpCircle,
  Star, Filter, ArrowLeft, RefreshCw, Lock, BarChart2,
  TrendingUp, MessageSquare, Clock
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bug:     { label: "Bug",     icon: <Bug size={13} />,        color: "text-red-700",    bg: "bg-red-100 border-red-200" },
  feature: { label: "Feature", icon: <Lightbulb size={13} />,  color: "text-amber-700",  bg: "bg-amber-100 border-amber-200" },
  content: { label: "Content", icon: <BookOpen size={13} />,   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  ux:      { label: "UX",      icon: <Palette size={13} />,    color: "text-violet-700", bg: "bg-violet-100 border-violet-200" },
  other:   { label: "Other",   icon: <HelpCircle size={13} />, color: "text-gray-700",   bg: "bg-gray-100 border-gray-200" },
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

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
  const { isAuthenticated, loading, user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "rating_high" | "rating_low">("newest");

  const { data: feedback, isLoading, refetch } = trpc.feedback.getAllSiteFeedback.useQuery(undefined, {
    enabled: isAuthenticated,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Lock size={40} className="mx-auto text-gray-300" />
          <p className="font-bold text-gray-900 dark:text-gray-100">Sign in required</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Server returns [] for non-admins — detect that case
  const isAdmin = user?.role === "admin" || (feedback !== undefined && feedback !== null && Array.isArray(feedback));

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
