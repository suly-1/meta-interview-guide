import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  MessageSquare,
} from "lucide-react";

const SCENARIOS = [
  {
    id: "xfn1",
    role: "Product Manager",
    conflict:
      "The PM wants to ship a feature in 2 weeks that you estimate needs 6 weeks to do safely. They're citing a competitor launch and executive pressure.",
    stakes:
      "Missing the deadline could mean losing market share. Rushing could mean a production incident.",
  },
  {
    id: "xfn2",
    role: "Designer",
    conflict:
      "The designer insists on an animation-heavy UI that will require 3 new libraries and significantly impact performance. They have executive buy-in.",
    stakes:
      "The design is already approved. Pushing back could damage the relationship and delay the project.",
  },
  {
    id: "xfn3",
    role: "Data Scientist",
    conflict:
      "The data scientist wants to deploy a new ML model directly to production without a shadow mode test. They say the offline metrics are strong enough.",
    stakes:
      "The model could degrade user experience at scale. But the DS is senior and confident.",
  },
  {
    id: "xfn4",
    role: "Security Engineer",
    conflict:
      "The security team is blocking your launch because of a theoretical vulnerability that has never been exploited. The fix would take 4 weeks.",
    stakes:
      "Your launch is already delayed 2 months. The security concern is real but low-probability.",
  },
];

interface Turn {
  role: "you" | "xfn";
  content: string;
}

interface Props {
  onComplete?: (score: number) => void;
}

export default function XFNConflictSimulator({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [scenario] = useState(
    () => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const responseMutation = trpc.failureDrills.generateXFNResponse.useMutation();
  const scoreMutation = trpc.failureDrills.scoreXFNConflict.useMutation();

  const handleStart = () => {
    responseMutation.mutate(
      { scenarioId: scenario.id, history: [], turnNumber: 1 },
      {
        onSuccess: data => {
          setTurns([{ role: "xfn", content: data.response }]);
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
    const yourTurn: Turn = { role: "you", content: currentInput };
    const newTurns = [...turns, yourTurn];
    setTurns(newTurns);
    setCurrentInput("");

    const yourTurnCount = newTurns.filter(t => t.role === "you").length;
    if (yourTurnCount < 4) {
      responseMutation.mutate(
        {
          scenarioId: scenario.id,
          history: newTurns.map(t => ({ role: t.role, content: t.content })),
          turnNumber: yourTurnCount + 1,
        },
        {
          onSuccess: data => {
            setTurns(prev => [
              ...prev,
              { role: "xfn", content: data.response },
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
    scoreMutation.mutate(
      {
        scenarioId: scenario.id,
        turns: turns.map(t => ({ role: t.role, content: t.content })),
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
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-violet-400" />
            <span className="font-semibold text-violet-400 text-sm">
              XFN Conflict Simulator
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            The AI plays a cross-functional stakeholder (PM, Designer, Data
            Scientist, or Security) in a realistic conflict. Navigate the
            disagreement without damaging the relationship or compromising
            technical standards.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Scoring criteria
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Proposing concrete alternatives (not just saying no)</li>
            <li>• Acknowledging the other person&apos;s constraints</li>
            <li>• Escalating appropriately when needed</li>
            <li>• Reaching a workable resolution</li>
          </ul>
        </div>
        <Button
          onClick={handleStart}
          disabled={responseMutation.isPending}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold"
        >
          {responseMutation.isPending
            ? "Setting up scenario..."
            : "Start Conflict Scenario"}
        </Button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="space-y-4">
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">
              {scenario.role}
            </Badge>
            <span className="text-xs text-muted-foreground">Conflict</span>
          </div>
          <p className="text-xs text-muted-foreground">{scenario.conflict}</p>
          <p className="text-xs text-amber-400 mt-1">
            Stakes: {scenario.stakes}
          </p>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {turns.map((turn, i) => (
            <div
              key={i}
              className={`flex gap-2 ${turn.role === "you" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  turn.role === "you"
                    ? "bg-blue-500/20 text-blue-100"
                    : "bg-violet-500/20 border border-violet-500/30 text-violet-100"
                }`}
              >
                {turn.role === "xfn" && (
                  <p className="text-xs text-violet-400 font-medium mb-1">
                    {scenario.role}
                  </p>
                )}
                <p>{turn.content}</p>
              </div>
            </div>
          ))}
          {responseMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-violet-500/10 rounded-lg p-3 text-xs text-violet-400 animate-pulse">
                {scenario.role} is responding...
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
          placeholder="Your response... (Enter to send)"
          rows={3}
          className="text-sm resize-none"
          disabled={responseMutation.isPending}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!currentInput.trim() || responseMutation.isPending}
            className="flex-1"
          >
            <MessageSquare size={14} className="mr-1.5" /> Respond
          </Button>
          <Button
            onClick={handleFinish}
            disabled={
              turns.filter(t => t.role === "you").length < 2 ||
              scoreMutation.isPending
            }
            variant="outline"
          >
            {scoreMutation.isPending ? "Scoring..." : "End & Score"}
          </Button>
        </div>
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
          <span className="font-semibold">XFN Score</span>
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
            ✓ Strong moves
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
          setTurns([]);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
