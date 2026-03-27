import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Target,
  Zap,
  HelpCircle,
  Swords,
  Eye,
  GitBranch,
  Clock,
  Users,
  AlertTriangle,
  BarChart2,
  Wrench,
  Star,
  Trophy,
  ChevronRight,
  RefreshCw,
  Brain,
  Shield,
  Code2,
  MessageSquare,
} from "lucide-react";

// Lazy imports for all 18 drills
import NFRAmbushDrill from "./failure-drills/NFRAmbushDrill";
import BottleneckAutopsy from "./failure-drills/BottleneckAutopsy";
import ScaleJumpStressTest from "./failure-drills/ScaleJumpStressTest";
import EdgeCaseGauntlet from "./failure-drills/EdgeCaseGauntlet";
import STARSpecificityRewriter from "./failure-drills/STARSpecificityRewriter";
import OwnershipSignalExtractor from "./failure-drills/OwnershipSignalExtractor";
import DownLevelDetector from "./failure-drills/DownLevelDetector";
import TradeOffPressureCooker from "./failure-drills/TradeOffPressureCooker";
import FailureModeFlashcardSprint from "./failure-drills/FailureModeFlashcardSprint";
import LiveFixSimulator from "./failure-drills/LiveFixSimulator";
import TheInterruptor from "./failure-drills/TheInterruptor";
import ClarificationInterrogator from "./failure-drills/ClarificationInterrogator";
import DevilsAdvocateInterviewer from "./failure-drills/DevilsAdvocateInterviewer";
import TheSilentSkeptic from "./failure-drills/TheSilentSkeptic";
import ScopeCreepChallenger from "./failure-drills/ScopeCreepChallenger";
import TimePressureMock from "./failure-drills/TimePressureMock";
import XFNConflictSimulator from "./failure-drills/XFNConflictSimulator";
import TheGotchaFollowUp from "./failure-drills/TheGotchaFollowUp";

type DrillCategory =
  | "all"
  | "system-design"
  | "coding"
  | "behavioral"
  | "live-mock";

interface DrillMeta {
  id: string;
  number: number;
  title: string;
  category: DrillCategory;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  difficulty: "Warm-up" | "Core" | "Advanced";
  isLiveMock?: boolean;
  component: React.ComponentType<{ onComplete?: (score: number) => void }>;
}

