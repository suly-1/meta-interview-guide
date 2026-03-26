// Feature #12: Debugging Under Time Pressure
// 20 pre-built buggy codebases, 8-minute countdown, hit rate tracking
// Bug types: type casting, off-by-one, incorrect conditionals, missing visited set
// Drawn from real Meta Phase 1 candidate reports

import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import {
  Bug,
  Timer,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Trophy,
  Zap,
  AlertCircle,
  Eye,
  EyeOff,
  BarChart2,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ── Bug Data ─────────────────────────────────────────────────────────────────

interface BugChallenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  bugType: string;
  description: string;
  buggyCode: string;
  fixedCode: string;
  hint: string;
  explanation: string;
  metaContext: string;
}

const BUG_CHALLENGES: BugChallenge[] = [
  {
    id: "b01",
    title: "Integer Division Truncation",
    difficulty: "Easy",
    bugType: "Type Casting",
    description:
      "This function calculates the average of a list of scores. It's returning wrong results for odd-length lists.",
    buggyCode: `def average_score(scores: list[int]) -> float:
    total = 0
    for s in scores:
        total += s
    return total / len(scores)  # Bug: integer division in Python 2 style

# Test: average_score([1, 2, 3]) should return 2.0
# But with integer inputs and Python 2 semantics it truncates`,
    fixedCode: `def average_score(scores: list[int]) -> float:
    total = 0
    for s in scores:
        total += s
    return float(total) / len(scores)  # Fixed: explicit float cast`,
    hint: "What happens when you divide two integers in Python 2? What if the codebase has a `from __future__` import missing?",
    explanation:
      "The bug is integer division truncation. In Python 2 (or if the codebase targets Python 2 semantics), `total / len(scores)` performs integer division and truncates the decimal. The fix is `float(total) / len(scores)` or using `//` explicitly for integer division and `/` for float.",
    metaContext:
      "Meta Phase 1 reports frequently mention type casting bugs — int cast to double when the system expects int, or vice versa.",
  },
  {
    id: "b02",
    title: "Off-by-One in Sliding Window",
    difficulty: "Medium",
    bugType: "Off-by-One",
    description:
      "This function finds the maximum sum subarray of size k. It's returning the wrong answer for arrays where the max window is at the end.",
    buggyCode: `def max_window_sum(arr: list[int], k: int) -> int:
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(len(arr) - k):  # Bug: should be range(1, len(arr) - k + 1)
        window_sum = window_sum - arr[i] + arr[i + k]
        max_sum = max(max_sum, window_sum)
    return max_sum`,
    fixedCode: `def max_window_sum(arr: list[int], k: int) -> int:
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(1, len(arr) - k + 1):  # Fixed: start at 1, include last window
        window_sum = window_sum - arr[i - 1] + arr[i + k - 1]
        max_sum = max(max_sum, window_sum)
    return max_sum`,
    hint: "Trace through arr=[1,2,3,4,5], k=3. How many windows are there? Does the loop cover all of them?",
    explanation:
      "The loop `range(len(arr) - k)` starts at 0 and goes to `len(arr)-k-1`, missing the last window. The fix is `range(1, len(arr) - k + 1)` — start at index 1 (since we already computed window starting at 0) and include the window starting at `len(arr)-k`.",
    metaContext:
      "Off-by-one errors in loop bounds are the second most common Phase 1 bug type at Meta.",
  },
  {
    id: "b03",
    title: "Missing Visited Set in BFS",
    difficulty: "Medium",
    bugType: "Missing Visited Set",
    description:
      "This BFS function finds the shortest path in a graph. It works on small inputs but times out or crashes on graphs with cycles.",
    buggyCode: `from collections import deque

def bfs_shortest_path(graph: dict, start: str, end: str) -> int:
    queue = deque([(start, 0)])
    while queue:
        node, dist = queue.popleft()
        if node == end:
            return dist
        for neighbor in graph.get(node, []):
            queue.append((neighbor, dist + 1))  # Bug: no visited check
    return -1`,
    fixedCode: `from collections import deque

def bfs_shortest_path(graph: dict, start: str, end: str) -> int:
    queue = deque([(start, 0)])
    visited = {start}  # Fixed: track visited nodes
    while queue:
        node, dist = queue.popleft()
        if node == end:
            return dist
        for neighbor in graph.get(node, []):
            if neighbor not in visited:  # Fixed: only enqueue unvisited
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return -1`,
    hint: "What happens if the graph has a cycle A→B→A? How many times will each node be enqueued?",
    explanation:
      "Without a visited set, BFS on a cyclic graph will loop infinitely (or until memory exhaustion). The fix is to track visited nodes and only enqueue unvisited neighbors. This is the exact bug type mentioned in the E7 Meta candidate report: 'a safety check was capping iterations at 10,000 when the real fix was adding a visited set.'",
    metaContext:
      "This is the exact bug described by an E7 Meta candidate: the system had a 10,000-iteration cap as a band-aid, but the real fix was a visited set.",
  },
  {
    id: "b04",
    title: "Incorrect Conditional in Binary Search",
    difficulty: "Medium",
    bugType: "Incorrect Conditional",
    description:
      "This binary search returns the index of a target in a sorted array. It works for most cases but fails when the target is at the last position.",
    buggyCode: `def binary_search(arr: list[int], target: int) -> int:
    left, right = 0, len(arr) - 1
    while left < right:  # Bug: should be left <= right
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    fixedCode: `def binary_search(arr: list[int], target: int) -> int:
    left, right = 0, len(arr) - 1
    while left <= right:  # Fixed: include case where left == right
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    hint: "What happens when the target is the last element? Trace left=4, right=4 with `left < right`.",
    explanation:
      "When `left == right` and that element is the target, `left < right` is False so the loop exits without checking it. The fix is `left <= right` to include the single-element case.",
    metaContext:
      "Incorrect conditionals (< vs <=, > vs >=) are the third most common Phase 1 bug type at Meta.",
  },
  {
    id: "b05",
    title: "Integer Overflow in Midpoint",
    difficulty: "Easy",
    bugType: "Integer Overflow",
    description:
      "This function computes the midpoint for binary search. It works on small arrays but produces wrong results on large arrays.",
    buggyCode: `def find_mid(left: int, right: int) -> int:
    return (left + right) // 2  # Bug: left + right can overflow in 32-bit systems`,
    fixedCode: `def find_mid(left: int, right: int) -> int:
    return left + (right - left) // 2  # Fixed: overflow-safe midpoint`,
    hint: "What if left = 2^30 and right = 2^30 + 1 in a 32-bit integer system?",
    explanation:
      "In languages with 32-bit integers (Java, C++), `left + right` can overflow when both are large. The overflow-safe formula is `left + (right - left) // 2`. Python has arbitrary-precision integers so this doesn't crash in Python, but it's still a bug in a cross-language codebase.",
    metaContext:
      "Meta codebases often mix Python and C++/Java. A midpoint overflow that's safe in Python can cause silent bugs in the C++ layer.",
  },
  {
    id: "b06",
    title: "Mutable Default Argument",
    difficulty: "Easy",
    bugType: "Mutable Default",
    description:
      "This function builds a path in a tree traversal. It produces correct results on the first call but accumulates garbage on subsequent calls.",
    buggyCode: `def find_path(node, target, path=[]):  # Bug: mutable default argument
    path.append(node.val)
    if node.val == target:
        return path
    for child in node.children:
        result = find_path(child, target, path)
        if result:
            return result
    path.pop()
    return None`,
    fixedCode: `def find_path(node, target, path=None):  # Fixed: None sentinel
    if path is None:
        path = []
    path.append(node.val)
    if node.val == target:
        return path
    for child in node.children:
        result = find_path(child, target, path)
        if result:
            return result
    path.pop()
    return None`,
    hint: "In Python, default argument values are evaluated once at function definition time. What does that mean for a list?",
    explanation:
      "Python evaluates default arguments once. The `path=[]` list is shared across all calls that don't pass a path. After the first call, `path` contains leftover values. The fix is `path=None` and `if path is None: path = []` inside the function.",
    metaContext:
      "This is a classic Python gotcha that appears in Meta codebases. The bug is subtle because it only manifests on the second call.",
  },
  {
    id: "b07",
    title: "Wrong Comparison for Heap",
    difficulty: "Medium",
    bugType: "Incorrect Conditional",
    description:
      "This function finds the k largest elements using a min-heap. It returns wrong results when elements have duplicates.",
    buggyCode: `import heapq

def k_largest(nums: list[int], k: int) -> list[int]:
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)  # Bug: this is correct but the comparison below is wrong
    return sorted(heap, reverse=True)

# Actually the bug is in a helper that uses this:
def is_larger(a: int, b: int) -> bool:
    return a > b  # Bug: should be a >= b to handle duplicates in some contexts
    # This causes the heap to evict duplicates incorrectly`,
    fixedCode: `import heapq

def k_largest(nums: list[int], k: int) -> list[int]:
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True)

def is_larger_or_equal(a: int, b: int) -> bool:
    return a >= b  # Fixed: >= handles duplicates correctly`,
    hint: "What happens with nums=[3,3,3,1,2], k=3? Should duplicates be included?",
    explanation:
      "Using strict `>` instead of `>=` in comparisons can incorrectly exclude duplicate values. For k-largest with duplicates, `>=` ensures all valid elements are included.",
    metaContext:
      "Heap-based problems with duplicates are common in Meta coding rounds. The bug is often in the comparison operator.",
  },
  {
    id: "b08",
    title: "String Concatenation in Loop",
    difficulty: "Easy",
    bugType: "Performance Bug",
    description:
      "This function builds a result string by concatenating characters. It's correct but O(n²) — Meta interviewers flag this as a bug in performance-sensitive code.",
    buggyCode: `def reverse_words(sentence: str) -> str:
    words = sentence.split()
    result = ""
    for word in reversed(words):
        result += word + " "  # Bug: O(n²) string concatenation
    return result.strip()`,
    fixedCode: `def reverse_words(sentence: str) -> str:
    words = sentence.split()
    return " ".join(reversed(words))  # Fixed: O(n) join`,
    hint: "In Python, strings are immutable. What is the time complexity of `result += word` in a loop of n iterations?",
    explanation:
      "String concatenation in a loop is O(n²) because each `+=` creates a new string and copies all previous characters. The fix is to collect parts in a list and use `join()` at the end, which is O(n).",
    metaContext:
      "Meta Phase 1 sometimes includes performance bugs that are 'correct but wrong' — the code produces right output but at unacceptable complexity.",
  },
  {
    id: "b09",
    title: "Race Condition in Counter",
    difficulty: "Hard",
    bugType: "Concurrency",
    description:
      "This counter class is used in a multi-threaded environment. It produces incorrect counts under concurrent access.",
    buggyCode: `class Counter:
    def __init__(self):
        self.count = 0
    
    def increment(self):
        self.count += 1  # Bug: not thread-safe; read-modify-write is not atomic
    
    def get(self) -> int:
        return self.count`,
    fixedCode: `import threading

class Counter:
    def __init__(self):
        self.count = 0
        self._lock = threading.Lock()  # Fixed: add lock
    
    def increment(self):
        with self._lock:  # Fixed: atomic read-modify-write
            self.count += 1
    
    def get(self) -> int:
        with self._lock:
            return self.count`,
    hint: "What happens if two threads both read `self.count = 5`, both compute `5 + 1 = 6`, and both write `self.count = 6`?",
    explanation:
      "The `+=` operation is not atomic: it's a read, then a compute, then a write. Two threads can interleave these steps and lose an increment. The fix is a threading.Lock() to make the increment atomic.",
    metaContext:
      "Meta's infrastructure is heavily multi-threaded. Concurrency bugs appear in Phase 1 for senior (E6+) candidates.",
  },
  {
    id: "b10",
    title: "Null Pointer in Linked List",
    difficulty: "Easy",
    bugType: "Null Dereference",
    description:
      "This function reverses a linked list. It crashes with a NullPointerException on empty lists.",
    buggyCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode) -> ListNode:
    prev = head.next  # Bug: crashes if head is None
    curr = head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`,
    fixedCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode) -> ListNode:
    if not head:  # Fixed: guard against empty list
        return None
    prev = None  # Fixed: prev starts as None, not head.next
    curr = head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`,
    hint: "What should `prev` be initialized to? What is the last node's `next` after reversal?",
    explanation:
      "Two bugs: (1) `prev = head.next` crashes on empty list and is logically wrong — prev should start as None. (2) No null check for empty input. The last node after reversal should point to None, so `prev = None` is correct.",
    metaContext:
      "Null pointer bugs in linked list traversal are extremely common in Meta Phase 1. Always guard against empty input.",
  },
  {
    id: "b11",
    title: "Incorrect Base Case in Recursion",
    difficulty: "Medium",
    bugType: "Incorrect Conditional",
    description:
      "This recursive function computes the number of ways to climb n stairs (1 or 2 steps at a time). It returns wrong results for n=1 and n=2.",
    buggyCode: `def climb_stairs(n: int) -> int:
    if n == 0:  # Bug: missing base case for n == 1
        return 1
    return climb_stairs(n - 1) + climb_stairs(n - 2)  # Bug: n-2 can be negative`,
    fixedCode: `def climb_stairs(n: int) -> int:
    if n <= 0:
        return 0
    if n == 1:  # Fixed: explicit base case
        return 1
    if n == 2:  # Fixed: explicit base case
        return 2
    return climb_stairs(n - 1) + climb_stairs(n - 2)`,
    hint: "What does climb_stairs(1) return with the buggy code? What about climb_stairs(-1)?",
    explanation:
      "The buggy code has no base case for n=1, so it recurses to n=0 and n=-1. climb_stairs(-1) then recurses to -2 and -3, causing infinite recursion. The fix adds explicit base cases for n=1 and n=2.",
    metaContext:
      "Missing or incorrect base cases in recursion are a common Phase 1 bug. Meta interviewers look for candidates who think about edge cases first.",
  },
  {
    id: "b12",
    title: "Wrong Return in Two-Sum",
    difficulty: "Easy",
    bugType: "Logic Error",
    description:
      "This function finds two numbers in an array that add up to a target. It returns indices but the order is sometimes wrong.",
    buggyCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [i, seen[complement]]  # Bug: returns [later, earlier] instead of [earlier, later]
        seen[num] = i
    return []`,
    fixedCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]  # Fixed: [earlier_index, later_index]
        seen[num] = i
    return []`,
    hint: "When we find the complement, which index came first in the array — `seen[complement]` or `i`?",
    explanation:
      "When we find a complement, `seen[complement]` holds the index of the earlier element and `i` is the current (later) index. The correct order is `[seen[complement], i]`. The buggy code returns them reversed.",
    metaContext:
      "Return value ordering bugs are subtle and easy to miss under time pressure. Meta interviewers check this with test cases like [3,2,4], target=6.",
  },
  {
    id: "b13",
    title: "Shared State in Backtracking",
    difficulty: "Hard",
    bugType: "Mutable State",
    description:
      "This function generates all subsets of a list. It produces duplicates or missing subsets due to shared state.",
    buggyCode: `def subsets(nums: list[int]) -> list[list[int]]:
    result = []
    current = []
    
    def backtrack(start):
        result.append(current)  # Bug: appends reference, not copy
        for i in range(start, len(nums)):
            current.append(nums[i])
            backtrack(i + 1)
            current.pop()
    
    backtrack(0)
    return result`,
    fixedCode: `def subsets(nums: list[int]) -> list[list[int]]:
    result = []
    current = []
    
    def backtrack(start):
        result.append(current[:])  # Fixed: append a copy
        for i in range(start, len(nums)):
            current.append(nums[i])
            backtrack(i + 1)
            current.pop()
    
    backtrack(0)
    return result`,
    hint: "What is `result` after backtrack(0) returns? Are the lists in result independent objects or references to the same list?",
    explanation:
      "Appending `current` adds a reference to the same list object. As `current` is modified during backtracking, all previously appended 'copies' change too. The fix is `current[:]` to append a shallow copy.",
    metaContext:
      "Shared mutable state in backtracking is a frequent Phase 1 bug at Meta. It's especially tricky because the output looks partially correct.",
  },
  {
    id: "b14",
    title: "Float Comparison Precision",
    difficulty: "Easy",
    bugType: "Float Precision",
    description:
      "This function checks if two computed values are equal. It fails intermittently due to floating-point precision.",
    buggyCode: `def is_balanced(weights: list[float]) -> bool:
    left_sum = sum(weights[:len(weights)//2])
    right_sum = sum(weights[len(weights)//2:])
    return left_sum == right_sum  # Bug: float equality comparison`,
    fixedCode: `def is_balanced(weights: list[float]) -> bool:
    left_sum = sum(weights[:len(weights)//2])
    right_sum = sum(weights[len(weights)//2:])
    return abs(left_sum - right_sum) < 1e-9  # Fixed: epsilon comparison`,
    hint: "What is 0.1 + 0.2 in Python? Is it exactly 0.3?",
    explanation:
      "Floating-point arithmetic is not exact. `0.1 + 0.2 == 0.3` is False in Python (it's 0.30000000000000004). The fix is to compare with an epsilon: `abs(a - b) < 1e-9`.",
    metaContext:
      "Float precision bugs appear in Meta's ML and ads systems code. Phase 1 sometimes includes a float comparison bug.",
  },
  {
    id: "b15",
    title: "Wrong Initialization for Max",
    difficulty: "Easy",
    bugType: "Initialization",
    description:
      "This function finds the maximum product of two elements in an array. It fails when all elements are negative.",
    buggyCode: `def max_product_pair(nums: list[int]) -> int:
    max_prod = 0  # Bug: 0 is wrong initial value when all nums are negative
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            max_prod = max(max_prod, nums[i] * nums[j])
    return max_prod`,
    fixedCode: `def max_product_pair(nums: list[int]) -> int:
    max_prod = float('-inf')  # Fixed: use negative infinity as initial value
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            max_prod = max(max_prod, nums[i] * nums[j])
    return max_prod`,
    hint: "What does max_product_pair([-3, -2, -1]) return with the buggy code? What should it return?",
    explanation:
      "Initializing max_prod to 0 means the function returns 0 for all-negative arrays (since all products are negative, none beat 0). The fix is `float('-inf')` so any product will be larger.",
    metaContext:
      "Wrong initialization for min/max tracking is a classic interview bug. Meta interviewers test with all-negative arrays specifically.",
  },
  {
    id: "b16",
    title: "Missing Return in Recursive DFS",
    difficulty: "Medium",
    bugType: "Missing Return",
    description:
      "This DFS function checks if a target exists in a binary tree. It always returns None even when the target is found.",
    buggyCode: `def dfs_find(root, target):
    if root is None:
        return False
    if root.val == target:
        return True
    dfs_find(root.left, target)   # Bug: missing return
    dfs_find(root.right, target)  # Bug: missing return`,
    fixedCode: `def dfs_find(root, target):
    if root is None:
        return False
    if root.val == target:
        return True
    return dfs_find(root.left, target) or dfs_find(root.right, target)  # Fixed`,
    hint: "What does a Python function return if it reaches the end without a return statement?",
    explanation:
      "Without `return`, the recursive calls' results are discarded. The function falls through to the end and returns None (falsy). The fix is to `return` the result of the recursive calls, combined with `or` for either branch.",
    metaContext:
      "Missing return in recursive DFS is one of the most common bugs in Meta Phase 1. It's subtle because the function 'works' — it just always returns None.",
  },
  {
    id: "b17",
    title: "Index Out of Bounds in Matrix",
    difficulty: "Medium",
    bugType: "Off-by-One",
    description:
      "This function counts the number of islands in a binary matrix. It crashes with IndexError on matrices with cells at the boundary.",
    buggyCode: `def num_islands(grid: list[list[str]]) -> int:
    rows, cols = len(grid), len(grid[0])
    count = 0
    
    def dfs(r, c):
        if grid[r][c] == '0':  # Bug: no bounds check before accessing grid
            return
        grid[r][c] = '0'
        dfs(r+1, c)
        dfs(r-1, c)
        dfs(r, c+1)
        dfs(r, c-1)
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c)
                count += 1
    return count`,
    fixedCode: `def num_islands(grid: list[list[str]]) -> int:
    rows, cols = len(grid), len(grid[0])
    count = 0
    
    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols:  # Fixed: bounds check first
            return
        if grid[r][c] == '0':
            return
        grid[r][c] = '0'
        dfs(r+1, c)
        dfs(r-1, c)
        dfs(r, c+1)
        dfs(r, c-1)
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c)
                count += 1
    return count`,
    hint: "What happens when dfs is called on a cell at row 0? What does dfs(r-1, c) do?",
    explanation:
      "The bounds check must come before the grid access. Without it, `dfs(r-1, c)` when r=0 accesses `grid[-1][c]` (Python wraps to last row) or crashes in other languages. The fix is to check bounds first and return early.",
    metaContext:
      "Bounds checking order bugs are extremely common in matrix DFS problems. Meta interviewers specifically test boundary cells.",
  },
  {
    id: "b18",
    title: "Incorrect Modulo for Negative Numbers",
    difficulty: "Medium",
    bugType: "Type Casting",
    description:
      "This function implements a circular buffer index. It produces negative indices when moving backwards.",
    buggyCode: `def circular_index(current: int, step: int, size: int) -> int:
    return (current + step) % size  # Bug: Python % is always non-negative, but Java/C++ % can be negative`,
    fixedCode: `def circular_index(current: int, step: int, size: int) -> int:
    return ((current + step) % size + size) % size  # Fixed: handles negative step in all languages`,
    hint: "What is (-1) % 5 in Python vs Java? Try it.",
    explanation:
      "In Python, `(-1) % 5 = 4` (always non-negative). In Java/C++, `(-1) % 5 = -1`. If this code is being ported or the step can be negative, the safe formula is `((x % n) + n) % n` which works correctly in all languages.",
    metaContext:
      "Meta codebases often span Python and Java/C++. A modulo that works in Python can produce negative indices in Java, causing array index exceptions.",
  },
  {
    id: "b19",
    title: "Stale Cache After Update",
    difficulty: "Hard",
    bugType: "Caching Bug",
    description:
      "This LRU cache implementation has a bug: after updating an existing key, the key is not moved to the most-recently-used position.",
    buggyCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity
    
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache[key] = value  # Bug: updates value but doesn't move to end
        else:
            self.cache[key] = value
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)`,
    fixedCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity
    
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)  # Fixed: move to end on update
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
    hint: "After `put(key, new_value)` on an existing key, what position should that key be in?",
    explanation:
      "In an LRU cache, accessing or updating a key makes it the most recently used. The buggy code updates the value but doesn't call `move_to_end`, so the key stays in its old position and may be incorrectly evicted.",
    metaContext:
      "LRU cache bugs are extremely common at Meta — they build LRU caches throughout their infrastructure. This exact bug (update without move_to_end) appears in real Meta Phase 1 reports.",
  },
  {
    id: "b20",
    title: "Wrong Heap Property for K-th Largest",
    difficulty: "Hard",
    bugType: "Logic Error",
    description:
      "This function finds the k-th largest element using a heap. It returns the wrong element because the heap type is incorrect.",
    buggyCode: `import heapq

