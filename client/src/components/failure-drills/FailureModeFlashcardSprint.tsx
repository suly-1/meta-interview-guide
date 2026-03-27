import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, CheckCircle2, X, Zap } from "lucide-react";

const CARDS = [
  {
    id: "c1",
    excerpt: `"I didn't mention latency requirements because the interviewer didn't ask about them specifically."`,
    correctCategory: "system-design",
    correctSignal: "Skipping NFRs",
    hint: "NFRs must be proactively stated",
  },
  {
    id: "c2",
    excerpt: `"I designed a single MySQL node for the write path — it should handle the load fine."`,
    correctCategory: "system-design",
    correctSignal: "Missing bottleneck",
    hint: "Single DB node = bottleneck at scale",
  },
  {
    id: "c3",
    excerpt: `"My solution handles the normal case. I didn't think about empty arrays since that's unlikely."`,
    correctCategory: "coding",
    correctSignal: "Weak edge cases",
    hint: "Edge cases must always be enumerated",
  },
  {
    id: "c4",
    excerpt: `"I worked with the team to improve performance significantly across the board."`,
    correctCategory: "behavioral",
    correctSignal: "Vague STAR",
    hint: "No metrics, no specifics, no ownership",
  },
  {
    id: "c5",
    excerpt: `"We decided as a team to migrate to microservices. It was a group effort."`,
    correctCategory: "behavioral",
    correctSignal: "Weak ownership",
    hint: "No individual ownership signal",
  },
  {
    id: "c6",
    excerpt: `"My design works at 1K RPS. I haven't thought about what happens at 100K RPS."`,
    correctCategory: "system-design",
    correctSignal: "Can't scale",
    hint: "Scale thinking must be proactive",
  },
  {
    id: "c7",
    excerpt: `"My solution works but I'm not sure about the time complexity — probably O(n) or O(n²)."`,
    correctCategory: "coding",
    correctSignal: "No time complexity",
    hint: "Always state Big-O upfront",
  },
  {
    id: "c8",
    excerpt: `"The project had a big impact on the company's performance."`,
    correctCategory: "behavioral",
    correctSignal: "No metrics",
    hint: "Impact must be quantified",
  },
  {
    id: "c9",
    excerpt: `"I chose SQL because it's reliable. I didn't consider NoSQL since SQL is what I know best."`,
    correctCategory: "system-design",
    correctSignal: "Shallow trade-offs",
    hint: "Trade-offs must be explicit and balanced",
  },
  {
    id: "c10",
    excerpt: `"My first solution is O(n²) brute force. I'll optimize later if I have time."`,
    correctCategory: "coding",
    correctSignal: "Brute force only",
    hint: "Should state optimal approach first",
  },
  {
    id: "c11",
    excerpt: `"The team helped push this initiative forward and we all contributed to the outcome."`,
    correctCategory: "behavioral",
    correctSignal: "Passive language",
    hint: "Use 'I' not 'we' for ownership",
  },
  {
    id: "c12",
    excerpt: `"My design doesn't handle network partitions or node failures — I assumed perfect network."`,
    correctCategory: "system-design",
    correctSignal: "No failure handling",
    hint: "Failure modes must be addressed",
  },
  {
    id: "c13",
    excerpt: `"I wrote the code but didn't add any tests — I'd add them later in a real scenario."`,
    correctCategory: "coding",
    correctSignal: "No test cases",
    hint: "Tests are part of the solution",
  },
  {
    id: "c14",
    excerpt: `"The PM disagreed but eventually came around. I don't remember exactly how we resolved it."`,
    correctCategory: "behavioral",
    correctSignal: "No conflict resolution",
    hint: "Conflict resolution must be specific",
  },
  {
    id: "c15",
    excerpt: `"I implemented the feature my manager asked for and it worked well within the team."`,
    correctCategory: "system-design",
    correctSignal: "L5 scope language",
    hint: "L5: team scope, no cross-org impact",
  },
];

const CATEGORIES = ["system-design", "coding", "behavioral"] as const;
type Category = (typeof CATEGORIES)[number];

interface CardAnswer {
  cardId: string;
  excerpt: string;
  userCategory: Category;
  userSignal: string;
  userFix: string;
}

interface Props {
  onComplete?: (score: number) => void;
}

