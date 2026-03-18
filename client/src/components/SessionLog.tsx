// SessionLog — history panel showing all recorded mock interview timer sessions
import { useState } from "react";
import { Clock, Star, Trash2, ChevronDown, ChevronUp, Code2, MessageSquare } from "lucide-react";
import { useSessionLog, SessionEntry } from "@/hooks/useSessionLog";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const RATING_LABELS: Record<number, string> = {
  1: "Blank", 2: "Vague idea", 3: "Mostly right", 4: "Solid", 5: "Perfect recall",
};

function SessionRow({ entry }: { entry: SessionEntry }) {
  const isCoding = entry.type === "coding";
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      {/* Icon */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${isCoding ? "bg-blue-100" : "bg-amber-100"}`}>
        {isCoding
          ? <Code2 size={13} className="text-blue-600" />
          : <MessageSquare size={13} className="text-amber-600" />
        }
      </div>

      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 truncate">
          {isCoding ? (entry.patternName ?? "Coding Session") : (entry.label ?? "Behavioral Session")}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {formatDuration(entry.durationSec)}
          </span>
          <span className="text-gray-200">·</span>
          <span className="text-[11px] text-gray-400">{formatDate(entry.date)}</span>
          {entry.rating != null && (
            <>
              <span className="text-gray-200">·</span>
              <span className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={10} className={s <= (entry.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                ))}
                <span className="text-[11px] text-gray-500 ml-1">{RATING_LABELS[entry.rating ?? 0]}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionLog() {
  const { log, clearLog } = useSessionLog();
  const [expanded, setExpanded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const PREVIEW_COUNT = 5;
  const visible = expanded ? log : log.slice(0, PREVIEW_COUNT);

  if (log.length === 0) {
    return (
      <div className="flex items-center gap-4 p-5 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600">No sessions recorded yet</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Start the <strong>Mock Interview Timer</strong> above and complete a session — it will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  const codingCount   = log.filter((e) => e.type === "coding").length;
  const behavioralCount = log.filter((e) => e.type === "behavioral").length;
  const totalMinutes  = Math.round(log.reduce((s, e) => s + e.durationSec, 0) / 60);
  const ratedSessions = log.filter((e) => e.rating != null);
  const avgRating     = ratedSessions.length
    ? (ratedSessions.reduce((s, e) => s + (e.rating ?? 0), 0) / ratedSessions.length).toFixed(1)
    : null;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <Code2 size={12} className="text-blue-500" />
          <span className="font-bold text-blue-700">{codingCount}</span>
          <span className="text-blue-600">coding sessions</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs">
          <MessageSquare size={12} className="text-amber-500" />
          <span className="font-bold text-amber-700">{behavioralCount}</span>
          <span className="text-amber-600">behavioral sessions</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs">
          <Clock size={12} className="text-gray-500" />
          <span className="font-bold text-gray-700">{totalMinutes} min</span>
          <span className="text-gray-500">total practice time</span>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
            <Star size={12} className="text-indigo-500" />
            <span className="font-bold text-indigo-700">{avgRating}</span>
            <span className="text-indigo-600">avg rating</span>
          </div>
        )}
      </div>

      {/* Log list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            Session History ({log.length})
          </p>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Clear all?</span>
              <button onClick={() => { clearLog(); setConfirmClear(false); }}
                className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors">Yes, clear</button>
              <button onClick={() => setConfirmClear(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          <AnimatePresence initial={false}>
            {visible.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SessionRow entry={entry} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {log.length > PREVIEW_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
          >
            {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show all {log.length} sessions</>}
          </button>
        )}
      </div>
    </div>
  );
}
