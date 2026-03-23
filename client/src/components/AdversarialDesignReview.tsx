/**
 * AdversarialDesignReview — #3 High-Impact Feature
 *
 * Candidate pastes their system design. AI finds the 3 weakest points and
 * attacks each with a sharp challenge question. Candidate defends each attack.
 * Each defense is scored on acknowledgment, solution quality, and trade-off discussion.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Shield, Sword, ChevronRight, RotateCcw, Sparkles, AlertTriangle } from "lucide-react";
import { HighImpactBadge, HighImpactWrapper, HighImpactSectionHeader, ImpactCallout } from "@/components/HighImpactBadge";
import { motion, AnimatePresence } from "framer-motion";

type Level = "L4" | "L5" | "L6" | "L7";

interface Attack {
  weaknessTitle: string;
  attackQuestion: string;
  severity: "Critical" | "Major" | "Minor";
  hint: string;
}

interface DefenseResult {
  acknowledgment: number;
  solution: number;
  tradeoffs: number;
  verdict: string;
  feedback: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40",
  Major: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40",
  Minor: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40",
};

const SD_PROBLEMS = [
  "Design a URL Shortener",
  "Design a News Feed",
  "Design a Distributed Cache",
  "Design a Rate Limiter",
  "Design a Notification System",
  "Design a Search Autocomplete System",
  "Design a Distributed Message Queue",
  "Design a Video Streaming Service",
];

export default function AdversarialDesignReview() {
  const [problemTitle, setProblemTitle] = useState(SD_PROBLEMS[0]);
  const [designText, setDesignText] = useState("");
  const [targetLevel, setTargetLevel] = useState<Level>("L6");
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [defenses, setDefenses] = useState<Record<number, string>>({});
  const [defenseResults, setDefenseResults] = useState<Record<number, DefenseResult>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [phase, setPhase] = useState<"input" | "defending" | "done">("input");

  const attackMutation = trpc.highImpact.adversarialAttack.useMutation();
  const defenseMutation = trpc.highImpact.scoreDefense.useMutation();

  const handleAttack = async () => {
    const res = await attackMutation.mutateAsync({ problemTitle, designText, targetLevel });
    setAttacks(res.attacks as Attack[]);
    setDefenses({});
    setDefenseResults({});
    setShowHint({});
    setPhase("defending");
  };

  const handleDefend = async (idx: number) => {
    const attack = attacks[idx];
    const defense = defenses[idx] ?? "";
    if (!defense.trim()) return;
    const res = await defenseMutation.mutateAsync({
      attackQuestion: attack.attackQuestion,
      weaknessTitle: attack.weaknessTitle,
      candidateDefense: defense,
      targetLevel,
    });
    setDefenseResults(prev => ({ ...prev, [idx]: res as DefenseResult }));
  };

  const allDefended = attacks.length > 0 && attacks.every((_, i) => defenseResults[i]);
  const avgDefenseScore = allDefended
    ? (Object.values(defenseResults).reduce((a, r) => a + (r.acknowledgment + r.solution + r.tradeoffs) / 3, 0) / attacks.length).toFixed(1)
    : null;

  const reset = () => {
    setDesignText("");
    setAttacks([]);
    setDefenses({});
    setDefenseResults({});
    setShowHint({});
    setPhase("input");
    attackMutation.reset();
  };

  return (
    <div className="space-y-4">
      <HighImpactSectionHeader
        title="Adversarial Design Review"
        subtitle="Paste your system design and the AI will attack its 3 weakest points — just like a senior Meta engineer in a design review. Defend each attack to build resilience."
        stat="Simulates Real Design Reviews"
        variant="orange"
        icon={<Sword size={20} />}
      />

      <ImpactCallout variant="orange">
        Meta interviewers are trained to probe weaknesses. Candidates who can't defend their design choices under pressure fail even if their initial design is good. This drill builds that muscle.
      </ImpactCallout>

      {phase === "input" && (
        <HighImpactWrapper variant="orange" className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Problem</label>
              <select
                value={problemTitle}
                onChange={e => setProblemTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-red-400"
              >
                {SD_PROBLEMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Target Level</label>
              <div className="flex gap-2">
                {(["L4", "L5", "L6", "L7"] as Level[]).map(l => (
                  <button key={l} onClick={() => setTargetLevel(l)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${targetLevel === l ? "bg-red-500 text-white border-red-500" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-red-300"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
              Your System Design
              <span className="ml-2 text-gray-400 normal-case font-normal">(paste your design or write it here)</span>
            </label>
            <textarea
              value={designText}
              onChange={e => setDesignText(e.target.value)}
              rows={12}
              placeholder={`Describe your design for ${problemTitle}. Include: requirements, scale estimates, architecture, data model, APIs, trade-offs...`}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-red-400 resize-none"
            />
          </div>

          <button
            onClick={handleAttack}
            disabled={attackMutation.isPending || designText.trim().length < 100}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
          >
            {attackMutation.isPending ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing weaknesses...</>
            ) : (
              <><Sword size={16} />Attack My Design</>
            )}
          </button>
          {designText.trim().length < 100 && designText.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">Write at least 100 characters for a meaningful attack.</p>
          )}
        </HighImpactWrapper>
      )}

      {phase === "defending" && attacks.length > 0 && (
        <div className="space-y-4">
          <HighImpactWrapper variant="orange" className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Defending: <span className="text-red-600 dark:text-red-400">{problemTitle}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{Object.keys(defenseResults).length}/{attacks.length} defended</span>
                {allDefended && (
                  <button onClick={() => setPhase("done")} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all">
                    <Shield size={11} /> See Summary
                  </button>
                )}
              </div>
            </div>
          </HighImpactWrapper>

          {attacks.map((attack, idx) => (
            <HighImpactWrapper key={idx} variant="orange" className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[attack.severity]}`}>
                      {attack.severity}
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{attack.weaknessTitle}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                    {attack.attackQuestion}
                  </p>
                </div>
              </div>

              {!defenseResults[idx] ? (
                <>
                  <textarea
                    value={defenses[idx] ?? ""}
                    onChange={e => setDefenses(prev => ({ ...prev, [idx]: e.target.value }))}
                    rows={4}
                    placeholder="Acknowledge the weakness, propose a concrete fix, and discuss trade-offs..."
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-red-400 resize-none mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowHint(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showHint[idx] ? "Hide hint" : "Show hint"}
                    </button>
                    <button
                      onClick={() => handleDefend(idx)}
                      disabled={defenseMutation.isPending || !(defenses[idx]?.trim())}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      {defenseMutation.isPending ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={12} />}
                      Submit Defense
                    </button>
                  </div>
                  <AnimatePresence>
                    {showHint[idx] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2">
                        <p className="text-xs text-amber-700 dark:text-amber-400"><span className="font-bold">Hint:</span> {attack.hint}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border p-3 ${defenseResults[idx].verdict === "Strong Defense" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40" : defenseResults[idx].verdict === "Weak Defense" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${defenseResults[idx].verdict === "Strong Defense" ? "text-emerald-700 dark:text-emerald-400" : defenseResults[idx].verdict === "Weak Defense" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                      {defenseResults[idx].verdict}
                    </span>
                    <div className="flex gap-3 text-[10px] font-bold text-gray-500">
                      <span>Ack: {defenseResults[idx].acknowledgment}/5</span>
                      <span>Sol: {defenseResults[idx].solution}/5</span>
                      <span>T/O: {defenseResults[idx].tradeoffs}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{defenseResults[idx].feedback}</p>
                </motion.div>
              )}
            </HighImpactWrapper>
          ))}
        </div>
      )}

      {phase === "done" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <HighImpactWrapper variant="orange" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Shield size={15} className="text-red-500" />
                Design Review Complete
              </h4>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${parseFloat(avgDefenseScore!) >= 4 ? "text-emerald-600 dark:text-emerald-400" : parseFloat(avgDefenseScore!) >= 3 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                  {avgDefenseScore}/5
                </span>
                <HighImpactBadge
                  variant={parseFloat(avgDefenseScore!) >= 4 ? "emerald" : parseFloat(avgDefenseScore!) >= 3 ? "orange" : "red"}
                  label={parseFloat(avgDefenseScore!) >= 4 ? "STRONG" : parseFloat(avgDefenseScore!) >= 3 ? "ADEQUATE" : "NEEDS WORK"}
                />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {attacks.map((attack, idx) => (
                <div key={idx} className={`rounded-lg border px-3 py-2 ${defenseResults[idx]?.verdict === "Strong Defense" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40" : defenseResults[idx]?.verdict === "Weak Defense" ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{attack.weaknessTitle}</span>
                    <span className={`text-xs font-bold ${defenseResults[idx]?.verdict === "Strong Defense" ? "text-emerald-600 dark:text-emerald-400" : defenseResults[idx]?.verdict === "Weak Defense" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {defenseResults[idx]?.verdict}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={reset} className="flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">
              <RotateCcw size={12} /> Review Another Design
            </button>
          </HighImpactWrapper>
        </motion.div>
      )}
    </div>
  );
}
