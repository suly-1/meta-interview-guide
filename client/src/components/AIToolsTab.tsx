// AIToolsTab — Curated 2026 AI coding & interview prep tools for Meta candidates
import { ExternalLink, Star, AlertTriangle, Zap, Users, Code2, Brain, Cpu, MessageSquare } from "lucide-react";

interface Tool {
  name: string;
  tagline: string;
  description: string;
  metaTip: string;
  link: string;
  badge?: string;
  badgeColor?: string;
  warning?: string;
  icon: React.ReactNode;
  category: "coding" | "simulator" | "platform";
}

const TOOLS: Tool[] = [
  // ── Coding & Practice Tools ──────────────────────────────────────────────
  {
    category: "coding",
    name: "Cursor AI",
    tagline: "The default AI IDE for serious prep",
    description:
      "A fork of VS Code with AI deeply integrated into every aspect. Multi-file edits (Composer mode) and proactive tab-autocomplete make it the go-to environment for practising clean, production-quality code — exactly what Meta interviewers expect.",
    metaTip:
      "Use Cursor's Composer mode to refactor your solutions after each practice session. Ask it to 'review this code for Meta IC6 standards — flag any readability or complexity issues.'",
    link: "https://cursor.sh",
    badge: "Most Popular",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    icon: <Code2 size={20} />,
  },
  {
    category: "coding",
    name: "Claude Code",
    tagline: "Strongest coding brain for debugging & deep reasoning",
    description:
      "Anthropic's Claude is widely regarded as having the best reasoning for debugging, refactoring legacy code, and handling complex algorithmic problems. Particularly valuable for the AI-Enabled Coding Round where you must explain your reasoning to an AI assistant.",
    metaTip:
      "Practise the AI-Enabled Round by asking Claude to play the role of the AI assistant in CoderPad. Prompt: 'You are an AI coding assistant in a Meta interview. I will share my code and you will ask me clarifying questions about my approach, not give me the answer.'",
    link: "https://claude.ai/code",
    badge: "Best for AI Round",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    icon: <Brain size={20} />,
  },
  {
    category: "coding",
    name: "Final Round AI",
    tagline: "Real-time interview copilot with follow-up questions",
    description:
      "Provides real-time, context-aware suggestions during live coding sessions. Simulates interview pressure by generating follow-up questions and evaluating your answers — closely mimicking how a Meta interviewer probes your reasoning.",
    metaTip:
      "Use Final Round AI's follow-up question mode to practise the 'what if the input is very large?' and 'can you do better than O(n²)?' challenges that Meta interviewers consistently ask at IC6/IC7.",
    link: "https://www.finalroundai.com",
    badge: "Interview Copilot",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    icon: <Cpu size={20} />,
  },
  {
    category: "coding",
    name: "LeetCode Wizard",
    tagline: "Desktop app with 93% pass rate (May 2025)",
    description:
      "A dedicated desktop app for LeetCode practice with instant solutions, edge case testing, and detailed explanations. The 93% pass rate figure reflects its effectiveness for building pattern recognition across the 14 core patterns Meta tests.",
    metaTip:
      "Focus LeetCode Wizard on the 14 patterns in this guide — Arrays & Hashing, Two Pointers, Sliding Window, Trees, Graphs, Heaps, Binary Search, Backtracking, Dynamic Programming, Tries, Intervals, Greedy, Bit Manipulation, and Stack.",
    link: "https://leetcodewizard.io",
    warning:
      "LeetCode Wizard includes a 'stealth mode' designed to be invisible during screen sharing. Using this during a real Meta interview would violate Meta's interview policy and could result in disqualification. Use it only for solo practice.",
    icon: <Zap size={20} />,
  },

  // ── Live Mock Interview Simulators ────────────────────────────────────────
  {
    category: "simulator",
    name: "CoderPad",
    tagline: "Meta's actual interview platform — practise here",
    description:
      "CoderPad is the collaborative IDE that Meta uses for all coding interviews. It supports live coding, multi-language support, and pair programming. Practising directly in CoderPad eliminates the 'unfamiliar environment' variable on interview day.",
    metaTip:
      "Meta uses CoderPad for both the traditional coding round and the new AI-Enabled Coding Round (introduced October 2025). Get comfortable with its keyboard shortcuts, the language switcher, and the notes panel before your interview.",
    link: "https://coderpad.io/sandbox",
    badge: "Meta Uses This",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: <Code2 size={20} />,
  },
  {
    category: "simulator",
    name: "Interviewing.io",
    tagline: "Anonymous mock interviews with real FAANG engineers",
    description:
      "Connects you with real FAANG engineers for anonymous, high-signal mock interviews. The feedback is authentic in a way AI cannot replicate — a real engineer will notice communication patterns, hesitation, and code quality issues that automated tools miss.",
    metaTip:
      "Book at least 2 sessions with engineers who have Meta experience. Ask them specifically: 'Did my communication match what you'd expect from an IC6 candidate?' The answer will tell you more than any AI debrief.",
    link: "https://interviewing.io",
    badge: "Highest Signal",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    icon: <Users size={20} />,
  },
  {
    category: "simulator",
    name: "Pramp",
    tagline: "Free peer-to-peer mock interviews",
    description:
      "A free platform for peer-to-peer mock interviews. You practise with another engineer preparing for interviews, taking turns as interviewer and candidate. The communication practice — explaining your thinking out loud — is irreplaceable for Meta's Technical Communication dimension.",
    metaTip:
      "When you play the interviewer role on Pramp, use Meta's 4-dimension rubric from this guide to score your partner. You will learn what 'Strong' vs. 'Solid' communication looks like from the other side of the table.",
    link: "https://www.pramp.com",
    icon: <MessageSquare size={20} />,
  },
];

