// AI-Native Drill #11 — RAG Explainer
// Candidate explains RAG to a PM; LLM scores correctness, succinctness, caveats
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronRight, RefreshCw, Lightbulb } from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

export default function RAGExplainerDrill() {
  const [phase, setPhase] = useState<"explain" | "followup" | "result">(
    "explain"
  );
  const [explanation, setExplanation] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [result, setResult] = useState<{
    correctness: number;
    succinctness: number;
    caveats: number;
    followUpDepth: number;
    overall: number;
    feedback: string;
    strongPoints: string[];
    improvements: string[];
    ic7Signal: string;
  } | null>(null);

  const score = trpc.aiTraining.scoreRAGExplanation.useMutation();

  const handleSubmit = async () => {
    const res = await score.mutateAsync({ explanation, followUp });
    setResult(res);
    setPhase("result");
  };

  const reset = () => {
    setPhase("explain");
    setExplanation("");
    setFollowUp("");
    setResult(null);
  };

  const dims = result
    ? [
        { label: "Correctness", val: result.correctness },
        { label: "Succinctness (PM-friendly)", val: result.succinctness },
        { label: "Caveats & Limitations", val: result.caveats },
        { label: "Follow-up Depth", val: result.followUpDepth },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Context banner */}
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Fluency Check — Screening Call Phase 2
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your PM just asked:{" "}
          <span className="text-foreground font-medium">
            "Can you explain RAG to me?"
          </span>{" "}
          You have 90 seconds. The IC7 bar: correct, succinct, and caveated —
          mentions cost, latency, retrieval quality, and{" "}
          <em>when not to use it</em>.
        </p>
      </div>

      {phase === "explain" && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Your explanation (write as if speaking to a non-technical PM):
          </label>
          <Textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="RAG stands for Retrieval-Augmented Generation. The idea is..."
            rows={6}
            className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none"
          />
          <Button
            onClick={() => setPhase("followup")}
            disabled={explanation.trim().length < 30}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Continue to Follow-up <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}

      {phase === "followup" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <p className="text-xs text-muted-foreground italic">
              Your explanation was recorded. Now the recruiter probes deeper:
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              "Interesting — when <em>wouldn't</em> you use RAG?"
            </p>
          </div>
          <Textarea
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            placeholder="I wouldn't use RAG when..."
            rows={4}
            className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPhase("explain")}
              className="border-violet-500/30"
            >
              ← Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={followUp.trim().length < 20 || score.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {score.isPending ? "Scoring…" : "Get AI Score"}
            </Button>
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-4">
          {/* Overall score */}
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-bold ${SCORE_COLOR(result.overall)}`}
            >
              {result.overall.toFixed(1)}
              <span className="text-lg text-muted-foreground">/5</span>
            </div>
            <div>
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                {result.overall >= 4.5
                  ? "IC7 Signal ✦"
                  : result.overall >= 3.5
                    ? "AI-First"
                    : result.overall >= 2.5
                      ? "AI-Enabled"
                      : "AI Aware"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {result.ic7Signal}
              </p>
            </div>
          </div>

          {/* Dimension scores */}
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

          {/* Feedback */}
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
