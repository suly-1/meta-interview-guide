/**
 * PeerComparisonPrompts — Feature 14
 * For each behavioral question, shows strong/weak answer signals for L6 calibration.
 */
import { useState } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";

export interface QuestionSignals {
  question: string;
  strongSignals: string[];
  weakSignals: string[];
}

// Curated signals for the most common Meta behavioral questions
export const QUESTION_SIGNALS: QuestionSignals[] = [
  {
    question: "Tell me about a high-impact project you have worked on.",
    strongSignals: [
      "Quantifies impact with specific metrics (e.g., '40% latency reduction', '2M users affected')",
      "Describes cross-functional collaboration with named teams/functions",
      "Explains their specific technical decisions and trade-offs",
      "Shows ownership: drove the project from ambiguity to delivery",
    ],
    weakSignals: [
      "Uses 'we' throughout without clarifying personal contribution",
      "No measurable outcome — vague 'it went well'",
      "Describes a small-scope or low-visibility project",
      "Cannot articulate why the project mattered to the business",
    ],
  },
  {
    question: "Tell me about a time when your team had a conflict or disagreement with another team.",
    strongSignals: [
      "Acknowledges both sides had valid perspectives",
      "Describes specific actions taken to find common ground",
      "Shows empathy and active listening skills",
      "Outcome benefited both teams, not just their own",
    ],
    weakSignals: [
      "Frames the other team as simply wrong",
      "Escalated to management without attempting direct resolution",
      "Cannot articulate what the other team's concern actually was",
      "Outcome was a win-lose rather than collaborative resolution",
    ],
  },
  {
    question: "Tell me about a time you had to make a difficult technical decision with incomplete information.",
    strongSignals: [
      "Explicitly names what data was missing and why",
      "Describes a structured framework for evaluating options under uncertainty",
      "Made a reversible decision with a clear rollback plan",
      "Communicated risk and uncertainty to stakeholders proactively",
    ],
    weakSignals: [
      "Waited for perfect information before deciding",
      "Cannot articulate the trade-offs between options",
      "Decision was based on gut feeling with no structured reasoning",
      "Did not communicate uncertainty to stakeholders",
    ],
  },
  {
    question: "Describe a time you identified a significant technical risk before it became critical.",
    strongSignals: [
      "Explains how they detected the risk (monitoring, code review, architecture review)",
      "Quantifies the potential impact if left unaddressed",
      "Built consensus to prioritize the fix over feature work",
      "Implemented a systematic fix, not just a workaround",
    ],
    weakSignals: [
      "Discovered the risk after it had already caused an incident",
      "Raised the risk but did not drive the resolution",
      "Cannot explain why the risk was significant",
      "Fix was a one-off patch without addressing root cause",
    ],
  },
  {
    question: "Describe a time you had to debug or resolve a production incident under pressure.",
    strongSignals: [
      "Describes a structured debugging methodology (isolate, hypothesize, test)",
      "Shows clear communication cadence during the incident",
      "Identifies root cause, not just the symptom",
      "Implemented a post-mortem with preventive measures",
    ],
    weakSignals: [
      "Panicked or made changes without a clear hypothesis",
      "Fixed the symptom but not the root cause",
      "Poor communication with stakeholders during the incident",
      "No follow-up to prevent recurrence",
    ],
  },
];

export default function PeerComparisonPrompts({ question }: { question: string }) {
  const [open, setOpen] = useState(false);
  const signals = QUESTION_SIGNALS.find(s => s.question === question);

  if (!signals) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">L6 Answer Signals</span>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>
      {open && (
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsUp size={13} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Strong Answer Signals</span>
            </div>
            <ul className="space-y-1.5">
              {signals.strongSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-red-50/30">
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsDown size={13} className="text-red-500" />
              <span className="text-xs font-bold text-red-600">Weak Answer Signals</span>
            </div>
            <ul className="space-y-1.5">
              {signals.weakSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
