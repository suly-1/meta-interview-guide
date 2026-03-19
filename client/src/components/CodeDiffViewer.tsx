/**
 * CodeDiffViewer — side-by-side diff between two code submissions.
 * Uses a simple Myers-diff-inspired line-level LCS algorithm (no external deps).
 * Shows added/removed/unchanged lines with colour coding.
 */
import { useMemo } from "react";
import { GitCompare, Minus, Plus, Equal } from "lucide-react";

type DiffOp = "equal" | "add" | "remove";
interface DiffLine {
  op: DiffOp;
  leftLine: number | null;   // 1-indexed, null for added lines
  rightLine: number | null;  // 1-indexed, null for removed lines
  text: string;
}

/** Simple LCS-based line diff. Returns unified diff ops. */
function computeDiff(aLines: string[], bLines: string[]): DiffLine[] {
  const m = aLines.length;
  const n = bLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aLines[i - 1] === bLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m, j = n;
  let leftIdx = m, rightIdx = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.unshift({ op: "equal", leftLine: i, rightLine: j, text: aLines[i - 1] });
      i--; j--;
      leftIdx = i; rightIdx = j;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ op: "add", leftLine: null, rightLine: j, text: bLines[j - 1] });
      j--;
    } else {
      result.unshift({ op: "remove", leftLine: i, rightLine: null, text: aLines[i - 1] });
      i--;
    }
  }

  void leftIdx; void rightIdx;
  return result;
}

interface Submission {
  id: string;
  timestamp: number;
  langId: string;
  code: string;
  statusId: number;
  statusDescription: string;
}

interface Props {
  baseSubmission: Submission;
  compareSubmission: Submission;
  onClose: () => void;
}

const STATUS_COLOR: Record<number, string> = {
  3: "text-emerald-600",
  6: "text-red-500",
};

function statusColor(id: number) {
  return STATUS_COLOR[id] ?? "text-amber-500";
}

export default function CodeDiffViewer({ baseSubmission, compareSubmission, onClose }: Props) {
  const baseLines = useMemo(() => baseSubmission.code.split("\n"), [baseSubmission.code]);
  const compareLines = useMemo(() => compareSubmission.code.split("\n"), [compareSubmission.code]);
  const diff = useMemo(() => computeDiff(baseLines, compareLines), [baseLines, compareLines]);

  const added = diff.filter(d => d.op === "add").length;
  const removed = diff.filter(d => d.op === "remove").length;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border">
        <GitCompare size={13} className="text-indigo-500 shrink-0" />
        <span className="text-xs font-bold text-foreground">Code Diff</span>
        <span className="text-[10px] text-emerald-600 font-semibold ml-1">+{added}</span>
        <span className="text-[10px] text-red-500 font-semibold">−{removed}</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>
            <span className="font-semibold">Base:</span>{" "}
            <span className={statusColor(baseSubmission.statusId)}>{baseSubmission.statusDescription}</span>
            {" · "}{new Date(baseSubmission.timestamp).toLocaleTimeString()}
          </span>
          <span>→</span>
          <span>
            <span className="font-semibold">New:</span>{" "}
            <span className={statusColor(compareSubmission.statusId)}>{compareSubmission.statusDescription}</span>
            {" · "}{new Date(compareSubmission.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors font-bold ml-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Diff table */}
      <div className="overflow-auto max-h-72 font-mono text-[11px] leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {diff.map((line, idx) => {
              const isAdd = line.op === "add";
              const isRemove = line.op === "remove";
              const rowBg = isAdd
                ? "bg-emerald-50 dark:bg-emerald-900/20"
                : isRemove
                ? "bg-red-50 dark:bg-red-900/20"
                : "";
              const textColor = isAdd
                ? "text-emerald-800 dark:text-emerald-300"
                : isRemove
                ? "text-red-800 dark:text-red-300"
                : "text-foreground";
              const icon = isAdd ? (
                <Plus size={9} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : isRemove ? (
                <Minus size={9} className="text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Equal size={9} className="text-muted-foreground/40 shrink-0 mt-0.5" />
              );

              return (
                <tr key={idx} className={`${rowBg} border-b border-border/30`}>
                  {/* Left line number */}
                  <td className="w-8 text-right pr-2 text-muted-foreground/50 select-none border-r border-border/30 py-0.5 px-1">
                    {line.leftLine ?? ""}
                  </td>
                  {/* Right line number */}
                  <td className="w-8 text-right pr-2 text-muted-foreground/50 select-none border-r border-border/30 py-0.5 px-1">
                    {line.rightLine ?? ""}
                  </td>
                  {/* Op icon */}
                  <td className="w-5 text-center py-0.5 px-1 border-r border-border/30">
                    {icon}
                  </td>
                  {/* Code */}
                  <td className={`py-0.5 px-2 whitespace-pre ${textColor}`}>
                    {line.text || " "}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-muted/20 border-t border-border text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Plus size={9} className="text-emerald-500" /> Added</span>
        <span className="flex items-center gap-1"><Minus size={9} className="text-red-500" /> Removed</span>
        <span className="flex items-center gap-1"><Equal size={9} className="text-muted-foreground/40" /> Unchanged</span>
      </div>
    </div>
  );
}
