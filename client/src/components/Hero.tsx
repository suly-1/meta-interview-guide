// Design: Structured Clarity — dark navy hero, Meta blue accent, Space Grotesk headings
// Disclaimer: collapsible banner with acknowledgement checkbox persisted to localStorage
import { useState, useEffect, useRef } from "react";
import { Code2, MessageSquare, Cpu, Calendar, CalendarDays, ChevronDown, ChevronUp, ExternalLink, CheckSquare, Square, X, Pencil, Share2, Check } from "lucide-react";
import { useICLevel } from "@/contexts/ICLevelContext";
import { motion, AnimatePresence } from "framer-motion";
import { useInterviewCountdown } from "@/hooks/useInterviewCountdown";

const STORAGE_KEY = "meta-guide-disclaimer-acknowledged-v2";
const DISMISSED_KEY = "meta-guide-banner-dismissed-v1";

/** Exported so the footer can call it to restore the banner */
export function restoreDisclaimerBanner() {
  try {
    localStorage.removeItem(DISMISSED_KEY);
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

function DisclaimerBanner() {
  // Dismissed = banner fully hidden for returning users
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Read acknowledgement from localStorage on first render
  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Start collapsed if already acknowledged, expanded otherwise
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });

  // Persist acknowledgement to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(acknowledged));
    } catch {
      // ignore
    }
  }, [acknowledged]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    // Small delay so the user sees the checkbox tick before the banner collapses
    setTimeout(() => setExpanded(false), 400);
  };

  const handleUnacknowledge = () => {
    setAcknowledged(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  // All hooks declared above — safe to conditionally render now
  if (dismissed) return null;

  return (
    <div className="bg-amber-950 border-b border-amber-700/60">
      <div className="container py-3">
        {/* Header row — always visible */}
        <div className="flex items-start gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-start sm:items-center justify-between gap-3 text-left group"
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-base leading-none mt-0.5 sm:mt-0 flex-shrink-0">⚠️</span>
            <div>
              <span
                className="text-sm font-bold text-amber-200 tracking-wide"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Important Disclaimer
              </span>
              {acknowledged && !expanded ? (
                <span className="text-emerald-400 text-xs ml-2 hidden sm:inline font-medium">
                  ✓ Acknowledged — click to review again
                </span>
              ) : !expanded ? (
                <span className="text-amber-900/80 text-xs ml-2 hidden sm:inline">
                  — Supplementary material only. Click to read in full.
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5 sm:mt-0">
            {acknowledged && !expanded && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                <CheckSquare size={10} />
                Acknowledged
              </span>
            )}
            <span className="text-amber-900 group-hover:text-amber-200 transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </button>
        {/* Dismiss button — hides banner permanently for returning users */}
        <button
          onClick={handleDismiss}
          title="Dismiss banner"
          className="flex-shrink-0 mt-0.5 text-amber-800 hover:text-amber-200 transition-colors p-1 rounded hover:bg-amber-900/60"
          aria-label="Dismiss disclaimer banner"
        >
          <X size={14} />
        </button>
        </div>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="disclaimer-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1 border-t border-amber-700/40 mt-3">
                {/* Independence & Non-Affiliation */}
                <p className="text-amber-800/80 text-xs font-bold uppercase tracking-widest mb-1.5">Independence &amp; Non-Affiliation</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  This is an <strong className="text-amber-100">independent study resource</strong> for software engineering interview preparation. It is{" "}
                  <strong className="text-amber-100">not affiliated with, endorsed by, or connected to Meta Platforms, Inc.</strong>{" "}in any way. All trademarks are property of their respective owners, used here for identification only under nominative fair use.
                </p>

                {/* Accuracy */}
                <p className="text-amber-800/80 text-xs font-bold uppercase tracking-widest mb-1.5">Accuracy &amp; Currency of Information</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  All content is based on publicly available information and may be <strong className="text-amber-100">outdated, incomplete, or inaccurate</strong>. This is not professional or career advice. Always verify details with your recruiter or hiring manager.
                </p>

                {/* Warranty & Liability */}
                <p className="text-amber-800/80 text-xs font-bold uppercase tracking-widest mb-1.5">No Warranty &amp; Limitation of Liability</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  This guide is provided <strong className="text-amber-100">&ldquo;AS IS&rdquo;</strong> without warranty of any kind, express or implied. The author(s) shall not be liable for any damages — direct, indirect, incidental, or consequential — arising from your use of or reliance on this guide. <strong className="text-amber-100">No outcome is guaranteed.</strong>
                </p>

                {/* Assumption of Risk */}
                <p className="text-amber-800/80 text-xs font-bold uppercase tracking-widest mb-1.5">Assumption of Risk &amp; Indemnification</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  By using this guide, you assume all risk, agree you are solely responsible for any decisions made based on its content, and agree to <strong className="text-amber-100">indemnify and hold harmless</strong> the author(s) from any claims arising from your use.
                </p>

                {/* Severability */}
                <p className="text-amber-900/70 text-xs leading-relaxed italic mb-4">
                  If any provision of this disclaimer is unenforceable, the remainder shall remain in effect.
                </p>

                {/* Acknowledgement checkbox */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-amber-700/30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (acknowledged) {
                        handleUnacknowledge();
                      } else {
                        handleAcknowledge();
                      }
                    }}
                    className={`flex items-center gap-2.5 group/ack transition-all ${
                      acknowledged ? "opacity-80 hover:opacity-100" : ""
                    }`}
                  >
                    <motion.div
                      animate={acknowledged ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {acknowledged ? (
                        <CheckSquare size={20} className="text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Square size={20} className="text-amber-500/70 group-hover/ack:text-amber-800 flex-shrink-0 transition-colors" />
                      )}
                    </motion.div>
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        acknowledged
                          ? "text-emerald-400"
                          : "text-amber-200/80 group-hover/ack:text-amber-100"
                      }`}
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {acknowledged
                        ? "Acknowledged — click to undo"
                        : "☑️ I acknowledge this guide is independent, not affiliated with Meta, provided without warranty, and that I assume all risk of use."}
                    </span>
                  </button>

                  {acknowledged && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[11px] font-bold bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2.5 py-1 rounded-full flex-shrink-0"
                    >
                      ✓ Saved
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const SHARE_MESSAGE = `I came across this community-built study resource online — the L4/L7 Community Study Resource. It covers general SWE interview patterns for L4–L7 levels. It's independent, not affiliated with any company, and clearly marked as a community resource. Totally optional — just sharing as a supplement to the official prep materials your recruiter sent: https://metaengguide.pro`;

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = SHARE_MESSAGE;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };
  return (
    <div className="mt-5 max-w-2xl">
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
          copied
            ? "bg-emerald-700/40 border-emerald-500/60 text-emerald-300"
            : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/40"
        }`}
      >
        {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
        {copied ? "Message copied to clipboard!" : "Copy safe share message"}
      </button>
      {copied && (
        <p className="mt-2 text-xs text-white/80 leading-relaxed max-w-lg">
          Paste this into WhatsApp, LinkedIn DM, or personal email. It frames the guide as a community resource you found online — not official Meta prep material.
        </p>
      )}
    </div>
  );
}

export default function Hero() {
  const { icLevel, setICLevel } = useICLevel();

  return (
    <div>
      <DisclaimerBanner />

      <div className="relative overflow-hidden bg-[#0d1b2a] text-white">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glows */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 50%, rgba(8,102,255,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(13,148,136,0.12) 0%, transparent 50%)",
          }}
        />

        {/* ── Screen Interview typographic treatment ── */}
        {/* Recommendation #9 + #5: split-color bold stack with ghost outline */}
        <div
          aria-hidden="true"
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none hidden lg:flex flex-col items-end pr-10 xl:pr-16 gap-0 leading-none"
        >
          {/* SCREEN — stroke-only ghost outline, light weight */}
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(4rem, 7vw, 7.5rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              WebkitTextStroke: "1.5px rgba(255,255,255,0.35)",
              color: "transparent",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            SCREEN
          </span>
          {/* INTERVIEW — solid Meta blue, heavy weight */}
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(4rem, 7vw, 7.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#0864ff",
              lineHeight: 1,
              textTransform: "uppercase",
              textShadow: "0 0 40px rgba(8,100,255,0.45), 0 0 80px rgba(8,100,255,0.2)",
            }}
          >
            INTERVIEW
          </span>
        </div>

        <div className="container relative z-10 py-16 md:py-20">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: "Updated March 2026", color: "rgba(8,102,255,0.25)", border: "rgba(8,102,255,0.5)", text: "#93c5fd" },
              { label: "L4 · L5 · L6 · L7",   color: "rgba(5,150,105,0.2)",  border: "rgba(5,150,105,0.45)", text: "#6ee7b7" },
              { label: "Behavioral & Coding Focus", color: "rgba(217,119,6,0.2)", border: "rgba(217,119,6,0.45)", text: "#fcd34d" },
              { label: "Community Resource · Not affiliated with Meta", color: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.2)", text: "#cbd5e1" },
            ].map((b) => (
              <span
                key={b.label}
                className="text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{ background: b.color, borderColor: b.border, color: b.text }}
              >
                {b.label}
              </span>
            ))}
          </div>

          {/* Heading */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="text-[#4d9fff]">L4/L7 Community Study Resource</span>
          </h1>

          <p className="text-[#93c5fd] text-base md:text-lg max-w-2xl mb-4 leading-relaxed">
            Built from 200+ publicly available candidate reports. Refined for 2026. A community-sourced, independent study resource — not affiliated with any company. Covers L4–L7 Behavioral &amp; Coding rounds, including the AI-Enabled Coding Round, 14 LeetCode patterns, STAR framework, and curated resources.
          </p>

          {/* Official prep notice */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-8 p-3 rounded-xl border border-white/10 bg-white/5 max-w-2xl">
            <span className="text-amber-800 text-xs font-bold uppercase tracking-widest flex-shrink-0">⚠ Always refer first to</span>
            <span className="text-white/90 text-xs hidden sm:inline">|</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-white/90">the official preparation materials your recruiter or hiring manager shared with you, including:</span>
              <a
                href="https://www.metacareers.com/swe-prep-techscreen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4d9fff] hover:text-blue-300 font-semibold transition-colors underline underline-offset-2"
              >
                Technical Screen Guide
                <ExternalLink size={10} />
              </a>
              <span className="text-white/30">&middot;</span>
              <a
                href="https://www.metacareers.com/swe-prep-onsite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4d9fff] hover:text-blue-300 font-semibold transition-colors underline underline-offset-2"
              >
                Full Loop Interview Guide
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* IC Level Selector */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-white/85 text-xs font-bold uppercase tracking-widest">Your Level:</span>
            <div className="flex rounded-lg overflow-hidden border border-white/20 text-sm font-semibold">
              <button
                onClick={() => setICLevel("junior")}
                className={`px-4 py-1.5 transition-all ${
                  icLevel === "junior"
                    ? "bg-emerald-600 text-white"
                    : "bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                }`}
                title="L4 — Junior Engineer"
              >
                L4
              </button>
              <button
                onClick={() => setICLevel("mid")}
                className={`px-4 py-1.5 transition-all border-l border-white/10 ${
                  icLevel === "mid"
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                }`}
                title="L5 — Senior Engineer"
              >
                L5 / Senior
              </button>
              <button
                onClick={() => setICLevel("senior")}
                className={`px-4 py-1.5 transition-all border-l border-white/10 ${
                  icLevel === "senior"
                    ? "bg-[#4d9fff] text-white"
                    : "bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                }`}
                title="L6/L7 — Staff / Senior Staff Engineer"
              >
                L6 / L7
              </button>
            </div>
            {icLevel === "junior" && (
              <span className="text-emerald-400 text-xs font-medium">
                L4 view — senior &amp; staff sections hidden
              </span>
            )}
            {icLevel === "mid" && (
              <span className="text-violet-400 text-xs font-medium">
                L5 / Senior view — staff-only sections hidden
              </span>
            )}
          </div>

          {/* Pill features */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Code2 size={13} />,       label: "14 LeetCode Patterns" },
              { icon: <Cpu size={13} />,          label: "AI-Enabled Round"     },
              { icon: <MessageSquare size={13} />, label: "Behavioral Prep"     },
              { icon: <Calendar size={13} />,     label: "10-Week Timeline"     },
            ].map((p) => (
              <span
                key={p.label}
                className="flex items-center gap-1.5 text-[13px] text-white/80 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all"
              >
                {p.icon}
                {p.label}
              </span>
            ))}
          </div>

          {/* Share Button */}
          <ShareButton />

          {/* Interview Countdown Clock */}
          <HeroCountdown />
        </div>
      </div>
    </div>
  );
}

