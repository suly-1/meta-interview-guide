/**
 * PrepTimeline4Week — 4-week structured preparation timeline
 * Shows week-by-week plan with daily focus areas, pattern targets,
 * CTCI quotas, and behavioral milestones. Checkable tasks with localStorage persistence.
 */
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen, Code2, MessageSquare, Target } from "lucide-react";

const STORAGE_KEY = "meta-guide-timeline-checks";

interface Task {
  id: string;
  text: string;
  type: "coding" | "behavioral" | "ctci" | "meta";
}

interface Week {
  week: number;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  bgColor: string;
  tasks: Task[];
}

const WEEKS: Week[] = [
  {
    week: 1,
    title: "Foundation",
    subtitle: "Build core pattern fluency and establish daily habits",
    color: "text-blue-700",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
    tasks: [
      { id: "w1-1", text: "Master Arrays & Hashing — solve 10 CTCI problems in this topic", type: "ctci" },
      { id: "w1-2", text: "Master Two Pointers — solve 8 CTCI problems in this topic", type: "ctci" },
      { id: "w1-3", text: "Master Sliding Window — solve 8 CTCI problems in this topic", type: "ctci" },
      { id: "w1-4", text: "Complete Quick Drill for Arrays/Hashing, Two Pointers, Sliding Window", type: "coding" },
      { id: "w1-5", text: "Write 3 STAR stories for XFN Collaboration & Scope questions", type: "behavioral" },
      { id: "w1-6", text: "Set up CoderPad practice environment (request from recruiter)", type: "meta" },
      { id: "w1-7", text: "Read the full AI-Enabled Round guide and understand the 3-phase format", type: "meta" },
      { id: "w1-8", text: "Establish daily streak — practice every day this week", type: "meta" },
    ],
  },
  {
    week: 2,
    title: "Core Patterns",
    subtitle: "Tackle the highest-frequency Meta patterns",
    color: "text-teal-700",
    borderColor: "border-teal-200",
    bgColor: "bg-teal-50",
    tasks: [
      { id: "w2-1", text: "Master Trees (BFS/DFS) — solve 12 CTCI problems. Know Vertical Order Traversal cold.", type: "ctci" },
      { id: "w2-2", text: "Master Graphs — solve 10 CTCI problems. Focus on Number of Islands variants.", type: "ctci" },
      { id: "w2-3", text: "Master Heaps — solve 8 CTCI problems. Know Find Median from Data Stream.", type: "ctci" },
      { id: "w2-4", text: "Complete Quick Drill for Trees, Graphs, Heaps", type: "coding" },
      { id: "w2-5", text: "Write 3 STAR stories for Analytical Leadership & Execution questions", type: "behavioral" },
      { id: "w2-6", text: "Practice one full timed mock session (45 min) using the Timed Mock feature", type: "coding" },
      { id: "w2-7", text: "Rate all behavioral questions in the Behavioral tab — identify weak areas", type: "behavioral" },
      { id: "w2-8", text: "Practice reading and extending an unfamiliar codebase (AI-round prep)", type: "meta" },
    ],
  },
  {
    week: 3,
    title: "Advanced Patterns",
    subtitle: "Cover remaining patterns and start mock interview practice",
    color: "text-amber-900",
    borderColor: "border-amber-200",
    bgColor: "bg-amber-100",
    tasks: [
      { id: "w3-1", text: "Master Binary Search Variations — solve 8 CTCI problems. Know rotated array variants.", type: "ctci" },
      { id: "w3-2", text: "Master Backtracking — solve 8 CTCI problems. Know Word Search.", type: "ctci" },
      { id: "w3-3", text: "Master Intervals, Linked Lists, Tries — solve 6 CTCI problems each", type: "ctci" },
      { id: "w3-4", text: "Complete Quick Drill for Binary Search, Backtracking, Intervals, Linked Lists, Tries", type: "coding" },
      { id: "w3-5", text: "Write 3 STAR stories for Navigating Ambiguity & Adaptability questions", type: "behavioral" },
      { id: "w3-6", text: "Complete 3 full timed mock sessions — one per day on Mon/Wed/Fri", type: "coding" },
      { id: "w3-7", text: "Practice one full AI-enabled mock: 60 min, multi-file codebase, 3 phases", type: "meta" },
      { id: "w3-8", text: "Review Pattern Dependency Graph — ensure no prerequisite gaps", type: "coding" },
    ],
  },
  {
    week: 4,
    title: "Integration & Polish",
    subtitle: "Mixed practice, mock interviews, and final refinement",
    color: "text-rose-700",
    borderColor: "border-rose-200",
    bgColor: "bg-rose-50",
    tasks: [
      { id: "w4-1", text: "Solve 20 mixed-difficulty CTCI problems — no topic filtering", type: "ctci" },
      { id: "w4-2", text: "Complete Quick Drill for Monotonic Stack, Prefix Sum, Union-Find", type: "coding" },
      { id: "w4-3", text: "Finalize all 6 STAR story areas — practice out loud with a timer", type: "behavioral" },
      { id: "w4-4", text: "Complete 5 full timed mock sessions across the week", type: "coding" },
      { id: "w4-5", text: "Run the Blind Spot Detector — drill any pattern rated below 3★", type: "coding" },
      { id: "w4-6", text: "Review the Interview Day Checklist and prepare logistics", type: "meta" },
      { id: "w4-7", text: "Print or save the Recruiter-Ready Summary PDF", type: "meta" },
      { id: "w4-8", text: "Day before: light review only — no new problems. Sleep 8 hours.", type: "meta" },
    ],
  },
];

