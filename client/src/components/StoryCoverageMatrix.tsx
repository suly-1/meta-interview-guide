/**
 * StoryCoverageMatrix — #7 High-Impact Feature
 *
 * Visual grid showing which STAR stories cover which Meta focus areas × core values.
 * Red cells = gaps. Candidates can add/edit their stories and see coverage in real time.
 */

import { useState } from "react";
import { useScorePersistence } from "@/hooks/useScorePersistence";
import { Plus, X, CheckCircle2, AlertCircle, Edit2, Save } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { motion, AnimatePresence } from "framer-motion";

const FOCUS_AREAS = [
  { id: "xfn", label: "XFN Collaboration", short: "XFN" },
  { id: "problem", label: "Problem Solving", short: "Problem" },
  { id: "communication", label: "Communication", short: "Comms" },
  { id: "conflict", label: "Conflict Resolution", short: "Conflict" },
];

const META_VALUES = [
  { id: "move_fast", label: "Move Fast", short: "Move Fast" },
  { id: "long_term", label: "Long-Term Impact", short: "LT Impact" },
  { id: "build_awesome", label: "Build Awesome Things", short: "Build ★" },
  { id: "live_future", label: "Live in the Future", short: "Future" },
  { id: "be_direct", label: "Be Direct", short: "Direct" },
  { id: "metamates", label: "Meta/Metamates/Me", short: "Metamates" },
];

interface Story {
  id: string;
  title: string;
  focusAreas: string[];
  values: string[];
  hasMetric: boolean;
}

const DEFAULT_STORIES: Story[] = [
  { id: "1", title: "High-Impact Technical Project", focusAreas: ["xfn", "communication"], values: ["build_awesome", "long_term"], hasMetric: true },
  { id: "2", title: "Cross-Functional Alignment Win", focusAreas: ["xfn", "conflict"], values: ["move_fast", "metamates"], hasMetric: false },
  { id: "3", title: "Technical Conflict / Disagreement", focusAreas: ["conflict", "problem"], values: ["be_direct", "metamates"], hasMetric: false },
  { id: "4", title: "Project Failure / Postmortem", focusAreas: ["problem", "communication"], values: ["move_fast", "long_term"], hasMetric: false },
  { id: "5", title: "Decision Under Ambiguity", focusAreas: ["problem", "xfn"], values: ["move_fast", "live_future"], hasMetric: false },
  { id: "6", title: "Mentoring / Growing a Junior", focusAreas: ["communication", "xfn"], values: ["metamates", "build_awesome"], hasMetric: false },
  { id: "7", title: "Proactive Risk Identification", focusAreas: ["problem", "communication"], values: ["long_term", "live_future"], hasMetric: false },
  { id: "8", title: "Technical/Cultural Change I Drove", focusAreas: ["xfn", "communication"], values: ["live_future", "long_term"], hasMetric: false },
];

const STORAGE_KEY = "meta_story_coverage_v1";

function loadStories(): Story[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_STORIES;
}

