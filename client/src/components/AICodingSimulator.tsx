/**
 * AI-Enabled Coding Simulator — Priority #1
 * Mirrors Meta's 3-phase AI-enabled coding round format exactly:
 *   Phase 1: Bug Fix in a multi-file codebase
 *   Phase 2: Feature Extension
 *   Phase 3: Optimization
 * The LLM acts as a constrained AI assistant (describes, doesn't solve directly).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bug,
  Zap,
  PlusCircle,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RotateCcw,
  MessageSquare,
  Send,
  ArrowRight,
  Trophy,
} from "lucide-react";

// ── Bug library (20 pre-built scenarios) ─────────────────────────────────────
const PHASE1_BUGS = [
  {
    id: "b1",
    title: "Off-by-one in sliding window",
    description:
      "A sliding window function returns incorrect results for edge cases. Find and fix the bug.",
    language: "python",
    originalCode: `def max_sum_subarray(arr, k):
    """Return the maximum sum of any subarray of length k."""
    if not arr or k <= 0:
        return 0
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(1, len(arr) - k):  # BUG: should be len(arr) - k + 1
        window_sum += arr[i + k - 1] - arr[i - 1]
        max_sum = max(max_sum, window_sum)
    return max_sum

# Test cases:
# max_sum_subarray([1, 4, 2, 9, 7, 3, 8], 3) should return 24 (9+7+8)
# max_sum_subarray([2, 3], 2) should return 5`,
    bugType: "off-by-one",
    hint: "Check the loop bounds carefully. What happens when the window reaches the last element?",
  },
  {
    id: "b2",
    title: "Null pointer in linked list traversal",
    description:
      "A function to find the middle of a linked list crashes on certain inputs.",
    language: "python",
    originalCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def find_middle(head):
    """Return the middle node of a linked list."""
    slow = head
    fast = head
    while fast and fast.next:  # BUG: missing check for fast.next.next
        slow = slow.next
        fast = fast.next.next
    return slow

# For odd-length list [1,2,3,4,5], should return node with val=3
# For even-length list [1,2,3,4], should return node with val=2 or 3`,
    bugType: "null-pointer",
    hint: "The two-pointer approach is correct. Check what happens when the list has an even number of nodes.",
  },
  {
    id: "b3",
    title: "Incorrect type cast in data processing",
    description:
      "A data aggregation function returns wrong results due to a type casting error.",
    language: "python",
    originalCode: `def calculate_average_score(scores: list) -> float:
    """Calculate the average of a list of scores."""
    if not scores:
        return 0
    total = 0
    for score in scores:
        total += score
    return total / len(scores)  # BUG: integer division if scores are ints in Python 2 style

def process_student_data(students: list) -> dict:
    """Process student records and return summary stats."""
    result = {}
    for student in students:
        grade = student["grade"]
        score = int(student["score"])  # BUG: should preserve float precision
        if grade not in result:
            result[grade] = []
        result[grade].append(score)
    
    return {
        grade: calculate_average_score(scores)
        for grade, scores in result.items()
    }

# students = [{"grade": "A", "score": "95.5"}, {"grade": "A", "score": "88.3"}]
# Expected: {"A": 91.9}, Got: {"A": 91} (precision lost)`,
    bugType: "type-cast",
    hint: "Look at how scores are converted before being stored. What precision is lost?",
  },
  {
    id: "b4",
    title: "Race condition in counter increment",
    description:
      "A thread-safe counter implementation has a subtle bug that causes incorrect counts.",
    language: "python",
    originalCode: `import threading

class SafeCounter:
    def __init__(self):
        self.count = 0
        self.lock = threading.Lock()
    
    def increment(self):
        # BUG: lock is acquired but not used as context manager
        self.lock.acquire()
        self.count += 1
        # If an exception occurs here, lock is never released!
        self.lock.release()
    
    def get(self):
        return self.count  # BUG: should also acquire lock for read

# Expected: 1000 after 1000 concurrent increments
# Actual: may deadlock or return wrong value on exception`,
    bugType: "concurrency",
    hint: "Look at how the lock is used. What happens if an exception is thrown inside the critical section?",
  },
  {
    id: "b5",
    title: "Incorrect conditional in binary search",
    description:
      "A binary search implementation fails to find elements in certain positions.",
    language: "python",
    originalCode: `def binary_search(arr, target):
    """Return the index of target in sorted arr, or -1 if not found."""
    left, right = 0, len(arr) - 1
    
    while left < right:  # BUG: should be left <= right
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# binary_search([1, 3, 5, 7, 9], 9) should return 4, but returns -1
# binary_search([1, 3, 5, 7, 9], 1) should return 0, but returns -1`,
    bugType: "incorrect-conditional",
    hint: "What happens when the target is at the last remaining position? Check the loop termination condition.",
  },
];

const PHASE2_PROBLEMS = [
  {
    id: "f1",
    title: "Add LRU eviction to a cache",
    description:
      "A basic cache class exists. Add LRU (Least Recently Used) eviction so the cache never exceeds maxSize.",
    language: "python",
    originalCode: `class Cache:
    """A simple key-value cache. Your task: add LRU eviction."""
    
    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self.store = {}
    
    def get(self, key: str):
        """Return the value for key, or None if not found."""
        return self.store.get(key)
    
    def put(self, key: str, value) -> None:
        """Store key-value pair. TODO: evict LRU entry when at capacity."""
        self.store[key] = value
    
    def size(self) -> int:
        return len(self.store)

# TODO: Implement LRU eviction in put().
# When cache is full, remove the least recently used item.
# get() should also update the recency of the accessed item.`,
    hint: "Consider using an OrderedDict or a doubly linked list + hash map for O(1) get and put.",
  },
  {
    id: "f2",
    title: "Add rate limiting to an API handler",
    description:
      "An API handler exists. Add per-user rate limiting: max 10 requests per minute.",
    language: "python",
    originalCode: `import time
from typing import Dict

class APIHandler:
    """Handles API requests. Your task: add per-user rate limiting."""
    
    def __init__(self):
        self.request_counts: Dict[str, list] = {}
        self.rate_limit = 10  # requests per minute
    
    def handle_request(self, user_id: str, endpoint: str) -> dict:
        """Process an API request. TODO: add rate limiting."""
        # TODO: Check if user has exceeded rate limit
        # If exceeded, return {"error": "rate_limit_exceeded", "retry_after": seconds}
        
        # Simulate request processing
        return {"status": "ok", "user": user_id, "endpoint": endpoint}
    
    def _is_rate_limited(self, user_id: str) -> bool:
        """TODO: Implement this method."""
        return False`,
    hint: "Use a sliding window approach: store timestamps of recent requests and count those within the last 60 seconds.",
  },
];

const PHASE3_PROBLEMS = [
  {
    id: "o1",
    title: "Optimize O(n²) duplicate finder",
    description:
      "This function finds duplicates but is O(n²). Optimize it to O(n) time.",
    language: "python",
    originalCode: `def find_duplicates(arr: list) -> list:
    """Return all elements that appear more than once."""
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):  # O(n²) — optimize this!
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates

# find_duplicates([1, 2, 3, 2, 4, 3, 5]) → [2, 3]
# Current: O(n²) time, O(n) space
# Target: O(n) time, O(n) space`,
    hint: "A hash set can track seen elements in O(1). What do you do when you see an element that's already in the set?",
  },
  {
    id: "o2",
    title: "Optimize recursive Fibonacci",
    description:
      "This recursive Fibonacci is O(2^n). Optimize to O(n) using memoization or iteration.",
    language: "python",
    originalCode: `def fibonacci(n: int) -> int:
    """Return the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)  # O(2^n) — optimize!

# fibonacci(10) = 55
# fibonacci(40) is too slow with this implementation
# Target: O(n) time, O(1) space (iterative) or O(n) space (memoized)`,
    hint: "For O(n) time and O(1) space, you only need the previous two values at each step.",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "bug_fix" | "feature_extension" | "optimization";
type SessionState = "idle" | "running" | "scoring" | "scored";

interface ScoreResult {
  score: number;
  verdict: string;
  phase: string;
  correctness: number;
  codeQuality: number;
  aiJudgment: number;
  bugsFound: number;
  icLevel: string;
  strengths: string[];
  gaps: string[];
  coaching: string;
  metaSignal: string;
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({
  label,
  value,
  max = 5,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = (value / max) * 100;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono font-medium">
        {value}/{max}
      </span>
    </div>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function AIChatPanel({
  phase,
  problemContext,
}: {
  phase: Phase;
  problemContext: string;
}) {
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text:
        phase === "bug_fix"
          ? "I can help you understand the codebase. I won't point out bugs directly — ask me to explain what a function does, describe the expected behavior, or walk through the logic."
          : phase === "feature_extension"
            ? "I can help you understand the existing code structure. Ask me about the existing abstractions, expected interfaces, or how components fit together."
            : "I can help you think through optimization strategies. Ask me about data structures, algorithm patterns, or time/space trade-offs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setPrompts(p => [...p, userMsg]);
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    // Simulate constrained AI (describes, doesn't solve directly)
    await new Promise(r => setTimeout(r, 800));
    const constrainedResponses: Record<string, string> = {
      bug: "I can see there's a loop in this function. Think about what the termination condition means — what's the last value the loop variable takes?",
      fix: "Rather than telling you what to change, consider: what would happen if you traced through the code with the failing test case step by step?",
      wrong:
        "The logic looks intentional but may have an edge case. What inputs would make the condition evaluate differently than expected?",
      help: "I can describe what this function is supposed to do: it processes the input collection and returns a transformed result. The key question is whether the bounds are correct.",
      optimize:
        "For optimization, think about what data structure would give you O(1) lookup instead of O(n) search. What are the trade-offs?",
      default: `Based on the ${phase === "bug_fix" ? "bug fix" : phase === "feature_extension" ? "feature extension" : "optimization"} context: I can help you reason through the problem. What specific behavior are you trying to understand?`,
    };
    const key =
      Object.keys(constrainedResponses).find(k =>
        userMsg.toLowerCase().includes(k)
      ) ?? "default";
    setMessages(m => [...m, { role: "ai", text: constrainedResponses[key] }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 px-1">
        <MessageSquare size={13} className="text-blue-400" />
        <span className="text-xs font-medium text-blue-400">AI Assistant</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {prompts.length} prompts used
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-xs p-2 rounded-md ${m.role === "ai" ? "bg-blue-500/10 border border-blue-500/20 text-blue-100" : "bg-secondary text-foreground ml-4"}`}
          >
            <span className="font-medium text-xs opacity-60">
              {m.role === "ai" ? "AI" : "You"}:{" "}
            </span>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="text-xs p-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-100">
            <Loader2 size={10} className="inline animate-spin mr-1" />{" "}
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask the AI assistant..."
          className="flex-1 text-xs bg-secondary border border-border rounded px-2 py-1.5 focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function useTimer(initialSeconds: number) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
  }, [stop]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  const remaining = Math.max(0, initialSeconds - elapsed);
  const isOverTime = elapsed > initialSeconds;
  return { elapsed, remaining, running, isOverTime, start, stop, reset };
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AICodingSimulator() {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("bug_fix");
  const [problemIdx, setProblemIdx] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [code, setCode] = useState("");
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<
    { phase: Phase; title: string; score: number; icLevel: string }[]
  >([]);

  const PHASE_LIMIT = 8 * 60; // 8 minutes per phase
  const timer = useTimer(PHASE_LIMIT);

  const problems =
    phase === "bug_fix"
      ? PHASE1_BUGS
      : phase === "feature_extension"
        ? PHASE2_PROBLEMS
        : PHASE3_PROBLEMS;
  const problem = problems[problemIdx % problems.length];

  const scoreMutation = trpc.ai.aiCodingSimulatorScore.useMutation({
    onSuccess: data => {
      setScore(data);
      setSessionState("scored");
      timer.stop();
      setSessionHistory(h => [
        ...h,
        {
          phase,
          title: problem.title,
          score: data.score,
          icLevel: data.icLevel,
        },
      ]);
    },
    onError: () => {
      toast.error("Scoring failed. Please try again.");
      setSessionState("running");
    },
  });

  const startSession = () => {
    setCode(problem.originalCode);
    setScore(null);
    setSessionState("running");
    timer.reset();
    timer.start();
  };

  const submitForScoring = () => {
    if (!code.trim()) {
      toast.error("Please write your solution first.");
      return;
    }
    setSessionState("scoring");
    timer.stop();
    scoreMutation.mutate({
      phase,
      problemTitle: problem.title,
      problemDescription: problem.description,
      originalCode: problem.originalCode,
      candidateCode: code,
      language: problem.language,
      timeSpentSeconds: timer.elapsed,
    });
  };

  const resetSession = () => {
    setSessionState("idle");
    setCode("");
    setScore(null);
    timer.reset();
  };

  const nextProblem = () => {
    setProblemIdx(i => i + 1);
    resetSession();
  };

  const phaseConfig = {
    bug_fix: {
      icon: Bug,
      label: "Phase 1: Bug Fix",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      desc: "Find and fix bugs in the codebase. Use the AI assistant to understand the code — not to find the bug.",
    },
    feature_extension: {
      icon: PlusCircle,
      label: "Phase 2: Feature Extension",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      desc: "Extend the existing codebase with new functionality. Understand the abstractions before writing code.",
    },
    optimization: {
      icon: Zap,
      label: "Phase 3: Optimization",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      desc: "Improve the time/space complexity. Explain your approach before optimizing.",
    },
  };
  const pc = phaseConfig[phase];
  const PhaseIcon = pc.icon;

  const verdictColor = (v: string) => {
    if (!v) return "";
    const lv = v.toLowerCase();
    if (lv.includes("l7")) return "text-purple-400";
    if (lv.includes("l6")) return "text-emerald-400";
    return "text-amber-400";
  };

  const timeColor = timer.isOverTime
    ? "text-red-400"
    : timer.remaining < 120
      ? "text-amber-400"
      : "text-emerald-400";
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="prep-card mb-4" data-testid="ai-coding-simulator">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors rounded-t-lg"
      >
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Bug size={16} className="text-blue-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              AI-Enabled Coding Simulator
            </span>
            <span className="badge badge-blue text-xs">Priority #1</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            3-phase Meta format: Bug Fix → Feature Extension → Optimization
          </p>
        </div>
        {sessionHistory.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {sessionHistory.length} sessions
          </span>
        )}
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Phase selector */}
          <div className="flex gap-2 flex-wrap">
            {(["bug_fix", "feature_extension", "optimization"] as Phase[]).map(
              p => {
                const cfg = phaseConfig[p];
                const Icon = cfg.icon;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPhase(p);
                      resetSession();
                      setProblemIdx(0);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${phase === p ? `${cfg.bg} ${cfg.color} border-current` : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon size={12} />
                    {cfg.label}
                  </button>
                );
              }
            )}
          </div>

          {/* Phase description */}
          <div className={`text-xs p-3 rounded-md border ${pc.bg}`}>
            <span className={`font-medium ${pc.color}`}>{pc.label}: </span>
            <span className="text-muted-foreground">{pc.desc}</span>
          </div>

          {/* Problem card */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-medium text-sm">{problem.title}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {problem.description}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={nextProblem}
                  className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
            {sessionState === "idle" && (
              <div className="text-xs text-amber-400/80 flex items-center gap-1 mt-1">
                <AlertTriangle size={11} />
                <span>Hint: {problem.hint}</span>
              </div>
            )}
          </div>

          {sessionState === "idle" && (
            <button
              onClick={startSession}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <Play size={14} />
              Start {pc.label} (8 min timer)
            </button>
          )}

          {(sessionState === "running" || sessionState === "scoring") && (
            <div className="space-y-3">
              {/* Timer */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timeColor}`}
                >
                  <Clock size={13} />
                  {timer.isOverTime
                    ? `+${formatTime(timer.elapsed - PHASE_LIMIT)}`
                    : formatTime(timer.remaining)}
                  {timer.isOverTime && (
                    <span className="text-xs font-normal text-red-400">
                      Over time
                    </span>
                  )}
                </div>
                <button
                  onClick={resetSession}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              {/* Split view: code editor + AI chat */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Your solution ({problem.language})
                  </div>
                  <textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full h-64 font-mono text-xs bg-[#0d1117] border border-border rounded-md p-3 focus:outline-none focus:border-blue-500/50 resize-none text-green-300"
                    spellCheck={false}
                    placeholder="Write your solution here..."
                  />
                </div>
                <div className="h-64 bg-secondary/20 border border-border rounded-md p-3 flex flex-col">
                  <AIChatPanel
                    phase={phase}
                    problemContext={problem.description}
                  />
                </div>
              </div>

              <button
                onClick={submitForScoring}
                disabled={sessionState === "scoring"}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {sessionState === "scoring" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Scoring...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Submit for AI Scoring
                  </>
                )}
              </button>
            </div>
          )}

          {sessionState === "scored" && score && (
            <div className="space-y-3">
              {/* Verdict banner */}
              <div
                className={`p-3 rounded-lg border ${score.score >= 4 ? "bg-emerald-500/10 border-emerald-500/30" : score.score >= 3 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-bold text-sm ${verdictColor(score.icLevel)}`}
                  >
                    {score.icLevel} Signal
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {score.score.toFixed(1)}/5.0
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{score.verdict}</p>
              </div>

              {/* Score breakdown */}
              <div className="space-y-1.5">
                <ScoreBar label="Correctness" value={score.correctness} />
                <ScoreBar label="Code Quality" value={score.codeQuality} />
                <ScoreBar label="AI Judgment" value={score.aiJudgment} />
                {phase === "bug_fix" && (
                  <ScoreBar label="Bugs Found" value={score.bugsFound} />
                )}
              </div>

              {/* Strengths & gaps */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Strengths
                  </div>
                  {score.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="text-xs text-muted-foreground bg-emerald-500/5 rounded px-2 py-1"
                    >
                      • {s}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-red-400 flex items-center gap-1">
                    <XCircle size={11} /> Gaps
                  </div>
                  {score.gaps.map((g, i) => (
                    <div
                      key={i}
                      className="text-xs text-muted-foreground bg-red-500/5 rounded px-2 py-1"
                    >
                      • {g}
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaching */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                <div className="text-xs font-medium text-blue-400 mb-1">
                  Meta Signal
                </div>
                <p className="text-xs text-muted-foreground">
                  {score.metaSignal}
                </p>
                <div className="text-xs font-medium text-blue-400 mt-2 mb-1">
                  Coaching
                </div>
                <p className="text-xs text-muted-foreground">
                  {score.coaching}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetSession}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                >
                  <RotateCcw size={13} /> Retry
                </button>
                <button
                  onClick={nextProblem}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
                >
                  Next Problem <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Session history */}
          {sessionHistory.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Trophy size={11} /> Session History
              </div>
              <div className="space-y-1">
                {sessionHistory.slice(-5).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground truncate">
                      {h.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`font-medium ${verdictColor(h.icLevel)}`}
                      >
                        {h.icLevel}
                      </span>
                      <span className="font-mono">{h.score.toFixed(1)}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
