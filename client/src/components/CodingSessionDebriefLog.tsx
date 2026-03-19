// CodingSessionDebriefLog — structured debrief after each timed mock session
// Stored in localStorage, surfaced in Timeline as a searchable session history
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, ChevronDown, ChevronRight, BookOpen, Clock } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";

interface DebriefEntry {
  id: string;
  date: string;
  problemName: string;
  patternUsed: string;
  stuckPoint: string;
  wouldDoDifferently: string;
  selfRating: number;
  timeSpent: number; // minutes
}

const STORAGE_KEY = "ctci-debrief-log";

function loadEntries(): DebriefEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries: DebriefEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const RATING_LABELS = ["", "Very rough", "Struggled", "Got through it", "Solid", "Nailed it"];
const RATING_COLORS = ["", "text-red-600", "text-orange-600", "text-amber-600", "text-emerald-600", "text-blue-600"];

export default function CodingSessionDebriefLog() {
  const [entries, setEntries] = useState<DebriefEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DebriefEntry, "id" | "date">>({
    problemName: "",
    patternUsed: "",
    stuckPoint: "",
    wouldDoDifferently: "",
    selfRating: 0,
    timeSpent: 45,
  });

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.problemName.trim()) return;
    const entry: DebriefEntry = {
      ...form,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setForm({ problemName: "", patternUsed: "", stuckPoint: "", wouldDoDifferently: "", selfRating: 0, timeSpent: 45 });
    setShowForm(false);
  }, [form, entries]);

  const handleDelete = useCallback((id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }, [entries]);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.problemName.toLowerCase().includes(q) || e.patternUsed.toLowerCase().includes(q) || e.stuckPoint.toLowerCase().includes(q);
  });

  const avgRating = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.selfRating, 0) / entries.filter((e) => e.selfRating > 0).length
    : 0;

  return (
    <div className="space-y-5">
      {/* Header + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Coding Session Debrief Log
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {entries.length} session{entries.length !== 1 ? "s" : ""} logged
            {entries.length > 0 && ` · avg self-rating ${avgRating.toFixed(1)}/5`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Plus size={12} /> Log Debrief
        </button>
      </div>

      {/* New debrief form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
          <p className="text-xs font-bold text-indigo-800 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            New Session Debrief
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Problem Name *</label>
              <input
                type="text"
                value={form.problemName}
                onChange={(e) => setForm((f) => ({ ...f, problemName: e.target.value }))}
                placeholder="e.g. LRU Cache, Two Sum…"
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Pattern Used</label>
              <select
                value={form.patternUsed}
                onChange={(e) => setForm((f) => ({ ...f, patternUsed: e.target.value }))}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select pattern…</option>
                {PATTERNS.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="Multiple / Hybrid">Multiple / Hybrid</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Where did I get stuck?</label>
            <textarea
              value={form.stuckPoint}
              onChange={(e) => setForm((f) => ({ ...f, stuckPoint: e.target.value }))}
              placeholder="Describe the specific moment or concept where you got stuck…"
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">What would I do differently?</label>
            <textarea
              value={form.wouldDoDifferently}
              onChange={(e) => setForm((f) => ({ ...f, wouldDoDifferently: e.target.value }))}
              placeholder="One concrete change for next time…"
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Time Spent (min)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={form.timeSpent}
                onChange={(e) => setForm((f) => ({ ...f, timeSpent: parseInt(e.target.value) || 45 }))}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Self-Rating</label>
              <div className="flex gap-1.5 mt-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm((f) => ({ ...f, selfRating: r }))}
                    className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
                      form.selfRating === r
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {form.selfRating > 0 && (
                <p className={`text-[10px] mt-1 font-semibold ${RATING_COLORS[form.selfRating]}`}>
                  {RATING_LABELS[form.selfRating]}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!form.problemName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Debrief
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {entries.length > 0 && (
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions by problem, pattern, or stuck point…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      )}

      {/* Session history */}
      {filtered.length === 0 && entries.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <BookOpen size={20} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No debriefs yet.</p>
          <p className="text-xs text-gray-400 mt-1">After each coding session, log a debrief to track patterns, stuck points, and improvements over time.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                  {expandedId === entry.id
                    ? <ChevronDown size={13} className="text-gray-400" />
                    : <ChevronRight size={13} className="text-gray-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{entry.problemName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.patternUsed && (
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md font-medium">
                        {entry.patternUsed}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Clock size={9} /> {entry.timeSpent}m
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {entry.selfRating > 0 && (
                  <span className={`text-[11px] font-bold ${RATING_COLORS[entry.selfRating]}`}>
                    {entry.selfRating}/5
                  </span>
                )}
                <span className="text-[10px] text-gray-400">
                  {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </button>

            {expandedId === entry.id && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2.5 bg-gray-50/50">
                {entry.stuckPoint && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 mb-0.5">Where I got stuck</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{entry.stuckPoint}</p>
                  </div>
                )}
                {entry.wouldDoDifferently && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 mb-0.5">What I'd do differently</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{entry.wouldDoDifferently}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition-colors font-semibold"
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
