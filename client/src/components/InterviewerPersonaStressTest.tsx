/**
 * Interviewer Persona Stress Test
 * AI plays one of 5 hostile interviewer archetypes.
 * Per-turn: AI scores resilience (0-10) and generates the next challenge.
 * Final: AI generates a coaching note and persists a resilience scorecard to DB.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { BEHAVIORAL_QUESTIONS } from "@/lib/data";
import {
  UserX,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
  Trophy,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PERSONAS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    description:
      "Challenges every claim with 'But how do you know that worked?'",
    icon: "🔍",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    openingChallenge:
      "You've given your answer. But how do you actually know that worked? What's the evidence?",
  },
  {
    id: "devil",
    name: "The Devil's Advocate",
    description: "Argues the opposite of everything you say",
    icon: "😈",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    openingChallenge:
      "I'd argue the opposite approach would have been better. Why are you confident your choice was correct?",
  },
  {
    id: "detail",
    name: "The Detail Obsessive",
    description: "Demands exact numbers, dates, and metrics for every claim",
    icon: "📊",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    openingChallenge:
      "Give me the exact numbers. What was the baseline metric, what was the result, and when exactly did this happen?",
  },
  {
    id: "silent",
    name: "The Silent Starer",
    description: "Responds with 'Interesting. Tell me more.' to everything",
    icon: "😶",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    openingChallenge: "Interesting. Tell me more.",
  },
  {
    id: "friendly",
    name: "The Friendly Trap",
    description: "Warm and encouraging — then asks the hardest follow-up",
    icon: "😊",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    openingChallenge:
      "That's great! And what would you have done differently if you had more time or resources?",
  },
];

const MAX_TURNS = 3;

interface Turn {
  challenge: string;
  response: string;
  score: number;
  feedback: string;
}

interface ScorecardResult {
  resilienceScore: number;
  avgTurnScore: number;
  aiCoachNote: string;
}

export function InterviewerPersonaStressTest() {
  const [expanded, setExpanded] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [selectedQId, setSelectedQId] = useState(
    BEHAVIORAL_QUESTIONS[0]?.id ?? ""
  );
  const [initialAnswer, setInitialAnswer] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [currentChallenge, setCurrentChallenge] = useState<string>("");
  const [responseInput, setResponseInput] = useState("");
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);

  const evaluateTurn = trpc.drillSessions.evaluatePersonaTurn.useMutation();
  const generateScorecard =
    trpc.drillSessions.generatePersonaScorecard.useMutation();

  const selectedQ = BEHAVIORAL_QUESTIONS.find(q => q.id === selectedQId);

  function handleStart() {
    if (!initialAnswer.trim()) {
      toast.error("Write your initial STAR answer first");
      return;
    }
    // Use the persona's opening challenge to kick off the first turn
    setCurrentChallenge(selectedPersona.openingChallenge);
    setPhase("running");
    setTurns([]);
    setResponseInput("");
    setScorecard(null);
  }

  async function handleSubmitResponse() {
    if (!responseInput.trim()) return;
    const turnNumber = turns.length + 1;
    try {
      const result = await evaluateTurn.mutateAsync({
        personaId: selectedPersona.id,
        personaLabel: selectedPersona.name,
        personaDescription: selectedPersona.description,
        topic: selectedQ?.q ?? "",
        challenge: currentChallenge,
        response: responseInput,
        turnNumber,
      });

      const newTurn: Turn = {
        challenge: currentChallenge,
        response: responseInput,
        score: result.resilienceScore,
        feedback: result.coachingNote,
      };
      const updatedTurns = [...turns, newTurn];
      setTurns(updatedTurns);
      setResponseInput("");

      if (turnNumber >= MAX_TURNS) {
        // Final turn — generate scorecard
        setPhase("done");
        try {
          const sc = await generateScorecard.mutateAsync({
            personaId: selectedPersona.id,
            personaLabel: selectedPersona.name,
            topic: selectedQ?.q ?? "",
            turns: updatedTurns,
          });
          setScorecard(sc);
        } catch {
          // non-fatal — show partial results
        }
      } else {
        // Advance to next challenge
        setCurrentChallenge(result.nextChallenge);
      }
    } catch {
      toast.error("Scoring failed — try again");
    }
  }

  function reset() {
    setPhase("setup");
    setTurns([]);
    setInitialAnswer("");
    setResponseInput("");
    setCurrentChallenge("");
    setScorecard(null);
  }

  const avgScore =
    turns.length > 0
      ? turns.reduce((a, t) => a + t.score, 0) / turns.length
      : null;

  const scoreColor = (s: number) =>
    s >= 7 ? "text-emerald-400" : s >= 5 ? "text-amber-400" : "text-red-400";

  return (
    <div
      id="behavioral-persona-stress"
      className="rounded-xl border-2 border-orange-500/60 bg-gradient-to-br from-orange-950/40 to-red-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(249,115,22,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/10 border-b border-orange-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black tracking-wider uppercase">
            🎯 Very High Impact
          </span>
          <UserX size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-orange-300">
            Interviewer Persona Stress Test
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-orange-400 hover:text-orange-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            AI plays a hostile interviewer persona and fires {MAX_TURNS}{" "}
            follow-up challenges at your STAR answer. Each turn is scored on
            resilience (0–10). Final scorecard persisted to your profile.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            Start stress test →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle
              size={14}
              className="text-orange-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-orange-200">
              <strong>Why this matters:</strong> Most candidates prepare for
              friendly interviewers. The ones who fail are caught off-guard by
              skeptics and devil's advocates. This drill makes hostile
              follow-ups feel routine. Scores are saved to your profile so you
              can track resilience improvement over time.
            </p>
          </div>

          {/* Setup phase */}
          {phase === "setup" && (
            <div className="space-y-4">
              {/* Persona selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Choose Interviewer Persona
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PERSONAS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        selectedPersona.id === p.id
                          ? `${p.bgColor} ${p.borderColor} border`
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xl shrink-0">{p.icon}</span>
                      <div>
                        <div
                          className={`text-xs font-bold ${selectedPersona.id === p.id ? p.color : "text-foreground"}`}
                        >
                          {p.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Behavioral Question
                </label>
                <select
                  value={selectedQId}
                  onChange={e => setSelectedQId(e.target.value)}
                  className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
                >
                  {BEHAVIORAL_QUESTIONS.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.q.slice(0, 80)}
                      {q.q.length > 80 ? "…" : ""}
                    </option>
                  ))}
                </select>
                {selectedQ && (
                  <p className="text-xs text-muted-foreground p-2 rounded-lg bg-white/5 border border-white/10">
                    {selectedQ.q}
                  </p>
                )}
              </div>

              {/* Initial answer */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Initial Answer (STAR format)
                </label>
                <textarea
                  value={initialAnswer}
                  onChange={e => setInitialAnswer(e.target.value)}
                  rows={5}
                  placeholder="Write your STAR answer here — Situation, Task, Action, Result..."
                  className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  The AI will read this answer and fire {MAX_TURNS}{" "}
                  persona-style challenges at it.
                </p>
              </div>

              <button
                onClick={handleStart}
                disabled={!initialAnswer.trim()}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
              >
                Face {selectedPersona.name} →
              </button>
            </div>
          )}

          {/* Running / Done phase */}
          {(phase === "running" || phase === "done") && (
            <div className="space-y-4">
              {/* Persona badge + progress */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${selectedPersona.bgColor} border ${selectedPersona.borderColor}`}
                >
                  <span>{selectedPersona.icon}</span>
                  <span
                    className={`text-xs font-bold ${selectedPersona.color}`}
                  >
                    {selectedPersona.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Turn {Math.min(turns.length + 1, MAX_TURNS)}/{MAX_TURNS}
                  </span>
                  {avgScore !== null && (
                    <span className={`font-bold ${scoreColor(avgScore)}`}>
                      Avg resilience: {avgScore.toFixed(1)}/10
                    </span>
                  )}
                </div>
              </div>

              {/* Initial answer recap */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Your initial answer
                </p>
                <p className="text-xs text-foreground/70 line-clamp-3">
                  {initialAnswer}
                </p>
              </div>

              {/* Completed turns */}
              {turns.map((t, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0">
                      {selectedPersona.icon}
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      "{t.challenge}"
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      size={12}
                      className="text-muted-foreground shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-foreground/70">{t.response}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <p className="text-xs text-muted-foreground flex-1 mr-2">
                      {t.feedback}
                    </p>
                    <Badge
                      className={`text-xs border shrink-0 ${
                        t.score >= 7
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : t.score >= 5
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                      }`}
                    >
                      {t.score}/10
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Current challenge input */}
              {phase === "running" && (
                <div className="space-y-3 rounded-xl border-2 border-orange-500/40 p-4 bg-orange-950/20">
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0">
                      {selectedPersona.icon}
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      "{currentChallenge}"
                    </p>
                  </div>
                  <textarea
                    value={responseInput}
                    onChange={e => setResponseInput(e.target.value)}
                    rows={4}
                    placeholder="Respond to this challenge..."
                    className="w-full text-xs rounded-lg bg-background/50 border border-orange-500/40 px-3 py-2 text-foreground resize-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitResponse}
                    disabled={evaluateTurn.isPending || !responseInput.trim()}
                    className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                  >
                    {evaluateTurn.isPending
                      ? "Scoring…"
                      : turns.length + 1 >= MAX_TURNS
                        ? "Submit Final Response →"
                        : "Submit Response →"}
                  </button>
                </div>
              )}

              {/* Generating scorecard spinner */}
              {phase === "done" && generateScorecard.isPending && (
                <div className="text-center py-4 text-xs text-muted-foreground animate-pulse">
                  Generating your resilience scorecard…
                </div>
              )}

              {/* Final scorecard */}
              {phase === "done" && scorecard && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">
                      Resilience Scorecard
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs ml-auto">
                      <Star size={10} className="mr-0.5" />
                      {scorecard.resilienceScore}/100
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        scorecard.resilienceScore >= 70
                          ? "bg-emerald-500"
                          : scorecard.resilienceScore >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${scorecard.resilienceScore}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      AI Coach Note:{" "}
                    </span>
                    <Streamdown>{scorecard.aiCoachNote}</Streamdown>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    ✓ Scorecard saved to your profile. Avg turn score:{" "}
                    {scorecard.avgTurnScore}/10
                  </p>
                </div>
              )}

              {/* Reset */}
              <button
                onClick={reset}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} />
                Try a different persona or question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
