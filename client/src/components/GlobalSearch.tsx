/**
 * GlobalSearch — search across all guide content (patterns, behavioral questions, SD topics, CTCI problems)
 * Opens with Ctrl+K / Cmd+K
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Code2, MessageSquare, Layers, ListChecks, Cpu, Calendar, BarChart2, Terminal } from "lucide-react";
import { PATTERNS, BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";

interface SearchResult {
  id: string;
  tabId: string;
  tabLabel: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  icon: React.ReactNode;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  coding:     <Code2 size={13} />,
  behavioral: <MessageSquare size={13} />,
  sysdesign:  <Layers size={13} />,
  ctci:       <ListChecks size={13} />,
  "ai-round": <Cpu size={13} />,
  timeline:   <Calendar size={13} />,
  readiness:  <BarChart2 size={13} />,
  practice:   <Terminal size={13} />,
};

const TAB_COLORS: Record<string, string> = {
  coding:     "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  behavioral: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  sysdesign:  "text-slate-500 bg-slate-50 dark:bg-slate-900/20",
  ctci:       "text-violet-500 bg-violet-50 dark:bg-violet-900/20",
  "ai-round": "text-teal-500 bg-teal-50 dark:bg-teal-900/20",
  timeline:   "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  readiness:  "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
  practice:   "text-green-500 bg-green-50 dark:bg-green-900/20",
};

// Build the full search index once
function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Coding patterns
  PATTERNS.forEach(p => {
    results.push({
      id: `coding-${p.id}`,
      tabId: "coding",
      tabLabel: "Coding Interview",
      title: p.name,
      subtitle: `${p.problems?.length ?? 0} problems · ${p.timeComplexity ?? ""}`,
      tags: [p.name.toLowerCase(), "pattern", "coding", "algorithm"],
      icon: TAB_ICONS["coding"],
    });
    // Add individual problems (problems is string[])
    p.problems?.slice(0, 3).forEach(probName => {
      results.push({
        id: `coding-prob-${p.id}-${probName}`,
        tabId: "coding",
        tabLabel: "Coding Interview",
        title: probName,
        subtitle: `${p.name} pattern`,
        tags: [probName.toLowerCase(), p.name.toLowerCase(), "problem", "leetcode"],
        icon: TAB_ICONS["coding"],
      });
    });
  });

  // Behavioral questions
  BEHAVIORAL_FOCUS_AREAS.forEach(fa => {
    const areaLabel = fa.title ?? "Behavioral";
    fa.questions?.forEach(q => {
      results.push({
        id: `beh-${q.question.slice(0, 40)}`,
        tabId: "behavioral",
        tabLabel: "Behavioral Interview",
        title: q.question,
        subtitle: areaLabel,
        tags: [areaLabel.toLowerCase(), "behavioral", "star", "leadership"],
        icon: TAB_ICONS["behavioral"],
      });
    });
  });

  // CTCI problems
  CTCI_PROBLEMS.slice(0, 100).forEach(prob => {
    results.push({
      id: `ctci-${prob.id}`,
      tabId: "ctci",
      tabLabel: "Practice Tracker",
      title: prob.name,
      subtitle: `${prob.topic ?? ""} · ${prob.difficulty ?? ""}`,
      tags: [prob.name.toLowerCase(), "ctci", "practice", prob.topic?.toLowerCase() ?? ""],
      icon: TAB_ICONS["ctci"],
    });
  });

  // AI Round sections (static list)
  const aiTopics = [
    { title: "AI-Enabled Round Format", subtitle: "How Meta structures AI rounds" },
    { title: "Prompting Framework", subtitle: "How to prompt LLMs in interviews" },
    { title: "Anti-Patterns to Avoid", subtitle: "Common mistakes in AI rounds" },
    { title: "Scoring Rubric", subtitle: "How interviewers evaluate AI rounds" },
    { title: "Mock AI Session", subtitle: "Practice with AI mock interviewer" },
  ];
  aiTopics.forEach(sec => {
    results.push({
      id: `ai-${sec.title}`,
      tabId: "ai-round",
      tabLabel: "AI-Enabled Round",
      title: sec.title,
      subtitle: sec.subtitle,
      tags: [sec.title.toLowerCase(), "ai", "ml", "llm"],
      icon: TAB_ICONS["ai-round"],
    });
  });

  // System Design topics
  const sdTopics = [
    "Requirements Trainer", "Trade-off Drill", "Failure Mode Diagnostic",
    "Back-of-Envelope Calculator", "Stress Test Simulator", "Deep-Dive Bank",
    "Trade-off Library", "Meta Papers", "Mock Session",
  ];
  sdTopics.forEach(t => {
    results.push({
      id: `sd-${t}`,
      tabId: "sysdesign",
      tabLabel: "System Design",
      title: t,
      subtitle: "System Design tool",
      tags: [t.toLowerCase(), "system design", "architecture", "scalability"],
      icon: TAB_ICONS["sysdesign"],
    });
  });

  return results;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export default function GlobalSearch({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return index
      .filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q) ||
        r.tags?.some(t => t.includes(q))
      )
      .slice(0, 12);
  }, [query, index]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[selectedIdx]) {
        onNavigate(results[selectedIdx].tabId);
        onClose();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selectedIdx, onNavigate, onClose]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose(); else onNavigate("__open_search__");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onNavigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[10vh] px-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patterns, questions, problems..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Type to search across all tabs</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Patterns · Questions · Problems · Tools</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No results for "<span className="font-semibold">{query}</span>"</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => { onNavigate(r.tabId); onClose(); }}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIdx ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${TAB_COLORS[r.tabId] ?? "text-gray-500 bg-gray-50"}`}>
                    {r.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</div>
                    {r.subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{r.subtitle}</div>}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1">{r.tabLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono">↵</kbd> go to tab</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono">Ctrl+K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
