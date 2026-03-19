/**
 * TimedMockSession — Feature 1
 * Pick a random unsolved CTCI problem, start a 45-minute countdown, log result.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Timer, Play, Square, RotateCcw, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";

const SESSION_LOG_KEY = "meta-guide-mock-sessions";

interface SessionLog {
  problemId: number;
  problemName: string;
  difficulty: string;
  durationSec: number;
  solved: boolean;
  timestamp: string;
}

function loadLogs(): SessionLog[] {
  try { return JSON.parse(localStorage.getItem(SESSION_LOG_KEY) ?? "[]"); } catch { return []; }
}
function saveLogs(logs: SessionLog[]) {
  try { localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(logs.slice(-50))); } catch {}
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const DIFF_COLORS: Record<string, string> = {
  Easy:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard:   "bg-red-100 text-red-700 border-red-200",
};

export default function TimedMockSession() {
  const { progress, toggleSolved } = useCTCIProgress();
  const [problem, setProblem] = useState<typeof CTCI_PROBLEMS[0] | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [logs, setLogs] = useState<SessionLog[]>(loadLogs);
  const [showLogs, setShowLogs] = useState(false);

  const DURATION = 45 * 60; // 45 minutes

  // Pick a random unsolved problem from weakest topics
  const pickProblem = useCallback(() => {
    const weakPatterns = getWeakestPatterns(3);
    const weakTopics = weakPatterns.flatMap(p => PATTERN_TO_CTCI_TOPICS[p.patternId] ?? []);
    let pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved && problemMatchesTopics(p.topic, weakTopics));
    if (pool.length === 0) pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved);
    if (pool.length === 0) pool = CTCI_PROBLEMS;
    const idx = Math.floor(Math.random() * pool.length);
    setProblem(pool[idx]);
    setElapsed(0);
    setRunning(false);
    setFinished(false);
  }, [progress]);

  // Timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(e => {
        if (e >= DURATION - 1) { setRunning(false); setFinished(true); return DURATION; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const handleStart = () => {
    if (!problem) pickProblem();
    setRunning(true);
    setFinished(false);
  };

  const handleStop = () => setRunning(false);

  const handleFinish = (solved: boolean) => {
    setRunning(false);
    setFinished(true);
    if (!problem) return;
    if (solved) toggleSolved(problem.id);
    const log: SessionLog = {
      problemId: problem.id,
      problemName: problem.name,
      difficulty: problem.difficulty,
      durationSec: elapsed,
      solved,
      timestamp: new Date().toISOString(),
    };
    const next = [log, ...logs];
    setLogs(next);
    saveLogs(next);
  };

  const timeLeft = DURATION - elapsed;
  const pct = (elapsed / DURATION) * 100;
  const urgent = timeLeft < 5 * 60;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-slate-300" />
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Timed Mock Session</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(l => !l)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {logs.length} sessions
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Problem display */}
        {problem ? (
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{problem.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{problem.topic.split(",").slice(0, 2).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLORS[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
                <a href={problem.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
            Click "Pick Problem" to get a random unsolved problem from your weakest topics.
          </div>
        )}

        {/* Timer display */}
        {problem && (
          <div className="text-center">
            <div className={`text-5xl font-extrabold tabular-nums transition-colors ${urgent && running ? "text-red-500" : "text-gray-900"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-gray-400 mt-1">{running ? "Session in progress" : finished ? "Time's up!" : "Ready to start"}</p>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${urgent ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          {!problem || finished ? (
            <button
              onClick={pickProblem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <RotateCcw size={13} /> {finished ? "New Problem" : "Pick Problem"}
            </button>
          ) : null}

          {problem && !running && !finished && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Play size={13} /> Start Timer
            </button>
          )}

          {running && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Square size={13} /> Pause
            </button>
          )}

          {problem && (running || elapsed > 0) && !finished && (
            <>
              <button
                onClick={() => handleFinish(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <CheckCircle2 size={13} /> Solved!
              </button>
              <button
                onClick={() => handleFinish(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-colors"
              >
                <XCircle size={13} /> Couldn't solve
              </button>
            </>
          )}

          {finished && (
            <>
              <button
                onClick={() => handleFinish(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <CheckCircle2 size={13} /> Mark Solved
              </button>
              <button
                onClick={() => handleFinish(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-colors"
              >
                <XCircle size={13} /> Not Solved
              </button>
            </>
          )}
        </div>

        {/* Session log */}
        {showLogs && logs.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Recent Sessions</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {logs.slice(0, 10).map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {log.solved
                    ? <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                    : <XCircle size={12} className="text-red-400 flex-shrink-0" />
                  }
                  <span className="flex-1 truncate text-gray-700">{log.problemName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${DIFF_COLORS[log.difficulty]}`}>{log.difficulty}</span>
                  <span className="text-gray-400">{formatTime(log.durationSec)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
