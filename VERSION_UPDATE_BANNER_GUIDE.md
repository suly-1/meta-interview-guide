# Version Update Banner — Complete Replication Guide

> **What it does:** Every 60 seconds the browser silently polls `/api/version`. When a new deployment is detected (the build hash changes), a toast appears in the top-right corner for **10 seconds** with a live countdown progress bar and a human-readable changelog message. The user can dismiss it early with the ✕ button.

---

## How It Works — Architecture Overview

| Layer           | File                                           | Responsibility                                          |
| --------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Server endpoint | `server/_core/index.ts`                        | Exposes `/api/version` and `/api/changelog` REST routes |
| React component | `client/src/components/VersionUpdateToast.tsx` | Polls, detects change, renders the toast                |
| App mount point | `client/src/App.tsx`                           | Renders `<VersionUpdateToast />` once at the root       |
| Env variable    | `CHANGELOG_MESSAGE`                            | Controls the message shown in the toast                 |
| Env variable    | `VITE_BUILD_HASH` or `CHECKPOINT_VERSION`      | The unique hash per deployment                          |

The design is intentionally simple: no WebSockets, no service workers, no browser push permissions. A plain `setInterval` + `fetch` is all that is needed.

---

## Step 1 — Add the Two Server Endpoints

Open `server/_core/index.ts` (or whichever file registers your Express routes) and add the following two routes **before** the tRPC middleware and static-file handler:

```ts
// ── Version / Changelog endpoints ────────────────────────────────────────────
// BUILD_HASH is baked in at deploy time. Falls back to server start time so
// every cold-start produces a new hash even without a CI pipeline.
const BUILD_HASH =
  process.env.VITE_BUILD_HASH ??
  process.env.CHECKPOINT_VERSION ??
  Date.now().toString(36);

app.get("/api/version", (_req, res) => {
  res.json({ hash: BUILD_HASH });
});

// Update CHANGELOG_MESSAGE in your environment variables whenever you deploy
// a meaningful update. The frontend toast will display this string.
const CHANGELOG_MESSAGE =
  process.env.CHANGELOG_MESSAGE ?? "New features and improvements deployed.";

app.get("/api/changelog", (_req, res) => {
  res.json({ message: CHANGELOG_MESSAGE, hash: BUILD_HASH });
});
```

**Key points:**

- `BUILD_HASH` must be **different on every deployment**. On the Manus platform, `CHECKPOINT_VERSION` is injected automatically. On other platforms (Vercel, Railway, Render), set `VITE_BUILD_HASH` to `$VERCEL_GIT_COMMIT_SHA` or equivalent in your CI environment.
- `CHANGELOG_MESSAGE` is an optional environment variable. If absent, the toast shows the default fallback string.
- Both endpoints must respond with `Content-Type: application/json` (Express does this automatically with `res.json()`).

---

## Step 2 — Create the React Component

Create `client/src/components/VersionUpdateToast.tsx` with the following content. No external dependencies are required beyond `lucide-react` (already in the template).

```tsx
/**
 * VersionUpdateToast
 *
 * Polls /api/version every 60 seconds. When the build hash changes (new
 * deployment detected), fetches /api/changelog for a human-readable update
 * message, then shows a top-right toast for 10 seconds with a countdown
 * progress bar. No browser permissions required.
 */
import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

const POLL_INTERVAL_MS = 60_000; // how often to check for a new version
const TOAST_DURATION_MS = 10_000; // how long the toast stays visible

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

  const showToast = async () => {
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
    // Capture the hash on first mount — this is the "current" version baseline
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
      className="fixed top-4 right-4 z-[9999] w-72 rounded-xl border border-blue-500/25 bg-card shadow-xl overflow-hidden"
      style={{ animation: "vut-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes vut-slide-in {
          from { opacity: 0; transform: translateX(20px) translateY(-4px); }
          to   { opacity: 1; transform: translateX(0)    translateY(0); }
        }
      `}</style>

      {/* Body */}
      <div className="flex items-start gap-2.5 px-3 py-3">
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
```

---

## Step 3 — Mount the Component in App.tsx

Add the import and drop `<VersionUpdateToast />` inside your root layout, **outside** any route switch so it is always rendered regardless of the current page:

```tsx
// client/src/App.tsx
import VersionUpdateToast from "./components/VersionUpdateToast";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <VersionUpdateToast /> {/* ← add this line */}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

