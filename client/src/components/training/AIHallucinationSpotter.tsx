// Feature 1: AI Hallucination Spotter
// AI gives subtly wrong code; candidate must find the bug before the AI "admits" it.
// Trains the critical skill of not blindly trusting AI output in Meta's interview.

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Brain,
  Eye,
} from "lucide-react";

export default function AIHallucinationSpotter() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState<{
    correct: boolean;
    score: number;
    feedback: string;
    hint: string;
  } | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });

  const { data: scenarios, isLoading } =
    trpc.aiTraining.getHallucinationScenarios.useQuery();
  const checkMutation = trpc.aiTraining.checkHallucinationAnswer.useMutation();

  const scenario = scenarios?.[scenarioIdx];

  const handleSubmit = async () => {
    if (!scenario || !userAnswer.trim()) return;
    setSubmitted(true);
    const result = await checkMutation.mutateAsync({
      scenarioId: scenario.id,
      userAnswer: userAnswer.trim(),
      timeSpent: 0,
    });
    setScore(result);
    setSessionScore(prev => ({
      correct: prev.correct + (result.correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (!scenarios) return;
    setScenarioIdx(i => (i + 1) % scenarios.length);
    setUserAnswer("");
    setSubmitted(false);
    setRevealed(false);
    setScore(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading scenarios…
      </div>
    );
  }

  if (!scenario) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="text-red-400" size={20} />
          <h3 className="font-semibold text-foreground">
            AI Hallucination Spotter
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-red-400/40 text-red-400"
          >
            {scenarioIdx + 1}/{scenarios?.length ?? 0}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {sessionScore.total > 0 && (
            <span className="text-xs text-muted-foreground">
              Score:{" "}
              <span className="text-emerald-400 font-semibold">
                {sessionScore.correct}/{sessionScore.total}
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

      {/* Scenario context */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <CardTitle className="text-sm text-amber-400">
              {scenario.title}
            </CardTitle>
            <Badge className="text-xs ml-auto" variant="secondary">
              {scenario.difficulty}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {scenario.description}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            The AI assistant returned this code. Find the bug:
          </p>
          <pre className="bg-background/80 rounded-md p-3 text-xs font-mono overflow-x-auto border border-border whitespace-pre-wrap leading-relaxed">
            {scenario.buggyCode}
          </pre>
        </CardContent>
      </Card>

      {/* Answer area */}
      {!submitted ? (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">
            Describe the bug in the AI's code (be specific — line number,
            variable, or logic error):
          </label>
          <Textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="e.g. Line 7: the loop condition uses <= instead of < causing an off-by-one error on the last element…"
            className="text-sm min-h-[80px] resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || checkMutation.isPending}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {checkMutation.isPending ? "Checking…" : "Submit Answer"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealed(r => !r)}
              className="gap-1 text-xs text-muted-foreground"
            >
              <Eye size={12} /> {revealed ? "Hide" : "Reveal"} Hint
            </Button>
          </div>
          {revealed && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              💡 Hint: look at line {scenario.bugLine}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Result card */}
          <Card
            className={`border ${score?.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
          >
            <CardContent className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                {score?.correct ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
                <span
                  className={`text-sm font-semibold ${score?.correct ? "text-emerald-400" : "text-red-400"}`}
                >
                  {score?.correct
                    ? "Correct — you spotted it!"
                    : "Not quite — here's what the AI got wrong:"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {score?.feedback}
              </p>
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Correct answer:
                </p>
                <pre className="text-xs font-mono bg-background/60 rounded p-2 border border-border whitespace-pre-wrap">
                  {/* Correct code revealed after answer */}
                  {score?.feedback}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={handleNext}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next Scenario →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
