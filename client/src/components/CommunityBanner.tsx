// CommunityBanner — Option A
// Dark charcoal (#111827) base, left-aligned copy, SVG mesh grid on the right.
// Features: dismissible (× button, state saved to localStorage), external link
// confirmation modal before navigating away.

import { useState } from "react";
import { ExternalLink, X } from "lucide-react";

// ── SVG mesh grid ─────────────────────────────────────────────────────────────
function MeshGrid() {
  return (
    <svg
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full opacity-30"
      aria-hidden="true"
    >
      {[0, 56, 112, 168, 224, 280].map(y => (
        <line
          key={`h${y}`}
          x1="0"
          y1={y}
          x2="420"
          y2={y}
          stroke="#3b82f6"
          strokeWidth="0.5"
        />
      ))}
      {[0, 60, 120, 180, 240, 300, 360, 420].map(x => (
        <line
          key={`v${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="280"
          stroke="#3b82f6"
          strokeWidth="0.5"
        />
      ))}
      <line
        x1="180"
        y1="112"
        x2="300"
        y2="224"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />
      <line
        x1="240"
        y1="56"
        x2="360"
        y2="168"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />
      <line
        x1="120"
        y1="168"
        x2="240"
        y2="280"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />
      {[
        [180, 112],
        [240, 112],
        [300, 112],
        [120, 168],
        [180, 168],
        [240, 168],
        [300, 168],
        [360, 168],
        [180, 224],
        [240, 224],
        [300, 224],
        [360, 224],
        [240, 56],
        [300, 56],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="3"
          fill="#3b82f6"
          opacity="0.7"
        />
      ))}
      <circle cx="240" cy="168" r="5" fill="#3b82f6" opacity="0.9" />
      <circle cx="300" cy="112" r="4" fill="#60a5fa" opacity="0.8" />
      <polygon
        points="240,224 300,168 360,224"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

// ── External link confirmation modal ─────────────────────────────────────────
interface ExternalLinkModalProps {
  url: string;
  label: string;
  onClose: () => void;
}
function ExternalLinkModal({ url, label, onClose }: ExternalLinkModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ext-link-title"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl border border-white/10 bg-[#1a2235] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2
          id="ext-link-title"
          className="mb-1 text-base font-semibold text-white"
        >
          You are leaving this guide
        </h2>
        <p className="mb-3 text-sm text-slate-400">
          You are about to open an official Meta careers page in a new tab.
        </p>

        {/* Link preview */}
        <div className="mb-5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <p className="mb-0.5 text-xs font-medium text-slate-400">{label}</p>
          <p className="break-all text-xs text-blue-400">{url}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Open link <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Storage key ───────────────────────────────────────────────────────────────
const DISMISSED_KEY = "meta_community_banner_dismissed_v1";

// ── Main component ────────────────────────────────────────────────────────────
export default function CommunityBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [modal, setModal] = useState<{ url: string; label: string } | null>(
    null
  );

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      /* storage unavailable */
    }
  };

  const openModal = (url: string, label: string, e: React.MouseEvent) => {
    e.preventDefault();
    setModal({ url, label });
  };

  if (dismissed) return null;

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "#111827" }}
        aria-label="About this resource"
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Dismiss banner"
          title="Dismiss — won't show again"
        >
          <X size={14} />
        </button>

        <div className="container relative flex items-stretch min-h-[260px] py-0">
          {/* ── Left: copy ──────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-center py-10 pr-8 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Built from 200+ Candidate Reports.{" "}
              <span className="text-white">Refined for 2026.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-4">
              A community-sourced, independent study resource — not affiliated
              with Meta. Covers IC4–IC7 Behavioral &amp; Coding rounds,
              including the{" "}
              <span className="text-blue-400 font-medium">
                AI-Enabled Coding Round
              </span>
              .
            </p>

            <p className="text-sm text-amber-400 font-medium leading-snug mb-4">
              Always refer first to the official preparation materials your
              recruiter or hiring manager has shared with you.
            </p>

            {/* Official links — open confirmation modal */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
              <button
                onClick={e =>
                  openModal(
                    "https://www.metacareers.com/life/preparing-for-your-software-engineering-interview-at-facebook/",
                    "Technical Screen Guide",
                    e
                  )
                }
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Technical Screen Guide
                <ExternalLink size={12} />
              </button>
              <button
                onClick={e =>
                  openModal(
                    "https://www.metacareers.com/life/get-prepared-for-your-software-engineer-interview/",
                    "Full Loop Interview Guide",
                    e
                  )
                }
                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Full Loop Interview Guide
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Footer badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">
                No affiliation with Meta
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">
                Updated March 2026
              </span>
            </div>
          </div>

          {/* ── Right: mesh grid ─────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center justify-end w-[380px] shrink-0 py-6">
            <MeshGrid />
          </div>
        </div>
      </section>

      {/* External link confirmation modal */}
      {modal && (
        <ExternalLinkModal
          url={modal.url}
          label={modal.label}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
