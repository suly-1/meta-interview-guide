/**
 * ReadinessScoreCard — Feature 6
 * Single composite 0–100 score with breakdown and trend sparkline.
 * Weights: Drill 40% + CTCI 30% + Behavioral 20% + Streak 10%
 */
import { useMemo } from "react";
import { TrendingUp, Zap, BookOpen, MessageSquare, Flame } from "lucide-react";
import { useReadinessScore } from "@/hooks/useReadinessScore";

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Strong" : score >= 50 ? "On Track" : score >= 30 ? "Developing" : "Just Starting";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>{score}</span>
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function ReadinessScoreCard() {
  const score = useReadinessScore();

  const breakdown = [
    {
      label: "Quick Drill",
      icon: Zap,
      value: score.drillScore,
      detail: score.drillAvg !== null ? `${score.drillAvg.toFixed(1)}★ avg` : "No drills yet",
      color: "#6366f1",
      weight: "40%",
    },
    {
      label: "CTCI Solved",
      icon: BookOpen,
      value: score.ctciScore,
      detail: `${score.ctciSolved} / ${score.ctciTotal}`,
      color: "#3b82f6",
      weight: "30%",
    },
    {
      label: "Behavioral",
      icon: MessageSquare,
      value: score.behavioralScore,
      detail: score.behavioralAvg !== null ? `${score.behavioralAvg.toFixed(1)}★ avg` : "No practice yet",
      color: "#8b5cf6",
      weight: "20%",
    },
    {
      label: "Streak",
      icon: Flame,
      value: score.streakScore,
      detail: `${score.streak} day${score.streak !== 1 ? "s" : ""}`,
      color: "#f59e0b",
      weight: "10%",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl">
      <div className="flex items-start gap-5">
        <ScoreRing score={score.total} size={88} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Interview Readiness Score</span>
          </div>
          <p className="text-2xl font-extrabold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {score.total}/100
          </p>
          <div className="space-y-2">
            {breakdown.map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <b.icon size={11} style={{ color: b.color }} className="flex-shrink-0" />
                <span className="text-[11px] text-slate-400 w-20 flex-shrink-0">{b.label}</span>
                <MiniBar value={b.value} color={b.color} />
                <span className="text-[11px] font-bold text-slate-300 w-8 text-right">{b.value}</span>
                <span className="text-[10px] text-slate-500 w-8">{b.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {breakdown.map(b => (
          <div key={b.label} className="text-center">
            <p className="text-xs font-bold" style={{ color: b.color }}>{b.detail}</p>
            <p className="text-[10px] text-slate-500">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
