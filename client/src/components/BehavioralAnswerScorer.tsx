/**
 * BehavioralAnswerScorer — LLM-powered STAR answer rubric scoring
 * Feature 7: Behavioral Answer Scorer UI
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

const DIMENSIONS = [
  { key: "specificity",   label: "Specificity",    desc: "Concrete details, metrics, names, dates" },
  { key: "impact",        label: "Impact",          desc: "Measurable business or technical result" },
  { key: "icLevelFit",   label: "IC-Level Fit",    desc: "Scope and ownership calibrated to target level" },
  { key: "structure",     label: "Structure",       desc: "Clear STAR format with logical flow" },
  { key: "conciseness",  label: "Conciseness",     desc: "Tight and on-point within ~2 minutes" },
] as const;

type DimKey = typeof DIMENSIONS[number]["key"];

type ScoreResult = {
  specificity: number;
  impact: number;
  icLevelFit: number;
  structure: number;
  conciseness: number;
  overallAssessment: string;
  improvements: string[];
  strongestPart: string;
};

function ScoreBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const color =
    score >= 5 ? "bg-emerald-500" :
    score >= 4 ? "bg-green-400" :
    score >= 3 ? "bg-amber-400" :
    score >= 2 ? "bg-orange-400" : "bg-red-400";
  const label =
    score >= 5 ? "Excellent" :
    score >= 4 ? "Good" :
    score >= 3 ? "Adequate" :
    score >= 2 ? "Needs Work" : "Weak";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{score}/5</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
          score >= 4 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
          score >= 3 ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-800" :
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        }`}>{label}</span>
      </div>
    </div>
  );
}

export default function BehavioralAnswerScorer() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [targetLevel, setTargetLevel] = useState<"L6" | "L7">("L6");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [showTips, setShowTips] = useState(false);

  const scoreMutation = trpc.behavioral.score.useMutation({
    onSuccess: (data) => setResult(data),
  });

  const avgScore = result
    ? Math.round(
        ((result.specificity + result.impact + result.icLevelFit + result.structure + result.conciseness) / 5) * 10
      ) / 10
    : null;

  const handleScore = () => {
    if (answer.trim().length < 10) return;
    setResult(null);
    scoreMutation.mutate({
      answer: answer.trim(),
      question: question.trim() || undefined,
      targetLevel,
    });
  };

  const handleClear = () => {
    setAnswer("");
    setQuestion("");
    setResult(null);
    scoreMutation.reset();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Behavioral Answer Scorer
            </h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Paste your STAR answer and get an LLM-powered rubric breakdown across 5 dimensions.
          </p>
        </div>
        {/* Target level toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex-shrink-0">
          {(["L6", "L7"] as const).map(level => (
            <button
              key={level}
              onClick={() => setTargetLevel(level)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                targetLevel === level
                  ? "bg-white dark:bg-gray-600 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Question input (optional) */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
          Interview Question <span className="font-normal text-gray-600">(optional — helps calibrate scoring)</span>
        </label>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder='e.g. "Tell me about a time you drove a major technical initiative"'
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Answer textarea */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
          Your STAR Answer <span className="text-red-400">*</span>
        </label>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={8}
          placeholder="Type or paste your STAR answer here. Include the Situation, Task, Actions you took, and the Result with measurable impact..."
          className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-600">{answer.length} characters · ~{Math.ceil(answer.split(/\s+/).filter(Boolean).length / 130)} min read</span>
          {answer.length > 0 && (
            <button onClick={handleClear} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Clear</button>
          )}
        </div>
      </div>

      {/* STAR tips collapsible */}
      <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span>💡 STAR format tips for {targetLevel}</span>
          {showTips ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTips && (
          <div className="px-4 pb-3 pt-1 text-xs text-gray-700 dark:text-gray-300 space-y-1.5 border-t border-gray-100 dark:border-gray-700">
            <p><strong className="text-gray-700 dark:text-gray-200">Situation:</strong> Set context in 1–2 sentences. Include team size, timeline, and stakes.</p>
            <p><strong className="text-gray-700 dark:text-gray-200">Task:</strong> What was your specific responsibility? {targetLevel === "L7" ? "For L7: show you defined the problem, not just received it." : "For L6: show clear ownership of a defined scope."}</p>
            <p><strong className="text-gray-700 dark:text-gray-200">Action:</strong> Use "I" not "we". {targetLevel === "L7" ? "For L7: show cross-functional influence, ambiguity navigation, and strategic decisions." : "For L6: show technical depth and independent execution."}</p>
            <p><strong className="text-gray-700 dark:text-gray-200">Result:</strong> Quantify impact. {targetLevel === "L7" ? "For L7: org-level or multi-team impact, long-term outcomes." : "For L6: team or product-level metrics, latency/reliability/velocity."}</p>
          </div>
        )}
      </div>

      {/* Score button */}
      <button
        onClick={handleScore}
        disabled={answer.trim().length < 10 || scoreMutation.isPending}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl transition-all text-sm"
      >
        {scoreMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Scoring your answer…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Score My Answer ({targetLevel})
          </>
        )}
      </button>

      {/* Error state */}
      {scoreMutation.isError && (
        <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Scoring failed. Please check your connection and try again.</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Overall score hero */}
          <div className={`rounded-xl p-4 text-center ${
            (avgScore ?? 0) >= 4 ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700" :
            (avgScore ?? 0) >= 3 ? "bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700" :
            "bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
          }`}>
            <div className="text-4xl font-black mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {avgScore}/5
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {(avgScore ?? 0) >= 4.5 ? "Outstanding" :
               (avgScore ?? 0) >= 4 ? "Strong Answer" :
               (avgScore ?? 0) >= 3 ? "Solid Foundation" :
               (avgScore ?? 0) >= 2 ? "Needs Improvement" : "Significant Gaps"}
              {" "}· {targetLevel} calibration
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{result.overallAssessment}"</p>
          </div>

          {/* Dimension breakdown */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Dimension Breakdown</h4>
            <div className="space-y-3">
              {DIMENSIONS.map(dim => (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{dim.label}</span>
                    <span className="text-xs text-gray-600">{dim.desc}</span>
                  </div>
                  <ScoreBar score={result[dim.key as DimKey] as number} />
                </div>
              ))}
            </div>
          </div>

          {/* Strongest part */}
          {result.strongestPart && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <CheckCircle2 size={15} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-0.5">Strongest Part</p>
                <p className="text-xs text-green-700 dark:text-green-400">{result.strongestPart}</p>
              </div>
            </div>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-amber-800 dark:text-amber-900" />
                <p className="text-xs font-bold text-amber-900 dark:text-amber-800">Improvement Suggestions</p>
              </div>
              <ul className="space-y-1.5">
                {result.improvements.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-900">
                    <span className="font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-score button */}
          <button
            onClick={handleScore}
            className="w-full py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            Re-score after editing
          </button>
        </div>
      )}
    </div>
  );
}
