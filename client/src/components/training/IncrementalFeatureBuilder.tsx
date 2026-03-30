// Feature 7: Incremental Feature Builder
// Add features one at a time on a shared codebase, each timed.
// Mirrors Phase 2 exactly — building on existing code without breaking what works.

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Layers,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";

export default function IncrementalFeatureBuilder() {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [code, setCode] = useState("");
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    feedback: string;
    hint?: string;
  } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: challenges, isLoading } =
    trpc.aiTraining.getIncrementalChallenges.useQuery();
  const submitMutation = trpc.aiTraining.submitIncrementalStep.useMutation();

  const challenge = challenges?.[challengeIdx];
  const step = challenge?.steps[stepIdx];

  useEffect(() => {
    if (started) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [started]);

  useEffect(() => {
    if (challenge) setCode(challenge.baseCode ?? "");
  }, [step]);

  const handleStart = () => {
    setStarted(true);
    setElapsed(0);
  };

  const handleSubmit = async () => {
    if (!challenge || !step || !code.trim()) return;
    setSubmitted(true);
    clearInterval(intervalRef.current!);
    const res = await submitMutation.mutateAsync({
      challengeId: challenge.id,
      stepId: step.id,
      code: code.trim(),
    });
    setResult(res);
    if (res.passed) setCompletedSteps(prev => [...prev, stepIdx]);
  };

  const handleNextStep = () => {
    if (!challenge) return;
    if (stepIdx + 1 < challenge.steps.length) {
      setStepIdx(s => s + 1);
      setElapsed(0);
      setStarted(false);
      setSubmitted(false);
      setResult(null);
    } else {
      // Next challenge
      if (challenges && challengeIdx + 1 < challenges.length) {
        setChallengeIdx(c => c + 1);
      } else {
        setChallengeIdx(0);
      }
      setStepIdx(0);
      setCompletedSteps([]);
      setElapsed(0);
      setStarted(false);
      setSubmitted(false);
      setResult(null);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading challenges…
      </div>
    );
  if (!challenge || !step) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="text-violet-400" size={20} />
          <h3 className="font-semibold text-foreground">
            Incremental Feature Builder
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-violet-400/40 text-violet-400"
          >
            Step {stepIdx + 1}/{challenge.steps.length}
          </Badge>
        </div>
        {started && (
          <div className="flex items-center gap-1 text-xs font-mono text-violet-400">
            <Clock size={11} />
            {formatTime(elapsed)}
          </div>
        )}
      </div>

      {/* Step progress */}
      <div className="flex gap-1.5">
        {challenge.steps.map((s, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              completedSteps.includes(i)
                ? "bg-emerald-500"
                : i === stepIdx
                  ? "bg-violet-500"
                  : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Codebase context */}
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardContent className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-violet-400">
              {challenge.title}
            </p>
            <Badge variant="secondary" className="text-xs">
              {challenge.difficulty}
            </Badge>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-xs font-medium text-foreground mb-1">
              <ChevronRight size={10} className="inline mr-1" />
              Step {stepIdx + 1}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {step.instruction}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Code editor */}
      {!started ? (
        <Button
          onClick={handleStart}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
        >
          <Play size={12} /> Start Step
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Your implementation:
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCode(challenge?.baseCode ?? "")}
              className="text-xs gap-1"
            >
              <RotateCcw size={10} /> Reset
            </Button>
          </div>
          <Textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="text-xs font-mono min-h-[160px] resize-none bg-background/80"
            disabled={submitted}
          />

          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!code.trim() || submitMutation.isPending}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {submitMutation.isPending ? "Evaluating…" : "Submit Step"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Card
                className={`border ${result?.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}
              >
                <CardContent className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {result?.passed ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <Clock size={14} className="text-amber-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${result?.passed ? "text-emerald-400" : "text-amber-400"}`}
                    >
                      {result?.passed
                        ? `Passed — ${result.score}/10`
                        : `Needs work — ${result?.score}/10`}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Time: {formatTime(elapsed)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result?.feedback}
                  </p>
                  {result?.hint && (
                    <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1.5">
                      💡 Hint: {result.hint}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Button
                onClick={handleNextStep}
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {stepIdx + 1 < challenge.steps.length
                  ? "Next Step →"
                  : "Next Challenge →"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
