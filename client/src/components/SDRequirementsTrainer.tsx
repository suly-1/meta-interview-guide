// SDRequirementsTrainer — Requirements Clarification Trainer
// Drills the #1 highest-weight signal in Meta System Design (~30% of score)
// Candidate writes clarifying questions for a given problem; LLM scores on 4 dimensions
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Play, RotateCcw, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  AlertTriangle, Lightbulb, Target, Zap, BookOpen, Clock,
} from "lucide-react";

interface TrainerProblem {
  id: string;
  title: string;
  tagline: string;
  difficulty: "Medium" | "Hard" | "Very Hard";
  context: string;
  goldStandardQuestions: string[];
  commonMistakes: string[];
}

const TRAINER_PROBLEMS: TrainerProblem[] = [
  {
    id: "news-feed",
    title: "Design a News Feed",
    tagline: "Fan-out on write vs. fan-out on read",
    difficulty: "Hard",
    context: "The interviewer says: 'Design a news feed system like Facebook's.' Nothing else. You have 45 minutes.",
    goldStandardQuestions: [
      "What is the expected DAU and how many posts per day?",
      "Should the feed be ranked (algorithmic) or chronological?",
      "What types of content need to be supported — text only, or also images and video?",
      "What is the acceptable feed load latency — 200ms? 500ms?",
      "Do we need to support celebrities with millions of followers, or is this a friend-graph-only feed?",
      "What consistency model is acceptable — can users see slightly stale feeds?",
      "Do we need to support pagination or infinite scroll?",
      "Are there any existing systems at Meta we should integrate with (TAO, Memcache)?",
    ],
    commonMistakes: [
      "Asking about the tech stack instead of the problem constraints",
      "Not asking about follower distribution (celebrities vs. regular users changes the entire architecture)",
      "Not asking about consistency requirements (eventual vs. strong changes caching strategy)",
      "Skipping scale questions and assuming a small system",
    ],
  },
  {
    id: "messaging",
    title: "Design a Messaging System",
    tagline: "Real-time delivery, ordering, and at-least-once guarantees",
    difficulty: "Very Hard",
    context: "The interviewer says: 'Design a messaging system like Messenger.' You have 45 minutes.",
    goldStandardQuestions: [
      "Is this 1:1 messaging only, or do we need group chats? If groups, what's the max group size?",
      "What is the expected DAU and messages per day?",
      "Do we need real-time delivery, or is a few seconds of delay acceptable?",
      "What delivery guarantees are required — at-least-once, exactly-once?",
      "Do we need message ordering within a conversation?",
      "Do we need read receipts and online presence indicators?",
      "What is the message retention policy — forever, or do messages expire?",
      "Do we need to support media (images, video) or text only?",
      "Do we need push notifications for offline users?",
    ],
    commonMistakes: [
      "Not asking about group chat size (changes fan-out strategy dramatically)",
      "Not asking about delivery guarantees (at-least-once vs. exactly-once are very different systems)",
      "Not asking about message ordering (Lamport clocks vs. server-assigned sequence numbers)",
      "Assuming real-time without confirming latency SLO",
    ],
  },
  {
    id: "typeahead",
    title: "Design Search Autocomplete",
    tagline: "Trie vs. inverted index, prefix matching at scale",
    difficulty: "Medium",
    context: "The interviewer says: 'Design the search autocomplete for Facebook's search bar.' You have 45 minutes.",
    goldStandardQuestions: [
      "How many queries per day and what's the peak QPS?",
      "What is the acceptable latency for suggestions — 100ms? 50ms?",
      "Should suggestions be personalized (based on user history, friends) or global?",
      "Do we need to support typo tolerance / fuzzy matching?",
      "How frequently do trending queries change — hourly, daily?",
      "Do we need to support multiple languages?",
      "What is the scope — just queries, or also people, pages, and groups?",
      "Should we return the top 5 or top 10 suggestions?",
    ],
    commonMistakes: [
      "Not asking about personalization (changes the entire caching strategy)",
      "Not asking about typo tolerance (Levenshtein distance is expensive at scale)",
      "Not asking about update frequency for trending queries",
      "Confusing 'autocomplete' (prefix match) with 'search results' (full-text ranking)",
    ],
  },
  {
    id: "rate-limiter",
    title: "Design a Distributed Rate Limiter",
    tagline: "Token bucket vs. sliding window log at distributed scale",
    difficulty: "Medium",
    context: "The interviewer says: 'Design a rate limiter for Meta's API gateway.' You have 45 minutes.",
    goldStandardQuestions: [
      "What is the expected RPS we need to handle?",
      "What are the rate limit keys — per user, per IP, per API key, or all three?",
      "What time windows do we need — per second, per minute, per day?",
      "What is the acceptable latency overhead — 5ms? 10ms?",
      "Is some over-counting acceptable, or do we need exact enforcement?",
      "Do rate limit rules need to be updated without a service restart?",
      "What should happen when the rate limiter itself is down — fail open or fail closed?",
      "Do we need to return Retry-After headers?",
    ],
    commonMistakes: [
      "Not asking about acceptable error rate (determines algorithm choice: exact vs. approximate)",
      "Not asking about what happens when the limiter is down (fail-open vs. fail-closed is a critical decision)",
      "Not asking about rule update latency (live updates require pub/sub, not just config files)",
      "Assuming a single rate limit key without asking",
    ],
  },
  {
    id: "notification",
    title: "Design a Notification Service",
    tagline: "Multi-channel delivery, deduplication, and user preferences",
    difficulty: "Medium",
    context: "The interviewer says: 'Design Meta's notification system.' You have 45 minutes.",
    goldStandardQuestions: [
      "How many notifications per day and what's the peak send rate?",
      "What channels need to be supported — push (iOS/Android), email, in-app, SMS?",
      "What delivery guarantees are required — at-least-once?",
      "Do users need to be able to opt out per notification type?",
      "What is the acceptable delivery latency for real-time events?",
      "Do we need to handle deduplication (prevent duplicate notifications)?",
      "Do we need notification history for the user to review?",
      "What happens if a push provider (APNs/FCM) is temporarily down?",
    ],
    commonMistakes: [
      "Not asking about which channels to support (each has very different reliability characteristics)",
      "Not asking about deduplication requirements (idempotency key design changes significantly)",
      "Not asking about user preference management (opt-out per type is a separate system)",
      "Assuming synchronous delivery without asking about latency SLO",
    ],
  },
  {
    id: "analytics",
    title: "Design a Real-Time Analytics Dashboard",
    tagline: "Lambda vs. Kappa architecture, approximate counting",
    difficulty: "Hard",
    context: "The interviewer says: 'Design a real-time analytics dashboard for Meta Ads.' You have 45 minutes.",
    goldStandardQuestions: [
      "What events need to be tracked — clicks, impressions, conversions?",
      "How many events per day and what's the peak ingestion rate?",
      "What is the acceptable query latency for the dashboard — 1s? 5s?",
      "Do we need real-time data (seconds) or near-real-time (minutes)?",
      "What time granularities are needed — per minute, per hour, per day?",
      "Do we need drill-down by dimensions (country, device, campaign)?",
      "Is approximate counting acceptable (HyperLogLog for DAU) or do we need exact counts?",
      "Do we need alerting when metrics cross thresholds?",
    ],
    commonMistakes: [
      "Not asking about approximate vs. exact counting (HyperLogLog is fine for DAU but not for billing)",
      "Not asking about query latency SLO (determines Lambda vs. Kappa vs. pre-aggregation strategy)",
      "Not asking about drill-down dimensions (changes the data model significantly)",
      "Conflating real-time (seconds) with near-real-time (minutes)",
    ],
  },
];

