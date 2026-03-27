/**
 * CandidateReportArchive — Feature #11
 * Stores session history with timestamps and progress metrics.
 * Generates exportable PDF-style session summaries.
 * Pulls from localStorage: verdict-engine-history, interview-replay-sessions,
 * debug-drill-attempts, weak-signal-analysis.
 */
import { useState, useEffect } from "react";
import {
  Archive,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface VerdictRecord {
  timestamp: number;
  overallScore: number;
  verdict: string;
  icLevel: string;
  strengths: string[];
  criticalGaps: string[];
  hiringRecommendation: string;
}

interface ReplaySession {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  type: "coding" | "behavioral" | "debug";
  verdict?: "pass" | "fail" | "borderline";
}

interface WeakSignalAnalysis {
  topWeakSignals: Array<{ signal: string; severity: string; drill: string }>;
  overallPattern: string;
  priorityAction: string;
}

interface ArchiveEntry {
  id: string;
  date: number;
  type: "verdict" | "replay" | "debug" | "weak-signal";
  label: string;
  score?: number;
  verdict?: string;
  icLevel?: string;
  details: string;
  raw?: VerdictRecord | ReplaySession | WeakSignalAnalysis | Record<string, unknown>;
}

function loadArchive(): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];

  // Load verdict history
  try {
    const verdictHistory: VerdictRecord[] = JSON.parse(
      localStorage.getItem("verdict-engine-history") || "[]"
    );
    verdictHistory.forEach((v, i) => {
      entries.push({
        id: `verdict-${i}-${v.timestamp}`,
        date: v.timestamp,
        type: "verdict",
        label: `Verdict Engine — ${v.icLevel}`,
        score: v.overallScore,
        verdict: v.verdict,
        icLevel: v.icLevel,
        details: `${v.verdict.toUpperCase()} · ${v.overallScore}/100 · ${v.criticalGaps.length} critical gaps`,
        raw: v,
      });
    });
  } catch {}

  // Load replay sessions
  try {
    const replays: ReplaySession[] = JSON.parse(
      localStorage.getItem("interview-replay-sessions") || "[]"
    );
    replays.forEach((r) => {
      const duration = r.endTime && r.startTime
        ? Math.round((r.endTime - r.startTime) / 60000)
        : null;
      entries.push({
        id: `replay-${r.id}`,
        date: r.startTime,
        type: "replay",
        label: r.title || `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Session`,
        verdict: r.verdict,
        details: `${r.type} · ${duration ? `${duration} min` : "duration unknown"} · ${r.verdict || "no verdict"}`,
        raw: r,
      });
    });
  } catch {}

  // Load debug drill attempts
  try {
    const debugAttempts = JSON.parse(
      localStorage.getItem("debug-drill-attempts") || "[]"
    );
    if (Array.isArray(debugAttempts)) {
      debugAttempts.forEach((a: { timestamp?: number; problem?: string; passed?: boolean; timeMs?: number }, i: number) => {
        if (a.timestamp) {
          entries.push({
            id: `debug-${i}-${a.timestamp}`,
            date: a.timestamp,
            type: "debug",
            label: `Debug Drill — ${a.problem || "Problem"}`,
            verdict: a.passed ? "pass" : "fail",
            details: `${a.passed ? "PASS" : "FAIL"} · ${a.timeMs ? `${Math.round(a.timeMs / 1000)}s` : ""}`,
            raw: a,
          });
        }
      });
    }
  } catch {}

  // Load weak signal analysis
  try {
    const wsDate = localStorage.getItem("weak-signal-analysis-date");
    const wsData: WeakSignalAnalysis = JSON.parse(
      localStorage.getItem("weak-signal-analysis") || "null"
    );
    if (wsData && wsDate) {
      entries.push({
        id: `ws-${wsDate}`,
        date: new Date(wsDate).getTime() || Date.now(),
        type: "weak-signal",
        label: "Weak Signal Analysis",
        details: wsData.topWeakSignals?.length
          ? `Top gap: ${wsData.topWeakSignals[0]?.signal || "unknown"} · ${wsData.topWeakSignals.length} signals identified`
          : "Analysis complete",
        raw: wsData,
      });
    }
  } catch {}

  // Sort by date descending
  return entries.sort((a, b) => b.date - a.date);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getVerdictColor(verdict?: string): string {
  if (!verdict) return "text-muted-foreground";
  if (verdict === "pass" || verdict === "strong_hire" || verdict === "hire") return "text-emerald-400";
  if (verdict === "fail" || verdict === "no_hire") return "text-red-400";
  return "text-amber-400";
}

