/**
 * ReadinessTab — dedicated tab combining:
 * 1. Overall Readiness Dashboard (live in-page view)
 * 2. Recruiter-Ready Summary (printable one-page PDF)
 */
import { useRef, useMemo, useState, useEffect } from "react";
import { useDensity } from "@/contexts/DensityContext";
import { Printer, BarChart2, FileDown, ShieldCheck, Trophy, Zap, Target, ChevronRight, Dumbbell, CheckCircle2, AlertTriangle, Bell } from "lucide-react";
import OverallReadinessDashboard from "@/components/OverallReadinessDashboard";
import IC7SignalChecklist from "@/components/IC7SignalChecklist";
import ReadinessGoalSetter from "@/components/ReadinessGoalSetter";
import AchievementBadgeWall from "@/components/AchievementBadgeWall";
import XPStatsPanel from "@/components/XPStatsPanel";
import { useXPContext } from "@/contexts/XPContext";
import { PATTERNS, BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { computeReadiness } from "@/hooks/useReadinessScore";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";

const DRILL_KEY = "meta-guide-drill-ratings";
const CTCI_KEY  = "ctci_progress_v1";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

function RecruiterSummaryPrint() {
  const printRef = useRef<HTMLDivElement>(null);
  const { density } = useDensity();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=820,height=1160");
    if (!win) return;

    // Scale font sizes based on active density setting
    const scale = density === "compact" ? 0.875 : density === "spacious" ? 1.125 : 1;
    const baseFontPx = Math.round(12 * scale);
    const h1Px = Math.round(24 * scale);
    const h2Px = Math.round(11 * scale);
    const scoreNumPx = Math.round(52 * scale);
    const tagFontPx = Math.round(10 * scale);
    const rowFontPx = Math.round(11 * scale);
    const footerFontPx = Math.round(10 * scale);
    const bodyPadding = Math.round(36 * scale);
    const cardPadding = Math.round(12 * scale);
    const gridGap = Math.round(16 * scale);
    const gridGap3 = Math.round(12 * scale);
    const densityLabel = density === "compact" ? "Compact" : density === "spacious" ? "Spacious" : "Standard";

    win.document.write(`<!DOCTYPE html><html><head>
      <title>Interview Readiness Summary</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Space Grotesk',sans-serif;font-size:${baseFontPx}px;color:#1f2937;background:white;padding:${bodyPadding}px}
        h1{font-size:${h1Px}px;font-weight:800;color:#111827}
        h2{font-size:${h2Px}px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
        .score-num{font-size:${scoreNumPx}px;font-weight:800;line-height:1}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:${gridGap}px}
        .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:${gridGap3}px}
        .card{border:1px solid #e5e7eb;border-radius:8px;padding:${cardPadding}px}
        .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:${tagFontPx}px;font-weight:700;margin:2px}
        .green{background:#d1fae5;color:#065f46}
        .amber{background:#fef3c7;color:#92400e}
        .red{background:#fee2e2;color:#991b1b}
        .bar{height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-top:4px}
        .bar-fill{height:100%;border-radius:3px}
        .row{display:flex;justify-content:space-between;align-items:center;font-size:${rowFontPx}px;margin-bottom:6px}
        .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:${footerFontPx}px}
        .density-badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;background:#f3f4f6;color:#6b7280;margin-left:8px;vertical-align:middle}
        @media print{body{padding:20px}}
      </style>
    </head><body>${content.innerHTML}<div class="density-badge">${densityLabel} layout</div></body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // Compute all data
  const readiness = computeReadiness();
  const drillData = loadJSON<Record<string, { rating: number }[]>>(DRILL_KEY, {});
  const ctciData  = loadJSON<Record<number, { solved: boolean }>>(CTCI_KEY, {});

  const patternRatings = PATTERNS.map(p => {
    const entries = drillData[p.id] ?? [];
    const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : null;
    return { name: p.name, avg, attempts: entries.length };
  }).filter(p => p.avg !== null).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const strong   = patternRatings.slice(0, 3);
  const weak     = [...patternRatings].sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0)).slice(0, 3);
  const undrilled = PATTERNS.filter(p => !drillData[p.id]?.length).map(p => p.name);

  const ctciByDiff = ["Easy", "Medium", "Hard"].map(diff => {
    const total  = CTCI_PROBLEMS.filter(p => p.difficulty === diff).length;
    const solved = CTCI_PROBLEMS.filter(p => p.difficulty === diff && ctciData[p.id]?.solved).length;
    return { diff, total, solved };
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const scoreColor =
    readiness.total >= 75 ? "#10b981" :
    readiness.total >= 50 ? "#3b82f6" :
    readiness.total >= 30 ? "#f59e0b" : "#ef4444";

  const scoreLabel =
    readiness.total >= 75 ? "Strong" :
    readiness.total >= 50 ? "On Track" :
    readiness.total >= 30 ? "Developing" : "Early Stage";

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Recruiter-Ready Summary
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">One-page printable prep summary — ideal for the night before your interview</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      {/* Live preview card */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* Preview header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown size={14} className="text-slate-300" />
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Interview Readiness Summary
            </span>
          </div>
          <span className="text-xs text-slate-400">{today}</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Score + breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-5xl font-extrabold" style={{ color: scoreColor, fontFamily: "'Space Grotesk', sans-serif" }}>
                {readiness.total}
              </span>
              <span className="text-sm font-bold mt-1" style={{ color: scoreColor }}>{scoreLabel}</span>
              <span className="text-xs text-gray-400 mt-0.5">Overall Readiness Score</span>
            </div>
            <div className="space-y-2.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Score Breakdown</p>
              {[
                { label: "Quick Drill", value: readiness.drillScore, detail: readiness.drillAvg ? `${readiness.drillAvg.toFixed(1)}★` : "—", color: "bg-blue-500" },
                { label: "CTCI Solved", value: readiness.ctciScore, detail: `${readiness.ctciSolved}/${readiness.ctciTotal}`, color: "bg-violet-500" },
                { label: "Behavioral", value: readiness.behavioralScore, detail: readiness.behavioralAvg ? `${readiness.behavioralAvg.toFixed(1)}★` : "—", color: "bg-amber-500" },
                { label: "Streak", value: readiness.streakScore, detail: `${readiness.streak}d`, color: "bg-orange-500" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                    <span className="text-xs text-gray-400">{item.detail}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern strengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Top 3 Strong Patterns</p>
              <div className="flex flex-wrap gap-1.5">
                {strong.length ? strong.map(p => (
                  <span key={p.name} className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    {p.name} {p.avg!.toFixed(1)}★
                  </span>
                )) : <span className="text-xs text-gray-400 italic">No drills yet</span>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Top 3 Weak Patterns</p>
              <div className="flex flex-wrap gap-1.5">
                {weak.length ? weak.map(p => (
                  <span key={p.name} className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-600 rounded-full">
                    {p.name} {p.avg!.toFixed(1)}★
                  </span>
                )) : <span className="text-xs text-gray-400 italic">No drills yet</span>}
              </div>
            </div>
          </div>

          {undrilled.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Undrilled Patterns</p>
              <div className="flex flex-wrap gap-1.5">
                {undrilled.map(n => (
                  <span key={n} className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">{n}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTCI */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">CTCI Problem Breakdown</p>
            <div className="grid grid-cols-3 gap-3">
              {ctciByDiff.map(d => {
                const c = d.diff === "Easy" ? { text: "text-emerald-600", bar: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" }
                  : d.diff === "Medium" ? { text: "text-amber-600", bar: "bg-amber-500", bg: "bg-amber-50 border-amber-200" }
                  : { text: "text-red-600", bar: "bg-red-500", bg: "bg-red-50 border-red-200" };
                const pct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
                return (
                  <div key={d.diff} className={`rounded-lg border p-3 text-center ${c.bg}`}>
                    <p className={`text-2xl font-extrabold ${c.text}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{d.solved}</p>
                    <p className="text-[11px] text-gray-500">/ {d.total} {d.diff}</p>
                    <div className="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={`text-xs font-bold mt-0.5 ${c.text}`}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print-only content */}
      <div ref={printRef} style={{ display: "none" }}>
        <div style={{ marginBottom: 16, borderBottom: "2px solid #111827", paddingBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Interview Readiness Summary</h1>
            <p style={{ color: "#6b7280", fontSize: 11, marginTop: 4 }}>Meta IC6/IC7 Interview Guide</p>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 10 }}>{today}</p>
        </div>

        <div className="grid2">
          <div className="card" style={{ textAlign: "center" }}>
            <div className="score-num" style={{ color: scoreColor }}>{readiness.total}</div>
            <div style={{ fontSize: 12, color: scoreColor, fontWeight: 700, marginTop: 4 }}>{scoreLabel}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Overall Readiness Score</div>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Score Breakdown</h2>
            {[
              { label: "Quick Drill (40%)", value: readiness.drillScore, detail: readiness.drillAvg ? `${readiness.drillAvg.toFixed(1)}★ avg` : "No data", color: "#3b82f6" },
              { label: "CTCI Problems (30%)", value: readiness.ctciScore, detail: `${readiness.ctciSolved}/${readiness.ctciTotal}`, color: "#8b5cf6" },
              { label: "Behavioral (20%)", value: readiness.behavioralScore, detail: readiness.behavioralAvg ? `${readiness.behavioralAvg.toFixed(1)}★ avg` : "No data", color: "#f59e0b" },
              { label: "Streak (10%)", value: readiness.streakScore, detail: `${readiness.streak} days`, color: "#f97316" },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 8 }}>
                <div className="row">
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: "#6b7280" }}>{item.detail}</span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width: `${item.value}%`, background: item.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div>
            <h2>Top 3 Strong Patterns</h2>
            {strong.length ? strong.map(p => <span key={p.name} className="tag green">{p.name} {p.avg!.toFixed(1)}★</span>)
              : <span style={{ color: "#9ca3af", fontSize: 11 }}>No drills yet</span>}
          </div>
          <div>
            <h2>Top 3 Weak Patterns</h2>
            {weak.length ? weak.map(p => <span key={p.name} className="tag red">{p.name} {p.avg!.toFixed(1)}★</span>)
              : <span style={{ color: "#9ca3af", fontSize: 11 }}>No drills yet</span>}
          </div>
        </div>

        {undrilled.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h2>Undrilled Patterns</h2>
            {undrilled.map(n => <span key={n} className="tag amber">{n}</span>)}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <h2>CTCI Problem Breakdown</h2>
          <div className="grid3">
            {ctciByDiff.map(d => {
              const pct = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
              const color = d.diff === "Easy" ? "#10b981" : d.diff === "Medium" ? "#f59e0b" : "#ef4444";
              return (
                <div key={d.diff} className="card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>{d.solved}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>/ {d.total} {d.diff}</div>
                  <div className="bar" style={{ marginTop: 6 }}>
                    <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 4 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="footer">
          Generated by Meta IC6/IC7 Interview Guide · {today} · All data from localStorage
        </div>
      </div>
    </div>
  );
}

// ─── Sprint Scheduler ───────────────────────────────────────────────────────
const SPRINT_SCHED_KEY = "meta-guide-sprint-schedule";

interface SprintScheduleSettings {
  enabled: boolean;
  time: string;       // "HH:MM" 24h
  lastFiredDate: string; // "YYYY-MM-DD"
}

function getDefaultSprintSchedule(): SprintScheduleSettings {
  try {
    const s = localStorage.getItem(SPRINT_SCHED_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { enabled: false, time: "08:00", lastFiredDate: "" };
}

function saveSprintSchedule(s: SprintScheduleSettings) {
  localStorage.setItem(SPRINT_SCHED_KEY, JSON.stringify(s));
}

function requestNotifPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return Promise.resolve("denied");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  return Notification.requestPermission();
}

function fireSprintNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification("💪 Time for your Weakness Sprint!", {
    body: "Your 20-minute focused drill on your weakest patterns is ready. Open the guide to start.",
    icon: "/favicon.ico",
    tag: "meta-guide-sprint",
    requireInteraction: false,
  });
}

function SprintScheduler() {
  const [settings, setSettings] = useState<SprintScheduleSettings>(getDefaultSprintSchedule);
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [testFired, setTestFired] = useState(false);
  const supported = "Notification" in window;

  useEffect(() => { saveSprintSchedule(settings); }, [settings]);

  // Minute-poll to fire at the right time
  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return;
    const check = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const today = now.toISOString().split("T")[0];
      if (`${hh}:${mm}` === settings.time && settings.lastFiredDate !== today) {
        fireSprintNotification();
        setSettings(prev => { const next = { ...prev, lastFiredDate: today }; saveSprintSchedule(next); return next; });
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [settings.enabled, settings.time, permission, settings.lastFiredDate]);

  const handleEnable = async () => {
    const perm = await requestNotifPermission();
    setPermission(perm);
    if (perm === "granted") setSettings(prev => ({ ...prev, enabled: true }));
  };

  const handleDisable = () => setSettings(prev => ({ ...prev, enabled: false }));

  const handleTimeChange = (time: string) =>
    setSettings(prev => ({ ...prev, time, lastFiredDate: "" }));

  const handleTest = () => {
    fireSprintNotification();
    setTestFired(true);
    setTimeout(() => setTestFired(false), 3000);
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <span className="text-xs text-gray-500">Browser notifications are not supported in this browser.</span>
      </div>
    );
  }

  const isActive = settings.enabled && permission === "granted";

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isActive ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800" : "border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700"
    }`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isActive ? "bg-rose-500" : "bg-gray-200 dark:bg-gray-700"
            }`}>
              <Bell size={18} className={isActive ? "text-white" : "text-gray-500 dark:text-gray-400"} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Schedule Daily Sprint
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isActive
                  ? `Active — fires daily at ${settings.time}`
                  : "Get a browser notification reminding you to run your weakness sprint"}
              </p>
            </div>
          </div>
          {/* Toggle */}
          {permission === "granted" ? (
            <button
              onClick={isActive ? handleDisable : handleEnable}
              className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                isActive ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isActive ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </button>
          ) : (
            <button
              onClick={handleEnable}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Bell size={12} /> Enable
            </button>
          )}
        </div>

        {/* Permission denied */}
        {permission === "denied" && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">
              Notifications are blocked. Click the lock icon in your browser's address bar → Site settings → Notifications → Allow.
            </p>
          </div>
        )}

        {/* Time picker */}
        {isActive && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Reminder time</label>
            <input
              type="time"
              value={settings.time}
              onChange={e => handleTimeChange(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white dark:bg-gray-800"
            />
            <button
              onClick={handleTest}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                testFired
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              {testFired ? <CheckCircle2 size={12} /> : <Bell size={12} />}
              {testFired ? "Sent!" : "Test notification"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fix My Weaknesses Component ─────────────────────────────────────────────
const SPRINT_HISTORY_KEY = "cp_sprint_history";

interface SprintQueueEntry {
  id: number;
  name: string;
  difficulty: string;
  topic: string;
  url: string;
  patternId: string;
  patternName: string;
}

function FixMyWeaknesses() {
  const [queue, setQueue] = useState<SprintQueueEntry[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secsLeft, setSecsLeft] = useState(20 * 60);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weakPatterns = useMemo(() => getWeakestPatterns(3), []);

  const buildQueue = (): SprintQueueEntry[] => {
    const ctciProgress: Record<number, { solved: boolean }> = (() => {
      try { return JSON.parse(localStorage.getItem("ctci_progress_v1") ?? "{}"); } catch { return {}; }
    })();

    const problems: SprintQueueEntry[] = [];
    for (const pattern of weakPatterns) {
      const keywords = PATTERN_TO_CTCI_TOPICS[pattern.patternId] ?? [];
      if (keywords.length === 0) continue;
      const matching = CTCI_PROBLEMS
        .filter(p => !ctciProgress[p.id]?.solved && problemMatchesTopics(p.topic, keywords))
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      matching.forEach(p => problems.push({
        id: p.id, name: p.name, difficulty: p.difficulty,
        topic: p.topic, url: p.url,
        patternId: pattern.patternId, patternName: pattern.patternName,
      }));
    }
    // Pad to 5 if needed with unsolved problems
    if (problems.length < 5) {
      const existing = new Set(problems.map(p => p.id));
      const extras = CTCI_PROBLEMS
        .filter(p => !ctciProgress[p.id]?.solved && !existing.has(p.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5 - problems.length);
      extras.forEach(p => problems.push({
        id: p.id, name: p.name, difficulty: p.difficulty,
        topic: p.topic, url: p.url,
        patternId: "general", patternName: "General",
      }));
    }
    return problems.slice(0, 5);
  };

  const startSprint = () => {
    const q = buildQueue();
    setQueue(q);
    setCurrentIdx(0);
    setSecsLeft(20 * 60);
    setSolvedCount(0);
    setDone(false);
    setActive(true);
  };

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setSecsLeft(s => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setActive(false);
            setDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active]);

  const markSolved = () => {
    setSolvedCount(c => c + 1);
    const ctciProgress: Record<number, { solved: boolean }> = (() => {
      try { return JSON.parse(localStorage.getItem("ctci_progress_v1") ?? "{}"); } catch { return {}; }
    })();
    if (queue) {
      ctciProgress[queue[currentIdx].id] = { solved: true };
      localStorage.setItem("ctci_progress_v1", JSON.stringify(ctciProgress));
    }
    if (queue && currentIdx + 1 >= queue.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setActive(false);
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const skipProblem = () => {
    if (queue && currentIdx + 1 >= queue.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setActive(false);
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  if (weakPatterns.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
        <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-amber-700">No drill data yet</p>
        <p className="text-xs text-amber-600 mt-1">Complete some Quick Drills in the Coding tab to identify your weak patterns.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-3" />
        <div className="text-lg font-bold text-emerald-700 mb-1">Weakness Sprint Complete!</div>
        <div className="text-sm text-emerald-600 mb-4">{solvedCount} of {queue?.length ?? 5} problems solved</div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { setQueue(null); setDone(false); }}
            className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
          >View Summary</button>
          <button
            onClick={startSprint}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >Run Again</button>
        </div>
      </div>
    );
  }

  if (active && queue) {
    const current = queue[currentIdx];
    const diffColor = current.difficulty === "Easy" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
      current.difficulty === "Medium" ? "text-amber-600 bg-amber-50 border-amber-200" :
      "text-red-600 bg-red-50 border-red-200";
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-rose-500" />
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Weakness Sprint</span>
            <span className="text-xs text-gray-500">Problem {currentIdx + 1} of {queue.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-mono text-sm font-bold ${secsLeft < 120 ? "text-red-500 animate-pulse" : "text-gray-700 dark:text-gray-300"}`}>
              {formatTime(secsLeft)}
            </span>
            <button
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActive(false); setQueue(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >Stop</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {queue.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
              i < currentIdx ? "bg-emerald-500" :
              i === currentIdx ? "bg-rose-500 animate-pulse" :
              "bg-gray-200 dark:bg-gray-700"
            }`} />
          ))}
        </div>

        {/* Pattern badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            Weak pattern: {current.patternName}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}`}>
            {current.difficulty}
          </span>
        </div>

        {/* Problem card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{current.name}</div>
          <div className="text-xs text-gray-500">{current.topic}</div>
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Open on LeetCode <ChevronRight size={12} />
          </a>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={markSolved}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Solved
          </button>
          <button
            onClick={skipProblem}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Skip →
          </button>
        </div>
      </div>
    );
  }

  // Idle state — show the CTA
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
      {/* Weak patterns preview */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Your bottom 3 patterns</div>
        <div className="space-y-2">
          {weakPatterns.map((p, i) => (
            <div key={p.patternId} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${
                i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-500" : "bg-amber-500"
              }`}>{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.patternName}</span>
                  <span className="text-xs text-gray-500">
                    {p.avg !== null ? `${p.avg.toFixed(1)}★ avg` : "Not drilled"}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      i === 0 ? "bg-red-400" : i === 1 ? "bg-orange-400" : "bg-amber-400"
                    }`}
                    style={{ width: p.avg !== null ? `${(p.avg / 5) * 100}%` : "5%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sprint details */}
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
        <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">What this sprint does</div>
        <ul className="text-xs text-rose-600 dark:text-rose-500 space-y-0.5">
          <li>• Picks 5 unsolved problems from your weakest patterns</li>
          <li>• Gives you 20 minutes to work through them</li>
          <li>• Marks solved problems in your CTCI tracker automatically</li>
        </ul>
      </div>

      <button
        onClick={startSprint}
        className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <Dumbbell size={16} /> Fix My Weaknesses
      </button>
    </div>
  );
}

export default function ReadinessTab() {
  const { totalXP, events } = useXPContext();
  return (
    <div className="space-y-10">
      {/* ── XP Level & Progress ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                XP Level & Progress
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Earn XP by solving problems, completing sprints, and running mock interviews. Level up from Rookie to Distinguished Engineer.
              </p>
            </div>
          </div>
        </div>
        <XPStatsPanel totalXP={totalXP} events={events} />
      </section>

      {/* ── Achievement Badges ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-amber-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Achievement Badges
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                30 badges across Coding, Behavioral, Mock Interviews, Streaks, and Milestones — automatically unlocked as you practice.
              </p>
            </div>
          </div>
        </div>
        <AchievementBadgeWall />
      </section>

      {/* ── Readiness Goal Setter ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Interview Goal Planner
              </h2>
              <p className="text-sm text-gray-500 mt-1">Set a target readiness score and interview date to get a personalized daily task plan.</p>
            </div>
          </div>
        </div>
        <ReadinessGoalSetter />
      </section>

      {/* ── Fix My Weaknesses ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Dumbbell size={20} className="text-rose-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Fix My Weaknesses
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Auto-queues a 20-minute focused sprint on your lowest-rated patterns. Problems are pulled from your CTCI tracker.
              </p>
            </div>
          </div>
        </div>
        <FixMyWeaknesses />
      </section>

      {/* ── Schedule Daily Sprint ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-rose-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Schedule Daily Sprint
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Set a daily browser notification to remind you to run your weakness sprint at a chosen time.
              </p>
            </div>
          </div>
        </div>
        <SprintScheduler />
      </section>

      {/* ── Overall Readiness Dashboard ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <BarChart2 size={20} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Overall Readiness
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Live composite score across all four dimensions — updated as you practice
              </p>
            </div>
          </div>
        </div>
        <OverallReadinessDashboard />
      </section>

      {/* ── IC7 Signal Self-Assessment ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                IC7 Signal Self-Assessment
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Check off each of the 8 IC7 key signals you can back with a real story. Gaps are flagged as preparation priorities.
              </p>
            </div>
          </div>
        </div>
        <IC7SignalChecklist />
      </section>

      {/* ── Recruiter-Ready Summary ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <FileDown size={20} className="text-slate-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Recruiter-Ready Summary
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Printable one-page snapshot of your full readiness state — ideal for the night before your interview
              </p>
            </div>
          </div>
        </div>
        <RecruiterSummaryPrint />
      </section>
    </div>
  );
}
