/**
 * WeeklyReadinessReport — #10 High-Impact Feature
 *
 * Synthesizes all activity data from localStorage (drill ratings, mock scores,
 * behavioral practice) and generates a personalized weekly AI readiness report
 * with a grade, trajectory, and top 3 focus areas.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Sparkles, RotateCcw, Target, BookOpen, Code2 } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { PATTERNS } from "@/lib/guideData";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";

interface ActivityData {
  readinessScore: number;
  weakPatterns: string[];
  strongPatterns: string[];
  behavioralCoverage: number;
  mockScores: number[];
  lastWeekActivity: {
    problemsSolved: number;
    mocksTaken: number;
    behavioralPracticed: number;
  };
}

function loadActivityData(): ActivityData {
  try {
    // Load CTCI drill ratings
    const ratings: Record<string, number[]> = JSON.parse(localStorage.getItem("ctci_ratings_v1") ?? "{}");
    const patternRatings = PATTERNS.map(p => {
      const ratingList = ratings[p.name] ?? [];
      const avg = ratingList.length > 0 ? ratingList.reduce((a, b) => a + b, 0) / ratingList.length : 0;
      return { name: p.name, avg, count: ratingList.length };
    }).filter(p => p.count > 0);

    const weakPatterns = patternRatings.filter(p => p.avg < 3.5).map(p => p.name).slice(0, 5);
    const strongPatterns = patternRatings.filter(p => p.avg >= 4).map(p => p.name).slice(0, 5);

    // Load mock scores
    const mockScores: number[] = JSON.parse(localStorage.getItem("mock_scores_v1") ?? "[]");

    // Load behavioral coverage
    const behavioralAnswered: string[] = JSON.parse(localStorage.getItem("behavioral_answered_v1") ?? "[]");
    const behavioralCoverage = Math.min(100, Math.round((behavioralAnswered.length / 20) * 100));

    // Load last week activity
    const lastWeekActivity = JSON.parse(localStorage.getItem("last_week_activity_v1") ?? "{}");

    // Compute readiness score
    const drillScore = patternRatings.length > 0
      ? (patternRatings.reduce((a, p) => a + p.avg, 0) / patternRatings.length) * 20
      : 30;
    const mockScore = mockScores.length > 0
      ? (mockScores.reduce((a, b) => a + b, 0) / mockScores.length) * 20
      : 30;
    const behavioralScore = behavioralCoverage;
    const activityScore = Math.min(100, (lastWeekActivity.problemsSolved ?? 0) * 5 + (lastWeekActivity.mocksTaken ?? 0) * 10);
    const readinessScore = Math.round((drillScore * 0.35 + mockScore * 0.35 + behavioralScore * 0.2 + activityScore * 0.1));

    return {
      readinessScore,
      weakPatterns,
      strongPatterns,
      behavioralCoverage,
      mockScores: mockScores.slice(-5),
      lastWeekActivity: {
        problemsSolved: lastWeekActivity.problemsSolved ?? 0,
        mocksTaken: lastWeekActivity.mocksTaken ?? 0,
        behavioralPracticed: lastWeekActivity.behavioralPracticed ?? 0,
      },
    };
  } catch {
    return {
      readinessScore: 35,
      weakPatterns: [],
      strongPatterns: [],
      behavioralCoverage: 0,
      mockScores: [],
      lastWeekActivity: { problemsSolved: 0, mocksTaken: 0, behavioralPracticed: 0 },
    };
  }
}

const GRADE_STYLES: Record<string, string> = {
  A: "text-emerald-600 dark:text-emerald-400",
  B: "text-blue-600 dark:text-blue-400",
  C: "text-amber-800 dark:text-amber-900",
  D: "text-orange-800 dark:text-orange-900",
  F: "text-red-600 dark:text-red-400",
};

const TRAJECTORY_STYLES: Record<string, { color: string; badge: "emerald" | "orange" | "violet" }> = {
  "Ready": { color: "text-emerald-600 dark:text-emerald-400", badge: "emerald" },
  "On Track": { color: "text-violet-600 dark:text-violet-400", badge: "violet" },
  "Needs Acceleration": { color: "text-amber-800 dark:text-amber-900", badge: "orange" },
  "At Risk": { color: "text-red-600 dark:text-red-400", badge: "orange" },
};

function ActivityInput({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-700">
        {icon}
      </div>
      <div className="flex-1">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</label>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">−</button>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 w-6 text-center">{value}</span>
        <button onClick={() => onChange(value + 1)} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">+</button>
      </div>
    </div>
  );
}

export default function WeeklyReadinessReport() {
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [interviewDate, setInterviewDate] = useState("");
  const [activityOverride, setActivityOverride] = useState<{ problemsSolved: number; mocksTaken: number; behavioralPracticed: number } | null>(null);

  const baseData = useMemo(() => loadActivityData(), []);
  const activityData = activityOverride
    ? { ...baseData, lastWeekActivity: activityOverride }
    : baseData;

  const generateReport = trpc.highImpact.readinessReport.useMutation();

  const daysUntilInterview = interviewDate
    ? Math.max(0, Math.ceil((new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined;

  const handleGenerate = () => {
    generateReport.mutate({
      readinessScore: activityData.readinessScore,
      weakPatterns: activityData.weakPatterns,
      strongPatterns: activityData.strongPatterns,
      behavioralCoverage: activityData.behavioralCoverage,
      mockScores: activityData.mockScores,
      daysUntilInterview,
      targetLevel,
      lastWeekActivity: activityData.lastWeekActivity,
    });
  };

  const report = generateReport.data;

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Weekly AI Readiness Report"
        subtitle="Every Sunday, get an honest AI assessment of where you stand. Not cheerleading — a direct grade, trajectory, and your top 3 priorities for the week ahead."
        stat="The Coach You Don't Have"
        variant="emerald"
        icon={<TrendingUp size={20} />}
      />

      <ImpactCallout variant="orange">
        Most candidates don't know how far below the bar they are until the real interview. This report tells you every week — with enough time to fix it.
      </ImpactCallout>

      {/* Current snapshot */}
      <HighImpactWrapper variant="emerald" className="p-4">
        <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Your Current Snapshot</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className={`text-2xl font-bold ${activityData.readinessScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : activityData.readinessScore >= 50 ? "text-amber-800 dark:text-amber-900" : "text-red-600 dark:text-red-400"}`}>
              {activityData.readinessScore}
            </p>
            <p className="text-[10px] text-gray-700">Readiness Score /100</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activityData.behavioralCoverage}%</p>
            <p className="text-[10px] text-gray-700">Behavioral Coverage</p>
          </div>
        </div>

        {activityData.weakPatterns.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1.5">Weak Patterns:</p>
            <div className="flex flex-wrap gap-1.5">
              {activityData.weakPatterns.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold border border-red-200 dark:border-red-800/40">
                  ⚠ {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {activityData.strongPatterns.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">Strong Patterns:</p>
            <div className="flex flex-wrap gap-1.5">
              {activityData.strongPatterns.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/40">
                  ✓ {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last week activity override */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">This Week's Activity (adjust if needed):</p>
          <div className="space-y-2">
            <ActivityInput
              label="Problems Solved"
              value={activityOverride?.problemsSolved ?? activityData.lastWeekActivity.problemsSolved}
              onChange={v => setActivityOverride(prev => ({ ...(prev ?? activityData.lastWeekActivity), problemsSolved: v }))}
              icon={<Code2 size={13} />}
            />
            <ActivityInput
              label="Mock Interviews Taken"
              value={activityOverride?.mocksTaken ?? activityData.lastWeekActivity.mocksTaken}
              onChange={v => setActivityOverride(prev => ({ ...(prev ?? activityData.lastWeekActivity), mocksTaken: v }))}
              icon={<Target size={13} />}
            />
            <ActivityInput
              label="Behavioral Sessions"
              value={activityOverride?.behavioralPracticed ?? activityData.lastWeekActivity.behavioralPracticed}
              onChange={v => setActivityOverride(prev => ({ ...(prev ?? activityData.lastWeekActivity), behavioralPracticed: v }))}
              icon={<BookOpen size={13} />}
            />
          </div>
        </div>
      </HighImpactWrapper>

      {/* Report config */}
      <HighImpactWrapper variant="emerald" className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-1.5 block">Target Level</label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                <button key={l} onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 dark:border-gray-700 text-gray-700 hover:border-emerald-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-1.5 block">
              Interview Date
              {daysUntilInterview !== undefined && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400 normal-case font-normal">
                  {daysUntilInterview} days
                </span>
              )}
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generateReport.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
        >
          {generateReport.isPending ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating report...</>
          ) : (
            <><Sparkles size={16} />Generate Weekly Report</>
          )}
        </button>
      </HighImpactWrapper>

      {/* Report output */}
      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Headline */}
            <HighImpactWrapper variant="emerald" className="p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-1">This Week's Assessment</p>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200 leading-snug">{report.headline}</p>
                </div>
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className={`text-4xl font-black ${GRADE_STYLES[report.weeklyGrade] ?? "text-gray-600 dark:text-gray-300"}`}>
                    {report.weeklyGrade}
                  </span>
                  <span className="text-[10px] text-gray-700 font-bold">GRADE</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-gray-700">Trajectory:</span>
                <HighImpactBadge
                  variant={TRAJECTORY_STYLES[report.trajectory]?.badge ?? "orange"}
                  label={report.trajectory}
                />
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 mb-4">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Coach's Message:</p>
                <p className="text-sm text-gray-700 dark:text-gray-200 italic">{report.coachMessage}</p>
              </div>

              {/* Top 3 focus areas */}
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Top 3 Priorities This Week</p>
                <div className="space-y-3">
                  {report.top3Focus.map((focus: { area: string; why: string; exercise: string }, i: number) => (
                    <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${i === 0 ? "bg-red-500" : i === 1 ? "bg-amber-500" : "bg-blue-500"}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{focus.area}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1.5 ml-7">{focus.why}</p>
                      <div className="ml-7 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 px-2 py-1.5">
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">This week's exercise:</p>
                        <p className="text-xs text-gray-700 dark:text-gray-200">{focus.exercise}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => generateReport.reset()} className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors">
                <RotateCcw size={12} /> Regenerate Report
              </button>
            </HighImpactWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
