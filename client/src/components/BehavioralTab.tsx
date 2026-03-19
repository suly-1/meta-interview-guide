// Design: Structured Clarity — behavioral tab with focus areas, STAR framework, Practice Mode randomizer
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import CTCITrackerBanner from "@/components/CTCITrackerBanner";
import { ChevronRight, ExternalLink, Shuffle, Play, Pause, RotateCcw, CheckCircle2, X, Star, Search } from "lucide-react";
import { BEHAVIORAL_FOCUS_AREAS, META_VALUES } from "@/lib/guideData";
import { usePracticeRatings } from "@/hooks/usePracticeRatings";
import { useStreak } from "@/hooks/useStreak";
import { motion, AnimatePresence } from "framer-motion";
import STARGapAnalyzer from "@/components/STARGapAnalyzer";
import InterviewerPersonaSimulator from "@/components/InterviewerPersonaSimulator";
import IC7AnswerUpgrader from "@/components/IC7AnswerUpgrader";
import BehavioralAnswerScorer from "@/components/BehavioralAnswerScorer";

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
  const { recordActivity } = useStreak();

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
    recordActivity();
  }, [question, addRating, recordActivity]);

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

// ── IC6 vs IC7 Comparison Data ─────────────────────────────────────────────
// ── IC6 vs IC7 Axis Comparison Data (from PE Bar Setting Framework) ──────────
const IC_AXIS_COMPARISON = [
  {
    axis: "🔨 Project Impact",
    color: "blue",
    rows: [
      { ic6: "Solves technical problems that few others can", ic7: "Identifies and solves the hardest technical problems across the org" },
      { ic6: "Implements the hardest parts of the system/feature", ic7: "Sees problems and opportunities that others miss and drives them to resolution" },
      { ic6: "Builds and ships high-quality work following best practices", ic7: "Picks projects with a goal of making things substantially better — expert across systems" },
      { ic6: "Credible co-owner across XFN; can independently drive product decisions", ic7: "Makes teams and systems work better with AI to increase impact" },
    ],
  },
  {
    axis: "⚙️ Engineering Excellence",
    color: "emerald",
    rows: [
      { ic6: "Influences engineering culture in broader team", ic7: "Has detailed understanding of bottlenecks of larger org and company" },
      { ic6: "Advocates for higher product quality and engineering efficiency", ic7: "Pursues opportunities that make larger org more efficient, including eliminating categories of work" },
      { ic6: "—", ic7: "Simplifies the world by applying past experiences; systems can be reasoned about formally" },
      { ic6: "—", ic7: "Influence drives strategy and implementation of engineering craft beyond individual teams" },
      { ic6: "—", ic7: "Independently balances engineering craft with other business requirements" },
    ],
  },
  {
    axis: "🧭 Direction",
    color: "amber",
    rows: [
      { ic6: "Helps set direction and goals for the team", ic7: "Has detailed understanding of goals/strategy of larger org and company; drives team's goals and technical direction" },
      { ic6: "Leads/coordinates rollouts and major initiatives", ic7: "Keeps close eye on industry, competition, and AI evolution; assesses threats and opportunities" },
      { ic6: "Strong communication within engineering", ic7: "Knows how a lot of Meta works — organizationally and technically — uses this to get things done few others can" },
      { ic6: "Communicates effectively across disciplines", ic7: "Drives ideas from inception to delivery; ensures good ideas are prioritized and challenges overcome" },
      { ic6: "—", ic7: "Owns outcomes end-to-end across technical and non-technical dimensions" },
    ],
  },
  {
    axis: "👥 People",
    color: "indigo",
    rows: [
      { ic6: "Good at recruiting pitches; mentors new team members", ic7: "Awesome at mentoring, guidance, and conflict resolution across the larger org" },
      { ic6: "Sought out as a strong mentor for engineers", ic7: "Close partner with managers; helps improve team performance" },
      { ic6: "—", ic7: "Provides feedback about other teams and org overall" },
      { ic6: "—", ic7: "Helps with leadership recruiting — senior engineers and managers" },
    ],
  },
];

