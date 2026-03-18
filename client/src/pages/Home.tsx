// Design: Structured Clarity — sticky tab nav, smooth tab transitions, Space Grotesk headings
// PDF export: each tab content is wrapped in a div with id="pdf-content", captured by usePdfExport
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Cpu, MessageSquare, Calendar, Download, Loader2 } from "lucide-react";
import Hero from "@/components/Hero";
import CodingTab from "@/components/CodingTab";
import AIRoundTab from "@/components/AIRoundTab";
import BehavioralTab from "@/components/BehavioralTab";
import TimelineTab from "@/components/TimelineTab";
import { usePdfExport } from "@/hooks/usePdfExport";

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

const PDF_FILENAMES: Record<string, string> = {
  coding:      "Meta-IC6-IC7_Coding-Interview-Guide.pdf",
  "ai-round":  "Meta-IC6-IC7_AI-Enabled-Round-Guide.pdf",
  behavioral:  "Meta-IC6-IC7_Behavioral-Interview-Guide.pdf",
  timeline:    "Meta-IC6-IC7_Study-Timeline.pdf",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("coding");
  const [direction, setDirection]  = useState(1);
  const { exportToPdf, exporting } = usePdfExport();

  const currentIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleTabChange = (id: string) => {
    const newIndex = TABS.findIndex((t) => t.id === id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(id);
  };

  const handleDownload = () => {
    exportToPdf("pdf-content", PDF_FILENAMES[activeTab] ?? "Meta-Interview-Guide.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between gap-2">
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

            {/* PDF Download button */}
            <div className="flex-shrink-0 pl-2 pr-1 border-l border-gray-100 ml-1" data-pdf-hide>
              <button
                onClick={handleDownload}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md whitespace-nowrap"
              >
                {exporting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span className="hidden sm:inline">Generating…</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span className="hidden sm:inline">Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content — wrapped in #pdf-content for capture */}
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
