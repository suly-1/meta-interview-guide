import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Cpu, MessageSquare, Calendar, Flame, Sun, Moon,
  ListChecks, BarChart2, Layers, ClipboardList, Terminal,
  HelpCircle, Dices, Sword, TrendingUp, Bookmark, Search, Wrench,
  LayoutDashboard, Trophy, Shield, ShieldCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getAdminToken } from "@/lib/adminToken";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { emitKeyEvent } from "@/lib/keyEvents";
import OnboardingModal from "@/components/OnboardingModal";
import OnboardingTour, { useOnboardingTour } from "@/components/OnboardingTour";
import SiteFeedbackModal from "@/components/SiteFeedbackModal";
import { useDensity, type Density } from "@/contexts/DensityContext";
import Hero from "@/components/Hero";
import ArchitectPicks from "@/components/ArchitectPicks";
import { useStreak } from "@/hooks/useStreak";
import XPLevelBar from "@/components/XPLevelBar";
import NavCountdownChip from "@/components/NavCountdownChip";
import { useXPContext } from "@/contexts/useXPContext";
import { useKeyboardShortcutOverlay } from "@/components/KeyboardShortcutOverlay";
import { FocusModeProvider, FocusModeToggle, useFocusMode } from "@/components/FocusMode";
import MilestoneNotifications from "@/components/MilestoneNotifications";
import type { GauntletState } from "@/components/GauntletMode";
import TabSkeleton from "@/components/TabSkeleton";

// Heavy tab components — lazy loaded to keep initial bundle small
const CodingTab = lazy(() => import("@/components/CodingTab"));
const AIRoundTab = lazy(() => import("@/components/AIRoundTab"));
const BehavioralTab = lazy(() => import("@/components/BehavioralTab"));
const TimelineTab = lazy(() => import("@/components/TimelineTab"));
const CTCITrackerTab = lazy(() => import("@/components/CTCITrackerTab"));
const ReadinessTab = lazy(() => import("@/components/ReadinessTab"));
const SystemDesignTab = lazy(() => import("@/components/SystemDesignTab"));
const MockInterviewSimulator = lazy(() => import("@/components/MockInterviewSimulator"));
const CodePractice = lazy(() => import("@/pages/CodePractice"));
const SoundtrackPlayer = lazy(() => import("@/components/SoundtrackPlayer"));
const TopicRoulette = lazy(() => import("@/components/TopicRoulette"));
const KeyboardShortcutOverlay = lazy(() => import("@/components/KeyboardShortcutOverlay").then(m => ({ default: m.KeyboardShortcutOverlay })));
const GauntletMode = lazy(() => import("@/components/GauntletMode"));
const ProgressDashboard = lazy(() => import("@/components/ProgressDashboard"));
const BookmarksPanel = lazy(() => import("@/components/BookmarksPanel"));
const GlobalSearch = lazy(() => import("@/components/GlobalSearch"));
const AIToolsTab = lazy(() => import("@/components/AIToolsTab"));
const OverviewTab = lazy(() => import("@/components/OverviewTab"));
const Leaderboard = lazy(() => import("@/components/Leaderboard"));
const DeployStatusBadge = lazy(() => import("@/components/DeployStatusBadge"));

// ── Tab Groups ─────────────────────────────────────────────────────────────────
// Tabs are split into two rows for better visibility:
//   Row 1 (primary): The most-used practice tabs — large, colourful, icon + label
//   Row 2 (secondary): Supporting tabs — slightly smaller but still prominent

const PRIMARY_TABS = [
  {
    id: "coding",
    label: "Coding Interview",
    shortLabel: "Coding",
    icon: <Code2 size={18} />,
    color: "blue",
    emoji: "💻",
    description: "Simulator + patterns",
  },
  {
    id: "practice",
    label: "Code Practice",
    shortLabel: "Practice",
    icon: <Terminal size={18} />,
    color: "green",
    emoji: "⌨️",
    description: "LeetCode problems",
  },
  {
    id: "mock",
    label: "Mock Interview",
    shortLabel: "Mock",
    icon: <ClipboardList size={18} />,
    color: "indigo",
    emoji: "🎯",
    description: "Full simulation",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    shortLabel: "Behavioral",
    icon: <MessageSquare size={18} />,
    color: "amber",
    emoji: "🗣️",
    description: "STAR framework",
  },
  {
    id: "ctci",
    label: "Practice Tracker",
    shortLabel: "Tracker",
    icon: <ListChecks size={18} />,
    color: "violet",
    emoji: "📋",
    description: "CTCI progress",
  },
];