const IC7_KEY_SIGNALS = [
  "Direct line from business need to their work — IC7s connect what they do to company-level business value",
  "1–3 deep, large contributions affecting a broad area of services, technology, and people",
  "Builds strategies that help others achieve more impact than they would otherwise — the key is bringing change to what would otherwise happen",
  "Flexible roles — can code deeply, flip to leading, build a POC, depending on need",
  "Owns outcomes, not just the path — e.g., a great service that doesn't get adopted is not success for an IC7",
  "Grows IC5/6 leaders around them — creates space for other leaders, avoids being an SPOF",
  "Tells the hard truth — e.g., deprecating something or killing a project when ROI isn't there",
  "Influence is upward (business direction, directors) not just lateral",
];

const IC_COLOR_MAP: Record<string, { header: string; ic6: string; ic7: string; badge: string }> = {
  blue:    { header: "bg-blue-50 text-blue-800 border-blue-200",    ic6: "bg-blue-50/50",    ic7: "bg-blue-100/60",    badge: "bg-blue-600" },
  amber:   { header: "bg-amber-50 text-amber-800 border-amber-200",  ic6: "bg-amber-50/50",  ic7: "bg-amber-100/60",  badge: "bg-amber-600" },
  emerald: { header: "bg-emerald-50 text-emerald-800 border-emerald-200", ic6: "bg-emerald-50/50", ic7: "bg-emerald-100/60", badge: "bg-emerald-600" },
  indigo:  { header: "bg-indigo-50 text-indigo-800 border-indigo-200", ic6: "bg-indigo-50/50", ic7: "bg-indigo-100/60", badge: "bg-indigo-600" },
};


// ── Full Mock Mode Component ────────────────────────────────────────────────
type MockQuestion = QuestionEntry & { areaIndex: number };

