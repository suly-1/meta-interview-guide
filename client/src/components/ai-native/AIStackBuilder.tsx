// AI-Native Drill #12 — AI Stack Walk-Through Builder
// Candidate walks through their personal AI stack; LLM scores each layer
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layers, RefreshCw, Lightbulb } from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const LAYERS = [
  {
    id: "modelLayer",
    label: "Model Layer",
    placeholder:
      "Which model(s) did you choose and why? (e.g., GPT-4o for reasoning, Llama 3 for cost, fine-tuned Mistral for domain…)",
    hint: "IC7 signal: justified choice, not just 'I used GPT-4'. Mentions trade-offs: cost, latency, context window, fine-tuning.",
  },
  {
    id: "toolingLayer",
    label: "Tooling Layer",
    placeholder:
      "What frameworks, eval tools, or infra did you use? (e.g., LangChain, LlamaIndex, Ragas, Braintrust, Weights & Biases…)",
    hint: "IC7 signal: real evals framework mentioned. Not just 'I used LangChain' — describes why and what problem it solved.",
  },
  {
    id: "workflowLayer",
    label: "Workflow / Orchestration Layer",
    placeholder:
      "How did the pieces connect end-to-end? (e.g., retrieval pipeline → reranker → LLM → structured output → human review…)",
    hint: "IC7 signal: describes orchestration across multiple steps, not a single API call. Mentions failure modes and fallbacks.",
  },
  {
    id: "lessonsLearned",
    label: "Lessons Learned",
    placeholder:
      "What surprised you? What would you do differently? (e.g., 'I thought fine-tuning would help but RAG outperformed it because…')",
    hint: "IC7 signal: genuine belief update, not a blog-post platitude. Specific failure → specific insight.",
  },
];

export default function AIStackBuilder() {
  const [values, setValues] = useState<Record<string, string>>({
    modelLayer: "",
    toolingLayer: "",
    workflowLayer: "",
    lessonsLearned: "",
  });
  const [result, setResult] = useState<{
    modelLayer: number;
    toolingLayer: number;
    workflowLayer: number;
    lessonsLearned: number;
    overall: number;
    maturityLevel: string;
    feedback: string;
    strongPoints: string[];
    improvements: string[];
  } | null>(null);

  const score = trpc.aiTraining.scoreAIStack.useMutation();
  const save = trpc.aiNativeHistory.saveDrillScore.useMutation();

  const allFilled = LAYERS.every(l => values[l.id].trim().length >= 20);

  const handleSubmit = async () => {
    const res = await score.mutateAsync({
      modelLayer: values.modelLayer,
      toolingLayer: values.toolingLayer,
      workflowLayer: values.workflowLayer,
      lessonsLearned: values.lessonsLearned,
    });
    setResult(res);
    save.mutate({
      drillId: "ai-stack-builder",
      drillLabel: "AI Stack Builder",
      coreSkill: "fluency",
      overallScore: Math.round(res.overall * 2),
      scores: {
        modelLayer: res.modelLayer,
        toolingLayer: res.toolingLayer,
        workflowLayer: res.workflowLayer,
        lessonsLearned: res.lessonsLearned,
      },
      feedback: res.feedback,
    });
  };

  const reset = () => {
    setValues({
      modelLayer: "",
      toolingLayer: "",
      workflowLayer: "",
      lessonsLearned: "",
    });
    setResult(null);
  };

  const layerScores = result
    ? [
        { label: "Model Layer", val: result.modelLayer },
        { label: "Tooling Layer", val: result.toolingLayer },
        { label: "Workflow Layer", val: result.workflowLayer },
        { label: "Lessons Learned", val: result.lessonsLearned },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Builder Signal — Screening Call Phase 3
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Walk through a real AI system you built. The IC7 bar: model choice is
          justified, tooling is specific (evals framework included),
          orchestration spans multiple steps, and lessons learned show a genuine
          belief update.
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          {LAYERS.map(layer => (
            <div key={layer.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">
                  {layer.label}
                </label>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {layer.hint}
              </p>
              <Textarea
                value={values[layer.id]}
                onChange={e =>
                  setValues(v => ({ ...v, [layer.id]: e.target.value }))
                }
                placeholder={layer.placeholder}
                rows={3}
                className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
              />
            </div>
          ))}
          <Button
            onClick={handleSubmit}
            disabled={!allFilled || score.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {score.isPending ? "Scoring…" : "Score My Stack"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-bold ${SCORE_COLOR(result.overall)}`}
            >
              {result.overall.toFixed(1)}
              <span className="text-lg text-muted-foreground">/5</span>
            </div>
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
              {result.maturityLevel}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {layerScores.map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className={SCORE_COLOR(d.val)}>{d.val}/5</span>
                </div>
                <Progress value={d.val * 20} className="h-1.5" />
              </div>
            ))}
          </div>

          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-foreground">{result.feedback}</p>
              {result.strongPoints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">
                    ✓ Strong signals
                  </p>
                  {result.strongPoints.map((p, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {p}
                    </p>
                  ))}
                </div>
              )}
              {result.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                    <Lightbulb size={11} /> Improvements
                  </p>
                  {result.improvements.map((p, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {p}
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
            <RefreshCw size={13} /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
