// Feature #15: Pass/Fail Verdict Engine
// Evaluates a candidate's full-loop readiness against the Meta IC6 rubric.
// Collects evidence from the user, scores each dimension, and renders a
// structured verdict with coaching notes.

import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Gavel,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Star,
  BarChart2,
  ArrowRight,
  BookOpen,
  Shield,
  Zap,
  Brain,
  MessageSquare,
  Code2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ScreenInterviewWatermark from "@/components/ScreenInterviewWatermark";

// ── IC6 Rubric Dimensions ─────────────────────────────────────────────────────

interface RubricDimension {
  id: string;
  name: string;
  category: "coding" | "system_design" | "behavioral" | "leadership";
  weight: number; // 1-3
  ic5Bar: string;
  ic6Bar: string;
  ic7Bar: string;
  icon: React.ReactNode;
}

const RUBRIC: RubricDimension[] = [
  {
    id: "problem_solving",
    name: "Problem Solving",
    category: "coding",
    weight: 3,
    ic5Bar: "Solves medium problems with hints. Brute force first, then optimizes when prompted.",
    ic6Bar: "Solves medium-hard problems independently. Identifies optimal approach before coding. States complexity unprompted.",
    ic7Bar: "Solves hard problems elegantly. Identifies multiple approaches, explains tradeoffs, and chooses optimal without prompting.",
    icon: <Code2 size={14} />,
  },
  {
    id: "code_quality",
    name: "Code Quality",
    category: "coding",
    weight: 2,
    ic5Bar: "Functional code with minor issues. Some variable naming issues. Handles main cases.",
    ic6Bar: "Clean, readable code. Good naming. Handles edge cases. Modular structure.",
    ic7Bar: "Production-quality code. Excellent abstractions. Comprehensive edge cases. Could be merged as-is.",
    icon: <Code2 size={14} />,
  },
  {
    id: "system_design_breadth",
    name: "System Design Breadth",
    category: "system_design",
    weight: 3,
    ic5Bar: "Covers main components. Misses some NFRs. Basic scalability discussion.",
    ic6Bar: "Covers all major components. States NFRs upfront. Discusses scalability, availability, consistency tradeoffs.",
    ic7Bar: "Comprehensive design. Deep NFR analysis. Proactively identifies failure modes. Discusses operational concerns.",
    icon: <Layers size={14} />,
  },
  {
    id: "system_design_depth",
    name: "System Design Depth",
    category: "system_design",
    weight: 3,
    ic5Bar: "Can explain components at high level. Struggles with deep dives.",
    ic6Bar: "Can go 2-3 levels deep on any component. Knows internal workings of chosen technologies.",
    ic7Bar: "Expert-level depth. Can discuss implementation details, failure modes, and operational concerns for every component.",
    icon: <Layers size={14} />,
  },
  {
    id: "behavioral_impact",
    name: "Behavioral: Impact",
    category: "behavioral",
    weight: 2,
    ic5Bar: "Describes projects. Impact is vague ('improved performance', 'team was happy').",
    ic6Bar: "Quantified impact with metrics. Clear before/after. Business outcome stated.",
    ic7Bar: "Exceptional impact. Cross-org influence. Metrics that moved business KPIs.",
    icon: <MessageSquare size={14} />,
  },
  {
    id: "behavioral_ownership",
    name: "Behavioral: Ownership",
    category: "behavioral",
    weight: 2,
    ic5Bar: "Uses 'we' frequently. Hard to separate individual contribution from team effort.",
    ic6Bar: "Clear 'I' ownership. Explains specific decisions made. Acknowledges team but owns contribution.",
    ic7Bar: "Drives org-wide initiatives. Owns outcomes beyond their team. Influences without authority.",
    icon: <MessageSquare size={14} />,
  },
  {
    id: "communication",
    name: "Communication",
    category: "behavioral",
    weight: 2,
    ic5Bar: "Answers questions but doesn't volunteer structure. Sometimes unclear.",
    ic6Bar: "Clear, structured communication. Signals transitions ('Now I'll discuss X'). Checks for alignment.",
    ic7Bar: "Exceptional clarity. Adapts communication style. Makes complex ideas simple. Leads the conversation.",
    icon: <MessageSquare size={14} />,
  },
  {
    id: "leadership",
    name: "Leadership & Influence",
    category: "leadership",
    weight: 2,
    ic5Bar: "Executes well on assigned work. Limited cross-team collaboration.",
    ic6Bar: "Influences team decisions. Mentors others. Drives projects with ambiguous scope.",
    ic7Bar: "Org-level influence. Defines technical direction. Grows other engineers. Drives cultural change.",
    icon: <Shield size={14} />,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Rating = 1 | 2 | 3 | 4 | 5;

interface DimensionRating {
  dimensionId: string;
  rating: Rating;
  evidence: string[];
  notes: string;
}

interface VerdictResult {
  overallScore: number;
  verdict: "strong_pass" | "pass" | "borderline" | "fail" | "strong_fail";
  icLevel: "IC5" | "IC6" | "IC7";
  dimensionScores: Array<{
    dimensionId: string;
    score: number;
    level: "IC5" | "IC6" | "IC7";
    gap: string;
    coachingNote: string;
  }>;
  strengths: string[];
  criticalGaps: string[];
  hiringRecommendation: string;
  nextSteps: string[];
}

// ── Rating Selector ───────────────────────────────────────────────────────────

interface RatingSelectorProps {
  value: Rating;
  onChange: (r: Rating) => void;
}

function RatingSelector({ value, onChange }: RatingSelectorProps) {
  const labels: Record<Rating, string> = {
    1: "Far Below IC6",
    2: "Below IC6",
    3: "At IC6 Bar",
    4: "Above IC6",
    5: "IC7 Level",
  };
  const colors: Record<Rating, string> = {
    1: "bg-red-500 text-white",
    2: "bg-orange-400 text-white",
    3: "bg-amber-400 text-white",
    4: "bg-emerald-500 text-white",
    5: "bg-blue-600 text-white",
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          title={labels[r]}
          className={cn(
            "w-8 h-8 rounded-lg text-sm font-bold transition-all border-2",
            value === r
              ? colors[r] + " border-transparent scale-110"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 border-transparent hover:border-gray-300"
          )}
        >
          {r}
        </button>
      ))}
      <span className="text-xs text-gray-600 self-center ml-1">{labels[value]}</span>
    </div>
  );
}

