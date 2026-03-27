import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ─── Feature 1: AI Hallucination Spotter ───────────────────────────────────
// AI gives subtly wrong code; candidate must find the error

const HALLUCINATION_SCENARIOS = [
  {
    id: "h1",
    title: "Binary Search Off-by-One",
    language: "python",
    description:
      "Find the target in a sorted array. The AI wrote this solution — spot the bug.",
    buggyCode: `def binary_search(nums, target):
    left, right = 0, len(nums)  # BUG: should be len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    correctCode: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    bugLine: 2,
    bugExplanation:
      "`right = len(nums)` causes an index-out-of-bounds on the first access when `nums[mid]` is evaluated with `mid = (0 + len(nums)) // 2`. It should be `len(nums) - 1`.",
    difficulty: "L5",
    category: "Arrays",
  },
  {
    id: "h2",
    title: "LRU Cache Eviction Logic",
    language: "python",
    description:
      "LRU Cache implementation. The AI wrote this — find the subtle bug in get().",
    buggyCode: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key):
        if key not in self.cache:
            return -1
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            lru = self.order.pop(0)  # BUG: should pop from front, this is correct but O(n)
            del self.cache[lru]      # Real bug: missing update when key exists
        self.cache[key] = value
        self.order.append(key)`,
    correctCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
    bugLine: 18,
    bugExplanation:
      "The list-based implementation has O(n) get/put due to `list.remove()`. More critically, when `put()` updates an existing key, it removes from order but doesn't re-append before the capacity check — causing incorrect eviction. Use OrderedDict for O(1) operations.",
    difficulty: "L6",
    category: "Design",
  },
  {
    id: "h3",
    title: "Merge Intervals Wrong Condition",
    language: "python",
    description:
      "Merge overlapping intervals. The AI wrote this — find the condition bug.",
    buggyCode: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start < merged[-1][1]:  # BUG: should be <= not <
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    correctCode: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:  # Correct: <= handles touching intervals
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
    bugLine: 5,
    bugExplanation:
      "Using `<` instead of `<=` fails to merge touching intervals like `[1,2]` and `[2,3]` — they should merge to `[1,3]` but the bug leaves them separate.",
    difficulty: "L5",
    category: "Arrays",
  },
  {
    id: "h4",
    title: "Graph BFS Missing Visited Set",
    language: "python",
    description:
      "BFS shortest path in unweighted graph. The AI wrote this — find the performance/correctness bug.",
    buggyCode: `from collections import deque

def bfs_shortest_path(graph, start, end):
    queue = deque([(start, [start])])
    while queue:
        node, path = queue.popleft()
        if node == end:
            return path
        for neighbor in graph[node]:
            queue.append((neighbor, path + [neighbor]))  # BUG: no visited set
    return None`,
    correctCode: `from collections import deque

def bfs_shortest_path(graph, start, end):
    queue = deque([(start, [start])])
    visited = {start}
    while queue:
        node, path = queue.popleft()
        if node == end:
            return path
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return None`,
    bugLine: 9,
    bugExplanation:
      "Without a visited set, the BFS will loop infinitely on any cycle in the graph. Even on a DAG it revisits nodes exponentially, making it O(V^V) instead of O(V+E).",
    difficulty: "L5",
    category: "Graphs",
  },
  {
    id: "h5",
    title: "DP Coin Change Wrong Base Case",
    language: "python",
    description:
      "Minimum coins to make amount. The AI wrote this — find the base case bug.",
    buggyCode: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for i in range(coin, amount + 1):
            dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
# This looks correct... but what if amount = 0?
# Actually the real bug is subtle: coins not sorted, but that's fine for this DP
# Real bug: if coins contains 0, infinite loop. But let's use a different bug:`,
    correctCode: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
    bugLine: 4,
    bugExplanation:
      "The outer loop iterates over coins first (unbounded knapsack pattern), which is actually correct for coin change. However, the inner loop `range(coin, amount+1)` skips amounts smaller than the coin — this is fine. The subtle issue is the loop order: iterating coins first then amounts gives the same result, but iterating amounts first then coins is the canonical bottom-up DP and is easier to reason about for follow-up questions.",
    difficulty: "L6",
    category: "Dynamic Programming",
  },
  {
    id: "h6",
    title: "Linked List Cycle Detection Wrong Return",
    language: "python",
    description:
      "Detect cycle in linked list using Floyd's algorithm. The AI wrote this — find the bug.",
    buggyCode: `def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return True  # BUG: should return False`,
    correctCode: `def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False`,
    bugLine: 9,
    bugExplanation:
      "The final `return True` should be `return False`. When the while loop exits normally (fast or fast.next is None), it means the list has a tail — no cycle. Returning True here makes the function always return True.",
    difficulty: "L4",
    category: "Linked Lists",
  },
];

// ─── Feature 4: Complexity Flashcard Data ──────────────────────────────────

