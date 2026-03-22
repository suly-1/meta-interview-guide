/**
 * TopicRoulette — Spin a wheel to pick a random topic tab + problem.
 * Renders a CSS-animated spinning wheel, then reveals the result.
 * Calls onSelect(tabId, problemName) so the parent can navigate.
 */
import { useState, useRef, useEffect } from "react";
import { Dices, ChevronRight, RotateCcw } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";

// ─── Wheel segments ────────────────────────────────────────────────────────────
interface Segment {
  tabId: string;
  label: string;
  color: string;
  textColor: string;
  emoji: string;
  getProblem: () => string;
}

const SEGMENTS: Segment[] = [
  {
    tabId: "coding",
    label: "Coding",
    color: "#3b82f6",
    textColor: "#fff",
    emoji: "💻",
    getProblem: () => {
      const p = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
      const probs = p.problems;
      return probs[Math.floor(Math.random() * probs.length)];
    },
  },
  {
    tabId: "ctci",
    label: "Practice",
    color: "#8b5cf6",
    textColor: "#fff",
    emoji: "📋",
    getProblem: () => {
      const unsolved = CTCI_PROBLEMS.filter(p => {
        try {
          const prog = JSON.parse(localStorage.getItem("ctci_progress_v1") ?? "{}");
          return !prog[p.id]?.solved;
        } catch { return true; }
      });
      const pool = unsolved.length > 0 ? unsolved : CTCI_PROBLEMS;
      return pool[Math.floor(Math.random() * pool.length)].name;
    },
  },
  {
    tabId: "behavioral",
    label: "Behavioral",
    color: "#f59e0b",
    textColor: "#fff",
    emoji: "🗣️",
    getProblem: () => {
      const questions = [
        "Tell me about a time you had a conflict with a teammate.",
        "Describe a project you're most proud of.",
        "Give an example of when you showed leadership.",
        "Tell me about a time you failed and what you learned.",
        "Describe a time you had to make a decision with incomplete data.",
        "How do you handle disagreements with your manager?",
        "Tell me about a time you influenced without authority.",
        "Describe a time you had to prioritize under pressure.",
      ];
      return questions[Math.floor(Math.random() * questions.length)];
    },
  },
  {
    tabId: "sysdesign",
    label: "Sys Design",
    color: "#475569",
    textColor: "#fff",
    emoji: "🏗️",
    getProblem: () => {
      const prompts = [
        "Design a URL shortener (bit.ly)",
        "Design a news feed (Facebook / Instagram)",
        "Design a distributed cache (Memcached / Redis)",
        "Design a messaging system (WhatsApp)",
        "Design a rate limiter",
        "Design a search autocomplete system",
        "Design a video streaming platform (YouTube)",
        "Design a notification system",
      ];
      return prompts[Math.floor(Math.random() * prompts.length)];
    },
  },
  {
    tabId: "ai-round",
    label: "AI Round",
    color: "#0d9488",
    textColor: "#fff",
    emoji: "🤖",
    getProblem: () => {
      const prompts = [
        "Solve Two Sum with AI assistance — explain your thought process aloud.",
        "Debug this code snippet with the AI co-pilot enabled.",
        "Refactor this function for readability using AI suggestions.",
        "Write unit tests for a given function with AI help.",
        "Optimize this O(n²) solution using AI-generated hints.",
      ];
      return prompts[Math.floor(Math.random() * prompts.length)];
    },
  },
  {
    tabId: "readiness",
    label: "Readiness",
    color: "#e11d48",
    textColor: "#fff",
    emoji: "📊",
    getProblem: () => {
      const checks = [
        "Run the Readiness self-assessment and update all pattern ratings.",
        "Review your weakest pattern and drill 3 problems from it.",
        "Check your Recruiter-Ready Summary — is it up to date?",
        "Run the Fix My Weaknesses sprint for 20 minutes.",
        "Review your last 5 Explain It Back entries before your next session.",
      ];
      return checks[Math.floor(Math.random() * checks.length)];
    },
  },
  {
    tabId: "timeline",
    label: "Timeline",
    color: "#059669",
    textColor: "#fff",
    emoji: "📅",
    getProblem: () => {
      const tasks = [
        "Review this week's study plan and mark completed items.",
        "Identify the one topic you've been avoiding and schedule it for today.",
        "Do a 30-minute mock interview with a timer.",
        "Review the L6/L7 behavioral focus areas for this week.",
        "Update your interview countdown date and check your D-minus urgency.",
      ];
      return tasks[Math.floor(Math.random() * tasks.length)];
    },
  },
];

