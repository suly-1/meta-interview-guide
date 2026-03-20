import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Cpu, MessageSquare, Calendar, Flame, Sun, Moon, ListChecks, BarChart2, Layers, ClipboardList, Terminal } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { emitKeyEvent } from "@/lib/keyEvents";
import OnboardingModal from "@/components/OnboardingModal";
import { useDensity, type Density } from "@/contexts/DensityContext";
import Hero from "@/components/Hero";
import CodingTab from "@/components/CodingTab";
import AIRoundTab from "@/components/AIRoundTab";
import BehavioralTab from "@/components/BehavioralTab";
import TimelineTab from "@/components/TimelineTab";
import CTCITrackerTab from "@/components/CTCITrackerTab";
import ReadinessTab from "@/components/ReadinessTab";
import SystemDesignTab from "@/components/SystemDesignTab";
import MockInterviewSimulator from "@/components/MockInterviewSimulator";
import CodePractice from "@/pages/CodePractice";
import { useStreak } from "@/hooks/useStreak";
import XPLevelBar from "@/components/XPLevelBar";
import NavCountdownChip from "@/components/NavCountdownChip";
import SoundtrackPlayer from "@/components/SoundtrackPlayer";
import TopicRoulette from "@/components/TopicRoulette";
import { useXPContext } from "@/contexts/XPContext";
import { KeyboardShortcutOverlay, useKeyboardShortcutOverlay } from "@/components/KeyboardShortcutOverlay";
import { HelpCircle, Dices } from "lucide-react";

const TABS = [
  { id: "ctci",       label: "Practice Tracker",     icon: <ListChecks size={15} />,     color: "violet"  },
  { id: "coding",     label: "Coding Interview",     icon: <Code2 size={15} />,          color: "blue"    },
  { id: "mock",       label: "Mock Interview",       icon: <ClipboardList size={15} />,  color: "indigo"  },
  { id: "practice",   label: "Code Practice",         icon: <Terminal size={15} />,       color: "green"   },
  { id: "ai-round",   label: "AI-Enabled Round",     icon: <Cpu size={15} />,            color: "teal"    },
  { id: "behavioral", label: "Behavioral Interview", icon: <MessageSquare size={15} />,  color: "amber"   },
  { id: "timeline",   label: "Study Timeline",       icon: <Calendar size={15} />,       color: "emerald" },
  { id: "readiness",  label: "Readiness",            icon: <BarChart2 size={15} />,      color: "rose"    },
  { id: "sysdesign",  label: "System Design",        icon: <Layers size={15} />,         color: "slate"   },
];

