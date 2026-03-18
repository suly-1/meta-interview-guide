// InterviewDayChecklist — printable day-of checklist to reduce interview anxiety
import { useState } from "react";
import { CheckCircle2, Circle, Printer, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CheckItem = { id: string; time: string; emoji: string; title: string; detail: string; category: string };

const CHECKLIST: CheckItem[] = [
  // Evening before
  { id: "sleep",     time: "Night before",  emoji: "😴", title: "Get 7–8 hours of sleep",           category: "Evening Before", detail: "No late-night cramming. Your brain consolidates memory during sleep. A rested mind outperforms a tired one every time." },
  { id: "review",    time: "Night before",  emoji: "📖", title: "Light STAR story review (30 min)",  category: "Evening Before", detail: "Re-read your 8 STAR stories once. Don't drill new problems. Focus on the 2–3 stories you'll lead with." },
  { id: "setup",     time: "Night before",  emoji: "💻", title: "Test your tech setup",               category: "Evening Before", detail: "Confirm CoderPad access, camera, microphone, and internet. Close all non-essential browser tabs. Charge your laptop." },
  // Morning of
  { id: "meal",      time: "Morning",       emoji: "🍳", title: "Eat a proper meal",                  category: "Morning Of",     detail: "Avoid heavy or unfamiliar foods. Protein + complex carbs. No excessive caffeine — it amplifies anxiety." },
  { id: "warmup",    time: "30 min before", emoji: "🧩", title: "Solve one easy warm-up problem",     category: "Morning Of",     detail: "Pick a simple problem you've solved before (e.g. Two Sum). The goal is to get your brain into coding mode, not to learn anything new." },
  { id: "breathe",   time: "15 min before", emoji: "🧘", title: "5-minute breathing exercise",        category: "Morning Of",     detail: "Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 times. Proven to lower cortisol and sharpen focus." },
  // During the interview
  { id: "clarify",   time: "Interview",     emoji: "🗣️", title: "Clarify before coding",              category: "During",         detail: "Spend 2–3 minutes clarifying requirements, edge cases, and constraints. Interviewers reward this. Never start coding immediately." },
  { id: "talkout",   time: "Interview",     emoji: "💬", title: "Think out loud throughout",           category: "During",         detail: "Narrate your thought process continuously. Silence is the biggest red flag. Even saying 'I'm thinking about edge cases' is better than silence." },
  { id: "star",      time: "Interview",     emoji: "⭐", title: "Lead behavioral answers with impact", category: "During",         detail: "Open every behavioral answer with the result first if possible ('I led a migration that reduced latency by 40%...'), then walk back to the story." },
  { id: "questions", time: "End",           emoji: "❓", title: "Ask your 3 prepared questions",       category: "During",         detail: "Have 3 thoughtful questions ready. Good examples: 'What does success look like in the first 90 days?', 'What's the biggest technical challenge the team is facing?'" },
  // After
  { id: "notes",     time: "Right after",   emoji: "📝", title: "Write down everything you remember",  category: "After",          detail: "Within 30 minutes of finishing, write down every question asked, your answers, and what you'd do differently. Invaluable for future rounds." },
  { id: "rest",      time: "After",         emoji: "🎉", title: "Rest — you've done the work",          category: "After",          detail: "Don't second-guess your answers. You've prepared thoroughly. Trust the process and give yourself credit for showing up." },
];

const CATEGORIES = ["Evening Before", "Morning Of", "During", "After"];

const CAT_COLORS: Record<string, { bg: string; border: string; title: string; badge: string }> = {
  "Evening Before": { bg: "bg-indigo-50",  border: "border-indigo-200",  title: "text-indigo-800",  badge: "bg-indigo-100 text-indigo-700"  },
  "Morning Of":     { bg: "bg-amber-50",   border: "border-amber-200",   title: "text-amber-800",   badge: "bg-amber-100 text-amber-700"    },
  "During":         { bg: "bg-blue-50",    border: "border-blue-200",    title: "text-blue-800",    badge: "bg-blue-100 text-blue-700"      },
  "After":          { bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700"},
};

export default function InterviewDayChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const reset = () => setChecked(new Set());

  const total   = CHECKLIST.length;
  const done    = checked.size;
  const pct     = Math.round((done / total) * 100);

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-gray-800">Interview Day Readiness</p>
            <p className="text-xs text-gray-400">{done} of {total} items checked</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Printer size={12} /> Print
            </button>
            {done > 0 && (
              <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {pct === 100 && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-emerald-600 mt-2"
          >
            ✓ All set — you're ready. Go get it!
          </motion.p>
        )}
      </div>

      {/* Checklist by category */}
      {CATEGORIES.map((cat) => {
        const items = CHECKLIST.filter((i) => i.category === cat);
        const c = CAT_COLORS[cat];
        const catDone = items.filter((i) => checked.has(i.id)).length;
        return (
          <div key={cat} className={`rounded-2xl border overflow-hidden ${c.border}`}>
            <div className={`flex items-center justify-between px-4 py-3 ${c.bg}`}>
              <h3 className={`text-sm font-bold ${c.title}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {cat}
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                {catDone}/{items.length}
              </span>
            </div>
            <div className="bg-white divide-y divide-gray-100">
              {items.map((item) => {
                const isDone = checked.has(item.id);
                return (
                  <div key={item.id} className={`transition-colors ${isDone ? "bg-gray-50" : "bg-white"}`}>
                    <button
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => toggle(item.id)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <AnimatePresence mode="wait" initial={false}>
                          {isDone ? (
                            <motion.div key="done" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} transition={{ duration: 0.15 }}>
                              <CheckCircle2 size={17} className="text-emerald-500" />
                            </motion.div>
                          ) : (
                            <motion.div key="undone" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} transition={{ duration: 0.15 }}>
                              <Circle size={17} className="text-gray-300" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">{item.emoji}</span>
                          <span className={`text-sm font-semibold leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
                            {item.title}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">{item.time}</span>
                        </div>
                        <p className={`text-xs leading-relaxed mt-1 ${isDone ? "text-gray-400" : "text-gray-500"}`}>
                          {item.detail}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-[11px] text-gray-400 text-center">
        Click "Print" to save a clean copy for interview day. Checklist state is not persisted — reset each time you use it.
      </p>
    </div>
  );
}
