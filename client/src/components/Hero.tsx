// Design: Structured Clarity — dark navy hero, Meta blue accent, Space Grotesk headings
// Disclaimer: collapsible banner with acknowledgement checkbox persisted to localStorage
import { useState, useEffect } from "react";
import { Code2, MessageSquare, Cpu, Calendar, ChevronDown, ChevronUp, ExternalLink, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "meta-guide-disclaimer-acknowledged-v2";

function DisclaimerBanner() {
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

  return (
    <div className="bg-amber-950 border-b border-amber-700/60">
      <div className="container py-3">
        {/* Header row — always visible */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-start sm:items-center justify-between gap-3 text-left group"
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
                <span className="text-amber-400/80 text-xs ml-2 hidden sm:inline">
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
            <span className="text-amber-400 group-hover:text-amber-200 transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </button>

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
                <p className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-1.5">Independence &amp; Non-Affiliation</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  This is an <strong className="text-amber-100">independent study resource</strong> for software engineering interview preparation. It is{" "}
                  <strong className="text-amber-100">not affiliated with, endorsed by, or connected to Meta Platforms, Inc.</strong>{" "}in any way. All trademarks are property of their respective owners, used here for identification only under nominative fair use.
                </p>

                {/* Accuracy */}
                <p className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-1.5">Accuracy &amp; Currency of Information</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  All content is based on publicly available information and may be <strong className="text-amber-100">outdated, incomplete, or inaccurate</strong>. This is not professional or career advice. Always verify details with your recruiter or hiring manager.
                </p>

                {/* Warranty & Liability */}
                <p className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-1.5">No Warranty &amp; Limitation of Liability</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  This guide is provided <strong className="text-amber-100">&ldquo;AS IS&rdquo;</strong> without warranty of any kind, express or implied. The author(s) shall not be liable for any damages — direct, indirect, incidental, or consequential — arising from your use of or reliance on this guide. <strong className="text-amber-100">No outcome is guaranteed.</strong>
                </p>

                {/* Assumption of Risk */}
                <p className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-1.5">Assumption of Risk &amp; Indemnification</p>
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  By using this guide, you assume all risk, agree you are solely responsible for any decisions made based on its content, and agree to <strong className="text-amber-100">indemnify and hold harmless</strong> the author(s) from any claims arising from your use.
                </p>

                {/* Severability */}
                <p className="text-amber-400/70 text-xs leading-relaxed italic mb-4">
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
                        <Square size={20} className="text-amber-500/70 group-hover/ack:text-amber-300 flex-shrink-0 transition-colors" />
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

export default function Hero() {
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

        <div className="container relative z-10 py-16 md:py-20">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: "Updated March 2026", color: "rgba(8,102,255,0.25)", border: "rgba(8,102,255,0.5)", text: "#93c5fd" },
              { label: "IC6 · IC7 Levels",   color: "rgba(5,150,105,0.2)",  border: "rgba(5,150,105,0.45)", text: "#6ee7b7" },
              { label: "Behavioral & Coding Focus", color: "rgba(217,119,6,0.2)", border: "rgba(217,119,6,0.45)", text: "#fcd34d" },
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
            Meta IC6/IC7
            <br />
            <span className="text-[#4d9fff]">Behavioral &amp; Coding</span>
            <br />
            Interview Guide
          </h1>

          <p className="text-[#93c5fd] text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
            A focused, comprehensive preparation resource for Meta's Behavioral and Coding interview rounds at the Senior and Staff Engineer levels — covering LeetCode patterns, the AI-enabled coding round, Meta's 4 behavioral focus areas, STAR framework, and curated resources.
          </p>

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
        </div>
      </div>
    </div>
  );
}
