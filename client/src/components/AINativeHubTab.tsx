// ✦ AI Native Hub Tab
// Completely separate from LeetCode/coding content.
// Violet/indigo identity, Practice Drills / Maturity Assessment toggle,
// 5-level maturity spectrum bar, 10 candidate-focused drills.
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import RAGExplainerDrill from "@/components/ai-native/RAGExplainerDrill";
import AIStackBuilder from "@/components/ai-native/AIStackBuilder";
import AgentEvalDesigner from "@/components/ai-native/AgentEvalDesigner";
import EnterpriseBottleneckCase from "@/components/ai-native/EnterpriseBottleneckCase";
import HumanInLoopChallenge from "@/components/ai-native/HumanInLoopChallenge";
import EpistemicHumilityCoach from "@/components/ai-native/EpistemicHumilityCoach";
import MetaValuesAlignmentCheck from "@/components/ai-native/MetaValuesAlignmentCheck";
import MaturitySelfClassifier from "@/components/ai-native/MaturitySelfClassifier";
import KeywordFluencyFlashcards from "@/components/ai-native/KeywordFluencyFlashcards";
import FullMockScreeningCall from "@/components/ai-native/FullMockScreeningCall";

// ─── Drill registry ────────────────────────────────────────────────────────────
interface Drill {
  id: string;
  label: string;
  icon: string;
  coreSkill: string;
  phase: string;
  description: string;
  component: React.ComponentType;
  featured?: boolean;
}

const PRACTICE_DRILLS: Drill[] = [
  {
    id: "rag",
    label: "RAG Explainer",
    icon: "🧩",
    coreSkill: "Fluency & Orchestration",
    phase: "Fluency Check",
    description:
      "Explain RAG to a PM in 90 seconds. LLM scores correctness, succinctness, and caveats.",
    component: RAGExplainerDrill,
  },
  {
    id: "stack",
    label: "AI Stack Builder",
    icon: "🏗",
    coreSkill: "Fluency & Orchestration",
    phase: "Builder Signal",
    description:
      "Walk through your personal AI stack layer by layer. LLM scores each layer against IC7 bar.",
    component: AIStackBuilder,
  },
  {
    id: "agent-eval",
    label: "Agent Eval Designer",
    icon: "🔬",
    coreSkill: "Fluency & Orchestration",
    phase: "Fluency Check",
    description:
      "Design an evaluation framework for an AI agent. LLM checks if you cover all 5 dimensions.",
    component: AgentEvalDesigner,
  },
  {
    id: "bottleneck",
    label: "Enterprise Bottleneck",
    icon: "🏢",
    coreSkill: "AI-Driven Impact",
    phase: "Builder Signal",
    description:
      "Diagnose why an enterprise AI rollout is stalling. LLM checks if you see all 4 layers.",
    component: EnterpriseBottleneckCase,
  },
  {
    id: "hitl",
    label: "Human-in-the-Loop",
    icon: "🛡",
    coreSkill: "Responsible AI",
    phase: "Fluency Check",
    description:
      "Design a HITL mechanism for a high-stakes AI system. LLM scores specificity and policy awareness.",
    component: HumanInLoopChallenge,
  },
  {
    id: "epistemic",
    label: "Epistemic Humility Coach",
    icon: "🎓",
    coreSkill: "Continuous Learning",
    phase: "Philosophy & Culture",
    description:
      "Answer a philosophy/culture question. LLM flags rehearsed answers and scores genuine learning velocity.",
    component: EpistemicHumilityCoach,
  },
  {
    id: "values",
    label: "Meta Values Alignment",
    icon: "⚡",
    coreSkill: "All 4 Skills",
    phase: "Philosophy & Culture",
    description:
      "Answer one question per Meta AI-Native value. LLM scores alignment vs. recitation.",
    component: MetaValuesAlignmentCheck,
  },
  {
    id: "keywords",
    label: "Keyword Flashcards",
    icon: "📖",
    coreSkill: "Fluency & Orchestration",
    phase: "Fluency Check",
    description:
      "15 AI-Native terms, 30 seconds each. Explain the term — then check the IC7 caveat you should have mentioned.",
    component: KeywordFluencyFlashcards,
    featured: true,
  },
  {
    id: "mock",
    label: "Full Mock Screening Call",
    icon: "📞",
    coreSkill: "All 4 Skills",
    phase: "Full Call",
    description:
      "4-phase, ~30-min mock call. Warm-Up → Fluency → Builder Signal → Philosophy. Full AI debrief.",
    component: FullMockScreeningCall,
    featured: true,
  },
];