// ─── Wheel canvas drawing ──────────────────────────────────────────────────────
function drawWheel(canvas: HTMLCanvasElement, rotation: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const n = SEGMENTS.length;
  const arc = (2 * Math.PI) / n;

  ctx.clearRect(0, 0, size, size);

  SEGMENTS.forEach((seg, i) => {
    const start = rotation + i * arc - Math.PI / 2;
    const end = start + arc;

    // Slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = seg.textColor;
    ctx.font = `bold 11px 'Space Grotesk', sans-serif`;
    ctx.fillText(`${seg.emoji} ${seg.label}`, r - 8, 4);
    ctx.restore();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  onSelect: (tabId: string, problem: string, segment: Segment) => void;
}

export default function TopicRoulette({ onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ segment: Segment; problem: string } | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);

  // Draw on mount and rotation changes
  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, rotationRef.current);
  }, []);

  const spin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    // Random spin: 4–8 full rotations + random offset
    const totalRotation = (4 + Math.random() * 4) * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const duration = 3000 + Math.random() * 1500; // 3–4.5 seconds
    const startTime = performance.now();
    const startRot = rotationRef.current;

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOut(t);
      rotationRef.current = startRot + totalRotation * eased;

      if (canvasRef.current) drawWheel(canvasRef.current, rotationRef.current);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine which segment is at the top (pointer at 12 o'clock = -π/2)
        const n = SEGMENTS.length;
        const arc = (2 * Math.PI) / n;
        // Normalize rotation to [0, 2π)
        const norm = ((rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        // The pointer is at angle 0 (top). Segment i starts at norm + i*arc - π/2
        // We want: which segment covers angle 3π/2 (top, pointing up)?
        const pointerAngle = (3 * Math.PI) / 2;
        const adjustedAngle = ((pointerAngle - norm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(adjustedAngle / arc) % n;
        const seg = SEGMENTS[idx];
        const problem = seg.getProblem();
        setResult({ segment: seg, problem });
        setSpinning(false);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  };

  // Cleanup
  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Wheel */}
      <div className="relative">
        {/* Pointer arrow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-white drop-shadow-md" />
        </div>
        <canvas
          ref={canvasRef}
          width={220}
          height={220}
          className="rounded-full shadow-xl cursor-pointer select-none"
          onClick={spin}
          title="Click to spin!"
        />
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning}
        className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
      >
        <Dices size={14} className={spinning ? "animate-spin" : ""} />
        {spinning ? "Spinning…" : "Spin the Wheel"}
      </button>

      {/* Result */}
      {result && !spinning && (
        <div
          className="w-full rounded-2xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ borderColor: result.segment.color, backgroundColor: result.segment.color + "18" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{result.segment.emoji}</span>
            <div>
              <div className="text-xs font-black uppercase tracking-widest" style={{ color: result.segment.color }}>
                {result.segment.label} Tab
              </div>
              <div className="text-sm font-bold text-foreground leading-snug">{result.problem}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSelect(result.segment.tabId, result.problem, result.segment)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-xs font-bold rounded-xl transition-colors"
              style={{ backgroundColor: result.segment.color }}
            >
              <ChevronRight size={13} /> Go to {result.segment.label}
            </button>
            <button
              onClick={spin}
              className="px-3 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Spin again"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Click the wheel or the button to spin. Picks a random topic tab and a specific challenge.
      </p>
    </div>
  );
}
