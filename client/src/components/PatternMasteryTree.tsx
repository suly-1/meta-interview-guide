/**
 * PatternMasteryTree — Visual skill tree showing pattern unlock progression.
 * A pattern "unlocks" when it has ≥3 drill ratings of 4+/5.
 * Locked nodes are greyed; unlocked nodes glow in their tier colour.
 * Completing all 14 patterns awards the "Pattern Master" badge.
 */
import { useMemo, useState } from "react";
import { Trophy, Lock, Star, Zap, Info } from "lucide-react";

const DRILL_KEY = "meta-guide-drill-ratings";

function loadRatings(): Record<string, { rating: number; ts: number }[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}

/** Returns true if the pattern has ≥3 ratings of 4 or 5 */
function isUnlocked(patternId: string, data: Record<string, { rating: number; ts: number }[]>): boolean {
  const entries = data[patternId] ?? [];
  const highRatings = entries.filter(e => e.rating >= 4).length;
  return highRatings >= 3;
}

/** Returns progress toward unlock: how many 4+/5 ratings out of 3 needed */
function unlockProgress(patternId: string, data: Record<string, { rating: number; ts: number }[]>): number {
  const entries = data[patternId] ?? [];
  return Math.min(3, entries.filter(e => e.rating >= 4).length);
}

interface TreeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tier: number; // 0=foundation, 1=core, 2=advanced, 3=expert
  description: string;
  // IDs of prerequisite nodes that must be unlocked first
  prereqs: string[];
}

interface TreeEdge {
  from: string;
  to: string;
}

// Map PatternDependencyGraph node IDs to guideData PATTERN IDs
const ID_MAP: Record<string, string> = {
  arrays:    "arrays-hashing",
  twoptr:    "two-pointers",
  prefix:    "prefix-sum",
  sliding:   "sliding-window",
  stack:     "monotonic-stack",
  binary:    "binary-search",
  linked:    "linked-lists",
  trees:     "trees-bfs-dfs",
  heaps:     "heaps",
  intervals: "intervals",
  tries:     "tries",
  graphs:    "graphs",
  backtrack: "backtracking",
  dp:        "dynamic-programming",
  unionfind: "union-find",
};

const NODES: TreeNode[] = [
  // Tier 0 — Foundation
  { id: "arrays",    label: "Arrays &\nHashing",    x: 200, y: 60,  tier: 0, prereqs: [],                          description: "The bedrock of all patterns. Hash maps, sets, and array manipulation." },
  { id: "twoptr",    label: "Two\nPointers",        x: 480, y: 60,  tier: 0, prereqs: [],                          description: "Sorted-array traversal. Foundation for Sliding Window and Linked Lists." },
  { id: "prefix",    label: "Prefix\nSums",         x: 760, y: 60,  tier: 0, prereqs: [],                          description: "Preprocessing technique for range queries and DP optimisations." },
  // Tier 1 — Core
  { id: "sliding",   label: "Sliding\nWindow",      x: 120, y: 200, tier: 1, prereqs: ["arrays", "twoptr"],        description: "Dynamic window extending Two Pointers." },
  { id: "stack",     label: "Monotonic\nStack",     x: 340, y: 200, tier: 1, prereqs: ["arrays"],                  description: "Next greater/smaller element. Prerequisite for some Tree and DP problems." },
  { id: "binary",    label: "Binary\nSearch",       x: 560, y: 200, tier: 1, prereqs: ["arrays"],                  description: "Search on sorted arrays and answer spaces." },
  { id: "linked",    label: "Linked\nLists",        x: 760, y: 200, tier: 1, prereqs: ["twoptr"],                  description: "Fast/slow pointer technique. Foundation for Trees." },
  // Tier 2 — Advanced
  { id: "trees",     label: "Trees\n(BFS/DFS)",     x: 120, y: 340, tier: 2, prereqs: ["stack", "linked"],         description: "Highest-frequency Meta pattern. Requires recursion and node structure." },
  { id: "heaps",     label: "Heaps /\nPriority Q",  x: 340, y: 340, tier: 2, prereqs: ["arrays"],                  description: "Top-K problems, median finding, scheduling." },
  { id: "intervals", label: "Intervals",            x: 560, y: 340, tier: 2, prereqs: ["heaps"],                   description: "Sorting + range overlap. Combined with Heaps for scheduling." },
  { id: "tries",     label: "Tries",                x: 760, y: 340, tier: 2, prereqs: ["trees"],                   description: "Prefix matching and word search. Requires tree node structure." },
  // Tier 3 — Expert
  { id: "graphs",    label: "Graphs\n(BFS/DFS)",    x: 120, y: 480, tier: 3, prereqs: ["trees", "unionfind"],      description: "Shortest path, topological sort, connected components." },
  { id: "backtrack", label: "Backtracking",         x: 340, y: 480, tier: 3, prereqs: ["trees"],                   description: "Permutations, combinations, constraint satisfaction." },
  { id: "dp",        label: "Dynamic\nProgramming", x: 560, y: 480, tier: 3, prereqs: ["prefix", "binary", "intervals"], description: "Memoisation and optimal substructure. Deepest pattern." },
  { id: "unionfind", label: "Union\nFind",          x: 760, y: 480, tier: 3, prereqs: ["arrays"],                  description: "Connected components, cycle detection, Kruskal's MST." },
];

