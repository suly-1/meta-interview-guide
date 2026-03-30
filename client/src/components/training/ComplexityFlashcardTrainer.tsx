// Feature 4: Complexity Flashcard Trainer
// Given a code snippet, identify Big-O time and space complexity.
// Meta Phase 3 always asks for complexity analysis — most candidates fumble it under pressure.

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const COMPLEXITY_OPTIONS = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n²)",
  "O(n³)",
  "O(2ⁿ)",
  "O(n!)",
];

export default function ComplexityFlashcardTrainer() {
  const [cardIdx, setCardIdx] = useState(0);
  const [timeGuess, setTimeGuess] = useState("");
  const [spaceGuess, setSpaceGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    timeCorrect: boolean;
    spaceCorrect: boolean;
    correctTimeComplexity: string;
    correctSpaceComplexity: string;
    explanation: string;
    score: number;
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const { data: flashcards, isLoading } =
    trpc.aiTraining.getComplexityFlashcards.useQuery();
  const checkMutation = trpc.aiTraining.checkComplexityAnswer.useMutation();

  const card = flashcards?.[cardIdx];

  const handleSubmit = async () => {
    if (!card || !timeGuess || !spaceGuess) return;
    setSubmitted(true);
    const res = await checkMutation.mutateAsync({
      cardId: card.id,
      userTimeComplexity: timeGuess,
      userSpaceComplexity: spaceGuess,
      userExplanation: "",
    });
    setResult(res);
    const bothCorrect = res.timeCorrect && res.spaceCorrect;
    setSessionStats(prev => ({
      correct: prev.correct + (bothCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (!flashcards) return;
    setCardIdx(i => (i + 1) % flashcards.length);
    setTimeGuess("");
    setSpaceGuess("");
    setSubmitted(false);
    setResult(null);
    setShowExplanation(false);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading flashcards…
      </div>
    );
  if (!card) return null;

  const accuracy =
    sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-cyan-400" size={20} />
          <h3 className="font-semibold text-foreground">
            Complexity Flashcard Trainer
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-cyan-400/40 text-cyan-400"
          >
            {cardIdx + 1}/{flashcards?.length ?? 0}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {accuracy !== null && (
            <span className="text-xs text-muted-foreground">
              Accuracy:{" "}
              <span className="text-cyan-400 font-semibold">{accuracy}%</span>
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

      {/* Code card */}
      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm text-cyan-400">
              {card.title}
            </CardTitle>
            <Badge className="text-xs ml-auto" variant="secondary">
              {card.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <pre className="bg-background/80 rounded-md p-3 text-xs font-mono overflow-x-auto border border-border whitespace-pre-wrap leading-relaxed">
            {card.code}
          </pre>
        </CardContent>
      </Card>

      {/* Answer selectors */}
      {!submitted ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Time Complexity:
              </label>
              <Select value={timeGuess} onValueChange={setTimeGuess}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLEXITY_OPTIONS.map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Space Complexity:
              </label>
              <Select value={spaceGuess} onValueChange={setSpaceGuess}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLEXITY_OPTIONS.map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!timeGuess || !spaceGuess || checkMutation.isPending}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {checkMutation.isPending ? "Checking…" : "Submit Answer"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Result */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`border ${result?.timeCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
            >
              <CardContent className="px-3 py-2.5 flex items-center gap-2">
                {result?.timeCorrect ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p
                    className={`text-sm font-semibold ${result?.timeCorrect ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {timeGuess}
                  </p>
                  {!result?.timeCorrect && (
                    <p className="text-xs text-muted-foreground">
                      Correct: {card.timeComplexity}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border ${result?.spaceCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}
            >
              <CardContent className="px-3 py-2.5 flex items-center gap-2">
                {result?.spaceCorrect ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Space</p>
                  <p
                    className={`text-sm font-semibold ${result?.spaceCorrect ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {spaceGuess}
                  </p>
                  {!result?.spaceCorrect && (
                    <p className="text-xs text-muted-foreground">
                      Correct: {card.spaceComplexity}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explanation toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExplanation(s => !s)}
            className="gap-1 text-xs text-muted-foreground w-full justify-between"
          >
            {showExplanation ? "Hide" : "Show"} explanation
            {showExplanation ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </Button>
          {showExplanation && (
            <Card className="border-border">
              <CardContent className="px-4 py-3 space-y-2">
                <p className="text-xs text-foreground leading-relaxed">
                  {result?.explanation}
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleNext}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Next Card →
          </Button>
        </div>
      )}
    </div>
  );
}
