/**
 * YandexAlgorithmTrainer — Feature #20
 * Yandex-style algorithm problems with strict time limits (20 min),
 * no hints, and a binary pass/fail verdict.
 * Focuses on the hardest Meta-adjacent patterns: segment trees, advanced DP,
 * string algorithms, and competitive-programming-style problems.
 * Trains candidates to perform under pressure without AI assistance.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Swords,
  Timer,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trophy,
  Flame,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface YandexProblem {
  id: string;
  title: string;
  difficulty: "C" | "D" | "E";
  timeLimit: number; // seconds
  memoryLimit: string;
  tags: string[];
  statement: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  solution: string; // hidden until reveal
  keyInsight: string;
  metaRelevance: string;
}

const PROBLEMS: YandexProblem[] = [
  {
    id: "max-subarray-circular",
    title: "Maximum Circular Subarray Sum",
    difficulty: "C",
    timeLimit: 1200,
    memoryLimit: "256 MB",
    tags: ["Kadane's", "Prefix Sum", "Circular Array"],
    statement: `Given a circular integer array nums of length n, return the maximum possible sum of a non-empty subarray of nums.

A circular array means the end of the array connects to the beginning. Formally, the next element of nums[i] is nums[(i + 1) % n] and the previous element of nums[i] is nums[(i - 1 + n) % n].

A subarray may only include each element of the fixed buffer nums at most once.`,
    constraints: `n == nums.length
1 ≤ n ≤ 3 × 10⁴
-3 × 10⁴ ≤ nums[i] ≤ 3 × 10⁴`,
    examples: [
      { input: "nums = [1,-2,3,-2]", output: "3", explanation: "Subarray [3] has maximum sum 3." },
      { input: "nums = [5,-3,5]", output: "10", explanation: "Subarray [5,5] (circular) has maximum sum 10." },
      { input: "nums = [-3,-2,-3]", output: "-2", explanation: "Subarray [-2] has maximum sum -2." },
    ],
    solution: `def maxSubarraySumCircular(nums):
    # Case 1: max subarray is non-circular → standard Kadane's
    def kadane(arr):
        max_sum = cur = arr[0]
        for x in arr[1:]:
            cur = max(x, cur + x)
            max_sum = max(max_sum, cur)
        return max_sum
    
    # Case 2: max subarray is circular → total_sum - min_subarray
    def kadane_min(arr):
        min_sum = cur = arr[0]
        for x in arr[1:]:
            cur = min(x, cur + x)
            min_sum = min(min_sum, cur)
        return min_sum
    
    max_wrap = sum(nums) - kadane_min(nums)
    # Edge case: all negative → max_wrap = 0 (empty subarray), use non-circular
    return max(kadane(nums), max_wrap) if max_wrap != 0 else kadane(nums)`,
    keyInsight: "Two cases: (1) non-circular → Kadane's max. (2) circular → total_sum - Kadane's min. The circular case wraps around, so the complement is the minimum subarray.",
    metaRelevance: "Tests Kadane's mastery + circular array thinking. Appears in Meta E5/E6 coding screens as a follow-up to standard max subarray.",
  },
  {
    id: "longest-palindromic-subsequence",
    title: "Minimum Deletions to Make Palindrome",
    difficulty: "C",
    timeLimit: 1200,
    memoryLimit: "256 MB",
    tags: ["DP", "LCS", "Palindrome"],
    statement: `Given a string s, find the minimum number of characters you need to delete to make s a palindrome.

Return the minimum number of deletions required.`,
    constraints: `1 ≤ s.length ≤ 1000
s consists only of lowercase English letters`,
    examples: [
      { input: 's = "aebcbda"', output: "2", explanation: 'Delete "e" and "d" to get "abcba".' },
      { input: 's = "geeksforgeeks"', output: "8" },
    ],
    solution: `def minDeletions(s):
    # Key insight: min deletions = n - LPS (Longest Palindromic Subsequence)
    # LPS(s) = LCS(s, reverse(s))
    n = len(s)
    t = s[::-1]
    # LCS DP
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    lps = dp[n][n]
    return n - lps`,
    keyInsight: "min_deletions = n - LPS(s). LPS = LCS(s, reverse(s)). Classic 2D DP reduction.",
    metaRelevance: "Tests DP problem reduction skills. Meta E6+ candidates must identify the LCS→LPS connection without hints.",
  },
  {
    id: "sliding-window-median",
    title: "Sliding Window Median",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["Heap", "Two Heaps", "Sliding Window"],
    statement: `The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value. So the median is the mean of the two middle values.

Given an array nums and a sliding window of size k, return the median array for each window in the original array.`,
    constraints: `1 ≤ k ≤ nums.length ≤ 10⁵
-2³¹ ≤ nums[i] ≤ 2³¹ - 1`,
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[1.00000,-1.00000,-1.00000,3.00000,5.00000,6.00000]" },
      { input: "nums = [1,2,3,4,2,3,1,4,2], k = 3", output: "[2.00000,3.00000,3.00000,3.00000,2.00000,3.00000,2.00000]" },
    ],
    solution: `import heapq
from collections import defaultdict

def medianSlidingWindow(nums, k):
    lo = []  # max-heap (negated)
    hi = []  # min-heap
    lazy = defaultdict(int)  # lazy deletion counts
    
    def balance():
        while lo and lazy[-lo[0]]:
            lazy[-lo[0]] -= 1
            heapq.heappop(lo)
        while hi and lazy[hi[0]]:
            lazy[hi[0]] -= 1
            heapq.heappop(hi)
    
    def add(x):
        if lo and x <= -lo[0]:
            heapq.heappush(lo, -x)
        else:
            heapq.heappush(hi, x)
    
    def rebalance():
        while len(lo) > len(hi) + 1:
            heapq.heappush(hi, -heapq.heappop(lo))
        while len(hi) > len(lo):
            heapq.heappush(lo, -heapq.heappop(hi))
    
    def get_median():
        if k % 2 == 1:
            return float(-lo[0])
        return (-lo[0] + hi[0]) / 2.0
    
    for i in range(k):
        add(nums[i])
    rebalance()
    
    result = [get_median()]
    for i in range(k, len(nums)):
        add(nums[i])
        out = nums[i - k]
        lazy[out] += 1
        if out <= -lo[0]:
            if len(lo) > len(hi) + 1:
                heapq.heappush(hi, -heapq.heappop(lo))
                balance()
        else:
            if len(hi) > len(lo):
                heapq.heappush(lo, -heapq.heappop(hi))
                balance()
        balance()
        result.append(get_median())
    return result`,
    keyInsight: "Two-heap approach with lazy deletion. Max-heap (lo) stores lower half, min-heap (hi) stores upper half. Lazy deletion avoids O(n) removal.",
    metaRelevance: "Tests heap mastery + lazy deletion pattern. Exact problem type seen in Meta E6/E7 final rounds.",
  },
  {
    id: "count-of-range-sum",
    title: "Count of Range Sum",
    difficulty: "E",
    timeLimit: 2400,
    memoryLimit: "256 MB",
    tags: ["Merge Sort", "Prefix Sum", "Divide & Conquer"],
    statement: `Given an integer array nums and two integers lower and upper, return the number of range sums that lie in [lower, upper] inclusive.

Range sum S(i, j) is defined as the sum of the elements in nums between indices i and j inclusive, where i ≤ j.`,
    constraints: `1 ≤ nums.length ≤ 10⁵
-2³¹ ≤ nums[i] ≤ 2³¹ - 1
-10⁵ ≤ lower ≤ upper ≤ 10⁵
The answer is guaranteed to fit in a 32-bit integer.`,
    examples: [
      { input: "nums = [-2,5,-1], lower = -2, upper = 2", output: "3", explanation: "The three ranges are [0,0], [2,2], and [0,2]." },
      { input: "nums = [0], lower = 0, upper = 0", output: "1" },
    ],
    solution: `def countRangeSum(nums, lower, upper):
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    
    def merge_count(arr):
        if len(arr) <= 1:
            return arr, 0
        mid = len(arr) // 2
        left, lc = merge_count(arr[:mid])
        right, rc = merge_count(arr[mid:])
        count = lc + rc
        
        # Count valid pairs: lower <= right[j] - left[i] <= upper
        j = k = 0
        for l in left:
            while j < len(right) and right[j] - l < lower:
                j += 1
            while k < len(right) and right[k] - l <= upper:
                k += 1
            count += k - j
        
        # Merge
        merged = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                merged.append(right[j]); j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged, count
    
    _, total = merge_count(prefix)
    return total`,
    keyInsight: "Prefix sum + merge sort. During merge, count pairs (i from left, j from right) where lower ≤ prefix[j] - prefix[i] ≤ upper using two pointers on sorted halves.",
    metaRelevance: "Classic 'hard' problem requiring merge sort + prefix sum combination. Tests whether candidates can adapt merge sort to counting problems.",
  },
  {
    id: "minimum-window-subsequence",
    title: "Minimum Window Subsequence",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["Two Pointers", "DP", "String"],
    statement: `Given strings s1 and s2, return the minimum window in s1 which will contain s2 as a subsequence. If there is no such window in s1 that covers all characters in s2, return the empty string "".

In the case that there are multiple minimum-length windows, return the one with the left-most starting index.`,
    constraints: `1 ≤ s1.length ≤ 2 × 10⁴
1 ≤ s2.length ≤ 100
s1 and s2 consist of lowercase English letters`,
    examples: [
      { input: 's1 = "abcdebdde", s2 = "bde"', output: '"bcde"', explanation: '"bcde" is the answer because it occurs before "bdde" which has the same length.' },
      { input: 's1 = "jmeqksfrsdcmsiwvaovztaqenprpvnbstl", s2 = "u"', output: '""' },
    ],
    solution: `def minWindow(s1, s2):
    n, m = len(s1), len(s2)
    best_start, best_len = -1, float('inf')
    
    i = 0
    while i < n:
        # Forward pass: find end of window containing s2 as subsequence
        j = 0
        while i < n and j < m:
            if s1[i] == s2[j]:
                j += 1
            i += 1
        if j < m:
            break  # s2 not found
        
        end = i  # exclusive end
        
        # Backward pass: shrink from end to find minimal start
        k = m - 1
        i -= 1
        while k >= 0:
            if s1[i] == s2[k]:
                k -= 1
            i -= 1
        i += 1  # i is now the start of the minimal window
        
        window_len = end - i
        if window_len < best_len:
            best_len = window_len
            best_start = i
        
        i += 1  # advance past current start to find next window
    
    return s1[best_start:best_start + best_len] if best_start != -1 else ""`,
    keyInsight: "Forward pass finds a valid window end, backward pass shrinks it to minimal start. Advance start by 1 and repeat. O(n*m) time.",
    metaRelevance: "Tests two-pointer mastery with subsequence (not substring) constraint. Common in Meta E5 follow-up rounds.",
  },
];

const DIFF_COLORS: Record<string, string> = {
  C: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  D: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  E: "text-red-400 bg-red-500/10 border-red-500/30",
};

const DIFF_LABELS: Record<string, string> = {
  C: "C — Medium",
  D: "D — Hard",
  E: "E — Expert",
};

export default function YandexAlgorithmTrainer() {
  const [active, setActive] = useState(false);
  const [problemIdx, setProblemIdx] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [verdict, setVerdict] = useState<"pass" | "fail" | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("yandex-trainer-completed") || "[]"));
    } catch {
      return new Set();
    }
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const problem = PROBLEMS[problemIdx];
  const timeLimit = problem.timeLimit;
  const remaining = Math.max(0, timeLimit - elapsed);
  const pct = (elapsed / timeLimit) * 100;

  const startTimer = useCallback(() => {
    setTimerRunning(true);
    setElapsed(0);
    setVerdict(null);
    setShowSolution(false);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= timeLimit) {
            setTimerRunning(false);
            setVerdict("fail");
            toast.error("Time's up! Review the solution.");
            return timeLimit;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timeLimit]);

  const handlePass = () => {
    stopTimer();
    setVerdict("pass");
    const newCompleted = new Set(completedIds);
    newCompleted.add(problem.id);
    setCompletedIds(newCompleted);
    localStorage.setItem("yandex-trainer-completed", JSON.stringify([...newCompleted]));
    toast.success(`✓ Solved in ${formatTime(elapsed)}!`);
  };

  const handleFail = () => {
    stopTimer();
    setVerdict("fail");
    setShowSolution(true);
    toast.error("Study the solution carefully.");
  };

  const handleReset = () => {
    stopTimer();
    setElapsed(0);
    setVerdict(null);
    setShowSolution(false);
    setTimerRunning(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = remaining <= 120
    ? "text-red-400"
    : remaining <= 300
    ? "text-amber-400"
    : "text-emerald-400";

  if (!active) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <Swords size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Yandex Algorithm Trainer</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hard problems · No hints · Strict time limits · Binary pass/fail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {completedIds.size}/{PROBLEMS.length} solved
            </span>
            <button
              onClick={() => setActive(true)}
              className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all"
            >
              Enter Arena
            </button>
          </div>
        </div>

        {/* Problem list */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                completedIds.has(p.id)
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-secondary/30 border-border text-muted-foreground"
              }`}
            >
              {completedIds.has(p.id) ? (
                <Trophy size={12} className="text-emerald-400 shrink-0" />
              ) : (
                <Lock size={12} className="opacity-40 shrink-0" />
              )}
              <span className="truncate">{p.title}</span>
              <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${DIFF_COLORS[p.difficulty]}`}>
                {p.difficulty}
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
          <Swords size={16} className="text-red-400" />
          <span className="font-bold text-sm text-foreground">Yandex Algorithm Trainer</span>
          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${DIFF_COLORS[problem.difficulty]}`}>
            {DIFF_LABELS[problem.difficulty]}
          </span>
        </div>
        <button
          onClick={() => { handleReset(); setActive(false); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Problem navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {PROBLEMS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setProblemIdx(i); handleReset(); }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all border ${
              i === problemIdx
                ? "bg-red-700 border-red-600 text-white"
                : completedIds.has(p.id)
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {completedIds.has(p.id) ? "✓ " : ""}{i + 1}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="rounded-lg bg-secondary/30 border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Timer size={14} className={timerColor} />
            <span className={`font-mono font-black text-xl ${timerColor}`}>
              {formatTime(remaining)}
            </span>
            <span className="text-[10px] text-muted-foreground">/ {formatTime(timeLimit)}</span>
          </div>
          <div className="flex items-center gap-2">
            {!timerRunning && verdict === null && (
              <button
                onClick={startTimer}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all"
              >
                <Play size={11} /> Start
              </button>
            )}
            {timerRunning && (
              <>
                <button
                  onClick={handlePass}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                >
                  <CheckCircle size={11} /> Solved
                </button>
                <button
                  onClick={handleFail}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                >
                  <XCircle size={11} /> Give Up
                </button>
              </>
            )}
            {verdict !== null && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <RotateCcw size={11} /> Retry
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      {/* Verdict banner */}
      {verdict && (
        <div className={`rounded-lg border p-3 flex items-center gap-3 ${
          verdict === "pass"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}>
          {verdict === "pass" ? (
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <XCircle size={18} className="text-red-400 shrink-0" />
          )}
          <div>
            <div className={`text-sm font-bold ${verdict === "pass" ? "text-emerald-300" : "text-red-300"}`}>
              {verdict === "pass"
                ? `Solved in ${formatTime(elapsed)} — ${elapsed <= timeLimit * 0.6 ? "Excellent!" : "Good job!"}`
                : "Time expired or gave up — study the solution"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {verdict === "pass"
                ? "This problem is now marked as solved in your archive."
                : "Understanding the key insight is more important than getting it right first try."}
            </div>
          </div>
        </div>
      )}

      {/* Problem statement */}
      <div className="rounded-lg bg-secondary/30 border border-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-foreground">{problem.title}</h3>
          <div className="flex gap-1 flex-wrap justify-end">
            {problem.tags.map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] text-muted-foreground border border-border">
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{problem.statement}</p>
        <div className="text-[10px] text-muted-foreground font-mono bg-secondary/40 rounded p-2">
          <span className="font-semibold text-foreground">Constraints:</span>
          <br />
          {problem.constraints}
        </div>

        {/* Examples */}
        <div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showExamples ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            Examples ({problem.examples.length})
          </button>
          {showExamples && (
            <div className="mt-2 space-y-2">
              {problem.examples.map((ex, i) => (
                <div key={i} className="rounded bg-secondary/40 border border-border p-2 text-[11px] font-mono">
                  <div><span className="text-muted-foreground">Input: </span><span className="text-foreground">{ex.input}</span></div>
                  <div><span className="text-muted-foreground">Output: </span><span className="text-emerald-400">{ex.output}</span></div>
                  {ex.explanation && (
                    <div className="text-muted-foreground mt-1 font-sans text-[10px]">{ex.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta relevance */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <Flame size={12} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-300">{problem.metaRelevance}</p>
      </div>

      {/* Solution reveal */}
      <div>
        <button
          onClick={() => setShowSolution(!showSolution)}
          disabled={timerRunning}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {showSolution ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {timerRunning ? "Stop timer to reveal solution" : "Reveal solution + key insight"}
        </button>
        {showSolution && (
          <div className="mt-2 space-y-3">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-[11px] font-semibold text-amber-300 mb-1">Key Insight</p>
              <p className="text-xs text-amber-200/80">{problem.keyInsight}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">Reference Solution (Python)</p>
              <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {problem.solution}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => { setProblemIdx(Math.max(0, problemIdx - 1)); handleReset(); }}
          disabled={problemIdx === 0}
          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        >
          ← Prev
        </button>
        <span className="text-[10px] text-muted-foreground">
          {completedIds.size}/{PROBLEMS.length} solved
        </span>
        <button
          onClick={() => { setProblemIdx(Math.min(PROBLEMS.length - 1, problemIdx + 1)); handleReset(); }}
          disabled={problemIdx === PROBLEMS.length - 1}
          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
