// Design: Structured Clarity — dark navy hero, Meta blue accent, Space Grotesk headings
// Disclaimer: collapsible banner with acknowledgement checkbox persisted to localStorage
import { useState, useEffect } from "react";
import { Code2, MessageSquare, Cpu, Calendar, ChevronDown, ChevronUp, ExternalLink, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "meta-guide-disclaimer-acknowledged";

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
                <p className="text-amber-200/90 text-sm leading-relaxed mb-3">
                  This guide is provided as{" "}
                  <strong className="text-amber-100">supplementary preparation material only</strong>{" "}
                  and is intended to offer additional support as you prepare for your upcoming interviews. It does not replace any official communication or preparation resources.
                </p>

                <p className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-2">
                  Please note:
                </p>

                <ul className="space-y-2 mb-4">
                  {[
                    "Your official interview preparation materials will be sent to you directly via email — please follow those guidelines closely.",
                    null, // metacareers link — rendered separately
                    "If there is any discrepancy between this guide and the official materials, always defer to the official resources.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-amber-200/80 leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                      {i === 1 ? (
                        <span>
                          For the most up-to-date and comprehensive guidance on Meta's interview process, please visit{" "}
                          <a
                            href="https://metacareers.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-300 underline underline-offset-2 hover:text-amber-100 inline-flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            metacareers.com
                            <ExternalLink size={11} className="inline ml-0.5" />
                          </a>
                          .
                        </span>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>

                {/* Confidentiality notice */}
                <div className="flex gap-2.5 p-3 bg-amber-900/50 border border-amber-700/50 rounded-lg mb-4">
                  <span className="text-amber-400 flex-shrink-0 text-sm">🔒</span>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    <strong className="text-amber-200">Confidential:</strong> This document is shared in confidence to support your preparation. Please do not distribute, copy, or share its contents externally.
                  </p>
                </div>

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
                        : "I have read and understood this disclaimer"}
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
