/**
 * FailureAnalysisTab — "Why Candidates Fail the Meta IC6/IC7 Interview"
 * 7-part interactive reference compiled from candidate reports, Meta engineering blog,
 * NeetCode, HelloInterview, igotanoffer, and Taro. Updated March 2026.
 *
 * Parts:
 *  1 — System Design Failures (42%)
 *  2 — Coding Failures (31%)
 *  3 — Behavioral Failures (27%)
 *  4 — Persona Stress Tests (5 archetypes)
 *  5 — The 22% Down-Leveling Problem
 *  6 — 10 Tools that fix each failure mode
 *  7 — Summary fix table
 */

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Code2,
  Brain,
  Users,
  TrendingDown,
  Wrench,
  BarChart3,
  BookOpen,
  Zap,
  Target,
  CheckCircle2,
  Circle,
  Play,
  Filter,
  Rocket,
  X,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import CheckpointPacer from "@/components/training/CheckpointPacer";
import TestFirstDebugger from "@/components/training/TestFirstDebugger";
import VerbalExplanationScorer from "@/components/training/VerbalExplanationScorer";
import { InterviewerPersonaStressTest } from "@/components/InterviewerPersonaStressTest";

// ─── Data ──────────────────────────────────────────────────────────────────────

const FAILURE_DISTRIBUTION = [
  {
    category: "System Design",
    share: 42,
    color: "bg-red-500",
    textColor: "text-red-400",
    borderColor: "border-red-500/40",
    bgColor: "bg-red-500/5",
    rootCause:
      "Cannot handle interruptions; no back-of-envelope instinct; answers collapse under follow-up",
  },
  {
    category: "Coding",
    share: 31,
    color: "bg-amber-500",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/5",
    rootCause:
      "Silent coding; wrong pattern recognition; no complexity analysis stated unprompted",
  },
  {
    category: "Behavioral",
    share: 27,
    color: "bg-blue-500",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/40",
    bgColor: "bg-blue-500/5",
    rootCause:
      "Story gaps across Meta values; vague answers with no metrics; breaks under pressure from skeptical interviewers",
  },
];

const SYSTEM_DESIGN_FAILURE_MODES = [
  {
    title: "Cannot Handle Interruptions",
    detail: `Meta interviewers interrupt deliberately. They cut off your explanation mid-sentence, ask "but what happens when the DB goes down?", and redirect you to a component you haven't reached yet. Candidates who have only practiced monologue-style design reviews collapse when interrupted.`,
  },
  {
    title: "No Back-of-Envelope Instinct",
    detail:
      "IC6 and IC7 candidates are expected to estimate QPS, storage, bandwidth, and memory requirements in real time — without a calculator, without being asked. Candidates who skip this signal to the interviewer that they have never operated a system at scale.",
  },
  {
    title: "Answers Collapse Under Follow-Up",
    detail: `Saying "I'd use a cache" is not enough. The follow-up is always "which eviction policy?", "what happens when the cache node fails?", "how do you handle cache stampede?". Candidates who cannot go three levels deep on any component they mention are flagged as IC5, not IC6.`,
  },
];

const SYSTEM_DESIGN_WEAK_SIGNALS = [
  {
    id: "sd1",
    num: 1,
    title: "Non-Functional Requirements (NFR)",
    detail:
      "Consistently skipping scalability, availability, latency, and reliability requirements before diving into implementation. Meta interviewers flag candidates who jump to DB schema without stating QPS targets, who never mention SLAs or error budgets, and who skip capacity estimation entirely.",
    drill:
      "For the next system design question, spend the first 5 minutes ONLY on non-functional requirements. State: expected QPS, storage per day, read/write ratio, latency SLA, availability target. Do not draw any boxes until you have written all 5.",
  },
  {
    id: "sd2",
    num: 2,
    title: "Tradeoff Articulation",
    detail: `Stating design choices without explaining the tradeoffs. Meta interviewers specifically look for "why not X" reasoning. Saying "I'll use Cassandra" without explaining why not MySQL, choosing eventual consistency without mentioning when strong consistency would be needed, or picking microservices without discussing operational overhead are all red flags.`,
    drill:
      'For every design decision you make today, force yourself to say: "I chose X over Y because... The downside of X is... I\'d switch to Y if..." Practice this on 3 decisions: database choice, caching strategy, and API design.',
  },
  {
    id: "sd3",
    num: 3,
    title: "Observability & Monitoring",
    detail:
      "Never mentioning monitoring, alerting, logging, or observability in system designs. This is a strong IC6 signal. Designing a distributed system without mentioning metrics, not discussing how you'd know if the system is unhealthy, and no mention of dashboards, alerts, or on-call runbooks are all disqualifying patterns.",
    drill:
      'Add an "Observability" section to every system design today. Include: key metrics to track (latency, error rate, throughput), alerting thresholds, logging strategy, and how you\'d debug a production incident.',
  },
  {
    id: "sd4",
    num: 4,
    title: "Deep Dive Readiness",
    detail: `Giving high-level answers that cannot withstand follow-up questions. IC6/IC7 candidates must be able to go 3 levels deep on any component. "I'd use a message queue" without knowing Kafka partition strategy, "I'd use a cache" without knowing eviction policies, and mentioning sharding without knowing the partition key strategy are all IC5 signals.`,
    drill:
      'Pick one component from your last system design (e.g., "the database"). Write 3 levels of depth: (1) what it is, (2) how it works internally, (3) what breaks at scale and how you\'d fix it.',
  },
];

