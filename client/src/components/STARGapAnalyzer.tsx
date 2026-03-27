// STARGapAnalyzer — cross-references completed STAR stories against 4 focus areas
// and L7 key signals; surfaces gaps and stretch suggestions
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { usePracticeRatings } from "@/hooks/usePracticeRatings";
import { BEHAVIORAL_FOCUS_AREAS, STORY_BANK } from "@/lib/guideData";

const IC7_SIGNALS = [
  "Org-wide or cross-org technical impact",
  "Shapes technical strategy independently",
  "Identifies what the org should be working on",
  "Owns end-to-end outcomes (not just execution)",
  "Grows other senior leaders",
  "Navigates deep technical ambiguity at scale",
  "Drives cross-org alignment without authority",
  "Measurable business or org-level impact",
];

// Map each focus area to which L7 signals it can demonstrate
const AREA_IC7_SIGNAL_MAP: Record<string, number[]> = {
  xfn:              [0, 2, 4, 6],
  conflict:         [6, 4, 7],
  "problem-solving":[1, 2, 5, 7],
  communication:    [3, 4, 6, 7],
};

// Map each STORY_BANK type to which focus area IDs it covers
const STORY_AREA_MAP: Record<string, string[]> = {
  "High-Impact Technical Project":        ["xfn", "communication"],
  "Cross-Functional Alignment Win":       ["xfn", "conflict"],
  "Technical Conflict / Disagreement":    ["conflict", "problem-solving"],
  "Project Failure / Postmortem":         ["problem-solving", "communication"],
  "Decision Under Ambiguity":             ["problem-solving", "xfn"],
  "Mentoring / Growing a Junior Engineer":["communication", "xfn"],
  "Proactive Risk Identification":        ["problem-solving", "communication"],
  "Technical or Cultural Change You Drove":["xfn", "communication"],
};

