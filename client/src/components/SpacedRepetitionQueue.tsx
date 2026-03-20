/**
 * SpacedRepetitionQueue — Schedules problems based on last score using SM-2 algorithm
 * Stores review history in localStorage and surfaces due problems.
 */
import { useState, useEffect } from "react";
import { PATTERNS } from "@/lib/guideData";
import { Brain, CheckCircle, XCircle, Clock, RotateCcw, ChevronRight } from "lucide-react";

interface ReviewRecord {
  problem: string;
  pattern: string;
  score: number; // 0-5 (SM-2 quality)
  nextReview: number; // timestamp
  interval: number; // days
  repetitions: number;
  easeFactor: number;
}

const SM2_INITIAL_EASE = 2.5;
const MS_PER_DAY = 86400000;

function sm2Next(record: ReviewRecord, quality: number): ReviewRecord {
  // SM-2 algorithm
  let { interval, repetitions, easeFactor } = record;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const nextReview = Date.now() + interval * MS_PER_DAY;
  return { ...record, score: quality, interval, repetitions, easeFactor, nextReview };
}

function loadQueue(): ReviewRecord[] {
  try {
    return JSON.parse(localStorage.getItem("meta_srs_queue") || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: ReviewRecord[]) {
  localStorage.setItem("meta_srs_queue", JSON.stringify(queue));
}

function allProblems(): { problem: string; pattern: string }[] {
  return PATTERNS.flatMap(p => p.problems.map(prob => ({ problem: prob, pattern: p.name })));
}

function getDueItems(queue: ReviewRecord[]): ReviewRecord[] {
  const now = Date.now();
  return queue.filter(r => r.nextReview <= now).sort((a, b) => a.nextReview - b.nextReview);
}

function formatDue(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "Due now";
  const days = Math.floor(diff / MS_PER_DAY);
  const hours = Math.floor((diff % MS_PER_DAY) / 3600000);
  if (days > 0) return `In ${days}d`;
  if (hours > 0) return `In ${hours}h`;
  return "Due soon";
}

const QUALITY_LABELS = [
  { q: 5, label: "Easy", color: "bg-emerald-500 hover:bg-emerald-600", desc: "Perfect recall" },
  { q: 3, label: "Hard", color: "bg-amber-500 hover:bg-amber-600", desc: "Recalled with effort" },
  { q: 1, label: "Forgot", color: "bg-red-500 hover:bg-red-600", desc: "Couldn't recall" },
];

export default function SpacedRepetitionQueue() {
  const [queue, setQueue] = useState<ReviewRecord[]>(() => loadQueue());
  const [dueItems, setDueItems] = useState<ReviewRecord[]>(() => getDueItems(loadQueue()));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setDueItems(getDueItems(queue));
  }, [queue]);

  const current = dueItems[currentIdx];

  const handleScore = (quality: number) => {
    const updated = queue.map(r =>
      r.problem === current.problem ? sm2Next(r, quality) : r
    );
    saveQueue(updated);
    setQueue(updated);
    setShowAnswer(false);
    if (currentIdx < dueItems.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setCurrentIdx(0);
    }
  };

  const addProblem = (problem: string, pattern: string) => {
    if (queue.find(r => r.problem === problem)) return;
    const newRecord: ReviewRecord = {
      problem,
      pattern,
      score: 0,
      nextReview: Date.now(),
      interval: 1,
      repetitions: 0,
      easeFactor: SM2_INITIAL_EASE,
    };
    const updated = [...queue, newRecord];
    saveQueue(updated);
    setQueue(updated);
  };

  const removeProblem = (problem: string) => {
    const updated = queue.filter(r => r.problem !== problem);
    saveQueue(updated);
    setQueue(updated);
  };

  const problems = allProblems().filter(p =>
    !queue.find(r => r.problem === p.problem) &&
    (p.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.pattern.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const upcoming = [...queue]
    .filter(r => r.nextReview > Date.now())
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-violet-100 rounded-xl">
          <Brain size={20} className="text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Spaced Repetition Queue
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dueItems.length} due · {queue.length} total in queue
          </p>
        </div>
      </div>

      {/* Review card */}
      {dueItems.length > 0 && !addMode ? (
        <div className="mb-5">
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-700 p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">{current.pattern}</span>
              <span className="text-xs text-gray-400">{currentIdx + 1}/{dueItems.length} due</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {current.problem}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Interval: {current.interval}d · Reps: {current.repetitions} · EF: {current.easeFactor.toFixed(2)}
            </p>
          </div>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors"
            >
              Show Answer / Rate Recall
            </button>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">How well did you recall this problem's approach?</p>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_LABELS.map(q => (
                  <button
                    key={q.q}
                    onClick={() => handleScore(q.q)}
                    className={`py-3 text-white font-bold rounded-xl transition-colors text-sm ${q.color}`}
                  >
                    <div>{q.label}</div>
                    <div className="text-xs font-normal opacity-80">{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !addMode ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-4 mb-5 text-center">
          <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">All caught up!</p>
          <p className="text-xs text-gray-500 mt-1">No problems due right now. Check back later.</p>
        </div>
      ) : null}

      {/* Upcoming */}
      {!addMode && upcoming.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Upcoming Reviews</p>
          <div className="space-y-1.5">
            {upcoming.map(r => (
              <div key={r.problem} className="flex items-center gap-2 text-sm">
                <Clock size={12} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{r.problem}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDue(r.nextReview)}</span>
                <button onClick={() => removeProblem(r.problem)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <XCircle size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add problems */}
      {addMode ? (
        <div>
          <input
            type="text"
            placeholder="Search problems to add..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl mb-3 focus:outline-none focus:border-violet-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
          <div className="max-h-48 overflow-y-auto space-y-1.5 mb-3">
            {problems.slice(0, 20).map(p => (
              <button
                key={p.problem}
                onClick={() => addProblem(p.problem, p.pattern)}
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              >
                <ChevronRight size={12} className="text-violet-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{p.problem}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{p.pattern}</span>
              </button>
            ))}
            {problems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">All problems already in queue</p>
            )}
          </div>
          <button
            onClick={() => { setAddMode(false); setSearchTerm(""); }}
            className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors text-sm"
          >
            Done Adding
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setAddMode(true)}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors text-sm"
          >
            + Add Problems
          </button>
          {queue.length > 0 && (
            <button
              onClick={() => { setCurrentIdx(0); setShowAnswer(false); }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-xl transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
