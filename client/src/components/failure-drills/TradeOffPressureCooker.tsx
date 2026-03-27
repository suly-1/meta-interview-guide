import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Flame } from "lucide-react";

const DECISIONS = [
  "SQL vs NoSQL for a messaging inbox with 100M users",
  "Kafka vs SQS for an event streaming pipeline",
  "Microservices vs monolith for a 10-engineer startup",
  "Redis vs Memcached for a distributed session cache",
  "REST vs GraphQL for a mobile app API",
  "Eventual consistency vs strong consistency for a shopping cart",
  "Synchronous vs asynchronous processing for order fulfillment",
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function TradeOffPressureCooker({ onComplete }: Props) {
  const [phase, setPhase] = useState<
    "intro" | "position" | "challenge" | "defense" | "result"
  >("intro");
  const [decision] = useState(
    () => DECISIONS[Math.floor(Math.random() * DECISIONS.length)]
  );
  const [position, setPosition] = useState("");
  const [challenge, setChallenge] = useState("");
  const [weakAssumption, setWeakAssumption] = useState("");
  const [defense, setDefense] = useState("");

  const challengeMutation =
    trpc.failureDrills.generateTradeOffChallenge.useMutation();
  const scoreMutation = trpc.failureDrills.scoreTradeOffDefense.useMutation();

  const handleGetChallenge = () => {
    challengeMutation.mutate(
      { decision, position },
      {
        onSuccess: data => {
          setChallenge(data.challenge);
          setWeakAssumption(data.weakAssumption);
          setPhase("challenge");
        },
      }
    );
  };

  const handleSubmitDefense = () => {
    scoreMutation.mutate(
      { decision, originalPosition: position, challenge, defense },
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
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="font-semibold text-orange-400 text-sm">
              Trade-Off Pressure Cooker
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Take a position on a design decision in 60 seconds. The AI
            immediately challenges your weakest assumption. You must defend,
            adapt, or concede with reasoning.
          </p>
        </div>
        <Button
          onClick={() => setPhase("position")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "position") {
    return (
      <div className="space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <p className="text-xs text-orange-400 font-medium uppercase tracking-wide mb-1">
            Design Decision
          </p>
          <p className="text-sm font-medium text-foreground">{decision}</p>
          <p className="text-xs text-muted-foreground mt-1">
            State your position and reasoning. Be specific about trade-offs.
          </p>
        </div>
        <Textarea
          value={position}
          onChange={e => setPosition(e.target.value)}
          placeholder="I would choose X because... The key trade-offs are... This works well when..."
          rows={5}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={handleGetChallenge}
          disabled={position.trim().length < 30 || challengeMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {challengeMutation.isPending
            ? "Generating challenge..."
            : "Submit Position → Get Challenged"}
        </Button>
      </div>
    );
  }

  if (phase === "challenge") {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <Badge className="bg-red-500/20 text-red-300 border-0 text-xs mb-2">
            Interviewer Challenge
          </Badge>
          <p className="text-sm font-semibold text-foreground">
            &quot;{challenge}&quot;
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Targeting: {weakAssumption}
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Your original position
          </p>
          <p className="text-xs text-muted-foreground">{position}</p>
        </div>
        <Textarea
          value={defense}
          onChange={e => setDefense(e.target.value)}
          placeholder="Defend your position, concede if wrong, or adapt with new reasoning..."
          rows={5}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={handleSubmitDefense}
          disabled={defense.trim().length < 20 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit Defense"}
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
          <span className="font-semibold">Defense Score</span>
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
            ✓ Strong defense moves
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
            <AlertTriangle size={12} /> Weak points
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
          setPosition("");
          setChallenge("");
          setDefense("");
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
