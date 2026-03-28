/**
 * InviteGate — full-screen access gate shown when the invite code feature is enabled.
 * Visitors must enter a valid invite code to proceed.
 * Once accepted, the code is stored in localStorage so they aren't prompted again.
 *
 * Security: 3 failed attempts → 30-second cooldown (stored in localStorage so it
 * survives a page refresh during the lockout window).
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Lock, ArrowRight, Loader2, BookOpen, Code2, Brain, Clock, CheckCircle2 } from "lucide-react";

const STORAGE_KEY       = "mg_invite_unlocked_v1";
const ATTEMPTS_KEY      = "mg_invite_attempts_v1";   // number of failed attempts
const LOCKOUT_UNTIL_KEY = "mg_invite_lockout_until_v1"; // epoch ms when lockout expires

const MAX_ATTEMPTS   = 3;
const COOLDOWN_MS    = 30_000; // 30 seconds

function getStoredAttempts(): number {
  try { return parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? "0", 10) || 0; } catch { return 0; }
}
function getStoredLockoutUntil(): number {
  try { return parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) ?? "0", 10) || 0; } catch { return 0; }
}

export function useInviteGate() {
  const { data, isLoading } = trpc.inviteGate.isEnabled.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const unlock = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setUnlocked(true);
  };

  const gateEnabled = data?.enabled ?? false;
  const showGate = !isLoading && gateEnabled && !unlocked;

  return { showGate, isLoading, unlock };
}

interface InviteGateProps {
  onUnlock: () => void;
}

type Screen = "gate" | "welcome";

export default function InviteGate({ onUnlock }: InviteGateProps) {
  const [code, setCode]       = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [shake, setShake]     = useState(false);
  const [screen, setScreen]   = useState<Screen>("gate");

  // Lockout state
  const [attempts, setAttempts]         = useState<number>(getStoredAttempts);
  const [lockoutUntil, setLockoutUntil] = useState<number>(getStoredLockoutUntil);
  const [remaining, setRemaining]       = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick down the cooldown every second
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, lockoutUntil - now);
      setRemaining(Math.ceil(left / 1000));
      if (left === 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    tick();
    if (lockoutUntil > Date.now()) {
      timerRef.current = setInterval(tick, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockoutUntil]);

  const isLockedOut = remaining > 0;

  const verify = trpc.inviteGate.verifyCode.useMutation({
    onSuccess(data) {
      if (data.ok) {
        // Clear lockout state on success
        try {
          localStorage.removeItem(ATTEMPTS_KEY);
          localStorage.removeItem(LOCKOUT_UNTIL_KEY);
          localStorage.setItem(STORAGE_KEY, "1");
        } catch { /* ignore */ }
        setAttempts(0);
        setLockoutUntil(0);
        // Show welcome screen before handing off
        setScreen("welcome");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        try { localStorage.setItem(ATTEMPTS_KEY, String(newAttempts)); } catch { /* ignore */ }

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + COOLDOWN_MS;
          setLockoutUntil(until);
          try { localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until)); } catch { /* ignore */ }
          setError(`Too many attempts. Please wait 30 seconds before trying again.`);
        } else {
          const attemptsLeft = MAX_ATTEMPTS - newAttempts;
          const msg =
            data.reason === "expired"   ? `This code has expired. (${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining)` :
            data.reason === "exhausted" ? `This code has reached its usage limit. (${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining)` :
            data.reason === "inactive"  ? `This code is no longer active. (${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining)` :
            `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`;
          setError(msg);
        }

        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    },
    onError() {
      setError("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLockedOut) return;
    setError(null);
    verify.mutate({ code: code.trim() });
  };

  // ── Welcome screen ─────────────────────────────────────────────────────────
  if (screen === "welcome") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#000000" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          className="relative z-10 w-full max-w-lg mx-4 rounded-2xl p-10"
          style={{ backgroundColor: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Success icon */}
          <div className="flex justify-center mb-7">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#166534" }}
            >
              <CheckCircle2 className="w-8 h-8 text-green-300" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to the Study Group</h1>
            <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
              Code accepted. Here's what's inside:
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mb-8">
            {[
              {
                icon: <Code2 className="w-5 h-5" style={{ color: "#60a5fa" }} />,
                bg: "#1e3a5f",
                title: "Coding Interview Prep",
                desc: "14 LeetCode patterns, timed Speed Runs, Topic Sprints, and an in-browser code editor with AI hints.",
              },
              {
                icon: <Brain className="w-5 h-5" style={{ color: "#a78bfa" }} />,
                bg: "#2e1f5e",
                title: "Behavioral & System Design",
                desc: "STAR framework drills, 28 behavioral questions, 8 system design patterns, and LLM-scored mock sessions.",
              },
              {
                icon: <BookOpen className="w-5 h-5" style={{ color: "#34d399" }} />,
                bg: "#064e3b",
                title: "AI-Enabled Round",
                desc: "Dedicated prep for Meta's AI-focused round with scenario-based mock interviews and debrief scoring.",
              },
              {
                icon: <Clock className="w-5 h-5" style={{ color: "#fbbf24" }} />,
                bg: "#451a03",
                title: "60-Day Study Timeline",
                desc: "Structured calendar with daily tasks, streak tracking, spaced repetition, and a readiness score.",
              },
            ].map(({ icon, bg, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-xl p-4"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: bg }}
                >
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onUnlock}
            className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2a4fd6", color: "#ffffff" }}
          >
            Start Preparing <ArrowRight className="w-5 h-5" />
          </button>

          <p
            className="text-center text-xs mt-6 leading-relaxed"
            style={{ color: "#374151" }}
          >
            Community-compiled resource. No affiliation with any employer or company.
            Content synthesized from public sources.
          </p>
        </div>
      </div>
    );
  }

  // ── Gate screen ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-10"
        style={{ backgroundColor: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#2a3a8c" }}
          >
            <Lock className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-3">
            Study Group Access
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
            This is a community study resource. Enter your invite code to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className={shake ? "animate-[shake_0.4s_ease-in-out]" : ""}>
            <input
              value={code}
              onChange={e => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder={isLockedOut ? `Locked — wait ${remaining}s` : "Enter invite code"}
              disabled={isLockedOut}
              className="w-full h-14 rounded-xl px-5 text-center text-base font-mono tracking-widest uppercase outline-none transition-all disabled:cursor-not-allowed"
              style={{
                backgroundColor: isLockedOut ? "#0a0c14" : "#0d0f18",
                border: error
                  ? "1px solid #ef4444"
                  : isLockedOut
                  ? "1px solid rgba(239,68,68,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: isLockedOut ? "#6b7280" : "#ffffff",
                caretColor: "#ffffff",
              }}
              autoFocus={!isLockedOut}
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
            />
          </div>

          {/* Attempt dots */}
          {attempts > 0 && !isLockedOut && (
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: i < attempts ? "#ef4444" : "rgba(255,255,255,0.12)" }}
                />
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {/* Cooldown progress bar */}
          {isLockedOut && (
            <div className="space-y-1.5">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: "#ef4444",
                    width: `${(remaining / (COOLDOWN_MS / 1000)) * 100}%`,
                    transition: "width 0.5s linear",
                  }}
                />
              </div>
              <p className="text-xs text-center" style={{ color: "#6b7280" }}>
                Too many attempts — try again in {remaining}s
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || verify.isPending || isLockedOut}
            className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#2a4fd6", color: "#ffffff" }}
          >
            {verify.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLockedOut ? (
              <>Locked ({remaining}s)</>
            ) : (
              <>
                Continue <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <p
          className="text-center text-xs mt-7 leading-relaxed"
          style={{ color: "#4b5563" }}
        >
          Community-compiled resource. No affiliation with any employer or company.
          Content synthesized from public sources.
        </p>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