const MATURITY_ASSESSMENT_DRILL: Drill = {
  id: "maturity",
  label: "Maturity Self-Classifier",
  icon: "🎯",
  coreSkill: "All 4 Skills",
  phase: "Self-Assessment",
  description:
    "Claim your maturity level, back it up with examples, get a gap analysis vs. AI-Native.",
  component: MaturitySelfClassifier,
};

// ─── Colour maps ───────────────────────────────────────────────────────────────
const SKILL_COLOR: Record<string, string> = {
  "Fluency & Orchestration":
    "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "AI-Driven Impact": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "Responsible AI": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Continuous Learning":
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "All 4 Skills": "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const PHASE_COLOR: Record<string, string> = {
  "Fluency Check": "bg-violet-500/10 text-violet-300",
  "Builder Signal": "bg-indigo-500/10 text-indigo-300",
  "Philosophy & Culture": "bg-emerald-500/10 text-emerald-300",
  "Full Call": "bg-pink-500/10 text-pink-300",
  "Self-Assessment": "bg-amber-500/10 text-amber-300",
};

// ─── Maturity spectrum bar ─────────────────────────────────────────────────────
const MATURITY_LEVELS = [
  { label: "Traditionalist", short: "T" },
  { label: "AI Aware", short: "AA" },
  { label: "AI Enabled", short: "AE" },
  { label: "AI First", short: "AF" },
  { label: "✦ AI Native", short: "AN" },
];

