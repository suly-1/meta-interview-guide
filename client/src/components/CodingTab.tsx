// Design: Structured Clarity — coding tab with full pattern table + expandable pattern cards
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Star, Zap, BookOpen, Clock, MemoryStick } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";

const DIFF_COLORS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

function FrequencyStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < count ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

function PatternRow({ p, onExpand, expanded }: { p: typeof PATTERNS[0]; onExpand: () => void; expanded: boolean }) {
  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors cursor-pointer group"
        onClick={onExpand}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <ChevronRight
              size={14}
              className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
            />
            <span className="font-semibold text-gray-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {p.name}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <FrequencyStars count={p.frequency} />
        </td>
        <td className="py-3 px-4 hidden md:table-cell">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[p.difficultyColor]}`}>
            {p.difficulty}
          </span>
        </td>
        <td className="py-3 px-4 hidden lg:table-cell">
          <p className="text-xs text-gray-600 leading-relaxed max-w-xs">{p.summary}</p>
        </td>
        <td className="py-3 px-4 hidden xl:table-cell">
          <div className="flex flex-wrap gap-1">
            {p.problems.slice(0, 3).map((prob) => (
              <span key={prob} className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {prob}
              </span>
            ))}
            {p.problems.length > 3 && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                +{p.problems.length - 3}
              </span>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Key Idea */}
              <div className="bg-white rounded-xl border border-blue-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Key Idea</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p.keyIdea}</p>
              </div>
              {/* Complexity */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Complexity</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">Time</span>
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono">{p.timeComplexity}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">Space</span>
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono">{p.spaceComplexity}</code>
                  </div>
                </div>
              </div>
              {/* Meta Note */}
              <div className="bg-white rounded-xl border border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Meta Note</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p.metaNote}</p>
              </div>
              {/* All Problems */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Practice Problems</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.problems.map((prob) => (
                    <span key={prob} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                      {prob}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CodingTab() {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedPattern((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-10">
      {/* Overview */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The Coding Interview at Meta IC6/IC7
          </h2>
          <p className="text-sm text-gray-500 mt-1">What to expect, how you are evaluated, and what separates a pass from a fail</p>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          Meta's coding rounds are 45-minute sessions conducted in CoderPad. For IC6 and IC7 candidates, the problem difficulty is typically LeetCode medium, but the bar for code quality, communication, and handling follow-up questions is significantly higher than for junior roles. Interviewers expect clean, production-quality code, proactive edge case handling, and the ability to discuss time and space complexity without prompting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800 mb-1">Two Coding Rounds in 2026</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Meta's full loop now includes <strong>two coding rounds</strong>. One is the traditional LeetCode-style session; the other is the new AI-enabled coding round (introduced October 2025) using CoderPad with an AI assistant.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-1 rounded-full bg-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Meta's Stance on Dynamic Programming</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Meta has officially instructed interviewers <strong>not</strong> to ask pure DP problems. Focus on core patterns, not DP-heavy problems. Recursion + memoization may still appear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Step Approach */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            How to Approach a Problem
          </h2>
          <p className="text-sm text-gray-500 mt-1">A repeatable 7-step process to maximize your score on every problem</p>
        </div>
        <div className="space-y-3">
          {[
            "Clarify constraints: input size, edge cases, expected output format, null handling",
            "Restate the problem in your own words to confirm understanding",
            "Identify the pattern (sliding window? BFS? DP?) — think out loud",
            "State your approach and time/space complexity before coding",
            "Code cleanly with meaningful variable names — no single-letter variables",
            "Test with provided examples, then edge cases (empty input, single element, duplicates)",
            "Optimize if time allows — discuss trade-offs explicitly with the interviewer",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 items-start bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pattern Table */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            14 LeetCode Patterns — Frequency & Summary
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Click any row to expand the key idea, complexity, Meta-specific notes, and practice problems
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span>= Very High Frequency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1,2,3].map(i => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              {[4,5].map(i => <Star key={i} size={11} className="fill-gray-200 text-gray-200" />)}
            </div>
            <span>= Medium Frequency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1,2].map(i => <Star key={i} size={11} className="fill-amber-400 text-amber-400" />)}
              {[3,4,5].map(i => <Star key={i} size={11} className="fill-gray-200 text-gray-200" />)}
            </div>
            <span>= Lower Frequency</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide">Pattern</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide">Frequency</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden md:table-cell">Difficulty</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden lg:table-cell">Summary</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden xl:table-cell">Key Problems</th>
                </tr>
              </thead>
              <tbody>
                {PATTERNS.map((p) => (
                  <PatternRow
                    key={p.id}
                    p={p}
                    expanded={expandedPattern === p.id}
                    onExpand={() => toggle(p.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Click any row to expand details. All 14 patterns listed in descending frequency order.</p>
      </section>

      {/* Resources */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Coding Prep Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { tag: "Platform", tagColor: "blue", title: "NeetCode.io — Meta Practice List", desc: "The NeetCode 150 and 300 lists are the gold standard for Meta prep. Excellent video explanations for every problem, organized by pattern.", url: "https://neetcode.io/practice/company/Meta" },
            { tag: "Platform", tagColor: "amber", title: "LeetCode Premium — Meta Tag", desc: "Filter by 'Meta' company tag to see the most frequently asked problems. Focus on the top 100 Meta-tagged questions.", url: "https://leetcode.com" },
            { tag: "Mock Interviews", tagColor: "emerald", title: "interviewing.io", desc: "Practice anonymous mock interviews with real engineers from Meta and other top companies. Excellent for phone screen prep.", url: "https://interviewing.io" },
            { tag: "AI Coding", tagColor: "teal", title: "Coditioning — AI-Enabled Mocks", desc: "Offers AI-enabled mock interviews that simulate the new Meta coding format, with real practice questions for the AI-assisted round.", url: "https://www.coditioning.com" },
            { tag: "Blog", tagColor: "purple", title: "David Qorashi — Meta SWE Guide", desc: "A Meta engineer's personal prep journey: CLRS → Programming Pearls → EPIP. Includes a day-by-day study plan and mindset advice.", url: "https://daqo.medium.com/facebook-senior-software-engineer-interview-the-only-post-youll-need-to-read-e4604ff2336d" },
            { tag: "Spreadsheet", tagColor: "indigo", title: "500 LeetCode Problems — Dinesh Varyani", desc: "Curated spreadsheet of the top 500 LeetCode problems organized by topic. Tackle at least 30–50 mediums for Meta's standard.", url: "https://docs.google.com/spreadsheets/d/1pnI8HmSMPcfwrCCu7wYETCXaKDig4VucZDpcjVRuYrE/edit" },
          ].map((r) => (
            <a
              key={r.title}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5 inline-block bg-${r.tagColor}-100 text-${r.tagColor}-700`}>
                    {r.tag}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {r.title}
                  </p>
                </div>
                <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
