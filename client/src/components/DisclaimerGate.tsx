// DisclaimerGate — full-screen blocker that must be explicitly acknowledged
// before any guide content is visible.
//
// Gating logic:
//   - Anonymous users: localStorage key "meta_prep_disclaimer_v2" === "true"
//   - Logged-in users: DB record (disclaimerAcknowledgedAt IS NOT NULL) is the
//     authoritative source. localStorage is still written as a fast-path cache,
//     but if the DB says "not acknowledged" the gate is shown regardless.
//
// On confirm:
//   1. Write localStorage (instant local gate release)
//   2. Call disclaimer.acknowledge tRPC mutation (write DB timestamp)
//   3. Invalidate disclaimer.status query so the badge in OverviewTab refreshes

import { useState } from "react";
import { CheckSquare, Square, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const STORAGE_KEY = "meta_prep_disclaimer_v2";

/**
 * Returns [isGateOpen, confirmFn].
 *
 * isGateOpen === true  → show the gate (block content)
 * isGateOpen === false → content is accessible
 *
 * For anonymous users the gate is driven purely by localStorage.
 * For logged-in users the gate stays open until the DB record confirms
 * acknowledgment (with a loading state while the query is in-flight).
 */
export function useDisclaimerGate(): {
  gateOpen: boolean;
  initializing: boolean;
  confirm: () => void;
} {
  const { user, loading: authLoading } = useAuth();

  // Local fast-path: did this browser already acknowledge?
  const localAck =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false;

  const [localConfirmed, setLocalConfirmed] = useState(localAck);

  // DB status query — only runs for logged-in users
  const utils = trpc.useUtils();
  const acknowledgeMutation = trpc.disclaimer.acknowledge.useMutation({
    onSuccess: () => {
      utils.disclaimer.status.invalidate();
    },
  });

  const { data: dbStatus, isLoading: dbLoading } =
    trpc.disclaimer.status.useQuery(undefined, {
      // Only fetch when user is logged in and hasn't already confirmed locally
      enabled: !!user && !localConfirmed,
      staleTime: 0,
    });

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setLocalConfirmed(true);
    // Fire DB write; errors are silently ignored (user may be anonymous)
    acknowledgeMutation.mutate(undefined, {
      onError: () => {},
    });
  };

  // While auth is still loading — render nothing (no gate, no spinner)
  if (authLoading) return { gateOpen: false, initializing: true, confirm };

  // Anonymous user: gate driven by localStorage only — no DB check needed
  if (!user) return { gateOpen: !localConfirmed, initializing: false, confirm };

  // Logged-in + already confirmed locally — skip gate immediately
  if (localConfirmed) return { gateOpen: false, initializing: false, confirm };

  // Logged-in, not locally confirmed: DB query is in-flight
  // → render nothing until we know the answer (no spinner, no gate flash)
  if (dbLoading) return { gateOpen: false, initializing: true, confirm };

  // DB says acknowledged → sync localStorage and skip gate
  if (dbStatus?.acknowledged) {
    localStorage.setItem(STORAGE_KEY, "true");
    return { gateOpen: false, initializing: false, confirm };
  }

  // DB says not acknowledged → show gate (no spinner needed — we have the answer)
  return { gateOpen: true, initializing: false, confirm };
}

// Legacy hook kept for backward compatibility (used in Home.tsx)
export function useDisclaimerAcknowledged(): [boolean, () => void] {
  const { gateOpen, confirm } = useDisclaimerGate();
  return [!gateOpen, confirm];
}

interface Props {
  onConfirm: () => void;
}

export default function DisclaimerGate({ onConfirm }: Props) {
  const [checked, setChecked] = useState(false);

  const handleConfirm = () => {
    if (!checked) return;
    onConfirm();
  };

  return (
    /* Full-viewport overlay — sits above everything, z-index 9999 */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, oklch(0.18 0.04 264) 0%, oklch(0.08 0.015 264) 100%)",
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0 0) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[oklch(0.13_0.02_264)] shadow-2xl shadow-black/60 overflow-hidden my-8">
        {/* Blue top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700" />

        <div className="p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25">
              <BookOpen size={22} className="text-blue-400" />
            </div>
            <div>
              <h1
                className="text-xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Quick note before you start
              </h1>
              <p className="text-sm text-blue-300/70 mt-0.5">
                A note from The Architect
              </p>
            </div>
          </div>

          {/* Main body */}
          <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
            <p>
              This guide was designed by{" "}
              <strong className="text-white">The Architect</strong> — a Meta
              engineer who wanted candidates to succeed. It's{" "}
              <strong className="text-white">not affiliated with any company</strong>{" "}
              — just hard-won knowledge shared openly.
            </p>
            <p>
              Always pair it with any official guidance you receive. Interview
              formats evolve, and official sources are the source of truth.
            </p>
          </div>

          {/* "The legal bit" plain-talk card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-300">
              The legal bit, in plain English:
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This is a free resource provided as-is by The Architect. It is
              not responsible for your interview outcomes or any decisions you
              make based on it. No warranties, no guarantees — just good faith
              effort from someone who has been through it.
            </p>
          </div>

          {/* Community resource proof box */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-blue-400">
              🌐 Free community resource
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Openly available at{" "}
              <span className="text-blue-400">{window.location.hostname}</span>{" "}
              — designed and shared by The Architect, for engineers.
            </p>
          </div>

          {/* Checkbox acknowledgment */}
          <button
            onClick={() => setChecked(c => !c)}
            className="flex items-start gap-3 w-full text-left group"
            aria-pressed={checked}
          >
            <span className="shrink-0 mt-0.5 transition-colors">
              {checked ? (
                <CheckSquare size={20} className="text-emerald-400" />
              ) : (
                <Square
                  size={20}
                  className="text-zinc-500 group-hover:text-zinc-300"
                />
              )}
            </span>
            <span
              className={`text-sm transition-colors ${
                checked
                  ? "text-emerald-300"
                  : "text-zinc-400 group-hover:text-zinc-200"
              }`}
            >
              I'm using this guide for my own interview prep and understand
              it's a free resource from The Architect with no guarantees.
            </span>
          </button>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!checked}
            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
              checked
                ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 cursor-pointer"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {checked ? (
              "Sounds good — enter the guide →"
            ) : (
              "Check the box above to continue"
            )}
          </button>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-center text-xs text-zinc-600">
              Your choice is saved locally. You won't see this screen again on
              this device.
            </p>
            <button
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, "true");
                onConfirm();
              }}
              className="text-xs text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors"
            >
              I've seen this before — skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
