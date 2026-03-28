/**
 * InviteGate — full-screen access gate.
 *
 * On every page load, if a code is stored in localStorage, it is re-validated
 * against the server (checkCodeAccess). This ensures:
 *   - Admin-blocked codes are kicked out immediately on next load
 *   - Expired access windows are enforced server-side
 *   - localStorage clearing cannot bypass server-side blocks
 *
 * Gate screen  → 3 wrong attempts → 5-min client-side lockout (mirrors server).
 * Welcome screen → animated 5-step feature tour, then "Start Preparing".
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Lock, ArrowRight, Loader2,
  Code2, Brain, BookOpen, Clock, BarChart2,
  ChevronRight, ShieldBan, AlertTriangle,
} from "lucide-react";

// ── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY       = "mg_invite_unlocked_v2";  // bumped v1→v2 to invalidate all existing tokens
const CODE_KEY          = "mg_invite_code_v2";       // store the actual code for re-validation
const ATTEMPTS_KEY      = "mg_invite_attempts_v2";
const LOCKOUT_UNTIL_KEY = "mg_invite_lockout_until_v2";

// Clean up old v1 keys so they don't linger in storage
try {
  localStorage.removeItem("mg_invite_unlocked_v1");
  localStorage.removeItem("mg_invite_code_v1");
  localStorage.removeItem("mg_invite_attempts_v1");
  localStorage.removeItem("mg_invite_lockout_until_v1");
} catch { /* ignore */ }

const MAX_ATTEMPTS = 3;
const COOLDOWN_MS  = 5 * 60 * 1000; // 5 minutes

function getStored(key: string, fallback: number): number {
  try { return parseInt(localStorage.getItem(key) ?? String(fallback), 10) || fallback; }
  catch { return fallback; }
}
function getStoredStr(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}
function clearUnlock() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CODE_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
  } catch { /* ignore */ }
}

// ── Tour slides ───────────────────────────────────────────────────────────────
const TOUR_SLIDES = [
  {
    icon: <Code2 className="w-8 h-8" />,
    iconBg: "#1e3a5f", iconColor: "#60a5fa",
    title: "Coding Interview Prep",
    body: "14 LeetCode patterns with timed Speed Runs, Topic Sprints, and an in-browser code editor. AI hints unlock only after you've attempted the problem yourself.",
    accent: "#3b82f6",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    iconBg: "#2e1f5e", iconColor: "#a78bfa",
    title: "Behavioral & System Design",
    body: "28 behavioral questions with a STAR builder and LLM-scored mock sessions. 8 system design patterns with a Skeptic Persona that challenges every decision you make.",
    accent: "#8b5cf6",
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    iconBg: "#064e3b", iconColor: "#34d399",
    title: "AI-Enabled Round",
    body: "Dedicated prep for Meta's AI-focused interview round. Scenario-based mocks with an IC-level signal detector that classifies each paragraph of your answer as IC4–IC7.",
    accent: "#10b981",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    iconBg: "#451a03", iconColor: "#fbbf24",
    title: "60-Day Study Timeline",
    body: "Structured calendar with daily tasks, streak tracking, and spaced repetition. An LLM-powered Study Session Planner generates a 30/60/90-min plan from your weak areas.",
    accent: "#f59e0b",
  },
  {
    icon: <BarChart2 className="w-8 h-8" />,
    iconBg: "#1a1f35", iconColor: "#f472b6",
    title: "Readiness Score & Stats",
    body: "A live readiness score across coding, behavioral, and system design. Pattern mastery tree, XP system, achievement badges, and a personal stats dashboard track every session.",
    accent: "#ec4899",
  },
] as const;

// ── useInviteGate hook ────────────────────────────────────────────────────────
export function useInviteGate() {
  const { data, isLoading } = trpc.inviteGate.isEnabled.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [forceGate, setForceGate] = useState(false); // set true when server revokes access

  const storedCode = getStoredStr(CODE_KEY);

  // Re-validate stored code on mount (catches admin blocks / expiry)
  const { data: accessCheck } = trpc.inviteGate.checkCodeAccess.useQuery(
    { code: storedCode ?? "" },
    {
      enabled: !!storedCode && unlocked && (data?.enabled ?? false),
      staleTime: 60 * 1000, // re-check every minute
      refetchInterval: 2 * 60 * 1000, // poll every 2 minutes
    }
  );

  useEffect(() => {
    if (accessCheck && !accessCheck.ok) {
      // Server revoked access — clear unlock and force gate
      clearUnlock();
      setUnlocked(false);
      setForceGate(true);
    }
  }, [accessCheck]);

  const unlock = (code: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      localStorage.setItem(CODE_KEY, code.trim().toUpperCase());
    } catch { /* ignore */ }
    setUnlocked(true);
    setForceGate(false);
  };

  const gateEnabled = data?.enabled ?? false;
  const showGate = !isLoading && gateEnabled && (!unlocked || forceGate);
  const revokeReason = accessCheck && !accessCheck.ok ? accessCheck.reason : null;

  return { showGate, isLoading, unlock, revokeReason };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface InviteGateProps {
  onUnlock: () => void;
  revokeReason?: string | null;
}
type Screen = "gate" | "tour" | "exit";

