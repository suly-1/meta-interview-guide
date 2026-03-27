/**
 * SharedPlanView — public read-only page for shared sprint plans.
 * Accessible at /shared-plan/:token without login.
 */
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, Target, ChevronRight, ExternalLink } from "lucide-react";

const DOMAIN_COLORS: Record<string, string> = {
  "System Design": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "Coding":        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Behavioral":    "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-800",
  "All Domains":   "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export default function SharedPlanView() {
  const [, params] = useRoute("/shared-plan/:token");
  const token = params?.token ?? "";

  const { data: plan, isLoading, error } = trpc.sprintPlan.getByShareToken.useQuery(
    { shareToken: token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-700 dark:text-gray-300 text-sm">Loading sprint plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Plan not found</h1>
          <p className="text-gray-700 dark:text-gray-300 text-sm">This link may have expired or been removed. Plans expire after 30 days.</p>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all">
            <ExternalLink size={14} />
            Create your own plan
          </a>
        </div>
      </div>
    );
  }

  const days = (plan.planData as unknown as Record<string, unknown>[]) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Shared Sprint Plan</span>
            <span className="text-xs text-white/70">View only</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            7-Day Meta Interview Sprint
          </h1>
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            {plan.targetLevel && (
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
                <Target size={13} />
                Target: {plan.targetLevel}
              </div>
            )}
            {plan.focusPriority && (
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
                <ChevronRight size={13} />
                Focus: {plan.focusPriority}
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
              <Calendar size={13} />
              {days.length} days
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full">
              <Clock size={13} />
              Viewed {plan.viewCount} time{plan.viewCount !== 1 ? "s" : ""}
            </div>
          </div>
          {Array.isArray(plan.weakAreas) && plan.weakAreas.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-white/70 mb-2 font-semibold uppercase tracking-wider">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {(plan.weakAreas as string[]).map((area: string) => (
                  <span key={area} className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">{area}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Days */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {days.map((day: Record<string, unknown>, idx: number) => {
          const dayNum = (day.dayNumber as number) ?? idx + 1;
          const theme = (day.theme as string) ?? "";
          const tasks = (day.tasks as Record<string, string>[]) ?? [];
          const colorClass = DOMAIN_COLORS[theme] ?? DOMAIN_COLORS["All Domains"];
          return (
            <div key={dayNum} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  D{dayNum}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Day {dayNum}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass}`}>{theme}</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {tasks.map((task, ti) => (
                  <div key={ti} className="px-5 py-3 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {ti + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</p>
                        <span className="text-[10px] text-gray-600 dark:text-gray-200 font-mono">{task.duration}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{task.description}</p>
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold mt-1 inline-block">Tool: {task.tool}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA footer */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white text-center">
          <p className="font-bold text-lg mb-1">Want to build your own sprint plan?</p>
          <p className="text-sm text-white/80 mb-4">Free tool — no account required to start</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-all"
          >
            <ExternalLink size={14} />
            Go to Meta Interview Guide
          </a>
        </div>
      </div>
    </div>
  );
}
