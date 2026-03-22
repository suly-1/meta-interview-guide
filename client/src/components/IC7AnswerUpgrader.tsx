// IC7AnswerUpgrader — side-by-side L6 vs L7 answer snippets for the same scenario
// Makes the scope delta concrete and easy to internalize
import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowRight } from "lucide-react";

interface AnswerExample {
  scenario: string;
  areaId: string;
  areaLabel: string;
  areaColor: string;
  areaBg: string;
  areaBorder: string;
  ic6Answer: string;
  ic7Answer: string;
  ic6Signals: string[];
  ic7Signals: string[];
  keyDelta: string;
}

const ANSWER_EXAMPLES: AnswerExample[] = [
  {
    scenario: "High-Impact Technical Project",
    areaId: "xfn",
    areaLabel: "XFN Collaboration & Scope",
    areaColor: "#1e3a8a",
    areaBg: "#eff6ff",
    areaBorder: "#bfdbfe",
    ic6Answer: "I led the migration of our monolithic auth service to a microservice. I worked with the backend team to define the API contract, coordinated with the security team for compliance review, and shipped it in Q3. It reduced latency by 40% and unblocked two dependent teams.",
    ic7Answer: "I identified that our auth architecture was becoming a bottleneck for three product orgs — not just my team. I wrote the technical strategy doc, got buy-in from 4 engineering directors, and coordinated a phased migration across 12 teams over two quarters. I also established the service ownership model that's now used org-wide. The migration reduced auth latency by 40% and unblocked $50M in new product surface area. I grew two senior engineers into tech leads through this project.",
    ic6Signals: ["Team-level execution", "XFN coordination within scope", "Measurable technical outcome"],
    ic7Signals: ["Identified org-level problem proactively", "Cross-org alignment across 4 directors", "Established org-wide patterns", "Grew other senior engineers", "Business-level impact quantified"],
    keyDelta: "L7 identifies the problem proactively, operates across org boundaries without authority, establishes lasting patterns, and quantifies business impact — not just technical metrics.",
  },
  {
    scenario: "Conflict Resolution",
    areaId: "conflict",
    areaLabel: "Conflict Resolution",
    areaColor: "#92400e",
    areaBg: "#fffbeb",
    areaBorder: "#fde68a",
    ic6Answer: "My team and the data platform team disagreed on the schema design for our new pipeline. I set up a meeting, presented our use case, listened to their constraints, and we agreed on a compromise schema that worked for both teams. The pipeline shipped on time.",
    ic7Answer: "Three product orgs and the data platform team had been blocked for two quarters on a schema standard — each team had different requirements and the disagreement was escalating to VP level. I volunteered to lead the resolution. I ran a structured RFC process, synthesized requirements from all parties, proposed a tiered schema standard with migration paths, and got alignment from all four org leads. The standard is now the company-wide schema policy and unblocked 8 teams. I also documented the decision-making framework so future cross-org technical disputes have a process.",
    ic6Signals: ["Resolved team-level conflict", "Collaborative compromise", "On-time delivery"],
    ic7Signals: ["Resolved multi-org, escalated conflict", "Ran structured RFC process", "Created company-wide policy", "Documented reusable framework", "Unblocked 8 teams"],
    keyDelta: "L7 resolves conflicts at org or company scale, creates lasting processes and policies, and operates without positional authority across multiple stakeholders.",
  },
  {
    scenario: "Decision Under Ambiguity",
    areaId: "problem-solving",
    areaLabel: "Problem Solving",
    areaColor: "#065f46",
    areaBg: "#ecfdf5",
    areaBorder: "#a7f3d0",
    ic6Answer: "We had to decide between two caching strategies with incomplete data. I ran a quick benchmark, consulted with two senior engineers, and made the call to go with Redis. I documented the trade-offs and we shipped. In retrospect it was the right call — we haven't had cache-related incidents since.",
    ic7Answer: "We were 6 months from a major product launch with no clear technical direction on our real-time infrastructure — three viable approaches, each with different risk profiles, and the decision would affect 5 product teams for the next 3 years. I structured the evaluation: defined decision criteria with all stakeholders, ran time-boxed spikes on each approach, and built a risk matrix. I made the call to go with approach C despite pushback from two senior engineers, wrote the full technical rationale, and got sign-off from the CTO. I was wrong on one assumption — I documented this post-launch and updated our decision framework. The infrastructure has served 10x traffic growth without redesign.",
    ic6Signals: ["Made technical decision under uncertainty", "Consulted peers", "Documented trade-offs"],
    ic7Signals: ["Structured multi-stakeholder evaluation", "3-year architectural decision", "Made call despite senior pushback", "Acknowledged and documented error", "Outcome served 10x growth"],
    keyDelta: "L7 makes decisions with org-wide, multi-year consequences, structures the decision process itself, shows intellectual honesty about errors, and demonstrates the decision's durability.",
  },
  {
    scenario: "Communication & Influence",
    areaId: "communication",
    areaLabel: "Communication",
    areaColor: "#4338ca",
    areaBg: "#eef2ff",
    areaBorder: "#c7d2fe",
    ic6Answer: "I presented our Q3 technical roadmap to the team and got alignment. I used a clear structure — problem, options, recommendation — and answered questions from the team. Everyone was on board and we executed the plan.",
    ic7Answer: "Our org had no shared technical vision — each team was building independently, creating duplication and integration debt. I wrote a 6-month technical strategy doc, ran a series of working sessions with 15 senior engineers across 4 teams, and presented to the VP of Engineering. I had to navigate significant resistance from two team leads who felt their autonomy was being constrained. I revised the strategy three times based on feedback, made the trade-offs explicit, and got full org alignment. The strategy reduced duplicated infrastructure by 30% and became the template for how we do org-level technical planning.",
    ic6Signals: ["Team-level alignment", "Clear structure", "Answered questions"],
    ic7Signals: ["Org-level technical vision", "Navigated resistance from senior peers", "Iterated based on feedback", "Quantified outcome", "Created reusable template"],
    keyDelta: "L7 communication shapes org-level direction, navigates resistance from senior stakeholders, and produces artifacts that outlast the immediate project.",
  },
  {
    scenario: "Mentoring & Growing Engineers",
    areaId: "xfn",
    areaLabel: "XFN Collaboration & Scope",
    areaColor: "#1e3a8a",
    areaBg: "#eff6ff",
    areaBorder: "#bfdbfe",
    ic6Answer: "I mentored a junior engineer on my team. We had weekly 1:1s, I reviewed their code, gave feedback on their design docs, and helped them grow into a mid-level engineer. They got promoted after 18 months.",
    ic7Answer: "I identified that our org had a systemic problem: senior engineers weren't growing into staff-level roles because there was no structured path or sponsorship culture. I designed and ran a 'Staff Engineer Readiness' program for 6 senior engineers across 3 teams — structured projects with increasing scope, bi-weekly group sessions, and explicit sponsorship from directors. Three engineers were promoted to staff level within 18 months. I also wrote the program framework, which was adopted by two other orgs. The program is now part of our standard engineering career development process.",
    ic6Signals: ["1:1 mentorship", "Code and design review", "Promoted one engineer"],
    ic7Signals: ["Identified systemic org problem", "Designed scalable program", "Grew 3 staff engineers", "Created reusable framework adopted by other orgs", "Changed org-level career development process"],
    keyDelta: "L7 grows multiple senior leaders at scale, identifies and fixes systemic org problems, and creates programs that outlast their direct involvement.",
  },
];

