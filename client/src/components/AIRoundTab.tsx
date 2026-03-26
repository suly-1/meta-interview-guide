// Design: Structured Clarity — AI-enabled round tab enriched with Coditioning article content
import { useState } from "react";
import { Brain, Code2, ShieldCheck, MessageSquare, AlertTriangle, CheckCircle2, ExternalLink, Info, Zap, BookOpen, Users, Mic, Target } from "lucide-react";
import AIMockProblemBank from "@/components/AIMockProblemBank";
import AIRoundMockSession from "@/components/AIRoundMockSession";
import ScreenInterviewWatermark from "@/components/ScreenInterviewWatermark";

const LENSES = [
  {
    icon: <Brain size={18} />,
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "1. Problem Solving",
    desc: "Are you able to clarify and refine problem statements? Can you generate solutions to open-ended and quantitative problems? Restate the task in your own words. Break it into steps: data flow → core operations → edge handling. Build a requirements checklist before touching code.",
  },
  {
    icon: <Code2 size={18} />,
    bg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    title: "2. Code Development & Understanding",
    desc: "Are you able to navigate a codebase to develop and build on working code structures and evaluate the quality of produced code? Can you analyze and improve code quality and maintainability? Does code work as intended after it is executed? Match the naming and style of existing code. Generate a skeleton before implementing logic.",
  },
  {
    icon: <ShieldCheck size={18} />,
    bg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    title: "3. Verification & Debugging",
    desc: "Can you find and mitigate errors to ensure code runs/functions as intended? Are you able to verify solutions meet specified requirements? Write tests first (or understand pre-written tests). Run and debug in small iterations — fix one thing at a time. Re-run the full test suite after every fix to catch regressions.",
  },
  {
    icon: <MessageSquare size={18} />,
    bg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "4. Technical Communication",
    desc: "How well can you communicate reasoning, discuss technical ideas, ask thoughtful questions, and incorporate feedback? Narrate your high-level plan every 60–90 seconds. Be ready for non-coding discussion: runtime analysis, trade-offs, contract changes, data reasoning.",
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
    desc: "Write test cases before implementing. Cover the golden path + edge cases. If pre-written tests exist, trace them to understand expected behavior before touching implementation code. In Python, use unittest.TestCase so you're comfortable tracing test failures across files.",
  },
  {
    label: "4. Skeleton",
    desc: "Generate class/function structure with TODO stubs. Match existing code style exactly. This gives a shared mental model before implementation details distract you and the interviewer.",
  },
  {
    label: "5. Iterative Pipeline",
    desc: "Ask AI to implement one small slice (1–2 functions max). While AI drafts, review the previous chunk or explain next steps to the interviewer. Paste only after a quick correctness check. Run assertions for that slice before continuing. This minimizes idle time and shows you can multitask effectively.",
  },
  {
    label: "6. Verify & Debug",
    desc: "Read failures carefully: actual vs expected output, stack trace. Apply the smallest possible fix. Re-run all tests after every fix. Never refactor multiple functions at once. Regressions are silent killers.",
  },
];

const ANTI_PATTERNS = [
  { bad: "Letting AI Drive", fix: "Always propose your plan first. Use AI to execute your vision, not decide it." },
  { bad: "Giant Unreviewed Pastes", fix: "Request small outputs (10–20 lines). Review line by line before pasting." },
  { bad: "Skipping Tests", fix: "Write tests or understand pre-written ones. Run early, run often. Don't eyeball — you'll be shocked when it fails on edge cases." },
  { bad: "Long Stretches of Silence", fix: "Narrate your high-level plan or next step every 60–90 seconds. The interviewer needs to know if you're stuck or making progress." },
  { bad: "Nonstop Narration", fix: "Talk when it adds value. Silence while reviewing code is fine." },
  { bad: "Premature Optimization", fix: "Correctness first. Optimize only after tests pass and if time allows." },
  { bad: "Ignoring Regressions", fix: "Run all assertions after every fix. Fix one test and break two others — you won't notice unless you run the full suite." },
];

