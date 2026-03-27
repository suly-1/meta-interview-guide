// Feature 8: Test-First Debugger
// Given only failing test output (no code), write the fix that makes all tests pass.
// Meta provides failing tests in Phase 1; most candidates ignore them and guess instead.

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  TestTube2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

export default function TestFirstDebugger() {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [fix, setFix] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    feedback: string;
    testResults: { test: string; passed: boolean }[];
  } | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const { data: challenges, isLoading } =
    trpc.aiTraining.getTestFirstChallenges.useQuery();
  const submitMutation = trpc.aiTraining.submitTestFirstFix.useMutation();

  const challenge = challenges?.[challengeIdx];

  const handleSubmit = async () => {
    if (!challenge || !fix.trim()) return;
    setSubmitted(true);
    const res = await submitMutation.mutateAsync({
      challengeId: challenge.id,
      fix: fix.trim(),
    });
    setResult(res);
    setSessionStats(prev => ({
      correct: prev.correct + (res.passed ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (!challenges) return;
    setChallengeIdx(i => (i + 1) % challenges.length);
    setFix("");
    setSubmitted(false);
    setResult(null);
    setShowCode(false);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading challenges…
      </div>
    );
  if (!challenge) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube2 className="text-red-400" size={20} />
          <h3 className="font-semibold text-foreground">Test-First Debugger</h3>
          <Badge
            variant="outline"
            className="text-xs border-red-400/40 text-red-400"
          >
            {challengeIdx + 1}/{challenges?.length ?? 0}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {sessionStats.total > 0 && (
            <span className="text-xs text-muted-foreground">
              Score:{" "}
              <span className="text-red-400 font-semibold">
                {sessionStats.correct}/{sessionStats.total}
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

      {/* Challenge info */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-400">
              {challenge.title}
            </p>
            <Badge variant="secondary" className="text-xs">
              {challenge.difficulty}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {challenge.description}
          </p>
        </CardContent>
      </Card>

      {/* Failing test output */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">
          Failing test output:
        </p>
        <pre className="bg-red-950/30 border border-red-500/20 rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed text-red-300">
          {challenge.failingTestOutput}
        </pre>
      </div>

      {/* Reveal code toggle (penalty) */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCode(s => !s)}
          className="gap-1 text-xs text-muted-foreground"
        >
          {showCode ? <EyeOff size={12} /> : <Eye size={12} />}
          {showCode ? "Hide code" : "Reveal buggy code (−2 pts penalty)"}
        </Button>
      </div>
      {showCode && (
        <pre className="bg-background/80 rounded-md p-3 text-xs font-mono overflow-x-auto border border-border whitespace-pre-wrap leading-relaxed">
          {challenge.buggyCode}
        </pre>
      )}

      {/* Fix editor */}
      {!submitted ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Write the fix (just the corrected function/lines):
          </p>
          <Textarea
            value={fix}
            onChange={e => setFix(e.target.value)}
            placeholder="// Write only the corrected code here…"
            className="text-xs font-mono min-h-[120px] resize-none bg-background/80"
          />
          <Button
            onClick={handleSubmit}
            disabled={!fix.trim() || submitMutation.isPending}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {submitMutation.isPending ? "Running tests…" : "Submit Fix"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Test results */}
          <div className="space-y-1">
            {result?.testResults.map((t, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${t.passed ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
              >
                {t.passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {t.test}
              </div>
            ))}
          </div>

          <Card
            className={`border ${result?.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}
          >
            <CardContent className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                {result?.passed ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-amber-400" />
                )}
                <span
                  className={`text-sm font-medium ${result?.passed ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {result?.passed
                    ? `All tests pass — ${result.score}/10`
                    : `Tests failing — ${result?.score}/10`}
                </span>
                {showCode && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    −2 pts (code revealed)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result?.feedback}
              </p>
            </CardContent>
          </Card>

          <Button
            onClick={handleNext}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Next Challenge →
          </Button>
        </div>
      )}
    </div>
  );
}
