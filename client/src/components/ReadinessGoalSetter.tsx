/**
 * ReadinessGoalSetter — Set a target readiness % and interview date, then see a daily task plan.
 * Feature 8: Readiness Goal Setter
 */
import { useState, useEffect, useMemo } from "react";
import { Target, Calendar, Flame, CheckCircle2, ChevronRight, Trash2 } from "lucide-react";

const LS_KEY = "meta_readiness_goal_v1";

interface Goal {
  targetScore: number;
  targetDate: string; // ISO date string YYYY-MM-DD
  targetIC6PlusPct?: number; // target % of IC6+ signals in SD mock debrief
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getReadinessScore(): number {
  // Mirror the readiness score calculation from ReadinessTab
  try {
    const patternRatings: Record<string, number> = JSON.parse(localStorage.getItem("meta_pattern_ratings") || "{}");
    const ctciProgress: Record<string, { solved?: boolean }> = JSON.parse(localStorage.getItem("meta_ctci_progress") || "{}");
    const starStories: Record<string, string> = JSON.parse(localStorage.getItem("meta_star_stories") || "{}");
    const ic7Signals: Record<string, boolean> = JSON.parse(localStorage.getItem("meta_ic7_signals") || "{}");

    // Coding score (40%): average pattern ratings / 5
    const ratings = Object.values(patternRatings).filter(r => r > 0);
    const codingScore = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length / 5) * 100 : 0;

    // CTCI score (20%): solved / 500
    const solved = Object.values(ctciProgress).filter(p => p.solved).length;
    const ctciScore = (solved / 500) * 100;

    // Behavioral score (25%): STAR stories filled
    const storiesCount = Object.values(starStories).filter(s => s && s.trim().length > 20).length;
    const behavioralScore = Math.min((storiesCount / 28) * 100, 100);

    // IC7 signals (15%)
    const signalsCount = Object.values(ic7Signals).filter(Boolean).length;
    const signalScore = (signalsCount / 8) * 100;

    return Math.round(codingScore * 0.4 + ctciScore * 0.2 + behavioralScore * 0.25 + signalScore * 0.15);
  } catch {
    return 0;
  }
}

function generateDailyTasks(currentScore: number, targetScore: number, daysLeft: number): string[] {
  const gap = Math.max(0, targetScore - currentScore);
  const tasks: string[] = [];

  if (daysLeft <= 0) {
    tasks.push("Your interview date has passed — review your notes and stay confident!");
    return tasks;
  }

  if (gap === 0) {
    tasks.push("You've hit your target! Keep practicing to maintain your edge.");
    tasks.push("Do 1 timed LeetCode problem to stay sharp.");
    tasks.push("Review your weakest pattern card once.");
    return tasks;
  }

  // Calculate how many problems/sessions per day are needed
  const problemsPerDay = Math.max(1, Math.ceil((gap / 100) * 500 / daysLeft));
  const patternsPerDay = Math.max(1, Math.ceil((gap / 100) * 14 / daysLeft));

  if (daysLeft >= 30) {
    tasks.push(`Solve ${Math.min(problemsPerDay, 5)} CTCI problems (focus on your weakest topic).`);
    tasks.push(`Study ${Math.min(patternsPerDay, 2)} pattern card(s) using Teach It Back mode.`);
    tasks.push("Write or refine 1 STAR story for a behavioral question.");
    if (gap > 30) tasks.push("Complete 1 system design pattern card with a 5-min sketch.");
  } else if (daysLeft >= 14) {
    tasks.push(`Solve ${Math.min(problemsPerDay, 4)} CTCI problems — prioritize Medium difficulty.`);
    tasks.push("Do 1 full timed mock coding session (45 min).`");
    tasks.push("Review 2 behavioral questions and refine your STAR stories.");
    tasks.push("Run through 1 system design pattern end-to-end.");
  } else if (daysLeft >= 7) {
    tasks.push("Do 1 full timed mock coding session (45 min) — simulate interview conditions.");
    tasks.push("Review all starred CTCI problems you haven't solved.");
    tasks.push("Practice 2 behavioral questions out loud using the Persona Simulator.");
    tasks.push("Read through your Notes Cheat Sheet for the top 3 patterns.");
  } else {
    tasks.push("Light review only — do 2–3 easy/medium problems to stay warm.");
    tasks.push("Re-read your STAR stories and say them out loud.");
    tasks.push("Review the Interview Day Checklist in the Timeline tab.");
    tasks.push("Get 8 hours of sleep and eat well — you're ready.");
  }

  return tasks;
}

