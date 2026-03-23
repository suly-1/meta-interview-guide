/**
 * PatternRecognitionDrill — #5 High-Impact Feature
 *
 * Timed flash-card drill: read a problem description, identify the pattern
 * in under 30 seconds. Builds the "first 2 minutes" instinct.
 */

import { useState, useEffect, useRef } from "react";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { Zap, CheckCircle2, XCircle, RotateCcw, ChevronRight, Trophy } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { motion, AnimatePresence } from "framer-motion";

interface DrillProblem {
  id: string;
  prompt: string;
  correctPattern: string;
  keySignal: string;
  allPatterns: string[];
  difficulty: "Easy" | "Medium" | "Hard";
}

const DRILL_PROBLEMS: DrillProblem[] = [
  {
    id: "1",
    prompt: "Find the two numbers in an array that sum to a target value.",
    correctPattern: "Arrays & Hashing",
    keySignal: "'Two numbers that sum' → store complements in a hash map.",
    allPatterns: ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Binary Search"],
    difficulty: "Easy",
  },
  {
    id: "2",
    prompt: "Given a sorted array, find a target value as fast as possible.",
    correctPattern: "Binary Search",
    keySignal: "'Sorted array + find target' → binary search.",
    allPatterns: ["Binary Search", "Two Pointers", "Arrays & Hashing", "Sliding Window"],
    difficulty: "Easy",
  },
  {
    id: "3",
    prompt: "Find the longest substring with at most K distinct characters.",
    correctPattern: "Sliding Window",
    keySignal: "'Longest substring with constraint' → sliding window.",
    allPatterns: ["Sliding Window", "Two Pointers", "Arrays & Hashing", "Backtracking / DFS"],
    difficulty: "Medium",
  },
  {
    id: "4",
    prompt: "Find all paths from the top-left to the bottom-right of a grid.",
    correctPattern: "Backtracking / DFS",
    keySignal: "'All paths' → backtracking (choose/explore/unchoose).",
    allPatterns: ["Backtracking / DFS", "Graphs", "Trees (BFS / DFS)", "Prefix Sum"],
    difficulty: "Medium",
  },
  {
    id: "5",
    prompt: "Given a list of meeting time intervals, find the minimum number of conference rooms required.",
    correctPattern: "Heaps / Priority Queues",
    keySignal: "'Minimum rooms / concurrent events' → min-heap tracking end times.",
    allPatterns: ["Heaps / Priority Queues", "Intervals", "Sorting", "Two Pointers"],
    difficulty: "Medium",
  },
  {
    id: "6",
    prompt: "Determine if a directed graph has a cycle.",
    correctPattern: "Graphs",
    keySignal: "'Cycle detection in directed graph' → DFS with visited + recursion stack.",
    allPatterns: ["Graphs", "Trees (BFS / DFS)", "Union-Find (DSU)", "Backtracking / DFS"],
    difficulty: "Medium",
  },
  {
    id: "7",
    prompt: "Find the next greater element for each element in an array.",
    correctPattern: "Monotonic Stack",
    keySignal: "'Next greater/smaller element' → monotonic stack.",
    allPatterns: ["Monotonic Stack", "Arrays & Hashing", "Two Pointers", "Heaps / Priority Queues"],
    difficulty: "Medium",
  },
  {
    id: "8",
    prompt: "Given a list of words, find all words that can be formed by combining other words in the list.",
    correctPattern: "Tries (Prefix Trees)",
    keySignal: "'Prefix matching / word search' → Trie.",
    allPatterns: ["Tries (Prefix Trees)", "Arrays & Hashing", "Backtracking / DFS", "Sliding Window"],
    difficulty: "Hard",
  },
  {
    id: "9",
    prompt: "Find the number of subarrays with a sum equal to K.",
    correctPattern: "Prefix Sum",
    keySignal: "'Subarray sum equals K' → prefix sum + hash map.",
    allPatterns: ["Prefix Sum", "Sliding Window", "Two Pointers", "Arrays & Hashing"],
    difficulty: "Medium",
  },
  {
    id: "10",
    prompt: "Given N nodes and N-1 edges with no cycles, find the shortest path between two nodes.",
    correctPattern: "Trees (BFS / DFS)",
    keySignal: "'N nodes, N-1 edges, no cycles' → it's a tree. BFS for shortest path.",
    allPatterns: ["Trees (BFS / DFS)", "Graphs", "Union-Find (DSU)", "Binary Search"],
    difficulty: "Medium",
  },
  {
    id: "11",
    prompt: "Reverse a linked list in-place.",
    correctPattern: "Linked Lists",
    keySignal: "'Reverse linked list' → three-pointer technique (prev, curr, next).",
    allPatterns: ["Linked Lists", "Two Pointers", "Arrays & Hashing", "Monotonic Stack"],
    difficulty: "Easy",
  },
  {
    id: "12",
    prompt: "Find if two nodes in a graph are connected, supporting dynamic union operations.",
    correctPattern: "Union-Find (DSU)",
    keySignal: "'Dynamic connectivity / union operations' → Union-Find.",
    allPatterns: ["Union-Find (DSU)", "Graphs", "Trees (BFS / DFS)", "Arrays & Hashing"],
    difficulty: "Hard",
  },
];

