/**
 * InterviewCountdown — Feature 17
 * Persistent banner showing days remaining with urgency coloring.
 * Includes daily focus message based on prep phase.
 */
import { useState, useEffect } from "react";
import { CalendarDays, X, Settings } from "lucide-react";

const STORAGE_KEY = "meta-guide-interview-date";

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000));
}

function getDailyFocus(daysLeft: number): string {
  if (daysLeft === 0) return "Interview day! Review your STAR stories and breathe. You've got this.";
  if (daysLeft === 1) return "Final day: review your weakest patterns, skim your STAR stories, sleep early.";
  if (daysLeft <= 3) return "Final sprint: timed mock sessions + behavioral review only. No new topics.";
  if (daysLeft <= 7) return "Last week: focus on weak patterns, 2–3 timed problems per day, practice out loud.";
  if (daysLeft <= 14) return "Two weeks out: mix hard problems with mock interviews. Rate every behavioral answer.";
  if (daysLeft <= 21) return "Three weeks: solidify core patterns, drill weak topics daily, build STAR story bank.";
  if (daysLeft <= 42) return "Six weeks: systematic coverage — 3 CTCI problems + 1 pattern drill + 1 behavioral per day.";
  return "Plenty of time: build strong foundations. Aim for 2–3 problems per day consistently.";
}

function getUrgencyStyle(daysLeft: number): { bg: string; text: string; badge: string; bar: string } {
  if (daysLeft <= 3) return { bg: "bg-red-50 border-red-200", text: "text-red-900", badge: "bg-red-100 text-red-700 border-red-200", bar: "bg-red-500" };
  if (daysLeft <= 14) return { bg: "bg-amber-50 border-amber-200", text: "text-amber-900", badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500" };
  return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-900", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" };
}

export default function InterviewCountdown() {
  const [interviewDate, setInterviewDate] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) ?? ""
  );
  const [editing, setEditing] = useState(!localStorage.getItem(STORAGE_KEY));
  const [dismissed, setDismissed] = useState(false);
  const [inputDate, setInputDate] = useState(interviewDate);

  useEffect(() => {
    if (interviewDate) localStorage.setItem(STORAGE_KEY, interviewDate);
  }, [interviewDate]);

  if (dismissed) return null;

  if (editing || !interviewDate) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <CalendarDays size={16} className="text-blue-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-blue-900">Set your interview date for a personalized countdown:</span>
        <input
          type="date"
          value={inputDate}
          onChange={e => setInputDate(e.target.value)}
          className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
          min={new Date().toISOString().split("T")[0]}
        />
        <button
          onClick={() => { if (inputDate) { setInterviewDate(inputDate); setEditing(false); } }}
          disabled={!inputDate}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
        >
          Set Date
        </button>
        {interviewDate && (
          <button onClick={() => setEditing(false)} className="text-xs text-blue-500 hover:underline">Cancel</button>
        )}
      </div>
    );
  }

  const daysLeft = getDaysUntil(interviewDate);
  const style = getUrgencyStyle(daysLeft);
  const focus = getDailyFocus(daysLeft);
  const dateDisplay = new Date(interviewDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border font-extrabold text-center min-w-[60px] ${style.badge}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="text-2xl leading-none">{daysLeft}</div>
            <div className="text-[9px] uppercase tracking-widest">days</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${style.text}`}>
              Interview on {dateDisplay}
            </p>
            <p className={`text-xs mt-0.5 ${style.text} opacity-80`}>{focus}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Change date"
          >
            <Settings size={13} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