const SECONDARY_TABS = [
  {
    id: "ai-round",
    label: "AI-Enabled Round",
    shortLabel: "AI Round",
    icon: <Cpu size={15} />,
    color: "teal",
    emoji: "🤖",
  },
  {
    id: "timeline",
    label: "Study Timeline",
    shortLabel: "Timeline",
    icon: <Calendar size={15} />,
    color: "emerald",
    emoji: "📅",
  },
  {
    id: "readiness",
    label: "Readiness",
    shortLabel: "Readiness",
    icon: <BarChart2 size={15} />,
    color: "rose",
    emoji: "📊",
  },
  {
    id: "sysdesign",
    label: "System Design",
    shortLabel: "Sys Design",
    icon: <Layers size={15} />,
    color: "slate",
    emoji: "🏗️",
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    shortLabel: "AI Tools",
    icon: <Wrench size={15} />,
    color: "violet",
    emoji: "🛠️",
  },
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    icon: <LayoutDashboard size={15} />,
    color: "sky",
    emoji: "📌",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    shortLabel: "Leaderboard",
    icon: <Trophy size={15} />,
    color: "yellow",
    emoji: "🏆",
  },
];

// Flat list for keyboard shortcut indexing
const ALL_TABS = [...PRIMARY_TABS, ...SECONDARY_TABS];

const PRIMARY_ACTIVE: Record<string, string> = {
  blue:   "bg-blue-600 text-white border-blue-600 shadow-blue-200 dark:shadow-blue-900/40",
  green:  "bg-green-600 text-white border-green-600 shadow-green-200 dark:shadow-green-900/40",
  indigo: "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/40",
  amber:  "bg-amber-500 text-white border-amber-500 shadow-amber-200 dark:shadow-amber-900/40",
  violet: "bg-violet-600 text-white border-violet-600 shadow-violet-200 dark:shadow-violet-900/40",
};

