// SystemDesignMockSession — 45-min timed mock with 5-section answer panels + LLM IC-level debrief
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useXPContext } from "@/contexts/XPContext";
import {
  Clock, Play, Square, ChevronDown, ChevronUp, RotateCcw,
  CheckCircle2, AlertCircle, Loader2, Zap, Trophy, Target,
  Database, Server, Globe, MessageSquare, Search, Bell, BarChart2, Brain,
  Swords, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MockHistoryEntry {
  id: string;
  problemId: string;
  problemTitle: string;
  targetLevel: string;
  verdict: string;
  scores: { requirements: number; dataModel: number; api: number; scale: number; metaDepth: number };
  durationSec: number;
  date: number;
}

const MOCK_HISTORY_KEY = "sd_mock_history_v1";

function loadMockHistory(): MockHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(MOCK_HISTORY_KEY) || "[]"); } catch { return []; }
}

function saveMockHistory(entries: MockHistoryEntry[]) {
  localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(entries.slice(-30)));
}

// ─── Radar chart (SVG, no external dep) ──────────────────────────────────────
function RadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  const N = scores.length;
  const cx = 80; const cy = 80; const r = 60;
  const angleStep = (2 * Math.PI) / N;
  const angle = (i: number) => -Math.PI / 2 + i * angleStep;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });
  const levels = [1, 2, 3, 4, 5];
  const dataPoints = scores.map((s, i) => pt(i, (s.value / 5) * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[180px] mx-auto">
      {levels.map(l => {
        const pts = scores.map((_, i) => pt(i, (l / 5) * r));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
        return <path key={l} d={path} fill="none" stroke="#e5e7eb" strokeWidth={l === 5 ? 1.5 : 0.8} />;
      })}
      {scores.map((_, i) => {
        const outer = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="#e5e7eb" strokeWidth={0.8} />;
      })}
      <path d={dataPath} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth={2} />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} fill="#6366f1" />)}
      {scores.map((s, i) => {
        const lp = pt(i, r + 14);
        return (
          <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
            fontSize={7} fill="#6b7280" fontWeight={600}>
            {s.label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

interface DesignProblem {
  id: string;
  title: string;
  difficulty: "Medium" | "Hard" | "Very Hard";
  tagline: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  hints: {
    requirements: string[];
    dataModel: string[];
    api: string[];
    scale: string[];
    metaTips: string[];
  };
}

type ICLevel = "IC6" | "IC7";
type SessionPhase = "setup" | "active" | "debrief";
type SectionKey = "requirements" | "dataModel" | "api" | "scaleBottlenecks" | "metaTips";

interface SectionAnswers {
  requirements: string;
  dataModel: string;
  api: string;
  scaleBottlenecks: string;
  metaTips: string;
}

// ─── Problem bank (mirrors SystemDesignTab DESIGN_PATTERNS) ──────────────────
const PROBLEMS: DesignProblem[] = [
  {
    id: "news-feed",
    title: "News Feed (Facebook Feed)",
    difficulty: "Hard",
    tagline: "Fan-out on write vs. fan-out on read",
    icon: <Globe size={15} />,
    color: "#1e3a8a", bgColor: "#eff6ff", borderColor: "#bfdbfe",
    hints: {
      requirements: ["500M DAU, 100M posts/day", "Feed load < 200ms p99", "Pagination / infinite scroll", "Near-real-time updates"],
      dataModel: ["User, Post, FeedItem, Follow entities", "Separate post store (Cassandra) from feed store (Redis sorted set)", "Pre-compute feed for users with <10K followers"],
      api: ["GET /feed?user_id&cursor&limit", "POST /posts", "POST /posts/{id}/like"],
      scale: ["Celebrity fan-out: lazy fan-out + pull hybrid", "Feed ranking: pre-rank on write, re-rank on read", "Media: CDN + object store"],
      metaTips: ["Ask fan-out on write vs. read trade-off", "Mention TAO for social graph", "Cursor-based pagination, not offset"],
    },
  },
  {
    id: "messaging",
    title: "Messaging System (Messenger)",
    difficulty: "Very Hard",
    tagline: "Real-time delivery, ordering, and at-least-once guarantees",
    icon: <MessageSquare size={15} />,
    color: "#065f46", bgColor: "#ecfdf5", borderColor: "#a7f3d0",
    hints: {
      requirements: ["1B DAU, 100B messages/day", "Delivery < 100ms p99", "At-least-once, ordered delivery", "Read receipts + presence"],
      dataModel: ["Message, Thread, UserPresence, Inbox entities", "client_msg_id for idempotency", "Thread-level sequence numbers"],
      api: ["WebSocket /ws?user_id", "POST /messages {thread_id, content, client_msg_id}", "GET /threads/{id}/messages?before={seq_no}"],
      scale: ["Connection fan-out: Kafka pub/sub + server routing", "Group messages: async delivery queue", "Offline: APNs/FCM with retry"],
      metaTips: ["Distinguish sent/delivered/read receipts", "MQTT for mobile vs WebSocket for web", "Separate fan-out service from message store"],
    },
  },
  {
    id: "rate-limiter",
    title: "Distributed Rate Limiter",
    difficulty: "Medium",
    tagline: "Token bucket vs. sliding window log at distributed scale",
    icon: <Server size={15} />,
    color: "#92400e", bgColor: "#fffbeb", borderColor: "#fde68a",
    hints: {
      requirements: ["< 5ms overhead per request", "1M RPS", "Multiple rule types", "Admin API for live updates"],
      dataModel: ["RateLimitRule, Counter, TokenBucket entities", "Redis INCR + EXPIRE for atomic counter", "Local cache + async sync to Redis"],
      api: ["checkLimit(user_id, rule_id) → {allowed, remaining, retry_after_ms}", "POST /admin/rules", "GET /admin/rules/{key_type}"],
      scale: ["Redis Cluster for sharding", "Lua scripts for atomicity", "Pub/sub for rule propagation"],
      metaTips: ["Ask acceptable error rate first", "Mention boundary burst problem with fixed windows", "Cell-based vs. global rate limiting"],
    },
  },
  {
    id: "typeahead",
    title: "Search Typeahead / Autocomplete",
    difficulty: "Medium",
    tagline: "Trie vs. inverted index, prefix matching at scale",
    icon: <Search size={15} />,
    color: "#4338ca", bgColor: "#eef2ff", borderColor: "#c7d2fe",
    hints: {
      requirements: ["10B queries/day, 100K QPS peak", "< 100ms p99", "Suggestions update within 1 hour", "Personalized + typo tolerance"],
      dataModel: ["TrieNode, SearchLog, SuggestionScore, UserRecentSearch entities", "In-memory trie per server", "Pre-compute top-K offline (Spark hourly)"],
      api: ["GET /suggest?q={prefix}&user_id&limit", "POST /search/log", "GET /suggest/trending"],
      scale: ["Shard trie by first 2 chars", "Streaming (Flink) for trending with 5-min lag", "Levenshtein too expensive — use n-gram index"],
      metaTips: ["Distinguish suggestions vs. results (different systems)", "Trie classic but inverted index scales better", "Social graph signals as ranking feature"],
    },
  },
  {
    id: "notification",
    title: "Notification Service",
    difficulty: "Medium",
    tagline: "Multi-channel delivery, deduplication, and user preferences",
    icon: <Bell size={15} />,
    color: "#7c3aed", bgColor: "#f5f3ff", borderColor: "#ddd6fe",
    hints: {
      requirements: ["1B notifications/day", "Delivery within 5 seconds", "At-least-once", "Multi-channel: push, email, in-app"],
      dataModel: ["Notification, UserPreference, DeviceToken, NotificationTemplate entities", "Idempotency key for dedup", "Separate queues per channel"],
      api: ["POST /notifications/send", "PUT /users/{id}/preferences", "GET /users/{id}/notifications"],
      scale: ["Kafka per channel for fan-out", "APNs/FCM rate limits — batch sends", "Exponential backoff for retries"],
      metaTips: ["Dedup window: idempotency key + 24h TTL", "Graceful degradation if push provider down", "Mention Meta's Iris notification system"],
    },
  },
  {
    id: "analytics",
    title: "Real-Time Analytics Dashboard",
    difficulty: "Hard",
    tagline: "Lambda vs. Kappa architecture, approximate counting",
    icon: <BarChart2 size={15} />,
    color: "#0f766e", bgColor: "#f0fdfa", borderColor: "#99f6e4",
    hints: {
      requirements: ["Billions of events/day", "Dashboard refresh < 5s", "Historical + real-time views", "Drill-down by dimensions"],
      dataModel: ["Event, AggregatedMetric, Dashboard, Alert entities", "Time-series partitioning", "Pre-aggregate at multiple granularities"],
      api: ["POST /events (batch ingest)", "GET /metrics?start&end&granularity&dimensions", "POST /alerts"],
      scale: ["Kafka for ingest, Flink for stream processing", "HyperLogLog for cardinality (DAU)", "Druid or ClickHouse for OLAP queries"],
      metaTips: ["Lambda: batch + speed layers. Kappa: stream only (simpler)", "Approximate counting acceptable for most metrics", "Mention Scuba (Meta's internal analytics)"],
    },
  },
  {
    id: "cdn",
    title: "Content Delivery Network (CDN)",
    difficulty: "Hard",
    tagline: "Edge caching, cache invalidation, and origin offload",
    icon: <Database size={15} />,
    color: "#b45309", bgColor: "#fefce8", borderColor: "#fde68a",
    hints: {
      requirements: ["Serve static + dynamic content globally", "Cache hit rate > 90%", "< 50ms latency from edge", "Instant cache invalidation"],
      dataModel: ["CacheEntry, OriginServer, EdgeNode, PurgeRequest entities", "TTL + ETag for validation", "Consistent hashing for edge selection"],
      api: ["GET /{path} (edge serves or fetches from origin)", "POST /purge {urls[]}", "GET /analytics/cache-hit-rate"],
      scale: ["Anycast routing to nearest edge", "Push vs. pull caching strategies", "Thundering herd: request coalescing at edge"],
      metaTips: ["Distinguish static (images) vs. dynamic (personalized) content", "Surrogate keys for bulk invalidation", "Mention Meta's CDN (Proxygen + Katran)"],
    },
  },
  {
    id: "ml-feature-store",
    title: "ML Feature Store",
    difficulty: "Very Hard",
    tagline: "Online vs. offline feature serving, training-serving skew",
    icon: <Brain size={15} />,
    color: "#6d28d9", bgColor: "#f5f3ff", borderColor: "#ddd6fe",
    hints: {
      requirements: ["< 10ms online feature serving", "Batch feature computation for training", "Feature versioning + lineage", "Avoid training-serving skew"],
      dataModel: ["Feature, FeatureGroup, FeatureVersion, TrainingDataset entities", "Dual store: Redis (online) + Hive/S3 (offline)", "Point-in-time correct joins for training"],
      api: ["GET /features/{entity_id}?features=[] (online)", "POST /features/batch-compute (offline)", "GET /features/{name}/lineage"],
      scale: ["Redis cluster for online serving", "Spark for offline batch computation", "Kafka for real-time feature updates"],
      metaTips: ["Training-serving skew is the #1 ML reliability issue", "Point-in-time joins prevent data leakage", "Mention Meta's FBLearner Feature Store"],
    },
  },
];

const SECTION_CONFIG: { key: SectionKey; label: string; placeholder: string; hint: keyof DesignProblem["hints"] }[] = [
  {
    key: "requirements",
    label: "1. Requirements",
    placeholder: "Functional requirements (what the system does):\n- ...\n\nNon-functional requirements (scale, latency, availability):\n- ...",
    hint: "requirements",
  },
  {
    key: "dataModel",
    label: "2. Data Model",
    placeholder: "Key entities and their fields:\n- Entity(field1, field2, ...)\n\nKey data model decisions:\n- ...",
    hint: "dataModel",
  },
  {
    key: "api",
    label: "3. API Design",
    placeholder: "Core API endpoints:\n- METHOD /path {request} → {response}\n\nProtocol choices (REST, WebSocket, gRPC):\n- ...",
    hint: "api",
  },
  {
    key: "scaleBottlenecks",
    label: "4. Scale & Bottlenecks",
    placeholder: "Identify bottlenecks and how you'd solve them:\n- Bottleneck: ...\n  Solution: ...\n\nCapacity estimates:\n- ...",
    hint: "scale",
  },
  {
    key: "metaTips",
    label: "5. Meta-Specific Depth",
    placeholder: "Meta-specific considerations:\n- Reference relevant Meta systems (TAO, Memcache, Scuba, etc.)\n- Trade-offs specific to Meta's scale\n- Follow-up topics you'd discuss with the interviewer",
    hint: "metaTips",
  },
];

const VERDICT_COLORS: Record<string, string> = {
  "Strong Hire": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Hire": "bg-blue-100 text-blue-800 border-blue-300",
  "Borderline": "bg-amber-100 text-amber-800 border-amber-300",
  "No Hire": "bg-red-100 text-red-800 border-red-300",
};

function ScoreBar({ score, label, feedback }: { score: number; label: string; feedback: string }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((score / 5) * 100);
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 group"
      >
        <span className="text-xs font-semibold text-foreground w-40 text-left shrink-0">{label}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-bold w-8 text-right ${score >= 4 ? "text-emerald-600" : score >= 3 ? "text-blue-600" : score >= 2 ? "text-amber-600" : "text-red-600"}`}>
          {score}/5
        </span>
        {open ? <ChevronUp size={12} className="text-muted-foreground shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground shrink-0" />}
      </button>
      {open && feedback && (
        <div className="ml-40 text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-2.5 border border-border">
          {feedback}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SystemDesignMockSession() {
  const { addXP } = useXPContext();
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [selectedProblem, setSelectedProblem] = useState<DesignProblem>(PROBLEMS[0]);
  const [targetLevel, setTargetLevel] = useState<ICLevel>("IC6");
  const [secsLeft, setSecsLeft] = useState(45 * 60);
  const [secsElapsed, setSecsElapsed] = useState(0);
  const [answers, setAnswers] = useState<SectionAnswers>({
    requirements: "", dataModel: "", api: "", scaleBottlenecks: "", metaTips: "",
  });
  const [activeSection, setActiveSection] = useState<SectionKey>("requirements");
  const [showHints, setShowHints] = useState<Record<SectionKey, boolean>>({
    requirements: false, dataModel: false, api: false, scaleBottlenecks: false, metaTips: false,
  });
  const [randomMode, setRandomMode] = useState(false);
  const [skepticMode, setSkepticMode] = useState(false);
  const [skepticChallenges, setSkepticChallenges] = useState<{ section: string; challenge: string; dismissed: boolean }[]>([]);
  const [activeSkepticIdx, setActiveSkepticIdx] = useState<number | null>(null);
  const [mockHistory, setMockHistory] = useState<MockHistoryEntry[]>(() => loadMockHistory());
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Skeptic challenges per section — fired when candidate switches section
  const SKEPTIC_CHALLENGES: Record<string, string[]> = {
    requirements: [
      "Why not just build this as a simple monolith first? Justify the distributed complexity.",
      "Your non-functional requirements seem generic. What's the actual SLA Meta's PM would demand?",
      "You haven't quantified the scale. How many requests per second are we actually talking?",
    ],
    dataModel: [
      "Why SQL and not Cassandra? Walk me through the trade-off at 500M DAU.",
      "Your schema looks normalized — at Meta's scale, would you denormalize for read performance?",
      "How do you handle schema migrations without downtime at this scale?",
    ],
    api: [
      "Why REST and not gRPC? What's the latency difference at Meta's internal service mesh?",
      "Your pagination approach — why cursor-based over offset? What breaks with offset at scale?",
      "How would you version this API without breaking existing clients?",
    ],
    scaleBottlenecks: [
      "You identified the bottleneck but not the solution. How specifically would you solve the hot-shard problem?",
      "Your capacity estimate is off by an order of magnitude. Let's redo the math together.",
      "What happens when your cache layer goes down? Walk me through the failure cascade.",
    ],
    metaTips: [
      "You mentioned TAO — but do you know how TAO handles consistency? Explain the read-your-writes guarantee.",
      "Why is this approach better than what Meta actually ships? What would you change about their real implementation?",
      "If the PM says we need to cut scope for V1, what's the first thing you'd drop and why?",
    ],
  };

  const debrief = trpc.systemDesign.debrief.useMutation();
  const followUp = trpc.systemDesign.followUp.useMutation();

  const startSession = useCallback(() => {
    const problem = randomMode
      ? PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)]
      : selectedProblem;
    setSelectedProblem(problem);
    setSecsLeft(45 * 60);
    setSecsElapsed(0);
    setAnswers({ requirements: "", dataModel: "", api: "", scaleBottlenecks: "", metaTips: "" });
    setActiveSection("requirements");
    setShowHints({ requirements: false, dataModel: false, api: false, scaleBottlenecks: false, metaTips: false });
    setSkepticChallenges([]);
    setActiveSkepticIdx(null);
    setPhase("active");
  }, [randomMode, selectedProblem]);

  // Fire a skeptic challenge when switching sections (if skepticMode is on)
  const handleSectionSwitch = useCallback((newSection: SectionKey) => {
    if (skepticMode && answers[activeSection].trim().length > 30) {
      const pool = SKEPTIC_CHALLENGES[newSection] ?? [];
      if (pool.length > 0) {
        const challenge = pool[Math.floor(Math.random() * pool.length)];
        const newEntry = { section: newSection, challenge, dismissed: false };
        setSkepticChallenges(prev => {
          const updated = [...prev, newEntry];
          setActiveSkepticIdx(updated.length - 1);
          return updated;
        });
      }
    }
    setActiveSection(newSection);
  }, [skepticMode, activeSection, answers, SKEPTIC_CHALLENGES]);

  const endSession = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("debrief");
    const result = await debrief.mutateAsync({
      targetLevel,
      problem: {
        id: selectedProblem.id,
        title: selectedProblem.title,
        difficulty: selectedProblem.difficulty,
        tagline: selectedProblem.tagline,
      },
      durationSec: secsElapsed,
      sections: {
        requirements: answers.requirements,
        dataModel: answers.dataModel,
        api: answers.api,
        scaleBottlenecks: answers.scaleBottlenecks,
        metaTips: answers.metaTips,
      },
    });
    if (result) {
      const entry: MockHistoryEntry = {
        id: Date.now().toString(),
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        targetLevel,
        verdict: result.icLevelVerdict,
        scores: {
          requirements: result.requirementsScore,
          dataModel: result.dataModelScore,
          api: result.apiScore,
          scale: result.scaleScore,
          metaDepth: result.metaDepthScore,
        },
        durationSec: secsElapsed,
        date: Date.now(),
      };
      const updated = [...loadMockHistory(), entry];
      saveMockHistory(updated);
      setMockHistory(updated);
      // Award XP for completing an SD mock session
      const isFirstMock = loadMockHistory().length === 0;
      if (isFirstMock) {
        addXP('first_mock', `First SD Mock: ${selectedProblem.title}`);
      } else {
        const verdict = result.icLevelVerdict;
        const bonus = verdict === 'Strong Hire' ? 20 : verdict === 'Hire' ? 10 : 0;
        addXP('sd_mock', `SD Mock (${verdict}): ${selectedProblem.title}`, 40 + bonus);
      }
    }
  }, [debrief, targetLevel, selectedProblem, secsElapsed, answers, addXP]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "active") return;
    intervalRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          endSession();
          return 0;
        }
        return s - 1;
      });
      setSecsElapsed(e => e + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, endSession]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerPct = secsLeft / (45 * 60);
  const timerColor = timerPct > 0.5 ? "text-emerald-600" : timerPct > 0.25 ? "text-amber-600" : "text-red-600";

  const result = debrief.data;

  // ── Setup phase ─────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={15} className="text-indigo-600" />
            <span className="text-sm font-extrabold text-indigo-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              System Design Mock Session
            </span>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">45 min</span>
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Simulate a real Meta system design interview. You'll have 45 minutes to work through 5 structured sections: Requirements, Data Model, API, Scale & Bottlenecks, and Meta-Specific Depth. An LLM panel will then score each dimension and generate an IC-level debrief.
          </p>
        </div>

        {/* IC Level */}
        <div>
          <p className="text-xs font-bold text-foreground mb-2">Target Level</p>
          <div className="flex gap-2">
            {(["IC6", "IC7"] as ICLevel[]).map(lvl => (
              <button
                key={lvl}
                onClick={() => setTargetLevel(lvl)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  targetLevel === lvl
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-400"
                }`}
              >
                {lvl === "IC6" ? "IC6 — Staff Engineer" : "IC7 — Principal/Senior Staff"}
              </button>
            ))}
          </div>
        </div>

        {/* Problem selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-foreground">Problem</p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={randomMode}
                onChange={e => setRandomMode(e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-600"
              />
              <span className="text-xs text-muted-foreground">🎲 Random</span>
            </label>
          </div>
          {!randomMode && (
            <div className="grid grid-cols-1 gap-2">
              {PROBLEMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProblem(p)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selectedProblem.id === p.id
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-border bg-card hover:border-indigo-300"
                  }`}
                >
                  <span style={{ color: p.color }}>{p.icon}</span>
                  <div className="min-w-0 flex-1">
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
          )}
          {randomMode && (
            <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-center text-xs text-indigo-600 font-semibold">
              A random problem will be revealed when you start the session.
            </div>
          )}
        </div>

        {/* Skeptic Mode toggle */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3.5 flex items-start gap-3">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={skepticMode}
              onChange={e => setSkepticMode(e.target.checked)}
              className="w-4 h-4 accent-orange-600"
            />
            <div>
              <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                <Swords size={12} className="text-orange-600" /> Skeptic Persona Mode
              </span>
              <p className="text-[11px] text-orange-700 mt-0.5 leading-relaxed">
                When you switch sections, an interviewer challenge fires: "Why not X instead?" You must defend your choices under pressure.
              </p>
            </div>
          </label>
        </div>

        <button
          onClick={startSession}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
        >
          <Play size={14} /> Start 45-Minute Mock
        </button>
      </div>
    );
  }

  // ── Active session phase ─────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <div className="space-y-4">
        {/* Timer bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className={timerColor} />
              <span className={`text-lg font-mono font-extrabold tabular-nums ${timerColor}`}>
                {formatTime(secsLeft)}
              </span>
            </div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${timerPct > 0.5 ? "bg-emerald-500" : timerPct > 0.25 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${timerPct * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: selectedProblem.bgColor, color: selectedProblem.color, border: `1px solid ${selectedProblem.borderColor}` }}>
                {selectedProblem.difficulty}
              </span>
              <button
                onClick={endSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
              >
                <Square size={10} /> End & Debrief
              </button>
            </div>
          </div>
          <p className="text-xs font-extrabold text-foreground mt-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {selectedProblem.title}
          </p>
          <p className="text-[10px] text-muted-foreground">{selectedProblem.tagline}</p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {SECTION_CONFIG.map(s => {
            const filled = answers[s.key].trim().length > 0;
            return (
              <button
                key={s.key}
                onClick={() => handleSectionSwitch(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all shrink-0 ${
                  activeSection === s.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-card text-muted-foreground border-border hover:border-indigo-300"
                }`}
              >
                {filled && <CheckCircle2 size={10} className={activeSection === s.key ? "text-indigo-200" : "text-emerald-500"} />}
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Skeptic challenge banner */}
        {skepticMode && activeSkepticIdx !== null && skepticChallenges[activeSkepticIdx] && !skepticChallenges[activeSkepticIdx].dismissed && (
          <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-3.5 flex items-start gap-3 animate-pulse-once">
            <Swords size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide mb-1">Skeptic Challenge — Defend your answer</p>
              <p className="text-xs text-orange-900 font-semibold leading-relaxed">{skepticChallenges[activeSkepticIdx].challenge}</p>
            </div>
            <button
              onClick={() => {
                setSkepticChallenges(prev => prev.map((c, i) => i === activeSkepticIdx ? { ...c, dismissed: true } : c));
                setActiveSkepticIdx(null);
              }}
              className="flex-shrink-0 text-orange-500 hover:text-orange-700 transition-colors"
              title="Dismiss (I've addressed this)"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Active section */}
        {SECTION_CONFIG.map(s => s.key === activeSection && (
          <div key={s.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{s.label}</span>
              <button
                onClick={() => setShowHints(h => ({ ...h, [s.key]: !h[s.key] }))}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Zap size={10} />
                {showHints[s.key] ? "Hide hints" : "Show hints"}
              </button>
            </div>
            {showHints[s.key] && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Hints (use sparingly)</p>
                {selectedProblem.hints[s.hint].map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                    <span className="shrink-0 mt-0.5">•</span>{h}
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={answers[s.key]}
              onChange={e => setAnswers(a => ({ ...a, [s.key]: e.target.value }))}
              placeholder={s.placeholder}
              rows={12}
              className="w-full rounded-xl border border-border bg-card text-xs text-foreground p-3 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-muted-foreground/50"
            />
            <div className="text-[10px] text-muted-foreground text-right">
              {answers[s.key].length} chars
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Debrief phase ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Mock Session Complete</p>
          <p className="text-sm font-extrabold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {selectedProblem.title}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {targetLevel} · {formatTime(secsElapsed)} elapsed
          </p>
        </div>
        <button
          onClick={() => setPhase("setup")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          <RotateCcw size={12} /> New Session
        </button>
      </div>

      {/* Loading */}
      {debrief.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-muted-foreground">Generating IC-level debrief…</p>
          <p className="text-xs text-muted-foreground">Evaluating 5 dimensions against the {targetLevel} bar</p>
        </div>
      )}

      {/* Error */}
      {debrief.isError && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs">
          <AlertCircle size={14} />
          Failed to generate debrief. Please try again.
        </div>
      )}

      {/* Debrief result */}
      {result && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-bold ${VERDICT_COLORS[result.icLevelVerdict]}`}>
            <Trophy size={16} />
            <span className="text-sm">{result.icLevelVerdict}</span>
            <span className="text-xs font-normal ml-auto opacity-70">{targetLevel} bar</span>
          </div>

          {/* Overall summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Overall Assessment</p>
            <p className="text-xs text-foreground leading-relaxed">{result.overallSummary}</p>
          </div>

          {/* Dimension scores */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Dimension Scores (click to expand)</p>
            <ScoreBar score={result.requirementsScore} label="Requirements" feedback={result.requirementsFeedback} />
            <ScoreBar score={result.dataModelScore} label="Data Model" feedback={result.dataModelFeedback} />
            <ScoreBar score={result.apiScore} label="API Design" feedback={result.apiFeedback} />
            <ScoreBar score={result.scaleScore} label="Scale & Bottlenecks" feedback={result.scaleFeedback} />
            <ScoreBar score={result.metaDepthScore} label="Meta-Specific Depth" feedback={result.metaDepthFeedback} />
          </div>

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 p-4">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-2">Top Strengths</p>
              <ul className="space-y-1.5">
                {result.topStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={11} className="shrink-0 mt-0.5 text-emerald-600" />{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">Top Improvements</p>
              <ul className="space-y-1.5">
                {result.topImprovements.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle size={11} className="shrink-0 mt-0.5 text-amber-600" />{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next steps */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Next Steps</p>
            <ul className="space-y-1.5">
              {result.nextSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                  <Zap size={11} className="shrink-0 mt-0.5 text-indigo-500" />{s}
                </li>
              ))}
            </ul>
          </div>

          {/* Radar chart */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Dimension Profile</p>
            <RadarChart scores={[
              { label: "Requirements", value: result.requirementsScore },
              { label: "Data Model", value: result.dataModelScore },
              { label: "API Design", value: result.apiScore },
              { label: "Scale", value: result.scaleScore },
              { label: "Meta Depth", value: result.metaDepthScore },
            ]} />
          </div>

          {/* Follow-up drill */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Drill Deeper — Follow-up Questions</p>
              {!followUp.data && (
                <button
                  onClick={() => followUp.mutate({
                    targetLevel,
                    problem: { id: selectedProblem.id, title: selectedProblem.title, difficulty: selectedProblem.difficulty, tagline: selectedProblem.tagline },
                    sections: { requirements: answers.requirements, dataModel: answers.dataModel, api: answers.api, scaleBottlenecks: answers.scaleBottlenecks, metaTips: answers.metaTips },
                    verdict: result.icLevelVerdict,
                  })}
                  disabled={followUp.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {followUp.isPending ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
                  {followUp.isPending ? "Generating…" : "Generate 3 Questions"}
                </button>
              )}
            </div>
            {followUp.data && (
              <div className="space-y-3">
                {followUp.data.questions.map((q, i) => (
                  <details key={i} className="rounded-lg border border-indigo-200 bg-white dark:bg-indigo-900/20 overflow-hidden">
                    <summary className="flex items-start gap-2 px-3 py-2.5 cursor-pointer text-xs font-semibold text-indigo-900 dark:text-indigo-200 select-none">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold mt-0.5">{i + 1}</span>
                      <span className="flex-1">{q.question}</span>
                      <span className="text-[9px] font-bold text-indigo-500 shrink-0 mt-0.5">{q.dimension}</span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 border-t border-indigo-100">
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed"><span className="font-bold">Hint: </span>{q.hint}</p>
                    </div>
                  </details>
                ))}
              </div>
            )}
            {followUp.isError && <p className="text-xs text-red-500">Failed to generate questions. Please try again.</p>}
          </div>

          {/* Skeptic challenge debrief */}
          {skepticMode && skepticChallenges.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Swords size={13} className="text-orange-600" />
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Skeptic Challenges Fired This Session</p>
                <span className="ml-auto text-[10px] font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                  {skepticChallenges.filter(c => c.dismissed).length}/{skepticChallenges.length} dismissed
                </span>
              </div>
              <div className="space-y-2">
                {skepticChallenges.map((c, i) => (
                  <div key={i} className={`rounded-lg border p-2.5 ${c.dismissed ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-white"}` }>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500">{c.section}</span>
                      {c.dismissed
                        ? <span className="text-[9px] font-bold text-emerald-600 ml-auto">✓ Dismissed</span>
                        : <span className="text-[9px] font-bold text-orange-500 ml-auto">Not addressed</span>}
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed">{c.challenge}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session transcript */}
          <details className="rounded-xl border border-border bg-card overflow-hidden">
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground select-none">
              <ChevronDown size={13} className="transition-transform [[open]>&]:rotate-180" />
              Session Transcript
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
              {SECTION_CONFIG.map(s => (
                <div key={s.key}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3 border border-border leading-relaxed">
                    {answers[s.key] || "(not addressed)"}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
