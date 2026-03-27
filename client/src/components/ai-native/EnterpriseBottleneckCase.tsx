// AI-Native Drill #15 — Enterprise Bottleneck Case
// Candidate analyses why an enterprise AI rollout is stuck; LLM scores systems thinking
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, RefreshCw, Lightbulb, AlertTriangle } from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const SCENARIOS = [
  {
    id: "s1",
    title: "Retail AI Rollout Stall",
    description:
      "A 50,000-employee retailer deployed an AI-powered inventory forecasting system 8 months ago. Adoption is at 12%. The model accuracy is 94% (above target). The data team says the pipeline is stable. But store managers aren't using it — they still rely on spreadsheets. The CTO is asking why.",
  },
  {
    id: "s2",
    title: "Legal AI Tool Rejection",
    description:
      "A law firm built an AI contract review tool that reduces review time by 60% in testing. After 6 months in production, only 3 of 200 lawyers use it regularly. The tool passes all accuracy benchmarks. Partners are worried about liability. Junior associates say it 'feels wrong'.",
  },
  {
    id: "s3",
    title: "Healthcare AI Ignored",
    description:
      "A hospital system deployed an AI triage assistant in the ER. Nurses were trained. The model correctly flags high-risk patients 89% of the time. After 4 months, nurses override the AI recommendation 78% of the time without logging a reason. Patient outcomes haven't improved.",
  },
];

export default function EnterpriseBottleneckCase() {
  const [selectedScenario, setSelectedScenario] = useState<
    (typeof SCENARIOS)[0] | null
  >(null);
  const [analysis, setAnalysis] = useState("");
  const [result, setResult] = useState<{
    dataLayer: number;
    governanceLayer: number;
    peopleLayer: number;
    infraLayer: number;
    systemsThinking: number;
    treatsAIAsBlackBox: boolean;
    feedback: string;
    missedLayers: string[];
    strongPoints: string[];
  } | null>(null);

  const score = trpc.aiTraining.scoreBottleneckAnalysis.useMutation();

  const handleSubmit = async () => {
    if (!selectedScenario) return;
    const res = await score.mutateAsync({
      scenario: selectedScenario.description,
      analysis,
    });
    setResult(res);
  };

  const reset = () => {
    setSelectedScenario(null);
    setAnalysis("");
    setResult(null);
  };

  const dims = result
    ? [
        { label: "Data Layer", val: result.dataLayer },
        { label: "Governance Layer", val: result.governanceLayer },
        { label: "People Layer", val: result.peopleLayer },
        { label: "Infra Layer", val: result.infraLayer },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            AI-Driven Impact — Enterprise Bottleneck
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          An enterprise AI rollout is stalling despite good model accuracy.
          Diagnose all bottleneck layers. The IC7 bar: connects data,
          governance, people, AND infra layers — not just one dimension.
        </p>
      </div>

      {!result && !selectedScenario && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Choose a scenario:
          </p>
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s)}
              className="w-full text-left p-4 rounded-lg border border-violet-500/20 bg-violet-500/5 hover:border-violet-500/50 transition-all space-y-1"
            >
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {s.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {!result && selectedScenario && (
        <div className="space-y-4">
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-xs font-semibold text-violet-300 mb-1">
              {selectedScenario.title}
            </p>
            <p className="text-sm text-foreground">
              {selectedScenario.description}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Your bottleneck analysis
            </label>
            <p className="text-xs text-muted-foreground italic">
              Diagnose across all layers: data quality, governance/policy,
              people/culture, and infrastructure. Explain the root cause and
              what you'd do first.
            </p>
            <Textarea
              value={analysis}
              onChange={e => setAnalysis(e.target.value)}
              placeholder="The primary bottleneck is not technical — it's in the people layer. Specifically… The governance layer also has a gap: there's no clear accountability for AI decisions, so managers default to spreadsheets to avoid blame… On the data side…"
              rows={8}
              className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedScenario(null)}
              className="border-violet-500/30"
            >
              ← Change Scenario
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={analysis.trim().length < 80 || score.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {score.isPending ? "Scoring…" : "Score My Analysis"}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-bold ${SCORE_COLOR(result.systemsThinking)}`}
            >
              {result.systemsThinking.toFixed(1)}
              <span className="text-lg text-muted-foreground">/5</span>
            </div>
            <div className="space-y-1">
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                {result.systemsThinking >= 4.5
                  ? "IC7 Systems Thinking ✦"
                  : result.systemsThinking >= 3.5
                    ? "Multi-Layer"
                    : "Single-Layer"}
              </Badge>
              {result.treatsAIAsBlackBox && (
                <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs ml-1">
                  ⚠ Treats AI as black box
                </Badge>
              )}
            </div>
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
              {result.missedLayers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> Missed layers
                  </p>
                  {result.missedLayers.map((p, i) => (
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
            <RefreshCw size={13} /> Try Another Scenario
          </Button>
        </div>
      )}
    </div>
  );
}
