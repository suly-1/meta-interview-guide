// DisclaimerGate — full-screen blocker that must be explicitly acknowledged
// before any guide content is visible. Persists to localStorage.
// Key: "meta_prep_disclaimer_v1"

import { useState } from "react";
import { ShieldAlert, CheckSquare, Square } from "lucide-react";

const STORAGE_KEY = "meta_prep_disclaimer_v1";

export function useDisclaimerAcknowledged(): [boolean, () => void] {
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false;
  const [acknowledged, setAcknowledged] = useState(stored);

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setAcknowledged(true);
  };

  return [acknowledged, confirm];
}

interface Props {
  onConfirm: () => void;
}

export default function DisclaimerGate({ onConfirm }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    /* Full-viewport overlay — sits above everything, z-index 9999 */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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

      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-[oklch(0.13_0.02_264)] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Amber top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        <div className="p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25">
              <ShieldAlert size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Important Disclaimer
              </h1>
              <p className="text-sm text-amber-300/80 mt-0.5">
                Please read carefully before proceeding
              </p>
            </div>
          </div>

          {/* Disclaimer body */}
          <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
            <p>
              This guide is an <strong className="text-white">independent study resource</strong> created
              to help engineers prepare for software engineering interviews at senior levels (IC6/IC7).
              It is <strong className="text-white">not affiliated with, endorsed by, sponsored by, or
              connected to Meta Platforms, Inc.</strong> in any way.
            </p>
            <p>
              All company names, product names, and trademarks mentioned are the property of their
              respective owners. References to Meta, its interview process, or its engineering levels
              are based on <strong className="text-white">publicly available information and community
              reports</strong> only, and do not represent official guidance from Meta.
            </p>
            <p>
              Interview formats, evaluation criteria, and level expectations{" "}
              <strong className="text-white">change frequently</strong>. The information in this guide
              may be outdated, incomplete, or inaccurate.{" "}
              <strong className="text-white">
                Always verify current details directly with your recruiter or hiring manager.
              </strong>
            </p>
            <p>
              This guide is provided <strong className="text-white">"as is"</strong> without warranty
              of any kind. The author(s) accept no liability for decisions made based on its content.
              Use it as one input among many — not as a definitive source of truth.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Checkbox acknowledgment */}
          <button
            onClick={() => setChecked((c) => !c)}
            className="flex items-start gap-3 w-full text-left group"
            aria-pressed={checked}
          >
            <span className="shrink-0 mt-0.5 transition-colors">
              {checked ? (
                <CheckSquare size={20} className="text-emerald-400" />
              ) : (
                <Square size={20} className="text-zinc-500 group-hover:text-zinc-300" />
              )}
            </span>
            <span
              className={`text-sm font-medium transition-colors ${
                checked ? "text-emerald-300" : "text-zinc-400 group-hover:text-zinc-200"
              }`}
            >
              I have read and understood this disclaimer. I acknowledge that this guide is an
              independent resource, not affiliated with Meta Platforms, Inc., and that I will
              verify current interview details with my recruiter.
            </span>
          </button>

          {/* Confirm button */}
          <button
            onClick={() => { if (checked) onConfirm(); }}
            disabled={!checked}
            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
              checked
                ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 cursor-pointer"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {checked ? "I Understand — Enter the Guide →" : "Check the box above to continue"}
          </button>

          <p className="text-center text-xs text-zinc-600">
            Your acknowledgment is saved locally in your browser. You will not see this screen again on this device.
          </p>
        </div>
      </div>
    </div>
  );
}
