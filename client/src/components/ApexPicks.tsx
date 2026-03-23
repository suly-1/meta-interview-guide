/**
 * ApexPicks — Curated "Start Here" feature recommendations from Apex.
 * Shown on the homepage to guide new visitors to the highest-impact tools.
 * Clicking a pick navigates directly to that tab and scrolls to the feature.
 */
import {
  Star,
  Zap,
  Brain,
  Target,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

interface Pick {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  tab: string;
  anchor: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  borderColor: string;
}

const APEX_PICKS: Pick[] = [
  {
    id: "readiness-report",
    icon: <TrendingUp size={18} />,
    label: "Interview Readiness Report",
    description:
      "Your personalised AI-generated snapshot: top 3 action items, weak spots, and a readiness score. Start here before anything else.",
    tab: "overview",
    anchor: "readiness-report",
    badge: "Start Here",
    badgeColor: "bg-blue-600 text-white",
    gradient: "from-blue-500/10 to-indigo-500/5",
    borderColor: "border-blue-500/40",
  },
  {
    id: "seven-day-sprint",
    icon: <Zap size={18} />,
    label: "7-Day Sprint Plan",
    description:
      "Auto-generates a day-by-day study schedule from your Readiness Report. Day 1 through Day 7 — no guesswork, just execution.",
    tab: "overview",
    anchor: "seven-day-sprint",
    badge: "High Impact",
    badgeColor: "bg-amber-500 text-black",
    gradient: "from-amber-500/10 to-orange-500/5",
    borderColor: "border-amber-500/40",
  },
  {
    id: "think-out-loud",
    icon: <Brain size={18} />,
    label: "Think Out Loud Coach",
    description:
      "At L6+, communication IS the interview. Record your verbal narration while coding — AI scores clarity, pattern naming, and edge-case coverage.",
    tab: "coding",
    anchor: "coding-think-out-loud",
    badge: "L6+ Critical",
    badgeColor: "bg-cyan-600 text-white",
    gradient: "from-cyan-500/10 to-teal-500/5",
    borderColor: "border-cyan-500/40",
  },
  {
    id: "story-coverage",
    icon: <Target size={18} />,
    label: "Story Coverage Matrix",
    description:
      "Visual matrix of your STAR stories vs Meta's 9 behavioral focus areas. Red cells = gaps you haven't covered. Fix them before your loop.",
    tab: "behavioral",
    anchor: "story-coverage-matrix",
    badge: "Must Do",
    badgeColor: "bg-emerald-600 text-white",
    gradient: "from-emerald-500/10 to-green-500/5",
    borderColor: "border-emerald-500/40",
  },
  {
    id: "tear-down",
    icon: <Star size={18} />,
    label: "Tear Down My Design",
    description:
      "AI attacks your system design from 3 angles — scalability, consistency, cost. Scores your defense. The closest thing to a real L7 interviewer.",
    tab: "design",
    anchor: "tear-down-my-design",
    badge: "Apex Favourite",
    badgeColor: "bg-purple-600 text-white",
    gradient: "from-purple-500/10 to-violet-500/5",
    borderColor: "border-purple-500/40",
  },
];

interface ApexPicksProps {
  onTabChange: (tab: string) => void;
}

export function ApexPicks({ onTabChange }: ApexPicksProps) {
  function handlePick(pick: Pick) {
    onTabChange(pick.tab);
    // Scroll to anchor after a short delay to allow tab render
    setTimeout(() => {
      const el = document.getElementById(pick.anchor);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Brief highlight flash
        el.style.transition = "box-shadow 0.3s";
        el.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.5)";
        setTimeout(() => {
          el.style.boxShadow = "";
        }, 1500);
      }
    }, 120);
  }

  return (
    <div className="container mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Star size={14} className="text-amber-400 fill-amber-400" />
        <span className="text-xs font-black tracking-widest uppercase text-amber-400">
          Apex Picks
        </span>
        <span className="text-xs text-muted-foreground">
          — the 5 features that move the needle most
        </span>
      </div>

      {/* Picks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {APEX_PICKS.map(pick => (
          <button
            key={pick.id}
            onClick={() => handlePick(pick)}
            className={`group text-left rounded-xl border bg-gradient-to-br ${pick.gradient} ${pick.borderColor} p-3 hover:scale-[1.02] transition-all duration-200 hover:shadow-lg`}
          >
            {/* Badge + icon row */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full ${pick.badgeColor}`}
              >
                {pick.badge}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {pick.icon}
              </span>
            </div>

            {/* Label */}
            <div className="text-xs font-bold text-foreground mb-1 leading-tight">
              {pick.label}
            </div>

            {/* Description */}
            <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
              {pick.description}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-0.5 mt-2 text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Open
              <ChevronRight size={10} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