const DRILLS: DrillMeta[] = [
  {
    id: "nfr-ambush",
    number: 1,
    title: "NFR Ambush",
    category: "system-design",
    description:
      "90-second sprint: enumerate all NFRs before the timer expires. Scored against a reference set.",
    icon: <Shield size={16} />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    difficulty: "Core",
    component: NFRAmbushDrill,
  },
  {
    id: "bottleneck-autopsy",
    number: 2,
    title: "Bottleneck Autopsy",
    category: "system-design",
    description:
      "Identify all bottlenecks in a partially drawn system diagram within 2 minutes.",
    icon: <Target size={16} />,
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/30",
    difficulty: "Core",
    component: BottleneckAutopsy,
  },
  {
    id: "scale-jump",
    number: 3,
    title: "Scale Jump Stress Test",
    category: "system-design",
    description:
      "Design at 1K RPS, then immediately scale to 100K RPS. What breaks and what changes?",
    icon: <BarChart2 size={16} />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    difficulty: "Advanced",
    component: ScaleJumpStressTest,
  },
  {
    id: "edge-case-gauntlet",
    number: 4,
    title: "Edge Case Gauntlet",
    category: "coding",
    description:
      "Given a working solution, enumerate all edge cases in 90 seconds. Scored on coverage.",
    icon: <Code2 size={16} />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    difficulty: "Core",
    component: EdgeCaseGauntlet,
  },
  {
    id: "star-rewriter",
    number: 5,
    title: "STAR Specificity Rewriter",
    category: "behavioral",
    description:
      "Rewrite a vague STAR answer to be specific, quantified, and ownership-signaling.",
    icon: <Star size={16} />,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/30",
    difficulty: "Warm-up",
    component: STARSpecificityRewriter,
  },
  {
    id: "ownership-extractor",
    number: 6,
    title: "Ownership Signal Extractor",
    category: "behavioral",
    description:
      "Rewrite contributor-language answers to show clear individual ownership and impact.",
    icon: <Trophy size={16} />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    difficulty: "Core",
    component: OwnershipSignalExtractor,
  },
  {
    id: "down-level-detector",
    number: 7,
    title: "Down-Level Detector",
    category: "all" as DrillCategory,
    description:
      "Classify answers as L5/L6/L7 signals and rewrite them to hit the L6 bar.",
    icon: <Brain size={16} />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/30",
    difficulty: "Advanced",
    component: DownLevelDetector,
  },
  {
    id: "trade-off-cooker",
    number: 8,
    title: "Trade-Off Pressure Cooker",
    category: "system-design",
    description:
      "Defend a technical trade-off under 4 rounds of escalating pressure from the AI.",
    icon: <Swords size={16} />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    difficulty: "Advanced",
    component: TradeOffPressureCooker,
  },
  {
    id: "flashcard-sprint",
    number: 9,
    title: "Failure Mode Flashcard Sprint",
    category: "all" as DrillCategory,
    description:
      "15 cards, 5 minutes: classify failure type, identify weak signal, name the fix tool.",
    icon: <RefreshCw size={16} />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10 border-teal-500/30",
    difficulty: "Warm-up",
    component: FailureModeFlashcardSprint,
  },
  {
    id: "live-fix-simulator",
    number: 10,
    title: "Live Fix Simulator",
    category: "all" as DrillCategory,
    description:
      "Read a transcript with 3 injected failures. Diagnose each and rewrite the broken answers.",
    icon: <Wrench size={16} />,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/30",
    difficulty: "Advanced",
    component: LiveFixSimulator,
  },
  {
    id: "the-interruptor",
    number: 11,
    title: "The Interruptor",
    category: "system-design",
    description:
      "AI cuts you off mid-explanation with sharp challenges. Recover and resume your thread.",
    icon: <Zap size={16} />,
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/30",
    difficulty: "Advanced",
    isLiveMock: true,
    component: TheInterruptor,
  },
  {
    id: "clarification-interrogator",
    number: 12,
    title: "Clarification Interrogator",
    category: "system-design",
    description:
      "Vague prompt, only 3 questions allowed. Design based on your assumptions.",
    icon: <HelpCircle size={16} />,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10 border-teal-500/30",
    difficulty: "Core",
    isLiveMock: true,
    component: ClarificationInterrogator,
  },
  {
    id: "devils-advocate",
    number: 13,
    title: "Devil's Advocate",
    category: "system-design",
    description:
      "AI argues the opposite side of your technical decision for 4 rounds.",
    icon: <Swords size={16} />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    difficulty: "Advanced",
    isLiveMock: true,
    component: DevilsAdvocateInterviewer,
  },
  {
    id: "silent-skeptic",
    number: 14,
    title: "The Silent Skeptic",
    category: "all" as DrillCategory,
    description:
      "Interpret what the interviewer's silence means and respond to break it correctly.",
    icon: <Eye size={16} />,
    color: "text-muted-foreground",
    bgColor: "bg-slate-500/10 border-slate-500/30",
    difficulty: "Core",
    isLiveMock: true,
    component: TheSilentSkeptic,
  },
  {
    id: "scope-creep",
    number: 15,
    title: "Scope Creep Challenger",
    category: "system-design",
    description:
      "AI adds new requirements mid-design. Adapt your system without restarting.",
    icon: <GitBranch size={16} />,
    color: "text-lime-400",
    bgColor: "bg-lime-500/10 border-lime-500/30",
    difficulty: "Advanced",
    isLiveMock: true,
    component: ScopeCreepChallenger,
  },
  {
    id: "time-pressure",
    number: 16,
    title: "Time Pressure Mock",
    category: "coding",
    description:
      "Real coding problem with strict timer and AI pacing checkpoints at 25/50/75/90%.",
    icon: <Clock size={16} />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    difficulty: "Core",
    isLiveMock: true,
    component: TimePressureMock,
  },
  {
    id: "xfn-conflict",
    number: 17,
    title: "XFN Conflict Simulator",
    category: "behavioral",
    description:
      "AI plays a PM/Designer/DS in conflict. Navigate without damaging the relationship.",
    icon: <Users size={16} />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/30",
    difficulty: "Advanced",
    isLiveMock: true,
    component: XFNConflictSimulator,
  },
  {
    id: "gotcha-followup",
    number: 18,
    title: "The Gotcha Follow-Up",
    category: "all" as DrillCategory,
    description:
      "Predict the gotcha question in a weak answer, then answer the AI's actual version.",
    icon: <Target size={16} />,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/30",
    difficulty: "Advanced",
    isLiveMock: true,
    component: TheGotchaFollowUp,
  },
];

