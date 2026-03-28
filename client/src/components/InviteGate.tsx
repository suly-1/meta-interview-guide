/**
 * InviteGate — full-screen access gate shown when the invite code feature is enabled.
 * Visitors must enter a valid invite code to proceed.
 * Once accepted, the code is stored in localStorage so they aren't prompted again.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

const STORAGE_KEY = "mg_invite_unlocked_v1";

export function useInviteGate() {
  const { data, isLoading } = trpc.inviteGate.isEnabled.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache 5 min
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Access Required
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This resource is shared privately. Enter your invite code to
            continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={`transition-transform ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
          >
            <Input
              value={code}
              onChange={e => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="Enter invite code"
              className={`text-center text-lg font-mono tracking-widest h-12 uppercase ${
                error ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={!code.trim() || verify.isPending}
          >
            {verify.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
          Community resource · For educational purposes only
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