const PREP_STEPS = [
  {
    icon: <BookOpen size={16} />,
    title: "1. Request the Practice CoderPad",
    desc: "If you didn't receive an official practice session, ask your recruiter. It's the best way to familiarize yourself with the environment and the AI model switcher. Practice with the actual UI before your interview.",
  },
  {
    icon: <Zap size={16} />,
    title: "2. Run AI-Assisted Mocks",
    desc: "Practice with GPT-4o mini, Claude 3.5 Haiku, or Claude in standard mode. Simulate the full workflow: build a requirements checklist → write assertions first → use AI to scaffold in chunks → review every line → debug in small iterations. Practice all 3 scenarios: building from scratch, extending unfamiliar code, and debugging broken code under time pressure.",
  },
  {
    icon: <ShieldCheck size={16} />,
    title: "3. Master Edge Cases",
    desc: "Get comfortable rigorously laying out test cases. Practice covering: empty inputs, boundary values, duplicates, case sensitivity, null/None handling, and large inputs. Edge cases are where candidates lose points.",
  },
  {
    icon: <Zap size={16} />,
    title: "4. Practice Pipelining",
    desc: "Set a timer and practice working while the AI generates: AI drafts function X → you review function X-1 or explain next steps to the interviewer. This minimizes idle time and shows you can multitask effectively.",
  },
  {
    icon: <Users size={16} />,
    title: "5. Mock with a Human",
    desc: "Get feedback from someone else. If you can, record the session so you can play it back. Focus on communication quality, not just code correctness.",
  },
  {
    icon: <Mic size={16} />,
    title: "6. Practice Non-Coding Discussion",
    desc: "Spend time analyzing problems for: runtime complexity (best, average, worst case), trade-offs (speed vs. memory, simplicity vs. performance), alternative approaches and when each makes sense, and contract design (what should functions promise?).",
  },
];

const FAQ = [
  {
    q: "Can I run code during the interview?",
    a: "Yes. Running and iterating is central to how you're evaluated. You're expected to execute, read failures, and fix bugs in real time.",
  },
  {
    q: "Does the AI just solve it for me?",
    a: "No. It's a helper, not a solver. Think of it as a brilliant assistant who can scaffold fast but needs your guidance on what to build and your review to catch mistakes.",
  },
  {
    q: "How capable is the assistant?",
    a: "Helpful for boilerplate and routine tasks, but not a frontier reasoning model. It can suggest suboptimal algorithms, miss constraints, or introduce subtle bugs. You're responsible for verification.",
  },
  {
    q: "Do I have to use the AI assistant?",
    a: "No. AI access can vary by interviewer. In some pads, you may be asked to complete the first checkpoint without AI, then use it for the remaining checkpoints. Some candidates barely touch the AI and excel.",
  },
  {
    q: "What languages are supported?",
    a: "Python, Java, C++, C#, and TypeScript. Unit test frameworks: Python → unittest, C++ → GoogleTest (gtest), C# → NUnit, Java → JUnit. Always confirm with your recruiter.",
  },
  {
    q: "Who takes this round?",
    a: "Confirmed for SWEs, ML engineers, and Engineering Managers (M1). Expected but unconfirmed for Production Engineers. Confirm with your recruiter.",
  },
];