def kth_largest(nums: list[int], k: int) -> int:
    # Use a max-heap by negating values
    heap = [-n for n in nums[:k]]
    heapq.heapify(heap)  # Bug: this is a max-heap, but we want a min-heap of size k
    
    for num in nums[k:]:
        if -num > heap[0]:  # Bug: wrong comparison direction
            heapq.heapreplace(heap, -num)
    
    return -heap[0]`,
    fixedCode: `import heapq

def kth_largest(nums: list[int], k: int) -> int:
    # Use a min-heap of size k — the root is always the k-th largest
    heap = nums[:k]
    heapq.heapify(heap)  # Fixed: min-heap (no negation needed)
    
    for num in nums[k:]:
        if num > heap[0]:  # Fixed: if current num is larger than smallest in heap
            heapq.heapreplace(heap, num)
    
    return heap[0]  # Fixed: root of min-heap is k-th largest`,
    hint: "For k-th largest, do you want a max-heap or min-heap? What should the heap root represent?",
    explanation:
      "For k-th largest, maintain a min-heap of size k. The root (minimum of the heap) is always the k-th largest element seen so far. The buggy code uses a max-heap (negated values) with incorrect comparison logic. The fix uses a plain min-heap — simpler and correct.",
    metaContext:
      "Heap type confusion (max vs min) is a common Phase 1 bug. Meta interviewers look for candidates who can reason about which heap type is appropriate.",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttemptRecord {
  challengeId: string;
  solved: boolean;
  timeSeconds: number;
  hintsUsed: number;
  timestamp: number;
}

