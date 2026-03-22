/**
 * CandidateDiscovery — a standalone entry page that frames the guide as
 * something the candidate found independently, not something distributed by
 * a company employee. This page is linked to from the hero share message.
 *
 * URL: /discover  (or share as the landing URL instead of /)
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { ExternalLink, Globe, Users, BookOpen, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const STORAGE_KEY = "meta-guide-discovery-seen-v1";

export default function CandidateDiscovery() {
  const [, setLocation] = useLocation();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleEnter = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white flex flex-col items-center justify-center px-4 py-16">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-2xl w-full"
      >
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/60">
            <Globe size={12} />
            Publicly Available Community Resource
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-4xl md:text-5xl font-extrabold text-center leading-tight mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          You Found This Guide
          <br />
          <span className="text-[#4d9fff]">On Your Own.</span>
        </h1>

        <p className="text-center text-white/60 text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto">
          This is a free, community-sourced study resource for software engineering interviews.
          It is publicly available on the internet and was not distributed to you by any company employee
          as official preparation material.
        </p>

        {/* Three pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: <ShieldCheck size={22} className="text-emerald-400" />,
              title: "Independent",
              desc: "Not affiliated with, endorsed by, or connected to any company. Built by the community, for the community.",
            },
            {
              icon: <Users size={22} className="text-blue-400" />,
              title: "Community-Sourced",
              desc: "Synthesized from 200+ publicly available candidate reports, forums, YouTube channels, and published books.",
            },
            {
              icon: <BookOpen size={22} className="text-amber-400" />,
              title: "General SWE Prep",
              desc: "Covers Staff Engineer interview patterns applicable to FAANG-style interviews — not proprietary to any one company.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3"
            >
              {p.icon}
              <p className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.title}
              </p>
              <p className="text-white/50 text-xs leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Official prep reminder */}
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 p-4 mb-8 flex flex-col sm:flex-row sm:items-start gap-3">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-amber-300 text-sm font-bold mb-1">Always refer to official preparation materials first.</p>
            <p className="text-amber-200/70 text-xs leading-relaxed mb-2">
              If a recruiter or hiring manager has shared official prep resources with you, those take priority.
              This guide is a supplement — not a replacement.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <a
                href="https://www.metacareers.com/swe-prep-techscreen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4d9fff] hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
              >
                Technical Screen Guide <ExternalLink size={10} />
              </a>
              <a
                href="https://www.metacareers.com/swe-prep-onsite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4d9fff] hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors"
              >
                Full Loop Interview Guide <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Acknowledgement + Enter */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setAcknowledged((v) => !v)}
            className="flex items-center gap-2.5 group"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                acknowledged
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-white/30 group-hover:border-white/60"
              }`}
            >
              {acknowledged && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors text-left">
              I understand this is an independent community resource, not affiliated with any company,
              and I will refer to official materials provided by my recruiter.
            </span>
          </button>

          <motion.button
            whileHover={{ scale: acknowledged ? 1.02 : 1 }}
            whileTap={{ scale: acknowledged ? 0.98 : 1 }}
            onClick={handleEnter}
            disabled={!acknowledged}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base transition-all ${
              acknowledged
                ? "bg-[#4d9fff] text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Enter the Guide
            <ArrowRight size={18} />
          </motion.button>

          <p className="text-white/30 text-xs text-center max-w-sm">
            By entering, you acknowledge this is a community resource provided without warranty.
            No outcome is guaranteed.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
