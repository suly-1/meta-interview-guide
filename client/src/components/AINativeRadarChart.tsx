/**
 * AINativeRadarChart
 *
 * Shows a 4-axis radar chart of the user's AI-Native core skill scores:
 *   - AI Fluency & Tool Orchestration
 *   - AI-Driven Impact
 *   - Responsible AI Use
 *   - Continuous AI Learning
 *
 * Scores are derived from the best drill score per core-skill axis.
 * Falls back gracefully to an empty state when no drills have been completed.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";

const AXES = [
  { key: "fluency", label: "AI Fluency" },
  { key: "impact", label: "AI Impact" },
  { key: "responsible", label: "Responsible AI" },
  { key: "continuous", label: "Continuous Learning" },
] as const;

const LEVEL_COLORS: Record<string, string> = {
  Traditionalist: "#6b7280",
  "AI Aware": "#3b82f6",
  "AI Enabled": "#8b5cf6",
  "AI First": "#a855f7",
  "AI Native": "#7c3aed",
};

export function AINativeRadarChart() {
  const { data: bestScores, isLoading: scoresLoading } =
    trpc.aiNativeHistory.getBestScoresByDrill.useQuery();
  const { data: maturityLevel, isLoading: levelLoading } =
    trpc.aiNativeHistory.getMaturityLevel.useQuery();

  const radarData = useMemo(() => {
    if (!bestScores)
      return AXES.map(a => ({ subject: a.label, score: 0, fullMark: 10 }));
    // Average the best drill scores per core skill axis
    const skillTotals: Record<string, { sum: number; count: number }> = {
      fluency: { sum: 0, count: 0 },
      impact: { sum: 0, count: 0 },
      responsible: { sum: 0, count: 0 },
      continuous: { sum: 0, count: 0 },
    };
    for (const drill of Object.values(bestScores)) {
      const skill = drill.coreSkill as keyof typeof skillTotals;
      if (skillTotals[skill]) {
        skillTotals[skill].sum += drill.overallScore;
        skillTotals[skill].count += 1;
      }
    }
    return AXES.map(a => ({
      subject: a.label,
      score:
        skillTotals[a.key].count > 0
          ? Math.round(skillTotals[a.key].sum / skillTotals[a.key].count)
          : 0,
      fullMark: 10,
    }));
  }, [bestScores]);

  const hasData = radarData.some(d => d.score > 0);
  const isLoading = scoresLoading || levelLoading;

  const levelColor = maturityLevel
    ? (LEVEL_COLORS[maturityLevel.level] ?? "#7c3aed")
    : "#7c3aed";

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            AI-Native Skill Radar
          </span>
        </div>
        {maturityLevel && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full border"
            style={{
              color: levelColor,
              borderColor: `${levelColor}40`,
              background: `${levelColor}15`,
            }}
          >
            ✦ {maturityLevel.level}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
          <TrendingUp size={24} className="text-violet-400/50" />
          <p className="text-xs text-muted-foreground">
            Complete AI-Native drills to populate your skill radar
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart
            data={radarData}
            margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
          >
            <PolarGrid stroke="rgba(139,92,246,0.2)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "rgb(167,139,250)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,10,30,0.9)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}/10`, "Score"]}
            />
            <Radar
              name="AI-Native Score"
              dataKey="score"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {/* Axis breakdown */}
      {hasData && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {radarData.map(d => (
            <div key={d.subject} className="flex items-center gap-2">
              <div className="flex-1 bg-violet-500/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${(d.score / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-16 shrink-0 truncate">
                {d.subject}
              </span>
              <span className="text-xs font-mono text-violet-300 w-6 text-right">
                {d.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
