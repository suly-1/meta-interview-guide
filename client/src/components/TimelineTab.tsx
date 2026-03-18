// Design: Structured Clarity — timeline tab with 10-week plan, story bank, IC6 vs IC7 bar
import { TIMELINE_WEEKS, STORY_BANK } from "@/lib/guideData";
import { CheckCircle2 } from "lucide-react";

const TAG_COLORS: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  indigo:  "bg-indigo-100 text-indigo-700",
  teal:    "bg-teal-100 text-teal-700",
  amber:   "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

const CONNECTOR_COLORS: Record<string, string> = {
  blue:    "bg-blue-500",
  indigo:  "bg-indigo-500",
  teal:    "bg-teal-500",
  amber:   "bg-amber-500",
  emerald: "bg-emerald-500",
};

export default function TimelineTab() {
  return (
    <div className="space-y-10">
      {/* 10-Week Plan */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            10-Week Study Timeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">A structured preparation plan focused on Coding and Behavioral — from foundations to interview-ready</p>
        </div>
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800 mb-1">How to Use This Timeline</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              This plan assumes roughly 2–3 hours of focused study per day. Adjust the pace to your schedule. The most important principle: <strong>active recall beats passive reading</strong>. Solve problems under timed conditions, practice speaking your solutions out loud, and do mock interviews from Week 6 onward.
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[88px] top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />

          <div className="space-y-4">
            {TIMELINE_WEEKS.map((w, i) => (
              <div key={i} className="flex gap-4 sm:gap-6 items-start">
                {/* Week label */}
                <div className="flex-shrink-0 w-[80px] text-right hidden sm:block">
                  <span className="text-xs font-bold text-blue-600 leading-tight">{w.weeks}</span>
                </div>
                {/* Dot */}
                <div className={`hidden sm:flex flex-shrink-0 w-4 h-4 rounded-full ${CONNECTOR_COLORS[w.tagColor]} border-2 border-white shadow-sm mt-1 z-10`} />
                {/* Card */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-bold text-blue-600 sm:hidden block mb-1">{w.weeks}</span>
                      <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {w.focus}
                      </h4>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_COLORS[w.tagColor]}`}>
                      {w.tag}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STAR Story Bank */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your STAR Story Bank
          </h2>
          <p className="text-sm text-gray-500 mt-1">The 8 story types you must have prepared before your behavioral interview</p>
        </div>
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide">Story Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden md:table-cell">Focus Areas Covered</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden lg:table-cell">Meta Values Demonstrated</th>
                </tr>
              </thead>
              <tbody>
                {STORY_BANK.map((s, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="py-3 px-4 text-xs font-bold text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 text-sm">{s.type}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 hidden md:table-cell">{s.focusAreas}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 hidden lg:table-cell">{s.values}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* IC6 vs IC7 Bar */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            IC6 vs. IC7 Behavioral Bar
          </h2>
          <p className="text-sm text-gray-500 mt-1">What distinguishes a Senior Engineer answer from a Staff Engineer answer</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-blue-900 text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              IC6 — Senior Engineer
            </h3>
            <ul className="space-y-2.5">
              {[
                "Owns a significant technical scope within a team",
                "Drives cross-functional alignment on a project level",
                "Resolves ambiguous problems independently",
                "Mentors junior engineers on the team",
                "Communicates technical decisions clearly to stakeholders",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-blue-800">
                  <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <h3 className="font-bold text-indigo-900 text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              IC7 — Staff Engineer
            </h3>
            <ul className="space-y-2.5">
              {[
                "Defines technical strategy for an entire product surface",
                "Drives org-wide architecture decisions across teams",
                "Influences engineering culture and practices",
                "Mentors senior engineers across multiple teams",
                "Justifies architectural decisions with business impact at the org level",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-indigo-800">
                  <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
