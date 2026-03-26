// Feature #13: Interview Replay & Self-Review
// Records full practice sessions (answer text, timing, tab events) and plays them back
// with LLM commentary overlaid at key moments.
// Sessions are stored in localStorage (standalone) and synced to DB when logged in.

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronRight,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Video,
  BookOpen,
  Mic,
  StopCircle,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionEventType =
  | "start"
  | "answer_typed"
  | "tab_switch"
  | "hint_used"
  | "solution_revealed"
  | "submit"
  | "note"
  | "pause"
  | "resume";

export interface SessionEvent {
  type: SessionEventType;
  timestamp: number; // ms from session start
  data?: Record<string, unknown>;
}

export interface ReplaySession {
  id: string;
  title: string;
  sessionType: "coding" | "behavioral" | "system_design" | "debug";
  startedAt: number;
  durationSeconds: number;
  events: SessionEvent[];
  finalAnswer?: string;
  llmCommentary?: LLMComment[];
  verdict?: "pass" | "borderline" | "fail";
  icLevel?: "IC5" | "IC6" | "IC7";
}

export interface LLMComment {
  timestampMs: number;
  comment: string;
  type: "positive" | "warning" | "suggestion" | "critical";
  signal?: string;
}

// ── Session Recorder Context (exported for use in other tabs) ─────────────────

let _activeRecorder: SessionRecorder | null = null;

export class SessionRecorder {
  private events: SessionEvent[] = [];
  private startTime: number = 0;
  private sessionId: string;
  private title: string;
  private sessionType: ReplaySession["sessionType"];

  constructor(title: string, sessionType: ReplaySession["sessionType"]) {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.title = title;
    this.sessionType = sessionType;
    this.startTime = Date.now();
    this.record("start");
    _activeRecorder = this;
  }

  record(type: SessionEventType, data?: Record<string, unknown>) {
    this.events.push({
      type,
      timestamp: Date.now() - this.startTime,
      data,
    });
  }

  finish(finalAnswer?: string): ReplaySession {
    this.record("submit", { finalAnswer });
    _activeRecorder = null;
    return {
      id: this.sessionId,
      title: this.title,
      sessionType: this.sessionType,
      startedAt: this.startTime,
      durationSeconds: Math.round((Date.now() - this.startTime) / 1000),
      events: [...this.events],
      finalAnswer,
    };
  }

  static getActive() {
    return _activeRecorder;
  }
}

// ── Helper to record from anywhere ────────────────────────────────────────────

export function recordEvent(type: SessionEventType, data?: Record<string, unknown>) {
  _activeRecorder?.record(type, data);
}

// ── Commentary color map ───────────────────────────────────────────────────────

const COMMENT_COLORS: Record<LLMComment["type"], string> = {
  positive: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
  warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
  suggestion: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  critical: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
};

const COMMENT_ICONS: Record<LLMComment["type"], React.ReactNode> = {
  positive: <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />,
  warning: <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />,
  suggestion: <MessageSquare size={13} className="text-blue-500 flex-shrink-0" />,
  critical: <AlertCircle size={13} className="text-red-500 flex-shrink-0" />,
};

// ── Format helpers ─────────────────────────────────────────────────────────────

