// InterviewerPersonaSimulator — 4 distinct interviewer personas with different follow-up styles
// Each persona applies a different dynamic to the same question bank
import { useState, useCallback, useMemo } from "react";
import { Play, RotateCcw, ChevronRight, ChevronDown, User } from "lucide-react";
import { BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";

interface Persona {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  style: string;
  color: string;
  bgColor: string;
  borderColor: string;
  followUpStyle: string;
  followUps: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "prober",
    name: "The Prober",
    emoji: "🔍",
    tagline: "Digs deep on every answer",
    description: "Follows up on every vague statement. If you say 'we', they ask 'what did YOU specifically do?'. If you say 'impact', they ask 'what were the exact numbers?'. Expects precision.",
    style: "Relentless follow-up on specifics",
    color: "blue",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    followUpStyle: "text-blue-800",
    followUps: [
      "What did YOU specifically do — not the team?",
      "What were the exact metrics? Give me numbers.",
      "Walk me through your decision-making step by step.",
      "What alternatives did you consider and why did you reject them?",
      "How did you measure success? What was the baseline?",
      "What would you do differently if you had to do it again?",
      "Who else was involved and what was your specific contribution?",
      "What was the hardest part and how did you overcome it?",
    ],
  },
  {
    id: "skeptic",
    name: "The Skeptic",
    emoji: "🤨",
    tagline: "Challenges your impact claims",
    description: "Questions whether your impact was really that significant. Pushes back on attribution ('was that really because of your work?'), scope ('was this actually cross-functional?'), and outcomes ('could this have happened anyway?').",
    style: "Challenges attribution and scope",
    color: "amber",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    followUpStyle: "text-amber-800",
    followUps: [
      "How do you know that outcome was because of your work specifically?",
      "Couldn't someone else have done this without you?",
      "Was this really cross-functional or just within your team?",
      "That impact sounds large — how confident are you in that number?",
      "What would have happened if you hadn't done this?",
      "How did you validate that your approach was the right one?",
      "Were there any negative consequences you're not mentioning?",
      "How did others on the team feel about your approach?",
    ],
  },
  {
    id: "friendly",
    name: "The Friendly",
    emoji: "😊",
    tagline: "Gives you space to elaborate",
    description: "Warm and encouraging. Gives you plenty of time, asks open-ended follow-ups, and creates a comfortable environment. The risk: you may ramble or under-structure your answer without the pressure of follow-ups.",
    style: "Open-ended, low-pressure follow-up",
    color: "emerald",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    followUpStyle: "text-emerald-800",
    followUps: [
      "That's interesting — can you tell me more about that?",
      "What was that experience like for you personally?",
      "How did that shape how you work now?",
      "Is there anything else you'd like to add?",
      "What did you learn from that situation?",
      "How did the team respond to your approach?",
      "What are you most proud of from that project?",
      "If you could go back, what would you do the same?",
    ],
  },
  {
    id: "ic7-bar",
    name: "The L7 Bar Setter",
    emoji: "🎯",
    tagline: "Probes for org-level scope",
    description: "Specifically probes for L7-level signals: org-wide impact, cross-org influence, strategic thinking, growing other leaders, and identifying what the org should be working on. If your answer is team-scoped, they'll push for more.",
    style: "Probes for org-level and strategic scope",
    color: "purple",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    followUpStyle: "text-purple-800",
    followUps: [
      "How did this impact teams or orgs beyond your immediate team?",
      "Did you identify this problem yourself or were you assigned it?",
      "How did you influence teams you had no authority over?",
      "What was the org-level or business-level impact?",
      "How did this shape the technical direction of the broader org?",
      "Did you grow or develop other senior engineers through this?",
      "What would have happened to the org if this hadn't been done?",
      "How did you align leadership and stakeholders across orgs?",
    ],
  },
];

