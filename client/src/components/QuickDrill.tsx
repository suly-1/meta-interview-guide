// QuickDrill — spaced-repetition flash card for coding patterns
// Shows key idea + complexity, hides problems list. 30-second recall timer.
import { useState, useEffect, useRef, useCallback } from "react";
import { Shuffle, Eye, RotateCcw, Star, ChevronRight, Zap } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";
import { useStreak } from "@/hooks/useStreak";
import { motion, AnimatePresence } from "framer-motion";

const DRILL_DURATION = 30; // seconds to recall before reveal

function pad(n: number) { return String(n).padStart(2, "0"); }

const DRILL_STORAGE_KEY = "meta-guide-drill-ratings";

type DrillRating = { rating: number; ts: number };

function loadDrillRatings(): Record<string, DrillRating[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveDrillRatings(d: Record<string, DrillRating[]>) {
  try { localStorage.setItem(DRILL_STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

function useDrillRatings() {
  const [data, setData] = useState<Record<string, DrillRating[]>>(loadDrillRatings);

  const rate = useCallback((patternId: string, rating: number) => {
    setData((prev) => {
      const next = { ...prev, [patternId]: [...(prev[patternId] ?? []), { rating, ts: Date.now() }] };
      saveDrillRatings(next);
      return next;
    });
  }, []);

  const latest = useCallback((id: string): number | null => {
    const entries = data[id];
    return entries?.length ? entries[entries.length - 1].rating : null;
  }, [data]);

  const attempts = useCallback((id: string) => data[id]?.length ?? 0, [data]);

  return { rate, latest, attempts };
}

export default function QuickDrill() {
  const [active, setActive]       = useState(false);
  const [pattern, setPattern]     = useState<typeof PATTERNS[0] | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [remaining, setRemaining] = useState(DRILL_DURATION);
  const [running, setRunning]     = useState(false);
  const [expired, setExpired]     = useState(false);
  const [hover, setHover]         = useState(0);
  const [saved, setSaved]         = useState<number | null>(null);
  const [round, setRound]         = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { rate, latest, attempts } = useDrillRatings();
  const { recordActivity } = useStreak();

  const pickRandom = useCallback((exclude?: typeof PATTERNS[0]) => {
    const pool = exclude ? PATTERNS.filter((p) => p.id !== exclude.id) : PATTERNS;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const startDrill = useCallback(() => {
    const p = pickRandom(pattern ?? undefined);
    setPattern(p);
    setRevealed(false);
    setRemaining(DRILL_DURATION);
    setRunning(true);
    setExpired(false);
    setSaved(null);
    setHover(0);
    setActive(true);
    setRound((r) => r + 1);
  }, [pickRandom, pattern]);

  const nextDrill = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startDrill();
  }, [startDrill]);

  // Countdown
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setExpired(true);
            setRevealed(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleReveal = () => {
    setRunning(false);
    setRevealed(true);
  };

  const handleRate = (rating: number) => {
    if (!pattern) return;
    rate(pattern.id, rating);
    setSaved(rating);
    recordActivity();
  };

  const DIFF_COLORS: Record<string, string> = {
    green: "text-emerald-600 bg-emerald-50 border-emerald-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    red:   "text-red-600 bg-red-50 border-red-200",
  };

  const pct = remaining / DRILL_DURATION;
  const timerColor = expired ? "#10b981" : remaining <= 10 ? "#ef4444" : remaining <= 20 ? "#f59e0b" : "#6366f1";

  return (
    <div>
      {/* Entry */}
      {!active && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={startDrill}
            className="flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Zap size={16} />
            Start Quick Drill
            <span className="text-[11px] font-normal bg-white/20 px-2 py-0.5 rounded-full">{PATTERNS.length} patterns</span>
          </button>
          <p className="text-xs text-gray-500">30 seconds to recall the approach — then reveal and rate yourself</p>
        </div>
      )}

      {/* Active drill card */}
      <AnimatePresence>
        {active && pattern && (
          <motion.div
            key={`drill-${round}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 border-blue-200 overflow-hidden shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Quick Drill</span>
                <span className="text-[11px] text-gray-400">·</span>
                <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full ${DIFF_COLORS[pattern.difficultyColor]}`}>
                  {pattern.difficulty}
                </span>
                <span className="text-[11px] text-amber-500 font-bold">{"★".repeat(pattern.frequency)}</span>
              </div>
              <div className="flex items-center gap-2">
                {attempts(pattern.id) > 0 && (
                  <span className="text-[11px] text-gray-400">{attempts(pattern.id)} attempt{attempts(pattern.id) > 1 ? "s" : ""}</span>
                )}
                {latest(pattern.id) !== null && (
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={10} className={s <= (latest(pattern.id) ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white px-5 pt-5 pb-4">
              {/* Pattern name */}
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Pattern</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {pattern.name}
              </h3>

              {/* Timer */}
              <div className="flex items-center gap-3 mb-5 mt-3">
                <div className="relative flex-shrink-0">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <motion.circle
                      cx="24" cy="24" r="18"
                      fill="none"
                      stroke={timerColor}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 18}
                      animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - pct) }}
                      transition={{ duration: 0.5, ease: "linear" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: timerColor }}>
                    {pad(remaining)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {expired ? "Time's up — see the answer below" : revealed ? "Answer revealed" : running ? "Recall the approach out loud…" : "Ready?"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {revealed ? "Rate how well you knew it" : "What is the key idea? Time & space complexity?"}
                  </p>
                </div>
              </div>

              {/* Reveal button */}
              {!revealed && (
                <button
                  onClick={handleReveal}
                  className="flex items-center gap-2 px-4 py-2 mb-5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Eye size={14} /> Reveal Answer
                </button>
              )}

              {/* Answer panel */}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 mb-4"
                  >
                    {/* Key idea */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 mb-1">Key Idea</p>
                      <p className="text-sm text-blue-900 font-semibold leading-snug">{pattern.keyIdea}</p>
                    </div>

                    {/* Complexity row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Time</p>
                        <p className="text-sm font-bold text-gray-800 font-mono">{pattern.timeComplexity}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Space</p>
                        <p className="text-sm font-bold text-gray-800 font-mono">{pattern.spaceComplexity}</p>
                      </div>
                    </div>

                    {/* Meta note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Meta Note</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{pattern.metaNote}</p>
                    </div>

                    {/* Problems (hidden until revealed) */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Practice Problems</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pattern.problems.map((p) => (
                          <span key={p} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{p}</span>
                        ))}
                      </div>
                    </div>

                    {/* Self-rating */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5">
                      <p className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">How well did you know it?</p>
                      {saved === null ? (
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((star) => (
                            <button key={star}
                              onMouseEnter={() => setHover(star)}
                              onMouseLeave={() => setHover(0)}
                              onClick={() => handleRate(star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star size={24} className={`transition-colors ${star <= (hover || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                          <span className="ml-2 text-xs text-gray-400">
                            {hover === 1 ? "Blank" : hover === 2 ? "Vague idea" : hover === 3 ? "Mostly right" : hover === 4 ? "Solid" : hover === 5 ? "Perfect recall" : "Rate yourself"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={18} className={s <= saved ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-indigo-700">
                            {saved === 1 ? "Blank" : saved === 2 ? "Vague idea" : saved === 3 ? "Mostly right" : saved === 4 ? "Solid" : "Perfect recall"} — logged!
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setActive(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Exit drill
              </button>
              <button
                onClick={nextDrill}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                <Shuffle size={13} /> Next Pattern
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
