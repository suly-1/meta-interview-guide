/**
 * BoECalculatorGrader — #2 High-Impact Feature
 *
 * Candidate writes back-of-envelope estimation steps for a given system design
 * problem. AI grades math accuracy, assumption quality, and architectural connection.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calculator, CheckCircle2, AlertCircle, RotateCcw, Sparkles } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";

const BOE_PROBLEMS = [
  {
    title: "Design a URL Shortener",
    prompt: "Estimate: daily active users, reads/writes per second, storage needed over 5 years, bandwidth.",
    scaffold: `DAU: 
Reads/day: 
Writes/day: 
Read QPS: 
Write QPS: 
URL size: ~500 bytes
Storage/year: 
5-year storage: 
Bandwidth (read): 
Bandwidth (write): `,
  },
  {
    title: "Design a News Feed",
    prompt: "Estimate: DAU, posts per day, fanout per post, storage for posts + media, feed generation load.",
    scaffold: `DAU: 
Posts/day: 
Avg followers per user: 
Fanout writes/day: 
Post size (text): ~500 bytes
Media size (avg): ~1 MB
Storage/day: 
Feed generation QPS: `,
  },
  {
    title: "Design a Notification System",
    prompt: "Estimate: notifications/day, peak QPS, message queue throughput, storage for notification history.",
    scaffold: `DAU: 
Notifications/user/day: 
Total notifications/day: 
Peak multiplier: 3x
Peak QPS: 
Avg notification size: ~200 bytes
Storage/day: 
Queue throughput needed: `,
  },
  {
    title: "Design a Distributed Cache",
    prompt: "Estimate: cache hit rate target, data size in cache, memory needed, eviction rate.",
    scaffold: `Total data size: 
Cache hit rate target: 80%
Data to cache (20% rule): 
Avg object size: ~1 KB
Number of cache nodes: 
Memory per node: 
Read QPS: 
Write QPS (cache misses): `,
  },
];

function ScoreBar({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BoECalculatorGrader() {
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [estimationText, setEstimationText] = useState(BOE_PROBLEMS[0].scaffold);
  const [useScaffold, setUseScaffold] = useState(true);

  const gradeBoE = trpc.highImpact.gradeBoE.useMutation();

  const handleProblemChange = (idx: number) => {
    setSelectedProblem(idx);
    setEstimationText(BOE_PROBLEMS[idx].scaffold);
    gradeBoE.reset();
  };

  const handleGrade = () => {
    gradeBoE.mutate({
      problemTitle: BOE_PROBLEMS[selectedProblem].title,
      estimationSteps: estimationText,
      targetLevel,
    });
  };

  const result = gradeBoE.data;
  const avgScore = result
    ? ((result.mathAccuracy + result.assumptionQuality + result.architecturalConnection) / 3).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Back-of-Envelope Calculator & Grader"
        subtitle="Interviewers at Meta can tell within 2 minutes if you know how to estimate. This tool grades your math accuracy, assumption quality, and whether your numbers connect to your architecture."
        stat="2 Min = Pass or Fail"
        variant="violet"
        icon={<Calculator size={20} />}
      />

      <ImpactCallout variant="orange">
        Wrong order-of-magnitude estimates kill system design interviews. A candidate who says "we need 1 TB of storage" when the answer is 1 PB loses the interviewer's trust for the rest of the session.
      </ImpactCallout>

      <HighImpactWrapper variant="violet" className="p-4 space-y-4">
        {/* Problem selector */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Problem</label>
          <div className="grid grid-cols-2 gap-2">
            {BOE_PROBLEMS.map((p, i) => (
              <button key={i} onClick={() => handleProblemChange(i)}
                className={`text-left px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${selectedProblem === i ? "bg-violet-500 text-white border-violet-500" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300"}`}>
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Target + scaffold toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Target Level</label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                <button key={l} onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-violet-500 text-white border-violet-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-violet-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Scaffold</span>
            <button
              onClick={() => {
                setUseScaffold(!useScaffold);
                if (!useScaffold) setEstimationText(BOE_PROBLEMS[selectedProblem].scaffold);
                else setEstimationText("");
              }}
              className={`w-10 h-5 rounded-full transition-all relative ${useScaffold ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${useScaffold ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Prompt */}
        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-3">
          <p className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-1">Estimate:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{BOE_PROBLEMS[selectedProblem].prompt}</p>
        </div>

        {/* Estimation input */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Your Estimation</label>
          <textarea
            value={estimationText}
            onChange={e => setEstimationText(e.target.value)}
            rows={10}
            className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-violet-400 resize-none"
            placeholder="Write your back-of-envelope calculations here..."
          />
        </div>

        <button
          onClick={handleGrade}
          disabled={gradeBoE.isPending || estimationText.trim().length < 20}
          className="w-full flex items-center justify-center gap-2 py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
        >
          {gradeBoE.isPending ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Grading...</>
          ) : (
            <><Sparkles size={16} />Grade My Estimation</>
          )}
        </button>
      </HighImpactWrapper>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <HighImpactWrapper variant="violet" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Calculator size={15} className="text-violet-500" />
                  Estimation Grade
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${parseFloat(avgScore!) >= 4 ? "text-emerald-600 dark:text-emerald-400" : parseFloat(avgScore!) >= 3 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                    {avgScore}/5
                  </span>
                  <HighImpactBadge
                    variant={parseFloat(avgScore!) >= 4 ? "emerald" : parseFloat(avgScore!) >= 3 ? "orange" : "red"}
                    label={parseFloat(avgScore!) >= 4 ? "STRONG" : parseFloat(avgScore!) >= 3 ? "ADEQUATE" : "NEEDS WORK"}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <ScoreBar label="Math Accuracy" score={result.mathAccuracy} />
                <ScoreBar label="Assumption Quality" score={result.assumptionQuality} />
                <ScoreBar label="Architectural Connection" score={result.architecturalConnection} />
              </div>

              {result.correctedMath && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3 mb-3">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Math Correction
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{result.correctedMath}</p>
                </div>
              )}

              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-3 mb-3">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Key Insight
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{result.keyInsight}</p>
              </div>

              {result.missedConnection && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 mb-3">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Missed Architectural Connection</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{result.missedConnection}</p>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Overall Feedback</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{result.overallFeedback}</p>
              </div>

              <button onClick={() => { gradeBoE.reset(); setEstimationText(BOE_PROBLEMS[selectedProblem].scaffold); }}
                className="mt-3 flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 transition-colors">
                <RotateCcw size={12} /> Try Again
              </button>
            </HighImpactWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
