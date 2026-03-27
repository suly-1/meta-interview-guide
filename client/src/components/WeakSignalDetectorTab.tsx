// Feature #14: Weak Signal Detector
// Analyzes patterns across all practice sessions and identifies the candidate's
// three weakest signals. Generates targeted 15-minute drills for each weakness.

import { useState, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  TrendingDown,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  BarChart2,
  ArrowRight,
  Lightbulb,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AttemptRecord } from "./DebuggingDrillTab";
import type { ReplaySession } from "./InterviewReplayTab";
import ScreenInterviewWatermark from "@/components/ScreenInterviewWatermark";

// ── Signal Definitions ────────────────────────────────────────────────────────

export interface SignalDimension {
  id: string;
  name: string;
  description: string;
  category: "coding" | "system_design" | "behavioral" | "process";
  examples: string[];
  drillPrompt: string;
}

const SIGNAL_DIMENSIONS: SignalDimension[] = [
  {
    id: "nfr",
    name: "Non-Functional Requirements",
    category: "system_design",
    description: "Consistently skipping scalability, availability, latency, and reliability requirements before diving into implementation.",
    examples: ["Jumping to DB schema without stating QPS targets", "Not mentioning SLAs or error budgets", "Skipping capacity estimation"],
    drillPrompt: "For the next system design question, spend the first 5 minutes ONLY on non-functional requirements. State: expected QPS, storage per day, read/write ratio, latency SLA, availability target. Do not draw any boxes until you have written all 5.",
  },
  {
    id: "tradeoffs",
    name: "Tradeoff Articulation",
    category: "system_design",
    description: "Stating design choices without explaining the tradeoffs. Meta interviewers specifically look for 'why not X' reasoning.",
    examples: ["'I'll use Cassandra' without explaining why not MySQL", "Choosing eventual consistency without mentioning when strong consistency would be needed", "Picking microservices without discussing the operational overhead"],
    drillPrompt: "For every design decision you make today, force yourself to say: 'I chose X over Y because... The downside of X is... I'd switch to Y if...' Practice this on 3 decisions: database choice, caching strategy, and API design.",
  },
  {
    id: "requirements",
    name: "Requirements Clarification",
    category: "process",
    description: "Jumping to implementation before clarifying scope. Meta interviewers flag candidates who assume rather than ask.",
    examples: ["Starting to code before asking about edge cases", "Designing a full system when a simpler scope was intended", "Not asking about scale (1K vs 1B users)"],
    drillPrompt: "Before answering any question today, write down 3 clarifying questions you would ask the interviewer. Only start answering after you have written all 3. Practice: 'What is the expected scale?', 'What are the most important features?', 'What can I simplify?'",
  },
  {
    id: "complexity",
    name: "Complexity Analysis",
    category: "coding",
    description: "Not stating time and space complexity after implementing a solution. Meta interviewers expect this unprompted.",
    examples: ["Implementing a solution without stating O(n log n) time", "Not mentioning the space complexity of the recursion stack", "Not comparing complexity of two approaches"],
    drillPrompt: "For every coding solution today, add a comment block at the end: '# Time: O(?) because... # Space: O(?) because... # Could improve to O(?) by...' Do this even for trivial solutions.",
  },
  {
    id: "edge_cases",
    name: "Edge Case Coverage",
    category: "coding",
    description: "Missing edge cases in test cases or implementation. Meta interviewers test with boundary inputs specifically.",
    examples: ["Not testing empty array/string", "Not handling null input", "Not considering negative numbers or overflow"],
    drillPrompt: "Before writing any code today, write a test case list: empty input, single element, all same, negative numbers, max int, null/None. Only start coding after you have written all test cases.",
  },
  {
    id: "star_specificity",
    name: "STAR Answer Specificity",
    category: "behavioral",
    description: "Giving vague behavioral answers without specific metrics, timelines, or outcomes. IC6/IC7 answers must include measurable impact.",
    examples: ["'I improved the system' instead of 'I reduced p99 latency by 40%'", "'The team was happy' instead of 'We shipped 2 weeks early'", "Describing what you did without the outcome"],
    drillPrompt: "For every behavioral answer today, you must include: (1) a specific number or percentage, (2) a timeline, (3) a business outcome. If you can't add all three, the answer is not IC6-ready.",
  },
  {
    id: "ownership",
    name: "Ownership Signals",
    category: "behavioral",
    description: "Using 'we' instead of 'I' in behavioral answers. Meta interviewers need to understand your specific contribution.",
    examples: ["'We built the feature' without clarifying your role", "'The team decided' without explaining your influence", "Describing a project without stating what you personally owned"],
    drillPrompt: "Rewrite your last 3 behavioral answers replacing every 'we' with 'I' or 'my team, and I specifically...'. If you can't, the answer lacks ownership signal.",
  },
  {
    id: "monitoring",
    name: "Observability & Monitoring",
    category: "system_design",
    description: "Never mentioning monitoring, alerting, logging, or observability in system designs. This is a strong IC6 signal.",
    examples: ["Designing a distributed system without mentioning metrics", "Not discussing how you'd know if the system is unhealthy", "No mention of dashboards, alerts, or on-call runbooks"],
    drillPrompt: "Add an 'Observability' section to every system design today. Include: key metrics to track (latency, error rate, throughput), alerting thresholds, logging strategy, and how you'd debug a production incident.",
  },
  {
    id: "deep_dive",
    name: "Deep Dive Readiness",
    category: "system_design",
    description: "Giving high-level answers that can't withstand follow-up questions. IC6/IC7 candidates must be able to go 3 levels deep on any component.",
    examples: ["'I'd use a message queue' without knowing Kafka partition strategy", "'I'd use a cache' without knowing eviction policies", "Mentioning sharding without knowing the partition key strategy"],
    drillPrompt: "Pick one component from your last system design (e.g., 'the database'). Write 3 levels of depth: (1) what it is, (2) how it works internally, (3) what breaks at scale and how you'd fix it.",
  },
  {
    id: "time_management",
    name: "Time Management",
    category: "process",
    description: "Spending too long on one phase and running out of time for others. Meta interviews have strict time expectations per phase.",
    examples: ["Spending 30 minutes on requirements with no design", "Jumping to optimization before finishing the basic solution", "Not leaving time for follow-up questions"],
    drillPrompt: "Use a strict timer today: 5 min requirements, 10 min high-level design, 20 min deep dive, 10 min tradeoffs. Set alarms. Stop each phase when the timer goes off, even if incomplete.",
  },
];

