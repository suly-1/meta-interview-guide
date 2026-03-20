/**
 * TopicBossFight — Weekly boss challenge per topic.
 * Each topic has a "Boss" — 3 hard problems that must all be solved in one session.
 * Bosses reset every Monday. Defeating a boss marks the topic as "cleared this week" with a crown.
 */
import { useState, useMemo } from "react";
import { Crown, Swords, Shield, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Circle, Trophy, RefreshCw } from "lucide-react";

const BOSS_KEY = "meta-guide-boss-fights";

interface BossRecord {
  weekKey: string; // e.g. "2026-W12"
  cleared: Record<string, boolean>; // topicId → cleared
  solvedProblems: Record<string, string[]>; // topicId → solved problem names
}

function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  // ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(weekNo).padStart(2, "0")}`;
}

function loadBossRecord(): BossRecord {
  try {
    const raw = JSON.parse(localStorage.getItem(BOSS_KEY) ?? "null");
    const weekKey = getWeekKey();
    if (!raw || raw.weekKey !== weekKey) {
      // New week — reset
      return { weekKey, cleared: {}, solvedProblems: {} };
    }
    return raw;
  } catch {
    return { weekKey: getWeekKey(), cleared: {}, solvedProblems: {} };
  }
}

function saveBossRecord(r: BossRecord) {
  localStorage.setItem(BOSS_KEY, JSON.stringify(r));
}

interface BossTopic {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  bossName: string;
  bossDesc: string;
  problems: { name: string; url: string; difficulty: "Hard" }[];
  lore: string; // Flavour text
}

