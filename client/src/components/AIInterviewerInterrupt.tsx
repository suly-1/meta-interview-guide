/**
 * AIInterviewerInterrupt — #1 High-Impact Feature
 *
 * Timed system design session where the AI interrupts every 3-5 minutes
 * with a sharp, disruptive question. Candidate must respond, then continue.
 * Scored on recovery, depth, and composure.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { Bot, Clock, Play, Square, Zap, ChevronRight, RotateCcw, AlertTriangle } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";

const SD_PROBLEMS = [
  "Design a URL Shortener (like bit.ly)",
  "Design a News Feed (like Facebook/Instagram)",
  "Design a Distributed Cache (like Memcached)",
  "Design a Rate Limiter",
  "Design a Notification System",
  "Design a Search Autocomplete System",
  "Design a Distributed Message Queue",
  "Design a Video Streaming Service (like YouTube)",
];

const INTERRUPT_TYPE_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  math_check: { label: "Math Check", color: "text-red-600 dark:text-red-400", emoji: "🔢" },
  failure_mode: { label: "Failure Mode", color: "text-orange-600 dark:text-orange-400", emoji: "💥" },
  trade_off: { label: "Trade-off", color: "text-amber-600 dark:text-amber-400", emoji: "⚖️" },
  scale_assumption: { label: "Scale Assumption", color: "text-violet-600 dark:text-violet-400", emoji: "📈" },
  alternative_approach: { label: "Alternative", color: "text-blue-600 dark:text-blue-400", emoji: "🔄" },
};

const TOTAL_TIME = 35 * 60; // 35 minutes
const INTERRUPT_INTERVAL = 4 * 60; // every 4 minutes

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface InterruptEvent {
  minutesMark: number;
  question: string;
  interruptType: string;
  targetArea: string;
  candidateResponse: string;
  score?: { clarity: number; depth: number; recovery: number; verdict: string; oneLineFeedback: string };
}

export default function AIInterviewerInterrupt() {
  const [problem, setProblem] = useState(SD_PROBLEMS[0]);
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [phase, setPhase] = useState<"setup" | "designing" | "responding" | "done">("setup");
  const [designText, setDesignText] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [interrupts, setInterrupts] = useState<InterruptEvent[]>([]);
  const [currentInterrupt, setCurrentInterrupt] = useState<InterruptEvent | null>(null);
  const [interruptResponse, setInterruptResponse] = useState("");
  const [nextInterruptAt, setNextInterruptAt] = useState(INTERRUPT_INTERVAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(TOTAL_TIME);

  const getInterrupt = trpc.highImpact.interruptQuestion.useMutation();
  const scoreResponse = trpc.highImpact.scoreInterruptResponse.useMutation();
  const { saveScore } = useScorePersistence("ai_interrupt_mode");

  const triggerInterrupt = useCallback(async (elapsed: number) => {
    if (designText.trim().length < 50) return;
    const previousInterrupts = interrupts.map(i => i.question);
    const res = await getInterrupt.mutateAsync({
      problemTitle: problem,
      candidateText: designText,
      minutesElapsed: elapsed,
      previousInterrupts,
      targetLevel,
    });
    const newInterrupt: InterruptEvent = {
      minutesMark: elapsed,
      question: res.question,
      interruptType: res.interruptType,
      targetArea: res.targetArea,
      candidateResponse: "",
    };
    setCurrentInterrupt(newInterrupt);
    setInterruptResponse("");
    setPhase("responding");
  }, [designText, interrupts, problem, targetLevel, getInterrupt]);

  useEffect(() => {
    if (phase === "designing") {
      timerRef.current = setInterval(() => {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);

        const elapsed = TOTAL_TIME - timeLeftRef.current;

        if (timeLeftRef.current <= 0) {
          clearInterval(timerRef.current!);
          setPhase("done");
          return;
        }

        // Trigger interrupt at intervals
        if (elapsed > 0 && elapsed % INTERRUPT_INTERVAL === 0 && elapsed <= TOTAL_TIME - 5 * 60) {
          clearInterval(timerRef.current!);
          triggerInterrupt(Math.floor(elapsed / 60));
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, triggerInterrupt]);

  const startSession = () => {
    timeLeftRef.current = TOTAL_TIME;
    setTimeLeft(TOTAL_TIME);
    setDesignText("");
    setInterrupts([]);
    setCurrentInterrupt(null);
    setNextInterruptAt(INTERRUPT_INTERVAL);
    setPhase("designing");
  };

  const submitInterruptResponse = async () => {
    if (!currentInterrupt || !interruptResponse.trim()) return;
    const scored = await scoreResponse.mutateAsync({
      interruptQuestion: currentInterrupt.question,
      candidateResponse: interruptResponse,
      interruptType: currentInterrupt.interruptType,
      targetLevel,
    });
    const completed: InterruptEvent = {
      ...currentInterrupt,
      candidateResponse: interruptResponse,
      score: scored,
    };
    setInterrupts(prev => [...prev, completed]);
    // Persist score to DB
    const avgRaw = Math.round((scored.clarity + scored.depth + scored.recovery) / 3);
    saveScore("response_quality", avgRaw, { verdict: scored.verdict, question: currentInterrupt.question });
    setCurrentInterrupt(null);
    setInterruptResponse("");
    setPhase("designing");
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("done");
  };

  const timeUsed = TOTAL_TIME - timeLeft;
  const timeColor = timeLeft < 5 * 60 ? "text-red-500" : timeLeft < 10 * 60 ? "text-amber-500" : "text-emerald-500";
  const avgScore = interrupts.length > 0 && interrupts.every(i => i.score)
    ? (interrupts.reduce((a, i) => a + ((i.score!.clarity + i.score!.depth + i.score!.recovery) / 3), 0) / interrupts.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="AI Interviewer Interrupt Mode"
        subtitle="Real Meta interviewers interrupt every 3-5 minutes. This is the only tool that simulates that. Design freely — then defend your choices under fire."
        stat="Doesn't Exist Anywhere Else"
        variant="orange"
        icon={<Bot size={20} />}
      />

      <ImpactCallout variant="red">
        The most common system design failure: candidates can't recover from interruptions. They lose their train of thought, panic, or give vague answers. This drill trains exactly that skill.
      </ImpactCallout>

      {phase === "setup" && (
        <HighImpactWrapper variant="orange" className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">System Design Problem</label>
            <select
              value={problem}
              onChange={e => setProblem(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-orange-400"
            >
              {SD_PROBLEMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Target Level</label>
            <div className="flex gap-2">
              {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                <button key={l} onClick={() => setTargetLevel(l)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-3">
            <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-2">What to expect:</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• 35-minute session — design the system in the text area</li>
              <li>• AI interrupts every ~4 minutes with a sharp question</li>
              <li>• You must respond to the interrupt before continuing</li>
              <li>• Each response is scored on clarity, depth, and recovery</li>
              <li>• Types of interrupts: math checks, failure modes, trade-offs, scale assumptions</li>
            </ul>
          </div>
          <button onClick={startSession} className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all">
            <Play size={16} /> Start Interrupt Session
          </button>
        </HighImpactWrapper>
      )}

      {(phase === "designing" || phase === "responding") && (
        <div className="space-y-3">
          {/* Timer bar */}
          <HighImpactWrapper variant="orange" className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Clock size={15} className={timeColor} />
                <span className={`text-lg font-bold font-mono ${timeColor}`}>{fmtTime(timeLeft)}</span>
                <span className="text-xs text-gray-500">remaining · {interrupts.length} interrupt{interrupts.length !== 1 ? "s" : ""} handled</span>
              </div>
              <button onClick={endSession} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-all">
                <Square size={11} /> End Session
              </button>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }} />
            </div>
          </HighImpactWrapper>

          {/* Interrupt alert */}
          <AnimatePresence>
            {phase === "responding" && currentInterrupt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <HighImpactWrapper variant="orange" className="p-4 border-2 border-orange-400 dark:border-orange-600">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">INTERRUPT</span>
                        {INTERRUPT_TYPE_LABELS[currentInterrupt.interruptType] && (
                          <span className={`text-xs font-bold ${INTERRUPT_TYPE_LABELS[currentInterrupt.interruptType].color}`}>
                            {INTERRUPT_TYPE_LABELS[currentInterrupt.interruptType].emoji} {INTERRUPT_TYPE_LABELS[currentInterrupt.interruptType].label}
                          </span>
                        )}
                        <HighImpactBadge size="sm" variant="orange" label={currentInterrupt.targetArea} />
                      </div>
                      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{currentInterrupt.question}</p>
                    </div>
                  </div>
                  <textarea
                    value={interruptResponse}
                    onChange={e => setInterruptResponse(e.target.value)}
                    placeholder="Respond directly and confidently. Add new information — don't just repeat what you wrote. Then you'll continue your design..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-orange-200 dark:border-orange-800/40 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={submitInterruptResponse}
                      disabled={scoreResponse.isPending || !interruptResponse.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      {scoreResponse.isPending ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scoring...</> : <><ChevronRight size={14} />Submit & Continue</>}
                    </button>
                  </div>
                </HighImpactWrapper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Design area */}
          <HighImpactWrapper variant="orange" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Your Design — {problem}
              </label>
              <span className="text-xs text-gray-400">{designText.length} chars</span>
            </div>
            <textarea
              value={designText}
              onChange={e => setDesignText(e.target.value)}
              disabled={phase === "responding"}
              placeholder="Start designing. Think out loud as you write. Cover: requirements, scale estimates, high-level architecture, data model, API design, deep dives..."
              rows={16}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 resize-none disabled:opacity-60"
            />
          </HighImpactWrapper>

          {/* Previous interrupt scores */}
          {interrupts.length > 0 && (
            <HighImpactWrapper variant="orange" className="p-4">
              <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Interrupt History</h4>
              <div className="space-y-2">
                {interrupts.map((ev, i) => (
                  <div key={i} className={`rounded-lg border px-3 py-2 ${ev.score?.verdict === "Strong" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40" : ev.score?.verdict === "Weak" ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                        {INTERRUPT_TYPE_LABELS[ev.interruptType]?.emoji} {ev.question.slice(0, 60)}...
                      </span>
                      <span className={`text-xs font-bold flex-shrink-0 ${ev.score?.verdict === "Strong" ? "text-emerald-600 dark:text-emerald-400" : ev.score?.verdict === "Weak" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {ev.score?.verdict}
                      </span>
                    </div>
                    {ev.score?.oneLineFeedback && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{ev.score.oneLineFeedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </HighImpactWrapper>
          )}
        </div>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <HighImpactWrapper variant="orange" className="p-4">
            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Zap size={15} className="text-orange-500" />
              Session Complete — {problem}
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-3 text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{interrupts.length}</p>
                <p className="text-[10px] text-gray-500">Interrupts Handled</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${avgScore && parseFloat(avgScore) >= 4 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"}`}>
                <p className={`text-2xl font-bold ${avgScore && parseFloat(avgScore) >= 4 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{avgScore ?? "—"}</p>
                <p className="text-[10px] text-gray-500">Avg Response Score</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{fmtTime(timeUsed)}</p>
                <p className="text-[10px] text-gray-500">Time Used</p>
              </div>
            </div>
            {interrupts.length > 0 && (
              <div className="space-y-2 mb-4">
                {interrupts.map((ev, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {INTERRUPT_TYPE_LABELS[ev.interruptType]?.emoji} {ev.targetArea}
                      </span>
                      <div className="flex gap-2 text-[10px] font-bold">
                        <span className="text-blue-600 dark:text-blue-400">C:{ev.score?.clarity}</span>
                        <span className="text-violet-600 dark:text-violet-400">D:{ev.score?.depth}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">R:{ev.score?.recovery}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">{ev.score?.oneLineFeedback}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setPhase("setup")} className="flex items-center gap-2 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors">
              <RotateCcw size={12} /> Try Another Problem
            </button>
          </HighImpactWrapper>
        </motion.div>
      )}
    </div>
  );
}