const STRESS_TEST_SCENARIOS = {
  "Cache (Redis)": [
    {
      scenario:
        "Your Redis cache hit rate drops from 95% to 5% during a traffic spike after a deployment. Walk me through the failure cascade and how you'd recover.",
      testing: "Thundering herd, origin overload, cache warming strategy",
    },
    {
      scenario:
        "A Redis node in your cluster fails. 1/8 of your keyspace is now unavailable. What happens to your application and how do you handle it?",
      testing: "Consistent hashing, virtual nodes, fallback strategy",
    },
    {
      scenario:
        "Your cache eviction policy is LRU. A batch job runs nightly and reads 10M rarely-accessed keys, evicting your hot working set. What's the impact and fix?",
      testing: "Cache pollution, eviction policy alternatives (LFU vs LRU)",
    },
    {
      scenario:
        "You need to cache user session data for 1B users. Each session is 2KB. How much memory do you need and how do you shard it?",
      testing: "1B × 2KB = 2TB math, sharding strategy, compression",
    },
    {
      scenario:
        "You're using Redis for rate limiting with INCR + EXPIRE. Two servers execute INCR and EXPIRE non-atomically. What race condition exists and how do you fix it?",
      testing: "Atomicity, Lua scripts, SET with NX and EX",
    },
  ],
  "Message Queue (Kafka)": [
    {
      scenario:
        "Your Kafka consumer group is processing 10K messages/second but your downstream DB can only handle 2K writes/second. The consumer lag grows unboundedly. What do you do?",
      testing: "Backpressure, batching, consumer scaling, DB optimization",
    },
    {
      scenario:
        "A Kafka broker fails. You have replication factor 3 and min.insync.replicas=2. What happens to producers and consumers?",
      testing: "ISR, leader election, producer acks, consumer rebalancing",
    },
    {
      scenario:
        "You have a hot partition — one partition receives 80% of all messages because your partition key is user_id and one celebrity has 50M followers. How do you fix it?",
      testing: "Partition key design, salting, sub-partitioning",
    },
    {
      scenario:
        "Your consumer crashes after processing a message but before committing the offset. The message gets reprocessed. How do you ensure idempotency?",
      testing: "Idempotency keys, deduplication, at-least-once vs exactly-once",
    },
    {
      scenario:
        "You need to replay all events from the last 7 days to rebuild a derived data store after a bug corrupted it. How does Kafka support this?",
      testing: "Log retention, consumer group offsets, seek to timestamp",
    },
  ],
  "Database (MySQL/Postgres)": [
    {
      scenario:
        "Your primary MySQL instance fails. You have one read replica with async replication. What data loss is possible and how do you minimize it?",
      testing: "RPO, replication lag, semi-sync replication, GTID",
    },
    {
      scenario:
        "You need to add a column to a 500M-row table without downtime. What's your strategy?",
      testing: "Online DDL, pt-online-schema-change, shadow table approach",
    },
    {
      scenario:
        "Your DB query response time spikes from 5ms to 500ms during peak traffic. How do you diagnose and fix it?",
      testing: "EXPLAIN, slow query log, index analysis, connection pool",
    },
    {
      scenario:
        "You're sharding a user table by user_id. A query needs to find all users in a given city. How do you handle cross-shard queries?",
      testing: "Scatter-gather, secondary index table, denormalization",
    },
    {
      scenario:
        "Your application has an N+1 query problem: for each of 100 posts, it makes a separate DB query to fetch the author. How do you fix it?",
      testing: "Eager loading, JOIN, DataLoader pattern, query batching",
    },
  ],
};

const REAL_DESIGN_QUESTIONS = [
  {
    problem: "Design Facebook News Feed",
    level: "L6+",
    concepts: "Fan-out on write vs read, ranking, pagination",
  },
  {
    problem: "Design Facebook Messenger",
    level: "L6+",
    concepts: "WebSockets, message storage, presence",
  },
  {
    problem: "Design Instagram",
    level: "L6+",
    concepts: "CDN, media storage, feed generation",
  },
  {
    problem: "Design WhatsApp",
    level: "L6+",
    concepts: "E2E encryption, message queue, delivery receipts",
  },
  {
    problem: "Design a Distributed Cache",
    level: "L6+",
    concepts: "Consistent hashing, eviction, replication",
  },
  {
    problem: "Design Search Autocomplete",
    level: "L6+",
    concepts: "Trie, Top-K, ranking",
  },
  {
    problem: "Design a Notification System",
    level: "L6+",
    concepts: "Push/pull, fanout, delivery guarantees",
  },
  {
    problem: "Design a Rate Limiter",
    level: "L6+",
    concepts: "Token bucket, sliding window, distributed",
  },
  {
    problem: "Design a URL Shortener",
    level: "L6+",
    concepts: "Hashing, redirection, analytics",
  },
  {
    problem: "Design a Distributed Job Queue",
    level: "L7+",
    concepts: "At-least-once, idempotency, priority",
  },
  {
    problem: "Design Meta's Ad Targeting",
    level: "L7+",
    concepts: "ML pipeline, real-time bidding, privacy",
  },
  {
    problem: "Design a Distributed File System",
    level: "L7+",
    concepts: "Replication, consistency, fault tolerance",
  },
];

const CODING_FAILURE_MODES = [
  {
    title: "Silent Coding",
    detail:
      "At IC6 and above, communication IS the interview. A candidate who codes silently for 20 minutes and then presents a solution is signaling L4, not L6. Interviewers need to hear your reasoning in real time: what pattern you identified, what trade-offs you considered, what edge cases you are handling.",
  },
  {
    title: "Wrong Pattern Recognition",
    detail:
      "The first 2 minutes of a coding interview determine the outcome. Candidates who cannot identify the pattern category within the first 2 minutes — and state it aloud before writing code — consistently run out of time or implement the wrong approach.",
  },
  {
    title: "No Complexity Analysis",
    detail:
      "Meta interviewers expect time and space complexity to be stated unprompted, after every solution. Candidates who wait to be asked signal that complexity analysis is not a natural part of their thinking.",
  },
];

const CODING_WEAK_SIGNALS = [
  {
    id: "c1",
    num: 5,
    title: "Complexity Analysis",
    detail:
      "Not stating time and space complexity after implementing a solution. Meta interviewers expect this unprompted. Not mentioning the space complexity of the recursion stack, and not comparing complexity of two approaches, are both red flags.",
    drill:
      "For every coding solution today, add a comment block at the end: # Time: O(?) because... # Space: O(?) because... # Could improve to O(?) by... Do this even for trivial solutions.",
  },
  {
    id: "c2",
    num: 6,
    title: "Edge Case Coverage",
    detail:
      "Missing edge cases in test cases or implementation. Meta interviewers test with boundary inputs specifically. Not testing empty array/string, not handling null input, and not considering negative numbers or overflow are all disqualifying patterns.",
    drill:
      "Before writing any code today, write a test case list: empty input, single element, all same, negative numbers, max int, null/None. Only start coding after you have written all test cases.",
  },
];