export default function ReadinessGoalSetter() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftScore, setDraftScore] = useState(80);
  const [draftIC6PlusPct, setDraftIC6PlusPct] = useState(60);
  const [draftDate, setDraftDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const currentScore = useMemo(() => getReadinessScore(), []);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Goal;
        setGoal(parsed);
        setDraftScore(parsed.targetScore);
        setDraftDate(parsed.targetDate);
      } else {
        setEditing(true); // Show form on first visit
      }
    } catch {
      setEditing(true);
    }
  }, []);

  const handleSave = () => {
    const newGoal: Goal = { targetScore: draftScore, targetDate: draftDate, targetIC6PlusPct: draftIC6PlusPct };
    setGoal(newGoal);
    localStorage.setItem(LS_KEY, JSON.stringify(newGoal));
    setEditing(false);
  };

  const handleDelete = () => {
    setGoal(null);
    localStorage.removeItem(LS_KEY);
    setEditing(true);
  };

  const daysLeft = goal ? getDaysUntil(goal.targetDate) : 0;
  const dailyTasks = goal ? generateDailyTasks(currentScore, goal.targetScore, daysLeft) : [];
  const progressToGoal = goal ? Math.min(100, Math.round((currentScore / goal.targetScore) * 100)) : 0;
  const pointsNeeded = goal ? Math.max(0, goal.targetScore - currentScore) : 0;
  const pointsPerDay = daysLeft > 0 && pointsNeeded > 0 ? (pointsNeeded / daysLeft).toFixed(1) : "0";

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Readiness Goal
          </h3>
        </div>
        {goal && !editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Goal form */}
      {editing && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set a target readiness score and interview date to get a personalized daily task plan.
          </p>

          {/* Current score context */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Your current readiness score:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{currentScore}/100</span>
          </div>

          {/* Target score slider */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Target Readiness Score: <span className="text-rose-600 dark:text-rose-400 font-black">{draftScore}%</span>
            </label>
            <input
              type="range"
              min={Math.max(currentScore + 1, 10)}
              max={100}
              value={draftScore}
              onChange={e => setDraftScore(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Current: {currentScore}%</span>
              <span>Target: {draftScore}%</span>
              <span>Max: 100%</span>
            </div>
          </div>

          {/* IC6+ target */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Target IC6+ Signal %: <span className="text-blue-600 dark:text-blue-400 font-black">{draftIC6PlusPct}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={draftIC6PlusPct}
              onChange={e => setDraftIC6PlusPct(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>10% (IC4 heavy)</span>
              <span className="font-bold text-blue-600">{draftIC6PlusPct}% target</span>
              <span>100% (all IC6+)</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">This goal line appears on the IC Signal Trend chart in the System Design section.</p>
          </div>

          {/* Target date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              <Calendar size={12} className="inline mr-1" />
              Interview Date
            </label>
            <input
              type="date"
              value={draftDate}
              min={minDateStr}
              onChange={e => setDraftDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={draftScore <= currentScore || !draftDate}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Set Goal
            </button>
            {goal && (
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-semibold rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Goal dashboard */}
      {goal && !editing && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {daysLeft > 0 ? daysLeft : 0}
              </div>
              <div className="text-xs text-rose-600/70 dark:text-rose-400/70 font-medium">days left</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {pointsNeeded}
              </div>
              <div className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">pts needed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {pointsPerDay}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">pts/day</div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Progress to goal</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{currentScore}% → {goal.targetScore}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  progressToGoal >= 100 ? "bg-emerald-500" :
                  progressToGoal >= 70 ? "bg-green-400" :
                  progressToGoal >= 40 ? "bg-amber-400" : "bg-rose-400"
                }`}
                style={{ width: `${progressToGoal}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0%</span>
              <span className="font-semibold text-gray-600 dark:text-gray-400">{progressToGoal}% of goal reached</span>
              <span>{goal.targetScore}%</span>
            </div>
          </div>

          {/* Interview date */}
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            daysLeft <= 3 ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300" :
            daysLeft <= 7 ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300" :
            "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
          }`}>
            <Calendar size={14} className="flex-shrink-0" />
            <span>
              Interview: <strong>{new Date(goal.targetDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong>
              {daysLeft > 0 ? ` (${daysLeft} days away)` : " (today or past)"}
            </span>
          </div>

          {/* Daily tasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-orange-500" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Today's Recommended Tasks</h4>
            </div>
            <div className="space-y-2">
              {dailyTasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <ChevronRight size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* On-track status */}
          {pointsNeeded === 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={15} />
              <span className="font-semibold">You've reached your target score! Keep practicing to stay sharp.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
