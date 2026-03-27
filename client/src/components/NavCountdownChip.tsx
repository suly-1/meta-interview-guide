/**
 * NavCountdownChip — Compact interview countdown badge for the sticky nav.
 * Shows "N days" with urgency colour coding. Clicking opens an inline
 * date-picker popover to set or change the interview date.
 */
import { useState, useRef, useEffect } from "react";
import { CalendarDays, X } from "lucide-react";
import { useInterviewCountdown } from "@/hooks/useInterviewCountdown";

export default function NavCountdownChip() {
  const { dateStr, setDateStr, daysLeft } = useInterviewCountdown();
  const [open, setOpen] = useState(false);
  const [inputDate, setInputDate] = useState(dateStr);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync input when dateStr changes externally
  useEffect(() => { setInputDate(dateStr); }, [dateStr]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const urgencyClass =
    daysLeft === null
      ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
      : daysLeft <= 3
      ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
      : daysLeft <= 14
      ? "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-900 dark:border-amber-700"
      : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";

  const label =
    daysLeft === null
      ? "Set date"
      : daysLeft === 0
      ? "Today!"
      : `${daysLeft}d`;

  return (
    <div className="relative flex-shrink-0" ref={popoverRef}>
      <button
        onClick={() => setOpen(v => !v)}
        title={
          daysLeft === null
            ? "Set your interview date"
            : `${daysLeft} days until your interview — click to change`
        }
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all ${urgencyClass}`}
      >
        <CalendarDays size={12} />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[200] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CalendarDays size={14} className="text-blue-500" />
              Interview Countdown
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-600 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {daysLeft !== null && (
            <div className={`rounded-lg border px-4 py-3 mb-3 text-center ${urgencyClass}`}>
              <div className="text-3xl font-extrabold leading-none">{daysLeft}</div>
              <div className="text-[10px] uppercase tracking-widest mt-0.5 font-semibold opacity-80">
                {daysLeft === 0 ? "Interview day!" : daysLeft === 1 ? "day left" : "days left"}
              </div>
              {dateStr && (
                <div className="text-xs mt-1 opacity-70">
                  {new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short", month: "long", day: "numeric",
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {dateStr ? "Change interview date:" : "Set your interview date:"}
            </label>
            <input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white dark:bg-gray-800 text-foreground w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (inputDate) {
                    setDateStr(inputDate);
                    setOpen(false);
                  }
                }}
                disabled={!inputDate}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
              >
                {dateStr ? "Update" : "Set Date"}
              </button>
              {dateStr && (
                <button
                  onClick={() => { setDateStr(""); setInputDate(""); setOpen(false); }}
                  className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
