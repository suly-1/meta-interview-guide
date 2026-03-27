/**
 * VersionUpdateToast
 *
 * Silently polls /api/version every 60 seconds. When the build hash changes
 * (i.e. a new checkpoint has been published), a subtle top-right toast appears
 * for 5 seconds and then auto-dismisses. No inbox notification, no email.
 */
import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 60_000;
const TOAST_DURATION_MS = 5_000;

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
  const baselineRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Capture the hash on first mount — this is the "current" version
    fetchBuildHash().then(hash => {
      baselineRef.current = hash;
    });

    const interval = setInterval(async () => {
      const latest = await fetchBuildHash();
      if (!latest) return;

      if (baselineRef.current === null) {
        // First successful fetch — set baseline silently
        baselineRef.current = latest;
        return;
      }

      if (latest !== baselineRef.current) {
        // New version detected — update baseline and show toast
        baselineRef.current = latest;
        setBuildTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setVisible(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, TOAST_DURATION_MS);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded-lg border border-violet-500/30 bg-[#0d0f1a]/90 px-3 py-2 shadow-lg backdrop-blur-sm"
      style={{ animation: "fadeInDown 0.25s ease" }}
    >
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <span className="text-violet-400 text-xs font-semibold tracking-wide">
        ✦ Updated
      </span>
      <span className="text-muted-foreground text-xs">{buildTime}</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-1 text-muted-foreground hover:text-foreground text-xs leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