const IC_LEVEL_COLORS: Record<string, string> = {
  L4: "bg-gray-100 text-gray-700 border-gray-200",
  L5: "bg-blue-100 text-blue-700 border-blue-200",
  L6: "bg-indigo-100 text-indigo-700 border-indigo-200",
  L7: "bg-violet-100 text-violet-700 border-violet-200",
};

function ScoreDimension({
  label, score, feedback, open, onToggle,
}: {
  label: string; score: number; feedback: string; open: boolean; onToggle: () => void;
}) {
  const pct = Math.round((score / 5) * 100);
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 4 ? "text-emerald-600" : score >= 3 ? "text-blue-600" : score >= 2 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-1">
      <button onClick={onToggle} className="w-full flex items-center gap-3 group">
        <span className="text-xs font-semibold text-foreground w-44 text-left shrink-0">{label}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-bold w-8 text-right ${textColor}`}>{score}/5</span>
        {open ? <ChevronUp size={12} className="text-muted-foreground shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground shrink-0" />}
      </button>
      {open && feedback && (
        <div className="ml-44 text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-2.5 border border-border">
          {feedback}
        </div>
      )}
    </div>
  );
}

export default function SDRequirementsTrainer() {
  const [selectedProblem, setSelectedProblem] = useState<TrainerProblem>(TRAINER_PROBLEMS[0]);
  const [targetLevel, setTargetLevel] = useState<"L6" | "L7">("L6");
  const [phase, setPhase] = useState<"setup" | "writing" | "result">("setup");
  const [candidateQuestions, setCandidateQuestions] = useState("");
  const [openDims, setOpenDims] = useState<Record<string, boolean>>({});
  const [showGoldStandard, setShowGoldStandard] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);

  const scoreMutation = trpc.requirementsTrainer.score.useMutation();

  const handleSubmit = async () => {
    if (candidateQuestions.trim().length < 10) return;
    setPhase("result");
    await scoreMutation.mutateAsync({
      problemTitle: selectedProblem.title,
      problemTagline: selectedProblem.tagline,
      candidateQuestions,
      targetLevel,
    });
  };

  const handleReset = () => {
    setPhase("setup");
    setCandidateQuestions("");
    setOpenDims({});
    setShowGoldStandard(false);
    setShowMistakes(false);
    scoreMutation.reset();
  };

  const result = scoreMutation.data;

  if (phase === "setup") {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={15} className="text-emerald-700" />
            <span className="text-sm font-extrabold text-emerald-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Requirements Clarification Trainer
            </span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Requirements clarification accounts for <strong>~30% of your system design score</strong> — the single highest-weight signal. This trainer gives you a problem prompt and asks you to write all the clarifying questions you would ask before drawing a single box. An LLM panel then scores your questions on 4 dimensions and identifies your biggest gap.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
              <Clock size={10} /> Recommended: 5–8 minutes of writing
            </div>
          </div>
        </div>

        {/* Level */}
        <div>
          <p className="text-xs font-bold text-foreground mb-2">Target Level</p>
          <div className="flex gap-2">
            {(["L6", "L7"] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setTargetLevel(lvl)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  targetLevel === lvl
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-card text-muted-foreground border-border hover:border-emerald-400"
                }`}
              >
                {lvl === "L6" ? "L6 — Staff Engineer" : "L7 — Principal/Senior Staff"}
              </button>
            ))}
          </div>
        </div>

        {/* Problem selection */}
        <div>
          <p className="text-xs font-bold text-foreground mb-2">Choose a Problem</p>
          <div className="grid grid-cols-1 gap-2">
            {TRAINER_PROBLEMS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProblem(p)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  selectedProblem.id === p.id
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-border bg-card hover:border-emerald-300"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{p.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{p.tagline}</div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                  p.difficulty === "Very Hard" ? "bg-red-50 text-red-700 border-red-200" :
                  p.difficulty === "Hard" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {p.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setPhase("writing")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
        >
          <Play size={14} /> Start Requirements Drill
        </button>
      </div>
    );
  }

  if (phase === "writing") {
    const wordCount = candidateQuestions.trim().split(/\s+/).filter(Boolean).length;
    return (
      <div className="space-y-4">
        {/* Problem prompt */}
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Interview Prompt</p>
          <p className="text-sm font-semibold text-white leading-relaxed">{selectedProblem.context}</p>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-800 leading-relaxed">
            <strong>Your task:</strong> Write every clarifying question you would ask before drawing any architecture. Aim for 6–10 questions. Cover functional requirements, scale, non-functional requirements, and constraints. Do NOT start designing yet.
          </p>
        </div>

        {/* Writing area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-foreground">Your Clarifying Questions</p>
            <span className={`text-[10px] font-semibold ${wordCount >= 50 ? "text-emerald-600" : wordCount >= 20 ? "text-amber-600" : "text-gray-400"}`}>
              {wordCount} words
            </span>
          </div>
          <textarea
            value={candidateQuestions}
            onChange={e => setCandidateQuestions(e.target.value)}
            placeholder="1. What is the expected DAU and how many posts per day?&#10;2. Should the feed be ranked or chronological?&#10;3. ..."
            className="w-full h-56 px-3 py-2.5 text-xs border border-border rounded-xl bg-card text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono leading-relaxed"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:border-gray-400 transition-colors"
          >
            <RotateCcw size={12} /> Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={candidateQuestions.trim().length < 10}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            <Zap size={14} /> Score My Questions
          </button>
        </div>
      </div>
    );
  }

  // Result phase
  return (
    <div className="space-y-4">
      {/* Problem reminder */}
      <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Problem</p>
        <p className="text-xs font-semibold text-white">{selectedProblem.title}</p>
      </div>

      {/* Loading */}
      {scoreMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={24} className="text-emerald-600 animate-spin" />
          <p className="text-xs text-muted-foreground">Evaluating your requirements clarification…</p>
        </div>
      )}

      {/* Error */}
      {scoreMutation.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          Failed to score. Please try again.
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* IC Level verdict */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold">Requirements Clarification Level</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {result.overallCoaching.split(".")[0]}.
              </p>
            </div>
            <span className={`text-xl font-black px-3 py-1 rounded-xl border ${IC_LEVEL_COLORS[result.icLevelVerdict] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {result.icLevelVerdict}
            </span>
          </div>

          {/* Score dimensions */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Score Breakdown</p>
            {[
              { key: "fc", label: "Functional Coverage", score: result.functionalCoverageScore, feedback: result.functionalCoverageFeedback },
              { key: "nfr", label: "Scale & NFR Probing", score: result.scaleNFRScore, feedback: result.scaleNFRFeedback },
              { key: "cd", label: "Constraint Discovery", score: result.constraintDiscoveryScore, feedback: result.constraintDiscoveryFeedback },
              { key: "sn", label: "Scope Narrowing", score: result.scopeNarrowingScore, feedback: result.scopeNarrowingFeedback },
            ].map(d => (
              <ScoreDimension
                key={d.key}
                label={d.label}
                score={d.score}
                feedback={d.feedback}
                open={!!openDims[d.key]}
                onToggle={() => setOpenDims(prev => ({ ...prev, [d.key]: !prev[d.key] }))}
              />
            ))}
          </div>

          {/* Biggest missed question */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Biggest Missed Question</p>
                <p className="text-xs text-red-800 font-semibold">{result.biggestMissedQuestion}</p>
              </div>
            </div>
          </div>

          {/* Ordering feedback */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Question Ordering</p>
                <p className="text-xs text-blue-800">{result.orderingFeedback}</p>
              </div>
            </div>
          </div>

          {/* Overall coaching */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Overall Coaching</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{result.overallCoaching}</p>
              </div>
            </div>
          </div>

          {/* Gold standard questions */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setShowGoldStandard(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={12} className="text-indigo-500" />
                Gold Standard Questions ({selectedProblem.goldStandardQuestions.length})
              </div>
              {showGoldStandard ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showGoldStandard && (
              <div className="px-4 pb-4 space-y-1.5 border-t border-gray-100">
                {selectedProblem.goldStandardQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-700 pt-1.5">
                    <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span>
                    {q}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Common mistakes */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <button
              onClick={() => setShowMistakes(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-600" />
                Common Mistakes on This Problem
              </div>
              {showMistakes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showMistakes && (
              <div className="px-4 pb-4 space-y-1.5 border-t border-amber-100">
                {selectedProblem.commonMistakes.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-800 pt-1.5">
                    <AlertTriangle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors"
          >
            <RotateCcw size={12} /> Try Another Problem
          </button>
        </div>
      )}
    </div>
  );
}
