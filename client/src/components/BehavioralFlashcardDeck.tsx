import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, RotateCcw, Shuffle, Eye, EyeOff, BookOpen, Layers } from "lucide-react";
import { BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";

type FlashCard = {
  question: string;
  probes: string[];
  areaTitle: string;
  areaBg: string;
  areaBorder: string;
  areaTitleColor: string;
  areaIconColor: string;
  ic6Answer: string;
  ic7Answer: string;
};

// IC6 vs IC7 sample answer pairs for representative questions
const IC6_IC7_ANSWERS: Record<string, { ic6: string; ic7: string }> = {
  "Tell me about a high-impact project you have worked on.": {
    ic6: "I led the migration of our payments service from a monolith to microservices. I owned the technical design, coordinated with the data team on schema changes, and delivered the migration in 3 sprints with zero downtime. The result was a 40% reduction in p99 latency and improved deploy frequency from monthly to weekly.",
    ic7: "I identified that our entire ads delivery stack was becoming a bottleneck across 6 product teams — not just one. I drove a cross-org initiative to redesign the serving layer, aligning 4 engineering directors on a shared roadmap. I personally owned the critical path architecture, unblocked 3 teams with conflicting requirements, and delivered a system that reduced infrastructure cost by $2M/year while enabling 3 new product launches that couldn't have shipped otherwise.",
  },
  "Tell me about the most successful project you have shipped.": {
    ic6: "I shipped a real-time notification system that reduced user churn by 12%. I owned the backend design, worked with product to define the API contract, and led a team of 3 engineers to deliver in 6 weeks. Post-launch metrics showed a 15% increase in DAU for the affected cohort.",
    ic7: "The most impactful thing I shipped was a platform capability, not a feature. I recognized that 5 product teams were each building their own notification pipelines, creating fragmentation and duplicated on-call burden. I built the case for a unified platform, got buy-in from the VP, and led an org-wide migration over 4 quarters. The result was a 60% reduction in notification-related incidents across the org and freed up ~20 engineer-months of duplicated work annually.",
  },
  "Tell me about a time you had to make a difficult technical decision with incomplete information.": {
    ic6: "We needed to choose between two database technologies for a new service with uncertain query patterns. I ran a 2-week spike, benchmarked both options against our expected load, documented trade-offs, and made a recommendation. I also defined a migration path in case we needed to switch later. The team aligned and we shipped on time.",
    ic7: "We were at a fork: rebuild our ML feature store from scratch or extend the existing one. The decision had implications for 8 teams and $3M in infra spend. I organized a structured decision process: defined the criteria with stakeholders, ran a 3-team proof of concept in parallel, and facilitated a decision review with the VP of Engineering. I was willing to argue for the harder path (rebuild) because I had done the analysis. We rebuilt, and 18 months later it enabled 3 new ML products that the old system couldn't support.",
  },
  "Describe a time when you disagreed with your manager or leadership on a technical or product decision.": {
    ic6: "My manager wanted to use an off-the-shelf solution for our search feature, but I believed a custom approach would give us better performance. I wrote a technical doc comparing both options with benchmarks, presented it in our weekly sync, and my manager agreed to try the custom approach. It ended up being 3× faster for our use case.",
    ic7: "Leadership had decided to sunset a platform I believed was still strategically important. Rather than just accepting the decision, I built a quantitative case: I surveyed 12 teams, modeled the migration cost at $4M and 18 months, and identified 3 product bets that depended on the platform. I presented this to the Director and VP, acknowledged the legitimate reasons for sunsetting, and proposed a middle path — a 6-month maintenance mode with a clear deprecation timeline. They adopted my proposal. This taught me that disagreeing at the IC7 level means owning the full analysis, not just the technical opinion.",
  },
  "Tell me about a time when your team had a conflict or disagreement with another team.": {
    ic6: "Our team and the platform team disagreed on API ownership. I set up a joint meeting, we mapped out the dependency graph, and agreed on a clear contract with versioning. The conflict was resolved in two weeks and we shipped without blocking each other.",
    ic7: "Two orgs were in a months-long standoff over who owned the data pipeline — each team had legitimate reasons and neither wanted to take on the operational burden. I stepped in not as a neutral party but as someone who could see the org-level cost of the stalemate. I facilitated a structured negotiation, proposed a shared ownership model with explicit SLAs, and got both directors to agree in a single meeting by framing it as a business risk rather than a turf war. The resolution unblocked 4 product launches.",
  },
  "Can you talk about a time when something went wrong?": {
    ic6: "We had a production incident where a config change caused a 20-minute outage. I was the on-call engineer, diagnosed the issue, rolled back the change, and wrote a post-mortem with 5 action items. We implemented automated config validation to prevent recurrence.",
    ic7: "We shipped a major infrastructure change that caused a 4-hour degradation affecting 10M users. As the technical lead, I owned the incident response — but more importantly, I owned the systemic fix. I ran a blameless post-mortem, identified that our deployment process lacked staged rollouts for infrastructure changes, and drove an org-wide initiative to implement progressive delivery. I presented the findings to the VP and got resourcing for a 3-month project. The incident became a forcing function for a process improvement that now protects the entire org.",
  },
};

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getWordCountColor(count: number): { color: string; label: string } {
  if (count < 100) return { color: "text-red-600", label: "Too short" };
  if (count < 150) return { color: "text-amber-600", label: "Getting there" };
  if (count <= 300) return { color: "text-emerald-600", label: "Good length" };
  if (count <= 400) return { color: "text-amber-600", label: "A bit long" };
  return { color: "text-red-600", label: "Too long" };
}

function getWordCountBg(count: number): string {
  if (count < 100) return "bg-red-500";
  if (count < 150) return "bg-amber-500";
  if (count <= 300) return "bg-emerald-500";
  if (count <= 400) return "bg-amber-500";
  return "bg-red-500";
}

// Build flash card deck from all questions
function buildDeck(): FlashCard[] {
  return BEHAVIORAL_FOCUS_AREAS.flatMap((area) =>
    area.questions.map((q) => ({
      question: q.question,
      probes: q.probes,
      areaTitle: area.title.replace(/Focus Area \d+: /, ""),
      areaBg: area.bgColor,
      areaBorder: area.borderColor,
      areaTitleColor: area.titleColor,
      areaIconColor: area.iconColor,
      ic6Answer: IC6_IC7_ANSWERS[q.question]?.ic6 ?? "",
      ic7Answer: IC6_IC7_ANSWERS[q.question]?.ic7 ?? "",
    }))
  );
}

const FULL_DECK = buildDeck();

export default function BehavioralFlashcardDeck() {
  const [active, setActive] = useState(false);
  const [deck, setDeck] = useState<FlashCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");
  const [showIC6IC7, setShowIC6IC7] = useState(false);
  const [direction, setDirection] = useState(1);
  const [filterArea, setFilterArea] = useState<string>("all");

  const filteredDeck = useMemo(() => {
    if (filterArea === "all") return FULL_DECK;
    return FULL_DECK.filter((c) => c.areaTitle.toLowerCase().includes(filterArea.toLowerCase()));
  }, [filterArea]);

  const startDeck = useCallback((shuffle = false) => {
    let d = [...filteredDeck];
    if (shuffle) d = d.sort(() => Math.random() - 0.5);
    setDeck(d);
    setIdx(0);
    setFlipped(false);
    setAnswer("");
    setShowIC6IC7(false);
    setActive(true);
  }, [filteredDeck]);

  const goTo = useCallback((newIdx: number) => {
    setDirection(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
    setFlipped(false);
    setAnswer("");
    setShowIC6IC7(false);
  }, [idx]);

  const card = deck[idx];
  const wordCount = getWordCount(answer);
  const wcInfo = getWordCountColor(wordCount);
  const wcPct = Math.min(100, (wordCount / 300) * 100);

  const areaOptions = [
    { value: "all", label: "All Areas" },
    { value: "XFN", label: "XFN Collaboration" },
    { value: "Conflict", label: "Conflict Resolution" },
    { value: "Problem", label: "Problem Solving" },
    { value: "Communication", label: "Communication" },
  ];

  if (!active) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Flashcard Flip Deck</h3>
            <p className="text-sm text-gray-500">One question at a time — type your answer, then flip to see probes and IC6/IC7 examples</p>
          </div>
        </div>

        {/* Area filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {areaOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterArea(opt.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filterArea === opt.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => startDeck(false)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <BookOpen size={14} /> Start in Order
            <span className="text-[11px] font-normal bg-white/20 px-2 py-0.5 rounded-full">{filteredDeck.length} cards</span>
          </button>
          <button
            onClick={() => startDeck(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Shuffle size={14} /> Shuffle Deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / deck.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{idx + 1} / {deck.length}</span>
        <button
          onClick={() => { setActive(false); setAnswer(""); }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          Exit
        </button>
      </div>

      <AnimatePresence mode="wait">
        {card && (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border-2 overflow-hidden shadow-md"
            style={{ borderColor: card.areaBorder }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ background: card.areaBg }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: card.areaIconColor }}>
                {card.areaTitle}
              </span>
              <span className="text-xs text-gray-400">Card {idx + 1} of {deck.length}</span>
            </div>

            {/* Question */}
            <div className="bg-white px-5 pt-5 pb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Question</p>
              <p className="text-lg font-bold text-gray-900 leading-snug mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {card.question}
              </p>

              {/* Answer textarea with word counter */}
              {!flipped && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Your Answer (type it out)</label>
                    <span className={`text-xs font-bold ${wcInfo.color}`}>
                      {wordCount} words — {wcInfo.label}
                    </span>
                  </div>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your STAR answer here... Aim for 150–300 words."
                    rows={6}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none leading-relaxed"
                  />
                  {/* Word count progress bar */}
                  <div className="space-y-1">
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${getWordCountBg(wordCount)}`}
                        style={{ width: `${wcPct}%` }}
                      />
                      {/* Target zone markers */}
                      <div className="absolute top-0 h-full" style={{ left: "50%", width: "1px", background: "rgba(0,0,0,0.15)" }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>0</span>
                      <span className="text-emerald-600 font-semibold">150–300 words ideal</span>
                      <span>300+</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Flip button */}
              {!flipped ? (
                <button
                  onClick={() => setFlipped(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Eye size={14} /> Flip — See Probes &amp; Model Answer
                </button>
              ) : (
                <button
                  onClick={() => setFlipped(false)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
                >
                  <EyeOff size={14} /> Hide Answer
                </button>
              )}

              {/* Flipped content */}
              <AnimatePresence>
                {flipped && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      {/* Follow-up probes */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Follow-up Probes</p>
                        <ul className="space-y-1.5">
                          {card.probes.map((probe, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <ChevronRight size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                              {probe}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* IC6 vs IC7 toggle */}
                      {(card.ic6Answer || card.ic7Answer) && (
                        <div>
                          <button
                            onClick={() => setShowIC6IC7((v) => !v)}
                            className="flex items-center gap-2 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors mb-2"
                          >
                            <ChevronRight size={12} className={`transition-transform ${showIC6IC7 ? "rotate-90" : ""}`} />
                            {showIC6IC7 ? "Hide" : "Show"} IC6 vs IC7 Sample Answers
                          </button>
                          <AnimatePresence>
                            {showIC6IC7 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                                      <span className="text-xs font-bold text-blue-800">IC6 — Senior Engineer Level</span>
                                    </div>
                                    <p className="text-xs text-blue-900 leading-relaxed">{card.ic6Answer || "Team-scoped impact, strong individual execution, clear ownership of one system or feature."}</p>
                                  </div>
                                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                                      <span className="text-xs font-bold text-purple-800">IC7 — Staff Engineer Level</span>
                                    </div>
                                    <p className="text-xs text-purple-900 leading-relaxed">{card.ic7Answer || "Org-wide impact, cross-team alignment, business-level framing, creates leverage for others."}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer navigation */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => goTo(idx - 1)}
                disabled={idx === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => { setAnswer(""); setFlipped(false); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear answer and reset card"
              >
                <RotateCcw size={11} /> Reset
              </button>
              {idx < deck.length - 1 ? (
                <button
                  onClick={() => goTo(idx + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => { setActive(false); setAnswer(""); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Finish Deck ✓
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