export default function FailureModeFlashcardSprint({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<CardAnswer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scoreMutation = trpc.failureDrills.scoreFlashcardSprint.useMutation();

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleFinish(300);
            return 0;
          }
          return t - 1;
        });
        setElapsedSeconds(e => e + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const currentCard = CARDS[currentIdx];
  const timerColor =
    timeLeft > 120
      ? "text-emerald-400"
      : timeLeft > 30
        ? "text-amber-400"
        : "text-red-400";

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
  };

  const handleNext = () => {
    if (!selectedCategory) return;
    const answer: CardAnswer = {
      cardId: currentCard.id,
      excerpt: currentCard.excerpt,
      userCategory: selectedCategory,
      userSignal: currentCard.correctSignal, // auto-fill signal for speed
      userFix: "",
    };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setSelectedCategory(null);

    if (currentIdx < CARDS.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      handleFinish(elapsedSeconds, newAnswers);
    }
  };

  const handleFinish = (elapsed?: number, finalAnswers?: CardAnswer[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const toSubmit = finalAnswers ?? answers;
    scoreMutation.mutate(
      { answers: toSubmit, elapsedSeconds: elapsed ?? elapsedSeconds },
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
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-violet-400" />
            <span className="font-semibold text-violet-400 text-sm">
              Failure Mode Flashcard Sprint
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            15 cards, 5 minutes. Each card shows a candidate answer excerpt.
            Classify it as System Design, Coding, or Behavioral failure as fast
            as possible. Builds the meta-skill of recognizing failure patterns
            in real time.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "System Design", color: "text-blue-400", count: 7 },
            { label: "Coding", color: "text-emerald-400", count: 4 },
            { label: "Behavioral", color: "text-pink-400", count: 4 },
          ].map(c => (
            <div
              key={c.label}
              className="bg-secondary/40 rounded-lg p-3 text-center"
            >
              <p className={`text-lg font-bold ${c.color}`}>{c.count}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
        <Button
          onClick={() => setPhase("active")}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold"
        >
          Start Sprint
        </Button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-muted-foreground" />
            <span className={`font-mono font-bold ${timerColor}`}>
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Card {currentIdx + 1} / {CARDS.length}
            </span>
            <Progress
              value={(currentIdx / CARDS.length) * 100}
              className="w-20 h-2"
            />
          </div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-lg p-4 min-h-[80px]">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            Candidate said:
          </p>
          <p className="text-sm text-foreground italic">
            {currentCard.excerpt}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Classify this failure:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? cat === "system-design"
                      ? "border-blue-500 bg-blue-500/20 text-blue-300"
                      : cat === "coding"
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-pink-500 bg-pink-500/20 text-pink-300"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {cat === "system-design"
                  ? "System Design"
                  : cat === "coding"
                    ? "Coding"
                    : "Behavioral"}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleNext}
          disabled={!selectedCategory}
          className="w-full"
        >
          {currentIdx < CARDS.length - 1 ? "Next Card →" : "Finish Sprint"}
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
          <span className="font-semibold">Sprint Score</span>
        </div>
        <span
          className={`text-3xl font-bold ${result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"}`}
        >
          {result.score}
        </span>
      </div>
      <Progress value={result.score} className="h-3" />
      <div className="bg-secondary/40 rounded-lg p-4">
        <p className="text-sm font-medium">
          {result.correct} / {result.total} correct classifications
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Completed in {Math.round(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
        </p>
      </div>

      <div className="space-y-2">
        {answers.map((a, i) => {
          const expected = result.cardAnswers[a.cardId];
          const isCorrect = expected && a.userCategory === expected.category;
          return (
            <div
              key={i}
              className={`flex items-start gap-2 text-xs p-2 rounded ${isCorrect ? "bg-emerald-500/10" : "bg-red-500/10"}`}
            >
              {isCorrect ? (
                <CheckCircle2
                  size={12}
                  className="text-emerald-400 shrink-0 mt-0.5"
                />
              ) : (
                <X size={12} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground truncate">
                  {a.excerpt.slice(0, 60)}...
                </p>
                {!isCorrect && expected && (
                  <p className="text-amber-400 mt-0.5">
                    Correct: {expected.category} — {expected.signal}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => {
          setPhase("intro");
          setCurrentIdx(0);
          setAnswers([]);
          setTimeLeft(300);
          setElapsedSeconds(0);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