interface SessionStats {
  totalAttempted: number;
  totalSolved: number;
  avgTimeSeconds: number;
  fastestTimeSeconds: number;
  hintRate: number;
}

// ── Timer Hook ────────────────────────────────────────────────────────────────

function useCountdownTimer(initialSeconds: number, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((secs = initialSeconds) => {
    setRunning(false);
    setSecondsLeft(secs);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const pct = (secondsLeft / initialSeconds) * 100;
  const urgent = secondsLeft <= 60;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return { secondsLeft, running, start, pause, reset, pct, urgent, display: `${mm}:${ss}` };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DebuggingDrillTab() {
  const [attempts, setAttempts] = useLocalStorage<AttemptRecord[]>("debug-drill-attempts", []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<"select" | "active" | "result">("select");
  const [userCode, setUserCode] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [sessionStart, setSessionStart] = useState(0);
  const [filter, setFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const challenge = BUG_CHALLENGES[currentIdx];

  const handleExpire = useCallback(() => {
    toast.error("Time's up! The solution has been revealed.", { duration: 4000 });
    setShowSolution(true);
  }, []);

  const timer = useCountdownTimer(8 * 60, handleExpire);

  const startChallenge = (idx: number) => {
    setCurrentIdx(idx);
    setUserCode(BUG_CHALLENGES[idx].buggyCode);
    setShowHint(false);
    setShowSolution(false);
    setHintsUsed(0);
    setSessionStart(Date.now());
    timer.reset(8 * 60);
    setPhase("active");
    setTimeout(() => timer.start(), 100);
  };

  const handleRevealHint = () => {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed((h) => h + 1);
    }
  };

  const handleSubmit = (solved: boolean) => {
    timer.pause();
    const elapsed = Math.round((Date.now() - sessionStart) / 1000);
    const record: AttemptRecord = {
      challengeId: challenge.id,
      solved,
      timeSeconds: elapsed,
      hintsUsed,
      timestamp: Date.now(),
    };
    setAttempts((prev) => [record, ...prev.slice(0, 199)]);
    setPhase("result");
    if (solved) {
      toast.success(`Solved in ${Math.floor(elapsed / 60)}m ${elapsed % 60}s!`, { duration: 3000 });
    }
  };

  const filteredChallenges = BUG_CHALLENGES.filter(
    (c) => filter === "All" || c.difficulty === filter
  );

  // Compute stats
  const stats: SessionStats = (() => {
    if (attempts.length === 0)
      return { totalAttempted: 0, totalSolved: 0, avgTimeSeconds: 0, fastestTimeSeconds: 0, hintRate: 0 };
    const solved = attempts.filter((a) => a.solved);
    const avg = attempts.reduce((s, a) => s + a.timeSeconds, 0) / attempts.length;
    const fastest = solved.length > 0 ? Math.min(...solved.map((a) => a.timeSeconds)) : 0;
    const hintRate = attempts.filter((a) => a.hintsUsed > 0).length / attempts.length;
    return {
      totalAttempted: attempts.length,
      totalSolved: solved.length,
      avgTimeSeconds: Math.round(avg),
      fastestTimeSeconds: fastest,
      hintRate: Math.round(hintRate * 100),
    };
  })();

  const hitRate = stats.totalAttempted > 0
    ? Math.round((stats.totalSolved / stats.totalAttempted) * 100)
    : 0;

  const getAttemptForChallenge = (id: string) =>
    attempts.find((a) => a.challengeId === id);

  // ── Select Phase ────────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bug size={20} className="text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Debugging Under Time Pressure
              </h2>
              <Badge variant="outline" className="text-xs border-red-200 text-red-600">
                Meta Phase 1
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              20 pre-built buggy codebases drawn from real Meta Phase 1 reports. 8 minutes per
              challenge. Find and fix the bug before time runs out.
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        {stats.totalAttempted > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Target size={14} />, label: "Hit Rate", value: `${hitRate}%`, color: hitRate >= 70 ? "text-emerald-600" : hitRate >= 40 ? "text-amber-600" : "text-red-600" },
              { icon: <CheckCircle2 size={14} />, label: "Solved", value: `${stats.totalSolved}/${stats.totalAttempted}`, color: "text-blue-600" },
              { icon: <Clock size={14} />, label: "Avg Time", value: `${Math.floor(stats.avgTimeSeconds / 60)}m ${stats.avgTimeSeconds % 60}s`, color: "text-gray-600" },
              { icon: <Zap size={14} />, label: "Hint Rate", value: `${stats.hintRate}%`, color: stats.hintRate <= 30 ? "text-emerald-600" : "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-2">
                <span className={cn("flex-shrink-0", s.color)}>{s.icon}</span>
                <div>
                  <div className={cn("text-lg font-bold leading-tight", s.color)}>{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {(["All", "Easy", "Medium", "Hard"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                filter === f
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Challenge List */}
        <div className="space-y-2">
          {filteredChallenges.map((c) => {
            const attempt = getAttemptForChallenge(c.id);
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className={cn(
                  "bg-white dark:bg-gray-800 rounded-xl border transition-all",
                  attempt?.solved
                    ? "border-emerald-200 dark:border-emerald-800"
                    : attempt
                    ? "border-red-200 dark:border-red-900"
                    : "border-gray-100 dark:border-gray-700"
                )}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0">
                    {attempt?.solved ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : attempt ? (
                      <XCircle size={18} className="text-red-400" />
                    ) : (
                      <Circle size={18} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {c.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          c.difficulty === "Easy" && "border-emerald-200 text-emerald-600",
                          c.difficulty === "Medium" && "border-amber-200 text-amber-600",
                          c.difficulty === "Hard" && "border-red-200 text-red-600"
                        )}
                      >
                        {c.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-blue-100 text-blue-500">
                        {c.bugType}
                      </Badge>
                      {attempt && (
                        <span className="text-xs text-gray-400">
                          {Math.floor(attempt.timeSeconds / 60)}m {attempt.timeSeconds % 60}s
                          {attempt.hintsUsed > 0 && ` · ${attempt.hintsUsed} hint`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {c.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <Button
                      size="sm"
                      onClick={() => startChallenge(BUG_CHALLENGES.findIndex((x) => x.id === c.id))}
                      className="text-xs h-7 px-3"
                    >
                      {attempt ? "Retry" : "Start"}
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-50 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{c.description}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                      Meta context: {c.metaContext}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Active Phase ────────────────────────────────────────────────────────────
  if (phase === "active") {
    return (
      <div className="space-y-4">
        {/* Timer + Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Bug size={16} className="text-red-500" />
              <span className="font-bold text-gray-900 dark:text-white">{challenge.title}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  challenge.difficulty === "Easy" && "border-emerald-200 text-emerald-600",
                  challenge.difficulty === "Medium" && "border-amber-200 text-amber-600",
                  challenge.difficulty === "Hard" && "border-red-200 text-red-600"
                )}
              >
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs border-blue-100 text-blue-500">
                {challenge.bugType}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{challenge.description}</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg transition-all",
            timer.urgent
              ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
              : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          )}>
            <Timer size={16} />
            {timer.display}
          </div>
        </div>

        {/* Timer bar */}
        <Progress
          value={timer.pct}
          className={cn("h-1.5", timer.urgent ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500")}
        />

        {/* Meta context */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-2.5">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Meta context:</span> {challenge.metaContext}
          </p>
        </div>

        {/* Code Editor */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-gray-400 font-mono">solution.py</span>
          </div>
          <Editor
            height="320px"
            language="python"
            value={showSolution ? challenge.fixedCode : userCode}
            onChange={(v) => !showSolution && setUserCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              readOnly: showSolution,
            }}
            theme="vs-dark"
          />
        </div>

        {/* Hint / Solution */}
        {showSolution && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
                Explanation
              </span>
            </div>
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{challenge.explanation}</p>
          </div>
        )}

        {showHint && !showSolution && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-amber-600" />
              <span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">Hint</span>
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">{challenge.hint}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!showHint && !showSolution && (
            <Button variant="outline" size="sm" onClick={handleRevealHint} className="gap-1.5">
              <Eye size={14} />
              Reveal Hint (-1 point)
            </Button>
          )}
          {!showSolution && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSolution(true);
                timer.pause();
              }}
              className="gap-1.5 text-gray-500"
            >
              <EyeOff size={14} />
              Show Solution
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle size={14} />
            Give Up
          </Button>
          <Button
            size="sm"
            onClick={() => handleSubmit(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 size={14} />
            Mark Solved
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { timer.pause(); setPhase("select"); }}
          className="text-gray-400 text-xs"
        >
          ← Back to list
        </Button>
      </div>
    );
  }

  // ── Result Phase ────────────────────────────────────────────────────────────
  const lastAttempt = attempts[0];
  const solved = lastAttempt?.solved ?? false;
  const elapsed = lastAttempt?.timeSeconds ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className={cn(
        "rounded-2xl p-8 text-center border",
        solved
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      )}>
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
          solved ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"
        )}>
          {solved
            ? <CheckCircle2 size={32} className="text-emerald-600" />
            : <XCircle size={32} className="text-red-500" />}
        </div>
        <h3 className={cn(
          "text-2xl font-bold mb-1",
          solved ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"
        )}>
          {solved ? "Bug Fixed!" : "Not This Time"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {solved
            ? `Solved in ${Math.floor(elapsed / 60)}m ${elapsed % 60}s${hintsUsed > 0 ? ` with ${hintsUsed} hint` : " without hints"}`
            : "Review the explanation and try again — the pattern will stick."}
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-left border border-gray-100 dark:border-gray-700 mb-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Explanation</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.explanation}</p>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            onClick={() => startChallenge(currentIdx)}
            variant="outline"
            className="gap-1.5"
          >
            <RotateCcw size={14} />
            Retry
          </Button>
          <Button
            onClick={() => {
              const next = (currentIdx + 1) % BUG_CHALLENGES.length;
              startChallenge(next);
            }}
            className="gap-1.5"
          >
            Next Bug
            <ChevronRight size={14} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setPhase("select")}
            className="gap-1.5"
          >
            <BarChart2 size={14} />
            All Challenges
          </Button>
        </div>
      </div>

      {/* Running stats */}
      {stats.totalAttempted > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-blue-500" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Your Progress</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500">Hit Rate</span>
            <Progress value={hitRate} className="flex-1 h-2" />
            <span className={cn(
              "text-sm font-bold",
              hitRate >= 70 ? "text-emerald-600" : hitRate >= 40 ? "text-amber-600" : "text-red-500"
            )}>
              {hitRate}%
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {stats.totalSolved} solved out of {stats.totalAttempted} attempted ·{" "}
            {stats.hintRate}% used hints
          </p>
        </div>
      )}
    </div>
  );
}
