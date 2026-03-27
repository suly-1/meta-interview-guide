// ComebackPlanCard — Comeback Arc: personalized recovery plans for scores < 50
// Triggered when a user scores below 50 on any drill
// AI generates a targeted 5-step recovery plan with specific drills to retry
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";

interface ComebackStep {
  title: string;
  description: string;
  drillToRun?: string | null;
}

interface ComebackPlanResult {
  planId: number;
  steps: ComebackStep[];
  predictedScore: number;
  coachNote: string;
}

function StepItem({ step, index }: { step: ComebackStep; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <div className="flex items-start gap-3 p-3">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-amber-400">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-foreground">
              {step.title}
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          {step.drillToRun && (
            <span className="text-xs text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5 mt-1 inline-block">
              {step.drillToRun}
            </span>
          )}
          {expanded && (
            <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {step.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ComebackPlanCard({
  triggerScore,
  weakArea,
  drillId,
}: {
  triggerScore?: number;
  weakArea?: string;
  drillId?: string;
}) {
  const [activePlan, setActivePlan] = useState<ComebackPlanResult | null>(null);

  const generateMutation = trpc.engagement.generateComebackPlan.useMutation({
    onSuccess: data => {
      setActivePlan(data);
      toast.success("Comeback plan generated! Time to turn this around.");
    },
    onError: err => toast.error(err.message),
  });

  // Only show if score < 50
  if (triggerScore === undefined || triggerScore >= 50) {
    return null;
  }

  if (activePlan) {
    return (
      <div className="prep-card p-5 border-amber-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">
                Comeback Arc
              </div>
              <div className="text-xs text-muted-foreground">
                Predicted score after plan: {activePlan.predictedScore}/100
              </div>
            </div>
          </div>
        </div>

        {activePlan.coachNote && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-3 leading-relaxed">
            💬 {activePlan.coachNote}
          </div>
        )}

        <div className="space-y-2">
          {activePlan.steps.map((step, i) => (
            <StepItem key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5 border-amber-500/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center">
          <TrendingUp size={18} className="text-amber-400" />
        </div>
        <div>
          <div className="font-bold text-foreground text-sm">Comeback Arc</div>
          <div className="text-xs text-muted-foreground">
            Score {triggerScore}/100 — Let&apos;s fix this
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Your score of{" "}
        <span className="text-amber-400 font-semibold">{triggerScore}/100</span>{" "}
        in{" "}
        <span className="text-foreground font-semibold">
          {weakArea ?? "this area"}
        </span>{" "}
        signals a gap. Generate a personalized 5-step recovery plan to get back
        on track.
      </div>
      <button
        onClick={() =>
          generateMutation.mutate({
            drillId: drillId ?? "general",
            drillName: weakArea ?? "General Practice",
            score: triggerScore,
            weakAreas: [weakArea ?? "general"],
          })
        }
        disabled={generateMutation.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
      >
        {generateMutation.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Target size={14} />
        )}
        Generate My Comeback Plan
      </button>
    </div>
  );
}