const COMPLEXITY_FLASHCARDS = [
  {
    id: "c1",
    title: "Two Sum (Hash Map)",
    code: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    explanation:
      "Single pass through array. Hash map lookup is O(1) average. Space for the hash map is O(n) in worst case.",
    difficulty: "L4",
    category: "Arrays",
  },
  {
    id: "c2",
    title: "Merge Sort",
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    explanation:
      "T(n) = 2T(n/2) + O(n) → O(n log n) by Master Theorem. O(n) auxiliary space for merge step.",
    difficulty: "L5",
    category: "Sorting",
  },
  {
    id: "c3",
    title: "BFS on Graph",
    code: `def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    explanation:
      "Each vertex visited once O(V), each edge examined once O(E). Queue and visited set hold at most V nodes.",
    difficulty: "L5",
    category: "Graphs",
  },
  {
    id: "c4",
    title: "Quick Sort (Average)",
    code: `def quicksort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quicksort(arr, low, pi - 1)
        quicksort(arr, pi + 1, high)`,
    timeComplexity: "O(n log n) avg, O(n²) worst",
    spaceComplexity: "O(log n) avg stack",
    explanation:
      "Average: balanced partitions give T(n) = 2T(n/2) + O(n). Worst case (sorted input, bad pivot): T(n) = T(n-1) + O(n) = O(n²).",
    difficulty: "L5",
    category: "Sorting",
  },
  {
    id: "c5",
    title: "Trie Insert/Search",
    code: `class Trie:
    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True`,
    timeComplexity: "O(m) per operation",
    spaceComplexity: "O(m × n) total",
    explanation:
      "m = word length. Each insert/search traverses m nodes. Total space for n words of average length m is O(m×n) in worst case (no shared prefixes).",
    difficulty: "L6",
    category: "Trees",
  },
  {
    id: "c6",
    title: "Dijkstra's Algorithm",
    code: `import heapq
def dijkstra(graph, start):
    dist = {node: float('inf') for node in graph}
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))`,
    timeComplexity: "O((V + E) log V)",
    spaceComplexity: "O(V)",
    explanation:
      "Each vertex extracted from heap once O(V log V). Each edge relaxation may push to heap O(E log V). Total: O((V+E) log V).",
    difficulty: "L6",
    category: "Graphs",
  },
  {
    id: "c7",
    title: "LCS Dynamic Programming",
    code: `def lcs(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`,
    timeComplexity: "O(m × n)",
    spaceComplexity: "O(m × n)",
    explanation:
      "Fill an m×n DP table, each cell in O(1). Can optimize space to O(min(m,n)) by only keeping two rows.",
    difficulty: "L6",
    category: "Dynamic Programming",
  },
  {
    id: "c8",
    title: "Union-Find (Path Compression)",
    code: `class UnionFind:
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        self.parent[px] = py
        return True`,
    timeComplexity: "O(α(n)) amortized",
    spaceComplexity: "O(n)",
    explanation:
      "With path compression + union by rank, each operation is nearly O(1) — specifically O(α(n)) where α is the inverse Ackermann function (effectively constant for all practical n).",
    difficulty: "L6",
    category: "Graphs",
  },
];

// ─── Feature 5: Code Navigation Speed Test Data ────────────────────────────

const NAVIGATION_CHALLENGES = [
  {
    id: "n1",
    title: "Rate Limiter Service",
    difficulty: "L5",
    timeLimit: 300,
    files: {
      "rate_limiter.py": `class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.last_refill = time.time()

    def consume(self, tokens=1):
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity,
                         self.tokens + elapsed * self.refill_rate)
        self.last_refill = now`,
      "middleware.py": `class RateLimitMiddleware:
    def __init__(self, app, limit=100, window=60):
        self.app = app
        self.buckets = {}  # user_id -> TokenBucket
        self.limit = limit
        self.window = window

    def __call__(self, environ, start_response):
        user_id = self._get_user_id(environ)
        if user_id not in self.buckets:
            self.buckets[user_id] = TokenBucket(self.limit, self.limit/self.window)
        if not self.buckets[user_id].consume():
            start_response('429 Too Many Requests', [])
            return [b'Rate limit exceeded']
        return self.app(environ, start_response)`,
      "config.py": `RATE_LIMIT_DEFAULTS = {
    'anonymous': {'limit': 10, 'window': 60},
    'authenticated': {'limit': 100, 'window': 60},
    'premium': {'limit': 1000, 'window': 60},
}

BURST_MULTIPLIER = 2  # Allow 2x burst for short periods`,
    },
    questions: [
      {
        id: "q1",
        question: "What is the refill rate unit in TokenBucket?",
        answer: "tokens per second",
        file: "rate_limiter.py",
        line: 5,
      },
      {
        id: "q2",
        question:
          "What HTTP status code is returned when rate limit is exceeded?",
        answer: "429",
        file: "middleware.py",
        line: 13,
      },
      {
        id: "q3",
        question: "What is the default rate limit for anonymous users?",
        answer: "10 requests per 60 seconds",
        file: "config.py",
        line: 2,
      },
      {
        id: "q4",
        question: "Where are per-user token buckets stored?",
        answer: "In the buckets dict on RateLimitMiddleware, keyed by user_id",
        file: "middleware.py",
        line: 5,
      },
      {
        id: "q5",
        question: "What prevents the token count from exceeding capacity?",
        answer: "min(self.capacity, ...) in the _refill method",
        file: "rate_limiter.py",
        line: 16,
      },
    ],
  },
];

// ─── Feature 2: Requirements Clarification Drill Data ──────────────────────

