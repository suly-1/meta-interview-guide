/**
 * PinGateModal
 *
 * Shown when the user navigates to any /admin/* route and does not yet have
 * a valid PIN token in memory. Submits the PIN to the server for verification.
 * On success, stores the returned JWT in PinGateContext (React state only).
 */
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { trpc } from "@/lib/trpc";
import { usePinGate } from "@/contexts/PinGateContext";
import { Lock, ShieldAlert } from "lucide-react";

const PIN_LENGTH = 6; // accept 1-8 digits; we show 6 boxes for visual clarity

export default function PinGateModal() {
  const { setPinToken } = usePinGate();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const verifyMutation = trpc.admin.verifyPin.useMutation({
    onSuccess: (data: { token: string }) => {
      setPinToken(data.token);
    },
    onError: (err: { message: string }) => {
      setError(err.message === "Incorrect PIN." ? "Incorrect PIN. Try again." : err.message);
      setShake(true);
      setDigits(Array(PIN_LENGTH).fill(""));
      setTimeout(() => {
        setShake(false);
        inputRefs.current[0]?.focus();
      }, 600);
    },
  });

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all boxes are filled
    const filled = next.every(d => d !== "");
    if (filled) {
      submitPin(next.join(""));
    }
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

  // Handle paste — fill boxes from pasted digits
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

  const submitPin = (pin: string) => {
    if (verifyMutation.isPending) return;
    verifyMutation.mutate({ pin });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl transition-transform ${
          shake ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
        style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
      >
        {/* Icon + title */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-full bg-indigo-900/50 border border-indigo-700 flex items-center justify-center mb-4">
            {error ? (
              <ShieldAlert size={26} className="text-red-400" />
            ) : (
              <Lock size={26} className="text-indigo-400" />
            )}
          </div>
          <h2 className="text-lg font-bold text-white">Admin Access</h2>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Enter your admin PIN to continue
          </p>
        </div>

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

        {/* Error message */}
        {error && (
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