// ─── Hero Countdown Clock ─────────────────────────────────────────────────────
function HeroCountdown() {
  const { dateStr, setDateStr, daysLeft } = useInterviewCountdown();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(dateStr);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputVal(dateStr); }, [dateStr]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleSave = () => {
    setDateStr(inputVal);
    setEditing(false);
  };

  const handleClear = () => {
    setDateStr("");
    setInputVal("");
    setEditing(false);
  };

  const urgencyConfig = (() => {
    if (daysLeft === null) return null;
    if (daysLeft <= 0)  return { label: "Interview day!",  bg: "rgba(239,68,68,0.25)",   border: "rgba(239,68,68,0.6)",   text: "#fca5a5",  glow: "rgba(239,68,68,0.4)" };
    if (daysLeft <= 3)  return { label: `D-${daysLeft}`,   bg: "rgba(239,68,68,0.2)",    border: "rgba(239,68,68,0.5)",   text: "#fca5a5",  glow: "rgba(239,68,68,0.35)" };
    if (daysLeft <= 7)  return { label: `D-${daysLeft}`,   bg: "rgba(245,158,11,0.2)",   border: "rgba(245,158,11,0.5)",  text: "#fcd34d",  glow: "rgba(245,158,11,0.3)" };
    if (daysLeft <= 14) return { label: `D-${daysLeft}`,   bg: "rgba(59,130,246,0.2)",   border: "rgba(59,130,246,0.5)",  text: "#93c5fd",  glow: "rgba(59,130,246,0.3)" };
    return              { label: `D-${daysLeft}`,          bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.45)", text: "#6ee7b7",  glow: "rgba(16,185,129,0.25)" };
  })();

  const urgencyNote = (() => {
    if (daysLeft === null) return null;
    if (daysLeft <= 0)  return "Today is the day — you've got this!";
    if (daysLeft <= 3)  return "Final stretch — review your weakest patterns and STAR stories.";
    if (daysLeft <= 7)  return "One week out — focus on mock interviews and behavioral polish.";
    if (daysLeft <= 14) return "Two weeks — good time for full system design walkthroughs.";
    if (daysLeft <= 28) return "Solid runway — keep your daily streak going.";
    return "Plenty of time — build strong fundamentals now.";
  })();

  return (
    <div className="mt-8">
      {!dateStr && !editing ? (
        // Empty state — invite user to set a date
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 text-sm text-white/85 hover:text-white/80 border border-white/20 hover:border-white/40 px-4 py-2 rounded-full transition-all"
        >
          <CalendarDays size={14} />
          Set your interview date for a countdown
        </button>
      ) : editing ? (
        // Date input
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white/10 border border-white/30 rounded-xl px-3 py-2">
            <CalendarDays size={14} className="text-white/90" />
            <input
              ref={inputRef}
              type="date"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className="bg-transparent text-white text-sm font-medium outline-none [color-scheme:dark] min-w-[130px]"
            />
          </div>
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl transition-colors"
          >Save</button>
          <button
            onClick={() => setEditing(false)}
            className="p-2 text-white/85 hover:text-white/80 transition-colors"
          ><X size={14} /></button>
        </div>
      ) : urgencyConfig ? (
        // Active countdown display
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3"
        >
          {/* D-minus badge */}
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border"
            style={{
              background: urgencyConfig.bg,
              borderColor: urgencyConfig.border,
              boxShadow: `0 0 16px ${urgencyConfig.glow}`,
            }}
          >
            <CalendarDays size={16} style={{ color: urgencyConfig.text }} />
            <div>
              <div
                className="text-2xl font-black leading-none tracking-tight"
                style={{ color: urgencyConfig.text, fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {urgencyConfig.label}
              </div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: urgencyConfig.text, opacity: 0.75 }}>
                {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </div>

          {/* Urgency note */}
          {urgencyNote && (
            <p className="text-sm text-white/90 max-w-xs leading-snug">{urgencyNote}</p>
          )}

          {/* Edit / clear */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setEditing(true)}
              title="Change interview date"
              className="p-1.5 text-white/30 hover:text-white/70 rounded-lg transition-colors"
            ><Pencil size={12} /></button>
            <button
              onClick={handleClear}
              title="Clear interview date"
              className="p-1.5 text-white/30 hover:text-white/70 rounded-lg transition-colors"
            ><X size={12} /></button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
