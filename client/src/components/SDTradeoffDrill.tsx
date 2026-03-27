// SDTradeoffDrill — Trade-off Articulation Drill
// Drills the #2 highest-weight signal in Meta System Design (~25-30% of score)
// Presents binary architecture decisions; candidate justifies their choice; LLM scores on 4 dimensions
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft, ChevronRight, RotateCcw, Loader2, CheckCircle2,
  AlertTriangle, Lightbulb, Zap, BarChart2, ChevronDown, ChevronUp,
  Trophy, Circle,
} from "lucide-react";

interface TradeoffDecision {
  id: string;
  category: string;
  decision: string;
  optionA: string;
  optionB: string;
  context: string;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  hint: string;
  modelAnswer: string;
}

const TRADEOFF_DECISIONS: TradeoffDecision[] = [
  {
    id: "fan-out-write-vs-read",
    category: "Feed Systems",
    decision: "News feed delivery strategy",
    optionA: "Fan-out on write (pre-compute feed on post creation)",
    optionB: "Fan-out on read (compute feed at query time)",
    context: "Designing a news feed for 500M DAU. ~80% of users have <1,000 followers; ~0.1% are celebrities with >1M followers.",
    difficulty: "Intermediate",
    hint: "Think about write amplification vs. read latency. What does the follower distribution tell you?",
    modelAnswer: "A hybrid approach: fan-out on write for regular users (fast reads, manageable write amplification), fan-out on read for celebrities (avoids 1M+ writes per post). The 80/0.1% split makes this the right call — most users benefit from pre-computed feeds, and the celebrity edge case is handled separately.",
  },
  {
    id: "sql-vs-nosql",
    category: "Data Storage",
    decision: "Primary data store for a social graph",
    optionA: "Relational database (MySQL/PostgreSQL)",
    optionB: "Graph database or wide-column store (Cassandra/TAO)",
    context: "Storing 2B users, each with ~200 friends on average. Read-heavy (10:1 read/write ratio). Need to traverse 2-hop friend graphs for feed ranking.",
    difficulty: "Foundational",
    hint: "Consider the access patterns: point lookups vs. graph traversals. What does Meta actually use?",
    modelAnswer: "Wide-column store (Cassandra) or a purpose-built graph store (like Meta's TAO). SQL joins across billions of rows for graph traversal are prohibitively expensive. TAO is optimized for object-association queries. Cassandra handles the write throughput and horizontal scaling. SQL would work at small scale but fails at Meta's scale due to join cost.",
  },
  {
    id: "strong-vs-eventual",
    category: "Consistency",
    decision: "Consistency model for a messaging system",
    optionA: "Strong consistency (linearizability)",
    optionB: "Eventual consistency",
    context: "Designing Messenger. 1B DAU, 100B messages/day. Users expect messages to arrive in order within a conversation.",
    difficulty: "Intermediate",
    hint: "What does 'consistency' mean for a messaging system? Is global ordering needed, or per-conversation ordering?",
    modelAnswer: "Eventual consistency with per-thread ordering guarantees. Global strong consistency at 100B messages/day is prohibitively expensive. What users actually need is ordering within a conversation (thread-level sequence numbers solve this). Cross-conversation ordering doesn't matter. Eventual consistency with thread-scoped sequence numbers gives the right user experience at a fraction of the cost.",
  },
  {
    id: "push-vs-pull",
    category: "Real-time Systems",
    decision: "Real-time update delivery to clients",
    optionA: "Push (server pushes updates to connected clients via WebSocket/SSE)",
    optionB: "Pull (clients poll the server at regular intervals)",
    context: "Designing a real-time notification system. 500M DAU, average 10 notifications/day per user. Users expect notifications within 5 seconds.",
    difficulty: "Foundational",
    hint: "Think about connection overhead vs. latency. What happens when a user is offline?",
    modelAnswer: "Push via WebSocket for online users, with a fallback to push notifications (APNs/FCM) for offline users. Polling at 500M DAU would generate 500M × (1 poll/5s) = 100M RPS just for polling — unsustainable. WebSocket connections are persistent but manageable. The key insight is handling the online/offline transition gracefully.",
  },
  {
    id: "cache-aside-vs-write-through",
    category: "Caching",
    decision: "Cache update strategy",
    optionA: "Cache-aside (application reads from cache, falls back to DB on miss, writes to DB then invalidates cache)",
    optionB: "Write-through (application writes to cache and DB simultaneously)",
    context: "Caching user profile data. Reads are 100x more frequent than writes. Profile updates happen ~once per week per user.",
    difficulty: "Intermediate",
    hint: "Consider read-to-write ratio and cache consistency requirements. What's the cost of stale data?",
    modelAnswer: "Cache-aside (lazy loading). Write-through would pre-populate the cache with data that may never be read (most users don't update profiles often). Cache-aside only caches data that's actually requested. With a 100:1 read/write ratio and weekly updates, cache-aside with TTL-based expiry gives high hit rates without the write overhead. Write-through is better for write-heavy, read-heavy workloads where you can't afford cache misses.",
  },
  {
    id: "sync-vs-async",
    category: "Architecture",
    decision: "Processing model for image uploads",
    optionA: "Synchronous processing (resize, compress, and CDN-distribute before returning response)",
    optionB: "Asynchronous processing (return immediately, process in background via queue)",
    context: "Instagram-like photo upload. Users upload ~10M photos/day. Resizing to 5 sizes takes ~2-3 seconds per photo.",
    difficulty: "Foundational",
    hint: "Think about user experience vs. system complexity. What's the acceptable latency for the upload response?",
    modelAnswer: "Asynchronous processing. Making 10M users wait 2-3 seconds for their upload to complete is a terrible UX. Return a 202 Accepted immediately, enqueue the processing job, and notify the user when processing is complete. This also allows horizontal scaling of the processing workers independently of the upload service. The tradeoff is eventual consistency — the photo may not appear immediately — but this is acceptable for social media.",
  },
  {
    id: "monolith-vs-microservices",
    category: "Architecture",
    decision: "Service architecture for a new product",
    optionA: "Monolithic architecture (single deployable unit)",
    optionB: "Microservices architecture (independent services per domain)",
    context: "Building a new internal tool for Meta's ads team. ~50 engineers, 6-month timeline, expected to serve 10K internal users.",
    difficulty: "Advanced",
    hint: "Context matters enormously here. What's the team size, timeline, and scale?",
    modelAnswer: "Monolith for this context. Microservices add significant operational overhead (service discovery, distributed tracing, network latency, deployment complexity) that is only justified at large scale or large team size. With 50 engineers, 6 months, and 10K users, a well-structured monolith ships faster, is easier to debug, and can be decomposed later if needed. The L6+ signal is recognizing that microservices are not always the right answer.",
  },
  {
    id: "rate-limit-algorithm",
    category: "Rate Limiting",
    decision: "Rate limiting algorithm",
    optionA: "Token bucket (refill at fixed rate, allows bursts up to bucket capacity)",
    optionB: "Sliding window log (track exact timestamps of all requests in a window)",
    context: "API gateway rate limiter. 1M RPS, 1000 req/min per user limit. Some users have bursty traffic patterns (e.g., batch jobs).",
    difficulty: "Intermediate",
    hint: "Consider memory usage, burst handling, and implementation complexity at 1M RPS.",
    modelAnswer: "Token bucket. Sliding window log is precise but stores every request timestamp — at 1M RPS with 1000 req/min limits, that's potentially 1000 timestamps per user in memory, which is expensive at scale. Token bucket uses O(1) memory per user (just token count and last refill time), handles bursts naturally (which is desirable for batch jobs), and can be implemented atomically in Redis with a Lua script. The tradeoff is slightly less precise enforcement, which is acceptable for most use cases.",
  },
  {
    id: "sql-sharding-strategy",
    category: "Database Scaling",
    decision: "Sharding strategy for a messages table",
    optionA: "Shard by user_id (all messages for a user on the same shard)",
    optionB: "Shard by thread_id (all messages in a conversation on the same shard)",
    context: "Messaging system. 100B messages/day. Most queries are 'get messages in thread X' or 'get all threads for user Y'.",
    difficulty: "Advanced",
    hint: "Consider the two main access patterns. Which one is more frequent and more latency-sensitive?",
    modelAnswer: "Shard by thread_id. The most latency-sensitive query is 'get messages in thread X' — this needs to be a single-shard scan. Sharding by user_id would scatter a thread's messages across shards if participants are on different shards, requiring expensive cross-shard joins. The 'get all threads for user Y' query can be served by a separate inbox table (sharded by user_id) that stores thread metadata, avoiding the need to scan all messages.",
  },
  {
    id: "cdn-push-vs-pull",
    category: "CDN",
    decision: "CDN content population strategy",
    optionA: "Push CDN (proactively push content to edge nodes on upload)",
    optionB: "Pull CDN (edge nodes fetch from origin on first request, cache thereafter)",
    context: "Serving user-generated images for a social network. 10M new images/day. Long-tail distribution: top 1% of images get 90% of traffic.",
    difficulty: "Intermediate",
    hint: "Think about the long-tail distribution. What happens to the 99% of images that are rarely accessed?",
    modelAnswer: "Pull CDN. With a long-tail distribution, push CDN would pre-populate edge nodes with 10M images/day, most of which will never be requested from that edge. Pull CDN only caches what's actually requested, achieving high cache hit rates for popular content while not wasting storage on unpopular content. The tradeoff is a cache miss on first access (origin fetch), which is acceptable for social media images.",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Feed Systems": "bg-blue-100 text-blue-700 border-blue-200",
  "Data Storage": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Consistency": "bg-violet-100 text-violet-700 border-violet-200",
  "Real-time Systems": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Caching": "bg-amber-100 text-amber-900 border-amber-200",
  "Architecture": "bg-orange-100 text-orange-900 border-orange-200",
  "Rate Limiting": "bg-rose-100 text-rose-700 border-rose-200",
  "Database Scaling": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "CDN": "bg-teal-100 text-teal-700 border-teal-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Foundational: "bg-gray-100 text-gray-600 border-gray-200",
  Intermediate: "bg-amber-100 text-amber-900 border-amber-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
};

function ScoreDimension({
  label, score, feedback, open, onToggle,
}: {
  label: string; score: number; feedback: string; open: boolean; onToggle: () => void;
}) {
  const pct = Math.round((score / 5) * 100);
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 4 ? "text-emerald-600" : score >= 3 ? "text-blue-600" : score >= 2 ? "text-amber-800" : "text-red-600";
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

export default function SDTradeoffDrill() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetLevel, setTargetLevel] = useState<"L6" | "L7">("L6");
  const [selectedChoice, setSelectedChoice] = useState<"A" | "B" | null>(null);
  const [justification, setJustification] = useState("");
  const [phase, setPhase] = useState<"drill" | "result">("drill");
  const [openDims, setOpenDims] = useState<Record<string, boolean>>({});
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionResults, setSessionResults] = useState<Array<{ id: string; passed: boolean; avgScore: number }>>([]);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const scoreMutation = trpc.tradeoffDrill.score.useMutation();

  const categories = ["All", ...Array.from(new Set(TRADEOFF_DECISIONS.map(d => d.category))).sort()];
  const filteredDecisions = filterCategory === "All"
    ? TRADEOFF_DECISIONS
    : TRADEOFF_DECISIONS.filter(d => d.category === filterCategory);

  const current = filteredDecisions[currentIndex] ?? TRADEOFF_DECISIONS[0];

  const handleSubmit = async () => {
    if (!selectedChoice || justification.trim().length < 10) return;
    setPhase("result");
    const result = await scoreMutation.mutateAsync({
      decision: current.decision,
      optionA: current.optionA,
      optionB: current.optionB,
      candidateChoice: selectedChoice,
      candidateJustification: justification,
      context: current.context,
      targetLevel,
    });
    if (result) {
      const avgScore = Math.round(
        (result.correctnessScore + result.depthScore + result.counterArgScore + result.metaScaleScore) / 4 * 10
      ) / 10;
      setSessionResults(prev => [...prev, { id: current.id, passed: result.passesBar, avgScore }]);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % filteredDecisions.length;
    setCurrentIndex(nextIndex);
    setSelectedChoice(null);
    setJustification("");
    setPhase("drill");
    setOpenDims({});
    setShowModelAnswer(false);
    setShowHint(false);
    scoreMutation.reset();
  };

  const result = scoreMutation.data;
  const passedCount = sessionResults.filter(r => r.passed).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={15} className="text-violet-700" />
          <span className="text-sm font-extrabold text-violet-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Trade-off Articulation Drill
          </span>
          {sessionResults.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
              <Trophy size={10} /> {passedCount}/{sessionResults.length} passed
            </span>
          )}
        </div>
        <p className="text-xs text-violet-800 leading-relaxed">
          Trade-off articulation accounts for <strong>~25–30% of your system design score</strong>. This drill presents binary architecture decisions. Choose an option and justify it — the LLM scores your reasoning on correctness, depth, counter-argument awareness, and Meta-scale calibration.
        </p>
      </div>

      {/* Level + Category filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1.5">
          {(["L6", "L7"] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setTargetLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                targetLevel === lvl
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-card text-muted-foreground border-border hover:border-violet-400"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setFilterCategory(cat); setCurrentIndex(0); setPhase("drill"); setSelectedChoice(null); setJustification(""); scoreMutation.reset(); }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                filterCategory === cat
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setPhase("drill"); setSelectedChoice(null); setJustification(""); scoreMutation.reset(); setShowHint(false); setShowModelAnswer(false); }}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:border-gray-400 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        <span className="text-xs text-muted-foreground font-semibold">
          {currentIndex + 1} / {filteredDecisions.length}
        </span>
        <button
          onClick={() => { setCurrentIndex(i => Math.min(filteredDecisions.length - 1, i + 1)); setPhase("drill"); setSelectedChoice(null); setJustification(""); scoreMutation.reset(); setShowHint(false); setShowModelAnswer(false); }}
          disabled={currentIndex === filteredDecisions.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:border-gray-400 disabled:opacity-30 transition-colors"
        >
          Next <ChevronRight size={12} />
        </button>
      </div>

      {/* Decision card */}
      <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[current.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {current.category}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFFICULTY_COLORS[current.difficulty]}`}>
            {current.difficulty}
          </span>
        </div>
        <p className="text-sm font-bold text-white">{current.decision}</p>
        <div className="rounded-lg bg-gray-800 p-2.5">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1">Context</p>
          <p className="text-xs text-gray-700 leading-relaxed">{current.context}</p>
        </div>
      </div>

      {phase === "drill" && (
        <div className="space-y-3">
          {/* Option selection */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">Choose your approach:</p>
            {(["A", "B"] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setSelectedChoice(opt)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-xs transition-all ${
                  selectedChoice === opt
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                    : "border-border bg-card hover:border-violet-300"
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center font-black text-[10px] ${
                  selectedChoice === opt ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300 text-gray-600"
                }`}>
                  {opt}
                </span>
                <span className="text-foreground leading-relaxed">{opt === "A" ? current.optionA : current.optionB}</span>
              </button>
            ))}
          </div>

          {/* Hint */}
          {!showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-1.5 text-[10px] text-amber-800 font-semibold hover:text-amber-900 transition-colors"
            >
              <Lightbulb size={11} /> Show hint
            </button>
          )}
          {showHint && (
            <div className="rounded-xl border border-amber-200 bg-amber-100 p-3 flex items-start gap-2">
              <Lightbulb size={12} className="text-amber-800 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{current.hint}</p>
            </div>
          )}

          {/* Justification */}
          {selectedChoice && (
            <div>
              <p className="text-xs font-bold text-foreground mb-1.5">
                Justify your choice — explain the trade-offs:
              </p>
              <textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder={`I chose Option ${selectedChoice} because...\n\nThe key trade-offs are...\n\nThe downside of this choice is..., which is acceptable because...\n\nAt Meta's scale, this matters because...`}
                className="w-full h-40 px-3 py-2.5 text-xs border border-border rounded-xl bg-card text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono leading-relaxed"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Tip: Mention the downside of your choice and when the other option would be better. That's the L6 signal.
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedChoice || justification.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            <Zap size={14} /> Score My Justification
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="space-y-4">
          {/* Loading */}
          {scoreMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 size={24} className="text-violet-600 animate-spin" />
              <p className="text-xs text-muted-foreground">Evaluating your trade-off reasoning…</p>
            </div>
          )}

          {/* Error */}
          {scoreMutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-100 p-4 text-xs text-red-800">
              Failed to score. Please try again.
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Pass/fail verdict */}
              <div className={`rounded-xl border p-4 flex items-center justify-between ${
                result.passesBar
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-100"
              }`}>
                <div className="flex items-center gap-2">
                  {result.passesBar
                    ? <CheckCircle2 size={16} className="text-emerald-600" />
                    : <AlertTriangle size={16} className="text-red-600" />
                  }
                  <div>
                    <p className={`text-sm font-extrabold ${result.passesBar ? "text-emerald-900" : "text-red-900"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {result.passesBar ? `Passes ${targetLevel} Bar` : `Below ${targetLevel} Bar`}
                    </p>
                    <p className={`text-[10px] font-semibold ${result.passesBar ? "text-emerald-700" : "text-red-700"}`}>
                      You chose Option {selectedChoice} — {selectedChoice === "A" ? current.optionA : current.optionB}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Score Breakdown</p>
                {[
                  { key: "c", label: "Correctness", score: result.correctnessScore, feedback: result.correctnessFeedback },
                  { key: "d", label: "Depth of Reasoning", score: result.depthScore, feedback: result.depthFeedback },
                  { key: "ca", label: "Counter-arg Awareness", score: result.counterArgScore, feedback: result.counterArgFeedback },
                  { key: "ms", label: "Meta-Scale Calibration", score: result.metaScaleScore, feedback: result.metaScaleFeedback },
                ].map(dim => (
                  <ScoreDimension
                    key={dim.key}
                    label={dim.label}
                    score={dim.score}
                    feedback={dim.feedback}
                    open={!!openDims[dim.key]}
                    onToggle={() => setOpenDims(prev => ({ ...prev, [dim.key]: !prev[dim.key] }))}
                  />
                ))}
              </div>

              {/* Biggest gap */}
              <div className="rounded-xl border border-red-200 bg-red-100 p-3 flex items-start gap-2">
                <AlertTriangle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">Biggest Gap</p>
                  <p className="text-xs text-red-800">{result.biggestGap}</p>
                </div>
              </div>

              {/* Model answer */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => setShowModelAnswer(s => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Model Answer (Strong {targetLevel} Response)
                  </div>
                  {showModelAnswer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showModelAnswer && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-xs text-gray-700 leading-relaxed pt-3">{result.modelAnswer}</p>
                  </div>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
              >
                Next Decision <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Session summary (if 3+ completed) */}
      {sessionResults.length >= 3 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-bold text-gray-700 mb-2">Session Progress</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full bg-violet-500 transition-all"
                style={{ width: `${(passedCount / sessionResults.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-violet-700">{passedCount}/{sessionResults.length}</span>
          </div>
          <p className="text-[10px] text-gray-700 mt-1">
            {passedCount / sessionResults.length >= 0.8
              ? "Strong trade-off articulation. Focus on the decisions you missed."
              : passedCount / sessionResults.length >= 0.5
              ? "Adequate. Depth of reasoning and counter-argument awareness are the most common gaps."
              : "Focus on explaining WHY, not just WHAT. Every decision needs a trade-off explanation."}
          </p>
        </div>
      )}
    </div>
  );
}
