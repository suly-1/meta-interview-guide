// Meta IC6/IC7 Interview Guide — All Content Data

export const PATTERNS = [
  {
    id: "arrays-hashing",
    name: "Arrays & Hashing",
    frequency: 5,
    difficulty: "Easy–Med",
    difficultyColor: "green",
    summary:
      "Use hash maps and sets to achieve O(1) lookups and eliminate nested loops. The go-to pattern for counting, grouping, and deduplication problems.",
    keyIdea: "Trade memory for speed: store seen values in a hash map to avoid O(n²) scans.",
    problems: ["Two Sum", "Group Anagrams", "Product of Array Except Self", "Valid Palindrome II", "Top K Frequent Elements"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    metaNote: "Most frequently tested pattern at Meta. Appears in ~60% of coding rounds.",
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    frequency: 5,
    difficulty: "Easy–Med",
    difficultyColor: "green",
    summary:
      "Two indices that move toward each other or in the same direction to eliminate the need for nested loops. Works best on sorted arrays or when looking for pairs.",
    keyIdea: "Start one pointer at each end; converge based on a comparison condition.",
    problems: ["3Sum", "Container With Most Water", "Trapping Rain Water", "Two Sum II", "Valid Palindrome"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    metaNote: "Frequently combined with sorting. Often appears as a follow-up optimization to a brute-force approach.",
  },
  {
    id: "trees-bfs-dfs",
    name: "Trees (BFS / DFS)",
    frequency: 5,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "BFS uses a queue for level-by-level traversal (shortest paths, level order). DFS uses recursion or a stack for depth-first exploration (path finding, subtree problems).",
    keyIdea: "BFS = queue + level tracking. DFS = recursion with base case + return value.",
    problems: ["Binary Tree Vertical Order Traversal", "Serialize/Deserialize Binary Tree", "Max Path Sum", "Level Order Traversal", "Right Side View"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(h) DFS / O(w) BFS",
    metaNote: "Meta's #1 most tested pattern. Vertical Order Traversal is a Meta classic — know it cold.",
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    frequency: 4,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "Maintain a window of elements that expands and contracts based on a condition. Avoids recomputing results from scratch for each subarray/substring.",
    keyIdea: "Expand right pointer; shrink left pointer when the window violates the constraint.",
    problems: ["Minimum Window Substring", "Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement", "Max Consecutive Ones III"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(k) where k = window size",
    metaNote: "Common in string and subarray problems. Often paired with a hash map to track window contents.",
  },
  {
    id: "graphs",
    name: "Graphs",
    frequency: 4,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "Model relationships as nodes and edges. BFS finds shortest paths in unweighted graphs; DFS explores connected components. Union-Find handles dynamic connectivity.",
    keyIdea: "Always track visited nodes to avoid infinite loops. Choose BFS for shortest path, DFS for connectivity.",
    problems: ["Number of Islands", "Clone Graph", "Course Schedule", "Is Graph Bipartite?", "Pacific Atlantic Water Flow"],
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V + E)",
    metaNote: "Grid-based graph problems (Number of Islands variants) are a Meta staple.",
  },
  {
    id: "heaps",
    name: "Heaps / Priority Queues",
    frequency: 4,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "Min-heap or max-heap for efficient access to the smallest/largest element. Essential for top-K problems, scheduling, and merging sorted sequences.",
    keyIdea: "Use a min-heap of size K to find the K largest elements in O(n log K).",
    problems: ["Top K Frequent Elements", "Find Median from Data Stream", "Merge K Sorted Lists", "Kth Largest Element", "Task Scheduler"],
    timeComplexity: "O(n log k)",
    spaceComplexity: "O(k)",
    metaNote: "Find Median from Data Stream (two-heap approach) is a high-frequency Meta question.",
  },
  {
    id: "binary-search",
    name: "Binary Search Variations",
    frequency: 4,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "Beyond sorted arrays — apply binary search on the answer space itself. If you can check whether a value is feasible in O(n), you can binary search for the optimal value.",
    keyIdea: "Ask: 'Can I binary search on the answer?' Works when the feasibility function is monotonic.",
    problems: ["Search in Rotated Sorted Array", "Find Min in Rotated Array", "Koko Eating Bananas", "Median of Two Sorted Arrays", "Find Peak Element"],
    timeComplexity: "O(n log n) or O(log n)",
    spaceComplexity: "O(1)",
    metaNote: "Rotated array variants are very common. Know both the 'find target' and 'find min' variants.",
  },
  {
    id: "backtracking",
    name: "Backtracking / DFS",
    frequency: 3,
    difficulty: "Hard",
    difficultyColor: "red",
    summary:
      "Explore all possible solutions by building candidates incrementally and abandoning ('backtracking') paths that cannot lead to a valid solution.",
    keyIdea: "Choose → Explore → Unchoose. The undo step is what makes it backtracking, not just DFS.",
    problems: ["Subsets", "Permutations", "Combination Sum", "Word Search", "N-Queens", "Letter Combinations of Phone Number"],
    timeComplexity: "O(2^n) or O(n!)",
    spaceComplexity: "O(n) recursion depth",
    metaNote: "Meta rarely asks pure DP but does ask backtracking. Word Search is a recurring Meta question.",
  },
  {
    id: "intervals",
    name: "Intervals",
    frequency: 3,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "Sort intervals by start time, then sweep through to merge overlaps or detect conflicts. Use a min-heap for scheduling problems with multiple resources.",
    keyIdea: "Sort by start. Merge if current.start ≤ prev.end. Use heap for meeting rooms (track end times).",
    problems: ["Merge Intervals", "Insert Interval", "Meeting Rooms II", "Non-Overlapping Intervals", "Employee Free Time"],
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    metaNote: "Meeting Rooms II (minimum conference rooms) is a classic Meta interview question.",
  },
  {
    id: "linked-lists",
    name: "Linked Lists",
    frequency: 3,
    difficulty: "Easy–Med",
    difficultyColor: "green",
    summary:
      "Pointer manipulation problems. Fast/slow pointers detect cycles. Dummy head nodes simplify edge cases. Reversing in-place requires careful pointer juggling.",
    keyIdea: "Draw the pointer diagram before coding. Use a dummy head to avoid null checks at the head.",
    problems: ["LRU Cache", "Reverse Linked List", "Merge Two Sorted Lists", "Linked List Cycle II", "Reorder List"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) for in-place",
    metaNote: "LRU Cache (doubly linked list + hash map) is a very high-frequency Meta question.",
  },
  {
    id: "tries",
    name: "Tries (Prefix Trees)",
    frequency: 3,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "A tree where each node represents a character. Enables O(m) prefix search where m = word length. More efficient than hash maps for prefix-based operations.",
    keyIdea: "Each node has children[26] and an isEnd flag. Insert and search are both O(m).",
    problems: ["Implement Trie", "Word Search II", "Add and Search Words", "Remove Sub-Folders from Filesystem", "Design Search Autocomplete"],
    timeComplexity: "O(m) per operation",
    spaceComplexity: "O(total characters)",
    metaNote: "Implement Trie from scratch is a direct Meta ask. Know it cold.",
  },
  {
    id: "monotonic-stack",
    name: "Monotonic Stack",
    frequency: 3,
    difficulty: "Hard",
    difficultyColor: "red",
    summary:
      "A stack that maintains elements in monotonically increasing or decreasing order. Solves 'next greater/smaller element' problems in O(n) instead of O(n²).",
    keyIdea: "Pop elements that violate the monotonic property. The popped element's answer is the current element.",
    problems: ["Daily Temperatures", "Largest Rectangle in Histogram", "Sliding Window Maximum", "Trapping Rain Water (stack)", "Next Greater Element"],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    metaNote: "Largest Rectangle in Histogram is a hard Meta question that tests stack mastery.",
  },
  {
    id: "prefix-sum",
    name: "Prefix Sum",
    frequency: 2,
    difficulty: "Easy",
    difficultyColor: "green",
    summary:
      "Precompute cumulative sums to answer range sum queries in O(1). Extend with a hash map to find subarrays with a target sum.",
    keyIdea: "prefix[i] = sum of elements 0..i. Range sum [l,r] = prefix[r] - prefix[l-1].",
    problems: ["Range Sum Query", "Subarray Sum Equals K", "Product of Array Except Self", "Continuous Subarray Sum", "Path Sum III"],
    timeComplexity: "O(n) build, O(1) query",
    spaceComplexity: "O(n)",
    metaNote: "Often appears as a sub-technique within harder problems rather than the main challenge.",
  },
  {
    id: "union-find",
    name: "Union-Find (DSU)",
    frequency: 2,
    difficulty: "Medium",
    difficultyColor: "amber",
    summary:
      "Efficiently track connected components with near-O(1) union and find operations using path compression and union by rank.",
    keyIdea: "find() with path compression + union() by rank gives O(α(n)) ≈ O(1) amortized.",
    problems: ["Number of Islands (alt)", "Redundant Connection", "Accounts Merge", "Satisfiability of Equality Equations", "Smallest String With Swaps"],
    timeComplexity: "O(α(n)) ≈ O(1) amortized",
    spaceComplexity: "O(n)",
    metaNote: "Accounts Merge is a direct Meta question. Know both BFS/DFS and Union-Find solutions.",
  },
];

/**
 * PATTERN_PREREQUISITES — defines which patterns must be rated ≥3 in Quick Drill
 * before an advanced pattern unlocks in the Coding tab.
 * Key = locked pattern id; Value = array of prerequisite pattern ids.
 * Patterns not listed are always unlocked (Foundation tier).
 */
export const PATTERN_PREREQUISITES: Record<string, string[]> = {
  // Tier 2 — require one Foundation pattern
  "sliding-window":  ["arrays-hashing"],
  "heaps":           ["arrays-hashing"],
  "binary-search":   ["arrays-hashing"],
  "graphs":          ["trees-bfs-dfs"],
  "intervals":       ["two-pointers"],
  // Tier 3 — require two patterns
  "backtracking":    ["trees-bfs-dfs", "graphs"],
  "tries":           ["trees-bfs-dfs", "arrays-hashing"],
  "monotonic-stack": ["arrays-hashing", "two-pointers"],
  "prefix-sum":      ["arrays-hashing"],
  "union-find":      ["graphs"],
};

export const BEHAVIORAL_FOCUS_AREAS = [
  {
    id: "xfn",
    title: "Focus Area 1: XFN Collaboration & Scope",
    subtitle: "Senior SWE",
    color: "blue",
    borderColor: "#bfdbfe",
    bgColor: "#eff6ff",
    iconColor: "#1d4ed8",
    titleColor: "#1e3a8a",
    description:
      "Forms collaborative cross-functional partnerships and owns technical and business scope. Aligns broader team goals with XFN and organizational priorities.",
    questions: [
      {
        question: "Tell me about a high-impact project you have worked on.",
        probes: [
          "What functions outside of your team did you collaborate with?",
          "What did your relationships with these teams look like?",
          "How would you describe your role on the team?",
          "Describe the road mapping or planning process for the project.",
          "What was the outcome and impact?",
        ],
      },
      {
        question: "Tell me about the most successful project you have shipped.",
        probes: [
          "What functions outside of your team did you collaborate with?",
          "How would you describe your role on the team?",
          "Describe the road mapping or planning process.",
          "How did you ensure the project's success?",
        ],
      },
      {
        question: "Walk me through a project that required collaboration across teams or functions.",
        probes: [
          "What was the scope of the project and your role?",
          "What teams or functions did you need engagement from?",
          "How did you ensure the effectiveness of the overall project team?",
          "What was the outcome?",
        ],
      },
      {
        question: "Describe a time you had to influence a team or stakeholder you had no authority over.",
        probes: [
          "What was the goal you were trying to achieve?",
          "What was the resistance or misalignment you encountered?",
          "What approach did you take to build alignment?",
          "What was the outcome and what did you learn about influence?",
        ],
      },
      {
        question: "Tell me about a time you drove alignment on a technically ambiguous or contested decision.",
        probes: [
          "What made the decision ambiguous or contested?",
          "Who were the key stakeholders and what were their positions?",
          "How did you structure the discussion and drive toward a decision?",
          "What was the final outcome and how did you handle dissenters?",
        ],
      },
      {
        question: "Give me an example of a time you expanded the scope of a project beyond its original charter.",
        probes: [
          "What triggered you to expand the scope?",
          "How did you get buy-in for the expanded scope?",
          "What was the incremental impact of the expansion?",
          "What trade-offs did you have to make?",
        ],
      },
      {
        question: "Tell me about a time you had to coordinate a large release or launch across multiple teams.",
        probes: [
          "How many teams were involved and what were their dependencies?",
          "How did you manage communication and risk across teams?",
          "What went wrong and how did you handle it?",
          "What would you do differently next time?",
        ],
      },
    ],
  },
  {
    id: "conflict",
    title: "Focus Area 2: Conflict Resolution",
    subtitle: "Senior SWE",
    color: "amber",
    borderColor: "#fde68a",
    bgColor: "#fffbeb",
    iconColor: "#b45309",
    titleColor: "#92400e",
    description:
      "Handles conflict and challenging relationships appropriately. Balances competing perspectives and adapts interpersonal style to find common ground and mutually beneficial solutions.",
    questions: [
      {
        question: "Tell me about a time when your team had a conflict or disagreement with another team.",
        probes: [
          "What was the situation?",
          "What were the perspectives on both sides?",
          "How did you get the two groups to align?",
          "Walk me through your approach to finding common ground.",
          "What was the outcome?",
        ],
      },
      {
        question: "Tell me about a time where a stakeholder disagreed with a process or approach that you or your team owned.",
        probes: [
          "What was the process or approach that stakeholders disagreed with?",
          "What were the perspectives on both sides?",
          "How did you handle the disagreement?",
          "What was the outcome?",
        ],
      },
      {
        question: "Describe the most challenging team or function that you have had to work with.",
        probes: [
          "What in particular was so challenging?",
          "How did you work to resolve conflicts or disagreements?",
          "What was the final outcome?",
        ],
      },
      {
        question: "Tell me about a time you had to give difficult feedback to a peer or senior engineer.",
        probes: [
          "What was the situation and what feedback did you need to deliver?",
          "How did you prepare and frame the conversation?",
          "How did the person respond and what was the outcome?",
          "What did you learn about delivering hard feedback?",
        ],
      },
      {
        question: "Describe a time when you disagreed with your manager or leadership on a technical or product decision.",
        probes: [
          "What was the decision and why did you disagree?",
          "How did you raise your concerns?",
          "What was the final decision and how did you respond?",
          "Looking back, who was right and what did you learn?",
        ],
      },
      {
        question: "Tell me about a time a project was at risk of failure due to interpersonal tension on the team.",
        probes: [
          "What was the source of the tension?",
          "What role did you play in addressing it?",
          "How did you keep the project on track while resolving the tension?",
          "What was the outcome?",
        ],
      },
      {
        question: "Give me an example of a time you had to advocate for a position that was unpopular.",
        probes: [
          "What was the position and why was it unpopular?",
          "How did you build your case?",
          "What was the reaction and how did you handle pushback?",
          "What was the final outcome?",
        ],
      },
    ],
  },
  {
    id: "problem-solving",
    title: "Focus Area 3: Problem Solving",
    subtitle: "SWE",
    color: "emerald",
    borderColor: "#a7f3d0",
    bgColor: "#ecfdf5",
    iconColor: "#065f46",
    titleColor: "#064e3b",
    description:
      "Analyzes the problem space, generates solutions to open-ended problems, and evaluates the relative quality of potential solutions.",
    questions: [
      {
        question: "Can you talk about a time when something went wrong?",
        probes: [
          "What was your takeaway from the issue?",
          "Do you agree with the outcome of the decision?",
          "Any constructive feedback you delivered?",
        ],
      },
      {
        question: "Tell me about a time you had to make a difficult technical decision with incomplete information.",
        probes: [
          "What data did you have? What was missing?",
          "How did you evaluate the options?",
          "What was the outcome and what did you learn?",
        ],
      },
      {
        question: "Describe a time you identified a significant technical risk before it became critical.",
        probes: [
          "How did you discover it?",
          "What steps did you take to address it?",
          "What was the impact of your intervention?",
        ],
      },
      {
        question: "Tell me about a time you had to choose between two technically sound but competing approaches.",
        probes: [
          "What were the two approaches and their trade-offs?",
          "How did you evaluate and decide?",
          "How did you communicate the decision to stakeholders?",
          "In hindsight, was it the right call?",
        ],
      },
      {
        question: "Describe a time you had to debug or resolve a production incident under pressure.",
        probes: [
          "What was the incident and what was the customer impact?",
          "How did you diagnose the root cause?",
          "What was your communication strategy during the incident?",
          "What did you change to prevent recurrence?",
        ],
      },
      {
        question: "Tell me about a time you had to simplify a complex system or process.",
        probes: [
          "What made it complex and why did it need simplification?",
          "What was your approach to reducing complexity?",
          "What trade-offs did you accept?",
          "What was the measurable impact of the simplification?",
        ],
      },
      {
        question: "Give me an example of a time you used data or metrics to change a direction or decision.",
        probes: [
          "What was the original direction and what data did you find?",
          "How did you present the data to drive a change?",
          "What was the outcome and what did you learn about data-driven decisions?",
        ],
      },
    ],
  },
  {
    id: "communication",
    title: "Focus Area 4: Communication",
    subtitle: "SWE",
    color: "indigo",
    borderColor: "#c7d2fe",
    bgColor: "#eef2ff",
    iconColor: "#4338ca",
    titleColor: "#3730a3",
    description:
      "Communicates technical information clearly and concisely. Asks clarifying questions and demonstrates active listening.",
    questions: [
      {
        question: "Tell me about your current role and the area you work in.",
        probes: [
          "What is your team and who are the stakeholders?",
          "How do you balance the needs of stakeholders and measure success?",
          "Where does the roadmap come from?",
        ],
      },
      {
        question: "How do you think about the growth of junior engineers?",
        probes: [
          "Example of someone struggling or a turnaround you drove?",
          "What motivates you in mentoring?",
        ],
      },
      {
        question: "Anything about Meta that excites you?",
        probes: [
          "Why Meta over other companies?",
          "What problems do you most want to work on?",
        ],
      },
      {
        question: "Tell me about a time you had to communicate a complex technical concept to a non-technical audience.",
        probes: [
          "Who was the audience and what was the concept?",
          "How did you tailor your communication?",
          "How did you know they understood?",
          "What would you do differently next time?",
        ],
      },
      {
        question: "Describe a time you had to deliver bad news to a stakeholder or leadership.",
        probes: [
          "What was the bad news and what was the context?",
          "How did you prepare and frame the message?",
          "How did the stakeholder react and how did you manage it?",
          "What was the outcome?",
        ],
      },
      {
        question: "Tell me about a time you proactively communicated a risk or issue before being asked.",
        probes: [
          "What was the risk and how did you identify it?",
          "How did you decide when and how to raise it?",
          "What was the reaction and what happened as a result?",
        ],
      },
      {
        question: "Give me an example of a time you wrote documentation or a design doc that significantly helped your team.",
        probes: [
          "What was the context and why was documentation needed?",
          "How did you structure and write it?",
          "How was it received and what was its impact?",
          "How do you think about the right level of documentation?",
        ],
      },
    ],
  },
];

export const META_VALUES = [
  {
    name: "Move Fast",
    desc: "Act with urgency, remove blockers, ship quickly, and iterate rapidly. Bring examples of accelerating a project or unblocking a team.",
    color: "blue",
  },
  {
    name: "Focus on Long-Term Impact",
    desc: "Make decisions that prioritize long-term scalability over short-term wins. Willingness to take on hard, slow-burning problems.",
    color: "indigo",
  },
  {
    name: "Build Awesome Things",
    desc: "Go above and beyond to deliver high-quality, user-delighting products. Pride in craftsmanship and attention to detail.",
    color: "teal",
  },
  {
    name: "Live in the Future",
    desc: "Early adoption of new technologies, forward-thinking architectural decisions, and building for the next 5 years.",
    color: "purple",
  },
  {
    name: "Be Direct & Respect Your Colleagues",
    desc: "Give and receive candid feedback, navigate disagreements professionally, and have hard conversations with empathy.",
    color: "amber",
  },
  {
    name: "Meta, Metamates, Me",
    desc: "Put the team and company first, help colleagues, and take ownership of collective outcomes beyond your own scope.",
    color: "emerald",
  },
];

export const TIMELINE_WEEKS = [
  {
    weeks: "Week 1",
    focus: "DSA Foundations — Language & Core Patterns",
    detail:
      "Days 1–2: Confirm your language of choice (Python, Java, or C++) and review its standard library, built-in data structures, and common idioms. Days 3–5: Work through the top 7 high-frequency patterns — Arrays & Hashing, Two Pointers, Trees BFS/DFS, Sliding Window, Graphs, Heaps, and Binary Search — solving 2–3 Meta-tagged problems per pattern under 25-minute timed conditions. Days 6–7: Filter LeetCode by Meta company tag and solve 10 easy/medium problems. Goal: no hesitation on basic data structure operations.",
    tag: "Coding",
    tagColor: "blue",
  },
  {
    weeks: "Week 2",
    focus: "Coding Deep Dive — Remaining Patterns + AI-Enabled Round",
    detail:
      "Days 1–4: Drill the remaining 7 patterns — Linked Lists, Dynamic Programming, Backtracking, Tries, Intervals, Stack/Monotonic, and Math & Bit Manipulation. Solve 3–5 Meta-tagged problems per day. Days 5–6: Practice with CoderPad's AI assistant — drill the 6-step workflow: clarify → analyze → assertions → skeleton → iterative pipeline → verify. Day 7: First full mock coding interview (45 min, timed). Use the Quick Drill Due-Today mode to reinforce weak patterns.",
    tag: "Coding",
    tagColor: "indigo",
  },
  {
    weeks: "Week 3",
    focus: "Behavioral Foundations — STAR Story Bank",
    detail:
      "Days 1–3: Draft all 8 STAR stories covering: high-impact projects, XFN collaboration, conflict resolution, technical failures, decision under ambiguity, mentoring, proactive risk identification, and culture change. Map each story to Meta's 4 behavioral focus areas and 6 core values. Days 4–5: Do 2+ mock behavioral interviews using Practice Mode daily. Days 6–7: Refine stories with metrics — every Result must include a quantified number (latency %, users impacted, revenue, time saved).",
    tag: "Behavioral",
    tagColor: "amber",
  },
  {
    weeks: "Week 4",
    focus: "Behavioral Deep Dive — Full Mock Sessions",
    detail:
      "Days 1–2: Run 2 Full Mock behavioral sessions (4 questions, 12 minutes each). Review your self-ratings and identify your lowest-scoring focus areas. Days 3–4: Drill the 3 weakest behavioral questions identified by the Weak-Spot Dashboard. Refine those STAR stories with sharper metrics and cleaner structure. Days 5–6: Practice cold answering — use Practice Mode without notes. Day 7: Review all 8 stories end-to-end. Every story should be deliverable in under 2 minutes.",
    tag: "Behavioral",
    tagColor: "amber",
  },
  {
    weeks: "Week 5",
    focus: "Coding Reinforcement — Weak Patterns + Hard Problems",
    detail:
      "Days 1–2: Check the Pattern Mastery Heatmap and revisit every pattern rated below 3 stars. Re-solve the hardest Meta-tagged problems in those areas. Days 3–4: Attempt 5–8 hard-difficulty Meta problems across Dynamic Programming, Graphs, and Trees. Focus on recognizing the pattern quickly rather than brute-forcing. Days 5–6: Timed mock coding sessions (45 min each) using the Mock Interview Timer. Day 7: Review all 14 pattern key ideas and time/space complexities from memory.",
    tag: "Coding",
    tagColor: "indigo",
  },
  {
    weeks: "Week 6",
    focus: "Behavioral Reinforcement + Coding Fluency",
    detail:
      "Days 1–2: Re-run the Full Mock behavioral session. Target a session average of 4+ stars. Days 3–4: Continue daily Quick Drill sessions — focus exclusively on Due-Today patterns from the spaced repetition scheduler. Days 5–6: Practice explaining your STAR stories out loud (record yourself if possible) and refine for clarity and conciseness. Day 7: Cross-check your story bank against all 4 behavioral focus areas — ensure each area has at least 2 strong stories.",
    tag: "Integration",
    tagColor: "purple",
  },
  {
    weeks: "Week 7",
    focus: "Full Loop Mock Interviews",
    detail:
      "Days 1–2: Complete 2 full mock interview loops — coding (45 min) + behavioral (15 min) back-to-back, simulating the real interview day experience. Days 3–4: Debrief each mock: review session log ratings, identify weak spots, and drill those specific patterns and questions. Days 5–6: Practice the AI-Enabled Round workflow — use CoderPad with AI assistance and rehearse the 6-step approach. Day 7: Rest and light review only. No new material.",
    tag: "Mock",
    tagColor: "rose",
  },
  {
    weeks: "Week 8",
    focus: "Final Review + Interview Day Preparation",
    detail:
      "Days 1–2: Final Quick Drill pass — all 14 patterns, targeting 4+ stars on every card. Days 3–4: Final behavioral review — read all 8 STAR stories aloud, confirm metrics are sharp, and prepare 3–5 thoughtful questions to ask your interviewers. Day 5: Light mock session only — no new problems. Day 6: Complete the Interview Day Checklist (Evening Before phase). Day 7 (Interview Day): Morning routine, 5-minute warm-up problem, skim story bank, and go. Trust your preparation.",
    tag: "Final",
    tagColor: "emerald",
  },
];

// ─── IC7 Behavioral Focus Areas (Principal / Senior Staff mock) ────────────
// These questions target the IC7 bar: org-wide scope, retrospective ownership,
// cross-functional partnership, and upward influence.
export const IC7_BEHAVIORAL_FOCUS_AREAS = [
  {
    id: "ic7-xfn-partnership",
    title: "Cross-Functional Partnership",
    subtitle: "IC7 / Principal",
    questions: [
      {
        question: "Tell me about a time you drove alignment across multiple organizations or business units on a technically ambiguous initiative.",
        probes: [
          "How many orgs were involved and what were their competing priorities?",
          "How did you build a shared vision when there was no obvious right answer?",
          "What was the business-level outcome and how did you measure it?",
          "What would have happened without your involvement?",
        ],
      },
      {
        question: "Describe a time you identified a strategic gap in your organization and independently defined what the team should be working on.",
        probes: [
          "How did you identify the gap — was it data-driven, customer-driven, or intuition?",
          "How did you build the case and get leadership buy-in?",
          "What resistance did you encounter and how did you handle it?",
          "What was the long-term impact on the org?",
        ],
      },
      {
        question: "Tell me about a time you had to influence a director or VP on a technical or product strategy decision.",
        probes: [
          "What was the decision and why did leadership need to be involved?",
          "How did you frame the problem and your recommendation?",
          "What was the outcome and how did you handle disagreement?",
          "What did you learn about influencing upward?",
        ],
      },
      {
        question: "Walk me through a time you created leverage for other senior engineers — enabling them to have more impact than they would have had alone.",
        probes: [
          "What was the context and who were the engineers you were enabling?",
          "What specifically did you do to create that leverage?",
          "How did you avoid becoming a single point of failure?",
          "What was the measurable outcome for the team?",
        ],
      },
      {
        question: "Describe a time you shaped the technical strategy for a broad area of services or technology beyond your immediate team.",
        probes: [
          "What was the scope of the strategy and how did you develop it?",
          "How did you get other teams to adopt it?",
          "What trade-offs did you make and why?",
          "How did you measure whether the strategy was working?",
        ],
      },
      {
        question: "Tell me about a time you drove adoption of a platform, framework, or process across multiple teams.",
        probes: [
          "What was the platform or process and why was adoption important?",
          "What was the initial resistance and how did you address it?",
          "How did you ensure sustained adoption rather than a one-time rollout?",
          "What was the org-wide impact?",
        ],
      },
    ],
  },
  {
    id: "ic7-retrospective-partnership",
    title: "Retrospective Partnership & Ownership",
    subtitle: "IC7 / Principal",
    questions: [
      {
        question: "Tell me about a time you told the hard truth — for example, recommending deprecating a system or killing a project when the ROI wasn't there.",
        probes: [
          "What was the situation and what data led you to that conclusion?",
          "How did you communicate the recommendation to stakeholders who had invested in it?",
          "What was the reaction and how did you manage it?",
          "What was the final outcome and what did you learn?",
        ],
      },
      {
        question: "Describe a significant project failure or postmortem you owned at the org level. What did you change as a result?",
        probes: [
          "What was the failure and what was the business impact?",
          "How did you lead the retrospective and ensure psychological safety?",
          "What systemic changes did you drive — not just for your team but for the org?",
          "How do you think about failure as an IC7?",
        ],
      },
      {
        question: "Tell me about a time you owned an outcome that didn't meet expectations, even though the execution was technically sound.",
        probes: [
          "What was the gap between execution quality and outcome?",
          "How did you diagnose the root cause — was it strategy, adoption, measurement?",
          "What did you do differently as a result?",
          "How do you think about the difference between output and outcome at the IC7 level?",
        ],
      },
      {
        question: "Give me an example of a time you changed the direction of a multi-quarter initiative mid-stream based on new information.",
        probes: [
          "What was the original direction and what new information changed it?",
          "How did you make the case for pivoting to leadership and the team?",
          "What was the cost of the pivot and how did you manage it?",
          "What was the outcome and what did you learn about adaptability at scale?",
        ],
      },
      {
        question: "Describe a time you proactively identified a risk that, if unaddressed, would have had org-level consequences.",
        probes: [
          "How did you identify the risk — was it technical, organizational, or strategic?",
          "How did you escalate and build urgency without causing panic?",
          "What was the mitigation and how did you track it to resolution?",
          "What would have happened if you hadn't caught it?",
        ],
      },
      {
        question: "Tell me about a time you had to balance short-term execution pressure with long-term architectural or strategic health.",
        probes: [
          "What was the tension and what were the competing pressures?",
          "How did you make the trade-off decision and communicate it?",
          "How did you ensure the long-term concern wasn't permanently deferred?",
          "What was the outcome and how do you think about this trade-off at the IC7 level?",
        ],
      },
    ],
  },
];

export const STORY_BANK = [
  { type: "High-Impact Technical Project", focusAreas: "XFN Collaboration, Communication", values: "Build Awesome Things, Focus on Long-Term Impact" },
  { type: "Cross-Functional Alignment Win", focusAreas: "XFN Collaboration, Conflict Resolution", values: "Move Fast, Meta/Metamates/Me" },
  { type: "Technical Conflict / Disagreement", focusAreas: "Conflict Resolution, Problem Solving", values: "Be Direct, Meta/Metamates/Me" },
  { type: "Project Failure / Postmortem", focusAreas: "Problem Solving, Communication", values: "Move Fast, Focus on Long-Term Impact" },
  { type: "Decision Under Ambiguity", focusAreas: "Problem Solving, XFN Collaboration", values: "Move Fast, Live in the Future" },
  { type: "Mentoring / Growing a Junior Engineer", focusAreas: "Communication, XFN Collaboration", values: "Meta/Metamates/Me, Build Awesome Things" },
  { type: "Proactive Risk Identification", focusAreas: "Problem Solving, Communication", values: "Focus on Long-Term Impact, Live in the Future" },
  { type: "Technical or Cultural Change You Drove", focusAreas: "XFN Collaboration, Communication", values: "Live in the Future, Focus on Long-Term Impact" },
];
