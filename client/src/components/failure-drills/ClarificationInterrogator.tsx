import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, HelpCircle, Lock } from "lucide-react";

const VAGUE_PROMPTS = [
  "Design a notification system.",
  "Build a search feature.",
  "Design a recommendation engine.",
  "Create a messaging system.",
  "Design a payment system.",
  "Build an analytics dashboard.",
];

interface ClarificationQA {
  question: string;
  answer: string | null;
  ignored: boolean;
}

interface Props {
  onComplete?: (score: number) => void;
}

export default function ClarificationInterrogator({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "clarify" | "design" | "result">(
    "intro"
  );
  const [prompt] = useState(
    () => VAGUE_PROMPTS[Math.floor(Math.random() * VAGUE_PROMPTS.length)]
  );
  const [questionInput, setQuestionInput] = useState("");
  const [qas, setQas] = useState<ClarificationQA[]>([]);
  const [design, setDesign] = useState("");
  const [questionsLeft, setQuestionsLeft] = useState(3);

  const answerMutation = trpc.failureDrills.answerClarification.useMutation();
  const scoreMutation =
    trpc.failureDrills.scoreClarificationDesign.useMutation();

  const handleAskQuestion = () => {
    if (!questionInput.trim() || questionsLeft <= 0) return;
    const q = questionInput.trim();
    setQuestionInput("");
    setQuestionsLeft(n => n - 1);

    answerMutation.mutate(
      { prompt, question: q, questionsAsked: qas.map(qa => qa.question) },
      {
        onSuccess: data => {
          setQas(prev => [
            ...prev,
            { question: q, answer: data.answer, ignored: data.ignored },
          ]);
        },
      }
    );
  };

  const handleSubmitDesign = () => {
    scoreMutation.mutate(
      {
        prompt,
        clarifications: qas
          .filter(qa => !qa.ignored)
          .map(qa => ({ question: qa.question, answer: qa.answer! })),
        design,
      },
      {
        onSuccess: data => {
          setPhase("result");
          onComplete?.(data.score);
        },
      }
    );
  };

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-teal-400" />
            <span className="font-semibold text-teal-400 text-sm">
              Clarification Interrogator
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll get a deliberately vague prompt. You can ask{" "}
            <strong className="text-foreground">3 clarifying questions</strong>{" "}
            — the AI answers some and ignores others. Then you design based on
            your assumptions. Trains scoping under ambiguity.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Rules
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• You get exactly 3 questions — choose wisely</li>
            <li>
              • The AI may say &quot;use your best judgment&quot; for some
            </li>
            <li>• State your assumptions explicitly in your design</li>
            <li>
              • Your design is scored on how well it handles the ambiguity
            </li>
          </ul>
        </div>
        <Button
          onClick={() => setPhase("clarify")}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "clarify") {
    return (
      <div className="space-y-4">
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
          <p className="text-xs text-teal-400 font-medium uppercase tracking-wide mb-1">
            Vague Prompt
          </p>
          <p className="text-sm font-medium text-foreground">{prompt}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Questions remaining</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < questionsLeft ? "bg-teal-500/30 text-teal-300" : "bg-secondary/40 text-muted-foreground"}`}
              >
                {i < questionsLeft ? i + 1 : <Lock size={10} />}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {qas.map((qa, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                  You
                </Badge>
                <p className="text-xs text-foreground">{qa.question}</p>
              </div>
              <div className="flex items-start gap-2 ml-4">
                <Badge
                  className={`text-xs shrink-0 mt-0.5 border-0 ${qa.ignored ? "bg-secondary/60 text-muted-foreground" : "bg-teal-500/20 text-teal-300"}`}
                >
                  {qa.ignored ? "Ignored" : "Interviewer"}
                </Badge>
                <p
                  className={`text-xs ${qa.ignored ? "text-muted-foreground italic" : "text-foreground"}`}
                >
                  {qa.answer ?? "Use your best judgment."}
                </p>
              </div>
            </div>
          ))}
          {answerMutation.isPending && (
            <div className="text-xs text-teal-400 animate-pulse">
              Interviewer is responding...
            </div>
          )}
        </div>

        {questionsLeft > 0 ? (
          <div className="flex gap-2">
            <Input
              value={questionInput}
              onChange={e => setQuestionInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAskQuestion()}
              placeholder="Ask a clarifying question..."
              className="flex-1 text-sm"
              disabled={answerMutation.isPending}
            />
            <Button
              onClick={handleAskQuestion}
              disabled={!questionInput.trim() || answerMutation.isPending}
              size="sm"
            >
              Ask
            </Button>
          </div>
        ) : (
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">
              No questions remaining. Proceed to design.
            </p>
          </div>
        )}

        <Button
          onClick={() => setPhase("design")}
          disabled={qas.length === 0 || answerMutation.isPending}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white"
        >
          Proceed to Design →
        </Button>
      </div>
    );
  }

  if (phase === "design") {
    const answeredQAs = qas.filter(qa => !qa.ignored);
    return (
      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            Answers you received
          </p>
          {answeredQAs.length > 0 ? (
            answeredQAs.map((qa, i) => (
              <div key={i} className="text-xs text-muted-foreground mb-1">
                <span className="text-teal-400">Q: </span>
                {qa.question}
                <br />
                <span className="text-foreground ml-3">→ {qa.answer}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No answers received — design based on reasonable assumptions.
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Your Design (state assumptions explicitly)
          </label>
          <Textarea
            value={design}
            onChange={e => setDesign(e.target.value)}
            placeholder={
              "Assumptions:\n- Scale: 10M DAU (assumed since not specified)\n- Delivery: at-least-once (assumed)\n\nDesign:\n..."
            }
            rows={8}
            className="text-sm resize-none"
            autoFocus
          />
        </div>
        <Button
          onClick={handleSubmitDesign}
          disabled={design.trim().length < 50 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit Design"}
        </Button>
      </div>
    );
  }

  const result = scoreMutation.data;
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="font-semibold">Clarification Score</span>
        </div>
        <span
          className={`text-3xl font-bold ${result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"}`}
        >
          {result.score}
        </span>
      </div>
      <Progress value={result.score} className="h-3" />
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-secondary/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold">{result.questionQuality}</p>
          <p className="text-xs text-muted-foreground">Question Quality</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold">{result.assumptionClarity}</p>
          <p className="text-xs text-muted-foreground">Assumption Clarity</p>
        </div>
      </div>
      <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
        {result.feedback}
      </div>
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Strong moves
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.strengths.map((s: string, i: number) => (
              <Badge
                key={i}
                className="bg-emerald-500/20 text-emerald-300 text-xs border-0"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {result.missed.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Missed
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missed.map((m: string, i: number) => (
              <Badge
                key={i}
                className="bg-amber-500/20 text-amber-300 text-xs border-0"
              >
                {m}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={() => {
          setPhase("intro");
          setQas([]);
          setDesign("");
          setQuestionsLeft(3);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
