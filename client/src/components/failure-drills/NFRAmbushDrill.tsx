import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Timer, Plus, X, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

const PROMPTS = [
  "Design a real-time feed ranking service for a social network with 500M DAU",
  "Design a distributed notification system that handles 1M push notifications per minute",
  "Design a global content delivery network for video streaming",
  "Design a ride-sharing matching system for a city with 100K concurrent drivers",
  "Design a distributed key-value store used as a session cache",
  "Design a payment processing system handling 10K transactions per second",
  "Design a search autocomplete system for an e-commerce platform",
];

const NFR_CATEGORIES = [
  "Latency / Response time",
  "Throughput / RPS",
  "Availability / Uptime SLA",
  "Durability / Data loss tolerance",
  "Consistency model",
  "Scalability approach",
  "Security / Auth",
  "Observability / Monitoring",
  "Cost constraints",
  "Compliance / Regulatory",
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function NFRAmbushDrill({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [prompt] = useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  );
  const [nfrs, setNfrs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreMutation = trpc.failureDrills.scoreNFRAmbush.useMutation();

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(90);
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

  const addNFR = () => {
    const trimmed = input.trim();
    if (trimmed && !nfrs.includes(trimmed)) {
      setNfrs(prev => [...prev, trimmed]);
      setInput("");
    }
  };

  const handleSubmit = (elapsed?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const used = elapsed ?? elapsedSeconds;
    scoreMutation.mutate(
      { prompt, nfrs, elapsedSeconds: used },
      {
        onSuccess: data => {
          setPhase("result");
          onComplete?.(data.score);
        },
      }
    );
  };

  const timerColor =
    timeLeft > 30
      ? "text-emerald-400"
      : timeLeft > 10
        ? "text-amber-400"
        : "text-red-400";

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-amber-400" />
            <span className="font-semibold text-amber-400 text-sm">
              NFR Ambush Drill
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll be given a system design prompt. Enumerate as many
            Non-Functional Requirements as possible in{" "}
            <strong className="text-foreground">90 seconds</strong>. The AI
            scores your coverage against 8–12 expected NFRs.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            NFR categories to consider
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NFR_CATEGORIES.map(c => (
              <Badge key={c} variant="outline" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setPhase("active")}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          Start 90-Second Timer
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
          <Progress value={(timeLeft / 90) * 100} className="w-32 h-2" />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mb-1">
            Design Prompt
          </p>
          <p className="text-sm font-medium text-foreground">{prompt}</p>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addNFR()}
              placeholder="Type an NFR and press Enter..."
              className="flex-1 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={addNFR} variant="outline">
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[40px]">
            {nfrs.map((nfr, i) => (
              <Badge key={i} variant="secondary" className="gap-1 text-xs">
                {nfr}
                <button
                  onClick={() =>
                    setNfrs(prev => prev.filter((_, j) => j !== i))
                  }
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {nfrs.length} NFR{nfrs.length !== 1 ? "s" : ""} listed
          </p>
        </div>

        <Button
          onClick={() => handleSubmit()}
          disabled={nfrs.length === 0 || scoreMutation.isPending}
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
          <span className="font-semibold">NFR Coverage Score</span>
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
            ✓ Covered well
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

      <div>
        <p className="text-xs text-muted-foreground mb-1.5">
          Your NFRs ({nfrs.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {nfrs.map((n, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {n}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        onClick={() => {
          setPhase("intro");
          setNfrs([]);
          setTimeLeft(90);
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
