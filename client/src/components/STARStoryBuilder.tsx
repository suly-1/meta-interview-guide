/**
 * STARStoryBuilder — Feature 11
 * Structured form for writing and saving STAR stories.
 * Situation → Task → Action → Result with character-count guidance.
 * Includes "Preview as interviewer" mode.
 */
import { useState, useCallback } from "react";
import { Plus, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, Save, BookOpen } from "lucide-react";

const STORAGE_KEY = "meta-guide-star-stories";

interface STARStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  createdAt: string;
  updatedAt: string;
}

function loadStories(): STARStory[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveStories(stories: STARStory[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stories)); } catch {}
}

const FIELDS: { key: keyof Pick<STARStory, "situation" | "task" | "action" | "result">; label: string; hint: string; target: [number, number]; placeholder: string }[] = [
  { key: "situation", label: "S — Situation", hint: "Set the scene. What was the context?", target: [80, 200], placeholder: "Describe the context: team size, timeline, what was at stake..." },
  { key: "task", label: "T — Task", hint: "What was your specific responsibility?", target: [60, 150], placeholder: "What were you personally responsible for delivering..." },
  { key: "action", label: "A — Action", hint: "What did YOU do? Use 'I', not 'we'.", target: [150, 350], placeholder: "Walk through your specific actions step-by-step. Be concrete..." },
  { key: "result", label: "R — Result", hint: "Quantify the impact. Numbers matter.", target: [80, 200], placeholder: "What was the measurable outcome? e.g., 40% latency reduction, shipped on time..." },
];

function CharCount({ value, target }: { value: string; target: [number, number] }) {
  const len = value.length;
  const [min, max] = target;
  const color = len < min ? "text-amber-500" : len > max ? "text-red-500" : "text-emerald-600";
  return (
    <span className={`text-[10px] font-semibold ${color}`}>
      {len} / {min}–{max} chars
    </span>
  );
}

function StoryCard({ story, onDelete }: { story: STARStory; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800">{story.title || "Untitled Story"}</span>
          <span className="text-[10px] text-gray-400">{new Date(story.updatedAt).toLocaleDateString()}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setPreview(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                preview ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {preview ? <EyeOff size={12} /> : <Eye size={12} />}
              {preview ? "Exit preview" : "Preview as interviewer"}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-gray-200 hover:border-red-300 rounded-lg transition-colors ml-auto"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>

          {preview ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Interviewer View — Labels Hidden</p>
              <p className="text-sm text-gray-800 leading-relaxed">{story.situation}</p>
              <p className="text-sm text-gray-800 leading-relaxed">{story.task}</p>
              <p className="text-sm text-gray-800 leading-relaxed">{story.action}</p>
              <p className="text-sm font-semibold text-gray-900 leading-relaxed">{story.result}</p>
            </div>
          ) : (
            FIELDS.map(f => (
              <div key={f.key}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">{f.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{story[f.key] || <span className="text-gray-300 italic">Empty</span>}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function STARStoryBuilder() {
  const [stories, setStories] = useState<STARStory[]>(loadStories);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", situation: "", task: "", action: "", result: "" });
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    const story: STARStory = {
      id: Date.now().toString(),
      title: form.title || "Story " + (stories.length + 1),
      situation: form.situation,
      task: form.task,
      action: form.action,
      result: form.result,
      createdAt: now,
      updatedAt: now,
    };
    const next = [story, ...stories];
    setStories(next);
    saveStories(next);
    setCreating(false);
    setForm({ title: "", situation: "", task: "", action: "", result: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [form, stories]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this story?")) return;
    const next = stories.filter(s => s.id !== id);
    setStories(next);
    saveStories(next);
  }, [stories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>STAR Story Bank</h3>
          <p className="text-xs text-gray-500">{stories.length} stor{stories.length !== 1 ? "ies" : "y"} saved</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Plus size={13} /> New Story
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="border-2 border-indigo-200 rounded-2xl overflow-hidden bg-indigo-50">
          <div className="px-5 py-3 bg-indigo-600 flex items-center justify-between">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>New STAR Story</span>
            <button onClick={() => setCreating(false)} className="text-white/70 hover:text-white text-xs">Cancel</button>
          </div>
          <div className="p-5 space-y-4 bg-white">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Story Title (for your reference)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                placeholder="e.g., Led migration of auth service to OAuth 2.0"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            {FIELDS.map(f => (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-indigo-700">{f.label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{f.hint}</span>
                    <CharCount value={form[f.key]} target={f.target} />
                  </div>
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 resize-none"
                  rows={f.key === "action" ? 4 : 3}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(ff => ({ ...ff, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Save size={14} /> {saved ? "Saved!" : "Save Story"}
            </button>
          </div>
        </div>
      )}

      {/* Story list */}
      {stories.length > 0 ? (
        <div className="space-y-2">
          {stories.map(s => (
            <StoryCard key={s.id} story={s} onDelete={() => handleDelete(s.id)} />
          ))}
        </div>
      ) : !creating ? (
        <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <BookOpen size={24} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No stories yet. Click "New Story" to build your first STAR narrative.</p>
        </div>
      ) : null}
    </div>
  );
}
