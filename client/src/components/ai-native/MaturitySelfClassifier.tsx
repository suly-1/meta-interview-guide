// AI-Native Drill #17 — Maturity Self-Classifier + Gap Analysis
// Candidate claims a maturity level and provides examples; LLM validates and surfaces gaps
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target, RefreshCw, ChevronRight } from "lucide-react";

const LEVELS = [
  {
    id: "Traditionalist",
    label: "Traditionalist",
    desc: "Relies on traditional (non-AI) methods, missing opportunities for AI-driven impact",
    color: "text-slate-400 border-slate-500/30 bg-slate-500/5",
  },
  {
    id: "AI Aware",
    label: "AI Aware",
    desc: "Experiments with AI occasionally, but doesn't meaningfully integrate it to drive impact",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/5",
  },
  {
    id: "AI Enabled",
    label: "AI Enabled",
    desc: "Uses AI for specific tasks, but not systematically across workflows or to materially drive impact",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
  },
  {
    id: "AI First",
    label: "AI First",
    desc: "Turns to AI as a primary approach, effectively integrating it across multiple workflows to drive impact",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5",
  },
  {
    id: "AI Native",
    label: "✦ AI Native",
    desc: "Leverages AI as a core collaborator across workflows, driving measurable impact by augmenting productivity, creativity, and problem-solving",
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  },
];

const SKILLS = [
  {
    id: "fluencyExample",
    label: "AI Fluency & Tool Orchestration",
    placeholder:
      "Describe how you strategically integrate multiple AI tools and agents. Example: 'I orchestrate LLM + retrieval + reranker + structured output in a single pipeline…'",
  },
  {
    id: "impactExample",
    label: "AI-Driven Impact",
    placeholder:
      "Describe how you drive measurable impact with AI. Example: 'I reduced review time by 60% and quantified the ROI as $2M/year…'",
  },
  {
    id: "responsibleAIExample",
    label: "Responsible AI Use",
    placeholder:
      "Describe how you use AI safely and ethically. Example: 'I built a PII detection layer before any LLM call, and added HITL for confidence < 0.85…'",
  },
  {
    id: "continuousLearningExample",
    label: "Continuous AI Learning",
    placeholder:
      "Describe how you stay current and share learnings. Example: 'I run weekly eval experiments on new models and published a post-mortem that changed our team's approach…'",
  },
];

export default function MaturitySelfClassifier() {
  const [claimedLevel, setClaimedLevel] = useState("");
  const [examples, setExamples] = useState<Record<string, string>>({
    fluencyExample: "",
    impactExample: "",
    responsibleAIExample: "",
    continuousLearningExample: "",
  });
  const [phase, setPhase] = useState<"level" | "examples" | "result">("level");
  const [result, setResult] = useState<{
    fluencyAssessedLevel: string;
    impactAssessedLevel: string;
    responsibleAIAssessedLevel: string;
    continuousLearningAssessedLevel: string;
    overallAssessedLevel: string;
    claimedVsActualGap: string;
    gapAnalysis: string;
    whatAINativeLooksLike: string;
    nextSteps: string[];
  } | null>(null);

  const score = trpc.aiTraining.scoreMaturityClassification.useMutation();

  const allFilled = SKILLS.every(s => examples[s.id].trim().length >= 30);

  const handleSubmit = async () => {
    const res = await score.mutateAsync({
      claimedLevel,
      fluencyExample: examples.fluencyExample,
      impactExample: examples.impactExample,
      responsibleAIExample: examples.responsibleAIExample,
      continuousLearningExample: examples.continuousLearningExample,
    });
    setResult(res);
    setPhase("result");
  };

  const reset = () => {
    setClaimedLevel("");
    setExamples({
      fluencyExample: "",
      impactExample: "",
      responsibleAIExample: "",
      continuousLearningExample: "",
    });
    setPhase("level");
    setResult(null);
  };

  const LEVEL_COLOR: Record<string, string> = {
    Traditionalist: "text-slate-400",
    "AI Aware": "text-blue-400",
    "AI Enabled": "text-cyan-400",
    "AI First": "text-indigo-400",
    "AI Native": "text-violet-400",
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Maturity Assessment — Self-Classifier + Gap Analysis
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Claim your maturity level, then back it up with concrete examples
          across all 4 core skills. The LLM validates your claim and surfaces
          the exact gap between where you are and AI-Native.
        </p>
      </div>

      {phase === "level" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Where do you honestly place yourself?
          </p>
          {LEVELS.map(l => (
            <button
              key={l.id}
              onClick={() => setClaimedLevel(l.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                claimedLevel === l.id
                  ? `${l.color} ring-1 ring-violet-500/50`
                  : "border-border hover:border-violet-500/30"
              }`}
            >
              <p
                className={`text-sm font-semibold ${claimedLevel === l.id ? l.color.split(" ")[0] : "text-foreground"}`}
              >
                {l.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
            </button>
          ))}
          <Button
            onClick={() => setPhase("examples")}
            disabled={!claimedLevel}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Back it up with examples <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}

      {phase === "examples" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Claimed level:</p>
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
              {claimedLevel}
            </Badge>
          </div>
          {SKILLS.map(s => (
            <div key={s.id} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {s.label}
              </label>
              <Textarea
                value={examples[s.id]}
                onChange={e =>
                  setExamples(ex => ({ ...ex, [s.id]: e.target.value }))
                }
                placeholder={s.placeholder}
                rows={3}
                className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPhase("level")}
              className="border-violet-500/30"
            >
              ← Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allFilled || score.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {score.isPending ? "Analysing…" : "Get Gap Analysis"}
            </Button>
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-xs text-muted-foreground">Claimed</p>
              <p
                className={`text-sm font-bold ${LEVEL_COLOR[claimedLevel] || "text-foreground"}`}
              >
                {claimedLevel}
              </p>
            </div>
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-xs text-muted-foreground">Assessed</p>
              <p
                className={`text-sm font-bold ${LEVEL_COLOR[result.overallAssessedLevel] || "text-violet-400"}`}
              >
                {result.overallAssessedLevel}
              </p>
            </div>
          </div>

          {result.claimedVsActualGap && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">
                Claimed vs. Actual Gap
              </p>
              <p className="text-xs text-foreground">
                {result.claimedVsActualGap}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Fluency", val: result.fluencyAssessedLevel },
              { label: "Impact", val: result.impactAssessedLevel },
              {
                label: "Responsible AI",
                val: result.responsibleAIAssessedLevel,
              },
              {
                label: "Continuous Learning",
                val: result.continuousLearningAssessedLevel,
              },
            ].map(d => (
              <div key={d.label} className="rounded border border-border p-2">
                <p className="text-muted-foreground">{d.label}</p>
                <p
                  className={`font-semibold ${LEVEL_COLOR[d.val] || "text-foreground"}`}
                >
                  {d.val}
                </p>
              </div>
            ))}
          </div>

          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="pt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-violet-300 mb-1">
                  Gap Analysis
                </p>
                <p className="text-sm text-foreground">{result.gapAnalysis}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-300 mb-1">
                  What AI-Native looks like for you
                </p>
                <p className="text-sm text-foreground">
                  {result.whatAINativeLooksLike}
                </p>
              </div>
              {result.nextSteps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">
                    Next steps
                  </p>
                  {result.nextSteps.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {s}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={reset}
            className="border-violet-500/30 gap-1"
          >
            <RefreshCw size={13} /> Reassess
          </Button>
        </div>
      )}
    </div>
  );
}
