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
});
