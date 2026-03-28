/**
 * InviteGate
 *
 * Full-screen gate shown before any site content. Visitors must enter the
 * correct invite code to proceed.
 *
 * Features:
 * - Server-side IP-based 3-attempt lockout (5-minute cooldown via tRPC)
 * - Client-side localStorage mirror for instant UX (no flicker on return visits)
 * - Per-code custom welcome message fetched from the database
 * - Animated feature tour on the welcome screen
 * - Smooth fade+slide transition into the main app
 * - Gate disabled automatically if VITE_INVITE_CODE env var is unset
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Timer,
  CheckCircle2,
  BookOpen,
  Brain,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ── Constants ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "invite_gate_unlocked";
const CODE_STORAGE_KEY = "invite_gate_code";
const LOCKOUT_SECONDS = 300; // mirrors server
const WELCOME_DURATION_MS = 5000;
const GATE_ENABLED = Boolean(import.meta.env.VITE_INVITE_CODE);

// ── Feature tour slides ────────────────────────────────────────────────────────
const TOUR_SLIDES = [
  {
    icon: Brain,
    color: "blue",
    title: "Coding Patterns",
    desc: "20 essential patterns with difficulty ratings and spaced-repetition tracking.",
  },
  {
    icon: Target,
    color: "amber",
    title: "Behavioral Prep",
    desc: "STAR-format question bank with AI feedback and readiness scoring.",
  },
  {
    icon: BookOpen,
    color: "purple",
    title: "System Design",
    desc: "End-to-end design walkthroughs with Meta-style evaluation rubrics.",
  },
  {
    icon: Zap,
    color: "emerald",
    title: "AI Mock Sessions",
    desc: "Live AI-powered mock interviews with real-time coaching and scoring.",
  },
];

// ── localStorage helpers ───────────────────────────────────────────────────────
function isAlreadyUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markUnlocked(code?: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
    if (code) localStorage.setItem(CODE_STORAGE_KEY, code);
  } catch {}
}

/** Returns the invite code the current visitor used to unlock the gate. */
export function getStoredInviteCode(): string | null {
  try {
    return localStorage.getItem(CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

// ── Colour map ─────────────────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  blue: {
    bg: "bg-blue-500/8",
    border: "border-blue-500/15",
    icon: "text-blue-400",
  },
  amber: {
    bg: "bg-amber-500/8",
    border: "border-amber-500/15",
    icon: "text-amber-400",
  },
  purple: {
    bg: "bg-purple-500/8",
    border: "border-purple-500/15",
    icon: "text-purple-400",
  },
  emerald: {
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/15",
    icon: "text-emerald-400",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────
interface InviteGateProps {
  children: React.ReactNode;
}

export default function InviteGate({ children }: InviteGateProps) {
  // If gate is disabled, render children immediately
  const [unlocked, setUnlocked] = useState<boolean>(
    !GATE_ENABLED || isAlreadyUnlocked()
  );
  const [showWelcome, setShowWelcome] = useState(false);
  const [fadeOut, setFadeOut] = useState(false); // triggers fade-out before unmount
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [tourSlide, setTourSlide] = useState(0);
  const [welcomeData, setWelcomeData] = useState<{
    cohortName: string | null;
    welcomeMessage: string | null;
  } | null>(null);

  // Client-side lockout mirror (for instant feedback before server responds)
  const [clientLockedOut, setClientLockedOut] = useState(false);
  const [clientCountdown, setClientCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Server-side lockout status ─────────────────────────────────────────────
  const lockoutQuery = trpc.invite.getLockoutStatus.useQuery(undefined, {
    enabled: GATE_ENABLED && !unlocked,
    refetchInterval: showWelcome ? false : 10_000,
  });

  const serverLockedOut = lockoutQuery.data?.lockedOut ?? false;
  const serverSecondsRemaining = lockoutQuery.data?.secondsRemaining ?? 0;

  // Sync server lockout into client state
  useEffect(() => {
    if (serverLockedOut && serverSecondsRemaining > 0) {
      setClientLockedOut(true);
      setClientCountdown(serverSecondsRemaining);
    }
  }, [serverLockedOut, serverSecondsRemaining]);

  // ── Countdown tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clientLockedOut) return;

    countdownRef.current = setInterval(() => {
      setClientCountdown(prev => {
        if (prev <= 1) {
          setClientLockedOut(false);
          if (countdownRef.current) clearInterval(countdownRef.current);
          lockoutQuery.refetch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [clientLockedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tour auto-advance ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showWelcome) return;
    const t = setInterval(() => {
      setTourSlide(s => (s + 1) % TOUR_SLIDES.length);
    }, 1200);
    return () => clearInterval(t);
  }, [showWelcome]);

  // ── Welcome auto-dismiss ───────────────────────────────────────────────────
  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => {
      // Start fade-out animation, then unmount
      setFadeOut(true);
      setTimeout(() => {
        setShowWelcome(false);
        setUnlocked(true);
      }, 400); // matches CSS transition duration
    }, WELCOME_DURATION_MS);
    return () => clearTimeout(t);
  }, [showWelcome]);

  // ── Focus input ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!unlocked && !showWelcome && !clientLockedOut && inputRef.current) {
      inputRef.current.focus();
    }
  }, [unlocked, showWelcome, clientLockedOut]);

  // ── Verify mutation ────────────────────────────────────────────────────────
  const verifyMutation = trpc.invite.verifyCode.useMutation({
    onSuccess: data => {
      markUnlocked(input.trim());
      setWelcomeData({
        cohortName: data.cohortName,
        welcomeMessage: data.welcomeMessage,
      });
      setFadeOut(false);
      setShowWelcome(true);
    },
    onError: err => {
      if (err.data?.code === "TOO_MANY_REQUESTS") {
        setClientLockedOut(true);
        setClientCountdown(LOCKOUT_SECONDS);
        setError(null);
      } else {
        // Count remaining attempts from server lockout data
        const used = (lockoutQuery.data?.attemptsUsed ?? 0) + 1;
        const remaining = Math.max(0, 3 - used);
        if (remaining === 0) {
          setClientLockedOut(true);
          setClientCountdown(LOCKOUT_SECONDS);
          setError(null);
        } else {
          setError(
            remaining === 1
              ? "Incorrect code. 1 attempt remaining before lockout."
              : `Incorrect code. ${remaining} attempts remaining.`
          );
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      }
      setInput("");
      lockoutQuery.refetch();
    },
  });

  const attempt = useCallback(() => {
    if (clientLockedOut || verifyMutation.isPending) return;
    if (!input.trim()) return;
    verifyMutation.mutate({ code: input.trim() });
  }, [clientLockedOut, input, verifyMutation]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") attempt();
    if (error) setError(null);
  };

  // ── Render: already unlocked ───────────────────────────────────────────────
  if (unlocked) return <>{children}</>;

  // ── Render: welcome screen ─────────────────────────────────────────────────
  if (showWelcome) {
    const slide = TOUR_SLIDES[tourSlide];
    const colors = colorMap[slide.color];
    const SlideIcon = slide.icon;

    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-background"
        style={{
          transition: "opacity 0.4s ease, transform 0.4s ease",
          opacity: fadeOut ? 0 : 1,
          transform: fadeOut ? "scale(0.97)" : "scale(1)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative w-full max-w-md mx-4">
          <div className="rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col items-center gap-6 text-center">
            {/* Success icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {welcomeData?.cohortName
                  ? `Welcome, ${welcomeData.cohortName}!`
                  : "Welcome to the Study Group"}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {welcomeData?.welcomeMessage ??
                  "You now have access to the full interview prep resource."}
              </p>
            </div>

            {/* Animated feature tour */}
            <div className="w-full">
              <div
                className={`rounded-xl ${colors.bg} border ${colors.border} p-4 flex items-start gap-3 text-left`}
                style={{ minHeight: "80px" }}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}
                >
                  <SlideIcon size={18} className={colors.icon} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {slide.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {slide.desc}
                  </p>
                </div>
              </div>

              {/* Slide dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {TOUR_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTourSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === tourSlide
                        ? "w-4 h-1.5 bg-foreground/60"
                        : "w-1.5 h-1.5 bg-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              Community-compiled resource. No affiliation with any employer.
              Content synthesized from public sources.
            </p>

            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  animation: `progress-drain ${WELCOME_DURATION_MS}ms linear forwards`,
                }}
              />
            </div>
            <style>{`
              @keyframes progress-drain {
                from { width: 100%; }
                to   { width: 0%; }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: gate screen ────────────────────────────────────────────────────
  const isLocked = clientLockedOut || serverLockedOut;
  const displayCountdown = clientLockedOut
    ? clientCountdown
    : serverSecondsRemaining;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className={`relative w-full max-w-sm mx-4 ${shake ? "animate-[gate-shake_0.4s_ease]" : ""}`}
      >
        <style>{`
          @keyframes gate-shake {
            0%,100% { transform: translateX(0); }
            20%      { transform: translateX(-8px); }
            40%      { transform: translateX(8px); }
            60%      { transform: translateX(-5px); }
            80%      { transform: translateX(5px); }
          }
        `}</style>

        <div className="rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col items-center gap-6">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isLocked
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-blue-500/10 border border-blue-500/20"
            }`}
          >
            {isLocked ? (
              <Timer size={24} className="text-red-400" />
            ) : (
              <Lock size={24} className="text-blue-400" />
            )}
          </div>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {isLocked ? "Too Many Attempts" : "Study Group Access"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isLocked
                ? `Please wait ${displayCountdown}s before trying again.`
                : "This is a community study resource. Enter your invite code to continue."}
            </p>
          </div>

          {/* Lockout countdown bar */}
          {isLocked && (
            <div className="w-full space-y-2">
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(displayCountdown / LOCKOUT_SECONDS) * 100}%`,
                  }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {displayCountdown} second{displayCountdown !== 1 ? "s" : ""}{" "}
                remaining
              </p>
            </div>
          )}

          {/* Input — hidden during lockout */}
          {!isLocked && (
            <div className="w-full space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => {
                  setInput(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                onKeyDown={handleKey}
                placeholder="Enter invite code"
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
                disabled={verifyMutation.isPending}
                className={`w-full px-4 py-3 rounded-xl border text-center text-base font-mono tracking-widest bg-background text-foreground placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:tracking-normal outline-none transition-all disabled:opacity-60 ${
                  error
                    ? "border-red-500/70 focus:border-red-500"
                    : "border-border focus:border-blue-500/60"
                }`}
              />
              {error && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs">
                  <AlertCircle size={12} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Button */}
          {!isLocked && (
            <button
              onClick={attempt}
              disabled={input.trim().length === 0 || verifyMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
            >
              {verifyMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          )}

          {/* "Next slide" hint on welcome — shown on gate for context */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
            <ChevronRight size={10} />
            <span>Trusted study group members only</span>
          </div>

          {/* Footer disclaimer */}
          <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
            Community-compiled resource. No affiliation with any employer or
            company. Content synthesized from public sources.
          </p>
        </div>
      </div>
    </div>
  );
}
