// AI-Native Drill #16 — Human-in-the-Loop Challenge
// Candidate designs a HITL mechanism for a high-stakes AI system
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, RefreshCw, Lightbulb } from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const SYSTEMS = [
  {
    id: "loan",
    label: "Loan approval AI",
    risk: "High financial + legal risk",
  },
  {
    id: "moderation",
    label: "Content moderation AI",
    risk: "Scale + free speech risk",
  },
  { id: "medical", label: "Medical diagnosis AI", risk: "Patient safety risk" },
  { id: "hiring", label: "Resume screening AI", risk: "Bias + legal risk" },
  {
    id: "trading",
    label: "Algorithmic trading AI",
    risk: "Market + regulatory risk",
  },
];

export default function HumanInLoopChallenge() {
  const [systemType, setSystemType] = useState("");
  const [designAnswer, setDesignAnswer] = useState("");
  const [result, setResult] = useState<{
    safetyRisk: number;
    hitlMechanism: number;
    policyCompliance: number;
    transparentPractices: number;
    overall: number;
    feedback: string;
    gaps: string[];
    strongPoints: string[];
  } | null>(null);

  const score = trpc.aiTraining.scoreHumanInLoop.useMutation();
  const save = trpc.aiNativeHistory.saveDrillScore.useMutation();

  const handleSubmit = async () => {
    const res = await score.mutateAsync({ systemType, designAnswer });
    setResult(res);
    save.mutate({
      drillId: "human-in-loop",
      drillLabel: "Human-in-the-Loop Challenge",
      coreSkill: "Responsible AI Use",
      overallScore: Math.round(res.overall * 2),
      scores: { overall: res.overall },
      feedback: res.feedback,
    });
  };

  const reset = () => {
    setSystemType("");
    setDesignAnswer("");
    setResult(null);
  };

  const dims = result
    ? [
        { label: "Safety Risk Identification", val: result.safetyRisk },
        { label: "HITL Mechanism Specificity", val: result.hitlMechanism },
        { label: "Policy Compliance", val: result.policyCompliance },
        { label: "Transparent Practices", val: result.transparentPractices },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Responsible AI Use — Human-in-the-Loop Design
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Design a human-in-the-loop mechanism for a high-stakes AI system. The
          IC7 bar: specific and actionable HITL (not just "add a review step"),
          addresses policy compliance, and explains how humans are informed and
          in control.
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Choose an AI system:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYSTEMS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSystemType(s.label)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    systemType === s.label
                      ? "bg-violet-600/20 border-violet-500 text-foreground"
                      : "border-violet-500/20 text-muted-foreground hover:border-violet-500/40"
                  }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs opacity-70">{s.risk}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Your HITL design
            </label>
            <p className="text-xs text-muted-foreground italic">
              Describe: (1) what triggers human review, (2) who reviews and how,
              (3) what policy/regulatory constraints apply, (4) how you ensure
              humans understand the AI's reasoning before deciding.
            </p>
            <Textarea
              value={designAnswer}
              onChange={e => setDesignAnswer(e.target.value)}
              placeholder="For a loan approval AI, I would trigger human review when: (1) confidence score < 0.85, (2) applicant is near the decision boundary (±5%), (3) any protected attribute is a top-3 feature… The reviewer sees: model explanation (SHAP values), comparable approved/rejected cases… Policy constraints: ECOA requires adverse action notices…"
              rows={8}
              className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              !systemType || designAnswer.trim().length < 80 || score.isPending
            }
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {score.isPending ? "Scoring…" : "Score My HITL Design"}
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
              {result.overall >= 4.5
                ? "Responsible AI Native ✦"
                : result.overall >= 3.5
                  ? "Policy-Aware"
                  : "Needs Specificity"}
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
              {result.gaps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                    <Lightbulb size={11} /> Gaps
                  </p>
                  {result.gaps.map((p, i) => (
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
            <RefreshCw size={13} /> Try Another System
          </Button>
        </div>
      )}
    </div>
  );
}
