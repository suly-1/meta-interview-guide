/**
 * WeeklyProgressDigest — compiles the week's sessions, patterns mastered,
 * readiness delta, and CTCI problems solved into a formatted summary,
 * then triggers the notifyOwner procedure to deliver it as a Manus notification.
 */
import { useState, useMemo } from 'react';
import { Send, Copy, Check, Loader2, Mail, BarChart2, Flame, BookOpen, Brain } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { CTCI_PROBLEMS } from '@/lib/ctciProblems';
import { useCTCIProgress } from '@/hooks/useCTCIProgress';
import { useCTCIStreak } from '@/hooks/useCTCIStreak';
import { useReadinessScore } from '@/hooks/useReadinessScore';
import { PATTERNS } from '@/lib/guideData';

// Read drill ratings from localStorage
function getDrillRatings(): Record<string, number> {
  try {
    const raw = localStorage.getItem('drill_ratings');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// Read behavioral ratings from localStorage
function getBehavioralRatings(): Record<string, number> {
  try {
    const raw = localStorage.getItem('practice_ratings');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// Get CTCI solves from the last 7 days (approximation: uses total count delta isn't tracked,
// so we show current totals and streak info)
function buildDigestContent(
  solvedCount: number,
  starredCount: number,
  totalCount: number,
  streak: number,
  longestStreak: number,
  readinessScore: number,
  drillRatings: Record<string, number>,
  behavioralRatings: Record<string, number>
): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const pct = Math.round((solvedCount / totalCount) * 100);

  // Pattern analysis
  const ratedPatterns = PATTERNS.filter(p => drillRatings[p.id] !== undefined);
  const strongPatterns = ratedPatterns.filter(p => (drillRatings[p.id] ?? 0) >= 4).map(p => p.name);
  const weakPatterns = ratedPatterns.filter(p => (drillRatings[p.id] ?? 0) <= 2).map(p => p.name);
  const avgDrillRating = ratedPatterns.length > 0
    ? (ratedPatterns.reduce((sum, p) => sum + (drillRatings[p.id] ?? 0), 0) / ratedPatterns.length).toFixed(1)
    : 'N/A';

  // Behavioral analysis
  const ratedBehavioral = Object.keys(behavioralRatings).length;
  const avgBehavioral = ratedBehavioral > 0
    ? (Object.values(behavioralRatings).reduce((a, b) => a + b, 0) / ratedBehavioral).toFixed(1)
    : 'N/A';

  const lines: string[] = [];
  lines.push(`📊 WEEKLY PROGRESS DIGEST`);
  lines.push(`Generated: ${today}`);
  lines.push(`${'─'.repeat(50)}`);
  lines.push(``);
  lines.push(`🎯 OVERALL READINESS SCORE: ${readinessScore}/100`);
  lines.push(``);
  lines.push(`📝 CTCI PRACTICE TRACKER`);
  lines.push(`   Solved: ${solvedCount} / ${totalCount} (${pct}%)`);
  lines.push(`   Starred: ${starredCount} problems`);
  lines.push(`   Current Streak: ${streak > 0 ? `${streak} days 🔥` : 'No active streak'}`);
  lines.push(`   Longest Streak: ${longestStreak > 0 ? `${longestStreak} days` : 'N/A'}`);
  lines.push(``);
  lines.push(`💻 CODING PATTERNS (Quick Drill)`);
  lines.push(`   Patterns Rated: ${ratedPatterns.length} / ${PATTERNS.length}`);
  lines.push(`   Avg Rating: ${avgDrillRating} / 5`);
  if (strongPatterns.length > 0) {
    lines.push(`   ✅ Strong (4-5★): ${strongPatterns.slice(0, 3).join(', ')}${strongPatterns.length > 3 ? ` +${strongPatterns.length - 3} more` : ''}`);
  }
  if (weakPatterns.length > 0) {
    lines.push(`   ⚠️  Needs Work (1-2★): ${weakPatterns.slice(0, 3).join(', ')}${weakPatterns.length > 3 ? ` +${weakPatterns.length - 3} more` : ''}`);
  }
  lines.push(``);
  lines.push(`🗣️  BEHAVIORAL PREP`);
  lines.push(`   Questions Rated: ${ratedBehavioral}`);
  lines.push(`   Avg Self-Rating: ${avgBehavioral} / 5`);
  lines.push(``);
  lines.push(`📌 FOCUS FOR NEXT WEEK`);
  if (weakPatterns.length > 0) {
    lines.push(`   1. Drill weak patterns: ${weakPatterns.slice(0, 2).join(', ')}`);
  } else {
    lines.push(`   1. Continue drilling patterns — aim for 5★ on all`);
  }
  lines.push(`   2. Solve ${Math.min(10, totalCount - solvedCount)} more CTCI problems (target: ${Math.min(pct + 5, 100)}%)`);
  lines.push(`   3. Practice ${Math.max(0, 5 - ratedBehavioral)} more behavioral questions`);
  lines.push(``);
  lines.push(`${'─'.repeat(50)}`);
  lines.push(`Independence Study Guide — Independent Study Resource`);
  return lines.join('\n');
}

export default function WeeklyProgressDigest() {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const { getSolvedCount, getStarredCount } = useCTCIProgress();
  const { streak, longestStreak } = useCTCIStreak();
  const { total: readinessScore } = useReadinessScore();

  const solvedCount = getSolvedCount();
  const starredCount = getStarredCount();
  const totalCount = CTCI_PROBLEMS.length;
  const drillRatings = useMemo(() => getDrillRatings(), []);
  const behavioralRatings = useMemo(() => getBehavioralRatings(), []);

  const digestContent = useMemo(() => buildDigestContent(
    solvedCount, starredCount, totalCount, streak, longestStreak,
    readinessScore, drillRatings, behavioralRatings
  ), [solvedCount, starredCount, totalCount, streak, longestStreak, readinessScore, drillRatings, behavioralRatings]);

  const sendMutation = trpc.digest.send.useMutation({
    onSuccess: (data) => {
      if (data.success) setSent(true);
    },
  });

  const handleSend = () => {
    sendMutation.mutate({
      title: `📊 Weekly Progress Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      content: digestContent,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(digestContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const pct = Math.round((solvedCount / totalCount) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Mail className="w-5 h-5" />
          <h3 className="text-lg font-bold">Weekly Progress Digest</h3>
        </div>
        <p className="text-indigo-200 text-sm">Compile your week's progress and send it to your Manus notifications</p>
      </div>

      {/* Stats preview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
          <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Readiness</div>
            <div className="text-base font-bold text-indigo-700 dark:text-indigo-300">{readinessScore}/100</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">CTCI Solved</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">{solvedCount} <span className="text-xs font-normal text-gray-400">({pct}%)</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
          <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
            <div className="text-base font-bold text-orange-600 dark:text-orange-400">{streak > 0 ? `${streak}d 🔥` : 'None'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
          <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Patterns Rated</div>
            <div className="text-base font-bold text-violet-700 dark:text-violet-300">{Object.keys(drillRatings).length}/{PATTERNS.length}</div>
          </div>
        </div>
      </div>

      {/* Digest preview */}
      <div className="p-4">
        <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-56 mb-4">
          <pre className="text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap">{digestContent}</pre>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending || sent}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
              sent
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
            }`}
          >
            {sendMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : sent ? (
              <><Check className="w-4 h-4" /> Sent to Notifications!</>
            ) : (
              <><Send className="w-4 h-4" /> Send to My Notifications</>
            )}
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
          </button>
        </div>

        {sendMutation.isError && (
          <p className="text-xs text-red-500 mt-2">Failed to send. Please try copying to clipboard instead.</p>
        )}
        {sent && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            Digest delivered to your Manus notifications. Check the bell icon in the top-right corner.
          </p>
        )}
      </div>
    </div>
  );
}
