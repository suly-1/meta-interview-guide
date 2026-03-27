// Design: Bold Engineering Dashboard — large stat numbers, fire streak, progress bar
import {
  useStreak,
  usePatternRatings,
  useBehavioralRatings,
  useMockHistory,
  useInterviewDate,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import {
  Flame,
  Target,
  Brain,
  Calendar,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface HeroSectionProps {
  onTabChange: (tab: string) => void;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const MATURITY_LEVEL_COLORS: Record<string, string> = {
  Traditionalist: "#6b7280",
  "AI Aware": "#3b82f6",
  "AI Enabled": "#8b5cf6",
  "AI First": "#a855f7",
  "AI Native": "#7c3aed",
};

const MATURITY_LEVEL_INDICES = [
  "Traditionalist",
  "AI Aware",
  "AI Enabled",
  "AI First",
  "AI Native",
];

export default function HeroSection({ onTabChange }: HeroSectionProps) {
  const streak = useStreak();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const [interviewDate] = useInterviewDate();
  const { data: maturityLevel } =
    trpc.aiNativeHistory.getMaturityLevel.useQuery();

  const masteredPatterns = PATTERNS.filter(
    p => (patternRatings[p.id] ?? 0) >= 4
  ).length;
  const readyStories = BEHAVIORAL_QUESTIONS.filter(
    q => (bqRatings[q.id] ?? 0) >= 4
  ).length;
  const avgMock = mockHistory.length
    ? (
        mockHistory.reduce((s, m) => s + m.avgScore, 0) / mockHistory.length
      ).toFixed(1)
    : "—";

  const overallPct = Math.round(
    ((masteredPatterns / PATTERNS.length) * 0.6 +
      (readyStories / BEHAVIORAL_QUESTIONS.length) * 0.4) *
      100
  );

  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;

  return (
    <div className="border-b border-border bg-gradient-to-b from-secondary/30 to-background py-8 mb-6">
      <div className="container">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-foreground mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Screen Interview Guide
            </h1>
            <p className="text-sm text-muted-foreground">
              L6 (Staff) &amp; L7 (Senior Staff) — Coding · System Design ·
              Behavioral
            </p>
          </div>
          {/* Streak hero badge */}
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
              streak.currentStreak > 0
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-secondary border-border"
            }`}
          >
            <Flame
              size={24}
              className={
                streak.currentStreak > 0
                  ? "text-orange-400"
                  : "text-muted-foreground"
              }
            />
            <div>
              <div
                className="text-2xl font-extrabold leading-none"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color:
                    streak.currentStreak > 0
                      ? "oklch(0.85 0.15 45)"
                      : undefined,
                }}
              >
                {streak.currentStreak}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {streak.currentStreak === 1 ? "day streak" : "day streak"}
                {streak.longestStreak > 0 && ` · best ${streak.longestStreak}`}
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Readiness
            </span>
            <span
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {overallPct}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Weighted: 60% coding patterns + 40% behavioral stories
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Patterns mastered */}
          <button
            onClick={() => onTabChange("coding")}
            className="prep-card p-4 text-left hover:border-blue-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-blue-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Patterns
              </span>
            </div>
            <div className="stat-num text-2xl text-foreground group-hover:text-blue-400 transition-colors">
              {masteredPatterns}
              <span className="text-sm font-normal text-muted-foreground">
                /{PATTERNS.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              mastered (★4–5)
            </div>
          </button>

          {/* Stories ready */}
          <button
            onClick={() => onTabChange("behavioral")}
            className="prep-card p-4 text-left hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-purple-400" />
              <span className="text-xs text-muted-foreground font-medium">
                STAR Stories
              </span>
            </div>
            <div className="stat-num text-2xl text-foreground group-hover:text-purple-400 transition-colors">
              {readyStories}
              <span className="text-sm font-normal text-muted-foreground">
                /{BEHAVIORAL_QUESTIONS.length}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ready (★4–5)
            </div>
          </button>

          {/* Mock average */}
          <button
            onClick={() => onTabChange("behavioral")}
            className="prep-card p-4 text-left hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Mock Avg
              </span>
            </div>
            <div className="stat-num text-2xl text-foreground group-hover:text-emerald-400 transition-colors">
              {avgMock}
              {avgMock !== "—" && (
                <span className="text-sm font-normal text-muted-foreground">
                  /5
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {mockHistory.length} session{mockHistory.length !== 1 ? "s" : ""}
            </div>
          </button>

          {/* Interview countdown */}
          <button
            onClick={() => onTabChange("overview")}
            className={`prep-card p-4 text-left transition-all group ${
              daysLeft !== null && daysLeft <= 7
                ? "hover:border-red-500/40"
                : "hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar
                size={14}
                className={
                  daysLeft !== null && daysLeft <= 7
                    ? "text-red-400"
                    : "text-amber-400"
                }
              />
              <span className="text-xs text-muted-foreground font-medium">
                Interview
              </span>
            </div>
            <div
              className={`stat-num text-2xl transition-colors ${
                daysLeft === null
                  ? "text-muted-foreground"
                  : daysLeft <= 7
                    ? "text-red-400"
                    : "text-amber-400"
              }`}
            >
              {daysLeft === null
                ? "—"
                : daysLeft === 0
                  ? "Today!"
                  : `${daysLeft}d`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {daysLeft === null
                ? "set a date"
                : daysLeft === 0
                  ? "Good luck!"
                  : "remaining"}
            </div>
          </button>
        </div>

        {/* AI-Native Level badge — shown only after MaturitySelfClassifier is completed */}
        {maturityLevel && (
          <button
            onClick={() => onTabChange("ai-native")}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:opacity-90"
            style={{
              borderColor: `${MATURITY_LEVEL_COLORS[maturityLevel.level] ?? "#7c3aed"}40`,
              background: `${MATURITY_LEVEL_COLORS[maturityLevel.level] ?? "#7c3aed"}08`,
            }}
          >
            <Sparkles
              size={16}
              style={{
                color: MATURITY_LEVEL_COLORS[maturityLevel.level] ?? "#7c3aed",
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold"
                  style={{
                    color:
                      MATURITY_LEVEL_COLORS[maturityLevel.level] ?? "#7c3aed",
                  }}
                >
                  ✦ AI-Native Level: {maturityLevel.level}
                </span>
                <span className="text-xs text-muted-foreground">
                  · tap to continue training
                </span>
              </div>
              {/* 5-step progress pip bar */}
              <div className="flex gap-1 mt-1.5">
                {MATURITY_LEVEL_INDICES.map((lvl, i) => (
                  <div
                    key={lvl}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      background:
                        i <= maturityLevel.levelIndex
                          ? (MATURITY_LEVEL_COLORS[maturityLevel.level] ??
                            "#7c3aed")
                          : "rgba(139,92,246,0.15)",
                    }}
                  />
                ))}
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
