// AI-Native Drill #14 — Agent Evaluation Designer
// Candidate designs an eval framework for an AI agent; LLM scores rigor
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const AGENT_TYPES = [
  "Code review agent",
  "Customer support agent",
  "Research summarisation agent",
  "SQL query generation agent",
  "Multi-step planning agent",
];

export default function AgentEvalDesigner() {
  const [agentType, setAgentType] = useState("");
  const [evalFramework, setEvalFramework] = useState("");
  const [result, setResult] = useState<{
    taskSuccess: number;
    hallucinationHandling: number;
    latencyCost: number;
    safetyConsiderations: number;
    overallRigor: number;
    feedback: string;
    missingDimensions: string[];
    strongPoints: string[];
  } | null>(null);

  const score = trpc.aiTraining.scoreAgentEvalDesign.useMutation();

  const handleSubmit = async () => {
    const res = await score.mutateAsync({ agentType, evalFramework });
    setResult(res);
  };

  const reset = () => {
    setAgentType("");
    setEvalFramework("");
    setResult(null);
  };

  const dims = result
    ? [
        { label: "Task Success Rate", val: result.taskSuccess },
        { label: "Hallucination Handling", val: result.hallucinationHandling },
        { label: "Latency & Cost", val: result.latencyCost },
        { label: "Safety Considerations", val: result.safetyConsiderations },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Fluency & Orchestration — Agent Evals
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Design an evaluation framework for an AI agent. The IC7 bar
          (Anthropic's approach): blend simple state-change checks with semantic
          LLM evaluations. Cover task success, hallucination rate, latency,
          cost, and safety.
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Agent type
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {AGENT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setAgentType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    agentType === t
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "border-violet-500/30 text-muted-foreground hover:border-violet-500/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              value={agentType}
              onChange={e => setAgentType(e.target.value)}
              placeholder="Or describe your own agent type…"
              className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Your evaluation framework
            </label>
            <p className="text-xs text-muted-foreground italic">
              Describe how you would evaluate this agent end-to-end. Include:
              what metrics you'd track, how you'd detect hallucinations, how
              you'd measure task success, latency/cost thresholds, and any
              safety checks.
            </p>
            <Textarea
              value={evalFramework}
              onChange={e => setEvalFramework(e.target.value)}
              placeholder="To evaluate this agent I would track: (1) task completion rate using golden test sets… (2) hallucination rate via LLM-as-judge with a reference answer… (3) p95 latency under 2s… (4) safety: PII detection before any output…"
              rows={8}
              className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              agentType.trim().length < 3 ||
              evalFramework.trim().length < 50 ||
              score.isPending
            }
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {score.isPending ? "Scoring…" : "Score My Framework"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-bold ${SCORE_COLOR(result.overallRigor)}`}
            >
              {result.overallRigor.toFixed(1)}
              <span className="text-lg text-muted-foreground">/5</span>
            </div>
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
              {result.overallRigor >= 4.5
                ? "IC7 Eval Rigor ✦"
                : result.overallRigor >= 3.5
                  ? "Solid Framework"
                  : "Needs Depth"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dims.map(d => (
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
              {result.missingDimensions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> Missing dimensions
                  </p>
                  {result.missingDimensions.map((p, i) => (
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
