/**
 * ReverseEngineeringDrill — Given a working solution, identify:
 *   1. The pattern (multiple choice)
 *   2. Time complexity (multiple choice)
 *   3. One key edge case (free text)
 * 3-minute timer. Scores saved to localStorage.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { PATTERNS } from "@/lib/guideData";
import { Timer, ChevronRight, RotateCcw, Trophy, X, Zap } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface REChallenge {
  patternId: string;
  patternName: string;
  problemName: string;
  solution: string;       // Python pseudocode / real snippet
  timeComplexity: string; // correct answer
  spaceComplexity: string;
  keyEdgeCases: string[]; // accepted keywords (lowercase)
  wrongPatterns: string[]; // 3 distractors
  wrongComplexities: string[];
}

const CHALLENGES: REChallenge[] = [
  {
    patternId: "arrays-hashing",
    patternName: "Arrays & Hashing",
    problemName: "Two Sum",
    solution: `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    keyEdgeCases: ["duplicate", "negative", "same element", "empty", "single"],
    wrongPatterns: ["Two Pointers", "Sliding Window", "Binary Search"],
    wrongComplexities: ["O(n²)", "O(n log n)", "O(1)"],
  },
  {
    patternId: "two-pointers",
    patternName: "Two Pointers",
    problemName: "Container With Most Water",
    solution: `def maxArea(height):
    l, r = 0, len(height) - 1
    res = 0
    while l < r:
        area = min(height[l], height[r]) * (r - l)
        res = max(res, area)
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return res`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    keyEdgeCases: ["equal heights", "single bar", "decreasing", "all same"],
    wrongPatterns: ["Arrays & Hashing", "Sliding Window", "Greedy"],
    wrongComplexities: ["O(n²)", "O(n log n)", "O(n)"],
  },
  {
    patternId: "sliding-window",
    patternName: "Sliding Window",
    problemName: "Longest Substring Without Repeating Characters",
    solution: `def lengthOfLongestSubstring(s):
    char_set = set()
    l = 0
    res = 0
    for r in range(len(s)):
        while s[r] in char_set:
            char_set.remove(s[l])
            l += 1
        char_set.add(s[r])
        res = max(res, r - l + 1)
    return res`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(n,m))",
    keyEdgeCases: ["empty string", "all unique", "all same", "unicode"],
    wrongPatterns: ["Two Pointers", "Arrays & Hashing", "Dynamic Programming"],
    wrongComplexities: ["O(n²)", "O(n log n)", "O(1)"],
  },
  {
    patternId: "trees-bfs-dfs",
    patternName: "Trees (BFS / DFS)",
    problemName: "Binary Tree Level Order Traversal",
    solution: `def levelOrder(root):
    if not root: return []
    res, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        res.append(level)
    return res`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(w)",
    keyEdgeCases: ["null root", "single node", "skewed tree", "complete tree"],
    wrongPatterns: ["Graphs", "Dynamic Programming", "Arrays & Hashing"],
    wrongComplexities: ["O(n²)", "O(n log n)", "O(h)"],
  },
  {
    patternId: "graphs",
    patternName: "Graphs",
    problemName: "Number of Islands",
    solution: `def numIslands(grid):
    if not grid: return 0
    count = 0
    def dfs(r, c):
        if r < 0 or c < 0 or r >= len(grid) or c >= len(grid[0]):
            return
        if grid[r][c] != '1': return
        grid[r][c] = '0'
        dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] == '1':
                dfs(r, c)
                count += 1
    return count`,
    timeComplexity: "O(m×n)",
    spaceComplexity: "O(m×n)",
    keyEdgeCases: ["empty grid", "all water", "all land", "single cell"],
    wrongPatterns: ["Trees (BFS / DFS)", "Union-Find", "Arrays & Hashing"],
    wrongComplexities: ["O(n²)", "O(n)", "O(m+n)"],
  },
  {
    patternId: "binary-search",
    patternName: "Binary Search",
    problemName: "Search in Rotated Sorted Array",
    solution: `def search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        mid = (l + r) // 2
        if nums[mid] == target: return mid
        if nums[l] <= nums[mid]:
            if nums[l] <= target < nums[mid]:
                r = mid - 1
            else:
                l = mid + 1
        else:
            if nums[mid] < target <= nums[r]:
                l = mid + 1
            else:
                r = mid - 1
    return -1`,
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    keyEdgeCases: ["not rotated", "single element", "target not present", "duplicates"],
    wrongPatterns: ["Two Pointers", "Arrays & Hashing", "Sliding Window"],
    wrongComplexities: ["O(n)", "O(n log n)", "O(n²)"],
  },
  {
    patternId: "dp",
    patternName: "Dynamic Programming",
    problemName: "Climbing Stairs",
    solution: `def climbStairs(n):
    if n <= 2: return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    keyEdgeCases: ["n=1", "n=2", "large n", "overflow"],
    wrongPatterns: ["Arrays & Hashing", "Greedy", "Recursion"],
    wrongComplexities: ["O(2ⁿ)", "O(n log n)", "O(1)"],
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────
const TOTAL_TIME = 180; // 3 minutes
const RE_SCORE_KEY = "meta-guide-re-drill-scores";

interface REScore {
  date: number;
  patternId: string;
  patternName: string;
  problemName: string;
  patternCorrect: boolean;
  complexityCorrect: boolean;
  edgeCaseScore: number; // 0-2
  timeSec: number;
  total: number; // 0-100
}

function loadScores(): REScore[] {
  try { return JSON.parse(localStorage.getItem(RE_SCORE_KEY) ?? "[]"); } catch { return []; }
}
function saveScores(s: REScore[]) {
  try { localStorage.setItem(RE_SCORE_KEY, JSON.stringify(s.slice(0, 100))); } catch {}
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Component ────────────────────────────────────────────────────────────────
type Phase = "idle" | "active" | "done";

export default function ReverseEngineeringDrill() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [challenge, setChallenge] = useState<REChallenge | null>(null);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedComplexity, setSelectedComplexity] = useState<string | null>(null);
  const [edgeCaseText, setEdgeCaseText] = useState("");
  const [result, setResult] = useState<REScore | null>(null);
  const [scores, setScores] = useState<REScore[]>(() => loadScores());
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Pattern options (correct + 3 distractors, shuffled)
  const patternOptions = useMemo(() => {
    if (!challenge) return [];
    return shuffle([challenge.patternName, ...challenge.wrongPatterns]);
  }, [challenge]);

  // Complexity options
  const complexityOptions = useMemo(() => {
    if (!challenge) return [];
    return shuffle([challenge.timeComplexity, ...challenge.wrongComplexities]);
  }, [challenge]);

  const startDrill = () => {
    const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    setChallenge(c);
    setSelectedPattern(null);
    setSelectedComplexity(null);
    setEdgeCaseText("");
    setResult(null);
    setTimeLeft(TOTAL_TIME);
    startTimeRef.current = Date.now();
    setPhase("active");
  };

  // Countdown
  useEffect(() => {
    if (phase !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          submitDrill(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const submitDrill = (timedOut = false) => {
    if (!challenge) return;
    clearInterval(timerRef.current!);
    const timeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const patternCorrect = selectedPattern === challenge.patternName;
    const complexityCorrect = selectedComplexity === challenge.timeComplexity;
    const edgeLower = edgeCaseText.toLowerCase();
    const edgeCaseScore = challenge.keyEdgeCases.some(kw => edgeLower.includes(kw)) ? 2 : edgeLower.trim().length > 10 ? 1 : 0;

    // Scoring: pattern 40pts, complexity 40pts, edge case 20pts
    const total = (patternCorrect ? 40 : 0) + (complexityCorrect ? 40 : 0) + edgeCaseScore * 10;
    const score: REScore = {
      date: Date.now(), patternId: challenge.patternId, patternName: challenge.patternName,
      problemName: challenge.problemName, patternCorrect, complexityCorrect, edgeCaseScore, timeSec, total,
    };
    const updated = [score, ...loadScores()].slice(0, 100);
    saveScores(updated);
    setScores(updated);
    setResult(score);
    setPhase("done");
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const urgency = timeLeft <= 30 ? "text-red-500" : timeLeft <= 60 ? "text-amber-500" : "text-foreground";

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b.total, 0) / scores.length) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap size={14} className="text-violet-500" />
            Reverse Engineering Drill
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Read the solution → identify pattern, complexity, and edge case in 3 min.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {avgScore !== null && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-full">
              Avg {avgScore}/100
            </span>
          )}
          {scores.length > 0 && (
            <button
              onClick={() => setShowHistory(v => !v)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              {showHistory ? "Hide" : "History"}
            </button>
          )}
        </div>
      </div>

      {/* History */}
      {showHistory && scores.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Problem</th>
                <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Pat</th>
                <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Cplx</th>
                <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.slice(0, 8).map((s, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-1.5 text-foreground truncate max-w-[140px]">{s.problemName}</td>
                  <td className="px-2 py-1.5 text-center">{s.patternCorrect ? "✅" : "❌"}</td>
                  <td className="px-2 py-1.5 text-center">{s.complexityCorrect ? "✅" : "❌"}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-foreground">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Idle */}
      {phase === "idle" && (
        <button
          onClick={startDrill}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={14} /> Start Reverse Engineering Drill
        </button>
      )}

      {/* Active */}
      {phase === "active" && challenge && (
        <div className="space-y-4">
          {/* Timer + problem */}
          <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">Problem</div>
              <div className="text-sm font-bold text-foreground">{challenge.problemName}</div>
            </div>
            <div className={`text-2xl font-black tabular-nums ${urgency}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {mins}:{secs.toString().padStart(2, "0")}
            </div>
          </div>

          {/* Solution code */}
          <div className="bg-gray-950 rounded-xl p-4 overflow-x-auto">
            <pre className="text-[11px] text-green-300 font-mono leading-relaxed whitespace-pre">{challenge.solution}</pre>
          </div>

          {/* Q1: Pattern */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">1. What pattern does this solution use?</p>
            <div className="grid grid-cols-2 gap-2">
              {patternOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSelectedPattern(opt)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    selectedPattern === opt
                      ? "bg-violet-100 dark:bg-violet-900/30 border-violet-400 text-violet-700 dark:text-violet-300"
                      : "bg-card border-border text-foreground hover:border-violet-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Time complexity */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">2. What is the time complexity?</p>
            <div className="grid grid-cols-2 gap-2">
              {complexityOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSelectedComplexity(opt)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    selectedComplexity === opt
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300"
                      : "bg-card border-border text-foreground hover:border-blue-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Edge case */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">3. Name one key edge case this solution must handle:</p>
            <textarea
              value={edgeCaseText}
              onChange={e => setEdgeCaseText(e.target.value)}
              placeholder="e.g. empty array, duplicate values, negative numbers…"
              rows={2}
              className="w-full text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => submitDrill(false)}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ChevronRight size={14} /> Submit Answers
          </button>
        </div>
      )}

      {/* Done */}
      {phase === "done" && result && challenge && (
        <div className="space-y-4">
          {/* Score banner */}
          <div className={`rounded-xl p-4 text-center border ${
            result.total >= 80 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700" :
            result.total >= 50 ? "bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" :
            "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700"
          }`}>
            <div className="text-3xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {result.total}<span className="text-base font-semibold opacity-60">/100</span>
            </div>
            <div className="text-xs font-semibold mt-1 opacity-70">
              {result.total >= 80 ? "Excellent — strong comprehension!" : result.total >= 50 ? "Good — review the missed parts." : "Keep drilling — pattern recognition takes practice."}
            </div>
            <div className="text-[10px] opacity-50 mt-1">{result.timeSec}s</div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${result.patternCorrect ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" : "bg-red-100 dark:bg-red-900/20 border-red-200"}`}>
              <span className="font-semibold text-foreground">Pattern</span>
              <span className={result.patternCorrect ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-700 dark:text-red-400"}>
                {selectedPattern ?? "—"} {result.patternCorrect ? "✅ +40" : `❌ +0 (was: ${challenge.patternName})`}
              </span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${result.complexityCorrect ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" : "bg-red-100 dark:bg-red-900/20 border-red-200"}`}>
              <span className="font-semibold text-foreground">Time Complexity</span>
              <span className={result.complexityCorrect ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-700 dark:text-red-400"}>
                {selectedComplexity ?? "—"} {result.complexityCorrect ? "✅ +40" : `❌ +0 (was: ${challenge.timeComplexity})`}
              </span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${result.edgeCaseScore > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" : "bg-red-100 dark:bg-red-900/20 border-red-200"}`}>
              <span className="font-semibold text-foreground">Edge Case</span>
              <span className={result.edgeCaseScore > 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-700 dark:text-red-400"}>
                {result.edgeCaseScore > 0 ? `✅ +${result.edgeCaseScore * 10}` : `❌ +0 (try: ${challenge.keyEdgeCases[0]})`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={startDrill}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={13} /> Try Another
            </button>
            <button
              onClick={() => setPhase("idle")}
              className="px-4 py-2.5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
