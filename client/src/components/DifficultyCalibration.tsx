/**
 * DifficultyCalibration — Feature 16
 * Tracks solve rate per difficulty tier and auto-adjusts recommended difficulty.
 * Easy > 80% → shift to Medium; Medium > 70% → shift to Hard.
 */
import { useMemo } from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";

const THRESHOLDS = { Easy: 0.8, Medium: 0.7, Hard: 1.0 };

export default function DifficultyCalibration() {
  const { progress } = useCTCIProgress();

  const stats = useMemo(() => {
    const tiers = ["Easy", "Medium", "Hard"] as const;
    return tiers.map(diff => {
      const total = CTCI_PROBLEMS.filter(p => p.difficulty === diff).length;
      const solved = CTCI_PROBLEMS.filter(p => p.difficulty === diff && progress[p.id]?.solved).length;
      const rate = total > 0 ? solved / total : 0;
      return { diff, total, solved, rate };
    });
  }, [progress]);

  const recommendation = useMemo(() => {
    const easy = stats.find(s => s.diff === "Easy")!;
    const medium = stats.find(s => s.diff === "Medium")!;
    if (medium.rate >= THRESHOLDS.Medium) return { level: "Hard", reason: `You've solved ${Math.round(medium.rate * 100)}% of Medium problems` };
    if (easy.rate >= THRESHOLDS.Easy) return { level: "Medium", reason: `You've solved ${Math.round(easy.rate * 100)}% of Easy problems` };
    return { level: "Easy", reason: "Build your foundation with Easy problems first" };
  }, [stats]);

  const diffColors: Record<string, { bar: string; text: string; bg: string }> = {
    Easy:   { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    Medium: { bar: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
    Hard:   { bar: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border-red-200" },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={15} className="text-blue-600" />
        <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Difficulty Auto-Calibration
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => {
          const c = diffColors[s.diff];
          const threshold = THRESHOLDS[s.diff as keyof typeof THRESHOLDS];
          const cleared = s.rate >= threshold;
          return (
            <div key={s.diff} className={`rounded-lg border p-3 ${cleared ? c.bg : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${cleared ? c.text : "text-gray-500"}`}>{s.diff}</span>
                {cleared && <span className="text-[10px] text-emerald-600 font-bold">✓ Cleared</span>}
              </div>
              <p className={`text-xl font-extrabold ${cleared ? c.text : "text-gray-700"}`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {Math.round(s.rate * 100)}%
              </p>
              <p className="text-[10px] text-gray-400">{s.solved}/{s.total} solved</p>
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${c.bar}`}
                  style={{ width: `${Math.min(100, (s.rate / threshold) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5">Target: {Math.round(threshold * 100)}%</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <ArrowRight size={14} className="text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-blue-900">
            Recommended focus: <span className={diffColors[recommendation.level].text}>{recommendation.level}</span>
          </p>
          <p className="text-[11px] text-blue-600">{recommendation.reason}</p>
        </div>
      </div>
    </div>
  );
}
