/**
 * ctciTopicMap — maps each coding PATTERN id to relevant CTCI topic keywords
 * Used by PatternHeatmap (progress rings) and RecommendedToday (smart queue)
 */

export const PATTERN_TO_CTCI_TOPICS: Record<string, string[]> = {
  "arrays-hashing":    ["Array", "Hash Table", "Prefix Sum"],
  "two-pointers":      ["Two Pointers", "Sorting"],
  "trees-bfs-dfs":     ["Tree", "Binary Tree", "Depth-First Search", "Breadth-First Search", "Binary Search Tree"],
  "sliding-window":    ["Sliding Window"],
  "graphs":            ["Graph", "Topological Sort", "Union Find"],
  "heaps":             ["Heap (Priority Queue)"],
  "binary-search":     ["Binary Search"],
  "backtracking":      ["Backtracking"],
  "intervals":         ["Sorting"],
  "linked-lists":      ["Linked List"],
  "tries":             ["Trie"],
  "monotonic-stack":   ["Stack", "Monotonic Stack"],
  "prefix-sum":        ["Prefix Sum"],
  "union-find":        ["Union Find"],
};

/** Returns true if a CTCI problem topic string matches any of the given topic keywords */
export function problemMatchesTopics(problemTopic: string, keywords: string[]): boolean {
  const lower = problemTopic.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}
