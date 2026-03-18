// Design: Structured Clarity — sticky tab nav, smooth tab transitions, Space Grotesk headings
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Cpu, MessageSquare, Calendar } from "lucide-react";
import Hero from "@/components/Hero";
import CodingTab from "@/components/CodingTab";
import AIRoundTab from "@/components/AIRoundTab";
import BehavioralTab from "@/components/BehavioralTab";
import TimelineTab from "@/components/TimelineTab";

const TABS = [
  { id: "coding",     label: "Coding Interview",    icon: <Code2 size={15} />,       color: "blue"   },
  { id: "ai-round",  label: "AI-Enabled Round",     icon: <Cpu size={15} />,         color: "teal"   },
  { id: "behavioral",label: "Behavioral Interview", icon: <MessageSquare size={15} />, color: "amber" },
  { id: "timeline",  label: "Study Timeline",       icon: <Calendar size={15} />,    color: "emerald"},
];

const ACTIVE_COLORS: Record<string, string> = {
  blue:    "text-blue-600 border-blue-600",
  teal:    "text-teal-600 border-teal-600",
  amber:   "text-amber-600 border-amber-600",
  emerald: "text-emerald-600 border-emerald-600",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("coding");
  const [direction, setDirection] = useState(1);

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleTabChange = (id: string) => {
    const newIndex = TABS.findIndex((t) => t.id === id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(id);
  };

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container">
          <div className="flex overflow-x-auto scrollbar-hide">
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
            {activeTab === "coding"     && <CodingTab />}
            {activeTab === "ai-round"  && <AIRoundTab />}
            {activeTab === "behavioral" && <BehavioralTab />}
            {activeTab === "timeline"  && <TimelineTab />}
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
