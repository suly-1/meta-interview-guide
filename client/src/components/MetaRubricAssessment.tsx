/**
 * MetaRubricAssessment — Staff Engineer Focus Area Rubric
 * Displays AI-scored assessment across Meta's 4 official focus areas:
 *   Problem Solving | Coding | Verification | Communication
 * Each rated on Meta's 6-point scale:
 *   Insufficient | Moderate | Solid | Strong | Exceptional | Can't Assess
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Brain, Code2, CheckSquare, MessageSquare,
  Loader2, Sparkles, ChevronDown, ChevronUp,
  TrendingUp, AlertCircle, Star
} from "lucide-react";

export type MetaRating =
  | "Insufficient"
  | "Moderate"
  | "Solid"
  | "Strong"
  | "Exceptional"
  | "Can't Assess";

export type MetaVerdict =
  | "No Hire"
  | "Lean No Hire"
  | "Lean Hire"
  | "Hire"
  | "Strong Hire";

export interface MetaRubricDimension {
  rating: MetaRating;
  rationale: string;
  keyStrength: string | null;
  keyGap: string | null;
}

export interface MetaRubricResult {
  problemSolving: MetaRubricDimension;
  coding: MetaRubricDimension;
  verification: MetaRubricDimension;
  communication: MetaRubricDimension;
  overallVerdict: MetaVerdict;
  summaryFeedback: string;
}

// ─── Rating visual config ────────────────────────────────────────────────────
const RATING_ORDER: MetaRating[] = [
  "Insufficient", "Moderate", "Solid", "Strong", "Exceptional", "Can't Assess"
];

const RATING_CONFIG: Record<MetaRating, {
  color: string; bg: string; border: string; dot: string; barWidth: string;
}> = {
  "Insufficient":  { color: "text-red-700",     bg: "bg-red-50 dark:bg-red-900/20",     border: "border-red-200 dark:border-red-800",     dot: "bg-red-500",     barWidth: "w-[10%]" },
  "Moderate":      { color: "text-orange-700",   bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500", barWidth: "w-[30%]" },
  "Solid":         { color: "text-yellow-700",   bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-500", barWidth: "w-[55%]" },
  "Strong":        { color: "text-blue-700",     bg: "bg-blue-50 dark:bg-blue-900/20",   border: "border-blue-200 dark:border-blue-800",   dot: "bg-blue-500",   barWidth: "w-[75%]" },
  "Exceptional":   { color: "text-emerald-700",  bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", barWidth: "w-full" },
  "Can't Assess":  { color: "text-gray-500",     bg: "bg-gray-50 dark:bg-gray-800",      border: "border-gray-200 dark:border-gray-700",   dot: "bg-gray-400",   barWidth: "w-0" },
};

const VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "No Hire":       { color: "text-red-700",    bg: "bg-red-100",    border: "border-red-300" },
  "Lean No Hire":  { color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-300" },
  "Lean Hire":     { color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-300" },
  "Hire":          { color: "text-blue-700",   bg: "bg-blue-100",   border: "border-blue-300" },
  "Strong Hire":   { color: "text-emerald-700",bg: "bg-emerald-100",border: "border-emerald-300" },
};

const DIMENSIONS: {
  key: keyof Omit<MetaRubricResult, "overallVerdict" | "summaryFeedback">;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    key: "problemSolving",
    label: "(SWE) Problem Solving",
    icon: <Brain size={16} />,
    description: "Pattern recognition, algorithm selection, constraints, edge cases",
  },
  {
    key: "coding",
    label: "(SWE) Coding",
    icon: <Code2 size={16} />,
    description: "Code quality, correctness, readability, data structure choice",
  },
  {
    key: "verification",
    label: "(SWE) Verification",
    icon: <CheckSquare size={16} />,
    description: "Testing, tracing, bug identification, complexity analysis",
  },
  {
    key: "communication",
    label: "(SWE) Communication",
    icon: <MessageSquare size={16} />,
    description: "Thinking out loud, trade-off articulation, clarity",
  },
];

// ─── RatingPill ──────────────────────────────────────────────────────────────
function RatingPill({ rating }: { rating: MetaRating }) {
  const cfg = RATING_CONFIG[rating];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {rating}
    </span>
  );
}

// ─── RatingBar ───────────────────────────────────────────────────────────────
function RatingBar({ rating }: { rating: MetaRating }) {
  const cfg = RATING_CONFIG[rating];
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
      <div className={`h-full rounded-full transition-all duration-700 ${cfg.dot} ${cfg.barWidth}`} />
    </div>
  );
}

// ─── DimensionCard ───────────────────────────────────────────────────────────
function DimensionCard({
  label, icon, description, dimension,
}: {
  label: string;
  icon: React.ReactNode;
  description: string;
  dimension: MetaRubricDimension;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RATING_CONFIG[dimension.rating as MetaRating] ?? RATING_CONFIG["Can't Assess"];

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex-shrink-0 ${cfg.color}`}>{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{label}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{description}</p>
          </div>
        </div>
        <RatingPill rating={dimension.rating as MetaRating} />
      </div>

      <RatingBar rating={dimension.rating as MetaRating} />

      {/* Rationale */}
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-3">{dimension.rationale}</p>

      {/* Strength / Gap */}
      {(dimension.keyStrength || dimension.keyGap) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Hide details" : "Show strength & gap"}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-2">
          {dimension.keyStrength && (
            <div className="flex items-start gap-2 bg-white/60 dark:bg-white/5 rounded-lg p-2.5">
              <TrendingUp size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Key Strength</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{dimension.keyStrength}</p>
              </div>
            </div>
          )}
          {dimension.keyGap && (
            <div className="flex items-start gap-2 bg-white/60 dark:bg-white/5 rounded-lg p-2.5">
              <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">Key Gap</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{dimension.keyGap}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RatingSelector ──────────────────────────────────────────────────────────
function RatingSelector({
  value, onChange,
}: {
  value: MetaRating;
  onChange: (r: MetaRating) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {RATING_ORDER.map(r => {
        const cfg = RATING_CONFIG[r];
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              active
                ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-2 ring-offset-1 ring-current`
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400"
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface MetaRubricAssessmentProps {
  /** The problem the candidate attempted */
  problemName: string;
  /** Candidate's verbal/written approach */
  approachText: string;
  /** Optional: candidate's code */
  codeText?: string;
  /** Target level for calibration */
  targetLevel?: "L5" | "L6" | "L7";
  /** Allow manual self-assessment mode (no AI call) */
  selfAssessMode?: boolean;
}

export default function MetaRubricAssessment({
  problemName,
  approachText,
  codeText = "",
  targetLevel = "L6",
  selfAssessMode = false,
}: MetaRubricAssessmentProps) {
  const [result, setResult] = useState<MetaRubricResult | null>(null);
  const [mode, setMode] = useState<"ai" | "self">(selfAssessMode ? "self" : "ai");
  const [level, setLevel] = useState<"L5" | "L6" | "L7">(targetLevel);

  // Self-assessment state
  const [selfRatings, setSelfRatings] = useState<Record<string, MetaRating>>({
    problemSolving: "Solid",
    coding: "Solid",
    verification: "Solid",
    communication: "Solid",
  });

  const scoreMutation = trpc.metaRubric.score.useMutation({
    onSuccess: (data) => setResult(data as MetaRubricResult),
  });

  const handleAIScore = () => {
    if (!approachText.trim() || approachText.trim().length < 10) return;
    scoreMutation.mutate({ problemName, approachText, codeText, targetLevel: level });
  };

  const handleSelfAssess = () => {
    // Build a synthetic result from self-ratings
    const makeRow = (rating: MetaRating): MetaRubricDimension => ({
      rating,
      rationale: "Self-assessed by candidate.",
      keyStrength: null,
      keyGap: null,
    });
    const ratings = Object.values(selfRatings) as MetaRating[];
    const ratingToScore = (r: MetaRating) =>
      ["Insufficient", "Moderate", "Solid", "Strong", "Exceptional", "Can't Assess"].indexOf(r);
    const avg = ratings.reduce((s, r) => s + ratingToScore(r), 0) / ratings.length;
    const verdict: MetaVerdict =
      avg >= 4.5 ? "Strong Hire" : avg >= 3.5 ? "Hire" : avg >= 2.5 ? "Lean Hire" : avg >= 1.5 ? "Lean No Hire" : "No Hire";
    setResult({
      problemSolving: makeRow(selfRatings.problemSolving as MetaRating),
      coding: makeRow(selfRatings.coding as MetaRating),
      verification: makeRow(selfRatings.verification as MetaRating),
      communication: makeRow(selfRatings.communication as MetaRating),
      overallVerdict: verdict,
      summaryFeedback: "This is a self-assessment. Use the AI mode for detailed coaching feedback.",
    });
  };

  const verdictCfg = result
    ? (VERDICT_CONFIG[result.overallVerdict] ?? VERDICT_CONFIG["Lean Hire"])
    : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Star size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Meta SWE Focus Area Assessment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Official Meta rubric — 4 dimensions, 6-point scale
            </p>
          </div>
        </div>
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => { setMode("ai"); setResult(null); }}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              mode === "ai"
                ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            AI Score
          </button>
          <button
            onClick={() => { setMode("self"); setResult(null); }}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              mode === "self"
                ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Self-Assess
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Problem context */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Problem</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{problemName}</p>
        </div>

        {!result ? (
          <>
            {/* Level selector */}
            <div>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Calibrate to level</p>
              <div className="flex gap-2">
                {(["L5", "L6", "L7"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      level === l
                        ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {l === "L5" ? "L5 (SWE)" : l === "L6" ? "L6 (Senior)" : "L7 (Staff)"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "ai" ? (
              <>
                {/* Approach preview */}
                {approachText.trim().length < 10 ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Write or speak your approach above (at least 10 characters) before requesting AI scoring.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Your approach (preview)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{approachText}</p>
                  </div>
                )}

                <button
                  onClick={handleAIScore}
                  disabled={scoreMutation.isPending || approachText.trim().length < 10}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                >
                  {scoreMutation.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Scoring with AI…</>
                  ) : (
                    <><Sparkles size={15} /> Get Meta Rubric Feedback</>
                  )}
                </button>

                {scoreMutation.isError && (
                  <p className="text-xs text-red-600 text-center">
                    Scoring failed. Please try again.
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Self-assessment selectors */}
                <div className="space-y-4">
                  {DIMENSIONS.map(dim => (
                    <div key={dim.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-indigo-600 dark:text-indigo-400">{dim.icon}</span>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{dim.label}</p>
                      </div>
                      <RatingSelector
                        value={selfRatings[dim.key] as MetaRating}
                        onChange={r => setSelfRatings(prev => ({ ...prev, [dim.key]: r }))}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSelfAssess}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                >
                  <CheckSquare size={15} /> Save Self-Assessment
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {/* Overall verdict */}
            {verdictCfg && (
              <div className={`rounded-xl border p-4 ${verdictCfg.bg} ${verdictCfg.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Verdict</p>
                  <span className={`text-lg font-black ${verdictCfg.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {result.overallVerdict}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{result.summaryFeedback}</p>
              </div>
            )}

            {/* 4 dimension cards */}
            <div className="space-y-3">
              {DIMENSIONS.map(dim => (
                <DimensionCard
                  key={dim.key}
                  label={dim.label}
                  icon={dim.icon}
                  description={dim.description}
                  dimension={result[dim.key]}
                />
              ))}
            </div>

            {/* Rating legend */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rating Scale</p>
              <div className="grid grid-cols-3 gap-1.5">
                {RATING_ORDER.filter(r => r !== "Can't Assess").map(r => {
                  const cfg = RATING_CONFIG[r];
                  return (
                    <div key={r} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className={`text-[10px] font-semibold ${cfg.color}`}>{r}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors text-sm"
            >
              Re-assess
            </button>
          </>
        )}
      </div>
    </div>
  );
}
