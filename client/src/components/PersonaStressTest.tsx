/**
 * PersonaStressTest — #8 High-Impact Feature
 *
 * Live 3-turn exchange with an AI interviewer in a chosen persona.
 * Scored on composure, depth, and metrics after all 3 turns.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { Bot, User, Sparkles, RotateCcw, ChevronRight } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";
type Persona = "skeptical_senior" | "fast_paced_pm" | "detail_oriented_l7" | "friendly_peer";

const PERSONAS: { id: Persona; label: string; emoji: string; desc: string }[] = [
  { id: "skeptical_senior", label: "Skeptical Senior", emoji: "🔍", desc: "Pushes back on every claim. Demands specifics. Never satisfied with vague answers." },
  { id: "fast_paced_pm", label: "Fast-Paced PM", emoji: "⚡", desc: "Cares only about user impact and speed. Gets impatient with technical details." },
  { id: "detail_oriented_l7", label: "Detail-Oriented L7", emoji: "🎯", desc: "Digs into every technical decision. Asks about edge cases and alternatives." },
  { id: "friendly_peer", label: "Friendly Peer", emoji: "🤝", desc: "Genuinely curious but always finds the one thing you glossed over." },
];

const SAMPLE_QUESTIONS = [
  "Tell me about a high-impact project you led.",
  "Describe a time you disagreed with your manager on a technical decision.",
  "Tell me about a project that failed and what you learned.",
  "Walk me through a time you had to influence without authority.",
  "Describe a situation where you had to make a decision with incomplete information.",
];

interface Exchange {
  turn: number;
  interviewerQuestion: string;
  candidateAnswer: string;
  coachingNote?: string;
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{score}/5</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function PersonaStressTest() {
  const [persona, setPersona] = useState<Persona>("skeptical_senior");
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [phase, setPhase] = useState<"setup" | "answering" | "followup" | "scoring" | "done">("setup");
  const [initialAnswer, setInitialAnswer] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [currentTurn, setCurrentTurn] = useState(1);

  const followUp = trpc.highImpact.personaFollowUp.useMutation();
  const score = trpc.highImpact.personaScore.useMutation();

  const startSession = async () => {
    if (!initialAnswer.trim() || initialAnswer.length < 30) return;
    setPhase("followup");
    setExchanges([{ turn: 0, interviewerQuestion: question, candidateAnswer: initialAnswer }]);
    // Get first follow-up
    const res = await followUp.mutateAsync({
      persona, question, candidateAnswer: initialAnswer, turnNumber: 1, targetLevel,
    });
    setExchanges(prev => [...prev, { turn: 1, interviewerQuestion: res.followUpQuestion, candidateAnswer: "", coachingNote: res.coachingNote }]);
    setCurrentTurn(1);
    setCurrentAnswer("");
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    const updatedExchanges = exchanges.map(e =>
      e.turn === currentTurn ? { ...e, candidateAnswer: currentAnswer } : e
    );
    setExchanges(updatedExchanges);
    setCurrentAnswer("");

    if (currentTurn >= 3) {
      // Score the session
      setPhase("scoring");
      const allExchanges = updatedExchanges.filter(e => e.turn > 0).map(e => ({
        turn: e.turn,
        interviewerQuestion: e.interviewerQuestion,
        candidateAnswer: e.candidateAnswer,
      }));
      await score.mutateAsync({ persona, question, exchanges: allExchanges, targetLevel });
      setPhase("done");
    } else {
      // Next follow-up
      const nextTurn = currentTurn + 1;
      const lastAnswer = currentAnswer;
      const res = await followUp.mutateAsync({
        persona, question, candidateAnswer: lastAnswer, turnNumber: nextTurn, targetLevel,
      });
      setExchanges(prev => [...prev, { turn: nextTurn, interviewerQuestion: res.followUpQuestion, candidateAnswer: "", coachingNote: res.coachingNote }]);
      setCurrentTurn(nextTurn);
    }
  };

  const reset = () => {
    setPhase("setup");
    setInitialAnswer("");
    setCurrentAnswer("");
    setExchanges([]);
    setCurrentTurn(1);
    followUp.reset();
    score.reset();
  };

  const selectedPersona = PERSONAS.find(p => p.id === persona)!;
  const scoreData = score.data;

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Interviewer Persona Stress Test"
        subtitle="The real Meta interview is 3 turns, not 1. Pick a persona, give your answer, then defend it under pressure. Scored on composure, depth, and metrics."
        stat="Simulates Real Interview"
        variant="violet"
        icon={<Bot size={20} />}
      />

      <ImpactCallout variant="violet">
        Most candidates prepare a great initial answer but collapse on follow-ups. This drill trains the skill that matters most: staying sharp under pressure for 3 consecutive turns.
      </ImpactCallout>

      {phase === "setup" && (
        <HighImpactWrapper variant="violet" className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 block">Choose Persona</label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${persona === p.id ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-gray-200 dark:border-gray-700 hover:border-violet-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{p.emoji}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.label}</span>
                    {persona === p.id && <HighImpactBadge size="sm" variant="violet" label="SELECTED" />}
                  </div>
                  <p className="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 block">Question</label>
            <select
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-violet-400"
            >
              {SAMPLE_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 block">Target Level</label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                <button key={l} onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-violet-500 text-white border-violet-500" : "border-gray-200 dark:border-gray-700 text-gray-700 hover:border-violet-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 block">
              Your Initial Answer
            </label>
            <textarea
              value={initialAnswer}
              onChange={e => setInitialAnswer(e.target.value)}
              placeholder="Give your best STAR answer. The persona will then probe the weakest part..."
              rows={6}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-400 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={startSession}
                disabled={followUp.isPending || initialAnswer.trim().length < 30}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all"
              >
                {followUp.isPending ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Loading...</> : <><Bot size={14} />Start Stress Test</>}
              </button>
            </div>
          </div>
        </HighImpactWrapper>
      )}

      {(phase === "followup" || phase === "scoring" || phase === "done") && (
        <div className="space-y-3">
          {/* Transcript */}
          {exchanges.map((ex, i) => (
            <div key={i} className="space-y-2">
              {/* Interviewer question */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 bg-violet-50 dark:bg-violet-950/30 rounded-xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                      {ex.turn === 0 ? "Question" : `${selectedPersona.emoji} ${selectedPersona.label} — Turn ${ex.turn}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{ex.interviewerQuestion}</p>
                  {ex.coachingNote && (
                    <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-1.5 italic">Coach note: {ex.coachingNote}</p>
                  )}
                </div>
              </div>

              {/* Candidate answer (if given) */}
              {ex.candidateAnswer && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%] ml-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={11} className="text-gray-700" />
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">You</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{ex.candidateAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Current answer input */}
          {phase === "followup" && exchanges[exchanges.length - 1]?.candidateAnswer === "" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <HighImpactWrapper variant="violet" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Your Response — Turn {currentTurn} of 3</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(t => (
                      <div key={t} className={`w-2 h-2 rounded-full ${t <= currentTurn ? "bg-violet-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                    ))}
                  </div>
                </div>
                <textarea
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder="Respond to the follow-up. Add new information — don't just repeat your initial answer..."
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-violet-400 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={submitAnswer}
                    disabled={followUp.isPending || score.isPending || !currentAnswer.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all"
                  >
                    {(followUp.isPending || score.isPending) ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{currentTurn >= 3 ? "Scoring..." : "Loading..."}</> : <><ChevronRight size={14} />{currentTurn >= 3 ? "Finish & Score" : "Submit Answer"}</>}
                  </button>
                </div>
              </HighImpactWrapper>
            </motion.div>
          )}

          {/* Final score */}
          {phase === "done" && scoreData && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <HighImpactWrapper variant="violet" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Sparkles size={15} className="text-violet-500" />
                    Stress Test Results
                  </h4>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${scoreData.overallVerdict === "Pass" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : scoreData.overallVerdict === "Borderline" ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-900" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {scoreData.overallVerdict}
                  </span>
                </div>
                <div className="space-y-3 mb-4">
                  <ScoreBar label="Composure under pressure" score={scoreData.composure} color={scoreData.composure >= 4 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-800 dark:text-amber-900"} />
                  <ScoreBar label="Added new depth each turn" score={scoreData.depth} color={scoreData.depth >= 4 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-800 dark:text-amber-900"} />
                  <ScoreBar label="Quantified impact when pushed" score={scoreData.metrics} color={scoreData.metrics >= 4 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-800 dark:text-amber-900"} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Strength</p>
                    <p className="text-xs text-gray-700 dark:text-gray-200">{scoreData.keyStrength}</p>
                  </div>
                  <div className="rounded-lg bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-3">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Key Gap</p>
                    <p className="text-xs text-gray-700 dark:text-gray-200">{scoreData.keyGap}</p>
                  </div>
                </div>
                <button onClick={reset} className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
                  <RotateCcw size={12} /> Try Again with Different Persona
                </button>
              </HighImpactWrapper>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
