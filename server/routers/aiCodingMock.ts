/**
 * AI-Enabled Coding Mock Interview — Server Router
 *
 * Implements:
 *  1. aiCodingMock.chat        — "nerfed" AI assistant (explains, hints, never solves)
 *  2. aiCodingMock.scorePhase  — per-phase rubric scoring (4 Meta dimensions)
 *  3. aiCodingMock.scoreSession — full-session debrief + hiring recommendation
 *  4. aiCodingMock.getProblems — returns the problem set (public, no auth needed)
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ─── Problem Set ──────────────────────────────────────────────────────────────
// Each problem has 3 phases: bugFix → featureImpl → optimize
// Files are realistic multi-file Python codebases (as strings)

export const AI_CODING_PROBLEMS = [
  {
    id: "rate-limiter",
    title: "API Rate Limiter",
    difficulty: "L6",
    topic: "Concurrency / Sliding Window",
    description:
      "You are working on a high-traffic API gateway. The rate limiter service has several bugs and missing features that need to be fixed and extended.",
    phases: {
      bugFix: {
        label: "Phase 1 — Bug Fix",
        minutes: 15,
        instructions:
          "The test suite is failing. Find and fix all bugs in the rate limiter. Do NOT rewrite the whole file — make targeted fixes.",
        failingTests: [
          "test_allow_within_limit — FAIL: TypeError on token count",
          "test_reject_over_limit — FAIL: Always returns True",
          "test_refill_after_window — FAIL: Off-by-one in window calculation",
        ],
        files: {
          "rate_limiter.py": `import time
import threading
from collections import deque

class TokenBucketLimiter:
    def __init__(self, max_tokens: int, refill_rate: float):
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.tokens = str(max_tokens)   # BUG 1: tokens stored as string
        self.last_refill = time.time()
        self.lock = threading.Lock()

    def allow_request(self) -> bool:
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens += elapsed * self.refill_rate   # BUG 2: str + float
            self.tokens = min(self.tokens, self.max_tokens)
            self.last_refill = now
            if self.tokens > 0:   # BUG 3: should be >= 1
                self.tokens -= 1
                return True
            return True   # BUG 4: should return False


class SlidingWindowLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: deque = deque()

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        # BUG 5: should use > not >= (off-by-one at window boundary)
        while self.requests and self.requests[0] >= cutoff:
            self.requests.popleft()
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False
`,
          "test_rate_limiter.py": `import pytest
import time
from rate_limiter import TokenBucketLimiter, SlidingWindowLimiter

def test_allow_within_limit():
    limiter = TokenBucketLimiter(max_tokens=5, refill_rate=1.0)
    assert limiter.allow_request() == True

def test_reject_over_limit():
    limiter = TokenBucketLimiter(max_tokens=2, refill_rate=0.1)
    limiter.allow_request()
    limiter.allow_request()
    assert limiter.allow_request() == False  # should be rejected

def test_refill_after_window():
    limiter = SlidingWindowLimiter(max_requests=3, window_seconds=1.0)
    limiter.allow_request("user1")
    limiter.allow_request("user1")
    limiter.allow_request("user1")
    assert limiter.allow_request("user1") == False  # 4th should fail
`,
          "README.md": `# Rate Limiter Service

Two implementations:
- TokenBucketLimiter: classic token bucket, thread-safe
- SlidingWindowLimiter: per-user sliding window

Run tests: pytest test_rate_limiter.py -v
`,
        },
      },
      featureImpl: {
        label: "Phase 2 — Feature Implementation",
        minutes: 25,
        instructions:
          "Implement a new `DistributedRateLimiter` class that uses Redis-style key-value storage (simulated with a dict) to support multi-server rate limiting. It must: (1) accept a storage backend, (2) support per-user limits, (3) be thread-safe, (4) expire old keys automatically.",
        files: {
          "rate_limiter.py": `import time
import threading
from collections import deque

# ✅ Fixed TokenBucketLimiter (from Phase 1)
class TokenBucketLimiter:
    def __init__(self, max_tokens: int, refill_rate: float):
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.tokens: float = float(max_tokens)
        self.last_refill = time.monotonic()
        self.lock = threading.Lock()

    def allow_request(self) -> bool:
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.max_tokens, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False


class SlidingWindowLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: deque = deque()

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        while self.requests and self.requests[0] <= cutoff:
            self.requests.popleft()
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False


# TODO: Implement DistributedRateLimiter below
# Requirements:
#   - __init__(self, max_requests: int, window_seconds: float, storage: dict)
#   - allow_request(self, user_id: str) -> bool
#   - Thread-safe
#   - Cleans up expired keys automatically
#   - storage dict format: { user_id: [timestamp1, timestamp2, ...] }

class DistributedRateLimiter:
    pass  # YOUR IMPLEMENTATION HERE
`,
          "storage_backend.py": `"""
Simulated Redis-style in-memory storage backend.
In production this would be replaced with redis-py.
"""
from typing import Dict, List
import threading

class InMemoryStorage:
    def __init__(self):
        self._data: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> List[float]:
        with self._lock:
            return list(self._data.get(key, []))

    def set(self, key: str, value: List[float]) -> None:
        with self._lock:
            self._data[key] = value

    def delete(self, key: str) -> None:
        with self._lock:
            self._data.pop(key, None)
`,
          "test_distributed.py": `import pytest
import time
import threading
from rate_limiter import DistributedRateLimiter
from storage_backend import InMemoryStorage

def test_basic_allow():
    storage = InMemoryStorage()
    limiter = DistributedRateLimiter(max_requests=3, window_seconds=60, storage=storage)
    assert limiter.allow_request("user1") == True

def test_basic_reject():
    storage = InMemoryStorage()
    limiter = DistributedRateLimiter(max_requests=2, window_seconds=60, storage=storage)
    limiter.allow_request("user1")
    limiter.allow_request("user1")
    assert limiter.allow_request("user1") == False

def test_per_user_isolation():
    storage = InMemoryStorage()
    limiter = DistributedRateLimiter(max_requests=1, window_seconds=60, storage=storage)
    limiter.allow_request("user1")
    assert limiter.allow_request("user2") == True  # different user

def test_thread_safety():
    storage = InMemoryStorage()
    limiter = DistributedRateLimiter(max_requests=5, window_seconds=60, storage=storage)
    results = []
    def make_request():
        results.append(limiter.allow_request("user1"))
    threads = [threading.Thread(target=make_request) for _ in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()
    assert results.count(True) == 5
`,
        },
      },
      optimize: {
        label: "Phase 3 — Optimization",
        minutes: 15,
        instructions:
          "The DistributedRateLimiter is timing out on large inputs. The current implementation is O(n) per request where n = number of stored timestamps. Optimize it to O(log n) using a sorted structure, and add a benchmark showing the improvement. The test suite must still pass.",
        files: {},
      },
    },
  },
  {
    id: "task-scheduler",
    title: "Priority Task Scheduler",
    difficulty: "L6",
    topic: "Heaps / Priority Queue",
    description:
      "You are working on a distributed task scheduling system. The scheduler has bugs in priority ordering and missing deadline-aware scheduling features.",
    phases: {
      bugFix: {
        label: "Phase 1 — Bug Fix",
        minutes: 15,
        instructions:
          "Three tests are failing. Find and fix the bugs. The scheduler should process tasks in priority order (higher number = higher priority) and respect deadlines.",
        failingTests: [
          "test_priority_order — FAIL: tasks processed in wrong order",
          "test_deadline_expired — FAIL: expired tasks still run",
          "test_empty_queue — FAIL: KeyError on empty dequeue",
        ],
        files: {
          "scheduler.py": `import heapq
import time
from dataclasses import dataclass, field
from typing import Optional, List

@dataclass(order=True)
class Task:
    priority: int
    deadline: float
    task_id: str = field(compare=False)
    payload: dict = field(compare=False, default_factory=dict)

class PriorityScheduler:
    def __init__(self):
        self._heap: List = []
        self._counter = 0

    def enqueue(self, task: Task) -> None:
        # BUG 1: should negate priority for max-heap behavior
        heapq.heappush(self._heap, (task.priority, self._counter, task))
        self._counter += 1

    def dequeue(self) -> Optional[Task]:
        if not self._heap:
            # BUG 2: should return None, not raise
            raise KeyError("Queue is empty")
        _, _, task = heapq.heappop(self._heap)
        now = time.time()
        # BUG 3: condition is backwards — should skip expired tasks
        if task.deadline < now:
            return task
        return None

    def peek(self) -> Optional[Task]:
        if not self._heap:
            return None
        return self._heap[0][2]

    def size(self) -> int:
        return len(self._heap)
`,
          "test_scheduler.py": `import pytest
import time
from scheduler import PriorityScheduler, Task

def test_priority_order():
    s = PriorityScheduler()
    s.enqueue(Task(priority=1, deadline=time.time()+60, task_id="low"))
    s.enqueue(Task(priority=5, deadline=time.time()+60, task_id="high"))
    s.enqueue(Task(priority=3, deadline=time.time()+60, task_id="mid"))
    first = s.dequeue()
    assert first.task_id == "high", f"Expected high priority first, got {first.task_id}"

def test_deadline_expired():
    s = PriorityScheduler()
    s.enqueue(Task(priority=10, deadline=time.time()-1, task_id="expired"))
    result = s.dequeue()
    assert result is None, "Expired task should not be returned"

def test_empty_queue():
    s = PriorityScheduler()
    result = s.dequeue()
    assert result is None
`,
        },
      },
      featureImpl: {
        label: "Phase 2 — Feature Implementation",
        minutes: 25,
        instructions:
          "Add a `DeadlineAwareScheduler` that inherits from `PriorityScheduler` and implements: (1) `enqueue_with_retry(task, max_retries)` — re-enqueues failed tasks with decremented priority, (2) `get_expired()` — returns all expired tasks without removing valid ones, (3) `drain_expired()` — removes all expired tasks and returns them.",
        files: {
          "scheduler.py": `import heapq
import time
from dataclasses import dataclass, field
from typing import Optional, List

@dataclass(order=True)
class Task:
    priority: int
    deadline: float
    task_id: str = field(compare=False)
    payload: dict = field(compare=False, default_factory=dict)
    retry_count: int = field(compare=False, default=0)

class PriorityScheduler:
    def __init__(self):
        self._heap: List = []
        self._counter = 0

    def enqueue(self, task: Task) -> None:
        heapq.heappush(self._heap, (-task.priority, self._counter, task))
        self._counter += 1

    def dequeue(self) -> Optional[Task]:
        while self._heap:
            _, _, task = heapq.heappop(self._heap)
            if task.deadline >= time.time():
                return task
        return None

    def peek(self) -> Optional[Task]:
        if not self._heap:
            return None
        return self._heap[0][2]

    def size(self) -> int:
        return len(self._heap)


# TODO: Implement DeadlineAwareScheduler below
class DeadlineAwareScheduler(PriorityScheduler):
    pass  # YOUR IMPLEMENTATION HERE
`,
        },
      },
      optimize: {
        label: "Phase 3 — Optimization",
        minutes: 15,
        instructions:
          "The `drain_expired()` method is O(n log n) because it rebuilds the heap. Optimize it to O(k log n) where k is the number of expired tasks. Also add a `bulk_enqueue(tasks)` method that uses heapify for O(n) batch insertion instead of O(n log n) individual pushes.",
        files: {},
      },
    },
  },
  {
    id: "cache-system",
    title: "LRU Cache with TTL",
    difficulty: "L7",
    topic: "Hash Map / Doubly Linked List",
    description:
      "You are working on a caching layer for a high-traffic content delivery system. The LRU cache implementation has correctness bugs and needs TTL (time-to-live) expiry support.",
    phases: {
      bugFix: {
        label: "Phase 1 — Bug Fix",
        minutes: 15,
        instructions:
          "Fix all bugs in the LRU cache. Tests are failing due to incorrect eviction order, missing capacity enforcement, and broken get() returning stale data.",
        failingTests: [
          "test_eviction_order — FAIL: wrong key evicted",
          "test_capacity_limit — FAIL: cache exceeds capacity",
          "test_get_updates_recency — FAIL: get() doesn't update LRU order",
        ],
        files: {
          "lru_cache.py": `from collections import OrderedDict
from typing import Optional, Any

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        # BUG 1: should move to end (most recently used), not beginning
        self.cache.move_to_end(key, last=False)
        return self.cache[key]

    def put(self, key: str, value: Any) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        # BUG 2: evicts most recently used instead of least recently used
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=True)

    def delete(self, key: str) -> bool:
        if key in self.cache:
            del self.cache[key]
            return True
        return False

    def size(self) -> int:
        # BUG 3: off by one — should return len not len-1
        return len(self.cache) - 1
`,
          "test_lru_cache.py": `import pytest
from lru_cache import LRUCache

def test_eviction_order():
    cache = LRUCache(capacity=2)
    cache.put("a", 1)
    cache.put("b", 2)
    cache.put("c", 3)  # should evict "a" (LRU)
    assert cache.get("a") is None
    assert cache.get("b") == 2
    assert cache.get("c") == 3

def test_capacity_limit():
    cache = LRUCache(capacity=3)
    for i in range(5):
        cache.put(str(i), i)
    assert cache.size() == 3

def test_get_updates_recency():
    cache = LRUCache(capacity=2)
    cache.put("a", 1)
    cache.put("b", 2)
    cache.get("a")       # access "a" — now "b" is LRU
    cache.put("c", 3)    # should evict "b"
    assert cache.get("b") is None
    assert cache.get("a") == 1
`,
        },
      },
      featureImpl: {
        label: "Phase 2 — Feature Implementation",
        minutes: 25,
        instructions:
          "Extend the LRU cache with TTL support. Implement `LRUCacheWithTTL` that: (1) accepts optional `ttl_seconds` per key in `put()`, (2) returns None for expired keys in `get()`, (3) lazily evicts expired keys on access, (4) has an `evict_expired()` method for proactive cleanup.",
        files: {
          "lru_cache.py": `from collections import OrderedDict
from typing import Optional, Any
import time

# ✅ Fixed LRUCache from Phase 1
class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value: Any) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

    def delete(self, key: str) -> bool:
        if key in self.cache:
            del self.cache[key]
            return True
        return False

    def size(self) -> int:
        return len(self.cache)


# TODO: Implement LRUCacheWithTTL below
# Requirements:
#   - put(key, value, ttl_seconds=None)  — None means no expiry
#   - get(key) -> Optional[Any]          — returns None if expired
#   - evict_expired() -> int             — removes expired keys, returns count
#   - size() -> int                      — count of non-expired keys

class LRUCacheWithTTL:
    pass  # YOUR IMPLEMENTATION HERE
`,
        },
      },
      optimize: {
        label: "Phase 3 — Optimization",
        minutes: 15,
        instructions:
          "The `evict_expired()` method scans all keys O(n). For a cache with 1M entries and 10% TTL expiry rate, this is too slow. Implement a min-heap of (expiry_time, key) to make `evict_expired()` O(k log n) where k is the number of expired keys. Ensure correctness when TTL is updated via a second put() call.",
        files: {},
      },
    },
  },
  {
    id: "graph-search",
    title: "Social Graph Friend Recommender",
    difficulty: "L6",
    topic: "BFS / Graph Traversal",
    description:
      "You are working on Meta's friend recommendation engine. The graph traversal has bugs causing incorrect recommendations and the feature needs to be extended to support weighted connections.",
    phases: {
      bugFix: {
        label: "Phase 1 — Bug Fix",
        minutes: 15,
        instructions:
          "Fix all bugs in the friend recommender. Tests fail due to infinite loops, wrong BFS depth, and missing visited tracking.",
        failingTests: [
          "test_no_infinite_loop — FAIL: hangs on cyclic graph",
          "test_depth_2_only — FAIL: returns depth-3+ connections",
          "test_excludes_direct_friends — FAIL: includes existing friends",
        ],
        files: {
          "recommender.py": `from collections import defaultdict, deque
from typing import List, Set, Dict

class SocialGraph:
    def __init__(self):
        self.adjacency: Dict[str, Set[str]] = defaultdict(set)

    def add_friendship(self, user_a: str, user_b: str) -> None:
        self.adjacency[user_a].add(user_b)
        self.adjacency[user_b].add(user_a)

    def get_friends(self, user: str) -> Set[str]:
        return self.adjacency[user]

    def recommend_friends(self, user: str, max_depth: int = 2) -> List[str]:
        recommendations = []
        queue = deque([(user, 0)])
        # BUG 1: visited set never initialized — causes infinite loop
        while queue:
            current, depth = queue.popleft()
            if depth >= max_depth:
                # BUG 2: should be > not >= (cuts off depth-2 connections)
                continue
            for neighbor in self.adjacency[current]:
                # BUG 3: should skip if already visited
                if neighbor != user and neighbor not in self.adjacency[user]:
                    recommendations.append(neighbor)
                queue.append((neighbor, depth + 1))
        return list(set(recommendations))
`,
          "test_recommender.py": `import pytest
from recommender import SocialGraph

def test_no_infinite_loop():
    g = SocialGraph()
    g.add_friendship("alice", "bob")
    g.add_friendship("bob", "alice")  # creates cycle
    result = g.recommend_friends("alice")
    assert isinstance(result, list)  # should not hang

def test_depth_2_only():
    g = SocialGraph()
    g.add_friendship("alice", "bob")
    g.add_friendship("bob", "charlie")
    g.add_friendship("charlie", "dave")  # depth 3 from alice
    result = g.recommend_friends("alice", max_depth=2)
    assert "dave" not in result

def test_excludes_direct_friends():
    g = SocialGraph()
    g.add_friendship("alice", "bob")
    g.add_friendship("alice", "charlie")
    g.add_friendship("bob", "charlie")
    result = g.recommend_friends("alice")
    assert "bob" not in result
    assert "charlie" not in result
`,
        },
      },
      featureImpl: {
        label: "Phase 2 — Feature Implementation",
        minutes: 25,
        instructions:
          "Implement `WeightedSocialGraph` that extends `SocialGraph` with interaction weights (0.0–1.0). Add: (1) `add_friendship(user_a, user_b, weight=1.0)`, (2) `recommend_friends_weighted(user, max_depth=2, min_weight=0.3)` — only traverses edges with weight >= min_weight, (3) returns recommendations sorted by total path weight descending.",
        files: {
          "recommender.py": `from collections import defaultdict, deque
from typing import List, Set, Dict, Tuple
import heapq

# ✅ Fixed SocialGraph from Phase 1
class SocialGraph:
    def __init__(self):
        self.adjacency: Dict[str, Set[str]] = defaultdict(set)

    def add_friendship(self, user_a: str, user_b: str) -> None:
        self.adjacency[user_a].add(user_b)
        self.adjacency[user_b].add(user_a)

    def get_friends(self, user: str) -> Set[str]:
        return self.adjacency[user]

    def recommend_friends(self, user: str, max_depth: int = 2) -> List[str]:
        recommendations = []
        visited = {user}
        queue = deque([(user, 0)])
        while queue:
            current, depth = queue.popleft()
            if depth > max_depth:
                continue
            for neighbor in self.adjacency[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    if neighbor not in self.adjacency[user]:
                        recommendations.append(neighbor)
                    queue.append((neighbor, depth + 1))
        return recommendations


# TODO: Implement WeightedSocialGraph below
class WeightedSocialGraph(SocialGraph):
    pass  # YOUR IMPLEMENTATION HERE
`,
        },
      },
      optimize: {
        label: "Phase 3 — Optimization",
        minutes: 15,
        instructions:
          "For a graph with 100M users, `recommend_friends_weighted` is too slow. The current BFS explores all paths. Optimize using Dijkstra's algorithm to find the highest-weight paths efficiently. Add early termination when the top-K recommendations are found. Target: O((V + E) log V) instead of O(V * E).",
        files: {},
      },
    },
  },
  {
    id: "event-stream",
    title: "Real-Time Event Stream Processor",
    difficulty: "L7",
    topic: "Sliding Window / Stream Processing",
    description:
      "You are working on Meta's real-time analytics pipeline. The event stream processor has bugs in windowing logic and needs aggregation features added.",
    phases: {
      bugFix: {
        label: "Phase 1 — Bug Fix",
        minutes: 15,
        instructions:
          "Fix all bugs in the event stream processor. Tests fail due to incorrect window boundaries, missing event deduplication, and wrong aggregation logic.",
        failingTests: [
          "test_window_boundary — FAIL: events at exact boundary included/excluded incorrectly",
          "test_deduplication — FAIL: duplicate event IDs counted twice",
          "test_count_aggregation — FAIL: count off by one",
        ],
        files: {
          "stream_processor.py": `import time
from collections import defaultdict, deque
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

@dataclass
class Event:
    event_id: str
    timestamp: float
    event_type: str
    user_id: str
    payload: Dict[str, Any]

class SlidingWindowProcessor:
    def __init__(self, window_seconds: float):
        self.window_seconds = window_seconds
        self.events: deque = deque()
        # BUG 1: should be a set for O(1) dedup, not a list
        self.seen_ids: list = []

    def add_event(self, event: Event) -> None:
        # BUG 2: should check seen_ids before adding
        self.events.append(event)
        self.seen_ids.append(event.event_id)
        self._evict_old()

    def _evict_old(self) -> None:
        cutoff = time.time() - self.window_seconds
        # BUG 3: boundary condition — should use < not <=
        # Events at exactly cutoff should be INCLUDED
        while self.events and self.events[0].timestamp <= cutoff:
            self.events.popleft()

    def count(self, event_type: Optional[str] = None) -> int:
        if event_type is None:
            # BUG 4: off by one — should not subtract 1
            return len(self.events) - 1
        return sum(1 for e in self.events if e.event_type == event_type)

    def get_window(self) -> List[Event]:
        return list(self.events)
`,
          "test_stream.py": `import pytest
import time
from stream_processor import SlidingWindowProcessor, Event

def make_event(eid, etype="click", uid="u1", ts=None):
    return Event(event_id=eid, timestamp=ts or time.time(),
                 event_type=etype, user_id=uid, payload={})

def test_window_boundary():
    proc = SlidingWindowProcessor(window_seconds=1.0)
    now = time.time()
    proc.add_event(make_event("e1", ts=now - 0.999))  # just inside window
    assert proc.count() == 1

def test_deduplication():
    proc = SlidingWindowProcessor(window_seconds=60)
    proc.add_event(make_event("e1"))
    proc.add_event(make_event("e1"))  # duplicate
    assert proc.count() == 1

def test_count_aggregation():
    proc = SlidingWindowProcessor(window_seconds=60)
    proc.add_event(make_event("e1", etype="click"))
    proc.add_event(make_event("e2", etype="click"))
    proc.add_event(make_event("e3", etype="view"))
    assert proc.count() == 3
    assert proc.count("click") == 2
`,
        },
      },
      featureImpl: {
        label: "Phase 2 — Feature Implementation",
        minutes: 25,
        instructions:
          "Implement `AggregatingWindowProcessor` that extends `SlidingWindowProcessor` with: (1) `group_by(field)` — returns count per unique value of event.payload[field] or event.user_id, (2) `top_k(k, field)` — returns top-K users/values by event count, (3) `rate_per_second()` — returns current events/second in the window.",
        files: {
          "stream_processor.py": `import time
from collections import defaultdict, deque
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

@dataclass
class Event:
    event_id: str
    timestamp: float
    event_type: str
    user_id: str
    payload: Dict[str, Any]

# ✅ Fixed SlidingWindowProcessor from Phase 1
class SlidingWindowProcessor:
    def __init__(self, window_seconds: float):
        self.window_seconds = window_seconds
        self.events: deque = deque()
        self.seen_ids: set = set()

    def add_event(self, event: Event) -> None:
        if event.event_id in self.seen_ids:
            return
        self.seen_ids.add(event.event_id)
        self.events.append(event)
        self._evict_old()

    def _evict_old(self) -> None:
        cutoff = time.time() - self.window_seconds
        while self.events and self.events[0].timestamp < cutoff:
            self.events.popleft()

    def count(self, event_type: Optional[str] = None) -> int:
        if event_type is None:
            return len(self.events)
        return sum(1 for e in self.events if e.event_type == event_type)

    def get_window(self) -> List[Event]:
        return list(self.events)


# TODO: Implement AggregatingWindowProcessor below
class AggregatingWindowProcessor(SlidingWindowProcessor):
    pass  # YOUR IMPLEMENTATION HERE
`,
        },
      },
      optimize: {
        label: "Phase 3 — Optimization",
        minutes: 15,
        instructions:
          "The `top_k()` method is O(n log n) due to full sort. For a stream with 10M events/second, this is too slow. Optimize using a min-heap of size K to achieve O(n log k). Also optimize `group_by()` to maintain a running counter dict that updates incrementally on add/evict instead of scanning all events each call.",
        files: {},
      },
    },
  },
];

// ─── Router ──────────────────────────────────────────────────────────────────

export const aiCodingMockRouter = router({
  // Returns all available problems (public — no auth needed)
  getProblems: publicProcedure.query(() => {
    return AI_CODING_PROBLEMS.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      topic: p.topic,
      description: p.description,
      phases: {
        bugFix: {
          label: p.phases.bugFix.label,
          minutes: p.phases.bugFix.minutes,
          instructions: p.phases.bugFix.instructions,
          failingTests: p.phases.bugFix.failingTests,
          files: p.phases.bugFix.files,
        },
        featureImpl: {
          label: p.phases.featureImpl.label,
          minutes: p.phases.featureImpl.minutes,
          instructions: p.phases.featureImpl.instructions,
          files: p.phases.featureImpl.files,
        },
        optimize: {
          label: p.phases.optimize.label,
          minutes: p.phases.optimize.minutes,
          instructions: p.phases.optimize.instructions,
          files: p.phases.optimize.files,
        },
      },
    }));
  }),

  // Nerfed AI chat — explains and hints, never gives complete solutions
  chat: protectedProcedure
    .input(
      z.object({
        problemId: z.string(),
        phase: z.enum(["bugFix", "featureImpl", "optimize"]),
        message: z.string().max(1000),
        codeContext: z.string().max(5000).optional(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .max(20)
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const problem = AI_CODING_PROBLEMS.find(p => p.id === input.problemId);
      const phaseData = problem?.phases[input.phase];

      const systemPrompt = `You are the AI assistant built into Meta's CoderPad interview environment.

CRITICAL RULES — you MUST follow these at all times:
1. NEVER provide a complete working solution or write more than 3-4 lines of code at once.
2. You CAN explain concepts, describe approaches, identify what type of bug something is, and give directional hints.
3. When asked to "write the code" or "solve it", respond with: "I can help you think through the approach, but the implementation is yours to write. Let me describe what the logic should do..."
4. You CAN summarize what existing code does when asked.
5. You CAN point out that a bug exists in a general area WITHOUT showing the fix.
6. Keep responses concise — 2-4 sentences max unless explaining a concept.
7. If the candidate is clearly stuck after 3+ exchanges on the same issue, you may give a slightly stronger hint but still no complete code.

Current context:
- Problem: ${problem?.title ?? "Unknown"}
- Phase: ${phaseData?.label ?? input.phase}
- Phase instructions: ${phaseData?.instructions ?? ""}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(input.conversationHistory ?? []).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user" as const,
          content: input.codeContext
            ? `[Current code context]\n\`\`\`python\n${input.codeContext}\n\`\`\`\n\n${input.message}`
            : input.message,
        },
      ];

      const response = await invokeLLM({ messages });
      const content = response?.choices?.[0]?.message?.content;
      const text =
        typeof content === "string" ? content : JSON.stringify(content ?? "");
      return { reply: text };
    }),

  // Score a single phase based on candidate's code and approach
  scorePhase: protectedProcedure
    .input(
      z.object({
        problemId: z.string(),
        phase: z.enum(["bugFix", "featureImpl", "optimize"]),
        candidateCode: z.string().max(8000),
        timeUsedSeconds: z.number(),
        aiMessagesCount: z.number(),
        selfAssessment: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const problem = AI_CODING_PROBLEMS.find(p => p.id === input.problemId);
      const phaseData = problem?.phases[input.phase];
      const timeLimitSeconds = (phaseData?.minutes ?? 20) * 60;
      const timeUsedPct = Math.min(
        100,
        Math.round((input.timeUsedSeconds / timeLimitSeconds) * 100)
      );

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta senior engineering interviewer scoring a candidate's performance on one phase of the AI-Enabled Coding round.

Score the candidate on Meta's 4 official dimensions (1-4 scale):
- Problem Solving (1=No Progress, 2=Partial, 3=Solid, 4=Exceptional)
- Code Development & Understanding (1-4)
- Verification & Debugging (1-4)  
- Technical Communication (1-4, inferred from code quality and self-assessment)

Also provide:
- phaseVerdict: "Strong Hire" | "Hire" | "No Hire" | "Strong No Hire"
- aiUsageAssessment: how well they used the AI (strategic/over-reliant/under-utilized)
- keyStrengths: array of 2-3 specific observations
- keyImprovements: array of 2-3 specific coaching points
- summary: 2-sentence overall assessment

Return JSON only.`,
          },
          {
            role: "user",
            content: `Problem: ${problem?.title}
Phase: ${phaseData?.label}
Instructions were: ${phaseData?.instructions}

Candidate's code:
\`\`\`python
${input.candidateCode}
\`\`\`

Time used: ${Math.round(input.timeUsedSeconds / 60)} min / ${phaseData?.minutes} min (${timeUsedPct}%)
AI messages sent: ${input.aiMessagesCount}
Self-assessment: ${input.selfAssessment ?? "Not provided"}

Score this phase.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "phase_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                problemSolving: { type: "number" },
                codeDevelopment: { type: "number" },
                verificationDebugging: { type: "number" },
                technicalCommunication: { type: "number" },
                phaseVerdict: { type: "string" },
                aiUsageAssessment: { type: "string" },
                keyStrengths: { type: "array", items: { type: "string" } },
                keyImprovements: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
              },
              required: [
                "problemSolving",
                "codeDevelopment",
                "verificationDebugging",
                "technicalCommunication",
                "phaseVerdict",
                "aiUsageAssessment",
                "keyStrengths",
                "keyImprovements",
                "summary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      const raw =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent ?? {});
      return JSON.parse(raw) as {
        problemSolving: number;
        codeDevelopment: number;
        verificationDebugging: number;
        technicalCommunication: number;
        phaseVerdict: string;
        aiUsageAssessment: string;
        keyStrengths: string[];
        keyImprovements: string[];
        summary: string;
      };
    }),

  // Full session debrief after all 3 phases
  scoreSession: protectedProcedure
    .input(
      z.object({
        problemId: z.string(),
        targetLevel: z.enum(["L5", "L6", "L7"]),
        phase1Score: z
          .object({
            problemSolving: z.number(),
            codeDevelopment: z.number(),
            verificationDebugging: z.number(),
            technicalCommunication: z.number(),
            phaseVerdict: z.string(),
            aiUsageAssessment: z.string(),
            keyStrengths: z.array(z.string()),
            keyImprovements: z.array(z.string()),
            summary: z.string(),
          })
          .optional(),
        phase2Score: z
          .object({
            problemSolving: z.number(),
            codeDevelopment: z.number(),
            verificationDebugging: z.number(),
            technicalCommunication: z.number(),
            phaseVerdict: z.string(),
            aiUsageAssessment: z.string(),
            keyStrengths: z.array(z.string()),
            keyImprovements: z.array(z.string()),
            summary: z.string(),
          })
          .optional(),
        phase3Score: z
          .object({
            problemSolving: z.number(),
            codeDevelopment: z.number(),
            verificationDebugging: z.number(),
            technicalCommunication: z.number(),
            phaseVerdict: z.string(),
            aiUsageAssessment: z.string(),
            keyStrengths: z.array(z.string()),
            keyImprovements: z.array(z.string()),
            summary: z.string(),
          })
          .optional(),
        totalAiMessages: z.number(),
        totalTimeSeconds: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const problem = AI_CODING_PROBLEMS.find(p => p.id === input.problemId);

      // Aggregate scores across phases
      const phases = [
        input.phase1Score,
        input.phase2Score,
        input.phase3Score,
      ].filter(Boolean);
      const avgScore = (dim: string) => {
        const vals = phases
          .map(p => (p as unknown as Record<string, unknown>)[dim])
          .filter((v): v is number => typeof v === "number");
        return vals.length
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) /
              10
          : 0;
      };

      const overallPS = avgScore("problemSolving");
      const overallCD = avgScore("codeDevelopment");
      const overallVD = avgScore("verificationDebugging");
      const overallTC = avgScore("technicalCommunication");
      const overallAvg =
        Math.round(((overallPS + overallCD + overallVD + overallTC) / 4) * 10) /
        10;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta hiring committee member reviewing a candidate's full AI-Enabled Coding interview session. Generate a comprehensive debrief with hiring recommendation.`,
          },
          {
            role: "user",
            content: `Problem: ${problem?.title} (${problem?.topic})
Target Level: ${input.targetLevel}
Total time: ${Math.round(input.totalTimeSeconds / 60)} min
Total AI messages: ${input.totalAiMessages}

Aggregate scores (1-4 scale):
- Problem Solving: ${overallPS}
- Code Development: ${overallCD}
- Verification & Debugging: ${overallVD}
- Technical Communication: ${overallTC}
- Overall average: ${overallAvg}

Phase summaries:
${input.phase1Score ? `Phase 1 (Bug Fix): ${input.phase1Score.summary} | Verdict: ${input.phase1Score.phaseVerdict}` : "Phase 1: Not completed"}
${input.phase2Score ? `Phase 2 (Feature): ${input.phase2Score.summary} | Verdict: ${input.phase2Score.phaseVerdict}` : "Phase 2: Not completed"}
${input.phase3Score ? `Phase 3 (Optimize): ${input.phase3Score.summary} | Verdict: ${input.phase3Score.phaseVerdict}` : "Phase 3: Not completed"}

Generate a full session debrief with hiring recommendation. Return JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "session_debrief",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallVerdict: { type: "string" },
                hiringRecommendation: { type: "string" },
                overallScore: { type: "number" },
                dimensionScores: {
                  type: "object",
                  properties: {
                    problemSolving: { type: "number" },
                    codeDevelopment: { type: "number" },
                    verificationDebugging: { type: "number" },
                    technicalCommunication: { type: "number" },
                  },
                  required: [
                    "problemSolving",
                    "codeDevelopment",
                    "verificationDebugging",
                    "technicalCommunication",
                  ],
                  additionalProperties: false,
                },
                aiCollaborationScore: { type: "string" },
                topStrengths: { type: "array", items: { type: "string" } },
                criticalGaps: { type: "array", items: { type: "string" } },
                levelAssessment: { type: "string" },
                nextSteps: { type: "array", items: { type: "string" } },
                executiveSummary: { type: "string" },
              },
              required: [
                "overallVerdict",
                "hiringRecommendation",
                "overallScore",
                "dimensionScores",
                "aiCollaborationScore",
                "topStrengths",
                "criticalGaps",
                "levelAssessment",
                "nextSteps",
                "executiveSummary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      const raw =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent ?? {});
      return JSON.parse(raw);
    }),
});
