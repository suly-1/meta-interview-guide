/**
 * ImpactQuantificationCoach — #9 High-Impact Feature
 *
 * Paste a STAR answer, AI highlights every sentence missing a metric
 * and suggests exactly what to add. Shows a rewritten Result section.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { Sparkles, AlertCircle, CheckCircle2, TrendingUp, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "No Metrics", color: "text-red-600 dark:text-red-400" },
  2: { label: "Weak", color: "text-orange-600 dark:text-orange-400" },
  3: { label: "Adequate", color: "text-amber-600 dark:text-amber-400" },
  4: { label: "Good", color: "text-blue-600 dark:text-blue-400" },
  5: { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" },
};

function ScoreRing({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  const color = score >= 5 ? "#10b981" : score >= 4 ? "#3b82f6" : score >= 3 ? "#f59e0b" : score >= 2 ? "#f97316" : "#ef4444";
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width={56} height={56} className="rotate-[-90deg]">
        <circle cx={28} cy={28} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-gray-200 dark:text-gray-700" />
        <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}/5</span>
      </div>
    </div>
  );
}

export default function ImpactQuantificationCoach() {
  const [answer, setAnswer] = useState("");
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [showRewrite, setShowRewrite] = useState(false);
  const [copied, setCopied] = useState(false);

  const analyze = trpc.highImpact.quantifyImpact.useMutation();

  const handleAnalyze = () => {
    if (answer.trim().length < 50) return;
    analyze.mutate({ answer, targetLevel });
  };

  const copyRewrite = () => {
    if (analyze.data?.rewrittenResult) {
      navigator.clipboard.writeText(analyze.data.rewrittenResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const result = analyze.data;
  const missingSentences = result?.sentences.filter(s => !s.hasMetric && s.suggestion) ?? [];
  const strongSentences = result?.sentences.filter(s => s.hasMetric && s.praise) ?? [];

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Impact Quantification Coach"
        subtitle="The #1 reason L6+ candidates fail behavioral: answers without numbers. Paste your STAR answer and get every missing metric highlighted instantly."
        stat="Most Common Failure"
        variant="orange"
        icon={<TrendingUp size={20} />}
      />

      <ImpactCallout variant="red">
        At Meta L6+, every Result sentence must have a number. "Improved performance" fails. "Reduced p99 latency by 40ms (from 120ms to 80ms), impacting 2M daily active users" passes.
      </ImpactCallout>

      <HighImpactWrapper variant="orange" className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Target Level</label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                <button
                  key={l}
                  onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <HighImpactBadge variant="orange" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
            Your STAR Answer
          </label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Paste your full STAR answer here. Include the Situation, Task, Action, and Result. The more complete, the better the analysis..."
            rows={8}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{answer.length} chars</span>
            <button
              onClick={handleAnalyze}
              disabled={analyze.isPending || answer.trim().length < 50}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all"
            >
              {analyze.isPending ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles size={14} />Highlight Missing Metrics</>
              )}
            </button>
          </div>
        </div>
      </HighImpactWrapper>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score */}
            <HighImpactWrapper variant="orange" className="p-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={result.overallScore} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${SCORE_LABELS[result.overallScore]?.color}`}>
                      {SCORE_LABELS[result.overallScore]?.label}
                    </span>
                    <HighImpactBadge size="sm" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-orange-600 dark:text-orange-400">Top fix:</strong> {result.topSuggestion}
                  </p>
                </div>
              </div>
            </HighImpactWrapper>

            {/* Missing metrics */}
            {missingSentences.length > 0 && (
              <HighImpactWrapper variant="orange" className="p-4">
                <h4 className="font-bold text-sm text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                  <AlertCircle size={15} />
                  {missingSentences.length} Sentence{missingSentences.length > 1 ? "s" : ""} Missing Metrics
                </h4>
                <div className="space-y-3">
                  {missingSentences.map((s, i) => (
                    <div key={i} className="rounded-lg border border-red-200 dark:border-red-800/40 overflow-hidden">
                      <div className="px-3 py-2 bg-red-50 dark:bg-red-950/30">
                        <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{s.text}"</p>
                      </div>
                      <div className="px-3 py-2 bg-white dark:bg-gray-900">
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          ↳ Add: {s.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </HighImpactWrapper>
            )}

            {/* Strong sentences */}
            {strongSentences.length > 0 && (
              <HighImpactWrapper variant="emerald" className="p-4">
                <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  {strongSentences.length} Strong Metric{strongSentences.length > 1 ? "s" : ""} Found
                </h4>
                <div className="space-y-2">
                  {strongSentences.map((s, i) => (
                    <div key={i} className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <p className="text-sm text-gray-800 dark:text-gray-200 italic mb-1">"{s.text}"</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ {s.praise}</p>
                    </div>
                  ))}
                </div>
              </HighImpactWrapper>
            )}

            {/* Rewritten result */}
            {result.rewrittenResult && (
              <HighImpactWrapper variant="violet" className="p-4">
                <button
                  onClick={() => setShowRewrite(!showRewrite)}
                  className="w-full flex items-center justify-between text-sm font-bold text-violet-700 dark:text-violet-400"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={15} />
                    AI-Rewritten Result Section (with metrics added)
                  </span>
                  {showRewrite ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <AnimatePresence>
                  {showRewrite && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-violet-100 dark:border-violet-900/30">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{result.rewrittenResult}</p>
                        <button
                          onClick={copyRewrite}
                          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                        >
                          {copied ? <><Check size={12} />Copied!</> : <><Copy size={12} />Copy rewritten section</>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </HighImpactWrapper>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
