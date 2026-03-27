// AI-Native Drill #29 — Meta Values Alignment Check
// Candidate answers one question per Meta AI-Native value; LLM scores alignment
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, RefreshCw } from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const VALUES = [
  {
    id: "moveFast",
    label: "Move Fast",
    icon: "⚡",
    description:
      "Iterate with eval loops, not months-long training runs. Ship, measure, improve.",
    question:
      "Describe a time you moved fast on an AI project. How did you know when to iterate vs. when to stop?",
    placeholder:
      "We had a 2-week deadline to prototype a RAG system. Instead of waiting for perfect data, I…",
  },
  {
    id: "beOpen",
    label: "Be Open",
    icon: "🔓",
    description:
      "Open-source, reproducible experiments. Share learnings, not just results.",
    question:
      "How have you contributed to open AI knowledge — internally or externally?",
    placeholder:
      "I published a post-mortem on our fine-tuning experiment that showed why it underperformed RAG for our use case…",
  },
  {
    id: "focusOnImpact",
    label: "Focus on Impact",
    icon: "🎯",
    description:
      "Measure utility and cost, not benchmark scores. Quantify ROI for stakeholders.",
    question:
      "Give an example of an AI project where you measured and communicated real business impact.",
    placeholder:
      "The model scored 94% on our internal benchmark, but adoption was 12%. I reframed success as…",
  },
  {
    id: "buildAwesomeThings",
    label: "Build Awesome Things",
    icon: "🚀",
    description:
      "Prototype without permission. Build things that feel like magic, not just features.",
    question:
      "Tell me about an AI thing you built that you're proud of — not because it was assigned, but because you wanted to.",
    placeholder: "On a weekend I built a personal agent that…",
  },
];

export default function MetaValuesAlignmentCheck() {
  const [answers, setAnswers] = useState<Record<string, string>>({
    moveFast: "",
    beOpen: "",
    focusOnImpact: "",
    buildAwesomeThings: "",
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<{
    moveFast: number;
    beOpen: number;
    focusOnImpact: number;
    buildAwesomeThings: number;
    overall: number;
    verdicts: Record<string, string>;
    overallVerdict: string;
    topStrength: string;
    topGap: string;
  } | null>(null);

  const score = trpc.aiTraining.scoreMetaValuesAlignment.useMutation();
  const save = trpc.aiNativeHistory.saveDrillScore.useMutation();

  const current = VALUES[currentIdx];
  const allAnswered = VALUES.every(v => answers[v.id].trim().length >= 30);

  const handleSubmit = async () => {
    const res = await score.mutateAsync({ answers });
    setResult(res);
    save.mutate({
      drillId: "meta-values-alignment",
      drillLabel: "Meta Values Alignment Check",
      coreSkill: "Responsible AI Use",
      overallScore: Math.round(res.overall * 2),
      scores: { overall: res.overall },
      feedback: res.overallVerdict,
    });
  };

  const reset = () => {
    setAnswers({
      moveFast: "",
      beOpen: "",
      focusOnImpact: "",
      buildAwesomeThings: "",
    });
    setCurrentIdx(0);
    setResult(null);
  };

  const valueScores = result
    ? VALUES.map(v => ({
        label: v.label,
        icon: v.icon,
        val: (result as Record<string, number>)[v.id] as number,
        verdict: result.verdicts[v.id],
      }))
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Philosophy & Culture — Meta AI-Native Values
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Answer one question per Meta AI-Native value. The IC7 bar: each answer
          is concrete, specific, and shows you live these values — not just
          recite them.
        </p>
      </div>

      {!result && (
        <div className="space-y-4">
          {/* Progress pills */}
          <div className="flex gap-2">
            {VALUES.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setCurrentIdx(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  i === currentIdx
                    ? "bg-violet-600 border-violet-500 text-white"
                    : answers[v.id].trim().length >= 30
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "border-violet-500/20 text-muted-foreground hover:border-violet-500/40"
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* Current value card */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{current.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {current.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {current.description}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground font-medium">
              "{current.question}"
            </p>
          </div>

          <Textarea
            value={answers[current.id]}
            onChange={e =>
              setAnswers(a => ({ ...a, [current.id]: e.target.value }))
            }
            placeholder={current.placeholder}
            rows={5}
            className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
          />

          <div className="flex gap-2">
            {currentIdx > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentIdx(i => i - 1)}
                className="border-violet-500/30"
              >
                ← Previous
              </Button>
            )}
            {currentIdx < VALUES.length - 1 ? (
              <Button
                onClick={() => setCurrentIdx(i => i + 1)}
                disabled={answers[current.id].trim().length < 30}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Next Value →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || score.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {score.isPending ? "Scoring…" : "Score All 4 Values"}
              </Button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-bold ${SCORE_COLOR(result.overall)}`}
            >
              {result.overall.toFixed(1)}
              <span className="text-lg text-muted-foreground">/5</span>
            </div>
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
              {result.overall >= 4.5
                ? "Meta AI-Native ✦"
                : result.overall >= 3.5
                  ? "AI-First Aligned"
                  : "Values Gap"}
            </Badge>
          </div>

          <div className="space-y-2">
            {valueScores.map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {d.icon} {d.label}
                  </span>
                  <span className={SCORE_COLOR(d.val)}>{d.val}/5</span>
                </div>
                <Progress value={d.val * 20} className="h-1.5" />
                <p className="text-xs text-muted-foreground italic">
                  {d.verdict}
                </p>
              </div>
            ))}
          </div>

          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-foreground">{result.overallVerdict}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">
                    ✓ Top strength
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.topStrength}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1">
                    △ Top gap
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.topGap}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={reset}
            className="border-violet-500/30 gap-1"
          >
            <RefreshCw size={13} /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
