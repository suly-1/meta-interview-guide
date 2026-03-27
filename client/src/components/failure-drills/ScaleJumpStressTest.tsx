import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

const SCENARIOS = [
  { prompt: "Design a URL shortener", from: 1000, to: 100000 },
  { prompt: "Design a user authentication service", from: 500, to: 50000 },
  { prompt: "Design a product catalog API", from: 2000, to: 200000 },
  { prompt: "Design a real-time leaderboard", from: 1000, to: 100000 },
  { prompt: "Design a file upload service", from: 100, to: 10000 },
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function ScaleJumpStressTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "phase1" | "phase2" | "result">(
    "intro"
  );
  const [scenario] = useState(
    () => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
  );
  const [design1, setDesign1] = useState("");
  const [scaleResponse, setScaleResponse] = useState("");

  const scoreMutation = trpc.failureDrills.scoreScaleJump.useMutation();

  const handleSubmit = () => {
    scoreMutation.mutate(
      {
        originalDesign: design1,
        scaleResponse,
        fromRPS: scenario.from,
        toRPS: scenario.to,
      },
      {
        onSuccess: data => {
          setPhase("result");
          onComplete?.(data.score);
        },
      }
    );
  };

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-purple-400" />
            <span className="font-semibold text-purple-400 text-sm">
              Scale Jump Stress Test
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Two-phase drill. First, sketch a design at low RPS. Then the
            interviewer says <em>"now scale it 100x"</em> — you must identify
            what breaks and how to fix it.
          </p>
        </div>
        <Button
          onClick={() => setPhase("phase1")}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold"
        >
          Start Phase 1
        </Button>
      </div>
    );
  }

  if (phase === "phase1") {
    return (
      <div className="space-y-4">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">
              Phase 1 — {scenario.from.toLocaleString()} RPS
            </Badge>
          </div>
          <p className="text-sm font-medium">{scenario.prompt}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sketch your initial design for {scenario.from.toLocaleString()}{" "}
            requests/second.
          </p>
        </div>
        <Textarea
          value={design1}
          onChange={e => setDesign1(e.target.value)}
          placeholder="Describe your design: components, data stores, APIs, key decisions..."
          rows={6}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={() => setPhase("phase2")}
          disabled={design1.trim().length < 20}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white"
        >
          Submit Phase 1 → Scale Challenge
        </Button>
      </div>
    );
  }

  if (phase === "phase2") {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <Badge className="bg-red-500/20 text-red-300 border-0 text-xs mb-2">
            Interviewer Challenge
          </Badge>
          <p className="text-sm font-semibold text-foreground">
            "Now scale it to{" "}
            <span className="text-red-400">
              {scenario.to.toLocaleString()} RPS
            </span>{" "}
            — what breaks first and what do you change?"
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Your Phase 1 design
          </p>
          <p className="text-xs text-muted-foreground">{design1}</p>
        </div>
        <Textarea
          value={scaleResponse}
          onChange={e => setScaleResponse(e.target.value)}
          placeholder="What breaks first? What changes? (DB sharding, caching, async queues, CDN, horizontal scaling...)"
          rows={6}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          disabled={scaleResponse.trim().length < 20 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit Scale Response"}
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
          <span className="font-semibold">Scale Analysis Score</span>
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
            ✓ Strong scaling moves
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
          setDesign1("");
          setScaleResponse("");
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
