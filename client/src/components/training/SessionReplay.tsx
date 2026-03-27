// Feature 10: Full Session Replay
// After a mock session, replay code changes + AI messages on a timeline with annotations.
// Candidates can't improve what they can't review — this closes the feedback loop.

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  SkipForward,
  SkipBack,
  Clock,
  MessageSquare,
  Code2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface TimelineEvent {
  time: number; // seconds from start
  type:
    | "code_change"
    | "ai_message"
    | "phase_transition"
    | "checkpoint"
    | "alert";
  label: string;
  detail?: string;
  phase: 1 | 2 | 3;
}

interface MockSession {
  id: string;
  problem: string;
  date: string;
  totalTime: number;
  scores: {
    problemSolving: number;
    codeDev: number;
    verification: number;
    communication: number;
  };
  aiMessagesUsed: number;
  aiMessageBudget: number;
  events: TimelineEvent[];
  phases: {
    phase: number;
    startTime: number;
    endTime: number;
    score: number;
  }[];
}

// Demo session for when no real sessions exist yet
const DEMO_SESSION: MockSession = {
  id: "demo",
  problem: "Social Graph — Friend Recommendations (L6)",
  date: "2026-03-27",
  totalTime: 55 * 60,
  scores: { problemSolving: 3, codeDev: 4, verification: 3, communication: 4 },
  aiMessagesUsed: 4,
  aiMessageBudget: 5,
  phases: [
    { phase: 1, startTime: 0, endTime: 15 * 60, score: 3 },
    { phase: 2, startTime: 15 * 60, endTime: 40 * 60, score: 4 },
    { phase: 3, startTime: 40 * 60, endTime: 55 * 60, score: 3 },
  ],
  events: [
    { time: 0, type: "phase_transition", label: "Phase 1 started", phase: 1 },
    {
      time: 45,
      type: "code_change",
      label: "Read all files",
      detail: "Scanned graph.ts, user.ts, recommendations.ts",
      phase: 1,
    },
    {
      time: 3 * 60,
      type: "alert",
      label: "⚠ Checkpoint missed: Identify bug location",
      phase: 1,
    },
    {
      time: 4 * 60 + 30,
      type: "code_change",
      label: "Found off-by-one in BFS depth limit",
      phase: 1,
    },
    {
      time: 7 * 60,
      type: "code_change",
      label: "Fixed BFS depth check",
      phase: 1,
    },
    { time: 12 * 60, type: "code_change", label: "Tests passing", phase: 1 },
    {
      time: 15 * 60,
      type: "phase_transition",
      label: "Phase 2 started",
      phase: 2,
    },
    {
      time: 16 * 60,
      type: "ai_message",
      label: "AI: Asked about mutual friends algorithm",
      detail:
        "Prompt: 'What's the most efficient way to find mutual friends in a graph?'",
      phase: 2,
    },
    {
      time: 18 * 60,
      type: "code_change",
      label: "Designed MutualFriendScore interface",
      phase: 2,
    },
    {
      time: 22 * 60,
      type: "ai_message",
      label: "AI: Asked for HashMap vs Set trade-off",
      phase: 2,
    },
    {
      time: 25 * 60,
      type: "code_change",
      label: "Implemented mutual friend counting",
      phase: 2,
    },
    { time: 31 * 60, type: "checkpoint", label: "✓ Core logic done", phase: 2 },
    {
      time: 35 * 60,
      type: "ai_message",
      label: "AI: Asked about edge cases",
      phase: 2,
    },
    {
      time: 38 * 60,
      type: "code_change",
      label: "Added null checks and empty graph handling",
      phase: 2,
    },
    {
      time: 40 * 60,
      type: "phase_transition",
      label: "Phase 3 started",
      phase: 3,
    },
    {
      time: 41 * 60,
      type: "code_change",
      label: "Profiled: O(n²) in mutual friend loop",
      phase: 3,
    },
    {
      time: 44 * 60,
      type: "ai_message",
      label: "AI: Asked about set intersection optimization",
      phase: 3,
    },
    {
      time: 47 * 60,
      type: "code_change",
      label: "Refactored to O(n log n) with sorted intersection",
      phase: 3,
    },
    {
      time: 52 * 60,
      type: "code_change",
      label: "Added caching for repeated queries",
      phase: 3,
    },
    {
      time: 55 * 60,
      type: "phase_transition",
      label: "Session complete",
      phase: 3,
    },
  ],
};

