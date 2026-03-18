// OnboardingModal — first-visit walkthrough of 5 key features
// Shown once; dismissed state saved to localStorage
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer, CheckCircle2, Flame, Download, ChevronRight, ChevronLeft, X, Keyboard } from "lucide-react";

const STORAGE_KEY = "meta-guide-onboarding-done";

const FEATURES = [
  {
    icon: <Zap size={28} className="text-blue-500" />,
    bg: "bg-blue-50",
    ring: "ring-blue-200",
    title: "Quick Drill",
    tab: "Coding Interview tab",
    description:
      "Flash-card style practice for all 14 LeetCode patterns. You have 30 seconds to recall the approach, then reveal and rate yourself. Your rating automatically schedules the next review using spaced repetition — weak patterns come back sooner.",
    tip: "Press R to instantly reveal the answer while drilling.",
  },
  {
    icon: <Timer size={28} className="text-indigo-500" />,
    bg: "bg-indigo-50",
    ring: "ring-indigo-200",
    title: "Mock Interview Timer",
    tab: "Coding Interview tab",
    description:
      "A 25 / 35 / 45-minute countdown with an SVG ring, urgency color shifts, and audio beeps at the 5-minute and 1-minute marks. Every completed session is logged to your Session History with date, duration, and rating.",
    tip: "Press Space to start or pause the timer from anywhere on the page.",
  },
  {
    icon: <CheckCircle2 size={28} className="text-emerald-500" />,
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
    title: "Progress Tracker",
    tab: "Study Timeline tab",
    description:
      "Check off each of the 14 coding patterns and 8 STAR stories as you master them. Your overall readiness percentage and a weak-spot dashboard update in real time. All progress is saved locally — nothing is sent to any server.",
    tip: "Use the filter bar on the Coding tab to show only patterns you haven't mastered yet.",
  },
  {
    icon: <Flame size={28} className="text-orange-500" />,
    bg: "bg-orange-50",
    ring: "ring-orange-200",
    title: "Daily Streak",
    tab: "Sticky tab bar",
    description:
      "Complete at least one Quick Drill or Practice Mode session each day to build your streak. The flame badge turns bold orange at 3+ days. A green dot confirms you've already practiced today. Missing a day resets the streak.",
    tip: "The Practice Mode randomizer on the Behavioral tab also counts toward your streak.",
  },
  {
    icon: <Download size={28} className="text-gray-600" />,
    bg: "bg-gray-100",
    ring: "ring-gray-200",
    title: "Progress Export",
    tab: "Study Timeline tab",
    description:
      "Download or copy a full text report of your readiness, all 14 patterns with drill ratings and next review dates, STAR stories, weak spots, spaced-repetition schedule, and session history. Useful to share with a coach or recruiter.",
    tip: "Use the Shareable Link button to encode your progress into a URL you can open on any device.",
  },
];

export default function OnboardingModal() {
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setOpen(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const feature = FEATURES[step];
  const isLast  = step === FEATURES.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 mb-0.5">Welcome to the Guide</p>
                  <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    5 Features to Know
                  </h2>
                </div>
                <button
                  onClick={dismiss}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step dots */}
              <div className="flex items-center gap-1.5 px-6 pt-4">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-blue-500" : "w-1.5 bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>

              {/* Feature content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 py-5"
                >
                  {/* Icon + title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${feature.bg} ring-1 ${feature.ring} flex items-center justify-center flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {feature.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">{feature.tab}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Tip */}
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3.5 py-2.5">
                    <Keyboard size={13} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <span className="font-bold">Tip: </span>{feature.tip}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Keyboard shortcuts reference */}
              <div className="mx-6 mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { key: "1–4", desc: "Switch tabs" },
                  { key: "Space", desc: "Start/pause timer" },
                  { key: "R", desc: "Reveal drill answer" },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[11px] font-mono font-bold text-gray-700 dark:text-gray-200 shadow-sm">{key}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>

              {/* Footer nav */}
              <div className="flex items-center justify-between px-6 pb-5">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} /> Back
                </button>

                <span className="text-xs text-gray-400">{step + 1} / {FEATURES.length}</span>

                {isLast ? (
                  <button
                    onClick={dismiss}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                  >
                    Got it — let's go!
                  </button>
                ) : (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
