/**
 * AIMockProblemBank — 8 multi-file codebase practice problems for Meta's AI-Enabled round.
 * Each problem has 3 phases: Bug Fix → Feature Add → Optimize.
 * Simulates the real CoderPad format with existing code context.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, Zap, Bug, PlusCircle, TrendingUp, ExternalLink } from "lucide-react";

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
      {
        type: "bug-fix",
        title: "Fix the 3 bugs in LRUCache",
        description: "There are exactly 3 bugs in the implementation above. Find and fix all of them. The cache should correctly maintain LRU order and evict the least recently used item when at capacity.",
        hint: "_remove() is missing one pointer update. _insert() is missing one pointer update. The eviction logic removes from the wrong end.",
        timeTarget: "10 min",
      },
      {
        type: "feature",
        title: "Add TTL (Time-To-Live) support",
        description: "Extend the cache to support optional TTL per key. A get() on an expired key should return -1 and remove the key. put(key, val, ttl=None) where ttl is seconds. Expired keys should not count toward capacity.",
        hint: "Store expiry timestamps alongside values. Check expiry on get(). Consider lazy vs. eager expiration.",
        timeTarget: "15 min",
      },
      {
        type: "optimize",
        title: "Optimize for read-heavy workloads",
        description: "The cache is read 100x more than written. Discuss and implement a strategy to reduce lock contention. Consider: read-through caching, approximate LRU (segmented), or a lock-free approach. What are the tradeoffs?",
        hint: "Segmented LRU (SLRU) divides cache into probationary and protected segments. Discuss write-lock vs. read-lock granularity.",
        timeTarget: "15 min",
      },
    ],
    aiTips: [
      "Ask the AI to explain what each method should do before reading the code",
      "Use the AI to generate test cases for edge cases (capacity=1, duplicate keys)",
      "Ask the AI to verify your fix before moving to the next phase",
    ],
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
      {
        type: "bug-fix",
        title: "Fix the race condition and overflow bug",
        description: "Fix the two bugs: (1) the race condition in allow_request, and (2) tokens exceeding capacity in _refill. The solution should be correct for single-threaded use first, then discuss thread safety.",
        hint: "Use min() to cap tokens at capacity. For thread safety, consider threading.Lock() or atomic operations.",
        timeTarget: "10 min",
      },
      {
        type: "feature",
        title: "Add sliding window rate limiting",
        description: "Implement a SlidingWindowRateLimiter class that allows at most N requests per user in the last T seconds. This is more accurate than token bucket for bursty traffic. Use a deque to track timestamps.",
        hint: "Store a deque of timestamps per user. On each request, remove timestamps older than T seconds, then check if len(deque) < N.",
        timeTarget: "15 min",
      },
      {
        type: "optimize",
        title: "Make it distributed with Redis",
        description: "Describe how you'd implement this rate limiter across multiple API servers using Redis. Sketch the Redis data structure and the Lua script (or MULTI/EXEC transaction) needed for atomic check-and-increment. What are the failure modes?",
        hint: "Redis INCR + EXPIRE for fixed window. For sliding window, use a sorted set with timestamps as scores. Lua script ensures atomicity.",
        timeTarget: "15 min",
      },
    ],
    aiTips: [
      "Ask the AI to write unit tests for the fixed version",
      "Use the AI to generate the Redis Lua script skeleton",
      "Ask the AI to compare token bucket vs. sliding window tradeoffs",
    ],
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
      {
        type: "bug-fix",
        title: "Fix the 3 bugs in TaskScheduler",
        description: "Fix: (1) heap comparison error when two tasks have the same run_at time, (2) cancel() doesn't prevent execution (lazy deletion is fine but explain it), (3) unhandled exceptions in fn() crash the scheduler.",
        hint: "Use (run_at, task_id, fn) — task_id breaks ties since it's unique. Wrap fn() in try/except. Lazy deletion via cancelled set is acceptable.",
        timeTarget: "12 min",
      },
      {
        type: "feature",
        title: "Add recurring tasks",
        description: "Add schedule_recurring(fn, interval_ms) that runs fn every interval_ms milliseconds until cancelled. Return a task_id that can be used to cancel the recurring task. The task should re-schedule itself after each execution.",
        hint: "After executing, push a new entry to the heap with run_at = now + interval_ms. Store the interval alongside the task.",
        timeTarget: "15 min",
      },
      {
        type: "optimize",
        title: "Scale to millions of tasks",
        description: "The current heap works for thousands of tasks but not millions. Discuss: (1) hierarchical timing wheels as an alternative, (2) how to partition tasks across worker threads, (3) what data structure change would reduce memory by 10x for recurring tasks.",
        hint: "Timing wheels use O(1) insert/delete vs O(log n) for heap. Partition by task_id % num_workers. Recurring tasks only need one heap entry.",
        timeTarget: "15 min",
      },
    ],
    aiTips: [
      "Ask the AI to explain timing wheels before the optimize phase",
      "Use the AI to generate a stress test with 10,000 concurrent tasks",
      "Ask the AI to identify any remaining edge cases after your fix",
    ],
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
        """Return users at distance 2 (friends of friends), sorted by mutual count."""
        visited = {user}
        candidates = {}  # user_id -> mutual_count

        # BFS to depth 2
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

        # Remove direct friends
        for friend in self.adj[user]:
            candidates.pop(friend, None)  # BUG: also removes user itself?

        return sorted(candidates, key=lambda x: -candidates[x])[:max_results]`,
    phases: [
      {
        type: "bug-fix",
        title: "Fix the mutual friend counting bugs",
        description: "The BFS approach has 3 bugs: (1) adding to visited too early prevents counting all mutual paths, (2) the mutual count logic is wrong, (3) the direct friend removal may have an off-by-one. Fix all three so recommendations are correctly ranked by mutual friend count.",
        hint: "Don't add depth-2 nodes to visited during BFS — just collect them. Count mutuals as: for each friend-of-friend, count how many of user's friends are also their friends.",
        timeTarget: "12 min",
      },
      {
        type: "feature",
        title: "Add 'People in Same Group' recommendations",
        description: "Extend the system to also recommend users who share a group (e.g., workplace, school) but aren't yet friends. Add add_group(user, group_id) and update recommend() to include group-based suggestions with a lower weight than mutual friends.",
        hint: "Maintain a group_members dict. For each group the user belongs to, iterate members and add them as candidates with weight 0.5 (vs 1.0 for mutual friends).",
        timeTarget: "15 min",
      },
      {
        type: "optimize",
        title: "Scale to 3 billion users",
        description: "The current in-memory graph doesn't scale. Discuss: (1) how Meta actually stores the social graph (TAO), (2) how you'd shard the adjacency list, (3) how you'd precompute friend-of-friend counts offline vs. online, (4) what approximate algorithms (MinHash, SimHash) could help.",
        hint: "TAO is a distributed cache over MySQL. Shard by user_id % num_shards. Precompute FOF counts nightly via MapReduce. MinHash approximates Jaccard similarity of friend sets.",
        timeTarget: "15 min",
      },
    ],
    aiTips: [
      "Ask the AI to draw the graph for a small test case to verify your fix",
      "Use the AI to explain TAO (Meta's social graph storage) before the optimize phase",
      "Ask the AI to write a correctness test comparing your fix against a brute-force solution",
    ],
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

class Post:
    def __init__(self, post_id: int, user_id: int, timestamp: int, content: str):
        self.post_id = post_id
        self.user_id = user_id
        self.timestamp = timestamp
        self.content = content

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
        """Merge posts from all followed users, return top-limit by timestamp."""
        all_posts = []
        for followed_id in self.follows.get(user_id, set()):
            all_posts.extend(self.user_posts.get(followed_id, []))
        # BUG: O(n log n) where n = total posts across all followed users
        return sorted(all_posts, key=lambda p: -p.timestamp)[:limit]`,
    phases: [
      {
        type: "bug-fix",
        title: "Fix the memory leak and add post eviction",
        description: "The user_posts list grows unbounded. Fix it by keeping only the last N posts per user (e.g., N=1000). Also fix the missing self-follow (a user should see their own posts in their feed).",
        hint: "Use a deque with maxlen=1000 or trim the list after each append. Add user_id to their own follows set on first post.",
        timeTarget: "10 min",
      },
      {
        type: "feature",
        title: "Implement k-way merge for efficient feed generation",
        description: "Replace the O(n log n) sort with a k-way merge using a min-heap. Each followed user's posts are already sorted by timestamp (descending). Use a heap of size k (number of followed users) to merge them in O(limit * log k) time.",
        hint: "Push the most recent post from each followed user onto a max-heap (negate timestamp for min-heap). Pop the top, push the next post from that user's list.",
        timeTarget: "18 min",
      },
      {
        type: "optimize",
        title: "Add cursor-based pagination",
        description: "The current get_feed() always starts from the beginning. Add get_feed(user_id, limit, cursor=None) where cursor is the timestamp of the last seen post. The next page should return posts with timestamp < cursor. How do you handle new posts inserted between pages?",
        hint: "Pass cursor as a timestamp. In the k-way merge, skip posts with timestamp >= cursor. New posts between pages are a known tradeoff — document it.",
        timeTarget: "15 min",
      },
    ],
    aiTips: [
      "Ask the AI to explain k-way merge with a diagram before implementing",
      "Use the AI to generate test data: 100 users each with 50 posts",
      "Ask the AI to compare push vs. pull feed architectures",
    ],
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
      {
        type: "bug-fix",
        title: "Fix top-3 maintenance and input recording",
        description: "Fix two bugs: (1) when input() reaches a node with no children, it should still record the partial input for future '#' insertion, (2) the top3 list on each node should be maintained during insert so _get_top3 doesn't need a full DFS.",
        hint: "Track the current node separately from the traversal. Update top3 on each node during insert by keeping a sorted list of size 3.",
        timeTarget: "12 min",
      },
      {
        type: "feature",
        title: "Add fuzzy matching (1 typo tolerance)",
        description: "Extend the system to return suggestions even when the input has 1 character substitution error. For example, 'helo' should match 'hello'. Implement a DFS that allows at most 1 mismatch.",
        hint: "Add a max_errors parameter to the DFS. At each node, try both the exact match (errors unchanged) and any other character (errors - 1). Stop when errors < 0.",
        timeTarget: "18 min",
      },
      {
        type: "optimize",
        title: "Reduce memory with compressed Trie (Patricia Trie)",
        description: "The current Trie uses one node per character. For long sentences, this wastes memory. Describe how a Patricia Trie (radix tree) compresses chains of single-child nodes into edge labels. What's the memory reduction for a 1M-sentence dataset?",
        hint: "Merge chains: if a node has exactly one child and is not an end node, merge it with its child. Store the merged string as the edge label.",
        timeTarget: "12 min",
      },
    ],
    aiTips: [
      "Ask the AI to trace through a small example to verify your top3 maintenance logic",
      "Use the AI to explain edit distance before implementing fuzzy matching",
      "Ask the AI to estimate memory usage for both Trie variants",
    ],
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
        self._evict_old(timestamp)

    def _evict_old(self, current_time: int):
        # BUG: off-by-one — should evict events OLDER than window
        while self.events and self.events[0][0] < current_time - self.window_size:
            ts, etype, uid = self.events.popleft()
            self.counts[etype] -= 1  # BUG: can go negative if evicted twice

    def get_count(self, event_type: str) -> int:
        return self.counts.get(event_type, 0)

    def get_rate(self, event_type: str) -> float:
        # BUG: division by zero when window is empty
        return self.counts.get(event_type, 0) / self.window_size`,
    phases: [
      {
        type: "bug-fix",
        title: "Fix the 3 bugs in EventStreamProcessor",
        description: "Fix: (1) the off-by-one in eviction (should use <= not <), (2) counts going negative (guard against it), (3) division by zero in get_rate(). Also: the current implementation doesn't handle out-of-order events — describe how you'd handle them.",
        hint: "Use <= for eviction boundary. Add max(0, ...) guard on count decrement. Return 0.0 or use actual elapsed time for rate. For out-of-order: sort by timestamp or use a priority queue.",
        timeTarget: "12 min",
      },
      {
        type: "feature",
        title: "Add anomaly detection (spike detection)",
        description: "Add detect_anomaly(event_type, threshold_multiplier=3.0) that returns True if the current rate is more than threshold_multiplier times the baseline rate (computed over the last 10 windows). Use an exponential moving average for the baseline.",
        hint: "Maintain a baseline EMA: ema = alpha * current_rate + (1-alpha) * ema. Flag if current_rate > threshold * ema. Alpha = 0.1 works well for smoothing.",
        timeTarget: "15 min",
      },
      {
        type: "optimize",
        title: "Make it fault-tolerant with checkpointing",
        description: "If the processor crashes, all in-memory state is lost. Design a checkpointing strategy: (1) what state needs to be persisted, (2) how often to checkpoint, (3) how to replay events from a Kafka offset after recovery. What's the tradeoff between checkpoint frequency and recovery time?",
        hint: "Persist: window contents, counts, EMA baselines, last processed offset. Checkpoint every N events or T seconds. On recovery, seek Kafka to last checkpoint offset and replay.",
        timeTarget: "15 min",
      },
    ],
    aiTips: [
      "Ask the AI to generate a sequence of events that triggers each bug",
      "Use the AI to explain exponential moving average before implementing anomaly detection",
      "Ask the AI to sketch a Kafka-based architecture for the fault-tolerant version",
    ],
    followUps: ["How do you handle late-arriving events (watermarks)?", "What's exactly-once processing and why is it hard?", "How would you scale this to 1M events/second?"],
  },
  {
    id: "distributed-counter",
    title: "Distributed Like Counter",
    difficulty: "Medium",
    domain: "Distributed Systems + Design",
    estimatedTime: "45 min",
    scenario: "Meta's like counter needs to handle millions of concurrent likes on viral posts. The existing single-server counter has a race condition. Fix it, add approximate counting for high-traffic posts, and design a distributed version.",
    codeContext: `import threading
from typing import Dict

class LikeCounter:
    def __init__(self):
        self.counts: Dict[str, int] = {}
        self.lock = threading.Lock()

    def like(self, post_id: str, user_id: str) -> int:
        # BUG: race condition — check-then-act is not atomic
        if post_id not in self.counts:
            self.counts[post_id] = 0
        self.counts[post_id] += 1  # BUG: not protected by lock
        return self.counts[post_id]

    def unlike(self, post_id: str, user_id: str) -> int:
        with self.lock:
            if post_id in self.counts:
                self.counts[post_id] = max(0, self.counts[post_id] - 1)
            return self.counts.get(post_id, 0)

    def get_count(self, post_id: str) -> int:
        return self.counts.get(post_id, 0)  # BUG: no deduplication (same user can like twice)`,
    phases: [
      {
        type: "bug-fix",
        title: "Fix the race condition and add deduplication",
        description: "Fix: (1) the like() method is not atomic — the check and increment must be inside the lock, (2) the same user can like a post multiple times. Add a per-post set of user_ids who have liked it. Return the actual count after deduplication.",
        hint: "Move the entire like() body inside 'with self.lock'. Add self.liked_by: Dict[str, set] to track which users liked each post.",
        timeTarget: "10 min",
      },
      {
        type: "feature",
        title: "Add approximate counting for viral posts",
        description: "For posts with >1M likes, exact counting is expensive. Implement an approximate counter using probabilistic counting: with probability 1/k, increment by k instead of 1. This reduces lock contention by k times while keeping the expected value correct. Add a threshold to switch modes.",
        hint: "import random. If count > THRESHOLD: if random.random() < 1/k: count += k. Expected value is the same. k=100 reduces writes by 100x.",
        timeTarget: "15 min",
      },
      {
        type: "optimize",
        title: "Design a distributed like counter",
        description: "Design a system that handles 1M likes/second on a single viral post across 100 servers. Cover: (1) sharding strategy, (2) eventual consistency tradeoffs, (3) how to aggregate counts from shards, (4) how Redis INCR helps. What's the consistency model you'd choose and why?",
        hint: "Shard by post_id % num_shards. Each shard maintains a local count. Aggregate periodically (eventual consistency). Redis INCR is atomic. For viral posts, use counter sharding (multiple Redis keys per post).",
        timeTarget: "18 min",
      },
    ],
    aiTips: [
      "Ask the AI to write a concurrent test that exposes the race condition",
      "Use the AI to explain probabilistic counting (Morris counter) before implementing",
      "Ask the AI to compare Redis INCR vs. database counters for this use case",
    ],
    followUps: ["How do you prevent like farming (bot likes)?", "How does Facebook actually count likes at scale?", "What's the difference between strong and eventual consistency here?"],
  },
];

const PHASE_STYLES = {
  "bug-fix":  { icon: Bug,        color: "text-red-600",    bg: "bg-red-100",    border: "border-red-200",    badge: "bg-red-100 text-red-700",    label: "Bug Fix"    },
  "feature":  { icon: PlusCircle, color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   label: "Feature"    },
  "optimize": { icon: TrendingUp, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-700", label: "Optimize"   },
};

const DIFF_STYLES = {
  Medium: "bg-amber-100 text-amber-900",
  Hard:   "bg-red-100 text-red-700",
};

function ProblemCard({ p }: { p: MockProblem }) {
  const [expanded, setExpanded] = useState(false);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(`ai-mock-${p.id}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  const togglePhase = (i: number) => {
    setCompletedPhases(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      localStorage.setItem(`ai-mock-${p.id}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const allDone = completedPhases.size === p.phases.length;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${allDone ? "border-green-300" : "border-gray-200"}`}>
      {/* Header */}
      <div className={`px-4 py-4 ${allDone ? "bg-green-50" : "bg-white"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLES[p.difficulty]}`}>{p.difficulty}</span>
              <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.domain}</span>
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Clock size={10} /> {p.estimatedTime}
              </span>
              {allDone && <span className="text-[11px] font-bold text-green-600">✓ Completed</span>}
            </div>
            <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {p.title}
            </h3>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed line-clamp-2">{p.scenario}</p>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp size={16} className="text-gray-700" /> : <ChevronDown size={16} className="text-gray-700" />}
          </button>
        </div>

        {/* Phase progress dots */}
        <div className="flex items-center gap-2 mt-3">
          {p.phases.map((phase, i) => {
            const style = PHASE_STYLES[phase.type];
            const done = completedPhases.has(i);
            return (
              <button
                key={i}
                onClick={() => togglePhase(i)}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  done ? "bg-green-100 border-green-300 text-green-700" : `${style.bg} ${style.border} ${style.color}`
                }`}
              >
                {done ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Scenario */}
          <div className="px-4 py-3 bg-gray-50">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">Scenario</p>
            <p className="text-xs text-gray-700 leading-relaxed">{p.scenario}</p>
          </div>

          {/* Code Context */}
          <div className="px-4 py-3 bg-gray-950">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">Existing Codebase (given to you)</p>
            <pre className="text-[10.5px] text-green-300 leading-relaxed overflow-x-auto font-mono whitespace-pre">
              {p.codeContext}
            </pre>
          </div>

          {/* Phases */}
          <div className="divide-y divide-gray-100">
            {p.phases.map((phase, i) => {
              const style = PHASE_STYLES[phase.type];
              const PhaseIcon = style.icon;
              const done = completedPhases.has(i);
              return (
                <div key={i} className={`px-4 py-4 ${done ? "bg-green-50/50" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                        <PhaseIcon size={9} /> Phase {i + 1}: {style.label}
                      </span>
                      <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                        <Clock size={9} /> {phase.timeTarget}
                      </span>
                    </div>
                    <button
                      onClick={() => togglePhase(i)}
                      className={`flex-shrink-0 transition-colors ${done ? "text-green-500" : "text-gray-700 hover:text-green-400"}`}
                    >
                      {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {phase.title}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{phase.description}</p>

                  {/* Hint toggle */}
                  <button
                    onClick={() => setShowHint(h => ({ ...h, [i]: !h[i] }))}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-800 transition-colors"
                  >
                    {showHint[i] ? "Hide hint ▲" : "Show hint ▼"}
                  </button>
                  {showHint[i] && (
                    <div className="mt-2 p-2.5 bg-amber-100 border border-amber-200 rounded-lg">
                      <p className="text-[11px] text-amber-800 leading-relaxed">{phase.hint}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Tips */}
          <div className="px-4 py-3 bg-violet-50 border-t border-violet-100">
            <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Zap size={10} /> How to Use the AI Effectively
            </p>
            <ul className="space-y-1">
              {p.aiTips.map((tip, i) => (
                <li key={i} className="text-[11px] text-violet-800 flex items-start gap-1.5">
                  <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Follow-up questions */}
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2">Likely Follow-Up Questions</p>
            <ul className="space-y-1">
              {p.followUps.map((q, i) => (
                <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-700 flex-shrink-0 mt-0.5">→</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIMockProblemBank() {
  const [filter, setFilter] = useState<"All" | "Medium" | "Hard">("All");

  const filtered = PROBLEMS.filter(p => filter === "All" || p.difficulty === filter);

  const totalCompleted = PROBLEMS.filter(p => {
    try {
      const stored = localStorage.getItem(`ai-mock-${p.id}`);
      if (!stored) return false;
      return JSON.parse(stored).length === p.phases.length;
    } catch { return false; }
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          AI-Enabled Mock Problem Bank
        </h3>
        <p className="text-xs text-gray-700 mt-0.5">
          8 multi-file codebase problems simulating Meta's 3-phase AI-enabled format: Bug Fix → Feature Add → Optimize. Each problem includes existing code, AI usage tips, and follow-up questions.
        </p>
      </div>

      {/* Practice link */}
      <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
        <Zap size={14} className="text-violet-600 flex-shrink-0" />
        <p className="text-xs text-violet-800 flex-1">
          Practice these problems in a real AI-enabled environment at HelloInterview.
        </p>
        <a
          href="https://www.hellointerview.com/practice/ai-coding"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-800 transition-colors"
        >
          Practice Now <ExternalLink size={10} />
        </a>
      </div>

      {/* Filters + progress */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(["All", "Medium", "Hard"] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                filter === d ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-700">
          <span className="font-bold text-gray-700">{totalCompleted}</span> / {PROBLEMS.length} problems fully completed
        </span>
      </div>

      {/* Problem cards */}
      <div className="space-y-4">
        {filtered.map(p => <ProblemCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
