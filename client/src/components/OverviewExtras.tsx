import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Circle,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useDailyChecklist,
  useOnboardingProgress,
  usePatternRatings,
  useBehavioralRatings,
  useInterviewDate,
  useSpacedRepetition,
} from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Daily Study Checklist ─────────────────────────────────────────────────────
function getDailyTasks(
  patternRatings: Record<string, number>,
  bqRatings: Record<string, number>,
  srDue: Record<string, string>
): Array<{ id: string; label: string; priority: "high" | "medium" | "low" }> {
  const tasks: Array<{
    id: string;
    label: string;
    priority: "high" | "medium" | "low";
  }> = [];
  const today = new Date().toISOString().split("T")[0];

  // SR due items
  const dueSR = Object.entries(srDue).filter(([, d]) => d <= today);
  if (dueSR.length > 0) {
    tasks.push({
      id: "sr_review",
      label: `Review ${dueSR.length} spaced-repetition pattern${dueSR.length > 1 ? "s" : ""} due today`,
      priority: "high",
    });
  }

  // Weakest pattern
  const weakPatterns = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) <= 2);
  if (weakPatterns.length > 0) {
    const pick =
      weakPatterns[
        Math.floor(Math.random() * Math.min(3, weakPatterns.length))
      ];
    tasks.push({
      id: `pattern_${pick.id}`,
      label: `Practice "${pick.name}" — rated ${patternRatings[pick.id] ?? 0}★`,
      priority: "high",
    });
  }

  // Behavioral story to polish
  const weakBQ = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) <= 2);
  if (weakBQ.length > 0) {
    const pick = weakBQ[Math.floor(Math.random() * Math.min(3, weakBQ.length))];
    tasks.push({
      id: `bq_${pick.id}`,
      label: `Polish STAR story for: "${pick.q.slice(0, 60)}…"`,
      priority: "medium",
    });
  }

  // Standard daily tasks
  tasks.push(
    {
      id: "daily_ctci",
      label: "Solve 1 CTCI problem (timed, no hints)",
      priority: "medium",
    },
    {
      id: "daily_sd_flash",
      label: "Run 5 System Design flash cards",
      priority: "medium",
    },
    {
      id: "daily_review",
      label: "Review yesterday's mock session notes",
      priority: "low",
    },
    {
      id: "daily_read",
      label: "Read 1 section of the System Design guide",
      priority: "low",
    }
  );

  return tasks.slice(0, 6);
}