function MaturityBar() {
  return (
    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
      <p className="text-xs text-muted-foreground mb-2">
        Meta AI Maturity Spectrum — where does your interview signal land?
      </p>
      <div className="flex gap-1">
        {MATURITY_LEVELS.map((l, i) => (
          <div
            key={l.label}
            className={`flex-1 rounded py-1.5 text-center text-xs font-medium transition-all ${
              i === 4
                ? "bg-violet-600 text-white"
                : i === 3
                  ? "bg-indigo-500/30 text-indigo-300"
                  : i === 2
                    ? "bg-violet-500/15 text-violet-400"
                    : "bg-border/50 text-muted-foreground"
            }`}
          >
            <span className="hidden sm:inline">{l.label}</span>
            <span className="sm:hidden">{l.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AINativeHubTab() {
  const [toggle, setToggle] = useState<"drills" | "assessment">("drills");
  const [activeDrill, setActiveDrill] = useState<string | null>(null);

  // Best scores for badge display on drill cards
  const bestScoresQuery = trpc.aiNativeHistory.getBestScoresByDrill.useQuery(
    undefined,
    { retry: false }
  );
  // getBestScoresByDrill returns Record<drillId, {overallScore, coreSkill, drillLabel}>
  // Use it directly — no .map() needed
  const bestScoresMap: Record<
    string,
    { overallScore: number; coreSkill: string; drillLabel: string }
  > =
    bestScoresQuery.data && !Array.isArray(bestScoresQuery.data)
      ? (bestScoresQuery.data as Record<
          string,
          { overallScore: number; coreSkill: string; drillLabel: string }
        >)
      : {};

  const allDrills =
    toggle === "drills" ? PRACTICE_DRILLS : [MATURITY_ASSESSMENT_DRILL];
  const drill = [...PRACTICE_DRILLS, MATURITY_ASSESSMENT_DRILL].find(
    d => d.id === activeDrill
  );
  const DrillComponent = drill?.component;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* AI Native wordmark */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold tracking-wide">
                <span>✦</span>
                <span>AI NATIVE</span>
              </div>
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                10 Drills
              </Badge>
              <Badge className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs">
                Candidate Practice
              </Badge>
            </div>
            <h2
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              AI-Native Interview Prep
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Calibrate your signal across Meta's 4 AI-Native core skills. These
              drills are{" "}
              <span className="text-violet-300 font-medium">
                completely separate
              </span>{" "}
              from the LeetCode coding content — they target the AI-Native
              screening call and philosophy/culture phase.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border w-fit">
          <button
            onClick={() => {
              setToggle("drills");
              setActiveDrill(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              toggle === "drills"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Practice Drills
          </button>
          <button
            onClick={() => {
              setToggle("assessment");
              setActiveDrill(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              toggle === "assessment"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Maturity Assessment
          </button>
        </div>
      </div>

      {/* Maturity spectrum bar */}
      <MaturityBar />

      {/* Core skills legend */}
      {toggle === "drills" && !activeDrill && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(SKILL_COLOR)
            .filter(([k]) => k !== "All 4 Skills")
            .map(([label, cls]) => (
              <div
                key={label}
                className={`text-xs px-2 py-1.5 rounded border text-center ${cls}`}
              >
                {label}
              </div>
            ))}
        </div>
      )}

      {/* Active drill view */}
      {activeDrill && DrillComponent && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveDrill(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to{" "}
            {toggle === "drills" ? "Practice Drills" : "Maturity Assessment"}
          </button>
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{drill?.icon}</span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {drill?.label}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge
                    className={`text-xs border ${SKILL_COLOR[drill?.coreSkill || ""] || ""}`}
                  >
                    {drill?.coreSkill}
                  </Badge>
                  <Badge
                    className={`text-xs ${PHASE_COLOR[drill?.phase || ""] || "bg-muted text-muted-foreground"}`}
                  >
                    {drill?.phase}
                  </Badge>
                </div>
              </div>
            </div>
            <DrillComponent />
          </div>
        </div>
      )}

      {/* Drill grid */}
      {!activeDrill && (
        <>
          {toggle === "drills" && (
            <>
              {/* Featured drills */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  Featured
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRACTICE_DRILLS.filter(d => d.featured).map(d => {
                    const bestEntry = bestScoresMap[d.id];
                    const best = bestEntry?.overallScore;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setActiveDrill(d.id)}
                        className="text-left p-4 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 hover:border-violet-500/70 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{d.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {d.label}
                              </span>
                              <Badge
                                className={`text-xs border ${SKILL_COLOR[d.coreSkill] || ""}`}
                              >
                                {d.coreSkill}
                              </Badge>
                              {best !== undefined && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                    best >= 8
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : best >= 6
                                        ? "bg-amber-500/15 text-amber-400"
                                        : "bg-red-500/15 text-red-400"
                                  }`}
                                >
                                  Best {best}/10
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {d.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All drills */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  All Drills
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRACTICE_DRILLS.filter(d => !d.featured).map(d => {
                    const bestEntry = bestScoresMap[d.id];
                    const best = bestEntry?.overallScore;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setActiveDrill(d.id)}
                        className="text-left p-4 rounded-lg border border-violet-500/20 bg-violet-500/5 hover:border-violet-500/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{d.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {d.label}
                              </span>
                              <Badge
                                className={`text-xs border ${SKILL_COLOR[d.coreSkill] || ""}`}
                              >
                                {d.coreSkill}
                              </Badge>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${PHASE_COLOR[d.phase] || "bg-muted text-muted-foreground"}`}
                              >
                                {d.phase}
                              </span>
                              {best !== undefined && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                    best >= 8
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : best >= 6
                                        ? "bg-amber-500/15 text-amber-400"
                                        : "bg-red-500/15 text-red-400"
                                  }`}
                                >
                                  Best {best}/10
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {d.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {toggle === "assessment" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Claim your maturity level across Meta's 5-tier spectrum, back
                each claim with a concrete example, and get a gap analysis
                showing exactly what separates you from AI-Native.
              </p>
              <button
                onClick={() => setActiveDrill("maturity")}
                className="w-full text-left p-5 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 hover:border-violet-500/70 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {MATURITY_ASSESSMENT_DRILL.icon}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {MATURITY_ASSESSMENT_DRILL.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {MATURITY_ASSESSMENT_DRILL.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                        4 Core Skills
                      </Badge>
                      <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                        Gap Analysis
                      </Badge>
                      <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
                        Next Steps
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </>
      )}

      {/* Footer note */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground text-center">
          ✦ AI Native Hub · Separate from LeetCode coding content · Targets
          Meta's AI-Native screening call & philosophy phase
        </p>
      </div>
    </div>
  );
}
