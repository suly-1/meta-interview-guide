/**
 * PatternDependencyGraph — SVG-based interactive dependency graph
 * Shows which patterns are prerequisites for others, helping candidates
 * understand the optimal learning order and identify foundational gaps.
 */
import { useState, useCallback } from "react";
import { Info } from "lucide-react";

interface PatternNode {
  id: string;
  label: string;
  x: number;
  y: number;
  tier: number; // 0=foundation, 1=core, 2=advanced, 3=expert
  description: string;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

const NODES: PatternNode[] = [
  // Tier 0 — Foundation (must learn first)
  { id: "arrays",    label: "Arrays &\nHashing",    x: 200, y: 60,  tier: 0, description: "The bedrock of all coding patterns. Hash maps, sets, and array manipulation are used in virtually every other pattern." },
  { id: "twoptr",    label: "Two\nPointers",        x: 480, y: 60,  tier: 0, description: "Requires understanding of sorted arrays and basic array traversal. Foundation for Sliding Window and Linked Lists." },
  { id: "prefix",    label: "Prefix\nSums",         x: 760, y: 60,  tier: 0, description: "Simple but powerful preprocessing technique. Required for many range-query problems and some DP optimizations." },

  // Tier 1 — Core (build on foundation)
  { id: "sliding",   label: "Sliding\nWindow",      x: 120, y: 200, tier: 1, description: "Extends Two Pointers with a dynamic window. Requires Two Pointers and Arrays/Hashing fundamentals." },
  { id: "stack",     label: "Monotonic\nStack",     x: 340, y: 200, tier: 1, description: "Requires Arrays/Hashing. Used for next greater/smaller element problems. Prerequisite for some Tree and DP problems." },
  { id: "binary",    label: "Binary\nSearch",       x: 560, y: 200, tier: 1, description: "Requires sorted arrays (Arrays/Hashing). Extends to search on answer space and rotated arrays." },
  { id: "linked",    label: "Linked\nLists",        x: 760, y: 200, tier: 1, description: "Requires Two Pointers (fast/slow pointer technique). Foundation for understanding Trees and Graphs." },

  // Tier 2 — Advanced (build on core)
  { id: "trees",     label: "Trees\n(BFS/DFS)",     x: 120, y: 340, tier: 2, description: "Requires Linked Lists (node structure) and Recursion (DFS). One of the highest-frequency Meta patterns." },
  { id: "heaps",     label: "Heaps /\nPriority Q",  x: 340, y: 340, tier: 2, description: "Requires Arrays/Hashing. Used for top-K problems, median finding, and scheduling. Often combined with BFS." },
  { id: "intervals", label: "Intervals",            x: 560, y: 340, tier: 2, description: "Requires sorting (Arrays/Hashing) and understanding of ranges. Often combined with Heaps for scheduling." },
  { id: "tries",     label: "Tries",                x: 760, y: 340, tier: 2, description: "Requires Trees (node structure) and Hashing. Used for prefix matching and word search problems." },

  // Tier 3 — Expert (build on advanced)
  { id: "graphs",    label: "Graphs\n(BFS/DFS)",    x: 120, y: 480, tier: 3, description: "Requires Trees (traversal concepts) and Union-Find. The most complex pattern — covers shortest path, topological sort, connected components." },
  { id: "backtrack", label: "Backtracking",         x: 340, y: 480, tier: 3, description: "Requires Trees (DFS) and Recursion. Used for permutations, combinations, and constraint satisfaction problems." },
  { id: "dp",        label: "Dynamic\nProgramming", x: 560, y: 480, tier: 3, description: "Requires Prefix Sums, Recursion, and often Binary Search. The deepest pattern — builds on memoization and optimal substructure." },
  { id: "unionfind", label: "Union\nFind",          x: 760, y: 480, tier: 3, description: "Requires Arrays/Hashing (parent array). Used for connected components, cycle detection, and Kruskal's MST." },
];

const EDGES: Edge[] = [
  // Arrays/Hashing → many
  { from: "arrays",    to: "sliding"   },
  { from: "arrays",    to: "stack"     },
  { from: "arrays",    to: "binary"    },
  { from: "arrays",    to: "heaps"     },
  { from: "arrays",    to: "unionfind" },
  // Two Pointers → Sliding Window, Linked Lists
  { from: "twoptr",    to: "sliding"   },
  { from: "twoptr",    to: "linked"    },
  // Prefix Sums → DP
  { from: "prefix",    to: "dp"        },
  // Sliding Window → (no further deps shown)
  // Stack → Trees (some DFS patterns)
  { from: "stack",     to: "trees"     },
  // Binary Search → DP (binary search optimization)
  { from: "binary",    to: "dp"        },
  // Linked Lists → Trees
  { from: "linked",    to: "trees"     },
  // Trees → Graphs, Backtracking, Tries
  { from: "trees",     to: "graphs"    },
  { from: "trees",     to: "backtrack" },
  { from: "trees",     to: "tries"     },
  // Heaps → Intervals (heap-based scheduling)
  { from: "heaps",     to: "intervals" },
  // Intervals → DP (interval DP)
  { from: "intervals", to: "dp"        },
  // Graphs → (terminal for this graph)
  // Union-Find → Graphs
  { from: "unionfind", to: "graphs"    },
];

const TIER_COLORS = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", label: "Foundation" },
  { bg: "#d1fae5", border: "#10b981", text: "#065f46", label: "Core" },
  { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", label: "Advanced" },
  { bg: "#fce7f3", border: "#ec4899", text: "#9d174d", label: "Expert" },
];

const NODE_W = 88;
const NODE_H = 52;
const VIEWBOX_W = 920;
const VIEWBOX_H = 580;

function getNodeCenter(node: PatternNode) {
  return { cx: node.x + NODE_W / 2, cy: node.y + NODE_H / 2 };
}

export default function PatternDependencyGraph() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const activeId = selected ?? hovered;
  const activeNode = NODES.find(n => n.id === activeId);