const EDGES: TreeEdge[] = [
  { from: "arrays",    to: "sliding"   },
  { from: "arrays",    to: "stack"     },
  { from: "arrays",    to: "binary"    },
  { from: "arrays",    to: "heaps"     },
  { from: "arrays",    to: "unionfind" },
  { from: "twoptr",    to: "sliding"   },
  { from: "twoptr",    to: "linked"    },
  { from: "prefix",    to: "dp"        },
  { from: "stack",     to: "trees"     },
  { from: "binary",    to: "dp"        },
  { from: "linked",    to: "trees"     },
  { from: "trees",     to: "graphs"    },
  { from: "trees",     to: "backtrack" },
  { from: "trees",     to: "tries"     },
  { from: "heaps",     to: "intervals" },
  { from: "intervals", to: "dp"        },
  { from: "unionfind", to: "graphs"    },
];

const TIER_COLORS = [
  { fill: "#3b82f6", glow: "#93c5fd", text: "#1e40af", label: "Foundation" },
  { fill: "#8b5cf6", glow: "#c4b5fd", text: "#5b21b6", label: "Core" },
  { fill: "#f59e0b", glow: "#fcd34d", text: "#92400e", label: "Advanced" },
  { fill: "#ef4444", glow: "#fca5a5", text: "#991b1b", label: "Expert" },
];

const SVG_W = 960;
const SVG_H = 580;
const NODE_R = 38;

