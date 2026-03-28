/**
 * MetaAICodingMock — Full Meta AI-Enabled Coding Mock Interview Simulator
 *
 * Replicates the exact CoderPad 3-phase format:
 *   Phase 1: Bug Fix (15 min)
 *   Phase 2: Feature Implementation (25 min)
 *   Phase 3: Optimization (15 min)
 *
 * Layout: File Explorer | Code Editor | AI Chat Panel
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Play,
  ChevronRight,
  ChevronDown,
  FileCode,
  Clock,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Trophy,
  BookOpen,
  Zap,
  Target,
  History,
  X,
  ChevronLeft,
  Loader2,
  Bot,
  User,
  Info,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type PhaseKey = "bugFix" | "featureImpl" | "optimize";

interface PhaseScore {
  problemSolving: number;
  codeDevelopment: number;
  verificationDebugging: number;
  technicalCommunication: number;
  phaseVerdict: string;
  aiUsageAssessment: string;
  keyStrengths: string[];
  keyImprovements: string[];
  summary: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface SessionRecord {
  id: string;
  problemId: string;
  problemTitle: string;
  targetLevel: string;
  completedAt: number;
  totalTimeSeconds: number;
  totalAiMessages: number;
  phasesCompleted: number;
  overallVerdict: string;
  overallScore: number;
  executiveSummary: string;
}

const PHASES: {
  key: PhaseKey;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  {
    key: "bugFix",
    label: "Phase 1 — Bug Fix",
    shortLabel: "P1",
    color: "text-red-400",
  },
  {
    key: "featureImpl",
    label: "Phase 2 — Feature Impl",
    shortLabel: "P2",
    color: "text-blue-400",
  },
  {
    key: "optimize",
    label: "Phase 3 — Optimize",
    shortLabel: "P3",
    color: "text-violet-400",
  },
];

const VERDICT_COLOR: Record<string, string> = {
  "Strong Hire": "text-emerald-400",
  Hire: "text-blue-400",
  "No Hire": "text-amber-400",
  "Strong No Hire": "text-red-400",
};

const SESSION_KEY = "meta_ai_coding_mock_sessions";

function loadSessions(): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSession(s: SessionRecord) {
  const sessions = loadSessions();
  sessions.unshift(s);
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(0, 20)));
}

// ─── Timer Component ──────────────────────────────────────────────────────────

function PhaseTimer({
  totalSeconds,
  running,
  onTick,
}: {
  totalSeconds: number;
  running: boolean;
  onTick: (elapsed: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(0);
  }, [totalSeconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 1;
          onTick(next);
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onTick]);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const pct = Math.min(100, (elapsed / totalSeconds) * 100);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining < 120;
  const warning = remaining < 300;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`font-mono text-sm font-bold tabular-nums ${
          urgent
            ? "text-red-400 animate-pulse"
            : warning
              ? "text-amber-400"
              : "text-emerald-400"
        }`}
      >
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            urgent ? "bg-red-400" : warning ? "bg-amber-400" : "bg-emerald-400"
          }`}
          style={{ width: `${100 - pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── File Explorer ────────────────────────────────────────────────────────────

function FileExplorer({
  files,
  activeFile,
  onSelect,
}: {
  files: Record<string, string>;
  activeFile: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="h-full bg-[#1e1e2e] border-r border-border/40 flex flex-col">
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {Object.keys(files).map(name => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
              activeFile === name
                ? "bg-blue-500/20 text-blue-300"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <FileCode size={12} className="shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Code Editor (textarea-based, no Monaco dep) ─────────────────────────────

function CodeEditor({
  value,
  onChange,
  filename,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  filename: string;
  readOnly?: boolean;
}) {
  const lineCount = value.split("\n").length;

  return (
    <div className="h-full flex flex-col bg-[#1e1e2e] font-mono text-sm">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border/40 bg-[#252535]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-300 border-b-2 border-blue-400 bg-[#1e1e2e]">
          <FileCode size={11} />
          {filename}
        </div>
        {readOnly && (
          <span className="ml-auto mr-3 text-[10px] text-muted-foreground">
            read-only
          </span>
        )}
      </div>
      {/* Editor area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Line numbers */}
        <div className="select-none text-right pr-3 pt-3 text-[11px] text-muted-foreground leading-5 min-w-[3rem] overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={e => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent text-[13px] leading-5 pt-3 pr-4 pb-3 text-foreground focus:outline-none font-mono"
          style={{ tabSize: 4 }}
        />
      </div>
    </div>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

