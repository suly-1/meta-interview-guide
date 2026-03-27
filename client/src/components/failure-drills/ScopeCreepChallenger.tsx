import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  MessageSquare,
} from "lucide-react";

const PROMPTS = [
  "Design a URL shortener service.",
  "Design a simple task management API.",
  "Design a user authentication system.",
  "Design a basic file storage service.",
  "Design a simple notification service.",
];

interface Turn {
  role: "candidate" | "interviewer";
  content: string;
  isScopeChange?: boolean;
}

interface Props {
  onComplete?: (score: number) => void;
}

export default function ScopeCreepChallenger({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [prompt] = useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [scopeChanges, setScopeChanges] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scopeMutation = trpc.failureDrills.generateScopeCreep.useMutation();
  const scoreMutation = trpc.failureDrills.scoreScopeCreep.useMutation();

  const handleSend = () => {
    if (!currentInput.trim()) return;
    const candidateTurn: Turn = { role: "candidate", content: currentInput };
    const newTurns = [...turns, candidateTurn];
    setTurns(newTurns);
    setCurrentInput("");

    const candidateTurnCount = newTurns.filter(
      t => t.role === "candidate"
    ).length;
    if (candidateTurnCount <= 4 && scopeChanges < 3) {
      scopeMutation.mutate(
        {
          originalPrompt: prompt,
          currentDesign: newTurns
            .filter(t => t.role === "candidate")
            .map(t => t.content)
            .join("\n"),
          scopeAdditionNumber: scopeChanges + 1,
        },
        {
          onSuccess: data => {
            setTurns(prev => [
              ...prev,
              {
                role: "interviewer",
                content: data.requirement,
                isScopeChange: true,
              },
            ]);
            setScopeChanges(c => c + 1);
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
        originalPrompt: prompt,
        scopeAdditions: turns.filter(t => t.isScopeChange).map(t => t.content),
        finalDesign: turns
          .filter(t => t.role === "candidate")
          .map(t => t.content)
          .join("\n"),
        pushbackGiven: turns.filter(t => t.role === "candidate").slice(-1)[0]
          ?.content,
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
        <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={16} className="text-lime-400" />
            <span className="font-semibold text-lime-400 text-sm">
              Scope Creep Challenger
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Start designing a simple system. Midway through, the AI adds new
            requirements: &quot;Oh, it also needs to support multi-region&quot;
            or &quot;Actually, it needs to handle 10x more load.&quot; Trains
            adapting designs under mid-interview pivots.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Scoring criteria
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• How gracefully you absorb scope changes</li>
            <li>• Whether you update your design incrementally vs. restart</li>
            <li>• Asking clarifying questions about the new requirement</li>
            <li>• Maintaining structural integrity of your design</li>
          </ul>
        </div>
        <Button
          onClick={() => setPhase("active")}
          className="w-full bg-lime-500 hover:bg-lime-600 text-black font-semibold"
        >
          Start Mock
        </Button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="space-y-4">
        <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-3">
          <p className="text-xs text-lime-400 font-medium uppercase tracking-wide mb-1">
            Original Prompt
          </p>
          <p className="text-sm font-medium text-foreground">{prompt}</p>
        </div>

        {turns.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            Start your design. Scope changes will be added mid-way...
          </div>
        )}

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
                    : turn.isScopeChange
                      ? "bg-lime-500/20 border border-lime-500/40 text-lime-100"
                      : "bg-secondary/60 text-foreground"
                }`}
              >
                {turn.isScopeChange && (
                  <div className="flex items-center gap-1 mb-1">
                    <GitBranch size={10} className="text-lime-400" />
                    <span className="text-xs text-lime-400 font-medium">
                      Scope Change #{scopeChanges}
                    </span>
                  </div>
                )}
                <p>{turn.content}</p>
              </div>
            </div>
          ))}
          {scopeMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-lime-500/10 rounded-lg p-3 text-xs text-lime-400 animate-pulse">
                Adding new requirement...
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
          placeholder="Continue your design... (Enter to send)"
          rows={3}
          className="text-sm resize-none"
          disabled={scopeMutation.isPending}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!currentInput.trim() || scopeMutation.isPending}
            className="flex-1"
          >
            <MessageSquare size={14} className="mr-1.5" /> Send
          </Button>
          <Button
            onClick={handleFinish}
            disabled={turns.length < 4 || scoreMutation.isPending}
            variant="outline"
          >
            {scoreMutation.isPending ? "Scoring..." : "End & Score"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {scopeChanges} scope change{scopeChanges !== 1 ? "s" : ""} added
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
          <span className="font-semibold">Scope Adaptability Score</span>
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
            ✓ Strong adaptations
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
            <AlertTriangle size={12} /> Weak adaptations
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
          setScopeChanges(0);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
