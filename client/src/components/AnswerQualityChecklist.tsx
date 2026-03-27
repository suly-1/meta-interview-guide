/**
 * AnswerQualityChecklist — Feature 13
 * 5-point rubric checklist after each behavioral practice session.
 * Unlocks rating buttons only after self-check.
 */
import { useState } from "react";
import { CheckSquare, Square, Star } from "lucide-react";

const RUBRIC = [
  { id: "concrete", label: "Concrete example?", desc: "Used a specific real situation, not a hypothetical" },
  { id: "quantified", label: "Quantified impact?", desc: "Included numbers: %, time saved, users affected, etc." },
  { id: "role-clear", label: "Your role clear?", desc: "Said 'I' not 'we' — your specific contribution was obvious" },
  { id: "conflict", label: "Conflict/challenge acknowledged?", desc: "Didn't gloss over difficulty — showed how you navigated it" },
  { id: "lesson", label: "Lesson learned?", desc: "Ended with a genuine reflection or growth insight" },
];

interface Props {
  onRate?: (rating: number) => void;
  onSkip?: () => void;
}

export default function AnswerQualityChecklist({ onRate, onSkip }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState(0);
  const [rated, setRated] = useState<number | null>(null);

  const allChecked = checked.size === RUBRIC.length;
  const score = checked.size;

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRate = (r: number) => {
    setRated(r);
    onRate?.(r);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
        <p className="text-sm font-bold text-purple-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Answer Quality Checklist</p>
        <p className="text-xs text-purple-600">Check each criterion before rating yourself</p>
      </div>
      <div className="p-4 space-y-2">
        {RUBRIC.map(r => (
          <button
            key={r.id}
            onClick={() => toggle(r.id)}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            {checked.has(r.id)
              ? <CheckSquare size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              : <Square size={16} className="text-gray-700 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${checked.has(r.id) ? "text-emerald-700" : "text-gray-700"}`}>{r.label}</p>
              <p className="text-xs text-gray-600">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(score / RUBRIC.length) * 100}%`, background: score === RUBRIC.length ? "#10b981" : "#6366f1" }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700">{score}/{RUBRIC.length}</span>
        </div>

        {allChecked ? (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">All criteria met! Rate your answer:</p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => handleRate(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={22}
                    className={s <= (hover || rated || 0) ? "fill-amber-400 text-amber-900" : "text-gray-200"}
                  />
                </button>
              ))}
              {rated && <span className="ml-2 text-xs font-semibold text-emerald-600">Rated {rated}★</span>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">Check all {RUBRIC.length} criteria to unlock rating</p>
            <button onClick={onSkip} className="text-xs text-gray-600 hover:text-gray-600 underline">Skip checklist</button>
          </div>
        )}
      </div>
    </div>
  );
}
