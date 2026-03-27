import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Edit3 } from "lucide-react";

const QUESTIONS = [
  "Tell me about a time you led a technically complex project under tight deadlines.",
  "Describe a situation where you had to influence without authority.",
  "Tell me about a time you made a significant technical decision that had a major impact.",
  "Describe a time you had to push back on a stakeholder's request.",
  "Tell me about a project where you improved system reliability or performance.",
];

const VAGUE_PATTERNS = [
  "we improved",
  "I helped",
  "the team decided",
  "significant impact",
  "worked with stakeholders",
  "drove alignment",
  "collaborated with",
  "made a big difference",
  "increased performance",
  "reduced latency",
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function STARSpecificityRewriter({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "write" | "rewrite" | "result">(
    "intro"
  );
  const [question] = useState(
    () => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  );
  const [originalAnswer, setOriginalAnswer] = useState("");
  const [rewrittenAnswer, setRewrittenAnswer] = useState("");

  const scoreMutation = trpc.failureDrills.scoreSTARRewrite.useMutation();

  const vagueCount = VAGUE_PATTERNS.filter(p =>
    originalAnswer.toLowerCase().includes(p)
  ).length;

  const handleSubmit = () => {
    scoreMutation.mutate(
      { originalAnswer, rewrittenAnswer, question },
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
        <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 size={16} className="text-pink-400" />
            <span className="font-semibold text-pink-400 text-sm">
              STAR Specificity Rewriter
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Write a behavioral answer, then rewrite it — replacing every vague
            phrase with a specific metric, name, or decision. The AI scores the
            improvement in specificity and impact.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Vague phrases to eliminate
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VAGUE_PATTERNS.map(p => (
              <Badge
                key={p}
                variant="outline"
                className="text-xs text-muted-foreground line-through"
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setPhase("write")}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "write") {
    return (
      <div className="space-y-4">
        <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
          <p className="text-xs text-pink-400 font-medium uppercase tracking-wide mb-1">
            Behavioral Question
          </p>
          <p className="text-sm font-medium text-foreground">{question}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Your Answer (write naturally — vague phrases OK for now)
          </label>
          <Textarea
            value={originalAnswer}
            onChange={e => setOriginalAnswer(e.target.value)}
            placeholder="Write your STAR answer here..."
            rows={7}
            className="text-sm resize-none"
            autoFocus
          />
          {vagueCount > 0 && (
            <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={11} /> {vagueCount} vague phrase
              {vagueCount !== 1 ? "s" : ""} detected — you'll fix these next
            </p>
          )}
        </div>
        <Button
          onClick={() => setPhase("rewrite")}
          disabled={originalAnswer.trim().length < 50}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white"
        >
          Proceed to Rewrite
        </Button>
      </div>
    );
  }

  if (phase === "rewrite") {
    const highlighted = originalAnswer.replace(
      new RegExp(
        `(${VAGUE_PATTERNS.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
        "gi"
      ),
      match => `**${match}**`
    );
    return (
      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            Original Answer (vague phrases bolded)
          </p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {highlighted}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Rewritten Answer — replace every vague phrase with specifics
          </label>
          <Textarea
            value={rewrittenAnswer}
            onChange={e => setRewrittenAnswer(e.target.value)}
            placeholder="Rewrite with: specific numbers, names, decisions, timelines, metrics..."
            rows={7}
            className="text-sm resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tip: Replace &quot;we improved performance&quot; with &quot;reduced
            p99 latency from 800ms to 120ms by adding a Redis read-through
            cache&quot;
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={
            rewrittenAnswer.trim().length < 50 || scoreMutation.isPending
          }
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Score My Rewrite"}
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
          <span className="font-semibold">Specificity Score</span>
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
            ✓ Strong specifics
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
            <AlertTriangle size={12} /> Still vague
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
          setOriginalAnswer("");
          setRewrittenAnswer("");
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
