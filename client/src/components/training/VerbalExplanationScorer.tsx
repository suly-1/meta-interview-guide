// Feature 9: Verbal Explanation Scorer
// Type a 90-second explanation of your approach; AI scores the Technical Communication dimension.
// Distinct from RubberDuckExplainer: this targets the full Meta rubric dimension with timed constraint.

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Clock,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const TIME_LIMIT = 90; // seconds

const SCENARIOS = [
  {
    id: "phase1-bug",
    phase: "Phase 1",
    title: "Explain the bug you found",
    prompt:
      "You've found a bug in the `processQueue` function — an off-by-one error in the loop boundary. Explain what you found, why it's a bug, and how you're fixing it.",
    rubricFocus: "Verification & Debugging communication",
  },
  {
    id: "phase2-design",
    phase: "Phase 2",
    title: "Explain your feature design",
    prompt:
      "You're about to implement a rate limiter. Before writing code, explain your design: what data structure you'll use, how it handles burst traffic, and what edge cases you're considering.",
    rubricFocus: "Problem Solving communication",
  },
  {
    id: "phase3-opt",
    phase: "Phase 3",
    title: "Explain your optimization",
    prompt:
      "You've identified that the current O(n²) solution can be improved. Explain the bottleneck, your proposed optimization, and the resulting complexity improvement.",
    rubricFocus: "Code Development & Understanding",
  },
  {
    id: "tradeoff",
    phase: "General",
    title: "Explain a trade-off decision",
    prompt:
      "You chose to use a HashMap over a sorted array for lookups. Explain the trade-off: when would the sorted array be better, and why HashMap is the right choice here.",
    rubricFocus: "Technical Communication",
  },
];

export default function VerbalExplanationScorer() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [text, setText] = useState("");
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [score, setScore] = useState<{
    overall: number;
    clarity: number;
    conciseness: number;
    technicalDepth: number;
    structureScore: number;
    feedback: string;
    metaRubricAlignment: string;
    improvements: string[];
  } | null>(null);
  const [sessionBest, setSessionBest] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreMutation = trpc.aiTraining.scoreVerbalExplanation.useMutation();
  const scenario = SCENARIOS[scenarioIdx];
  const timeLeft = TIME_LIMIT - elapsed;
  const overTime = elapsed > TIME_LIMIT;

  useEffect(() => {
    if (started && !submitted) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [started, submitted]);

  const handleStart = () => {
    setStarted(true);
    setElapsed(0);
    setText("");
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitted(true);
    clearInterval(intervalRef.current!);
    const res = await scoreMutation.mutateAsync({
      scenarioId: scenario.id,
      explanation: text.trim(),
      timeSpent: elapsed,
    });
    setScore(res);
    if (res.overall > sessionBest) setSessionBest(res.overall);
  };

  const handleNext = () => {
    setScenarioIdx(i => (i + 1) % SCENARIOS.length);
    setText("");
    setStarted(false);
    setElapsed(0);
    setSubmitted(false);
    setScore(null);
    setShowDetails(false);
  };

  const formatTime = (s: number) => {
    const abs = Math.abs(s);
    return `${overTime ? "+" : ""}${Math.floor(abs / 60)}:${(abs % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="text-teal-400" size={20} />
          <h3 className="font-semibold text-foreground">
            Verbal Explanation Scorer
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-teal-400/40 text-teal-400"
          >
            {scenarioIdx + 1}/{SCENARIOS.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {sessionBest > 0 && (
            <span className="text-xs text-muted-foreground">
              Best:{" "}
              <span className="text-teal-400 font-semibold">
                {sessionBest}/10
              </span>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="gap-1 text-xs"
          >
            <RefreshCw size={12} /> Next
          </Button>
        </div>
      </div>

      {/* Scenario card */}
      <Card className="border-teal-500/20 bg-teal-500/5">
        <CardContent className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-teal-600/20 text-teal-400 border-teal-500/30">
              {scenario.phase}
            </Badge>
            <p className="text-sm font-medium text-teal-400">
              {scenario.title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {scenario.prompt}
          </p>
          <p className="text-xs text-muted-foreground italic">
            Rubric dimension:{" "}
            <span className="text-teal-400">{scenario.rubricFocus}</span>
          </p>
        </CardContent>
      </Card>

      {/* Timer + editor */}
      {!started ? (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleStart}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1"
          >
            <Clock size={12} /> Start 90-second timer
          </Button>
          <span className="text-xs text-muted-foreground">
            Type your explanation as you'd say it to the interviewer
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Your explanation:
            </p>
            <div
              className={`flex items-center gap-1 text-xs font-mono ${overTime ? "text-red-400" : timeLeft <= 15 ? "text-amber-400" : "text-teal-400"}`}
            >
              <Clock size={11} />
              {formatTime(timeLeft)}
            </div>
          </div>
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="I would approach this by… The key insight is… The trade-off here is…"
            className="text-sm min-h-[120px] resize-none"
            disabled={submitted}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {text.split(/\s+/).filter(Boolean).length} words
            </span>
            {!submitted && (
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || scoreMutation.isPending}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {scoreMutation.isPending ? "Scoring…" : "Submit"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Score */}
      {score && (
        <div className="space-y-3">
          <Card className="border-teal-500/30 bg-teal-500/5">
            <CardContent className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-teal-400">
                  {score.overall}/10
                </div>
                <div className="flex-1 space-y-1">
                  {[
                    { label: "Clarity", val: score.clarity },
                    { label: "Conciseness", val: score.conciseness },
                    { label: "Technical Depth", val: score.technicalDepth },
                    { label: "Structure", val: score.structureScore },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-28">
                        {label}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={10}
                            className={
                              s <= val
                                ? "text-teal-400 fill-teal-400"
                                : "text-muted-foreground"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {overTime && (
                  <Badge variant="secondary" className="text-xs self-start">
                    Over time
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {score.feedback}
              </p>
              <p className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded px-2 py-1.5">
                Meta rubric: {score.metaRubricAlignment}
              </p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(s => !s)}
                className="gap-1 text-xs text-muted-foreground w-full justify-between"
              >
                {showDetails ? "Hide" : "Show"} improvements
                {showDetails ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </Button>
              {showDetails && score.improvements.length > 0 && (
                <ul className="space-y-1">
                  {score.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      • {imp}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleNext}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Next Scenario →
          </Button>
        </div>
      )}
    </div>
  );
}
