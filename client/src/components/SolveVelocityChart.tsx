/**
 * SolveVelocityChart — Feature 8
 * Line chart showing cumulative CTCI problems solved per day over the last 30 days.
 * Pure SVG — no external chart library needed.
 */
import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";

const CTCI_KEY = "ctci_progress_v1";

function loadProgress(): Record<number, { solved: boolean; solvedAt?: string }> {
  try { return JSON.parse(localStorage.getItem(CTCI_KEY) ?? "{}"); } catch { return {}; }
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function SolveVelocityChart({ days = 30 }: { days?: number }) {
  const { points, maxCumulative, dailyCounts, totalSolved, avgPerDay } = useMemo(() => {
    const progress = loadProgress();
    const today = new Date().toISOString().split("T")[0];
    const startDate = addDays(today, -(days - 1));

    // Build date array
    const dateArr: string[] = [];
    for (let i = 0; i < days; i++) dateArr.push(addDays(startDate, i));

    // Count solves per day
    const dailyMap: Record<string, number> = {};
    dateArr.forEach(d => { dailyMap[d] = 0; });
    CTCI_PROBLEMS.forEach(p => {
      const prog = progress[p.id];
      if (prog?.solved && prog.solvedAt) {
        const d = prog.solvedAt.split("T")[0];
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      }
    });

    // Cumulative
    let cum = 0;
    const points: { date: string; daily: number; cumulative: number }[] = dateArr.map(d => {
      cum += dailyMap[d];
      return { date: d, daily: dailyMap[d], cumulative: cum };
    });

    const maxCumulative = Math.max(...points.map(p => p.cumulative), 1);
    const totalSolved = cum;
    const activeDays = points.filter(p => p.daily > 0).length;
    const avgPerDay = activeDays > 0 ? (totalSolved / activeDays).toFixed(1) : "0";

    return { points, maxCumulative, dailyCounts: points.map(p => p.daily), totalSolved, avgPerDay };
  }, [days]);

  const W = 480, H = 120, PAD = { top: 10, right: 10, bottom: 24, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / (points.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - (v / maxCumulative) * chartH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.cumulative).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xScale(points.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  // Y-axis ticks
  const yTicks = [0, Math.round(maxCumulative / 2), maxCumulative];

  // X-axis labels (every 7 days)
  const xLabels = points.filter((_, i) => i % 7 === 0 || i === points.length - 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Solve Velocity
          </span>
          <span className="text-xs text-gray-400">Last {days} days</span>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-lg font-extrabold text-blue-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{totalSolved}</p>
            <p className="text-[10px] text-gray-400">total solved</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-emerald-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{avgPerDay}</p>
            <p className="text-[10px] text-gray-400">avg/active day</p>
          </div>
        </div>
      </div>

      {totalSolved === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">
          <TrendingUp size={24} className="mx-auto mb-2 text-gray-200" />
          No problems solved yet. Start solving to see your velocity chart!
        </div>
      ) : (
        <div className="px-4 py-3 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map(t => (
              <g key={t}>
                <line
                  x1={PAD.left} y1={yScale(t)}
                  x2={PAD.left + chartW} y2={yScale(t)}
                  stroke="#f3f4f6" strokeWidth="1"
                />
                <text x={PAD.left - 4} y={yScale(t) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{t}</text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#areaGrad)" />

            {/* Line */}
            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots for days with solves */}
            {points.map((p, i) => p.daily > 0 && (
              <circle key={i} cx={xScale(i)} cy={yScale(p.cumulative)} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5">
                <title>{p.date}: +{p.daily} solved (total: {p.cumulative})</title>
              </circle>
            ))}

            {/* X-axis labels */}
            {xLabels.map((p, i) => {
              const idx = points.indexOf(p);
              const label = new Date(p.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <text key={i} x={xScale(idx)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{label}</text>
              );
            })}
          </svg>

          {/* Daily bar sparkline */}
          <div className="flex items-end gap-px mt-1 px-8" style={{ height: 20 }}>
            {dailyCounts.map((count, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: count > 0 ? `${Math.max(20, (count / Math.max(...dailyCounts, 1)) * 100)}%` : "2px",
                  background: count > 0 ? "#10b981" : "#f3f4f6",
                  opacity: count > 0 ? 1 : 0.5,
                }}
                title={`${points[i]?.date}: ${count} solved`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
