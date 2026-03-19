/**
 * PatternQuickReference — Dense cheat-sheet cards for all 14 Meta coding patterns.
 * Design: clean card grid with expandable code template, complexity badges,
 * key signals, canonical problems, and Meta-specific notes.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Database, Zap, BookOpen, Search } from "lucide-react";

interface PatternCard {
  id: string;
  name: string;
  emoji: string;
  tier: "Foundation" | "Core" | "Advanced" | "Expert";
  tierColor: string;
  timeComplexity: string;
  spaceComplexity: string;
  keySignals: string[];
  template: string;
  canonicalProblems: string[];
  metaNote: string;
  keyIdea: string;
}

const PATTERNS: PatternCard[] = [
  {
    id: "arrays-hashing",
    name: "Arrays & Hashing",
    emoji: "🗂️",
    tier: "Foundation",
    tierColor: "blue",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    keySignals: ["Find duplicate / unique", "Count frequencies", "Group by property", "O(1) lookup needed"],
    keyIdea: "Trade memory for speed: store seen values in a hash map to avoid O(n²) scans.",
    template: `# Pattern: Arrays & Hashing
seen = {}
for x in nums:
    complement = target - x
    if complement in seen:
        return [seen[complement], i]
    seen[x] = i`,
    canonicalProblems: ["Two Sum", "Group Anagrams", "Top K Frequent Elements", "Valid Palindrome II", "Product of Array Except Self"],
    metaNote: "Most frequently tested pattern at Meta (~60% of coding rounds). Always consider hash map first.",
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    emoji: "👆",
    tier: "Foundation",
    tierColor: "blue",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    keySignals: ["Sorted array", "Find pair with target sum", "Palindrome check", "Remove duplicates in-place"],
    keyIdea: "Use left/right pointers moving toward each other, or slow/fast for cycle detection.",
    template: `# Pattern: Two Pointers
l, r = 0, len(arr) - 1
while l < r:
    if condition_met(arr[l], arr[r]):
        return result
    elif need_larger:
        l += 1
    else:
        r -= 1`,
    canonicalProblems: ["Valid Palindrome", "3Sum", "Container With Most Water", "Remove Duplicates", "Trapping Rain Water"],
    metaNote: "Often combined with sorting. Know the 'shrink from both ends' and 'fast/slow' variants.",
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    emoji: "🪟",
    tier: "Core",
    tierColor: "green",
    timeComplexity: "O(n)",
    spaceComplexity: "O(k) or O(1)",
    keySignals: ["Contiguous subarray/substring", "Max/min of size k", "Longest with constraint", "At most k distinct"],
    keyIdea: "Expand right pointer; shrink left when constraint violated. Track window state with a counter/map.",
    template: `# Pattern: Sliding Window (variable)
l = 0
window = {}
res = 0
for r in range(len(s)):
    window[s[r]] = window.get(s[r], 0) + 1
    while len(window) > k:          # shrink condition
        window[s[l]] -= 1
        if window[s[l]] == 0:
            del window[s[l]]
        l += 1
    res = max(res, r - l + 1)
return res`,
    canonicalProblems: ["Longest Substring Without Repeating", "Minimum Window Substring", "Sliding Window Maximum", "Permutation in String", "Fruit Into Baskets"],
    metaNote: "Minimum Window Substring is a direct Meta ask. Know both fixed-size and variable-size variants.",
  },
  {
    id: "prefix-sum",
    name: "Prefix Sum",
    emoji: "➕",
    tier: "Foundation",
    tierColor: "blue",
    timeComplexity: "O(n) build, O(1) query",
    spaceComplexity: "O(n)",
    keySignals: ["Range sum queries", "Subarray sum equals k", "Cumulative product", "2D grid sums"],
    keyIdea: "prefix[i] = sum of elements 0..i. Range sum [l,r] = prefix[r] - prefix[l-1].",
    template: `# Pattern: Prefix Sum
prefix = [0] * (len(nums) + 1)
for i, n in enumerate(nums):
    prefix[i+1] = prefix[i] + n

# Range sum [l, r]:
range_sum = prefix[r+1] - prefix[l]

# Subarray sum == k (hash map trick):
count = {0: 1}
curr = 0
for n in nums:
    curr += n
    count[curr - k] = count.get(curr - k, 0)
    res += count.get(curr - k, 0)
    count[curr] = count.get(curr, 0) + 1`,
    canonicalProblems: ["Subarray Sum Equals K", "Range Sum Query", "Product of Array Except Self", "Continuous Subarray Sum", "Path Sum III"],
    metaNote: "Often a sub-technique within harder problems. The hash map variant (subarray sum = k) is very common.",
  },
  {
    id: "binary-search",
    name: "Binary Search",
    emoji: "🔍",
    tier: "Core",
    tierColor: "green",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    keySignals: ["Sorted array", "Find boundary/threshold", "Search on answer space", "Rotated array"],
    keyIdea: "Ask: 'Can I binary search on the answer?' Works when the feasibility function is monotonic.",
    template: `# Pattern: Binary Search (find leftmost valid)
l, r = 0, len(arr) - 1
while l <= r:
    mid = l + (r - l) // 2
    if feasible(mid):
        result = mid
        r = mid - 1   # search left for minimum
    else:
        l = mid + 1
return result

# Search on answer space:
l, r = min_val, max_val
while l < r:
    mid = (l + r) // 2
    if can_achieve(mid): r = mid
    else: l = mid + 1`,
    canonicalProblems: ["Search in Rotated Sorted Array", "Find Min in Rotated Array", "Koko Eating Bananas", "Median of Two Sorted Arrays", "Find Peak Element"],
    metaNote: "Rotated array variants are very common. Know both 'find target' and 'find min' variants cold.",
  },
  {
    id: "trees",
    name: "Trees (BFS / DFS)",
    emoji: "🌳",
    tier: "Advanced",
    tierColor: "amber",
    timeComplexity: "O(n)",
    spaceComplexity: "O(h) DFS, O(w) BFS",
    keySignals: ["Level-order traversal", "Path sum", "Lowest common ancestor", "Serialize/deserialize", "Diameter/depth"],
    keyIdea: "DFS for path/depth problems; BFS for level-order. Always consider the recursive structure.",
    template: `# DFS (recursive)
def dfs(node):
    if not node: return base_case
    left = dfs(node.left)
    right = dfs(node.right)
    return combine(left, right, node.val)

# BFS (level-order)
from collections import deque
q = deque([root])
while q:
    for _ in range(len(q)):   # process level
        node = q.popleft()
        if node.left:  q.append(node.left)
        if node.right: q.append(node.right)`,
    canonicalProblems: ["Binary Tree Level Order Traversal", "Lowest Common Ancestor", "Diameter of Binary Tree", "Serialize and Deserialize Binary Tree", "Binary Tree Right Side View"],
    metaNote: "Highest-frequency pattern at Meta. LCA and Serialize/Deserialize are direct asks. Know both iterative and recursive DFS.",
  },
  {
    id: "graphs",
    name: "Graphs (BFS / DFS)",
    emoji: "🕸️",
    tier: "Expert",
    tierColor: "red",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V + E)",
    keySignals: ["Connected components", "Shortest path (unweighted)", "Cycle detection", "Topological sort", "Grid traversal"],
    keyIdea: "BFS for shortest path; DFS for connectivity/cycles. Always track visited to avoid infinite loops.",
    template: `# BFS (shortest path)
from collections import deque
visited = set([start])
q = deque([(start, 0)])
while q:
    node, dist = q.popleft()
    if node == target: return dist
    for nei in graph[node]:
        if nei not in visited:
            visited.add(nei)
            q.append((nei, dist + 1))

# Topological Sort (Kahn's)
in_degree = {n: 0 for n in graph}
for n in graph:
    for nei in graph[n]: in_degree[nei] += 1
q = deque([n for n in graph if in_degree[n] == 0])
order = []
while q:
    n = q.popleft(); order.append(n)
    for nei in graph[n]:
        in_degree[nei] -= 1
        if in_degree[nei] == 0: q.append(nei)`,
    canonicalProblems: ["Number of Islands", "Clone Graph", "Course Schedule", "Pacific Atlantic Water Flow", "Word Ladder"],
    metaNote: "Grid-based graph problems (Number of Islands variants) are a Meta staple. Know 4-directional BFS cold.",
  },
  {
    id: "heaps",
    name: "Heaps / Priority Queues",
    emoji: "⛰️",
    tier: "Advanced",
    tierColor: "amber",
    timeComplexity: "O(n log k)",
    spaceComplexity: "O(k)",
    keySignals: ["Top K elements", "Kth largest/smallest", "Merge K sorted lists", "Median of stream", "Scheduling"],
    keyIdea: "Use a min-heap of size K to find the K largest elements in O(n log K).",
    template: `import heapq

# Top K largest (min-heap of size k)
heap = []
for n in nums:
    heapq.heappush(heap, n)
    if len(heap) > k:
        heapq.heappop(heap)
return list(heap)

# Two-heap for median (max-heap left, min-heap right)
small = []   # max-heap (negate values)
large = []   # min-heap
def add_num(n):
    heapq.heappush(small, -n)
    heapq.heappush(large, -heapq.heappop(small))
    if len(large) > len(small):
        heapq.heappush(small, -heapq.heappop(large))`,
    canonicalProblems: ["Top K Frequent Elements", "Find Median from Data Stream", "Merge K Sorted Lists", "Kth Largest Element", "Task Scheduler"],
    metaNote: "Find Median from Data Stream (two-heap approach) is a high-frequency Meta question. Know it cold.",
  },
  {
    id: "backtracking",
    name: "Backtracking",
    emoji: "🔙",
    tier: "Expert",
    tierColor: "red",
    timeComplexity: "O(2ⁿ) or O(n!)",
    spaceComplexity: "O(n) recursion depth",
    keySignals: ["All subsets/permutations/combinations", "Constraint satisfaction", "Word search on grid", "Generate all valid strings"],
    keyIdea: "Choose → Explore → Unchoose. The undo step is what makes it backtracking, not just DFS.",
    template: `# Pattern: Backtracking
def backtrack(start, path):
    if is_complete(path):
        result.append(path[:])
        return
    for i in range(start, len(candidates)):
        if not is_valid(candidates[i], path):
            continue
        path.append(candidates[i])       # Choose
        backtrack(i + 1, path)           # Explore
        path.pop()                       # Unchoose

result = []
backtrack(0, [])
return result`,
    canonicalProblems: ["Subsets", "Permutations", "Combination Sum", "Word Search", "Letter Combinations of Phone Number"],
    metaNote: "Meta rarely asks pure DP but does ask backtracking. Word Search is a recurring Meta question.",
  },
  {
    id: "intervals",
    name: "Intervals",
    emoji: "📏",
    tier: "Advanced",
    tierColor: "amber",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    keySignals: ["Merge overlapping ranges", "Count meeting rooms", "Insert into sorted intervals", "Free time windows"],
    keyIdea: "Sort by start. Merge if current.start ≤ prev.end. Use heap for meeting rooms (track end times).",
    template: `# Merge Intervals
intervals.sort(key=lambda x: x[0])
merged = [intervals[0]]
for start, end in intervals[1:]:
    if start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])

# Meeting Rooms II (min-heap of end times)
import heapq
intervals.sort()
heap = []
for start, end in intervals:
    if heap and heap[0] <= start:
        heapq.heapreplace(heap, end)
    else:
        heapq.heappush(heap, end)
return len(heap)`,
    canonicalProblems: ["Merge Intervals", "Insert Interval", "Meeting Rooms II", "Non-Overlapping Intervals", "Employee Free Time"],
    metaNote: "Meeting Rooms II (minimum conference rooms) is a classic Meta interview question.",
  },
  {
    id: "linked-lists",
    name: "Linked Lists",
    emoji: "🔗",
    tier: "Core",
    tierColor: "green",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) in-place",
    keySignals: ["Reverse a list", "Detect cycle", "Find middle", "Merge sorted lists", "LRU Cache"],
    keyIdea: "Draw the pointer diagram before coding. Use a dummy head to avoid null checks at the head.",
    template: `# Reverse Linked List
prev, curr = None, head
while curr:
    nxt = curr.next
    curr.next = prev
    prev = curr
    curr = nxt
return prev

# Fast/Slow pointer (find middle)
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
# slow is now at middle

# LRU Cache: doubly linked list + hash map
# Most recent → head, least recent → tail`,
    canonicalProblems: ["LRU Cache", "Reverse Linked List", "Merge Two Sorted Lists", "Linked List Cycle II", "Reorder List"],
    metaNote: "LRU Cache (doubly linked list + hash map) is a very high-frequency Meta question. Implement from scratch.",
  },
  {
    id: "tries",
    name: "Tries (Prefix Trees)",
    emoji: "🌿",
    tier: "Advanced",
    tierColor: "amber",
    timeComplexity: "O(m) per operation",
    spaceComplexity: "O(total characters)",
    keySignals: ["Prefix matching", "Autocomplete", "Word search with wildcards", "IP routing", "Filesystem paths"],
    keyIdea: "Each node has children[26] and an isEnd flag. Insert and search are both O(m).",
    template: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children: return False
            node = node.children[ch]
        return node.is_end`,
    canonicalProblems: ["Implement Trie", "Word Search II", "Add and Search Words", "Remove Sub-Folders from Filesystem", "Design Search Autocomplete"],
    metaNote: "Implement Trie from scratch is a direct Meta ask. Know it cold. Word Search II uses Trie + backtracking.",
  },
  {
    id: "monotonic-stack",
    name: "Monotonic Stack",
    emoji: "📚",
    tier: "Advanced",
    tierColor: "amber",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    keySignals: ["Next greater/smaller element", "Largest rectangle", "Trapping rain water", "Stock span", "Sliding window max"],
    keyIdea: "Pop elements that violate the monotonic property. The popped element's answer is the current element.",
    template: `# Next Greater Element (monotonic decreasing stack)
stack = []   # stores indices
result = [-1] * len(nums)
for i, n in enumerate(nums):
    while stack and nums[stack[-1]] < n:
        idx = stack.pop()
        result[idx] = n      # n is the next greater for idx
    stack.append(i)
return result

# Largest Rectangle in Histogram
stack = [-1]
max_area = 0
for i, h in enumerate(heights):
    while stack[-1] != -1 and heights[stack[-1]] >= h:
        height = heights[stack.pop()]
        width = i - stack[-1] - 1
        max_area = max(max_area, height * width)
    stack.append(i)`,
    canonicalProblems: ["Daily Temperatures", "Largest Rectangle in Histogram", "Sliding Window Maximum", "Trapping Rain Water", "Next Greater Element"],
    metaNote: "Largest Rectangle in Histogram is a hard Meta question that tests stack mastery.",
  },
  {
    id: "union-find",
    name: "Union-Find (DSU)",
    emoji: "🔀",
    tier: "Expert",
    tierColor: "red",
    timeComplexity: "O(α(n)) ≈ O(1) amortized",
    spaceComplexity: "O(n)",
    keySignals: ["Connected components", "Cycle detection in undirected graph", "Group merging", "Dynamic connectivity"],
    keyIdea: "find() with path compression + union() by rank gives O(α(n)) ≈ O(1) amortized.",
    template: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        self.components -= 1
        return True`,
    canonicalProblems: ["Number of Islands (alt)", "Redundant Connection", "Accounts Merge", "Satisfiability of Equality Equations", "Smallest String With Swaps"],
    metaNote: "Accounts Merge is a direct Meta question. Know both BFS/DFS and Union-Find solutions.",
  },
];

const TIER_STYLES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  Foundation: { bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",   text: "text-blue-700"   },
  Core:       { bg: "bg-green-50",  border: "border-green-200", badge: "bg-green-100 text-green-700", text: "text-green-700"  },
  Advanced:   { bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-100 text-amber-700", text: "text-amber-700"  },
  Expert:     { bg: "bg-red-50",    border: "border-red-200",   badge: "bg-red-100 text-red-700",     text: "text-red-700"    },
};

function PatternCard({ p }: { p: PatternCard }) {
  const [expanded, setExpanded] = useState(false);
  const styles = TIER_STYLES[p.tier];

  return (
    <div className={`rounded-2xl border ${styles.border} overflow-hidden transition-all`}>
      {/* Card Header */}
      <div className={`${styles.bg} px-4 py-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl flex-shrink-0">{p.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.name}
              </h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${styles.badge} mt-0.5 inline-block`}>
                {p.tier}
              </span>
            </div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/60 transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          </button>
        </div>

        {/* Complexity badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/70 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
            <Clock size={9} /> {p.timeComplexity}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/70 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
            <Database size={9} /> {p.spaceComplexity}
          </span>
        </div>
      </div>

      {/* Key Idea — always visible */}
      <div className="px-4 py-2.5 bg-white border-t border-gray-100">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Key Idea</p>
        <p className="text-xs text-gray-700 leading-relaxed">{p.keyIdea}</p>
      </div>

      {/* Key Signals — always visible */}
      <div className="px-4 pb-2.5 bg-white">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Use When</p>
        <div className="flex flex-wrap gap-1">
          {p.keySignals.map(s => (
            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{s}</span>
          ))}
        </div>
      </div>

      {/* Expandable: Code Template + Problems + Meta Note */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Code Template */}
          <div className="px-4 py-3 bg-gray-950">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Code Template</p>
            <pre className="text-[10.5px] text-green-300 leading-relaxed overflow-x-auto font-mono whitespace-pre">
              {p.template}
            </pre>
          </div>

          {/* Canonical Problems */}
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <BookOpen size={10} /> Canonical Problems
            </p>
            <div className="flex flex-wrap gap-1">
              {p.canonicalProblems.map(prob => (
                <span key={prob} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md font-medium">
                  {prob}
                </span>
              ))}
            </div>
          </div>

          {/* Meta Note */}
          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Zap size={10} /> Meta Note
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">{p.metaNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatternQuickReference() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");
  const [expandAll, setExpandAll] = useState(false);

  const tiers = ["All", "Foundation", "Core", "Advanced", "Expert"];

  const filtered = PATTERNS.filter(p => {
    const matchesTier = tierFilter === "All" || p.tier === tierFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) ||
      p.keyIdea.toLowerCase().includes(q) ||
      p.keySignals.some(s => s.toLowerCase().includes(q)) ||
      p.canonicalProblems.some(prob => prob.toLowerCase().includes(q));
    return matchesTier && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pattern Quick Reference
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            All 14 patterns — key idea, complexity, signals, code template, and Meta-specific notes. Click any card to expand.
          </p>
        </div>
        <button
          onClick={() => setExpandAll(e => !e)}
          className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors bg-blue-50"
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patterns, problems, signals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tiers.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                tierFilter === t
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">{filtered.length}</span> of {PATTERNS.length} patterns
        {search && <span>· matching "<span className="font-semibold text-blue-600">{search}</span>"</span>}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No patterns match your search.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(p => (
            <ExpandablePatternCard key={p.id} p={p} forceExpand={expandAll} />
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper that respects both local and global expand state
function ExpandablePatternCard({ p, forceExpand }: { p: PatternCard; forceExpand: boolean }) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = forceExpand || localExpanded;
  const styles = TIER_STYLES[p.tier];

  return (
    <div className={`rounded-2xl border ${styles.border} overflow-hidden transition-all`}>
      {/* Card Header */}
      <div className={`${styles.bg} px-4 py-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl flex-shrink-0">{p.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.name}
              </h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${styles.badge} mt-0.5 inline-block`}>
                {p.tier}
              </span>
            </div>
          </div>
          <button
            onClick={() => setLocalExpanded(e => !e)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/70 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
            <Clock size={9} /> {p.timeComplexity}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-white/70 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
            <Database size={9} /> {p.spaceComplexity}
          </span>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-white border-t border-gray-100">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Key Idea</p>
        <p className="text-xs text-gray-700 leading-relaxed">{p.keyIdea}</p>
      </div>

      <div className="px-4 pb-2.5 bg-white">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Use When</p>
        <div className="flex flex-wrap gap-1">
          {p.keySignals.map(s => (
            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{s}</span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-3 bg-gray-950">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Code Template</p>
            <pre className="text-[10.5px] text-green-300 leading-relaxed overflow-x-auto font-mono whitespace-pre">
              {p.template}
            </pre>
          </div>
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <BookOpen size={10} /> Canonical Problems
            </p>
            <div className="flex flex-wrap gap-1">
              {p.canonicalProblems.map(prob => (
                <span key={prob} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md font-medium">
                  {prob}
                </span>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Zap size={10} /> Meta Note
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">{p.metaNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
