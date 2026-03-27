/**
 * FullMockScreeningCall
 *
 * Simulates the complete Meta AI-Native recruiter screening call (4 phases, ~30 min).
 * Scores are persisted to the DB via aiNativeHistory.saveMockSession.
 * A History panel shows past sessions with per-phase breakdown and comparison view.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  RefreshCw,
  ChevronRight,
  Mic,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

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

type HistorySession = {
  sessionId: string;
  overallScore: number;
  maturityLevel: string | null;
  sessionData: Record<string, unknown>;
  createdAt: Date;
};

function maturityLabel(score: number) {
  if (score >= 4.5) return "✦ AI Native — Strong Pass";
  if (score >= 3.5) return "AI First — Likely Pass";
  if (score >= 2.5) return "AI Enabled — Borderline";
  return "AI Aware — Not Yet";
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUp size={12} className="text-emerald-400" />;
  if (delta < 0) return <TrendingDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-muted-foreground" />;
}

function SessionCard({
  session,
  compareSession,
  onDelete,
  onCompare,
  isComparing,
}: {
  session: HistorySession;
  compareSession?: HistorySession | null;
  onDelete: (id: string) => void;
  onCompare: (id: string) => void;
  isComparing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const data = session.sessionData as Record<string, PhaseResult>;

  return (
    <Card
      className={`border transition-all ${isComparing ? "border-violet-500/50 bg-violet-500/8" : "border-violet-500/20 bg-violet-500/5"}`}
    >
      <CardContent className="pt-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xl font-bold ${SCORE_COLOR(session.overallScore)}`}
            >
              {session.overallScore.toFixed(1)}
              <span className="text-xs text-muted-foreground font-normal">
                /5
              </span>
            </span>
            <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs">
              {session.maturityLevel ?? maturityLabel(session.overallScore)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {new Date(session.createdAt).toLocaleDateString()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isComparing ? "text-violet-400" : "text-muted-foreground"}`}
              onClick={() => onCompare(session.sessionId)}
              title="Compare"
            >
              <TrendingUp size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-400"
              onClick={() => onDelete(session.sessionId)}
            >
              <Trash2 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Button>
          </div>
        </div>

        {/* Phase score pills */}
        <div className="flex gap-1.5 flex-wrap">
          {PHASES.map(p => {
            const r = data[p.id] as PhaseResult | undefined;
            if (!r) return null;
            const compareR = compareSession
              ? ((compareSession.sessionData as Record<string, PhaseResult>)[
                  p.id
                ] as PhaseResult | undefined)
              : null;
            const delta = compareR ? r.phaseScore - compareR.phaseScore : null;
            return (
              <div
                key={p.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/50 border border-border text-xs"
              >
                <span className="text-muted-foreground">{p.label}</span>
                <span className={`font-bold ${SCORE_COLOR(r.phaseScore)}`}>
                  {r.phaseScore}/5
                </span>
                {delta !== null && (
                  <span
                    className={
                      delta > 0
                        ? "text-emerald-400"
                        : delta < 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }
                  >
                    <DeltaIcon delta={delta} />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Expanded per-phase detail */}
        {expanded && (
          <div className="space-y-3 pt-1">
            {PHASES.map(p => {
              const r = data[p.id] as PhaseResult | undefined;
              if (!r) return null;
              const compareR = compareSession
                ? ((compareSession.sessionData as Record<string, PhaseResult>)[
                    p.id
                  ] as PhaseResult | undefined)
                : null;
              const delta = compareR
                ? r.phaseScore - compareR.phaseScore
                : null;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-violet-500/15 bg-background/30 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {p.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold ${SCORE_COLOR(r.phaseScore)}`}
                      >
                        {r.phaseScore}/5
                      </span>
                      {delta !== null && (
                        <span
                          className={`text-xs flex items-center gap-0.5 ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"}`}
                        >
                          <DeltaIcon delta={delta} />
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.feedback}</p>
                  {r.coachingNote && (
                    <p className="text-xs text-violet-300 italic">
                      {r.coachingNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FullMockScreeningCall() {
  const [view, setView] = useState<"intro" | "phase" | "debrief" | "history">(
    "intro"
  );
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phaseResults, setPhaseResults] = useState<Record<string, PhaseResult>>(
    {}
  );
  const [compareId, setCompareId] = useState<string | null>(null);

  const score = trpc.aiTraining.scoreMockScreeningPhase.useMutation();
  const saveMock = trpc.aiNativeHistory.saveMockSession.useMutation();
  const deleteMock = trpc.aiNativeHistory.deleteMockSession.useMutation();
  const utils = trpc.useUtils();

  const { data: history = [], isLoading: historyLoading } =
    trpc.aiNativeHistory.getMockHistory.useQuery();

  const current = PHASES[phaseIdx];

  const overallScore = useMemo(() => {
    const results = Object.values(phaseResults);
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.phaseScore, 0) / results.length;
  }, [phaseResults]);

  const handleSubmitPhase = async () => {
    const res = await score.mutateAsync({
      phase: current.id,
      question: current.question,
      answer: answers[current.id] || "",
    });
    const updated = { ...phaseResults, [current.id]: res };
    setPhaseResults(updated);
    if (phaseIdx + 1 >= PHASES.length) {
      // All phases done — persist to DB
      const finalScore =
        Object.values(updated).reduce((s, r) => s + r.phaseScore, 0) /
        PHASES.length;
      const levelLabel = maturityLabel(finalScore).split(" — ")[0];
      const sessionId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await saveMock.mutateAsync({
        sessionId,
        overallScore: Math.round(finalScore * 10) / 10,
        maturityLevel: levelLabel,
        sessionData: updated as Record<string, unknown>,
      });
      utils.aiNativeHistory.getMockHistory.invalidate();
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

  const handleDelete = async (sessionId: string) => {
    await deleteMock.mutateAsync({ sessionId });
    utils.aiNativeHistory.getMockHistory.invalidate();
    if (compareId === sessionId) setCompareId(null);
  };

  const compareSession = useMemo(
    () =>
      compareId
        ? ((history as HistorySession[]).find(s => s.sessionId === compareId) ??
          null)
        : null,
    [compareId, history]
  );

  return (
    <div className="space-y-5">
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
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
              rubric used in real screens. Sessions are saved to your history.
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

          <div className="flex gap-2">
            <Button
              onClick={() => setView("phase")}
              className="bg-violet-600 hover:bg-violet-700 text-white flex-1 gap-2"
            >
              <Mic size={14} /> Start Mock Screening Call
            </Button>
            <Button
              variant="outline"
              className="border-violet-500/30 gap-1"
              onClick={() => setView("history")}
            >
              <History size={14} />
              {(history as HistorySession[]).length > 0 &&
                `${(history as HistorySession[]).length}`}
            </Button>
          </div>
        </>
      )}

      {/* ── Phase ─────────────────────────────────────────────────────────── */}
      {view === "phase" && (
        <div className="space-y-4">
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
              (answers[current.id] || "").trim().length < 50 ||
              score.isPending ||
              saveMock.isPending
            }
            className="bg-violet-600 hover:bg-violet-700 text-white w-full gap-2"
          >
            {score.isPending || saveMock.isPending ? (
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

      {/* ── Debrief ───────────────────────────────────────────────────────── */}
      {view === "debrief" && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold ${SCORE_COLOR(overallScore)}`}>
              {overallScore.toFixed(1)}
              <span className="text-xl text-muted-foreground">/5</span>
            </div>
            <div>
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {maturityLabel(overallScore)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Across {PHASES.length} phases · saved to history
              </p>
            </div>
          </div>

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

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={reset}
              className="border-violet-500/30 gap-1 flex-1"
            >
              <RefreshCw size={13} /> Retake Mock Call
            </Button>
            <Button
              variant="outline"
              className="border-violet-500/30 gap-1"
              onClick={() => setView("history")}
            >
              <History size={14} /> History
            </Button>
          </div>
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────────── */}
      {view === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setView("intro")}
            >
              <ArrowLeft size={14} />
            </Button>
            <span className="text-sm font-semibold text-foreground">
              Mock Screening History
            </span>
            {compareId && (
              <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs ml-auto">
                Comparing — click another session to compare
              </Badge>
            )}
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (history as HistorySession[]).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No sessions yet — complete your first mock call to see history
              here.
            </div>
          ) : (
            <div className="space-y-3">
              {(history as HistorySession[]).map(s => (
                <SessionCard
                  key={s.sessionId}
                  session={s}
                  compareSession={compareSession}
                  onDelete={handleDelete}
                  onCompare={id =>
                    setCompareId(prev => (prev === id ? null : id))
                  }
                  isComparing={compareId === s.sessionId}
                />
              ))}
            </div>
          )}

          <Button
            onClick={() => setView("intro")}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full gap-2"
          >
            <Mic size={14} /> Start New Mock Call
          </Button>
        </div>
      )}
    </div>
  );
}
