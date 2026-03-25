/**
 * AdminPinGate — wraps all /admin/* routes.
 *
 * On first visit the user sees a PIN entry modal. The PIN is sent to the
 * server, which validates it against the ADMIN_PIN env var and returns a
 * short-lived signed JWT. That token is stored in module-level memory
 * (cleared on tab close / page refresh) so the modal only appears once
 * per session.
 *
 * The gate is completely bypassed on the standalone static build because
 * there is no server to call — admin routes are not registered there anyway.
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, ShieldX, Lock } from "lucide-react";

// Module-level token store — cleared on tab close / hard refresh
let _adminToken: string | null = null;
let _tokenExpiry: number = 0;

export function getAdminToken(): string | null {
  if (_adminToken && Date.now() < _tokenExpiry) return _adminToken;
  _adminToken = null;
  return null;
}

function setAdminToken(token: string) {
  _adminToken = token;
  // Expire 55 minutes from now (server issues 1h tokens)
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
}

export function clearAdminToken() {
  _adminToken = null;
  _tokenExpiry = 0;
}

interface AdminPinGateProps {
  children: React.ReactNode;
}

export default function AdminPinGate({ children }: AdminPinGateProps) {
  const [unlocked, setUnlocked] = useState(() => !!getAdminToken());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const verify = trpc.auth.verifyAdminPin.useMutation({
    onSuccess: ({ token }) => {
      setAdminToken(token);
      setUnlocked(true);
      setError("");
    },
    onError: () => {
      setError("Incorrect PIN. Try again.");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      inputRef.current?.focus();
    },
  });

  useEffect(() => {
    if (!unlocked) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [unlocked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setError("");
    verify.mutate({ pin: pin.trim() });
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className={`w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-transform ${shake ? "animate-shake" : ""}`}
        style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/10 border-b border-border px-6 py-5 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Lock size={22} className="text-violet-400" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-foreground">Admin Access</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your admin PIN to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={e => {
                setPin(e.target.value);
                setError("");
              }}
              placeholder="Enter PIN"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              disabled={verify.isPending}
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs">
                <ShieldX size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={verify.isPending || !pin.trim()}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {verify.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                Unlock Admin Panel
              </>
            )}
          </button>
        </form>

        <div className="px-6 pb-5 text-center">
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to guide
          </a>
        </div>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
