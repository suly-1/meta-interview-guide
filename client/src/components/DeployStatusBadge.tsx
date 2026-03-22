import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, XCircle, HelpCircle, RefreshCw } from "lucide-react";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DeployStatusBadge() {
  const utils = trpc.useUtils();

  const { data, isLoading, isFetching } = trpc.deployStatus.get.useQuery(undefined, {
    refetchInterval: 30_000,   // poll every 30 seconds
    staleTime: 20_000,
  });

  const status = data?.status ?? "unknown";

  const config = {
    success: {
      icon: <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />,
      label: "Deployed",
      pill: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300",
      dot: "bg-emerald-400",
    },
    in_progress: {
      icon: <Loader2 size={13} className="text-yellow-400 animate-spin flex-shrink-0" />,
      label: "Deploying…",
      pill: "bg-yellow-900/40 border-yellow-700/50 text-yellow-300",
      dot: "bg-yellow-400 animate-pulse",
    },
    failure: {
      icon: <XCircle size={13} className="text-red-400 flex-shrink-0" />,
      label: "Deploy failed",
      pill: "bg-red-900/40 border-red-700/50 text-red-300",
      dot: "bg-red-400",
    },
    unknown: {
      icon: <HelpCircle size={13} className="text-gray-400 flex-shrink-0" />,
      label: "Status unknown",
      pill: "bg-gray-800/40 border-gray-600/50 text-gray-400",
      dot: "bg-gray-500",
    },
  } as const;

  const cfg = config[status as keyof typeof config] ?? config.unknown;
  const ago = timeAgo(data?.updatedAt ?? null);

  return (
    <a
      href={data?.url ?? "https://github.com/suly-1/meta-interview-guide/actions"}
      target="_blank"
      rel="noopener noreferrer"
      title={`GitHub Actions: ${status}${ago ? ` · ${ago}` : ""}\nClick to view workflow runs`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-opacity hover:opacity-80 select-none ${cfg.pill}`}
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <Loader2 size={13} className="text-gray-400 animate-spin flex-shrink-0" />
      ) : (
        cfg.icon
      )}
      <span>
        {isLoading ? "Checking…" : cfg.label}
        {ago && !isLoading && (
          <span className="opacity-60 ml-1">· {ago}</span>
        )}
      </span>
      {/* Manual refresh button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void utils.deployStatus.get.invalidate();
        }}
        title="Refresh status"
        className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
      >
        <RefreshCw size={10} className={isFetching ? "animate-spin" : ""} />
      </button>
    </a>
  );
}
