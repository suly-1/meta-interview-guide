/**
 * Pass/Fail Verdict Engine — Priority #5
 * After a mock session, gives a hire/borderline/no-hire verdict with reasoning.
 * Uses the existing passFailVerdict procedure which scores a single interview dimension
 * with Meta rubric: correctness, trade-offs, scalability, communication.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Gavel,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  TrendingUp,
  RotateCcw,
  BarChart2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type SessionType = "coding" | "system_design" | "behavioral" | "full_loop";
type TargetLevel = "IC5" | "IC6" | "IC7";

interface VerdictResult {
  verdict: string;
  verdictLabel: string;
  confidence: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  decidingFactor: string;
  whatWouldChangeVerdict: string;
  rubricBreakdown: {
    correctness: number;
    tradeoffs: number;
    scalability: number;
    communication: number;
  };
  oneLineCoaching: string;
}

// ── Verdict config ────────────────────────────────────────────────────────────
function getVerdictConfig(verdict: string) {
  const v = verdict.toLowerCase();
  if (v === "hire" || (v.includes("hire") && !v.includes("no"))) {
    return {
      color: "text-emerald-300",
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/40",
      icon: CheckCircle2,
    };
  }
  if (v === "borderline") {
    return {
      color: "text-amber-300",
      bg: "bg-amber-500/15",
      border: "border-amber-500/40",
      icon: AlertTriangle,
    };
  }
  return {
    color: "text-red-300",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    icon: XCircle,
  };
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right font-mono font-bold text-sm">
        {value}/5
      </span>
    </div>
  );
}

// ── Sample sessions ───────────────────────────────────────────────────────────
const SAMPLE_SESSIONS: Record<
  SessionType,
  { question: string; answer: string; label: string }[]
> = {
  coding: [
    {
      label: "Strong IC6 coding",
      question: "Implement an LRU cache with O(1) get and put",
      answer:
        "Used OrderedDict in Python for O(1) get/put. Explained trade-off vs doubly-linked list + hashmap. Handled edge cases: capacity 0, single element, repeated access. Stated O(1) time and O(n) space complexity before coding. Code was clean with meaningful variable names.",
    },
    {
      label: "Borderline IC5 coding",
      question: "Implement an LRU cache with O(1) get and put",
      answer:
        "Used a list and dictionary. The get is O(1) but put is O(n) because I need to find and remove from the list. Got the correct answer but didn't optimize. Missed edge case where capacity is 1.",
    },
  ],
  system_design: [
    {
      label: "Strong IC6 design",
      question: "Design Instagram Feed",
      answer:
        "Requirements: 500M DAU, 100ms p99 latency, eventual consistency. High-level: CDN → API gateway → feed service → candidate generation (ANN) → ranking service → Redis cache. Deep-dive: two-stage retrieval for ranking, Redis sorted sets for feed cache with TTL. Trade-offs: precomputed vs real-time feed (chose precomputed for p99 latency, real-time for freshness).",
    },
    {
      label: "Weak IC5 design",
      question: "Design Instagram Feed",
      answer:
        "I'd use a database to store posts and query them for each user. Add a cache in front. Use a load balancer. The feed would show the latest posts from people you follow.",
    },
  ],
  behavioral: [
    {
      label: "Strong IC6 behavioral",
      question: "Tell me about a time you drove a large technical project",
      answer:
        "Situation: 200ms p99 latency causing 8% user drop-off. Task: reduce to 50ms. Action: I proposed and led a 6-month migration from monolith to microservices, coordinated 3 teams, unblocked 2 critical dependencies by escalating to VP. Result: 60ms p99, 15% engagement increase, $2M ARR impact. I owned the decision to use gRPC over REST despite pushback.",
    },
    {
      label: "Weak IC5 behavioral",
      question: "Tell me about a time you drove a large technical project",
      answer:
        "We worked on a big migration project. The team helped deliver it on time. I was involved in the backend work. It was successful and users were happy.",
    },
  ],
  full_loop: [
    {
      label: "Full loop summary",
      question: "Full loop interview assessment",
      answer:
        "Coding: Solved two medium problems in 45 min, explained complexity, handled edge cases. System design: Designed WhatsApp at scale, deep-dived into message delivery and offline handling. Behavioral: Two strong STAR stories with quantified impact. Communication: Structured, drove the conversation, asked clarifying questions.",
    },
  ],
};

// ── Main component ────────────────────────────────────────────────────────────
export function PassFailVerdictEngine() {
  const [expanded, setExpanded] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("coding");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("IC6");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [history, setHistory] = useState<
    { verdict: string; type: SessionType; level: TargetLevel }[]
  >([]);

  const verdictMutation = trpc.ai.passFailVerdict.useMutation({
    onSuccess: data => {
      setResult(data);
      setHistory(h => [
        ...h,
        { verdict: data.verdict, type: sessionType, level: targetLevel },
      ]);
    },
    onError: () => {
      toast.error("Verdict generation failed. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!question.trim()) {
      toast.error("Please enter the question or prompt.");
      return;
    }
    if (answer.trim().length < 30) {
      toast.error("Please write a more complete answer.");
      return;
    }
    setResult(null);
    verdictMutation.mutate({
      sessionType,
      questionOrPrompt: question,
      candidateAnswer: answer,
      targetLevel,
      additionalContext: additionalContext || undefined,
    });
  };

  const loadSample = (sample: { question: string; answer: string }) => {
    setQuestion(sample.question);
    setAnswer(sample.answer);
    setResult(null);
  };

  const vc = result ? getVerdictConfig(result.verdict) : null;
  const VerdictIcon = vc?.icon ?? CheckCircle2;

  const confidenceColor = (c: string) =>
    c === "high"
      ? "text-emerald-400"
      : c === "medium"
        ? "text-amber-400"
        : "text-red-400";

  const sessionTypeConfig: Record<
    SessionType,
    { label: string; placeholder: string }
  > = {
    coding: {
      label: "Coding",
      placeholder:
        "Describe your solution: approach, complexity, edge cases, code quality, how you communicated...",
    },
    system_design: {
      label: "System Design",
      placeholder:
        "Describe your design: requirements, high-level design, deep dives, trade-offs discussed...",
    },
    behavioral: {
      label: "Behavioral",
      placeholder:
        "Describe your STAR story: situation, task, action, result, impact quantified...",
    },
    full_loop: {
      label: "Full Loop",
      placeholder:
        "Summarize your full interview loop: coding, system design, behavioral performance...",
    },
  };

  return (
    <div className="prep-card mb-4" data-testid="pass-fail-verdict-engine">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors rounded-t-lg"
      >
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Gavel size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              Pass/Fail Verdict Engine
            </span>
            <span
              className="badge text-xs"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#fbbf24",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
            >
              Priority #5
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hire · Borderline · No Hire verdict with Meta rubric reasoning
          </p>
        </div>
        {history.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {history.length} verdicts
          </span>
        )}
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Session type + target level */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-muted-foreground mb-1 block">
                Interview Type
              </label>
              <div className="flex gap-1 flex-wrap">
                {(
                  [
                    "coding",
                    "system_design",
                    "behavioral",
                    "full_loop",
                  ] as SessionType[]
                ).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setSessionType(t);
                      setResult(null);
                      setQuestion("");
                      setAnswer("");
                    }}
                    className={`text-xs py-1.5 px-2 rounded border transition-all ${sessionType === t ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {sessionTypeConfig[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Target Level
              </label>
              <div className="flex gap-1">
                {(["IC5", "IC6", "IC7"] as TargetLevel[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setTargetLevel(l)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${targetLevel === l ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sample sessions */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Load sample session
            </label>
            <div className="flex gap-1 flex-wrap">
              {(SAMPLE_SESSIONS[sessionType] ?? []).map((s, i) => (
                <button
                  key={i}
                  onClick={() => loadSample(s)}
                  className="text-xs px-2 py-1.5 rounded border bg-secondary border-border text-muted-foreground hover:text-foreground transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Question / Prompt
            </label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Design Instagram Feed / Implement LRU Cache / Tell me about a time you..."
              className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Answer input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Your Answer
            </label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={sessionTypeConfig[sessionType].placeholder}
              rows={7}
              className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 focus:outline-none focus:border-amber-500/50 resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {answer.length} chars
            </div>
          </div>

          {/* Optional context */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Additional Context (optional)
            </label>
            <input
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. 45-min session, no hints given, interviewer was IC7..."
              className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={verdictMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {verdictMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating
                Verdict...
              </>
            ) : (
              <>
                <Gavel size={14} /> Generate Hire/No-Hire Verdict
              </>
            )}
          </button>

          {/* Results */}
          {result && vc && (
            <div className="space-y-3">
              {/* Verdict banner */}
              <div className={`p-4 rounded-xl border-2 ${vc.bg} ${vc.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <VerdictIcon size={24} className={vc.color} />
                    <div>
                      <div className={`text-xl font-bold ${vc.color}`}>
                        {result.verdictLabel || result.verdict}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        Confidence:{" "}
                        <span className={confidenceColor(result.confidence)}>
                          {result.confidence}
                        </span>
                        <span className="mx-1">·</span>
                        Target: {targetLevel}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  {result.oneLineCoaching}
                </p>
              </div>

              {/* Rubric scores */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <BarChart2 size={11} /> Meta Rubric Breakdown
                </div>
                <ScoreBar
                  label="Correctness"
                  value={result.rubricBreakdown.correctness}
                />
                <ScoreBar
                  label="Trade-offs"
                  value={result.rubricBreakdown.tradeoffs}
                />
                <ScoreBar
                  label="Scalability"
                  value={result.rubricBreakdown.scalability}
                />
                <ScoreBar
                  label="Communication"
                  value={result.rubricBreakdown.communication}
                />
              </div>

              {/* Evidence for / against */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Evidence For
                  </div>
                  <ul className="space-y-1">
                    {result.evidenceFor.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                    <XCircle size={11} /> Evidence Against
                  </div>
                  <ul className="space-y-1">
                    {result.evidenceAgainst.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Deciding factor + what would change */}
              <div className="space-y-2">
                <div className="bg-secondary/30 rounded-md p-3 border border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Target size={11} /> Deciding Factor
                  </div>
                  <p className="text-xs text-foreground">
                    {result.decidingFactor}
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                    <TrendingUp size={11} /> What Would Change the Verdict
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.whatWouldChangeVerdict}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setQuestion("");
                  setAnswer("");
                  setAdditionalContext("");
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
              >
                <RotateCcw size={13} /> New Session
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Verdict History
              </div>
              <div className="space-y-1">
                {history.slice(-5).map((h, i) => {
                  const hvc = getVerdictConfig(h.verdict);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className={`font-medium ${hvc.color}`}>
                        {h.verdict}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {sessionTypeConfig[h.type].label}
                        </span>
                        <span className="text-muted-foreground">{h.level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
