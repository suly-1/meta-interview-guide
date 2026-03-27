import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  AlertTriangle,
  Swords,
  MessageSquare,
} from "lucide-react";

const TOPICS = [
  "Your choice of microservices over a monolith for a 5-engineer startup",
  "Your decision to use eventual consistency in a banking transaction system",
  "Your choice of NoSQL over SQL for a social network's user profile store",
  "Your recommendation to use a message queue for a simple CRUD API",
  "Your choice to build a custom cache instead of using Redis",
];

interface Turn {
  role: "candidate" | "interviewer";
  content: string;
}

interface Props {
  onComplete?: (score: number) => void;
}

export default function DevilsAdvocateInterviewer({ onComplete }: Props) {
  const [phase, setPhase] = useState<
    "intro" | "position" | "debate" | "result"
  >("intro");
  const [topic] = useState(
    () => TOPICS[Math.floor(Math.random() * TOPICS.length)]
  );
  const [position, setPosition] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const challengeMutation =
    trpc.failureDrills.generateDevilsChallenge.useMutation();
  const scoreMutation = trpc.failureDrills.scoreDevilsAdvocate.useMutation();

  const handleStartDebate = () => {
    challengeMutation.mutate(
      { topic, position, turnNumber: 1 },
      {
        onSuccess: data => {
          setTurns([{ role: "interviewer", content: data.challenge }]);
          setPhase("debate");
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
    if (candidateTurnCount < 4) {
      challengeMutation.mutate(
        {
          topic,
          position,
          turnNumber: candidateTurnCount + 1,
          history: newTurns.map(t => ({ role: t.role, content: t.content })),
        },
        {
          onSuccess: data => {
            setTurns(prev => [
              ...prev,
              { role: "interviewer", content: data.challenge },
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
        topic,
        position,
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
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Swords size={16} className="text-orange-400" />
            <span className="font-semibold text-orange-400 text-sm">
              Devil&apos;s Advocate Interviewer
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Take a position on a controversial technical decision. The AI plays
            a devil&apos;s advocate interviewer who argues the opposite side for
            4 rounds. Trains holding positions under pressure without being
            defensive.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Scoring criteria
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Holding your position with evidence (not stubbornness)</li>
            <li>• Acknowledging valid counterpoints gracefully</li>
            <li>• Updating your position when the argument is sound</li>
            <li>• Avoiding defensive or dismissive language</li>
          </ul>
        </div>
        <Button
          onClick={() => setPhase("position")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          Start Debate
        </Button>
      </div>
    );
  }

  if (phase === "position") {
    return (
      <div className="space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <p className="text-xs text-orange-400 font-medium uppercase tracking-wide mb-1">
            Topic
          </p>
          <p className="text-sm font-medium text-foreground">{topic}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            State your position and reasoning
          </label>
          <Textarea
            value={position}
            onChange={e => setPosition(e.target.value)}
            placeholder="I believe this is the right choice because... The key trade-offs are... This is appropriate given..."
            rows={5}
            className="text-sm resize-none"
            autoFocus
          />
        </div>
        <Button
          onClick={handleStartDebate}
          disabled={position.trim().length < 30 || challengeMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {challengeMutation.isPending
            ? "Generating challenge..."
            : "Submit Position → Start Debate"}
        </Button>
      </div>
    );
  }

  if (phase === "debate") {
    const candidateTurns = turns.filter(t => t.role === "candidate").length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Round {candidateTurns + 1} / 4
          </Badge>
          <Progress value={(candidateTurns / 4) * 100} className="w-24 h-2" />
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
                    : "bg-orange-500/20 border border-orange-500/30 text-orange-100"
                }`}
              >
                {turn.role === "interviewer" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Swords size={10} className="text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">
                      Devil&apos;s Advocate
                    </span>
                  </div>
                )}
                <p>{turn.content}</p>
              </div>
            </div>
          ))}
          {challengeMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-orange-500/10 rounded-lg p-3 text-xs text-orange-400 animate-pulse">
                Preparing counter-argument...
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
          placeholder="Respond to the challenge... (Enter to send)"
          rows={3}
          className="text-sm resize-none"
          disabled={challengeMutation.isPending}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!currentInput.trim() || challengeMutation.isPending}
            className="flex-1"
          >
            <MessageSquare size={14} className="mr-1.5" /> Respond
          </Button>
          {candidateTurns >= 3 && (
            <Button
              onClick={handleFinish}
              disabled={scoreMutation.isPending}
              variant="outline"
            >
              {scoreMutation.isPending ? "Scoring..." : "End & Score"}
            </Button>
          )}
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
          <span className="font-semibold">Debate Score</span>
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
            ✓ Strong debate moves
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
          setPosition("");
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
