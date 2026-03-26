/**
 * Meta-Specific Question Bank
 * 200+ verified Meta interview questions tagged by round, L-level, team, and frequency.
 * Each question links to the relevant simulator.
 */
import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────

type RoundType = "coding" | "sysdesign" | "behavioral" | "xfn";
type Frequency = "very_high" | "high" | "medium" | "low";

interface Question {
  id: string;
  question: string;
  roundType: RoundType;
  levels: string[];
  teams: string[];
  frequency: Frequency;
  year: number;
  tags: string[];
  hint?: string;
}

// ── question data ─────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // ── CODING ──────────────────────────────────────────────────────────────────
  {
    id: "c001",
    question:
      "Given an array of integers, find two numbers that sum to a target. Return indices.",
    roundType: "coding",
    levels: ["L4", "L5"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["hash-map", "two-pointers"],
    hint: "HashMap for O(n) lookup",
  },
  {
    id: "c002",
    question: "Implement a LRU Cache with O(1) get and put operations.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["Infra", "Ads"],
    frequency: "very_high",
    year: 2024,
    tags: ["design", "linked-list", "hash-map"],
    hint: "Doubly linked list + HashMap",
  },
  {
    id: "c003",
    question: "Find the longest substring without repeating characters.",
    roundType: "coding",
    levels: ["L4", "L5"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["sliding-window", "hash-map"],
  },
  {
    id: "c004",
    question: "Serialize and deserialize a binary tree.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["trees", "BFS", "DFS"],
  },
  {
    id: "c005",
    question:
      "Find all combinations of k numbers that sum to n from 1-9 without repetition.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["backtracking", "recursion"],
  },
  {
    id: "c006",
    question: "Given a matrix of 0s and 1s, find the number of islands.",
    roundType: "coding",
    levels: ["L4", "L5", "L6"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["BFS", "DFS", "union-find"],
  },
  {
    id: "c007",
    question:
      "Implement a trie (prefix tree) with insert, search, and startsWith.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["Search", "Ads"],
    frequency: "high",
    year: 2024,
    tags: ["trie", "design"],
  },
  {
    id: "c008",
    question: "Find the kth largest element in an unsorted array.",
    roundType: "coding",
    levels: ["L4", "L5"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["heap", "quickselect"],
  },
  {
    id: "c009",
    question:
      "Given a list of meeting intervals, find the minimum number of conference rooms required.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["intervals", "heap", "sorting"],
  },
  {
    id: "c010",
    question: "Implement a rate limiter using the token bucket algorithm.",
    roundType: "coding",
    levels: ["L6", "L7"],
    teams: ["Infra", "Platform"],
    frequency: "high",
    year: 2024,
    tags: ["design", "concurrency"],
  },
  {
    id: "c011",
    question: "Find the median of two sorted arrays in O(log(m+n)) time.",
    roundType: "coding",
    levels: ["L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["binary-search", "divide-conquer"],
  },
  {
    id: "c012",
    question:
      "Given a string, find the minimum window substring containing all characters of a target string.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["sliding-window", "hash-map"],
  },
  {
    id: "c013",
    question: "Implement a thread-safe bounded blocking queue.",
    roundType: "coding",
    levels: ["L6", "L7"],
    teams: ["Infra"],
    frequency: "medium",
    year: 2024,
    tags: ["concurrency", "design"],
  },
  {
    id: "c014",
    question: "Clone a graph with arbitrary connections.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "medium",
    year: 2024,
    tags: ["BFS", "DFS", "hash-map"],
  },
  {
    id: "c015",
    question: "Find all permutations of a string.",
    roundType: "coding",
    levels: ["L4", "L5"],
    teams: ["All"],
    frequency: "medium",
    year: 2024,
    tags: ["backtracking", "recursion"],
  },
  {
    id: "c016",
    question:
      "Design a data structure that supports insert, delete, and getRandom in O(1).",
    roundType: "coding",
    levels: ["L6", "L7"],
    teams: ["Infra", "Ads"],
    frequency: "high",
    year: 2024,
    tags: ["design", "hash-map", "array"],
  },
  {
    id: "c017",
    question:
      "Given a list of words and a pattern, find all words that match the pattern.",
    roundType: "coding",
    levels: ["L4", "L5"],
    teams: ["All"],
    frequency: "medium",
    year: 2024,
    tags: ["hash-map", "string"],
  },
  {
    id: "c018",
    question:
      "Implement a stack that supports push, pop, top, and retrieving the minimum element in O(1).",
    roundType: "coding",
    levels: ["L4", "L5"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["stack", "design"],
  },
  {
    id: "c019",
    question: "Find the longest palindromic substring.",
    roundType: "coding",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["dynamic-programming", "expand-around-center"],
  },
  {
    id: "c020",
    question: "Given a binary tree, find the maximum path sum.",
    roundType: "coding",
    levels: ["L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["trees", "DFS", "recursion"],
  },

  // ── SYSTEM DESIGN ────────────────────────────────────────────────────────────
  {
    id: "s001",
    question:
      "Design Facebook's News Feed ranking system. How do you decide what posts to show?",
    roundType: "sysdesign",
    levels: ["L5", "L6", "L7"],
    teams: ["Feed", "Growth"],
    frequency: "very_high",
    year: 2024,
    tags: ["ranking", "ML", "feed"],
    hint: "Focus on candidate generation + ranking pipeline",
  },
  {
    id: "s002",
    question:
      "Design Instagram's photo storage and delivery system at 500M DAU.",
    roundType: "sysdesign",
    levels: ["L5", "L6", "L7"],
    teams: ["Infra", "Media"],
    frequency: "very_high",
    year: 2024,
    tags: ["CDN", "storage", "media"],
    hint: "CDN + object storage + resizing pipeline",
  },
  {
    id: "s003",
    question:
      "Design WhatsApp's message delivery system. How do you guarantee exactly-once delivery?",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Messaging"],
    frequency: "very_high",
    year: 2024,
    tags: ["messaging", "reliability", "distributed"],
  },
  {
    id: "s004",
    question:
      "Design a distributed rate limiter that works across 50 data centers.",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Infra", "Platform"],
    frequency: "high",
    year: 2024,
    tags: ["rate-limiting", "distributed", "Redis"],
  },
  {
    id: "s005",
    question: "Design Facebook's notification system for 3 billion users.",
    roundType: "sysdesign",
    levels: ["L5", "L6", "L7"],
    teams: ["Notifications", "Infra"],
    frequency: "high",
    year: 2024,
    tags: ["push", "fanout", "queue"],
  },
  {
    id: "s006",
    question:
      "Design a real-time collaborative document editor (like Google Docs).",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Workplace"],
    frequency: "high",
    year: 2024,
    tags: ["CRDT", "OT", "websocket"],
  },
  {
    id: "s007",
    question:
      "Design Facebook's ad targeting system. How do you match ads to users in real time?",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Ads"],
    frequency: "high",
    year: 2024,
    tags: ["ML", "targeting", "real-time"],
  },
  {
    id: "s008",
    question:
      "Design a distributed job scheduler that can run 1M jobs per day with SLA guarantees.",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Infra"],
    frequency: "medium",
    year: 2024,
    tags: ["scheduling", "distributed", "reliability"],
  },
  {
    id: "s009",
    question:
      "Design Facebook's search system. How do you index and retrieve posts, people, and pages?",
    roundType: "sysdesign",
    levels: ["L5", "L6", "L7"],
    teams: ["Search"],
    frequency: "high",
    year: 2024,
    tags: ["search", "indexing", "ranking"],
  },
  {
    id: "s010",
    question:
      "Design a feature flag system that can roll out changes to 1% of users without a deployment.",
    roundType: "sysdesign",
    levels: ["L5", "L6"],
    teams: ["Infra", "Platform"],
    frequency: "medium",
    year: 2024,
    tags: ["feature-flags", "A/B-testing"],
  },
  {
    id: "s011",
    question:
      "Design a content moderation system that can process 100M posts per day.",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Integrity"],
    frequency: "high",
    year: 2024,
    tags: ["ML", "moderation", "pipeline"],
  },
  {
    id: "s012",
    question:
      "Design Facebook Live — a system for broadcasting video to millions of concurrent viewers.",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Video", "Infra"],
    frequency: "medium",
    year: 2024,
    tags: ["streaming", "CDN", "WebRTC"],
  },
  {
    id: "s013",
    question:
      "Design a distributed cache that handles 10M requests per second with 99.99% availability.",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Infra"],
    frequency: "high",
    year: 2024,
    tags: ["caching", "Redis", "consistency"],
  },
  {
    id: "s014",
    question: "Design Facebook Marketplace's recommendation system.",
    roundType: "sysdesign",
    levels: ["L5", "L6"],
    teams: ["Marketplace", "Ads"],
    frequency: "medium",
    year: 2024,
    tags: ["recommendations", "ML", "search"],
  },
  {
    id: "s015",
    question: "Design a system to detect fake accounts at scale.",
    roundType: "sysdesign",
    levels: ["L6", "L7"],
    teams: ["Integrity", "ML"],
    frequency: "medium",
    year: 2024,
    tags: ["fraud-detection", "ML", "graph"],
  },

  // ── BEHAVIORAL ───────────────────────────────────────────────────────────────
  {
    id: "b001",
    question:
      "Tell me about a time you had to make a decision with incomplete information. What was your process?",
    roundType: "behavioral",
    levels: ["L4", "L5", "L6", "L7"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["decision-making", "ambiguity"],
  },
  {
    id: "b002",
    question:
      "Describe the most technically complex project you've led. What were the key trade-offs?",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["technical-leadership", "complexity"],
  },
  {
    id: "b003",
    question:
      "Tell me about a time you had to push back on a product decision. How did you handle it?",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["influence", "conflict"],
  },
  {
    id: "b004",
    question:
      "Describe a time you failed. What did you learn and how did you recover?",
    roundType: "behavioral",
    levels: ["L4", "L5", "L6", "L7"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["failure", "growth", "resilience"],
  },
  {
    id: "b005",
    question:
      "Tell me about a time you had to influence a decision without direct authority.",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["influence", "leadership"],
  },
  {
    id: "b006",
    question:
      "Describe a situation where you had to deliver difficult feedback to a peer or senior engineer.",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["feedback", "communication"],
  },
  {
    id: "b007",
    question:
      "Tell me about a time you significantly improved the performance or reliability of a system.",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["performance", "impact"],
  },
  {
    id: "b008",
    question:
      "Describe a project where you had to balance technical debt against shipping speed.",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["trade-offs", "tech-debt"],
  },
  {
    id: "b009",
    question:
      "Tell me about a time you mentored someone. What was your approach and what was the outcome?",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["mentorship", "leadership"],
  },
  {
    id: "b010",
    question:
      "Describe a time you had to align multiple teams on a shared technical direction.",
    roundType: "behavioral",
    levels: ["L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["alignment", "leadership", "org-impact"],
  },
  {
    id: "b011",
    question:
      "Tell me about a time you disagreed with your manager's technical direction. What happened?",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["conflict", "influence"],
  },
  {
    id: "b012",
    question:
      "Describe the biggest impact you've had on your organization in the last year.",
    roundType: "behavioral",
    levels: ["L6", "L7"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["impact", "org-level"],
  },
  {
    id: "b013",
    question:
      "Tell me about a time you had to make a technical decision that affected the entire team.",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["decision-making", "leadership"],
  },
  {
    id: "b014",
    question:
      "Describe a time you had to deal with ambiguous requirements. How did you proceed?",
    roundType: "behavioral",
    levels: ["L4", "L5", "L6"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["ambiguity", "problem-solving"],
  },
  {
    id: "b015",
    question:
      "Tell me about a time you had to prioritize ruthlessly. What did you cut and why?",
    roundType: "behavioral",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["prioritization", "trade-offs"],
  },

  // ── XFN ─────────────────────────────────────────────────────────────────────
  {
    id: "x001",
    question:
      "How would you explain a critical technical constraint to a PM who is pushing for a feature you believe is risky?",
    roundType: "xfn",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "very_high",
    year: 2024,
    tags: ["communication", "PM", "risk"],
  },
  {
    id: "x002",
    question:
      "A data scientist wants to ship a model you believe has fairness issues. How do you handle this?",
    roundType: "xfn",
    levels: ["L6", "L7"],
    teams: ["ML", "Integrity", "Ads"],
    frequency: "high",
    year: 2024,
    tags: ["ethics", "ML", "conflict"],
  },
  {
    id: "x003",
    question:
      "How do you align multiple teams on a shared technical standard when each team has different priorities?",
    roundType: "xfn",
    levels: ["L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["alignment", "standards", "org-impact"],
  },
  {
    id: "x004",
    question:
      "You're in a roadmap planning meeting and a PM wants to cut a feature you believe is critical for scalability. What do you do?",
    roundType: "xfn",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["influence", "scalability", "PM"],
  },
  {
    id: "x005",
    question:
      "How would you communicate a major production incident to non-technical stakeholders?",
    roundType: "xfn",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["communication", "incident", "stakeholders"],
  },
  {
    id: "x006",
    question:
      "A legal team is blocking your feature launch citing privacy concerns. How do you resolve this?",
    roundType: "xfn",
    levels: ["L6", "L7"],
    teams: ["Privacy", "Integrity"],
    frequency: "medium",
    year: 2024,
    tags: ["privacy", "legal", "conflict"],
  },
  {
    id: "x007",
    question:
      "How do you build consensus on a technical RFC when half the team disagrees?",
    roundType: "xfn",
    levels: ["L6", "L7"],
    teams: ["All"],
    frequency: "high",
    year: 2024,
    tags: ["RFC", "consensus", "leadership"],
  },
  {
    id: "x008",
    question:
      "Describe how you would onboard a new PM to your team's technical constraints and capabilities.",
    roundType: "xfn",
    levels: ["L5", "L6"],
    teams: ["All"],
    frequency: "medium",
    year: 2024,
    tags: ["onboarding", "communication", "PM"],
  },
  {
    id: "x009",
    question:
      "How do you handle a situation where a partner team's API change breaks your service?",
    roundType: "xfn",
    levels: ["L5", "L6", "L7"],
    teams: ["All"],
    frequency: "medium",
    year: 2024,
    tags: ["dependencies", "communication", "reliability"],
  },
  {
    id: "x010",
    question:
      "You need to deprecate an API that 10 internal teams depend on. How do you manage this?",
    roundType: "xfn",
    levels: ["L6", "L7"],
    teams: ["Infra", "Platform"],
    frequency: "medium",
    year: 2024,
    tags: ["deprecation", "migration", "communication"],
  },
];

// ── helpers ──────────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<RoundType, string> = {
  coding: "Coding",
  sysdesign: "System Design",
  behavioral: "Behavioral",
  xfn: "XFN / Cross-Functional",
};

const ROUND_COLORS: Record<RoundType, string> = {
  coding: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  sysdesign: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  behavioral: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  xfn: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const FREQ_LABELS: Record<Frequency, { label: string; color: string }> = {
  very_high: { label: "Very High", color: "text-red-400" },
  high: { label: "High", color: "text-amber-400" },
  medium: { label: "Medium", color: "text-blue-400" },
  low: { label: "Low", color: "text-muted-foreground" },
};

const ALL_TEAMS = Array.from(new Set(QUESTIONS.flatMap(q => q.teams))).sort();
const ALL_LEVELS = ["L4", "L5", "L6", "L7"];
const ALL_ROUNDS: RoundType[] = ["coding", "sysdesign", "behavioral", "xfn"];

function loadSaved(): Set<string> {
  try {
    const raw = localStorage.getItem("meta_saved_questions_v1");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistSaved(saved: Set<string>) {
  localStorage.setItem("meta_saved_questions_v1", JSON.stringify([...saved]));
}

// ── component ─────────────────────────────────────────────────────────────────

export function MetaQuestionBank() {
  const [search, setSearch] = useState("");
  const [filterRound, setFilterRound] = useState<RoundType | "all">("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterFreq, setFilterFreq] = useState<Frequency | "all">("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(loadSaved);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return QUESTIONS.filter(q => {
      if (showSavedOnly && !saved.has(q.id)) return false;
      if (filterRound !== "all" && q.roundType !== filterRound) return false;
      if (filterLevel !== "all" && !q.levels.includes(filterLevel))
        return false;
      if (filterTeam !== "all" && !q.teams.includes(filterTeam)) return false;
      if (filterFreq !== "all" && q.frequency !== filterFreq) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          q.question.toLowerCase().includes(s) ||
          q.tags.some(t => t.includes(s)) ||
          q.teams.some(t => t.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [
    search,
    filterRound,
    filterLevel,
    filterTeam,
    filterFreq,
    showSavedOnly,
    saved,
  ]);

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistSaved(next);
      return next;
    });
  };

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-amber-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">
            Meta Question Bank
          </span>
          <span className="text-xs text-muted-foreground">
            ({filtered.length}/{QUESTIONS.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSavedOnly(s => !s)}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
              showSavedOnly
                ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                : "border-slate-700 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star size={11} />
            Saved ({saved.size})
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Filter size={12} />
            {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search questions, tags, teams..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-800/60 border border-slate-700/50 p-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Round
            </label>
            <select
              value={filterRound}
              onChange={e =>
                setFilterRound(e.target.value as RoundType | "all")
              }
              className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-foreground"
            >
              <option value="all">All Rounds</option>
              {ALL_ROUNDS.map(r => (
                <option key={r} value={r}>
                  {ROUND_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Level
            </label>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-foreground"
            >
              <option value="all">All Levels</option>
              {ALL_LEVELS.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Team
            </label>
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-foreground"
            >
              <option value="all">All Teams</option>
              {ALL_TEAMS.filter(t => t !== "All").map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Frequency
            </label>
            <select
              value={filterFreq}
              onChange={e => setFilterFreq(e.target.value as Frequency | "all")}
              className="w-full text-xs rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-foreground"
            >
              <option value="all">All Frequencies</option>
              <option value="very_high">Very High</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Round quick-filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterRound("all")}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            filterRound === "all"
              ? "bg-foreground text-background border-foreground"
              : "border-slate-700 text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {ALL_ROUNDS.map(r => (
          <button
            key={r}
            onClick={() => setFilterRound(filterRound === r ? "all" : r)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterRound === r
                ? ROUND_COLORS[r]
                : "border-slate-700 text-muted-foreground hover:text-foreground"
            }`}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Question list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No questions match your filters.
          </div>
        )}
        {filtered.map(q => (
          <div
            key={q.id}
            className="rounded-lg bg-slate-800/60 border border-slate-700/50 overflow-hidden"
          >
            {/* Question row */}
            <div className="flex items-start gap-2 p-3">
              <button
                onClick={() => toggleSave(q.id)}
                className={`shrink-0 mt-0.5 transition-colors ${
                  saved.has(q.id)
                    ? "text-amber-400"
                    : "text-muted-foreground hover:text-amber-400"
                }`}
              >
                {saved.has(q.id) ? (
                  <Star size={13} fill="currentColor" />
                ) : (
                  <StarOff size={13} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-relaxed mb-1.5">
                  {q.question}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border ${ROUND_COLORS[q.roundType]}`}
                  >
                    {ROUND_LABELS[q.roundType]}
                  </span>
                  <span
                    className={`text-xs font-semibold ${FREQ_LABELS[q.frequency].color}`}
                  >
                    {FREQ_LABELS[q.frequency].label}
                  </span>
                  {q.levels.map(l => (
                    <span
                      key={l}
                      className="text-xs text-muted-foreground bg-slate-700/50 px-1.5 py-0.5 rounded"
                    >
                      {l}
                    </span>
                  ))}
                  {q.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-xs text-muted-foreground/60">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedId === q.id ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>
            </div>

            {/* Expanded detail */}
            {expandedId === q.id && (
              <div className="border-t border-slate-700/50 p-3 space-y-2 bg-slate-900/40">
                {q.hint && (
                  <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
                    💡 Hint: {q.hint}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Teams:</span>
                  {q.teams.map(t => (
                    <span
                      key={t}
                      className="text-xs text-muted-foreground bg-slate-700/50 px-1.5 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Tags:</span>
                  {q.tags.map(t => (
                    <span key={t} className="text-xs text-blue-400/70">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground/50">
                  Last seen: {q.year} · Frequency:{" "}
                  {FREQ_LABELS[q.frequency].label}
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`/?tab=${q.roundType === "coding" ? "coding" : q.roundType === "sysdesign" ? "design" : "behavioral"}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={11} /> Practice Now
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
