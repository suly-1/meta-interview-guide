// Design: Structured Clarity — sticky tab nav, smooth tab transitions, Space Grotesk headings
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Cpu, MessageSquare, Calendar, Flame } from "lucide-react";
import Hero from "@/components/Hero";
import CodingTab from "@/components/CodingTab";
import AIRoundTab from "@/components/AIRoundTab";
import BehavioralTab from "@/components/BehavioralTab";
import TimelineTab from "@/components/TimelineTab";
import { useStreak } from "@/hooks/useStreak";

const TABS = [
  { id: "coding",      label: "Coding Interview",    icon: <Code2 size={15} />,        color: "blue"    },
  { id: "ai-round",   label: "AI-Enabled Round",     icon: <Cpu size={15} />,          color: "teal"    },
  { id: "behavioral", label: "Behavioral Interview", icon: <MessageSquare size={15} />, color: "amber"  },
  { id: "timeline",   label: "Study Timeline",       icon: <Calendar size={15} />,     color: "emerald" },
];

const ACTIVE_COLORS: Record<string, string> = {
  blue:    "text-blue-600 border-blue-600",
  teal:    "text-teal-600 border-teal-600",
  amber:   "text-amber-600 border-amber-600",
  emerald: "text-emerald-600 border-emerald-600",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("coding");
  const [direction, setDirection]  = useState(1);
  const { streak, activatedToday } = useStreak();

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleTabChange = (id: string) => {
    const newIndex = TABS.findIndex((t) => t.id === id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
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
                        : "text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className={isActive ? "" : "opacity-60"}>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Streak badge */}
            <div className="flex-shrink-0 pl-2 pr-1 border-l border-gray-100">
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
            <div id="pdf-content" className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              {/* PDF header — visible only in PDF via print, hidden on screen */}
              <div className="hidden print:block mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Meta IC6/IC7 Interview Guide</p>
                <h1 className="text-xl font-bold text-gray-900">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </h1>
              </div>

              {activeTab === "coding"      && <CodingTab />}
              {activeTab === "ai-round"   && <AIRoundTab />}
              {activeTab === "behavioral" && <BehavioralTab />}
              {activeTab === "timeline"   && <TimelineTab />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1b2a] text-white/60 text-center py-8 px-4 text-sm">
        <p className="font-semibold text-white/90 mb-1">Meta IC6/IC7 Behavioral &amp; Coding Interview Guide</p>
        <p>Updated March 2026 · Content synthesized from candidate reports, NeetCode, Coditioning, HelloInterview, igotanoffer, and Taro.</p>
      </footer>
    </div>
  );
}
