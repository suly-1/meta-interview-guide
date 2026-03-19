/**
 * CustomStudyPlan — Feature 15
 * Input: interview date, current CTCI solve count, weakest topics.
 * Output: day-by-day personalized plan as a downloadable checklist.
 */
import { useState, useMemo } from "react";
import { CalendarDays, Download, Copy, Check, Sparkles } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";

const CTCI_KEY = "ctci_progress_v1";

function loadProgress(): Record<number, { solved: boolean }> {
  try { return JSON.parse(localStorage.getItem(CTCI_KEY) ?? "{}"); } catch { return {}; }
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000));
}

export default function CustomStudyPlan() {
  const [interviewDate, setInterviewDate] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const progress = loadProgress();
  const solvedCount = Object.values(progress).filter(p => p.solved).length;
  const remaining = CTCI_PROBLEMS.length - solvedCount;

  const { plan, markdown } = useMemo(() => {
    if (!interviewDate || !generated) return { plan: [], markdown: "" };

    const daysLeft = getDaysUntil(interviewDate);
    if (daysLeft === 0) return { plan: [], markdown: "" };

    const weakPatterns = getWeakestPatterns(3);
    const weakNames = weakPatterns.map(p => p.patternName);

    const dailyTarget = Math.max(1, Math.ceil(Math.min(remaining, daysLeft * 3) / daysLeft));

    const phases: { name: string; pct: number; focus: string; problems: number; drills: string; behavioral: number }[] = [];

    if (daysLeft >= 21) {
      phases.push({ name: "Foundation", pct: 0.4, focus: "Arrays, Hashing, Two Pointers, Linked Lists", problems: dailyTarget, drills: "All patterns", behavioral: 1 });
      phases.push({ name: "Core Patterns", pct: 0.35, focus: "Trees, Graphs, Heaps, Binary Search", problems: dailyTarget + 1, drills: "Weak patterns", behavioral: 2 });
      phases.push({ name: "Hard Problems + Mock", pct: 0.25, focus: `Weak areas: ${weakNames.join(", ")}`, problems: dailyTarget + 2, drills: "Due patterns only", behavioral: 2 });
    } else if (daysLeft >= 7) {
      phases.push({ name: "Rapid Review", pct: 0.5, focus: `Weak areas: ${weakNames.join(", ")}`, problems: dailyTarget + 1, drills: "Weak patterns", behavioral: 2 });
      phases.push({ name: "Mock Interviews", pct: 0.5, focus: "Mixed difficulty, timed sessions", problems: dailyTarget, drills: "Due patterns only", behavioral: 2 });
    } else {
      phases.push({ name: "Final Sprint", pct: 1.0, focus: `Focus: ${weakNames.join(", ")} + review solved`, problems: Math.min(5, dailyTarget), drills: "Weakest 3 patterns", behavioral: 1 });
    }

    // Generate day-by-day plan
    const days: { day: number; date: string; phase: string; tasks: string[] }[] = [];
    let dayNum = 0;
    for (const phase of phases) {
      const phaseDays = Math.max(1, Math.round(daysLeft * phase.pct));
      for (let i = 0; i < phaseDays && dayNum < daysLeft; i++) {
        dayNum++;
        const date = new Date();
        date.setDate(date.getDate() + dayNum);
        const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const tasks = [
          `Solve ${phase.problems} CTCI problems (${phase.focus})`,
          `Quick Drill: ${phase.drills}`,
          `Practice ${phase.behavioral} behavioral question${phase.behavioral > 1 ? "s" : ""}`,
        ];
        if (dayNum % 7 === 0) tasks.push("Mock timed session (45 min)");
        days.push({ day: dayNum, date: dateStr, phase: phase.name, tasks });
      }
    }

    const md = `# Personalized Interview Study Plan
**Interview Date:** ${interviewDate} (${daysLeft} days away)
**CTCI Progress:** ${solvedCount}/${CTCI_PROBLEMS.length} solved · ${remaining} remaining
**Weak Areas:** ${weakNames.join(", ") || "Complete Quick Drill to identify"}

---

${days.map(d => `## Day ${d.day} — ${d.date} [${d.phase}]
${d.tasks.map(t => `- [ ] ${t}`).join("\n")}`).join("\n\n")}
`;

    return { plan: days, markdown: md };
  }, [interviewDate, generated, solvedCount, remaining]);

  const handleGenerate = () => {
    if (!interviewDate) return;
    setGenerated(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-plan-${interviewDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-teal-600" />
          <h3 className="text-sm font-bold text-teal-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Custom Study Plan Generator</h3>
        </div>
        <p className="text-xs text-teal-700 mb-4">
          Enter your interview date to generate a personalized day-by-day plan based on your current progress and weak areas.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Interview Date</label>
            <input
              type="date"
              value={interviewDate}
              onChange={e => { setInterviewDate(e.target.value); setGenerated(false); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-white"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-700">{solvedCount}</span> / {CTCI_PROBLEMS.length} CTCI solved
            {daysLeft !== null && <span className="ml-2 text-teal-600 font-semibold">· {daysLeft} days left</span>}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!interviewDate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Sparkles size={13} /> Generate Plan
          </button>
        </div>
      </div>

      {generated && plan.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {plan.length}-Day Plan
            </span>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:border-teal-300 transition-colors">
                {copied ? <><Check size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy MD</>}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Download size={12} /> Download
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {plan.slice(0, 14).map(d => (
              <div key={d.day} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-gray-400 w-10">Day {d.day}</span>
                  <span className="text-xs font-semibold text-gray-700">{d.date}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-semibold">{d.phase}</span>
                </div>
                <ul className="space-y-0.5 ml-12">
                  {d.tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-3 h-3 border border-gray-300 rounded-sm flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {plan.length > 14 && (
              <div className="px-5 py-3 text-center text-xs text-gray-400">
                +{plan.length - 14} more days — download the full plan to see all
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