export default function IC7AnswerUpgrader() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showIC7, setShowIC7] = useState<Record<number, boolean>>({});

  const toggleIC7 = (idx: number) => {
    setShowIC7((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>How to use:</strong> Read the L6 answer first — it's a solid, passing answer at the Senior Engineer level. Then reveal the L7 version to see how the same scenario is reframed with larger scope, org-level impact, and strategic thinking. The <strong>Key Delta</strong> explains exactly what changed and why.
        </p>
      </div>

      {ANSWER_EXAMPLES.map((ex, idx) => (
        <div key={ex.scenario} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <button
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 text-left transition-colors"
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ background: ex.areaBg, color: ex.areaColor, border: `1px solid ${ex.areaBorder}` }}>
                {ex.areaLabel}
              </span>
              <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {ex.scenario}
              </span>
            </div>
            {openIdx === idx ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          </button>

          {openIdx === idx && (
            <div className="border-t border-gray-100">
              {/* Side-by-side answers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                {/* L6 Answer */}
                <div className="p-5 bg-blue-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-blue-800">L6 — Senior Engineer Answer</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">"{ex.ic6Answer}"</p>
                  <div className="space-y-1">
                    {ex.ic6Signals.map((s) => (
                      <div key={s} className="flex items-center gap-1.5 text-[11px] text-blue-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* L7 Answer */}
                <div className="p-5 bg-purple-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs font-bold text-purple-800">L7 — Staff Engineer Answer</span>
                    </div>
                    {!showIC7[idx] && (
                      <button
                        onClick={() => toggleIC7(idx)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Reveal L7 Answer
                      </button>
                    )}
                  </div>

                  {showIC7[idx] ? (
                    <>
                      <p className="text-sm text-gray-800 leading-relaxed mb-3 italic font-medium">"{ex.ic7Answer}"</p>
                      <div className="space-y-1">
                        {ex.ic7Signals.map((s) => (
                          <div key={s} className="flex items-center gap-1.5 text-[11px] text-purple-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                            {s}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center">
                      <p className="text-xs text-purple-500 italic">Answer hidden — answer the L6 version first, then reveal</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Delta */}
              {showIC7[idx] && (
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
                  <div className="flex items-start gap-2.5">
                    <ArrowRight size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wide">Key Delta — </span>
                      <span className="text-[11px] text-indigo-700 leading-relaxed">{ex.keyDelta}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