const BOSS_TOPICS: BossTopic[] = [
  {
    id: "arrays",
    name: "Arrays & Hashing",
    emoji: "⚔️",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    bossName: "The Hash Hydra",
    bossDesc: "A multi-headed beast that regenerates unless you strike all three weak points simultaneously.",
    lore: "Defeat the Hash Hydra by solving all 3 problems in a single session without closing the tab.",
    problems: [
      { name: "Longest Consecutive Sequence", url: "https://leetcode.com/problems/longest-consecutive-sequence/", difficulty: "Hard" },
      { name: "First Missing Positive",        url: "https://leetcode.com/problems/first-missing-positive/",        difficulty: "Hard" },
      { name: "Sliding Window Maximum",        url: "https://leetcode.com/problems/sliding-window-maximum/",        difficulty: "Hard" },
    ],
  },
  {
    id: "trees",
    name: "Trees (BFS/DFS)",
    emoji: "🌳",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    bossName: "The Ancient Treant",
    bossDesc: "An elder tree whose roots span the entire problem space. Only deep traversal can reveal its weakness.",
    lore: "Navigate the Ancient Treant's labyrinthine branches by solving all 3 hard tree problems.",
    problems: [
      { name: "Binary Tree Maximum Path Sum",  url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",  difficulty: "Hard" },
      { name: "Serialize and Deserialize Binary Tree", url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", difficulty: "Hard" },
      { name: "Recover Binary Search Tree",    url: "https://leetcode.com/problems/recover-binary-search-tree/",    difficulty: "Hard" },
    ],
  },
  {
    id: "graphs",
    name: "Graphs (BFS/DFS)",
    emoji: "🕸️",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    bossName: "The Labyrinth Weaver",
    bossDesc: "An entity that exists in all nodes simultaneously. You must traverse every path to find the exit.",
    lore: "Unravel the Labyrinth Weaver's web by solving all 3 hard graph problems.",
    problems: [
      { name: "Word Ladder II",                url: "https://leetcode.com/problems/word-ladder-ii/",                difficulty: "Hard" },
      { name: "Alien Dictionary",              url: "https://leetcode.com/problems/alien-dictionary/",              difficulty: "Hard" },
      { name: "Critical Connections in a Network", url: "https://leetcode.com/problems/critical-connections-in-a-network/", difficulty: "Hard" },
    ],
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    emoji: "🧠",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    bossName: "The Memoization Sphinx",
    bossDesc: "An ancient guardian that poses riddles with overlapping sub-problems. Brute force is futile.",
    lore: "Answer the Memoization Sphinx's three riddles using optimal substructure.",
    problems: [
      { name: "Edit Distance",                 url: "https://leetcode.com/problems/edit-distance/",                 difficulty: "Hard" },
      { name: "Burst Balloons",                url: "https://leetcode.com/problems/burst-balloons/",                difficulty: "Hard" },
      { name: "Regular Expression Matching",   url: "https://leetcode.com/problems/regular-expression-matching/",   difficulty: "Hard" },
    ],
  },
  {
    id: "backtracking",
    name: "Backtracking",
    emoji: "🌀",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    bossName: "The Recursion Demon",
    bossDesc: "A demon that multiplies with every wrong branch. Only perfect pruning can defeat it.",
    lore: "Prune the Recursion Demon's infinite branches by solving all 3 hard backtracking problems.",
    problems: [
      { name: "N-Queens",                      url: "https://leetcode.com/problems/n-queens/",                      difficulty: "Hard" },
      { name: "Sudoku Solver",                 url: "https://leetcode.com/problems/sudoku-solver/",                 difficulty: "Hard" },
      { name: "Word Search II",                url: "https://leetcode.com/problems/word-search-ii/",                difficulty: "Hard" },
    ],
  },
  {
    id: "heaps",
    name: "Heaps / Priority Queue",
    emoji: "⛰️",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    bossName: "The Priority Golem",
    bossDesc: "A stone giant that always attacks the highest-priority target. You must out-prioritise it.",
    lore: "Defeat the Priority Golem by solving all 3 hard heap problems.",
    problems: [
      { name: "Find Median from Data Stream",  url: "https://leetcode.com/problems/find-median-from-data-stream/",  difficulty: "Hard" },
      { name: "Merge k Sorted Lists",          url: "https://leetcode.com/problems/merge-k-sorted-lists/",          difficulty: "Hard" },
      { name: "Smallest Range Covering Elements from K Lists", url: "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/", difficulty: "Hard" },
    ],
  },
  {
    id: "sysdesign",
    name: "System Design",
    emoji: "🏰",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    bossName: "The Architect Titan",
    bossDesc: "A colossal builder whose systems span continents. Only a complete design can bring it down.",
    lore: "Defeat the Architect Titan by completing all 3 system design challenges in one session.",
    problems: [
      { name: "Design a Rate Limiter",         url: "https://www.hellointerview.com/learn/system-design/answer-keys/rate-limiter", difficulty: "Hard" },
      { name: "Design Instagram / Photo Feed", url: "https://www.hellointerview.com/learn/system-design/answer-keys/instagram",    difficulty: "Hard" },
      { name: "Design a Distributed Cache",    url: "https://www.hellointerview.com/learn/system-design/answer-keys/distributed-cache", difficulty: "Hard" },
    ],
  },
];

export default function TopicBossFight() {
  const [record, setRecord] = useState<BossRecord>(loadBossRecord);
  const [expanded, setExpanded] = useState<string | null>(null);

  const weekKey = getWeekKey();
  const clearedCount = Object.values(record.cleared).filter(Boolean).length;
  const allCleared = clearedCount === BOSS_TOPICS.length;

  function toggleProblem(topicId: string, problemName: string) {
    setRecord(prev => {
      const solved = prev.solvedProblems[topicId] ?? [];
      const newSolved = solved.includes(problemName)
        ? solved.filter(p => p !== problemName)
        : [...solved, problemName];
      const topic = BOSS_TOPICS.find(t => t.id === topicId)!;
      const cleared = newSolved.length >= topic.problems.length;
      const updated: BossRecord = {
        ...prev,
        solvedProblems: { ...prev.solvedProblems, [topicId]: newSolved },
        cleared: { ...prev.cleared, [topicId]: cleared },
      };
      saveBossRecord(updated);
      return updated;
    });
  }

  function resetTopic(topicId: string) {
    setRecord(prev => {
      const updated: BossRecord = {
        ...prev,
        solvedProblems: { ...prev.solvedProblems, [topicId]: [] },
        cleared: { ...prev.cleared, [topicId]: false },
      };
      saveBossRecord(updated);
      return updated;
    });
  }

  // Days until Monday reset
  const daysUntilReset = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon...
    return day === 1 ? 7 : (8 - day) % 7;
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Swords size={16} className="text-red-500" />
            Topic Boss Fight
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Defeat each boss by solving all 3 hard problems in one session. Resets every Monday.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <RefreshCw size={11} />
            Resets in {daysUntilReset}d
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Crown size={12} className="text-amber-500" />
            {clearedCount} / {BOSS_TOPICS.length} cleared
          </div>
          {allCleared && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-red-500 rounded-full text-xs font-bold text-white shadow-md animate-pulse">
              <Trophy size={12} />
              Boss Slayer!
            </div>
          )}
        </div>
      </div>

      {/* Boss grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BOSS_TOPICS.map(topic => {
          const solved = record.solvedProblems[topic.id] ?? [];
          const cleared = record.cleared[topic.id] ?? false;
          const isExpanded = expanded === topic.id;
          const progress = solved.length;
          const total = topic.problems.length;

          return (
            <div
              key={topic.id}
              className={`rounded-xl border-2 transition-all ${
                cleared
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                  : `${topic.borderColor} ${topic.bgColor} dark:bg-gray-800/50`
              }`}
            >
              {/* Boss card header */}
              <button
                className="w-full flex items-center justify-between p-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : topic.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{topic.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${cleared ? "text-amber-700" : topic.color} dark:text-white`}>
                        {topic.bossName}
                      </span>
                      {cleared && <Crown size={13} className="text-amber-500" />}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{topic.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress dots */}
                  <div className="flex gap-1">
                    {topic.problems.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${
                          i < progress
                            ? cleared ? "bg-amber-500" : "bg-emerald-500"
                            : "bg-gray-200 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </button>

              {/* Progress bar */}
              <div className="px-3 pb-2">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${cleared ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${(progress / total) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-gray-400">{progress}/{total} defeated</span>
                  {cleared && <span className="text-[11px] font-bold text-amber-600">👑 CLEARED!</span>}
                </div>
              </div>

              {/* Expanded problem list */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">{topic.lore}</p>
                  {topic.problems.map(prob => {
                    const isSolved = solved.includes(prob.name);
                    return (
                      <div key={prob.name} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProblem(topic.id, prob.name)}
                          className="flex-shrink-0"
                          title={isSolved ? "Mark unsolved" : "Mark solved"}
                        >
                          {isSolved
                            ? <CheckCircle2 size={16} className="text-emerald-500" />
                            : <Circle size={16} className="text-gray-300 hover:text-emerald-400 transition-colors" />
                          }
                        </button>
                        <a
                          href={prob.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 text-xs font-medium flex items-center gap-1 hover:underline ${
                            isSolved ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {prob.name}
                          <ExternalLink size={10} className="text-gray-400 flex-shrink-0" />
                        </a>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold flex-shrink-0">
                          Hard
                        </span>
                      </div>
                    );
                  })}
                  {/* Reset button */}
                  {progress > 0 && (
                    <button
                      onClick={() => resetTopic(topic.id)}
                      className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <RefreshCw size={10} /> Reset progress
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly summary */}
      {clearedCount > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Shield size={14} />
            Week {weekKey} — {clearedCount} boss{clearedCount !== 1 ? "es" : ""} defeated
            {allCleared && " 🎉 Full clear!"}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {BOSS_TOPICS.filter(t => record.cleared[t.id]).map(t => (
              <span key={t.id} className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full font-medium flex items-center gap-1">
                <Crown size={9} /> {t.bossName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