const CATEGORY_META = {
  coding: {
    label: "AI Coding & Practice Tools",
    subtitle: "Use these to build skills, practise patterns, and simulate the AI-Enabled Round",
    color: "border-blue-500/30 bg-blue-500/5",
    headerColor: "text-blue-300",
  },
  simulator: {
    label: "Live Mock Interview Simulators",
    subtitle: "Use these for high-fidelity practice with real humans or Meta's actual platform",
    color: "border-emerald-500/30 bg-emerald-500/5",
    headerColor: "text-emerald-300",
  },
};

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-3 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0">
            {tool.icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{tool.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{tool.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tool.badge && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tool.badgeColor}`}>
              {tool.badge}
            </span>
          )}
          <a
            href={tool.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold transition-colors"
          >
            Visit <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{tool.description}</p>

      {/* Meta Tip */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
          Meta Prep Tip
        </p>
        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{tool.metaTip}</p>
      </div>

      {/* Warning */}
      {tool.warning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 flex gap-2">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{tool.warning}</p>
        </div>
      )}
    </div>
  );
}

export default function AIToolsTab() {
  const codingTools = TOOLS.filter(t => t.category === "coding");
  const simulatorTools = TOOLS.filter(t => t.category === "simulator");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🛠️</span>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AI Tools & Resources for 2026
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-3xl">
          The best engineers preparing for Meta in 2026 are not just grinding LeetCode — they are using AI tools to practise smarter, simulate real interview conditions, and build the communication skills that separate a <strong>Strong</strong> from an <strong>Exceptional</strong> rating. This curated list covers the tools worth your time, with specific tips for Meta prep at IC4–IC7.
        </p>
      </div>

      {/* Context Engineering Callout */}
      <div className="bg-gradient-to-r from-violet-900/30 to-blue-900/30 border border-violet-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🧠</span>
          <div>
            <h3 className="font-bold text-violet-200 text-base mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The 2026 Shift: Context Engineering
            </h3>
            <p className="text-sm text-violet-100/80 leading-relaxed">
              The hottest AI tools in 2026 share one trait: <strong className="text-violet-200">repository context</strong> — the ability to understand how different code files interrelate, not just the file currently open. For Meta prep, this means using tools that can review your entire solution history, identify recurring weaknesses, and suggest targeted improvements across multiple practice sessions. The tools below are selected because they combine <strong className="text-violet-200">repository context</strong>, <strong className="text-violet-200">autonomous editing</strong>, and <strong className="text-violet-200">instant feedback</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Coding Tools Section */}
      <div>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${CATEGORY_META.coding.color}`}>
          <div>
            <h3 className={`text-lg font-bold ${CATEGORY_META.coding.headerColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {CATEGORY_META.coding.label}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{CATEGORY_META.coding.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {codingTools.map(tool => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </div>

      {/* Simulator Tools Section */}
      <div>
        <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${CATEGORY_META.simulator.color}`}>
          <div>
            <h3 className={`text-lg font-bold ${CATEGORY_META.simulator.headerColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {CATEGORY_META.simulator.label}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{CATEGORY_META.simulator.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulatorTools.map(tool => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </div>

      {/* Ethical Use Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">Ethical Use Reminder</h4>
            <p className="text-xs text-amber-700 dark:text-amber-200 leading-relaxed">
              AI tools are powerful for <strong>preparation</strong>, but using them during a live Meta interview (to receive real-time answers, generate code, or provide hidden assistance) violates Meta's interview policy and could result in immediate disqualification and a permanent ban from future applications. Use these tools to build genuine skills — not to circumvent the assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Comparison Table */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Quick Comparison
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Tool</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Best For</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Cost</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">AI-Enabled Round?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {[
                { name: "Cursor AI",         best: "Daily coding practice",          cost: "Free / $20/mo",  ai: "✓ Excellent" },
                { name: "Claude Code",        best: "Debugging & AI Round prep",      cost: "Free / $20/mo",  ai: "✓ Best-in-class" },
                { name: "Final Round AI",     best: "Live interview simulation",      cost: "$29/mo",         ai: "✓ Good" },
                { name: "LeetCode Wizard",    best: "Pattern drilling",               cost: "Paid",           ai: "— N/A" },
                { name: "CoderPad",           best: "Platform familiarity",           cost: "Free sandbox",   ai: "✓ Meta uses it" },
                { name: "Interviewing.io",    best: "Real human feedback",            cost: "Free / Paid",    ai: "— Human only" },
                { name: "Pramp",              best: "Communication practice",         cost: "Free",           ai: "— Human only" },
              ].map((row, i) => (
                <tr key={i} className="bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.best}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{row.cost}</td>
                  <td className={`px-4 py-3 font-medium ${row.ai.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>{row.ai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Star ratings / recommended stack */}
      <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Star size={16} className="text-amber-400 fill-amber-400" />
          Recommended Stack by Goal
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              goal: "Fastest ramp-up (4 weeks)",
              stack: ["Cursor AI", "LeetCode Wizard", "Pramp (2 sessions)"],
              color: "border-blue-400/30 bg-blue-500/5",
            },
            {
              goal: "AI-Enabled Round focus",
              stack: ["Claude Code", "Final Round AI", "CoderPad sandbox"],
              color: "border-teal-400/30 bg-teal-500/5",
            },
            {
              goal: "IC6/IC7 full prep (8–10 weeks)",
              stack: ["Cursor AI", "Claude Code", "Interviewing.io (3+ sessions)", "CoderPad sandbox"],
              color: "border-violet-400/30 bg-violet-500/5",
            },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl border p-4 ${item.color}`}>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">{item.goal}</p>
              <ul className="space-y-1">
                {item.stack.map((s, j) => (
                  <li key={j} className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