export default function InviteGate({ onUnlock, revokeReason }: InviteGateProps) {
  const [code, setCode]             = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [shake, setShake]           = useState(false);
  const [screen, setScreen]         = useState<Screen>("gate");
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState("");

  // Lockout
  const [attempts, setAttempts]         = useState(() => getStored(ATTEMPTS_KEY, 0));
  const [lockoutUntil, setLockoutUntil] = useState(() => getStored(LOCKOUT_UNTIL_KEY, 0));
  const [remaining, setRemaining]       = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, lockoutUntil - Date.now());
      setRemaining(Math.ceil(left / 1000));
      if (left === 0 && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
    tick();
    if (lockoutUntil > Date.now()) timerRef.current = setInterval(tick, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lockoutUntil]);

  const isLockedOut = remaining > 0;

  // Tour state
  const [slide, setSlide]         = useState(0);
  const [slideDir, setSlideDir]   = useState<1 | -1>(1);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible]     = useState(true);

  const goToSlide = (next: number, dir: 1 | -1 = 1) => {
    if (animating) return;
    setAnimating(true);
    setVisible(false);
    setSlideDir(dir);
    setTimeout(() => { setSlide(next); setVisible(true); setAnimating(false); }, 220);
  };

  const handleNext = () => {
    if (slide < TOUR_SLIDES.length - 1) {
      goToSlide(slide + 1, 1);
    } else {
      setScreen("exit");
      setTimeout(onUnlock, 350);
    }
  };

  const handlePrev = () => { if (slide > 0) goToSlide(slide - 1, -1); };

  // Mutation
  const verify = trpc.inviteGate.verifyCode.useMutation({
    onSuccess(data) {
      if (data.ok) {
        try {
          localStorage.removeItem(ATTEMPTS_KEY);
          localStorage.removeItem(LOCKOUT_UNTIL_KEY);
          localStorage.setItem(STORAGE_KEY, "1");
          localStorage.setItem(CODE_KEY, submittedCode);
        } catch { /* ignore */ }
        setAttempts(0);
        setLockoutUntil(0);
        setWelcomeMsg("welcomeMessage" in data ? (data.welcomeMessage ?? null) : null);
        setScreen("tour");
      } else {
        const reason = data.reason;
        if (reason === "rate_limited") {
          const until = Date.now() + COOLDOWN_MS;
          setLockoutUntil(until);
          try { localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until)); } catch { /* ignore */ }
          setAttempts(MAX_ATTEMPTS);
          try { localStorage.setItem(ATTEMPTS_KEY, String(MAX_ATTEMPTS)); } catch { /* ignore */ }
          setError("Too many attempts. Please wait 5 minutes before trying again.");
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          try { localStorage.setItem(ATTEMPTS_KEY, String(newAttempts)); } catch { /* ignore */ }

          if (newAttempts >= MAX_ATTEMPTS) {
            const until = Date.now() + COOLDOWN_MS;
            setLockoutUntil(until);
            try { localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until)); } catch { /* ignore */ }
            setError("Too many attempts. Please wait 5 minutes before trying again.");
          } else {
            const left = MAX_ATTEMPTS - newAttempts;
            const base =
              reason === "blocked"        ? "This code has been deactivated by the admin." :
              reason === "window_expired" ? "Your access period has ended." :
              reason === "expired"        ? "This code has expired." :
              reason === "exhausted"      ? "This code has reached its usage limit." :
              reason === "inactive"       ? "This code is no longer active." :
              "Invalid code.";
            setError(`${base} ${left} attempt${left !== 1 ? "s" : ""} remaining.`);
          }
        }
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    },
    onError() { setError("Something went wrong. Please try again."); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLockedOut) return;
    setError(null);
    const trimmed = code.trim().toUpperCase();
    setSubmittedCode(trimmed);
    verify.mutate({ code: trimmed });
  };

  // ── Exit fade ──────────────────────────────────────────────────────────────
  if (screen === "exit") {
    return (
      <div className="fixed inset-0 z-[9999] bg-black" style={{ animation: "fadeOut 0.35s ease forwards" }}>
        <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
      </div>
    );
  }

  // ── Tour / Welcome screen ──────────────────────────────────────────────────
  if (screen === "tour") {
    const current = TOUR_SLIDES[slide];
    const isLast  = slide === TOUR_SLIDES.length - 1;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl overflow-hidden" style={{ backgroundColor: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="h-1 w-full" style={{ backgroundColor: current.accent }} />
          <div className="p-8 sm:p-10">
            {welcomeMsg && slide === 0 && (
              <div className="mb-5 px-4 py-2.5 rounded-xl text-sm font-medium text-center"
                style={{ backgroundColor: "rgba(42,79,214,0.15)", color: "#93c5fd", border: "1px solid rgba(42,79,214,0.25)" }}>
                {welcomeMsg}
              </div>
            )}
            <div style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : `translateX(${slideDir * 24}px)`,
              transition: "opacity 0.22s ease, transform 0.22s ease",
            }}>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: current.iconBg, color: current.iconColor }}>
                  {current.icon}
                </div>
              </div>
              <p className="text-center text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: current.accent }}>
                Feature {slide + 1} of {TOUR_SLIDES.length}
              </p>
              <h2 className="text-xl font-bold text-white text-center mb-3">{current.title}</h2>
              <p className="text-sm leading-relaxed text-center" style={{ color: "#9ca3af" }}>{current.body}</p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-8 mb-6">
              {TOUR_SLIDES.map((_, i) => (
                <button key={i} onClick={() => goToSlide(i, i > slide ? 1 : -1)} className="rounded-full transition-all"
                  style={{ width: i === slide ? "20px" : "8px", height: "8px", backgroundColor: i === slide ? current.accent : "rgba(255,255,255,0.15)" }}
                  aria-label={`Go to slide ${i + 1}`} />
              ))}
            </div>
            <div className="flex gap-3">
              {slide > 0 && (
                <button onClick={handlePrev} className="flex-1 h-12 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Back
                </button>
              )}
              <button onClick={handleNext}
                className="flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ flex: slide > 0 ? "2" : "1", backgroundColor: isLast ? "#16a34a" : current.accent, color: "#ffffff" }}>
                {isLast ? <><span>Start Preparing</span> <ArrowRight className="w-4 h-4" /></> : <><span>Next</span> <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
            {!isLast && (
              <button onClick={() => { setScreen("exit"); setTimeout(onUnlock, 350); }}
                className="w-full text-center text-xs mt-4 transition-opacity hover:opacity-80" style={{ color: "#4b5563" }}>
                Skip tour
              </button>
            )}
          </div>
        </div>
        <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
      </div>
    );
  }

  // ── Blocked / Expired screen (server-revoked) ─────────────────────────────
  const isServerBlocked  = revokeReason === "blocked";
  const isWindowExpired  = revokeReason === "window_expired" || revokeReason === "expired";

  if (revokeReason && (isServerBlocked || isWindowExpired)) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-10 text-center"
          style={{ backgroundColor: "#1a1d27", border: `1px solid ${isServerBlocked ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}` }}>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: isServerBlocked ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)" }}>
              {isServerBlocked
                ? <ShieldBan className="w-7 h-7" style={{ color: "#ef4444" }} />
                : <AlertTriangle className="w-7 h-7" style={{ color: "#f59e0b" }} />}
            </div>
          </div>
          <h1 className="text-xl font-bold text-white mb-3">
            {isServerBlocked ? "Access Revoked" : "Access Period Ended"}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
            {isServerBlocked
              ? "Your access to this resource has been revoked by the administrator. Please contact the study group organiser if you believe this is a mistake."
              : "Your 60-day access window for this study group has ended. Please contact the organiser to request an extension."}
          </p>
          <p className="text-xs mt-6" style={{ color: "#4b5563" }}>
            Community-compiled resource. No affiliation with any employer or company.
          </p>
        </div>
      </div>
    );
  }

  // ── Gate screen ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-10"
        style={{ backgroundColor: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex justify-center mb-7">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#2a3a8c" }}>
            <Lock className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-3">Study Group Access</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
            This is a community study resource. Enter your invite code to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className={shake ? "animate-[shake_0.4s_ease-in-out]" : ""}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
              placeholder={isLockedOut ? `Locked — wait ${Math.floor(remaining / 60)}m ${remaining % 60}s` : "Enter invite code"}
              disabled={isLockedOut}
              className="w-full h-14 rounded-xl px-5 text-center text-base font-mono tracking-widest uppercase outline-none transition-all disabled:cursor-not-allowed"
              style={{
                backgroundColor: isLockedOut ? "#0a0c14" : "#0d0f18",
                border: error ? "1px solid #ef4444" : isLockedOut ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: isLockedOut ? "#6b7280" : "#ffffff",
                caretColor: "#ffffff",
              }}
              autoFocus={!isLockedOut}
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
            />
          </div>

          {attempts > 0 && !isLockedOut && (
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: i < attempts ? "#ef4444" : "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          {isLockedOut && (
            <div className="space-y-1.5">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{
                  backgroundColor: "#ef4444",
                  width: `${(remaining / (COOLDOWN_MS / 1000)) * 100}%`,
                  transition: "width 0.5s linear",
                }} />
              </div>
              <p className="text-xs text-center" style={{ color: "#6b7280" }}>
                Too many attempts — try again in {Math.floor(remaining / 60)}m {remaining % 60}s
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || verify.isPending || isLockedOut}
            className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#2a4fd6", color: "#ffffff" }}
          >
            {verify.isPending ? <Loader2 className="w-5 h-5 animate-spin" />
              : isLockedOut ? <>Locked ({Math.floor(remaining / 60)}m {remaining % 60}s)</>
              : <>Continue <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
        <p className="text-center text-xs mt-7 leading-relaxed" style={{ color: "#4b5563" }}>
          Community-compiled resource. No affiliation with any employer or company.
          Content synthesized from public sources.
        </p>
      </div>
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
