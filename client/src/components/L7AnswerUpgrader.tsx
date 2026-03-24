/**
 * L7AnswerUpgrader — IC6→IC7 Answer Upgrader
 *
 * Two modes:
 * 1. "Study Examples" — side-by-side L6 vs L7 answer snippets (original feature)
 * 2. "Upgrade My Answer" — paste your own answer, AI scores it and gives exact upgrade path
 */
import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowRight, Sparkles, Loader2, AlertCircle, CheckCircle2, XCircle, ArrowUpCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ── Static examples ─────────────────────────────────────────────────────────

interface AnswerExample {
  scenario: string;
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
    areaLabel: "XFN Collaboration & Scope",
    areaColor: "#1e3a8a", areaBg: "#eff6ff", areaBorder: "#bfdbfe",
    ic6Answer: "I led the migration of our monolithic auth service to a microservice. I worked with the backend team to define the API contract, coordinated with the security team for compliance review, and shipped it in Q3. It reduced latency by 40% and unblocked two dependent teams.",
    ic7Answer: "I identified that our auth architecture was becoming a bottleneck for three product orgs — not just my team. I wrote the technical strategy doc, got buy-in from 4 engineering directors, and coordinated a phased migration across 12 teams over two quarters. I also established the service ownership model that's now used org-wide. The migration reduced auth latency by 40% and unblocked $50M in new product surface area. I grew two senior engineers into tech leads through this project.",
    ic6Signals: ["Team-level execution", "XFN coordination within scope", "Measurable technical outcome"],
    ic7Signals: ["Identified org-level problem proactively", "Cross-org alignment across 4 directors", "Established org-wide patterns", "Grew other senior engineers", "Business-level impact quantified"],
    keyDelta: "L7 identifies the problem proactively, operates across org boundaries without authority, establishes lasting patterns, and quantifies business impact — not just technical metrics.",
  },
  {
    scenario: "Conflict Resolution",
    areaLabel: "Conflict Resolution",
    areaColor: "#92400e", areaBg: "#fffbeb", areaBorder: "#fde68a",
    ic6Answer: "My team and the data platform team disagreed on the schema design for our new pipeline. I set up a meeting, presented our use case, listened to their constraints, and we agreed on a compromise schema that worked for both teams. The pipeline shipped on time.",
    ic7Answer: "Three product orgs and the data platform team had been blocked for two quarters on a schema standard — each team had different requirements and the disagreement was escalating to VP level. I volunteered to lead the resolution. I ran a structured RFC process, synthesized requirements from all parties, proposed a tiered schema standard with migration paths, and got alignment from all four org leads. The standard is now the company-wide schema policy and unblocked 8 teams. I also documented the decision-making framework so future cross-org technical disputes have a process.",
    ic6Signals: ["Resolved team-level conflict", "Collaborative compromise", "On-time delivery"],
    ic7Signals: ["Resolved multi-org, escalated conflict", "Ran structured RFC process", "Created company-wide policy", "Documented reusable framework", "Unblocked 8 teams"],
    keyDelta: "L7 resolves conflicts at org or company scale, creates lasting processes and policies, and operates without positional authority across multiple stakeholders.",
  },
  {
    scenario: "Decision Under Ambiguity",
    areaLabel: "Problem Solving",
    areaColor: "#065f46", areaBg: "#ecfdf5", areaBorder: "#a7f3d0",
    ic6Answer: "We had to decide between two caching strategies with incomplete data. I ran a quick benchmark, consulted with two senior engineers, and made the call to go with Redis. I documented the trade-offs and we shipped.",
    ic7Answer: "We were 6 months from a major product launch with no clear technical direction on our real-time infrastructure — three viable approaches, each with different risk profiles, and the decision would affect 5 product teams for the next 3 years. I structured the evaluation: defined decision criteria with all stakeholders, ran time-boxed spikes on each approach, and built a risk matrix. I made the call to go with approach C despite pushback from two senior engineers, wrote the full technical rationale, and got sign-off from the CTO. I was wrong on one assumption — I documented this post-launch and updated our decision framework. The infrastructure has served 10x traffic growth without redesign.",
    ic6Signals: ["Made technical decision under uncertainty", "Consulted peers", "Documented trade-offs"],
    ic7Signals: ["Structured multi-stakeholder evaluation", "3-year architectural decision", "Made call despite senior pushback", "Acknowledged and documented error", "Outcome served 10x growth"],
    keyDelta: "L7 makes decisions with org-wide, multi-year consequences, structures the decision process itself, shows intellectual honesty about errors, and demonstrates the decision's durability.",
  },
  {
    scenario: "Communication & Influence",
    areaLabel: "Communication",
    areaColor: "#4338ca", areaBg: "#eef2ff", areaBorder: "#c7d2fe",
    ic6Answer: "I presented our Q3 technical roadmap to the team and got alignment. I used a clear structure — problem, options, recommendation — and answered questions from the team. Everyone was on board and we executed the plan.",
    ic7Answer: "Our org had no shared technical vision — each team was building independently, creating duplication and integration debt. I wrote a 6-month technical strategy doc, ran a series of working sessions with 15 senior engineers across 4 teams, and presented to the VP of Engineering. I had to navigate significant resistance from two team leads who felt their autonomy was being constrained. I revised the strategy three times based on feedback, made the trade-offs explicit, and got full org alignment. The strategy reduced duplicated infrastructure by 30% and became the template for how we do org-level technical planning.",
    ic6Signals: ["Team-level alignment", "Clear structure", "Answered questions"],
    ic7Signals: ["Org-level technical vision", "Navigated resistance from senior peers", "Iterated based on feedback", "Quantified outcome", "Created reusable template"],
    keyDelta: "L7 communication shapes org-level direction, navigates resistance from senior stakeholders, and produces artifacts that outlast the immediate project.",
  },
  {
    scenario: "Mentoring & Growing Engineers",
    areaLabel: "XFN Collaboration & Scope",
    areaColor: "#1e3a8a", areaBg: "#eff6ff", areaBorder: "#bfdbfe",
    ic6Answer: "I mentored a junior engineer on my team. We had weekly 1:1s, I reviewed their code, gave feedback on their design docs, and helped them grow into a mid-level engineer. They got promoted after 18 months.",
    ic7Answer: "I identified that our org had a systemic problem: senior engineers weren't growing into staff-level roles because there was no structured path or sponsorship culture. I designed and ran a 'Staff Engineer Readiness' program for 6 senior engineers across 3 teams — structured projects with increasing scope, bi-weekly group sessions, and explicit sponsorship from directors. Three engineers were promoted to staff level within 18 months. I also wrote the program framework, which was adopted by two other orgs.",
    ic6Signals: ["1:1 mentorship", "Code and design review", "Promoted one engineer"],
    ic7Signals: ["Identified systemic org problem", "Designed scalable program", "Grew 3 staff engineers", "Created reusable framework adopted by other orgs", "Changed org-level career development process"],
    keyDelta: "L7 grows multiple senior leaders at scale, identifies and fixes systemic org problems, and creates programs that outlast their direct involvement.",
  },
];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  L4: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", label: "L4 — Entry Level" },
  L5: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "L5 — Mid-Level" },
  L6: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300", label: "L6 — Senior" },
  L7: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", label: "L7 — Staff" },
};

