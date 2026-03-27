// AI Training Tab — 10 research-backed hands-on practice drills for Meta's AI-enabled coding round
// Based on primary sources: hellointerview.com, interviewing.io, Reddit candidate reports, Meta's rubric

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AIHallucinationSpotter from "@/components/training/AIHallucinationSpotter";
import RequirementsClarificationDrill from "@/components/training/RequirementsClarificationDrill";
import CheckpointPacer from "@/components/training/CheckpointPacer";
import ComplexityFlashcardTrainer from "@/components/training/ComplexityFlashcardTrainer";
import CodeNavigationSpeedTest from "@/components/training/CodeNavigationSpeedTest";
import RubberDuckExplainer from "@/components/training/RubberDuckExplainer";
import IncrementalFeatureBuilder from "@/components/training/IncrementalFeatureBuilder";
import TestFirstDebugger from "@/components/training/TestFirstDebugger";
import VerbalExplanationScorer from "@/components/training/VerbalExplanationScorer";
import SessionReplay from "@/components/training/SessionReplay";

interface Drill {
  id: string;
  label: string;
  icon: string;
  color: string;
  badge: string;
  rubricDimension: string;
  description: string;
  component: React.ComponentType;
}

const DRILLS: Drill[] = [
  {
    id: "hallucination",
    label: "AI Hallucination Spotter",
    icon: "🧠",
    color: "amber",
    badge: "Critical",
    rubricDimension: "Verification & Debugging",
    description:
      "AI gives subtly wrong code — spot the bug before the AI admits it.",
    component: AIHallucinationSpotter,
  },
  {
    id: "clarification",
    label: "Requirements Clarification",
    icon: "❓",
    color: "blue",
    badge: "Phase 1",
    rubricDimension: "Problem Solving",
    description: "Practice asking the right clarifying questions in 2 minutes.",
    component: RequirementsClarificationDrill,
  },
  {
    id: "pacer",
    label: "Checkpoint Pacer",
    icon: "⏱",
    color: "orange",
    badge: "Time Mgmt",
    rubricDimension: "All Dimensions",
    description: "Train the 15/25/15 phase rhythm with checkpoint milestones.",
    component: CheckpointPacer,
  },
  {
    id: "complexity",
    label: "Complexity Flashcards",
    icon: "📊",
    color: "purple",
    badge: "Speed Drill",
    rubricDimension: "Code Development",
    description: "Identify O(n) complexity in under 10 seconds per card.",
    component: ComplexityFlashcardTrainer,
  },
  {
    id: "navigation",
    label: "Code Navigation Speed",
    icon: "🗺",
    color: "cyan",
    badge: "Phase 1",
    rubricDimension: "Code Development",
    description: "Navigate 3-file codebases and answer questions in 5 minutes.",
    component: CodeNavigationSpeedTest,
  },
  {
    id: "rubber-duck",
    label: "Rubber Duck Explainer",
    icon: "🦆",
    color: "yellow",
    badge: "Communication",
    rubricDimension: "Technical Communication",
    description: "Explain your approach out loud before writing any code.",
    component: RubberDuckExplainer,
  },
  {
    id: "incremental",
    label: "Incremental Feature Build",
    icon: "🧩",
    color: "emerald",
    badge: "Phase 2",
    rubricDimension: "Code Development",
    description:
      "Add features to existing code one step at a time without breaking it.",
    component: IncrementalFeatureBuilder,
  },
  {
    id: "test-first",
    label: "Test-First Debugger",
    icon: "🧪",
    color: "red",
    badge: "Phase 1",
    rubricDimension: "Verification & Debugging",
    description:
      "Given only failing test output, write the fix that makes all tests pass.",
    component: TestFirstDebugger,
  },
  {
    id: "verbal",
    label: "Verbal Explanation Scorer",
    icon: "🎙",
    color: "teal",
    badge: "Communication",
    rubricDimension: "Technical Communication",
    description:
      "Type a 90-second explanation; AI scores your Technical Communication.",
    component: VerbalExplanationScorer,
  },
  {
    id: "replay",
    label: "Session Replay",
    icon: "▶",
    color: "indigo",
    badge: "Review",
    rubricDimension: "All Dimensions",
    description: "Replay your mock interview timeline with annotated events.",
    component: SessionReplay,
  },
];

const COLOR_MAP: Record<
  string,
  { badge: string; border: string; bg: string; dot: string }
> = {
  amber: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    dot: "bg-amber-400",
  },
  blue: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
  },
  orange: {
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    dot: "bg-orange-400",
  },
  purple: {
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    dot: "bg-purple-400",
  },
  cyan: {
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    dot: "bg-cyan-400",
  },
  yellow: {
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    dot: "bg-yellow-400",
  },
  emerald: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    dot: "bg-emerald-400",
  },
  red: {
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    dot: "bg-red-400",
  },
  teal: {
    badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    dot: "bg-teal-400",
  },
  indigo: {
    badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    dot: "bg-indigo-400",
  },
};

export default function AITrainingTab() {
  const [activeDrill, setActiveDrill] = useState<string | null>(null);

  const drill = DRILLS.find(d => d.id === activeDrill);
  const DrillComponent = drill?.component;
  const colors = drill ? COLOR_MAP[drill.color] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            🏋️ AI Coding Round Training
          </h2>
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs">
            10 Drills
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Research-backed practice drills targeting the exact failure modes
          reported by Meta E4–E7 candidates. Each drill maps to one of Meta's 4
          rubric dimensions.
        </p>
      </div>

      {/* Rubric legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            label: "Problem Solving",
            color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Code Development",
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
          },
          {
            label: "Verification & Debugging",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          },
          {
            label: "Technical Communication",
            color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
          },
        ].map(r => (
          <div
            key={r.label}
            className={`text-xs px-2 py-1.5 rounded border text-center ${r.color}`}
          >
            {r.label}
          </div>
        ))}
      </div>

      {/* Drill grid or active drill */}
      {!activeDrill ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DRILLS.map((d, i) => {
            const c = COLOR_MAP[d.color];
            return (
              <button
                key={d.id}
                onClick={() => setActiveDrill(d.id)}
                className={`text-left p-4 rounded-lg border ${c.border} ${c.bg} hover:opacity-90 transition-all group`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-foreground group-hover:text-foreground/90">
                        {d.label}
                      </span>
                      <Badge className={`text-xs border ${c.badge}`}>
                        {d.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {d.description}
                    </p>
                    <p className="text-xs mt-1.5 opacity-60">
                      {d.rubricDimension}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs font-mono shrink-0">
                    #{i + 1}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Back button + drill header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveDrill(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              ← All drills
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{drill?.icon}</span>
              <span className="text-sm font-semibold text-foreground">
                {drill?.label}
              </span>
              {drill && (
                <Badge className={`text-xs border ${colors?.badge}`}>
                  {drill.badge}
                </Badge>
              )}
            </div>
          </div>

          {/* Drill component */}
          <Card className={`border ${colors?.border} ${colors?.bg}`}>
            <CardContent className="px-4 py-4">
              {DrillComponent && <DrillComponent />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Source attribution */}
      <div className="text-xs text-muted-foreground text-center space-y-0.5">
        <div>
          Sources: hellointerview.com · interviewing.io · Reddit candidate
          reports · Meta's official rubric
        </div>
        <div>
          Targeting failure modes reported by E4–E7 candidates in the AI-enabled
          coding round
        </div>
      </div>
    </div>
  );
}