function saveStories(stories: Story[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

export default function StoryCoverageMatrix() {
  const [stories, setStories] = useState<Story[]>(loadStories);
  const { saveScore } = useScorePersistence("story_coverage");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStory, setNewStory] = useState<Omit<Story, "id">>({
    title: "", focusAreas: [], values: [], hasMetric: false,
  });

  const updateStories = (updated: Story[]) => {
    setStories(updated);
    saveStories(updated);
  };

  const toggleFocusArea = (storyId: string, areaId: string) => {
    updateStories(stories.map(s => s.id === storyId
      ? { ...s, focusAreas: s.focusAreas.includes(areaId) ? s.focusAreas.filter(a => a !== areaId) : [...s.focusAreas, areaId] }
      : s
    ));
  };

  const toggleValue = (storyId: string, valueId: string) => {
    updateStories(stories.map(s => s.id === storyId
      ? { ...s, values: s.values.includes(valueId) ? s.values.filter(v => v !== valueId) : [...s.values, valueId] }
      : s
    ));
  };

  const toggleMetric = (storyId: string) => {
    updateStories(stories.map(s => s.id === storyId ? { ...s, hasMetric: !s.hasMetric } : s));
  };

  const addStory = () => {
    if (!newStory.title.trim()) return;
    const story: Story = { ...newStory, id: Date.now().toString() };
    updateStories([...stories, story]);
    setNewStory({ title: "", focusAreas: [], values: [], hasMetric: false });
    setShowAddForm(false);
  };

  const removeStory = (id: string) => updateStories(stories.filter(s => s.id !== id));

  // Coverage stats
  const focusCoverage = FOCUS_AREAS.map(fa => ({
    ...fa,
    count: stories.filter(s => s.focusAreas.includes(fa.id)).length,
  }));
  const valueCoverage = META_VALUES.map(v => ({
    ...v,
    count: stories.filter(s => s.values.includes(v.id)).length,
  }));
  const storiesWithMetrics = stories.filter(s => s.hasMetric).length;
  const uncoveredFocus = focusCoverage.filter(f => f.count === 0);
  const uncoveredValues = valueCoverage.filter(v => v.count === 0);
  const totalGaps = uncoveredFocus.length + uncoveredValues.length;

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Story Coverage Matrix"
        subtitle="See exactly which Meta focus areas and core values your STAR stories cover. Red cells are gaps that will hurt you in the interview."
        stat={totalGaps === 0 ? "Full Coverage ✓" : `${totalGaps} Gap${totalGaps > 1 ? "s" : ""} Found`}
        variant="orange"
      />

      {totalGaps > 0 && (
        <ImpactCallout variant="red">
          You have {totalGaps} coverage gap{totalGaps > 1 ? "s" : ""}. Interviewers rotate through all focus areas — an uncovered area means you'll be caught without a story.
          {uncoveredFocus.length > 0 && ` Missing focus areas: ${uncoveredFocus.map(f => f.label).join(", ")}.`}
          {uncoveredValues.length > 0 && ` Missing values: ${uncoveredValues.map(v => v.label).join(", ")}.`}
        </ImpactCallout>
      )}

      {totalGaps === 0 && (
        <ImpactCallout variant="emerald">
          Full coverage across all focus areas and values. Now make sure every story has a quantified metric — {storiesWithMetrics}/{stories.length} do.
        </ImpactCallout>
      )}

      {/* Coverage grid */}
      <HighImpactWrapper variant="orange" className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Your STAR Stories</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{stories.length} stories</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
              >
                <Plus size={13} /> Add Story
              </button>
            </div>
          </div>
        </div>

        {/* Add story form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 space-y-3">
                <input
                  value={newStory.title}
                  onChange={e => setNewStory(s => ({ ...s, title: e.target.value }))}
                  placeholder="Story title (e.g., 'Reduced checkout latency by 40%')"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-orange-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1.5">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FOCUS_AREAS.map(fa => (
                        <button
                          key={fa.id}
                          onClick={() => setNewStory(s => ({
                            ...s,
                            focusAreas: s.focusAreas.includes(fa.id) ? s.focusAreas.filter(a => a !== fa.id) : [...s.focusAreas, fa.id],
                          }))}
                          className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition-all ${newStory.focusAreas.includes(fa.id) ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300"}`}
                        >
                          {fa.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1.5">Meta Values</p>
                    <div className="flex flex-wrap gap-1.5">
                      {META_VALUES.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setNewStory(s => ({
                            ...s,
                            values: s.values.includes(v.id) ? s.values.filter(x => x !== v.id) : [...s.values, v.id],
                          }))}
                          className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition-all ${newStory.values.includes(v.id) ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300"}`}
                        >
                          {v.short}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={newStory.hasMetric} onChange={e => setNewStory(s => ({ ...s, hasMetric: e.target.checked }))} className="rounded" />
                    Has quantified metric (e.g., "reduced latency by 40%")
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">Cancel</button>
                    <button onClick={addStory} className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <Save size={11} /> Add Story
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Story list with inline coverage toggles */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {stories.map(story => (
            <div key={story.id} className="p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{story.title}</span>
                  {story.hasMetric
                    ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" aria-label="Has metric" />
                    : <AlertCircle size={13} className="text-amber-500 flex-shrink-0" aria-label="Missing metric" />
                  }
                </div>
                <button onClick={() => removeStory(story.id)} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-500 transition-colors flex-shrink-0">
                  <X size={13} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {FOCUS_AREAS.map(fa => (
                  <button
                    key={fa.id}
                    onClick={() => toggleFocusArea(story.id, fa.id)}
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold transition-all ${story.focusAreas.includes(fa.id) ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-300"}`}
                    title={`Toggle: ${fa.label}`}
                  >
                    {fa.short}
                  </button>
                ))}
                <span className="text-[9px] text-gray-300 dark:text-gray-600 px-1">|</span>
                {META_VALUES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => toggleValue(story.id, v.id)}
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold transition-all ${story.values.includes(v.id) ? "bg-violet-500 text-white border-violet-500" : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-violet-300"}`}
                    title={`Toggle: ${v.label}`}
                  >
                    {v.short}
                  </button>
                ))}
                <button
                  onClick={() => toggleMetric(story.id)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold transition-all ${story.hasMetric ? "bg-emerald-500 text-white border-emerald-500" : "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"}`}
                >
                  {story.hasMetric ? "✓ Metric" : "No Metric"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </HighImpactWrapper>

      {/* Coverage summary bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HighImpactWrapper variant="orange" className="p-4">
          <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Focus Area Coverage</h4>
          <div className="space-y-2.5">
            {focusCoverage.map(fa => (
              <div key={fa.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${fa.count === 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {fa.label} {fa.count === 0 && "⚠ GAP"}
                  </span>
                </div>
                <ScoreBar value={fa.count} max={stories.length} />
              </div>
            ))}
          </div>
        </HighImpactWrapper>

        <HighImpactWrapper variant="violet" className="p-4">
          <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Meta Values Coverage</h4>
          <div className="space-y-2.5">
            {valueCoverage.map(v => (
              <div key={v.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${v.count === 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>
                    {v.label} {v.count === 0 && "⚠ GAP"}
                  </span>
                </div>
                <ScoreBar value={v.count} max={stories.length} />
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${storiesWithMetrics < stories.length ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                Stories with Metrics
              </span>
            </div>
            <ScoreBar value={storiesWithMetrics} max={stories.length} />
          </div>
        </HighImpactWrapper>
      </div>
    </div>
  );
}
