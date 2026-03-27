import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Crown } from "lucide-react";

interface Props {
  onComplete?: (score: number) => void;
}

export default function OwnershipSignalExtractor({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "describe" | "probe" | "result">(
    "intro"
  );
  const [projectDescription, setProjectDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");

  const generateMutation =
    trpc.failureDrills.generateOwnershipProbe.useMutation();
  const scoreMutation = trpc.failureDrills.scoreOwnershipSignal.useMutation();

  const handleGenerateProbes = () => {
    generateMutation.mutate(
      { projectDescription },
      {
        onSuccess: data => {
          setQuestions(data.questions);
          setAnswers(new Array(data.questions.length).fill(""));
          setPhase("probe");
        },
      }
    );
  };

  const handleNextQuestion = () => {
    const updated = [...answers];
    updated[currentQ] = currentAnswer;
    setAnswers(updated);
    setCurrentAnswer("");
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      // Submit all answers
      scoreMutation.mutate(
        { projectDescription, questions, answers: updated },
        {
          onSuccess: data => {
            setPhase("result");
            onComplete?.(data.score);
          },
        }
      );
    }
  };

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={16} className="text-yellow-400" />
            <span className="font-semibold text-yellow-400 text-sm">
              Ownership Signal Extractor
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Describe a past project. A skeptical L7 interviewer will fire 5
            probing questions designed to distinguish a true owner from a
            contributor. Answer each one honestly.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            What the probes test
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Who made the final architecture decision?</li>
            <li>• What would have broken if you left the team?</li>
            <li>• What did you push back on and why?</li>
            <li>• How did you handle a failure or setback?</li>
            <li>• What would you do differently?</li>
          </ul>
        </div>
        <Button
          onClick={() => setPhase("describe")}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "describe") {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-xs text-yellow-400 font-medium uppercase tracking-wide mb-1">
            Step 1 — Describe Your Project
          </p>
          <p className="text-sm text-muted-foreground">
            Give a 2–3 sentence summary. The AI will generate 5 probing
            questions based on this.
          </p>
        </div>
        <Textarea
          value={projectDescription}
          onChange={e => setProjectDescription(e.target.value)}
          placeholder="e.g. I led the migration of our monolithic auth service to a distributed microservice handling 50K RPS. I designed the API contracts, drove the rollout plan, and coordinated with 3 dependent teams..."
          rows={5}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={handleGenerateProbes}
          disabled={
            projectDescription.trim().length < 30 || generateMutation.isPending
          }
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {generateMutation.isPending
            ? "Generating probes..."
            : "Generate Probing Questions →"}
        </Button>
      </div>
    );
  }

  if (phase === "probe") {
    const q = questions[currentQ];
    const isLast = currentQ === questions.length - 1;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Question {currentQ + 1} / {questions.length}
          </Badge>
          <Progress
            value={(currentQ / questions.length) * 100}
            className="w-32 h-2"
          />
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-xs text-yellow-400 font-medium uppercase tracking-wide mb-1">
            Interviewer asks
          </p>
          <p className="text-sm font-medium text-foreground">{q}</p>
        </div>
        <Textarea
          key={currentQ}
          value={currentAnswer}
          onChange={e => setCurrentAnswer(e.target.value)}
          placeholder="Answer honestly and specifically..."
          rows={5}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={handleNextQuestion}
          disabled={currentAnswer.trim().length < 10 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending
            ? "Scoring..."
            : isLast
              ? "Submit Final Answer"
              : "Next Question →"}
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
          <span className="font-semibold">Ownership Signal Score</span>
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
            ✓ Strong ownership signals
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
            <AlertTriangle size={12} /> Weak signals
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
          setProjectDescription("");
          setQuestions([]);
          setAnswers([]);
          setCurrentQ(0);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
