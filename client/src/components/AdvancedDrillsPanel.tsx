import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Zap, MessageSquare, Shield, Volume2, Expand, Timer, Users, Target,
  ChevronRight, RotateCcw, CheckCircle2, AlertTriangle, Star, Play, Send
} from "lucide-react";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ScoreBar({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-700 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}/{max}</span>
    </div>
  );
}

function DrillShell({
  title, subtitle, badge, badgeColor = "violet",
  onReset, children
}: {
  title: string; subtitle: string; badge: string; badgeColor?: string;
  onReset: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs border-${badgeColor}-300 text-${badgeColor}-700 bg-${badgeColor}-50`}>
              {badge}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
          <p className="text-sm text-gray-700 mt-0.5">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="flex-shrink-0 text-gray-600 hover:text-gray-600">
          <RotateCcw size={14} className="mr-1" /> Reset
        </Button>
      </div>
      {children}
    </div>
  );
}

// ─── Drill 11: The Interruptor ─────────────────────────────────────────────────

function DrillInterruptor() {
  const [designText, setDesignText] = useState("");
  const [interruptions, setInterruptions] = useState<{ question: string; answer: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentInterruption, setCurrentInterruption] = useState<{ interruption: string; targetedDecision: string } | null>(null);
  const [score, setScore] = useState<any>(null);
  const [phase, setPhase] = useState<"write" | "interrupted" | "scored">("write");

  const fire = trpc.ai.drillInterruptor.useMutation();

  const handleInterrupt = async () => {
    const result = await fire.mutateAsync({ designText, interruptionsSoFar: interruptions.length, previousInterruptions: interruptions, isScoring: false });
    setCurrentInterruption(result);
    setPhase("interrupted");
  };

  const handleAnswer = async () => {
    if (!currentInterruption) return;
    const newInterruptions = [...interruptions, { question: currentInterruption.interruption, answer: currentAnswer }];
    setInterruptions(newInterruptions);
    setCurrentAnswer("");
    if (newInterruptions.length >= 3) {
      const s = await fire.mutateAsync({ designText, interruptionsSoFar: newInterruptions.length, previousInterruptions: newInterruptions, isScoring: true });
      setScore(s);
      setPhase("scored");
    } else {
      setCurrentInterruption(null);
      setPhase("write");
    }
  };

  const reset = () => { setDesignText(""); setInterruptions([]); setCurrentAnswer(""); setCurrentInterruption(null); setScore(null); setPhase("write"); };

  return (
    <DrillShell title="The Interruptor" subtitle="Explain your system design. AI cuts in 3 times. Score: recovery + thread maintenance." badge="System Design" badgeColor="blue" onReset={reset}>
      {phase === "write" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <strong>Instructions:</strong> Start explaining your system design below (e.g., "Design a notification system"). Write 3-5 sentences, then click <strong>Fire Interruption</strong>. You'll be interrupted 3 times total.
          </div>
          <Textarea
            value={designText}
            onChange={e => setDesignText(e.target.value)}
            placeholder="Start explaining your design... (e.g., 'I'd start by identifying the key requirements. For a notification system at Meta scale, we're looking at roughly 3 billion users, so we need a horizontally scalable fan-out service...')"
            className="min-h-[140px] text-sm"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleInterrupt} disabled={designText.length < 50 || fire.isPending} size="sm" className="bg-blue-600 hover:bg-blue-700">
              {fire.isPending ? "Interrupting..." : <><Zap size={13} className="mr-1.5" /> Fire Interruption ({interruptions.length}/3)</>}
            </Button>
            {interruptions.length > 0 && (
              <span className="text-xs text-gray-600">{interruptions.length} interruption{interruptions.length > 1 ? "s" : ""} answered</span>
            )}
          </div>
        </div>
      )}

      {phase === "interrupted" && currentInterruption && (
        <div className="space-y-3">
          <div className="bg-red-100 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Interruption {interruptions.length + 1}/3</span>
            </div>
            <p className="text-sm font-semibold text-red-800">"{currentInterruption.interruption}"</p>
            <p className="text-xs text-red-500 mt-1">Targeting: {currentInterruption.targetedDecision}</p>
          </div>
          <Textarea
            value={currentAnswer}
            onChange={e => setCurrentAnswer(e.target.value)}
            placeholder="Answer the interruption, then resume your design thread..."
            className="min-h-[100px] text-sm"
          />
          <Button onClick={handleAnswer} disabled={currentAnswer.length < 20 || fire.isPending} size="sm">
            {fire.isPending ? "Processing..." : <><Send size={13} className="mr-1.5" /> Submit Answer & Continue</>}
          </Button>
        </div>
      )}

      {phase === "scored" && score && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="text-3xl font-black text-blue-700">{score.overallScore}<span className="text-lg font-normal text-blue-400">/10</span></div>
            <div>
              <p className="text-sm font-bold text-blue-900">Interruptor Score</p>
              <p className="text-xs text-blue-600">{score.topStrength}</p>
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Recovery Quality" score={score.recoveryScore} />
            <ScoreBar label="Technical Soundness" score={score.technicalScore} />
            <ScoreBar label="Thread Maintenance" score={score.threadScore} />
          </div>
          <div className="bg-amber-100 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-bold text-amber-900 mb-1">Top Weakness</p>
            <p className="text-xs text-amber-800">{score.topWeakness}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-700 mb-1">Coaching Note</p>
            <p className="text-xs text-gray-600 leading-relaxed">{score.coachingNote}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 12: Clarification Interrogator ──────────────────────────────────────

function DrillClarificationInterrogator() {
  const [phase, setPhase] = useState<"start" | "clarify" | "design" | "scored">("start");
  const [prompt, setPrompt] = useState("");
  const [hiddenConstraints, setHiddenConstraints] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [allQuestions, setAllQuestions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<string[]>([]);
  const [lastAnswer, setLastAnswer] = useState("");
  const [design, setDesign] = useState("");
  const [score, setScore] = useState<any>(null);

  const mut = trpc.ai.drillClarificationInterrogator.useMutation();

  const handleStart = async () => {
    const r = await mut.mutateAsync({ phase: "get_prompt" });
    setPrompt(r.prompt);
    setHiddenConstraints(r.hiddenConstraints);
    setPhase("clarify");
  };

  const handleAskQuestion = async () => {
    const r = await mut.mutateAsync({ phase: "answer_question", prompt, question, questionsAsked });
    setAllQuestions(prev => [...prev, question]);
    setAllAnswers(prev => [...prev, r.answer]);
    setLastAnswer(r.answer);
    setQuestionsAsked(questionsAsked + 1);
    setQuestion("");
    if (r.questionsLeft === 0) setPhase("design");
  };

  const handleScore = async () => {
    const r = await mut.mutateAsync({ phase: "score_design", prompt, allQuestions, allAnswers, candidateDesign: design });
    setScore(r);
    setPhase("scored");
  };

  const reset = () => { setPhase("start"); setPrompt(""); setQuestion(""); setQuestionsAsked(0); setAllQuestions([]); setAllAnswers([]); setLastAnswer(""); setDesign(""); setScore(null); };

  return (
    <DrillShell title="Clarification Interrogator" subtitle="Underspecified prompt. 3 clarifying questions. Then design. AI reveals your wrong assumptions." badge="System Design" badgeColor="indigo" onReset={reset}>
      {phase === "start" && (
        <Button onClick={handleStart} disabled={mut.isPending} className="bg-indigo-600 hover:bg-indigo-700">
          {mut.isPending ? "Generating prompt..." : <><Play size={13} className="mr-1.5" /> Get Underspecified Prompt</>}
        </Button>
      )}

      {(phase === "clarify" || phase === "design") && (
        <div className="space-y-3">
          <div className="bg-gray-900 text-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Prompt</p>
            <p className="text-sm font-semibold">{prompt}</p>
          </div>

          {allQuestions.length > 0 && (
            <div className="space-y-2">
              {allQuestions.map((q, i) => (
                <div key={i} className="text-xs space-y-1">
                  <p className="text-blue-700 font-medium">Q{i + 1}: {q}</p>
                  <p className="text-gray-600 pl-3 border-l-2 border-gray-200">{allAnswers[i]}</p>
                </div>
              ))}
            </div>
          )}

          {phase === "clarify" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-700">{3 - questionsAsked} question{3 - questionsAsked !== 1 ? "s" : ""} remaining</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && question.length > 5 && !mut.isPending && handleAskQuestion()}
                  placeholder="Ask a clarifying question..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <Button onClick={handleAskQuestion} disabled={question.length < 5 || mut.isPending} size="sm">
                  {mut.isPending ? "..." : "Ask"}
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPhase("design")} className="text-xs">
                Skip remaining questions → Design now
              </Button>
            </div>
          )}

          {phase === "design" && (
            <div className="space-y-2">
              <p className="text-xs text-amber-800 font-medium">Questions used up. Now design the system:</p>
              <Textarea value={design} onChange={e => setDesign(e.target.value)} placeholder="Write your design..." className="min-h-[120px] text-sm" />
              <Button onClick={handleScore} disabled={design.length < 50 || mut.isPending} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                {mut.isPending ? "Scoring..." : "Reveal Assumptions & Score"}
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "scored" && score && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="text-3xl font-black text-indigo-700">{score.overallScore}<span className="text-lg font-normal text-indigo-400">/10</span></div>
            <div>
              <p className="text-sm font-bold text-indigo-900">Clarification Score</p>
              <p className="text-xs text-indigo-600">Ambiguity handling: {score.ambiguityScore}/5</p>
            </div>
          </div>
          {score.wrongAssumptions?.length > 0 && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 mb-1">Wrong Assumptions ({score.wrongAssumptions.length})</p>
              {score.wrongAssumptions.map((a: string, i: number) => (
                <p key={i} className="text-xs text-red-600 flex items-start gap-1"><AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />{a}</p>
              ))}
            </div>
          )}
          {score.correctAssumptions?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs font-bold text-emerald-700 mb-1">Correct Assumptions</p>
              {score.correctAssumptions.map((a: string, i: number) => (
                <p key={i} className="text-xs text-emerald-600 flex items-start gap-1"><CheckCircle2 size={10} className="mt-0.5 flex-shrink-0" />{a}</p>
              ))}
            </div>
          )}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-700 mb-1">Key Lesson</p>
            <p className="text-xs text-gray-600 leading-relaxed">{score.keyLesson}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 13: Devil's Advocate ────────────────────────────────────────────────

function DrillDevilsAdvocate() {
  const [decision, setDecision] = useState("");
  const [defenses, setDefenses] = useState<{ challenge: string; response: string }[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<{ challenge: string; challengeAngle: string } | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");
  const [score, setScore] = useState<any>(null);
  const [phase, setPhase] = useState<"input" | "defending" | "scored">("input");

  const mut = trpc.ai.drillDevilsAdvocate.useMutation();

  const handleChallenge = async () => {
    const r = await mut.mutateAsync({ decision, defenses, isScoring: false });
    setCurrentChallenge(r);
    setPhase("defending");
  };

  const handleDefend = async () => {
    if (!currentChallenge) return;
    const newDefenses = [...defenses, { challenge: currentChallenge.challenge, response: currentResponse }];
    setDefenses(newDefenses);
    setCurrentResponse("");
    if (newDefenses.length >= 3) {
      const s = await mut.mutateAsync({ decision, defenses: newDefenses, isScoring: true });
      setScore(s);
      setPhase("scored");
    } else {
      const r = await mut.mutateAsync({ decision, defenses: newDefenses, isScoring: false });
      setCurrentChallenge(r);
    }
  };

  const reset = () => { setDecision(""); setDefenses([]); setCurrentChallenge(null); setCurrentResponse(""); setScore(null); setPhase("input"); };

  return (
    <DrillShell title="Devil's Advocate Interviewer" subtitle="State a design decision. AI takes the opposite position every time. Defend 3 times." badge="System Design" badgeColor="red" onReset={reset}>
      {phase === "input" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-700 bg-red-100 border border-red-200 rounded-lg p-3">
            <strong>Instructions:</strong> State ONE specific design decision (e.g., "I'd use PostgreSQL over DynamoDB for this use case because..."). The AI will immediately take the opposite position.
          </div>
          <Textarea value={decision} onChange={e => setDecision(e.target.value)} placeholder="State your design decision and reasoning..." className="min-h-[100px] text-sm" />
          <Button onClick={handleChallenge} disabled={decision.length < 30 || mut.isPending} size="sm" className="bg-red-600 hover:bg-red-700">
            {mut.isPending ? "Generating challenge..." : <><Shield size={13} className="mr-1.5" /> Start Devil's Advocate</>}
          </Button>
        </div>
      )}

      {phase === "defending" && currentChallenge && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
            <span className="font-bold text-gray-600">Your decision:</span> <span className="text-gray-700">{decision}</span>
          </div>
          {defenses.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {defenses.map((d, i) => (
                <div key={i} className="text-xs space-y-1">
                  <p className="text-red-700 font-medium">Challenge {i + 1}: {d.challenge}</p>
                  <p className="text-gray-600 pl-3 border-l-2 border-gray-200">Your defense: {d.response}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-red-100 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Challenge {defenses.length + 1}/3 — {currentChallenge.challengeAngle}</span>
            </div>
            <p className="text-sm font-semibold text-red-800">"{currentChallenge.challenge}"</p>
          </div>
          <Textarea value={currentResponse} onChange={e => setCurrentResponse(e.target.value)} placeholder="Defend your position (or pivot gracefully if the challenge is valid)..." className="min-h-[90px] text-sm" />
          <Button onClick={handleDefend} disabled={currentResponse.length < 20 || mut.isPending} size="sm">
            {mut.isPending ? "Processing..." : <><Send size={13} className="mr-1.5" /> Submit Defense</>}
          </Button>
        </div>
      )}

      {phase === "scored" && score && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-100 border border-red-200 rounded-xl">
            <div className="text-3xl font-black text-red-700">{score.overallScore}<span className="text-lg font-normal text-red-400">/10</span></div>
            <div>
              <p className="text-sm font-bold text-red-900">Devil's Advocate Score</p>
              <Badge variant="outline" className="text-xs mt-1">{score.verdict?.replace(/_/g, " ")}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Holding Correct Positions" score={score.holdingScore} />
            <ScoreBar label="Graceful Pivots" score={score.pivotScore} />
            <ScoreBar label="Technical Depth" score={score.depthScore} />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 leading-relaxed">{score.feedback}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 14: The Silent Skeptic ──────────────────────────────────────────────

function DrillSilentSkeptic() {
  const [starAnswer, setStarAnswer] = useState("");
  const [exchanges, setExchanges] = useState<{ candidateResponse: string; aiReaction: string }[]>([]);
  const [currentElaboration, setCurrentElaboration] = useState("");
  const [reveal, setReveal] = useState<any>(null);
  const [phase, setPhase] = useState<"write" | "reacting" | "revealed">("write");

  const mut = trpc.ai.drillSilentSkeptic.useMutation();

  const handleSubmit = async () => {
    const r = await mut.mutateAsync({ starAnswer, exchanges, isRevealing: false });
    setExchanges(prev => [...prev, { candidateResponse: starAnswer, aiReaction: r.reaction }]);
    setPhase("reacting");
  };

  const handleElaborate = async () => {
    if (exchanges.length >= 3) {
      const r = await mut.mutateAsync({ starAnswer, exchanges, isRevealing: true });
      setReveal(r);
      setPhase("revealed");
    } else {
      const r = await mut.mutateAsync({ starAnswer, exchanges: [...exchanges, { candidateResponse: currentElaboration, aiReaction: "" }], isRevealing: false });
      setExchanges(prev => [...prev, { candidateResponse: currentElaboration, aiReaction: r.reaction }]);
      setCurrentElaboration("");
    }
  };

  const handleReveal = async () => {
    const r = await mut.mutateAsync({ starAnswer, exchanges, isRevealing: true });
    setReveal(r);
    setPhase("revealed");
  };

  const reset = () => { setStarAnswer(""); setExchanges([]); setCurrentElaboration(""); setReveal(null); setPhase("write"); };

  const reactionColor = (r: string) => r === "Hmm." ? "text-amber-800" : "text-gray-700";

  return (
    <DrillShell title="The Silent Skeptic" subtitle="Give a STAR answer. AI responds with 'Hmm.' After 3 exchanges, it reveals what it was looking for." badge="Behavioral" badgeColor="amber" onReset={reset}>
      {phase === "write" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-700 bg-amber-100 border border-amber-200 rounded-lg p-3">
            <strong>Instructions:</strong> Give a complete STAR answer to any behavioral question (e.g., "Tell me about a time you influenced without authority"). The AI will respond with minimal reactions. Your job: read the silence correctly.
          </div>
          <Textarea value={starAnswer} onChange={e => setStarAnswer(e.target.value)} placeholder="Give your STAR answer..." className="min-h-[160px] text-sm" />
          <Button onClick={handleSubmit} disabled={starAnswer.length < 100 || mut.isPending} size="sm" className="bg-amber-600 hover:bg-amber-700">
            {mut.isPending ? "Reacting..." : <><Volume2 size={13} className="mr-1.5" /> Submit Answer</>}
          </Button>
        </div>
      )}

      {phase === "reacting" && (
        <div className="space-y-3">
          <div className="space-y-2">
            {exchanges.map((ex, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-gray-700 italic pl-3 border-l-2 border-gray-200 line-clamp-2">{ex.candidateResponse}</p>
                <p className={`text-sm font-bold ${reactionColor(ex.aiReaction)}`}>Interviewer: "{ex.aiReaction}"</p>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
            How do you respond to the silence? Elaborate, add detail, or stay quiet?
          </div>
          <Textarea value={currentElaboration} onChange={e => setCurrentElaboration(e.target.value)} placeholder="Add elaboration, or type 'I'll leave it there.' to stop..." className="min-h-[80px] text-sm" />
          <div className="flex gap-2">
            <Button onClick={handleElaborate} disabled={currentElaboration.length < 5 || mut.isPending} size="sm">
              {mut.isPending ? "..." : "Respond"}
            </Button>
            <Button variant="outline" onClick={handleReveal} disabled={mut.isPending} size="sm">
              Reveal Assessment
            </Button>
          </div>
        </div>
      )}

      {phase === "revealed" && reveal && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-amber-100 border border-amber-200 rounded-xl">
            <div className="text-3xl font-black text-amber-900">{reveal.overallScore}<span className="text-lg font-normal text-amber-900">/10</span></div>
            <div>
              <p className="text-sm font-bold text-amber-900">Silent Skeptic Score</p>
              <Badge variant="outline" className="text-xs mt-1">{reveal.elaborationInstinct?.replace(/_/g, " ")}</Badge>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-700 mb-1">What I Was Looking For</p>
            <p className="text-xs text-blue-600 leading-relaxed">{reveal.whatYouWanted}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs font-bold text-emerald-700 mb-1">Strongest Part</p>
              <p className="text-xs text-emerald-600">{reveal.strongestPart}</p>
            </div>
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 mb-1">Weakest Part</p>
              <p className="text-xs text-red-600">{reveal.weakestPart}</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-700 mb-1">Key Lesson</p>
            <p className="text-xs text-gray-600 leading-relaxed">{reveal.keyLesson}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 15: Scope Creep Challenger ─────────────────────────────────────────

function DrillScopeCreep() {
  const [design, setDesign] = useState("");
  const [scopeChallenge, setScopeChallenge] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [score, setScore] = useState<any>(null);
  const [phase, setPhase] = useState<"design" | "challenged" | "scored">("design");
  const [timeLeft, setTimeLeft] = useState(90);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mut = trpc.ai.drillScopeCreep.useMutation();

  const handleChallenge = async () => {
    const r = await mut.mutateAsync({ originalDesign: design, isScoring: false });
    setScopeChallenge(r);
    setPhase("challenged");
    setTimeLeft(90);
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; }), 1000);
  };

  const handleScore = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const r = await mut.mutateAsync({ originalDesign: design, candidateResponse: response, isScoring: true });
    setScore(r);
    setPhase("scored");
  };

  const reset = () => { if (timerRef.current) clearInterval(timerRef.current); setDesign(""); setScopeChallenge(null); setResponse(""); setScore(null); setPhase("design"); setTimeLeft(90); };

  return (
    <DrillShell title="Scope Creep Challenger" subtitle="Design for 5 minutes. Mid-design, AI adds 3 new requirements. You have 90s to respond." badge="System Design" badgeColor="orange" onReset={reset}>
      {phase === "design" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-700 bg-orange-100 border border-orange-200 rounded-lg p-3">
            <strong>Instructions:</strong> Start designing a system (write 4-6 sentences). Then click <strong>Inject Scope Creep</strong> — the AI will add 3 new requirements mid-design. You have 90 seconds to respond.
          </div>
          <Textarea value={design} onChange={e => setDesign(e.target.value)} placeholder="Start your system design..." className="min-h-[140px] text-sm" />
          <Button onClick={handleChallenge} disabled={design.length < 80 || mut.isPending} size="sm" className="bg-orange-600 hover:bg-orange-700">
            {mut.isPending ? "Injecting scope..." : <><Expand size={13} className="mr-1.5" /> Inject Scope Creep</>}
          </Button>
        </div>
      )}

      {phase === "challenged" && scopeChallenge && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-700">Your original design (summarized)</span>
            <div className={`flex items-center gap-1 text-xs font-bold ${timeLeft <= 20 ? "text-red-600" : "text-amber-800"}`}>
              <Timer size={12} /> {timeLeft}s
            </div>
          </div>
          <div className="bg-orange-100 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Expand size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wide">Scope Expansion</span>
            </div>
            <p className="text-sm font-semibold text-orange-800 mb-2">{scopeChallenge.scopeAddition}</p>
            <div className="space-y-1">
              {scopeChallenge.requirements?.map((r: string, i: number) => (
                <p key={i} className="text-xs text-orange-900 flex items-start gap-1"><ChevronRight size={10} className="mt-0.5 flex-shrink-0" />{r}</p>
              ))}
            </div>
          </div>
          <Textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="How do you respond? Push back, re-estimate, re-prioritize..." className="min-h-[100px] text-sm" />
          <Button onClick={handleScore} disabled={response.length < 30 || mut.isPending} size="sm">
            {mut.isPending ? "Scoring..." : "Submit Response & Score"}
          </Button>
        </div>
      )}

      {phase === "scored" && score && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-orange-100 border border-orange-200 rounded-xl">
            <div className="text-3xl font-black text-orange-900">{score.overallScore}<span className="text-lg font-normal text-orange-900">/10</span></div>
            <div><p className="text-sm font-bold text-orange-900">Scope Creep Score</p></div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Pushback Quality" score={score.pushbackScore} />
            <ScoreBar label="Complexity Re-estimation" score={score.reestimationScore} />
            <ScoreBar label="Re-prioritization" score={score.reprioritizationScore} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-700 mb-1">Model Response</p>
            <p className="text-xs text-blue-600 leading-relaxed">{score.modelResponse}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 leading-relaxed">{score.feedback}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 16: Time Pressure Mock ─────────────────────────────────────────────

function DrillTimePressure() {
  const [problem, setProblem] = useState<any>(null);
  const [code, setCode] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [allStatusUpdates, setAllStatusUpdates] = useState<{ minute: number; update: string }[]>([]);
  const [statusScores, setStatusScores] = useState<any[]>([]);
  const [finalScore, setFinalScore] = useState<any>(null);
  const [phase, setPhase] = useState<"start" | "coding" | "status10" | "status18" | "done">("start");
  const [timeLeft, setTimeLeft] = useState(1200); // 20 min
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mut = trpc.ai.drillTimePressure.useMutation();

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        if (t === 601) setPhase("status10"); // 10 min mark
        if (t === 121) setPhase("status18"); // 18 min mark
        return t - 1;
      });
    }, 1000);
  };

  const handleStart = async () => {
    const r = await mut.mutateAsync({ phase: "get_problem" });
    setProblem(r);
    setPhase("coding");
    startTimer();
  };

  const handleStatusUpdate = async (minute: number) => {
    const r = await mut.mutateAsync({ phase: minute === 10 ? "status_update_10" : "status_update_18", code, statusUpdate, problem: problem?.problem });
    setAllStatusUpdates(prev => [...prev, { minute, update: statusUpdate }]);
    setStatusScores(prev => [...prev, { minute, ...r }]);
    setStatusUpdate("");
    setPhase("coding");
  };

  const handleFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const r = await mut.mutateAsync({ phase: "final_score", code, problem: problem?.problem, allStatusUpdates });
    setFinalScore(r);
    setPhase("done");
  };

  const reset = () => { if (timerRef.current) clearInterval(timerRef.current); setProblem(null); setCode(""); setStatusUpdate(""); setAllStatusUpdates([]); setStatusScores([]); setFinalScore(null); setPhase("start"); setTimeLeft(1200); };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <DrillShell title="Time Pressure Mock" subtitle="20-minute coding problem. AI interrupts at 10 min and 18 min for a status update." badge="Coding" badgeColor="green" onReset={reset}>
      {phase === "start" && (
        <Button onClick={handleStart} disabled={mut.isPending} className="bg-green-600 hover:bg-green-700">
          {mut.isPending ? "Generating problem..." : <><Timer size={13} className="mr-1.5" /> Start 20-Minute Mock</>}
        </Button>
      )}

      {(phase === "coding" || phase === "status10" || phase === "status18") && problem && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">{problem.title}</span>
            <div className={`flex items-center gap-1 text-sm font-black ${timeLeft <= 120 ? "text-red-600" : timeLeft <= 300 ? "text-amber-800" : "text-green-600"}`}>
              <Timer size={14} /> {formatTime(timeLeft)}
            </div>
          </div>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs font-mono leading-relaxed">
            <p className="text-gray-700 mb-2">{problem.problem}</p>
            {problem.examples?.slice(0, 1).map((ex: any, i: number) => (
              <div key={i} className="text-gray-600">
                <span className="text-green-400">Input:</span> {ex.input} → <span className="text-blue-400">Output:</span> {ex.output}
              </div>
            ))}
          </div>

          {(phase === "status10" || phase === "status18") && (
            <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={14} className="text-amber-800" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  {phase === "status10" ? "10-Minute Check-In" : "2 Minutes Left — Final Status"}
                </span>
              </div>
              <p className="text-xs text-amber-800 mb-2">Give a quick status update: where are you, what's left, will you finish?</p>
              <Textarea value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} placeholder="Status update..." className="min-h-[70px] text-sm mb-2" />
              <Button onClick={() => handleStatusUpdate(phase === "status10" ? 10 : 18)} disabled={statusUpdate.length < 10 || mut.isPending} size="sm" className="bg-amber-600 hover:bg-amber-700">
                {mut.isPending ? "Scoring..." : "Submit Status Update"}
              </Button>
            </div>
          )}

          {phase === "coding" && (
            <>
              <Textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Write your solution here..." className="min-h-[180px] text-sm font-mono" />
              <Button onClick={handleFinish} disabled={code.length < 20 || mut.isPending} size="sm" className="bg-green-600 hover:bg-green-700">
                {mut.isPending ? "Scoring..." : "Submit Final Solution"}
              </Button>
            </>
          )}
        </div>
      )}

      {phase === "done" && finalScore && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="text-3xl font-black text-green-700">{finalScore.overallScore}<span className="text-lg font-normal text-green-400">/10</span></div>
            <div>
              <p className="text-sm font-bold text-green-900">Time Pressure Score</p>
              <Badge variant="outline" className="text-xs mt-1">{finalScore.verdict}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Code Quality" score={finalScore.codeScore} />
            <ScoreBar label="Time Management" score={finalScore.timeScore} />
            <ScoreBar label="Communication" score={finalScore.communicationScore} />
          </div>
          {statusScores.map((s, i) => (
            <div key={i} className="bg-amber-100 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-900 mb-1">{s.minute}-Minute Status Score</p>
              <p className="text-xs text-amber-800">{s.coachingNote}</p>
            </div>
          ))}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 leading-relaxed">{finalScore.feedback}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 17: XFN Conflict Simulator ─────────────────────────────────────────

function DrillXFNConflict() {
  const [scenario, setScenario] = useState<any>(null);
  const [exchanges, setExchanges] = useState<{ pmMessage: string; candidateResponse: string }[]>([]);
  const [myResponse, setMyResponse] = useState("");
  const [score, setScore] = useState<any>(null);
  const [phase, setPhase] = useState<"start" | "roleplay" | "scored">("start");
  const [lastPMMessage, setLastPMMessage] = useState("");

  const mut = trpc.ai.drillXFNConflict.useMutation();

  const handleStart = async () => {
    const r = await mut.mutateAsync({ exchanges: [], isStarting: true });
    setScenario(r);
    setLastPMMessage(r.pmOpeningMessage);
    setPhase("roleplay");
  };

  const handleRespond = async () => {
    const newExchanges = [...exchanges, { pmMessage: lastPMMessage, candidateResponse: myResponse }];
    setExchanges(newExchanges);
    setMyResponse("");
    if (newExchanges.length >= 5) {
      const s = await mut.mutateAsync({ scenario: scenario?.scenario, exchanges: newExchanges, isScoring: true });
      setScore(s);
      setPhase("scored");
    } else {
      const r = await mut.mutateAsync({ scenario: scenario?.scenario, exchanges: newExchanges });
      setLastPMMessage(r.pmResponse);
      if (r.isResolved) {
        const s = await mut.mutateAsync({ scenario: scenario?.scenario, exchanges: newExchanges, isScoring: true });
        setScore(s);
        setPhase("scored");
      }
    }
  };

  const reset = () => { setScenario(null); setExchanges([]); setMyResponse(""); setScore(null); setPhase("start"); setLastPMMessage(""); };

  return (
    <DrillShell title="XFN Conflict Simulator" subtitle="AI plays a PM who disagrees with your tech recommendation. 5-exchange roleplay." badge="Behavioral" badgeColor="purple" onReset={reset}>
      {phase === "start" && (
        <Button onClick={handleStart} disabled={mut.isPending} className="bg-purple-600 hover:bg-purple-700">
          {mut.isPending ? "Setting up scenario..." : <><Users size={13} className="mr-1.5" /> Start XFN Conflict</>}
        </Button>
      )}

      {phase === "roleplay" && scenario && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs font-bold text-purple-700 mb-1">Scenario</p>
            <p className="text-xs text-purple-600">{scenario.scenario}</p>
            <p className="text-xs text-purple-500 mt-1">Your tech recommendation: <strong>{scenario.techRecommendation}</strong></p>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {exchanges.map((ex, i) => (
              <div key={i} className="space-y-1">
                <div className="bg-purple-50 rounded-lg p-2 text-xs"><span className="font-bold text-purple-700">PM:</span> {ex.pmMessage}</div>
                <div className="bg-gray-50 rounded-lg p-2 text-xs ml-4"><span className="font-bold text-gray-700">You:</span> {ex.candidateResponse}</div>
              </div>
            ))}
            <div className="bg-purple-50 rounded-lg p-2 text-xs">
              <span className="font-bold text-purple-700">PM:</span> {lastPMMessage}
            </div>
          </div>
          <Textarea value={myResponse} onChange={e => setMyResponse(e.target.value)} placeholder="Your response to the PM..." className="min-h-[90px] text-sm" />
          <div className="flex items-center gap-2">
            <Button onClick={handleRespond} disabled={myResponse.length < 20 || mut.isPending} size="sm" className="bg-purple-600 hover:bg-purple-700">
              {mut.isPending ? "PM is responding..." : <><Send size={13} className="mr-1.5" /> Respond ({exchanges.length}/5)</>}
            </Button>
            {exchanges.length >= 3 && (
              <Button variant="outline" size="sm" onClick={async () => { const s = await mut.mutateAsync({ scenario: scenario?.scenario, exchanges, isScoring: true }); setScore(s); setPhase("scored"); }}>
                End & Score
              </Button>
            )}
          </div>
        </div>
      )}

      {phase === "scored" && score && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="text-3xl font-black text-purple-700">{score.overallScore}<span className="text-lg font-normal text-purple-400">/10</span></div>
            <div>
              <p className="text-sm font-bold text-purple-900">XFN Conflict Score</p>
              <Badge variant="outline" className="text-xs mt-1">{score.verdict}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Technical Ground" score={score.technicalGroundScore} />
            <ScoreBar label="Alternative Proposals" score={score.alternativeScore} />
            <ScoreBar label="Alignment Quality" score={score.alignmentScore} />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-bold text-gray-700 mb-1">Key Lesson</p>
            <p className="text-xs text-gray-600 leading-relaxed">{score.keyLesson}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Drill 18: The Gotcha Follow-Up ───────────────────────────────────────────

function DrillGotchaFollowUp() {
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<"system_design" | "coding" | "behavioral">("behavioral");
  const [gotcha, setGotcha] = useState<any>(null);
  const [gotchaResponse, setGotchaResponse] = useState("");
  const [score, setScore] = useState<any>(null);
  const [phase, setPhase] = useState<"input" | "gotcha" | "scored">("input");

  const mut = trpc.ai.drillGotchaFollowUp.useMutation();

  const handleGenerate = async () => {
    const r = await mut.mutateAsync({ originalAnswer: answer, category });
    setGotcha(r);
    setPhase("gotcha");
  };

  const handleScore = async () => {
    const r = await mut.mutateAsync({ originalAnswer: answer, category, gotchaResponse, gotchaQuestion: gotcha.gotchaQuestion });
    setScore(r);
    setPhase("scored");
  };

  const reset = () => { setAnswer(""); setGotcha(null); setGotchaResponse(""); setScore(null); setPhase("input"); };

  return (
    <DrillShell title="The Gotcha Follow-Up" subtitle="Give any answer. AI finds your weakest assumption and fires a targeted gotcha." badge="All Rounds" badgeColor="rose" onReset={reset}>
      {phase === "input" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["system_design", "coding", "behavioral"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${category === c ? "bg-rose-600 text-white border-rose-600" : "text-gray-700 border-gray-200 hover:border-rose-300"}`}
              >
                {c.replace("_", " ")}
              </button>
            ))}
          </div>
          <Textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Give any answer — system design decision, coding approach, or STAR story..." className="min-h-[140px] text-sm" />
          <Button onClick={handleGenerate} disabled={answer.length < 50 || mut.isPending} size="sm" className="bg-rose-600 hover:bg-rose-700">
            {mut.isPending ? "Finding weakness..." : <><Target size={13} className="mr-1.5" /> Fire Gotcha</>}
          </Button>
        </div>
      )}

      {phase === "gotcha" && gotcha && (
        <div className="space-y-3">
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-rose-500" />
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Gotcha — Weak Assumption Exposed</span>
            </div>
            <p className="text-sm font-semibold text-rose-800">"{gotcha.gotchaQuestion}"</p>
            <p className="text-xs text-rose-400 mt-1">Targeting: {gotcha.weakAssumption}</p>
          </div>
          <Textarea value={gotchaResponse} onChange={e => setGotchaResponse(e.target.value)} placeholder="Answer the gotcha..." className="min-h-[100px] text-sm" />
          <Button onClick={handleScore} disabled={gotchaResponse.length < 30 || mut.isPending} size="sm" className="bg-rose-600 hover:bg-rose-700">
            {mut.isPending ? "Scoring..." : "Submit & Score"}
          </Button>
        </div>
      )}

      {phase === "scored" && score && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="text-3xl font-black text-rose-700">{score.overallScore}<span className="text-lg font-normal text-rose-400">/10</span></div>
            <div>
              <p className="text-sm font-bold text-rose-900">Gotcha Score</p>
              <Badge variant="outline" className={`text-xs mt-1 ${score.comparison === "stronger" ? "border-emerald-300 text-emerald-700" : score.comparison === "weaker" ? "border-red-300 text-red-700" : ""}`}>
                Follow-up was {score.comparison} than original
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Follow-Up Quality" score={score.followUpScore} />
            <ScoreBar label="Improvement vs Original" score={score.improvementScore} />
            <ScoreBar label="Pre-emption Awareness" score={score.preemptionScore} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-700 mb-1">Ideal Response</p>
            <p className="text-xs text-blue-600 leading-relaxed">{score.idealResponse}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 leading-relaxed">{score.feedback}</p>
          </div>
        </div>
      )}
    </DrillShell>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

