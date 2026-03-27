/**
 * AIHintPanel — "Get Hint" button that sends the problem name and current code
 * to the LLM backend and streams back a targeted hint without revealing the full solution.
 * Designed to be embedded inside the TimedMockSession or CTCITrackerTab problem rows.
 */
import { useState } from 'react';
import { Lightbulb, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface AIHintPanelProps {
  problemName: string;
  currentCode?: string;
  /** Optional: compact mode for inline use in problem rows */
  compact?: boolean;
}

type HintLevel = 'gentle' | 'medium' | 'strong';

const HINT_LEVELS: { value: HintLevel; label: string; description: string; color: string }[] = [
  { value: 'gentle', label: 'Gentle Nudge', description: 'Point to the right data structure or approach family', color: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'medium', label: 'Key Insight', description: 'Describe the core algorithmic idea at a high level', color: 'text-amber-800 dark:text-amber-900' },
  { value: 'strong', label: 'Step-by-Step', description: 'Walk through the algorithm in plain English (no code)', color: 'text-red-600 dark:text-red-400' },
];

export default function AIHintPanel({ problemName, currentCode = '', compact = false }: AIHintPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState<HintLevel>('gentle');
  const [code, setCode] = useState(currentCode);
  const [hint, setHint] = useState<string | null>(null);
  const [usedLevel, setUsedLevel] = useState<HintLevel | null>(null);

  const hintMutation = trpc.hints.get.useMutation({
    onSuccess: (data) => {
      const hintText = typeof data.hint === 'string' ? data.hint : String(data.hint);
      setHint(hintText);
      setUsedLevel(hintLevel);
    },
  });

  const handleGetHint = () => {
    setHint(null);
    hintMutation.mutate({ problemName, currentCode: code, hintLevel });
  };

  const handleReset = () => {
    setHint(null);
    setUsedLevel(null);
    hintMutation.reset();
  };

  if (compact) {
    return (
      <div className="mt-2">
        <button
          onClick={() => setIsOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-900 hover:text-amber-900 dark:hover:text-amber-800 font-medium transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          {isOpen ? 'Hide hint' : 'Get AI Hint'}
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {isOpen && (
          <div className="mt-2 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
            <HintContent
              problemName={problemName}
              code={code}
              setCode={setCode}
              hintLevel={hintLevel}
              setHintLevel={setHintLevel}
              hint={hint}
              usedLevel={usedLevel}
              isPending={hintMutation.isPending}
              isError={hintMutation.isError}
              onGetHint={handleGetHint}
              onReset={handleReset}
              compact
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-amber-100 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">AI Hint</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300">{problemName}</p>
          </div>
        </div>
        {hint && (
          <button onClick={handleReset} className="text-gray-600 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4">
        <HintContent
          problemName={problemName}
          code={code}
          setCode={setCode}
          hintLevel={hintLevel}
          setHintLevel={setHintLevel}
          hint={hint}
          usedLevel={usedLevel}
          isPending={hintMutation.isPending}
          isError={hintMutation.isError}
          onGetHint={handleGetHint}
          onReset={handleReset}
          compact={false}
        />
      </div>
    </div>
  );
}

interface HintContentProps {
  problemName: string;
  code: string;
  setCode: (v: string) => void;
  hintLevel: HintLevel;
  setHintLevel: (v: HintLevel) => void;
  hint: string | null;
  usedLevel: HintLevel | null;
  isPending: boolean;
  isError: boolean;
  onGetHint: () => void;
  onReset: () => void;
  compact: boolean;
}

function HintContent({
  code, setCode, hintLevel, setHintLevel,
  hint, usedLevel, isPending, isError, onGetHint, onReset, compact
}: HintContentProps) {
  const levelInfo = HINT_LEVELS.find(l => l.value === usedLevel);

  if (hint) {
    return (
      <div className="space-y-3">
        {levelInfo && (
          <div className={`text-xs font-semibold uppercase tracking-wide ${levelInfo.color}`}>
            {levelInfo.label} Hint
          </div>
        )}
        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-amber-100 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-700">
          {hint}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="text-xs text-gray-700 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 underline"
          >
            Get another hint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hint level selector */}
      <div>
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 block">
          Hint Strength
        </label>
        <div className="flex gap-2 flex-wrap">
          {HINT_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => setHintLevel(level.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                hintLevel === level.value
                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-100'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-600'
              }`}
              title={level.description}
            >
              {level.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">
          {HINT_LEVELS.find(l => l.value === hintLevel)?.description}
        </p>
      </div>

      {/* Optional code input */}
      {!compact && (
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5 block">
            Your current approach (optional)
          </label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste your current code or describe your approach..."
            rows={3}
            className="w-full text-xs font-mono p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-600 resize-none"
          />
        </div>
      )}

      <button
        onClick={onGetHint}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 transition-all"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Getting hint...</>
        ) : (
          <><Lightbulb className="w-4 h-4" /> Get Hint</>
        )}
      </button>

      {isError && (
        <p className="text-xs text-red-500">Failed to get hint. Please try again.</p>
      )}
    </div>
  );
}