export function DailyStudyChecklist() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useDailyChecklist();
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [srDue] = useSpacedRepetition();

  const today = new Date().toISOString().split("T")[0];
  const [tasks] = useState(() =>
    getDailyTasks(patternRatings, bqRatings, srDue)
  );

  // Reset checklist at midnight
  useEffect(() => {
    const lastDate = localStorage.getItem("meta_daily_checklist_date");
    if (lastDate !== today) {
      setChecked({});
      localStorage.setItem("meta_daily_checklist_date", today);
    }
  }, [today, setChecked]);

  const completedCount = tasks.filter(t => checked[t.id]).length;
  const allDone = completedCount === tasks.length;

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));

  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-900" />
          <span className="text-sm font-bold text-foreground">
            Daily Study Checklist
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
              allDone
                ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                : "text-orange-900 bg-orange-500/15 border-orange-500/30"
            }`}
          >
            {completedCount}/{tasks.length} done
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Personalized daily tasks</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-2">
          {allDone && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold text-center">
              🎉 All done for today! Great work. Come back tomorrow for a fresh
              list.
            </div>
          )}
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                checked[task.id]
                  ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                  : task.priority === "high"
                    ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                    : task.priority === "medium"
                      ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                      : "bg-secondary border-border hover:bg-accent"
              }`}
            >
              {checked[task.id] ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <Circle
                  size={16}
                  className={`shrink-0 ${task.priority === "high" ? "text-red-400" : task.priority === "medium" ? "text-amber-900" : "text-muted-foreground"}`}
                />
              )}
              <span
                className={`text-xs flex-1 ${checked[task.id] ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {task.label}
              </span>
              {!checked[task.id] && task.priority === "high" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold shrink-0">
                  PRIORITY
                </span>
              )}
            </button>
          ))}
          <div className="pt-1">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${(completedCount / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Interview Countdown Urgency Mode ─────────────────────────────────────────
const FINAL_SPRINT_TASKS = [
  "Solve 2 CTCI problems per day (timed, no hints)",
  "Run 1 full System Design mock session",
  "Practice 3 behavioral stories out loud",
  "Review your top 5 weakest patterns",
  "Do 1 XFN Surprise Me session",
  "Read the full System Design guide once more",
  "Run all flash cards until 0 SR due",
];

export function UrgencyModeBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (daysLeft > 7 || daysLeft <= 0 || dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/80 to-red-950/80 p-5">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={16}
              className="text-amber-900 animate-bounce"
            />
            <span className="text-sm font-black text-amber-900">
              🚨 FINAL SPRINT MODE — {daysLeft} day{daysLeft !== 1 ? "s" : ""}{" "}
              to go!
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FINAL_SPRINT_TASKS.map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-amber-200"
            >
              <span className="text-amber-500 shrink-0">▶</span>
              {task}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-amber-800/70">
          Focus on high-ROI activities. Quality over quantity. You've got this.
          💪
        </div>
      </div>
    </div>
  );
}

// ── Onboarding Checklist for New Users ────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    id: "set_date",
    label: "Set your interview date in the countdown widget",
    icon: "📅",
    tab: "overview",
    section: "interview-countdown",
    chipLabel: "Go to Countdown",
  },
  {
    id: "rate_patterns",
    label: "Rate at least 3 coding patterns (1–5 stars)",
    icon: "⭐",
    tab: "coding",
    section: "patterns-list",
    chipLabel: "Open Patterns",
  },
  {
    id: "add_story",
    label: "Add your first STAR story in the Story Bank",
    icon: "📖",
    tab: "behavioral",
    section: "behavioral-voice-star",
    chipLabel: "Open Story Bank",
  },
  {
    id: "flash_drill",
    label: "Complete a 5-card System Design flash card drill",
    icon: "🃏",
    tab: "design",
    section: "sysdesign-mock-session",
    chipLabel: "Open Flash Cards",
  },
  {
    id: "run_mock",
    label: "Start your first mock session (Coding, System Design, or XFN)",
    icon: "🎯",
    tab: "coding",
    section: "coding-mock-session",
    chipLabel: "Start Mock",
  },
];

function navigateToSection(tab: string, section: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  url.searchParams.set("section", section);
  window.history.pushState({}, "", url.toString());
  // Dispatch a popstate-like event so Home.tsx picks up the URL change
  window.dispatchEvent(new PopStateEvent("popstate"));
  // After a short delay, scroll to the section
  setTimeout(() => {
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 300);
}

export function OnboardingChecklist() {
  const [progress, setProgress] = useOnboardingProgress();
  const [dismissed, setDismissed] = useState(() => {
    return (
      localStorage.getItem("meta_onboarding_checklist_dismissed") === "true"
    );
  });
  const [patternRatings] = usePatternRatings();
  const dbSynced = useRef(false);

  // Load from DB on mount (for logged-in users) — merges with localStorage
  const { data: dbData } = trpc.onboarding.get.useQuery(undefined, {
    retry: false,
  });
  const saveMutation = trpc.onboarding.save.useMutation();

  useEffect(() => {
    if (dbData && !dbSynced.current) {
      dbSynced.current = true;
      // Merge DB state into localStorage (DB wins for completed steps)
      setProgress(local => {
        const merged: Record<string, boolean> = { ...local };
        for (const [k, v] of Object.entries(dbData.progress)) {
          if (v) merged[k] = true; // only propagate completions, not un-completions
        }
        return merged;
      });
      if (dbData.dismissed) {
        localStorage.setItem("meta_onboarding_checklist_dismissed", "true");
        setDismissed(true);
      }
    }
  }, [dbData, setProgress]);

  // Auto-complete step 2 (rate_patterns) when ≥3 patterns are rated
  useEffect(() => {
    if (progress.rate_patterns) return;
    const ratedCount = Object.values(patternRatings).filter(r => r > 0).length;
    if (ratedCount >= 3) {
      setProgress(p => ({ ...p, rate_patterns: true }));
    }
  }, [patternRatings, progress.rate_patterns, setProgress]);

  // Auto-complete step 5 (run_mock) when any mock history exists
  useEffect(() => {
    if (progress.run_mock) return;
    const hasCodingMock =
      (localStorage.getItem("coding_mock_history_v1") ?? "[]") !== "[]";
    const hasSDMock =
      (localStorage.getItem("sd_mock_history_v1") ?? "[]") !== "[]";
    const hasXFNMock =
      (localStorage.getItem("xfn_mock_history_v1") ?? "[]") !== "[]";
    if (hasCodingMock || hasSDMock || hasXFNMock) {
      setProgress(p => ({ ...p, run_mock: true }));
    }
  }, [progress.run_mock, setProgress]);

  // Sync progress to DB whenever it changes (debounced via useEffect)
  useEffect(() => {
    if (!dbSynced.current) return; // don't save before initial load
    saveMutation.mutate({ progress, dismissed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, dismissed]);

  const completedCount = ONBOARDING_STEPS.filter(s => progress[s.id]).length;
  const allDone = completedCount === ONBOARDING_STEPS.length;
  const celebrationFired = useRef(false);

  // Fire confetti + share toast when all steps complete
  useEffect(() => {
    if (!allDone || celebrationFired.current) return;
    celebrationFired.current = true;
    // Confetti burst
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
    for (let i = 0; i < 100; i++) {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;top:0;left:${Math.random() * 100}vw;width:8px;height:8px;background:${colors[Math.floor(Math.random() * colors.length)]};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};z-index:9999;pointer-events:none;animation:confetti-fall ${1.5 + Math.random()}s ease-in forwards;transform:rotate(${Math.random() * 360}deg);`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
    // Share toast
    const tweetText =
      "I just started my engineering interview prep journey! 🎉 #SoftwareEngineering #FAANG #TechInterviews";
    toast(
      <div className="flex flex-col gap-2">
        <div className="text-sm font-bold text-emerald-400">
          🎉 Onboarding complete!
        </div>
        <div className="text-xs text-muted-foreground">
          You’ve completed all 5 getting-started steps. Time to go deep!
        </div>
        <button
          onClick={() => {
            navigator.clipboard
              .writeText(tweetText)
              .then(() =>
                toast.success("Tweet copied! Open Twitter to share.")
              );
          }}
          className="self-start text-xs px-3 py-1.5 rounded-md bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-colors font-medium"
        >
          📤 Share on Twitter
        </button>
      </div>,
      { duration: 10000 }
    );
    // Auto-dismiss after celebration
    setTimeout(() => {
      localStorage.setItem("meta_onboarding_checklist_dismissed", "true");
      setDismissed(true);
    }, 2000);
  }, [allDone, setDismissed]);

  const handleDismiss = () => {
    localStorage.setItem("meta_onboarding_checklist_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed || allDone) return null;

  return (
    <div className="prep-card p-5 border-blue-500/30 bg-gradient-to-br from-blue-950/30 to-indigo-950/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">👋</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              Welcome! Get started in 5 steps
            </div>
            <div className="text-xs text-muted-foreground">
              {completedCount}/5 complete
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
      <div className="space-y-2">
        {ONBOARDING_STEPS.map(step => (
          <div
            key={step.id}
            className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
              progress[step.id]
                ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                : "bg-secondary border-border"
            }`}
          >
            <button
              onClick={() =>
                setProgress(p => ({ ...p, [step.id]: !p[step.id] }))
              }
              className="flex items-center gap-2 flex-1 text-left min-w-0"
            >
              <span className="text-base shrink-0">{step.icon}</span>
              {progress[step.id] ? (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <Circle size={14} className="text-muted-foreground shrink-0" />
              )}
              <span
                className={`text-xs flex-1 min-w-0 ${progress[step.id] ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {step.label}
              </span>
            </button>
            {!progress[step.id] && (
              <button
                onClick={() => navigateToSection(step.tab, step.section)}
                className="shrink-0 text-[10px] px-2 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 transition-colors font-medium whitespace-nowrap"
              >
                {step.chipLabel} →
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
          style={{
            width: `${(completedCount / ONBOARDING_STEPS.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
