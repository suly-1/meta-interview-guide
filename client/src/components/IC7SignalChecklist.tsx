// L7 Signal Self-Assessment Checklist — Readiness tab
// Design: Structured Clarity — checklist with story backing, gap detection, and priority flags
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, AlertTriangle, BookOpen, ChevronDown, ChevronUp, Lightbulb, Target, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const IC7_SIGNALS = [
  {
    id: "biz-line",
    signal: "Direct line from business need to their work",
    description: "IC7s connect what they do to company-level business value — not just team or org value.",
    probeQuestion: "Can you describe a project where you explicitly tied your technical decision to a measurable business outcome (revenue, DAU, cost)?",
    storyHint: "Look for stories where you quantified impact in business terms, not just engineering metrics.",
    priority: "critical",
  },
  {
    id: "deep-contributions",
    signal: "1–3 deep, large contributions affecting a broad area",
    description: "IC7s have a small number of very high-impact contributions that span services, technology, and people — not a long list of medium-sized wins.",
    probeQuestion: "What is the single largest technical contribution you have made? How many teams, services, or users did it affect?",
    storyHint: "Avoid listing many projects. Identify your 1–2 flagship contributions with the broadest scope.",
    priority: "critical",
  },
  {
    id: "multiplier",
    signal: "Builds strategies that help others achieve more impact",
    description: "IC7s bring change to what would otherwise happen — they create leverage by enabling others to do more than they could alone.",
    probeQuestion: "Tell me about a time you designed a system, process, or framework that other engineers used to ship faster or with higher quality.",
    storyHint: "Think about platform work, internal tools, design patterns, or process changes you introduced that others adopted.",
    priority: "critical",
  },
  {
    id: "flexible-roles",
    signal: "Flexible roles — code deeply, lead, build POC, depending on need",
    description: "IC7s fluidly shift between deep technical work and leadership depending on what the situation demands.",
    probeQuestion: "Give an example where you switched from a hands-on coding role to a leadership/coordination role mid-project. What triggered the switch?",
    storyHint: "Look for stories where you consciously chose to step back from coding to unblock the team, or stepped in to code when the team was stuck.",
    priority: "high",
  },
  {
    id: "owns-outcomes",
    signal: "Owns outcomes, not just the path",
    description: "A great service that doesn't get adopted is not success for an L7. They own the full outcome including adoption, reliability, and business impact.",
    probeQuestion: "Tell me about a project you shipped. What was the adoption rate? What did you do when adoption was lower than expected?",
    storyHint: "Stories should show you tracked success metrics post-launch and took action when results fell short.",
    priority: "critical",
  },
  {
    id: "grows-leaders",
    signal: "Grows L5/6 leaders around them — avoids being an SPOF",
    description: "IC7s create space for other leaders to emerge and deliberately avoid becoming a single point of failure.",
    probeQuestion: "Tell me about an engineer you helped grow into a more senior role. What did you do specifically to develop them?",
    storyHint: "Look for concrete examples: delegating ownership, sponsoring their ideas in design reviews, giving them visibility with leadership.",
    priority: "high",
  },
  {
    id: "hard-truth",
    signal: "Tells the hard truth — deprecates or kills projects when ROI isn't there",
    description: "IC7s have the courage and credibility to recommend stopping work, deprecating systems, or pivoting when the data says so.",
    probeQuestion: "Describe a time you recommended stopping or significantly changing a project. How did you make the case? What was the outcome?",
    storyHint: "This is a rare but powerful signal. Even one strong story here is highly differentiating.",
    priority: "high",
  },
  {
    id: "upward-influence",
    signal: "Influence is upward — shapes business direction, influences directors",
    description: "IC7s influence not just peers but also directors and above — shaping technical strategy and business direction.",
    probeQuestion: "Tell me about a time you influenced a decision made by a director or VP. What was the decision, and how did you shape it?",
    storyHint: "Look for stories where you presented to senior leadership, wrote strategy docs that changed direction, or were sought out by directors for technical input.",
    priority: "critical",
  },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: "Critical Signal", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  high:     { label: "High Signal",     color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
};

const STORAGE_KEY = "ic7-signal-checklist";

type SignalState = {
  hasStory: boolean;
  storyNote: string;
  expanded: boolean;
};

export default function IC7SignalChecklist() {
  const [states, setStates] = useState<Record<string, SignalState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return Object.fromEntries(IC7_SIGNALS.map((s) => [s.id, { hasStory: false, storyNote: "", expanded: false }]));
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  }, [states]);

  const toggle = (id: string, field: "hasStory" | "expanded") => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: !prev[id][field] } }));
  };

  const setNote = (id: string, note: string) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], storyNote: note } }));
  };

  const covered = IC7_SIGNALS.filter((s) => states[s.id]?.hasStory).length;
  const gaps = IC7_SIGNALS.filter((s) => !states[s.id]?.hasStory);
  const criticalGaps = gaps.filter((s) => s.priority === "critical");
  const pct = Math.round((covered / IC7_SIGNALS.length) * 100);

  // AI coaching per signal
  const signalCoach = trpc.highImpact.ic7SignalCoach.useMutation();
  const [coachingSignalId, setCoachingSignalId] = useState<string | null>(null);
  const [coachResults, setCoachResults] = useState<Record<string, { storyAngles: string[]; starOutline: { situation: string; task: string; action: string; result: string }; recallQuestions: string[]; exampleOpener: string }>>({});

  const requestCoaching = (signal: typeof IC7_SIGNALS[0]) => {
    setCoachingSignalId(signal.id);
    signalCoach.mutate(
      { signal: signal.signal, description: signal.description, probeQuestion: signal.probeQuestion, gapNote: states[signal.id]?.storyNote || undefined, targetLevel: "L7" },
      { onSuccess: (data) => { setCoachResults(prev => ({ ...prev, [signal.id]: data })); setCoachingSignalId(null); } }
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-white/80" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">L7 Signal Coverage</p>
            </div>
            <p className="text-4xl font-extrabold leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {covered}<span className="text-2xl text-white/70">/{IC7_SIGNALS.length}</span>
            </p>
            <p className="text-sm text-white/80 mt-1">signals backed by a real story</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {/* Progress ring */}
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="28" fill="none"
                stroke={pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
                transform="rotate(-90 36 36)"
              />
              <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{pct}%</text>
            </svg>
            <p className="text-xs text-white/70 text-right">
              {pct >= 75 ? "Strong L7 story coverage" : pct >= 50 ? "Building coverage — keep going" : "Significant gaps to address"}
            </p>
          </div>
        </div>

        {/* Critical gaps callout */}
        {criticalGaps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-200 mb-1">
                  {criticalGaps.length} Critical Signal{criticalGaps.length > 1 ? "s" : ""} Without a Story
                </p>
                <p className="text-xs text-white/70">
                  {criticalGaps.map((g) => g.signal.split("—")[0].trim()).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signal cards */}
      <div className="space-y-3">
        {IC7_SIGNALS.map((signal) => {
          const state = states[signal.id] ?? { hasStory: false, storyNote: "", expanded: false };
          const cfg = PRIORITY_CONFIG[signal.priority];
          const isGap = !state.hasStory;

          return (
            <div
              key={signal.id}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                state.hasStory
                  ? "border-emerald-300 bg-emerald-50"
                  : signal.priority === "critical"
                  ? "border-red-200 bg-red-50/40"
                  : "border-amber-200 bg-amber-50/40"
              }`}
            >
              {/* Signal header row */}
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Check toggle */}
                <button
                  onClick={() => toggle(signal.id, "hasStory")}
                  className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                  title={state.hasStory ? "Mark as gap" : "Mark as covered"}
                >
                  {state.hasStory ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className={signal.priority === "critical" ? "text-red-300 hover:text-red-500" : "text-amber-300 hover:text-amber-500"} />
                  )}
                </button>

                {/* Signal text */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    {state.hasStory && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ✓ Story Ready
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-semibold leading-snug ${state.hasStory ? "text-emerald-800" : "text-gray-900"}`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {signal.signal}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{signal.description}</p>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => toggle(signal.id, "expanded")}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
                >
                  {state.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded panel */}
              {state.expanded && (
                <div className="px-4 pb-4 border-t border-gray-200/60 pt-3 space-y-3 bg-white/60">
                  {/* Probe question */}
                  <div className="flex items-start gap-2">
                    <BookOpen size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Probe Question</p>
                      <p className="text-sm text-gray-700 italic leading-relaxed">"{signal.probeQuestion}"</p>
                    </div>
                  </div>

                  {/* Story hint */}
                  <div className="flex items-start gap-2">
                    <Lightbulb size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">Story Hint</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{signal.storyHint}</p>
                    </div>
                  </div>

                  {/* Story note textarea */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                      Your Story (optional — saved locally)
                    </label>
                    <textarea
                      value={state.storyNote}
                      onChange={(e) => setNote(signal.id, e.target.value)}
                      placeholder={`Briefly describe your story for this signal (situation, action, outcome)...`}
                      rows={3}
                      className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
                    />
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {state.storyNote.trim() && !state.hasStory && (
                        <button
                          onClick={() => toggle(signal.id, "hasStory")}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                        >
                          Mark as covered →
                        </button>
                      )}
                      {!state.hasStory && (
                        <button
                          onClick={() => requestCoaching(signal)}
                          disabled={coachingSignalId === signal.id}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {coachingSignalId === signal.id ? (
                            <><Loader2 size={11} className="animate-spin" /> Getting coaching…</>
                          ) : (
                            <><Sparkles size={11} /> Get AI Coaching</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Coaching Results */}
                  {coachResults[signal.id] && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 space-y-3">
                      <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles size={11} /> AI Coaching
                      </p>

                      {/* Example opener */}
                      {coachResults[signal.id].exampleOpener && (
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Strong Opening Line</p>
                          <p className="text-xs text-indigo-900 italic">"{coachResults[signal.id].exampleOpener}"</p>
                        </div>
                      )}

                      {/* Story angles */}
                      {coachResults[signal.id].storyAngles.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5">3 Story Angles to Consider</p>
                          <ol className="space-y-1">
                            {coachResults[signal.id].storyAngles.map((angle, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-indigo-800">
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 font-bold text-[9px] flex items-center justify-center mt-0.5">{i + 1}</span>
                                {angle}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* STAR outline */}
                      {coachResults[signal.id].starOutline && (
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5">STAR Framework Outline</p>
                          <div className="space-y-1">
                            {(['situation','task','action','result'] as const).map(k => (
                              <div key={k} className="flex items-start gap-2 text-xs">
                                <span className="font-bold text-indigo-600 uppercase w-16 flex-shrink-0">{k}</span>
                                <span className="text-indigo-800">{coachResults[signal.id].starOutline[k]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recall questions */}
                      {coachResults[signal.id].recallQuestions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Recall Questions</p>
                          <ul className="space-y-1">
                            {coachResults[signal.id].recallQuestions.map((q, i) => (
                              <li key={i} className="text-xs text-indigo-700 italic">• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gap summary */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-800 mb-2">
                {gaps.length} Signal{gaps.length > 1 ? "s" : ""} Need{gaps.length === 1 ? "s" : ""} a Story
              </p>
              <div className="space-y-1.5">
                {gaps.map((g) => (
                  <div key={g.id} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[g.priority].dot}`} />
                    <p className="text-xs text-orange-700">{g.signal}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-orange-600 mt-3 italic">
                Tip: Review your STAR Story Bank in the Timeline tab — many existing stories can be reframed to cover these signals.
              </p>
            </div>
          </div>
        </div>
      )}

      {covered === IC7_SIGNALS.length && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center">
          <p className="text-lg font-bold text-emerald-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🎯 All 8 L7 Signals Covered
          </p>
          <p className="text-sm text-emerald-600 mt-1">You have a real story for every key differentiator. Strong L7 signal coverage.</p>
        </div>
      )}
    </div>
  );
}
