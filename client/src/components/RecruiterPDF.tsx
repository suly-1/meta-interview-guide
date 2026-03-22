/**
 * RecruiterPDF — Feature 20
 * One-page printable summary: readiness score, top 3 strong/weak patterns,
 * CTCI breakdown, behavioral ratings — formatted for self-review the night before.
 */
import { useRef } from "react";
import { Printer, FileDown } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { computeReadiness } from "@/hooks/useReadinessScore";

const DRILL_KEY = "meta-guide-drill-ratings";
const CTCI_KEY = "ctci_progress_v1";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

export default function RecruiterPDF() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=1100");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Interview Readiness Summary</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #1f2937; background: white; padding: 32px; }
          h1 { font-size: 22px; font-weight: 800; color: #111827; }
          h2 { font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; margin-top: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .score { font-size: 48px; font-weight: 800; color: #3b82f6; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; margin: 2px; }
          .green { background: #d1fae5; color: #065f46; }
          .amber { background: #fef3c7; color: #92400e; }
          .red { background: #fee2e2; color: #991b1b; }
          .bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 4px; }
          .bar-fill { height: 100%; border-radius: 3px; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // Compute data
  const readiness = computeReadiness();
  const drillData = loadJSON<Record<string, { rating: number }[]>>(DRILL_KEY, {});
  const ctciData = loadJSON<Record<number, { solved: boolean }>>(CTCI_KEY, {});

  const patternRatings = PATTERNS.map(p => {
    const entries = drillData[p.id] ?? [];
    const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : null;
    return { name: p.name, avg, attempts: entries.length };
  }).filter(p => p.avg !== null).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const strong = patternRatings.slice(0, 3);
  const weak = [...patternRatings].sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0)).slice(0, 3);
  const undrilled = PATTERNS.filter(p => !drillData[p.id]?.length).map(p => p.name);

  const ctciByDiff = ["Easy", "Medium", "Hard"].map(diff => {
    const total = CTCI_PROBLEMS.filter(p => p.difficulty === diff).length;
    const solved = CTCI_PROBLEMS.filter(p => p.difficulty === diff && ctciData[p.id]?.solved).length;
    return { diff, total, solved };
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const scoreColor = readiness.total >= 75 ? "#10b981" : readiness.total >= 50 ? "#3b82f6" : readiness.total >= 30 ? "#f59e0b" : "#ef4444";
  const scoreLabel = readiness.total >= 75 ? "Strong" : readiness.total >= 50 ? "On Track" : readiness.total >= 30 ? "Developing" : "Early Stage";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recruiter-Ready Summary</h3>
          <p className="text-xs text-gray-500">One-page printable prep summary for the night before</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <Printer size={13} /> Print / Save PDF
        </button>
      </div>

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: "none" }}>
        <div style={{ marginBottom: 16, borderBottom: "2px solid #111827", paddingBottom: 12 }}>
          <h1>Interview Readiness Summary</h1>
          <p style={{ color: "#6b7280", fontSize: 11, marginTop: 4 }}>{today}</p>
        </div>

        <div className="grid2">
          <div className="card" style={{ textAlign: "center" }}>
            <div className="score" style={{ color: scoreColor }}>{readiness.total}</div>
            <div style={{ fontSize: 11, color: scoreColor, fontWeight: 700 }}>{scoreLabel}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Overall Readiness Score</div>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Score Breakdown</h2>
            {[
              { label: "Quick Drill", value: readiness.drillScore, detail: readiness.drillAvg ? `${readiness.drillAvg.toFixed(1)}★ avg` : "No data" },
              { label: "CTCI Solved", value: readiness.ctciScore, detail: `${readiness.ctciSolved}/${readiness.ctciTotal}` },
              { label: "Behavioral", value: readiness.behavioralScore, detail: readiness.behavioralAvg ? `${readiness.behavioralAvg.toFixed(1)}★ avg` : "No data" },
              { label: "Streak", value: readiness.streakScore, detail: `${readiness.streak} days` },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: "#6b7280" }}>{item.detail}</span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${item.value}%`, background: "#3b82f6" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div>
            <h2>Top 3 Strong Patterns</h2>
            {strong.length ? strong.map(p => (
              <span key={p.name} className="tag green">{p.name} {p.avg!.toFixed(1)}★</span>
            )) : <span style={{ color: "#9ca3af", fontSize: 11 }}>No drills yet</span>}
          </div>
          <div>
            <h2>Top 3 Weak Patterns</h2>
            {weak.length ? weak.map(p => (
              <span key={p.name} className="tag red">{p.name} {p.avg!.toFixed(1)}★</span>
            )) : <span style={{ color: "#9ca3af", fontSize: 11 }}>No drills yet</span>}
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
            {ctciByDiff.map(d => (
              <div key={d.diff} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: d.diff === "Easy" ? "#10b981" : d.diff === "Medium" ? "#f59e0b" : "#ef4444" }}>
                  {d.solved}
                </div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>/ {d.total} {d.diff}</div>
                <div className="bar" style={{ marginTop: 6 }}>
                  <div className="bar-fill" style={{ width: `${(d.solved / d.total) * 100}%`, background: d.diff === "Easy" ? "#10b981" : d.diff === "Medium" ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 12, color: "#9ca3af", fontSize: 10 }}>
          Generated by Independence Study Guide · {today}
        </div>
      </div>

      {/* Preview card */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileDown size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Interview Readiness Summary</p>
            <p className="text-xs text-gray-500">Score {readiness.total}/100 · {readiness.ctciSolved} CTCI solved · {readiness.streak}d streak</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
        >
          Print
        </button>
      </div>
    </div>
  );
}