function fmtMs(ms: number) {
  const s = Math.round(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── New Session Form ───────────────────────────────────────────────────────────

interface NewSessionFormProps {
  onSave: (session: ReplaySession) => void;
  onCancel: () => void;
}

function NewSessionForm({ onSave, onCancel }: NewSessionFormProps) {
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState<ReplaySession["sessionType"]>("coding");
  const [answer, setAnswer] = useState("");
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<SessionRecorder | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = () => {
    if (!title.trim()) {
      toast.error("Please enter a session title first.");
      return;
    }
    const rec = new SessionRecorder(title, sessionType);
    setRecorder(rec);
    setRecording(true);
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopRecording = () => {
    if (!recorder) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
    const session = recorder.finish(answer);
    onSave(session);
    toast.success("Session saved! Generating AI commentary...");
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Video size={16} className="text-blue-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Record New Session</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
            Session Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Design Instagram Feed"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={recording}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
            Session Type
          </label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as ReplaySession["sessionType"])}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={recording}
          >
            <option value="coding">Coding Interview</option>
            <option value="behavioral">Behavioral Interview</option>
            <option value="system_design">System Design</option>
            <option value="debug">Debug Challenge</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
          Your Answer / Notes
          {recording && (
            <span className="ml-2 text-red-500 font-normal animate-pulse">● Recording</span>
          )}
        </label>
        <Textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (recording) recorder?.record("answer_typed", { length: e.target.value.length });
          }}
          placeholder="Type your answer here as you would in a real interview. Include your thought process, approach, tradeoffs, and implementation details..."
          className="min-h-[200px] text-sm font-mono resize-none"
        />
      </div>

      {recording && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono text-red-700 dark:text-red-300">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </span>
          <span className="text-xs text-red-600 dark:text-red-400">Session in progress</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!recording ? (
          <>
            <Button onClick={startRecording} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
              <Mic size={14} />
              Start Recording
            </Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </>
        ) : (
          <Button onClick={stopRecording} variant="outline" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50">
            <StopCircle size={14} />
            Stop & Save
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Replay Viewer ──────────────────────────────────────────────────────────────

interface ReplayViewerProps {
  session: ReplaySession;
  onClose: () => void;
  onCommentaryGenerated: (sessionId: string, commentary: LLMComment[]) => void;
}

function ReplayViewer({ session, onClose, onCommentaryGenerated }: ReplayViewerProps) {
  const [playheadMs, setPlayheadMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalMs = session.durationSeconds * 1000;

  const generateCommentary = trpc.ai.generateReplayCommentary.useMutation({
    onSuccess: (data) => {
      onCommentaryGenerated(session.id, data.commentary);
      toast.success("AI commentary generated!");
    },
    onError: () => toast.error("Failed to generate commentary. Please try again."),
  });

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setPlayheadMs((p) => {
        if (p >= totalMs) {
          setPlaying(false);
          return totalMs;
        }
        return p + 100 * speed;
      });
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [playing, speed, totalMs]);

  // Events visible at current playhead
  const visibleEvents = session.events.filter((e) => e.timestamp <= playheadMs);
  const visibleComments = (session.llmCommentary ?? []).filter(
    (c) => c.timestampMs <= playheadMs
  );

  const handleGenerateCommentary = () => {
    if (!session.finalAnswer) {
      toast.error("No answer text to analyze. Please record a session with answer text.");
      return;
    }
    generateCommentary.mutate({
      sessionTitle: session.title,
      sessionType: session.sessionType,
      answer: session.finalAnswer,
      durationSeconds: session.durationSeconds,
      events: session.events.map((e) => ({
        type: e.type,
        timestampMs: e.timestamp,
        data: e.data,
      })),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Play size={16} className="text-blue-500" />
            <span className="font-bold text-gray-900 dark:text-white">{session.title}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {session.sessionType.replace("_", " ")}
            </Badge>
            {session.verdict && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  session.verdict === "pass" && "border-emerald-200 text-emerald-600",
                  session.verdict === "borderline" && "border-amber-200 text-amber-600",
                  session.verdict === "fail" && "border-red-200 text-red-600"
                )}
              >
                {session.verdict}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {fmtDate(session.startedAt)} · {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>← Back</Button>
      </div>

      {/* Playback Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlayheadMs(0)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all"
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => setPlayheadMs(totalMs)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <SkipForward size={16} />
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={totalMs}
              value={playheadMs}
              onChange={(e) => { setPlaying(false); setPlayheadMs(Number(e.target.value)); }}
              className="w-full accent-blue-600"
            />
          </div>
          <span className="text-xs font-mono text-gray-500 w-16 text-right">
            {fmtMs(playheadMs)} / {fmtMs(totalMs)}
          </span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </div>
        <Progress value={(playheadMs / totalMs) * 100} className="h-1.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Event Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Session Timeline
            </span>
            <span className="text-xs text-gray-400">({visibleEvents.length} events)</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {session.events.length === 0 && (
              <p className="text-xs text-gray-400 italic">No events recorded.</p>
            )}
            {session.events.map((event, i) => {
              const isVisible = event.timestamp <= playheadMs;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer",
                    isVisible
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                      : "text-gray-300 dark:text-gray-600"
                  )}
                  onClick={() => setPlayheadMs(event.timestamp)}
                >
                  <span className="font-mono w-10 flex-shrink-0 text-gray-400">
                    {fmtMs(event.timestamp)}
                  </span>
                  <span className="font-medium capitalize">{event.type.replace("_", " ")}</span>
                  {event.data && Object.keys(event.data).length > 0 && (
                    <span className="text-gray-400 truncate">
                      {Object.entries(event.data)
                        .map(([k, v]) => `${k}: ${String(v).slice(0, 20)}`)
                        .join(", ")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Commentary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-purple-500" />
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                AI Commentary
              </span>
            </div>
            {!session.llmCommentary && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateCommentary}
                disabled={generateCommentary.isPending}
                className="text-xs h-7 px-2.5 gap-1"
              >
                {generateCommentary.isPending ? (
                  <><Loader2 size={11} className="animate-spin" /> Analyzing…</>
                ) : (
                  <><Eye size={11} /> Generate</>
                )}
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {!session.llmCommentary && !generateCommentary.isPending && (
              <p className="text-xs text-gray-400 italic">
                Click "Generate" to get AI coaching commentary on this session.
              </p>
            )}
            {generateCommentary.isPending && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                Analyzing your session…
              </div>
            )}
            {(session.llmCommentary ?? []).map((comment, i) => {
              const isVisible = comment.timestampMs <= playheadMs;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs transition-all cursor-pointer",
                    COMMENT_COLORS[comment.type],
                    !isVisible && "opacity-30"
                  )}
                  onClick={() => setPlayheadMs(comment.timestampMs)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {COMMENT_ICONS[comment.type]}
                    <span className="font-mono text-gray-400">{fmtMs(comment.timestampMs)}</span>
                    {comment.signal && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{comment.signal}</Badge>
                    )}
                  </div>
                  <p>{comment.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Answer Text */}
      {session.finalAnswer && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-gray-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Your Answer
            </span>
          </div>
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {session.finalAnswer}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InterviewReplayTab() {
  const [sessions, setSessions] = useLocalStorage<ReplaySession[]>("interview-replay-sessions", []);
  const [view, setView] = useState<"list" | "new" | "replay">("list");
  const [activeSession, setActiveSession] = useState<ReplaySession | null>(null);
  const [filter, setFilter] = useState<"all" | ReplaySession["sessionType"]>("all");

  const handleSaveSession = (session: ReplaySession) => {
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setView("replay");
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(null);
      setView("list");
    }
  };

  const handleCommentaryGenerated = (sessionId: string, commentary: LLMComment[]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, llmCommentary: commentary } : s))
    );
    if (activeSession?.id === sessionId) {
      setActiveSession((s) => s ? { ...s, llmCommentary: commentary } : s);
    }
  };

  const handleExport = (session: ReplaySession) => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `replay-${session.title.replace(/\s+/g, "-").toLowerCase()}-${new Date(session.startedAt).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter(
    (s) => filter === "all" || s.sessionType === filter
  );

  if (view === "new") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
          >
            ← Back to sessions
          </button>
        </div>
        <NewSessionForm
          onSave={handleSaveSession}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  if (view === "replay" && activeSession) {
    return (
      <ReplayViewer
        session={activeSession}
        onClose={() => setView("list")}
        onCommentaryGenerated={handleCommentaryGenerated}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video size={20} className="text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Interview Replay & Self-Review
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Record your practice sessions and replay them with AI coaching commentary. Learn more
            from reviewing your own mistakes than from reading guides.
          </p>
        </div>
        <Button onClick={() => setView("new")} className="gap-1.5 flex-shrink-0">
          <Plus size={14} />
          New Session
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "coding", "behavioral", "system_design", "debug"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize",
              filter === f
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Session List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Video size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500 dark:text-gray-400">No sessions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Record your first practice session to see it here.
          </p>
          <Button onClick={() => setView("new")} className="mt-4 gap-1.5" size="sm">
            <Plus size={13} />
            Record Session
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">
                    {session.title}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {session.sessionType.replace("_", " ")}
                  </Badge>
                  {session.llmCommentary && (
                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
                      {session.llmCommentary.length} comments
                    </Badge>
                  )}
                  {session.verdict && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        session.verdict === "pass" && "border-emerald-200 text-emerald-600",
                        session.verdict === "borderline" && "border-amber-200 text-amber-600",
                        session.verdict === "fail" && "border-red-200 text-red-600"
                      )}
                    >
                      {session.verdict}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtDate(session.startedAt)} ·{" "}
                  {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s ·{" "}
                  {session.events.length} events
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleExport(session)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title="Export JSON"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setActiveSession(session); setView("replay"); }}
                  className="gap-1.5 text-xs h-7 px-3"
                >
                  <Play size={11} />
                  Replay
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
