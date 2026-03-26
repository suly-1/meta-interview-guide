/**
 * Meta Product Design Simulator — Priority #3
 * 45-minute timer-based session where the candidate designs a real Meta product.
 * Tracks time per phase: requirements → high-level → deep dive → tradeoffs.
 * LLM scores against Meta's 4 rubric signals: correctness, tradeoffs, scalability, communication.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Layout,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  ArrowRight,
  Trophy,
  Target,
} from "lucide-react";

// ── Meta product prompts ──────────────────────────────────────────────────────
const META_PRODUCTS = [
  {
    id: "instagram-feed",
    title: "Design Instagram Feed",
    description:
      "Design the core feed ranking and delivery system for Instagram. Consider: content sources, ranking signals, delivery at scale, and the trade-off between freshness and relevance.",
    difficulty: "IC6",
    area: "Feed",
    hints: [
      "Start with functional requirements: what does the feed show?",
      "Consider: how do you rank 1000 candidate posts to show 20?",
      "Think about: how do you handle 500M DAU?",
    ],
  },
  {
    id: "fb-live-comments",
    title: "Design Facebook Live Comments",
    description:
      "Design the real-time comment system for Facebook Live. A live video can have millions of concurrent viewers all sending and receiving comments simultaneously.",
    difficulty: "IC6",
    area: "Video",
    hints: [
      "Key challenge: fan-out to millions of viewers in real-time",
      "Consider: do you need strong consistency for comments?",
      "Think about: comment moderation at scale",
    ],
  },
  {
    id: "whatsapp-delivery",
    title: "Design WhatsApp Delivery Receipts",
    description:
      "Design the message delivery receipt system (sent ✓, delivered ✓✓, read ✓✓ blue). Handle offline users, message ordering, and delivery guarantees.",
    difficulty: "IC6",
    area: "Messaging",
    hints: [
      "Consider: what happens when the recipient is offline?",
      "Think about: how do you guarantee exactly-once delivery?",
      "Consider: how do you handle the 'read' receipt privacy setting?",
    ],
  },
  {
    id: "marketplace-search",
    title: "Design Marketplace Search",
    description:
      "Design the search system for Facebook Marketplace. Users search for items by keyword, location, price range, and category. Sellers list items with photos and descriptions.",
    difficulty: "IC7",
    area: "Search",
    hints: [
      "Consider: how do you index 1B+ listings efficiently?",
      "Think about: location-based ranking (nearby items first)",
      "Consider: how do you handle real-time inventory (sold items)?",
    ],
  },
  {
    id: "reels-recommendation",
    title: "Design Instagram Reels Recommendation",
    description:
      "Design the recommendation engine for Instagram Reels. The system must surface relevant short videos to users in real-time, optimizing for engagement while avoiding filter bubbles.",
    difficulty: "IC7",
    area: "Feed",
    hints: [
      "Consider: two-stage retrieval (candidate generation → ranking)",
      "Think about: how do you handle cold start for new creators?",
      "Consider: engagement metrics vs. watch time as signals",
    ],
  },
  {
    id: "ads-targeting",
    title: "Design Meta Ads Targeting",
    description:
      "Design the targeting system for Meta ads. Advertisers specify audience criteria (demographics, interests, behaviors). The system must match ads to users in real-time during feed loading.",
    difficulty: "IC7",
    area: "Ads",
    hints: [
      "Consider: how do you match ads to users in <100ms?",
      "Think about: privacy constraints (iOS 14 ATT, GDPR)",
      "Consider: the auction mechanism for ad selection",
    ],
  },
];

// ── Phase configuration ───────────────────────────────────────────────────────
const PHASES = [
  {
    id: "requirements",
    label: "Requirements",
    time: 10,
    placeholder:
      "List functional requirements (what the system must do) and non-functional requirements (scale, latency, availability). Ask clarifying questions about: DAU, QPS, data volume, read/write ratio, global vs regional.",
  },
  {
    id: "highLevel",
    label: "High-Level Design",
    time: 15,
    placeholder:
      "Draw the core components: clients, load balancer, API servers, database, cache, message queue. Describe the end-to-end data flow for the primary use case. Identify the key components and their responsibilities.",
  },
  {
    id: "deepDive",
    label: "Deep Dive",
    time: 12,
    placeholder:
      "Pick 2 components to deep-dive. Discuss: sharding strategy, caching policy, replication, or the specific bottleneck for this problem. Show technical depth.",
  },
  {
    id: "tradeoffs",
    label: "Trade-offs",
    time: 8,
    placeholder:
      "Explicitly discuss trade-offs you made. For each major design decision: what alternatives did you consider? Why did you choose this approach? What are the downsides?",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type PhaseId = "requirements" | "highLevel" | "deepDive" | "tradeoffs";
type SessionState = "idle" | "running" | "scoring" | "scored";

interface ScoreResult {
  correctness: number;
  tradeoffs: number;
  scalability: number;
  communication: number;
  overallScore: number;
  verdict: string;
  hiringDecision: string;
  requirementsFeedback: string;
  highLevelFeedback: string;
  deepDiveFeedback: string;
  tradeoffsFeedback: string;
  topStrength: string;
  criticalGap: string;
  icLevelSignal: string;
  toReachNextLevel: string;
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

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
  }, [stop]);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  return { elapsed, running, start, stop, reset };
}

// ── Main component ────────────────────────────────────────────────────────────
export function MetaProductDesignSimulator() {
  const [expanded, setExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(META_PRODUCTS[0]);
  const [targetLevel, setTargetLevel] = useState<"IC5" | "IC6" | "IC7">("IC6");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<PhaseId, string>>({
    requirements: "",
    highLevel: "",
    deepDive: "",
    tradeoffs: "",
  });
  const [phaseTimings, setPhaseTimings] = useState<Record<PhaseId, number>>({
    requirements: 0,
    highLevel: 0,
    deepDive: 0,
    tradeoffs: 0,
  });
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [history, setHistory] = useState<
    { product: string; verdict: string; overall: number }[]
  >([]);

  const timer = useTimer();
  const currentPhase = PHASES[currentPhaseIdx];
  const phaseTimeLimit = currentPhase.time * 60;
  const phaseElapsed = timer.elapsed;
  const phaseRemaining = Math.max(0, phaseTimeLimit - phaseElapsed);
  const isOverTime = phaseElapsed > phaseTimeLimit;

  const scoreMutation = trpc.ai.metaProductDesignScore.useMutation({
    onSuccess: data => {
      setScore(data);
      setSessionState("scored");
      setHistory(h => [
        ...h,
        {
          product: selectedProduct.title,
          verdict: data.verdict,
          overall: data.overallScore,
        },
      ]);
    },
    onError: () => {
      toast.error("Scoring failed. Please try again.");
      setSessionState("running");
    },
  });

  const startSession = () => {
    setAnswers({
      requirements: "",
      highLevel: "",
      deepDive: "",
      tradeoffs: "",
    });
    setPhaseTimings({
      requirements: 0,
      highLevel: 0,
      deepDive: 0,
      tradeoffs: 0,
    });
    setCurrentPhaseIdx(0);
    setScore(null);
    setSessionState("running");
    timer.reset();
    timer.start();
  };

  const advancePhase = () => {
    const phaseId = currentPhase.id as PhaseId;
    setPhaseTimings(t => ({ ...t, [phaseId]: timer.elapsed }));
    timer.reset();
    timer.start();
    if (currentPhaseIdx < PHASES.length - 1) {
      setCurrentPhaseIdx(i => i + 1);
    } else {
      // Submit for scoring
      timer.stop();
      setSessionState("scoring");
      const totalTime =
        Object.values(phaseTimings).reduce((a, b) => a + b, 0) + timer.elapsed;
      scoreMutation.mutate({
        productPrompt:
          selectedProduct.title + ": " + selectedProduct.description,
        requirementsAnswer: answers.requirements,
        highLevelAnswer: answers.highLevel,
        deepDiveAnswer: answers.deepDive,
        tradeoffsAnswer: answers.tradeoffs,
        targetLevel,
        totalTimeSeconds: totalTime,
      });
    }
  };

  const resetSession = () => {
    setSessionState("idle");
    setCurrentPhaseIdx(0);
    setScore(null);
    timer.reset();
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timeColor = isOverTime
    ? "text-red-400"
    : phaseRemaining < 60
      ? "text-amber-400"
      : "text-emerald-400";

  const verdictConfig: Record<
    string,
    { color: string; bg: string; border: string }
  > = {
    "Strong Hire": {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    Hire: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    Borderline: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    "No Hire": {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    },
  };
  const vc = score
    ? (verdictConfig[score.verdict] ?? verdictConfig["Borderline"])
    : null;

  const phaseFeedback: Record<PhaseId, keyof ScoreResult> = {
    requirements: "requirementsFeedback",
    highLevel: "highLevelFeedback",
    deepDive: "deepDiveFeedback",
    tradeoffs: "tradeoffsFeedback",
  };

  return (
    <div className="prep-card mb-4" data-testid="meta-product-design-simulator">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors rounded-t-lg"
      >
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Layout size={16} className="text-purple-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              Meta Product Design Simulator
            </span>
            <span
              className="badge text-xs"
              style={{
                background: "rgba(168,85,247,0.15)",
                color: "#c084fc",
                border: "1px solid rgba(168,85,247,0.3)",
              }}
            >
              Priority #3
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            45-min timed session · 4 phases · Meta rubric scoring
          </p>
        </div>
        {history.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {history.length} sessions
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
          {sessionState === "idle" && (
            <>
              {/* Product selector */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Select a Meta Product to Design
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {META_PRODUCTS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`text-left p-3 rounded-lg border transition-all ${selectedProduct.id === p.id ? "bg-purple-500/10 border-purple-500/40" : "bg-secondary/30 border-border hover:border-purple-500/30"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{p.title}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.difficulty === "IC7" ? "bg-purple-500/20 text-purple-300" : "bg-emerald-500/20 text-emerald-300"}`}
                        >
                          {p.difficulty}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.area}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target level */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Target Level
                </label>
                <div className="flex gap-2">
                  {(["IC5", "IC6", "IC7"] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setTargetLevel(l)}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium border transition-all ${targetLevel === l ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected product preview */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <div className="font-medium text-sm mb-1">
                  {selectedProduct.title}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedProduct.description}
                </p>
                <button
                  onClick={() => setShowHints(h => !h)}
                  className="text-xs text-amber-400 flex items-center gap-1"
                >
                  <AlertTriangle size={11} /> {showHints ? "Hide" : "Show"}{" "}
                  hints
                </button>
                {showHints && (
                  <ul className="mt-2 space-y-1">
                    {selectedProduct.hints.map((h, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-amber-400 shrink-0">•</span> {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Phase overview */}
              <div className="grid grid-cols-4 gap-1.5">
                {PHASES.map((p, i) => (
                  <div
                    key={p.id}
                    className="bg-secondary/30 rounded-md p-2 text-center border border-border"
                  >
                    <div className="text-xs font-medium mb-0.5">{p.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.time} min
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={startSession}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
              >
                <Play size={15} /> Start 45-Minute Session
              </button>
            </>
          )}

          {(sessionState === "running" || sessionState === "scoring") && (
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                {PHASES.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex-1 h-1 rounded-full transition-all ${i < currentPhaseIdx ? "bg-emerald-500" : i === currentPhaseIdx ? "bg-purple-500" : "bg-secondary"}`}
                  />
                ))}
              </div>

              {/* Phase header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">
                    {currentPhase.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({currentPhaseIdx + 1}/{PHASES.length})
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1.5 font-mono font-bold text-sm ${timeColor}`}
                >
                  <Clock size={13} />
                  {isOverTime
                    ? `+${formatTime(phaseElapsed - phaseTimeLimit)}`
                    : formatTime(phaseRemaining)}
                  {isOverTime && (
                    <span className="text-xs font-normal text-red-400">
                      over
                    </span>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <div className="bg-secondary/30 rounded-md p-2 text-xs text-muted-foreground border border-border">
                <span className="font-medium text-foreground">
                  {selectedProduct.title}:{" "}
                </span>
                {currentPhase.placeholder}
              </div>

              {/* Answer textarea */}
              <textarea
                value={answers[currentPhase.id as PhaseId]}
                onChange={e =>
                  setAnswers(a => ({ ...a, [currentPhase.id]: e.target.value }))
                }
                placeholder={currentPhase.placeholder}
                rows={8}
                className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 focus:outline-none focus:border-purple-500/50 resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={resetSession}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                >
                  <RotateCcw size={13} /> Reset
                </button>
                <button
                  onClick={advancePhase}
                  disabled={sessionState === "scoring"}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {sessionState === "scoring" ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Scoring...
                    </>
                  ) : currentPhaseIdx < PHASES.length - 1 ? (
                    <>
                      Next: {PHASES[currentPhaseIdx + 1].label}{" "}
                      <ArrowRight size={13} />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Submit for Scoring
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {sessionState === "scored" && score && vc && (
            <div className="space-y-3">
              {/* Verdict banner */}
              <div className={`p-4 rounded-lg border ${vc.bg} ${vc.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xl font-bold ${vc.color}`}>
                    {score.verdict}
                  </span>
                  <span className="font-mono font-bold text-2xl">
                    {score.overallScore.toFixed(1)}/5
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {score.hiringDecision}
                </p>
              </div>

              {/* Rubric scores */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Meta Rubric Breakdown
                </div>
                <ScoreBar label="Correctness" value={score.correctness} />
                <ScoreBar label="Trade-offs" value={score.tradeoffs} />
                <ScoreBar label="Scalability" value={score.scalability} />
                <ScoreBar label="Communication" value={score.communication} />
              </div>

              {/* IC level signal */}
              <div className="bg-secondary/30 rounded-md p-3 border border-border">
                <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Target size={11} /> IC Level Signal
                </div>
                <p className="text-xs text-foreground">{score.icLevelSignal}</p>
                <div className="text-xs font-medium text-purple-400 mt-2 mb-1">
                  To reach next level:
                </div>
                <p className="text-xs text-muted-foreground">
                  {score.toReachNextLevel}
                </p>
              </div>

              {/* Phase-by-phase feedback */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Phase Feedback
                </div>
                {PHASES.map(p => (
                  <div
                    key={p.id}
                    className="bg-secondary/20 rounded-md p-2 border border-border"
                  >
                    <div className="text-xs font-medium mb-1">{p.label}</div>
                    <p className="text-xs text-muted-foreground">
                      {score[phaseFeedback[p.id as PhaseId]] as string}
                    </p>
                  </div>
                ))}
              </div>

              {/* Top strength + critical gap */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-emerald-400 mb-1">
                    Top Strength
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {score.topStrength}
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-red-400 mb-1">
                    Critical Gap
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {score.criticalGap}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetSession}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm transition-colors"
                >
                  <RotateCcw size={13} /> Try Again
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(
                      META_PRODUCTS[
                        (META_PRODUCTS.indexOf(selectedProduct) + 1) %
                          META_PRODUCTS.length
                      ]
                    );
                    resetSession();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors"
                >
                  Next Product <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Trophy size={11} /> Session History
              </div>
              <div className="space-y-1">
                {history.slice(-5).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground truncate">
                      {h.product}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`font-medium ${h.verdict === "Strong Hire" || h.verdict === "Hire" ? "text-emerald-400" : h.verdict === "Borderline" ? "text-amber-400" : "text-red-400"}`}
                      >
                        {h.verdict}
                      </span>
                      <span className="font-mono">
                        {h.overall.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
