// Design: Structured Clarity — dark navy hero, Meta blue accent, Space Grotesk headings
import { Code2, MessageSquare, Cpu, Calendar } from "lucide-react";

export default function Hero() {
  return (
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
            { label: "IC6 · IC7 Levels", color: "rgba(5,150,105,0.2)", border: "rgba(5,150,105,0.45)", text: "#6ee7b7" },
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
            { icon: <Code2 size={13} />, label: "14 LeetCode Patterns" },
            { icon: <Cpu size={13} />, label: "AI-Enabled Round" },
            { icon: <MessageSquare size={13} />, label: "Behavioral Prep" },
            { icon: <Calendar size={13} />, label: "10-Week Timeline" },
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
  );
}