const DRILLS = [
  { id: "interruptor",     label: "Interruptor",       icon: <Zap size={14} />,         badge: "SD",  component: <DrillInterruptor /> },
  { id: "clarification",   label: "Clarification",     icon: <MessageSquare size={14} />, badge: "SD",  component: <DrillClarificationInterrogator /> },
  { id: "devils",          label: "Devil's Advocate",  icon: <Shield size={14} />,       badge: "SD",  component: <DrillDevilsAdvocate /> },
  { id: "silent",          label: "Silent Skeptic",    icon: <Volume2 size={14} />,      badge: "BEH", component: <DrillSilentSkeptic /> },
  { id: "scopecreep",      label: "Scope Creep",       icon: <Expand size={14} />,       badge: "SD",  component: <DrillScopeCreep /> },
  { id: "timepressure",    label: "Time Pressure",     icon: <Timer size={14} />,        badge: "CODE",component: <DrillTimePressure /> },
  { id: "xfn",             label: "XFN Conflict",      icon: <Users size={14} />,        badge: "BEH", component: <DrillXFNConflict /> },
  { id: "gotcha",          label: "Gotcha Follow-Up",  icon: <Target size={14} />,       badge: "ALL", component: <DrillGotchaFollowUp /> },
];

const BADGE_COLORS: Record<string, string> = {
  SD: "bg-blue-100 text-blue-700",
  BEH: "bg-amber-100 text-amber-900",
  CODE: "bg-green-100 text-green-700",
  ALL: "bg-rose-100 text-rose-700",
};

export default function AdvancedDrillsPanel() {
  const [active, setActive] = useState("interruptor");
  const activeDrill = DRILLS.find(d => d.id === active);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-1 h-6 rounded-full bg-rose-500" />
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Advanced Drill Modes
          </h2>
          <p className="text-xs text-gray-700 mt-0.5">8 high-pressure scenarios targeting the most common Meta rejection patterns</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Star size={12} className="text-amber-900 fill-amber-400" />
          <span className="text-xs font-bold text-amber-800">High Impact</span>
        </div>
      </div>

      {/* Drill selector */}
      <div className="flex flex-wrap gap-2">
        {DRILLS.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(d.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active === d.id
                ? "bg-gray-900 text-white border-gray-900"
                : "text-gray-600 border-gray-200 hover:border-gray-400 bg-white"
            }`}
          >
            <span className="text-[10px] font-bold text-gray-600">#{i + 11}</span>
            {d.icon}
            {d.label}
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${active === d.id ? "bg-white/20 text-white" : BADGE_COLORS[d.badge]}`}>
              {d.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Active drill */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        {activeDrill?.component}
      </div>
    </div>
  );
}
