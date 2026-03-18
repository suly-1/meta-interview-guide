// InterviewTimer — floating mock interview countdown timer
// Presets: 25 / 35 / 45 min. SVG ring shows progress. Color shifts amber → red as time runs low.
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "35 min", seconds: 35 * 60 },
  { label: "45 min", seconds: 45 * 60 },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// Play a short beep using the Web Audio API
function playBeep(frequency = 880, duration = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore — AudioContext not available
  }
}

export default function InterviewTimer() {
  const [presetIdx, setPresetIdx]   = useState(2); // default 45 min
  const [total, setTotal]           = useState(PRESETS[2].seconds);
  const [remaining, setRemaining]   = useState(PRESETS[2].seconds);
  const [running, setRunning]       = useState(false);
  const [collapsed, setCollapsed]   = useState(false);
  const [finished, setFinished]     = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setFinished(true);
            // Triple beep on finish
            playBeep(660, 0.2);
            setTimeout(() => playBeep(660, 0.2), 300);
            setTimeout(() => playBeep(880, 0.4), 600);
            return 0;
          }
          // Warning beeps at 5 min and 1 min remaining
          if (prev === 5 * 60 + 1 || prev === 60 + 1) playBeep(440, 0.12);
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handlePreset = useCallback((idx: number) => {
    if (running) return; // don't change preset while running
    setPresetIdx(idx);
    setTotal(PRESETS[idx].seconds);
    setRemaining(PRESETS[idx].seconds);
    setFinished(false);
  }, [running]);

  const handleReset = useCallback(() => {
    setRunning(false);
    setRemaining(total);
    setFinished(false);
  }, [total]);

  const handleToggle = useCallback(() => {
    if (finished) { handleReset(); return; }
    setRunning((v) => !v);
  }, [finished, handleReset]);

  // SVG ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 1;
  const dashOffset = circumference * (1 - progress);

  // Urgency state
  const pct = total > 0 ? remaining / total : 1;
  const urgency =
    finished        ? "finished"
    : pct <= 1 / 45 ? "critical"   // last 1 min (for 45-min timer)
    : remaining <= 60               ? "critical"
    : remaining <= 5 * 60           ? "warning"
    : "normal";

  const ringColor =
    urgency === "finished" ? "#10b981"
    : urgency === "critical" ? "#ef4444"
    : urgency === "warning"  ? "#f59e0b"
    : "#3b82f6";

  const textColor =
    urgency === "finished" ? "text-emerald-600"
    : urgency === "critical" ? "text-red-600"
    : urgency === "warning"  ? "text-amber-600"
    : "text-gray-900";

  const bgColor =
    urgency === "finished" ? "bg-emerald-50 border-emerald-300"
    : urgency === "critical" ? "bg-red-50 border-red-300"
    : urgency === "warning"  ? "bg-amber-50 border-amber-300"
    : "bg-white border-gray-200";

  return (
    <div className={`rounded-2xl border shadow-md transition-all ${bgColor} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Timer size={16} className={running ? "text-blue-500 animate-pulse" : "text-gray-500"} />
          <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Mock Interview Timer
          </span>
          {running && (
            <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Running
            </span>
          )}
          {finished && (
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              Time's up!
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mini time display when collapsed */}
          {collapsed && (
            <span className={`text-sm font-bold font-mono ${textColor}`}>{formatTime(remaining)}</span>
          )}
          <span className="text-gray-400">{collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</span>
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="timer-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
              {/* Preset selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Duration</span>
                <div className="flex gap-1.5">
                  {PRESETS.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(i)}
                      disabled={running}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                        presetIdx === i
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ring + time */}
              <div className="flex items-center gap-6">
                {/* SVG ring */}
                <div className="relative flex-shrink-0">
                  <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                    {/* Track */}
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    {/* Progress */}
                    <motion.circle
                      cx="40" cy="40" r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 0.5, ease: "linear" }}
                    />
                  </svg>
                  {/* Pulse when running */}
                  {running && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ opacity: [0, 0.15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ background: ringColor }}
                    />
                  )}
                </div>

                {/* Time + status */}
                <div className="flex-1">
                  <motion.p
                    key={remaining}
                    className={`text-4xl font-extrabold font-mono leading-none ${textColor}`}
                    animate={urgency === "critical" && running ? { scale: [1, 1.04, 1] } : {}}
                    transition={{ duration: 0.5, repeat: urgency === "critical" ? Infinity : 0 }}
                  >
                    {formatTime(remaining)}
                  </motion.p>
                  <p className="text-xs text-gray-400 mt-1">
                    {finished
                      ? "Interview complete — great work!"
                      : urgency === "critical"
                      ? "⚠️ Final minute — wrap up now"
                      : urgency === "warning"
                      ? "5 minutes remaining — start wrapping up"
                      : running
                      ? "Timer running — focus!"
                      : "Ready to start"}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    finished
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : running
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {finished ? (
                    <><RotateCcw size={14} /> Restart</>
                  ) : running ? (
                    <><Pause size={14} /> Pause</>
                  ) : (
                    <><Play size={14} /> {remaining < total ? "Resume" : "Start"}</>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  disabled={remaining === total && !running && !finished}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-colors"
                  style={{ background: ringColor }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0:00</span>
                <span>{PRESETS[presetIdx].label}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