const ACTIVE_COLORS: Record<string, string> = {
  blue:    "text-blue-600 border-blue-600",
  teal:    "text-teal-600 border-teal-600",
  amber:   "text-amber-600 border-amber-600",
  emerald: "text-emerald-600 border-emerald-600",
  violet:  "text-violet-600 border-violet-600",
  rose:    "text-rose-600 border-rose-600",
  slate:   "text-slate-600 border-slate-600",
  indigo:  "text-indigo-600 border-indigo-600",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("ctci");
  const [direction, setDirection]  = useState(1);
  const { streak, activatedToday } = useStreak();
  const { totalXP, events } = useXPContext();
  const { theme, toggleTheme } = useTheme();
  const { density, setDensity } = useDensity();
  const isDark = theme === "dark";
  const { open: shortcutOpen, setOpen: setShortcutOpen } = useKeyboardShortcutOverlay();
  const [rouletteOpen, setRouletteOpen] = useState(false);

  // Keyboard shortcuts (1-5 now for 5 tabs)
  useKeyboardShortcuts({
    onTabSwitch: (i) => {
      const tab = TABS[i];
      if (tab) handleTabChange(tab.id);
    },
    onTimerToggle: () => emitKeyEvent("timer:toggle"),
    onReveal:      () => emitKeyEvent("drill:reveal"),
  });

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleTabChange = (id: string) => {
    const newIndex = TABS.findIndex((t) => t.id === id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Hero />

      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container">
          <div className="flex items-center gap-2">
            {/* Tab buttons */}
            <div className="flex overflow-x-auto scrollbar-hide flex-1 min-w-0">
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? ACTIVE_COLORS[tab.color] + " font-semibold"
                        : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className={isActive ? "" : "opacity-60"}>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Dark mode toggle */}
            <div className="flex-shrink-0 pl-2 border-l border-gray-100 flex items-center gap-1">
              {/* Density toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 gap-0.5" title="Font size / density">
                {(["compact", "comfortable", "spacious"] as Density[]).map(d => {
                  const labels: Record<Density, string> = { compact: "S", comfortable: "M", spacious: "L" };
                  const titles: Record<Density, string> = { compact: "Compact", comfortable: "Comfortable", spacious: "Spacious" };
                  return (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      title={titles[d]}
                      className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                        density === d
                          ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm"
                          : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                    >{labels[d]}</button>
                  );
                })}
              </div>
              <button
                onClick={() => setRouletteOpen(true)}
                title="Topic Roulette — spin for a random challenge"
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Dices size={15} />
              </button>
              <SoundtrackPlayer />
              <button
                onClick={() => toggleTheme?.()}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={() => setShortcutOpen(true)}
                title="Keyboard shortcuts (?)"
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <HelpCircle size={15} />
              </button>
            </div>

            {/* XP Level Bar */}
            <div className="flex-shrink-0 hidden sm:block">
              <XPLevelBar totalXP={totalXP} events={events} />
            </div>
            {/* Interview countdown chip */}
            <NavCountdownChip />
            {/* Streak badge */}
            <div className="flex-shrink-0 pr-1">
              <motion.div
                key={streak}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  streak >= 3
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : streak >= 1
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
                title={
                  streak === 0
                    ? "Complete a Quick Drill or Practice Mode session to start your streak"
                    : `${streak}-day streak${activatedToday ? " — active today ✓" : " — practice today to keep it going!"}`
                }
              >
                <Flame
                  size={13}
                  className={streak >= 1 ? "text-orange-500" : "text-gray-300"}
                  fill={streak >= 3 ? "currentColor" : "none"}
                />
                <span className="hidden sm:inline">
                  {streak === 0 ? "No streak" : `${streak}-day streak`}
                </span>
                <span className="sm:hidden">{streak > 0 ? streak : "—"}</span>
                {activatedToday && streak > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Active today" />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container py-8 md:py-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* PDF capture target */}
            <div id="pdf-content" className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              {/* PDF header — visible only in PDF via print, hidden on screen */}
              <div className="hidden print:block mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Meta IC6/IC7 Interview Guide</p>
                <h1 className="text-xl font-bold text-gray-900">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h1>
              </div>

              {activeTab === "coding"      && <CodingTab />}
              {activeTab === "mock"        && <MockInterviewSimulator />}
              {activeTab === "ai-round"   && <AIRoundTab />}
              {activeTab === "behavioral" && <BehavioralTab />}
              {activeTab === "timeline"   && <TimelineTab />}
              {activeTab === "ctci"       && <CTCITrackerTab />}
              {activeTab === "readiness"  && <ReadinessTab />}
              {activeTab === "sysdesign"  && <SystemDesignTab />}
              {activeTab === "practice"   && <CodePractice />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <OnboardingModal />
      <KeyboardShortcutOverlay open={shortcutOpen} onClose={() => setShortcutOpen(false)} />

      {/* Topic Roulette Modal */}
      {rouletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRouletteOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-base font-bold text-foreground flex items-center gap-2"><Dices size={16} className="text-violet-500" /> Topic Roulette</div>
                <div className="text-xs text-muted-foreground">Spin for a random challenge across all tabs</div>
              </div>
              <button onClick={() => setRouletteOpen(false)} className="text-muted-foreground hover:text-foreground">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <TopicRoulette
              onSelect={(tabId, _problem, _seg) => {
                handleTabChange(tabId);
                setRouletteOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0d1b2a] text-white/60 text-center py-8 px-4 text-sm mb-16 sm:mb-0">
        <p className="font-semibold text-white/90 mb-1">Meta IC6/IC7 Behavioral &amp; Coding Interview Guide</p>
        <p>Updated March 2026 · Content synthesized from candidate reports, NeetCode, Coditioning, HelloInterview, igotanoffer, and Taro.</p>
      </footer>

      {/* Mobile Bottom Navigation — visible only on small screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-stretch">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const colorMap: Record<string, string> = {
              blue:    "text-blue-600",
              teal:    "text-teal-600",
              amber:   "text-amber-600",
              emerald: "text-emerald-600",
              violet:  "text-violet-600",
              rose:    "text-rose-600",
              slate:   "text-slate-600",
              green:   "text-green-600",
              indigo:  "text-indigo-600",
            };
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-2.5 px-1 gap-1 text-[10px] font-semibold transition-all relative ${
                  isActive
                    ? colorMap[tab.color]
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {isActive && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${
                    tab.color === "blue"    ? "bg-blue-600"    :
                    tab.color === "teal"   ? "bg-teal-600"    :
                    tab.color === "amber"  ? "bg-amber-600"   :
                    tab.color === "violet" ? "bg-violet-600"  :
                    tab.color === "rose"   ? "bg-rose-600"    :
                    tab.color === "green"  ? "bg-green-600"   :
                    tab.color === "indigo" ? "bg-indigo-600"  : "bg-emerald-600"
                  }`} />
                )}
                <span className={isActive ? "" : "opacity-60"}>{tab.icon}</span>
                <span className="leading-none text-center">
                  {tab.id === "coding"     ? "Coding"     :
                   tab.id === "mock"       ? "Mock"       :
                   tab.id === "ai-round"   ? "AI Round"   :
                   tab.id === "behavioral" ? "Behavioral" :
                   tab.id === "ctci"       ? "Tracker"    :
                   tab.id === "readiness"  ? "Readiness"  :
                   tab.id === "sysdesign"  ? "Sys Design" :
                   tab.id === "practice"   ? "Practice"   : "Timeline"}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
