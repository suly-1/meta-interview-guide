// Design: Bold Engineering Dashboard — dark charcoal, Space Grotesk, blue accent
import { Sun, Moon, BookOpen, Leaf } from "lucide-react";
import { useStreak } from "@/hooks/useLocalStorage";

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "coding", label: "Coding" },
  { id: "behavioral", label: "Behavioral" },
  { id: "design", label: "System Design" },
  { id: "ai-coding", label: "🤖 AI Mock" },
];

// Site identity — injected at build time via VITE_SITE_ID
const SITE_ID = import.meta.env.VITE_SITE_ID ?? "metaengguide-pro";
const IS_METAGUIDE_BLOG = SITE_ID === "metaguide-blog";

// metaengguide.pro  → deep blue badge, "MEG" monogram, "L6/L7" tag
// metaguide.blog    → warm green badge, leaf icon, "L4–L7" tag
const LOGO_BG = IS_METAGUIDE_BLOG ? "bg-emerald-600" : "bg-blue-500";
const LOGO_ICON = IS_METAGUIDE_BLOG ? (
  <Leaf size={14} className="text-white" />
) : (
  <BookOpen size={14} className="text-white" />
);
const WORDMARK = IS_METAGUIDE_BLOG ? "Staff Eng Prep" : "Meta Prep";
const BADGE_TEXT = IS_METAGUIDE_BLOG ? "L4–L7" : "L6/L7";
const BADGE_CLS = IS_METAGUIDE_BLOG ? "badge-green" : "badge-blue";
const ACTIVE_TAB_CLS = IS_METAGUIDE_BLOG
  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
  : "bg-blue-500/15 text-blue-400 border border-blue-500/30";

export default function TopNav({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDark,
}: TopNavProps) {
  const streak = useStreak();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className={`w-7 h-7 rounded-lg ${LOGO_BG} flex items-center justify-center`}
            >
              {LOGO_ICON}
            </div>
            <span
              className="font-bold text-sm text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {WORDMARK}
            </span>
            <span className={`badge ${BADGE_CLS} hidden sm:inline-flex`}>
              {BADGE_TEXT}
            </span>
          </div>

          {/* Tabs — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? ACTIVE_TAB_CLS
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right: streak + dark toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Streak */}
            <div
              className={`streak-badge text-sm ${streak.currentStreak === 0 ? "broken" : ""}`}
              title={`Longest streak: ${streak.longestStreak} days`}
            >
              <span>{streak.currentStreak > 0 ? "🔥" : "💤"}</span>
              <span>{streak.currentStreak}d</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              data-testid="dark-mode-toggle"
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? ACTIVE_TAB_CLS
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