const TYPE_ICONS = {
  coding:    <Code2 size={12} className="text-blue-500" />,
  ctci:      <BookOpen size={12} className="text-violet-500" />,
  behavioral: <MessageSquare size={12} className="text-amber-500" />,
  meta:      <Target size={12} className="text-rose-500" />,
};

export default function PrepTimeline4Week() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checked)));
  }, [checked]);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleWeek = (week: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(week) ? next.delete(week) : next.add(week);
      return next;
    });
  };

  const weekProgress = (week: Week) => {
    const done = week.tasks.filter(t => checked.has(t.id)).length;
    return { done, total: week.tasks.length, pct: Math.round((done / week.tasks.length) * 100) };
  };

  const totalDone = WEEKS.flatMap(w => w.tasks).filter(t => checked.has(t.id)).length;
  const totalTasks = WEEKS.flatMap(w => w.tasks).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            4-Week Prep Timeline
          </h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
            {totalDone} / {totalTasks} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.round((totalDone / totalTasks) * 100)}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-600">{Math.round((totalDone / totalTasks) * 100)}%</span>
        </div>
      </div>

      {/* Week cards */}
      {WEEKS.map(week => {
        const { done, total, pct } = weekProgress(week);
        const isExpanded = expanded.has(week.week);
        const isComplete = done === total;

        return (
          <div key={week.week} className={`border rounded-xl overflow-hidden ${week.borderColor} ${isComplete ? "opacity-75" : ""}`}>
            {/* Week header */}
            <button
              onClick={() => toggleWeek(week.week)}
              className={`w-full flex items-center justify-between p-4 ${week.bgColor} hover:brightness-95 transition-all text-left`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold ${week.color} bg-white/60 border ${week.borderColor}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {week.week}
                </div>
                <div>
                  <p className={`text-sm font-bold ${week.color}`}>{week.title}</p>
                  <p className="text-xs text-gray-700">{week.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-extrabold ${week.color}`}>{pct}%</p>
                  <p className="text-[10px] text-gray-600">{done}/{total}</p>
                </div>
                {isExpanded ? <ChevronDown size={15} className="text-gray-600" /> : <ChevronRight size={15} className="text-gray-600" />}
              </div>
            </button>

            {/* Progress bar */}
            <div className="h-1 bg-white/40">
              <div className={`h-full transition-all duration-500 ${
                week.week === 1 ? "bg-blue-500" :
                week.week === 2 ? "bg-teal-500" :
                week.week === 3 ? "bg-amber-500" : "bg-rose-500"
              }`} style={{ width: `${pct}%` }} />
            </div>

            {/* Tasks */}
            {isExpanded && (
              <div className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                {week.tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggle(task.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {checked.has(task.id) ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <Circle size={16} className="text-gray-700 group-hover:text-gray-600 transition-colors" />
                      )}
                    </div>
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="flex-shrink-0 mt-0.5">{TYPE_ICONS[task.type]}</span>
                      <span className={`text-sm ${checked.has(task.id) ? "line-through text-gray-600" : "text-gray-700 dark:text-gray-200"}`}>
                        {task.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {[
          { icon: TYPE_ICONS.coding, label: "Coding / Drills" },
          { icon: TYPE_ICONS.ctci, label: "CTCI Problems" },
          { icon: TYPE_ICONS.behavioral, label: "Behavioral" },
          { icon: TYPE_ICONS.meta, label: "Meta-specific" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.icon}
            <span className="text-[11px] text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
