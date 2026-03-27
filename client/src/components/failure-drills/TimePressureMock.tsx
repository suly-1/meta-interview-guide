import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Timer, Clock } from "lucide-react";

const PROBLEMS = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    timeLimit: 600,
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume exactly one solution exists.",
  },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    timeLimit: 600,
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
  },
  {
    title: "Merge Intervals",
    difficulty: "Medium",
    timeLimit: 900,
    description:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.",
  },
  {
    title: "LRU Cache",
    difficulty: "Medium",
    timeLimit: 1200,
    description:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get(key) and put(key, value) with O(1) time complexity.",
  },
  {
    title: "Word Search",
    difficulty: "Medium",
    timeLimit: 1200,
    description:
      "Given an m x n grid of characters board and a string word, return true if word exists in the grid. The word can be constructed from letters of sequentially adjacent cells.",
  },
];

const CHECKPOINTS = [
  {
    pct: 25,
    message: "25% time used — have you stated your approach and edge cases?",
  },
  {
    pct: 50,
    message:
      "Halfway — your solution should be taking shape. Are you on track?",
  },
  {
    pct: 75,
    message: "75% time used — wrap up implementation and start testing.",
  },
  {
    pct: 90,
    message: "90% time used — finish up and walk through your solution.",
  },
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function TimePressureMock({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [problem] = useState(
    () => PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)]
  );
  const [solution, setSolution] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [shownCheckpoints, setShownCheckpoints] = useState<number[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreMutation = trpc.failureDrills.scoreTimePressureMock.useMutation();

  useEffect(() => {
    if (phase === "active") {
      setTimeLeft(problem.timeLimit);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(e => {
          const newElapsed = e + 1;
          const pctUsed = (newElapsed / problem.timeLimit) * 100;
          CHECKPOINTS.forEach(cp => {
            if (pctUsed >= cp.pct && !shownCheckpoints.includes(cp.pct)) {
              setShownCheckpoints(prev => [...prev, cp.pct]);
              setActiveCheckpoint(cp.message);
              setTimeout(() => setActiveCheckpoint(null), 5000);
            }
          });
          return newElapsed;
        });
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(problem.timeLimit);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleSubmit = (elapsed?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    scoreMutation.mutate(
      {
        problem: problem.title,
        code: solution,
        statusUpdate: `Submitted after ${Math.round((elapsed ?? elapsedSeconds) / 60)} minutes. ${solution.length > 200 ? "Solution appears complete." : "Partial solution."}`,
        verbalWalkthrough: `My approach: ${solution.split("\n").slice(0, 3).join(" ")}`,
        elapsedSeconds: elapsed ?? elapsedSeconds,
      },
      {
        onSuccess: data => {
          setPhase("result");
          onComplete?.(data.score);
        },
      }
    );
  };

  const pctUsed =
    problem.timeLimit > 0 ? (elapsedSeconds / problem.timeLimit) * 100 : 0;
  const timerColor =
    timeLeft > problem.timeLimit * 0.3
      ? "text-emerald-400"
      : timeLeft > problem.timeLimit * 0.1
        ? "text-amber-400"
        : "text-red-400";
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <span className="font-semibold text-blue-400 text-sm">
              Time Pressure Mock
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            A real coding problem with a strict time limit. The AI paces you
            with checkpoint reminders at 25%, 50%, 75%, and 90% of time used.
            Scored on solution quality, time management, and edge case coverage.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
            Problem preview
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{problem.title}</span>
            <Badge
              className={`text-xs border-0 ${problem.difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}
            >
              {problem.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Timer size={10} className="mr-1" />
              {Math.floor(problem.timeLimit / 60)} min
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => setPhase("active")}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          Start Timer
        </Button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-muted-foreground" />
            <span className={`font-mono font-bold text-xl ${timerColor}`}>
              {mins}:{String(secs).padStart(2, "0")}
            </span>
          </div>
          <Progress value={pctUsed} className="w-32 h-2" />
        </div>

        {activeCheckpoint && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 animate-pulse">
            ⏱ {activeCheckpoint}
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{problem.title}</span>
            <Badge
              className={`text-xs border-0 ${problem.difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}
            >
              {problem.difficulty}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{problem.description}</p>
        </div>

        <Textarea
          value={solution}
          onChange={e => setSolution(e.target.value)}
          placeholder={
            "# 1. Clarify edge cases\n# 2. State approach + complexity\n# 3. Write solution\n# 4. Test with examples\n\ndef solution(...):\n    pass"
          }
          rows={10}
          className="text-sm resize-none font-mono"
          autoFocus
        />

        <Button
          onClick={() => handleSubmit()}
          disabled={solution.trim().length < 20 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit Solution"}
        </Button>
      </div>
    );
  }

  const result = scoreMutation.data;
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="font-semibold">Time Pressure Score</span>
        </div>
        <span
          className={`text-3xl font-bold ${result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"}`}
        >
          {result.score}
        </span>
      </div>
      <Progress value={result.score} className="h-3" />
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-lg font-bold">{Math.round(result.score * 0.6)}</p>
          <p className="text-xs text-muted-foreground">Code Quality</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-lg font-bold">{Math.round(result.score * 0.4)}</p>
          <p className="text-xs text-muted-foreground">Time Mgmt</p>
        </div>
      </div>
      <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
        {result.feedback}
      </div>
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Strong points
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.strengths.map((s: string, i: number) => (
              <Badge
                key={i}
                className="bg-emerald-500/20 text-emerald-300 text-xs border-0"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {result.missed.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Missed
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missed.map((m: string, i: number) => (
              <Badge
                key={i}
                className="bg-amber-500/20 text-amber-300 text-xs border-0"
              >
                {m}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={() => {
          setPhase("intro");
          setSolution("");
          setElapsedSeconds(0);
          setShownCheckpoints([]);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
