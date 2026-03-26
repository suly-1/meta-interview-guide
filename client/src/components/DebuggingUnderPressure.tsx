/**
 * Debugging Under Time Pressure — Priority #4
 * 20 pre-built buggy codebases (type casting, off-by-one, incorrect conditionals).
 * Candidate has 8 minutes to find and fix each bug.
 * Tracks hit rate and average time-to-fix.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  useDebuggingHistory,
  type DebuggingSession,
} from "@/hooks/useLocalStorage";
import {
  Bug,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ArrowRight,
  BarChart2,
  Zap,
  AlertTriangle,
  Trophy,
} from "lucide-react";

// ── 20 pre-built buggy codebases ──────────────────────────────────────────────
const DEBUGGING_CHALLENGES = [
  {
    id: "d1",
    title: "Off-by-one in array bounds",
    bugType: "off-by-one",
    difficulty: "Easy",
    description:
      "This function should return the last element of an array. It crashes on some inputs.",
    code: `def get_last_element(arr):
    if not arr:
        return None
    return arr[len(arr)]  # BUG: index out of bounds

# get_last_element([1, 2, 3]) should return 3
# get_last_element([]) should return None`,
    hint: "Array indices in Python are 0-based. What's the valid range?",
  },
  {
    id: "d2",
    title: "Wrong comparison operator",
    bugType: "incorrect-conditional",
    difficulty: "Easy",
    description:
      "This function checks if a number is within a valid range. It returns wrong results.",
    code: `def is_valid_age(age):
    """Return True if age is between 0 and 150 inclusive."""
    return 0 <= age <= 150  # This looks correct...

def is_valid_score(score):
    """Return True if score is between 0 and 100 inclusive."""
    if score > 0 and score < 100:  # BUG: should be >= 0 and <= 100
        return True
    return False

# is_valid_score(0) should return True, returns False
# is_valid_score(100) should return True, returns False`,
    hint: "Check the boundary conditions. Should 0 and 100 be included?",
  },
  {
    id: "d3",
    title: "Integer division precision loss",
    bugType: "type-cast",
    difficulty: "Easy",
    description:
      "This function calculates a percentage. It returns 0 for most inputs.",
    code: `def calculate_percentage(part, total):
    """Return the percentage of part out of total."""
    if total == 0:
        return 0
    return (part / total) * 100  # This looks correct...

def calculate_completion_rate(completed, total):
    """Return completion rate as a percentage."""
    if total == 0:
        return 0
    return (completed // total) * 100  # BUG: integer division

# calculate_completion_rate(3, 10) should return 30.0, returns 0
# calculate_completion_rate(10, 10) should return 100.0, returns 100`,
    hint: "What's the difference between // and / in Python? What does integer division do to fractions?",
  },
  {
    id: "d4",
    title: "Missing null check",
    bugType: "null-pointer",
    difficulty: "Easy",
    description:
      "This function processes user data. It crashes when optional fields are missing.",
    code: `def get_user_display_name(user: dict) -> str:
    """Return display name: full name if available, else username."""
    full_name = user.get("full_name")
    if full_name.strip():  # BUG: full_name could be None
        return full_name
    return user.get("username", "Unknown")

# user = {"username": "john_doe"} → crashes with AttributeError
# user = {"username": "john_doe", "full_name": "John Doe"} → works`,
    hint: "What happens when you call .strip() on None? How do you check for None first?",
  },
  {
    id: "d5",
    title: "Mutable default argument",
    bugType: "python-gotcha",
    difficulty: "Medium",
    description:
      "This function appends items to a list. It behaves unexpectedly on repeated calls.",
    code: `def add_item(item, items=[]):  # BUG: mutable default argument
    """Add item to the list and return it."""
    items.append(item)
    return items

# First call: add_item("a") → ["a"] ✓
# Second call: add_item("b") → ["a", "b"] ✗ (expected ["b"])
# The default list is shared across all calls!`,
    hint: "In Python, default arguments are evaluated once at function definition. What should the default be instead?",
  },
  {
    id: "d6",
    title: "Wrong loop variable in nested loop",
    bugType: "logic-error",
    difficulty: "Medium",
    description:
      "This function checks if a matrix is symmetric. It returns wrong results.",
    code: `def is_symmetric(matrix):
    """Return True if matrix[i][j] == matrix[j][i] for all i, j."""
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            if matrix[i][j] != matrix[i][j]:  # BUG: comparing element to itself
                return False
    return True

# [[1,2],[2,1]] should return True
# [[1,2],[3,1]] should return False, but returns True`,
    hint: "Look carefully at the comparison. Are you comparing the right elements?",
  },
  {
    id: "d7",
    title: "String concatenation in loop (O(n²))",
    bugType: "performance",
    difficulty: "Medium",
    description:
      "This function builds a CSV string. It's correct but extremely slow for large inputs.",
    code: `def list_to_csv(items: list) -> str:
    """Convert a list of items to a CSV string."""
    result = ""
    for i, item in enumerate(items):
        result += str(item)  # BUG: O(n²) string concatenation
        if i < len(items) - 1:
            result += ","
    return result

# list_to_csv([1, 2, 3]) → "1,2,3" (correct but slow)
# For 100,000 items this takes ~10 seconds instead of <1ms`,
    hint: "String concatenation in Python creates a new string each time. What built-in method joins a list of strings efficiently?",
  },
  {
    id: "d8",
    title: "Incorrect dictionary update",
    bugType: "logic-error",
    difficulty: "Medium",
    description:
      "This function counts word frequencies. It undercounts some words.",
    code: `def count_words(text: str) -> dict:
    """Return a dictionary of word frequencies."""
    counts = {}
    for word in text.lower().split():
        if word not in counts:
            counts[word] = 1
        else:
            counts[word] = 1  # BUG: should be counts[word] + 1
    return counts

# "hello world hello" should return {"hello": 2, "world": 1}
# Returns {"hello": 1, "world": 1}`,
    hint: "What should happen when a word is seen for the second time?",
  },
  {
    id: "d9",
    title: "Stack overflow in recursion",
    bugType: "recursion",
    difficulty: "Medium",
    description:
      "This recursive function should compute factorial. It crashes for any input.",
    code: `def factorial(n: int) -> int:
    """Return n! (n factorial)."""
    if n == 0:
        return 1
    return n * factorial(n)  # BUG: should be factorial(n - 1)

# factorial(5) should return 120
# Currently causes infinite recursion`,
    hint: "What argument should be passed to the recursive call? The function needs to make progress toward the base case.",
  },
  {
    id: "d10",
    title: "Shallow copy vs deep copy",
    bugType: "reference-error",
    difficulty: "Hard",
    description:
      "This function should return a modified copy of a nested list. It modifies the original instead.",
    code: `def add_row(matrix: list, new_row: list) -> list:
    """Return a new matrix with new_row appended. Don't modify original."""
    new_matrix = matrix.copy()  # BUG: shallow copy, inner lists still shared
    new_matrix.append(new_row)
    return new_matrix

# original = [[1, 2], [3, 4]]
# result = add_row(original, [5, 6])
# result should be [[1,2],[3,4],[5,6]], original unchanged
# But: original[0].append(99) also modifies result[0]!`,
    hint: "What's the difference between copy() and deepcopy()? When does a shallow copy cause problems?",
  },
  {
    id: "d11",
    title: "Race condition in shared state",
    bugType: "concurrency",
    difficulty: "Hard",
    description: "This counter loses increments under concurrent access.",
    code: `import threading

counter = 0

def increment_counter(n: int):
    """Increment the global counter n times."""
    global counter
    for _ in range(n):
        temp = counter      # read
        temp += 1           # modify  
        counter = temp      # write  # BUG: not atomic, race condition

# With 2 threads each calling increment_counter(1000):
# Expected: counter = 2000
# Actual: counter < 2000 (some increments lost)`,
    hint: "The read-modify-write sequence is not atomic. What synchronization primitive prevents this?",
  },
  {
    id: "d12",
    title: "Wrong base case in recursion",
    bugType: "recursion",
    difficulty: "Easy",
    description:
      "This function computes the sum of a list recursively. It returns wrong results.",
    code: `def recursive_sum(arr: list) -> int:
    """Return the sum of all elements in arr."""
    if len(arr) == 1:  # BUG: wrong base case, fails for empty list
        return arr[0]
    return arr[0] + recursive_sum(arr[1:])

# recursive_sum([1, 2, 3]) → 6 ✓
# recursive_sum([]) → IndexError: list index out of range`,
    hint: "What is the correct base case? What should the sum of an empty list be?",
  },
  {
    id: "d13",
    title: "Incorrect string slicing",
    bugType: "off-by-one",
    difficulty: "Easy",
    description: "This function reverses a string. It returns an empty string.",
    code: `def reverse_string(s: str) -> str:
    """Return the reverse of string s."""
    result = ""
    for i in range(len(s), 0, -1):  # BUG: should be range(len(s)-1, -1, -1)
        result += s[i]
    return result

# reverse_string("hello") should return "olleh"
# Currently raises IndexError: string index out of range`,
    hint: "What are the valid indices for a string of length n? What does range(len(s), 0, -1) produce?",
  },
  {
    id: "d14",
    title: "Missing return in conditional",
    bugType: "logic-error",
    difficulty: "Easy",
    description:
      "This function finds the maximum of two numbers. It sometimes returns None.",
    code: `def find_max(a: int, b: int) -> int:
    """Return the larger of a and b."""
    if a > b:
        return a
    elif a < b:
        return b
    # BUG: missing else clause for when a == b
    # Returns None when a == b

# find_max(3, 5) → 5 ✓
# find_max(5, 3) → 5 ✓  
# find_max(4, 4) → None ✗`,
    hint: "What should the function return when both numbers are equal? Is there a missing case?",
  },
  {
    id: "d15",
    title: "Incorrect list comprehension filter",
    bugType: "logic-error",
    difficulty: "Medium",
    description:
      "This function filters even numbers. It returns odd numbers instead.",
    code: `def get_even_numbers(numbers: list) -> list:
    """Return only the even numbers from the list."""
    return [n for n in numbers if n % 2 != 0]  # BUG: != should be ==

# get_even_numbers([1, 2, 3, 4, 5]) should return [2, 4]
# Returns [1, 3, 5] instead`,
    hint: "What does the modulo operator return for even numbers? Is the condition checking for even or odd?",
  },
  {
    id: "d16",
    title: "Wrong variable in accumulator",
    bugType: "logic-error",
    difficulty: "Easy",
    description:
      "This function finds the minimum value in a list. It always returns the first element.",
    code: `def find_minimum(arr: list):
    """Return the minimum value in the list."""
    if not arr:
        return None
    min_val = arr[0]
    for num in arr:
        if num < min_val:
            min_val = num  # This looks correct...
    return arr[0]  # BUG: should return min_val

# find_minimum([3, 1, 4, 1, 5]) should return 1
# Returns 3 (the first element)`,
    hint: "The loop correctly updates min_val, but what does the function actually return?",
  },
  {
    id: "d17",
    title: "Incorrect modulo for negative numbers",
    bugType: "type-cast",
    difficulty: "Medium",
    description:
      "This function checks if a number is divisible by 3. It fails for negative numbers.",
    code: `def is_divisible_by_3(n: int) -> bool:
    """Return True if n is divisible by 3."""
    return n % 3 == 0  # This is actually correct in Python...

def get_day_of_week(day_number: int) -> str:
    """Return day name for day_number (0=Monday). Handles negative offsets."""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    index = day_number % 7  # This is correct in Python
    if index < 0:  # BUG: Python % always returns non-negative, this branch never executes
        index += 7  # Dead code
    return days[index]

# get_day_of_week(-1) should return "Sunday"
# In Python this works correctly, but the dead code suggests a C/Java mindset bug`,
    hint: "In Python, the modulo operator always returns a non-negative result for positive divisors. The dead code reveals a misunderstanding of Python's behavior.",
  },
  {
    id: "d18",
    title: "Forgot to reset accumulator",
    bugType: "logic-error",
    difficulty: "Medium",
    description:
      "This function groups consecutive duplicates. It produces incorrect groupings.",
    code: `def group_consecutive(arr: list) -> list:
    """Group consecutive equal elements: [1,1,2,3,3] → [[1,1],[2],[3,3]]"""
    if not arr:
        return []
    groups = []
    current_group = [arr[0]]
    for item in arr[1:]:
        if item == current_group[-1]:
            current_group.append(item)
        else:
            groups.append(current_group)
            current_group = []  # BUG: should be current_group = [item]
    groups.append(current_group)
    return groups

# [1,1,2,3,3] should return [[1,1],[2],[3,3]]
# Returns [[1,1],[],[3,3]] — the [2] group is empty`,
    hint: "When starting a new group, what should it contain? The first element of the new group is already known.",
  },
  {
    id: "d19",
    title: "Incorrect set operation",
    bugType: "logic-error",
    difficulty: "Medium",
    description:
      "This function finds common elements between two lists. It returns all elements instead.",
    code: `def find_common_elements(list1: list, list2: list) -> list:
    """Return elements that appear in both lists."""
    set1 = set(list1)
    set2 = set(list2)
    return list(set1 | set2)  # BUG: | is union, should be & (intersection)

# find_common_elements([1,2,3], [2,3,4]) should return [2,3]
# Returns [1,2,3,4] instead`,
    hint: "What's the difference between set union (|) and set intersection (&)?",
  },
  {
    id: "d20",
    title: "Incorrect early return",
    bugType: "logic-error",
    difficulty: "Hard",
    description:
      "This function checks if all elements in a list satisfy a condition. It returns wrong results.",
    code: `def all_positive(numbers: list) -> bool:
    """Return True if all numbers are positive (> 0)."""
    for num in numbers:
        if num > 0:
            return True  # BUG: returns True on first positive, should continue checking
    return False

# all_positive([1, 2, 3]) should return True ✓
# all_positive([1, -2, 3]) should return False, returns True ✗
# all_positive([]) should return True (vacuous truth), returns False ✗`,
    hint: "When should you return True vs False in a 'check all elements' function? Think about what early return means here.",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type SessionState = "idle" | "running" | "scoring" | "scored";

interface AttemptResult {
  bugFound: boolean;
  fixCorrect: boolean;
  newBugsIntroduced: boolean;
  score: number;
  timeRating: string;
  bugExplanation: string;
  fixQuality: string;
  coaching: string;
  metaPhase1Signal: string;
}

interface SessionStats {
  total: number;
  correct: number;
  avgTimeSeconds: number;
  fastCount: number;
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function useTimer(limitSeconds: number) {
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

  const remaining = Math.max(0, limitSeconds - elapsed);
  const isOverTime = elapsed > limitSeconds;
  return { elapsed, remaining, running, isOverTime, start, stop, reset };
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ diff }: { diff: string }) {
  const color =
    diff === "Easy"
      ? "bg-emerald-500/20 text-emerald-300"
      : diff === "Medium"
        ? "bg-amber-500/20 text-amber-300"
        : "bg-red-500/20 text-red-300";
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>
      {diff}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DebuggingUnderPressure() {
  const [expanded, setExpanded] = useState(false);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    correct: 0,
    avgTimeSeconds: 0,
    fastCount: 0,
  });
  const [attempts, setAttempts] = useState<
    { title: string; correct: boolean; time: number; score: number }[]
  >([]);
  const [, setDebugHistory] = useDebuggingHistory();

  const LIMIT = 8 * 60; // 8 minutes
  const timer = useTimer(LIMIT);
  const challenge =
    DEBUGGING_CHALLENGES[challengeIdx % DEBUGGING_CHALLENGES.length];

  const scoreMutation = trpc.ai.debuggingScore.useMutation({
    onSuccess: data => {
      setResult(data);
      setSessionState("scored");
      timer.stop();
      const timeSpent = timer.elapsed;
      const correct =
        data.bugFound && data.fixCorrect && !data.newBugsIntroduced;
      setAttempts(a => [
        ...a,
        { title: challenge.title, correct, time: timeSpent, score: data.score },
      ]);
      setStats(s => {
        const newTotal = s.total + 1;
        const newCorrect = s.correct + (correct ? 1 : 0);
        const newAvg = (s.avgTimeSeconds * s.total + timeSpent) / newTotal;
        const newFast = s.fastCount + (data.timeRating === "fast" ? 1 : 0);
        return {
          total: newTotal,
          correct: newCorrect,
          avgTimeSeconds: newAvg,
          fastCount: newFast,
        };
      });
      // Persist this attempt to localStorage history
      const session: DebuggingSession = {
        id: `debug-${Date.now()}`,
        date: new Date().toISOString(),
        problemId: challenge.id,
        problemTitle: challenge.title,
        language: "python",
        solved: correct,
        timeUsedSeconds: timeSpent,
        attempts: 1,
        feedback: data.bugExplanation ?? data.coaching ?? "",
      };
      setDebugHistory(h => [session, ...h].slice(0, 50)); // keep last 50
    },
    onError: () => {
      toast.error("Scoring failed. Please try again.");
      setSessionState("running");
    },
  });

  const startSession = () => {
    setCode(challenge.code);
    setResult(null);
    setShowHint(false);
    setSessionState("running");
    timer.reset();
    timer.start();
  };

  const submitFix = () => {
    if (!code.trim()) {
      toast.error("Please write your fix first.");
      return;
    }
    setSessionState("scoring");
    timer.stop();
    scoreMutation.mutate({
      bugTitle: challenge.title,
      bugDescription: challenge.description,
      originalCode: challenge.code,
      candidateFix: code,
      expectedBugType: challenge.bugType,
      timeSpentSeconds: timer.elapsed,
    });
  };

  const nextChallenge = () => {
    setChallengeIdx(i => i + 1);
    setSessionState("idle");
    setCode("");
    setResult(null);
    setShowHint(false);
    timer.reset();
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timeColor = timer.isOverTime
    ? "text-red-400"
    : timer.remaining < 60
      ? "text-amber-400"
      : "text-emerald-400";
  const hitRate =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  const timeRatingConfig: Record<string, { color: string; label: string }> = {
    fast: { color: "text-emerald-400", label: "Fast ⚡" },
    on_time: { color: "text-blue-400", label: "On Time ✓" },
    slow: { color: "text-amber-400", label: "Slow ⚠" },
    timeout: { color: "text-red-400", label: "Timeout ✗" },
  };

  return (
    <div className="prep-card mb-4" data-testid="debugging-under-pressure">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors rounded-t-lg"
      >
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Bug size={16} className="text-red-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              Debugging Under Time Pressure
            </span>
            <span
              className="badge text-xs"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              Priority #4
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            20 pre-built buggy codebases · 8-min timer · Meta Phase 1 format
          </p>
        </div>
        {stats.total > 0 && (
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-foreground">{hitRate}%</div>
            <div className="text-xs text-muted-foreground">hit rate</div>
          </div>
        )}
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Stats bar */}
          {stats.total > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "Hit Rate",
                  value: `${hitRate}%`,
                  color:
                    hitRate >= 80
                      ? "text-emerald-400"
                      : hitRate >= 60
                        ? "text-amber-400"
                        : "text-red-400",
                },
                {
                  label: "Solved",
                  value: `${stats.correct}/${stats.total}`,
                  color: "text-foreground",
                },
                {
                  label: "Avg Time",
                  value: formatTime(Math.round(stats.avgTimeSeconds)),
                  color: "text-foreground",
                },
                {
                  label: "Fast",
                  value: `${stats.fastCount}`,
                  color: "text-emerald-400",
                },
              ].map(s => (
                <div
                  key={s.label}
                  className="bg-secondary/30 rounded-md p-2 text-center border border-border"
                >
                  <div className={`text-sm font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Challenge card */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{challenge.title}</span>
                  <DiffBadge diff={challenge.difficulty} />
                  <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {challenge.bugType}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {challenge.description}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {(challengeIdx % DEBUGGING_CHALLENGES.length) + 1}/
                  {DEBUGGING_CHALLENGES.length}
                </span>
              </div>
            </div>
          </div>

          {sessionState === "idle" && (
            <button
              onClick={startSession}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
            >
              <Play size={14} /> Start Debug Challenge (8 min)
            </button>
          )}

          {(sessionState === "running" || sessionState === "scoring") && (
            <div className="space-y-3">
              {/* Timer */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-1.5 font-mono font-bold text-sm ${timeColor}`}
                >
                  <Clock size={13} />
                  {timer.isOverTime
                    ? `+${formatTime(timer.elapsed - LIMIT)} OVER`
                    : formatTime(timer.remaining)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHint(h => !h)}
                    className="text-xs text-amber-400 flex items-center gap-1 hover:text-amber-300"
                  >
                    <AlertTriangle size={11} /> {showHint ? "Hide" : "Show"}{" "}
                    hint
                  </button>
                  <button
                    onClick={() => {
                      setSessionState("idle");
                      timer.reset();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
              </div>

              {showHint && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-xs text-amber-200">
                  <AlertTriangle size={11} className="inline mr-1" />{" "}
                  {challenge.hint}
                </div>
              )}

              {/* Code editor */}
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full h-56 font-mono text-xs bg-[#0d1117] border border-border rounded-md p-3 focus:outline-none focus:border-red-500/50 resize-none text-green-300"
                spellCheck={false}
              />

              <button
                onClick={submitFix}
                disabled={sessionState === "scoring"}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {sessionState === "scoring" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Scoring...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Submit Fix
                  </>
                )}
              </button>
            </div>
          )}

          {sessionState === "scored" && result && (
            <div className="space-y-3">
              {/* Result banner */}
              <div
                className={`p-3 rounded-lg border ${result.bugFound && result.fixCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.bugFound &&
                    result.fixCorrect &&
                    !result.newBugsIntroduced ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                    <span className="font-medium text-sm">
                      {result.bugFound &&
                      result.fixCorrect &&
                      !result.newBugsIntroduced
                        ? "Bug Fixed!"
                        : "Not quite right"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${(timeRatingConfig[result.timeRating] ?? timeRatingConfig.slow).color}`}
                    >
                      {
                        (
                          timeRatingConfig[result.timeRating] ??
                          timeRatingConfig.slow
                        ).label
                      }
                    </span>
                    <span className="font-mono font-bold">
                      {result.score.toFixed(1)}/5
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1 ${result.bugFound ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {result.bugFound ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}{" "}
                    Bug found
                  </div>
                  <div
                    className={`flex items-center gap-1 ${result.fixCorrect ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {result.fixCorrect ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}{" "}
                    Fix correct
                  </div>
                  <div
                    className={`flex items-center gap-1 ${!result.newBugsIntroduced ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {!result.newBugsIntroduced ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}{" "}
                    No new bugs
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-secondary/30 rounded-md p-3 border border-border space-y-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    What the bug was:
                  </div>
                  <p className="text-xs text-foreground">
                    {result.bugExplanation}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Fix quality:
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.fixQuality}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-medium text-blue-400 mb-1">
                    Meta Phase 1 signal:
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.metaPhase1Signal}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-medium text-amber-400 mb-1">
                    Coaching:
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.coaching}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSessionState("idle");
                    timer.reset();
                    setResult(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                >
                  <RotateCcw size={13} /> Retry
                </button>
                <button
                  onClick={nextChallenge}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm transition-colors"
                >
                  Next Bug <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Attempt history */}
          {attempts.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Trophy size={11} /> Recent Attempts
              </div>
              <div className="space-y-1">
                {attempts.slice(-6).map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground truncate">
                      {a.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {a.correct ? (
                        <CheckCircle2 size={11} className="text-emerald-400" />
                      ) : (
                        <XCircle size={11} className="text-red-400" />
                      )}
                      <span className="text-muted-foreground">
                        {formatTime(a.time)}
                      </span>
                      <span className="font-mono">{a.score.toFixed(1)}/5</span>
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