export default function AIRoundTab() {
  const [view, setView] = useState<"guide" | "mock">("guide");
  return (
    <div className="space-y-6 relative">
      {/* ── Screen Interview watermark ── */}
      <ScreenInterviewWatermark className="absolute top-0 right-0" size="1.5rem" opacity={0.11} />
      {/* View switcher */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setView("guide")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            view === "guide" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen size={14} /> Guide
        </button>
        <button
          onClick={() => setView("mock")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            view === "mock" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Target size={14} /> Mock Session
        </button>
      </div>

      {view === "mock" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <AIRoundMockSession />
        </div>
      )}

      {view === "guide" && <div className="space-y-10">
      {/* Overview */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The AI-Enabled Coding Round
          </h2>
          <p className="text-sm text-gray-500 mt-1">Meta's newest interview format — introduced October 2025</p>
        </div>

        {/* Source credit + Practice links */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 flex-wrap">
            <Info size={13} className="text-gray-400 flex-shrink-0" />
            <span>Content enriched with insights from:</span>
            <a href="https://www.coditioning.com/blog/13/meta-ai-enabled-coding-interview-guide" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
              Coditioning Guide <ExternalLink size={11} />
            </a>
            <span className="text-gray-300">·</span>
            <a href="https://www.hellointerview.com/blog/meta-ai-enabled-coding" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
              HelloInterview Guide <ExternalLink size={11} />
            </a>
            <span className="text-gray-300">·</span>
            <a href="https://www.hellointerview.com/learn/ai-coding/overview/introduction" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
              HelloInterview AI Coding Overview <ExternalLink size={11} />
            </a>
          </div>

          {/* Practice Environment CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-violet-900">AI Coding Practice</p>
                <p className="text-xs text-violet-700 mt-0.5">Simulate the Meta CoderPad format with real AI assistance.</p>
                <a
                  href="https://www.hellointerview.com/practice/ai-coding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  hellointerview.com/practice/ai-coding <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-900">Complete AI Coding Guide</p>
                <p className="text-xs text-blue-700 mt-0.5">Comprehensive overview of AI-enabled coding interviews across all companies.</p>
                <a
                  href="https://www.hellointerview.com/learn/ai-coding/overview/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  hellointerview.com/learn/ai-coding <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Key callout */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800 mb-1">What This Round Is (and Isn't)</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              This is <strong>NOT</strong> an interview about how well you use AI. The AI is a tool to help you demonstrate coding skills more efficiently and in a more job-relevant way. You are evaluated on problem-solving, code quality, and verification — not prompt engineering. Some candidates barely touch the AI and excel. Others use it heavily for boilerplate and grunt work while driving design themselves — and they also excel.
            </p>
          </div>
        </div>

        {/* Quick reference cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Format",
              body: "60 minutes in CoderPad with an AI-assist chat window. One thematic question with multiple checkpoints. You write, run, and debug real code in a mini multi-file codebase.",
            },
            {
              title: "AI Models Available",
              body: "Confirmed: GPT-4o mini, Claude 3.5 Haiku, Llama 4 Maverick. The AI can see all code in your editor — no copy-paste needed. All models can hallucinate. Treat output as drafts to review.",
            },
            {
              title: "Checkpoint Target",
              body: "Clearing 3 checkpoints is the minimum threshold — but not a guarantee. Aim for 4+ for a strong outcome. Candidates clearing only 3 have still received rejections.",
            },
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
              Let AI handle boilerplate, parsing, and variable naming. You handle design, verification, and anything requiring judgment. You'll get the best results by telling the AI <em>exactly</em> what to implement — a specific function or small slice of logic — rather than asking it to "figure out" the entire solution.
            </p>
          </div>
        </div>
      </section>

      {/* How to Prepare */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            How to Prepare: 6 Actionable Steps
          </h2>
          <p className="text-sm text-gray-500 mt-1">Concrete preparation moves that directly map to the evaluation criteria</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREP_STEPS.map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Common Questions
          </h2>
          <p className="text-sm text-gray-500 mt-1">Frequently asked questions from candidates preparing for this round</p>
        </div>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Q: {f.q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Mock Problem Bank */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-violet-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AI-Enabled Mock Problem Bank
          </h2>
        </div>
        <AIMockProblemBank />
      </section>

      {/* Final Thoughts */}
      <section>
        <div className="flex gap-3 p-5 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl text-white">
          <div className="w-1 rounded-full bg-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold mb-2">Final Thought: You're Still the Engineer</p>
            <p className="text-sm leading-relaxed text-blue-100">
              The AI assistant changes your workflow, but it doesn't change what interviewers value: clear thinking, sound judgment, and the ability to verify your work. The candidates who succeed treat the AI like a capable assistant — useful for speed, but needing oversight. They plan first, test constantly, and review everything before it ships. The candidates who struggle treat the AI like a magic box: paste without review, skip verification, and hope for the best.
            </p>
            <p className="text-sm mt-3 font-semibold text-white">Remember: this is not an interview about how well you use AI. It's about demonstrating your coding skills efficiently. <em>You're the engineer. The AI is just the tool.</em></p>
          </div>
        </div>
      </section>

    </div>}
    </div>
  );
}