export default function PatternMasteryTree() {
  const [tooltip, setTooltip] = useState<{ node: TreeNode; progress: number; unlocked: boolean } | null>(null);

  const { unlockMap, progressMap, allUnlocked } = useMemo(() => {
    const data = loadRatings();
    const unlockMap: Record<string, boolean> = {};
    const progressMap: Record<string, number> = {};
    for (const n of NODES) {
      const drillId = ID_MAP[n.id] ?? n.id;
      unlockMap[n.id] = isUnlocked(drillId, data);
      progressMap[n.id] = unlockProgress(drillId, data);
    }
    const allUnlocked = NODES.every(n => unlockMap[n.id]);
    return { unlockMap, progressMap, allUnlocked };
  }, []);

  const unlockedCount = NODES.filter(n => unlockMap[n.id]).length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            Pattern Mastery Tree
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Earn 3× rating of 4+/5 in Quick Drill to unlock a node. Hover for details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Star size={12} className="text-amber-500" />
            {unlockedCount} / {NODES.length} unlocked
          </div>
          {/* Pattern Master badge */}
          {allUnlocked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-xs font-bold text-white shadow-md animate-pulse">
              <Trophy size={12} />
              Pattern Master!
            </div>
          )}
        </div>
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {TIER_COLORS.map((tc, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: tc.fill }} />
            Tier {i}: {tc.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <Lock size={10} className="text-gray-400" />
          Locked (grey)
        </div>
      </div>

      {/* SVG Tree */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-w-full"
          style={{ minWidth: 480, height: "auto" }}
        >
          <defs>
            {NODES.map(n => {
              const tc = TIER_COLORS[n.tier];
              return (
                <filter key={`glow-${n.id}`} id={`glow-${n.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                  <feFlood floodColor={tc.glow} floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="shadow" />
                  <feMerge>
                    <feMergeNode in="shadow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              );
            })}
          </defs>

          {/* Edges */}
          {EDGES.map((e, i) => {
            const from = NODES.find(n => n.id === e.from)!;
            const to = NODES.find(n => n.id === e.to)!;
            const bothUnlocked = unlockMap[e.from] && unlockMap[e.to];
            return (
              <line
                key={i}
                x1={from.x} y1={from.y + NODE_R}
                x2={to.x}   y2={to.y - NODE_R}
                stroke={bothUnlocked ? "#6366f1" : "#d1d5db"}
                strokeWidth={bothUnlocked ? 2.5 : 1.5}
                strokeDasharray={bothUnlocked ? "none" : "6 4"}
                opacity={bothUnlocked ? 0.8 : 0.4}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(n => {
            const tc = TIER_COLORS[n.tier];
            const unlocked = unlockMap[n.id];
            const prog = progressMap[n.id];
            const lines = n.label.split("\n");

            // Progress arc (out of 3)
            const arcR = NODE_R - 5;
            const arcFrac = prog / 3;
            const arcLen = 2 * Math.PI * arcR * arcFrac;
            const arcTotal = 2 * Math.PI * arcR;

            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setTooltip({ node: n, progress: prog, unlocked })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Glow circle for unlocked */}
                {unlocked && (
                  <circle
                    r={NODE_R + 6}
                    fill={tc.glow}
                    opacity={0.35}
                    className="animate-pulse"
                  />
                )}

                {/* Main circle */}
                <circle
                  r={NODE_R}
                  fill={unlocked ? tc.fill : "#e5e7eb"}
                  stroke={unlocked ? tc.glow : "#9ca3af"}
                  strokeWidth={unlocked ? 2.5 : 1.5}
                />

                {/* Progress arc ring */}
                {!unlocked && prog > 0 && (
                  <circle
                    r={arcR}
                    fill="none"
                    stroke={tc.fill}
                    strokeWidth={4}
                    strokeDasharray={`${arcLen} ${arcTotal - arcLen}`}
                    strokeDashoffset={arcTotal / 4}
                    strokeLinecap="round"
                    opacity={0.7}
                  />
                )}

                {/* Lock icon for locked nodes */}
                {!unlocked && (
                  <text x={0} y={-NODE_R + 14} textAnchor="middle" fontSize={11} fill="#9ca3af">🔒</text>
                )}

                {/* Label */}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={0}
                    y={li * 14 - (lines.length - 1) * 7 + (unlocked ? 0 : 4)}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight="700"
                    fill={unlocked ? "#ffffff" : "#6b7280"}
                  >
                    {line}
                  </text>
                ))}

                {/* Progress dots for locked nodes */}
                {!unlocked && (
                  <g transform={`translate(0, ${NODE_R - 12})`}>
                    {[0, 1, 2].map(i => (
                      <circle
                        key={i}
                        cx={(i - 1) * 10}
                        cy={0}
                        r={3.5}
                        fill={i < prog ? tc.fill : "#d1d5db"}
                      />
                    ))}
                  </g>
                )}

                {/* Checkmark for fully unlocked */}
                {unlocked && (
                  <text x={NODE_R - 10} y={-NODE_R + 12} textAnchor="middle" fontSize={13} fill="#ffffff">✓</text>
                )}
              </g>
            );
          })}

          {/* Tier labels on left */}
          {[0, 1, 2, 3].map(tier => {
            const ys = [60, 200, 340, 480];
            const labels = ["Tier 0\nFoundation", "Tier 1\nCore", "Tier 2\nAdvanced", "Tier 3\nExpert"];
            return (
              <text key={tier} x={28} y={ys[tier]} textAnchor="middle" fontSize={9} fill="#9ca3af" fontWeight="600">
                {labels[tier].split("\n").map((l, i) => (
                  <tspan key={i} x={28} dy={i === 0 ? 0 : 12}>{l}</tspan>
                ))}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 text-sm">
          <div className="flex items-center gap-2 mb-1">
            {tooltip.unlocked
              ? <span className="text-emerald-500 font-bold text-base">✓</span>
              : <Lock size={13} className="text-gray-400" />}
            <span className="font-bold text-gray-900 dark:text-white">
              {tooltip.node.label.replace("\n", " ")}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              tooltip.unlocked
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}>
              {tooltip.unlocked ? "Unlocked" : `${tooltip.progress}/3 ratings ≥4`}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs">{tooltip.node.description}</p>
          {!tooltip.unlocked && tooltip.node.prereqs.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Info size={10} />
              Prerequisites: {tooltip.node.prereqs.map(p => NODES.find(n => n.id === p)?.label.replace("\n", " ")).join(", ")}
            </p>
          )}
          {!tooltip.unlocked && (
            <p className="text-xs text-blue-500 mt-1">
              → Rate this pattern 4 or 5 in Quick Drill {3 - tooltip.progress} more time{3 - tooltip.progress !== 1 ? "s" : ""} to unlock.
            </p>
          )}
        </div>
      )}

      {/* Pattern Master progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Overall mastery progress</span>
          <span>{Math.round((unlockedCount / NODES.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(unlockedCount / NODES.length) * 100}%`,
              background: allUnlocked
                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                : "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            }}
          />
        </div>
        {allUnlocked && (
          <p className="text-center text-xs font-bold text-amber-600 mt-1.5 flex items-center justify-center gap-1">
            <Trophy size={12} /> Congratulations — you are a Pattern Master!
          </p>
        )}
      </div>
    </div>
  );
}
