// Feature 2: Requirements Clarification Drill
// Timed practice asking the right clarifying questions before coding.
// Meta interviewers explicitly score this — most candidates skip it entirely.

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const TIMER_SECONDS = 120; // 2 minutes — same as real interview

export default function RequirementsClarificationDrill() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [questions, setQuestions] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{
    score: number;
    coverage: number;
    prioritization: number;
    missedQuestions: string[];
    feedback: string;
    strongPoints: string[];
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [showIdeal, setShowIdeal] = useState(false);
  const [sessionBest, setSessionBest] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: scenarios, isLoading } =
    trpc.aiTraining.getClarificationScenarios.useQuery();
  const scoreMutation =
    trpc.aiTraining.scoreClarificationQuestions.useMutation();

  const scenario = scenarios?.[scenarioIdx];

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setTimerActive(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current!);
  }, [timerActive]);

  const startTimer = () => {
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(true);
  };

  const handleSubmit = async () => {
    if (!scenario || !questions.trim()) return;
    setTimerActive(false);
    clearInterval(timerRef.current!);
    setSubmitted(true);
    const questionList = questions
      .trim()
      .split("\n")
      .map(q => q.trim())
      .filter(Boolean);
    const result = await scoreMutation.mutateAsync({
      scenarioId: scenario.id,
      questions: questionList,
      timeSpent: TIMER_SECONDS - timeLeft,
    });
    setScore(result);
    if (result.score > sessionBest) setSessionBest(result.score);
  };

  const handleNext = () => {
    if (!scenarios) return;
    setScenarioIdx(i => (i + 1) % scenarios.length);
    setQuestions("");
    setSubmitted(false);
    setScore(null);
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(false);
    setShowIdeal(false);
  };

  const timerColor =
    timeLeft > 60
      ? "text-emerald-400"
      : timeLeft > 30
        ? "text-amber-400"
        : "text-red-400";
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading scenarios…
      </div>
    );
  if (!scenario) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-purple-400" size={20} />
          <h3 className="font-semibold text-foreground">
            Requirements Clarification Drill
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-purple-400/40 text-purple-400"
          >
            {scenarioIdx + 1}/{scenarios?.length ?? 0}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {sessionBest > 0 && (
            <span className="text-xs text-muted-foreground">
              Best:{" "}
              <span className="text-purple-400 font-semibold">
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

      {/* Problem statement */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm text-purple-400">
              {scenario.title}
            </CardTitle>
            <Badge className="text-xs ml-auto" variant="secondary">
              {scenario.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed">
            {scenario.prompt}
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            The interviewer has given you this problem. You have 2 minutes to
            ask clarifying questions before writing any code.
          </p>
        </CardContent>
      </Card>

      {/* Timer + input */}
      {!submitted ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground font-medium">
              Write your clarifying questions (one per line):
            </label>
            <div className="flex items-center gap-2">
              <Clock size={12} className={timerColor} />
              <span className={`text-sm font-mono font-bold ${timerColor}`}>
                {mins}:{secs.toString().padStart(2, "0")}
              </span>
              {!timerActive && timeLeft === TIMER_SECONDS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTimer}
                  className="text-xs h-6 px-2"
                >
                  Start Timer
                </Button>
              )}
            </div>
          </div>
          <Textarea
            value={questions}
            onChange={e => setQuestions(e.target.value)}
            onFocus={() => {
              if (!timerActive && timeLeft === TIMER_SECONDS) startTimer();
            }}
            placeholder={
              "1. What is the expected input size?\n2. Can the input contain duplicates?\n3. Should the solution handle empty arrays?\n4. Is there a time/space complexity requirement?"
            }
            className="text-sm min-h-[140px] resize-none font-mono"
          />
          {timeLeft === 0 && (
            <p className="text-xs text-red-400">
              ⏰ Time's up! Submit your questions now.
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!questions.trim() || scoreMutation.isPending}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {scoreMutation.isPending ? "Scoring…" : "Submit Questions"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Score */}
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-purple-400">
                  {score?.score}/10
                </div>
                <div className="flex-1">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all"
                      style={{ width: `${(score?.score ?? 0) * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {score?.feedback}
                  </p>
                </div>
              </div>

              {/* Covered */}
              {(score?.strongPoints?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-1">
                    ✓ Strong Points ({score!.strongPoints.length}):
                  </p>
                  <ul className="space-y-0.5">
                    {score!.strongPoints.map((q, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex gap-1"
                      >
                        <CheckCircle2
                          size={10}
                          className="text-emerald-400 mt-0.5 shrink-0"
                        />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missed */}
              {(score?.missedQuestions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-400 mb-1">
                    ⚠ Missed Questions ({score!.missedQuestions.length}):
                  </p>
                  <ul className="space-y-0.5">
                    {score!.missedQuestions.map((q, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1.5">
                💡 {score?.feedback}
              </p>
            </CardContent>
          </Card>

          {/* Ideal questions toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIdeal(s => !s)}
            className="gap-1 text-xs text-muted-foreground w-full justify-between"
          >
            View ideal question set
            {showIdeal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>
          {showIdeal && (
            <Card className="border-border">
              <CardContent className="px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Ideal clarifying questions for this problem:
                </p>
                <ul className="space-y-1">
                  {scenario.idealQuestions.map((q, i) => (
                    <li key={i} className="text-xs text-foreground">
                      <span className="text-muted-foreground">{i + 1}.</span>{" "}
                      {q}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleNext}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Next Scenario →
          </Button>
        </div>
      )}
    </div>
  );
}
