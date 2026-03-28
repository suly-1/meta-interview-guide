/**
 * VersionUpdateToast
 *
 * Silently polls /api/version every 60 seconds. When the build hash changes
 * (i.e. a new checkpoint has been published), a subtle top-right toast appears
 * for 10 seconds with a countdown progress bar, then auto-dismisses.
 * No browser permissions, no push notifications, no external links.
 */
import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

const POLL_INTERVAL_MS = 60_000;
const TOAST_DURATION_MS = 10_000;

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

export default function VersionUpdateToast() {
  const [visible, setVisible] = useState(false);
  const [buildTime, setBuildTime] = useState<string>("");
  const [progress, setProgress] = useState(100);
  const baselineRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const showToast = () => {
    setBuildTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
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

    // Auto-dismiss
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, TOAST_DURATION_MS);
  };

  useEffect(() => {
    // Capture the hash on first mount — this is the "current" version
    fetchBuildHash().then(hash => {
      baselineRef.current = hash;
    });

    const interval = setInterval(async () => {
      const latest = await fetchBuildHash();
      if (!latest) return;

      if (baselineRef.current === null) {
        baselineRef.current = latest;
        return;
      }

      if (latest !== baselineRef.current) {
        baselineRef.current = latest;
        showToast();
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
      className="fixed top-4 right-4 z-[9999] w-64 rounded-xl border border-blue-500/25 bg-card shadow-xl overflow-hidden"
      style={{ animation: "vut-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes vut-slide-in {
          from { opacity: 0; transform: translateX(20px) translateY(-4px); }
          to   { opacity: 1; transform: translateX(0)    translateY(0); }
        }
      `}</style>

      {/* Body */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <Sparkles size={13} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight">
            Site updated
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            New version deployed at {buildTime}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
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
