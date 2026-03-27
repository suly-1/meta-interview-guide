// DeployStatusBadge — shows the live GitHub Actions deployment status
// in the footer. Polls every 30 seconds.
//
// Visual states:
//   ✅ green  — status=success
//   🟡 yellow — status=in_progress
//   ❌ red    — status=failure
//   ⬜ grey   — unknown / API error

import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, XCircle, HelpCircle } from "lucide-react";

export default function DeployStatusBadge() {
  const { data, isLoading, isError } = trpc.deployStatus.get.useQuery(
    undefined,
    {
      refetchInterval: 30_000, // poll every 30 s
      staleTime: 20_000,
    }
  );

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
        <Loader2 size={10} className="animate-spin" />
        Checking deploy…
      </span>
    );
  }

  if (isError || !data || data.status === "unknown") {
    return (
      <a
        href="https://metaengguide.pro"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        title="Deploy status unknown"
      >
        <HelpCircle size={10} />
        Deploy status unknown
      </a>
    );
  }

  const config = {
    success: {
      icon: <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />,
      label: "Deployed",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Last deploy succeeded",
    },
    in_progress: {
      icon: (
        <Loader2 size={11} className="animate-spin text-amber-900 shrink-0" />
      ),
      label: "Deploying…",
      color: "text-amber-900",
      bg: "bg-amber-500/10 border-amber-500/20",
      title: "Deployment in progress",
    },
    failure: {
      icon: <XCircle size={11} className="text-rose-400 shrink-0" />,
      label: "Deploy failed",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      title: "Last deploy failed",
    },
    unknown: {
      icon: (
        <HelpCircle size={11} className="text-muted-foreground/40 shrink-0" />
      ),
      label: "Unknown",
      color: "text-muted-foreground/40",
      bg: "bg-muted/10 border-border/30",
      title: "Deploy status unknown",
    },
  } as const;

  const c = config[data.status as keyof typeof config] ?? config.unknown;

  return (
    <a
      href={data.url ?? "https://metaengguide.pro"}
      target="_blank"
      rel="noopener noreferrer"
      title={c.title}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-opacity hover:opacity-80 ${c.bg} ${c.color}`}
    >
      {c.icon}
      {c.label}
    </a>
  );
}