const CODING_PATTERNS = [
  {
    pattern: "Sliding Window",
    keyInsight: "Maintain a window of elements satisfying a constraint",
    problems:
      "Longest substring without repeating characters, minimum window substring",
  },
  {
    pattern: "Two Pointers",
    keyInsight:
      "Use two indices moving toward each other or in the same direction",
    problems: "Container with most water, 3Sum, remove duplicates",
  },
  {
    pattern: "Fast & Slow Pointers",
    keyInsight: "Detect cycles or find midpoints in linked structures",
    problems: "Linked list cycle, find middle of linked list",
  },
  {
    pattern: "Binary Search Variants",
    keyInsight: "Search in sorted or monotonically ordered space",
    problems: "Search in rotated sorted array, find peak element",
  },
  {
    pattern: "BFS / Level-Order",
    keyInsight: "Explore graph/tree level by level",
    problems: "Binary tree level order traversal, word ladder",
  },
  {
    pattern: "DFS / Backtracking",
    keyInsight: "Explore all paths, prune invalid branches",
    problems: "Subsets, permutations, N-Queens, word search",
  },
  {
    pattern: "Dynamic Programming",
    keyInsight: "Optimal substructure + overlapping subproblems",
    problems: "Coin change, longest common subsequence, edit distance",
  },
  {
    pattern: "Greedy Algorithms",
    keyInsight: "Make locally optimal choice at each step",
    problems: "Jump game, interval scheduling, gas station",
  },
  {
    pattern: "Heap / Priority Queue",
    keyInsight: "Maintain sorted order with efficient insert/extract",
    problems: "Top K frequent elements, merge K sorted lists, median finder",
  },
  {
    pattern: "Intervals",
    keyInsight: "Merge, insert, or find overlapping ranges",
    problems: "Merge intervals, meeting rooms, non-overlapping intervals",
  },
  {
    pattern: "Monotonic Stack",
    keyInsight: "Maintain increasing/decreasing order for next greater/smaller",
    problems: "Daily temperatures, largest rectangle in histogram",
  },
  {
    pattern: "Trie (Prefix Tree)",
    keyInsight: "Efficient prefix search and autocomplete",
    problems: "Implement trie, word search II, replace words",
  },
  {
    pattern: "Union-Find (DSU)",
    keyInsight: "Track connected components with path compression",
    problems: "Number of connected components, redundant connection",
  },
  {
    pattern: "Topological Sort",
    keyInsight: "Order nodes in a DAG respecting dependencies",
    problems: "Course schedule, alien dictionary, task scheduler",
  },
];

const BEHAVIORAL_FAILURE_MODES = [
  {
    title: "Story Gaps Across Meta Values",
    detail:
      "Meta's behavioral interview tests 7 distinct value areas. Candidates who prepare only 3–4 stories and try to reuse them across all areas are flagged immediately.",
  },
  {
    title: "Vague Answers with No Metrics",
    detail:
      '"I improved the system" is an L5 answer. "I reduced p99 latency by 40%, which improved conversion by 12% and saved $200K/year in infrastructure costs" is an L6 answer. Every claim must have a number, a timeline, and a business outcome.',
  },
  {
    title: "Breaks Under Pressure from Skeptical Interviewers",
    detail:
      'Meta interviewers are trained to probe. They will challenge your claims, ask for specifics you did not prepare, and play devil\'s advocate. Candidates who have only practiced delivering their stories in a vacuum break when the interviewer says "But how do you know that worked?"',
  },
];

const BEHAVIORAL_WEAK_SIGNALS = [
  {
    id: "b1",
    num: 7,
    title: "STAR Answer Specificity",
    detail:
      'Giving vague behavioral answers without specific metrics, timelines, or outcomes. IC6/IC7 answers must include measurable impact. "I improved the system" instead of "I reduced p99 latency by 40%", "The team was happy" instead of "We shipped 2 weeks early", and describing what you did without the outcome are all L5 signals.',
    drill:
      "For every behavioral answer today, you must include: (1) a specific number or percentage, (2) a timeline, (3) a business outcome. If you cannot add all three, the answer is not IC6-ready.",
  },
  {
    id: "b2",
    num: 8,
    title: "Ownership Signals",
    detail:
      'Using "we" instead of "I" in behavioral answers. Meta interviewers need to understand your specific contribution. "We built the feature" without clarifying your role, "The team decided" without explaining your influence, and describing a project without stating what you personally owned are all red flags.',
    drill:
      'Rewrite your last 3 behavioral answers replacing every "we" with "I" or "my team, and I specifically...". If you cannot, the answer lacks ownership signal.',
  },
];

type BehavioralArea =
  | "Influence & Conflict"
  | "Ownership & Ambiguity"
  | "Scale & Impact"
  | "Failure & Learning"
  | "XFN Partnership"
  | "All";

const BEHAVIORAL_QUESTIONS: Record<
  string,
  { question: string; level: string; signal: string }[]
