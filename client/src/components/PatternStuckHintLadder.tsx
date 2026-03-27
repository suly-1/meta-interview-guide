/**
 * PatternStuckHintLadder — 3-step hint escalation for pattern cards.
 * Gentle → Medium → Full Walkthrough, each step revealed progressively.
 * Uses the patternHint.get tRPC procedure.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Lightbulb, ChevronRight, Loader2, AlertCircle } from "lucide-react";

type HintLevel = "gentle" | "medium" | "full";

interface HintStep {
  level: HintLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

const HINT_STEPS: HintStep[] = [
  {
    level: "gentle",
    label: "Gentle Nudge",
    description: "Point me to the right algorithmic family",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-700",
    icon: "💡",
  },
  {
    level: "medium",
    label: "Medium Hint",
    description: "Describe the core insight",
    color: "text-amber-900 dark:text-amber-900",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-700",
    icon: "🔍",
  },
  {
    level: "full",
    label: "Full Walkthrough",
    description: "Step-by-step algorithm explanation",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-700",
    icon: "📖",
  },
];

interface PatternStuckHintLadderProps {
  patternName: string;
  keyIdea: string;
}

export default function PatternStuckHintLadder({ patternName, keyIdea }: PatternStuckHintLadderProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 = not started
  const [hints, setHints] = useState<Record<HintLevel, string>>({ gentle: "", medium: "", full: "" });
  const [loadingLevel, setLoadingLevel] = useState<HintLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getHintMutation = trpc.patternHint.get.useMutation();

  const handleGetHint = async (stepIndex: number) => {
    const step = HINT_STEPS[stepIndex];
    if (!step) return;
    if (hints[step.level]) {
      // Already fetched — just advance
      setCurrentStep(stepIndex);
      return;
    }
    setLoadingLevel(step.level);
    setError(null);
    try {
      const result = await getHintMutation.mutateAsync({
        patternName,
        keyIdea,
        hintLevel: step.level,
      });
      setHints(prev => ({ ...prev, [step.level]: result.hint }));
      setCurrentStep(stepIndex);
    } catch (err) {
      setError("Failed to get hint. Please try again.");
    } finally {
      setLoadingLevel(null);
    }
  };

  const handleReset = () => {
    setCurrentStep(-1);
    setHints({ gentle: "", medium: "", full: "" });
    setError(null);
    setOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            Stuck? Get a Hint
          </span>
          {currentStep >= 0 && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-900 px-2 py-0.5 rounded-full font-semibold">
              Step {currentStep + 1}/3 revealed
            </span>
          )}
        </div>
        <ChevronRight
          size={14}
          className={`text-gray-600 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            Hints escalate progressively. Try the gentlest hint first — only go deeper if you're still stuck.
          </p>

          {/* Hint steps */}
          <div className="space-y-2">
            {HINT_STEPS.map((step, idx) => {
              const isRevealed = currentStep >= idx;
              const isLoading = loadingLevel === step.level;
              const isNextToReveal = idx === currentStep + 1;
              const isLocked = idx > currentStep + 1;

              return (
                <div
                  key={step.level}
                  className={`rounded-lg border transition-all ${
                    isRevealed
                      ? `${step.bgColor} ${step.borderColor}`
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {/* Step header */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{step.icon}</span>
                      <div>
                        <div className={`text-xs font-bold ${isRevealed ? step.color : "text-gray-700 dark:text-gray-300"}`}>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-200">{step.description}</div>
                      </div>
                    </div>
                    {!isRevealed && (
                      <button
                        onClick={() => handleGetHint(idx)}
                        disabled={isLocked || isLoading}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                          isLocked
                            ? "text-gray-700 dark:text-gray-300 cursor-not-allowed"
                            : isNextToReveal
                            ? `${step.color} ${step.bgColor} ${step.borderColor} border hover:opacity-80`
                            : "text-gray-600 cursor-not-allowed"
                        }`}
                        title={isLocked ? "Reveal previous hints first" : undefined}
                      >
                        {isLoading ? (
                          <><Loader2 size={11} className="animate-spin" /> Getting hint...</>
                        ) : isLocked ? (
                          "🔒 Locked"
                        ) : (
                          "Reveal"
                        )}
                      </button>
                    )}
                  </div>

                  {/* Hint content */}
                  {isRevealed && hints[step.level] && (
                    <div className={`px-3 pb-3 text-sm leading-relaxed ${step.color}`}>
                      {hints[step.level]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          {/* Reset */}
          {currentStep >= 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-gray-600 hover:text-gray-600 dark:hover:text-gray-700 transition-colors"
            >
              ↺ Reset hints
            </button>
          )}
        </div>
      )}
    </div>
  );
}
