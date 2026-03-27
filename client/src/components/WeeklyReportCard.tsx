/**
 * WeeklyReportCard — Feature 7
 * Auto-generated every Sunday: problems solved this week, patterns drilled,
 * behavioral questions practiced, streak, letter grade per category.
 */
import { useMemo, useState } from "react";
import { FileText, Copy, Check, TrendingUp } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { BEHAVIORAL_FOCUS_AREAS, PATTERNS } from "@/lib/guideData";

const CTCI_KEY = "ctci_progress_v1";
const DRILL_KEY = "meta-guide-drill-ratings";
const BEH_KEY = "meta-guide-practice-ratings";
const STREAK_KEY = "meta-guide-streak-dates";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

function getWeekDates(): { start: string; end: string; days: string[] } {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - day);
  const days: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return { start: days[0], end: days[6], days };
}

function grade(pct: number): { letter: string; color: string } {
  if (pct >= 0.9) return { letter: "A+", color: "text-emerald-600" };
  if (pct >= 0.8) return { letter: "A",  color: "text-emerald-600" };
  if (pct >= 0.7) return { letter: "B+", color: "text-blue-600" };
  if (pct >= 0.6) return { letter: "B",  color: "text-blue-600" };
  if (pct >= 0.5) return { letter: "C",  color: "text-amber-800" };
  if (pct >= 0.3) return { letter: "D",  color: "text-orange-800" };
  return { letter: "F", color: "text-red-600" };
}

export default function WeeklyReportCard() {
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    const { days, start, end } = getWeekDates();

    // CTCI solved this week
    const ctciData = loadJSON<Record<number, { solved: boolean; solvedAt?: string }>>(CTCI_KEY, {});
    const ctciThisWeek = CTCI_PROBLEMS.filter(p => {
      const prog = ctciData[p.id];
      if (!prog?.solved || !prog.solvedAt) return false;
      const d = prog.solvedAt.split("T")[0];
      return days.includes(d);
    });

    // Patterns drilled this week
    const drillData = loadJSON<Record<string, { rating: number; ts: number }[]>>(DRILL_KEY, {});
    const drillThisWeek = new Set<string>();
    PATTERNS.forEach(p => {
      const entries = drillData[p.id] ?? [];
      if (entries.some(e => {
        const d = new Date(e.ts).toISOString().split("T")[0];
        return days.includes(d);
      })) drillThisWeek.add(p.id);
    });

    // Behavioral questions practiced this week
    const behData = loadJSON<Record<string, { rating: number; timestamp: number }[]>>(BEH_KEY, {});
    let behThisWeek = 0;
    BEHAVIORAL_FOCUS_AREAS.forEach(fa => {
      fa.questions.forEach(q => {
        const key = q.question.slice(0, 80);
        const entries = behData[key] ?? [];
        if (entries.some(e => {
          const d = new Date(e.timestamp).toISOString().split("T")[0];
          return days.includes(d);
        })) behThisWeek++;
      });
    });

    // Streak days this week
    const streakDates = loadJSON<string[]>(STREAK_KEY, []);
    const streakThisWeek = days.filter(d => streakDates.includes(d)).length;

    // Grades
    const ctciGrade = grade(ctciThisWeek.length / 10); // target: 10/week
    const drillGrade = grade(drillThisWeek.size / PATTERNS.length);
    const behGrade = grade(behThisWeek / 5); // target: 5/week
    const streakGrade = grade(streakThisWeek / 5); // target: 5 active days

    const totalPct = (ctciThisWeek.length / 10 * 0.35 + drillThisWeek.size / PATTERNS.length * 0.35 + behThisWeek / 5 * 0.2 + streakThisWeek / 5 * 0.1);
    const overallGrade = grade(Math.min(1, totalPct));

    return { ctciThisWeek, drillThisWeek, behThisWeek, streakThisWeek, ctciGrade, drillGrade, behGrade, streakGrade, overallGrade, start, end };
  }, []);

  const markdownReport = `# Weekly Interview Prep Report
**Week of ${report.start} → ${report.end}**

| Category | This Week | Grade |
|---|---|---|
| CTCI Problems Solved | ${report.ctciThisWeek.length} | ${report.ctciGrade.letter} |
| Patterns Drilled | ${report.drillThisWeek.size} / ${PATTERNS.length} | ${report.drillGrade.letter} |
| Behavioral Questions | ${report.behThisWeek} | ${report.behGrade.letter} |
| Active Days (Streak) | ${report.streakThisWeek} / 7 | ${report.streakGrade.letter} |

**Overall: ${report.overallGrade.letter}**

${report.ctciThisWeek.length > 0 ? `### Problems Solved This Week\n${report.ctciThisWeek.map(p => `- [${p.name}](${p.url}) (${p.difficulty})`).join("\n")}` : ""}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const categories = [
    { label: "CTCI Solved", value: report.ctciThisWeek.length, target: 10, unit: "problems", grade: report.ctciGrade, color: "#3b82f6" },
    { label: "Patterns Drilled", value: report.drillThisWeek.size, target: PATTERNS.length, unit: "patterns", grade: report.drillGrade, color: "#6366f1" },
    { label: "Behavioral Q's", value: report.behThisWeek, target: 5, unit: "questions", grade: report.behGrade, color: "#8b5cf6" },
    { label: "Active Days", value: report.streakThisWeek, target: 7, unit: "days", grade: report.streakGrade, color: "#f59e0b" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-slate-300" />
          <div>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Weekly Report Card</p>
            <p className="text-xs text-slate-400">{report.start} → {report.end}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className={`text-2xl font-extrabold ${report.overallGrade.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {report.overallGrade.letter}
            </span>
            <p className="text-[10px] text-slate-400">Overall</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy MD</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
        {categories.map(c => (
          <div key={c.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">{c.label}</span>
              <span className={`text-sm font-extrabold ${c.grade.color}`}>{c.grade.letter}</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {c.value}
            </p>
            <p className="text-xs text-gray-600">of {c.target} target {c.unit}</p>
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (c.value / c.target) * 100)}%`, background: c.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {report.ctciThisWeek.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-2">Solved This Week</p>
          <div className="flex flex-wrap gap-1.5">
            {report.ctciThisWeek.slice(0, 8).map(p => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 hover:border-blue-300 rounded-full text-gray-600 hover:text-blue-600 transition-colors"
              >
                {p.name}
              </a>
            ))}
            {report.ctciThisWeek.length > 8 && (
              <span className="text-[11px] px-2 py-0.5 text-gray-600">+{report.ctciThisWeek.length - 8} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
