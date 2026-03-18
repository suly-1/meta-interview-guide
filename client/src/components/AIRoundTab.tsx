// Design: Structured Clarity — AI-enabled round tab with 4 lenses, 6-step workflow, 7 anti-patterns
import { Brain, Code2, ShieldCheck, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";

const LENSES = [
  {
    icon: <Brain size={18} />,
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "1. Problem Solving",
    desc: "Clarify and refine problem statements. Restate the task in your own words. Break it into steps: data flow → core operations → edge handling. Build a requirements checklist before touching code.",
  },
  {
    icon: <Code2 size={18} />,
    bg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    title: "2. Code Development & Understanding",
    desc: "Navigate a multi-file codebase, build on working structures, evaluate and improve code quality. Match the naming and style of existing code. Generate a skeleton before implementing logic.",
  },
  {
    icon: <ShieldCheck size={18} />,
    bg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "3. Verification & Debugging",
    desc: "Write tests first (or understand pre-written tests). Run and debug in small iterations — fix one thing at a time. Re-run the full test suite after every fix to catch regressions.",
  },
  {
    icon: <MessageSquare size={18} />,
    bg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "4. Technical Communication",
    desc: "Communicate reasoning, discuss trade-offs, ask thoughtful questions. Narrate your high-level plan every 60–90 seconds. Be ready for non-coding discussion: runtime analysis, contract changes, data reasoning.",
  },
];

const WORKFLOW_STEPS = [
  {
    label: "1. Clarify",
    desc: "Restate the task, confirm inputs/outputs/constraints, identify edge cases (case sensitivity, empty input, duplicates). Build a visible requirements checklist before writing a single line of code.",
  },
  {
    label: "2. Analyze",
    desc: "Break into sub-problems. Compare approaches on simplicity, runtime, memory, and risk. Choose the most optimal feasible approach. Briefly outline which files/functions you'll touch.",
  },
  {
    label: "3. Assertions First",
    desc: "Write test cases before implementing. Cover the golden path + edge cases. If pre-written tests exist, trace them to understand expected behavior before touching implementation code.",
  },
  {
    label: "4. Skeleton",
    desc: "Generate class/function structure with TODO stubs. Match existing code style exactly. This gives a shared mental model before implementation details distract you and the interviewer.",
  },
  {
    label: "5. Iterative Pipeline",
    desc: "Ask AI to implement one small slice (1–2 functions max). While AI drafts, review the previous chunk. Paste only after a quick correctness check. Run assertions for that slice before continuing.",
  },
  {
    label: "6. Verify & Debug",
    desc: "Read failures carefully: actual vs expected output, stack trace. Apply the smallest possible fix. Re-run all tests after every fix. Never refactor multiple functions at once.",
  },
];

const ANTI_PATTERNS = [
  { bad: "Letting AI Drive", fix: "Always propose your plan first. Use AI to execute your vision, not decide it." },
  { bad: "Giant Unreviewed Pastes", fix: "Request small outputs (10–20 lines). Review line by line before pasting." },
  { bad: "Skipping Tests", fix: "Write tests or understand pre-written ones. Run early, run often." },
  { bad: "Long Stretches of Silence", fix: "Narrate your high-level plan or next step every 60–90 seconds." },
  { bad: "Nonstop Narration", fix: "Talk when it adds value. Silence while reviewing code is fine." },
  { bad: "Premature Optimization", fix: "Correctness first. Optimize only after tests pass and if time allows." },
  { bad: "Ignoring Regressions", fix: "Run all assertions after every fix. Regressions are silent killers." },
];

export default function AIRoundTab() {
  return (
    <div className="space-y-10">
      {/* Overview */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The AI-Enabled Coding Round
          </h2>
          <p className="text-sm text-gray-500 mt-1">Meta's newest interview format — introduced October 2025</p>
        </div>
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800 mb-1">What This Round Is (and Isn't)</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              This is <strong>NOT</strong> an interview about how well you use AI. The AI is a tool to help you demonstrate coding skills more efficiently. You are evaluated on problem-solving, code quality, and verification — not prompt engineering. Some candidates barely touch the AI and excel. Others use it heavily for boilerplate and also excel.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Format", body: "60 minutes in CoderPad with an AI-assist chat window. One thematic question with multiple checkpoints. You write, run, and debug real code in a multi-file codebase." },
            { title: "AI Models Available", body: "Confirmed: GPT-4o mini, Claude 3.5 Haiku, Llama 4 Maverick. Ask your recruiter for the practice CoderPad session to familiarize yourself with the interface." },
            { title: "Checkpoint Target", body: "Clearing 3 checkpoints is the minimum threshold. Aim for 4+ to have a strong outcome. Early checkpoints are achievable with minimal AI; later ones reward deeper engagement." },
          ].map((c) => (
            <div key={c.title} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h4 className="font-bold text-gray-900 text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Evaluation Lenses */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The 4 Evaluation Lenses
          </h2>
          <p className="text-sm text-gray-500 mt-1">What your interviewer is scoring you on throughout the session</p>
        </div>
        <div className="space-y-3">
          {LENSES.map((l) => (
            <div key={l.title} className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg ${l.bg} ${l.iconColor} flex items-center justify-center flex-shrink-0`}>
                {l.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{l.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6-Step Workflow */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The 6-Step Workflow
          </h2>
          <p className="text-sm text-gray-500 mt-1">A repeatable process to clear checkpoints efficiently and demonstrate all 4 evaluation lenses</p>
        </div>
        <div className="space-y-3">
          {WORKFLOW_STEPS.map((s, i) => (
            <div key={i} className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <span className="flex-shrink-0 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap h-fit mt-0.5">
                {s.label}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7 Anti-Patterns */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            7 Anti-Patterns That Sink Candidates
          </h2>
          <p className="text-sm text-gray-500 mt-1">Common mistakes observed in the AI-enabled round — and how to avoid them</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ANTI_PATTERNS.map((a) => (
            <div key={a.bad} className="bg-white border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                <span className="text-sm font-bold text-red-600">{a.bad}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">{a.fix}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Prompting Tips */}
        <div className="mt-6 flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-1 rounded-full bg-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800 mb-1">AI Prompting Best Practices</p>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Give excellent context in every prompt: what you're trying to do, constraints, current state, and a tiny example (input → expected output). The AI can see all code in your editor — no need to copy-paste. Constrain scope tightly:{" "}
              <code className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-xs font-mono">
                "Implement only the guess and display methods. No changes to __init__."
              </code>{" "}
              Let AI handle boilerplate, parsing, and variable naming. You handle design, verification, and anything requiring judgment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
