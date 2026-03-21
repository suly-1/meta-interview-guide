/**
 * ctciTestCases.ts
 * Curated hidden test cases for the top 50 CTCI problems.
 * Each entry maps a CTCI problem ID to an array of test cases.
 * Each test case has:
 *   - stdin: the raw stdin string fed to Judge0 (newline-separated values)
 *   - expectedOutput: the expected stdout (trimmed) for pass/fail comparison
 *   - label: human-readable description of what this test case checks
 *
 * Format convention (Python-friendly, adaptable for other languages):
 *   - Arrays: space-separated integers on one line
 *   - Strings: plain text on one line
 *   - Multiple inputs: one per line
 *
 * NOTE: These test cases are designed for self-contained scripts that read from
 * stdin and print the answer. Boilerplate in the editor already scaffolds this.
 */

export interface TestCase {
  stdin: string;
  expectedOutput: string;
  label: string;
}

export const CTCI_TEST_CASES: Record<number, TestCase[]> = {
  // 1. Two Sum
  1: [
    { stdin: "2 7 11 15\n9", expectedOutput: "0 1", label: "Basic: [2,7,11,15], target=9" },
    { stdin: "3 2 4\n6", expectedOutput: "1 2", label: "Non-adjacent: [3,2,4], target=6" },
    { stdin: "3 3\n6", expectedOutput: "0 1", label: "Duplicate values: [3,3], target=6" },
  ],

  // 2. Longest Substring Without Repeating Characters
  2: [
    { stdin: "abcabcbb", expectedOutput: "3", label: "Classic: abcabcbb → 3" },
    { stdin: "bbbbb", expectedOutput: "1", label: "All same: bbbbb → 1" },
    { stdin: "pwwkew", expectedOutput: "3", label: "pwwkew → 3 (wke)" },
  ],

  // 3. Maximum Subarray
  3: [
    { stdin: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", label: "Kadane's: [-2,1,-3,4,-1,2,1,-5,4] → 6" },
    { stdin: "1", expectedOutput: "1", label: "Single element: [1] → 1" },
    { stdin: "5 4 -1 7 8", expectedOutput: "23", label: "All positive: [5,4,-1,7,8] → 23" },
  ],

  // 4. Valid Anagram
  4: [
    { stdin: "anagram\nnagaram", expectedOutput: "true", label: "Anagram: anagram/nagaram → true" },
    { stdin: "rat\ncar", expectedOutput: "false", label: "Not anagram: rat/car → false" },
    { stdin: "a\nab", expectedOutput: "false", label: "Different lengths → false" },
  ],

  // 5. Reverse Linked List (value-based stdin)
  5: [
    { stdin: "1 2 3 4 5", expectedOutput: "5 4 3 2 1", label: "Reverse [1,2,3,4,5] → [5,4,3,2,1]" },
    { stdin: "1 2", expectedOutput: "2 1", label: "Two elements: [1,2] → [2,1]" },
    { stdin: "1", expectedOutput: "1", label: "Single element: [1] → [1]" },
  ],

  // 6. 3Sum
  6: [
    { stdin: "-1 0 1 2 -1 -4", expectedOutput: "-1 -1 2\n-1 0 1", label: "Classic: [-1,0,1,2,-1,-4]" },
    { stdin: "0 1 1", expectedOutput: "", label: "No triplet: [0,1,1] → []" },
    { stdin: "0 0 0", expectedOutput: "0 0 0", label: "All zeros: [0,0,0] → [[0,0,0]]" },
  ],

  // 10. Best Time to Buy and Sell Stock
  10: [
    { stdin: "7 1 5 3 6 4", expectedOutput: "5", label: "Classic: [7,1,5,3,6,4] → 5" },
    { stdin: "7 6 4 3 1", expectedOutput: "0", label: "Decreasing: [7,6,4,3,1] → 0" },
    { stdin: "1 2", expectedOutput: "1", label: "Two elements: [1,2] → 1" },
  ],

  // 11. Search in Rotated Sorted Array
  11: [
    { stdin: "4 5 6 7 0 1 2\n0", expectedOutput: "4", label: "Target in rotated: [4,5,6,7,0,1,2], target=0 → 4" },
    { stdin: "4 5 6 7 0 1 2\n3", expectedOutput: "-1", label: "Target not found → -1" },
    { stdin: "1\n0", expectedOutput: "-1", label: "Single element, not found → -1" },
  ],

  // 14. Merge Intervals
  14: [
    { stdin: "1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18", label: "Overlap merge: [[1,3],[2,6],[8,10],[15,18]]" },
    { stdin: "1 4\n4 5", expectedOutput: "1 5", label: "Touch at boundary: [[1,4],[4,5]] → [[1,5]]" },
    { stdin: "1 4\n2 3", expectedOutput: "1 4", label: "Contained: [[1,4],[2,3]] → [[1,4]]" },
  ],

  // 17. Product of Array Except Self
  17: [
    { stdin: "1 2 3 4", expectedOutput: "24 12 8 6", label: "Classic: [1,2,3,4] → [24,12,8,6]" },
    { stdin: "-1 1 0 -3 3", expectedOutput: "0 0 9 0 0", label: "With zero: [-1,1,0,-3,3]" },
  ],

  // 18. Valid Parentheses
  18: [
    { stdin: "()", expectedOutput: "true", label: "Simple pair: () → true" },
    { stdin: "()[]{}", expectedOutput: "true", label: "Mixed valid: ()[]{} → true" },
    { stdin: "(]", expectedOutput: "false", label: "Mismatched: (] → false" },
    { stdin: "([)]", expectedOutput: "false", label: "Interleaved: ([)] → false" },
  ],

  // 20. House Robber
  20: [
    { stdin: "1 2 3 1", expectedOutput: "4", label: "Classic: [1,2,3,1] → 4" },
    { stdin: "2 7 9 3 1", expectedOutput: "12", label: "[2,7,9,3,1] → 12" },
    { stdin: "0", expectedOutput: "0", label: "Single zero → 0" },
  ],

  // 26. Climbing Stairs
  26: [
    { stdin: "2", expectedOutput: "2", label: "n=2 → 2 ways" },
    { stdin: "3", expectedOutput: "3", label: "n=3 → 3 ways" },
    { stdin: "5", expectedOutput: "8", label: "n=5 → 8 ways" },
  ],

  // 27. Coin Change
  27: [
    { stdin: "1 5 6 9\n11", expectedOutput: "2", label: "[1,5,6,9], amount=11 → 2" },
    { stdin: "2\n3", expectedOutput: "-1", label: "[2], amount=3 → -1 (impossible)" },
    { stdin: "1\n0", expectedOutput: "0", label: "amount=0 → 0" },
  ],

  // 28. Jump Game
  28: [
    { stdin: "2 3 1 1 4", expectedOutput: "true", label: "Reachable: [2,3,1,1,4] → true" },
    { stdin: "3 2 1 0 4", expectedOutput: "false", label: "Blocked: [3,2,1,0,4] → false" },
    { stdin: "0", expectedOutput: "true", label: "Single element → true" },
  ],

  // 38. Symmetric Tree (level-order BFS stdin)
  38: [
    { stdin: "1 2 2 3 4 4 3", expectedOutput: "true", label: "Symmetric tree → true" },
    { stdin: "1 2 2 null 3 null 3", expectedOutput: "false", label: "Asymmetric → false" },
  ],

  // 40. Sort Colors
  40: [
    { stdin: "2 0 2 1 1 0", expectedOutput: "0 0 1 1 2 2", label: "Dutch flag: [2,0,2,1,1,0]" },
    { stdin: "2 0 1", expectedOutput: "0 1 2", label: "[2,0,1] → [0,1,2]" },
    { stdin: "0", expectedOutput: "0", label: "Single element → [0]" },
  ],

  // 42. Single Number
  42: [
    { stdin: "2 2 1", expectedOutput: "1", label: "[2,2,1] → 1" },
    { stdin: "4 1 2 1 2", expectedOutput: "4", label: "[4,1,2,1,2] → 4" },
    { stdin: "1", expectedOutput: "1", label: "Single element → 1" },
  ],
};

/**
 * Get test cases for a problem by name (case-insensitive fuzzy match on problem name).
 * Falls back to empty array if no test cases are defined.
 */
export function getTestCasesForProblem(problemId: number): TestCase[] {
  return CTCI_TEST_CASES[problemId] ?? [];
}

/**
 * Format test cases as a summary string for the AI debrief.
 */
export function formatTestResultsForAI(
  results: Array<{
    questionIndex: number;
    problemName: string;
    difficulty: string;
    language: string;
    submitted: boolean;
    passed: boolean;
    statusDescription: string;
    executionTime: string | null;
    hasCompileError: boolean;
    hasRuntimeError: boolean;
    testCasesPassed?: number;
    testCasesTotal?: number;
  }>
): string {
  return results.map(r => {
    const base = `Q${r.questionIndex} (${r.problemName}, ${r.difficulty}, ${r.language}): `;
    if (!r.submitted) return base + "Not submitted";
    const status = r.passed ? "✓ PASSED" : "✗ FAILED";
    const tcInfo = r.testCasesTotal ? ` [${r.testCasesPassed}/${r.testCasesTotal} test cases]` : "";
    const timeInfo = r.executionTime ? ` (${r.executionTime}s)` : "";
    const errInfo = r.hasCompileError ? " [compile error]" : r.hasRuntimeError ? " [runtime error]" : "";
    return base + status + tcInfo + timeInfo + errInfo + ` — ${r.statusDescription}`;
  }).join("\n");
}
