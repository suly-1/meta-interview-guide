/**
 * InviteGate — full-screen access gate shown when the invite code feature is enabled.
 * Visitors must enter a valid invite code to proceed.
 * Once accepted, the code is stored in localStorage so they aren't prompted again.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

const STORAGE_KEY = "mg_invite_unlocked_v1";

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

export default function InviteGate({ onUnlock }: InviteGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const verify = trpc.inviteGate.verifyCode.useMutation({
    onSuccess(data) {
      if (data.ok) {
        localStorage.setItem(STORAGE_KEY, "1");
        onUnlock();
      } else {
        const msg =
          data.reason === "expired"
            ? "This code has expired."
            : data.reason === "exhausted"
            ? "This code has reached its usage limit."
            : data.reason === "inactive"
            ? "This code is no longer active."
            : "Invalid code. Please try again.";
        setError(msg);
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
    if (!code.trim()) return;
    setError(null);
    verify.mutate({ code: code.trim() });
  };

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
            Private Resource
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
              placeholder="Enter invite code"
              className="w-full h-14 rounded-xl px-5 text-center text-base font-mono tracking-widest uppercase outline-none transition-all"
              style={{
                backgroundColor: "#0d0f18",
                border: error ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                color: "#ffffff",
                caretColor: "#ffffff",
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || verify.isPending}
            className="w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#2a4fd6", color: "#ffffff" }}
          >
            {verify.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
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
