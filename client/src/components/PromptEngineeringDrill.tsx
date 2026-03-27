/**
 * PromptEngineeringDrill — Feature #8
 * AI-Enabled Round prompt quality trainer.
 * Teaches candidates how to write precise, context-rich prompts that get
 * production-quality code from Copilot/ChatGPT during Meta's AI-Enabled round.
 * Scoring rubric: Specificity, Context, Constraints, Examples, Edge Cases.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import {
  Cpu,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface DrillScenario {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  context: string;
  badPrompt: string;
  goodPrompt: string;
  rubric: string[];
  tip: string;
}

const SCENARIOS: DrillScenario[] = [
  {
    id: "two-sum",
    title: "Two Sum — Optimal Hash Map",
    difficulty: "Easy",
    context:
      "You need to find two indices in an array that sum to a target. You have 35 minutes total and want to use Copilot to generate the hash-map solution.",
    badPrompt: "write two sum in python",
    goodPrompt:
      "Write a Python function `two_sum(nums: list[int], target: int) -> list[int]` that returns indices [i, j] such that nums[i] + nums[j] == target. Use a single-pass hash map for O(n) time and O(n) space. Handle the constraint that each input has exactly one solution. Include a docstring and 3 inline comments explaining the algorithm.",
    rubric: [
      "Function signature with type hints",
      "Explicit time/space complexity requirement",
      "Algorithm specified (hash map, single-pass)",
      "Docstring requested",
      "Edge case handling mentioned",
    ],
    tip: "Always specify the exact function signature, complexity target, and algorithm approach. Vague prompts produce vague code.",
  },
  {
    id: "lru-cache",
    title: "LRU Cache — OrderedDict",
    difficulty: "Medium",
    context:
      "Design an LRU Cache with O(1) get and put. You want to use Python's OrderedDict.",
    badPrompt: "implement lru cache",
    goodPrompt:
      "Implement a Python class `LRUCache` with `__init__(self, capacity: int)`, `get(self, key: int) -> int` (returns -1 if not found), and `put(self, key: int, value: int) -> None`. Use `collections.OrderedDict` for O(1) operations. When capacity is exceeded, evict the least recently used key. Add a comment explaining why `move_to_end` is called on get. Do not use any other data structures.",
    rubric: [
      "Class name and method signatures",
      "Return type for get (-1 if missing)",
      "Specific data structure (OrderedDict)",
      "Eviction policy stated explicitly",
      "Explanation comment requested",
    ],
    tip: "For design problems, specify the class interface, data structures, and eviction/update semantics in one prompt.",
  },
  {
    id: "graph-bfs",
    title: "Word Ladder — BFS Shortest Path",
    difficulty: "Medium",
    context:
      "Find the shortest transformation sequence from beginWord to endWord, changing one letter at a time, using only words from a wordList.",
    badPrompt: "solve word ladder problem",
    goodPrompt:
      "Write a Python function `ladder_length(beginWord: str, endWord: str, wordList: list[str]) -> int` that returns the number of words in the shortest transformation sequence from beginWord to endWord, where each step changes exactly one letter and each intermediate word must be in wordList. Return 0 if no sequence exists. Use BFS (collections.deque). Convert wordList to a set for O(1) lookup. Time: O(M^2 * N) where M=word length, N=wordList size. Include the BFS level-tracking pattern using a sentinel or level counter.",
    rubric: [
      "Function signature with types",
      "Return 0 for no-path case",
      "BFS algorithm specified",
      "Set conversion for O(1) lookup",
      "Complexity analysis included",
    ],
    tip: "For graph problems, specify the traversal algorithm, the data structure for the frontier, and how to handle the 'not found' case.",
  },
  {
    id: "dp-knapsack",
    title: "0/1 Knapsack — Bottom-Up DP",
    difficulty: "Hard",
    context:
      "Classic knapsack: given weights and values, maximize value within capacity W.",
    badPrompt: "knapsack dp solution",
    goodPrompt:
      "Write a Python function `knapsack(weights: list[int], values: list[int], W: int) -> int` that returns the maximum value achievable with total weight ≤ W using 0/1 knapsack. Use bottom-up 2D DP: `dp[i][w]` = max value using first i items with weight limit w. Initialize dp as a (n+1) x (W+1) zero matrix. Add a comment for the recurrence relation: dp[i][w] = max(dp[i-1][w], dp[i-1][w-weights[i-1]] + values[i-1]) when weights[i-1] <= w. Time O(n*W), Space O(n*W).",
    rubric: [
      "DP table dimensions stated",
      "Recurrence relation specified",
      "Base case initialization",
      "Complexity stated",
      "Comment for recurrence requested",
    ],
    tip: "For DP, always specify the state definition (dp[i][w] means...), the recurrence, and the base case in your prompt.",
  },
  {
    id: "system-api",
    title: "Rate Limiter — Token Bucket",
    difficulty: "Hard",
    context:
      "Implement a thread-safe token bucket rate limiter for an API gateway.",
    badPrompt: "implement rate limiter",
    goodPrompt:
      "Write a Python class `TokenBucketRateLimiter` with `__init__(self, capacity: int, refill_rate: float)` where capacity is max tokens and refill_rate is tokens/second. Implement `allow_request(self) -> bool` that returns True if a token is available (and consumes it), False otherwise. Use `time.monotonic()` for elapsed time. Implement lazy refill: only compute tokens when `allow_request` is called. Use `threading.Lock` for thread safety. Add type hints and a docstring explaining the token bucket algorithm.",
    rubric: [
      "Class interface with types",
      "Lazy refill strategy specified",
      "Thread safety requirement",
      "Monotonic clock specified",
      "Docstring requested",
    ],
    tip: "For concurrency problems, always specify the thread-safety mechanism, the clock source, and whether refill is eager or lazy.",
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Medium: "text-amber-900 bg-amber-500/10 border-amber-500/30",
  Hard: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function PromptEngineeringDrill() {
  const [active, setActive] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [userPrompt, setUserPrompt] = useState("");
  const [showGood, setShowGood] = useState(false);
  const [showBad, setShowBad] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("prompt-drill-completed") || "[]"));
    } catch {
      return new Set();
    }
  });

  const analyzePrompt = trpc.ai.analyzePrompt.useMutation({
    onSuccess: (data) => {
      setAiFeedback(data.feedback);
      setScore(data.score);
      setLoading(false);
      if (data.score >= 70) {
        const newCompleted = new Set(completedIds);
        newCompleted.add(scenario.id);
        setCompletedIds(newCompleted);
        localStorage.setItem("prompt-drill-completed", JSON.stringify([...newCompleted]));
        toast.success(`Score: ${data.score}/100 — Prompt accepted!`);
      } else {
        toast.error(`Score: ${data.score}/100 — Needs improvement`);
      }
    },
    onError: () => {
      setLoading(false);
      toast.error("Analysis failed — check your connection");
    },
  });

  const scenario = SCENARIOS[scenarioIdx];

  const handleAnalyze = () => {
    if (!userPrompt.trim()) {
      toast.error("Write a prompt first");
      return;
    }
    setLoading(true);
    setAiFeedback("");
    setScore(null);
    analyzePrompt.mutate({
      scenario: scenario.title,
      context: scenario.context,
      userPrompt,
      rubric: scenario.rubric,
    });
  };

  const handleReset = () => {
    setUserPrompt("");
    setAiFeedback("");
    setScore(null);
    setShowGood(false);
    setShowBad(false);
  };

  if (!active) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
              <Cpu size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Prompt Engineering Drill</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-Enabled Round · Write precise prompts that get production-quality code
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {completedIds.size}/{SCENARIOS.length} done
            </span>
            <button
              onClick={() => setActive(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all"
            >
              Start Drill
            </button>
          </div>
        </div>

        {/* Scenario list preview */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SCENARIOS.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                completedIds.has(s.id)
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-secondary/30 border-border text-muted-foreground"
              }`}
            >
              {completedIds.has(s.id) ? (
                <CheckCircle size={12} className="text-emerald-400 shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />
              )}
              <span className="truncate">{s.title}</span>
              <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${DIFFICULTY_COLOR[s.difficulty]}`}>
                {s.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-cyan-400" />
          <span className="font-bold text-sm text-foreground">Prompt Engineering Drill</span>
          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${DIFFICULTY_COLOR[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {scenarioIdx + 1}/{SCENARIOS.length}
          </span>
          <button
            onClick={() => setActive(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scenario navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setScenarioIdx(i); handleReset(); }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all border ${
              i === scenarioIdx
                ? "bg-cyan-600 border-cyan-500 text-white"
                : completedIds.has(s.id)
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {completedIds.has(s.id) ? "✓ " : ""}{i + 1}
          </button>
        ))}
      </div>

      {/* Scenario context */}
      <div className="rounded-lg bg-secondary/30 border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-cyan-400 shrink-0" />
          <span className="font-bold text-sm text-foreground">{scenario.title}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.context}</p>

        {/* Rubric */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Scoring Rubric (5 criteria, 20 pts each)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {scenario.rubric.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bad prompt reveal */}
      <div>
        <button
          onClick={() => setShowBad(!showBad)}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          {showBad ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <XCircle size={12} />
          Show example of a bad prompt
        </button>
        {showBad && (
          <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-xs text-red-300 font-mono">"{scenario.badPrompt}"</p>
            <p className="text-[10px] text-red-400/70 mt-1.5">
              Too vague — no function signature, no complexity target, no algorithm specified.
            </p>
          </div>
        )}
      </div>

      {/* User prompt input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Write your prompt for Copilot/ChatGPT:
        </label>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Write a precise, context-rich prompt that would get production-quality code..."
          className="w-full h-28 rounded-lg bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 p-3 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {userPrompt.length} chars · aim for 150–400
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw size={11} /> Reset
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading || !userPrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold transition-all"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              Score My Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Score display */}
      {score !== null && (
        <div className={`rounded-lg border p-3 flex items-center gap-3 ${
          score >= 80
            ? "bg-emerald-500/10 border-emerald-500/30"
            : score >= 60
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}>
          <div className={`text-2xl font-black ${
            score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-900" : "text-red-400"
          }`}>
            {score}
          </div>
          <div>
            <div className={`text-xs font-bold ${
              score >= 80 ? "text-emerald-300" : score >= 60 ? "text-amber-800" : "text-red-300"
            }`}>
              {score >= 80 ? "Strong Prompt" : score >= 60 ? "Needs Refinement" : "Too Vague"}
            </div>
            <div className="text-[10px] text-muted-foreground">out of 100 points</div>
          </div>
        </div>
      )}

      {/* AI feedback */}
      {aiFeedback && (
        <div className="rounded-lg bg-secondary/30 border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={13} className="text-amber-900" />
            <span className="text-xs font-semibold text-foreground">AI Feedback</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <Streamdown>{aiFeedback}</Streamdown>
          </div>
        </div>
      )}

      {/* Good prompt reveal */}
      <div>
        <button
          onClick={() => setShowGood(!showGood)}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {showGood ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <CheckCircle size={12} />
          Show model answer (good prompt)
        </button>
        {showGood && (
          <div className="mt-2 space-y-2">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-xs text-emerald-200 font-mono leading-relaxed">
                "{scenario.goodPrompt}"
              </p>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Lightbulb size={12} className="text-amber-900 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800">{scenario.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => { setScenarioIdx(Math.max(0, scenarioIdx - 1)); handleReset(); }}
          disabled={scenarioIdx === 0}
          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        >
          ← Prev
        </button>
        <span className="text-[10px] text-muted-foreground">
          {completedIds.size} of {SCENARIOS.length} scenarios passed
        </span>
        <button
          onClick={() => { setScenarioIdx(Math.min(SCENARIOS.length - 1, scenarioIdx + 1)); handleReset(); }}
          disabled={scenarioIdx === SCENARIOS.length - 1}
          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
