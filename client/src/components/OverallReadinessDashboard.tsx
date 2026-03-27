/**
 * OverallReadinessDashboard — live in-page readiness overview
 * Shows: score ring, 4 breakdown bars, pattern strength/weakness, CTCI stats,
 * streak calendar mini-view, behavioral ratings summary, and action items.
 */
import { useMemo } from "react";
import { TrendingUp, Target, BookOpen, Flame, Brain, CheckCircle2, AlertCircle, Circle, ExternalLink } from "lucide-react";
import { PATTERNS, BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useReadinessScore } from "@/hooks/useReadinessScore";

const DRILL_KEY   = "meta-guide-drill-ratings";
const CTCI_KEY    = "ctci_progress_v1";
const BEH_KEY     = "meta-guide-practice-ratings";
const STREAK_KEY  = "meta-guide-streak-dates";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

// SVG score ring
function ScoreRing({ score, color, size = 140 }: { score: number; color: string; size?: number }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

// Mini horizontal bar
function MiniBar({ value, color, label, detail }: { value: number; color: string; label: string; detail: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-600">{detail}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function OverallReadinessDashboard() {
  const readiness = useReadinessScore();

  const drillData = useMemo(() => loadJSON<Record<string, { rating: number }[]>>(DRILL_KEY, {}), []);
  const ctciData  = useMemo(() => loadJSON<Record<number, { solved: boolean }>>(CTCI_KEY, {}), []);
  const behData   = useMemo(() => loadJSON<Record<string, { rating: number; timestamp: number }[]>>(BEH_KEY, {}), []);

  // Pattern ratings
  const patternRatings = useMemo(() =>
    PATTERNS.map(p => {
      const entries = drillData[p.id] ?? [];
      const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : null;
      return { id: p.id, name: p.name, avg, attempts: entries.length };
    }), [drillData]);

  const drilled = patternRatings.filter(p => p.avg !== null);
  const strong  = [...drilled].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)).slice(0, 3);
  const weak    = [...drilled].sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0)).slice(0, 3);
  const undrilled = patternRatings.filter(p => p.avg === null);

  // CTCI stats
  const ctciByDiff = useMemo(() => ["Easy", "Medium", "Hard"].map(diff => {
    const total  = CTCI_PROBLEMS.filter(p => p.difficulty === diff).length;
    const solved = CTCI_PROBLEMS.filter(p => p.difficulty === diff && ctciData[p.id]?.solved).length;
    return { diff, total, solved, pct: total > 0 ? Math.round((solved / total) * 100) : 0 };
  }), [ctciData]);

  // Behavioral summary
  const behSummary = useMemo(() => {
    const allRatings: number[] = [];
    let rated = 0;
    let total = 0;
    BEHAVIORAL_FOCUS_AREAS.forEach(fa => {
      fa.questions.forEach(q => {
        total++;
        const key = q.question.slice(0, 80);
        const entries = behData[key] ?? [];
        if (entries.length) { rated++; allRatings.push(entries[entries.length - 1].rating); }
      });
    });
    const avg = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null;
    return { rated, total, avg };
  }, [behData]);

  // Streak last 14 days
  const streakDates = useMemo(() => {
    const dates = loadJSON<string[]>(STREAK_KEY, []);
    return new Set(dates);
  }, []);

  const last14 = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split("T")[0];
    });
  }, []);

  // Score color
  const scoreColor =
    readiness.total >= 75 ? "#10b981" :
    readiness.total >= 50 ? "#3b82f6" :
    readiness.total >= 30 ? "#f59e0b" : "#ef4444";

  const scoreLabel =
    readiness.total >= 75 ? "Strong" :
    readiness.total >= 50 ? "On Track" :
    readiness.total >= 30 ? "Developing" : "Early Stage";

  const scoreBg =
    readiness.total >= 75 ? "from-emerald-50 to-teal-50 border-emerald-200" :
    readiness.total >= 50 ? "from-blue-50 to-indigo-50 border-blue-200" :
    readiness.total >= 30 ? "from-amber-50 to-yellow-50 border-amber-200" :
    "from-red-50 to-rose-50 border-red-200";

  // Action items
  const actions: { text: string; priority: "high" | "medium" | "low" }[] = [];
  if (undrilled.length > 0) actions.push({ text: `Drill ${undrilled.length} undrilled pattern${undrilled.length > 1 ? "s" : ""}: ${undrilled.slice(0, 2).map(p => p.name).join(", ")}${undrilled.length > 2 ? "…" : ""}`, priority: "high" });
  if (readiness.ctciSolved < 50) actions.push({ text: `Solve more CTCI problems — currently at ${readiness.ctciSolved}/${readiness.ctciTotal}`, priority: "high" });
  if (behSummary.rated < behSummary.total / 2) actions.push({ text: `Rate more behavioral questions — ${behSummary.total - behSummary.rated} unrated`, priority: "medium" });
  if (readiness.streak < 3) actions.push({ text: "Build a daily streak — practice at least once per day", priority: "medium" });
  if (weak.length > 0 && (weak[0].avg ?? 5) < 3) actions.push({ text: `Improve weak pattern: ${weak[0].name} (${weak[0].avg?.toFixed(1)}★)`, priority: "high" });

  return (
    <div className="space-y-6">

      {/* ── Score Hero ── */}
      <div className={`bg-gradient-to-br ${scoreBg} border rounded-2xl p-6`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <ScoreRing score={readiness.total} color={scoreColor} size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold" style={{ color: scoreColor, fontFamily: "'Space Grotesk', sans-serif" }}>
                {readiness.total}
              </span>
              <span className="text-xs font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 w-full space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Score Breakdown</p>
            <MiniBar
              value={readiness.drillScore}
              color="bg-blue-500"
              label="Quick Drill (40%)"
              detail={readiness.drillAvg ? `${readiness.drillAvg.toFixed(1)}★ avg · ${drilled.length}/${PATTERNS.length} patterns` : "No drills yet"}
            />
            <MiniBar
              value={readiness.ctciScore}
              color="bg-violet-500"
              label="CTCI Problems (30%)"
              detail={`${readiness.ctciSolved} / ${readiness.ctciTotal} solved`}
            />
            <MiniBar
              value={readiness.behavioralScore}
              color="bg-amber-500"
              label="Behavioral (20%)"
              detail={readiness.behavioralAvg ? `${readiness.behavioralAvg.toFixed(1)}★ avg · ${behSummary.rated}/${behSummary.total} rated` : "No ratings yet"}
            />
            <MiniBar
              value={readiness.streakScore}
              color="bg-orange-500"
              label="Streak (10%)"
              detail={`${readiness.streak} day${readiness.streak !== 1 ? "s" : ""} (cap 14)`}
            />
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Patterns Drilled", value: `${drilled.length}/${PATTERNS.length}`, sub: `${undrilled.length} remaining`, icon: <Brain size={16} className="text-blue-500" />, bg: "bg-blue-50 border-blue-200" },
          { label: "CTCI Solved", value: `${readiness.ctciSolved}`, sub: `of ${readiness.ctciTotal} problems`, icon: <BookOpen size={16} className="text-violet-500" />, bg: "bg-violet-50 border-violet-200" },
          { label: "Behavioral Rated", value: `${behSummary.rated}`, sub: `of ${behSummary.total} questions`, icon: <Target size={16} className="text-amber-500" />, bg: "bg-amber-100 border-amber-200" },
          { label: "Current Streak", value: `${readiness.streak}d`, sub: readiness.streak >= 3 ? "Keep it up!" : "Practice daily", icon: <Flame size={16} className="text-orange-500" />, bg: "bg-orange-100 border-orange-200" },
        ].map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-xs font-bold text-gray-600">{card.label}</span></div>
            <p className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{card.value}</p>
            <p className="text-[11px] text-gray-700 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Pattern Strength / Weakness ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strong */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Strongest Patterns</span>
          </div>
          {strong.length > 0 ? (
            <div className="space-y-2">
              {strong.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((p.avg ?? 0) / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 w-8 text-right">{p.avg?.toFixed(1)}★</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">Complete Quick Drills to see your strongest patterns.</p>
          )}
        </div>

        {/* Weak */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-red-400" />
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Needs Improvement</span>
          </div>
          {weak.length > 0 ? (
            <div className="space-y-2">
              {weak.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${((p.avg ?? 0) / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-red-500 w-8 text-right">{p.avg?.toFixed(1)}★</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">No drills yet — start with the Coding tab.</p>
          )}
          {undrilled.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Never Drilled</p>
              <div className="flex flex-wrap gap-1">
                {undrilled.slice(0, 5).map(p => (
                  <span key={p.id} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{p.name}</span>
                ))}
                {undrilled.length > 5 && <span className="text-[11px] text-gray-600">+{undrilled.length - 5} more</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CTCI by Difficulty ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={15} className="text-violet-500" />
          <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CTCI Problem Progress</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {ctciByDiff.map(d => {
            const color = d.diff === "Easy" ? { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" }
              : d.diff === "Medium" ? { bar: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-100 border-amber-200" }
              : { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-100 border-red-200" };
            return (
              <div key={d.diff} className={`rounded-lg border p-3 text-center ${color.bg}`}>
                <p className={`text-2xl font-extrabold ${color.text}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{d.solved}</p>
                <p className="text-[11px] text-gray-700">/ {d.total} {d.diff}</p>
                <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${d.pct}%` }} />
                </div>
                <p className={`text-xs font-bold mt-1 ${color.text}`}>{d.pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 14-day Streak ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-orange-500" />
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>14-Day Activity</span>
          </div>
          <span className="text-xs text-gray-600">{readiness.streak}-day current streak</span>
        </div>
        <div className="flex gap-1.5">
          {last14.map(date => {
            const active = streakDates.has(date);
            const isToday = date === new Date().toISOString().split("T")[0];
            return (
              <div key={date} title={date}
                className={`flex-1 h-7 rounded-md transition-all ${
                  active ? "bg-orange-400" : isToday ? "bg-blue-100 border border-blue-300" : "bg-gray-100"
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-600">14 days ago</span>
          <span className="text-[10px] text-gray-600">Today</span>
        </div>
      </div>

      {/* ── Action Items ── */}
      {actions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-blue-500" />
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recommended Next Steps</span>
          </div>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${
                a.priority === "high" ? "bg-red-100 border border-red-100" :
                a.priority === "medium" ? "bg-amber-100 border border-amber-100" :
                "bg-gray-50 border border-gray-100"
              }`}>
                <Circle size={7} className={`flex-shrink-0 mt-1.5 ${
                  a.priority === "high" ? "text-red-400 fill-red-400" :
                  a.priority === "medium" ? "text-amber-900 fill-amber-400" : "text-gray-600 fill-gray-400"
                }`} />
                <span className="text-xs text-gray-700">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
