// AI-Native Drill #13+26 — Epistemic Humility Coach
// Candidate answers a philosophy/culture question; LLM scores genuine learning velocity
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

const SCORE_COLOR = (s: number) =>
  s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

const QUESTIONS = [
  {
    id: "q1",
    prompt:
      "Tell me about a time an AI system surprised you — in a way that changed how you think about AI.",
    hint: "IC7 signal: specific project, specific failure/surprise, concrete belief update ('I used to think X, now I think Y because Z'). Not a blog-post summary.",
  },
  {
    id: "q2",
    prompt:
      "What's something you believed about LLMs 12 months ago that you no longer believe?",
    hint: "IC7 signal: names the specific belief, explains what evidence changed it, and what the new mental model is.",
  },
  {
    id: "q3",
    prompt:
      "Describe a project where you had to admit the AI approach wasn't working and pivot. What did you learn?",
    hint: "IC7 signal: names the specific failure mode (hallucination? latency? cost? user rejection?), explains the pivot, and quantifies the outcome.",
  },
  {
    id: "q4",
    prompt:
      "How do you stay current with AI developments without being distracted by hype?",
    hint: "IC7 signal: names specific sources (papers, practitioners, evals), describes a filtering heuristic, and gives a recent example of something they dismissed as hype vs. adopted.",
  },
  {
    id: "q5",
    prompt:
      "What's the most important thing you've learned from an AI failure in the last year?",
    hint: "IC7 signal: specific failure, specific root cause, specific change in practice — not 'I learned to test more'.",
  },
];

export default function EpistemicHumilityCoach() {
  const [selectedQ, setSelectedQ] = useState<(typeof QUESTIONS)[0] | null>(
    null
  );
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{
    specificity: number;
    beliefUpdate: number;
    failureAcknowledgment: number;
    learningVelocity: number;
    overall: number;
    soundsRehearsed: boolean;
    feedback: string;
    strongPoints: string[];
    improvements: string[];
  } | null>(null);

  const score = trpc.aiTraining.scoreEpistemicHumility.useMutation();

  const handleSubmit = async () => {
    if (!selectedQ) return;
    const res = await score.mutateAsync({
      storyAnswer: answer,
      questionPrompt: selectedQ.prompt,
    });
    setResult(res);
  };

  const reset = () => {
    setSelectedQ(null);
    setAnswer("");
    setResult(null);
  };

  const dims = result
    ? [
        { label: "Specificity", val: result.specificity },
        { label: "Belief Update", val: result.beliefUpdate },
        { label: "Failure Acknowledgment", val: result.failureAcknowledgment },
        { label: "Learning Velocity", val: result.learningVelocity },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Continuous AI Learning — Philosophy & Culture Phase
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          The hardest phase to fake. The IC7 bar: specific project, specific
          failure, concrete belief update. Rehearsed talking points are flagged.
          Genuine intellectual humility is the signal.
        </p>
      </div>

      {!result && !selectedQ && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Choose a question:
          </p>
          {QUESTIONS.map(q => (
            <button
              key={q.id}
              onClick={() => setSelectedQ(q)}
              className="w-full text-left p-4 rounded-lg border border-violet-500/20 bg-violet-500/5 hover:border-violet-500/50 transition-all space-y-1"
            >
              <p className="text-sm font-medium text-foreground">
                "{q.prompt}"
              </p>
              <p className="text-xs text-muted-foreground">{q.hint}</p>
            </button>
          ))}
        </div>
      )}

      {!result && selectedQ && (
        <div className="space-y-4">
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-sm font-medium text-foreground">
              "{selectedQ.prompt}"
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              {selectedQ.hint}
            </p>
          </div>
          <Textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write your answer as you would speak it in the interview…"
            rows={7}
            className="bg-background/50 border-violet-500/20 focus:border-violet-500/50 resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedQ(null)}
              className="border-violet-500/30"
            >
              ← Change Question
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={answer.trim().length < 60 || score.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {score.isPending ? "Scoring…" : "Score My Answer"}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`text-4xl font-bold ${SCORE_COLOR(result.overall)}`}
            >
              {result.overall.toFixed(1)}
              <span className="text-lg text-muted-foreground">/5</span>
            </div>
            <div className="space-y-1">
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                {result.overall >= 4.5
                  ? "Genuine Learning Velocity ✦"
                  : result.overall >= 3.5
                    ? "Authentic"
                    : "Sounds Rehearsed"}
              </Badge>
              {result.soundsRehearsed && (
                <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs ml-1">
                  ⚠ Sounds rehearsed
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dims.map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className={SCORE_COLOR(d.val)}>{d.val}/5</span>
                </div>
                <Progress value={d.val * 20} className="h-1.5" />
              </div>
            ))}
          </div>

          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm text-foreground">{result.feedback}</p>
              {result.strongPoints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1">
                    ✓ Strong signals
                  </p>
                  {result.strongPoints.map((p, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {p}
                    </p>
                  ))}
                </div>
              )}
              {result.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                    <Lightbulb size={11} /> Improvements
                  </p>
                  {result.improvements.map((p, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {p}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={reset}
            className="border-violet-500/30 gap-1"
          >
            <RefreshCw size={13} /> Try Another Question
          </Button>
        </div>
      )}
    </div>
  );
}
