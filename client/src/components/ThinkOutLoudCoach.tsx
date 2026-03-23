/**
 * ThinkOutLoudCoach — #4 High-Impact Feature
 *
 * Timed coding session where the candidate types their narration alongside their solution.
 * AI scores: did they state the problem, name the pattern, narrate complexity, catch bugs.
 * The most common reason candidates fail coding at Meta: silence.
 */

import { useState, useEffect, useRef } from "react";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { trpc } from "@/lib/trpc";
import { Mic, Clock, Play, Square, RotateCcw, Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { PATTERNS } from "@/lib/guideData";
import { motion, AnimatePresence } from "framer-motion";

const PROBLEMS = [
  { name: "Two Sum", pattern: "Arrays & Hashing", difficulty: "Easy", prompt: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target." },
  { name: "Longest Substring Without Repeating Characters", pattern: "Sliding Window", difficulty: "Medium", prompt: "Given a string s, find the length of the longest substring without repeating characters." },
  { name: "Number of Islands", pattern: "Graphs", difficulty: "Medium", prompt: "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands." },
  { name: "Merge Intervals", pattern: "Intervals", difficulty: "Medium", prompt: "Given an array of intervals, merge all overlapping intervals." },
  { name: "Climbing Stairs", pattern: "Backtracking / DFS", difficulty: "Easy", prompt: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?" },
  { name: "Kth Largest Element in an Array", pattern: "Heaps / Priority Queues", difficulty: "Medium", prompt: "Given an integer array nums and an integer k, return the kth largest element in the array." },
  { name: "Valid Parentheses", pattern: "Monotonic Stack", difficulty: "Easy", prompt: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid." },
  { name: "Binary Search", pattern: "Binary Search Variations", difficulty: "Easy", prompt: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums." },
];

const NARRATION_CHECKLIST = [
  { id: "restate", label: "Restated the problem in own words", weight: 20 },
  { id: "pattern", label: "Named the algorithm/pattern before coding", weight: 25 },
  { id: "complexity", label: "Stated time and space complexity", weight: 20 },
  { id: "edge_cases", label: "Called out at least one edge case", weight: 20 },
  { id: "bugs", label: "Caught or acknowledged a bug/issue", weight: 15 },
];

const TOTAL_TIME = 25 * 60; // 25 minutes

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ThinkOutLoudCoach() {
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0]);
  const { saveScore } = useScorePersistence("think_out_loud");
  const [phase, setPhase] = useState<"setup" | "solving" | "done">("setup");
  const [narration, setNarration] = useState("");
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const score = trpc.highImpact.quantifyImpact.useMutation(); // reuse for text analysis

  // We'll use a custom scoring approach via the behavioral scorer
  const analyzeNarration = trpc.behavioral.score.useMutation();

  useEffect(() => {
    if (phase === "solving") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setPhase("done");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Auto-detect narration quality in real time
  const checkNarration = (text: string) => {
    const lower = text.toLowerCase();
    setChecks({
      restate: /problem|given|input|output|return|find|we need|we want/.test(lower),
      pattern: /pattern|approach|algorithm|hash|two pointer|sliding|bfs|dfs|heap|binary search|dp|backtrack|stack|prefix|union/.test(lower),
      complexity: /o\(|time complexity|space complexity|linear|quadratic|log n|constant/.test(lower),
      edge_cases: /edge case|empty|null|zero|negative|duplicate|single|overflow|corner/.test(lower),
      bugs: /bug|off by one|forgot|wait|actually|fix|wrong|mistake|should be|let me correct/.test(lower),
    });
  };

  const handleNarrationChange = (val: string) => {
    setNarration(val);
    checkNarration(val);
  };

  const startSession = () => {
    setPhase("solving");
    setTimeLeft(TOTAL_TIME);
    setNarration("");
    setCode("");
    setChecks({});
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("done");
    // Score the narration as a behavioral answer to get structured feedback
    if (narration.trim().length > 50) {
      analyzeNarration.mutate({
        answer: `Problem: ${selectedProblem.name}\n\nNarration:\n${narration}\n\nCode written:\n${code}`,
        question: `Solve ${selectedProblem.name} while thinking out loud`,
        targetLevel: "L6",
      });
    }
  };

  const checkedCount = Object.values(checks).filter(Boolean).length;
  const narrationScore = Math.round((checkedCount / NARRATION_CHECKLIST.length) * 100);
  const timeUsed = TOTAL_TIME - timeLeft;
  const timeColor = timeLeft < 5 * 60 ? "text-red-500" : timeLeft < 10 * 60 ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Think Out Loud Coaching Mode"
        subtitle="The #1 reason candidates fail coding at Meta: silence. Interviewers can't give partial credit for a solution they didn't understand. This drill trains narration while you code."
        stat="Silence = Fail"
        variant="blue"
        icon={<Mic size={20} />}
      />

      <ImpactCallout variant="orange">
        At Meta, 40% of your coding score comes from the first 2 minutes — how you restate the problem, name the pattern, and state your approach. Practice narrating every thought, even wrong ones.
      </ImpactCallout>

      {phase === "setup" && (
        <HighImpactWrapper variant="blue" className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Select Problem</label>
            <div className="grid grid-cols-1 gap-2">
              {PROBLEMS.map(p => (
                <button
                  key={p.name}
                  onClick={() => setSelectedProblem(p)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-all ${selectedProblem.name === p.name ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${p.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{p.difficulty}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">{p.pattern}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">What to narrate:</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {NARRATION_CHECKLIST.map(c => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {c.label} <span className="text-blue-500 font-bold">({c.weight} pts)</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={startSession}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all"
          >
            <Play size={16} /> Start 25-Minute Session
          </button>
        </HighImpactWrapper>
      )}

      {phase === "solving" && (
        <div className="space-y-3">
          {/* Timer + checklist header */}
          <HighImpactWrapper variant="blue" className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={16} className={timeColor} />
                <span className={`text-lg font-bold font-mono ${timeColor}`}>{fmtTime(timeLeft)}</span>
                <span className="text-xs text-gray-500">remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${narrationScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : narrationScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                  Narration: {narrationScore}%
                </span>
                <button onClick={endSession} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all">
                  <Square size={11} /> End Session
                </button>
              </div>
            </div>
            {/* Live checklist */}
            <div className="flex flex-wrap gap-2 mt-3">
              {NARRATION_CHECKLIST.map(c => (
                <div key={c.id} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-all ${checks[c.id] ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400" : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"}`}>
                  {checks[c.id] ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                  {c.label.split(" ").slice(0, 3).join(" ")}
                </div>
              ))}
            </div>
          </HighImpactWrapper>

          {/* Problem */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedProblem.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${selectedProblem.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{selectedProblem.difficulty}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProblem.prompt}</p>
          </div>

          {/* Narration + code side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                <Mic size={11} /> Think Out Loud (narration)
              </label>
              <textarea
                value={narration}
                onChange={e => handleNarrationChange(e.target.value)}
                placeholder="Type everything you're thinking. Start with: 'Okay, so the problem is asking me to...' Then: 'I think the pattern here is...' Then: 'The time complexity will be...'"
                rows={12}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-blue-200 dark:border-blue-800/40 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Code (optional)</label>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Write your solution here (pseudocode or real code)..."
                rows={12}
                className="w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <HighImpactWrapper variant="blue" className="p-4">
            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Sparkles size={15} className="text-blue-500" />
              Session Results — {selectedProblem.name}
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{narrationScore}%</p>
                <p className="text-xs text-gray-500">Narration Score</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{fmtTime(timeUsed)}</p>
                <p className="text-xs text-gray-500">Time Used</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {NARRATION_CHECKLIST.map(c => (
                <div key={c.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${checks[c.id] ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"}`}>
                  <div className="flex items-center gap-2">
                    {checks[c.id] ? <CheckCircle2 size={13} className="text-emerald-500" /> : <XCircle size={13} className="text-red-500" />}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${checks[c.id] ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {checks[c.id] ? `+${c.weight}` : `−${c.weight}`} pts
                  </span>
                </div>
              ))}
            </div>
            {narrationScore < 60 && (
              <ImpactCallout variant="red">
                Your narration score is below 60%. In a real Meta interview, this would likely result in a "No Hire" even if your code is correct. Practice narrating every thought — including wrong ones.
              </ImpactCallout>
            )}
            {narrationScore >= 80 && (
              <ImpactCallout variant="emerald">
                Strong narration! You hit {checkedCount}/{NARRATION_CHECKLIST.length} checkpoints. Keep this up in real interviews — it's what separates L6 from L5 candidates.
              </ImpactCallout>
            )}
            <button onClick={() => setPhase("setup")} className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
              <RotateCcw size={12} /> Try Another Problem
            </button>
          </HighImpactWrapper>
        </motion.div>
      )}
    </div>
  );
}