export default function STARGapAnalyzer() {
  const { getLatestRating, getAttemptCount } = usePracticeRatings();

  // Determine which stories the user has practiced (rating > 0 or attempt > 0)
  const practicedStories = useMemo(() => {
    return STORY_BANK.filter((s) => {
      const rating = getLatestRating(s.type);
      const attempts = getAttemptCount(s.type);
      return (rating !== null && rating > 0) || attempts > 0;
    });
  }, [getLatestRating, getAttemptCount]);

  const practicedTypes = new Set(practicedStories.map((s) => s.type));

  // Coverage per focus area
  const areaCoverage = useMemo(() => {
    return BEHAVIORAL_FOCUS_AREAS.map((area) => {
      const coveringStories = STORY_BANK.filter((s) =>
        (STORY_AREA_MAP[s.type] ?? []).includes(area.id)
      );
      const practiced = coveringStories.filter((s) => practicedTypes.has(s.type));
      return {
        area,
        total: coveringStories.length,
        practiced: practiced.length,
        coveringStories,
        practicedStories: practiced,
        gap: practiced.length === 0,
        singlePoint: practiced.length === 1,
      };
    });
  }, [practicedTypes]);

  // L7 signal coverage
  const signalCoverage = useMemo(() => {
    return IC7_SIGNALS.map((signal, idx) => {
      // Find which areas cover this signal
      const coveringAreaIds = Object.entries(AREA_IC7_SIGNAL_MAP)
        .filter(([, signals]) => signals.includes(idx))
        .map(([id]) => id);

      // Find practiced stories that cover those areas
      const coveringStories = practicedStories.filter((s) =>
        (STORY_AREA_MAP[s.type] ?? []).some((aId) => coveringAreaIds.includes(aId))
      );

      return {
        signal,
        idx,
        covered: coveringStories.length > 0,
        coveringStories,
        coveringAreaIds,
      };
    });
  }, [practicedStories]);

  const totalGaps = areaCoverage.filter((a) => a.gap).length;
  const totalSinglePoints = areaCoverage.filter((a) => a.singlePoint).length;
  const ic7Gaps = signalCoverage.filter((s) => !s.covered).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl border p-3.5 text-center ${totalGaps > 0 ? "border-red-200 bg-red-100" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-2xl font-extrabold mb-0.5 ${totalGaps > 0 ? "text-red-700" : "text-emerald-700"}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{totalGaps}</div>
          <div className="text-[11px] font-semibold text-gray-600">Focus Area Gaps</div>
          <div className="text-[10px] text-gray-600 mt-0.5">zero stories</div>
        </div>
        <div className={`rounded-xl border p-3.5 text-center ${totalSinglePoints > 0 ? "border-amber-200 bg-amber-100" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-2xl font-extrabold mb-0.5 ${totalSinglePoints > 0 ? "text-amber-900" : "text-emerald-700"}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{totalSinglePoints}</div>
          <div className="text-[11px] font-semibold text-gray-600">Single-Story Risk</div>
          <div className="text-[10px] text-gray-600 mt-0.5">only 1 story</div>
        </div>
        <div className={`rounded-xl border p-3.5 text-center ${ic7Gaps > 0 ? "border-purple-200 bg-purple-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-2xl font-extrabold mb-0.5 ${ic7Gaps > 0 ? "text-purple-700" : "text-emerald-700"}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{ic7Gaps}</div>
          <div className="text-[11px] font-semibold text-gray-600">L7 Signal Gaps</div>
          <div className="text-[10px] text-gray-600 mt-0.5">uncovered signals</div>
        </div>
      </div>

      {/* Focus Area Coverage */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Focus Area Coverage
        </h3>
        <div className="space-y-2.5">
          {areaCoverage.map(({ area, practiced, total, gap, singlePoint, coveringStories }) => (
            <div key={area.id} className={`rounded-xl border p-3.5 ${
              gap ? "border-red-200 bg-red-100/80" : singlePoint ? "border-amber-200 bg-amber-100/80" : "border-emerald-200 bg-emerald-50/30"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {gap ? <AlertTriangle size={13} className="text-red-500 flex-shrink-0" /> :
                   singlePoint ? <AlertCircle size={13} className="text-amber-500 flex-shrink-0" /> :
                   <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />}
                  <span className="text-xs font-bold text-gray-800">{area.title.replace(/Focus Area \d+: /, "")}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  gap ? "text-red-700 bg-red-100" : singlePoint ? "text-amber-900 bg-amber-100" : "text-emerald-700 bg-emerald-100"
                }`}>
                  {practiced}/{total} stories practiced
                </span>
              </div>

              {gap && (
                <div className="mt-1.5">
                  <p className="text-[11px] text-red-700 font-semibold mb-1">No stories practiced — critical gap</p>
                  <p className="text-[11px] text-gray-600">Suggested stories to prepare:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {coveringStories.slice(0, 3).map((s) => (
                      <span key={s.type} className="text-[10px] text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                        {s.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {singlePoint && !gap && (
                <div className="mt-1.5">
                  <p className="text-[11px] text-amber-900 font-semibold mb-1">Single-story risk — prepare a backup</p>
                  <p className="text-[11px] text-gray-600">Add one more story from:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {coveringStories.filter((s) => !practicedTypes.has(s.type)).slice(0, 2).map((s) => (
                      <span key={s.type} className="text-[10px] text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        {s.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* L7 Signal Coverage */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          L7 Signal Coverage
        </h3>
        <p className="text-xs text-gray-700 mb-3">Based on your practiced stories — each signal needs at least one supporting story</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {signalCoverage.map(({ signal, covered, coveringStories, coveringAreaIds }) => (
            <div key={signal} className={`rounded-xl border p-3 flex items-start gap-2.5 ${
              covered ? "border-purple-200 bg-purple-50/40" : "border-gray-200 bg-gray-50"
            }`}>
              {covered
                ? <CheckCircle2 size={13} className="text-purple-500 flex-shrink-0 mt-0.5" />
                : <AlertTriangle size={13} className="text-gray-600 flex-shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold leading-snug ${covered ? "text-purple-800" : "text-gray-700"}`}>{signal}</p>
                {covered && (
                  <p className="text-[10px] text-purple-600 mt-0.5">
                    Covered by: {coveringStories.map((s) => s.type).join(", ")}
                  </p>
                )}
                {!covered && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Practice stories in: {coveringAreaIds.map((id) =>
                      BEHAVIORAL_FOCUS_AREAS.find((a) => a.id === id)?.title.replace(/Focus Area \d+: /, "") ?? id
                    ).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stretch suggestions */}
      {practicedStories.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <h3 className="text-xs font-bold text-indigo-900 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Stories That Can Be Stretched to Cover More Signals
          </h3>
          <div className="space-y-2">
            {practicedStories.slice(0, 4).map((s) => {
              const coveredAreas = STORY_AREA_MAP[s.type] ?? [];
              const coveredSignals = IC7_SIGNALS.filter((_, idx) =>
                coveredAreas.some((aId) => (AREA_IC7_SIGNAL_MAP[aId] ?? []).includes(idx))
              );
              return (
                <div key={s.type} className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-indigo-800">{s.type}</span>
                    <span className="text-[11px] text-indigo-600"> — can demonstrate: {coveredSignals.slice(0, 2).join("; ")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {practicedStories.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-700">No stories practiced yet.</p>
          <p className="text-xs text-gray-600 mt-1">Use Practice Mode or Full Mock to rate questions — the analyzer will map your coverage automatically.</p>
        </div>
      )}
    </div>
  );
}
