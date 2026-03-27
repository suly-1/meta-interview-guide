/**
 * Interview Readiness Certificate
 * Generates a shareable readiness certificate once the user achieves
 * a combined mock score of ≥ 4.0/5 with a "Strong Hire" verdict.
 * Opens a print-ready certificate in a new tab.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useStreak } from "@/hooks/useLocalStorage";
import {
  Award,
  CheckCircle2,
  Lock,
  Download,
  Share2,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

interface MockSession {
  overallScore?: number;
  verdict?: string;
  roundResults?: Array<{ label: string; overallScore: number }>;
  completedAt?: number;
}

function loadBestSession(): MockSession | null {
  try {
    const raw = localStorage.getItem("meta_full_mock_history_v1");
    if (!raw) return null;
    const arr: MockSession[] = JSON.parse(raw);
    if (!arr.length) return null;
    // Find the best session by overallScore
    return arr.reduce((best, s) =>
      (s.overallScore ?? 0) > (best.overallScore ?? 0) ? s : best
    );
  } catch {
    return null;
  }
}

function isEligible(session: MockSession | null): boolean {
  if (!session) return false;
  const score = session.overallScore ?? 0;
  const verdict = (session.verdict ?? "").toLowerCase();
  return (
    score >= 4.0 && (verdict.includes("strong") || verdict.includes("hire"))
  );
}

function generateCertificateHTML(params: {
  targetLevel: string;
  overallScore: number;
  codingScore: number;
  systemDesignScore: number;
  behavioralScore: number;
  xfnScore: number;
  verdict: string;
  date: string;
  certId: string;
}): string {
  const {
    targetLevel,
    overallScore,
    codingScore,
    systemDesignScore,
    behavioralScore,
    xfnScore,
    verdict,
    date,
    certId,
  } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Meta Interview Readiness Certificate</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
    .cert { max-width: 760px; width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%); border: 2px solid #3b82f6; border-radius: 20px; padding: 48px; position: relative; overflow: hidden; }
    .cert::before { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); border-radius: 50%; }
    .cert::after { content: ''; position: absolute; bottom: -80px; left: -80px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%); border-radius: 50%; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .logo-icon { width: 44px; height: 44px; background: #3b82f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .logo-text { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: #f1f5f9; }
    .logo-sub { font-size: 12px; color: #64748b; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #10b981; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
    h1 { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; color: #f1f5f9; line-height: 1.1; margin-bottom: 8px; }
    h1 span { color: #3b82f6; }
    .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 32px; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #334155, transparent); margin: 24px 0; }
    .scores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .score-card { background: rgba(255,255,255,0.04); border: 1px solid #1e293b; border-radius: 12px; padding: 14px; text-align: center; }
    .score-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .score-val { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 800; color: #10b981; }
    .score-val.amber { color: #f59e0b; }
    .score-max { font-size: 11px; color: #475569; }
    .overall { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.10)); border: 1px solid rgba(59,130,246,0.3); border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .overall-left .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .overall-left .val { font-family: 'Space Grotesk', sans-serif; font-size: 48px; font-weight: 800; color: #3b82f6; line-height: 1; }
    .overall-left .max { font-size: 14px; color: #475569; }
    .overall-right { text-align: right; }
    .verdict-badge { display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #10b981; border-radius: 8px; padding: 6px 14px; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
    .level-badge { display: inline-block; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.4); color: #3b82f6; border-radius: 8px; padding: 4px 12px; font-size: 13px; font-weight: 600; }
    .meta-bar { display: flex; gap: 3px; margin-top: 8px; }
    .meta-bar div { height: 4px; flex: 1; border-radius: 2px; background: #3b82f6; }
    .meta-bar div:nth-child(2) { background: #10b981; }
    .meta-bar div:nth-child(3) { background: #f59e0b; }
    .footer { display: flex; align-items: center; justify-content: space-between; }
    .cert-id { font-size: 10px; color: #334155; font-family: monospace; }
    .date { font-size: 11px; color: #475569; }
    .print-btn { display: none; }
    @media print {
      body { background: white; color: #0f172a; }
      .cert { border-color: #3b82f6; background: white; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo">
      <div class="logo-icon">🎯</div>
      <div>
        <div class="logo-text">Meta L4/L5/L6/L7 Interview Prep Guide</div>
        <div class="logo-sub">metaengguide.pro</div>
      </div>
    </div>

    <div class="badge">✓ Interview Readiness Verified</div>

    <h1>Certified <span>Interview Ready</span></h1>
    <p class="subtitle">
      This candidate has demonstrated the technical depth, communication clarity,
      and cross-functional judgment required for a Meta ${targetLevel} Software Engineer role.
    </p>

    <div class="overall">
      <div class="overall-left">
        <div class="label">Overall Score</div>
        <div class="val">${overallScore.toFixed(1)}<span class="max">/5</span></div>
      </div>
      <div class="overall-right">
        <div class="verdict-badge">${verdict}</div>
        <br/>
        <div class="level-badge">Target: ${targetLevel}</div>
        <div class="meta-bar"><div></div><div></div><div></div></div>
      </div>
    </div>

    <div class="scores">
      <div class="score-card">
        <div class="score-label">Coding</div>
        <div class="score-val ${codingScore >= 4 ? "" : "amber"}">${codingScore.toFixed(1)}</div>
        <div class="score-max">/5</div>
      </div>
      <div class="score-card">
        <div class="score-label">System Design</div>
        <div class="score-val ${systemDesignScore >= 4 ? "" : "amber"}">${systemDesignScore.toFixed(1)}</div>
        <div class="score-max">/5</div>
      </div>
      <div class="score-card">
        <div class="score-label">Behavioral</div>
        <div class="score-val ${behavioralScore >= 4 ? "" : "amber"}">${behavioralScore.toFixed(1)}</div>
        <div class="score-max">/5</div>
      </div>
      <div class="score-card">
        <div class="score-label">XFN</div>
        <div class="score-val ${xfnScore >= 4 ? "" : "amber"}">${xfnScore.toFixed(1)}</div>
        <div class="score-max">/5</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="footer">
      <div class="cert-id">CERT-${certId}</div>
      <div class="date">Issued: ${date}</div>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

const STREAK_REQUIRED = 5;

// ── component ─────────────────────────────────────────────────────────────────

export function ReadinessCertificate() {
  const [targetLevel, setTargetLevel] = useState("L6");
  const [isOpen, setIsOpen] = useState(false);
  const [certGenerated, setCertGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const streak = useStreak();
  const streakMet = streak.currentStreak >= STREAK_REQUIRED;

  const bestSession = loadBestSession();
  const eligible = isEligible(bestSession) && streakMet;

  const handleGenerate = () => {
    if (!bestSession) return;
    setIsGenerating(true);

    const rounds = bestSession.roundResults ?? [];
    const get = (label: string) =>
      rounds.find(r => r.label.toLowerCase().includes(label))?.overallScore ??
      3.5;

    const certId = Math.random().toString(36).slice(2, 10).toUpperCase();
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = generateCertificateHTML({
      targetLevel,
      overallScore: bestSession.overallScore ?? 4.0,
      codingScore: get("coding"),
      systemDesignScore: get("system") || get("design"),
      behavioralScore: get("behavioral") || get("star"),
      xfnScore: get("xfn"),
      verdict: bestSession.verdict ?? "Strong Hire",
      date,
      certId,
    });

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      toast.error("Popup blocked. Please allow popups for this site.");
    } else {
      setCertGenerated(true);
      toast.success(
        "Certificate opened in new tab — use Ctrl+P / Cmd+P to save as PDF."
      );
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setIsGenerating(false);
  };

  const thresholdScore = 4.0;
  const currentScore = bestSession?.overallScore ?? 0;
  const progress = Math.min((currentScore / thresholdScore) * 100, 100);

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-amber-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">
            Readiness Certificate
          </span>
          {eligible && (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">
              UNLOCKED
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(o => !o)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Progress bar (always visible) */}
      {!eligible && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to certificate</span>
            <span>
              {currentScore.toFixed(1)}/{thresholdScore.toFixed(1)} required
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Streak requirement indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-0.5">
              {Array.from({ length: STREAK_REQUIRED }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-sm text-center text-[9px] leading-4 font-bold ${
                    i < streak.currentStreak
                      ? "bg-amber-500 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  🔥
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {streakMet ? (
                <span className="text-amber-400 font-semibold">
                  5-day streak achieved ✓
                </span>
              ) : (
                <>
                  {streak.currentStreak}/{STREAK_REQUIRED} day streak — visit
                  daily to unlock
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete a Full Mock Day with ≥ 4.0/5 overall, a "Strong Hire"
            verdict, <strong>and a 5-day practice streak</strong> to unlock your
            certificate.
          </p>
        </div>
      )}

      {isOpen && (
        <div className="space-y-3">
          {eligible ? (
            <>
              {/* Eligible state */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-900/40 to-slate-800/60 border border-emerald-500/30 p-4 text-center">
                <CheckCircle2
                  size={32}
                  className="text-emerald-400 mx-auto mb-2"
                />
                <div className="text-sm font-bold text-emerald-400 mb-1">
                  You're Interview Ready!
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Your best Full Mock Day score of{" "}
                  <span className="text-foreground font-bold">
                    {currentScore.toFixed(1)}/5
                  </span>{" "}
                  with a{" "}
                  <span className="text-emerald-400 font-bold">
                    {bestSession?.verdict ?? "Strong Hire"}
                  </span>{" "}
                  verdict qualifies you for a readiness certificate.
                </p>
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Target Level on Certificate
                  </label>
                  <select
                    value={targetLevel}
                    onChange={e => setTargetLevel(e.target.value)}
                    className="text-xs rounded-lg bg-background border border-border px-3 py-1.5 text-foreground"
                  >
                    {["L4", "L5", "L6", "L7"].map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold text-white transition-all flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    {certGenerated
                      ? "Re-generate Certificate"
                      : "Generate Certificate"}
                  </button>
                  {certGenerated && (
                    <button
                      onClick={() => {
                        const url = `https://metaengguide.pro`;
                        navigator.clipboard
                          .writeText(url)
                          .then(() => toast.success("Link copied!"));
                      }}
                      className="px-4 py-2 rounded-lg bg-secondary hover:bg-slate-600 text-sm font-semibold text-foreground transition-all flex items-center gap-2"
                    >
                      <Share2 size={13} /> Share
                    </button>
                  )}
                </div>
              </div>

              {certGenerated && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
                  ✓ Certificate opened in new tab. Use{" "}
                  <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-foreground">
                    Ctrl+P
                  </kbd>{" "}
                  /{" "}
                  <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-foreground">
                    Cmd+P
                  </kbd>{" "}
                  and select "Save as PDF" to download.
                </div>
              )}
            </>
          ) : (
            /* Locked state */
            <div className="rounded-xl bg-secondary border border-border p-4 text-center">
              <Lock
                size={28}
                className="text-muted-foreground mx-auto mb-2 opacity-70"
              />
              <div className="text-sm font-bold text-muted-foreground mb-1">
                Certificate Locked
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Complete a Full Mock Day with ≥ 4.0/5 overall score, a "Strong
                Hire" verdict, and a 5-day consecutive practice streak to unlock
                your personalized readiness certificate.
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-background border border-border p-2">
                  <div className="text-muted-foreground mb-0.5">
                    Required Score
                  </div>
                  <div className="font-bold text-foreground">≥ 4.0 / 5</div>
                </div>
                <div className="rounded-lg bg-background border border-border p-2">
                  <div className="text-muted-foreground mb-0.5">
                    Required Verdict
                  </div>
                  <div className="font-bold text-emerald-400">Strong Hire</div>
                </div>
                <div className="rounded-lg bg-background border border-border p-2">
                  <div className="text-muted-foreground mb-0.5">
                    Practice Streak
                  </div>
                  <div className="font-bold text-amber-400">
                    {streak.currentStreak}/{STREAK_REQUIRED} days 🔥
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isOpen && eligible && (
        <div className="text-center py-4">
          <Award size={28} className="text-amber-400 mx-auto mb-2" />
          <p className="text-xs text-emerald-400 font-semibold mb-2">
            Certificate unlocked! You're interview ready.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-all"
          >
            Generate Certificate
          </button>
        </div>
      )}
    </div>
  );
}
