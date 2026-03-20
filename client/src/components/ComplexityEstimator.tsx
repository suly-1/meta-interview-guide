/**
 * ComplexityEstimator — Feature: Complexity Estimator
 * Candidate selects time and space complexity before reveal.
 * Shows brute force vs optimal comparison.
 */
import { useState } from "react";
import { PATTERNS } from "@/lib/guideData";
import { ChevronRight, CheckCircle2, XCircle, RotateCcw, Brain } from "lucide-react";

const TIME_OPTIONS = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)", "O(n!)"];
const SPACE_OPTIONS = ["O(1)", "O(log n)", "O(n)", "O(n²)", "O(2ⁿ)"];

// Brute force complexities per pattern
const BRUTE_FORCE: Record<string, { time: string; space: string }> = {
  "arrays-hashing": { time: "O(n²)", space: "O(1)" },
  "two-pointers": { time: "O(n²)", space: "O(1)" },
  "trees-bfs-dfs": { time: "O(n)", space: "O(n)" },
  "sliding-window": { time: "O(n²)", space: "O(1)" },
  "binary-search": { time: "O(n)", space: "O(1)" },
  "dynamic-programming": { time: "O(2ⁿ)", space: "O(2ⁿ)" },
  "graphs": { time: "O(V²)", space: "O(V)" },
  "heaps-priority-queue": { time: "O(n²)", space: "O(1)" },
  "intervals": { time: "O(n²)", space: "O(n)" },
  "backtracking": { time: "O(n!)", space: "O(n)" },
  "tries": { time: "O(n·m)", space: "O(n·m)" },
  "stack-monotonic": { time: "O(n²)", space: "O(1)" },
  "linked-list": { time: "O(n²)", space: "O(n)" },
  "bit-manipulation": { time: "O(n)", space: "O(n)" },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ComplexityEstimator() {
  const [pattern, setPattern] = useState(() => pickRandom(PATTERNS));
  const [problem, setProblem] = useState(() => pickRandom(PATTERNS[0].problems));
  const [timeGuess, setTimeGuess] = useState("");
  const [spaceGuess, setSpaceGuess] = useState("");
  const [revealed, setRevealed] = useState(false);

  const handleNew = () => {
    const p = pickRandom(PATTERNS);
    setPattern(p);
    setProblem(pickRandom(p.problems));
    setTimeGuess("");
    setSpaceGuess("");
    setRevealed(false);
  };

  const handleReveal = () => setRevealed(true);

  const timeCorrect = timeGuess === pattern.timeComplexity;
  const spaceCorrect = spaceGuess === pattern.spaceComplexity;
  const bruteForce = BRUTE_FORCE[pattern.id] ?? { time: "O(n²)", space: "O(n)" };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-purple-100 rounded-xl">
          <Brain size={20} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Complexity Estimator
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Guess time & space before revealing the answer</p>
        </div>
      </div>

      {/* Problem card */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Problem</p>
        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {problem}
        </h4>
        <p className="text-xs text-gray-500 mt-1">Pattern: <span className="font-semibold text-gray-700 dark:text-gray-300">{pattern.name}</span></p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-2">Time Complexity</label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => !revealed && setTimeGuess(opt)}
                disabled={revealed}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  timeGuess === opt
                    ? revealed
                      ? timeCorrect ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500"
                      : "bg-purple-500 text-white border-purple-500"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-2">Space Complexity</label>
          <div className="flex flex-wrap gap-1.5">
            {SPACE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => !revealed && setSpaceGuess(opt)}
                disabled={revealed}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  spaceGuess === opt
                    ? revealed
                      ? spaceCorrect ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500"
                      : "bg-purple-500 text-white border-purple-500"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reveal / Result */}
      {!revealed ? (
        <button
          onClick={handleReveal}
          disabled={!timeGuess || !spaceGuess}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <ChevronRight size={16} /> Reveal Answer
        </button>
      ) : (
        <div className="space-y-4">
          {/* Optimal */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">✓ Optimal Solution</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {timeCorrect ? <CheckCircle2 size={15} className="text-emerald-500" /> : <XCircle size={15} className="text-red-500" />}
                <span className="text-sm text-gray-700 dark:text-gray-300">Time: <strong>{pattern.timeComplexity}</strong></span>
                {!timeCorrect && timeGuess && <span className="text-xs text-red-500">(you: {timeGuess})</span>}
              </div>
              <div className="flex items-center gap-2">
                {spaceCorrect ? <CheckCircle2 size={15} className="text-emerald-500" /> : <XCircle size={15} className="text-red-500" />}
                <span className="text-sm text-gray-700 dark:text-gray-300">Space: <strong>{pattern.spaceComplexity}</strong></span>
                {!spaceCorrect && spaceGuess && <span className="text-xs text-red-500">(you: {spaceGuess})</span>}
              </div>
            </div>
          </div>

          {/* Brute force */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Brute Force (for comparison)</p>
            <div className="grid grid-cols-2 gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Time: <strong>{bruteForce.time}</strong></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Space: <strong>{bruteForce.space}</strong></span>
            </div>
          </div>

          {/* Key idea */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Key Idea</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{pattern.keyIdea}</p>
          </div>

          <button
            onClick={handleNew}
            className="w-full py-2.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Next Problem
          </button>
        </div>
      )}
    </div>
  );
}