> = {
  "Influence & Conflict": [
    {
      question:
        "Tell me about a time you disagreed with your manager or a senior stakeholder on a technical decision. What did you do?",
      level: "L5",
      signal: "Principled disagreement with data, not emotion",
    },
    {
      question:
        "Describe a situation where you had to influence a team or org that didn't report to you.",
      level: "L5",
      signal: "Influence without authority",
    },
    {
      question:
        "Tell me about a time you had to push back on a product or business requirement.",
      level: "L5",
      signal: "Technical judgment vs business pressure",
    },
    {
      question:
        "Describe a time when two teams had conflicting priorities and you had to broker a resolution.",
      level: "L6",
      signal: "Mediation, shared goals, escalation judgment",
    },
    {
      question:
        "Tell me about a time you changed someone's mind using data or a prototype.",
      level: "L5",
      signal: "Evidence-based persuasion",
    },
    {
      question:
        "Describe a time you had to navigate a politically sensitive technical decision.",
      level: "L6",
      signal: "Organizational awareness, stakeholder management",
    },
    {
      question:
        "Tell me about a time you successfully advocated for a technical investment that had no immediate business payoff.",
      level: "L6",
      signal: "Long-term thinking, building trust",
    },
  ],
  "Ownership & Ambiguity": [
    {
      question:
        "Tell me about a time you took ownership of a problem that wasn't technically yours to solve.",
      level: "L5",
      signal: "Proactive ownership beyond job description",
    },
    {
      question:
        "Describe a project where the requirements were unclear. How did you move forward?",
      level: "L5",
      signal: "Structured ambiguity resolution",
    },
    {
      question:
        "Tell me about a time you had to make a significant decision with incomplete information.",
      level: "L6",
      signal: "Risk tolerance, reversible vs irreversible decisions",
    },
    {
      question:
        "Describe a situation where you identified a critical problem before it became a crisis.",
      level: "L6",
      signal: "Proactive risk identification",
    },
    {
      question:
        "Tell me about a time you had to define the scope of a project from scratch.",
      level: "L6",
      signal: "Scoping judgment, stakeholder alignment",
    },
    {
      question:
        "Describe a time you had to say no to a feature request. How did you handle it?",
      level: "L5",
      signal: "Principled prioritization",
    },
    {
      question:
        "Tell me about a time you had to pivot a project mid-execution. What triggered it and how did you manage it?",
      level: "L7",
      signal: "Adaptability, stakeholder communication",
    },
  ],
  "Scale & Impact": [
    {
      question:
        "Tell me about the most technically complex system you've designed or significantly contributed to.",
      level: "L6",
      signal: "Quantify scale: QPS, latency, data volume, team size",
    },
    {
      question:
        "Describe a time when your technical decision had org-wide or company-wide impact.",
      level: "L7",
      signal: "Influence beyond immediate team",
    },
    {
      question:
        "Tell me about a time you improved engineering efficiency or developer productivity at scale.",
      level: "L6",
      signal: "Multiplier effect, platform thinking",
    },
    {
      question:
        "Describe a project where you had to balance speed of delivery with long-term technical quality.",
      level: "L5",
      signal: "Technical debt judgment",
    },
    {
      question:
        "Tell me about a time you reduced costs or improved performance significantly in production.",
      level: "L6",
      signal: "Quantify: latency %, cost savings $, throughput",
    },
    {
      question:
        "Describe a time you led a migration or platform change that affected many teams.",
      level: "L7",
      signal: "Strangler fig, feature flags, rollback plan",
    },
    {
      question:
        "Tell me about a technical investment that paid off significantly over time.",
      level: "L7",
      signal: "Long-term thinking, compounding returns",
    },
  ],
  "Failure & Learning": [
    {
      question:
        "Tell me about a significant technical failure or outage you were responsible for. What happened and what did you learn?",
      level: "L6",
      signal: "Own it fully. Show systemic fix, not just a patch.",
    },
    {
      question:
        "Describe a time when you were wrong about a technical approach. How did you course-correct?",
      level: "L5",
      signal: "Intellectual humility, data-driven pivot",
    },
    {
      question:
        "Tell me about a time a project you led failed to meet its goals. What would you do differently?",
      level: "L6",
      signal: "Root cause analysis, not blame",
    },
    {
      question:
        "Describe a time you received critical feedback that was hard to hear. How did you respond?",
      level: "L5",
      signal: "Openness to feedback, concrete behavior change",
    },
    {
      question:
        "Tell me about a time you shipped something that had unintended negative consequences.",
      level: "L6",
      signal: "Monitoring, rollback, post-mortem, prevention",
    },
    {
      question:
        "Describe a time you underestimated the complexity of a project. What happened?",
      level: "L5",
      signal: "Estimation skills, early signals, course correction",
    },
    {
      question:
        "Tell me about a time you had to deliver bad news to stakeholders. How did you handle it?",
      level: "L6",
      signal: "Transparency, options, path forward",
    },
  ],
  "XFN Partnership": [
    {
      question:
        "Tell me about an XFN partnership that went particularly well. What made it successful, and what could have gone better?",
      level: "L7",
      signal: "Mutual respect, shared impact, honest reflection on gaps",
    },
    {
      question:
        "Who is the most challenging person or function you've had to work with? If I called them, what would they say about you?",
      level: "L7",
      signal: "Self-awareness and growth — not just 'they'd say great things'",
    },
    {
      question:
        "Walk me through a project that required collaboration across multiple functions. How did you ensure effectiveness and alignment?",
      level: "L7",
      signal:
        "Quantify the scope: how many teams, what disciplines, what was at stake",
    },
    {
      question:
        "When have you had to manage through competing goals or lack of alignment across functions? How did you resolve it?",
      level: "L7",
      signal:
        "Strategic thinking: finding shared ground or escalating appropriately",
    },
    {
      question:
        "Have you ever been in a situation where a key XFN partner was missing or underperforming? How did you handle it?",
      level: "L7",
      signal: "Accountability without blame",
    },
    {
      question:
        "What were your go-to methods for communicating and gathering feedback across functions? Have any ever backfired?",
      level: "L7",
      signal: "Specific tools/rituals + honest reflection on what didn't work",
    },
  ],
};

const STAR_STORIES = [
  {
    title: "Led Cross-Team Migration",
    tags: ["Ownership", "Scale", "Execution"],
    s: "Legacy monolith causing 40% of incidents.",
    t: "Migrate 3 teams to new service mesh.",
    a: "Designed strangler fig pattern, feature flags, 6-month rollout.",
    r: "40% incident reduction, 2× deploy frequency.",
  },
  {
    title: "Resolved Production Outage",
    tags: ["Failure", "Ownership", "Speed"],
    s: "P0 outage, 500K users affected.",
    t: "Diagnose and restore within SLA.",
    a: "Led war room, identified DB connection pool exhaustion, hotfix + long-term fix.",
    r: "Restored in 47 min, implemented circuit breaker.",
  },
  {
    title: "Influenced Architectural Decision",
    tags: ["Conflict", "Strategy", "Data"],
    s: "Team wanted to use vendor X, I had concerns.",
    t: "Convince leadership with data.",
    a: "Built proof-of-concept, benchmark comparison, TCO analysis.",
    r: "Team adopted my recommendation, saved $200K/year.",
  },
  {
    title: "Grew Junior Engineer",
    tags: ["Mentorship", "Culture", "Impact"],
    s: "Junior engineer struggling with system design.",
    t: "Upskill to L4 level in 6 months.",
    a: "Weekly 1:1s, design reviews, stretch projects, feedback loops.",
    r: "Promoted to L4, now leading a feature independently.",
  },
  {
    title: "Defined Technical Roadmap",
    tags: ["Strategy", "Roadmap", "L7"],
    s: "Org lacked 2-year technical vision.",
    t: "Define roadmap aligned to business goals.",
    a: "Stakeholder interviews, competitive analysis, RFC process, OKR alignment.",
    r: "Roadmap adopted, 3 major initiatives launched.",
  },
  {
    title: "Improved System Performance",
    tags: ["Scale", "Impact", "Execution"],
    s: "API latency at p99 = 800ms, impacting conversion.",
    t: "Reduce to <200ms.",
    a: "Profiling, caching layer, query optimization, async processing.",
    r: "p99 = 140ms, 12% conversion improvement.",
  },
  {
    title: "Navigated Ambiguous Project",
    tags: ["Ambiguity", "Ownership", "Clarity"],
    s: "Stakeholders had conflicting visions for new product.",
    t: "Define scope and get alignment.",
    a: "User research, prototype, structured decision framework, design doc.",
    r: "Shipped MVP in 8 weeks, 85% stakeholder satisfaction.",
  },
  {
    title: "Built Engineering Culture",
    tags: ["Culture", "Mentorship", "Scale"],
    s: "Team had inconsistent code quality and slow reviews.",
    t: "Raise engineering bar without slowing velocity.",
    a: "Coding standards doc, automated linting, PR template, weekly tech talks.",
    r: "Review time -30%, defect rate -25%, team NPS +20.",
  },
];

