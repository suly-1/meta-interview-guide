// How to Use This Guide — fully static reference tab
// 12 collapsible sections, no backend calls, no auth required
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Target,
  Brain,
  Zap,
  BarChart2,
  Star,
  Users,
  Clock,
  RefreshCw,
  FileText,
  Keyboard,
  Map,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Code2,
  MessageSquare,
  Shield,
  Trophy,
  Swords,
  Eye,
  GitBranch,
  Wrench,
  HelpCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  icon,
  title,
  badge,
  badgeColor = "bg-blue-500/20 text-blue-300",
  children,
  defaultOpen = false,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-blue-400 shrink-0">{icon}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge && (
            <Badge className={`text-xs border-0 ${badgeColor}`}>{badge}</Badge>
          )}
        </div>
        {open ? (
          <ChevronDown size={15} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 py-4 space-y-4 text-sm text-muted-foreground leading-relaxed border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div>
        <p className="text-foreground font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
      <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-300">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
      <CheckCircle2 size={13} className="text-blue-400 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-300">{children}</p>
    </div>
  );
}

function TabCard({
  emoji,
  id,
  label,
  desc,
  when,
}: {
  emoji: string;
  id: string;
  label: string;
  desc: string;
  when: string;
}) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <code className="text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground/85 font-mono">
          {id}
        </code>
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
      <p className="text-xs text-blue-400 font-medium">When: {when}</p>
    </div>
  );
}

