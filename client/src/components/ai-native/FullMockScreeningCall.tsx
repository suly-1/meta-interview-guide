// AI-Native Drill #30 — Full Mock Screening Call (4 phases, ~30 min)
// Simulates the Meta AI-Native recruiter screening call end-to-end
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Phone, RefreshCw, ChevronRight, Mic } from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const PHASES = [
  {
    id: "warmup",
    label: "Warm-Up",
    duration: "5 min",
    rubricAxis: "AI Fluency & Tool Orchestration",
    description:
      "The recruiter opens with an open-ended question to gauge your AI background and reasoning style.",
    question:
      "Tell me about the most interesting AI system you've built or contributed to recently. What made it interesting?",
    hint: "IC7 signal: concrete reasoning, mentions agents/infra, absence of hype. Not 'I used ChatGPT to write emails'.",
  },
  {
    id: "fluency",
    label: "Fluency Check",
    duration: "8 min",
    rubricAxis: "AI Fluency & Tool Orchestration",
    description:
      "The recruiter probes your technical depth on a core AI concept.",
    question:
      "Walk me through how you'd decide between RAG and fine-tuning for a new use case. What questions do you ask first?",
    hint: "IC7 signal: correct, succinct, caveated. Mentions evals, cost, latency, freshness requirements. Not a Wikipedia summary.",
  },
  {
    id: "builder",
    label: "Builder Signal",
    duration: "10 min",
    rubricAxis: "AI-Driven Impact",
    description:
      "The recruiter asks you to walk through a real AI project you built.",
    question:
      "Tell me about an AI project where you went from prototype to production. What was the hardest part, and how did you measure success?",
    hint: "IC7 signal: full stack (model + tooling + workflow), quantified impact, lessons learned. Not a demo that never shipped.",
  },
  {
    id: "philosophy",
    label: "Philosophy & Culture",
    duration: "7 min",
    rubricAxis: "Continuous AI Learning",
    description:
      "The recruiter probes your epistemic humility and learning velocity.",
    question:
      "What's something you believed about AI 12 months ago that you've since changed your mind about? What changed it?",
    hint: "IC7 signal: specific belief, specific evidence, specific new mental model. Not 'I learned to test more'.",
  },
];

type PhaseResult = {
  phaseScore: number;
  maturityTierSignal: string;
  rubricAxis: string;
  axisScore: number;
  feedback: string;
  strongSignals: string[];
  weakSignals: string[];
  coachingNote: string;
};

