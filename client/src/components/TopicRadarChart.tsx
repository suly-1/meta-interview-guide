/**
 * TopicRadarChart — Feature 9
 * Spider/radar chart with one axis per CTCI topic showing solve percentage.
 * Pure SVG — no external chart library.
 */
import { useMemo } from "react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";

const CTCI_KEY = "ctci_progress_v1";

function loadProgress(): Record<number, { solved: boolean }> {
  try { return JSON.parse(localStorage.getItem(CTCI_KEY) ?? "{}"); } catch { return {}; }
}

const TOPICS = [
  { key: "Array",                label: "Arrays" },
  { key: "Dynamic Programming",  label: "DP" },
  { key: "Tree",                 label: "Trees" },
  { key: "Graph",                label: "Graphs" },
  { key: "String",               label: "Strings" },
  { key: "Hash Table",           label: "Hash Table" },
  { key: "Linked List",          label: "Linked List" },
  { key: "Backtracking",         label: "Backtracking" },
  { key: "Binary Search",        label: "Binary Search" },
  { key: "Heap (Priority Queue)", label: "Heaps" },
  { key: "Sliding Window",       label: "Sliding Window" },
  { key: "Stack",                label: "Stack" },
];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

export default function TopicRadarChart() {
  const data = useMemo(() => {
    const progress = loadProgress();
    return TOPICS.map(t => {
      const total = CTCI_PROBLEMS.filter(p => p.topic.includes(t.key)).length;
      const solved = CTCI_PROBLEMS.filter(p => p.topic.includes(t.key) && progress[p.id]?.solved).length;
      return { ...t, total, solved, pct: total > 0 ? solved / total : 0 };
    });
  }, []);

  const n = data.length;
  const CX = 130, CY = 130, R = 100;
  const angles = data.map((_, i) => (2 * Math.PI * i) / n);

  // Concentric rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Data polygon
  const dataPoints = data.map((d, i) => polarToXY(angles[i], d.pct * R, CX, CY));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Topic Mastery Radar</p>
        <p className="text-xs text-gray-600 mt-0.5">CTCI solve % per topic — larger polygon = stronger coverage</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
        <svg viewBox="0 0 260 260" className="w-full max-w-[260px] flex-shrink-0">
          {/* Concentric rings */}
          {rings.map(r => {
            const pts = angles.map(a => polarToXY(a, r * R, CX, CY));
            const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
            return (
              <g key={r}>
                <path d={path} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                <text x={CX + 3} y={CY - r * R + 3} fontSize="8" fill="#d1d5db">{Math.round(r * 100)}%</text>
              </g>
            );
          })}

          {/* Spokes */}
          {angles.map((a, i) => {
            const outer = polarToXY(a, R, CX, CY);
            return <line key={i} x1={CX} y1={CY} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="#e5e7eb" strokeWidth="1" />;
          })}

          {/* Data fill */}
          <path d={dataPath} fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

          {/* Data dots */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5">
              <title>{data[i].label}: {data[i].solved}/{data[i].total} ({Math.round(data[i].pct * 100)}%)</title>
            </circle>
          ))}

          {/* Labels */}
          {data.map((d, i) => {
            const labelR = R + 18;
            const pos = polarToXY(angles[i], labelR, CX, CY);
            const anchor = pos.x < CX - 5 ? "end" : pos.x > CX + 5 ? "start" : "middle";
            return (
              <text key={i} x={pos.x.toFixed(1)} y={pos.y.toFixed(1)} textAnchor={anchor} fontSize="9" fill="#374151" fontWeight="600">
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Legend table */}
        <div className="flex-1 w-full">
          <div className="space-y-1.5">
            {data.map(d => (
              <div key={d.key} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-600 w-24 flex-shrink-0">{d.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${d.pct * 100}%`, background: d.pct >= 0.7 ? "#10b981" : d.pct >= 0.4 ? "#3b82f6" : "#f59e0b" }}
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-700 w-12 text-right">{d.solved}/{d.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
