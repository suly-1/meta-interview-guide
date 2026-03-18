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
    weeks: "Weeks 1–2",
    focus: "Language Mastery + DSA Foundations",
    detail:
      "Pick Python, Java, or C++ and master its standard library. Study CLRS or Elements of Programming Interviews. Cover arrays, strings, linked lists, trees, graphs, heaps, sorting, and hashing. Goal: no hesitation on basic data structure operations.",
    tag: "Foundations",
    tagColor: "blue",
  },
  {
    weeks: "Weeks 3–5",
    focus: "LeetCode Pattern Drilling",
    detail:
      "Work through NeetCode 150 systematically by pattern. Do 3–5 problems per pattern before moving on. Target 30–50 medium problems minimum. Time yourself (25 min per medium). Review all mistakes the same day.",
    tag: "Coding",
    tagColor: "indigo",
  },
  {
    weeks: "Week 6",
    focus: "Meta-Specific LeetCode + Phone Screen Prep",
    detail:
      "Filter LeetCode by Meta company tag. Focus on the top 50 most frequently asked. Practice in CoderPad (not LeetCode IDE) to simulate the real environment. Do your first mock interview this week.",
    tag: "Coding",
    tagColor: "indigo",
  },
  {
    weeks: "Week 7",
    focus: "AI-Enabled Coding Round Prep",
    detail:
      "Practice with CoderPad's AI assistant. Drill the 6-step workflow: clarify → analyze → assertions → skeleton → iterative pipeline → verify. Practice multi-file codebases. Request the practice CoderPad from your recruiter.",
    tag: "AI Round",
    tagColor: "teal",
  },
  {
    weeks: "Weeks 8–9",
    focus: "Behavioral Prep + STAR Story Bank",
    detail:
      "Prepare 6–8 STAR stories covering: high-impact projects, XFN collaboration, conflict resolution, technical failures, and growth of junior engineers. Map each story to Meta's 4 behavioral focus areas and 6 core values. Do 3+ mock behavioral interviews.",
    tag: "Behavioral",
    tagColor: "amber",
  },
  {
    weeks: "Week 10",
    focus: "Final Review + Weak Area Reinforcement",
    detail:
      "Revisit problems you got wrong. Do timed full mock interviews (coding + behavioral back-to-back). Refine your STAR stories based on mock feedback. Prepare 3–5 thoughtful questions to ask your interviewers.",
    tag: "Review",
    tagColor: "emerald",
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