function getVerdictIcon(verdict?: string) {
  if (!verdict) return <Minus size={12} className="text-muted-foreground" />;
  if (verdict === "pass" || verdict === "strong_hire" || verdict === "hire")
    return <CheckCircle size={12} className="text-emerald-400" />;
  if (verdict === "fail" || verdict === "no_hire")
    return <XCircle size={12} className="text-red-400" />;
  return <AlertCircle size={12} className="text-amber-400" />;
}

const TYPE_COLORS: Record<string, string> = {
  verdict: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  replay: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  debug: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  "weak-signal": "bg-red-500/10 border-red-500/30 text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  verdict: "Verdict",
  replay: "Replay",
  debug: "Debug",
  "weak-signal": "Signals",
};

export default function CandidateReportArchive() {
  const [active, setActive] = useState(false);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (active) {
      setEntries(loadArchive());
    }
  }, [active]);

  const filtered = filterType === "all"
    ? entries
    : entries.filter((e) => e.type === filterType);

  const handleExportMarkdown = () => {
    if (entries.length === 0) {
      toast.error("No sessions to export");
      return;
    }
    const lines: string[] = [
      "# Meta Interview Preparation — Session Archive",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total sessions: ${entries.length}`,
      "",
    ];

    const verdicts = entries.filter((e) => e.type === "verdict");
    if (verdicts.length > 0) {
      lines.push("## Verdict Engine History");
      verdicts.forEach((v) => {
        lines.push(`- **${formatDate(v.date)}** — ${v.label}`);
        lines.push(`  - Score: ${v.score}/100 · Verdict: ${v.verdict} · IC Level: ${v.icLevel}`);
        if (v.raw && typeof v.raw === "object") {
          const raw = v.raw as VerdictRecord;
          if (raw.strengths?.length) {
            lines.push(`  - Strengths: ${raw.strengths.slice(0, 2).join(", ")}`);
          }
          if (raw.criticalGaps?.length) {
            lines.push(`  - Critical Gaps: ${raw.criticalGaps.slice(0, 2).join(", ")}`);
          }
        }
      });
      lines.push("");
    }

    const replays = entries.filter((e) => e.type === "replay");
    if (replays.length > 0) {
      lines.push("## Interview Replay Sessions");
      replays.forEach((r) => {
        lines.push(`- **${formatDate(r.date)}** — ${r.label} (${r.verdict || "no verdict"})`);
      });
      lines.push("");
    }

    const debugs = entries.filter((e) => e.type === "debug");
    if (debugs.length > 0) {
      lines.push("## Debug Drill Attempts");
      const passed = debugs.filter((d) => d.verdict === "pass").length;
      lines.push(`Pass rate: ${passed}/${debugs.length} (${Math.round((passed / debugs.length) * 100)}%)`);
      debugs.slice(0, 10).forEach((d) => {
        lines.push(`- **${formatDate(d.date)}** — ${d.label} · ${d.verdict?.toUpperCase()}`);
      });
      lines.push("");
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meta-prep-archive-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archive exported as Markdown");
  };

  const handleClearAll = () => {
    if (!confirm("Clear all session history? This cannot be undone.")) return;
    localStorage.removeItem("verdict-engine-history");
    localStorage.removeItem("interview-replay-sessions");
    localStorage.removeItem("debug-drill-attempts");
    localStorage.removeItem("weak-signal-analysis");
    localStorage.removeItem("weak-signal-analysis-date");
    setEntries([]);
    toast.success("Session history cleared");
  };

  // Compute stats
  const verdictEntries = entries.filter((e) => e.type === "verdict");
  const avgScore = verdictEntries.length > 0
    ? Math.round(verdictEntries.reduce((s, e) => s + (e.score || 0), 0) / verdictEntries.length)
    : null;
  const latestScore = verdictEntries[0]?.score ?? null;
  const prevScore = verdictEntries[1]?.score ?? null;
  const trend = latestScore !== null && prevScore !== null
    ? latestScore > prevScore ? "up" : latestScore < prevScore ? "down" : "flat"
    : null;

  if (!active) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-500/15 flex items-center justify-center shrink-0">
              <Archive size={18} className="text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Candidate Report Archive</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Session history · Progress metrics · Exportable summaries
              </p>
            </div>
          </div>
          <button
            onClick={() => setActive(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold transition-all shrink-0"
          >
            View Archive
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive size={16} className="text-slate-400" />
          <span className="font-bold text-sm text-foreground">Candidate Report Archive</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-semibold">
            {entries.length} sessions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Download size={11} /> Export
          </button>
          <button
            onClick={() => setActive(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats row */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-secondary/30 border border-border p-3 text-center">
            <div className="text-lg font-black text-foreground">{entries.length}</div>
            <div className="text-[10px] text-muted-foreground">Total Sessions</div>
          </div>
          <div className="rounded-lg bg-secondary/30 border border-border p-3 text-center">
            <div className="text-lg font-black text-foreground">{verdictEntries.length}</div>
            <div className="text-[10px] text-muted-foreground">Verdicts Run</div>
          </div>
          <div className="rounded-lg bg-secondary/30 border border-border p-3 text-center">
            <div className={`text-lg font-black ${avgScore !== null ? (avgScore >= 70 ? "text-emerald-400" : avgScore >= 50 ? "text-amber-400" : "text-red-400") : "text-muted-foreground"}`}>
              {avgScore !== null ? `${avgScore}` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">Avg Score</div>
          </div>
          <div className="rounded-lg bg-secondary/30 border border-border p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              {trend === "up" && <TrendingUp size={16} className="text-emerald-400" />}
              {trend === "down" && <TrendingDown size={16} className="text-red-400" />}
              {trend === "flat" && <Minus size={16} className="text-muted-foreground" />}
              {trend === null && <Minus size={16} className="text-muted-foreground" />}
              <span className={`text-lg font-black ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground"}`}>
                {latestScore !== null ? latestScore : "—"}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">Latest Score</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {["all", "verdict", "replay", "debug", "weak-signal"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all border ${
              filterType === f
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : TYPE_LABELS[f]}
            {f !== "all" && (
              <span className="ml-1 opacity-60">
                ({entries.filter((e) => e.type === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No sessions recorded yet.</p>
          <p className="text-xs mt-1">Complete a Verdict Engine run, Debug Drill, or Interview Replay to see history here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border bg-secondary/20 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/40 transition-colors"
              >
                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold shrink-0 ${TYPE_COLORS[entry.type]}`}>
                  {TYPE_LABELS[entry.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{entry.label}</div>
                  <div className="text-[10px] text-muted-foreground">{entry.details}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getVerdictIcon(entry.verdict)}
                  {entry.score !== undefined && (
                    <span className={`text-xs font-bold ${entry.score >= 70 ? "text-emerald-400" : entry.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {entry.score}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  {expandedId === entry.id ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                </div>
              </button>

              {expandedId === entry.id && (
                <div className="px-3 pb-3 border-t border-border">
                  <div className="pt-2 space-y-1.5">
                    <div className="text-[10px] text-muted-foreground">
                      <span className="font-semibold">Date:</span> {formatDate(entry.date)}
                    </div>
                    {entry.type === "verdict" && !!entry.raw && (
                      <>
                        {(entry.raw as VerdictRecord).strengths?.length > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-semibold text-emerald-400">Strengths:</span>{" "}
                            {(entry.raw as VerdictRecord).strengths.join(" · ")}
                          </div>
                        )}
                        {(entry.raw as VerdictRecord).criticalGaps?.length > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-semibold text-red-400">Critical Gaps:</span>{" "}
                            {(entry.raw as VerdictRecord).criticalGaps.join(" · ")}
                          </div>
                        )}
                        {(entry.raw as VerdictRecord).hiringRecommendation && (
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-semibold">Recommendation:</span>{" "}
                            {(entry.raw as VerdictRecord).hiringRecommendation}
                          </div>
                        )}
                      </>
                    )}
                    {entry.type === "weak-signal" && !!entry.raw && (
                      <>
                        {(entry.raw as WeakSignalAnalysis).topWeakSignals?.map((s, i) => (
                          <div key={i} className="text-[10px] text-muted-foreground">
                            <span className="font-semibold text-red-400">{s.severity}:</span> {s.signal}
                          </div>
                        ))}
                        {(entry.raw as WeakSignalAnalysis).priorityAction && (
                          <div className="text-[10px] text-amber-300">
                            → {(entry.raw as WeakSignalAnalysis).priorityAction}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Clear all */}
      {entries.length > 0 && (
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-all"
          >
            <Trash2 size={11} /> Clear All History
          </button>
        </div>
      )}
    </div>
  );
}
