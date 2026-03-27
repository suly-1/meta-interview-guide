import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Target } from "lucide-react";

const ANSWER_STARTERS = [
  {
    id: "g1",
    category: "System Design",
    answer:
      "I'd use a relational database with proper indexing. The main tables would be users, posts, and follows. We can cache frequently accessed data in Redis and use read replicas for scaling.",
    weakAssumptions: [
      "No mention of write scaling",
      "No sharding strategy",
      "Cache invalidation not addressed",
      "No mention of data consistency model",
    ],
  },
  {
    id: "g2",
    category: "Coding",
    answer:
      "I'll use a hash map to store the frequency of each element. Then I'll iterate through and find the element with the highest frequency. This runs in O(n) time and O(n) space.",
    weakAssumptions: [
      "Doesn't handle ties",
      "No mention of streaming/large data",
      "Assumes all elements fit in memory",
      "No edge case for empty input",
    ],
  },
  {
    id: "g3",
    category: "Behavioral",
    answer:
      "I led the migration from monolith to microservices. The team worked hard and we completed it in 6 months. It improved our deployment frequency significantly and the stakeholders were happy.",
    weakAssumptions: [
      "No quantified impact",
      "Vague team size/scope",
      "No mention of failures or obstacles",
      "No individual ownership signal",
    ],
  },
  {
    id: "g4",
    category: "System Design",
    answer:
      "For the messaging system, I'd use WebSockets for real-time delivery. Messages are stored in a database. We can use a message queue for async processing and scale horizontally.",
    weakAssumptions: [
      "No mention of message ordering",
      "No offline delivery strategy",
      "No mention of read receipts consistency",
      "No fan-out strategy for group messages",
    ],
  },
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function TheGotchaFollowUp({ onComplete }: Props) {
  const [phase, setPhase] = useState<
    "intro" | "read" | "predict" | "answer" | "result"
  >("intro");
  const [scenario] = useState(
    () => ANSWER_STARTERS[Math.floor(Math.random() * ANSWER_STARTERS.length)]
  );
  const [predictedFollowUps, setPredictedFollowUps] = useState("");
  const [gotchaQuestion, setGotchaQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const generateMutation =
    trpc.failureDrills.generateGotchaQuestion.useMutation();
  const scoreMutation = trpc.failureDrills.scoreGotchaFollowUp.useMutation();

  const handleGenerateGotcha = () => {
    generateMutation.mutate(
      { scenarioId: scenario.id, candidateAnswer: scenario.answer },
      {
        onSuccess: data => {
          setGotchaQuestion(data.question);
          setPhase("answer");
        },
      }
    );
  };

  const handleSubmit = () => {
    scoreMutation.mutate(
      {
        scenarioId: scenario.id,
        gotchaQuestion,
        predictedFollowUps,
        answer,
        weakAssumptions: scenario.weakAssumptions,
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
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-rose-400" />
            <span className="font-semibold text-rose-400 text-sm">
              The Gotcha Follow-Up
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Read a candidate answer with hidden weak assumptions. First predict
            what follow-up questions an interviewer would ask. Then the AI fires
            the actual gotcha question — and you must answer it. Trains
            pre-empting your own weak spots.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Two-phase drill
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
                Phase 1
              </Badge>
              <span className="text-xs text-muted-foreground">
                Predict the follow-up questions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
                Phase 2
              </Badge>
              <span className="text-xs text-muted-foreground">
                Answer the AI&apos;s actual gotcha question
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setPhase("read")}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "read") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs border-0 ${scenario.category === "System Design" ? "bg-blue-500/20 text-blue-300" : scenario.category === "Coding" ? "bg-emerald-500/20 text-emerald-300" : "bg-pink-500/20 text-pink-300"}`}
          >
            {scenario.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Candidate answer
          </span>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4">
          <p className="text-sm text-foreground leading-relaxed">
            {scenario.answer}
          </p>
        </div>
        <Button onClick={() => setPhase("predict")} className="w-full">
          I&apos;ve Read It — Predict Follow-Ups →
        </Button>
      </div>
    );
  }

  if (phase === "predict") {
    return (
      <div className="space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          <p className="text-xs text-rose-400 font-medium">
            What follow-up questions would a skeptical interviewer ask?
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            List 2–4 questions you think expose weak assumptions in that answer.
          </p>
        </div>
        <Textarea
          value={predictedFollowUps}
          onChange={e => setPredictedFollowUps(e.target.value)}
          placeholder={
            "1. What happens when...\n2. How would you handle...\n3. What if the scale is..."
          }
          rows={5}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={handleGenerateGotcha}
          disabled={
            predictedFollowUps.trim().length < 20 || generateMutation.isPending
          }
          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
        >
          {generateMutation.isPending
            ? "Generating gotcha..."
            : "See the Real Gotcha Question →"}
        </Button>
      </div>
    );
  }

  if (phase === "answer") {
    return (
      <div className="space-y-4">
        <div className="bg-rose-500/20 border border-rose-500/40 rounded-lg p-4">
          <div className="flex items-center gap-1 mb-2">
            <Target size={14} className="text-rose-400" />
            <span className="text-xs text-rose-400 font-bold uppercase tracking-wide">
              Gotcha Question
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {gotchaQuestion}
          </p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Your predicted follow-ups
          </p>
          <p className="text-xs text-muted-foreground whitespace-pre-line">
            {predictedFollowUps}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Answer the gotcha question
          </label>
          <Textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Your answer..."
            rows={5}
            className="text-sm resize-none"
            autoFocus
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={answer.trim().length < 20 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit Answer"}
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
          <span className="font-semibold">Gotcha Score</span>
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
          <p className="text-lg font-bold">{result.predictionScore}</p>
          <p className="text-xs text-muted-foreground">Prediction</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3 text-center">
          <p className="text-lg font-bold">{result.answerScore}</p>
          <p className="text-xs text-muted-foreground">Answer Quality</p>
        </div>
      </div>
      <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium">
          Actual weak assumptions in the answer
        </p>
        <div className="flex flex-wrap gap-1.5">
          {scenario.weakAssumptions.map((w, i) => (
            <Badge
              key={i}
              className="bg-secondary/60 text-muted-foreground text-xs border-0"
            >
              {w}
            </Badge>
          ))}
        </div>
      </div>
      <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
        {result.feedback}
      </div>
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Strong predictions/answers
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
          setPredictedFollowUps("");
          setGotchaQuestion("");
          setAnswer("");
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
