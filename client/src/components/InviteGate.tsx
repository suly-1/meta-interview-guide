/**
 * InviteGate
 *
 * Full-screen gate shown before any site content. Visitors must enter the
 * correct invite code to proceed.
 *
 * Features:
 * - 3-attempt lockout with 30-second countdown cooldown
 * - Welcome screen shown for 3 seconds after successful entry
 * - localStorage persistence so returning visitors skip the gate
 * - Controlled by VITE_INVITE_CODE env var; gate disabled if unset
 */
import { useState, useRef, useEffect } from "react";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Timer,
  CheckCircle2,
  BookOpen,
  Brain,
  Target,
} from "lucide-react";

const STORAGE_KEY = "invite_gate_unlocked";
const ATTEMPTS_KEY = "invite_gate_attempts";
const LOCKOUT_KEY = "invite_gate_lockout_until";
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 300;
const WELCOME_DURATION_MS = 5000;
const EXPECTED_CODE = import.meta.env.VITE_INVITE_CODE as string | undefined;

function isAlreadyUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markUnlocked(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  } catch {}
}

function getAttempts(): number {
  try {
    return parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? "0", 10);
  } catch {
    return 0;
  }
}

function incrementAttempts(): number {
  const next = getAttempts() + 1;
  try {
    localStorage.setItem(ATTEMPTS_KEY, String(next));
  } catch {}
  return next;
}

function getLockoutUntil(): number {
  try {
    return parseInt(localStorage.getItem(LOCKOUT_KEY) ?? "0", 10);
  } catch {
    return 0;
  }
}

function setLockout(): void {
  try {
    localStorage.setItem(
      LOCKOUT_KEY,
      String(Date.now() + LOCKOUT_SECONDS * 1000)
    );
    localStorage.setItem(ATTEMPTS_KEY, "0");
  } catch {}
}

interface InviteGateProps {
  children: React.ReactNode;
}

export default function InviteGate({ children }: InviteGateProps) {
  const gateEnabled = Boolean(EXPECTED_CODE);

  const [unlocked, setUnlocked] = useState<boolean>(
    !gateEnabled || isAlreadyUnlocked()
  );
  const [showWelcome, setShowWelcome] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [lockedOut, setLockedOut] = useState<boolean>(
    () => getLockoutUntil() > Date.now()
  );
  const [countdown, setCountdown] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Focus input on mount
  useEffect(() => {
    if (!unlocked && !showWelcome && !lockedOut && inputRef.current) {
      inputRef.current.focus();
    }
  }, [unlocked, showWelcome, lockedOut]);

  // Countdown tick when locked out
  useEffect(() => {
    if (!lockedOut) return;

    const tick = () => {
      const remaining = Math.ceil((getLockoutUntil() - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedOut(false);
        setCountdown(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setCountdown(remaining);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockedOut]);

  // Auto-dismiss welcome screen
  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => {
      setShowWelcome(false);
      setUnlocked(true);
    }, WELCOME_DURATION_MS);
    return () => clearTimeout(t);
  }, [showWelcome]);

  if (unlocked) return <>{children}</>;

  const attempt = () => {
    if (lockedOut) return;

    if (input.trim().toUpperCase() === EXPECTED_CODE!.trim().toUpperCase()) {
      markUnlocked();
      setShowWelcome(true);
    } else {
      const attempts = incrementAttempts();
      const remaining = MAX_ATTEMPTS - attempts;

      if (attempts >= MAX_ATTEMPTS) {
        setLockout();
        setLockedOut(true);
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
      setInput("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") attempt();
    if (error) setError(null);
  };

  // --- Welcome screen ---
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background">
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
                Welcome to the Study Group
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You now have access to the full interview prep resource.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="w-full grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-blue-500/8 border border-blue-500/15 p-3 flex flex-col items-center gap-2">
                <Brain size={18} className="text-blue-400" />
                <span className="text-xs text-foreground/80 font-medium leading-tight">
                  Coding Patterns
                </span>
              </div>
              <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 p-3 flex flex-col items-center gap-2">
                <Target size={18} className="text-amber-400" />
                <span className="text-xs text-foreground/80 font-medium leading-tight">
                  Behavioral Prep
                </span>
              </div>
              <div className="rounded-xl bg-purple-500/8 border border-purple-500/15 p-3 flex flex-col items-center gap-2">
                <BookOpen size={18} className="text-purple-400" />
                <span className="text-xs text-foreground/80 font-medium leading-tight">
                  System Design
                </span>
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

  // --- Gate screen ---
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
              lockedOut
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-blue-500/10 border border-blue-500/20"
            }`}
          >
            {lockedOut ? (
              <Timer size={24} className="text-red-400" />
            ) : (
              <Lock size={24} className="text-blue-400" />
            )}
          </div>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {lockedOut ? "Too Many Attempts" : "Study Group Access"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lockedOut
                ? `Please wait ${countdown}s before trying again.`
                : "This is a community study resource. Enter your invite code to continue."}
            </p>
          </div>

          {/* Lockout countdown bar */}
          {lockedOut && (
            <div className="w-full space-y-2">
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(countdown / LOCKOUT_SECONDS) * 100}%`,
                  }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {countdown} second{countdown !== 1 ? "s" : ""} remaining
              </p>
            </div>
          )}

          {/* Input — hidden during lockout */}
          {!lockedOut && (
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
                className={`w-full px-4 py-3 rounded-xl border text-center text-base font-mono tracking-widest bg-background text-foreground placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:tracking-normal outline-none transition-all ${
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
          {!lockedOut && (
            <button
              onClick={attempt}
              disabled={input.trim().length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          )}

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