function DrillRow({
  num,
  title,
  category,
  time,
  trains,
  difficulty,
}: {
  num: number;
  title: string;
  category: string;
  time: string;
  trains: string;
  difficulty: "Warm-up" | "Core" | "Advanced";
}) {
  const diffColor =
    difficulty === "Warm-up"
      ? "bg-emerald-500/20 text-emerald-300"
      : difficulty === "Core"
        ? "bg-blue-500/20 text-blue-300"
        : "bg-red-500/20 text-red-300";
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3 text-xs text-muted-foreground font-mono">
        #{num}
      </td>
      <td className="py-2 pr-3 text-xs font-medium text-foreground">{title}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{category}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{time}</td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{trains}</td>
      <td className="py-2">
        <Badge className={`text-xs border-0 ${diffColor}`}>{difficulty}</Badge>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowToUseTab() {
  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-xl px-6 py-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-500/20 shrink-0">
            <BookOpen size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              How to Use This Guide
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              A complete reference for every feature — from the 6 content tabs
              to the 18 hands-on mock drills. Read the Quick Start first, then
              use the sections below as a reference whenever you need them.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">
                9 Tabs
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">
                18 Mock Drills
              </Badge>
              <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">
                4-Week Learning Path
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">
                5 Persona Archetypes
              </Badge>
              <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
                8 Failure Signals
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Quick Start */}
      <Section
        id="quick-start"
        icon={<Zap size={16} />}
        title="1 — Quick Start (3 Steps)"
        badge="Start Here"
        badgeColor="bg-emerald-500/20 text-emerald-300"
        defaultOpen={true}
      >
        <div className="space-y-3">
          <Step
            n={1}
            title="Set your target level"
            desc="Go to the Overview tab → Readiness Dashboard. Look at the IC Level Signal Calibrator to understand what L5, L6, and L7 answers look like. Decide which bar you're aiming for — this determines how you should interpret drill scores."
          />
          <Step
            n={2}
            title="Take the readiness check"
            desc="Still on Overview, scroll to the Weak-Spot Dashboard. Rate yourself on each pattern and behavioral area using the 1–5 stars. This populates your personal weak-spot heatmap and tells the Learning Path which week to prioritize."
          />
          <Step
            n={3}
            title="Pick your first drill"
            desc="Go to Failure Analysis → Hands-On Mock Drills. Start with Drill #1 (NFR Ambush) or Drill #9 (Failure Mode Flashcard Sprint) — both are Warm-up difficulty and give you an instant baseline score. Then follow the 4-Week Learning Path in order."
          />
        </div>
        <Note>
          All progress (ratings, drill scores, streak) is saved to your account
          when logged in, and falls back to localStorage when offline.
        </Note>
      </Section>

      {/* 2. The 9 Tabs */}
      <Section
        id="tabs"
        icon={<Map size={16} />}
        title="2 — The 9 Tabs"
        badge="Navigation"
        badgeColor="bg-blue-500/20 text-blue-300"
      >
        <p className="text-xs">
          Each tab covers a distinct preparation area. Use the top navigation
          bar to switch between them. Keyboard shortcuts{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-xs">
            1
          </kbd>
          –
          <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-xs">
            4
          </kbd>{" "}
          switch the first four tabs instantly.
        </p>
        <div className="grid grid-cols-1 gap-2">
          <TabCard
            emoji="📊"
            id="overview"
            label="Overview"
            desc="Readiness dashboard, weak-spot heatmap, drill score leaderboard, and IC level signal calibrator. Your personal command center."
            when="Start every session here to see where you stand."
          />
          <TabCard
            emoji="💻"
            id="coding"
            label="Coding"
            desc="14 core algorithm patterns with complexity tables, pattern ratings, and CTCI progress tracker."
            when="Use when preparing for the coding round or reviewing a specific pattern."
          />
          <TabCard
            emoji="🗣️"
            id="behavioral"
            label="Behavioral"
            desc="Full 7-area question bank (Influence, Ownership, Scale, Failure, XFN, Growth, Ambiguity) with STAR story builder and readiness ratings."
            when="Use 1–2 weeks before your interview to build and refine your story bank."
          />
          <TabCard
            emoji="🏗️"
            id="design"
            label="System Design"
            desc="Framework checklists, component deep-dives, real Meta system design questions, and trade-off guides."
            when="Use for structured system design review and before practicing live mock drills."
          />
          <TabCard
            emoji="🤖"
            id="ai-coding"
            label="AI Mock"
            desc="Full AI-powered coding mock interview with a real problem, timer, and post-session feedback."
            when="Use for timed end-to-end coding practice, especially in the final 2 weeks."
          />
          <TabCard
            emoji="🏋️"
            id="ai-training"
            label="Training"
            desc="10 focused AI training drills: Requirements Clarification, Complexity Flashcards, Rubber Duck Explainer, Checkpoint Pacer, Verbal Explanation Scorer, Test-First Debugger, AI Hallucination Spotter, Code Navigation Speed Test, Incremental Feature Builder, and Epistemic Humility Coach."
            when="Use for targeted skill-building between full mock sessions."
          />
          <TabCard
            emoji="✦"
            id="ai-native"
            label="AI Native"
            desc="8 drills specifically for the AI-enabled coding round: RAG Explainer, AI Stack Builder, Prompt Injection Defender, Epistemic Humility Coach, and more."
            when="Use if your loop includes an AI-native coding round (common at L6+)."
          />
          <TabCard
            emoji="📚"
            id="learning-path"
            label="Learning Path"
            desc="4-week structured study plan with embedded practice sessions. Each week has 3 drills that launch inline, a progress ring, and a session summary with scores."
            when="Use as your primary weekly study schedule from day 1."
          />
          <TabCard
            emoji="⚠️"
            id="failure-analysis"
            label="Failure Analysis"
            desc="7-part interactive reference covering why candidates fail (42% system design, 31% coding, 27% behavioral), 8 weak signal cards with inline drills, 18 hands-on mock drills, persona stress tests, and the down-leveling guide."
            when="Use in the final 2 weeks to stress-test your weak areas."
          />
        </div>
      </Section>

      {/* 3. Learning Path Sessions */}
      <Section
        id="learning-path"
        icon={<Map size={16} />}
        title="3 — Learning Path: 4-Week Practice Sessions"
        badge="Structured"
        badgeColor="bg-violet-500/20 text-violet-300"
      >
        <p>
          The Learning Path tab organizes your prep into 4 weeks, each with a
          "Start Session" button that launches 3 drills in sequence. Here is
          what each week covers:
        </p>
        <div className="space-y-2">
          {[
            {
              week: "Week 1 — Foundation",
              drills:
                "Requirements Clarification Drill → Complexity Flashcard Trainer → STAR Story Prompt (XFN Collaboration)",
              focus:
                "Build the core habits: clarify before designing, know your complexities, tell specific stories.",
            },
            {
              week: "Week 2 — Core Patterns",
              drills:
                "Rubber Duck Explainer → Checkpoint Pacer (15/25/15 rhythm) → Behavioral Timed Mock",
              focus:
                "Develop verbal fluency and time management under realistic interview pacing.",
            },
            {
              week: "Week 3 — Advanced Patterns",
              drills:
                "Code Navigation Speed Test → AI Hallucination Spotter → Epistemic Humility Coach",
              focus: "Sharpen edge-case thinking and AI-native round skills.",
            },
            {
              week: "Week 4 — Integration & Polish",
              drills:
                "Verbal Explanation Scorer → Test-First Debugger → Full Mock Screening Call",
              focus: "End-to-end simulation under real interview pressure.",
            },
          ].map(w => (
            <div
              key={w.week}
              className="border border-border rounded-lg p-3 space-y-1"
            >
              <p className="text-sm font-semibold text-foreground">{w.week}</p>
              <p className="text-xs text-blue-400">{w.drills}</p>
              <p className="text-xs text-muted-foreground">{w.focus}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">
            Reading the progress ring:
          </p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>
              <span className="text-muted-foreground">Grey ring</span> — session
              not started
            </li>
            <li>
              <span className="text-amber-400">Amber ring</span> — 1–2 drills
              completed this session
            </li>
            <li>
              <span className="text-emerald-400">Emerald ring</span> — all 3
              drills completed
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            The best score badge (e.g.,{" "}
            <strong className="text-foreground">82</strong>) shows your highest
            session score for that week, pulled from the database so it persists
            across devices.
          </p>
        </div>
        <Note>
          You can re-run any week's session as many times as you want. Only the
          best score is shown on the card.
        </Note>
      </Section>

      {/* 4. Customizing Your Learning Path */}
      <Section
        id="customize"
        icon={<Sliders size={16} />}
        title="4 — Customizing Your Learning Path"
        badge="Personalization"
        badgeColor="bg-amber-500/20 text-amber-300"
      >
        <p>
          The 4-week plan is a default schedule — it is designed to be adapted
          to your specific situation. Here are the main customization levers:
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Adjusting by time horizon
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Time to interview
                    </th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Recommended pace
                    </th>
                    <th className="text-left py-2 text-muted-foreground font-medium">
                      Focus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["4+ weeks", "1 week per phase", "Full plan in order"],
                    [
                      "2–3 weeks",
                      "Compress Weeks 1–2 into 1 week",
                      "Skip Warm-up drills, go straight to Core",
                    ],
                    [
                      "1 week",
                      "Weeks 3–4 only",
                      "Advanced drills + Failure Analysis only",
                    ],
                    [
                      "< 3 days",
                      "Failure Analysis only",
                      "Drill #9 (Flashcard Sprint) + Persona Stress Test",
                    ],
                  ].map(([time, pace, focus]) => (
                    <tr
                      key={time}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-2 pr-4 text-foreground font-medium">
                        {time}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {pace}
                      </td>
                      <td className="py-2 text-muted-foreground">{focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Adjusting by weak area
            </p>
            <p className="text-xs mb-2">
              Use your Weak-Spot Dashboard (Overview tab) to identify your
              lowest-rated areas, then map them to the drills that target them
              directly:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Weak area
                    </th>
                    <th className="text-left py-2 text-muted-foreground font-medium">
                      Drills to prioritize
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "System design — NFRs",
                      "#1 NFR Ambush, #12 Clarification Interrogator",
                    ],
                    [
                      "System design — bottlenecks",
                      "#2 Bottleneck Autopsy, #3 Scale Jump",
                    ],
                    [
                      "System design — trade-offs",
                      "#8 Trade-Off Pressure Cooker, #13 Devil's Advocate",
                    ],
                    [
                      "Coding — edge cases",
                      "#4 Edge Case Gauntlet, #16 Time Pressure Mock",
                    ],
                    [
                      "Behavioral — STAR specificity",
                      "#5 STAR Rewriter, #6 Ownership Extractor",
                    ],
                    ["Behavioral — XFN conflict", "#17 XFN Conflict Simulator"],
                    [
                      "Level signaling",
                      "#7 Down-Level Detector, Persona Stress Test",
                    ],
                    [
                      "Under pressure / interruptions",
                      "#11 The Interruptor, #15 Scope Creep, #18 Gotcha Follow-Up",
                    ],
                  ].map(([area, drills]) => (
                    <tr
                      key={area}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-2 pr-4 text-foreground font-medium">
                        {area}
                      </td>
                      <td className="py-2 text-blue-400">{drills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Adjusting by target level
            </p>
            <div className="space-y-2">
              {[
                {
                  level: "L5 target",
                  color: "text-emerald-400",
                  advice:
                    "Focus on Weeks 1–2 drills. Prioritize STAR specificity (#5, #6) and coding edge cases (#4). Skip Advanced drills until Core drills score ≥ 70.",
                },
                {
                  level: "L6 target",
                  color: "text-blue-400",
                  advice:
                    "Run the full 4-week plan. Add Devil's Advocate (#13) and Trade-Off Pressure Cooker (#8) in Week 3. Aim for ≥ 75 on all Core drills before your interview.",
                },
                {
                  level: "L7 target",
                  color: "text-violet-400",
                  advice:
                    "Complete all 18 drills at least once. Run the Persona Stress Test on all 5 archetypes. Use the Down-Level Detector (#7) on every behavioral answer. Aim for ≥ 85 on Advanced drills.",
                },
              ].map(({ level, color, advice }) => (
                <div
                  key={level}
                  className="border border-border rounded-lg p-3"
                >
                  <p className={`text-sm font-semibold ${color} mb-1`}>
                    {level}
                  </p>
                  <p className="text-xs text-muted-foreground">{advice}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Building a custom daily routine
            </p>
            <div className="space-y-2">
              <Step
                n={1}
                title="Morning (15 min) — Flashcard warm-up"
                desc="Open Failure Analysis → Drill #9 (Failure Mode Flashcard Sprint). 15 cards, 5 minutes. Do this every day to build pattern recognition."
              />
              <Step
                n={2}
                title="Midday (30 min) — Targeted drill"
                desc="Pick one drill from your weakest category (use the Weak-Spot Dashboard). Run it, read the AI feedback, and note the missed items."
              />
              <Step
                n={3}
                title="Evening (45 min) — Full mock"
                desc="Run one Live Mock drill (Drills #11–18) or the AI Coding Mock. These simulate real interview pressure and expose gaps that solo drills miss."
              />
            </div>
          </div>
        </div>
        <Tip>
          The Learning Path progress rings and best-score badges update in real
          time as you complete drills. Check the Overview Readiness Dashboard
          weekly to see how your scores are trending across categories.
        </Tip>
      </Section>

      {/* 5. AI Training Drills */}
      <Section
        id="ai-training"
        icon={<Brain size={16} />}
        title="5 — AI Training Drills (Training Tab)"
        badge="10 Drills"
        badgeColor="bg-blue-500/20 text-blue-300"
      >
        <p>
          The Training tab has 10 focused drills that each target a specific
          interview sub-skill. They are shorter than the 18 Failure Analysis
          drills and designed for daily warm-up.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                  Drill
                </th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                  What it trains
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">
                  Round
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Requirements Clarification",
                  "Asking the right questions before designing",
                  "System Design",
                ],
                [
                  "Complexity Flashcard Trainer",
                  "Instant recall of time/space complexities",
                  "Coding",
                ],
                [
                  "Rubber Duck Explainer",
                  "Verbal clarity and structured explanation",
                  "All rounds",
                ],
                [
                  "Checkpoint Pacer",
                  "Time management (15/25/15 rhythm)",
                  "All rounds",
                ],
                [
                  "Verbal Explanation Scorer",
                  "AI scores your verbal walkthrough for clarity",
                  "Coding",
                ],
                [
                  "Test-First Debugger",
                  "Writing tests before code, edge case coverage",
                  "Coding",
                ],
                [
                  "AI Hallucination Spotter",
                  "Identifying incorrect AI suggestions",
                  "AI-Native",
                ],
                [
                  "Code Navigation Speed Test",
                  "Reading and navigating unfamiliar codebases",
                  "Coding",
                ],
                [
                  "Incremental Feature Builder",
                  "Shipping in small, testable increments",
                  "Coding",
                ],
                [
                  "Epistemic Humility Coach",
                  "Expressing uncertainty without losing credibility",
                  "All rounds",
                ],
              ].map(([drill, trains, round]) => (
                <tr
                  key={drill}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-2 pr-3 text-foreground font-medium">
                    {drill}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{trains}</td>
                  <td className="py-2 text-blue-400 text-xs">{round}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 6. Failure Analysis */}
      <Section
        id="failure-analysis"
        icon={<AlertTriangle size={16} />}
        title="6 — Failure Analysis Tab"
        badge="7 Parts"
        badgeColor="bg-rose-500/20 text-rose-300"
      >
        <p>
          The Failure Analysis tab is built around the documented failure
          distribution:{" "}
          <strong className="text-foreground">42% System Design</strong>,{" "}
          <strong className="text-foreground">31% Coding</strong>,{" "}
          <strong className="text-foreground">27% Behavioral</strong>. It has 7
          parts:
        </p>
        <div className="space-y-2">
          {[
            {
              part: "Part 1 — System Design Failures",
              desc: "4 weak signal cards (NFR skipping, bottleneck blindness, shallow trade-offs, can't scale). Each card has a description of the signal, an example of what it sounds like, and a Launch Drill button.",
              ring: "The completion ring shows how many of the 4 signals you have drilled.",
            },
            {
              part: "Part 2 — Coding Failures",
              desc: "2 weak signal cards (edge case blindness, time management collapse). Same format as Part 1.",
              ring: "Completion ring shows 0–2 signals drilled.",
            },
            {
              part: "Part 3 — Behavioral Failures",
              desc: "2 weak signal cards (vague STAR stories, weak ownership signals). Same format.",
              ring: "Completion ring shows 0–2 signals drilled.",
            },
            {
              part: "Part 4 — Persona Stress Tests",
              desc: "5 interviewer archetypes (The Skeptic, The Devil's Advocate, The Detail Obsessive, The Silent Type, The Scope Creeper) with survival strategies. The Persona Stress Test simulator is embedded here.",
              ring: "Past Sessions panel shows your last 5 scorecard results.",
            },
            {
              part: "Part 5 — The 22% Down-Leveling Problem",
              desc: "L5 vs L6 vs L7 story framing guide. Shows exactly what language and scope signals each level.",
              ring: "No drill — reference only.",
            },
            {
              part: "Part 6 — 10 Fix Tools",
              desc: "Cross-reference map: each failure mode → primary fix tool → secondary fix tool.",
              ring: "No drill — reference only.",
            },
            {
              part: "Part 7 — Hands-On Mock Drills",
              desc: "All 18 drills in a filterable grid with category tabs, progress tracking, and best-score badges. This is the main drill launcher.",
              ring: "Overall progress bar shows drills completed out of 18.",
            },
          ].map(({ part, desc, ring }) => (
            <div
              key={part}
              className="border border-border rounded-lg p-3 space-y-1"
            >
              <p className="text-sm font-semibold text-foreground">{part}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
              <p className="text-xs text-blue-400">{ring}</p>
            </div>
          ))}
        </div>
        <Note>
          The inline "Launch Drill" buttons on weak signal cards open the
          corresponding drill directly inside the card — you do not need to
          navigate to the Drill Hub.
        </Note>
      </Section>

      {/* 7. 18 Mock Drills */}
      <Section
        id="drills"
        icon={<Target size={16} />}
        title="7 — The 18 Hands-On Mock Drills"
        badge="Full Reference"
        badgeColor="bg-rose-500/20 text-rose-300"
      >
        <p>
          All 18 drills are accessible from Failure Analysis → Part 7 (Hands-On
          Mock Drills). Use the category tabs to filter by System Design,
          Coding, Behavioral, or Live Mock. Scores are saved to the database and
          shown as best-score badges on each card.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 text-muted-foreground font-medium">
                  #
                </th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                  Drill
                </th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                  Category
                </th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                  Time
                </th>
                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">
                  Trains
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">
                  Level
                </th>
              </tr>
            </thead>
            <tbody>
              <DrillRow
                num={1}
                title="NFR Ambush"
                category="System Design"
                time="90 sec"
                trains="NFR enumeration speed"
                difficulty="Core"
              />
              <DrillRow
                num={2}
                title="Bottleneck Autopsy"
                category="System Design"
                time="2 min"
                trains="Bottleneck identification"
                difficulty="Core"
              />
              <DrillRow
                num={3}
                title="Scale Jump Stress Test"
                category="System Design"
                time="3 min"
                trains="Scaling under pressure"
                difficulty="Advanced"
              />
              <DrillRow
                num={4}
                title="Edge Case Gauntlet"
                category="Coding"
                time="90 sec"
                trains="Edge case coverage"
                difficulty="Core"
              />
              <DrillRow
                num={5}
                title="STAR Specificity Rewriter"
                category="Behavioral"
                time="5 min"
                trains="STAR story quality"
                difficulty="Warm-up"
              />
              <DrillRow
                num={6}
                title="Ownership Signal Extractor"
                category="Behavioral"
                time="5 min"
                trains="Ownership language"
                difficulty="Core"
              />
              <DrillRow
                num={7}
                title="Down-Level Detector"
                category="All Rounds"
                time="5 min"
                trains="Level signal calibration"
                difficulty="Advanced"
              />
              <DrillRow
                num={8}
                title="Trade-Off Pressure Cooker"
                category="System Design"
                time="4 rounds"
                trains="Trade-off defense"
                difficulty="Advanced"
              />
              <DrillRow
                num={9}
                title="Failure Mode Flashcard Sprint"
                category="All Rounds"
                time="5 min"
                trains="Pattern recognition"
                difficulty="Warm-up"
              />
              <DrillRow
                num={10}
                title="Live Fix Simulator"
                category="All Rounds"
                time="15 min"
                trains="Failure diagnosis + rewrite"
                difficulty="Advanced"
              />
              <DrillRow
                num={11}
                title="The Interruptor"
                category="System Design"
                time="10 min"
                trains="Recovery under interruption"
                difficulty="Advanced"
              />
              <DrillRow
                num={12}
                title="Clarification Interrogator"
                category="System Design"
                time="10 min"
                trains="Scoping under ambiguity"
                difficulty="Core"
              />
              <DrillRow
                num={13}
                title="Devil's Advocate"
                category="System Design"
                time="4 rounds"
                trains="Holding positions under pressure"
                difficulty="Advanced"
              />
              <DrillRow
                num={14}
                title="The Silent Skeptic"
                category="All Rounds"
                time="5 min"
                trains="Reading interviewer silence"
                difficulty="Core"
              />
              <DrillRow
                num={15}
                title="Scope Creep Challenger"
                category="System Design"
                time="10 min"
                trains="Adapting to mid-design pivots"
                difficulty="Advanced"
              />
              <DrillRow
                num={16}
                title="Time Pressure Mock"
                category="Coding"
                time="45 min"
                trains="Coding under time pressure"
                difficulty="Core"
              />
              <DrillRow
                num={17}
                title="XFN Conflict Simulator"
                category="Behavioral"
                time="10 min"
                trains="XFN collaboration"
                difficulty="Advanced"
              />
              <DrillRow
                num={18}
                title="The Gotcha Follow-Up"
                category="All Rounds"
                time="5 min"
                trains="Pre-empting weak assumptions"
                difficulty="Advanced"
              />
            </tbody>
          </table>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">
            Reading your score:
          </p>
          <div className="flex gap-4 text-xs">
            <span className="text-emerald-400">≥ 70 — Strong</span>
            <span className="text-amber-400">50–69 — Needs work</span>
            <span className="text-red-400">&lt; 50 — Critical gap</span>
          </div>
        </div>
      </Section>

      {/* 8. Persona Stress Test */}
      <Section
        id="persona"
        icon={<Users size={16} />}
        title="8 — Persona Stress Test Simulator"
        badge="5 Archetypes"
        badgeColor="bg-violet-500/20 text-violet-300"
      >
        <p>
          The Persona Stress Test simulates a 10-minute mock where the AI plays
          one of 5 real interviewer archetypes and fires challenges at your
          answers turn-by-turn. It is the most realistic single drill in the
          guide.
        </p>
        <div className="space-y-2">
          {[
            {
              persona: "The Skeptic",
              color: "text-red-400",
              style:
                "Questions every assumption. Responds to 'I would use Kafka' with 'Why not a simple queue?'",
              survival:
                "Lead with data. Quantify every claim. Acknowledge trade-offs before they ask.",
            },
            {
              persona: "The Devil's Advocate",
              color: "text-orange-400",
              style:
                "Argues the opposite of whatever you say. Designed to test whether you hold positions under pressure.",
              survival:
                "Hold your ground with evidence, not emotion. Concede minor points gracefully to win the major ones.",
            },
            {
              persona: "The Detail Obsessive",
              color: "text-blue-400",
              style:
                "Asks for exact numbers, exact algorithms, exact failure modes. Uncomfortable with hand-waving.",
              survival:
                "Give specific numbers (p99 < 100ms, 10K RPS). Say 'I'd need to measure X' rather than guessing.",
            },
            {
              persona: "The Silent Type",
              color: "text-muted-foreground",
              style:
                "Responds with long silences, minimal feedback, and one-word answers. Designed to make you panic and over-explain.",
              survival:
                "Pause after each section and ask a direct question: 'Does that approach make sense, or should I explore the caching layer further?'",
            },
            {
              persona: "The Scope Creeper",
              color: "text-lime-400",
              style:
                "Adds new requirements mid-design: 'Oh, I forgot to mention — it also needs to support real-time analytics.'",
              survival:
                "Acknowledge the new requirement, assess the impact on your existing design, and propose an incremental change — never restart.",
            },
          ].map(({ persona, color, style, survival }) => (
            <div
              key={persona}
              className="border border-border rounded-lg p-3 space-y-1"
            >
              <p className={`text-sm font-semibold ${color}`}>{persona}</p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Style:</strong> {style}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Survival:</strong>{" "}
                {survival}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">
            Reading the resilience scorecard:
          </p>
          <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
            <li>
              <strong className="text-foreground">
                Resilience score (0–100)
              </strong>{" "}
              — overall ability to hold up under the persona's pressure style
            </li>
            <li>
              <strong className="text-foreground">Turn-by-turn scores</strong> —
              each response is scored individually so you can see exactly where
              you broke down
            </li>
            <li>
              <strong className="text-foreground">AI Coach Note</strong> — one
              specific thing to fix before your next session
            </li>
          </ul>
        </div>
        <Note>
          Past sessions are saved to the database and shown in the collapsible
          "Past Sessions" panel below the simulator. Run each archetype at least
          once before your interview.
        </Note>
      </Section>

      {/* 9. Weekly Challenge */}
      <Section
        id="weekly-challenge"
        icon={<Star size={16} />}
        title="9 — Weekly Drill Challenge"
        badge="Coming Soon"
        badgeColor="bg-amber-500/20 text-amber-300"
      >
        <p>
          The Weekly Drill Challenge (in development) will add a rotating banner
          at the top of the Failure Analysis tab each week, highlighting one
          drill from each category. Completing all 4 featured drills in the same
          week earns a streak point.
        </p>
        <div className="space-y-2">
          <Step
            n={1}
            title="Check the weekly banner"
            desc="The banner rotates every Monday at midnight UTC. It shows 4 drills: one System Design, one Coding, one Behavioral, and one Live Mock."
          />
          <Step
            n={2}
            title="Complete all 4 drills"
            desc="Each drill must be completed (not just opened) to count toward the weekly challenge. Scores are recorded normally."
          />
          <Step
            n={3}
            title="Earn your streak point"
            desc="Completing all 4 drills in the same calendar week adds 1 to your streak counter. The streak resets if you miss a week."
          />
        </div>
      </Section>

      {/* 10. Replay Mode */}
      <Section
        id="replay"
        icon={<RefreshCw size={16} />}
        title="10 — Drill Replay Mode"
        badge="Coming Soon"
        badgeColor="bg-amber-500/20 text-amber-300"
      >
        <p>
          Replay mode (in development) will add a "Replay" button to each
          completed drill card in the Drill Hub. Clicking it re-runs the same
          drill with a fresh AI seed — a different scenario, different
          bottlenecks, different STAR prompt — so you can practice the same
          failure mode multiple times without memorizing the answers.
        </p>
        <div className="space-y-2">
          <Step
            n={1}
            title="Complete a drill for the first time"
            desc="The drill card shows your best score. A 'Replay' button appears next to the score badge."
          />
          <Step
            n={2}
            title="Click Replay"
            desc="The drill launches with a new AI-generated scenario. Your previous score is preserved — only a higher score will update the best-score badge."
          />
          <Step
            n={3}
            title="Track your improvement"
            desc="A small score history chart on the drill card shows your last 5 attempts so you can see whether you're improving over sessions."
          />
        </div>
        <Tip>
          For Live Mock drills (Drills #11–18), each replay uses a different
          archetype behavior seed so the AI does not repeat the same challenges.
        </Tip>
      </Section>

      {/* 11. Progress Export */}
      <Section
        id="export"
        icon={<FileText size={16} />}
        title="11 — Export Progress Report"
        badge="Coming Soon"
        badgeColor="bg-amber-500/20 text-amber-300"
      >
        <p>
          The Export Progress Report (in development) will generate a one-page
          PDF snapshot of your readiness that you can share with a coach or
          recruiter.
        </p>
        <p>The report will include:</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>
            Overall readiness score (weighted average across all drill
            categories)
          </li>
          <li>
            Per-category breakdown: System Design, Coding, Behavioral, Live Mock
          </li>
          <li>
            Best score per drill with trend indicator (improving / stable /
            declining)
          </li>
          <li>Top 3 weak areas with the specific drills that target them</li>
          <li>Persona Stress Test results by archetype</li>
          <li>Recommended focus areas for the next 7 days</li>
        </ul>
        <Note>
          The export button will appear in the Overview tab's Readiness
          Dashboard once the feature is live.
        </Note>
      </Section>

      {/* 12. Keyboard Shortcuts */}
      <Section
        id="shortcuts"
        icon={<Keyboard size={16} />}
        title="12 — Keyboard Shortcuts"
        badge="Power User"
        badgeColor="bg-slate-500/20 text-foreground/80"
      >
        <p>
          These shortcuts work anywhere in the guide as long as focus is not
          inside a text input, textarea, or select element.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Key
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "Switch to Overview tab"],
                ["2", "Switch to Coding tab"],
                ["3", "Switch to Behavioral tab"],
                ["4", "Switch to System Design tab"],
              ].map(([key, action]) => (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">
                    <kbd className="px-2 py-1 rounded bg-secondary border border-border font-mono text-foreground">
                      {key}
                    </kbd>
                  </td>
                  <td className="py-2 text-muted-foreground">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Tip>
          The AI Mock, Training, AI Native, Learning Path, Failure Analysis, and
          Guide tabs do not have keyboard shortcuts yet — use the top navigation
          bar to reach them.
        </Tip>
      </Section>
    </div>
  );
}