const TIME_LIMIT = 30; // seconds per problem

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function PatternRecognitionDrill() {
  const [phase, setPhase] = useState<"setup" | "drilling" | "done">("setup");
  const { saveScore } = useScorePersistence("pattern_drill");
  const [problems, setProblems] = useState<DrillProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ id: string; correct: boolean; time: number }[]>([]);
  const [sessionCount, setSessionCount] = useState(8);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (phase === "drilling" && !revealed) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setRevealed(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentIdx, revealed]);

  const startDrill = () => {
    const shuffled = shuffle(DRILL_PROBLEMS).slice(0, sessionCount);
    setProblems(shuffled);
    setCurrentIdx(0);
    setResults([]);
    setSelected(null);
    setRevealed(false);
    setTimeLeft(TIME_LIMIT);
    setPhase("drilling");
  };

  const handleSelect = (pattern: string) => {
    if (revealed) return;
    clearInterval(timerRef.current!);
    setSelected(pattern);
    setRevealed(true);
    const timeUsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    setResults(prev => [...prev, {
      id: problems[currentIdx].id,
      correct: pattern === problems[currentIdx].correctPattern,
      time: timeUsed,
    }]);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= problems.length) {
      setPhase("done");
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelected(null);
    setRevealed(false);
    setTimeLeft(TIME_LIMIT);
  };

  const current = problems[currentIdx];
  const correctCount = results.filter(r => r.correct).length;
  const avgTime = results.length > 0 ? Math.round(results.reduce((a, b) => a + b.time, 0) / results.length) : 0;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  const timerColor = timeLeft <= 10 ? "text-red-500" : timeLeft <= 20 ? "text-amber-500" : "text-emerald-500";
  const timerBg = timeLeft <= 10 ? "bg-red-500" : timeLeft <= 20 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Pattern Recognition Speed Drill"
        subtitle="The first 2 minutes of a Meta coding interview are pattern identification. Train your instinct to recognize the right algorithm in under 30 seconds."
        stat="First 2 Min = 40% of Score"
        variant="blue"
        icon={<Zap size={20} />}
      />

      <ImpactCallout variant="orange">
        Candidates who can't name the pattern in 60 seconds almost never finish the problem. This drill builds the reflex — 30 seconds per problem, 8 problems per session.
      </ImpactCallout>

      {phase === "setup" && (
        <HighImpactWrapper variant="blue" className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Session Length</label>
            <div className="flex gap-2">
              {[5, 8, 12].map(n => (
                <button key={n} onClick={() => setSessionCount(n)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${sessionCount === n ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300"}`}>
                  {n} Problems
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">How it works:</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Read the problem description</li>
              <li>• Choose the correct pattern in under 30 seconds</li>
              <li>• Learn the key signal that gives it away</li>
              <li>• Target: 90%+ accuracy, under 15s average</li>
            </ul>
          </div>
          <button onClick={startDrill} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all">
            <Zap size={16} /> Start Drill
          </button>
        </HighImpactWrapper>
      )}

      {phase === "drilling" && current && (
        <div className="space-y-3">
          {/* Progress + timer */}
          <HighImpactWrapper variant="blue" className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">Problem {currentIdx + 1} of {problems.length}</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold font-mono ${timerColor}`}>{timeLeft}s</span>
                <HighImpactBadge size="sm" variant="violet" label={current.difficulty} />
              </div>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${timerBg}`}
                style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
              />
            </div>
          </HighImpactWrapper>

          {/* Problem */}
          <HighImpactWrapper variant="blue" className="p-4">
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200 leading-relaxed mb-4">{current.prompt}</p>

            {/* Answer options */}
            <div className="grid grid-cols-2 gap-2">
              {current.allPatterns.map(pattern => {
                const isCorrect = pattern === current.correctPattern;
                const isSelected = pattern === selected;
                let cls = "text-left px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all ";
                if (!revealed) {
                  cls += "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer";
                } else if (isCorrect) {
                  cls += "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
                } else if (isSelected && !isCorrect) {
                  cls += "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400";
                } else {
                  cls += "border-gray-200 dark:border-gray-700 text-gray-400 opacity-50";
                }
                return (
                  <button key={pattern} onClick={() => handleSelect(pattern)} className={cls}>
                    <div className="flex items-center gap-2">
                      {revealed && isCorrect && <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />}
                      {revealed && isSelected && !isCorrect && <XCircle size={13} className="text-red-500 flex-shrink-0" />}
                      {pattern}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Key signal reveal */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2.5"
                >
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Key Signal to Remember:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{current.keySignal}</p>
                  <button onClick={handleNext} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                    {currentIdx + 1 >= problems.length ? "See Results" : "Next Problem"} <ChevronRight size={13} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </HighImpactWrapper>
        </div>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <HighImpactWrapper variant="blue" className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={24} className={accuracy >= 80 ? "text-yellow-500" : accuracy >= 60 ? "text-amber-500" : "text-gray-400"} />
              <div>
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Drill Complete!</h4>
                <p className="text-xs text-gray-500">{problems.length} problems · avg {avgTime}s per problem</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className={`rounded-lg border p-3 text-center ${accuracy >= 80 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"}`}>
                <p className={`text-2xl font-bold ${accuracy >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{accuracy}%</p>
                <p className="text-[10px] text-gray-500">Accuracy</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${avgTime <= 15 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"}`}>
                <p className={`text-2xl font-bold ${avgTime <= 15 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{avgTime}s</p>
                <p className="text-[10px] text-gray-500">Avg Time</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{correctCount}/{problems.length}</p>
                <p className="text-[10px] text-gray-500">Correct</p>
              </div>
            </div>
            {accuracy < 80 && (
              <ImpactCallout variant="orange">
                Target is 90%+ accuracy at under 15s average. Keep drilling — pattern recognition is a trainable skill, not innate talent.
              </ImpactCallout>
            )}
            {accuracy >= 90 && avgTime <= 15 && (
              <ImpactCallout variant="emerald">
                Excellent! {accuracy}% accuracy at {avgTime}s average. You're ready to apply this in real interviews. Now practice narrating the pattern out loud (Think Out Loud Coaching).
              </ImpactCallout>
            )}
            <button onClick={() => setPhase("setup")} className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
              <RotateCcw size={12} /> Drill Again
            </button>
          </HighImpactWrapper>
        </motion.div>
      )}
    </div>
  );
}
