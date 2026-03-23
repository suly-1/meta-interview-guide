/**
 * PersonalizedRemediationPlan — #6 High-Impact Feature
 *
 * Reads the candidate's CTCI drill ratings + mock history from localStorage,
 * then AI generates a personalized 7-day study plan targeting their weakest patterns.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { Target, Calendar, ChevronDown, ChevronUp, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { PATTERNS } from "@/lib/guideData";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";

interface PatternRating {
  name: string;
  avgRating: number;
  drillCount: number;
}

interface PlanItem {
  problemName: string;
  difficulty: string;
  targetPattern: string;
  whyThisProblem: string;
  keyInsight: string;
}

function loadWeakPatterns(): PatternRating[] {
  // Read from CTCI drill ratings stored in localStorage
  try {
    const ratings: Record<string, number[]> = JSON.parse(localStorage.getItem("ctci_ratings_v1") ?? "{}");
    return PATTERNS.map(p => {
      const ratingList = ratings[p.name] ?? [];
      const avg = ratingList.length > 0 ? ratingList.reduce((a, b) => a + b, 0) / ratingList.length : 0;
      return { name: p.name, avgRating: avg, drillCount: ratingList.length };
    }).sort((a, b) => {
      // Unrated patterns first (need attention), then lowest rated
      if (a.drillCount === 0 && b.drillCount === 0) return 0;
      if (a.drillCount === 0) return -1;
      if (b.drillCount === 0) return 1;
      return a.avgRating - b.avgRating;
    });
  } catch {
    return PATTERNS.map(p => ({ name: p.name, avgRating: 0, drillCount: 0 }));
  }
}

function RatingBar({ rating, count }: { rating: number; count: number }) {
  const pct = count === 0 ? 0 : (rating / 5) * 100;
  const color = count === 0 ? "bg-gray-300 dark:bg-gray-600" : rating >= 4 ? "bg-emerald-500" : rating >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-500 w-12 text-right">
        {count === 0 ? "Unrated" : `${rating.toFixed(1)}/5`}
      </span>
    </div>
  );
}

export default function PersonalizedRemediationPlan() {
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [interviewDate, setInterviewDate] = useState("");
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [weakPatterns] = useState<PatternRating[]>(loadWeakPatterns);

  const generatePlan = trpc.highImpact.remediationPlan.useMutation();

  const top3Weak = weakPatterns.slice(0, 3);
  const hasEnoughData = weakPatterns.some(p => p.drillCount > 0);

  const handleGenerate = () => {
    const weakest = top3Weak.map(p => {
      const patternData = PATTERNS.find(pat => pat.name === p.name);
      return {
        name: p.name,
        rating: p.avgRating,
        keyIdea: patternData?.keyIdea ?? `Practice ${p.name} problems`,
      };
    });
    generatePlan.mutate({ weakPatterns: weakest, targetLevel });
  };

  const plan = generatePlan.data;
  const daysUntilInterview = interviewDate
    ? Math.max(0, Math.ceil((new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Personalized Remediation Plan"
        subtitle="Stop studying what you already know. This plan reads your actual drill performance and builds a targeted 7-day schedule for your weakest patterns."
        stat="Targets Your Gaps"
        variant="emerald"
        icon={<Target size={20} />}
      />

      <ImpactCallout variant="orange">
        Generic study plans fail because they don't know your weaknesses. This plan is built from your actual drill ratings — it knows exactly which patterns to prioritize.
      </ImpactCallout>

      {/* Weakness snapshot */}
      <HighImpactWrapper variant="emerald" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Your Pattern Weakness Snapshot</h4>
          {!hasEnoughData && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertCircle size={11} />
              Complete drills to personalize
            </div>
          )}
        </div>
        <div className="space-y-2.5">
          {weakPatterns.slice(0, 8).map((p, i) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-xs font-semibold ${i < 3 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {i < 3 && "⚠ "}{p.name}
                </span>
                {i < 3 && <HighImpactBadge size="sm" variant="red" label="PRIORITY" />}
              </div>
              <RatingBar rating={p.avgRating} count={p.drillCount} />
            </div>
          ))}
        </div>
      </HighImpactWrapper>

      {/* Generate form */}
      <HighImpactWrapper variant="emerald" className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Target Level</label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                <button key={l} onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
              Interview Date (optional)
              {daysUntilInterview !== null && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400 normal-case font-normal">
                  {daysUntilInterview} days away
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

        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Plan will target:</p>
          <div className="flex flex-wrap gap-2">
            {top3Weak.map(p => (
              <span key={p.name} className="text-[10px] px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold border border-red-200 dark:border-red-800/40">
                ⚠ {p.name}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generatePlan.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
        >
          {generatePlan.isPending ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating your plan...</>
          ) : (
            <><Sparkles size={16} />Generate My 7-Day Plan</>
          )}
        </button>
      </HighImpactWrapper>

      {/* Plan output */}
      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <HighImpactWrapper variant="emerald" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-500" />
                  Your 7-Day Plan
                </h4>
                <HighImpactBadge variant="emerald" label="PERSONALIZED" />
              </div>

              {plan.studyOrder && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 mb-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Study Order:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{plan.studyOrder}</p>
                </div>
              )}
              {plan.mindsetTip && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3 mb-3">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Mindset Tip:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{plan.mindsetTip}</p>
                </div>
              )}

              <div className="space-y-2">
                {plan.plan.map((item: PlanItem, idx: number) => (
                  <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : item.difficulty === "Hard" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                          {idx + 1}
                        </span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.problemName}</p>
                          <p className="text-[10px] text-gray-500">{item.difficulty} · {item.targetPattern}</p>
                        </div>
                      </div>
                      {expandedDay === idx ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedDay === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                              <TrendingUp size={11} /> Why this problem: {item.whyThisProblem}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-bold">Key Insight:</span> {item.keyInsight}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </HighImpactWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
