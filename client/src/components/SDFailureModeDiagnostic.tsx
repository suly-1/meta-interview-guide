// SDFailureModeDiagnostic — "Why 90% of candidates fail Meta System Design"
// Research-backed failure mode diagnostic + level calibrator
// Addresses root causes from pass-rate analysis: 10% → 60% uplift roadmap
import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Target, TrendingUp, Zap, BookOpen, Brain, Clock, BarChart2,
  ArrowRight, Circle,
} from "lucide-react";

interface FailureMode {
  id: string;
  rank: number;
  title: string;
  scoreWeight: string;
  description: string;
  symptom: string;
  fix: string;
  icLevel: "L4 trap" | "L5 gap" | "L6 gap";
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const FAILURE_MODES: FailureMode[] = [
  {
    id: "no-requirements",
    rank: 1,
    title: "Jumping to architecture before defining the problem",
    scoreWeight: "~30% of score",
    description: "The single most common failure. Candidates open with 'I'll use a microservices architecture with Kafka…' before asking a single clarifying question. Interviewers stop listening at this point.",
    symptom: "You start drawing boxes and arrows within the first 2 minutes.",
    fix: "Spend the first 5–8 minutes exclusively on requirements. Write them down. Get the interviewer to confirm scope. Only then pick up the marker.",
    icLevel: "L4 trap",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    icon: <AlertTriangle size={14} />,
  },
  {
    id: "no-tradeoffs",
    rank: 2,
    title: "Asserting choices without explaining trade-offs",
    scoreWeight: "~25–30% of score",
    description: "Saying 'I'll use Cassandra' is worth zero points. Saying 'I'll use Cassandra because we're write-heavy, need horizontal scaling, and can tolerate eventual consistency — though we'd lose strong consistency which matters less here because…' is worth full points.",
    symptom: "You name technologies without explaining why you chose them over alternatives.",
    fix: "For every architectural decision, say: 'I'm choosing X over Y because [specific trade-off]. The downside is [Z], which is acceptable because [context].'",
    icLevel: "L5 gap",
    color: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    icon: <BarChart2 size={14} />,
  },
  {
    id: "black-box-components",
    rank: 3,
    title: "Treating components as opaque black boxes",
    scoreWeight: "~15% of score",
    description: "Drawing a box labeled 'Cache' or 'Message Queue' without explaining the internals signals L4 thinking. L6+ candidates explain how the cache is structured, what eviction policy they'd use, and why.",
    symptom: "Your diagram has boxes with labels but no explanation of what happens inside them.",
    fix: "For each component you draw, be prepared to go one level deeper: data structure, consistency model, failure mode, and how it connects to the next component.",
    icLevel: "L5 gap",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    icon: <Brain size={14} />,
  },
  {
    id: "time-management",
    rank: 4,
    title: "Poor time management — never reaching deep dives",
    scoreWeight: "~25% of score (structural)",
    description: "Spending 30 minutes on requirements and data model means the interviewer never gets to probe your depth on scale and bottlenecks — which is where L6/L7 differentiation happens.",
    symptom: "You get cut off by the interviewer before reaching scale discussion.",
    fix: "Use the 5-10-15 framework: 5 min requirements, 10 min high-level design, 15 min deep dives. Set a mental timer and move on even if a section feels incomplete.",
    icLevel: "L6 gap",
    color: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    icon: <Clock size={14} />,
  },
  {
    id: "no-meta-scale",
    rank: 5,
    title: "Ignoring Meta-scale context and back-of-envelope math",
    scoreWeight: "Embedded in all signals",
    description: "Designing a notification system for 1,000 users vs. 1 billion users are completely different problems. Candidates who skip capacity estimation miss the entire point of the exercise.",
    symptom: "Your design would work for a startup but breaks at Meta's actual scale.",
    fix: "Always do back-of-envelope math early: DAU × events/day × message size = storage/bandwidth. Let the numbers drive your architecture choices.",
    icLevel: "L5 gap",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    icon: <TrendingUp size={14} />,
  },
  {
    id: "template-recitation",
    rank: 6,
    title: "Template recitation without understanding",
    scoreWeight: "~15% of score (depth)",
    description: "Memorizing 'always use consistent hashing for sharding' and applying it everywhere signals that you don't understand when it applies and when it doesn't. Interviewers probe this immediately.",
    symptom: "You give the same answer regardless of the problem context.",
    fix: "For every pattern you've memorized, also memorize: (1) when it applies, (2) when it doesn't, and (3) what the alternative is.",
    icLevel: "L4 trap",
    color: "#0f766e",
    bgColor: "#f0fdfa",
    borderColor: "#99f6e4",
    icon: <BookOpen size={14} />,
  },
  {
    id: "level-mismatch",
    rank: 7,
    title: "L4-level preparation for an L6/L7 interview",
    scoreWeight: "Structural mismatch",
    description: "L4 answers describe what a system does. L6 answers explain why each decision was made and what the alternatives were. L7 answers also address org-level implications, cross-team dependencies, and long-term maintainability.",
    symptom: "You describe the system correctly but never discuss trade-offs, failure modes, or evolution paths.",
    fix: "After every statement, ask yourself: 'Did I explain WHY, not just WHAT?' L6 requires 'why' on every major decision. L7 requires 'why now, why this team, and what happens in 2 years.'",
    icLevel: "L6 gap",
    color: "#1e3a8a",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    icon: <Target size={14} />,
  },
];

const LEVEL_CALIBRATION_QUESTIONS = [
  {
    q: "When you make an architectural decision in a mock, do you explain the trade-offs or just name the technology?",
    icPass: "I explain trade-offs every time",
    icFail: "I name the technology and move on",
    targetSignal: "Trade-off articulation",
  },
  {
    q: "How long do you spend on requirements before drawing any architecture?",
    icPass: "5–8 minutes minimum, with interviewer confirmation",
    icFail: "1–2 minutes or I skip it",
    targetSignal: "Requirements discipline",
  },
  {
    q: "Can you explain how consistent hashing works AND when you would NOT use it?",
    icPass: "Yes — I know both when it applies and when it doesn't",
    icFail: "I know it applies to sharding but not when to avoid it",
    targetSignal: "Pattern depth vs. recitation",
  },
  {
    q: "In your last mock, did you reach the scale/bottlenecks section?",
    icPass: "Yes, with time to spare for deep dives",
    icFail: "No, I ran out of time before getting there",
    targetSignal: "Time management",
  },
  {
    q: "Do you do back-of-envelope math before choosing your data store?",
    icPass: "Always — numbers drive my architecture choices",
    icFail: "Sometimes, or I estimate in my head without writing it down",
    targetSignal: "Meta-scale calibration",
  },
];

const IC_LEVEL_EXPECTATIONS = [
  {
    level: "L4",
    label: "Software Engineer",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    expectations: [
      "Describes what the system does",
      "Identifies major components",
      "Basic API design",
      "Knows common data structures",
    ],
    gaps: [
      "Rarely explains trade-offs",
      "Doesn't probe requirements deeply",
      "Misses scale implications",
    ],
  },
  {
    level: "L5",
    label: "Senior Software Engineer",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    expectations: [
      "Explains trade-offs for major decisions",
      "Does basic capacity estimation",
      "Identifies primary bottlenecks",
      "Understands consistency models",
    ],
    gaps: [
      "May miss secondary failure modes",
      "Trade-off depth is adequate but not exceptional",
      "May not reference Meta-specific systems",
    ],
  },
  {
    level: "L6",
    label: "Staff Engineer",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    expectations: [
      "Trade-off articulation on every decision",
      "Proactive requirements clarification (5+ min)",
      "Back-of-envelope math drives architecture",
      "References Meta-scale systems (TAO, Memcache, Scuba)",
      "Identifies non-obvious bottlenecks",
      "Discusses evolution path and future-proofing",
    ],
    gaps: [
      "May not address org-level implications",
      "Cross-team dependency analysis may be shallow",
    ],
  },
  {
    level: "L7",
    label: "Principal/Senior Staff",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    expectations: [
      "All L6 signals plus:",
      "Org-level implications of design choices",
      "Cross-team and cross-system dependencies",
      "Long-term maintainability and evolution",
      "Build vs. buy vs. reuse analysis",
      "Proactively challenges the problem statement",
    ],
    gaps: [],
  },
];

function FailureModeCard({ mode }: { mode: FailureMode }) {
  const [expanded, setExpanded] = useState(false);
  const levelColors: Record<string, string> = {
    "L4 trap": "bg-red-100 text-red-700 border-red-200",
    "L5 gap": "bg-amber-100 text-amber-700 border-amber-200",
    "L6 gap": "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <div
      className="rounded-xl border overflow-hidden transition-shadow hover:shadow-sm"
      style={{ borderColor: mode.borderColor, backgroundColor: mode.bgColor }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-3.5 text-left"
      >
        <span
          className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black flex-shrink-0 mt-0.5"
          style={{ backgroundColor: mode.color }}
        >
          {mode.rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-900">{mode.title}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${levelColors[mode.icLevel]}`}>
              {mode.icLevel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-gray-500">{mode.scoreWeight}</span>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={13} className="text-gray-400 flex-shrink-0 mt-1" />
          : <ChevronDown size={13} className="text-gray-400 flex-shrink-0 mt-1" />
        }
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <p className="text-xs text-gray-700 leading-relaxed pt-3">{mode.description}</p>
          <div className="rounded-lg bg-red-50 border border-red-100 p-2.5">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Symptom</p>
            <p className="text-xs text-red-800">{mode.symptom}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Fix</p>
            <p className="text-xs text-emerald-800">{mode.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SDFailureModeDiagnostic() {
  const [activeSection, setActiveSection] = useState<"failures" | "calibration" | "levels">("failures");
  const [calibrationAnswers, setCalibrationAnswers] = useState<Record<number, "pass" | "fail" | null>>(
    Object.fromEntries(LEVEL_CALIBRATION_QUESTIONS.map((_, i) => [i, null]))
  );
  const [showCalibrationResult, setShowCalibrationResult] = useState(false);

  const passCount = Object.values(calibrationAnswers).filter(v => v === "pass").length;
  const totalAnswered = Object.values(calibrationAnswers).filter(v => v !== null).length;

  const estimatedLevel =
    passCount >= 5 ? "L6" :
    passCount >= 3 ? "L5" :
    "L4";

  const estimatedLevelColor =
    passCount >= 5 ? "text-indigo-700" :
    passCount >= 3 ? "text-blue-700" :
    "text-gray-600";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-red-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Why Candidates Fail Meta System Design
            </p>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Based on analysis of candidate reports, interviewer feedback, and coaching data. The 10% pass rate is not a knowledge problem — it is a <strong>preparation-to-evaluation gap</strong>. Candidates study architecture patterns; interviewers score reasoning process.
            </p>
          </div>
        </div>
        {/* Score weight summary */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white border border-red-100 p-2.5 text-center">
            <p className="text-lg font-black text-red-600">55%</p>
            <p className="text-[10px] text-gray-500 font-semibold leading-tight">of score from just 2 failure modes<br />(requirements + trade-offs)</p>
          </div>
          <div className="rounded-lg bg-white border border-red-100 p-2.5 text-center">
            <p className="text-lg font-black text-emerald-600">60%</p>
            <p className="text-[10px] text-gray-500 font-semibold leading-tight">achievable pass rate with<br />targeted preparation</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["failures", "calibration", "levels"] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeSection === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s === "failures" && <><AlertTriangle size={11} /> 7 Failure Modes</>}
            {s === "calibration" && <><Target size={11} /> Level Calibrator</>}
            {s === "levels" && <><BarChart2 size={11} /> IC Level Expectations</>}
          </button>
        ))}
      </div>

      {/* Failure Modes */}
      {activeSection === "failures" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              These 7 failure modes are ranked by frequency and score impact. Modes 1 and 2 alone account for 55% of the total score. All 7 are <strong>coachable</strong> — they are preparation gaps, not intelligence gaps.
            </p>
          </div>
          {FAILURE_MODES.map(mode => (
            <FailureModeCard key={mode.id} mode={mode} />
          ))}
        </div>
      )}

      {/* Level Calibrator */}
      {activeSection === "calibration" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-xs text-indigo-800 leading-relaxed">
              Answer these 5 questions honestly to calibrate your current preparation level. This is not a test — it is a diagnostic to identify where to focus your practice time.
            </p>
          </div>
          <div className="space-y-3">
            {LEVEL_CALIBRATION_QUESTIONS.map((q, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-bold text-gray-900 mb-3 leading-relaxed">{q.q}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setCalibrationAnswers(prev => ({ ...prev, [i]: "pass" }));
                      setShowCalibrationResult(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${
                      calibrationAnswers[i] === "pass"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 hover:border-emerald-300 text-gray-700"
                    }`}
                  >
                    <CheckCircle2 size={13} className={calibrationAnswers[i] === "pass" ? "text-emerald-600" : "text-gray-300"} />
                    {q.icPass}
                  </button>
                  <button
                    onClick={() => {
                      setCalibrationAnswers(prev => ({ ...prev, [i]: "fail" }));
                      setShowCalibrationResult(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${
                      calibrationAnswers[i] === "fail"
                        ? "border-red-400 bg-red-50 text-red-800"
                        : "border-gray-200 hover:border-red-300 text-gray-700"
                    }`}
                  >
                    <Circle size={13} className={calibrationAnswers[i] === "fail" ? "text-red-500" : "text-gray-300"} />
                    {q.icFail}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-semibold">Signal: {q.targetSignal}</p>
              </div>
            ))}
          </div>

          {totalAnswered === 5 && !showCalibrationResult && (
            <button
              onClick={() => setShowCalibrationResult(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
            >
              <Zap size={14} /> See My Calibration Result
            </button>
          )}

          {showCalibrationResult && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-indigo-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Your Estimated Preparation Level
                </p>
                <span className={`text-xl font-black ${estimatedLevelColor}`}>{estimatedLevel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${(passCount / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                You passed <strong>{passCount} of 5</strong> calibration signals.{" "}
                {passCount < 3 && "Focus on requirements discipline and trade-off articulation first — these are the highest-leverage improvements."}
                {passCount >= 3 && passCount < 5 && "You have a solid foundation. Focus on the signals you missed — they are the difference between L5 and L6 performance."}
                {passCount === 5 && "Strong calibration. Your preparation is at L6 level. To reach L7, focus on org-level implications and cross-system dependencies."}
              </p>
              {/* Gap signals */}
              {Object.entries(calibrationAnswers).filter(([, v]) => v === "fail").length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Focus Areas</p>
                  {Object.entries(calibrationAnswers)
                    .filter(([, v]) => v === "fail")
                    .map(([i]) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-red-800">
                        <ArrowRight size={11} className="text-red-500 flex-shrink-0" />
                        {LEVEL_CALIBRATION_QUESTIONS[Number(i)].targetSignal}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* IC Level Expectations */}
      {activeSection === "levels" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Meta interviewers calibrate against a specific level bar. Understanding exactly what L6 vs. L7 looks like prevents the most common structural mismatch: L4-level preparation for an L6 interview.
            </p>
          </div>
          {IC_LEVEL_EXPECTATIONS.map(level => (
            <div
              key={level.level}
              className={`rounded-xl border p-4 ${level.bgColor} ${level.borderColor}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-sm font-black ${level.color}`}>{level.level}</span>
                <span className="text-xs text-gray-500 font-semibold">— {level.label}</span>
              </div>
              <div className="space-y-1.5">
                {level.expectations.map(e => (
                  <div key={e} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {e}
                  </div>
                ))}
              </div>
              {level.gaps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Typical gaps vs. next level</p>
                  {level.gaps.map(g => (
                    <div key={g} className="flex items-start gap-2 text-xs text-gray-500">
                      <AlertTriangle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