  // Determine which edges involve the active node
  const activeEdges = activeId
    ? EDGES.filter(e => e.from === activeId || e.to === activeId)
    : [];
  const activeNeighbors = new Set(activeEdges.flatMap(e => [e.from, e.to]));

  const handleNodeClick = useCallback((id: string) => {
    setSelected(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Pattern Dependency Graph
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Click any pattern to see its prerequisites and dependents. Learn patterns in tier order to avoid gaps.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {TIER_COLORS.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border" style={{ background: t.bg, borderColor: t.border }} />
            <span className="text-[11px] text-gray-500 font-medium">Tier {i}: {t.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Graph */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="w-full"
          style={{ maxHeight: 560 }}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Tier labels */}
          {[0, 1, 2, 3].map(tier => (
            <text
              key={tier}
              x={16}
              y={tier === 0 ? 88 : tier === 1 ? 228 : tier === 2 ? 368 : 508}
              fontSize={10}
              fill="#94a3b8"
              fontWeight="600"
              fontFamily="'Space Grotesk', sans-serif"
            >
              T{tier}
            </text>
          ))}

          {/* Horizontal tier dividers */}
          {[140, 280, 420].map(y => (
            <line key={y} x1={36} y1={y} x2={VIEWBOX_W - 20} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
          ))}

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const from = NODES.find(n => n.id === edge.from)!;
            const to   = NODES.find(n => n.id === edge.to)!;
            const fc   = getNodeCenter(from);
            const tc   = getNodeCenter(to);

            // Offset endpoint to edge of node box
            const dx = tc.cx - fc.cx;
            const dy = tc.cy - fc.cy;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len;
            const uy = dy / len;

            const x1 = fc.cx + ux * (NODE_W / 2 + 2);
            const y1 = fc.cy + uy * (NODE_H / 2 + 2);
            const x2 = tc.cx - ux * (NODE_W / 2 + 10);
            const y2 = tc.cy - uy * (NODE_H / 2 + 10);

            const isActive = activeId && (edge.from === activeId || edge.to === activeId);
            const isPrereq = activeId && edge.to === activeId;

            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? (isPrereq ? "#f59e0b" : "#3b82f6") : "#cbd5e1"}
                strokeWidth={isActive ? 2 : 1}
                strokeOpacity={activeId && !isActive ? 0.2 : 1}
                markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
                style={{ transition: "all 0.2s" }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const color = TIER_COLORS[node.tier];
            const isActive = node.id === activeId;
            const isNeighbor = activeNeighbors.has(node.id) && node.id !== activeId;
            const isDimmed = activeId && !isActive && !isNeighbor;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer", opacity: isDimmed ? 0.25 : 1, transition: "opacity 0.2s" }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={isActive ? color.border : color.bg}
                  stroke={color.border}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ filter: isActive ? "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" : "none", transition: "all 0.2s" }}
                />
                {node.label.split("\n").map((line, li) => (
                  <text
                    key={li}
                    x={NODE_W / 2}
                    y={li === 0 ? (node.label.includes("\n") ? 18 : 30) : 34}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight="700"
                    fontFamily="'Space Grotesk', sans-serif"
                    fill={isActive ? "#fff" : color.text}
                    style={{ transition: "fill 0.2s" }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info panel */}
      {activeNode ? (
        <div
          className="p-4 rounded-xl border transition-all"
          style={{
            background: TIER_COLORS[activeNode.tier].bg,
            borderColor: TIER_COLORS[activeNode.tier].border,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold text-white"
              style={{ background: TIER_COLORS[activeNode.tier].border, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              T{activeNode.tier}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: TIER_COLORS[activeNode.tier].text, fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeNode.label.replace("\n", " ")}
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{activeNode.description}</p>

              {/* Prerequisites */}
              {activeEdges.filter(e => e.to === activeNode.id).length > 0 && (
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-amber-700">Prerequisites: </span>
                  {activeEdges.filter(e => e.to === activeNode.id).map(e => {
                    const prereq = NODES.find(n => n.id === e.from)!;
                    return (
                      <button
                        key={e.from}
                        onClick={() => handleNodeClick(e.from)}
                        className="text-[11px] font-semibold text-amber-700 hover:underline mr-2"
                      >
                        {prereq.label.replace("\n", " ")}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Unlocks */}
              {activeEdges.filter(e => e.from === activeNode.id).length > 0 && (
                <div className="mt-1">
                  <span className="text-[11px] font-bold text-blue-700">Unlocks: </span>
                  {activeEdges.filter(e => e.from === activeNode.id).map(e => {
                    const next = NODES.find(n => n.id === e.to)!;
                    return (
                      <button
                        key={e.to}
                        onClick={() => handleNodeClick(e.to)}
                        className="text-[11px] font-semibold text-blue-700 hover:underline mr-2"
                      >
                        {next.label.replace("\n", " ")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
          <Info size={13} className="text-gray-400 flex-shrink-0" />
          Click any pattern node to see its prerequisites, what it unlocks, and why it matters in the learning sequence.
        </div>
      )}
    </div>
  );
}
