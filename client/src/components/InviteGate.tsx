/**
 * InviteGate
 *
 * Full-screen gate shown before any site content. Visitors must enter the
 * correct invite code to proceed. The code is stored in localStorage so
 * returning visitors are not re-prompted.
 *
 * The expected code is set via the VITE_INVITE_CODE environment variable.
 * If the env var is not set, the gate is disabled (open access).
 *
 * To change the code: update VITE_INVITE_CODE in the Secrets panel — no
 * redeployment required (the value is baked in at build time, so a new
 * deploy is needed to rotate the code).
 */
import { useState, useRef, useEffect } from "react";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";

const STORAGE_KEY = "invite_gate_unlocked";
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
  } catch {}
}

interface InviteGateProps {
  children: React.ReactNode;
}

export default function InviteGate({ children }: InviteGateProps) {
  // If no code is configured, gate is disabled
  const gateEnabled = Boolean(EXPECTED_CODE);

  const [unlocked, setUnlocked] = useState<boolean>(
    !gateEnabled || isAlreadyUnlocked()
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!unlocked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [unlocked]);

  if (unlocked) {
    return <>{children}</>;
  }

  const attempt = () => {
    if (input.trim().toUpperCase() === EXPECTED_CODE!.trim().toUpperCase()) {
      markUnlocked();
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") attempt();
    if (error) setError(false);
  };

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

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col items-center gap-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Lock size={24} className="text-blue-400" />
          </div>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Private Resource
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is a community study resource. Enter your invite code to
              continue.
            </p>
          </div>

          {/* Input */}
          <div className="w-full space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value.toUpperCase());
                if (error) setError(false);
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
                <span>Incorrect code. Please try again.</span>
              </div>
            )}
          </div>

          {/* Button */}
          <button
            onClick={attempt}
            disabled={input.trim().length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
          >
            Continue
            <ArrowRight size={15} />
          </button>

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