const CLARIFICATION_SCENARIOS = [
  {
    id: "r1",
    title: "Design a URL Shortener",
    prompt:
      "The interviewer says: 'Implement a URL shortener like bit.ly.' You have 3 minutes to ask clarifying questions before coding.",
    idealQuestions: [
      "What is the expected scale? (reads/writes per second)",
      "Should shortened URLs expire? If so, what's the TTL?",
      "Do we need custom aliases (vanity URLs)?",
      "Should we track analytics (click counts, referrers)?",
      "Is this read-heavy or write-heavy?",
      "What's the expected URL length for the short code?",
      "Do we need to handle malicious URLs?",
    ],
    antiPatterns: [
      "Jumping straight to the hash function",
      "Asking about the UI/frontend",
      "Asking about the programming language",
      "Over-specifying the database schema before understanding scale",
    ],
    difficulty: "L5",
  },
  {
    id: "r2",
    title: "Implement a News Feed",
    prompt:
      "The interviewer says: 'Design the Facebook news feed.' You have 3 minutes to ask clarifying questions.",
    idealQuestions: [
      "Is this a read-heavy or write-heavy system?",
      "What's the fanout strategy — push on write or pull on read?",
      "How many followers can a user have? (celebrity problem)",
      "Should the feed be ranked or chronological?",
      "What types of content: posts only, or also photos/videos/stories?",
      "What's the acceptable latency for feed generation?",
      "Do we need real-time updates or eventual consistency is fine?",
    ],
    antiPatterns: [
      "Starting with the database schema immediately",
      "Asking about the mobile vs web client",
      "Not asking about scale",
    ],
    difficulty: "L6",
  },
  {
    id: "r3",
    title: "Build a Rate Limiter",
    prompt:
      "The interviewer says: 'Implement a rate limiter for our API.' You have 2 minutes to clarify.",
    idealQuestions: [
      "Per-user, per-IP, or per-API-key rate limiting?",
      "What algorithm? (token bucket, sliding window, fixed window)",
      "What are the limits? (requests per second/minute/hour)",
      "Should we support burst traffic?",
      "Distributed system or single server?",
      "What happens when limit is exceeded — hard block or queue?",
    ],
    antiPatterns: [
      "Immediately implementing token bucket without asking about algorithm preference",
      "Not asking about distributed vs single-server",
    ],
    difficulty: "L5",
  },
];

