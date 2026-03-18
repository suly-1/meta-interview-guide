// Design: Structured Clarity — behavioral tab with focus areas, STAR cards, Meta values
import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { BEHAVIORAL_FOCUS_AREAS, META_VALUES } from "@/lib/guideData";

const VALUE_COLORS: Record<string, { bg: string; border: string; title: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    title: "text-blue-800"    },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  title: "text-indigo-800"  },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    title: "text-teal-800"    },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  title: "text-purple-800"  },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   title: "text-amber-800"   },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-800" },
};

function FocusArea({ area }: { area: typeof BEHAVIORAL_FOCUS_AREAS[0] }) {
  const [openQ, setOpenQ] = useState<number | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: area.borderColor }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: area.bgColor }}>
        <div>
          <h3 className="font-bold text-sm" style={{ color: area.titleColor, fontFamily: "'Space Grotesk', sans-serif" }}>
            {area.title}
          </h3>
          <span className="text-xs font-medium" style={{ color: area.iconColor }}>{area.subtitle}</span>
        </div>
      </div>
      <div className="p-4 bg-white border-t" style={{ borderColor: area.borderColor + "80" }}>
        <p className="text-sm text-gray-500 italic mb-4 leading-relaxed">{area.description}</p>
        <div className="space-y-2">
          {area.questions.map((q, qi) => (
            <div key={qi} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
                onClick={() => setOpenQ(openQ === qi ? null : qi)}
              >
                <span className="text-sm font-semibold text-gray-800 leading-snug">{q.question}</span>
                <ChevronRight
                  size={14}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${openQ === qi ? "rotate-90" : ""}`}
                />
              </button>
              {openQ === qi && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Follow-up probes</p>
                  <ul className="space-y-1.5">
                    {q.probes.map((probe, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-sm text-gray-700">
                        <ChevronRight size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        {probe}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STAR_ITEMS = [
  {
    letter: "S",
    title: "Situation",
    desc: "Set the context. What was the project, team size, timeline? What was at stake? Include scale metrics (users, revenue, team size). Keep this brief — 15–20% of your answer.",
    pct: "15–20%",
  },
  {
    letter: "T",
    title: "Task",
    desc: "What was your specific responsibility? What was the challenge or goal? Be clear about YOUR role vs the team's role. Interviewers want to know what you personally owned.",
    pct: "10–15%",
  },
  {
    letter: "A",
    title: "Action",
    desc: "What did YOU specifically do? Walk through your decision-making process. Include technical details, stakeholder management, and trade-offs considered. This is the most important part.",
    pct: "50–60%",
  },
  {
    letter: "R",
    title: "Result",
    desc: "What was the measurable outcome? Include metrics: latency reduction %, users impacted, revenue generated, time saved. What did you learn? What would you do differently?",
    pct: "15–20%",
  },
];

export default function BehavioralTab() {
  return (
    <div className="space-y-10">
      {/* Overview */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The Behavioral Interview at Meta
          </h2>
          <p className="text-sm text-gray-500 mt-1">Meta's 4 core focus areas — with real questions and follow-up probes from interviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800 mb-1">The STAR Method + Meta's Probing Style</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Meta interviewers use a structured probing approach. They ask an opening question, then follow up with specific probes about scope, relationships, process, and outcome. Prepare <strong>6–8 STAR stories</strong> that can flex across multiple focus areas. Each story should include concrete metrics.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="w-1 rounded-full bg-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">The Three Things Meta Tests at IC6+</p>
              <p className="text-sm text-red-700 leading-relaxed">
                (1) <strong>Autonomy and Ownership</strong> — can you drive complex projects without being managed? (2) <strong>Influence Without Authority</strong> — can you align other teams and senior leaders? (3) <strong>Learning Loops</strong> — do you actively seek feedback and improve?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meta's 6 Core Values */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Meta's Six Core Values
          </h2>
          <p className="text-sm text-gray-500 mt-1">Every behavioral answer should be grounded in one or more of these values</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {META_VALUES.map((v) => {
            const c = VALUE_COLORS[v.color];
            return (
              <div key={v.name} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                <h4 className={`font-bold text-sm mb-1.5 ${c.title}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {v.name}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Focus Areas */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The 4 Behavioral Focus Areas
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real questions and follow-up probes used by Meta interviewers in 2025–2026</p>
        </div>
        <div className="space-y-5">
          {BEHAVIORAL_FOCUS_AREAS.map((area) => (
            <FocusArea key={area.id} area={area} />
          ))}
        </div>
      </section>

      {/* STAR Framework */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The STAR Framework for Meta
          </h2>
          <p className="text-sm text-gray-500 mt-1">How to structure every behavioral answer to maximize signal and score</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAR_ITEMS.map((s) => (
            <div key={s.letter} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.letter}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h4>
                  <span className="text-[11px] text-gray-400">{s.pct} of answer</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-1 rounded-full bg-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Prepare Your 2-Minute Elevator Pitch</p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Prepare a 2-minute "elevator pitch" for your best project that covers: what the project was, why it was hard, what your specific role was, and what the outcome was. Then be ready to go deep on any aspect the interviewer wants to explore. Practice this with a friend or a coach until it feels completely natural.
            </p>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Behavioral Prep Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { tag: "Free", tagColor: "emerald", title: "Awesome Behavioral Interviews — GitHub", desc: "Comprehensive behavioral question bank with STAR framework guidance and company-specific patterns. Community-maintained and regularly updated.", url: "https://github.com/ashishps1/awesome-behavioral-interviews" },
            { tag: "Platform", tagColor: "rose", title: "Taro — Career Q&A Platform", desc: "Real Q&A from Meta/Google engineers on navigating behavioral interviews, leveling decisions, and career growth at FAANG.", url: "https://www.jointaro.com/questions/?sort=great_discussion" },
            { tag: "AI Tool", tagColor: "cyan", title: "Ethan Evans AI Career Coach", desc: "AI-powered executive career coach by Ethan Evans (ex-Amazon VP). Excellent for senior-level behavioral prep and leadership storytelling.", url: "https://chatgpt.com/g/g-673f8563b070819195e9956bae3313da-ethan-evans-ai-executive-career-coach" },
            { tag: "Guide", tagColor: "blue", title: "Meta Behavioral Interview Guide — igotanoffer", desc: "Detailed guide on Meta's behavioral interview format, focus areas, and preparation strategy with example answers.", url: "https://igotanoffer.com/en/advice/meta-behavioral-interviews" },
          ].map((r) => (
            <a
              key={r.title}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5 inline-block bg-${r.tagColor}-100 text-${r.tagColor}-700`}>
                    {r.tag}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {r.title}
                  </p>
                </div>
                <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
