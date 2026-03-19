/**
 * StudyBuddySync — Feature 19
 * Encode full progress state into a compressed base64 URL parameter.
 * A study partner opens the link to see a read-only view of your progress.
 */
import { useState, useEffect, useMemo } from "react";
import { Link2, Copy, Check, Users, Eye } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { PATTERNS } from "@/lib/guideData";
import { computeReadiness } from "@/hooks/useReadinessScore";

const CTCI_KEY = "ctci_progress_v1";
const DRILL_KEY = "meta-guide-drill-ratings";
const STREAK_KEY = "meta-guide-streak-dates";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

interface SharePayload {
  ctciSolved: number;
  ctciTotal: number;
  drillAvgs: Record<string, number>;
  streak: number;
  readiness: number;
  generatedAt: string;
}

function encodePayload(payload: SharePayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decodePayload(encoded: string): SharePayload | null {
  try { return JSON.parse(decodeURIComponent(atob(encoded))); } catch { return null; }
}

function ReadOnlyView({ payload }: { payload: SharePayload }) {
  const drillData = PATTERNS.map(p => ({
    name: p.name,
    avg: payload.drillAvgs[p.id] ?? null,
  }));

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Eye size={14} className="text-blue-600" />
        <span className="text-sm font-bold text-blue-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Study Buddy's Progress</span>
        <span className="text-[11px] text-blue-500">Shared {new Date(payload.generatedAt).toLocaleDateString()}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <p className="text-xl font-extrabold text-blue-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{payload.readiness}</p>
          <p className="text-[10px] text-gray-400">Readiness Score</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <p className="text-xl font-extrabold text-emerald-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{payload.ctciSolved}</p>
          <p className="text-[10px] text-gray-400">CTCI Solved</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-blue-100">
          <p className="text-xl font-extrabold text-orange-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{payload.streak}</p>
          <p className="text-[10px] text-gray-400">Day Streak</p>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 mb-2">Pattern Ratings</p>
        <div className="flex flex-wrap gap-1.5">
          {drillData.filter(d => d.avg !== null).map(d => (
            <span key={d.name} className="text-[11px] px-2 py-0.5 bg-white border border-blue-100 rounded-full text-gray-600">
              {d.name} {d.avg!.toFixed(1)}★
            </span>
          ))}
          {drillData.filter(d => d.avg === null).length > 0 && (
            <span className="text-[11px] text-gray-400">+{drillData.filter(d => d.avg === null).length} undrilled</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudyBuddySync() {
  const [copied, setCopied] = useState(false);
  const [sharedView, setSharedView] = useState<SharePayload | null>(null);

  // Check URL for shared payload on mount
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[#&]buddy=([^&]+)/);
    if (match) {
      const payload = decodePayload(match[1]);
      if (payload) setSharedView(payload);
    }
  }, []);

  const shareLink = useMemo(() => {
    const ctciData = loadJSON<Record<number, { solved: boolean }>>(CTCI_KEY, {});
    const drillData = loadJSON<Record<string, { rating: number; ts: number }[]>>(DRILL_KEY, {});
    const streakDates = loadJSON<string[]>(STREAK_KEY, []);
    const readiness = computeReadiness();

    const ctciSolved = CTCI_PROBLEMS.filter(p => ctciData[p.id]?.solved).length;

    const drillAvgs: Record<string, number> = {};
    PATTERNS.forEach(p => {
      const entries = drillData[p.id] ?? [];
      if (entries.length) drillAvgs[p.id] = entries.reduce((s, e) => s + e.rating, 0) / entries.length;
    });

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const sorted = Array.from(new Set(streakDates)).sort().reverse();
    let streak = 0;
    if (sorted.length && (sorted[0] === today || sorted[0] === yesterdayStr)) {
      let cursor = new Date(sorted[0] + "T12:00:00");
      for (const d of sorted) {
        if (d === cursor.toISOString().split("T")[0]) { streak++; cursor.setDate(cursor.getDate() - 1); }
        else break;
      }
    }

    const payload: SharePayload = {
      ctciSolved,
      ctciTotal: CTCI_PROBLEMS.length,
      drillAvgs,
      streak,
      readiness: readiness.total,
      generatedAt: new Date().toISOString(),
    };

    const encoded = encodePayload(payload);
    return `${window.location.origin}${window.location.pathname}#buddy=${encoded}`;
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-blue-600" />
          <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Study Buddy Sync</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Share your progress with a study partner. They'll see your readiness score, CTCI solve count, streak, and pattern ratings — read-only.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareLink}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0"
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
          <Link2 size={10} /> Progress is encoded in the URL — no server required. Regenerate anytime for fresh data.
        </p>
      </div>

      {sharedView && <ReadOnlyView payload={sharedView} />}
    </div>
  );
}
