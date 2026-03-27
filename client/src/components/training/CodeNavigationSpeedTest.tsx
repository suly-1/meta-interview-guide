// Feature 5: Code Navigation Speed Test
// Timed multi-file codebase Q&A without running code.
// Meta's CoderPad has 6-10 files — candidates who can't navigate quickly waste Phase 1.

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Folder,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

export default function CodeNavigationSpeedTest() {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: challenges, isLoading } =
    trpc.aiTraining.getNavigationChallenges.useQuery();
  const checkMutation = trpc.aiTraining.checkNavigationAnswer.useMutation();

  const challenge = challenges?.[challengeIdx];
  const question = challenge?.questions[questionIdx];

  useEffect(() => {
    if (started) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [started]);

  const handleStart = () => {
    setStarted(true);
    setSelectedFile(challenge?.files[0]?.name ?? null);
  };

  const handleSubmit = async () => {
    if (!challenge || !question || !answer.trim()) return;
    setSubmitted(true);
    const res = await checkMutation.mutateAsync({
      challengeId: challenge.id,
      questionId: question.id,
      answer: answer.trim(),
    });
    setResult(res);
    setSessionStats(prev => ({
      correct: prev.correct + (res.correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNextQuestion = () => {
    if (!challenge) return;
    if (questionIdx + 1 < challenge.questions.length) {
      setQuestionIdx(q => q + 1);
    } else {
      // Next challenge
      if (challenges && challengeIdx + 1 < challenges.length) {
        setChallengeIdx(c => c + 1);
      } else {
        setChallengeIdx(0);
      }
      setQuestionIdx(0);
      setStarted(false);
      setElapsed(0);
    }
    setAnswer("");
    setSubmitted(false);
    setResult(null);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
          <Folder className="text-yellow-400" size={20} />
          <h3 className="font-semibold text-foreground">
            Code Navigation Speed Test
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-yellow-400/40 text-yellow-400"
          >
            Q{questionIdx + 1}/{challenge.questions.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {sessionStats.total > 0 && (
            <span className="text-xs text-muted-foreground">
              Score:{" "}
              <span className="text-yellow-400 font-semibold">
                {sessionStats.correct}/{sessionStats.total}
              </span>
            </span>
          )}
          {started && (
            <div className="flex items-center gap-1 text-xs font-mono text-yellow-400">
              <Clock size={11} />
              {formatTime(elapsed)}
            </div>
          )}
        </div>
      </div>

      {!started ? (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm text-yellow-400">
              {challenge.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {challenge.description}
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {challenge.files.map(f => (
                <Badge
                  key={f.name}
                  variant="secondary"
                  className="text-xs font-mono"
                >
                  {f.name}
                </Badge>
              ))}
            </div>
            <Button
              onClick={handleStart}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Start Challenge →
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {/* File explorer */}
          <div className="col-span-2 space-y-1">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">
              Files:
            </p>
            {challenge.files.map(f => (
              <button
                key={f.name}
                onClick={() => setSelectedFile(f.name)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                  selectedFile === f.name
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <ChevronRight size={10} />
                <span className="font-mono">{f.name}</span>
              </button>
            ))}
          </div>

          {/* File content */}
          <div className="col-span-3">
            {selectedFile && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedFile}
                </p>
                <pre className="bg-background/80 rounded-md p-2 text-xs font-mono overflow-auto border border-border max-h-48 whitespace-pre-wrap leading-relaxed">
                  {challenge.files.find(f => f.name === selectedFile)
                    ?.content ?? ""}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question */}
      {started && question && (
        <Card className="border-yellow-500/20">
          <CardContent className="px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-yellow-400">
              Question {questionIdx + 1}:
            </p>
            <p className="text-sm text-foreground">{question.question}</p>

            {!submitted ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="Your answer…"
                  className="text-sm"
                  autoFocus
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || checkMutation.isPending}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
                >
                  {checkMutation.isPending ? "…" : "Submit"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <div
                  className={`flex items-center gap-2 text-sm ${result?.correct ? "text-emerald-400" : "text-red-400"}`}
                >
                  {result?.correct ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {result?.correct
                    ? "Correct!"
                    : `Incorrect — correct answer: ${question.answer}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {result?.explanation}
                </p>
                <Button
                  onClick={handleNextQuestion}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {questionIdx + 1 < challenge.questions.length
                    ? "Next Question →"
                    : "Next Challenge →"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