The component renders `null` when not visible, so there is zero DOM cost when idle.

---

## Step 4 — Set the Environment Variables

| Variable             | Where to set                    | Purpose                                                                                                     |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_BUILD_HASH`    | CI / deployment platform env    | Unique hash per build (e.g. git SHA). If absent, falls back to `CHECKPOINT_VERSION` then server start time. |
| `CHECKPOINT_VERSION` | Injected automatically on Manus | Same purpose as above — Manus sets this on every checkpoint publish.                                        |
| `CHANGELOG_MESSAGE`  | Deployment platform env         | Human-readable string shown in the toast. Update it before each deploy.                                     |

**Example for Vercel / Railway / Render:**

```
VITE_BUILD_HASH=$VERCEL_GIT_COMMIT_SHA
CHANGELOG_MESSAGE=Added Code Practice tab and real-time user tracking.
```

**On Manus:** No action needed. `CHECKPOINT_VERSION` is injected automatically on every publish, and `CHANGELOG_MESSAGE` can be set via the Secrets panel before publishing.

---

## Step 5 — How to Test It Locally

Because the hash is set at server start time, you can test the toast without deploying by temporarily changing the hash mid-session:

1. Open two terminal tabs.
2. In tab 1, start the dev server: `pnpm dev`
3. Open the site in the browser. The baseline hash is captured on page load.
4. In tab 2, restart the server: `Ctrl+C` then `pnpm dev` again.
5. Wait up to 60 seconds (the poll interval). The toast will appear because `Date.now().toString(36)` produces a new hash on every cold-start.

Alternatively, reduce `POLL_INTERVAL_MS` to `5_000` temporarily to speed up testing.

---

## Behaviour Summary

| Scenario                               | Result                                              |
| -------------------------------------- | --------------------------------------------------- |
| Page loads, hash matches               | Nothing shown                                       |
| New deployment detected (hash differs) | Toast slides in from top-right                      |
| Toast visible for 10 seconds           | Auto-dismisses, progress bar drains to 0            |
| User clicks ✕                          | Dismissed immediately                               |
| `/api/version` returns an error        | Silently ignored, no toast                          |
| `CHANGELOG_MESSAGE` not set            | Fallback: "New features and improvements deployed." |
| User is on the page during a deploy    | Toast appears within 60 seconds of the deploy       |

---

## Customisation Options

The following constants at the top of `VersionUpdateToast.tsx` can be adjusted without touching any other code:

```ts
const POLL_INTERVAL_MS = 60_000; // Change to 30_000 for faster detection
const TOAST_DURATION_MS = 10_000; // Change to 15_000 for a longer toast
```

To change the toast position from top-right to bottom-right, update the className:

```tsx
// top-right (default)
className = "fixed top-4 right-4 ...";

// bottom-right alternative
className = "fixed bottom-4 right-4 ...";
```

To change the accent colour from blue to any other Tailwind colour, replace all `blue-500` / `blue-400` occurrences with your preferred colour (e.g. `emerald-500` / `emerald-400`).

---

## Dependencies Required

| Package         | Already in template? | Notes                              |
| --------------- | -------------------- | ---------------------------------- |
| `lucide-react`  | Yes                  | Provides `Sparkles` and `X` icons  |
| `react` (hooks) | Yes                  | `useEffect`, `useRef`, `useState`  |
| Tailwind CSS    | Yes                  | All styling is utility-class based |

No additional packages need to be installed.

---

## Files Changed — Quick Reference

```
server/_core/index.ts                       ← Add /api/version and /api/changelog routes
client/src/components/VersionUpdateToast.tsx ← Create this file (full code above)
client/src/App.tsx                          ← Add import + <VersionUpdateToast />
```

Environment variables to configure before each deploy:

```
CHANGELOG_MESSAGE=<your update message>
VITE_BUILD_HASH=<git SHA or equivalent>   (not needed on Manus)
```