// ── Drill Card ────────────────────────────────────────────────────────────────

interface DrillCardProps {
  signal: SignalDimension;
  score: number;
  evidenceCount: number;
  rank: number;
}

function DrillCard({ signal, score, evidenceCount, rank }: DrillCardProps) {
  const [expanded, setExpanded] = useState(rank === 1);

  const severity = score < 30 ? "critical" : score < 60 ? "warning" : "ok";

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      severity === "critical" && "border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/10",
      severity === "warning" && "border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/10",
      severity === "ok" && "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
    )}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
          severity === "critical" && "bg-red-100 dark:bg-red-900/40 text-red-600",
          severity === "warning" && "bg-amber-100 dark:bg-amber-900/40 text-amber-800",
          severity === "ok" && "bg-gray-200 dark:bg-gray-600 text-gray-800"
        )}>
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {signal.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize",
                signal.category === "coding" && "border-blue-200 text-blue-600",
                signal.category === "system_design" && "border-purple-200 text-purple-600",
                signal.category === "behavioral" && "border-amber-200 text-amber-800",
                signal.category === "process" && "border-gray-200 text-gray-600"
              )}
            >
              {signal.category.replace("_", " ")}
            </Badge>
            {evidenceCount > 0 && (
              <span className="text-xs text-gray-600">{evidenceCount} signals detected</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Progress
              value={score}
              className={cn(
                "flex-1 h-1.5",
                severity === "critical" && "[&>div]:bg-red-500",
                severity === "warning" && "[&>div]:bg-amber-500",
                severity === "ok" && "[&>div]:bg-emerald-500"
              )}
            />
            <span className={cn(
              "text-xs font-bold w-8 text-right",
              severity === "critical" && "text-red-600",
              severity === "warning" && "text-amber-800",
              severity === "ok" && "text-emerald-600"
            )}>
              {score}%
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          <p className="text-sm text-gray-600 dark:text-gray-200">{signal.description}</p>

          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Common patterns where this signal is missing:
            </p>
            <ul className="space-y-1">
              {signal.examples.map((ex, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>

          <div className={cn(
            "rounded-lg border p-3",
            severity === "critical" && "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700",
            severity === "warning" && "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            severity === "ok" && "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
          )}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={12} className={cn(
                severity === "critical" && "text-red-500",
                severity === "warning" && "text-amber-500",
                severity === "ok" && "text-blue-500"
              )} />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                15-Minute Targeted Drill
              </span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
              {signal.drillPrompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Analysis Panel ─────────────────────────────────────────────────────────

interface AIAnalysisPanelProps {
  sessions: ReplaySession[];
  debugAttempts: AttemptRecord[];
}

interface WeakSignalAnalysis {
  topWeakSignals: Array<{
    signalId: string;
    score: number;
    evidence: string[];
    targetedDrill: string;
  }>;
  overallPattern: string;
  priorityAction: string;
}

function AIAnalysisPanel({ sessions, debugAttempts }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useLocalStorage<WeakSignalAnalysis | null>("weak-signal-analysis", null);
  const [analysisDate, setAnalysisDate] = useLocalStorage<number | null>("weak-signal-analysis-date", null);

  const analyzeSignals = trpc.ai.detectWeakSignals.useMutation({
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setAnalysisDate(Date.now());
      toast.success("Weak signal analysis complete!");
    },
    onError: () => toast.error("Analysis failed. Please try again."),
  });

  const sessionSummaries = sessions.slice(0, 10).map((s) => ({
    title: s.title,
    type: s.sessionType,
    durationSeconds: s.durationSeconds,
    answer: s.finalAnswer?.slice(0, 500) ?? "",
    verdict: s.verdict,
    commentaryTypes: (s.llmCommentary ?? []).map((c) => c.type),
  }));

  const debugStats = {
    totalAttempted: debugAttempts.length,
    solved: debugAttempts.filter((a) => a.solved).length,
    hintRate: debugAttempts.length > 0
      ? debugAttempts.filter((a) => a.hintsUsed > 0).length / debugAttempts.length
      : 0,
    avgTime: debugAttempts.length > 0
      ? debugAttempts.reduce((s, a) => s + a.timeSeconds, 0) / debugAttempts.length
      : 0,
  };

  const hasData = sessions.length > 0 || debugAttempts.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-purple-500" />
          <span className="font-semibold text-gray-900 dark:text-white">AI Cross-Session Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {analysisDate && (
            <span className="text-xs text-gray-600">
              Last: {new Date(analysisDate).toLocaleDateString()}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => analyzeSignals.mutate({ sessions: sessionSummaries, debugStats })}
            disabled={analyzeSignals.isPending || !hasData}
            className="gap-1.5 text-xs h-7 px-3"
          >
            {analyzeSignals.isPending ? (
              <><Loader2 size={11} className="animate-spin" /> Analyzing…</>
            ) : (
              <><RefreshCw size={11} /> {analysis ? "Re-analyze" : "Analyze"}</>
            )}
          </Button>
        </div>
      </div>

      {!hasData && (
        <p className="text-sm text-gray-600 italic">
          Complete some practice sessions first. The AI will analyze patterns across your sessions to identify your weakest signals.
        </p>
      )}

      {hasData && !analysis && !analyzeSignals.isPending && (
        <div className="text-center py-6">
          <Brain size={28} className="text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-700">
            You have {sessions.length} replay session{sessions.length !== 1 ? "s" : ""} and{" "}
            {debugAttempts.length} debug attempt{debugAttempts.length !== 1 ? "s" : ""} to analyze.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Click "Analyze" to identify your weakest signals across all sessions.
          </p>
        </div>
      )}

      {analyzeSignals.isPending && (
        <div className="flex items-center gap-2 text-sm text-gray-700 py-4">
          <Loader2 size={14} className="animate-spin text-purple-500" />
          Analyzing patterns across {sessions.length} sessions…
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Overall Pattern</p>
            <p className="text-sm text-purple-800 dark:text-purple-200">{analysis.overallPattern}</p>
          </div>

          <div className="bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRight size={12} className="text-amber-800" />
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-800">Priority Action</p>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-100">{analysis.priorityAction}</p>
          </div>

          <div className="space-y-2">
            {analysis.topWeakSignals.map((ws, i) => {
              const signal = SIGNAL_DIMENSIONS.find((s) => s.id === ws.signalId);
              if (!signal) return null;
              return (
                <div key={ws.signalId} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-600">#{i + 1}</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{signal.name}</span>
                    <span className={cn(
                      "text-xs font-bold",
                      ws.score < 30 ? "text-red-500" : ws.score < 60 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {ws.score}%
                    </span>
                  </div>
                  {ws.evidence.length > 0 && (
                    <ul className="space-y-0.5 mb-2">
                      {ws.evidence.map((ev, j) => (
                        <li key={j} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                          <AlertTriangle size={10} className="text-amber-900 flex-shrink-0 mt-0.5" />
                          {ev}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Lightbulb size={11} className="text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Drill</span>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200">{ws.targetedDrill}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WeakSignalDetectorTab() {
  const [debugAttempts] = useLocalStorage<AttemptRecord[]>("debug-drill-attempts", []);
  const [replaySessions] = useLocalStorage<ReplaySession[]>("interview-replay-sessions", []);
  const [selectedCategory, setSelectedCategory] = useState<"all" | SignalDimension["category"]>("all");

  // Compute heuristic scores from localStorage data
  const signalScores = useMemo(() => {
    const scores: Record<string, { score: number; evidenceCount: number }> = {};

    SIGNAL_DIMENSIONS.forEach((dim) => {
      // Default score: 50 (unknown)
      let score = 50;
      let evidenceCount = 0;

      // Adjust based on debug drill performance
      if (dim.id === "edge_cases" && debugAttempts.length > 0) {
        const solvedWithoutHint = debugAttempts.filter((a) => a.solved && a.hintsUsed === 0).length;
        score = Math.round((solvedWithoutHint / debugAttempts.length) * 100);
        evidenceCount = debugAttempts.length;
      }

      if (dim.id === "time_management" && debugAttempts.length > 0) {
        const fastSolves = debugAttempts.filter((a) => a.solved && a.timeSeconds < 300).length;
        score = Math.round((fastSolves / Math.max(debugAttempts.length, 1)) * 100);
        evidenceCount = debugAttempts.length;
      }

      // Adjust based on replay session commentary
      if (replaySessions.length > 0) {
        const allComments = replaySessions.flatMap((s) => s.llmCommentary ?? []);
        if (allComments.length > 0) {
          const relevantWarnings = allComments.filter(
            (c) => c.type === "warning" || c.type === "critical"
          );
          if (relevantWarnings.length > 0) {
            const warningRate = relevantWarnings.length / allComments.length;
            score = Math.round((1 - warningRate) * 100);
            evidenceCount = allComments.length;
          }
        }
      }

      scores[dim.id] = { score, evidenceCount };
    });

    return scores;
  }, [debugAttempts, replaySessions]);

  // Sort by score (weakest first)
  const sortedSignals = useMemo(() => {
    return [...SIGNAL_DIMENSIONS]
      .filter((s) => selectedCategory === "all" || s.category === selectedCategory)
      .sort((a, b) => (signalScores[a.id]?.score ?? 50) - (signalScores[b.id]?.score ?? 50));
  }, [signalScores, selectedCategory]);

  const weakestThree = useMemo(() => {
    return [...SIGNAL_DIMENSIONS]
      .sort((a, b) => (signalScores[a.id]?.score ?? 50) - (signalScores[b.id]?.score ?? 50))
      .slice(0, 3);
  }, [signalScores]);

  const overallScore = useMemo(() => {
    const scores = Object.values(signalScores).map((s) => s.score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [signalScores]);

  return (
    <div className="space-y-6 relative">
      {/* ── Screen Interview watermark ── */}
      <ScreenInterviewWatermark className="absolute top-0 right-0" size="1.4rem" opacity={0.10} />
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={20} className="text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Weak Signal Detector
            </h2>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Identifies your three weakest interview signals based on practice history. Each weak
            signal comes with a targeted 15-minute drill to address it directly.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-2.5">
          <BarChart2 size={16} className={cn(
            overallScore >= 70 ? "text-emerald-500" : overallScore >= 50 ? "text-amber-500" : "text-red-500"
          )} />
          <div>
            <div className={cn(
              "text-xl font-bold leading-tight",
              overallScore >= 70 ? "text-emerald-600" : overallScore >= 50 ? "text-amber-800" : "text-red-600"
            )}>
              {overallScore}%
            </div>
            <div className="text-xs text-gray-600">Signal Health</div>
          </div>
        </div>
      </div>

      {/* Top 3 Weakest — always visible */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-red-500" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
            Your 3 Weakest Signals
          </span>
          <span className="text-xs text-gray-600">— focus here first</span>
        </div>
        <div className="space-y-2">
          {weakestThree.map((signal, i) => (
            <DrillCard
              key={signal.id}
              signal={signal}
              score={signalScores[signal.id]?.score ?? 50}
              evidenceCount={signalScores[signal.id]?.evidenceCount ?? 0}
              rank={i + 1}
            />
          ))}
        </div>
      </div>

      {/* AI Cross-Session Analysis */}
      <AIAnalysisPanel sessions={replaySessions} debugAttempts={debugAttempts} />

      {/* All Signals */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-gray-700" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
              All Signal Dimensions
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "coding", "system_design", "behavioral", "process"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold transition-all capitalize",
                  selectedCategory === cat
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {sortedSignals.map((signal, i) => (
            <DrillCard
              key={signal.id}
              signal={signal}
              score={signalScores[signal.id]?.score ?? 50}
              evidenceCount={signalScores[signal.id]?.evidenceCount ?? 0}
              rank={i + 1}
            />
          ))}
        </div>
      </div>

      {/* How scores are calculated */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={13} className="text-gray-600" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            How scores are calculated
          </span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Scores are computed from your debug drill performance (hit rate, hint usage, time-to-solve)
          and replay session AI commentary (warning/critical comment ratio). Scores start at 50% for
          dimensions with no data. Use the AI Cross-Session Analysis for a deeper, LLM-powered
          assessment across all your sessions.
        </p>
      </div>
    </div>
  );
}
