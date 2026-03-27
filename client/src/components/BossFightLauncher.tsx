// BossFightLauncher — The Boss Fight: 45-min end-to-end mock with "The Architect"
// Unlocks at 30-day streak OR all 18 drills completed
// Multi-turn AI conversation simulating a brutal Meta L6/L7 interview
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Sword,
  Loader2,
  Lock,
  ChevronRight,
  Send,
  Trophy,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";

const TOPIC_OPTIONS = [
  "Design a distributed notification system for 500M users",
  "Design a real-time collaborative document editor (like Google Docs)",
  "Design a ride-sharing backend (like Uber)",
  "Design a video streaming platform (like YouTube)",
  "Design a social feed ranking system (like Facebook News Feed)",
];

interface TranscriptEntry {
  role: "architect" | "candidate";
  content: string;
  timestamp: number;
  personaMode?: string;
}

function MessageBubble({ entry }: { entry: TranscriptEntry }) {
  const isCandidate = entry.role === "candidate";
  return (
    <div className={`flex gap-3 ${isCandidate ? "flex-row-reverse" : ""}`}>
      {!isCandidate && (
        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-black text-red-400">A</span>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isCandidate
            ? "bg-blue-600/20 border border-blue-500/20 text-foreground"
            : "bg-red-500/10 border border-red-500/20 text-foreground"
        }`}
      >
        {typeof entry.content === "string"
          ? entry.content
          : JSON.stringify(entry.content)}
      </div>
    </div>
  );
}

function ScoreCard({
  result,
}: {
  result: {
    verdict: string;
    overallScore: number;
    summaryFeedback: string;
    scoreBreakdown: {
      systemDesign: number;
      coding: number;
      behavioral: number;
      resilience: number;
      communication: number;
    };
  };
}) {
  const { verdict, overallScore, summaryFeedback, scoreBreakdown } = result;
  const grade =
    overallScore >= 85
      ? {
          label: "Exceptional — L7 Caliber",
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
        }
      : overallScore >= 70
        ? {
            label: "Strong — L6 Pass",
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          }
        : overallScore >= 55
          ? {
              label: "Borderline — Needs Work",
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            }
          : {
              label: "Not Ready — Keep Drilling",
              color: "text-red-400",
              bg: "bg-red-500/10 border-red-500/20",
            };

  return (
    <div className={`rounded-xl border p-5 ${grade.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <Trophy size={20} className={grade.color} />
        <div>
          <div className={`font-black text-2xl ${grade.color}`}>
            {overallScore}/100
          </div>
          <div className={`text-sm font-semibold ${grade.color}`}>
            {grade.label} · {verdict}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Object.entries(scoreBreakdown).map(([key, val]) => (
          <div key={key} className="text-center">
            <div
              className={`text-lg font-black ${(val as number) >= 70 ? "text-emerald-400" : "text-amber-400"}`}
            >
              {val as number}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {summaryFeedback}
      </div>
    </div>
  );
}

export function BossFightLauncher({ unlocked }: { unlocked: boolean }) {
  const [phase, setPhase] = useState<"idle" | "topic" | "active" | "done">(
    "idle"
  );
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_OPTIONS[0]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finalResult, setFinalResult] = useState<{
    verdict: string;
    overallScore: number;
    summaryFeedback: string;
    scoreBreakdown: {
      systemDesign: number;
      coding: number;
      behavioral: number;
      resilience: number;
      communication: number;
    };
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: history } = trpc.engagement.getBossFightHistory.useQuery(
    undefined,
    { retry: false }
  );

  const startMutation = trpc.engagement.startBossFight.useMutation({
    onSuccess: data => {
      const opening =
        typeof data.opening === "string"
          ? data.opening
          : JSON.stringify(data.opening);
      setTranscript([
        { role: "architect", content: opening, timestamp: Date.now() },
      ]);
      setStartTime(Date.now());
      setPhase("active");
    },
    onError: err => toast.error(err.message),
  });

  const continueMutation = trpc.engagement.continueBossFight.useMutation({
    onSuccess: data => {
      const response =
        typeof data.architectResponse === "string"
          ? data.architectResponse
          : JSON.stringify(data.architectResponse);
      setTranscript(prev => [
        ...prev,
        {
          role: "architect",
          content: response,
          timestamp: Date.now(),
          personaMode: data.personaMode,
        },
      ]);
    },
    onError: err => toast.error(err.message),
  });

  const finishMutation = trpc.engagement.finishBossFight.useMutation({
    onSuccess: data => {
      setFinalResult({
        verdict: data.verdict,
        overallScore: data.overallScore,
        summaryFeedback: data.summaryFeedback,
        scoreBreakdown: data.scoreBreakdown as {
          systemDesign: number;
          coding: number;
          behavioral: number;
          resilience: number;
          communication: number;
        },
      });
      setPhase("done");
    },
    onError: err => toast.error(err.message),
  });

  function handleStart() {
    startMutation.mutate({ topic: selectedTopic });
  }

  function handleSend() {
    if (!userInput.trim()) return;
    const candidateEntry: TranscriptEntry = {
      role: "candidate",
      content: userInput,
      timestamp: Date.now(),
    };
    const newTranscript = [...transcript, candidateEntry];
    setTranscript(newTranscript);
    setUserInput("");
    const elapsedMinutes = startTime
      ? Math.floor((Date.now() - startTime) / 60000)
      : 0;
    continueMutation.mutate({
      transcript: newTranscript,
      candidateResponse: userInput,
      elapsedMinutes,
    });
  }

  function handleFinish() {
    finishMutation.mutate({
      transcript,
      topic: selectedTopic,
    });
  }

  const elapsedDisplay = startTime
    ? (() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      })()
    : "0:00";

  if (!unlocked) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Lock size={18} className="text-red-400/50" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">
              The Boss Fight
            </div>
            <div className="text-xs text-muted-foreground">
              45-min end-to-end mock with The Architect
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-black/20 rounded-lg p-3 border border-white/5">
          <div className="font-semibold text-foreground mb-1">
            Unlock Requirements:
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Maintain a 30-day practice streak, OR
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Complete all 18 drills in the Failure Analysis hub
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Topic selection phase
  if (phase === "idle" || phase === "topic") {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <Sword size={18} className="text-red-400" />
          </div>
          <div>
            <div className="font-bold text-foreground">The Boss Fight</div>
            <div className="text-xs text-muted-foreground">
              45-min end-to-end mock · The Architect persona
            </div>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-muted-foreground leading-relaxed">
          <div className="font-semibold text-red-400 mb-2">
            ⚔️ The Architect awaits
          </div>
          <p>
            Meta&apos;s most demanding L7 interviewer. No hints. No
            hand-holding. Probes every vague answer. Will end the session early
            if you&apos;re not L6+ caliber.
          </p>
        </div>

        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Choose your topic:
          </div>
          <div className="space-y-2">
            {TOPIC_OPTIONS.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                  selectedTopic === topic
                    ? "bg-red-500/15 border-red-500/30 text-red-300"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {history && history.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trophy size={12} className="text-amber-400" />
              Past attempts ({history.length})
              <ChevronRight
                size={12}
                className={`transition-transform ${showHistory ? "rotate-90" : ""}`}
              />
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1">
                {history
                  .slice(0, 5)
                  .map(
                    (h: {
                      id: number;
                      overallScore: number;
                      verdict: string;
                      completedAt: Date;
                    }) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1 bg-white/5 rounded"
                      >
                        <span
                          className={`font-bold ${h.overallScore >= 70 ? "text-emerald-400" : "text-amber-400"}`}
                        >
                          {h.overallScore}/100
                        </span>
                        <span className="text-muted-foreground">
                          {h.verdict}
                        </span>
                        <span>
                          {new Date(h.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )
                  )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={startMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold transition-colors"
        >
          {startMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sword size={16} />
          )}
          Enter the Boss Fight
        </button>
      </div>
    );
  }

  // Active session
  if (phase === "active") {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Sword size={16} className="text-red-400" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">
                Boss Fight — Active
              </div>
              <div className="text-xs text-muted-foreground">
                {elapsedDisplay} elapsed · {transcript.length} turns
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              45 min limit
            </div>
            <button
              onClick={handleFinish}
              disabled={finishMutation.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              {finishMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trophy size={12} />
              )}
              End & Score
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
          {transcript.map((entry, i) => (
            <MessageBubble key={i} entry={entry} />
          ))}
          {continueMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-red-400">A</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <Loader2 size={14} className="animate-spin text-red-400" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Your answer... (Enter to send, Shift+Enter for newline)"
            className="flex-1 h-20 text-sm bg-black/30 border border-white/10 rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!userInput.trim() || continueMutation.isPending}
            className="self-end px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Score card after session
  if (phase === "done" && finalResult) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Sword size={16} className="text-red-400" />
          </div>
          <div className="font-bold text-foreground text-sm">
            Boss Fight Complete
          </div>
        </div>
        <ScoreCard result={finalResult} />
        <button
          onClick={() => {
            setPhase("idle");
            setTranscript([]);
            setFinalResult(null);
          }}
          className="mt-4 flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <RefreshCw size={14} />
          Challenge Again
        </button>
      </div>
    );
  }

  return null;
}