function FullMockMode() {
  const [active, setActive]           = useState(false);
  const [queue, setQueue]             = useState<MockQuestion[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [remaining, setRemaining]     = useState(PRACTICE_DURATION);
  const [running, setRunning]         = useState(false);
  const [finished, setFinished]       = useState(false);
  const [showProbes, setShowProbes]   = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratings, setRatings]         = useState<(number | null)[]>([null, null, null, null]);
  const [sessionDone, setSessionDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addRating } = usePracticeRatings();
  const { recordActivity } = useStreak();

  const buildQueue = useCallback((): MockQuestion[] => {
    return BEHAVIORAL_FOCUS_AREAS.map((area, i) => {
      const q = area.questions[Math.floor(Math.random() * area.questions.length)];
      return {
        question: q.question,
        probes: q.probes,
        areaTitle: area.title,
        areaColor: area.color,
        areaBg: area.bgColor,
        areaBorder: area.borderColor,
        areaIconColor: area.iconColor,
        areaTitleColor: area.titleColor,
        areaIndex: i,
      };
    });
  }, []);

  const startMock = useCallback(() => {
    const q = buildQueue();
    setQueue(q);
    setCurrentIdx(0);
    setRemaining(PRACTICE_DURATION);
    setRunning(false);
    setFinished(false);
    setShowProbes(false);
    setRatings([null, null, null, null]);
    setSessionDone(false);
    setActive(true);
    setHoverRating(0);
  }, [buildQueue]);

  const advanceToNext = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const next = currentIdx + 1;
    if (next >= queue.length) {
      setSessionDone(true);
      return;
    }
    setCurrentIdx(next);
    setRemaining(PRACTICE_DURATION);
    setRunning(false);
    setFinished(false);
    setShowProbes(false);
    setHoverRating(0);
  }, [currentIdx, queue.length]);

  const handleRate = useCallback((rating: number) => {
    const q = queue[currentIdx];
    if (!q) return;
    addRating(q.question, rating);
    recordActivity();
    setRatings((prev) => {
      const next = [...prev];
      next[currentIdx] = rating;
      return next;
    });
  }, [queue, currentIdx, addRating, recordActivity]);

  const closeMock = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
    setSessionDone(false);
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
          if (prev === 61) playBeep(440, 0.12);
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const current = queue[currentIdx];
  const progress = remaining / PRACTICE_DURATION;
  const urgency = finished ? "finished" : remaining <= 30 ? "critical" : remaining <= 60 ? "warning" : "normal";
  const ringColor = urgency === "finished" ? "#10b981" : urgency === "critical" ? "#ef4444" : urgency === "warning" ? "#f59e0b" : "#6366f1";
  const radius = 22; const circumference = 2 * Math.PI * radius;
  const avgRating = ratings.filter((r): r is number => r !== null).reduce((a, b) => a + b, 0) / (ratings.filter((r) => r !== null).length || 1);
  const ratingLabels = ["", "Needs a lot of work", "Needs improvement", "Decent", "Good", "Excellent"];

  if (!active) {
    return (
      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Full Mock Session
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              4 questions · one per focus area · 3 min each · ~12 min total
            </p>
          </div>
          <button
            onClick={startMock}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex-shrink-0"
          >
            <Play size={14} fill="currentColor" /> Start Full Mock
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BEHAVIORAL_FOCUS_AREAS.map((area, i) => (
            <div key={area.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: area.iconColor }}>{i + 1}</span>
              <span className="text-xs font-medium text-gray-700 leading-tight">{area.title.replace("Focus Area \d+: ", "").replace(/Focus Area \d+: /, "")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sessionDone) {
    const rated = ratings.filter((r): r is number => r !== null).length;
    const ratedRatings = ratings.filter((r): r is number => r !== null);
    const weakestIdx: number = ratedRatings.length > 0
      ? ratings.reduce((minI: number, r, i) => (r !== null && (ratings[minI] === null || r < (ratings[minI] ?? 6))) ? i : minI, 0)
      : -1;

    // Meta value mapping per focus area
    const AREA_VALUES: Record<string, string[]> = {
      xfn:             ["Build Awesome Things", "Focus on Long-Term Impact", "Meta, Metamates, Me"],
      conflict:        ["Be Direct & Respect Your Colleagues", "Meta, Metamates, Me", "Move Fast"],
      "problem-solving": ["Move Fast", "Focus on Long-Term Impact", "Live in the Future"],
      communication:   ["Be Direct & Respect Your Colleagues", "Meta, Metamates, Me", "Build Awesome Things"],
    };
    const AREA_IDS = ["xfn", "conflict", "problem-solving", "communication"];

    const buildMarkdown = () => {
      const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const lines = [
        `# Mock Interview Scorecard — ${now}`,
        ``,
        `**Session Average:** ${avgRating.toFixed(1)} / 5`,
        ``,
        `## Per-Question Results`,
        ``,
      ];
      queue.forEach((q, i) => {
        const areaLabel = q.areaTitle.replace(/Focus Area \d+: /, "");
        const r = ratings[i];
        const stars = r !== null ? "★".repeat(r) + "☆".repeat(5 - r) : "Not rated";
        const label = r !== null ? ratingLabels[r] : "Not rated";
        const vals = AREA_VALUES[AREA_IDS[i]] ?? [];
        lines.push(`### Q${i + 1}: ${areaLabel}`);
        lines.push(`**Question:** ${q.question}`);
        lines.push(`**Rating:** ${stars} ${label}`);
        lines.push(`**Meta Values:** ${vals.join(", ")}`);
        if (weakestIdx >= 0 && i === weakestIdx) lines.push(`⚠️ **Weakest Area — prioritize this in your next session**`);
        lines.push(``);
      });
        if (weakestIdx >= 0) {
          lines.push(`## Recommended Next Step`);
          lines.push(`Focus your next practice session on **${queue[weakestIdx]?.areaTitle.replace(/Focus Area \d+: /, "")}** — your lowest-rated area this session.`);
        }
      return lines.join("\n");
    };

    const handleCopyMarkdown = () => {
      navigator.clipboard.writeText(buildMarkdown()).catch(() => {});
    };

    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
        className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Full Mock Complete!
          </h3>
          <p className="text-sm text-gray-500">Scorecard — per-question ratings, Meta values demonstrated, and weakest area</p>
        </div>

        {/* Per-question scorecard */}
        <div className="space-y-3 mb-5">
          {queue.map((q, i) => {
            const isWeakest = i === weakestIdx && rated > 0;
            const vals = AREA_VALUES[AREA_IDS[i]] ?? [];
            return (
              <div key={i} className={`bg-white border rounded-xl p-4 ${isWeakest ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ background: q.areaBg, color: q.areaTitleColor, border: `1px solid ${q.areaBorder}` }}>
                      {q.areaTitle.replace(/Focus Area \d+: /, "")}
                    </span>
                    {isWeakest && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        ⚠ Weakest Area
                      </span>
                    )}
                  </div>
                  {ratings[i] !== null && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} className={s <= (ratings[i] ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-700 leading-snug mb-2">{q.question}</p>
                {ratings[i] !== null && (
                  <p className="text-[11px] text-gray-500 mb-2">{ratingLabels[ratings[i] ?? 0]}</p>
                )}
                {/* Meta values demonstrated */}
                <div className="flex flex-wrap gap-1.5">
                  {vals.map((v) => (
                    <span key={v} className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Session average */}
        {rated > 0 && (
          <div className="flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl p-3 mb-4">
            <span className="text-sm font-semibold text-gray-700">Session avg:</span>
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={16} className={s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
              ))}
            </div>
            <span className="text-sm font-bold text-amber-700">{avgRating.toFixed(1)} / 5</span>
          </div>
        )}

        {/* Weakest area callout */}
        {weakestIdx >= 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 flex items-start gap-2.5">
            <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
            <div>
              <p className="text-xs font-bold text-red-800 mb-0.5">Weakest Area This Session</p>
              <p className="text-xs text-red-700">
                <strong>{queue[weakestIdx]?.areaTitle.replace(/Focus Area \d+: /, "")}</strong> — rated {ratingLabels[ratings[weakestIdx] ?? 0]?.toLowerCase()}. Prioritize this in your next practice session.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={startMock} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
            <RotateCcw size={13} /> New Mock
          </button>
          <button onClick={handleCopyMarkdown} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            <CheckCircle2 size={13} /> Copy as Markdown
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            <ExternalLink size={13} /> Print / Save PDF
          </button>
          <button onClick={closeMock} className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all">
            <X size={13} /> Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {current && (
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border overflow-hidden shadow-md" style={{ borderColor: current.areaBorder }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ background: current.areaBg }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {queue.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${
                    i < currentIdx ? "w-6 bg-emerald-500" : i === currentIdx ? "w-8 bg-purple-600" : "w-6 bg-gray-200"
                  }`} />
                ))}
              </div>
              <span className="text-xs font-bold" style={{ color: current.areaTitleColor }}>
                Question {currentIdx + 1} of {queue.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: current.areaBg, color: current.areaTitleColor, border: `1px solid ${current.areaBorder}` }}>
                {current.areaTitle.replace(/Focus Area \d+: /, "")}
              </span>
              <button onClick={closeMock} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white p-5 space-y-4">
            {/* Timer ring */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="28" cy="28" r={radius} fill="none" stroke={ringColor} strokeWidth="4"
                    strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round" transform="rotate(-90 28 28)"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold" style={{ color: ringColor }}>
                  {formatTime(remaining)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 leading-snug">{current.question}</p>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-2">
              <button onClick={() => setRunning((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  running ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}>
                {running ? <><Pause size={13} /> Pause</> : <><Play size={13} fill="currentColor" /> {remaining < PRACTICE_DURATION ? "Resume" : "Start Timer"}</>}
              </button>
              <button onClick={() => { setRemaining(PRACTICE_DURATION); setRunning(false); setFinished(false); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-all">
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Rating (after timer finishes) */}
            <AnimatePresence>
              {finished && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-indigo-800 mb-2">Time's up — how well did you answer?</p>
                  {ratings[currentIdx] === null ? (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRate(star)} className="transition-transform hover:scale-110">
                          <Star size={24} className={`transition-colors ${star <= (hoverRating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        </button>
                      ))}
                      <span className="ml-2 text-xs text-gray-400">
                        {hoverRating ? ratingLabels[hoverRating] : "Tap a star"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={18} className={s <= (ratings[currentIdx] ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-indigo-700">{ratingLabels[ratings[currentIdx] ?? 0]} — saved!</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Follow-up probes */}
            <div className="border-t border-gray-100 pt-3">
              <button onClick={() => setShowProbes((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                <ChevronRight size={13} className={`transition-transform ${showProbes ? "rotate-90" : ""}`} />
                {showProbes ? "Hide" : "Show"} follow-up probes ({current.probes.length})
              </button>
              <AnimatePresence>
                {showProbes && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="mt-2 space-y-1.5 overflow-hidden">
                    {current.probes.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />{p}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">Answer out loud — treat this as a real interview</p>
            <button onClick={advanceToNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
              {currentIdx < queue.length - 1 ? <><Shuffle size={13} /> Next Question</> : <><CheckCircle2 size={13} /> Finish Mock</>}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export default function BehavioralTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BEHAVIORAL_FOCUS_AREAS;
    return BEHAVIORAL_FOCUS_AREAS.map((area) => ({
      ...area,
      questions: area.questions.filter(
        (question) =>
          question.question.toLowerCase().includes(q) ||
          question.probes.some((p) => p.toLowerCase().includes(q))
      ),
    })).filter((area) => area.questions.length > 0);
  }, [searchQuery]);

  const totalMatches = useMemo(() => filteredAreas.reduce((sum, a) => sum + a.questions.length, 0), [filteredAreas]);
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-10">
      <CTCITrackerBanner
        description="Behavioral interviews test your leadership principles and impact stories. Use the tracker to ensure your coding fundamentals are solid so you can focus your energy on crafting compelling STAR answers."
        ctaText="Keep your coding fundamentals sharp while you prep your behavioral stories!"
        tags={["💬 STAR stories", "📈 Track coding too", "🔍 Balance prep", "🏆 Full readiness"]}
      />
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

      {/* Full Mock Mode */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Full Mock Session
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Simulate a complete 12-minute behavioral round — one question per focus area, 3 minutes each, back-to-back
          </p>
        </div>
        <FullMockMode />
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

      {/* IC6 vs IC7 Comparison */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            IC6 vs IC7 — Scope &amp; Evaluation Bar
          </h2>
          <p className="text-sm text-gray-500 mt-1">From the PE Bar Setting Framework and IC7 intake forms — know which standard you are being held to</p>
        </div>

        {/* Foundational difference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="font-bold text-blue-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>IC6 — Senior Engineer</h3>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed mb-2"><strong>Template:</strong> Established senior engineer within the org</p>
            <p className="text-xs text-blue-700 leading-relaxed"><strong>Operating Level:</strong> Team / broader team</p>
            <p className="text-xs text-blue-700 leading-relaxed mt-1"><strong>Archetype:</strong> Strong individual executor and team-level leader</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h3 className="font-bold text-purple-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>IC7 — Staff Engineer</h3>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed mb-2"><strong>Template:</strong> No easily made template — advancement comes from identifying and delivering an initiative with large impact and value to the org</p>
            <p className="text-xs text-purple-700 leading-relaxed"><strong>Operating Level:</strong> Org-wide and cross-org</p>
            <p className="text-xs text-purple-700 leading-relaxed mt-1"><strong>Archetype:</strong> Deep specialist or broad XFN coordinator</p>
          </div>
        </div>

        {/* Axis-by-axis comparison */}
        <div className="space-y-5 mb-6">
          {IC_AXIS_COMPARISON.map((axis) => {
            const colorMap: Record<string, { header: string }> = {
              blue:    { header: "bg-blue-600" },
              emerald: { header: "bg-emerald-600" },
              amber:   { header: "bg-amber-500" },
              indigo:  { header: "bg-indigo-600" },
            };
            const c = colorMap[axis.color] ?? { header: "bg-gray-600" };
            return (
              <div key={axis.axis} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className={`${c.header} px-4 py-2.5`}>
                  <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{axis.axis}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs font-bold text-blue-700 w-1/2">
                        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />IC6 — Senior Engineer</span>
                      </th>
                      <th className="text-left px-4 py-2 text-xs font-bold text-purple-700 w-1/2">
                        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />IC7 — Staff Engineer</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {axis.rows.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 align-top">
                          <p className={`text-xs leading-relaxed ${row.ic6 === "—" ? "text-gray-300 italic" : "text-gray-700"}`}>{row.ic6}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className={`text-xs leading-relaxed font-medium ${row.ic7 === "—" ? "text-gray-300 italic" : "text-gray-800"}`}>{row.ic7}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* IC7 Key Signals */}
        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5">
          <h3 className="font-bold text-purple-900 text-sm mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Key Signals That Distinguish IC7 from IC6
          </h3>
          <p className="text-xs text-purple-700 mb-3 italic">From the PE Bar Setting Framework and IC7 intake forms</p>
          <ul className="space-y-2">
            {IC7_KEY_SIGNALS.map((signal, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-purple-800 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>

        {/* TL;DR */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-800 mb-1">TL;DR — IC6</p>
            <p className="text-xs text-blue-700 leading-relaxed">Proven senior engineer who solves hard problems, leads major initiatives on their team, and mentors others.</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-bold text-purple-800 mb-1">TL;DR — IC7</p>
            <p className="text-xs text-purple-700 leading-relaxed">No template — demonstrates org-wide or cross-org impact, shapes technical strategy, independently identifies what the org should be working on, owns end-to-end outcomes, and grows other senior leaders.</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 italic">The step from IC6 → IC7 is fundamentally about scope of influence and ownership: from team-level execution to org-level strategy and outcomes.</p>
      </section>

            {/* 4 Focus Areas */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The 4 Behavioral Focus Areas
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real questions and follow-up probes used by Meta interviewers in 2025–2026</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword — e.g. failure, mentoring, deadline…"
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-gray-400 transition-all dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          />
          {hasSearch && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasSearch && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">
              {totalMatches === 0 ? "No questions match" : `${totalMatches} question${totalMatches !== 1 ? "s" : ""} match`}
            </span>
            <span className="text-sm font-semibold text-amber-700">"{searchQuery}"</span>
            {totalMatches === 0 && (
              <button onClick={() => setSearchQuery("")} className="text-xs text-blue-600 hover:underline ml-1">Clear search</button>
            )}
          </div>
        )}

        {totalMatches === 0 && hasSearch ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No questions found for "{searchQuery}"</p>
            <p className="text-xs text-gray-400 mt-1">Try a different keyword like "conflict", "failure", "stakeholder", or "deadline"</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredAreas.map((area) => (
              <FocusArea key={area.id} area={area} />
            ))}
          </div>
        )}
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

      {/* STAR Gap Analyzer */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            STAR Story Gap Analyzer
          </h2>
          <p className="text-sm text-gray-500 mt-1">Cross-reference your completed STAR stories against IC7 key signals to find gaps and single points of failure.</p>
        </div>
        <STARGapAnalyzer />
      </section>

      {/* IC7 Answer Upgrader */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            "What Would an IC7 Say?" Answer Upgrader
          </h2>
          <p className="text-sm text-gray-500 mt-1">Side-by-side IC6 vs IC7 answer snippets for the same scenario — see the scope delta concretely.</p>
        </div>
        <IC7AnswerUpgrader />
      </section>

      {/* Interviewer Persona Simulator */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Interviewer Persona Simulator
          </h2>
          <p className="text-sm text-gray-500 mt-1">Practice with 4 distinct interviewer styles — The Prober, The Skeptic, The Friendly, and The Quiet — to handle any interview dynamic.</p>
        </div>
        <InterviewerPersonaSimulator />
      </section>

      {/* Answer Scorer */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AI Answer Scorer
          </h2>
          <p className="text-sm text-gray-500 mt-1">Paste your STAR answer and get an LLM-powered rubric score across 5 dimensions: Specificity, Impact, IC-Level Fit, Structure, and Conciseness.</p>
        </div>
        <BehavioralAnswerScorer />
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
