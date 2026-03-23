/**
 * Weak Pattern Heatmap
 * Aggregates AI review scores from the Code Practice tab by topic,
 * then renders a visual heatmap showing which patterns need the most work.
 * Surfaces in the Overview tab's Quick Actions area after 5+ reviews.
 */
import { useState } from "react";
import { useAIReviewHistory } from "@/hooks/useLocalStorage";
import { ChevronDown, ChevronUp, Flame, TrendingUp, AlertTriangle } from "lucide-react";

interface TopicStats {
  topic: string;
  avgScore: number;
  attempts: number;
  lastScore: number;
  trend: "up" | "down" | "flat";
}

function computeTopicStats(history: ReturnType<typeof useAIReviewHistory>[0]): TopicStats[] {
  const byTopic: Record<string, number[]> = {};
  for (const r of history) {
    if (!byTopic[r.topic]) byTopic[r.topic] = [];
    byTopic[r.topic].push(r.score);
  }
  return Object.entries(byTopic)
    .map(([topic, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const lastScore = scores[scores.length - 1];
      const prevScore = scores.length >= 2 ? scores[scores.length - 2] : lastScore;
      const trend: "up" | "down" | "flat" = lastScore > prevScore ? "up" : lastScore < prevScore ? "down" : "flat";
      return { topic, avgScore, attempts: scores.length, lastScore, trend };
    })
    .sort((a, b) => a.avgScore - b.avgScore); // weakest first
}

function heatColor(score: number): string {
  if (score >= 4.5) return "bg-emerald-500/80 border-emerald-500/40";
  if (score >= 3.5) return "bg-blue-500/70 border-blue-500/40";
  if (score >= 2.5) return "bg-amber-500/70 border-amber-500/40";
  if (score >= 1.5) return "bg-orange-500/70 border-orange-500/40";
  return "bg-red-500/70 border-red-500/40";
}

function heatLabel(score: number): string {
  if (score >= 4.5) return "Strong";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Needs Work";
  if (score >= 1.5) return "Weak";
  return "Critical";
}

function heatTextColor(score: number): string {
  if (score >= 4.5) return "text-emerald-300";
  if (score >= 3.5) return "text-blue-300";
  if (score >= 2.5) return "text-amber-300";
  if (score >= 1.5) return "text-orange-300";
  return "text-red-300";
}

export function WeakPatternHeatmap() {
  const [history] = useAIReviewHistory();
  const [open, setOpen] = useState(false);

  if (history.length < 5) return null; // Only show after 5+ reviews

  const stats = computeTopicStats(history);
  const weakTopics = stats.filter(s => s.avgScore < 3.5);
  const totalReviews = history.length;
  const overallAvg = history.reduce((a, b) => a + b.score, 0) / totalReviews;

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-950/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-400" />
          <span className="text-sm font-semibold text-foreground">Weak Pattern Heatmap</span>
          {weakTopics.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-bold">
              {weakTopics.length} weak area{weakTopics.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{totalReviews} AI reviews analyzed</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-orange-500/10">
          {/* Overall summary */}
          <div className="flex items-center gap-4 pt-3">
            <div className="rounded-lg bg-background border border-border px-4 py-2.5 text-center">
              <div className="text-[10px] text-muted-foreground">Overall Avg</div>
              <div className={`text-xl font-black ${heatTextColor(overallAvg)}`}>{overallAvg.toFixed(1)}</div>
              <div className={`text-[9px] font-semibold ${heatTextColor(overallAvg)}`}>{heatLabel(overallAvg)}</div>
            </div>
            <div className="rounded-lg bg-background border border-border px-4 py-2.5 text-center">
              <div className="text-[10px] text-muted-foreground">Topics Tracked</div>
              <div className="text-xl font-black text-foreground">{stats.length}</div>
            </div>
            <div className="rounded-lg bg-background border border-border px-4 py-2.5 text-center">
              <div className="text-[10px] text-muted-foreground">Total Reviews</div>
              <div className="text-xl font-black text-foreground">{totalReviews}</div>
            </div>
          </div>

          {/* Heatmap grid */}
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Topic Heatmap (weakest first)</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stats.map((s) => (
                <div
                  key={s.topic}
                  className={`rounded-lg border p-2.5 ${heatColor(s.avgScore)}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-semibold text-white leading-tight">{s.topic}</span>
                    {s.trend === "up" && <TrendingUp size={10} className="text-emerald-300 shrink-0 mt-0.5" />}
                    {s.trend === "down" && <AlertTriangle size={10} className="text-red-300 shrink-0 mt-0.5" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-base font-black text-white">{s.avgScore.toFixed(1)}</span>
                    <span className="text-[9px] text-white/70">/5 · {s.attempts} try</span>
                  </div>
                  <div className="text-[9px] text-white/80 font-medium">{heatLabel(s.avgScore)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Focus recommendations */}
          {weakTopics.length > 0 && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-2">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Focus on these now</div>
              {weakTopics.slice(0, 3).map((t) => (
                <div key={t.topic} className="flex items-center gap-2">
                  <Flame size={10} className="text-red-400 shrink-0" />
                  <span className="text-xs text-foreground font-semibold">{t.topic}</span>
                  <span className="text-xs text-muted-foreground">— avg {t.avgScore.toFixed(1)}/5 across {t.attempts} attempt{t.attempts !== 1 ? "s" : ""}</span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1">
                Go to the Code Practice tab, filter by these topics, and use the AI Solution Reviewer to close the gap.
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Critical (0–1.5)", color: "bg-red-500/70" },
              { label: "Weak (1.5–2.5)", color: "bg-orange-500/70" },
              { label: "Needs Work (2.5–3.5)", color: "bg-amber-500/70" },
              { label: "Good (3.5–4.5)", color: "bg-blue-500/70" },
              { label: "Strong (4.5+)", color: "bg-emerald-500/80" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
