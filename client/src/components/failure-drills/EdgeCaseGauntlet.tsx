import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Timer,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from "lucide-react";

const PROBLEMS = [
  "Merge k sorted linked lists",
  "Find the longest substring without repeating characters",
  "Serialize and deserialize a binary tree",
  "Design a LRU cache",
  "Find all permutations of a string",
  "Implement a stack that supports getMin() in O(1)",
  "Count islands in a 2D grid",
  "Validate a balanced parentheses string",
];

const EDGE_CASE_HINTS = [
  "Empty / null input",
  "Single element",
  "All duplicates",
  "Integer overflow",
  "Negative numbers",
  "Max constraints (10^9)",
  "Unsorted / random order",
  "Circular references",
  "Concurrent access",
  "Invalid types / format",
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function EdgeCaseGauntlet({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [problem] = useState(
    () => PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)]
  );
  const [edgeCases, setEdgeCases] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreMutation = trpc.failureDrills.scoreEdgeCaseGauntlet.useMutation();

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(60);
            return 0;
          }
          return t - 1;
        });
        setElapsedSeconds(e => e + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const addCase = () => {
    const trimmed = input.trim();
    if (trimmed && !edgeCases.includes(trimmed)) {
      setEdgeCases(prev => [...prev, trimmed]);
      setInput("");
    }
  };

  const handleSubmit = (elapsed?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    scoreMutation.mutate(
      { problem, edgeCases, elapsedSeconds: elapsed ?? elapsedSeconds },
      {
        onSuccess: data => {
          setPhase("result");
          onComplete?.(data.score);
        },
      }
    );
  };

  const timerColor =
    timeLeft > 20
      ? "text-emerald-400"
      : timeLeft > 10
        ? "text-amber-400"
        : "text-red-400";

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-cyan-400" />
            <span className="font-semibold text-cyan-400 text-sm">
              Edge Case Gauntlet
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll get a coding problem. List as many edge cases as possible in{" "}
            <strong className="text-foreground">60 seconds</strong> — before
            writing any code. The AI scores your coverage against 10 canonical
            edge cases.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Edge case categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EDGE_CASE_HINTS.map(c => (
              <Badge key={c} variant="outline" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setPhase("active")}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
        >
          Start 60-Second Timer
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
            <span className={`font-mono font-bold text-lg ${timerColor}`}>
              {timeLeft}s
            </span>
          </div>
          <Progress value={(timeLeft / 60) * 100} className="w-32 h-2" />
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <p className="text-xs text-cyan-400 font-medium uppercase tracking-wide mb-1">
            Problem
          </p>
          <p className="text-sm font-medium text-foreground">{problem}</p>
          <p className="text-xs text-muted-foreground mt-1">
            List edge cases — do NOT write code yet.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCase()}
              placeholder="Type an edge case and press Enter..."
              className="flex-1 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={addCase} variant="outline">
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[40px]">
            {edgeCases.map((ec, i) => (
              <Badge key={i} variant="secondary" className="gap-1 text-xs">
                {ec}
                <button
                  onClick={() =>
                    setEdgeCases(prev => prev.filter((_, j) => j !== i))
                  }
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {edgeCases.length} edge case{edgeCases.length !== 1 ? "s" : ""}{" "}
            listed
          </p>
        </div>

        <Button
          onClick={() => handleSubmit()}
          disabled={edgeCases.length === 0 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit & Score"}
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
          <span className="font-semibold">Edge Case Coverage</span>
        </div>
        <span
          className={`text-3xl font-bold ${result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"}`}
        >
          {result.score}
        </span>
      </div>
      <Progress value={result.score} className="h-3" />
      <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
        {result.feedback}
      </div>
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Good catches
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
          setEdgeCases([]);
          setTimeLeft(60);
          setElapsedSeconds(0);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