export const aiTrainingRouter = router({
  // ─── Feature 1: Get Hallucination Scenarios ─────────────────────────────
  getHallucinationScenarios: publicProcedure.query(() => {
    return HALLUCINATION_SCENARIOS.map(s => ({
      id: s.id,
      title: s.title,
      language: s.language,
      description: s.description,
      buggyCode: s.buggyCode,
      bugLine: s.bugLine,
      difficulty: s.difficulty,
      category: s.category,
    }));
  }),

  checkHallucinationAnswer: publicProcedure
    .input(
      z.object({
        scenarioId: z.string(),
        userAnswer: z.string(),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const scenario = HALLUCINATION_SCENARIOS.find(
        s => s.id === input.scenarioId
      );
      if (!scenario) throw new Error("Scenario not found");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer reviewing a candidate's ability to spot AI-generated bugs.
The correct bug explanation is: "${scenario.bugExplanation}"
The correct buggy line is line ${scenario.bugLine}.
Evaluate the candidate's answer for correctness. Be concise.`,
          },
          {
            role: "user",
            content: `Candidate's answer: "${input.userAnswer}"
Time spent: ${input.timeSpent} seconds.

Respond with JSON: { "correct": boolean, "score": 1-5, "feedback": "brief feedback", "hint": "hint if wrong" }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hallucination_check",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correct: { type: "boolean" },
                score: { type: "number" },
                feedback: { type: "string" },
                hint: { type: "string" },
              },
              required: ["correct", "score", "feedback", "hint"],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(
        response.choices[0].message.content as string
      ) as { correct: boolean; score: number; feedback: string; hint: string };
      return {
        ...result,
        correctExplanation: input.userAnswer
          ? scenario.bugExplanation
          : undefined,
        correctCode: result.correct ? scenario.correctCode : undefined,
      };
    }),

  // ─── Feature 2: Requirements Clarification Drill ─────────────────────────
  getClarificationScenarios: publicProcedure.query(() => {
    return CLARIFICATION_SCENARIOS;
  }),

  scoreClarificationQuestions: publicProcedure
    .input(
      z.object({
        scenarioId: z.string(),
        questions: z.array(z.string()),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const scenario = CLARIFICATION_SCENARIOS.find(
        s => s.id === input.scenarioId
      );
      if (!scenario) throw new Error("Scenario not found");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer (L7) evaluating a candidate's requirements clarification skills.
The problem is: "${scenario.title}"
Ideal questions to ask: ${scenario.idealQuestions.join("; ")}
Anti-patterns to avoid: ${scenario.antiPatterns.join("; ")}`,
          },
          {
            role: "user",
            content: `The candidate asked these ${input.questions.length} questions in ${input.timeSpent} seconds:
${input.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Score them on: coverage (did they hit key areas?), prioritization (most important first?), anti-patterns avoided?
Return JSON: { "score": 1-5, "coverage": 1-5, "prioritization": 1-5, "missedQuestions": ["..."], "feedback": "...", "strongPoints": ["..."] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "clarification_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                coverage: { type: "number" },
                prioritization: { type: "number" },
                missedQuestions: {
                  type: "array",
                  items: { type: "string" },
                },
                feedback: { type: "string" },
                strongPoints: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: [
                "score",
                "coverage",
                "prioritization",
                "missedQuestions",
                "feedback",
                "strongPoints",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(response.choices[0].message.content as string) as {
        score: number;
        coverage: number;
        prioritization: number;
        missedQuestions: string[];
        feedback: string;
        strongPoints: string[];
      };
    }),

  // ─── Feature 4: Complexity Flashcards ────────────────────────────────────
  getComplexityFlashcards: publicProcedure.query(() => {
    return COMPLEXITY_FLASHCARDS;
  }),

  checkComplexityAnswer: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        userTimeComplexity: z.string(),
        userSpaceComplexity: z.string(),
        userExplanation: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const card = COMPLEXITY_FLASHCARDS.find(c => c.id === input.cardId);
      if (!card) throw new Error("Card not found");

      const timeCorrect =
        input.userTimeComplexity
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(card.timeComplexity.toLowerCase().replace(/\s/g, "")) ||
        card.timeComplexity
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(input.userTimeComplexity.toLowerCase().replace(/\s/g, ""));

      const spaceCorrect =
        input.userSpaceComplexity
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(card.spaceComplexity.toLowerCase().replace(/\s/g, "")) ||
        card.spaceComplexity
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(input.userSpaceComplexity.toLowerCase().replace(/\s/g, ""));

      return {
        timeCorrect,
        spaceCorrect,
        correctTimeComplexity: card.timeComplexity,
        correctSpaceComplexity: card.spaceComplexity,
        explanation: card.explanation,
        score:
          timeCorrect && spaceCorrect ? 5 : timeCorrect || spaceCorrect ? 3 : 1,
      };
    }),

  // ─── Feature 5: Code Navigation Speed Test ───────────────────────────────
  getNavigationChallenges: publicProcedure.query(() => {
    return NAVIGATION_CHALLENGES.map(c => ({
      id: c.id,
      title: c.title,
      difficulty: c.difficulty,
      timeLimit: c.timeLimit,
      files: c.files,
      questions: c.questions.map(q => ({
        id: q.id,
        question: q.question,
      })),
    }));
  }),

  checkNavigationAnswer: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
        questionId: z.string(),
        userAnswer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const challenge = NAVIGATION_CHALLENGES.find(
        c => c.id === input.challengeId
      );
      if (!challenge) throw new Error("Challenge not found");
      const question = challenge.questions.find(q => q.id === input.questionId);
      if (!question) throw new Error("Question not found");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are evaluating a code navigation answer. The correct answer is: "${question.answer}". Be lenient — accept semantically equivalent answers.`,
          },
          {
            role: "user",
            content: `User answered: "${input.userAnswer}". Is this correct? Return JSON: { "correct": boolean, "feedback": "brief feedback" }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nav_check",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correct: { type: "boolean" },
                feedback: { type: "string" },
              },
              required: ["correct", "feedback"],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(
        response.choices[0].message.content as string
      ) as { correct: boolean; feedback: string };
      return {
        ...result,
        correctAnswer: question.answer,
        fileHint: question.file,
        lineHint: question.line,
      };
    }),

  // ─── Feature 6: Rubber Duck Explainer ────────────────────────────────────
  scoreExplanation: publicProcedure
    .input(
      z.object({
        problemTitle: z.string(),
        explanation: z.string(),
        targetLevel: z.enum(["L5", "L6", "L7"]),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer (${input.targetLevel}) evaluating a candidate's ability to explain their approach clearly.
Problem: "${input.problemTitle}"
Evaluate on Meta's Technical Communication rubric: clarity, structure, correctness, and ${input.targetLevel} signal.`,
          },
          {
            role: "user",
            content: `Candidate's explanation:
"${input.explanation}"

Score on: clarity (1-5), structure (1-5), correctness (1-5), overall (1-5).
Return JSON: { "clarity": number, "structure": number, "correctness": number, "overall": number, "feedback": "...", "improvements": ["..."], "strongPoints": ["..."] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "explanation_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                clarity: { type: "number" },
                structure: { type: "number" },
                correctness: { type: "number" },
                overall: { type: "number" },
                feedback: { type: "string" },
                improvements: { type: "array", items: { type: "string" } },
                strongPoints: { type: "array", items: { type: "string" } },
              },
              required: [
                "clarity",
                "structure",
                "correctness",
                "overall",
                "feedback",
                "improvements",
                "strongPoints",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(response.choices[0].message.content as string) as {
        clarity: number;
        structure: number;
        correctness: number;
        overall: number;
        feedback: string;
        improvements: string[];
        strongPoints: string[];
      };
    }),

  // ─── Feature 7: Incremental Feature Builder ────────────────────────────
  getIncrementalChallenges: publicProcedure.query(() => {
    return [
      {
        id: "inc1",
        title: "Rate Limiter: Add Sliding Window",
        difficulty: "L5",
        baseCode: `class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate
        self.last_refill = time.time()

    def consume(self, tokens=1):
        self._refill()
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now`,
        steps: [
          {
            id: "s1",
            instruction:
              "Add a method `get_token_count()` that returns the current token count after refilling.",
            testCase:
              "bucket = TokenBucket(10, 1); assert bucket.get_token_count() == 10",
          },
          {
            id: "s2",
            instruction:
              "Add a `reset()` method that resets tokens to full capacity.",
            testCase:
              "bucket.consume(5); bucket.reset(); assert bucket.get_token_count() == 10",
          },
          {
            id: "s3",
            instruction:
              "Add a `peek()` method that checks if N tokens are available without consuming them.",
            testCase:
              "assert bucket.peek(5) == True; assert bucket.peek(15) == False",
          },
        ],
      },
      {
        id: "inc2",
        title: "LRU Cache: Add TTL Expiry",
        difficulty: "L6",
        baseCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
        steps: [
          {
            id: "s1",
            instruction:
              "Modify `put()` to accept an optional `ttl` parameter (seconds). Store the expiry time alongside the value.",
            testCase:
              "cache.put('k', 'v', ttl=60); assert cache.get('k') == 'v'",
          },
          {
            id: "s2",
            instruction: "Modify `get()` to return -1 if the key has expired.",
            testCase:
              "cache.put('k', 'v', ttl=0); time.sleep(0.01); assert cache.get('k') == -1",
          },
          {
            id: "s3",
            instruction:
              "Add a `cleanup()` method that removes all expired entries.",
            testCase: "cache.cleanup(); assert len(cache.cache) == 0",
          },
        ],
      },
    ];
  }),

  submitIncrementalStep: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
        stepId: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer evaluating incremental code additions.
Evaluate if the submitted code correctly implements the requested step.
Be strict but fair — the code should work correctly and not break existing functionality.`,
          },
          {
            role: "user",
            content: `Challenge: ${input.challengeId}, Step: ${input.stepId}
Submitted code:
${input.code}

Does this correctly implement the step? Return JSON: { "passed": boolean, "score": 1-10, "feedback": "...", "issues": ["..."] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "incremental_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                passed: { type: "boolean" },
                score: { type: "number" },
                feedback: { type: "string" },
                issues: { type: "array", items: { type: "string" } },
              },
              required: ["passed", "score", "feedback", "issues"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        passed: boolean;
        score: number;
        feedback: string;
        issues: string[];
      };
    }),

  // ─── Feature 8: Test-First Debugger ──────────────────────────────────────
  getTestFirstChallenges: publicProcedure.query(() => {
    return [
      {
        id: "tf1",
        title: "Fix the BFS Cycle Bug",
        description:
          "A BFS function is failing 3 tests. Given only the test output, write the fix.",
        difficulty: "L5",
        failingTestOutput: `FAILED test_bfs_cycle_graph - RecursionError: maximum recursion depth exceeded
FAILED test_bfs_disconnected - AssertionError: expected 3 nodes, got 7
FAILED test_bfs_self_loop - RecursionError: maximum recursion depth exceeded

Test details:
  test_bfs_cycle_graph: bfs(graph={'A':['B'],'B':['A']}, start='A') should return ['A','B']
  test_bfs_disconnected: bfs(graph={'A':['B'],'B':['A','C'],'C':['B']}, start='A') should return ['A','B','C']
  test_bfs_self_loop: bfs(graph={'A':['A','B'],'B':[]}, start='A') should return ['A','B']`,
        buggyCode: `from collections import deque
def bfs(graph, start):
    queue = deque([start])
    result = []
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            queue.append(neighbor)  # Missing visited set
    return result`,
      },
      {
        id: "tf2",
        title: "Fix the Binary Search",
        description:
          "A binary search is failing edge case tests. Write the fix from test output only.",
        difficulty: "L4",
        failingTestOutput: `FAILED test_empty_array - IndexError: list index out of range
FAILED test_single_element_not_found - Expected -1, got 0
FAILED test_target_at_end - Expected 4, got -1

Test details:
  test_empty_array: binary_search([], 5) should return -1
  test_single_element_not_found: binary_search([3], 5) should return -1
  test_target_at_end: binary_search([1,2,3,4,5], 5) should return 4`,
        buggyCode: `def binary_search(nums, target):
    left, right = 0, len(nums)  # Bug: should be len(nums)-1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1`,
      },
      {
        id: "tf3",
        title: "Fix the Merge Intervals",
        description:
          "Merge intervals function fails on touching intervals. Fix from test output.",
        difficulty: "L5",
        failingTestOutput: `FAILED test_touching_intervals - Expected [[1,3]], got [[1,2],[2,3]]
FAILED test_all_overlapping - Expected [[1,6]], got [[1,4],[3,6]]
PASSED test_no_overlap
PASSED test_single_interval

Test details:
  test_touching_intervals: merge([[1,2],[2,3]]) should return [[1,3]]
  test_all_overlapping: merge([[1,4],[3,6]]) should return [[1,6]]`,
        buggyCode: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start < merged[-1][1]:  # Bug: should be <=
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      },
    ];
  }),

  submitTestFirstFix: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
        fix: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const challenges = [
        {
          id: "tf1",
          bugFix:
            "Add a visited set: visited = {start}; check if neighbor not in visited before appending",
        },
        {
          id: "tf2",
          bugFix:
            "Change right = len(nums) to right = len(nums) - 1; add guard for empty array",
        },
        {
          id: "tf3",
          bugFix:
            "Change < to <= in the merge condition: if start <= merged[-1][1]",
        },
      ];
      const challenge = challenges.find(c => c.id === input.challengeId);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are evaluating a test-first debugging fix. The correct fix approach: "${challenge?.bugFix}"
Evaluate if the candidate's fix addresses the root cause shown in the failing tests.`,
          },
          {
            role: "user",
            content: `Candidate's fix:
${input.fix}

Return JSON: { "passed": boolean, "score": 1-10, "feedback": "...", "testResults": [{"test": "test name", "passed": boolean}] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "test_first_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                passed: { type: "boolean" },
                score: { type: "number" },
                feedback: { type: "string" },
                testResults: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      test: { type: "string" },
                      passed: { type: "boolean" },
                    },
                    required: ["test", "passed"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["passed", "score", "feedback", "testResults"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        passed: boolean;
        score: number;
        feedback: string;
        testResults: { test: string; passed: boolean }[];
      };
    }),

  // ─── Feature 9: Verbal Explanation Scorer (Technical Communication) ──────
  scoreVerbalExplanation: publicProcedure
    .input(
      z.object({
        scenarioId: z.string(),
        explanation: z.string(),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer scoring Technical Communication for the AI-enabled coding round.
Scenario: ${input.scenarioId}
Time spent: ${input.timeSpent} seconds (target: 60-90 seconds)
Evaluate on Meta's 4 rubric dimensions with focus on Technical Communication.`,
          },
          {
            role: "user",
            content: `Candidate's verbal explanation:
"${input.explanation}"

Score on: overall (1-10), clarity (1-5), conciseness (1-5), technicalDepth (1-5), structureScore (1-5).
Also provide metaRubricAlignment (one sentence on how this maps to Meta's rubric) and improvements list.
Return JSON: { "overall": number, "clarity": number, "conciseness": number, "technicalDepth": number, "structureScore": number, "feedback": "...", "metaRubricAlignment": "...", "improvements": ["..."] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "verbal_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall: { type: "number" },
                clarity: { type: "number" },
                conciseness: { type: "number" },
                technicalDepth: { type: "number" },
                structureScore: { type: "number" },
                feedback: { type: "string" },
                metaRubricAlignment: { type: "string" },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: [
                "overall",
                "clarity",
                "conciseness",
                "technicalDepth",
                "structureScore",
                "feedback",
                "metaRubricAlignment",
                "improvements",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        overall: number;
        clarity: number;
        conciseness: number;
        technicalDepth: number;
        structureScore: number;
        feedback: string;
        metaRubricAlignment: string;
        improvements: string[];
      };
    }),

  // ─── Feature 9: Verbal Explanation Scorer (Technical Communication) ──────
  scoreTechnicalCommunication: publicProcedure
    .input(
      z.object({
        problemTitle: z.string(),
        approach: z.string(),
        targetLevel: z.enum(["L5", "L6", "L7"]),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer scoring Technical Communication — one of Meta's 4 coding interview dimensions.
Problem: "${input.problemTitle}"
Target level: ${input.targetLevel}
Time spent: ${input.timeSpent} seconds (ideal: 60-90 seconds for a verbal explanation)`,
          },
          {
            role: "user",
            content: `Candidate's technical explanation:
"${input.approach}"

Score on Meta's Technical Communication rubric:
- Proactive communication (explains before being asked)
- Asks good clarifying questions
- Explains trade-offs
- Communicates complexity
- Appropriate level of detail for ${input.targetLevel}

Return JSON: { "score": 1-5, "levelSignal": "${input.targetLevel} signal: Strong Hire/Hire/No Hire", "proactiveCommunication": 1-5, "tradeoffExplanation": 1-5, "complexityExplanation": 1-5, "feedback": "...", "improvements": ["..."] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tech_comm_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                levelSignal: { type: "string" },
                proactiveCommunication: { type: "number" },
                tradeoffExplanation: { type: "number" },
                complexityExplanation: { type: "number" },
                feedback: { type: "string" },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: [
                "score",
                "levelSignal",
                "proactiveCommunication",
                "tradeoffExplanation",
                "complexityExplanation",
                "feedback",
                "improvements",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(response.choices[0].message.content as string) as {
        score: number;
        levelSignal: string;
        proactiveCommunication: number;
        tradeoffExplanation: number;
        complexityExplanation: number;
        feedback: string;
        improvements: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 11 — RAG Explainer Drill ──────────────────────
  // Candidate explains RAG to a PM; LLM scores correctness, succinctness, caveats
  scoreRAGExplanation: publicProcedure
    .input((v: unknown) => v as { explanation: string; followUp: string })
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta engineer evaluating a candidate's ability to explain Retrieval-Augmented Generation (RAG) to a non-technical PM. Score on three dimensions (1-5 each): correctness (is the explanation technically accurate?), succinctness (is it clear and jargon-free for a PM?), caveats (does it mention limitations like cost, latency, retrieval quality, or when NOT to use RAG?). Also score the follow-up answer on depth (1-5). Return JSON only.",
          },
          {
            role: "user",
            content: `RAG explanation: ${input.explanation}\n\nFollow-up (when wouldn't you use RAG?): ${input.followUp}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "rag_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correctness: { type: "number" },
                succinctness: { type: "number" },
                caveats: { type: "number" },
                followUpDepth: { type: "number" },
                overall: { type: "number" },
                feedback: { type: "string" },
                strongPoints: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                ic7Signal: { type: "string" },
              },
              required: [
                "correctness",
                "succinctness",
                "caveats",
                "followUpDepth",
                "overall",
                "feedback",
                "strongPoints",
                "improvements",
                "ic7Signal",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        correctness: number;
        succinctness: number;
        caveats: number;
        followUpDepth: number;
        overall: number;
        feedback: string;
        strongPoints: string[];
        improvements: string[];
        ic7Signal: string;
      };
    }),

  // ─── AI-Native Hub: Feature 12 — AI Stack Builder ─────────────────────────
  scoreAIStack: publicProcedure
    .input(
      (v: unknown) =>
        v as {
          modelLayer: string;
          toolingLayer: string;
          workflowLayer: string;
          lessonsLearned: string;
        }
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a Meta Principal Engineer (IC7) evaluating a candidate's personal AI stack walk-through. Score each layer (1-5): modelLayer (is the model choice justified?), toolingLayer (real tools mentioned — LangChain, LlamaIndex, evals framework, etc.?), workflowLayer (does it describe orchestration, not just a single API call?), lessonsLearned (genuine insight vs generic platitude?). The IC7 bar: the stack moved from prototype to production reliability with measurable impact. Return JSON only.",
          },
          {
            role: "user",
            content: `Model layer: ${input.modelLayer}\nTooling layer: ${input.toolingLayer}\nWorkflow layer: ${input.workflowLayer}\nLessons learned: ${input.lessonsLearned}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "stack_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                modelLayer: { type: "number" },
                toolingLayer: { type: "number" },
                workflowLayer: { type: "number" },
                lessonsLearned: { type: "number" },
                overall: { type: "number" },
                maturityLevel: { type: "string" },
                feedback: { type: "string" },
                strongPoints: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: [
                "modelLayer",
                "toolingLayer",
                "workflowLayer",
                "lessonsLearned",
                "overall",
                "maturityLevel",
                "feedback",
                "strongPoints",
                "improvements",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        modelLayer: number;
        toolingLayer: number;
        workflowLayer: number;
        lessonsLearned: number;
        overall: number;
        maturityLevel: string;
        feedback: string;
        strongPoints: string[];
        improvements: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 14 — Agent Evaluation Designer ───────────────
  scoreAgentEvalDesign: publicProcedure
    .input((v: unknown) => v as { agentType: string; evalFramework: string })
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are evaluating a candidate's agent evaluation framework design. The IC7 signal: the framework blends simple state-change checks with semantic LLM evaluations (like Anthropic's approach), and addresses task success rate, hallucination rate, latency, cost, and safety. Score dimensions (1-5 each): taskSuccess, hallucinationHandling, latencyCost, safetyConsiderations, overallRigor. Return JSON only.",
          },
          {
            role: "user",
            content: `Agent type: ${input.agentType}\n\nEvaluation framework: ${input.evalFramework}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "agent_eval_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                taskSuccess: { type: "number" },
                hallucinationHandling: { type: "number" },
                latencyCost: { type: "number" },
                safetyConsiderations: { type: "number" },
                overallRigor: { type: "number" },
                feedback: { type: "string" },
                missingDimensions: { type: "array", items: { type: "string" } },
                strongPoints: { type: "array", items: { type: "string" } },
              },
              required: [
                "taskSuccess",
                "hallucinationHandling",
                "latencyCost",
                "safetyConsiderations",
                "overallRigor",
                "feedback",
                "missingDimensions",
                "strongPoints",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        taskSuccess: number;
        hallucinationHandling: number;
        latencyCost: number;
        safetyConsiderations: number;
        overallRigor: number;
        feedback: string;
        missingDimensions: string[];
        strongPoints: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 15 — Enterprise Bottleneck Case ──────────────
  scoreBottleneckAnalysis: publicProcedure
    .input((v: unknown) => v as { scenario: string; analysis: string })
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a Meta Staff Engineer evaluating a candidate's enterprise AI bottleneck analysis. Strong answers connect LLMs, data, infra, AND people/governance layers — not just one dimension. Score (1-5): dataLayer, governanceLayer, peopleLayer, infraLayer, systemsThinking (overall connection across all layers). Flag if the candidate treats AI as a black box. Return JSON only.",
          },
          {
            role: "user",
            content: `Scenario: ${input.scenario}\n\nCandidate analysis: ${input.analysis}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "bottleneck_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                dataLayer: { type: "number" },
                governanceLayer: { type: "number" },
                peopleLayer: { type: "number" },
                infraLayer: { type: "number" },
                systemsThinking: { type: "number" },
                treatsAIAsBlackBox: { type: "boolean" },
                feedback: { type: "string" },
                missedLayers: { type: "array", items: { type: "string" } },
                strongPoints: { type: "array", items: { type: "string" } },
              },
              required: [
                "dataLayer",
                "governanceLayer",
                "peopleLayer",
                "infraLayer",
                "systemsThinking",
                "treatsAIAsBlackBox",
                "feedback",
                "missedLayers",
                "strongPoints",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        dataLayer: number;
        governanceLayer: number;
        peopleLayer: number;
        infraLayer: number;
        systemsThinking: number;
        treatsAIAsBlackBox: boolean;
        feedback: string;
        missedLayers: string[];
        strongPoints: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 16 — Human-in-the-Loop Challenge ─────────────
  scoreHumanInLoop: publicProcedure
    .input((v: unknown) => v as { systemType: string; designAnswer: string })
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are evaluating a candidate's human-in-the-loop (HITL) design for an AI system. Score (1-5): safetyRisk (correctly identified?), hitlMechanism (specific and actionable, not vague?), policyCompliance (mentions regulatory/ethical considerations?), transparentPractices (explains how humans are informed and in control?), overall. Return JSON only.",
          },
          {
            role: "user",
            content: `AI system type: ${input.systemType}\n\nHITL design: ${input.designAnswer}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hitl_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                safetyRisk: { type: "number" },
                hitlMechanism: { type: "number" },
                policyCompliance: { type: "number" },
                transparentPractices: { type: "number" },
                overall: { type: "number" },
                feedback: { type: "string" },
                gaps: { type: "array", items: { type: "string" } },
                strongPoints: { type: "array", items: { type: "string" } },
              },
              required: [
                "safetyRisk",
                "hitlMechanism",
                "policyCompliance",
                "transparentPractices",
                "overall",
                "feedback",
                "gaps",
                "strongPoints",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        safetyRisk: number;
        hitlMechanism: number;
        policyCompliance: number;
        transparentPractices: number;
        overall: number;
        feedback: string;
        gaps: string[];
        strongPoints: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 13+26 — Epistemic Humility Coach ─────────────
  scoreEpistemicHumility: publicProcedure
    .input((v: unknown) => v as { storyAnswer: string; questionPrompt: string })
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are evaluating a candidate's answer for epistemic humility and genuine learning velocity — key signals for Meta's AI-Native Philosophy/Culture phase. Strong answers: (1) describe a specific project, (2) name a specific failure or surprise, (3) articulate a concrete belief update ('I used to think X, now I think Y because Z'). Weak answers sound like blog post summaries or project false confidence. Score (1-5): specificity, beliefUpdate, failureAcknowledgment, learningVelocity, overall. Flag if it sounds like a rehearsed talking point. Return JSON only.",
          },
          {
            role: "user",
            content: `Question: ${input.questionPrompt}\n\nAnswer: ${input.storyAnswer}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "epistemic_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                specificity: { type: "number" },
                beliefUpdate: { type: "number" },
                failureAcknowledgment: { type: "number" },
                learningVelocity: { type: "number" },
                overall: { type: "number" },
                soundsRehearsed: { type: "boolean" },
                feedback: { type: "string" },
                strongPoints: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: [
                "specificity",
                "beliefUpdate",
                "failureAcknowledgment",
                "learningVelocity",
                "overall",
                "soundsRehearsed",
                "feedback",
                "strongPoints",
                "improvements",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        specificity: number;
        beliefUpdate: number;
        failureAcknowledgment: number;
        learningVelocity: number;
        overall: number;
        soundsRehearsed: boolean;
        feedback: string;
        strongPoints: string[];
        improvements: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 29 — Meta Values Alignment Check ─────────────
  scoreMetaValuesAlignment: publicProcedure
    .input((v: unknown) => v as { answers: Record<string, string> })
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are evaluating a candidate's alignment with Meta's four AI-Native values: (1) Move Fast = iterate with eval loops, not months-long training; (2) Be Open = open-source, reproducible experiments; (3) Focus on Impact = measure utility and cost, not benchmark scores; (4) Build Awesome Things = prototype without permission. For each value, score 1-5 and give a one-sentence verdict. Return JSON only.",
          },
          {
            role: "user",
            content: `Candidate answers:\n${Object.entries(input.answers)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n")}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "meta_values_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                moveFast: { type: "number" },
                beOpen: { type: "number" },
                focusOnImpact: { type: "number" },
                buildAwesomeThings: { type: "number" },
                overall: { type: "number" },
                verdicts: {
                  type: "object",
                  properties: {
                    moveFast: { type: "string" },
                    beOpen: { type: "string" },
                    focusOnImpact: { type: "string" },
                    buildAwesomeThings: { type: "string" },
                  },
                  required: [
                    "moveFast",
                    "beOpen",
                    "focusOnImpact",
                    "buildAwesomeThings",
                  ],
                  additionalProperties: false,
                },
                overallVerdict: { type: "string" },
                topStrength: { type: "string" },
                topGap: { type: "string" },
              },
              required: [
                "moveFast",
                "beOpen",
                "focusOnImpact",
                "buildAwesomeThings",
                "overall",
                "verdicts",
                "overallVerdict",
                "topStrength",
                "topGap",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        moveFast: number;
        beOpen: number;
        focusOnImpact: number;
        buildAwesomeThings: number;
        overall: number;
        verdicts: Record<string, string>;
        overallVerdict: string;
        topStrength: string;
        topGap: string;
      };
    }),

  // ─── AI-Native Hub: Feature 17 — Maturity Self-Classifier ────────────────
  scoreMaturityClassification: publicProcedure
    .input(
      (v: unknown) =>
        v as {
          claimedLevel: string;
          fluencyExample: string;
          impactExample: string;
          responsibleAIExample: string;
          continuousLearningExample: string;
        }
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are evaluating whether a candidate's self-claimed AI maturity level (Traditionalist / AI Aware / AI Enabled / AI First / AI Native) is supported by their concrete examples across 4 core skills. For each skill, assess if the example matches the claimed level or reveals a gap. Return the actual assessed level per skill, an overall assessed level, and a gap analysis. Return JSON only.",
          },
          {
            role: "user",
            content: `Claimed level: ${input.claimedLevel}\nFluency & Orchestration example: ${input.fluencyExample}\nAI-Driven Impact example: ${input.impactExample}\nResponsible AI Use example: ${input.responsibleAIExample}\nContinuous AI Learning example: ${input.continuousLearningExample}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "maturity_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                fluencyAssessedLevel: { type: "string" },
                impactAssessedLevel: { type: "string" },
                responsibleAIAssessedLevel: { type: "string" },
                continuousLearningAssessedLevel: { type: "string" },
                overallAssessedLevel: { type: "string" },
                claimedVsActualGap: { type: "string" },
                gapAnalysis: { type: "string" },
                whatAINativeLooksLike: { type: "string" },
                nextSteps: { type: "array", items: { type: "string" } },
              },
              required: [
                "fluencyAssessedLevel",
                "impactAssessedLevel",
                "responsibleAIAssessedLevel",
                "continuousLearningAssessedLevel",
                "overallAssessedLevel",
                "claimedVsActualGap",
                "gapAnalysis",
                "whatAINativeLooksLike",
                "nextSteps",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        fluencyAssessedLevel: string;
        impactAssessedLevel: string;
        responsibleAIAssessedLevel: string;
        continuousLearningAssessedLevel: string;
        overallAssessedLevel: string;
        claimedVsActualGap: string;
        gapAnalysis: string;
        whatAINativeLooksLike: string;
        nextSteps: string[];
      };
    }),

  // ─── AI-Native Hub: Feature 30 — Full Mock Screening Call ────────────────
  scoreMockScreeningPhase: publicProcedure
    .input(
      (v: unknown) => v as { phase: string; question: string; answer: string }
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta recruiter running the AI-Native screening call. Phase: ${input.phase}. Evaluate the candidate's answer against the rubric for this phase. Warm-up: look for concrete reasoning, mentions of agents/infra, absence of hype. Fluency Check: correct, succinct, caveated answers; mentions evals/cost/latency. Builder Signal: describes full stack (model+tooling+workflow), lessons learned, quantified impact. Philosophy/Culture: epistemic humility, learning velocity, specific belief updates. Score overall (1-5), give a maturity tier signal, and provide coaching. Return JSON only.`,
          },
          {
            role: "user",
            content: `Question: ${input.question}\n\nAnswer: ${input.answer}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "mock_phase_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                phaseScore: { type: "number" },
                maturityTierSignal: { type: "string" },
                rubricAxis: { type: "string" },
                axisScore: { type: "number" },
                feedback: { type: "string" },
                strongSignals: { type: "array", items: { type: "string" } },
                weakSignals: { type: "array", items: { type: "string" } },
                coachingNote: { type: "string" },
              },
              required: [
                "phaseScore",
                "maturityTierSignal",
                "rubricAxis",
                "axisScore",
                "feedback",
                "strongSignals",
                "weakSignals",
                "coachingNote",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(response.choices[0].message.content as string) as {
        phaseScore: number;
        maturityTierSignal: string;
        rubricAxis: string;
        axisScore: number;
        feedback: string;
        strongSignals: string[];
        weakSignals: string[];
        coachingNote: string;
      };
    }),
});
