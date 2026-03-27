/**
 * IC-Level Signal Calibrator — Priority #2
 * After submitting an answer, tells the candidate exactly:
 * "This reads as L5. To reach L6 you need X. To reach L7 you need Y."
 * Works for system design, behavioral, and coding answers.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpCircle,
  Target,
  Lightbulb,
  BarChart2,
} from "lucide-react";

type AnswerType = "system_design" | "behavioral" | "coding";
type TargetLevel = "L5" | "L6" | "L7";

interface CalibrationResult {
  detectedLevel: string;
  detectedLevelReasoning: string;
  toReachL6: string;
  toReachL7: string;
  strongestSignal: string;
  weakestSignal: string;
  rewriteExample: string;
  metaRubricScores: {
    correctness: number;
    tradeoffs: number;
    scalability: number;
    communication: number;
  };
}

const LEVEL_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  L5: {
    bg: "bg-slate-500/20",
    text: "text-foreground/80",
    border: "border-slate-500/40",
  },
  L6: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
  },
  L7: {
    bg: "bg-purple-500/20",
    text: "text-purple-300",
    border: "border-purple-500/40",
  },
};

function RubricBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right font-mono font-medium text-xs">
        {value}/5
      </span>
    </div>
  );
}

const SAMPLE_QUESTIONS: Record<AnswerType, string[]> = {
  system_design: [
    "Design Instagram Feed",
    "Design WhatsApp Messaging",
    "Design Facebook Live Comments",
    "Design Marketplace Search",
    "Design a URL shortener at Meta scale",
  ],
  behavioral: [
    "Tell me about a time you drove a large technical project",
    "Describe a situation where you influenced without authority",
    "Tell me about a time you had to make a decision with incomplete data",
    "Describe a conflict with a cross-functional partner and how you resolved it",
  ],
  coding: [
    "Implement a LRU cache",
    "Find the median of a data stream",
    "Design a rate limiter",
    "Implement a consistent hash ring",
  ],
};

export function ICLevelSignalCalibrator() {
  const [expanded, setExpanded] = useState(false);
  const [answerType, setAnswerType] = useState<AnswerType>("system_design");
  const [targetLevel, setTargetLevel] = useState<TargetLevel>("L6");
  const [questionTitle, setQuestionTitle] = useState("");

  // Auto-populate question from deep-link (MetaQuestionBank "Practice Now")
  useEffect(() => {
    const q = sessionStorage.getItem("meta_practice_question");
    if (q) {
      setQuestionTitle(q);
      setExpanded(true);
      sessionStorage.removeItem("meta_practice_question");
    }
  }, []);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [showRewrite, setShowRewrite] = useState(false);

  const calibrateMutation = trpc.ai.icLevelSignalCalibrator.useMutation({
    onSuccess: data => {
      setResult(data);
    },
    onError: () => {
      toast.error("Calibration failed. Please try again.");
    },
  });

  const handleCalibrate = () => {
    if (!questionTitle.trim()) {
      toast.error("Please enter the question or prompt.");
      return;
    }
    if (candidateAnswer.trim().length < 50) {
      toast.error(
        "Please write a more complete answer (at least 50 characters)."
      );
      return;
    }
    setResult(null);
    calibrateMutation.mutate({
      questionTitle,
      candidateAnswer,
      targetLevel,
      answerType,
    });
  };

  const levelColors = result
    ? (LEVEL_COLORS[result.detectedLevel] ?? LEVEL_COLORS["L5"])
    : null;

  const answerTypeConfig: Record<
    AnswerType,
    { label: string; placeholder: string }
  > = {
    system_design: {
      label: "System Design",
      placeholder:
        "Paste your full system design answer here — requirements, high-level design, deep dive, trade-offs...",
    },
    behavioral: {
      label: "Behavioral (STAR)",
      placeholder:
        "Paste your STAR story here — Situation, Task, Action, Result...",
    },
    coding: {
      label: "Coding",
      placeholder:
        "Describe your approach, complexity analysis, edge cases, and any code you wrote...",
    },
  };

  return (
    <div className="prep-card mb-4" data-testid="ic-level-calibrator">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors rounded-t-lg"
      >
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <TrendingUp size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              IC-Level Signal Calibrator
            </span>
            <span className="badge badge-green text-xs">Priority #2</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            "This reads as L5. To reach L6 you need X. To reach L7 you need Y."
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Answer type + target level */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-40">
              <label className="text-xs text-muted-foreground mb-1 block">
                Answer Type
              </label>
              <div className="flex gap-1">
                {(
                  ["system_design", "behavioral", "coding"] as AnswerType[]
                ).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setAnswerType(t);
                      setResult(null);
                    }}
                    className={`flex-1 text-xs py-1.5 px-2 rounded border transition-all ${answerType === t ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {answerTypeConfig[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Target Level
              </label>
              <div className="flex gap-1">
                {(["L5", "L6", "L7"] as TargetLevel[]).map(l => {
                  const lc = LEVEL_COLORS[l];
                  return (
                    <button
                      key={l}
                      onClick={() => setTargetLevel(l)}
                      className={`text-xs py-1.5 px-3 rounded border font-medium transition-all ${targetLevel === l ? `${lc.bg} ${lc.text} ${lc.border}` : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Question / Prompt
            </label>
            <div className="flex gap-2 flex-wrap mb-1.5">
              {SAMPLE_QUESTIONS[answerType].slice(0, 3).map(q => (
                <button
                  key={q}
                  onClick={() => setQuestionTitle(q)}
                  className="text-xs px-2 py-1 rounded bg-secondary border border-border hover:border-blue-500/40 text-muted-foreground hover:text-foreground transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
            <input
              value={questionTitle}
              onChange={e => setQuestionTitle(e.target.value)}
              placeholder="Or type your own question..."
              className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Answer input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Your Answer
            </label>
            <textarea
              value={candidateAnswer}
              onChange={e => setCandidateAnswer(e.target.value)}
              placeholder={answerTypeConfig[answerType].placeholder}
              rows={8}
              className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {candidateAnswer.length} chars
            </div>
          </div>

          <button
            onClick={handleCalibrate}
            disabled={calibrateMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {calibrateMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Calibrating...
              </>
            ) : (
              <>
                <Target size={14} /> Calibrate IC Level
              </>
            )}
          </button>

          {/* Results */}
          {result && levelColors && (
            <div className="space-y-3">
              {/* Detected level banner */}
              <div
                className={`p-4 rounded-lg border ${levelColors.bg} ${levelColors.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${levelColors.text}`}>
                      {result.detectedLevel}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      detected
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Target: {targetLevel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.detectedLevelReasoning}
                </p>
              </div>

              {/* Rubric scores */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <BarChart2 size={11} /> Meta Rubric Scores
                </div>
                <RubricBar
                  label="Correctness"
                  value={result.metaRubricScores.correctness}
                />
                <RubricBar
                  label="Trade-offs"
                  value={result.metaRubricScores.tradeoffs}
                />
                <RubricBar
                  label="Scalability"
                  value={result.metaRubricScores.scalability}
                />
                <RubricBar
                  label="Communication"
                  value={result.metaRubricScores.communication}
                />
              </div>

              {/* Strongest / weakest signal */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-emerald-400 flex items-center gap-1 mb-1">
                    <CheckCircle2 size={11} /> Strongest Signal
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.strongestSignal}
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-red-400 flex items-center gap-1 mb-1">
                    <AlertTriangle size={11} /> Weakest Signal
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.weakestSignal}
                  </p>
                </div>
              </div>

              {/* What to add for L6 / L7 */}
              <div className="space-y-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-emerald-400 flex items-center gap-1 mb-1">
                    <ArrowUpCircle size={11} /> To reach L6
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.toReachL6}
                  </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3">
                  <div className="text-xs font-medium text-purple-400 flex items-center gap-1 mb-1">
                    <ArrowUpCircle size={11} /> To reach L7
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.toReachL7}
                  </p>
                </div>
              </div>

              {/* Rewrite example */}
              <div className="border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setShowRewrite(r => !r)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 hover:bg-secondary transition-colors text-xs font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Lightbulb size={11} className="text-amber-400" /> L6
                    Rewrite Example (weakest section)
                  </span>
                  {showRewrite ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
                {showRewrite && (
                  <div className="p-3 text-xs text-muted-foreground bg-amber-500/5 border-t border-border">
                    <Streamdown>{result.rewriteExample}</Streamdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