const CATEGORIES: {
  id: DrillCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "all", label: "All 18", icon: <BarChart2 size={13} /> },
  { id: "system-design", label: "System Design", icon: <Shield size={13} /> },
  { id: "coding", label: "Coding", icon: <Code2 size={13} /> },
  { id: "behavioral", label: "Behavioral", icon: <MessageSquare size={13} /> },
  { id: "live-mock", label: "Live Mock", icon: <Zap size={13} /> },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  "Warm-up": "bg-emerald-500/20 text-emerald-300",
  Core: "bg-blue-500/20 text-blue-300",
  Advanced: "bg-red-500/20 text-red-300",
};

export default function FailureDrillHub() {
  const [activeCategory, setActiveCategory] = useState<DrillCategory>("all");
  const [activeDrill, setActiveDrill] = useState<DrillMeta | null>(null);
  const [completedDrills, setCompletedDrills] = useState<
    Record<string, number>
  >({});

  const { data: bestScores } = trpc.failureDrills.getBestScores.useQuery();
  const handleComplete = (drillId: string, score: number) => {
    setCompletedDrills(prev => ({
      ...prev,
      [drillId]: Math.max(prev[drillId] ?? 0, score),
    }));
    setActiveDrill(null);
  };

  const filteredDrills =
    activeCategory === "all"
      ? DRILLS
      : activeCategory === "live-mock"
        ? DRILLS.filter(d => d.isLiveMock)
        : DRILLS.filter(d => d.category === activeCategory);

  const totalCompleted =
    Object.keys(completedDrills).length +
    (bestScores ? Object.keys(bestScores).length : 0);
  const uniqueCompleted = new Set([
    ...Object.keys(completedDrills),
    ...(bestScores ? Object.keys(bestScores) : []),
  ]).size;
  const overallProgress = Math.round((uniqueCompleted / DRILLS.length) * 100);

  const getBestScore = (drillId: string): number | null => {
    const local = completedDrills[drillId];
    const server = bestScores?.[drillId];
    if (local != null && server != null) return Math.max(local, server);
    return local ?? server ?? null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Target size={18} className="text-rose-400" />
            Hands-On Mock Drills
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            18 drills targeting every documented failure mode — from solo
            practice to live AI mock interviewers
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-foreground">
            {uniqueCompleted}
            <span className="text-sm text-muted-foreground font-normal">
              /{DRILLS.length}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">drills completed</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Overall progress
          </span>
          <span className="text-xs font-medium text-foreground">
            {overallProgress}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-rose-500 text-white"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Drill grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredDrills.map(drill => {
          const best = getBestScore(drill.id);
          const isCompleted = best !== null;

          return (
            <div
              key={drill.id}
              className={`border rounded-xl p-4 transition-all cursor-pointer hover:border-opacity-60 ${drill.bgColor} ${isCompleted ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
              onClick={() => setActiveDrill(drill)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-lg bg-background/20 shrink-0 ${drill.color}`}
                  >
                    {drill.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{drill.number}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {drill.title}
                      </span>
                      {drill.isLiveMock && (
                        <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
                          Live AI
                        </Badge>
                      )}
                      <Badge
                        className={`text-xs border-0 ${DIFFICULTY_COLOR[drill.difficulty]}`}
                      >
                        {drill.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {drill.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && (
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${best >= 70 ? "text-emerald-400" : best >= 50 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {best}
                      </p>
                      <p className="text-xs text-muted-foreground">best</p>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drill modal */}
      <Dialog
        open={!!activeDrill}
        onOpenChange={open => {
          if (!open) setActiveDrill(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {activeDrill && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={activeDrill.color}>{activeDrill.icon}</span>
                  <span>
                    #{activeDrill.number} — {activeDrill.title}
                  </span>
                  {activeDrill.isLiveMock && (
                    <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
                      Live AI Mock
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <activeDrill.component
                onComplete={score => handleComplete(activeDrill.id, score)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
