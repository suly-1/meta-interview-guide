// Shared animated progress bar component
import { motion } from "framer-motion";

interface ProgressBarProps {
  count: number;
  total: number;
  pct: number;
  label: string;
  color?: string; // tailwind bg class e.g. "bg-blue-500"
  onReset?: () => void;
}

export default function ProgressBar({
  count,
  total,
  pct,
  label,
  color = "bg-blue-500",
  onReset,
}: ProgressBarProps) {
  const isComplete = count === total;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {label}
          </span>
          {isComplete && (
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              ✓ Complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">
            {count} / {total}
            <span className="text-gray-400 font-normal ml-1">({pct}%)</span>
          </span>
          {onReset && count > 0 && (
            <button
              onClick={onReset}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