// Flatten all questions from all focus areas
const ALL_QUESTIONS = BEHAVIORAL_FOCUS_AREAS.flatMap((area) =>
  area.questions.map((q) => ({
    question: q.question,
    probes: q.probes,
    areaTitle: area.title,
    areaBg: area.bgColor,
    areaBorder: area.borderColor,
    areaTitleColor: area.titleColor,
  }))
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function InterviewerPersonaSimulator() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [active, setActive] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [followUpIdx, setFollowUpIdx] = useState(0);
  const [showOriginalProbes, setShowOriginalProbes] = useState(false);

  const startSession = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    setQuestions(shuffle(ALL_QUESTIONS).slice(0, 6));
    setQuestionIdx(0);
    setShowFollowUps(false);
    setFollowUpIdx(0);
    setShowOriginalProbes(false);
    setActive(true);
  }, []);

  const nextQuestion = useCallback(() => {
    if (questionIdx + 1 >= questions.length) {
      setActive(false);
      return;
    }
    setQuestionIdx((i) => i + 1);
    setShowFollowUps(false);
    setFollowUpIdx(0);
    setShowOriginalProbes(false);
  }, [questionIdx, questions.length]);

  const nextFollowUp = useCallback(() => {
    if (!selectedPersona) return;
    const maxIdx = selectedPersona.followUps.length - 1;
    setFollowUpIdx((i) => Math.min(i + 1, maxIdx));
  }, [selectedPersona]);

  const currentQ = questions[questionIdx];

  const randomFollowUp = useMemo(() => {
    if (!selectedPersona) return "";
    return selectedPersona.followUps[followUpIdx % selectedPersona.followUps.length];
  }, [selectedPersona, followUpIdx]);

  if (!active) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>How it works:</strong> Choose a persona. You'll receive 6 behavioral questions. After answering each one mentally, reveal the persona's follow-up to practice handling their specific style. This trains you to adapt to different interviewer dynamics.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => startSession(persona)}
              className="text-left rounded-xl border p-4 hover:shadow-md transition-all group"
              style={{ background: persona.bgColor, borderColor: persona.borderColor }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl">{persona.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {persona.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">{persona.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{persona.description}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${persona.followUpStyle} bg-white`}
                  style={{ borderColor: persona.borderColor }}>
                  {persona.style}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-gray-700 group-hover:gap-2.5 transition-all">
                <Play size={11} /> Start with {persona.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!currentQ || !selectedPersona) return null;

  const isLastQuestion = questionIdx + 1 >= questions.length;

  return (
    <div className="rounded-xl border overflow-hidden shadow-md" style={{ borderColor: selectedPersona.borderColor }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ background: selectedPersona.bgColor }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{selectedPersona.emoji}</span>
          <div>
            <span className="text-xs font-bold text-gray-800">{selectedPersona.name}</span>
            <span className="text-[11px] text-gray-500 ml-2">— {selectedPersona.tagline}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Q{questionIdx + 1}/{questions.length}</span>
          <button onClick={() => setActive(false)}
            className="text-xs text-gray-400 hover:text-gray-700 bg-white/60 hover:bg-white px-2.5 py-1 rounded-lg transition-colors font-semibold">
            Exit
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-5 pt-3" style={{ background: selectedPersona.bgColor }}>
        {questions.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i < questionIdx ? "bg-emerald-500" : i === questionIdx ? "bg-purple-600" : "bg-gray-200"
          }`} />
        ))}
      </div>

      <div className="p-5 bg-white space-y-4">
        {/* Area tag */}
        <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full inline-block"
          style={{ background: currentQ.areaBg, color: currentQ.areaTitleColor, border: `1px solid ${currentQ.areaBorder}` }}>
          {currentQ.areaTitle.replace(/Focus Area \d+: /, "")}
        </span>

        {/* Question */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Question</p>
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">{currentQ.question}</p>
        </div>

        {/* Persona follow-up */}
        <div>
          <button
            onClick={() => setShowFollowUps(!showFollowUps)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: selectedPersona.bgColor, border: `1px solid ${selectedPersona.borderColor}`, color: selectedPersona.followUpStyle.replace("text-", "") }}
          >
            <div className="flex items-center gap-2">
              <User size={13} />
              <span>{selectedPersona.emoji} {selectedPersona.name} Follow-up</span>
            </div>
            {showFollowUps ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>

          {showFollowUps && (
            <div className="mt-2 rounded-xl border p-4" style={{ borderColor: selectedPersona.borderColor, background: selectedPersona.bgColor }}>
              <p className={`text-sm font-semibold leading-relaxed mb-3 ${selectedPersona.followUpStyle}`}>
                "{randomFollowUp}"
              </p>
              <button
                onClick={nextFollowUp}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={11} /> Another follow-up from this persona
              </button>
            </div>
          )}
        </div>

        {/* Original probes (collapsible) */}
        <div>
          <button
            onClick={() => setShowOriginalProbes(!showOriginalProbes)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            {showOriginalProbes ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Show original interviewer probes
          </button>
          {showOriginalProbes && (
            <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <ul className="space-y-1.5">
                {currentQ.probes.map((probe, pi) => (
                  <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                    <ChevronRight size={11} className="text-gray-300 flex-shrink-0 mt-0.5" />
                    {probe}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={nextQuestion}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            {isLastQuestion ? "Finish Session" : <>Next Question <ChevronRight size={13} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
