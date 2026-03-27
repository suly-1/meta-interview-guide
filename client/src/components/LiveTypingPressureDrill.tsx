// LiveTypingPressureDrill — Live Typing Pressure Mode
// Real-time AI interruptions while the user types their answer
// Simulates the pressure of being interrupted mid-thought in a real interview
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap,
  Loader2,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Timer,
} from "lucide-react";

const QUESTIONS = [
  {
    id: "tp-1",
    prompt:
      "Design a notification system for 500M users. Start explaining your approach...",
    category: "system-design",
  },
  {
    id: "tp-2",
    prompt:
      "Implement a function to find the longest palindromic substring. Think out loud...",
    category: "coding",
  },
  {
    id: "tp-3",
    prompt:
      "Tell me about a time you had to make a difficult technical decision under pressure...",
    category: "behavioral",
  },
  {
    id: "tp-4",
    prompt:
      "Design a rate limiter for an API gateway. Walk me through your thinking...",
    category: "system-design",
  },
];

interface Interruption {
  id: string;
  text: string;
  timestamp: number;
  dismissed: boolean;
}

export function LiveTypingPressureDrill() {
  const [active, setActive] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interruptionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastInterruptionWordCount = useRef(0);

  const question = QUESTIONS[questionIdx];

  // Simulate AI interruptions (in production this would call the server)
  const INTERRUPTION_SCRIPTS = [
    "Wait — what happens when the database goes down?",
    "Hold on. How does this scale to 10x traffic?",
    "Stop. What's the latency on that operation?",
    "Interesting. But what about consistency guarantees?",
    "Back up — why not use a simpler approach?",
    "What's the failure mode here?",
    "How would you test this at scale?",
    "What's the operational cost of maintaining this?",
  ];

  const addInterruption = useCallback(() => {
    const text =
      INTERRUPTION_SCRIPTS[
        Math.floor(Math.random() * INTERRUPTION_SCRIPTS.length)
      ];
    const id = `int-${Date.now()}`;
    setInterruptions(prev => [
      ...prev,
      { id, text, timestamp: Date.now(), dismissed: false },
    ]);
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setInterruptions(prev =>
        prev.map(i => (i.id === id ? { ...i, dismissed: true } : i))
      );
    }, 8000);
  }, []);

  // Start session
  function handleStart() {
    setActive(true);
    setAnswer("");
    setInterruptions([]);
    setElapsed(0);
    setFinalScore(null);
    setSessionId(`tp-${Date.now()}`);
    lastInterruptionWordCount.current = 0;

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);

    // Interruption scheduler: trigger after every ~40 words typed
    interruptionTimerRef.current = setInterval(() => {
      const wc = wordCount;
      if (wc - lastInterruptionWordCount.current >= 40) {
        addInterruption();
        lastInterruptionWordCount.current = wc;
      }
    }, 3000);

    toast.info(
      "Pressure mode active! Answer the question — interruptions incoming..."
    );
  }

  // Stop session
  function handleStop() {
    setActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (interruptionTimerRef.current)
      clearInterval(interruptionTimerRef.current);

    // Simple local scoring based on answer quality signals
    const wc = answer.trim().split(/\s+/).filter(Boolean).length;
    const interruptionsHandled = interruptions.filter(i => i.dismissed).length;
    const score = Math.min(
      100,
      Math.round(
        (wc >= 100 ? 40 : (wc / 100) * 40) +
          interruptionsHandled * 10 +
          (elapsed >= 120 ? 20 : (elapsed / 120) * 20) +
          Math.random() * 10
      )
    );

    setFinalScore({
      score,
      feedback: `You wrote ${wc} words in ${Math.floor(elapsed / 60)}m ${elapsed % 60}s with ${interruptions.length} interruptions. ${
        score >= 70
          ? "Strong performance under pressure — you maintained coherence despite interruptions."
          : score >= 50
            ? "Decent effort. Work on maintaining your train of thought when interrupted."
            : "Interruptions significantly disrupted your answer. Practice staying calm and acknowledging interruptions briefly before continuing."
      }`,
    });
  }

  // Track word count
  useEffect(() => {
    const wc = answer.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(wc);
  }, [answer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (interruptionTimerRef.current)
        clearInterval(interruptionTimerRef.current);
    };
  }, []);

  const elapsedDisplay = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const activeInterruptions = interruptions.filter(i => !i.dismissed);

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Zap size={16} className="text-red-400" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">
              Live Typing Pressure
            </div>
            <div className="text-xs text-muted-foreground">
              AI interrupts you mid-answer
            </div>
          </div>
        </div>
        {active && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer size={12} />
              {elapsedDisplay}
            </div>
            <div className="text-xs text-muted-foreground">
              {wordCount} words
            </div>
          </div>
        )}
      </div>

      {/* Question selector (only when not active) */}
      {!active && !finalScore && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {QUESTIONS.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setQuestionIdx(i)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                questionIdx === i
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {q.category === "system-design"
                ? "SD"
                : q.category === "coding"
                  ? "Code"
                  : "BQ"}{" "}
              #{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Question prompt */}
      {!finalScore && (
        <div className="bg-black/20 border border-white/5 rounded-xl p-3 mb-3 text-sm text-muted-foreground leading-relaxed">
          {question.prompt}
        </div>
      )}

      {/* Active interruptions overlay */}
      {activeInterruptions.length > 0 && (
        <div className="space-y-2 mb-3">
          {activeInterruptions.map(interruption => (
            <div
              key={interruption.id}
              className="flex items-start gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 animate-pulse"
            >
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold text-red-400 mb-0.5">
                  Interviewer interrupts:
                </div>
                <div className="text-sm text-foreground font-semibold">
                  {interruption.text}
                </div>
              </div>
              <button
                onClick={() =>
                  setInterruptions(prev =>
                    prev.map(i =>
                      i.id === interruption.id ? { ...i, dismissed: true } : i
                    )
                  )
                }
                className="text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Answer textarea */}
      {active && (
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Start typing your answer... The interviewer is watching."
          className="w-full h-40 text-sm bg-black/30 border border-red-500/20 rounded-xl p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-red-500/40 transition-colors mb-3"
          autoFocus
        />
      )}

      {/* Final score */}
      {finalScore && (
        <div
          className={`rounded-xl border p-4 mb-3 ${finalScore.score >= 70 ? "bg-emerald-500/10 border-emerald-500/20" : finalScore.score >= 50 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2
              size={16}
              className={
                finalScore.score >= 70 ? "text-emerald-400" : "text-amber-400"
              }
            />
            <span
              className={`font-black text-xl ${finalScore.score >= 70 ? "text-emerald-400" : finalScore.score >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              {finalScore.score}/100
            </span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {finalScore.feedback}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!active ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
          >
            <Play size={14} />
            Start Pressure Mode
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-foreground font-semibold text-sm transition-colors border border-white/10"
          >
            <Square size={14} />
            End & Score
          </button>
        )}
        {finalScore && (
          <button
            onClick={() => {
              setFinalScore(null);
              setAnswer("");
              setInterruptions([]);
              setElapsed(0);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground text-sm transition-colors border border-white/10"
          >
            Try Again
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Tip: Acknowledge interruptions briefly (&quot;Good point — let me
        address that after I finish this thought&quot;) then continue.
      </div>
    </div>
  );
}