export default function FullMockScreeningCall() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phaseResults, setPhaseResults] = useState<Record<string, PhaseResult>>(
    {}
  );
  const [view, setView] = useState<"intro" | "phase" | "debrief">("intro");

  const score = trpc.aiTraining.scoreMockScreeningPhase.useMutation();

  const current = PHASES[phaseIdx];

  const handleSubmitPhase = async () => {
    const res = await score.mutateAsync({
      phase: current.id,
      question: current.question,
      answer: answers[current.id] || "",
    });
    setPhaseResults(r => ({ ...r, [current.id]: res }));
    if (phaseIdx + 1 >= PHASES.length) {
      setView("debrief");
    } else {
      setPhaseIdx(i => i + 1);
    }
  };

  const reset = () => {
    setPhaseIdx(0);
    setAnswers({});
    setPhaseResults({});
    setView("intro");
  };

  const overallScore =
    Object.values(phaseResults).length > 0
      ? Object.values(phaseResults).reduce((sum, r) => sum + r.phaseScore, 0) /
        Object.values(phaseResults).length
      : 0;

  return (
    <div className="space-y-5">
      {view === "intro" && (
        <>
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-violet-400" />
              <span className="text-sm font-semibold text-violet-300">
                Full Mock Screening Call — ~30 minutes
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates the complete Meta AI-Native recruiter screening call
              across 4 phases. Each phase is scored by the LLM against the exact
              rubric used in real screens.
            </p>
          </div>

          <div className="space-y-2">
            {PHASES.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border"
              >
                <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {p.label}
                    </span>
                    <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs">
                      {p.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.rubricAxis}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setView("phase")}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full gap-2"
          >
            <Mic size={14} /> Start Mock Screening Call
          </Button>
        </>
      )}

      {view === "phase" && (
        <div className="space-y-4">
          {/* Phase progress */}
          <div className="flex gap-1.5">
            {PHASES.map((p, i) => (
              <div
                key={p.id}
                className={`flex-1 h-1.5 rounded-full ${
                  i < phaseIdx
                    ? "bg-emerald-500"
                    : i === phaseIdx
                      ? "bg-violet-500"
                      : "bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
              Phase {phaseIdx + 1} / {PHASES.length}
            </Badge>
            <span className="text-sm font-semibold text-foreground">
              {current.label}
            </span>
            <Badge className="bg-border text-muted-foreground text-xs">
              {current.duration}
            </Badge>
          </div>

          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              {current.description}
            </p>
            <p className="text-sm font-medium text-foreground">
              "{current.question}"
            </p>
            <p className="text-xs text-muted-foreground italic">
              {current.hint}
            </p>
          </div>

          <Textarea
            value={answers[current.id] || ""}
            onChange={e =>
              setAnswers(a => ({ ...a, [current.id]: e.target.value }))
            }
            placeholder="Write your answer as you would speak it…"
            rows={7}
            className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
          />

          <Button
            onClick={handleSubmitPhase}
            disabled={
              (answers[current.id] || "").trim().length < 50 || score.isPending
            }
            className="bg-violet-600 hover:bg-violet-700 text-white w-full gap-2"
          >
            {score.isPending ? (
              "Scoring…"
            ) : phaseIdx + 1 < PHASES.length ? (
              <>
                Submit & Continue <ChevronRight size={14} />
              </>
            ) : (
              "Submit & Get Debrief"
            )}
          </Button>
        </div>
      )}

      {view === "debrief" && (
        <div className="space-y-5">
          {/* Overall score */}
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${SCORE_COLOR(overallScore)}`}>
              {overallScore.toFixed(1)}
              <span className="text-xl text-muted-foreground">/5</span>
            </div>
            <div>
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {overallScore >= 4.5
                  ? "✦ AI Native — Strong Pass"
                  : overallScore >= 3.5
                    ? "AI First — Likely Pass"
                    : overallScore >= 2.5
                      ? "AI Enabled — Borderline"
                      : "AI Aware — Not Yet"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Across {PHASES.length} phases
              </p>
            </div>
          </div>

          {/* Per-phase breakdown */}
          {PHASES.map(p => {
            const r = phaseResults[p.id];
            if (!r) return null;
            return (
              <Card key={p.id} className="border-violet-500/20 bg-violet-500/5">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {p.label}
                      </span>
                      <Badge className="ml-2 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs">
                        {r.rubricAxis}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${SCORE_COLOR(r.phaseScore)}`}
                      >
                        {r.phaseScore}/5
                      </span>
                      <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs">
                        {r.maturityTierSignal}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={r.phaseScore * 20} className="h-1.5" />
                  <p className="text-sm text-foreground">{r.feedback}</p>
                  {r.strongSignals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 mb-1">
                        ✓ Strong signals
                      </p>
                      {r.strongSignals.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          • {s}
                        </p>
                      ))}
                    </div>
                  )}
                  {r.weakSignals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1">
                        △ Weak signals
                      </p>
                      {r.weakSignals.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          • {s}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                    <p className="text-xs font-semibold text-violet-300 mb-1">
                      Coaching note
                    </p>
                    <p className="text-xs text-foreground">{r.coachingNote}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={reset}
            className="border-violet-500/30 gap-1 w-full"
          >
            <RefreshCw size={13} /> Retake Mock Call
          </Button>
        </div>
      )}
    </div>
  );
}
