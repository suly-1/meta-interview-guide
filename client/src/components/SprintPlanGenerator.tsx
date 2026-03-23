/**
 * SprintPlanGenerator — AI-powered 7-day personalized study plan.
 *
 * Uses the readinessReport output (or manual inputs) to generate a day-by-day
 * schedule referencing the 10 HIGH IMPACT tools. Supports print and JSON download.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Download, Printer, Calendar, CheckCircle2, Clock, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import SprintPlanFeedback from "@/components/SprintPlanFeedback";
import SprintPlanShare from "@/components/SprintPlanShare";
import ProgressAnalyticsDashboard from "@/components/ProgressAnalyticsDashboard";

type Day = {
  dayNumber: number;
  theme: string;
  tasks: { title: string; tool: string; duration: string; description: string }[];
};

const FOCUS_OPTIONS = [
  { value: "balanced", label: "Balanced", emoji: "⚖️" },
  { value: "system_design", label: "System Design", emoji: "🏗️" },
  { value: "coding", label: "Coding", emoji: "💻" },
  { value: "behavioral", label: "Behavioral", emoji: "🎤" },
] as const;

const LEVEL_OPTIONS = ["L4", "L5", "L6", "L7"] as const;

const DAY_COLORS = [
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-orange-500 to-red-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-yellow-500",
  "from-cyan-500 to-sky-500",
];

export default function SprintPlanGenerator() {
  const [weakAreas, setWeakAreas] = useState("");
  const [days, setDays] = useState(7);
  const [targetLevel, setTargetLevel] = useState<"L4" | "L5" | "L6" | "L7">("L6");
  const [focusPriority, setFocusPriority] = useState<"system_design" | "coding" | "behavioral" | "balanced">("balanced");
  const [plan, setPlan] = useState<Day[] | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const generateMutation = trpc.highImpact.generateSprintPlan.useMutation({
    onSuccess: (data) => {
      setPlan(data.days);
      setCompletedTasks(new Set());
    },
  });

  const handleGenerate = () => {
    const weakList = weakAreas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
    generateMutation.mutate({
      weakAreas: weakList,
      daysUntilInterview: days,
      targetLevel,
      focusPriority,
    });
  };

  const toggleTask = (key: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!plan) return;
    const content = plan
      .map((day) => {
        const tasks = day.tasks
          .map((t) => `  • ${t.title} [${t.tool}] — ${t.duration}\n    ${t.description}`)
          .join("\n");
        return `Day ${day.dayNumber}: ${day.theme}\n${tasks}`;
      })
      .join("\n\n");
    const blob = new Blob(
      [`Meta ${targetLevel} Interview Sprint Plan\n${"=".repeat(40)}\n\n${content}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meta-sprint-plan-${days}days.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTasks = plan ? plan.reduce((sum, d) => sum + d.tasks.length, 0) : 0;
  const completedCount = completedTasks.size;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="text-lg font-extrabold text-gray-900 dark:text-gray-100"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            📅 7-Day Sprint Plan Generator
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            AI builds your personalized day-by-day schedule using the 10 HIGH IMPACT tools
          </p>
        </div>
        {plan && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer size={13} /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
              <Download size={13} /> Save
            </Button>
          </div>
        )}
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
            Days until interview
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
            Target level
          </label>
          <select
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value as typeof targetLevel)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
            Focus priority
          </label>
          <select
            value={focusPriority}
            onChange={(e) => setFocusPriority(e.target.value as typeof focusPriority)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {FOCUS_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.emoji} {f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
            Weak areas (comma-separated)
          </label>
          <input
            type="text"
            value={weakAreas}
            onChange={(e) => setWeakAreas(e.target.value)}
            placeholder="e.g., graphs, STAR stories"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
        className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 text-sm"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            AI is building your sprint plan…
          </>
        ) : plan ? (
          <>
            <RefreshCw size={16} />
            Regenerate Sprint Plan
          </>
        ) : (
          <>
            <Zap size={16} />
            Generate My {Math.min(days, 7)}-Day Sprint Plan
          </>
        )}
      </Button>

      {/* Progress bar (when plan exists) */}
      {plan && totalTasks > 0 && (
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Sprint Progress
            </span>
            <span className="text-xs font-black text-orange-600 dark:text-orange-400">
              {completedCount}/{totalTasks} tasks · {progressPct}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Plan */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 print:space-y-6"
          >
            {/* Print header — hidden on screen */}
            <div className="hidden print:block mb-6 pb-4 border-b border-gray-300">
              <h1 className="text-2xl font-bold text-gray-900">
                Meta {targetLevel} Interview Sprint Plan — {Math.min(days, 7)} Days
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Generated by metaengguide.pro · Focus: {focusPriority} · Weak areas: {weakAreas || "balanced"}
              </p>
            </div>

            {plan.map((day, idx) => {
              const gradient = DAY_COLORS[idx % DAY_COLORS.length];
              const dayCompleted = day.tasks.every((_, ti) =>
                completedTasks.has(`${day.dayNumber}-${ti}`)
              );
              return (
                <motion.div
                  key={day.dayNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`rounded-2xl border overflow-hidden print:break-inside-avoid ${
                    dayCompleted
                      ? "border-emerald-300 dark:border-emerald-700"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {/* Day header */}
                  <div className={`bg-gradient-to-r ${gradient} px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calendar size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white/80 uppercase tracking-widest">
                          Day {day.dayNumber}
                        </div>
                        <div className="text-sm font-extrabold text-white">
                          {day.theme}
                        </div>
                      </div>
                    </div>
                    {dayCompleted && (
                      <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                        <CheckCircle2 size={13} className="text-white" />
                        <span className="text-xs font-bold text-white">Done</span>
                      </div>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {day.tasks.map((task, ti) => {
                      const taskKey = `${day.dayNumber}-${ti}`;
                      const done = completedTasks.has(taskKey);
                      return (
                        <div
                          key={ti}
                          className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            done ? "opacity-60" : ""
                          }`}
                          onClick={() => toggleTask(taskKey)}
                        >
                          <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            done
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {done && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-bold ${done ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
                                {task.title}
                              </span>
                              <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                {task.tool}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                            <Clock size={11} />
                            {task.duration}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback + Share — shown after plan is generated */}
      {plan && (
        <div className="mt-6 space-y-4 print:hidden">
          <div className="flex flex-wrap gap-3 items-center">
            <SprintPlanShare
              planData={plan}
              targetLevel={targetLevel}
              focusPriority={focusPriority}
              weakAreas={weakAreas.split(',').map(s => s.trim()).filter(Boolean)}
            />
          </div>
          <SprintPlanFeedback />
        </div>
      )}

      {/* Progress Analytics Dashboard — always visible below the generator */}
      <div className="mt-8 print:hidden">
        <ProgressAnalyticsDashboard />
      </div>
    </div>
  );
}
