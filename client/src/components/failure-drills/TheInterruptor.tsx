import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

const PROMPTS = [
  "Design a distributed rate limiter for an API gateway serving 100K RPS.",
  "Walk me through how you'd design the storage layer for a global messaging app.",
  "Design a real-time collaborative document editing system like Google Docs.",
  "Walk me through designing a search autocomplete system for a large e-commerce platform.",
];

interface Turn {
  role: "interviewer" | "candidate";
  content: string;
}

interface Props {
  onComplete?: (score: number) => void;
}

export default function TheInterruptor({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [prompt] = useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [startTime] = useState(() => Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);

  const startMutation = trpc.failureDrills.startLiveMock.useMutation();
  const continueMutation = trpc.failureDrills.continueLiveMock.useMutation();
  const scoreMutation = trpc.failureDrills.scoreLiveMock.useMutation();

  const handleStart = () => {
    startMutation.mutate(
      { drillId: "interruptor", topic: prompt },
      {
        onSuccess: data => {
          setTurns([{ role: "interviewer", content: data.message }]);
          setPhase("active");
          setTimeout(
            () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            100
          );
        },
      }
    );
  };

  const handleSend = () => {
    if (!currentInput.trim()) return;
    const candidateTurn: Turn = { role: "candidate", content: currentInput };
    const newTurns = [...turns, candidateTurn];
    setTurns(newTurns);
    setCurrentInput("");

    const candidateTurnCount = newTurns.filter(
      t => t.role === "candidate"
    ).length;
    if (candidateTurnCount < 5) {
      continueMutation.mutate(
        {
          drillId: "interruptor",
          topic: prompt,
          history: turns,
          candidateResponse: currentInput,
          turnNumber: candidateTurnCount,
        },
        {
          onSuccess: data => {
            setTurns(prev => [
              ...prev,
              { role: "interviewer", content: data.message },
            ]);
            setTimeout(
              () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
              100
            );
          },
        }
      );
    }
  };

  const handleFinish = () => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    scoreMutation.mutate(
      {
        drillId: "interruptor",
        topic: prompt,
        history: turns,
        elapsedSeconds: elapsed,
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
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-red-400" />
            <span className="font-semibold text-red-400 text-sm">
              The Interruptor
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Start explaining your system design. Every 2–3 turns, the AI
            interviewer cuts you off mid-thought with a sharp technical
            challenge. You must answer the interruption, then resume your
            explanation. Scored on recovery quality and thread retention.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            What gets scored
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• How cleanly you answer the interruption</li>
            <li>• Whether you recover and resume your explanation</li>
            <li>• Technical accuracy of your interruption responses</li>
            <li>• Whether you lose your thread or stay structured</li>
          </ul>
        </div>
        <Button
          onClick={handleStart}
          disabled={startMutation.isPending}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          {startMutation.isPending ? "Setting up..." : "Start Mock"}
        </Button>
      </div>
    );
  }

  if (phase === "active") {
    const candidateTurns = turns.filter(t => t.role === "candidate").length;
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-1">
            Design Prompt
          </p>
          <p className="text-sm font-medium text-foreground">{prompt}</p>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {turns.map((turn, i) => (
            <div
              key={i}
              className={`flex gap-2 ${turn.role === "candidate" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  turn.role === "candidate"
                    ? "bg-blue-500/20 text-blue-100"
                    : "bg-red-500/20 border border-red-500/40 text-red-100"
                }`}
              >
                {turn.role === "interviewer" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Zap size={10} className="text-red-400" />
                    <span className="text-xs text-red-400 font-medium">
                      Interruptor
                    </span>
                  </div>
                )}
                <p>{turn.content}</p>
              </div>
            </div>
          ))}
          {continueMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 animate-pulse">
                Preparing interruption...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <Textarea
          value={currentInput}
          onChange={e => setCurrentInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Continue your explanation... (Enter to send)"
          rows={3}
          className="text-sm resize-none"
          disabled={continueMutation.isPending}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!currentInput.trim() || continueMutation.isPending}
            className="flex-1"
          >
            <MessageSquare size={14} className="mr-1.5" /> Send
          </Button>
          <Button
            onClick={handleFinish}
            disabled={candidateTurns < 3 || scoreMutation.isPending}
            variant="outline"
          >
            {scoreMutation.isPending ? "Scoring..." : "End & Score"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {candidateTurns} response{candidateTurns !== 1 ? "s" : ""} sent
        </p>
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
          <span className="font-semibold">Interruptor Score</span>
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
            ✓ Strong moments
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
            <AlertTriangle size={12} /> Weak moments
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
          setTurns([]);
        }}
        variant="outline"
        className="w-full"
      >
        <RotateCcw size={14} className="mr-1.5" /> Try Again
      </Button>
    </div>
  );
}
