// Feature 3: Checkpoint Pacer
// Visual 60-minute timeline with Meta's 3-phase checkpoints and real-time pacing alerts.
// Trains candidates to self-manage time — the #2 failure mode after poor AI usage.

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

const PHASES = [
  {
    id: "p1",
    label: "Phase 1 — Bug Fix",
    duration: 15 * 60,
    color: "bg-blue-500",
    trackColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    checkpoints: [
      { at: 2 * 60, label: "Read all files" },
      { at: 5 * 60, label: "Identify bug location" },
      { at: 10 * 60, label: "Fix implemented" },
      { at: 14 * 60, label: "Tests passing" },
    ],
    tip: "Don't use AI in Phase 1 — it describes bugs without flagging them. Read the failing tests first.",
  },
  {
    id: "p2",
    label: "Phase 2 — Feature Impl",
    duration: 25 * 60,
    color: "bg-emerald-500",
    trackColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    checkpoints: [
      { at: 3 * 60, label: "Clarify requirements" },
      { at: 8 * 60, label: "Skeleton / interfaces" },
      { at: 18 * 60, label: "Core logic done" },
      { at: 23 * 60, label: "Edge cases handled" },
    ],
    tip: "Use AI for well-defined subtasks only. Spend ≤5 messages total. Keep 7 min for testing.",
  },
  {
    id: "p3",
    label: "Phase 3 — Optimization",
    duration: 15 * 60,
    color: "bg-orange-500",
    trackColor: "bg-orange-500/20",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    checkpoints: [
      { at: 2 * 60, label: "Identify bottleneck" },
      { at: 6 * 60, label: "Algorithm chosen" },
      { at: 11 * 60, label: "Refactor complete" },
      { at: 14 * 60, label: "Complexity verified" },
    ],
    tip: "State the complexity improvement out loud: 'This reduces from O(n²) to O(n log n) because…'",
  },
];

export default function CheckpointPacer() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Set<number>>(
    new Set()
  );
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedRef = useRef<Set<string>>(new Set());

  const phase = PHASES[phaseIdx];
  const progress = Math.min(elapsed / phase.duration, 1);
  const remaining = phase.duration - elapsed;
  const overTime = elapsed > phase.duration;

  const formatTime = (s: number) => {
    const abs = Math.abs(s);
    const m = Math.floor(abs / 60);
    const sec = abs % 60;
    return `${overTime && s < 0 ? "-" : ""}${m}:${sec.toString().padStart(2, "0")}`;
  };

  const checkAlerts = useCallback(
    (t: number) => {
      const key = (label: string) => `${phaseIdx}-${label}`;
      // Warn at each checkpoint if not completed
      phase.checkpoints.forEach((cp, i) => {
        const warnAt = cp.at + 60; // 1 min past checkpoint
        if (
          t >= warnAt &&
          !completedCheckpoints.has(i) &&
          !alertedRef.current.has(key(cp.label))
        ) {
          alertedRef.current.add(key(cp.label));
          setAlerts(prev =>
            [`⚠ Behind pace: "${cp.label}" checkpoint missed`, ...prev].slice(
              0,
              3
            )
          );
        }
      });
      // 5 min warning
      const fiveMinKey = key("5min");
      if (t >= phase.duration - 5 * 60 && !alertedRef.current.has(fiveMinKey)) {
        alertedRef.current.add(fiveMinKey);
        setAlerts(prev =>
          [`⏰ 5 minutes left in ${phase.label}`, ...prev].slice(0, 3)
        );
      }
    },
    [phaseIdx, phase, completedCheckpoints]
  );

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          checkAlerts(next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, checkAlerts]);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setCompletedCheckpoints(new Set());
    setAlerts([]);
    alertedRef.current = new Set();
  };

  const handlePhaseChange = (idx: number) => {
    handleReset();
    setPhaseIdx(idx);
  };

  const toggleCheckpoint = (idx: number) => {
    setCompletedCheckpoints(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="text-orange-400" size={20} />
          <h3 className="font-semibold text-foreground">Checkpoint Pacer</h3>
          <Badge
            variant="outline"
            className="text-xs border-orange-400/40 text-orange-400"
          >
            60-min simulation
          </Badge>
        </div>
      </div>

      {/* Phase selector */}
      <div className="flex gap-2">
        {PHASES.map((p, i) => (
          <button
            key={p.id}
            onClick={() => handlePhaseChange(i)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-md border transition-all ${
              phaseIdx === i
                ? `${p.borderColor} ${p.textColor} bg-current/10`
                : "border-border text-muted-foreground hover:border-border/80"
            }`}
          >
            P{i + 1}
          </button>
        ))}
      </div>

      {/* Main timer */}
      <Card className={`border ${phase.borderColor} ${phase.trackColor}`}>
        <CardContent className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${phase.textColor}`}>
              {phase.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(phase.duration / 60)} min
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-3 relative overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${overTime ? "bg-red-500" : phase.color}`}
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
            {/* Checkpoint markers */}
            {phase.checkpoints.map((cp, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 bg-background/60"
                style={{ left: `${(cp.at / phase.duration) * 100}%` }}
              />
            ))}
          </div>

          {/* Big timer */}
          <div className="flex items-center justify-between">
            <div
              className={`text-4xl font-mono font-bold ${overTime ? "text-red-400" : phase.textColor}`}
            >
              {formatTime(remaining)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRunning(r => !r)}
                className="gap-1"
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? "Pause" : "Start"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw size={14} />
              </Button>
            </div>
          </div>

          {/* Checkpoints */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              Checkpoints:
            </p>
            {phase.checkpoints.map((cp, i) => {
              const passed = elapsed >= cp.at;
              const done = completedCheckpoints.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleCheckpoint(i)}
                  className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded transition-all text-left ${
                    done
                      ? "bg-emerald-500/10 text-emerald-400"
                      : passed
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-muted-foreground"
                  }`}
                >
                  <CheckCircle2
                    size={12}
                    className={
                      done
                        ? "text-emerald-400"
                        : passed
                          ? "text-amber-400"
                          : "text-muted-foreground"
                    }
                  />
                  <span className="flex-1">{cp.label}</span>
                  <span className="font-mono text-muted-foreground">
                    {Math.floor(cp.at / 60)}:
                    {(cp.at % 60).toString().padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-1.5"
            >
              <AlertTriangle size={11} />
              {a}
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="flex items-start gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-3 py-2">
        <Zap size={11} className="mt-0.5 shrink-0" />
        {phase.tip}
      </div>
    </div>
  );
}
