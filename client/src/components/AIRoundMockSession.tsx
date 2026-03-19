/**
 * AIRoundMockSession — 60-minute timed mock for Meta's AI-Enabled Coding Round.
 * Mirrors the real CoderPad format: one thematic problem with 3 phases (Bug Fix → Feature → Optimize).
 * Evaluates all 4 lenses: Problem Solving, Code Development, Verification & Debugging, Technical Communication.
 * Also scores AI Tool Usage.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useXPContext } from "@/contexts/XPContext";
import {
  Bug, PlusCircle, TrendingUp, Clock, Play, Square, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Lightbulb, RotateCcw, Target, Brain,
  Code2, ShieldCheck, MessageSquare, Zap, Trophy, BookOpen, Copy, Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Phase {
  type: "bug-fix" | "feature" | "optimize";
  title: string;
  description: string;
  hint: string;
  timeTarget: string;
}

interface MockProblem {
  id: string;
  title: string;
  difficulty: "Medium" | "Hard";
  domain: string;
  estimatedTime: string;
  scenario: string;
  codeContext: string;
  phases: Phase[];
  aiTips: string[];
  followUps: string[];
}

// ── localStorage helpers ───────────────────────────────────────────────────────
const AI_MOCK_HISTORY_KEY = "ai_mock_session_history";

interface AISessionHistoryEntry {
  id: string;
  problemTitle: string;
  difficulty: "Medium" | "Hard";
  domain: string;
  verdict: "Strong Hire" | "Hire" | "Borderline" | "No Hire";
  problemSolvingScore: number;
  codeDevelopmentScore: number;
  verificationScore: number;
  communicationScore: number;
  aiToolUsageScore: number;
  targetLevel: "IC6" | "IC7";
  date: string;
  elapsedSeconds: number;
}

function loadAIHistory(): AISessionHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AI_MOCK_HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveAIHistory(entries: AISessionHistoryEntry[]) {
  localStorage.setItem(AI_MOCK_HISTORY_KEY, JSON.stringify(entries.slice(-50)));
}

// ── Problem data (mirrors AIMockProblemBank) ───────────────────────────────────
const PROBLEMS: MockProblem[] = [
  {
    id: "lru-cache",
    title: "LRU Cache Service",
    difficulty: "Hard",
    domain: "Data Structures",
    estimatedTime: "45 min",
    scenario: "You're working on a caching layer for Meta's feed ranking service. The existing LRUCache class has a bug causing stale data to be served. You need to fix it, add TTL support, and optimize for concurrent reads.",
    codeContext: `class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head = Node(0, 0)  # dummy head (most recent)
        self.tail = Node(0, 0)  # dummy tail (least recent)
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._insert(node)  # BUG: should move to front
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._insert(node)
        if len(self.cache) > self.cap:
            lru = self.tail.prev  # BUG: should evict from tail
            self._remove(lru)
            del self.cache[lru.key]

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev  # BUG: missing line

    def _insert(self, node):  # inserts after head
        node.prev = self.head
        node.next = self.head.next
        self.head.next = node`,
    phases: [
      { type: "bug-fix", title: "Fix the 3 bugs in LRUCache", description: "There are exactly 3 bugs in the implementation above. Find and fix all of them. The cache should correctly maintain LRU order and evict the least recently used item when at capacity.", hint: "_remove() is missing one pointer update. _insert() is missing one pointer update. The eviction logic removes from the wrong end.", timeTarget: "10 min" },
      { type: "feature", title: "Add TTL (Time-To-Live) support", description: "Extend the cache to support optional TTL per key. A get() on an expired key should return -1 and remove the key. put(key, val, ttl=None) where ttl is seconds. Expired keys should not count toward capacity.", hint: "Store expiry timestamps alongside values. Check expiry on get(). Consider lazy vs. eager expiration.", timeTarget: "15 min" },
      { type: "optimize", title: "Optimize for read-heavy workloads", description: "The cache is read 100x more than written. Discuss and implement a strategy to reduce lock contention. Consider: read-through caching, approximate LRU (segmented), or a lock-free approach. What are the tradeoffs?", hint: "Segmented LRU (SLRU) divides cache into probationary and protected segments. Discuss write-lock vs. read-lock granularity.", timeTarget: "15 min" },
    ],
    aiTips: ["Ask the AI to explain what each method should do before reading the code", "Use the AI to generate test cases for edge cases (capacity=1, duplicate keys)", "Ask the AI to verify your fix before moving to the next phase"],
    followUps: ["How would you make this thread-safe?", "What if capacity needs to change dynamically?", "How does this differ from LFU cache?"],
  },
  {
    id: "rate-limiter",
    title: "API Rate Limiter",
    difficulty: "Medium",
    domain: "System Design + Coding",
    estimatedTime: "45 min",
    scenario: "Meta's API gateway needs a rate limiter. The existing token bucket implementation has a race condition and doesn't handle burst traffic correctly. You need to fix it, add sliding window support, and make it distributed-ready.",
    codeContext: `import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.last_refill = time.time()

    def allow_request(self, user_id: str) -> bool:
        self._refill()
        if self.tokens > 0:
            self.tokens -= 1  # BUG: race condition
            return True
        return False

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        # BUG: tokens can exceed capacity
        self.tokens += elapsed * self.refill_rate
        self.last_refill = now`,
    phases: [
      { type: "bug-fix", title: "Fix the race condition and overflow bug", description: "Fix the two bugs: (1) the race condition in allow_request, and (2) tokens exceeding capacity in _refill. The solution should be correct for single-threaded use first, then discuss thread safety.", hint: "Use min() to cap tokens at capacity. For thread safety, consider threading.Lock() or atomic operations.", timeTarget: "10 min" },
      { type: "feature", title: "Add sliding window rate limiting", description: "Implement a SlidingWindowRateLimiter class that allows at most N requests per user in the last T seconds. This is more accurate than token bucket for bursty traffic. Use a deque to track timestamps.", hint: "Store a deque of timestamps per user. On each request, remove timestamps older than T seconds, then check if len(deque) < N.", timeTarget: "15 min" },
      { type: "optimize", title: "Make it distributed with Redis", description: "Describe how you'd implement this rate limiter across multiple API servers using Redis. Sketch the Redis data structure and the Lua script (or MULTI/EXEC transaction) needed for atomic check-and-increment. What are the failure modes?", hint: "Redis INCR + EXPIRE for fixed window. For sliding window, use a sorted set with timestamps as scores. Lua script ensures atomicity.", timeTarget: "15 min" },
    ],
    aiTips: ["Ask the AI to write unit tests for the fixed version", "Use the AI to generate the Redis Lua script skeleton", "Ask the AI to compare token bucket vs. sliding window tradeoffs"],
    followUps: ["How do you handle Redis unavailability?", "What's the memory cost per user for sliding window?", "How would you rate limit by IP vs. user ID?"],
  },
  {
    id: "task-scheduler",
    title: "Async Task Scheduler",
    difficulty: "Hard",
    domain: "Concurrency + Data Structures",
    estimatedTime: "45 min",
    scenario: "Meta's notification system uses a task scheduler to send delayed notifications. The existing implementation has a priority inversion bug and doesn't handle task cancellation. You need to fix it, add cancellation, and optimize for millions of tasks.",
    codeContext: `import heapq
import time
from typing import Callable

class TaskScheduler:
    def __init__(self):
        self.heap = []  # (run_at, task_id, fn)
        self.counter = 0
        self.cancelled = set()

    def schedule(self, fn: Callable, delay_ms: int) -> int:
        run_at = time.time() + delay_ms / 1000
        task_id = self.counter
        self.counter += 1
        # BUG: heap comparison fails if fn is not comparable
        heapq.heappush(self.heap, (run_at, task_id, fn))
        return task_id

    def cancel(self, task_id: int) -> bool:
        # BUG: doesn't actually remove from heap
        self.cancelled.add(task_id)
        return True

    def run_pending(self):
        now = time.time()
        while self.heap and self.heap[0][0] <= now:
            run_at, task_id, fn = heapq.heappop(self.heap)
            if task_id not in self.cancelled:
                fn()  # BUG: exceptions crash the scheduler`,
    phases: [
      { type: "bug-fix", title: "Fix the 3 bugs in TaskScheduler", description: "Fix: (1) heap comparison error when two tasks have the same run_at time, (2) cancel() doesn't prevent execution (lazy deletion is fine but explain it), (3) unhandled exceptions in fn() crash the scheduler.", hint: "Use (run_at, task_id, fn) — task_id breaks ties since it's unique. Wrap fn() in try/except. Lazy deletion via cancelled set is acceptable.", timeTarget: "12 min" },
      { type: "feature", title: "Add recurring tasks", description: "Add schedule_recurring(fn, interval_ms) that runs fn every interval_ms milliseconds until cancelled. Return a task_id that can be used to cancel the recurring task. The task should re-schedule itself after each execution.", hint: "After executing, push a new entry to the heap with run_at = now + interval_ms. Store the interval alongside the task.", timeTarget: "15 min" },
      { type: "optimize", title: "Scale to millions of tasks", description: "The current heap works for thousands of tasks but not millions. Discuss: (1) hierarchical timing wheels as an alternative, (2) how to partition tasks across worker threads, (3) what data structure change would reduce memory by 10x for recurring tasks.", hint: "Timing wheels use O(1) insert/delete vs O(log n) for heap. Partition by task_id % num_workers. Recurring tasks only need one heap entry.", timeTarget: "15 min" },
    ],
    aiTips: ["Ask the AI to explain timing wheels before the optimize phase", "Use the AI to generate a stress test with 10,000 concurrent tasks", "Ask the AI to identify any remaining edge cases after your fix"],
    followUps: ["How do you handle clock drift in distributed schedulers?", "What's the difference between a task queue and a scheduler?", "How would you persist tasks across restarts?"],
  },
  {
    id: "graph-friends",
    title: "Friend Recommendation Engine",
    difficulty: "Medium",
    domain: "Graphs",
    estimatedTime: "45 min",
    scenario: "Meta's friend recommendation system suggests 'People You May Know' based on mutual friends. The existing BFS implementation has a bug causing duplicate recommendations and is too slow for large graphs. Fix it, add ranking by mutual count, and optimize.",
    codeContext: `from collections import defaultdict, deque

class FriendGraph:
    def __init__(self):
        self.adj = defaultdict(set)

    def add_friendship(self, u: int, v: int):
        self.adj[u].add(v)
        self.adj[v].add(u)

    def recommend(self, user: int, max_results: int = 10):
        visited = {user}
        candidates = {}  # user_id -> mutual_count
        queue = deque([(user, 0)])
        while queue:
            node, depth = queue.popleft()
            if depth >= 2:
                continue
            for neighbor in self.adj[node]:
                if neighbor not in visited:
                    # BUG: counts mutuals incorrectly
                    candidates[neighbor] = candidates.get(neighbor, 0) + 1
                    visited.add(neighbor)  # BUG: prevents counting all mutuals
                    if depth + 1 < 2:
                        queue.append((neighbor, depth + 1))
        for friend in self.adj[user]:
            candidates.pop(friend, None)
        return sorted(candidates, key=lambda x: -candidates[x])[:max_results]`,
    phases: [
      { type: "bug-fix", title: "Fix the mutual friend counting bugs", description: "The BFS approach has 3 bugs: (1) adding to visited too early prevents counting all mutual paths, (2) the mutual count logic is wrong, (3) the direct friend removal may have an off-by-one. Fix all three so recommendations are correctly ranked by mutual friend count.", hint: "Don't add depth-2 nodes to visited during BFS — just collect them. Count mutuals as: for each friend-of-friend, count how many of user's friends are also their friends.", timeTarget: "12 min" },
      { type: "feature", title: "Add 'People in Same Group' recommendations", description: "Extend the system to also recommend users who share a group (e.g., workplace, school) but aren't yet friends. Add add_group(user, group_id) and update recommend() to include group-based suggestions with a lower weight than mutual friends.", hint: "Maintain a group_members dict. For each group the user belongs to, iterate members and add them as candidates with weight 0.5 (vs 1.0 for mutual friends).", timeTarget: "15 min" },
      { type: "optimize", title: "Scale to 3 billion users", description: "The current in-memory graph doesn't scale. Discuss: (1) how Meta actually stores the social graph (TAO), (2) how you'd shard the adjacency list, (3) how you'd precompute friend-of-friend counts offline vs. online, (4) what approximate algorithms (MinHash, SimHash) could help.", hint: "TAO is a distributed cache over MySQL. Shard by user_id % num_shards. Precompute FOF counts nightly via MapReduce. MinHash approximates Jaccard similarity of friend sets.", timeTarget: "15 min" },
    ],
    aiTips: ["Ask the AI to draw the graph for a small test case to verify your fix", "Use the AI to explain TAO (Meta's social graph storage) before the optimize phase", "Ask the AI to write a correctness test comparing your fix against a brute-force solution"],
    followUps: ["How do you handle privacy (blocked users, private accounts)?", "What if the graph has 1 billion edges?", "How would you A/B test recommendation quality?"],
  },
  {
    id: "news-feed",
    title: "News Feed Aggregator",
    difficulty: "Hard",
    domain: "System Design + Heaps",
    estimatedTime: "45 min",
    scenario: "Meta's news feed merges posts from thousands of followed accounts, sorted by recency. The existing merge is too slow for users following 5,000+ accounts. Fix the memory leak, add pagination, and optimize with a k-way merge.",
    codeContext: `from typing import List
import heapq

class NewsFeed:
    def __init__(self):
        self.user_posts = {}  # user_id -> list of Posts (sorted desc by timestamp)
        self.follows = {}     # user_id -> set of followed user_ids

    def post(self, user_id: int, content: str, timestamp: int) -> int:
        post = Post(len(self.user_posts), user_id, timestamp, content)
        if user_id not in self.user_posts:
            self.user_posts[user_id] = []
        self.user_posts[user_id].append(post)
        # BUG: list grows unbounded, no eviction
        return post.post_id

    def get_feed(self, user_id: int, limit: int = 10) -> List[Post]:
        all_posts = []
        for followed_id in self.follows.get(user_id, set()):
            all_posts.extend(self.user_posts.get(followed_id, []))
        # BUG: O(n log n) where n = total posts across all followed users
        return sorted(all_posts, key=lambda p: -p.timestamp)[:limit]`,
    phases: [
      { type: "bug-fix", title: "Fix the memory leak and add post eviction", description: "The user_posts list grows unbounded. Fix it by keeping only the last N posts per user (e.g., N=1000). Also fix the missing self-follow (a user should see their own posts in their feed).", hint: "Use a deque with maxlen=1000 or trim the list after each append. Add user_id to their own follows set on first post.", timeTarget: "10 min" },
      { type: "feature", title: "Implement k-way merge for efficient feed generation", description: "Replace the O(n log n) sort with a k-way merge using a min-heap. Each followed user's posts are already sorted by timestamp (descending). Use a heap of size k (number of followed users) to merge them in O(limit * log k) time.", hint: "Push the most recent post from each followed user onto a max-heap (negate timestamp for min-heap). Pop the top, push the next post from that user's list.", timeTarget: "18 min" },
      { type: "optimize", title: "Add cursor-based pagination", description: "The current get_feed() always starts from the beginning. Add get_feed(user_id, limit, cursor=None) where cursor is the timestamp of the last seen post. The next page should return posts with timestamp < cursor. How do you handle new posts inserted between pages?", hint: "Pass cursor as a timestamp. In the k-way merge, skip posts with timestamp >= cursor. New posts between pages are a known tradeoff — document it.", timeTarget: "15 min" },
    ],
    aiTips: ["Ask the AI to explain k-way merge with a diagram before implementing", "Use the AI to generate test data: 100 users each with 50 posts", "Ask the AI to compare push vs. pull feed architectures"],
    followUps: ["How does Meta's actual feed ranking work (EdgeRank)?", "What's the fanout problem for celebrity accounts?", "How would you add real-time updates (WebSockets)?"],
  },
  {
    id: "autocomplete",
    title: "Search Autocomplete System",
    difficulty: "Hard",
    domain: "Tries + Heaps",
    estimatedTime: "45 min",
    scenario: "Meta's search bar needs autocomplete suggestions ranked by query frequency. The existing Trie implementation is correct but returns results in arbitrary order and doesn't handle typos. Fix the ranking, add fuzzy matching, and optimize memory.",
    codeContext: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.freq = 0
        self.top3 = []  # BUG: not maintained correctly

class AutocompleteSystem:
    def __init__(self, sentences: list, times: list):
        self.root = TrieNode()
        self.current_input = ""
        for s, t in zip(sentences, times):
            self._insert(s, t)

    def _insert(self, sentence: str, freq: int):
        node = self.root
        for ch in sentence:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            # BUG: top3 not updated during insert
        node.is_end = True
        node.freq += freq

    def input(self, c: str) -> list:
        if c == '#':
            self._insert(self.current_input, 1)
            self.current_input = ""
            return []
        self.current_input += c
        node = self.root
        for ch in self.current_input:
            if ch not in node.children:
                return []  # BUG: should still record the input
            node = node.children[ch]
        return self._get_top3(node)

    def _get_top3(self, node: TrieNode) -> list:
        # BUG: DFS collects all results then sorts — O(n log n)
        results = []
        self._dfs(node, self.current_input, results)
        return sorted(results, key=lambda x: (-x[1], x[0]))[:3]`,
    phases: [
      { type: "bug-fix", title: "Fix top-3 maintenance and input recording", description: "Fix two bugs: (1) when input() reaches a node with no children, it should still record the partial input for future '#' insertion, (2) the top3 list on each node should be maintained during insert so _get_top3 doesn't need a full DFS.", hint: "Track the current node separately from the traversal. Update top3 on each node during insert by keeping a sorted list of size 3.", timeTarget: "12 min" },
      { type: "feature", title: "Add fuzzy matching (1 typo tolerance)", description: "Extend the system to return suggestions even when the input has 1 character substitution error. For example, 'helo' should match 'hello'. Implement a DFS that allows at most 1 mismatch.", hint: "Add a max_errors parameter to the DFS. At each node, try both the exact match (errors unchanged) and any other character (errors - 1). Stop when errors < 0.", timeTarget: "18 min" },
      { type: "optimize", title: "Reduce memory with compressed Trie (Patricia Trie)", description: "The current Trie uses one node per character. For long sentences, this wastes memory. Describe how a Patricia Trie (radix tree) compresses chains of single-child nodes into edge labels. What's the memory reduction for a 1M-sentence dataset?", hint: "Merge chains: if a node has exactly one child and is not an end node, merge it with its child. Store the merged string as the edge label.", timeTarget: "12 min" },
    ],
    aiTips: ["Ask the AI to trace through a small example to verify your top3 maintenance logic", "Use the AI to explain edit distance before implementing fuzzy matching", "Ask the AI to estimate memory usage for both Trie variants"],
    followUps: ["How do you handle multilingual autocomplete?", "How would you personalize suggestions per user?", "What's the latency budget for autocomplete at Meta scale?"],
  },
  {
    id: "event-stream",
    title: "Real-Time Event Stream Processor",
    difficulty: "Medium",
    domain: "Sliding Window + Design",
    estimatedTime: "45 min",
    scenario: "Meta's analytics pipeline processes a stream of user events (clicks, views, shares) and needs to compute rolling statistics. The existing implementation has an off-by-one error and doesn't handle out-of-order events. Fix it, add anomaly detection, and make it fault-tolerant.",
    codeContext: `from collections import deque
from typing import Optional

class EventStreamProcessor:
    def __init__(self, window_size_ms: int):
        self.window_size = window_size_ms
        self.events = deque()  # (timestamp, event_type, user_id)
        self.counts = {}       # event_type -> count in window

    def add_event(self, timestamp: int, event_type: str, user_id: str):
        self.events.append((timestamp, event_type, user_id))
        self.counts[event_type] = self.counts.get(event_type, 0) + 1
        self._evict(timestamp)  # BUG: evicts before adding

    def _evict(self, current_time: int):
        while self.events and self.events[0][0] < current_time - self.window_size:
            _, event_type, _ = self.events.popleft()
            self.counts[event_type] -= 1  # BUG: can go negative

    def get_count(self, event_type: str) -> int:
        return self.counts.get(event_type, 0)`,
    phases: [
      { type: "bug-fix", title: "Fix the eviction order and count underflow", description: "Fix two bugs: (1) _evict() is called before the new event is added, causing the window to be stale, (2) counts can go negative if an event type is evicted more times than it was added. Also fix the off-by-one: use <= vs < for window boundary.", hint: "Call _evict() after appending. Use max(0, count - 1) or only decrement if count > 0. Use current_time - window_size (inclusive) for the boundary.", timeTarget: "10 min" },
      { type: "feature", title: "Add anomaly detection", description: "Add detect_anomaly(event_type, threshold_multiplier=3.0) that returns True if the current count for event_type is more than threshold_multiplier standard deviations above the rolling average. Maintain a rolling average and variance for each event type.", hint: "Keep a sliding window of per-minute counts. Compute mean and std. If current > mean + threshold * std, it's an anomaly. Use Welford's online algorithm for variance.", timeTarget: "18 min" },
      { type: "optimize", title: "Handle out-of-order events and fault tolerance", description: "The current implementation assumes events arrive in timestamp order. Discuss: (1) how to handle late-arriving events (up to 5 seconds late), (2) how to make the processor fault-tolerant (checkpoint + replay), (3) how this maps to Apache Flink's watermark concept.", hint: "Allow events within a grace period. Use a sorted structure (SortedList or heap) for out-of-order insertion. Checkpoint state to durable storage periodically.", timeTarget: "15 min" },
    ],
    aiTips: ["Ask the AI to generate a test with out-of-order events before the optimize phase", "Use the AI to explain Welford's algorithm before implementing anomaly detection", "Ask the AI to compare this to Apache Kafka Streams windowing"],
    followUps: ["How do you handle duplicate events?", "What's the memory cost for 1M event types?", "How would you scale this to 1M events/second?"],
  },
  {
    id: "distributed-counter",
    title: "Distributed Like Counter",
    difficulty: "Medium",
    domain: "Distributed Systems + Design",
    estimatedTime: "45 min",
    scenario: "Meta's 'Like' button needs a distributed counter that handles millions of concurrent increments. The existing implementation has a lost-update bug and doesn't handle network partitions. Fix it, add idempotency, and design for eventual consistency.",
    codeContext: `import threading

class LikeCounter:
    def __init__(self):
        self.counts = {}  # post_id -> count
        self.lock = threading.Lock()

    def like(self, post_id: str, user_id: str) -> int:
        # BUG: non-atomic read-modify-write
        count = self.counts.get(post_id, 0)
        self.counts[post_id] = count + 1
        return self.counts[post_id]

    def unlike(self, post_id: str, user_id: str) -> int:
        count = self.counts.get(post_id, 0)
        # BUG: can go negative
        self.counts[post_id] = count - 1
        return self.counts[post_id]

    def get_count(self, post_id: str) -> int:
        return self.counts.get(post_id, 0)`,
    phases: [
      { type: "bug-fix", title: "Fix the race condition and negative count bug", description: "Fix two bugs: (1) the non-atomic read-modify-write in like() and unlike() creates a race condition under concurrent access, (2) unlike() can produce negative counts if called without a prior like(). The lock exists but isn't used.", hint: "Use 'with self.lock:' to wrap the read-modify-write. Use max(0, count - 1) for unlike(). Track per-user likes to prevent double-liking.", timeTarget: "10 min" },
      { type: "feature", title: "Add idempotency (prevent double-likes)", description: "A user should only be able to like a post once. Add a liked_by dict mapping post_id -> set of user_ids. like() should be a no-op if the user already liked it. unlike() should only decrement if the user actually liked it.", hint: "Use a defaultdict(set) for liked_by. Check membership before incrementing. Remove from set on unlike. This also makes the operation idempotent for retries.", timeTarget: "15 min" },
      { type: "optimize", title: "Design for distributed eventual consistency", description: "The current in-memory counter doesn't scale. Design a distributed like counter: (1) use Redis INCR for atomic increments, (2) describe how you'd handle network partitions (CAP theorem choice), (3) explain how Meta's actual counter works (approximate counting with HyperLogLog or sharded counters).", hint: "Redis INCR is atomic. For partitions, choose AP (availability + partition tolerance) — eventual consistency is fine for like counts. Sharded counters: N shards, each handles 1/N of traffic, sum for reads.", timeTarget: "18 min" },
    ],
    aiTips: ["Ask the AI to write a concurrent test that exposes the race condition", "Use the AI to explain HyperLogLog before the optimize phase", "Ask the AI to compare Redis INCR vs. database atomic update approaches"],
    followUps: ["How do you handle the thundering herd on viral posts?", "What's the consistency model for like counts on Facebook?", "How would you implement 'reactions' (love, haha, wow) on top of this?"],
  },
];

// ── Phase icon helper ──────────────────────────────────────────────────────────
const PHASE_ICONS = {
  "bug-fix": <Bug size={14} />,
  "feature": <PlusCircle size={14} />,
  "optimize": <TrendingUp size={14} />,
};
const PHASE_COLORS = {
  "bug-fix": "bg-red-100 text-red-700 border-red-200",
  "feature": "bg-blue-100 text-blue-700 border-blue-200",
  "optimize": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// ── Radar chart (SVG, no external deps) ───────────────────────────────────────
function RadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  const N = scores.length;
  const cx = 100, cy = 100, r = 70;
  const angleStep = (2 * Math.PI) / N;
  const getPoint = (i: number, radius: number) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const dataPoints = scores.map((s, i) => getPoint(i, (s.value / 5) * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
      {gridLevels.map((level) => {
        const pts = scores.map((_, i) => getPoint(i, level * r));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
        return <path key={level} d={path} fill="none" stroke="#e5e7eb" strokeWidth="0.8" />;
      })}
      {scores.map((_, i) => {
        const outer = getPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e5e7eb" strokeWidth="0.8" />;
      })}
      <path d={dataPath} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="1.5" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />)}
      {scores.map((s, i) => {
        const labelPt = getPoint(i, r + 18);
        return (
          <text key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="#374151" fontWeight="600">
            {s.label.split(" ").map((w, wi) => (
              <tspan key={wi} x={labelPt.x} dy={wi === 0 ? 0 : 9}>{w}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, score, feedback, icon }: { label: string; score: number; feedback: string; icon: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 text-left group">
        <span className="text-gray-500 flex-shrink-0">{icon}</span>
        <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
        <span className={`text-xs font-bold ${score >= 4 ? "text-emerald-600" : score >= 3 ? "text-amber-600" : "text-red-600"}`}>{score}/5</span>
        {open ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </button>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {open && feedback && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 leading-relaxed">{feedback}</p>
      )}
    </div>
  );
}

// ── Verdict badge ──────────────────────────────────────────────────────────────
const VERDICT_STYLES: Record<string, string> = {
  "Strong Hire": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Hire": "bg-blue-100 text-blue-800 border-blue-300",
  "Borderline": "bg-amber-100 text-amber-800 border-amber-300",
  "No Hire": "bg-red-100 text-red-800 border-red-300",
};

// ── Main component ─────────────────────────────────────────────────────────────
type Phase_ = "setup" | "session" | "debrief";

export default function AIRoundMockSession() {
  const { addXP } = useXPContext();
  const [phase, setPhase] = useState<Phase_>("setup");
  const [selectedProblem, setSelectedProblem] = useState<MockProblem | null>(null);
  const [randomize, setRandomize] = useState(false);
  const [targetLevel, setTargetLevel] = useState<"IC6" | "IC7">("IC6");
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseAnswers, setPhaseAnswers] = useState<string[]>(["", "", ""]);
  const [workflowNotes, setWorkflowNotes] = useState("");
  const [aiUsageNotes, setAiUsageNotes] = useState("");
  const [showHint, setShowHint] = useState<boolean[]>([false, false, false]);
  const [showCode, setShowCode] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  // Timer
  const TOTAL_SECONDS = 60 * 60; // 60 minutes
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  // Debrief
  const debrief = trpc.aiRound.debrief.useMutation();
  const [debriefResult, setDebriefResult] = useState<typeof debrief.data | null>(null);

  // Timer effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) + elapsedRef.current;
      const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        setTimerRunning(false);
        handleEndSession(elapsed);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const startSession = useCallback(() => {
    const problem = randomize
      ? PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)]
      : selectedProblem;
    if (!problem) return;
    setSelectedProblem(problem);
    setPhase("session");
    setCurrentPhaseIdx(0);
    setPhaseAnswers(["", "", ""]);
    setWorkflowNotes("");
    setAiUsageNotes("");
    setShowHint([false, false, false]);
    setTimeLeft(TOTAL_SECONDS);
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
    setTimerRunning(true);
  }, [randomize, selectedProblem]);

  const handleEndSession = useCallback(async (elapsedSeconds?: number) => {
    if (!selectedProblem) return;
    setTimerRunning(false);
    const elapsed = elapsedSeconds ?? (TOTAL_SECONDS - timeLeft);
    elapsedRef.current = elapsed;
    setPhase("debrief");
    const result = await debrief.mutateAsync({
      problemTitle: selectedProblem.title,
      problemScenario: selectedProblem.scenario,
      phases: selectedProblem.phases.map((p, i) => ({
        type: p.type,
        title: p.title,
        answer: phaseAnswers[i] || "",
      })),
      workflowNotes,
      aiUsageNotes,
      targetLevel,
      elapsedSeconds: elapsed,
    });
    setDebriefResult(result);
    // Persist to history
    if (result) {
      const entry: AISessionHistoryEntry = {
        id: `${Date.now()}`,
        problemTitle: selectedProblem.title,
        difficulty: selectedProblem.difficulty,
        domain: selectedProblem.domain,
        verdict: result.icLevelVerdict,
        problemSolvingScore: result.problemSolvingScore,
        codeDevelopmentScore: result.codeDevelopmentScore,
        verificationScore: result.verificationScore,
        communicationScore: result.communicationScore,
        aiToolUsageScore: result.aiToolUsageScore,
        targetLevel,
        date: new Date().toLocaleDateString(),
        elapsedSeconds: elapsed,
      };
      const history = loadAIHistory();
      saveAIHistory([...history, entry]);
      // Award XP for completing an AI mock session
      const verdict = result.icLevelVerdict;
      const isFirstMock = loadAIHistory().length <= 1;
      if (isFirstMock) {
        addXP('first_mock', `First AI Mock: ${selectedProblem.title}`);
      } else {
        // Bonus XP for strong performance
        const bonus = verdict === 'Strong Hire' ? 20 : verdict === 'Hire' ? 10 : 0;
        addXP('ai_mock', `AI Mock (${verdict}): ${selectedProblem.title}`, 40 + bonus);
      }
    }
  }, [selectedProblem, phaseAnswers, workflowNotes, aiUsageNotes, targetLevel, timeLeft, debrief, addXP]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = timeLeft < 300 ? "text-red-600" : timeLeft < 900 ? "text-amber-600" : "text-emerald-600";

  // ── Setup phase ──────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-900 to-indigo-900 rounded-xl text-white">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Target size={20} className="text-violet-200" />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              AI-Enabled Round Mock Session
            </h3>
            <p className="text-xs text-violet-200 mt-0.5">
              60 min · 3 phases (Bug Fix → Feature → Optimize) · 4 evaluation lenses + AI tool usage
            </p>
          </div>
        </div>

        {/* IC Level */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-800">Target IC Level</h4>
          <div className="flex gap-2">
            {(["IC6", "IC7"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setTargetLevel(lvl)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  targetLevel === lvl
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                }`}
              >
                {lvl === "IC6" ? "IC6 — Senior Engineer" : "IC7 — Staff Engineer"}
              </button>
            ))}
          </div>
        </div>

        {/* Problem picker */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">Choose a Problem</h4>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={randomize}
                onChange={(e) => setRandomize(e.target.checked)}
                className="rounded"
              />
              🎲 Random
            </label>
          </div>
          {!randomize && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROBLEMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProblem(p)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedProblem?.id === p.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-violet-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800">{p.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      p.difficulty === "Hard" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>{p.difficulty}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{p.domain}</p>
                </button>
              ))}
            </div>
          )}
          {randomize && (
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700 text-center">
              A random problem will be selected when you start the session.
            </div>
          )}
        </div>

        {/* 4 lenses reminder */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: <Brain size={14} />, label: "Problem Solving", color: "text-blue-600 bg-blue-50 border-blue-200" },
            { icon: <Code2 size={14} />, label: "Code Development", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
            { icon: <ShieldCheck size={14} />, label: "Verification", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { icon: <MessageSquare size={14} />, label: "Communication", color: "text-amber-600 bg-amber-50 border-amber-200" },
          ].map((l) => (
            <div key={l.label} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${l.color}`}>
              {l.icon} {l.label}
            </div>
          ))}
        </div>

        <button
          onClick={startSession}
          disabled={!randomize && !selectedProblem}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Play size={16} /> Start 60-Minute Mock Session
        </button>
      </div>
    );
  }

  // ── Session phase ────────────────────────────────────────────────────────────
  if (phase === "session" && selectedProblem) {
    const currentP = selectedProblem.phases[currentPhaseIdx];
    return (
      <div className="space-y-4">
        {/* Timer bar */}
        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-xl text-white">
          <div className="flex items-center gap-2">
            <Clock size={16} className={timerColor} />
            <span className={`font-mono font-bold text-lg ${timerColor}`}>{formatTime(timeLeft)}</span>
            <span className="text-xs text-gray-400">remaining</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 font-semibold">{selectedProblem.title}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              selectedProblem.difficulty === "Hard" ? "bg-red-900 text-red-200" : "bg-amber-900 text-amber-200"
            }`}>{selectedProblem.difficulty}</span>
          </div>
          <button
            onClick={() => handleEndSession()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold transition-all"
          >
            <Square size={12} /> End & Debrief
          </button>
        </div>

        {/* Phase tabs */}
        <div className="flex gap-1.5">
          {selectedProblem.phases.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhaseIdx(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                i === currentPhaseIdx
                  ? PHASE_COLORS[p.type]
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {PHASE_ICONS[p.type]}
              <span className="hidden sm:inline">{p.title.split(" ").slice(0, 3).join(" ")}…</span>
              <span className="sm:hidden">P{i + 1}</span>
            </button>
          ))}
        </div>

        {/* Problem scenario */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-1">Scenario</p>
          <p className="text-sm text-blue-700 leading-relaxed">{selectedProblem.scenario}</p>
        </div>

        {/* Code context */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCode(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700"
          >
            <span className="flex items-center gap-1.5"><Code2 size={13} /> Existing Codebase</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(selectedProblem.codeContext);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-semibold"
              >
                {codeCopied ? <Check size={10} /> : <Copy size={10} />}
                {codeCopied ? "Copied!" : "Copy"}
              </button>
              {showCode ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </button>
          {showCode && (
            <pre className="p-4 text-xs font-mono text-gray-800 overflow-x-auto bg-gray-950 text-green-300 leading-relaxed">
              {selectedProblem.codeContext}
            </pre>
          )}
        </div>

        {/* Current phase task */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${PHASE_COLORS[currentP.type]}`}>
              {PHASE_ICONS[currentP.type]} {currentP.type.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={11} /> {currentP.timeTarget}</span>
          </div>
          <h4 className="text-sm font-bold text-gray-900">{currentP.title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{currentP.description}</p>

          {/* Hint */}
          <div>
            <button
              onClick={() => setShowHint(h => { const n = [...h]; n[currentPhaseIdx] = !n[currentPhaseIdx]; return n; })}
              className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold hover:text-amber-800 transition-colors"
            >
              <Lightbulb size={13} />
              {showHint[currentPhaseIdx] ? "Hide hint" : "Show hint"}
            </button>
            {showHint[currentPhaseIdx] && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                {currentP.hint}
              </div>
            )}
          </div>
        </div>

        {/* Answer textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700">
            Your approach, code, and reasoning for Phase {currentPhaseIdx + 1}
          </label>
          <textarea
            value={phaseAnswers[currentPhaseIdx]}
            onChange={(e) => setPhaseAnswers(a => { const n = [...a]; n[currentPhaseIdx] = e.target.value; return n; })}
            placeholder={`Describe your approach for "${currentP.title}". Include:\n• What bugs you found / what you're building / how you're optimizing\n• Key implementation decisions and trade-offs\n• Test cases you'd write\n• How you'd use the AI assistant in this phase`}
            className="w-full h-40 p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono"
          />
        </div>

        {/* AI tips */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5"><Zap size={12} /> AI Tips for this problem</p>
          <ul className="space-y-1">
            {selectedProblem.aiTips.map((tip, i) => (
              <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span> {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Workflow + AI usage notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Workflow notes (optional)</label>
            <textarea
              value={workflowNotes}
              onChange={(e) => setWorkflowNotes(e.target.value)}
              placeholder="How did you follow the 6-step workflow? Any deviations?"
              className="w-full h-20 p-2.5 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">AI usage notes (optional)</label>
            <textarea
              value={aiUsageNotes}
              onChange={(e) => setAiUsageNotes(e.target.value)}
              placeholder="How did you direct the AI? What prompts worked well?"
              className="w-full h-20 p-2.5 text-xs border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        {/* Phase navigation */}
        <div className="flex gap-2">
          {currentPhaseIdx > 0 && (
            <button
              onClick={() => setCurrentPhaseIdx(i => i - 1)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              ← Previous Phase
            </button>
          )}
          {currentPhaseIdx < 2 ? (
            <button
              onClick={() => setCurrentPhaseIdx(i => i + 1)}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all"
            >
              Next Phase →
            </button>
          ) : (
            <button
              onClick={() => handleEndSession()}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Trophy size={16} /> End & Get Debrief
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Debrief phase ────────────────────────────────────────────────────────────
  if (phase === "debrief") {
    const isLoading = debrief.isPending;
    const result = debriefResult;
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Session Debrief
          </h3>
          <button
            onClick={() => { setPhase("setup"); setDebriefResult(null); debrief.reset(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RotateCcw size={13} /> New Session
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-sm text-gray-500">Generating IC-level debrief…</p>
          </div>
        )}

        {result && (
          <>
            {/* Verdict */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${VERDICT_STYLES[result.icLevelVerdict]}`}>
              <div>
                <p className="text-xs font-semibold opacity-70 mb-0.5">{targetLevel} Bar · {selectedProblem?.title}</p>
                <p className="text-xl font-bold">{result.icLevelVerdict}</p>
              </div>
              <Trophy size={28} className="opacity-60" />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-700 mb-1.5">Overall Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.overallSummary}</p>
            </div>

            {/* Radar + scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700 mb-3">Score Profile</p>
                <RadarChart scores={[
                  { label: "Problem Solving", value: result.problemSolvingScore },
                  { label: "Code Dev", value: result.codeDevelopmentScore },
                  { label: "Verification", value: result.verificationScore },
                  { label: "Communication", value: result.communicationScore },
                  { label: "AI Usage", value: result.aiToolUsageScore },
                ]} />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-700">Dimension Scores</p>
                <ScoreBar label="Problem Solving" score={result.problemSolvingScore} feedback={result.problemSolvingFeedback} icon={<Brain size={13} />} />
                <ScoreBar label="Code Development" score={result.codeDevelopmentScore} feedback={result.codeDevelopmentFeedback} icon={<Code2 size={13} />} />
                <ScoreBar label="Verification & Debugging" score={result.verificationScore} feedback={result.verificationFeedback} icon={<ShieldCheck size={13} />} />
                <ScoreBar label="Technical Communication" score={result.communicationScore} feedback={result.communicationFeedback} icon={<MessageSquare size={13} />} />
                <ScoreBar label="AI Tool Usage" score={result.aiToolUsageScore} feedback={result.aiToolUsageFeedback} icon={<Zap size={13} />} />
              </div>
            </div>

            {/* Strengths / Improvements / Next steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5"><CheckCircle2 size={13} /> Top Strengths</p>
                <ul className="space-y-1.5">
                  {result.topStrengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1.5"><AlertTriangle size={13} /> Top Improvements</p>
                <ul className="space-y-1.5">
                  {result.topImprovements.map((s, i) => (
                    <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">!</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5"><BookOpen size={13} /> Next Steps</p>
                <ul className="space-y-1.5">
                  {result.nextSteps.map((s, i) => (
                    <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Follow-up questions */}
            {selectedProblem && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-800 mb-2 flex items-center gap-1.5"><MessageSquare size={13} /> Follow-up Questions to Practice</p>
                <ul className="space-y-1.5">
                  {selectedProblem.followUps.map((q, i) => (
                    <li key={i} className="text-xs text-violet-700 flex items-start gap-1.5">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">Q{i + 1}.</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Session transcript */}
            <details className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                <BookOpen size={13} /> Session Transcript (click to expand)
              </summary>
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                {selectedProblem?.phases.map((p, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-fit border ${PHASE_COLORS[p.type]}`}>
                      {PHASE_ICONS[p.type]} {p.title}
                    </div>
                    <p className="text-xs text-gray-500 italic">{p.description}</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {phaseAnswers[i] || "(no answer provided)"}
                    </div>
                  </div>
                ))}
                {workflowNotes && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-600">Workflow Notes</p>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{workflowNotes}</p>
                  </div>
                )}
                {aiUsageNotes && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-600">AI Usage Notes</p>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{aiUsageNotes}</p>
                  </div>
                )}
              </div>
            </details>
          </>
        )}
      </div>
    );
  }

  return null;
}

// Export history loader for Stats view
export { loadAIHistory };
export type { AISessionHistoryEntry };
