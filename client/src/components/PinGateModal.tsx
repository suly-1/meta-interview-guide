/**
 * PinGateModal
 *
 * Shown when the user navigates to any /admin/* route and does not yet have
 * a valid PIN token in memory. Submits the PIN to the server for verification.
 * On success, stores the returned JWT in PinGateContext (React state only).
 *
 * Features:
 * - 6-digit PIN boxes with auto-submit, paste support, keyboard navigation
 * - Shake animation on wrong PIN
 * - Auto-lock countdown when IP is locked out (5 failed attempts in 15 min)
 * - Expiry toast: shown 5 minutes before the 4-hour token expires
 */
import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { trpc } from "@/lib/trpc";
import { usePinGate } from "@/contexts/PinGateContext";
import { Lock, ShieldAlert, Timer, AlertCircle } from "lucide-react";

const PIN_LENGTH = 6;

// ── Expiry toast (shown while admin panel is open, 5 min before token expires) ──
export function PinExpiryToast() {
  const { pinToken, clearPinToken } = usePinGate();
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!pinToken) { setMinutesLeft(null); return; }
    // Decode JWT expiry (no verification needed — just display)
    try {
      const payload = JSON.parse(atob(pinToken.split(".")[1]));
      const expMs = payload.exp * 1000;
      const check = () => {
        const remaining = Math.floor((expMs - Date.now()) / 60000);
        setMinutesLeft(remaining);
      };
      check();
      const interval = setInterval(check, 30_000);
      return () => clearInterval(interval);
    } catch {
      setMinutesLeft(null);
    }
  }, [pinToken]);

  // Reset dismissed state when token changes (new login)
  useEffect(() => { setDismissed(false); }, [pinToken]);

  // Show toast only in the 5-minute warning window
  if (!pinToken || dismissed || minutesLeft === null || minutesLeft > 5 || minutesLeft < 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex items-start gap-3 bg-amber-900/90 border border-amber-600 text-amber-100 rounded-xl px-4 py-3 shadow-xl max-w-xs backdrop-blur-sm">
      <Timer size={18} className="mt-0.5 flex-shrink-0 text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Admin session expiring</p>
        <p className="text-xs text-amber-300 mt-0.5">
          {minutesLeft <= 0
            ? "Your PIN session has expired. You will be prompted to re-enter your PIN."
            : `Your admin PIN session expires in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}. You will need to re-enter your PIN.`}
        </p>
      </div>
      <button
        onClick={() => {
          if (minutesLeft <= 0) clearPinToken();
          else setDismissed(true);
        }}
        className="flex-shrink-0 text-amber-400 hover:text-amber-200 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── Main PIN gate modal ───────────────────────────────────────────────────────
export default function PinGateModal() {
  const { setPinToken } = usePinGate();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Poll lock status every 10 seconds so the countdown updates live
  const { data: lockStatus, refetch: refetchLock } = trpc.adminPin.getPinLockStatus.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  const isLocked = lockStatus?.locked ?? false;
  const secondsRemaining = lockStatus?.secondsRemaining ?? 0;
  const failedAttempts = lockStatus?.failedAttempts ?? 0;

  // Format countdown as mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Auto-focus first box on mount (only when not locked)
  useEffect(() => {
    if (!isLocked) inputRefs.current[0]?.focus();
  }, [isLocked]);

  const verifyMutation = trpc.adminPin.verifyPin.useMutation({
    onSuccess: (data: { token: string }) => {
      setPinToken(data.token);
    },
    onError: (err: { message: string }) => {
      const msg = err.message.includes("Too many failed")
        ? err.message
        : err.message === "Incorrect PIN."
        ? "Incorrect PIN. Try again."
        : err.message;
      setError(msg);
      setShake(true);
      setDigits(Array(PIN_LENGTH).fill(""));
      // Refresh lock status after a failed attempt
      setTimeout(() => refetchLock(), 500);
      setTimeout(() => {
        setShake(false);
        if (!isLocked) inputRefs.current[0]?.focus();
      }, 600);
    },
  });

  const submitPin = useCallback((pin: string) => {
    if (verifyMutation.isPending || isLocked) return;
    verifyMutation.mutate({ pin });
  }, [verifyMutation, isLocked]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);
    if (digit && index < PIN_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    const filled = next.every(d => d !== "");
    if (filled) submitPin(next.join(""));
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length === PIN_LENGTH) submitPin(pin);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError(null);
    const lastFilled = Math.min(pasted.length, PIN_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === PIN_LENGTH) submitPin(pasted);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-gray-900 border rounded-2xl p-8 max-w-sm w-full shadow-2xl transition-transform ${
          isLocked ? "border-red-700" : "border-gray-700"
        } ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
      >
        {/* Icon + title */}
        <div className="flex flex-col items-center mb-7">
          <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-4 ${
            isLocked
              ? "bg-red-900/50 border-red-700"
              : error
              ? "bg-red-900/30 border-red-700"
              : "bg-indigo-900/50 border-indigo-700"
          }`}>
            {isLocked ? (
              <AlertCircle size={26} className="text-red-400" />
            ) : error ? (
              <ShieldAlert size={26} className="text-red-400" />
            ) : (
              <Lock size={26} className="text-indigo-400" />
            )}
          </div>
          <h2 className="text-lg font-bold text-white">Admin Access</h2>
          <p className="text-sm text-gray-400 mt-1 text-center">
            {isLocked
              ? "Too many failed attempts"
              : "Enter your admin PIN to continue"}
          </p>
        </div>

        {/* Locked state — countdown */}
        {isLocked ? (
          <div className="text-center space-y-3">
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
              <p className="text-red-300 text-sm font-medium mb-1">
                Access locked after {failedAttempts} failed attempts
              </p>
              <p className="text-red-400 text-xs">
                Try again in
              </p>
              <p className="text-red-200 text-3xl font-mono font-bold mt-1">
                {formatCountdown(secondsRemaining)}
              </p>
            </div>
            <p className="text-xs text-gray-600">
              This lockout is enforced server-side and cannot be bypassed.
            </p>
          </div>
        ) : (
          <>
            {/* PIN boxes */}
            <div className="flex gap-3 justify-center mb-5">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={verifyMutation.isPending}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-gray-800 text-white outline-none transition-all
                    ${digit ? "border-indigo-500 bg-indigo-900/20" : "border-gray-700"}
                    ${error ? "border-red-500 bg-red-900/10" : ""}
                    focus:border-indigo-400 focus:bg-indigo-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  autoComplete="off"
                  aria-label={`PIN digit ${i + 1}`}
                />
              ))}
            </div>

            {/* Failed attempts warning (1-4 attempts) */}
            {failedAttempts > 0 && failedAttempts < 5 && (
              <p className="text-center text-xs text-amber-400 mb-3">
                {5 - failedAttempts} attempt{5 - failedAttempts === 1 ? "" : "s"} remaining before 15-minute lockout
              </p>
            )}

            {/* Error message */}
            {error && !error.includes("Too many") && (
              <p className="text-center text-sm text-red-400 font-medium mb-4">
                {error}
              </p>
            )}

            {/* Status */}
            {verifyMutation.isPending && (
              <p className="text-center text-sm text-indigo-400 animate-pulse mb-4">
                Verifying…
              </p>
            )}

            {/* Hint */}
            <p className="text-center text-xs text-gray-600 mt-2">
              PIN is verified server-side. This session clears on tab close.
            </p>
          </>
        )}
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
