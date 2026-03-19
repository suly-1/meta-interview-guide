/**
 * ReadinessTab — dedicated tab combining:
 * 1. Overall Readiness Dashboard (live in-page view)
 * 2. Recruiter-Ready Summary (printable one-page PDF)
 */
import { useRef, useMemo } from "react";
import { Printer, BarChart2, FileDown } from "lucide-react";
import OverallReadinessDashboard from "@/components/OverallReadinessDashboard";
import { PATTERNS, BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { computeReadiness } from "@/hooks/useReadinessScore";

const DRILL_KEY = "meta-guide-drill-ratings";
const CTCI_KEY  = "ctci_progress_v1";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

function RecruiterSummaryPrint() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=820,height=1160");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Interview Readiness Summary</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Space Grotesk',sans-serif;font-size:12px;color:#1f2937;background:white;padding:36px}
        h1{font-size:24px;font-weight:800;color:#111827}
        h2{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
        .score-num{font-size:52px;font-weight:800;line-height:1}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
        .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;margin:2px}
        .green{background:#d1fae5;color:#065f46}
        .amber{background:#fef3c7;color:#92400e}
        .red{background:#fee2e2;color:#991b1b}
        .bar{height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;margin-top:4px}
        .bar-fill{height:100%;border-radius:3px}
        .row{display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px}
        .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px}
        @media print{body{padding:20px}}
      </style>
    </head><body>${content.innerHTML}</body></html>`);
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

export default function ReadinessTab() {
  return (
    <div className="space-y-10">
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
