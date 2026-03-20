/**
 * InterviewScorecard — 7-criterion self-scoring checklist
 * Shows Strong Hire / Hire / Lean Hire / No Hire verdict
 */
import { useState } from "react";
import { CheckSquare, Square, RotateCcw, ClipboardList } from "lucide-react";

const CRITERIA = [
  {
    id: "clarify",
    label: "Clarified Requirements",
    description: "Asked at least 2 clarifying questions before coding (input constraints, edge cases, expected output format).",
    weight: 1,
  },
  {
    id: "approach",
    label: "Explained Approach First",
    description: "Verbalized the approach and got interviewer buy-in before writing any code.",
    weight: 1,
  },
  {
    id: "complexity",
    label: "Stated Optimal Complexity",
    description: "Correctly stated time and space complexity of the chosen solution (not just brute force).",
    weight: 1,
  },
  {
    id: "clean_code",
    label: "Clean, Readable Code",
    description: "Used meaningful variable names, no spaghetti logic, readable in one pass without explanation.",
    weight: 1,
  },
  {
    id: "test_walkthrough",
    label: "Walked Through Test Cases",
    description: "Traced through at least one example manually after coding to verify correctness.",
    weight: 1,
  },
  {
    id: "edge_cases",
    label: "Handled Edge Cases",
    description: "Identified and handled: empty input, single element, duplicates, negative numbers, or overflow (as applicable).",
    weight: 1,
  },
  {
    id: "followups",
    label: "Engaged with Follow-ups",
    description: "Responded to follow-up questions (scale, optimization, alternative approaches) with thoughtful answers.",
    weight: 1,
  },
];

const VERDICTS = [
  { min: 7, label: "Strong Hire", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300", emoji: "🟢" },
  { min: 5, label: "Hire", color: "text-blue-700", bg: "bg-blue-50 border-blue-300", emoji: "🔵" },
  { min: 3, label: "Lean Hire", color: "text-amber-700", bg: "bg-amber-50 border-amber-300", emoji: "🟡" },
  { min: 0, label: "No Hire", color: "text-red-700", bg: "bg-red-50 border-red-300", emoji: "🔴" },
];

export default function InterviewScorecard() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string) => {
    if (submitted) return;
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const score = checked.size;
  const verdict = VERDICTS.find(v => score >= v.min) ?? VERDICTS[VERDICTS.length - 1];

  const reset = () => {
    setChecked(new Set());
    setSubmitted(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <ClipboardList size={20} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Interview Scorecard
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">7-criterion self-assessment · Check what you did in your last session</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-blue-500" : score >= 3 ? "bg-amber-500" : "bg-red-400"
            }`}
            style={{ width: `${(score / 7) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums w-12 text-right">{score}/7</span>
      </div>

      {/* Criteria */}
      <div className="space-y-2 mb-5">
        {CRITERIA.map(c => {
          const isChecked = checked.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                isChecked
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              {isChecked
                ? <CheckSquare size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                : <Square size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />}
              <div>
                <p className={`text-sm font-semibold ${isChecked ? "text-emerald-800 dark:text-emerald-300" : "text-gray-800 dark:text-gray-200"}`}>
                  {c.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{c.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Verdict */}
      <div className={`rounded-xl border p-4 mb-4 ${verdict.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Verdict</p>
            <p className={`text-2xl font-bold ${verdict.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {verdict.emoji} {verdict.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Score</p>
            <p className={`text-3xl font-bold tabular-nums ${verdict.color}`}>{score}/7</p>
          </div>
        </div>
        {score < 7 && (
          <p className="text-xs text-gray-600 mt-2">
            {score < 3
              ? "Focus on the fundamentals: always clarify, explain your approach, and walk through test cases before submitting."
              : score < 5
              ? "Good start. Make sure to state complexity and handle edge cases explicitly — interviewers notice."
              : "Almost there. Nail the follow-ups and you're at Strong Hire level."}
          </p>
        )}
      </div>

      <button
        onClick={reset}
        className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={14} /> Reset Scorecard
      </button>
    </div>
  );
}