// ── Dimension Card ────────────────────────────────────────────────────────────

interface DimensionCardProps {
  dim: RubricDimension;
  rating: DimensionRating;
  onRatingChange: (r: Rating) => void;
  onEvidenceAdd: (text: string) => void;
  onEvidenceRemove: (i: number) => void;
  onNotesChange: (text: string) => void;
}

function DimensionCard({
  dim,
  rating,
  onRatingChange,
  onEvidenceAdd,
  onEvidenceRemove,
  onNotesChange,
}: DimensionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newEvidence, setNewEvidence] = useState("");

  const categoryColors: Record<RubricDimension["category"], string> = {
    coding: "border-blue-200 text-blue-600",
    system_design: "border-purple-200 text-purple-600",
    behavioral: "border-amber-200 text-amber-800",
    leadership: "border-emerald-200 text-emerald-600",
  };

  const barForRating = (r: Rating) => {
    if (r <= 2) return dim.ic5Bar;
    if (r === 3) return dim.ic6Bar;
    return dim.ic7Bar;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
          dim.category === "coding" && "bg-blue-50 dark:bg-blue-900/30 text-blue-600",
          dim.category === "system_design" && "bg-purple-50 dark:bg-purple-900/30 text-purple-600",
          dim.category === "behavioral" && "bg-amber-100 dark:bg-amber-900/30 text-amber-800",
          dim.category === "leadership" && "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
        )}>
          {dim.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">{dim.name}</span>
            <Badge variant="outline" className={cn("text-xs capitalize", categoryColors[dim.category])}>
              {dim.category.replace("_", " ")}
            </Badge>
            {"★".repeat(dim.weight).padEnd(3, "☆").split("").map((s, i) => (
              <span key={i} className={s === "★" ? "text-amber-900 text-xs" : "text-gray-200 text-xs"}>{s}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <div
                  key={r}
                  className={cn(
                    "w-4 h-1.5 rounded-full",
                    r <= rating.rating
                      ? rating.rating <= 2 ? "bg-red-400" : rating.rating === 3 ? "bg-amber-400" : "bg-emerald-500"
                      : "bg-gray-200 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {rating.rating <= 2 ? "Below IC6" : rating.rating === 3 ? "At IC6" : "Above IC6"}
            </span>
            {rating.evidence.length > 0 && (
              <span className="text-xs text-gray-600">· {rating.evidence.length} evidence</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Rating */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Your Rating
            </label>
            <RatingSelector value={rating.rating} onChange={onRatingChange} />
          </div>

          {/* IC Bar Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: "IC5 Bar", text: dim.ic5Bar, color: "border-red-200 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300" },
              { label: "IC6 Bar", text: dim.ic6Bar, color: "border-amber-200 bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-800" },
              { label: "IC7 Bar", text: dim.ic7Bar, color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" },
            ].map(({ label, text, color }) => (
              <div key={label} className={cn("rounded-lg border p-2.5 text-xs", color)}>
                <p className="font-bold mb-1">{label}</p>
                <p className="leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Evidence */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Evidence (specific examples from your practice)
            </label>
            <div className="space-y-1.5 mb-2">
              {rating.evidence.map((ev, i) => (
                <div key={i} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-600 dark:text-gray-200 flex-1">{ev}</span>
                  <button
                    onClick={() => onEvidenceRemove(i)}
                    className="text-gray-700 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newEvidence}
                onChange={(e) => setNewEvidence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newEvidence.trim()) {
                    onEvidenceAdd(newEvidence.trim());
                    setNewEvidence("");
                  }
                }}
                placeholder="Add evidence (press Enter)…"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (newEvidence.trim()) {
                    onEvidenceAdd(newEvidence.trim());
                    setNewEvidence("");
                  }
                }}
                className="h-8 px-2.5"
              >
                <Plus size={13} />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
              Notes
            </label>
            <Textarea
              value={rating.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Additional context or observations…"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Verdict Display ───────────────────────────────────────────────────────────

interface VerdictDisplayProps {
  result: VerdictResult;
  onReset: () => void;
}

function VerdictDisplay({ result, onReset }: VerdictDisplayProps) {
  const verdictConfig: Record<VerdictResult["verdict"], {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
  }> = {
    strong_pass: {
      label: "Strong Pass",
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      icon: <CheckCircle2 size={32} className="text-emerald-500" />,
    },
    pass: {
      label: "Pass",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      icon: <CheckCircle2 size={32} className="text-emerald-400" />,
    },
    borderline: {
      label: "Borderline",
      color: "text-amber-900 dark:text-amber-800",
      bg: "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
      icon: <AlertCircle size={32} className="text-amber-500" />,
    },
    fail: {
      label: "Fail",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      icon: <XCircle size={32} className="text-red-400" />,
    },
    strong_fail: {
      label: "Strong Fail",
      color: "text-red-700 dark:text-red-300",
      bg: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      icon: <XCircle size={32} className="text-red-500" />,
    },
  };

  const cfg = verdictConfig[result.verdict];

  return (
    <div className="space-y-5">
      {/* Verdict Banner */}
      <div className={cn("rounded-2xl border p-6 text-center", cfg.bg)}>
        <div className="flex justify-center mb-3">{cfg.icon}</div>
        <div className={cn("text-3xl font-black mb-1", cfg.color)}>{cfg.label}</div>
        <div className="text-gray-700 dark:text-gray-300 text-sm mb-3">
          Projected IC Level: <span className="font-bold text-gray-800 dark:text-gray-200">{result.icLevel}</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Progress value={result.overallScore} className="w-48 h-2.5" />
          <span className="font-bold text-gray-700 dark:text-gray-200">{result.overallScore}/100</span>
        </div>
      </div>

      {/* Hiring Recommendation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gavel size={14} className="text-gray-700" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Hiring Recommendation</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{result.hiringRecommendation}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-amber-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Strengths</span>
          </div>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-200">
                <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Critical Gaps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-red-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Critical Gaps</span>
          </div>
          <ul className="space-y-1.5">
            {result.criticalGaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-200">
                <XCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-gray-700" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Dimension Breakdown</span>
        </div>
        <div className="space-y-3">
          {result.dimensionScores.map((ds) => {
            const dim = RUBRIC.find((d) => d.id === ds.dimensionId);
            if (!dim) return null;
            return (
              <div key={ds.dimensionId}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        ds.level === "IC7" && "border-emerald-200 text-emerald-600",
                        ds.level === "IC6" && "border-amber-200 text-amber-800",
                        ds.level === "IC5" && "border-red-200 text-red-600"
                      )}
                    >
                      {ds.level}
                    </Badge>
                    <span className="text-xs font-bold text-gray-700">{ds.score}%</span>
                  </div>
                </div>
                <Progress
                  value={ds.score}
                  className={cn(
                    "h-1.5",
                    ds.score >= 70 ? "[&>div]:bg-emerald-500" : ds.score >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                  )}
                />
                {ds.gap && (
                  <p className="text-xs text-gray-600 mt-0.5">{ds.gap}</p>
                )}
                {ds.coachingNote && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 italic">{ds.coachingNote}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight size={14} className="text-blue-500" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Next Steps</span>
        </div>
        <ol className="space-y-1.5">
          {result.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-200">
              <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <Button variant="outline" onClick={onReset} className="gap-1.5">
        <RefreshCw size={13} />
        Start New Assessment
      </Button>
    </div>
  );
}

// ── Verdict History ──────────────────────────────────────────────────────────

interface VerdictHistoryEntry {
  id: string;
  timestamp: number;
  overallScore: number;
  verdict: VerdictResult["verdict"];
  icLevel: VerdictResult["icLevel"];
}

const VERDICT_LABELS: Record<VerdictResult["verdict"], string> = {
  strong_pass: "Strong Pass",
  pass: "Pass",
  borderline: "Borderline",
  fail: "Fail",
  strong_fail: "Strong Fail",
};

function VerdictTrajectoryChart({ history }: { history: VerdictHistoryEntry[] }) {
  if (history.length < 2) {
    return (
      <div className="text-center py-6 text-muted-foreground text-xs">
        Run at least 2 assessments to see your trajectory.
      </div>
    );
  }
  const data = history
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e, i) => ({
      run: `Run ${i + 1}`,
      score: e.overallScore,
      date: new Date(e.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      verdict: VERDICT_LABELS[e.verdict],
      icLevel: e.icLevel,
    }));
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-foreground">Score Trajectory</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 11,
            }}
            formatter={(value: number, _: string, entry) => [
              `${value}/100 — ${entry.payload.verdict} (${entry.payload.icLevel})`,
              "Score",
            ]}
          />
          <ReferenceLine y={60} stroke="#60a5fa" strokeDasharray="4 2" strokeWidth={1} label={{ value: "IC6 Bar", position: "insideTopRight", fontSize: 9, fill: "#60a5fa" }} />
          <ReferenceLine y={80} stroke="#a78bfa" strokeDasharray="4 2" strokeWidth={1} label={{ value: "IC7 Bar", position: "insideTopRight", fontSize: 9, fill: "#a78bfa" }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ fill: "#34d399", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {/* Run list */}
      <div className="space-y-1">
        {data.slice().reverse().map((d, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{d.date}</span>
            <span className="font-semibold text-foreground">{d.score}/100</span>
            <span>{d.verdict}</span>
            <span className={d.icLevel === "IC7" ? "text-violet-400" : d.icLevel === "IC6" ? "text-blue-400" : ""}>{d.icLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function initRatings(): DimensionRating[] {
  return RUBRIC.map((d) => ({
    dimensionId: d.id,
    rating: 3 as Rating,
    evidence: [],
    notes: "",
  }));
}

export default function VerdictEngineTab() {
  const [ratings, setRatings] = useLocalStorage<DimensionRating[]>("verdict-engine-ratings", initRatings());
  const [verdict, setVerdict] = useLocalStorage<VerdictResult | null>("verdict-engine-result", null);
  const [history, setHistory] = useLocalStorage<VerdictHistoryEntry[]>("verdict-engine-history", []);
  const [selectedCategory, setSelectedCategory] = useState<"all" | RubricDimension["category"]>("all");
  const [showHistory, setShowHistory] = useState(false);

  const generateVerdict = trpc.ai.generateVerdict.useMutation({
    onSuccess: (data) => {
      setVerdict(data.verdict);
      // Persist this run to history (cap at 30 entries)
      const entry: VerdictHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        overallScore: data.verdict.overallScore,
        verdict: data.verdict.verdict,
        icLevel: data.verdict.icLevel,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 30));
      toast.success("Verdict generated!");
    },
    onError: () => toast.error("Failed to generate verdict. Please try again."),
  });

  const handleRatingChange = (dimensionId: string, r: Rating) => {
    setRatings((prev) =>
      prev.map((d) => (d.dimensionId === dimensionId ? { ...d, rating: r } : d))
    );
  };

  const handleEvidenceAdd = (dimensionId: string, text: string) => {
    setRatings((prev) =>
      prev.map((d) =>
        d.dimensionId === dimensionId ? { ...d, evidence: [...d.evidence, text] } : d
      )
    );
  };

  const handleEvidenceRemove = (dimensionId: string, i: number) => {
    setRatings((prev) =>
      prev.map((d) =>
        d.dimensionId === dimensionId
          ? { ...d, evidence: d.evidence.filter((_, j) => j !== i) }
          : d
      )
    );
  };

  const handleNotesChange = (dimensionId: string, text: string) => {
    setRatings((prev) =>
      prev.map((d) => (d.dimensionId === dimensionId ? { ...d, notes: text } : d))
    );
  };

  const handleGenerateVerdict = () => {
    generateVerdict.mutate({
      ratings: ratings.map((r) => {
        const dim = RUBRIC.find((d) => d.id === r.dimensionId)!;
        return {
          dimensionId: r.dimensionId,
          dimensionName: dim.name,
          category: dim.category,
          weight: dim.weight,
          rating: r.rating,
          evidence: r.evidence,
          notes: r.notes,
          ic5Bar: dim.ic5Bar,
          ic6Bar: dim.ic6Bar,
          ic7Bar: dim.ic7Bar,
        };
      }),
    });
  };

  const filteredRubric = RUBRIC.filter(
    (d) => selectedCategory === "all" || d.category === selectedCategory
  );

  const avgRating = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

  if (verdict) {
    return (
      <div className="space-y-5">
        <VerdictDisplay
          result={verdict}
          onReset={() => { setVerdict(null); setRatings(initRatings()); }}
        />
        {/* Trajectory chart shown after verdict */}
        {history.length >= 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-blue-500" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">IC Level Trajectory</span>
                <span className="text-xs text-muted-foreground">({history.length} run{history.length !== 1 ? "s" : ""})</span>
              </div>
            </div>
            <VerdictTrajectoryChart history={history} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* ── Screen Interview watermark ── */}
      <ScreenInterviewWatermark className="absolute top-0 right-0" size="1.4rem" opacity={0.10} />
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gavel size={20} className="text-gray-700 dark:text-gray-200" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pass/Fail Verdict Engine
            </h2>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Rate yourself on each IC6 rubric dimension, add evidence from your practice sessions,
            and get an AI-generated hiring verdict with coaching notes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-2.5">
          <Brain size={16} className={cn(
            avgRating >= 4 ? "text-emerald-500" : avgRating >= 3 ? "text-amber-500" : "text-red-500"
          )} />
          <div>
            <div className={cn(
              "text-xl font-bold leading-tight",
              avgRating >= 4 ? "text-emerald-600" : avgRating >= 3 ? "text-amber-800" : "text-red-600"
            )}>
              {avgRating.toFixed(1)}/5
            </div>
            <div className="text-xs text-gray-600">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "coding", "system_design", "behavioral", "leadership"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize",
              selectedCategory === cat
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Rubric Cards */}
      <div className="space-y-2">
        {filteredRubric.map((dim) => {
          const rating = ratings.find((r) => r.dimensionId === dim.id) ?? {
            dimensionId: dim.id,
            rating: 3 as Rating,
            evidence: [],
            notes: "",
          };
          return (
            <DimensionCard
              key={dim.id}
              dim={dim}
              rating={rating}
              onRatingChange={(r) => handleRatingChange(dim.id, r)}
              onEvidenceAdd={(text) => handleEvidenceAdd(dim.id, text)}
              onEvidenceRemove={(i) => handleEvidenceRemove(dim.id, i)}
              onNotesChange={(text) => handleNotesChange(dim.id, text)}
            />
          );
        })}
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleGenerateVerdict}
          disabled={generateVerdict.isPending}
          className="gap-2"
        >
          {generateVerdict.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Generating Verdict…</>
          ) : (
            <><Gavel size={14} /> Generate IC6 Verdict</>
          )}
        </Button>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory((p) => !p)}
            className="gap-1.5 text-xs"
          >
            <BarChart2 size={13} />
            {showHistory ? "Hide" : "View"} History ({history.length})
          </Button>
        )}
        <p className="text-xs text-gray-600">
          Rate all {RUBRIC.length} dimensions and add evidence for the most accurate verdict.
        </p>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-blue-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">IC Level Trajectory</span>
            <span className="text-xs text-muted-foreground">({history.length} run{history.length !== 1 ? "s" : ""})</span>
          </div>
          <VerdictTrajectoryChart history={history} />
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={13} className="text-gray-600" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rating Scale</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { r: 1, label: "Far Below IC6", desc: "Needs significant work", color: "text-red-600" },
            { r: 2, label: "Below IC6", desc: "Close but missing key signals", color: "text-orange-500" },
            { r: 3, label: "At IC6 Bar", desc: "Meets expectations", color: "text-amber-800" },
            { r: 4, label: "Above IC6", desc: "Consistently exceeds bar", color: "text-emerald-600" },
            { r: 5, label: "IC7 Level", desc: "Exceptional, rare signal", color: "text-blue-600" },
          ].map(({ r, label, desc, color }) => (
            <div key={r} className="text-center">
              <div className={cn("text-lg font-black", color)}>{r}</div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-200">{label}</div>
              <div className="text-xs text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
