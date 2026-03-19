/**
 * PatternUnlockCelebration — shows a confetti burst + toast when a pattern
 * reaches "strong" mastery (avg rating ≥ 4.5 / 5 stars).
 *
 * Usage: mount once at app level or inside CodingTab; it listens to
 * localStorage changes on "meta-guide-drill-ratings" and fires when any
 * pattern first crosses the "strong" threshold.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Zap } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";

const DRILL_KEY = "meta-guide-drill-ratings";
const CELEBRATED_KEY = "meta-guide-celebrated-patterns";

type DrillEntry = { rating: number; ts?: number };

function loadRatings(): Record<string, DrillEntry[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}
function loadCelebrated(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(CELEBRATED_KEY) ?? "[]")); } catch { return new Set(); }
}
function saveCelebrated(s: Set<string>) {
  localStorage.setItem(CELEBRATED_KEY, JSON.stringify(Array.from(s)));
}

function avgRating(entries: DrillEntry[]): number | null {
  if (!entries.length) return null;
  return entries.reduce((s, e) => s + e.rating, 0) / entries.length;
}

// Simple CSS confetti burst using random divs
function ConfettiBurst() {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 0.8 + Math.random() * 0.8,
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight + 100,
            opacity: [1, 1, 0],
            rotate: p.rotate + 360,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

interface CelebrationToast {
  patternId: string;
  patternName: string;
  nextPattern: string | null;
}

export default function PatternUnlockCelebration() {
  const [toast, setToast] = useState<CelebrationToast | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevRatingsRef = useRef<Record<string, DrillEntry[]>>(loadRatings());

  useEffect(() => {
    const checkForNewUnlocks = () => {
      const current = loadRatings();
      const celebrated = loadCelebrated();

      for (const pattern of PATTERNS) {
        const entries = current[pattern.id] ?? [];
        const avg = avgRating(entries);
        const isStrong = avg !== null && avg >= 4.5 && entries.length >= 3;

        if (isStrong && !celebrated.has(pattern.id)) {
          // New unlock!
          celebrated.add(pattern.id);
          saveCelebrated(celebrated);

          // Find next recommended pattern (first unrated or weakest)
          const nextPattern = PATTERNS.find(p => {
            const e = current[p.id] ?? [];
            const a = avgRating(e);
            return p.id !== pattern.id && (a === null || a < 4.5);
          });

          setToast({
            patternId: pattern.id,
            patternName: pattern.name,
            nextPattern: nextPattern?.name ?? null,
          });
          setShowConfetti(true);

          // Hide confetti after 3s
          setTimeout(() => setShowConfetti(false), 3000);
          break; // show one at a time
        }
      }

      prevRatingsRef.current = current;
    };

    // Listen for storage events (from other tabs) and poll for same-tab changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DRILL_KEY) checkForNewUnlocks();
    };
    window.addEventListener("storage", handleStorage);

    // Also poll every 2s for same-tab changes (storage events don't fire for same tab)
    const interval = setInterval(checkForNewUnlocks, 2000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {showConfetti && <ConfettiBurst />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[99] max-w-sm w-full"
          >
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-2xl p-5 border border-emerald-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Trophy size={20} className="text-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Pattern Mastered!</span>
                    <span className="text-base">🎉</span>
                  </div>
                  <p className="font-bold text-base leading-snug mb-1">
                    {toast.patternName}
                  </p>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    You've reached <strong>Strong</strong> mastery (avg ≥ 4.5★). This pattern is locked in!
                  </p>
                  {toast.nextPattern && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs bg-white/15 rounded-lg px-2.5 py-1.5">
                      <Zap size={11} className="text-yellow-300 flex-shrink-0" />
                      <span>Next up: <strong>{toast.nextPattern}</strong></span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="text-white/70 hover:text-white transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
