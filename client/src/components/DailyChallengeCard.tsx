// DailyChallengeCard — Daily Interview Challenge with 24h expiry + leaderboard
// One question per category (System Design, Coding, Behavioral) per day
// Scores persist to DB; leaderboard shows anonymized rankings
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  CheckCircle2,
  Lock,
  Zap,
  Trophy,
} from "lucide-react";

const CATEGORY_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  "system-design": {
    label: "System Design",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  coding: {
    label: "Coding",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  behavioral: {
    label: "Behavioral",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-blue-500"
        : score >= 40
          ? "bg-amber-500"
          : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-foreground w-8 text-right">
        {score}
      </span>
    </div>
  );
}

function CategoryChallenge({
  category,
  question,
  alreadySubmitted,
  submittedScore,
  onSubmit,
  isSubmitting,
}: {
  category: string;
  question: { id: string; title: string; prompt: string };
  alreadySubmitted: boolean;
  submittedScore?: number;
  onSubmit: (category: string, answer: string) => void;
  isSubmitting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const meta = CATEGORY_LABELS[category];

  return (
    <div className={`rounded-xl border p-4 ${meta.bg} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}
            >
              {meta.label}
            </span>
            {alreadySubmitted && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 size={12} /> Submitted
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-foreground">
            {question.title}
          </div>
        </div>
        {alreadySubmitted && submittedScore !== undefined ? (
          <div className="shrink-0 text-right">
            <div
              className={`text-2xl font-black ${submittedScore >= 80 ? "text-emerald-400" : submittedScore >= 60 ? "text-blue-400" : "text-amber-400"}`}
            >
              {submittedScore}
            </div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
        ) : (
          <button
            onClick={() => setExpanded(e => !e)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {alreadySubmitted && submittedScore !== undefined && (
        <div className="mt-2">
          <ScoreBar score={submittedScore} />
        </div>
      )}

      {!alreadySubmitted && expanded && (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-muted-foreground leading-relaxed bg-black/20 rounded-lg p-3 border border-white/5">
            {question.prompt}
          </div>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write your answer here... (min 50 characters)"
            className="w-full h-32 text-sm bg-black/30 border border-white/10 rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${answer.length < 50 ? "text-red-400" : "text-muted-foreground"}`}
            >
              {answer.length} / 50 min chars
            </span>
            <button
              onClick={() => onSubmit(category, answer)}
              disabled={answer.length < 50 || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Submit for Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Leaderboard({
  data,
}: {
  data: Array<{ category: string; score: number; rank: number }>;
}) {
  const [open, setOpen] = useState(false);

  // Group by category
  const grouped: Record<string, Array<{ rank: number; score: number }>> = {};
  for (const row of data) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push({ rank: row.rank, score: row.score });
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Trophy size={14} className="text-amber-400" />
        Today&apos;s Leaderboard
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {Object.entries(grouped).map(([cat, rows]) => {
            const meta = CATEGORY_LABELS[cat];
            if (!rows.length || !meta) return null;
            return (
              <div key={cat}>
                <div className={`text-xs font-semibold mb-1 ${meta.color}`}>
                  {meta.label}
                </div>
                <div className="space-y-1">
                  {rows.slice(0, 5).map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-white/5"
                    >
                      <span className="w-4 text-center font-bold text-muted-foreground">
                        #{row.rank}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-white/30"
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                      <span className="font-semibold w-6 text-right text-muted-foreground">
                        {row.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DailyChallengeCard() {
  const { data, isLoading, refetch } =
    trpc.engagement.getDailyChallenge.useQuery(undefined, {
      retry: false,
    });
  const { data: leaderboardData } =
    trpc.engagement.getDailyLeaderboard.useQuery(
      {},
      {
        retry: false,
      }
    );
  const submitMutation = trpc.engagement.submitDailyChallenge.useMutation({
    onSuccess: result => {
      toast.success(
        `Score: ${result.score}/100 — ${result.feedback.slice(0, 80)}...`
      );
      refetch();
    },
    onError: err => {
      toast.error(err.message || "Submission failed");
    },
  });

  const [submittingCategory, setSubmittingCategory] = useState<string | null>(
    null
  );

  function handleSubmit(category: string, answer: string) {
    setSubmittingCategory(category);
    submitMutation.mutate(
      {
        category: category as "system-design" | "coding" | "behavioral",
        answer,
      },
      { onSettled: () => setSubmittingCategory(null) }
    );
  }

  // Time until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / 3600000);
  const minsLeft = Math.floor(
    ((midnight.getTime() - now.getTime()) % 3600000) / 60000
  );

  // Flatten leaderboard from grouped format
  const flatLeaderboard: Array<{
    category: string;
    score: number;
    rank: number;
  }> = [];
  if (leaderboardData) {
    for (const [cat, rows] of Object.entries(
      leaderboardData as Record<string, Array<{ rank: number; score: number }>>
    )) {
      for (const row of rows) {
        flatLeaderboard.push({ category: cat, ...row });
      }
    }
  }

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Zap size={16} className="text-amber-400" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">
              Daily Challenge
            </div>
            <div className="text-xs text-muted-foreground">
              3 questions · resets at midnight
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={12} />
          {hoursLeft}h {minsLeft}m left
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Lock size={14} />
          Sign in to access daily challenges
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {(["system-design", "coding", "behavioral"] as const).map(cat => (
              <CategoryChallenge
                key={cat}
                category={cat}
                question={data.questions[cat]}
                alreadySubmitted={cat in data.submitted}
                submittedScore={data.submitted[cat]}
                onSubmit={handleSubmit}
                isSubmitting={
                  submittingCategory === cat && submitMutation.isPending
                }
              />
            ))}
          </div>
          {flatLeaderboard.length > 0 && <Leaderboard data={flatLeaderboard} />}
        </>
      )}
    </div>
  );
}
