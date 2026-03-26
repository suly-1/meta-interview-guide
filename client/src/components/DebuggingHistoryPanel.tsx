// Debugging History Panel
// Surfaces meta_debugging_history_v1 localStorage data as a stats card
// showing hit rate trend, average time-to-fix, and unsolved problems to retry.
import { useMemo } from "react";
import {
  Bug,
  Clock,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useDebuggingHistory } from "@/hooks/useLocalStorage";

export function DebuggingHistoryPanel() {
  const [history, setHistory] = useDebuggingHistory();

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const last10 = history.slice(-10);
    const solved = history.filter(s => s.solved);
    const hitRate = Math.round((solved.length / history.length) * 100);

    // Average time for solved sessions only
    const solvedSessions = history.filter(
      s => s.solved && s.timeUsedSeconds > 0
    );
    const avgTimeSec =
      solvedSessions.length > 0
        ? Math.round(
            solvedSessions.reduce((acc, s) => acc + s.timeUsedSeconds, 0) /
              solvedSessions.length
          )
        : 0;

    // Trend: last 5 vs previous 5
    const recent5 = history.slice(-5);
    const prev5 = history.slice(-10, -5);
    const recentRate =
      recent5.length > 0
        ? (recent5.filter(s => s.solved).length / recent5.length) * 100
        : 0;
    const prevRate =
      prev5.length > 0
        ? (prev5.filter(s => s.solved).length / prev5.length) * 100
        : 0;
    const trend = recentRate - prevRate;

    // Unsolved problems (deduplicated by problemId, most recent first)
    const unsolvedMap = new Map<string, (typeof history)[0]>();
    [...history].reverse().forEach(s => {
      if (!s.solved && !unsolvedMap.has(s.problemId)) {
        unsolvedMap.set(s.problemId, s);
      }
    });
    // Remove problems that were later solved
    const solvedIds = new Set(
      history.filter(s => s.solved).map(s => s.problemId)
    );
    const unsolved = [...unsolvedMap.values()].filter(
      s => !solvedIds.has(s.problemId)
    );

    return {
      hitRate,
      avgTimeSec,
      trend,
      last10,
      unsolved,
      totalSessions: history.length,
    };
  }, [history]);

  const handleClearHistory = () => {
    if (confirm("Clear all debugging history? This cannot be undone.")) {
      setHistory([]);
    }
  };

  if (history.length === 0) return null;
  if (!stats) return null;

  const formatTime = (sec: number) => {
    if (sec === 0) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="prep-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-orange-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">
            Debugging History
          </span>
          <span className="badge badge-amber ml-1">
            {stats.totalSessions} sessions
          </span>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          title="Clear history"
        >
          <RotateCcw size={11} />
          Clear
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Hit rate */}
        <div className="rounded-lg bg-secondary p-3 text-center">
          <div
            className={`text-2xl font-bold ${
              stats.hitRate >= 70
                ? "text-emerald-400"
                : stats.hitRate >= 40
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {stats.hitRate}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Hit Rate</div>
        </div>

        {/* Avg time */}
        <div className="rounded-lg bg-secondary p-3 text-center">
          <div className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-1">
            <Clock size={16} />
            {formatTime(stats.avgTimeSec)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Avg Fix Time
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-lg bg-secondary p-3 text-center">
          <div
            className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              stats.trend > 0
                ? "text-emerald-400"
                : stats.trend < 0
                  ? "text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            <TrendingUp size={16} />
            {stats.trend > 0 ? "+" : ""}
            {Math.round(stats.trend)}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Trend (last 5)
          </div>
        </div>
      </div>

      {/* Last 10 sessions mini-timeline */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1.5 font-medium">
          Last {stats.last10.length} attempts
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {stats.last10.map(s => (
            <div
              key={s.id}
              title={`${s.problemTitle} (${s.language}) — ${s.solved ? `solved in ${formatTime(s.timeUsedSeconds)}` : "not solved"}`}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-default ${
                s.solved
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {s.solved ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            </div>
          ))}
        </div>
      </div>

      {/* Unsolved problems to retry */}
      {stats.unsolved.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
            <RotateCcw size={11} className="text-amber-400" />
            Retry these ({stats.unsolved.length} unsolved)
          </div>
          <div className="space-y-1.5">
            {stats.unsolved.slice(0, 5).map(s => (
              <div
                key={s.problemId}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <XCircle size={12} className="text-red-400 shrink-0" />
                  <span className="text-xs text-foreground truncate font-medium">
                    {s.problemTitle}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {s.language}
                </span>
              </div>
            ))}
            {stats.unsolved.length > 5 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{stats.unsolved.length - 5} more unsolved
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