const EVENT_ICONS: Record<TimelineEvent["type"], React.ReactNode> = {
  code_change: <Code2 size={11} />,
  ai_message: <MessageSquare size={11} />,
  phase_transition: <TrendingUp size={11} />,
  checkpoint: <CheckCircle2 size={11} />,
  alert: <AlertTriangle size={11} />,
};

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  code_change: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ai_message: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  phase_transition: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  checkpoint: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  alert: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const PHASE_COLORS = ["", "bg-blue-500", "bg-emerald-500", "bg-orange-500"];

export default function SessionReplay() {
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const session = DEMO_SESSION;
  const currentEvent = session.events[currentEventIdx];
  const progress =
    session.totalTime > 0 ? (currentEvent.time / session.totalTime) * 100 : 0;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const overallScore =
    Math.round(
      ((session.scores.problemSolving +
        session.scores.codeDev +
        session.scores.verification +
        session.scores.communication) /
        4) *
        10
    ) / 10;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="text-indigo-400" size={20} />
          <h3 className="font-semibold text-foreground">Session Replay</h3>
          <Badge
            variant="outline"
            className="text-xs border-indigo-400/40 text-indigo-400"
          >
            Demo
          </Badge>
        </div>
      </div>

      {/* Session summary */}
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-indigo-400">
              {session.problem}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {session.date}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Problem Solving", val: session.scores.problemSolving },
              { label: "Code Dev", val: session.scores.codeDev },
              { label: "Verification", val: session.scores.verification },
              { label: "Communication", val: session.scores.communication },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div
                  className={`text-lg font-bold ${val >= 4 ? "text-emerald-400" : val >= 3 ? "text-amber-400" : "text-red-400"}`}
                >
                  {val}/5
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Total:{" "}
              <span className="text-indigo-400 font-semibold">
                {formatTime(session.totalTime)}
              </span>
            </span>
            <span>
              AI used:{" "}
              <span
                className={`font-semibold ${session.aiMessagesUsed >= session.aiMessageBudget ? "text-red-400" : "text-emerald-400"}`}
              >
                {session.aiMessagesUsed}/{session.aiMessageBudget}
              </span>
            </span>
            <span>
              Overall:{" "}
              <span className="text-indigo-400 font-semibold">
                {overallScore}/5
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentEvent.time)}</span>
          <span>{formatTime(session.totalTime)}</span>
        </div>
        {/* Phase bands */}
        <div className="w-full h-2 rounded-full bg-secondary relative overflow-hidden">
          {session.phases.map(p => (
            <div
              key={p.phase}
              className={`absolute h-2 opacity-30 ${PHASE_COLORS[p.phase]}`}
              style={{
                left: `${(p.startTime / session.totalTime) * 100}%`,
                width: `${((p.endTime - p.startTime) / session.totalTime) * 100}%`,
              }}
            />
          ))}
          <div
            className="absolute h-2 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentEventIdx(i => Math.max(0, i - 1))}
            disabled={currentEventIdx === 0}
          >
            <SkipBack size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentEventIdx(i =>
                Math.min(session.events.length - 1, i + 1)
              )
            }
            disabled={currentEventIdx === session.events.length - 1}
          >
            <SkipForward size={14} />
          </Button>
          <span className="text-xs text-muted-foreground ml-1">
            Event {currentEventIdx + 1}/{session.events.length}
          </span>
        </div>
      </div>

      {/* Current event highlight */}
      <Card className={`border ${EVENT_COLORS[currentEvent.type]}`}>
        <CardContent className="px-4 py-3 flex items-start gap-2">
          <div
            className={`mt-0.5 ${EVENT_COLORS[currentEvent.type].split(" ")[0]}`}
          >
            {EVENT_ICONS[currentEvent.type]}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {currentEvent.label}
            </p>
            {currentEvent.detail && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentEvent.detail}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTime(currentEvent.time)}
              </span>
              <Badge variant="secondary" className="text-xs">
                Phase {currentEvent.phase}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full event log */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {session.events.map((ev, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentEventIdx(i);
              setExpandedEvent(expandedEvent === i ? null : i);
            }}
            className={`w-full text-left flex items-center gap-2 text-xs px-2 py-1.5 rounded transition-all ${
              i === currentEventIdx
                ? "bg-indigo-500/20 border border-indigo-500/30"
                : "hover:bg-secondary"
            }`}
          >
            <span className={EVENT_COLORS[ev.type].split(" ")[0]}>
              {EVENT_ICONS[ev.type]}
            </span>
            <span className="font-mono text-muted-foreground w-10 shrink-0">
              {formatTime(ev.time)}
            </span>
            <span className="flex-1 text-muted-foreground truncate">
              {ev.label}
            </span>
            <Badge variant="secondary" className="text-xs shrink-0">
              P{ev.phase}
            </Badge>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Complete a mock interview in the 🤖 AI Mock tab to replay your real
        session here.
      </p>
    </div>
  );
}
