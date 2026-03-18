// Design: Structured Clarity — behavioral tab with focus areas, STAR framework, Practice Mode randomizer
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ExternalLink, Shuffle, Play, Pause, RotateCcw, CheckCircle2, X, Star } from "lucide-react";
import { BEHAVIORAL_FOCUS_AREAS, META_VALUES } from "@/lib/guideData";
import { usePracticeRatings } from "@/hooks/usePracticeRatings";
import { motion, AnimatePresence } from "framer-motion";

const VALUE_COLORS: Record<string, { bg: string; border: string; title: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    title: "text-blue-800"    },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  title: "text-indigo-800"  },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    title: "text-teal-800"    },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  title: "text-purple-800"  },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   title: "text-amber-800"   },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-800" },
};

function FocusArea({ area }: { area: typeof BEHAVIORAL_FOCUS_AREAS[0] }) {
  const [openQ, setOpenQ] = useState<number | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: area.borderColor }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: area.bgColor }}>
        <div>
          <h3 className="font-bold text-sm" style={{ color: area.titleColor, fontFamily: "'Space Grotesk', sans-serif" }}>
            {area.title}
          </h3>
          <span className="text-xs font-medium" style={{ color: area.iconColor }}>{area.subtitle}</span>
        </div>
      </div>
      <div className="p-4 bg-white border-t" style={{ borderColor: area.borderColor + "80" }}>
        <p className="text-sm text-gray-500 italic mb-4 leading-relaxed">{area.description}</p>
        <div className="space-y-2">
          {area.questions.map((q, qi) => (
            <div key={qi} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
                onClick={() => setOpenQ(openQ === qi ? null : qi)}
              >
                <span className="text-sm font-semibold text-gray-800 leading-snug">{q.question}</span>
                <ChevronRight
                  size={14}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${openQ === qi ? "rotate-90" : ""}`}
                />
              </button>
              {openQ === qi && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Follow-up probes</p>
                  <ul className="space-y-1.5">
                    {q.probes.map((probe, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        {probe}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STAR_ITEMS = [
  { letter: "S", title: "Situation", desc: "Set the context. What was the project, team size, timeline? What was at stake? Include scale metrics (users, revenue, team size). Keep this brief — 15–20% of your answer.", pct: "15–20%" },
  { letter: "T", title: "Task",      desc: "What was your specific responsibility? What was the challenge or goal? Be clear about YOUR role vs the team's role. Interviewers want to know what you personally owned.", pct: "10–15%" },
  { letter: "A", title: "Action",    desc: "What did YOU specifically do? Walk through your decision-making process. Include technical details, stakeholder management, and trade-offs considered. This is the most important part.", pct: "50–60%" },
  { letter: "R", title: "Result",    desc: "What was the measurable outcome? Include metrics: latency reduction %, users impacted, revenue generated, time saved. What did you learn? What would you do differently?", pct: "15–20%" },
];

// ── Flatten all questions from all focus areas into a pool ──────────────────
type QuestionEntry = {
  question: string;
  probes: string[];
  areaTitle: string;
  areaColor: string;
  areaBg: string;
  areaBorder: string;
  areaIconColor: string;
  areaTitleColor: string;
};

const QUESTION_POOL: QuestionEntry[] = BEHAVIORAL_FOCUS_AREAS.flatMap((area) =>
  area.questions.map((q) => ({
    question: q.question,
    probes: q.probes,
    areaTitle: area.title,
    areaColor: area.color,
    areaBg: area.bgColor,
    areaBorder: area.borderColor,
    areaIconColor: area.iconColor,
    areaTitleColor: area.titleColor,
  }))
);

const PRACTICE_DURATION = 3 * 60; // 3 minutes in seconds

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

function playBeep(freq = 880, dur = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch { /* ignore */ }
}

// ── Practice Mode Component ─────────────────────────────────────────────────
function PracticeMode() {
  const [active, setActive]           = useState(false);
  const [question, setQuestion]       = useState<QuestionEntry | null>(null);
  const [remaining, setRemaining]     = useState(PRACTICE_DURATION);
  const [running, setRunning]         = useState(false);
  const [finished, setFinished]       = useState(false);
  const [showProbes, setShowProbes]   = useState(false);
  const [round, setRound]             = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addRating, getLatestRating, getAttemptCount } = usePracticeRatings();

  const pickRandom = useCallback((exclude?: QuestionEntry) => {
    const pool = exclude ? QUESTION_POOL.filter((q) => q.question !== exclude.question) : QUESTION_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const startSession = useCallback(() => {
    const q = pickRandom(question ?? undefined);
    setQuestion(q);
    setRemaining(PRACTICE_DURATION);
    setRunning(false);
    setFinished(false);
    setShowProbes(false);
    setActive(true);
    setRound((r) => r + 1);
    setSavedRating(null);
    setHoverRating(0);
  }, [pickRandom, question]);

  const handleRate = useCallback((rating: number) => {
    if (!question) return;
    addRating(question.question, rating);
    setSavedRating(rating);
  }, [question, addRating]);

  const nextQuestion = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startSession();
  }, [startSession]);

  const closeSession = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
    setRunning(false);
    setFinished(false);
    setQuestion(null);
  }, []);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setFinished(true);
            playBeep(660, 0.2);
            setTimeout(() => playBeep(660, 0.2), 300);
            setTimeout(() => playBeep(880, 0.4), 600);
            return 0;
          }
          if (prev === 60 + 1) playBeep(440, 0.12); // 1-min warning
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const progress = remaining / PRACTICE_DURATION;
  const urgency = finished ? "finished" : remaining <= 30 ? "critical" : remaining <= 60 ? "warning" : "normal";
  const ringColor = urgency === "finished" ? "#10b981" : urgency === "critical" ? "#ef4444" : urgency === "warning" ? "#f59e0b" : "#6366f1";
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div>
      {/* Entry button */}
      {!active && (
        <button
          onClick={startSession}
          className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <Shuffle size={16} />
          Start Practice Mode
          <span className="text-[11px] font-normal bg-white/20 px-2 py-0.5 rounded-full">{QUESTION_POOL.length} questions</span>
        </button>
      )}

      {/* Active session */}
      <AnimatePresence>
        {active && question && (
          <motion.div
            key={`round-${round}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 overflow-hidden shadow-lg"
            style={{ borderColor: question.areaBorder }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: question.areaBg }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: question.areaIconColor }}>
                  Practice Mode
                </span>
                <span className="text-[11px] text-gray-400">·</span>
                <span className="text-[11px] font-semibold" style={{ color: question.areaTitleColor }}>
                  {question.areaTitle.replace("Focus Area 1: ", "").replace("Focus Area 2: ", "").replace("Focus Area 3: ", "").replace("Focus Area 4: ", "")}
                </span>
              </div>
              <button onClick={closeSession} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Question */}
            <div className="bg-white px-5 pt-5 pb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Interview Question</p>
              <p className="text-lg font-bold text-gray-900 leading-snug mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {question.question}
              </p>

              {/* Timer row */}
              <div className="flex items-center gap-4 mb-5">
                {/* SVG ring */}
                <div className="relative flex-shrink-0">
                  <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                    <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <motion.circle
                      cx="28" cy="28" r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 0.5, ease: "linear" }}
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <motion.p
                    className={`text-3xl font-extrabold font-mono leading-none ${
                      urgency === "finished" ? "text-emerald-600" : urgency === "critical" ? "text-red-600" : urgency === "warning" ? "text-amber-600" : "text-gray-900"
                    }`}
                    animate={urgency === "critical" && running ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {formatTime(remaining)}
                  </motion.p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {finished ? "Time's up — review your answer" : urgency === "critical" ? "⚠️ Wrap up now" : urgency === "warning" ? "1 min left — start your Result" : running ? "Speak your STAR answer out loud" : "Press Start when ready"}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!finished ? (
                    <button
                      onClick={() => setRunning((v) => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                        running ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> {remaining < PRACTICE_DURATION ? "Resume" : "Start"}</>}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={13} /> Done
                    </div>
                  )}
                  <button
                    onClick={() => { setRemaining(PRACTICE_DURATION); setRunning(false); setFinished(false); }}
                    disabled={remaining === PRACTICE_DURATION && !running && !finished}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Reset timer"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ringColor }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>

              {/* STAR reminder chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["S — Situation (15%)", "T — Task (15%)", "A — Action (55%)", "R — Result (15%)"].map((chip) => (
                  <span key={chip} className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{chip}</span>
                ))}
              </div>

              {/* Self-rating prompt — shown after timer finishes */}
              <AnimatePresence>
                {finished && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl"
                  >
                    <p className="text-xs font-bold text-indigo-700 mb-2.5 uppercase tracking-wide">
                      How well did you answer?
                    </p>
                    {savedRating === null ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRate(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              size={24}
                              className={`transition-colors ${
                                star <= (hoverRating || 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs text-gray-400">
                          {hoverRating === 1 ? "Needs a lot of work" : hoverRating === 2 ? "Needs improvement" : hoverRating === 3 ? "Decent" : hoverRating === 4 ? "Good" : hoverRating === 5 ? "Excellent" : "Tap a star"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={18} className={star <= savedRating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-indigo-700">
                          {savedRating === 1 ? "Needs a lot of work" : savedRating === 2 ? "Needs improvement" : savedRating === 3 ? "Decent" : savedRating === 4 ? "Good" : "Excellent"} — saved!
                        </span>
                        {question && getAttemptCount(question.question) > 1 && (
                          <span className="text-[11px] text-gray-400 ml-1">
                            ({getAttemptCount(question.question)} attempts)
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Follow-up probes (reveal after timer or on demand) */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowProbes((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <ChevronRight size={13} className={`transition-transform ${showProbes ? "rotate-90" : ""}`} />
                  {showProbes ? "Hide" : "Show"} follow-up probes ({question.probes.length})
                </button>
                <AnimatePresence>
                  {showProbes && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 space-y-1.5 overflow-hidden"
                    >
                      {question.probes.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />{p}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">Tip: answer out loud as if in a real interview</p>
              <button
                onClick={nextQuestion}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                <Shuffle size={13} /> Next Question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export default function BehavioralTab() {
  return (
    <div className="space-y-10">
      {/* Overview */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The Behavioral Interview at Meta
          </h2>
          <p className="text-sm text-gray-500 mt-1">Meta's 4 core focus areas — with real questions and follow-up probes from interviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800 mb-1">The STAR Method + Meta's Probing Style</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Meta interviewers use a structured probing approach. They ask an opening question, then follow up with specific probes about scope, relationships, process, and outcome. Prepare <strong>6–8 STAR stories</strong> that can flex across multiple focus areas. Each story should include concrete metrics.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-1 rounded-full bg-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">The Three Things Meta Tests at IC6+</p>
              <p className="text-sm text-red-700 leading-relaxed">
                (1) <strong>Autonomy and Ownership</strong> — can you drive complex projects without being managed? (2) <strong>Influence Without Authority</strong> — can you align other teams and senior leaders? (3) <strong>Learning Loops</strong> — do you actively seek feedback and improve?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Mode */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Practice Mode
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Get a random question from the 4 focus areas and answer it out loud in 3 minutes — simulating real interview pressure
          </p>
        </div>
        <PracticeMode />
      </section>

      {/* Meta's 6 Core Values */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Meta's Six Core Values
          </h2>
          <p className="text-sm text-gray-500 mt-1">Every behavioral answer should be grounded in one or more of these values</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {META_VALUES.map((v) => {
            const c = VALUE_COLORS[v.color];
            return (
              <div key={v.name} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                <h4 className={`font-bold text-sm mb-1.5 ${c.title}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {v.name}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Focus Areas */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The 4 Behavioral Focus Areas
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real questions and follow-up probes used by Meta interviewers in 2025–2026</p>
        </div>
        <div className="space-y-5">
          {BEHAVIORAL_FOCUS_AREAS.map((area) => (
            <FocusArea key={area.id} area={area} />
          ))}
        </div>
      </section>

      {/* STAR Framework */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The STAR Framework for Meta
          </h2>
          <p className="text-sm text-gray-500 mt-1">How to structure every behavioral answer to maximize signal and score</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAR_ITEMS.map((s) => (
            <div key={s.letter} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.letter}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h4>
                  <span className="text-[11px] text-gray-400">{s.pct} of answer</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-1 rounded-full bg-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Prepare Your 2-Minute Elevator Pitch</p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Prepare a 2-minute "elevator pitch" for your best project that covers: what the project was, why it was hard, what your specific role was, and what the outcome was. Then be ready to go deep on any aspect the interviewer wants to explore. Practice this with a friend or a coach until it feels completely natural.
            </p>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Behavioral Prep Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { tag: "Free", tagColor: "emerald", title: "Awesome Behavioral Interviews — GitHub", desc: "Comprehensive behavioral question bank with STAR framework guidance and company-specific patterns. Community-maintained and regularly updated.", url: "https://github.com/ashishps1/awesome-behavioral-interviews" },
            { tag: "Platform", tagColor: "rose", title: "Taro — Career Q&A Platform", desc: "Real Q&A from Meta/Google engineers on navigating behavioral interviews, leveling decisions, and career growth at FAANG.", url: "https://www.jointaro.com/questions/?sort=great_discussion" },
            { tag: "AI Tool", tagColor: "cyan", title: "Ethan Evans AI Career Coach", desc: "AI-powered executive career coach by Ethan Evans (ex-Amazon VP). Excellent for senior-level behavioral prep and leadership storytelling.", url: "https://chatgpt.com/g/g-673f8563b070819195e9956bae3313da-ethan-evans-ai-executive-career-coach" },
            { tag: "Guide", tagColor: "blue", title: "Meta Behavioral Interview Guide — igotanoffer", desc: "Detailed guide on Meta's behavioral interview format, focus areas, and preparation strategy with example answers.", url: "https://igotanoffer.com/en/advice/meta-behavioral-interviews" },
          ].map((r) => (
            <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5 inline-block bg-${r.tagColor}-100 text-${r.tagColor}-700`}>
                    {r.tag}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">{r.title}</p>
                </div>
                <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