// ── AI Upgrade Panel ─────────────────────────────────────────────────────────

function AIUpgradePanel() {
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [targetLevel, setTargetLevel] = useState<"L5" | "L6" | "L7">("L7");
  const [showUpgraded, setShowUpgraded] = useState(false);

  const upgrade = trpc.highImpact.upgradeAnswer.useMutation();

  const handleSubmit = () => {
    if (answer.trim().length < 20) return;
    setShowUpgraded(false);
    upgrade.mutate({ answer: answer.trim(), question: question.trim() || undefined, targetLevel });
  };

  const result = upgrade.data;
  const levelCfg = result ? (LEVEL_COLORS[result.detectedLevel] ?? LEVEL_COLORS.L5) : null;
  const targetCfg = LEVEL_COLORS[targetLevel];

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
            Interview Question (optional)
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "Tell me about a time you drove a major technical initiative"'
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
            Your Answer <span className="text-red-500">*</span>
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Paste your STAR answer here. Be as detailed as you'd be in a real interview — the AI needs substance to work with. Minimum 20 characters."
            rows={6}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-y"
          />
          <p className="text-[11px] text-gray-400 mt-1">{answer.length} / 4000 characters</p>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Target Level:</label>
            {(["L5", "L6", "L7"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setTargetLevel(lvl)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  targetLevel === lvl
                    ? `${LEVEL_COLORS[lvl].bg} ${LEVEL_COLORS[lvl].text} ${LEVEL_COLORS[lvl].border}`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={answer.trim().length < 20 || upgrade.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {upgrade.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles size={14} /> Upgrade to {targetLevel}</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {upgrade.isError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle size={14} className="flex-shrink-0" />
          Failed to analyze answer. Please try again.
        </div>
      )}

      {/* Results */}
      {result && !upgrade.isPending && (
        <div className="space-y-4">
          {/* Level verdict */}
          <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Detected level:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${levelCfg?.bg} ${levelCfg?.text} ${levelCfg?.border}`}>
                  {result.detectedLevel}
                </span>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Target:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${targetCfg.bg} ${targetCfg.text} ${targetCfg.border}`}>
                  {targetLevel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-gray-500">Score:</span>
                <span className={`text-lg font-extrabold ${result.currentScore >= 8 ? "text-emerald-600" : result.currentScore >= 6 ? "text-amber-600" : "text-red-600"}`}>
                  {result.currentScore}<span className="text-sm text-gray-400">/10</span>
                </span>
              </div>
            </div>
            {result.keyDelta && (
              <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                <span className="font-bold">Key delta: </span>{result.keyDelta}
              </p>
            )}
          </div>

          {/* Signals present / missing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Signals Present</span>
              </div>
              <div className="space-y-1.5">
                {result.presentSignals.length > 0 ? result.presentSignals.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                    {s}
                  </div>
                )) : <p className="text-xs text-emerald-600 italic">No strong signals detected yet.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <XCircle size={13} className="text-red-600" />
                <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Missing for {targetLevel}</span>
              </div>
              <div className="space-y-1.5">
                {result.missingSignals.length > 0 ? result.missingSignals.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-red-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                    {s}
                  </div>
                )) : <p className="text-xs text-red-600 italic">No critical gaps — strong answer!</p>}
              </div>
            </div>
          </div>

          {/* Upgrade instructions */}
          {result.upgradeInstructions.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <ArrowUpCircle size={13} className="text-amber-700" />
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">3 Upgrade Instructions</span>
              </div>
              <ol className="space-y-2">
                {result.upgradeInstructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] text-amber-900">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-bold text-[10px] flex items-center justify-center mt-0.5">{i + 1}</span>
                    {inst}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Upgraded answer */}
          {result.upgradedAnswer && (
            <div className="rounded-xl border border-purple-200 overflow-hidden">
              <button
                onClick={() => setShowUpgraded(!showUpgraded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-purple-600" />
                  <span className="text-xs font-bold text-purple-800">View AI-Upgraded Answer ({targetLevel} Version)</span>
                </div>
                {showUpgraded ? <ChevronDown size={14} className="text-purple-400" /> : <ChevronRight size={14} className="text-purple-400" />}
              </button>
              {showUpgraded && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-sm text-gray-800 leading-relaxed italic">"{result.upgradedAnswer}"</p>
                  <p className="text-[11px] text-gray-400 mt-3">
                    This is an AI-generated example to illustrate {targetLevel}-level signals. Adapt it to your real experiences — never use it verbatim.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Static Examples Panel ────────────────────────────────────────────────────

function StaticExamplesPanel() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showIC7, setShowIC7] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="text-xs text-indigo-800 leading-relaxed">
          <strong>How to use:</strong> Read the L6 answer first — it's a solid, passing answer at the Senior Engineer level. Then reveal the L7 version to see how the same scenario is reframed with larger scope, org-level impact, and strategic thinking.
        </p>
      </div>
      {ANSWER_EXAMPLES.map((ex, idx) => (
        <div key={ex.scenario} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
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
                <div className="p-5 bg-purple-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs font-bold text-purple-800">L7 — Staff Engineer Answer</span>
                    </div>
                    {!showIC7[idx] && (
                      <button
                        onClick={() => setShowIC7((p) => ({ ...p, [idx]: true }))}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Reveal L7
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

// ── Main Export ──────────────────────────────────────────────────────────────

export default function L7AnswerUpgrader() {
  const [mode, setMode] = useState<"ai" | "examples">("ai");

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setMode("ai")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === "ai"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles size={13} /> Upgrade My Answer
        </button>
        <button
          onClick={() => setMode("examples")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === "examples"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Study Examples
        </button>
      </div>

      {mode === "ai" ? <AIUpgradePanel /> : <StaticExamplesPanel />}
    </div>
  );
}
