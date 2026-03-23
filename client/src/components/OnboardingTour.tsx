/**
 * OnboardingTour — 60-second guided tour for first-time users.
 *
 * Flow:
 *  Step 1 → Welcome + what this guide is
 *  Step 2 → The 3 failure modes (System Design, Coding, Behavioral)
 *  Step 3 → The 10 HIGH IMPACT tools (visual grid)
 *  Step 4 → "Start with your Readiness Report" CTA → routes to Readiness tab
 *
 * Shown once per user. Dismissed state stored in DB (onboarding_progress table)
 * via trpc.onboarding.dismiss. Falls back to localStorage for unauthenticated users.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Zap, Brain, MessageSquare, BarChart2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const LS_KEY = "onboarding_tour_done_v2";

const HIGH_IMPACT_TOOLS = [
  { emoji: "🤖", label: "AI Interrupt Mode", tab: "System Design", color: "orange" },
  { emoji: "🔢", label: "BoE Grader", tab: "System Design", color: "violet" },
  { emoji: "⚔️", label: "Adversarial Review", tab: "System Design", color: "red" },
  { emoji: "🎙️", label: "Think Out Loud", tab: "Coding", color: "blue" },
  { emoji: "⚡", label: "Pattern Speed Drill", tab: "Coding", color: "yellow" },
  { emoji: "🗺️", label: "Remediation Plan", tab: "Coding", color: "green" },
  { emoji: "🗂️", label: "Story Matrix", tab: "Behavioral", color: "pink" },
  { emoji: "🎭", label: "Persona Stress Test", tab: "Behavioral", color: "purple" },
  { emoji: "📊", label: "Impact Coach", tab: "Behavioral", color: "teal" },
  { emoji: "📈", label: "Readiness Report", tab: "Readiness", color: "emerald" },
];

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to the Meta IC6/IC7 Interview Guide",
    subtitle: "Designed by The Architect — a Meta engineer. Let's get you to 7/10 pass rate.",
    content: null,
  },
  {
    id: "failures",
    title: "Why candidates fail at Meta",
    subtitle: "The data is clear. Three areas account for 80% of rejections.",
    content: "failures",
  },
  {
    id: "tools",
    title: "10 tools built to fix exactly that",
    subtitle: "Each one targets a specific failure mode. All powered by AI. All free.",
    content: "tools",
  },
  {
    id: "start",
    title: "Start with your Readiness Report",
    subtitle: "It takes 60 seconds and tells you exactly where you stand before you waste time on the wrong things.",
    content: "cta",
  },
];

interface OnboardingTourProps {
  onComplete: (goToReadiness?: boolean) => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const { isAuthenticated } = useAuth();
  const dismissMutation = trpc.onboarding.save.useMutation();

  const handleDismiss = (goToReadiness = false) => {
    // Mark as done in localStorage
    localStorage.setItem(LS_KEY, "1");
    // Mark as done in DB if authenticated
    if (isAuthenticated) {
      dismissMutation.mutate({ progress: { tour_complete: true }, dismissed: true });
    }
    onComplete(goToReadiness);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={() => handleDismiss(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Skip tour"
        >
          <X size={18} />
        </button>

        {/* Step counter */}
        <div className="absolute top-4 left-4 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step
                  ? "bg-orange-500 w-5"
                  : i < step
                  ? "bg-orange-300"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pt-12 pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="mb-6">
                <h2
                  className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {currentStep.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Step-specific content */}
              {currentStep.content === "failures" && (
                <div className="grid grid-cols-3 gap-4 mb-2">
                  {[
                    {
                      icon: <Brain size={20} />,
                      label: "System Design",
                      pct: "42%",
                      desc: "Can't handle interruptions, no BoE instinct",
                      color: "bg-red-50 border-red-200 text-red-700",
                      iconBg: "bg-red-100 text-red-600",
                    },
                    {
                      icon: <Zap size={20} />,
                      label: "Coding",
                      pct: "31%",
                      desc: "Silent coding, wrong pattern recognition",
                      color: "bg-orange-50 border-orange-200 text-orange-700",
                      iconBg: "bg-orange-100 text-orange-600",
                    },
                    {
                      icon: <MessageSquare size={20} />,
                      label: "Behavioral",
                      pct: "27%",
                      desc: "Story gaps, no metrics, weak under pressure",
                      color: "bg-amber-50 border-amber-200 text-amber-700",
                      iconBg: "bg-amber-100 text-amber-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-xl border p-4 ${item.color}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      <div className="text-2xl font-black mb-1">{item.pct}</div>
                      <div className="text-xs font-bold mb-1">{item.label}</div>
                      <div className="text-xs opacity-80 leading-snug">{item.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {currentStep.content === "tools" && (
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {HIGH_IMPACT_TOOLS.map((tool) => (
                    <div
                      key={tool.label}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 text-center"
                    >
                      <span className="text-xl">{tool.emoji}</span>
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 leading-tight">
                        {tool.label}
                      </span>
                      <span className="text-[9px] text-orange-600 dark:text-orange-400 font-semibold">
                        {tool.tab}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {currentStep.content === "cta" && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700 p-6 mb-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-2xl">
                      📈
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">Weekly AI Readiness Report</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400">
                        Honest IC-level assessment across all 3 domains
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {[
                      "Scores your readiness across System Design, Coding, and Behavioral",
                      "Identifies your exact weakest area so you don't waste time",
                      "Generates a personalized 7-day sprint plan",
                      "Updates weekly as you practice — tracks real improvement",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={step === 0}
              className="gap-1.5 text-gray-500"
            >
              <ChevronLeft size={15} /> Back
            </Button>

            <button
              onClick={() => handleDismiss(false)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
            >
              Skip tour
            </button>

            {step < STEPS.length - 1 ? (
              <Button
                size="sm"
                onClick={next}
                className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Next <ChevronRight size={15} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleDismiss(true)}
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Go to Readiness Report <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Hook to determine if the onboarding tour should be shown.
 * Returns true for first-time users (not in localStorage and not dismissed in DB).
 */
export function useOnboardingTour() {
  const [shouldShow, setShouldShow] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const { data: onboardingData } = trpc.onboarding.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (loading) return;
    const localDone = localStorage.getItem(LS_KEY) === "1";
    if (localDone) {
      setShouldShow(false);
      return;
    }
    // If authenticated, check DB
    if (isAuthenticated && onboardingData !== undefined) {
      const dbDone = onboardingData?.dismissed === true ||
        (onboardingData?.progress && (onboardingData.progress as Record<string, boolean>)["tour_complete"]);
      setShouldShow(!dbDone);
    } else if (!isAuthenticated) {
      // Not authenticated — show based on localStorage only
      setShouldShow(true);
    }
  }, [loading, isAuthenticated, onboardingData]);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}