const PERSONAS = [
  {
    id: "skeptic",
    emoji: "🔍",
    name: "The Skeptic",
    behavior: 'Challenges every claim with "But how do you know that worked?"',
    testing:
      "Whether your answers are grounded in real data or rehearsed narratives. The Skeptic will ask for the metric behind every claim, the methodology behind every measurement, and the counterfactual behind every success story.",
    survival:
      'Every answer must be pre-loaded with evidence. Before stating any outcome, have the measurement ready: "I know it worked because we tracked p99 latency in Datadog and saw it drop from 800ms to 140ms over 3 days post-deploy."',
    color: "border-red-500/40 bg-red-500/5",
    headerColor: "text-red-400",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  {
    id: "devils-advocate",
    emoji: "😈",
    name: "The Devil's Advocate",
    behavior: "Argues the opposite of everything you say.",
    testing:
      "Whether you can defend your decisions under pressure without becoming defensive. The Devil's Advocate will argue that your architectural choice was wrong, that your behavioral story shows poor judgment, and that your solution has a fatal flaw.",
    survival:
      'Acknowledge the valid point in their challenge before defending your position. "You\'re right that X has that downside — I considered it. I chose this approach because [specific reason], and I would switch to your suggested approach if [specific condition]."',
    color: "border-orange-500/40 bg-orange-500/5",
    headerColor: "text-orange-400",
    badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  {
    id: "detail-obsessive",
    emoji: "📊",
    name: "The Detail Obsessive",
    behavior: "Demands exact numbers, dates, and metrics for every claim.",
    testing:
      "Whether your stories are real or fabricated. The Detail Obsessive will ask for the exact date of the incident, the exact number of engineers on the team, the exact latency improvement, and the exact business impact.",
    survival:
      'Prepare your stories with specific numbers before the interview. If you do not remember the exact figure, say "approximately X" and explain how you would verify it. Never invent numbers.',
    color: "border-purple-500/40 bg-purple-500/5",
    headerColor: "text-purple-400",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  {
    id: "silent-starer",
    emoji: "😶",
    name: "The Silent Starer",
    behavior: 'Responds with "Interesting. Tell me more." to everything.',
    testing:
      "Whether you can self-direct and go deeper without prompting. The Silent Starer is not disengaged — they are watching whether you can identify what is most important to elaborate on, or whether you need hand-holding.",
    survival:
      'When you receive "Tell me more", do not repeat what you just said. Instead, go one level deeper: more specific metrics, more detail on your personal decision-making, or the trade-off you almost made but rejected.',
    color: "border-blue-500/40 bg-blue-500/5",
    headerColor: "text-blue-400",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  {
    id: "friendly-trap",
    emoji: "😊",
    name: "The Friendly Trap",
    behavior: "Warm and encouraging — then asks the hardest follow-up.",
    testing:
      'Whether you let your guard down when the interviewer seems satisfied. The Friendly Trap will nod, smile, and say "That\'s great!" — then immediately ask "And what would you have done differently if you had more time?" or "What was the part of this you are least proud of?"',
    survival:
      "Never interpret positive signals as permission to stop going deep. Always have a self-critical reflection ready: one thing you would do differently, one risk you underestimated, one decision you are still not sure was right.",
    color: "border-emerald-500/40 bg-emerald-500/5",
    headerColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
];

const DOWN_LEVEL_TABLE = [
  {
    level: "L5",
    focus: "What I built",
    scope: "My feature, my team",
    signal: '"Strong individual contributor"',
    color: "text-blue-400",
  },
  {
    level: "L6",
    focus: "Decisions I made, teams I influenced",
    scope: "Cross-team, multi-quarter",
    signal: '"Technical leader"',
    color: "text-emerald-400",
  },
  {
    level: "L7",
    focus: "Strategy I defined, org behavior I changed",
    scope: "Org-wide, multi-year",
    signal: '"Senior Staff — shapes the engineering org"',
    color: "text-amber-400",
  },
];

const TOOLS_MAP = [
  {
    tool: "🤖 AI Interrupt Mode",
    tab: "System Design",
    fixes: "Interviewer interruptions — practice handling mid-design redirects",
  },
  {
    tool: "🔢 BoE Grader",
    tab: "System Design",
    fixes: "No back-of-envelope instinct — AI scores your estimation accuracy",
  },
  {
    tool: "⚔️ Adversarial Review",
    tab: "System Design",
    fixes:
      "Answers collapse under follow-up — AI fires 3 adversarial follow-ups",
  },
  {
    tool: "🎙️ Think Out Loud Coach",
    tab: "Coding",
    fixes: "Silent coding — AI scores your verbal narration quality",
  },
  {
    tool: "⚡ Pattern Speed Drill",
    tab: "Coding",
    fixes: "Wrong pattern recognition — 2-minute timed pattern identification",
  },
  {
    tool: "🗺️ Remediation Plan",
    tab: "Coding",
    fixes: "Weak pattern coverage — personalized drill plan for your gaps",
  },
  {
    tool: "🗂️ Story Matrix",
    tab: "Behavioral",
    fixes: "Story gaps across Meta values — visual coverage map",
  },
  {
    tool: "🎭 Persona Stress Test",
    tab: "Behavioral",
    fixes: "Breaks under pressure — practice against 5 interviewer archetypes",
  },
  {
    tool: "📊 Impact Coach",
    tab: "Behavioral",
    fixes: "Vague answers with no metrics — AI finds every unquantified claim",
  },
  {
    tool: "📈 Readiness Report",
    tab: "Readiness",
    fixes: "Unknown gaps — weekly AI assessment across all 3 domains",
  },
];

const SUMMARY_TABLE = [
  {
    mode: "Cannot handle interruptions",
    pct: "Part of 42%",
    primary: "AI Interrupt Mode practice",
    secondary: "Record and replay sessions",
  },
  {
    mode: "No BoE instinct",
    pct: "Part of 42%",
    primary: "BoE Grader — daily estimation drills",
    secondary: "Capacity estimation templates",
  },
  {
    mode: "Answers collapse under follow-up",
    pct: "Part of 42%",
    primary: "Component Stress-Test Quiz",
    secondary: "Adversarial Design Review",
  },
  {
    mode: "Silent coding",
    pct: "Part of 31%",
    primary: "Think Out Loud Coach",
    secondary: "Timed mock sessions with narration",
  },
  {
    mode: "Wrong pattern recognition",
    pct: "Part of 31%",
    primary: "Pattern Speed Drill",
    secondary: "Remediation Plan for weak patterns",
  },
  {
    mode: "No complexity analysis",
    pct: "Part of 31%",
    primary: "Add complexity comment to every solution",
    secondary: "Weak Signal Detector",
  },
  {
    mode: "Story gaps",
    pct: "Part of 27%",
    primary: "Story Coverage Matrix",
    secondary: "Build 8+ stories across all 7 areas",
  },
  {
    mode: "Vague answers",
    pct: "Part of 27%",
    primary: "Impact Quantification Coach",
    secondary: "STAR story templates with metrics",
  },
  {
    mode: "Breaks under pressure",
    pct: "Part of 27%",
    primary: "Persona Stress Test",
    secondary: "Behavioral Mock Session",
  },
  {
    mode: "Down-leveled (not rejected)",
    pct: "22% of L6/L7",
    primary: "Seniority Level Calibrator",
    secondary: "Reframe stories around decisions, not implementation",
  },
];

const PROCESS_WEAK_SIGNALS = [
  {
    id: "p1",
    num: 9,
    title: "Requirements Clarification",
    detail:
      "Jumping to implementation before clarifying scope. Meta interviewers flag candidates who assume rather than ask. Starting to code before asking about edge cases, designing a full system when a simpler scope was intended, and not asking about scale (1K vs 1B users) are all red flags.",
    drill:
      "Before answering any question today, write down 3 clarifying questions you would ask the interviewer. Only start answering after you have written all 3.",
  },
  {
    id: "p2",
    num: 10,
    title: "Time Management",
    detail:
      "Spending too long on one phase and running out of time for others. Meta interviews have strict time expectations per phase. Spending 30 minutes on requirements with no design, jumping to optimization before finishing the basic solution, and not leaving time for follow-up questions are all disqualifying patterns.",
    drill:
      "Use a strict timer today: 5 min requirements, 10 min high-level design, 20 min deep dive, 10 min trade-offs. Set alarms. Stop each phase when the timer goes off, even if incomplete.",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {icon}
          <span className="font-semibold text-sm text-foreground">{title}</span>
          {badge && (
            <Badge className="bg-muted text-muted-foreground border text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp size={15} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function FailureMode({
  modes,
}: {
  modes: { title: string; detail: string }[];
}) {
  return (
    <div className="space-y-3">
      {modes.map((m, i) => (
        <div key={i} className="pl-3 border-l-2 border-border">
          <p className="text-xs font-semibold text-foreground">
            Failure Mode {i + 1}: {m.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
        </div>
      ))}
    </div>
  );
}

// Map each signal ID to its inline drill component
// Only using components that compile cleanly (no pre-existing TS errors)
const SIGNAL_DRILL_COMPONENTS: Record<string, React.ComponentType> = {
  sd1: CheckpointPacer, // NFR: practice time-boxing requirements phase
  sd2: CheckpointPacer, // Tradeoff: structured time per design phase
  sd3: VerbalExplanationScorer, // Observability: verbal explanation drill
  sd4: TestFirstDebugger, // Deep Dive: test-first debugging practice
  c1: VerbalExplanationScorer, // Complexity: verbal explanation of Big-O
  c2: TestFirstDebugger, // Edge Cases: test-first approach
  b1: VerbalExplanationScorer, // STAR Specificity: verbal answer scoring
  b2: VerbalExplanationScorer, // Ownership: verbal ownership framing
  p1: CheckpointPacer, // Requirements: timed clarification phase
  p2: CheckpointPacer, // Time Management: strict phase timer
};

function WeakSignalCard({
  signal,
  drillDone,
  onToggleDrill,
}: {
  signal: (typeof SYSTEM_DESIGN_WEAK_SIGNALS)[0];
  drillDone: boolean;
  onToggleDrill: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);
  const DrillComponent = SIGNAL_DRILL_COMPONENTS[signal.id];

  function handleDrillComplete() {
    setDrillOpen(false);
    if (!drillDone) onToggleDrill();
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${drillDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggleDrill}
          className="shrink-0 mt-0.5 text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          {drillDone ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Circle size={14} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground">
              Signal {signal.num}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {signal.title}
            </span>
            {drillDone && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] border">
                ✓ Done
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{signal.detail}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Play size={10} />
              {expanded ? "Hide drill tip" : "Show drill tip"}
            </button>
            {DrillComponent && (
              <button
                onClick={() => setDrillOpen(o => !o)}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
              >
                <Rocket size={10} />
                {drillOpen ? "Close drill" : "Launch drill"}
              </button>
            )}
          </div>
          {expanded && (
            <div className="mt-2 p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <p className="text-xs font-semibold text-blue-400 mb-1">
                Today's Drill Tip
              </p>
              <p className="text-xs text-foreground">{signal.drill}</p>
              {!drillDone && (
                <Button
                  size="sm"
                  onClick={onToggleDrill}
                  className="mt-2 text-xs h-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Mark drill done
                </Button>
              )}
            </div>
          )}
          {drillOpen && DrillComponent && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-500/20">
                <span className="text-xs font-semibold text-emerald-400">
                  🚀 Inline Drill — Signal {signal.num}: {signal.title}
                </span>
                <button
                  onClick={() => setDrillOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="p-3">
                <DrillComponent />
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleDrillComplete}
                    className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    ✓ Mark Signal Done & Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function FailureAnalysisTab() {
  // Drill completion state (localStorage)
  const [drillsDone, setDrillsDone] = useLocalStorage<Record<string, boolean>>(
    "meta_failure_analysis_drills_v1",
    {}
  );

  const toggleDrill = useCallback(
    (id: string) => {
      setDrillsDone(prev => ({ ...prev, [id]: !prev[id] }));
    },
    [setDrillsDone]
  );

  // Stress test state
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [revealedScenario, setRevealedScenario] = useState<string | null>(null);

  // Behavioral question filter
  const [bqFilter, setBqFilter] = useState<BehavioralArea>("All");
  const [bqLevelFilter, setBqLevelFilter] = useState<string>("All");

  // Persona state
  const [activePersona, setActivePersona] = useState<string | null>(null);

  // STAR story state
  const [expandedStory, setExpandedStory] = useState<number | null>(null);

  // Stress test component state
  const [activeStressComponent, setActiveStressComponent] = useState<
    string | null
  >(null);

  // Count drills done
  const allSignals = [
    ...SYSTEM_DESIGN_WEAK_SIGNALS,
    ...CODING_WEAK_SIGNALS,
    ...BEHAVIORAL_WEAK_SIGNALS,
    ...PROCESS_WEAK_SIGNALS,
  ];
  const totalDrills = allSignals.length;
  const doneDrills = allSignals.filter(s => drillsDone[s.id]).length;

  const filteredBQs =
    bqFilter === "All"
      ? Object.entries(BEHAVIORAL_QUESTIONS).flatMap(([area, qs]) =>
          qs.map(q => ({ ...q, area }))
        )
      : (BEHAVIORAL_QUESTIONS[bqFilter] || []).map(q => ({
          ...q,
          area: bqFilter,
        }));

  const levelFilteredBQs =
    bqLevelFilter === "All"
      ? filteredBQs
      : filteredBQs.filter(q => q.level === bqLevelFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold tracking-wide">
            <AlertTriangle size={12} />
            <span>FAILURE ANALYSIS</span>
          </div>
          <Badge className="bg-muted text-muted-foreground border text-xs">
            March 2026
          </Badge>
          <Badge className="bg-muted text-muted-foreground border text-xs">
            Community Resource
          </Badge>
        </div>
        <h2 className="text-lg font-bold text-foreground">
          Why Candidates Fail the Meta IC6/IC7 Interview
        </h2>
        <p className="text-xs text-muted-foreground max-w-xl">
          Compiled from candidate reports, Meta engineering blog, NeetCode,
          HelloInterview, igotanoffer, and Taro. This is an independent
          community resource — not affiliated with, endorsed by, or distributed
          by Meta.
        </p>
      </div>

      {/* Progress bar */}
      <div className="prep-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">
            Weak Signal Drills Progress
          </span>
          <span className="text-xs text-muted-foreground">
            {doneDrills}/{totalDrills} completed
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(doneDrills / totalDrills) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Each signal has a targeted drill. Check it off when you've practiced
          it today.
        </p>
      </div>

      {/* The Data */}
      <Section
        title="The Data: Where 80% of Rejections Come From"
        icon={<BarChart3 size={15} className="text-red-400" />}
        badge="Start Here"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Meta's interview process eliminates candidates in three distinct
            failure categories. Understanding the distribution is the first step
            toward fixing the right things.
          </p>
          <div className="space-y-3">
            {FAILURE_DISTRIBUTION.map(r => (
              <div key={r.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${r.textColor}`}>
                    {r.category}
                  </span>
                  <span className={`text-xs font-bold ${r.textColor}`}>
                    {r.share}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${r.color}`}
                    style={{ width: `${r.share}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{r.rootCause}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-400 mb-1">
              Key Insight
            </p>
            <p className="text-xs text-foreground">
              System Design is where most candidates lose, not Coding. The
              majority of preparation time is spent on LeetCode, but the
              majority of rejections happen in the design room.
            </p>
          </div>
        </div>
      </Section>

      {/* Part 1 — System Design */}
      <Section
        title="Part 1 — System Design Failures (42% of Rejections)"
        icon={<Brain size={15} className="text-red-400" />}
        badge="42%"
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The Three Failure Modes
            </p>
            <FailureMode modes={SYSTEM_DESIGN_FAILURE_MODES} />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The 4 Weak Signals — System Design
            </p>
            <div className="space-y-2">
              {SYSTEM_DESIGN_WEAK_SIGNALS.map(s => (
                <WeakSignalCard
                  key={s.id}
                  signal={s}
                  drillDone={!!drillsDone[s.id]}
                  onToggleDrill={() => toggleDrill(s.id)}
                />
              ))}
            </div>
          </div>

          {/* Stress Test Scenarios */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Component Stress-Test Scenarios
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              These are the exact failure cascade scenarios used in real Meta
              interviews. Each one represents a follow-up that IC6/IC7
              candidates must answer fluently.
            </p>
            <div className="flex gap-2 flex-wrap mb-3">
              {Object.keys(STRESS_TEST_SCENARIOS).map(component => (
                <button
                  key={component}
                  onClick={() =>
                    setActiveStressComponent(
                      activeStressComponent === component ? null : component
                    )
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    activeStressComponent === component
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {component}
                </button>
              ))}
            </div>
            {activeStressComponent &&
              STRESS_TEST_SCENARIOS[
                activeStressComponent as keyof typeof STRESS_TEST_SCENARIOS
              ] && (
                <div className="space-y-2">
                  {STRESS_TEST_SCENARIOS[
                    activeStressComponent as keyof typeof STRESS_TEST_SCENARIOS
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                          #{i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs text-foreground">
                            {s.scenario}
                          </p>
                          <button
                            onClick={() =>
                              setRevealedScenario(
                                revealedScenario ===
                                  `${activeStressComponent}-${i}`
                                  ? null
                                  : `${activeStressComponent}-${i}`
                              )
                            }
                            className="text-xs text-amber-400 hover:text-amber-300 mt-1.5 transition-colors"
                          >
                            {revealedScenario ===
                            `${activeStressComponent}-${i}`
                              ? "▲ Hide what's being tested"
                              : "▼ What is the interviewer testing?"}
                          </button>
                          {revealedScenario ===
                            `${activeStressComponent}-${i}` && (
                            <p className="text-xs text-amber-400 mt-1 pl-2 border-l-2 border-amber-500/40">
                              {s.testing}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Real Questions */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Real System Design Questions Asked at Meta
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">
                      Problem
                    </th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-semibold whitespace-nowrap">
                      Level
                    </th>
                    <th className="text-left py-2 text-muted-foreground font-semibold">
                      Key Concepts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REAL_DESIGN_QUESTIONS.map((q, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2 pr-4 text-foreground">{q.problem}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          className={`text-xs border ${q.level === "L7+" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}
                        >
                          {q.level}
                        </Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {q.concepts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      {/* Part 2 — Coding */}
      <Section
        title="Part 2 — Coding Failures (31% of Rejections)"
        icon={<Code2 size={15} className="text-amber-400" />}
        badge="31%"
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The Three Failure Modes
            </p>
            <FailureMode modes={CODING_FAILURE_MODES} />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The 2 Weak Signals — Coding
            </p>
            <div className="space-y-2">
              {CODING_WEAK_SIGNALS.map(s => (
                <WeakSignalCard
                  key={s.id}
                  signal={s}
                  drillDone={!!drillsDone[s.id]}
                  onToggleDrill={() => toggleDrill(s.id)}
                />
              ))}
            </div>
          </div>

          {/* 14 Patterns */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The 14 Core Coding Patterns
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Every Meta coding interview draws from this pattern set. Identify
              the applicable pattern within 2 minutes and state it aloud.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CODING_PATTERNS.map((p, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {p.pattern}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7">
                    {p.keyInsight}
                  </p>
                  <p className="text-xs text-blue-400/70 pl-7 mt-0.5">
                    {p.problems}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Part 3 — Behavioral */}
      <Section
        title="Part 3 — Behavioral Failures (27% of Rejections)"
        icon={<Users size={15} className="text-blue-400" />}
        badge="27%"
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The Three Failure Modes
            </p>
            <FailureMode modes={BEHAVIORAL_FAILURE_MODES} />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              The 2 Weak Signals — Behavioral
            </p>
            <div className="space-y-2">
              {BEHAVIORAL_WEAK_SIGNALS.map(s => (
                <WeakSignalCard
                  key={s.id}
                  signal={s}
                  drillDone={!!drillsDone[s.id]}
                  onToggleDrill={() => toggleDrill(s.id)}
                />
              ))}
            </div>
          </div>

          {/* Full Question Bank */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-xs font-semibold text-foreground">
                The 7 Behavioral Focus Areas — Full Question Bank
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter size={11} className="text-muted-foreground" />
                {(["All", "L5", "L6", "L7"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setBqLevelFilter(l)}
                    className={`text-xs px-2 py-0.5 rounded border transition-all ${
                      bqLevelFilter === l
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Area tabs */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {(
                [
                  "All",
                  "Influence & Conflict",
                  "Ownership & Ambiguity",
                  "Scale & Impact",
                  "Failure & Learning",
                  "XFN Partnership",
                ] as const
              ).map(area => (
                <button
                  key={area}
                  onClick={() => setBqFilter(area as BehavioralArea)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    bqFilter === area
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {levelFilteredBQs.map((q, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      className={`text-xs border shrink-0 ${
                        q.level === "L7"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : q.level === "L6"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {q.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Signal: {q.signal}
                      </p>
                      {bqFilter === "All" && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {q.area}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STAR Story Templates */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Real STAR Story Templates — IC6/IC7 Level
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Model stories at the IC6/IC7 bar. Each demonstrates
              quantification, ownership, and systemic thinking.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STAR_STORIES.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedStory(expandedStory === i ? null : i)
                    }
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {s.title}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {s.tags.map(t => (
                          <span
                            key={t}
                            className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {expandedStory === i ? (
                      <ChevronUp
                        size={13}
                        className="text-muted-foreground shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={13}
                        className="text-muted-foreground shrink-0"
                      />
                    )}
                  </button>
                  {expandedStory === i && (
                    <div className="px-3 pb-3 space-y-1.5 border-t border-border/50">
                      {[
                        { label: "S", value: s.s },
                        { label: "T", value: s.t },
                        { label: "A", value: s.a },
                        { label: "R", value: s.r },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-2 pt-1.5">
                          <span className="text-xs font-bold text-blue-400 w-4 shrink-0">
                            {label}:
                          </span>
                          <span className="text-xs text-foreground">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Part 4 — Persona Stress Tests */}
      <Section
        title="Part 4 — The 5 Interviewer Personas"
        icon={<Target size={15} className="text-purple-400" />}
        badge="Stress Tests"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            The Persona Stress Test simulates the 5 most common interviewer
            archetypes at Meta. Candidates who have only practiced in "friendly"
            conditions fail when they encounter these personas in real
            interviews.
          </p>

          {/* Live Persona Simulator */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Live Simulator — Practice Against Any Persona
            </p>
            <InterviewerPersonaStressTest />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONAS.map(p => (
              <div
                key={p.id}
                className={`rounded-xl border overflow-hidden ${p.color}`}
              >
                <button
                  onClick={() =>
                    setActivePersona(activePersona === p.id ? null : p.id)
                  }
                  className="w-full flex items-center gap-3 p-3 text-left hover:opacity-90 transition-opacity"
                >
                  <span className="text-2xl shrink-0">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${p.headerColor}`}>
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.behavior}
                    </p>
                  </div>
                  {activePersona === p.id ? (
                    <ChevronUp
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                  )}
                </button>
                {activePersona === p.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/30">
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-foreground mb-1">
                        What they're testing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.testing}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <p className="text-xs font-semibold text-emerald-400 mb-1">
                        How to survive
                      </p>
                      <p className="text-xs text-foreground">{p.survival}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Part 5 — 22% Down-Leveling */}
      <Section
        title="Part 5 — The 22% Down-Leveling Problem"
        icon={<TrendingDown size={15} className="text-orange-400" />}
        badge="22% of L6/L7"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
            <p className="text-xs font-semibold text-orange-400 mb-1">
              The Root Cause
            </p>
            <p className="text-xs text-foreground">
              Beyond outright rejection, 22% of L6/L7 candidates are
              down-leveled to L5 because their stories read at the wrong
              seniority level. Candidates tell stories about what they{" "}
              <em>built</em>, not about the decisions they made and the scope
              they influenced.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">
                    Level
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">
                    Story Focus
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">
                    Scope
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-semibold">
                    What the Interviewer Hears
                  </th>
                </tr>
              </thead>
              <tbody>
                {DOWN_LEVEL_TABLE.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className={`py-2.5 pr-4 font-bold ${row.color}`}>
                      {row.level}
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">{row.focus}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {row.scope}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {row.signal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
            <p className="text-xs font-semibold text-blue-400 mb-1">The Fix</p>
            <p className="text-xs text-foreground">
              For every story in your STAR bank, ask: "Am I describing what I
              built, or am I describing the decision I made and why?" If the
              answer is "what I built", reframe the story around the decision,
              the trade-offs you considered, and the org-level impact.
            </p>
          </div>
        </div>
      </Section>

      {/* Part 6 — Process Weak Signals */}
      <Section
        title="Part 6 — Process Weak Signals (Signals 9 & 10)"
        icon={<Zap size={15} className="text-teal-400" />}
        badge="Cross-Cutting"
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Two signals cut across all three interview types.
          </p>
          {PROCESS_WEAK_SIGNALS.map(s => (
            <WeakSignalCard
              key={s.id}
              signal={s}
              drillDone={!!drillsDone[s.id]}
              onToggleDrill={() => toggleDrill(s.id)}
            />
          ))}
        </div>
      </Section>

      {/* Part 7 — Tools Map */}
      <Section
        title="Part 7 — 10 Tools That Fix These Failure Modes"
        icon={<Wrench size={15} className="text-violet-400" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Each tool in the guide targets a specific failure mode from the data
            above.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOOLS_MAP.map((t, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {t.tool}
                  </span>
                  <Badge className="bg-muted text-muted-foreground border text-xs shrink-0">
                    {t.tab}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.fixes}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Summary Fix Table */}
      <Section
        title="Summary: The Fix for Each Failure Mode"
        icon={<BookOpen size={15} className="text-emerald-400" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">
                    Failure Mode
                  </th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-semibold whitespace-nowrap">
                    % of Rejections
                  </th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">
                    Primary Fix
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-semibold">
                    Secondary Fix
                  </th>
                </tr>
              </thead>
              <tbody>
                {SUMMARY_TABLE.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-foreground">{row.mode}</td>
                    <td className="py-2 pr-3">
                      <Badge className="bg-muted text-muted-foreground border text-xs whitespace-nowrap">
                        {row.pct}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-emerald-400">
                      {row.primary}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {row.secondary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}