const AI_BUDGET_PER_PHASE = 5; // Hard cap matching Meta's real interview AI budget

function AIChatPanel({
  problemId,
  phase,
  codeContext,
  messages,
  onMessage,
  disabled,
  phaseMessageCount,
  onBudgetExhausted,
}: {
  problemId: string;
  phase: PhaseKey;
  codeContext: string;
  messages: ChatMessage[];
  onMessage: (msg: ChatMessage) => void;
  disabled?: boolean;
  phaseMessageCount: number;
  onBudgetExhausted?: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.aiCodingMock.chat.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const budgetRemaining = AI_BUDGET_PER_PHASE - phaseMessageCount;
  const budgetExhausted = budgetRemaining <= 0;

  const send = async () => {
    if (!input.trim() || chatMutation.isPending || disabled || budgetExhausted)
      return;
    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    onMessage(userMsg);
    setInput("");

    // Check if this message exhausts the budget
    if (phaseMessageCount + 1 >= AI_BUDGET_PER_PHASE) {
      onBudgetExhausted?.();
    }

    try {
      const res = await chatMutation.mutateAsync({
        problemId,
        phase,
        message: userMsg.content,
        codeContext: codeContext.slice(0, 3000),
        conversationHistory: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
      onMessage({
        role: "assistant",
        content: res.reply,
        timestamp: Date.now(),
      });
    } catch {
      toast.error("AI assistant unavailable — try again");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e] border-l border-border/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-[#252535]">
        <Bot size={14} className="text-blue-400" />
        <span className="text-xs font-semibold text-blue-300">
          AI Assistant
        </span>
        {/* Token Budget Counter */}
        <div className="ml-auto flex items-center gap-1.5">
          {budgetExhausted ? (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-red-500/60 text-red-400 gap-1"
            >
              <Lock size={8} />
              Budget Exhausted
            </Badge>
          ) : (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: AI_BUDGET_PER_PHASE }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    i < phaseMessageCount
                      ? "bg-red-500/70"
                      : i === phaseMessageCount
                        ? "bg-amber-400 animate-pulse"
                        : "bg-secondary"
                  }`}
                  title={`Message ${i + 1} of ${AI_BUDGET_PER_PHASE}`}
                />
              ))}
              <span className="text-[9px] text-muted-foreground ml-1">
                {budgetRemaining} left
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Disclaimer / Budget Exhausted Banner */}
      {budgetExhausted ? (
        <div className="px-3 py-3 text-[11px] bg-red-500/10 border-b border-red-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-semibold">
            <Lock size={11} />
            AI Budget Exhausted
          </div>
          <p className="text-muted-foreground leading-relaxed">
            You've used all {AI_BUDGET_PER_PHASE} AI messages for this phase —
            just like the real Meta interview. Continue solving without AI.
          </p>
          <p className="text-amber-400/80 text-[10px]">
            💡 This is intentional training. Interviewers flag (per reported
            interview experiences) candidates who over-rely on AI.
          </p>
        </div>
      ) : (
        <div className="px-3 py-2 text-[10px] text-muted-foreground bg-amber-500/5 border-b border-amber-500/20 flex gap-1.5">
          <AlertTriangle size={10} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            AI will hint and explain — it won't write full solutions.{" "}
            <span className="text-amber-400 font-medium">
              {budgetRemaining} message{budgetRemaining !== 1 ? "s" : ""}{" "}
              remaining this phase.
            </span>
          </span>
        </div>
      )}
      {/* Messages */}
      <ScrollArea
        className="flex-1 px-3 py-2"
        ref={scrollRef as React.Ref<HTMLDivElement>}
      >
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-6 space-y-2">
            <Bot size={24} className="mx-auto text-blue-400/40" />
            <p>
              Ask the AI to explain code, describe an approach, or get a
              directional hint.
            </p>
            <p className="text-[10px]">
              Good prompts: "What does this class do?" · "What type of bug is on
              line 12?" · "Describe the sliding window approach"
            </p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  msg.role === "user" ? "bg-blue-500/20" : "bg-secondary"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={12} className="text-blue-400" />
                ) : (
                  <Bot size={12} className="text-muted-foreground" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-500/20 text-blue-100"
                    : "bg-secondary text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-2">
              <div className="shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <Bot size={12} className="text-muted-foreground" />
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      {/* Input */}
      <div className="p-2 border-t border-border/40">
        <div className="flex gap-1.5">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              budgetExhausted
                ? "AI budget exhausted — continue without AI"
                : disabled
                  ? "Session ended"
                  : `Ask the AI... (${budgetRemaining} message${budgetRemaining !== 1 ? "s" : ""} left)`
            }
            disabled={disabled || chatMutation.isPending || budgetExhausted}
            className="resize-none text-xs min-h-[60px] max-h-[120px] bg-secondary/50"
            rows={2}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={send}
            disabled={
              !input.trim() ||
              chatMutation.isPending ||
              disabled ||
              budgetExhausted
            }
            className="shrink-0 self-end h-8 w-8"
          >
            <Send size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Problem Selector ─────────────────────────────────────────────────────────

function ProblemSelector({
  problems,
  targetLevel,
  onLevelChange,
  onStart,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  problems: any[] | undefined;
  targetLevel: string;
  onLevelChange: (l: string) => void;
  onStart: (problemId: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");

  const filtered = problems?.filter(
    p => targetLevel === "all" || p.difficulty === targetLevel
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Level:</span>
          <Select value={targetLevel} onValueChange={onLevelChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="L5">L5</SelectItem>
              <SelectItem value="L6">L6</SelectItem>
              <SelectItem value="L7">L7</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => {
            if (filtered && filtered.length > 0) {
              const r = filtered[Math.floor(Math.random() * filtered.length)];
              setSelected(r.id);
            }
          }}
        >
          🎲 Random
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              selected === p.id
                ? "border-blue-500/60 bg-blue-500/10"
                : "border-border hover:border-border/80 hover:bg-secondary/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-sm">{p.title}</span>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${
                  p.difficulty === "L7"
                    ? "border-violet-500/40 text-violet-400"
                    : "border-blue-500/40 text-blue-400"
                }`}
              >
                {p.difficulty}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              {p.description}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {p.topic}
              </Badge>
            </div>
            <div className="mt-2 flex gap-1 text-[10px] text-muted-foreground">
              <span className="text-red-400">P1 15m</span>
              <span>·</span>
              <span className="text-blue-400">P2 25m</span>
              <span>·</span>
              <span className="text-violet-400">P3 15m</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={() => selected && onStart(selected)}
          disabled={!selected}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8"
          size="lg"
        >
          <Play size={16} />
          Start Mock Interview
        </Button>
      </div>
    </div>
  );
}

// ─── Session History ──────────────────────────────────────────────────────────

function SessionHistory({ onClose }: { onClose: () => void }) {
  const sessions = loadSessions();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <History size={14} />
          Past Sessions ({sessions.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0"
        >
          <X size={13} />
        </Button>
      </div>
      {sessions.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          No sessions yet. Complete your first mock interview!
        </p>
      )}
      <div className="space-y-2">
        {sessions.map(s => (
          <div
            key={s.id}
            className="border border-border rounded-lg p-3 text-sm space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.problemTitle}</span>
              <Badge variant="outline" className="text-[10px]">
                {s.targetLevel}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{new Date(s.completedAt).toLocaleDateString()}</span>
              <span>{Math.round(s.totalTimeSeconds / 60)} min</span>
              <span>{s.phasesCompleted}/3 phases</span>
              <span>{s.totalAiMessages} AI msgs</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${VERDICT_COLOR[s.overallVerdict] ?? "text-foreground"}`}
              >
                {s.overallVerdict}
              </span>
              <span className="text-xs text-muted-foreground">
                Score: {s.overallScore}/4
              </span>
            </div>
            {s.executiveSummary && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {s.executiveSummary}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phase Score Card ─────────────────────────────────────────────────────────

function PhaseScoreCard({
  phaseLabel,
  score,
  loading,
}: {
  phaseLabel: string;
  score: PhaseScore | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border border-border rounded-xl p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin text-blue-400" />
        Scoring {phaseLabel}...
      </div>
    );
  }
  if (!score) return null;

  const dims = [
    { label: "Problem Solving", val: score.problemSolving },
    { label: "Code Development", val: score.codeDevelopment },
    { label: "Verification", val: score.verificationDebugging },
    { label: "Communication", val: score.technicalCommunication },
  ];

  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{phaseLabel}</span>
        <span
          className={`text-xs font-bold ${VERDICT_COLOR[score.phaseVerdict] ?? "text-foreground"}`}
        >
          {score.phaseVerdict}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {dims.map(d => (
          <div key={d.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-mono font-bold">{d.val}/4</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  d.val >= 3.5
                    ? "bg-emerald-400"
                    : d.val >= 2.5
                      ? "bg-blue-400"
                      : d.val >= 1.5
                        ? "bg-amber-400"
                        : "bg-red-400"
                }`}
                style={{ width: `${(d.val / 4) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{score.summary}</p>
      <div className="text-[11px] space-y-1">
        <div className="text-emerald-400 font-medium">
          AI Usage: {score.aiUsageAssessment}
        </div>
        {score.keyStrengths.length > 0 && (
          <div>
            <span className="text-muted-foreground">Strengths: </span>
            {score.keyStrengths.join(" · ")}
          </div>
        )}
        {score.keyImprovements.length > 0 && (
          <div>
            <span className="text-muted-foreground">Improve: </span>
            {score.keyImprovements.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MetaAICodingMock() {
  const [view, setView] = useState<
    "select" | "interview" | "debrief" | "history"
  >("select");
  const [targetLevel, setTargetLevel] = useState("L6");
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [activeFile, setActiveFile] = useState<string>("");
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalAiMessages, setTotalAiMessages] = useState(0);
  const [phaseMessageCount, setPhaseMessageCount] = useState(0); // per-phase AI budget tracker
  const [budgetExhaustedNotified, setBudgetExhaustedNotified] = useState(false);
  const [tddMode, setTddMode] = useState(false); // TDD Mode: hide code, show only failing tests
  const [tddCodeRevealed, setTddCodeRevealed] = useState(false); // whether user revealed code in TDD mode
  const [phaseScores, setPhaseScores] = useState<(PhaseScore | null)[]>([
    null,
    null,
    null,
  ]);
  const [scoringPhase, setScoringPhase] = useState<number | null>(null);
  const [sessionDebrief, setSessionDebrief] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [selfAssessment, setSelfAssessment] = useState("");

  const { data: problems, isLoading: problemsLoading } =
    trpc.aiCodingMock.getProblems.useQuery();

  const scorePhaseMutation = trpc.aiCodingMock.scorePhase.useMutation();
  const scoreSessionMutation = trpc.aiCodingMock.scoreSession.useMutation();

  const currentProblem = problems?.find(p => p.id === selectedProblemId);
  const currentPhase = PHASES[currentPhaseIdx];
  const currentPhaseData =
    currentProblem?.phases[currentPhase?.key ?? "bugFix"];

  // Initialize files when phase changes
  useEffect(() => {
    if (!currentPhaseData) return;
    const files = currentPhaseData.files as Record<string, string>;
    if (Object.keys(files).length > 0) {
      setFileContents(files);
      setActiveFile(Object.keys(files)[0]);
    }
  }, [currentPhaseIdx, selectedProblemId]);

  const handleTick = useCallback((elapsed: number) => {
    setPhaseElapsed(elapsed);
    setTotalElapsed(t => t + 1);
  }, []);

  const startInterview = (problemId: string) => {
    setSelectedProblemId(problemId);
    setCurrentPhaseIdx(0);
    setTimerRunning(true);
    setPhaseElapsed(0);
    setTotalElapsed(0);
    setChatMessages([]);
    setTotalAiMessages(0);
    setPhaseMessageCount(0);
    setBudgetExhaustedNotified(false);
    setTddMode(false);
    setTddCodeRevealed(false);
    setPhaseScores([null, null, null]);
    setSessionDebrief(null);
    setSelfAssessment("");
    setView("interview");
  };

  const handleAddMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
    if (msg.role === "user") {
      setTotalAiMessages(n => n + 1);
      setPhaseMessageCount(n => n + 1);
    }
  };

  const handleBudgetExhausted = () => {
    if (!budgetExhaustedNotified) {
      setBudgetExhaustedNotified(true);
      toast.warning(
        `🔒 AI budget exhausted for this phase (${AI_BUDGET_PER_PHASE} messages used). Continue without AI — just like the real Meta interview.`,
        { duration: 6000 }
      );
    }
  };

  const handleEndPhase = async () => {
    setTimerRunning(false);
    const phaseKey = PHASES[currentPhaseIdx].key;
    const code = fileContents[activeFile] ?? "";

    setScoringPhase(currentPhaseIdx);
    try {
      const score = await scorePhaseMutation.mutateAsync({
        problemId: selectedProblemId,
        phase: phaseKey,
        candidateCode: code,
        timeUsedSeconds: phaseElapsed,
        aiMessagesCount: totalAiMessages,
        selfAssessment,
      });
      setPhaseScores(prev => {
        const next = [...prev];
        next[currentPhaseIdx] = score;
        return next;
      });
    } catch {
      toast.error("Scoring failed — continuing without score for this phase");
    } finally {
      setScoringPhase(null);
    }

    if (currentPhaseIdx < 2) {
      setCurrentPhaseIdx(i => i + 1);
      setPhaseElapsed(0);
      setChatMessages([]);
      setPhaseMessageCount(0);
      setBudgetExhaustedNotified(false);
      setTddMode(false);
      setTddCodeRevealed(false);
      setSelfAssessment("");
      setTimeout(() => setTimerRunning(true), 500);
    } else {
      // All phases done — generate full debrief
      await generateDebrief();
    }
  };

  const generateDebrief = async () => {
    setView("debrief");
    try {
      const debrief = await scoreSessionMutation.mutateAsync({
        problemId: selectedProblemId,
        targetLevel: targetLevel as "L5" | "L6" | "L7",
        phase1Score: phaseScores[0] ?? undefined,
        phase2Score: phaseScores[1] ?? undefined,
        phase3Score: phaseScores[2] ?? undefined,
        totalAiMessages,
        totalTimeSeconds: totalElapsed,
      });
      setSessionDebrief(debrief as Record<string, unknown>);

      // Save to history
      saveSession({
        id: `${Date.now()}`,
        problemId: selectedProblemId,
        problemTitle: currentProblem?.title ?? "",
        targetLevel,
        completedAt: Date.now(),
        totalTimeSeconds: totalElapsed,
        totalAiMessages,
        phasesCompleted: phaseScores.filter(Boolean).length,
        overallVerdict:
          (debrief as Record<string, string>).overallVerdict ?? "",
        overallScore: (debrief as Record<string, number>).overallScore ?? 0,
        executiveSummary:
          (debrief as Record<string, string>).executiveSummary ?? "",
      });
    } catch {
      toast.error(
        "Failed to generate debrief — your phase scores are still saved"
      );
    }
  };

  // ── Render: Select ──────────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <SessionHistory onClose={() => setView("select")} />
      </div>
    );
  }

  if (view === "select") {
    return (
      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target size={20} className="text-blue-400" />
              Meta AI-Enabled Coding Mock
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Replicate the exact 3-phase CoderPad format with a nerfed AI
              assistant — just like the real interview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setView("history")}
            >
              <History size={13} />
              History ({loadSessions().length})
            </Button>
          </div>
        </div>

        {/* Format explainer */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              phase: "Phase 1",
              label: "Bug Fix",
              time: "15 min",
              desc: "Find & fix bugs in a multi-file codebase using failing tests as your guide",
              color: "border-red-500/30 bg-red-500/5",
              badge: "text-red-400",
            },
            {
              phase: "Phase 2",
              label: "Feature Impl",
              time: "25 min",
              desc: "Implement a new class/feature on top of the existing fixed code",
              color: "border-blue-500/30 bg-blue-500/5",
              badge: "text-blue-400",
            },
            {
              phase: "Phase 3",
              label: "Optimize",
              time: "15 min",
              desc: "Optimize your implementation to handle 10x–100x larger inputs",
              color: "border-violet-500/30 bg-violet-500/5",
              badge: "text-violet-400",
            },
          ].map(p => (
            <div key={p.phase} className={`rounded-xl border p-3 ${p.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${p.badge}`}>
                  {p.phase}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock size={9} />
                  {p.time}
                </span>
              </div>
              <div className="font-semibold text-sm mb-1">{p.label}</div>
              <p className="text-[11px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* AI rules */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex gap-3">
          <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-amber-400">
              Meta's AI Rules (simulated here)
            </p>
            <p>
              The AI will explain code and give directional hints — it will NOT
              write complete solutions. This is intentional. In the real
              interview, over-relying on AI is a red flag. Practice using it
              strategically.
            </p>
          </div>
        </div>

        {/* Problem picker */}
        {problemsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Loading problems...
          </div>
        ) : (
          <ProblemSelector
            problems={problems}
            targetLevel={targetLevel}
            onLevelChange={setTargetLevel}
            onStart={startInterview}
          />
        )}
      </div>
    );
  }

  // ── Render: Interview ───────────────────────────────────────────────────────
  if (view === "interview" && currentProblem && currentPhaseData) {
    const phaseFiles = currentPhaseData.files as Record<string, string>;
    const hasFiles = Object.keys(phaseFiles).length > 0;

    return (
      <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px]">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border/40 bg-[#252535] shrink-0 flex-wrap gap-y-1">
          {/* Phase indicators */}
          <div className="flex items-center gap-1">
            {PHASES.map((p, i) => (
              <div
                key={p.key}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  i === currentPhaseIdx
                    ? `bg-secondary ${p.color}`
                    : i < currentPhaseIdx
                      ? "text-emerald-400"
                      : "text-muted-foreground"
                }`}
              >
                {i < currentPhaseIdx ? (
                  <CheckCircle2 size={10} />
                ) : (
                  <span>{p.shortLabel}</span>
                )}
                <span className="hidden sm:inline">
                  {i === currentPhaseIdx ? p.label : ""}
                </span>
              </div>
            ))}
          </div>

          <Separator orientation="vertical" className="h-4 hidden sm:block" />

          {/* Problem title */}
          <span className="text-xs font-medium text-muted-foreground hidden sm:block">
            {currentProblem.title}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Timer */}
            <PhaseTimer
              totalSeconds={(currentPhaseData.minutes ?? 20) * 60}
              running={timerRunning}
              onTick={handleTick}
            />

            {/* TDD Mode toggle — Phase 1 only */}
            {currentPhaseIdx === 0 && (
              <Button
                variant={tddMode ? "default" : "outline"}
                size="sm"
                className={`text-xs h-7 gap-1 hidden sm:flex ${
                  tddMode
                    ? "bg-violet-600 hover:bg-violet-700 text-white border-0"
                    : ""
                }`}
                onClick={() => {
                  setTddMode(m => !m);
                  setTddCodeRevealed(false);
                  if (!tddMode)
                    toast.info(
                      "TDD Mode ON — code is hidden. Diagnose the bug from failing tests only.",
                      { duration: 4000 }
                    );
                }}
                title="TDD Mode: hide code, diagnose from failing tests only"
              >
                {tddMode ? <EyeOff size={11} /> : <Eye size={11} />}
                TDD
              </Button>
            )}

            {/* Self-assessment */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 hidden sm:flex"
              onClick={() => {
                const note = window.prompt(
                  "Quick self-assessment (optional, helps AI scoring):"
                );
                if (note) setSelfAssessment(note);
              }}
            >
              Note
            </Button>

            {/* End phase */}
            <Button
              size="sm"
              className="text-xs h-7 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEndPhase}
              disabled={scorePhaseMutation.isPending}
            >
              {scorePhaseMutation.isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : currentPhaseIdx < 2 ? (
                <>
                  End Phase <ChevronRight size={11} />
                </>
              ) : (
                <>
                  Finish <Trophy size={11} />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions bar */}
        <div className="px-3 py-2 bg-[#1a1a2e] border-b border-border/40 shrink-0">
          <div className="flex items-start gap-2">
            <BookOpen size={12} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-blue-300 font-medium">Instructions: </span>
              {currentPhaseData.instructions}
            </p>
          </div>
          {(currentPhaseData as { failingTests?: string[] }).failingTests && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(
                currentPhaseData as { failingTests: string[] }
              ).failingTests.map((t, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3-panel layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* File explorer — 12% */}
          {hasFiles && (
            <div className="w-32 shrink-0">
              <FileExplorer
                files={phaseFiles}
                activeFile={activeFile}
                onSelect={name => {
                  setActiveFile(name);
                  setFileContents(prev => ({ ...prev }));
                }}
              />
            </div>
          )}

          {/* Code editor — ~55% */}
          <div
            className={`flex-1 overflow-hidden ${!hasFiles ? "opacity-60" : ""}`}
          >
            {/* TDD Mode overlay: hide code, show only failing tests */}
            {tddMode && !tddCodeRevealed && currentPhaseIdx === 0 ? (
              <div className="h-full flex flex-col bg-[#1e1e2e]">
                <div className="px-4 py-3 border-b border-violet-500/30 bg-violet-500/10 flex items-center gap-2">
                  <EyeOff size={13} className="text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">
                    TDD Mode — Code Hidden
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto text-xs h-6 gap-1 border-violet-500/40 text-violet-300 hover:text-violet-200"
                    onClick={() => setTddCodeRevealed(true)}
                  >
                    <Eye size={10} />
                    Reveal Code
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Diagnose the bug from the failing tests below. Write your
                    hypothesis in the AI chat before revealing the code.
                  </p>
                  {(
                    currentPhaseData as { failingTests?: string[] }
                  ).failingTests?.map((t, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 font-mono text-[11px] text-red-300"
                    >
                      <div className="text-red-400 font-bold mb-1">✕ FAIL</div>
                      {t}
                    </div>
                  )) ?? (
                    <p className="text-muted-foreground text-xs">
                      No failing tests available for this phase.
                    </p>
                  )}
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-[11px] text-muted-foreground">
                    <p className="font-semibold text-violet-300 mb-1">
                      💡 TDD Challenge
                    </p>
                    <p>
                      Before revealing the code, ask the AI: "Based on these
                      failing tests, what type of bug am I likely looking for?"
                      Then form your hypothesis and reveal the code to confirm.
                    </p>
                  </div>
                </div>
              </div>
            ) : hasFiles && activeFile ? (
              <>
                {tddMode && tddCodeRevealed && (
                  <div className="px-3 py-1.5 bg-violet-500/10 border-b border-violet-500/20 flex items-center gap-2">
                    <Eye size={10} className="text-violet-400" />
                    <span className="text-[10px] text-violet-300">
                      TDD Mode — Code Revealed
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-[10px] h-5 px-2 text-violet-400 hover:text-violet-300"
                      onClick={() => setTddCodeRevealed(false)}
                    >
                      Hide again
                    </Button>
                  </div>
                )}
                <CodeEditor
                  key={activeFile}
                  filename={activeFile}
                  value={fileContents[activeFile] ?? ""}
                  onChange={val =>
                    setFileContents(prev => ({ ...prev, [activeFile]: val }))
                  }
                  readOnly={activeFile.startsWith("test_")}
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm bg-[#1e1e2e]">
                <div className="text-center space-y-2">
                  <FileCode
                    size={32}
                    className="mx-auto text-muted-foreground"
                  />
                  <p>No starter files for this phase.</p>
                  <p className="text-xs">
                    Build on your Phase 2 implementation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI chat — ~33% */}
          <div className="w-72 shrink-0">
            <AIChatPanel
              problemId={selectedProblemId}
              phase={currentPhase.key}
              codeContext={fileContents[activeFile] ?? ""}
              messages={chatMessages}
              onMessage={handleAddMessage}
              phaseMessageCount={phaseMessageCount}
              onBudgetExhausted={handleBudgetExhausted}
            />
          </div>
        </div>

        {/* Phase scoring overlay */}
        {scoringPhase !== null && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 size={32} className="animate-spin text-blue-400" />
              <p className="font-semibold">
                Scoring {PHASES[scoringPhase].label}...
              </p>
              <p className="text-sm text-muted-foreground">
                AI interviewer is reviewing your code
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Debrief ─────────────────────────────────────────────────────────
  if (view === "debrief") {
    const debrief = sessionDebrief as Record<string, unknown> | null;

    return (
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-sm font-medium">
            <Trophy size={14} className="text-amber-400" />
            Interview Complete
          </div>
          <h2 className="text-2xl font-bold">{currentProblem?.title}</h2>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>{Math.round(totalElapsed / 60)} min total</span>
            <span>·</span>
            <span>{totalAiMessages} AI messages</span>
            <span>·</span>
            <span>{phaseScores.filter(Boolean).length}/3 phases scored</span>
          </div>
        </div>

        {/* Overall verdict */}
        {debrief ? (
          <div className="border border-border rounded-xl p-5 text-center space-y-3">
            <div
              className={`text-2xl font-bold ${
                VERDICT_COLOR[(debrief.overallVerdict as string) ?? ""] ??
                "text-foreground"
              }`}
            >
              {debrief.overallVerdict as string}
            </div>
            <div className="text-sm text-muted-foreground">
              {debrief.hiringRecommendation as string}
            </div>
            <div className="text-xs text-muted-foreground">
              Level Assessment: {debrief.levelAssessment as string}
            </div>
            <Separator />
            <p className="text-sm">{debrief.executiveSummary as string}</p>

            {/* Dimension scores */}
            {debrief.dimensionScores ? (
              <div className="grid grid-cols-2 gap-3 text-left mt-2">
                {Object.entries(
                  debrief.dimensionScores as unknown as Record<string, number>
                ).map(([dim, val]: [string, number]) => (
                  <div key={dim} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">
                        {dim.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-mono font-bold">{val}/4</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          val >= 3.5
                            ? "bg-emerald-400"
                            : val >= 2.5
                              ? "bg-blue-400"
                              : val >= 1.5
                                ? "bg-amber-400"
                                : "bg-red-400"
                        }`}
                        style={{ width: `${(val / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* AI collaboration */}
            <div className="text-xs text-left bg-secondary/40 rounded-lg p-3">
              <span className="font-semibold text-blue-400">
                AI Collaboration:{" "}
              </span>
              {debrief.aiCollaborationScore as string}
            </div>

            {/* Strengths & gaps */}
            <div className="grid grid-cols-2 gap-3 text-left text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Top Strengths
                </p>
                {(debrief.topStrengths as string[]).map((s, i) => (
                  <p key={i} className="text-muted-foreground">
                    • {s}
                  </p>
                ))}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-amber-400 flex items-center gap-1">
                  <Zap size={11} /> Critical Gaps
                </p>
                {(debrief.criticalGaps as string[]).map((g, i) => (
                  <p key={i} className="text-muted-foreground">
                    • {g}
                  </p>
                ))}
              </div>
            </div>

            {/* Next steps */}
            {(debrief.nextSteps as string[]).length > 0 && (
              <div className="text-left text-xs space-y-1">
                <p className="font-semibold text-blue-400">Next Steps</p>
                {(debrief.nextSteps as string[]).map((s, i) => (
                  <p key={i} className="text-muted-foreground">
                    → {s}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 justify-center py-8 text-muted-foreground text-sm">
            <Loader2 size={18} className="animate-spin text-blue-400" />
            Generating full debrief...
          </div>
        )}

        {/* Per-phase scores */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Phase Breakdown</h3>
          {PHASES.map((p, i) => (
            <PhaseScoreCard
              key={p.key}
              phaseLabel={p.label}
              score={phaseScores[i]}
              loading={scoringPhase === i}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setView("select");
              setSelectedProblemId("");
            }}
          >
            <RotateCcw size={14} />
            New Mock
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setView("history")}
          >
            <History size={14} />
            View History
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
