// Feature 6: Rubber Duck Explainer
// Type your approach explanation; AI scores clarity and Technical Communication dimension.
// Meta's rubric: 25% of score is Technical Communication — almost never practiced.

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, RefreshCw, Star } from "lucide-react";

const PROMPTS = [
  {
    id: "two-sum",
    title: "Two Sum (Hash Map approach)",
    context:
      "You've just decided to use a hash map instead of brute force. Explain your reasoning to the interviewer.",
  },
  {
    id: "lru-cache",
    title: "LRU Cache (Doubly Linked List + HashMap)",
    context:
      "You're about to implement an LRU Cache. Explain the data structure choice and why it achieves O(1) for both get and put.",
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals (Sort + scan)",
    context:
      "You've chosen to sort first. Explain why sorting is necessary and how you'll merge overlapping intervals.",
  },
  {
    id: "graph-bfs",
    title: "Number of Islands (BFS/DFS)",
    context:
      "You're using BFS to count connected components. Explain the traversal strategy and how you avoid revisiting cells.",
  },
  {
    id: "dp-knapsack",
    title: "Coin Change (Bottom-up DP)",
    context:
      "You've identified this as a DP problem. Explain the state definition, transition, and base case to the interviewer.",
  },
];

const SCORE_COLORS = [
  "text-red-400",
  "text-red-400",
  "text-amber-400",
  "text-amber-400",
  "text-yellow-400",
  "text-yellow-400",
  "text-emerald-400",
  "text-emerald-400",
  "text-emerald-400",
  "text-blue-400",
  "text-blue-400",
];

export default function RubberDuckExplainer() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{
    score: number;
    clarity: number;
    structure: number;
    technicalAccuracy: number;
    feedback: string;
    improvements: string[];
    strongPoints: string[];
  } | null>(null);
  const [sessionBest, setSessionBest] = useState(0);

  const scoreMutation = trpc.aiTraining.scoreExplanation.useMutation();
  const prompt = PROMPTS[promptIdx];

  const handleSubmit = async () => {
    if (!explanation.trim()) return;
    setSubmitted(true);
    const result = await scoreMutation.mutateAsync({
      promptId: prompt.id,
      explanation: explanation.trim(),
    });
    setScore(result);
    if (result.score > sessionBest) setSessionBest(result.score);
  };

  const handleNext = () => {
    setPromptIdx(i => (i + 1) % PROMPTS.length);
    setExplanation("");
    setSubmitted(false);
    setScore(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-pink-400" size={20} />
          <h3 className="font-semibold text-foreground">
            Rubber Duck Explainer
          </h3>
          <Badge
            variant="outline"
            className="text-xs border-pink-400/40 text-pink-400"
          >
            {promptIdx + 1}/{PROMPTS.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {sessionBest > 0 && (
            <span className="text-xs text-muted-foreground">
              Best:{" "}
              <span className="text-pink-400 font-semibold">
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

      {/* Prompt card */}
      <Card className="border-pink-500/20 bg-pink-500/5">
        <CardContent className="px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-pink-400">{prompt.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {prompt.context}
          </p>
          <p className="text-xs text-muted-foreground italic mt-1">
            Explain your approach as if talking to the interviewer. Aim for 3–5
            sentences covering: what, why, and trade-offs.
          </p>
        </CardContent>
      </Card>

      {!submitted ? (
        <div className="space-y-2">
          <Textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="I'm going to use a hash map because… The key insight is… The trade-off here is…"
            className="text-sm min-h-[120px] resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {explanation.split(/\s+/).filter(Boolean).length} words
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!explanation.trim() || scoreMutation.isPending}
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {scoreMutation.isPending ? "Scoring…" : "Score My Explanation"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Score breakdown */}
          <Card className="border-pink-500/30 bg-pink-500/5">
            <CardContent className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`text-3xl font-bold ${SCORE_COLORS[score?.score ?? 0]}`}
                >
                  {score?.score}/10
                </div>
                <div className="flex-1 space-y-1">
                  {[
                    { label: "Clarity", val: score?.clarity ?? 0 },
                    { label: "Structure", val: score?.structure ?? 0 },
                    {
                      label: "Technical Accuracy",
                      val: score?.technicalAccuracy ?? 0,
                    },
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
                                ? "text-pink-400 fill-pink-400"
                                : "text-muted-foreground/30"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {score?.feedback}
              </p>

              {(score?.strongPoints?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-1">
                    Strong points:
                  </p>
                  <ul className="space-y-0.5">
                    {score!.strongPoints.map((p, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        ✓ {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(score?.improvements?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-400 mb-1">
                    Improvements:
                  </p>
                  <ul className="space-y-0.5">
                    {score!.improvements.map((p, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleNext}
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Next Prompt →
          </Button>
        </div>
      )}
    </div>
  );
}
