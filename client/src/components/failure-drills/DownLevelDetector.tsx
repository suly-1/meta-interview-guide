import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowUp, Gauge } from "lucide-react";

const QUESTIONS = {
  "system-design": [
    "Design a distributed rate limiter for an API gateway serving 100K RPS.",
    "How would you design the storage layer for a global messaging app?",
    "Walk me through how you'd approach designing a recommendation engine.",
  ],
  behavioral: [
    "Tell me about a time you drove a major technical decision that affected multiple teams.",
    "Describe a situation where you had to influence a direction without having authority.",
    "Tell me about a time you identified and fixed a systemic problem in your organization.",
  ],
  coding: [
    "Explain your approach to solving the 'find median from a data stream' problem.",
    "Walk me through how you'd implement a distributed cache with consistent hashing.",
    "Explain your solution to the 'design a file system' problem.",
  ],
};

const LEVEL_COLORS = {
  L5: "text-amber-400 bg-amber-500/20",
  L6: "text-blue-400 bg-blue-500/20",
  L7: "text-purple-400 bg-purple-500/20",
};

interface Props {
  onComplete?: (score: number) => void;
}

export default function DownLevelDetector({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "answer" | "result" | "rewrite">(
    "intro"
  );
  const [questionType, setQuestionType] = useState<
    "system-design" | "behavioral" | "coding"
  >("system-design");
  const [question] = useState(() => {
    const type = "system-design" as const;
    const qs = QUESTIONS[type];
    return qs[Math.floor(Math.random() * qs.length)];
  });
  const [answer, setAnswer] = useState("");
  const [rewrittenAnswer, setRewrittenAnswer] = useState("");

  const detectMutation = trpc.failureDrills.detectLevel.useMutation();

  const handleDetect = (
    text: string,
    type: "system-design" | "behavioral" | "coding"
  ) => {
    detectMutation.mutate(
      { answer: text, questionType: type },
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
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={16} className="text-indigo-400" />
            <span className="font-semibold text-indigo-400 text-sm">
              Down-Level Detector
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Give a 90-second verbal answer to a question. The AI classifies it
            as L5, L6, or L7 based on scope language, ambiguity handling, and
            trade-off framing — then tells you exactly which phrases triggered
            the classification.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["system-design", "behavioral", "coding"] as const).map(t => (
            <button
              key={t}
              onClick={() => setQuestionType(t)}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors ${questionType === t ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-border text-muted-foreground hover:border-indigo-500/50"}`}
            >
              {t === "system-design"
                ? "System Design"
                : t === "behavioral"
                  ? "Behavioral"
                  : "Coding"}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setPhase("answer")}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "answer") {
    const qs = QUESTIONS[questionType];
    const q = qs[Math.floor(Math.random() * qs.length)];
    return (
      <div className="space-y-4">
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
          <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">
            {questionType.replace("-", " ")}
          </p>
          <p className="text-sm font-medium text-foreground">{q}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Answer as you would in a real interview. Aim for 90 seconds of
            content.
          </p>
        </div>
        <Textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Write your answer here..."
          rows={8}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={() => handleDetect(answer, questionType)}
          disabled={answer.trim().length < 50 || detectMutation.isPending}
          className="w-full"
        >
          {detectMutation.isPending ? "Analyzing level..." : "Detect My Level"}
        </Button>
      </div>
    );
  }

  const result = detectMutation.data;
  if (!result) return null;

  if (phase === "result") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="font-semibold">Level Detection</span>
          </div>
          <Badge
            className={`text-sm font-bold px-3 py-1 border-0 ${LEVEL_COLORS[result.level as keyof typeof LEVEL_COLORS]}`}
          >
            {result.level}
          </Badge>
        </div>
        <Progress value={result.score} className="h-3" />
        <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
          {result.feedback}
        </div>
        {result.levelSignals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-400 mb-1.5">
              Phrases that triggered {result.level} classification
            </p>
            <div className="space-y-1">
              {result.levelSignals.map((s: string, i: number) => (
                <div
                  key={i}
                  className="text-xs bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 text-amber-300"
                >
                  &quot;{s}&quot;
                </div>
              ))}
            </div>
          </div>
        )}
        {result.upgradeTips.length > 0 && (
          <div>
            <p className="text-xs font-medium text-blue-400 mb-1.5 flex items-center gap-1">
              <ArrowUp size={12} /> To sound more senior
            </p>
            <ul className="space-y-1">
              {result.upgradeTips.map((t, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground flex gap-2"
                >
                  <span className="text-blue-400 shrink-0">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.level !== "L7" && (
          <Button
            onClick={() => {
              setPhase("rewrite");
              setRewrittenAnswer(answer);
            }}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Rewrite as {result.level === "L5" ? "L6" : "L7"} →
          </Button>
        )}
        <Button
          onClick={() => {
            setPhase("intro");
            setAnswer("");
          }}
          variant="outline"
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (phase === "rewrite") {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
          <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">
            Rewrite for higher level
          </p>
          <p className="text-sm text-muted-foreground">
            Apply the upgrade tips above. Use broader scope language, mention
            stakeholders, frame trade-offs explicitly.
          </p>
        </div>
        <Textarea
          value={rewrittenAnswer}
          onChange={e => setRewrittenAnswer(e.target.value)}
          rows={8}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={() => handleDetect(rewrittenAnswer, questionType)}
          disabled={
            rewrittenAnswer.trim().length < 50 || detectMutation.isPending
          }
          className="w-full"
        >
          {detectMutation.isPending ? "Re-analyzing..." : "Re-Detect Level"}
        </Button>
      </div>
    );
  }

  return null;
}
