/**
 * VersionUpdateToast
 *
 * Polls /api/version every 60 seconds. When the build hash changes (new
 * deployment detected), fetches /api/changelog for a human-readable update
 * message, then shows a top-right toast for 10 seconds with a countdown
 * progress bar. No browser permissions required.
 *
 * Upgrades over v1:
 * - Seen-hashes dedup: each hash is only shown once per session (stored in
 *   sessionStorage so it resets on tab close but not on soft navigation).
 * - Two action buttons: "View Changelog" (navigates to /changelog) and
 *   "Reload" (hard-reloads the page to pick up the new build).
 */
import { useEffect, useRef, useState } from "react";
import { Sparkles, X, RefreshCw, BookOpen } from "lucide-react";

const POLL_INTERVAL_MS = 60_000;
const TOAST_DURATION_MS = 10_000;
const SEEN_KEY = "vut_seen_hashes";

function getSeenHashes(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markHashSeen(hash: string): void {
  try {
    const seen = getSeenHashes();
    seen.add(hash);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

async function fetchBuildHash(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { hash?: string };
    return data.hash ?? null;
  } catch {
    return null;
  }
}

async function fetchChangelog(): Promise<string> {
  try {
    const res = await fetch("/api/changelog", { cache: "no-store" });
    if (!res.ok) return "New features and improvements deployed.";
    const data = (await res.json()) as { message?: string };
    return data.message ?? "New features and improvements deployed.";
  } catch {
    return "New features and improvements deployed.";
  }
}

export default function VersionUpdateToast() {
  const [visible, setVisible] = useState(false);
  const [buildTime, setBuildTime] = useState<string>("");
  const [changelogMsg, setChangelogMsg] = useState<string>("");
  const [progress, setProgress] = useState(100);
  const baselineRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const handleViewChangelog = () => {
    dismiss();
    window.location.href = "/changelog";
  };

  const handleReload = () => {
    dismiss();
    window.location.reload();
  };

  const showToast = async (hash: string) => {
    // Dedup: skip if this hash was already shown this session
    if (getSeenHashes().has(hash)) return;
    markHashSeen(hash);

    const msg = await fetchChangelog();
    setBuildTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    setChangelogMsg(msg);
    setProgress(100);
    setVisible(true);

    // Countdown progress bar — tick every 100ms
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (TOAST_DURATION_MS / 100);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        const next = p - step;
        if (next <= 0) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 0;
        }
        return next;
      });
    }, 100);

    // Auto-dismiss after 10 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, TOAST_DURATION_MS);
  };

  useEffect(() => {
    // Capture the hash on first mount — this is the "current" version
    fetchBuildHash().then(hash => {
      baselineRef.current = hash;
      // Also mark the initial hash as seen so we never show a toast for it
      if (hash) markHashSeen(hash);
    });

    const interval = setInterval(async () => {
      const latest = await fetchBuildHash();
      if (!latest) return;

      if (baselineRef.current === null) {
        baselineRef.current = latest;
        if (latest) markHashSeen(latest);
        return;
      }

      if (latest !== baselineRef.current) {
        baselineRef.current = latest;
        showToast(latest);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] w-80 rounded-xl border border-blue-500/25 bg-card shadow-xl overflow-hidden"
      style={{ animation: "vut-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes vut-slide-in {
          from { opacity: 0; transform: translateX(20px) translateY(-4px); }
          to   { opacity: 1; transform: translateX(0)    translateY(0); }
        }
      `}</style>

      {/* Body */}
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center mt-0.5">
          <Sparkles size={13} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground leading-tight">
              Site updated
            </p>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {buildTime}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">
            {changelogMsg}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <button
          onClick={handleViewChangelog}
          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          <BookOpen size={11} />
          View Changelog
        </button>
        <span className="text-muted-foreground/40 text-[11px]">·</span>
        <button
          onClick={handleReload}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={11} />
          Reload
        </button>
      </div>

      {/* Countdown progress bar */}
      <div className="h-0.5 bg-border w-full">
        <div
          className="h-full bg-blue-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
