/**
 * CTCITrackerTab — Crack The Coding Interview Practice Tracker
 * Design: Clean data-table layout with dark mode support, difficulty color coding,
 * per-problem solve/star/notes, and aggregate progress stats.
 * Source: Dinesh Varyani's CTCI spreadsheet (500 problems)
 */

import { useState, useMemo, useRef } from 'react';
import { CTCI_PROBLEMS, CTCI_TOPICS, DIFFICULTY_COLORS } from '@/lib/ctciProblems';
import { useCTCIProgress } from '@/hooks/useCTCIProgress';
import { useCTCIStreak } from '@/hooks/useCTCIStreak';
import CTCIExport from '@/components/CTCIExport';
import { useXPContext } from '@/contexts/XPContext';
import {
  CheckCircle2, Circle, Star, StarOff, ExternalLink,
  ChevronDown, ChevronUp, Search, X, RotateCcw, SlidersHorizontal,
  Trophy, Flame, Target, BookOpen
} from 'lucide-react';

const PAGE_SIZE = 50;

export default function CTCITrackerTab() {
  const { progress, toggleSolved, toggleStarred, setNotes, resetAll, getSolvedCount, getStarredCount } = useCTCIProgress();
  const { streak, longestStreak, activatedToday, recordSolve } = useCTCIStreak();
  const { addXP } = useXPContext();

  // Filters
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved' | 'Starred'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const noteRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const solvedCount = getSolvedCount();
  const starredCount = getStarredCount();
  const totalCount = CTCI_PROBLEMS.length;
  const pct = Math.round((solvedCount / totalCount) * 100);

  // Difficulty breakdown
  const easyTotal = CTCI_PROBLEMS.filter(p => p.difficulty === 'Easy').length;
  const medTotal = CTCI_PROBLEMS.filter(p => p.difficulty === 'Medium').length;
  const hardTotal = CTCI_PROBLEMS.filter(p => p.difficulty === 'Hard').length;
  const easySolved = CTCI_PROBLEMS.filter(p => p.difficulty === 'Easy' && progress[p.id]?.solved).length;
  const medSolved = CTCI_PROBLEMS.filter(p => p.difficulty === 'Medium' && progress[p.id]?.solved).length;
  const hardSolved = CTCI_PROBLEMS.filter(p => p.difficulty === 'Hard' && progress[p.id]?.solved).length;

  // Filtered problems
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CTCI_PROBLEMS.filter(p => {
      if (diffFilter !== 'All' && p.difficulty !== diffFilter) return false;
      if (topicFilter !== 'All' && !p.topic.includes(topicFilter)) return false;
      if (statusFilter === 'Solved' && !progress[p.id]?.solved) return false;
      if (statusFilter === 'Unsolved' && progress[p.id]?.solved) return false;
      if (statusFilter === 'Starred' && !progress[p.id]?.starred) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.topic.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, diffFilter, topicFilter, statusFilter, progress]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch(''); setDiffFilter('All'); setTopicFilter('All'); setStatusFilter('All'); setPage(1);
  };
  const hasActiveFilters = search || diffFilter !== 'All' || topicFilter !== 'All' || statusFilter !== 'All';

  // Daily Challenge — deterministic unsolved problem of the day
  const dailyChallenge = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const unsolved = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved);
    if (unsolved.length === 0) return null;
    return unsolved[dayOfYear % unsolved.length];
  }, [progress]);
  const dailyDate = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

  const handleToggleSolved = (id: number) => {
    const wasSolved = progress[id]?.solved;
    toggleSolved(id);
    // Record streak only when marking as solved (not unsolved)
    if (!wasSolved) {
      recordSolve();
      const currentSolved = getSolvedCount();
      // First solve milestone
      if (currentSolved === 0) {
        addXP('first_solve', 'First CTCI problem solved!');
      } else {
        addXP('ctci_solve', `Solved CTCI problem #${id}`);
      }
    }
  };
  const handleToggleStarred = (id: number) => { toggleStarred(id); };
  const handleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
    setTimeout(() => noteRefs.current[id]?.focus(), 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold mb-1">CTCI Practice Tracker</h2>
            <p className="text-blue-200 text-sm">
              Crack The Coding Interview — Dinesh Varyani · 500 curated LeetCode problems
            </p>
            <a
              href="https://docs.google.com/spreadsheets/d/1pnI8HmSMPcfwrCCu7wYETCXaKDig4VucZDpcjVRuYrE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-xs mt-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> View original spreadsheet
            </a>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* CTCI Streak Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                streak >= 7
                  ? 'bg-orange-500/20 border-orange-400/50 text-orange-200'
                  : streak >= 3
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                  : streak >= 1
                  ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200'
                  : 'bg-blue-800/40 border-blue-600/40 text-blue-300'
              }`}
              title={streak === 0 ? 'Solve a problem today to start your streak!' : `${streak}-day streak${activatedToday ? ' — active today ✓' : ' — solve today to keep it going!'}`}
            >
              <Flame
                className={`w-5 h-5 ${
                  streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-amber-400' : streak >= 1 ? 'text-yellow-400' : 'text-blue-400'
                }`}
                fill={streak >= 3 ? 'currentColor' : 'none'}
              />
              <div className="text-right">
                <div className="text-sm font-bold leading-none">
                  {streak === 0 ? 'No streak' : `${streak}-day streak`}
                </div>
                {longestStreak > 0 && (
                  <div className="text-xs opacity-70 leading-none mt-0.5">Best: {longestStreak}</div>
                )}
              </div>
              {activatedToday && streak > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Active today" />
              )}
            </div>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg border border-blue-700 hover:border-red-500"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-100">Overall Progress</span>
            <span className="text-lg font-bold">{solvedCount} / {totalCount} <span className="text-blue-300 text-sm font-normal">({pct}%)</span></span>
          </div>
          <div className="w-full bg-blue-950/60 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                  pct >= 50 ? 'linear-gradient(90deg,#3b82f6,#60a5fa)' :
                  'linear-gradient(90deg,#6366f1,#818cf8)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Easy Solved', solved: easySolved, total: easyTotal, icon: <Target className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Medium Solved', solved: medSolved, total: medTotal, icon: <Flame className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Hard Solved', solved: hardSolved, total: hardTotal, icon: <Trophy className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Starred', solved: starredCount, total: totalCount, icon: <Star className="w-4 h-4" />, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-border`}>
            <div className={`flex items-center gap-2 ${s.color} mb-2`}>
              {s.icon}
              <span className="text-xs font-semibold">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s.solved}</div>
            <div className="text-xs text-muted-foreground">of {s.total} · {Math.round((s.solved / s.total) * 100)}%</div>
            <div className="mt-2 w-full bg-border rounded-full h-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${s.color.replace('text-', 'bg-').replace(' dark:text-', ' dark:bg-')}`}
                style={{ width: `${Math.round((s.solved / s.total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Daily Challenge Banner */}
      {dailyChallenge && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-3xl select-none flex-shrink-0 animate-bounce">🌟</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-600">
                  🌟 Problem of the Day
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{dailyDate}</span>
              </div>
              <a
                href={dailyChallenge.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-gray-900 dark:text-gray-100 hover:text-amber-700 dark:hover:text-amber-300 transition-colors leading-snug flex items-center gap-1.5 group"
              >
                {dailyChallenge.id}. {dailyChallenge.name}
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  dailyChallenge.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                  dailyChallenge.difficulty === 'Hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>{dailyChallenge.difficulty}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{dailyChallenge.topic.split(',').slice(0, 3).join(', ')}</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSolved(dailyChallenge.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                progress[dailyChallenge.id]?.solved
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-600'
                  : 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
              }`}
            >
              {progress[dailyChallenge.id]?.solved
                ? <><CheckCircle2 className="w-4 h-4" /> Done!</>
                : <><Circle className="w-4 h-4" /> Mark Solved</>}
            </button>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search problems by name or topic..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-background border-border text-foreground hover:bg-muted'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />}
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-2">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
            {/* Difficulty */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Difficulty</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => { setDiffFilter(d); setPage(1); }}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      diffFilter === d
                        ? d === 'Easy' ? 'bg-emerald-600 text-white border-emerald-600'
                          : d === 'Medium' ? 'bg-amber-500 text-white border-amber-500'
                          : d === 'Hard' ? 'bg-red-600 text-white border-red-600'
                          : 'bg-blue-600 text-white border-blue-600'
                        : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['All', 'Solved', 'Unsolved', 'Starred'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Topic */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Topic</label>
              <select
                value={topicFilter}
                onChange={e => { setTopicFilter(e.target.value); setPage(1); }}
                className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Topics</option>
                {CTCI_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {totalCount} problems
          {hasActiveFilters && ' (filtered)'}
        </div>
      </div>

      {/* Problem List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_120px_80px_40px_40px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="text-center">#</div>
          <div>Problem</div>
          <div className="hidden sm:block">Topic</div>
          <div>Difficulty</div>
          <div className="text-center">★</div>
          <div className="text-center">✓</div>
        </div>

        {paginated.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No problems match your filters.</p>
            <button onClick={resetFilters} className="mt-2 text-xs text-blue-500 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginated.map(p => {
              const prog = progress[p.id] || { solved: false, starred: false, notes: '' };
              const diff = DIFFICULTY_COLORS[p.difficulty];
              const isExpanded = expandedId === p.id;
              const primaryTopic = p.topic.split(',')[0].trim();

              return (
                <div key={p.id} className={`transition-colors ${prog.solved ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                  <div className="grid grid-cols-[40px_1fr_120px_80px_40px_40px] gap-2 px-4 py-3 items-center hover:bg-muted/30">
                    {/* ID */}
                    <div className="text-xs text-muted-foreground text-center font-mono">{p.id}</div>

                    {/* Name + expand */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate flex items-center gap-1 ${prog.solved ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                        >
                          {p.name}
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                        </a>
                      </div>
                      <button
                        onClick={() => handleExpand(p.id)}
                        className="text-xs text-muted-foreground hover:text-blue-500 flex items-center gap-0.5 mt-0.5"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {prog.notes ? 'Notes saved' : 'Add notes'}
                      </button>
                    </div>

                    {/* Topic */}
                    <div className="hidden sm:block">
                      <span className="text-xs text-muted-foreground truncate block" title={p.topic}>{primaryTopic}</span>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}>
                        {p.difficulty}
                      </span>
                    </div>

                    {/* Star */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleStarred(p.id)}
                        className={`transition-colors ${prog.starred ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}`}
                        title={prog.starred ? 'Unstar' : 'Star for review'}
                      >
                        {prog.starred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Solved */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleSolved(p.id)}
                        className={`transition-colors ${prog.solved ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-400'}`}
                        title={prog.solved ? 'Mark unsolved' : 'Mark solved'}
                      >
                        {prog.solved ? <CheckCircle2 className="w-4 h-4 fill-current" /> : <Circle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded notes */}
                  {isExpanded && (
                    <div className="px-4 pb-3 bg-muted/20">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">Topics: {p.topic}</div>
                      <textarea
                        ref={el => { noteRefs.current[p.id] = el; }}
                        value={prog.notes || ''}
                        onChange={e => setNotes(p.id, e.target.value)}
                        placeholder="Add your notes, approach, edge cases, or time complexity here..."
                        rows={3}
                        className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                      />
                      {prog.solvedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ Solved on {new Date(prog.solvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export */}
      <CTCIExport />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
            <span className="ml-2 text-xs">({filtered.length} problems)</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