const SECONDARY_ACTIVE: Record<string, string> = {
  teal:    "text-teal-600 border-teal-500 bg-teal-50 dark:bg-teal-900/20",
  emerald: "text-emerald-600 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  rose:    "text-rose-600 border-rose-500 bg-rose-50 dark:bg-rose-900/20",
  slate:   "text-slate-600 border-slate-500 bg-slate-50 dark:bg-slate-900/20",
  violet:  "text-violet-600 border-violet-500 bg-violet-50 dark:bg-violet-900/20",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("coding");
  const { shouldShow: showTour, dismiss: dismissTour } = useOnboardingTour();
  const [direction, setDirection] = useState(1);
  const { streak, activatedToday } = useStreak();
  const { totalXP, events } = useXPContext();
  const { theme, toggleTheme } = useTheme();
  const { density, setDensity } = useDensity();
  const isDark = theme === "dark";
  const { open: shortcutOpen, setOpen: setShortcutOpen } = useKeyboardShortcutOverlay();
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";

  // ── Admin badge: poll feedback stats every 5 minutes ────────────────────
  const { data: adminStats } = trpc.feedback.adminStats.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000,
  });
  const adminNewCount = adminStats?.newCount ?? 0;

  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Gauntlet Mode state ──────────────────────────────────────────────────
  const GAUNTLET_CHALLENGES = ["ctci","coding","ai-round","behavioral","timeline","readiness","sysdesign"];
  const CHALLENGE_LABELS: Record<string,string> = {
    ctci: "Practice Tracker", coding: "Coding Interview", "ai-round": "AI-Enabled Round",
    behavioral: "Behavioral Interview", timeline: "Study Timeline",
    readiness: "Readiness", sysdesign: "System Design",
  };
  const CHALLENGE_EMOJIS: Record<string,string> = {
    ctci: "📋", coding: "💻", "ai-round": "🤖", behavioral: "🗣️",
    timeline: "📅", readiness: "📊", sysdesign: "🏗️",
  };
  const GAUNTLET_HISTORY_KEY = "gauntlet_history";
  const GAUNTLET_BADGE_KEY = "gauntlet_cleared_badge";

  const emptyGauntlet = (): GauntletState => ({
    active: false, currentIdx: 0, rounds: [], done: false, failed: false, startTime: 0, totalSec: 0,
  });
  const [gauntlet, setGauntlet] = useState<GauntletState>(emptyGauntlet);
  const [gauntletOpen, setGauntletOpen] = useState(false);

  const startGauntlet = () => {
    setGauntlet({ active: true, currentIdx: 0, rounds: [], done: false, failed: false, startTime: Date.now(), totalSec: 0 });
    setGauntletOpen(true);
  };

  const advanceGauntlet = (completed: boolean) => {
    setGauntlet(g => {
      const elapsed = Math.round((Date.now() - g.startTime) / 1000);
      const newRound = {
        tabId: GAUNTLET_CHALLENGES[g.currentIdx] as any,
        tabLabel: CHALLENGE_LABELS[GAUNTLET_CHALLENGES[g.currentIdx]],
        emoji: CHALLENGE_EMOJIS[GAUNTLET_CHALLENGES[g.currentIdx]],
        completed, failed: !completed, timeSec: elapsed,
      };
      const newRounds = [...g.rounds, newRound];
      if (!completed) {
        const rec = { id: Date.now().toString(), date: Date.now(), cleared: false, failedAt: newRound.tabLabel, totalSec: elapsed };
        const hist = JSON.parse(localStorage.getItem(GAUNTLET_HISTORY_KEY) ?? "[]");
        localStorage.setItem(GAUNTLET_HISTORY_KEY, JSON.stringify([rec, ...hist].slice(0, 20)));
        return { ...g, active: false, failed: true, rounds: newRounds, totalSec: elapsed };
      }
      const nextIdx = g.currentIdx + 1;
      if (nextIdx >= GAUNTLET_CHALLENGES.length) {
        localStorage.setItem(GAUNTLET_BADGE_KEY, "true");
        const rec = { id: Date.now().toString(), date: Date.now(), cleared: true, totalSec: elapsed };
        const hist = JSON.parse(localStorage.getItem(GAUNTLET_HISTORY_KEY) ?? "[]");
        localStorage.setItem(GAUNTLET_HISTORY_KEY, JSON.stringify([rec, ...hist].slice(0, 20)));
        return { ...g, active: false, done: true, rounds: newRounds, totalSec: elapsed };
      }
      return { ...g, currentIdx: nextIdx, rounds: newRounds };
    });
  };

  const stopGauntlet = () => setGauntlet(emptyGauntlet());

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTabSwitch: (i) => {
      const tab = ALL_TABS[i];
      if (tab) handleTabChange(tab.id);
    },
    onTimerToggle: () => emitKeyEvent("timer:toggle"),
    onReveal:      () => emitKeyEvent("drill:reveal"),
  });

  const currentIndex = ALL_TABS.findIndex((t) => t.id === activeTab);

  const handleTabChange = (id: string) => {
    const newIndex = ALL_TABS.findIndex((t) => t.id === id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(id);
  };

  const { isFocused } = useFocusMode();

  const isPrimary = (id: string) => PRIMARY_TABS.some(t => t.id === id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
       {!isFocused && <Hero />}
      {!isFocused && <ArchitectPicks onTabChange={handleTabChange} />}
      {/* ── Sticky Navigation ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-md">

        {/* ── Top utility bar ─────────────────────────────────────────────── */}
        <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
          <div className="container">
            <div className="flex items-center justify-between h-10 gap-2">
              {/* Left: app title */}
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 hidden sm:block tracking-wide uppercase">
                Independent Study Guide
              </span>

              {/* Right: utility buttons */}
              <div className="flex items-center gap-0.5 ml-auto">
                {/* Density toggle */}
                <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 gap-0.5 mr-1" title="Font size / density">
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

                {/* Gauntlet */}
                <button
                  onClick={() => setGauntletOpen(true)}
                  title={gauntlet.active ? "Gauntlet in progress" : "Gauntlet Mode — 7-tab unbroken run"}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                    gauntlet.active
                      ? "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse"
                      : "text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Sword size={14} />
                </button>

                {/* Roulette */}
                <button
                  onClick={() => setRouletteOpen(true)}
                  title="Topic Roulette — spin for a random challenge"
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Dices size={14} />
                </button>

                {/* Soundtrack */}
                <span className="hidden sm:contents"><Suspense fallback={null}><SoundtrackPlayer /></Suspense></span>

                {/* Search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  title="Search (Ctrl+K)"
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Search size={14} />
                </button>

                {/* Bookmarks */}
                <button
                  onClick={() => setBookmarksOpen(true)}
                  title="Bookmarks"
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Bookmark size={14} />
                </button>

                {/* Progress */}
                <button
                  onClick={() => setProgressOpen(true)}
                  title="Progress Dashboard"
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <TrendingUp size={14} />
                </button>

                {/* Dark mode */}
                <button
                  onClick={() => toggleTheme?.()}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {/* Focus mode */}
                <FocusModeToggle />

                {/* Shortcuts */}
                <button
                  onClick={() => setShortcutOpen(true)}
                  title="Keyboard shortcuts (?)"
                  className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <HelpCircle size={14} />
                </button>

                {/* XP bar */}
                <div className="hidden md:block ml-1">
                  <XPLevelBar totalXP={totalXP} events={events} />
                </div>

                {/* Interview countdown */}
                <NavCountdownChip />

                {/* Streak badge */}
                <motion.div
                  key={streak}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ml-1 ${
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
                    size={12}
                    className={streak >= 1 ? "text-orange-500" : "text-gray-300"}
                    fill={streak >= 3 ? "currentColor" : "none"}
                  />
                  <span className="hidden sm:inline">
                    {streak === 0 ? "No streak" : `${streak}d`}
                  </span>
                  <span className="sm:hidden">{streak > 0 ? streak : "—"}</span>
                  {activatedToday && streak > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Active today" />
                  )}
                </motion.div>
                {/* Admin button — always visible, includes token in href for one-click access */}
                {(() => {
                  const tok = getAdminToken();
                  const adminHref = tok ? `/admin/feedback?key=${encodeURIComponent(tok)}` : "/admin/feedback";
                  return (
                    <a
                      href={adminHref}
                      title="Admin Panel"
                      className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ml-1 bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/50 transition-all"
                    >
                      <ShieldCheck size={12} />
                      <span className="hidden sm:inline">Admin</span>
                      {isAdmin && adminNewCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {adminNewCount > 9 ? "9+" : adminNewCount}
                        </span>
                      )}
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Primary Tab Row ─────────────────────────────────────────────── */}
        <div className="container">
          <div className="flex items-stretch gap-1 pt-2 pb-0 overflow-x-auto scrollbar-hide">
            {PRIMARY_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    group flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-t-xl
                    text-sm font-bold border-2 border-b-0 whitespace-nowrap transition-all flex-shrink-0
                    min-w-[100px] shadow-sm
                    ${isActive
                      ? PRIMARY_ACTIVE[tab.color] + " shadow-md"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </div>
                  <span className={`text-[10px] font-normal hidden sm:block ${isActive ? "opacity-80" : "opacity-50 group-hover:opacity-70"}`}>
                    {tab.description}
                  </span>
                </button>
              );
            })}

            {/* Spacer */}
            <div className="flex-1" />
          </div>
        </div>

        {/* ── Secondary Tab Row ────────────────────────────────────────────── */}
        <div className="container border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-1">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mr-2 shrink-0 hidden sm:block">
              More:
            </span>
            {SECONDARY_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    border whitespace-nowrap transition-all flex-shrink-0
                    ${isActive
                      ? SECONDARY_ACTIVE[tab.color] + " border-current"
                      : "bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                    }
                  `}
                >
                  <span className={isActive ? "opacity-100" : "opacity-60"}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div className="container py-6 md:py-8">
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
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Independent Study Guide</p>
                <h1 className="text-xl font-bold text-gray-900">
                  {ALL_TABS.find((t) => t.id === activeTab)?.label}
                </h1>
              </div>

              <Suspense fallback={<TabSkeleton tabId={activeTab} />}>
                {activeTab === "coding"      && <CodingTab />}
                {activeTab === "mock"        && <MockInterviewSimulator />}
                {activeTab === "ai-round"    && <AIRoundTab />}
                {activeTab === "behavioral"  && <BehavioralTab />}
                {activeTab === "timeline"    && <TimelineTab />}
                {activeTab === "ctci"        && <CTCITrackerTab />}
                {activeTab === "readiness"   && <ReadinessTab />}
                {activeTab === "sysdesign"   && <SystemDesignTab />}
                {activeTab === "practice"    && <CodePractice />}
                {activeTab === "ai-tools"    && <AIToolsTab />}
                {activeTab === "overview"    && <OverviewTab onTabChange={handleTabChange} />}
                {activeTab === "leaderboard" && <Leaderboard />}
              </Suspense>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <OnboardingModal />
      {showTour && (
        <OnboardingTour
          onComplete={(goToReadiness) => {
            dismissTour();
            if (goToReadiness) setActiveTab("readiness");
          }}
        />
      )}
      <Suspense fallback={null}><KeyboardShortcutOverlay open={shortcutOpen} onClose={() => setShortcutOpen(false)} /></Suspense>

      {/* Gauntlet Mode Modal */}
      {gauntletOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setGauntletOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-base font-bold text-foreground flex items-center gap-2"><Sword size={16} className="text-orange-500" /> Gauntlet Mode</div>
                <div className="text-xs text-muted-foreground">7-tab unbroken challenge run</div>
              </div>
              <button onClick={() => setGauntletOpen(false)} className="text-muted-foreground hover:text-foreground">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}><GauntletMode
              gauntlet={gauntlet}
              onStart={startGauntlet}
              onAdvance={advanceGauntlet}
              onStop={() => { stopGauntlet(); setGauntletOpen(false); }}
              onNavigateTab={(tabId) => { handleTabChange(tabId); setGauntletOpen(false); }}
            /></Suspense>
          </div>
        </div>
      )}

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
            <Suspense fallback={null}><TopicRoulette
              onSelect={(tabId, _problem, _seg) => {
                handleTabChange(tabId);
                setRouletteOpen(false);
              }}
            /></Suspense>
          </div>
        </div>
      )}

      {/* Progress Dashboard */}
      <Suspense fallback={null}><ProgressDashboard
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        onRetrySession={(problemIds) => {
          // Navigate to coding tab — the simulator will pick up the retry via localStorage
          handleTabChange("coding");
          setProgressOpen(false);
        }}
      /></Suspense>

      {/* Bookmarks Panel */}
      <Suspense fallback={null}><BookmarksPanel open={bookmarksOpen} onClose={() => setBookmarksOpen(false)} onNavigate={(tabId) => handleTabChange(tabId)} /></Suspense>

      {/* Global Search */}
      <Suspense fallback={null}><GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(tabId) => {
          if (tabId === "__open_search__") { setSearchOpen(true); return; }
          handleTabChange(tabId);
        }}
      /></Suspense>

      {/* Footer */}
      <SiteFeedbackModal currentPage={activeTab} />
      <footer className="bg-[#0d1b2a] text-white/60 text-center py-8 px-4 text-sm mb-16 sm:mb-0">
        <p className="font-semibold text-white/90 mb-1">Independent Study Guide</p>
        <p className="text-white/40 text-xs mb-1">Designed by <span className="text-blue-400 font-semibold">The Architect</span> · Not affiliated with any company</p>
        <p>Updated March 2026 · Content synthesized from candidate reports, NeetCode, Coditioning, HelloInterview, igotanoffer, and Taro.</p>
        <p className="mt-2 text-white/40 text-xs max-w-xl mx-auto">
          This is a community guide for self-directed learners. If you're a recruiter or hiring manager thinking about sharing it — totally your call, but it's worth checking your company's guidelines on external resources first. This guide works best when candidates discover it on their own anyway.
        </p>
        {/* Live deployment status badge */}
        <div className="mt-3 flex justify-center">
          <Suspense fallback={null}><DeployStatusBadge /></Suspense>
        </div>
        <p className="mt-2 flex items-center justify-center gap-4">
          <button
            onClick={() => {
              try { localStorage.removeItem("meta-guide-banner-dismissed-v1"); } catch { /* ignore */ }
              window.location.reload();
            }}
            className="text-white/30 hover:text-white/70 text-xs underline underline-offset-2 transition-colors"
          >
            Show disclaimer again
          </button>
          <span className="text-white/20">·</span>
          <a
            href="#/terms"
            className="text-white/30 hover:text-white/70 text-xs underline underline-offset-2 transition-colors"
          >
            Terms of Use
          </a>
        </p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-stretch overflow-x-auto scrollbar-hide">
          {[...PRIMARY_TABS, ...SECONDARY_TABS].map((tab) => {
            const isActive = tab.id === activeTab;
            const colorMap: Record<string, string> = {
              blue: "text-blue-600", green: "text-green-600", indigo: "text-indigo-600",
              amber: "text-amber-500", violet: "text-violet-600",
              teal: "text-teal-600", emerald: "text-emerald-600", rose: "text-rose-600", slate: "text-slate-600",
            };
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-shrink-0 w-16 py-2 gap-0.5 text-[9px] font-semibold transition-all relative ${
                  isActive ? colorMap[tab.color] : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {isActive && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${
                    tab.color === "blue"    ? "bg-blue-600"    :
                    tab.color === "green"   ? "bg-green-600"   :
                    tab.color === "indigo"  ? "bg-indigo-600"  :
                    tab.color === "amber"   ? "bg-amber-500"   :
                    tab.color === "violet"  ? "bg-violet-600"  :
                    tab.color === "teal"    ? "bg-teal-600"    :
                    tab.color === "emerald" ? "bg-emerald-600" :
                    tab.color === "rose"    ? "bg-rose-600"    : "bg-slate-600"
                  }`} />
                )}
                <span className={`text-base leading-none ${isActive ? "" : "opacity-50"}`}>{tab.emoji}</span>
                <span className="leading-none text-center">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
