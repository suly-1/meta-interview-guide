// ── Design: Bold Engineering Dashboard ─────────────────────────────────────
// Dark charcoal base, Space Grotesk headings, Inter body
// Blue (Meta), Emerald (mastered), Amber (weak), Orange (streak)

// Pattern prerequisite map: patternId → prerequisite patternIds (must be rated ≥3 to unlock)
export const PATTERN_PREREQS: Record<string, string[]> = {
  "fast-slow":       ["two-pointers"],
  "dfs-backtrack":   ["bfs"],
  "dynamic-prog":    ["dfs-backtrack"],
  "monotonic-stack": ["binary-search"],
  "trie":            ["dfs-backtrack"],
  "union-find":      ["bfs"],
  "graph-advanced":  ["bfs", "dfs-backtrack"],
};

export const PATTERNS = [
  { id: "sliding-window",  name: "Sliding Window",          diff: "Medium", freq: 5, desc: "Fixed or variable-size window sliding over array/string. Optimal for subarray/substring problems.", examples: ["Max Subarray","Longest Substring No Repeat","Min Window Substring"], keyIdea: "Expand right, shrink left when condition violated" },
  { id: "two-pointers",    name: "Two Pointers",            diff: "Easy",   freq: 5, desc: "Two indices moving toward each other or in same direction. Eliminates nested loops.", examples: ["Two Sum II","Container With Most Water","3Sum"], keyIdea: "Sort first, then converge or co-move pointers" },
  { id: "fast-slow",       name: "Fast & Slow Pointers",    diff: "Medium", freq: 4, desc: "Floyd's cycle detection. One pointer moves 2× faster. Detects cycles in linked lists.", examples: ["Linked List Cycle","Find Duplicate Number","Middle of Linked List"], keyIdea: "If cycle exists, fast catches slow" },
  { id: "binary-search",   name: "Binary Search Variants",  diff: "Medium", freq: 5, desc: "Beyond sorted arrays — search on answer space, rotated arrays, and 2D matrices.", examples: ["Search Rotated Array","Find Min in Rotated","Koko Eating Bananas"], keyIdea: "Define search space, eliminate half each step" },
  { id: "bfs",             name: "BFS / Level-Order",       diff: "Medium", freq: 5, desc: "Queue-based exploration. Shortest path in unweighted graphs, tree level traversal.", examples: ["Binary Tree Level Order","Shortest Path in Grid","Word Ladder"], keyIdea: "Use deque; track visited set for graphs" },
  { id: "dfs-backtrack",   name: "DFS / Backtracking",      diff: "Hard",   freq: 5, desc: "Recursive exploration with pruning. Permutations, combinations, path finding.", examples: ["Subsets","Permutations","N-Queens","Word Search"], keyIdea: "Choose → Explore → Unchoose (backtrack)" },
  { id: "dynamic-prog",    name: "Dynamic Programming",     diff: "Hard",   freq: 5, desc: "Memoization or tabulation to avoid recomputation. Optimal substructure + overlapping subproblems.", examples: ["Coin Change","Longest Common Subsequence","House Robber"], keyIdea: "Define state, recurrence, base case" },
  { id: "greedy",          name: "Greedy Algorithms",       diff: "Medium", freq: 4, desc: "Locally optimal choices lead to globally optimal solution. Prove correctness by exchange argument.", examples: ["Jump Game","Gas Station","Merge Intervals"], keyIdea: "Sort by key metric, make greedy choice" },
  { id: "heap-priority",   name: "Heap / Priority Queue",   diff: "Medium", freq: 4, desc: "Efficient min/max extraction. Top-K problems, merge K sorted lists, median of stream.", examples: ["Kth Largest Element","Merge K Sorted Lists","Find Median from Data Stream"], keyIdea: "heapq in Python; maintain heap size = K" },
  { id: "intervals",       name: "Intervals",               diff: "Medium", freq: 4, desc: "Sort by start time. Merge overlapping, find gaps, schedule meetings.", examples: ["Merge Intervals","Insert Interval","Meeting Rooms II"], keyIdea: "Sort by start; merge if curr.start <= prev.end" },
  { id: "monotonic-stack", name: "Monotonic Stack",         diff: "Medium", freq: 3, desc: "Stack maintaining monotone order. Next greater/smaller element problems.", examples: ["Daily Temperatures","Largest Rectangle in Histogram","Trapping Rain Water"], keyIdea: "Pop when current breaks monotone property" },
  { id: "trie",            name: "Trie (Prefix Tree)",      diff: "Medium", freq: 3, desc: "Tree for string prefix operations. Autocomplete, spell check, IP routing.", examples: ["Implement Trie","Word Search II","Design Add and Search Words"], keyIdea: "Each node = one char; isEnd marks word boundary" },
  { id: "union-find",      name: "Union-Find (DSU)",        diff: "Medium", freq: 3, desc: "Disjoint set union for connectivity. Path compression + union by rank for near-O(1).", examples: ["Number of Islands","Redundant Connection","Accounts Merge"], keyIdea: "find() with path compression; union by rank" },
  { id: "graph-advanced",  name: "Topological Sort",        diff: "Hard",   freq: 3, desc: "Kahn's algorithm (BFS) or DFS post-order. Detect cycles, order dependencies.", examples: ["Course Schedule","Alien Dictionary","Parallel Courses"], keyIdea: "In-degree 0 nodes go first; decrement neighbors" },
];

export const BEHAVIORAL_QUESTIONS = [
  // Conflict & Influence
  { id:"bq1",  area:"Conflict & Influence",  tier:"IC6", q:"Tell me about a time you disagreed with your manager or a senior stakeholder on a technical decision. What did you do?",                hint:"Show data-driven persuasion, not stubbornness. Outcome matters." },
  { id:"bq2",  area:"Conflict & Influence",  tier:"IC6", q:"Describe a situation where you had to influence a team or org that didn't report to you.",                                            hint:"Emphasize coalition-building and shared goals." },
  { id:"bq3",  area:"Conflict & Influence",  tier:"IC5", q:"Tell me about a time you had to push back on a product or business requirement.",                                                     hint:"Show you understand trade-offs and escalate appropriately." },
  { id:"bq4",  area:"Conflict & Influence",  tier:"IC6", q:"Describe a time when two teams had conflicting priorities and you had to broker a resolution.",                                        hint:"Focus on alignment, not just compromise." },
  { id:"bq5",  area:"Conflict & Influence",  tier:"IC5", q:"Tell me about a time you changed someone's mind using data or a prototype.",                                                           hint:"Concrete evidence beats opinion every time." },
  { id:"bq6",  area:"Conflict & Influence",  tier:"IC7", q:"Describe a time you had to navigate a politically sensitive technical decision.",                                                      hint:"Show EQ alongside technical judgment." },
  { id:"bq7",  area:"Conflict & Influence",  tier:"IC7", q:"Tell me about a time you successfully advocated for a technical investment that had no immediate business payoff.",                    hint:"Long-term thinking, ROI framing, stakeholder buy-in." },
  // Ownership & Ambiguity
  { id:"bq8",  area:"Ownership & Ambiguity", tier:"IC5", q:"Tell me about a time you took ownership of a problem that wasn't technically yours to solve.",                                        hint:"Show initiative and cross-functional thinking." },
  { id:"bq9",  area:"Ownership & Ambiguity", tier:"IC5", q:"Describe a project where the requirements were unclear. How did you move forward?",                                                   hint:"Structured ambiguity resolution: clarify, prototype, iterate." },
  { id:"bq10", area:"Ownership & Ambiguity", tier:"IC6", q:"Tell me about a time you had to make a significant decision with incomplete information.",                                             hint:"Show risk assessment and reversibility thinking." },
  { id:"bq11", area:"Ownership & Ambiguity", tier:"IC6", q:"Describe a situation where you identified a critical problem before it became a crisis.",                                             hint:"Proactive monitoring, early signals, preventive action." },
  { id:"bq12", area:"Ownership & Ambiguity", tier:"IC6", q:"Tell me about a time you had to define the scope of a project from scratch.",                                                         hint:"Show how you scoped, prioritized, and got alignment." },
  { id:"bq13", area:"Ownership & Ambiguity", tier:"IC5", q:"Describe a time you had to say no to a feature request. How did you handle it?",                                                      hint:"Principled prioritization, not just refusal." },
  { id:"bq14", area:"Ownership & Ambiguity", tier:"IC7", q:"Tell me about a time you had to pivot a project mid-execution. What triggered it and how did you manage it?",                         hint:"Adaptability + stakeholder communication." },
  // Scale & Impact
  { id:"bq15", area:"Scale & Impact",        tier:"IC6", q:"Tell me about the most technically complex system you've designed or significantly contributed to.",                                   hint:"Quantify scale: QPS, latency, data volume, team size." },
  { id:"bq16", area:"Scale & Impact",        tier:"IC7", q:"Describe a time when your technical decision had org-wide or company-wide impact.",                                                    hint:"IC7: show you influenced beyond your immediate team." },
  { id:"bq17", area:"Scale & Impact",        tier:"IC6", q:"Tell me about a time you improved engineering efficiency or developer productivity at scale.",                                          hint:"Tooling, process, platform — quantify the multiplier effect." },
  { id:"bq18", area:"Scale & Impact",        tier:"IC5", q:"Describe a project where you had to balance speed of delivery with long-term technical quality.",                                      hint:"Show judgment: when to incur tech debt and when to pay it down." },
  { id:"bq19", area:"Scale & Impact",        tier:"IC6", q:"Tell me about a time you reduced costs or improved performance significantly in production.",                                           hint:"Quantify: latency %, cost savings $, throughput improvement." },
  { id:"bq20", area:"Scale & Impact",        tier:"IC7", q:"Describe a time you led a migration or platform change that affected many teams.",                                                     hint:"Strangler fig, feature flags, rollback plan, incremental delivery." },
  { id:"bq21", area:"Scale & Impact",        tier:"IC7", q:"Tell me about a technical investment that paid off significantly over time.",                                                           hint:"Show long-term thinking and compounding returns." },
  // Failure & Learning
  { id:"bq22", area:"Failure & Learning",    tier:"IC6", q:"Tell me about a significant technical failure or outage you were responsible for. What happened and what did you learn?",             hint:"Own it fully. Show systemic fix, not just a patch." },
  { id:"bq23", area:"Failure & Learning",    tier:"IC5", q:"Describe a time when you were wrong about a technical approach. How did you course-correct?",                                         hint:"Intellectual humility + data-driven pivot." },
  { id:"bq24", area:"Failure & Learning",    tier:"IC6", q:"Tell me about a time a project you led failed to meet its goals. What would you do differently?",                                     hint:"Root cause analysis, not blame. Show growth." },
  { id:"bq25", area:"Failure & Learning",    tier:"IC5", q:"Describe a time you received critical feedback that was hard to hear. How did you respond?",                                          hint:"Show openness to feedback and concrete behavior change." },
  { id:"bq26", area:"Failure & Learning",    tier:"IC6", q:"Tell me about a time you shipped something that had unintended negative consequences.",                                                hint:"Monitoring, rollback, post-mortem, prevention." },
  { id:"bq27", area:"Failure & Learning",    tier:"IC5", q:"Describe a time you underestimated the complexity of a project. What happened?",                                                      hint:"Estimation skills, early signals, course correction." },
  { id:"bq28", area:"Failure & Learning",    tier:"IC6", q:"Tell me about a time you had to deliver bad news to stakeholders. How did you handle it?",                            hint:"Transparency, options, path forward." },
  // XFN Partnership (IC7 exclusive round)
  { id:"bq29", area:"XFN Partnership",        tier:"IC7", q:"Tell me about an XFN partnership that went particularly well. What made it successful, and what could have gone better?",        hint:"Show mutual respect, shared impact, and honest reflection on gaps." },
  { id:"bq30", area:"XFN Partnership",        tier:"IC7", q:"Who is the most challenging person or function you've had to work with? If I called them, what would they say about you?",         hint:"Show self-awareness and growth — don't just say 'they'd say great things'." },
  { id:"bq31", area:"XFN Partnership",        tier:"IC7", q:"Walk me through a project that required collaboration across multiple functions. How did you ensure effectiveness and alignment?",  hint:"Quantify the scope: how many teams, what disciplines, what was at stake." },
  { id:"bq32", area:"XFN Partnership",        tier:"IC7", q:"When have you had to manage through competing goals or lack of alignment across functions? How did you resolve it?",              hint:"Show strategic thinking: how you found shared ground or escalated appropriately." },
  { id:"bq33", area:"XFN Partnership",        tier:"IC7", q:"Have you ever been in a situation where a key XFN partner was missing or underperforming? How did you handle it?",               hint:"Show accountability without blame — what did YOU do to fill the gap?" },
  { id:"bq34", area:"XFN Partnership",        tier:"IC7", q:"What were your go-to methods for communicating and gathering feedback across functions? Have any ever backfired?",               hint:"Specific tools/rituals + honest reflection on what didn't work." },
];

export const STAR_STORIES = [
  { id:"s1", title:"Led cross-team migration",       tags:["Ownership","Scale","Execution"],   template:"S: Legacy monolith causing 40% of incidents\nT: Migrate 3 teams to new service mesh\nA: Designed strangler fig pattern, feature flags, 6-month rollout\nR: 40% incident reduction, 2× deploy frequency" },
  { id:"s2", title:"Resolved production outage",     tags:["Failure","Ownership","Speed"],      template:"S: P0 outage, 500k users affected\nT: Diagnose and restore within SLA\nA: Led war room, identified DB connection pool exhaustion, hotfix + long-term fix\nR: Restored in 47 min, implemented circuit breaker" },
  { id:"s3", title:"Influenced architectural decision", tags:["Conflict","Strategy","Data"],   template:"S: Team wanted to use vendor X, I had concerns\nT: Convince leadership with data\nA: Built proof-of-concept, benchmark comparison, TCO analysis\nR: Team adopted my recommendation, saved $200k/yr" },
  { id:"s4", title:"Grew junior engineer",            tags:["Mentorship","Culture","Impact"],   template:"S: Junior engineer struggling with system design\nT: Upskill to IC4 level in 6 months\nA: Weekly 1:1s, design reviews, stretch projects, feedback loops\nR: Promoted to IC4, now leading a feature independently" },
  { id:"s5", title:"Defined technical roadmap",       tags:["Strategy","Roadmap","IC7"],        template:"S: Org lacked 2-year technical vision\nT: Define roadmap aligned to business goals\nA: Stakeholder interviews, competitive analysis, RFC process, OKR alignment\nR: Roadmap adopted, 3 major initiatives launched" },
  { id:"s6", title:"Improved system performance",     tags:["Scale","Impact","Execution"],      template:"S: API latency at p99 = 800ms, impacting conversion\nT: Reduce to <200ms\nA: Profiling, caching layer, query optimization, async processing\nR: p99 = 140ms, 12% conversion improvement" },
  { id:"s7", title:"Navigated ambiguous project",     tags:["Ambiguity","Ownership","Clarity"], template:"S: Stakeholders had conflicting visions for new product\nT: Define scope and get alignment\nA: User research, prototype, structured decision framework, design doc\nR: Shipped MVP in 8 weeks, 85% stakeholder satisfaction" },
  { id:"s8", title:"Built engineering culture", tags:["Culture","Mentorship","Scale"], template:"S: Team had inconsistent code review and onboarding\nT: Build engineering culture and standards\nA: Defined coding standards, created onboarding guide, led weekly tech talks, introduced design docs\nR: 50% faster onboarding, 30% fewer review cycles, 2 engineers promoted" },
];

// System Design questions for CollabRoom, DayOfMode, FullMockDaySimulator
export const SYSTEM_DESIGN_QUESTIONS: { title: string; difficulty: string; tags: string[] }[] = [
  { title: "Design a News Feed (e.g., Facebook/Instagram)", difficulty: "Medium", tags: ["fanout", "caching", "ranking"] },
  { title: "Design a Distributed Rate Limiter", difficulty: "Medium", tags: ["redis", "sliding-window", "token-bucket"] },
  { title: "Design a URL Shortener (e.g., bit.ly)", difficulty: "Easy", tags: ["hashing", "redirection", "analytics"] },
  { title: "Design a Chat System (e.g., WhatsApp/Messenger)", difficulty: "Hard", tags: ["websockets", "message-queue", "storage"] },
  { title: "Design a Video Streaming Platform (e.g., YouTube)", difficulty: "Hard", tags: ["cdn", "transcoding", "chunked-upload"] },
  { title: "Design a Search Autocomplete System", difficulty: "Medium", tags: ["trie", "ranking", "caching"] },
  { title: "Design a Notification System", difficulty: "Medium", tags: ["push", "fanout", "delivery-guarantees"] },
  { title: "Design a Ride-Sharing Service (e.g., Uber/Lyft)", difficulty: "Hard", tags: ["geo-indexing", "matching", "real-time"] },
  { title: "Design a Distributed Cache (e.g., Memcached/Redis)", difficulty: "Medium", tags: ["eviction", "consistency", "sharding"] },
  { title: "Design a File Storage System (e.g., Dropbox/Google Drive)", difficulty: "Hard", tags: ["chunking", "sync", "conflict-resolution"] },
];

export const IC_COMPARISON = [
  { dimension: "Scope", ic6: "Owns a system or major component", ic7: "Owns a product area or platform" },
  { dimension: "Complexity", ic6: "High technical complexity, clear problem", ic7: "Ambiguous, org-wide problems" },
  { dimension: "Influence", ic6: "Drives team/org decisions", ic7: "Shapes multi-org or company strategy" },
  { dimension: "Mentorship", ic6: "Mentors L4/L5, raises bar", ic7: "Grows L6s, defines engineering culture" },
  { dimension: "Communication", ic6: "Communicates clearly to stakeholders", ic7: "Influences VP/Director-level decisions" },
  { dimension: "Execution", ic6: "Delivers complex projects on time", ic7: "Defines roadmap, unblocks org" },
];

export const PEER_BENCHMARKS = {
  patternsTop20: 14,
  patternsTop50: 8,
  storiesTop20: 6,
  storiesTop50: 3,
  mockAvgTop20: 4.2,
  streakTop20: 21,
};

export const PREP_TIMELINE = [
  { week: 1, focus: "Arrays, Strings, HashMaps", items: ["Two Sum", "Valid Anagram", "Group Anagrams", "Top K Frequent", "Encode/Decode Strings"] },
  { week: 2, focus: "Two Pointers, Sliding Window", items: ["3Sum", "Container With Most Water", "Longest Substring No Repeat", "Min Window Substring", "Sliding Window Maximum"] },
  { week: 3, focus: "Trees & Graphs", items: ["Invert Binary Tree", "Max Depth", "Level Order Traversal", "Number of Islands", "Clone Graph"] },
  { week: 4, focus: "Dynamic Programming", items: ["Climbing Stairs", "House Robber", "Coin Change", "Longest Common Subsequence", "Word Break"] },
  { week: 5, focus: "System Design", items: ["Design a URL Shortener", "Design a News Feed", "Design a Chat System", "Design a Rate Limiter", "Design a Distributed Cache"] },
  { week: 6, focus: "Behavioral + Mock Interviews", items: ["Record 3 STAR stories", "Full mock interview", "System design mock", "Behavioral mock", "Review all weak spots"] },
];

export const FAST_TRACK_TIMELINE = [
  { week: 1, focus: "Top 50 Meta patterns", items: ["Sliding Window", "Two Pointers", "BFS/DFS", "Dynamic Programming", "Binary Search"] },
  { week: 2, focus: "System Design + Behavioral", items: ["Design News Feed", "Design Chat", "3 STAR stories", "XFN Partnership story", "Failure story"] },
  { week: 3, focus: "Full mock interviews", items: ["2 coding mocks", "1 system design mock", "1 behavioral mock", "Review all feedback", "Final pattern review"] },
];

export const TEN_WEEK_TIMELINE = [
  { week: 1, focus: "Arrays & Strings", items: ["Two Sum", "Best Time to Buy Stock", "Contains Duplicate", "Product Except Self", "Maximum Subarray"] },
  { week: 2, focus: "HashMaps & Sets", items: ["Valid Anagram", "Group Anagrams", "Top K Frequent", "Encode/Decode", "Longest Consecutive Sequence"] },
  { week: 3, focus: "Two Pointers & Sliding Window", items: ["3Sum", "Container With Most Water", "Longest Substring No Repeat", "Min Window Substring", "Sliding Window Maximum"] },
  { week: 4, focus: "Trees & Recursion", items: ["Invert Binary Tree", "Max Depth", "Diameter", "Balanced Tree", "Same Tree"] },
  { week: 5, focus: "Graphs & BFS/DFS", items: ["Number of Islands", "Clone Graph", "Pacific Atlantic", "Surrounded Regions", "Course Schedule"] },
  { week: 6, focus: "Dynamic Programming", items: ["Climbing Stairs", "House Robber", "Coin Change", "LCS", "Word Break"] },
  { week: 7, focus: "Heaps & Priority Queues", items: ["Kth Largest", "Last Stone Weight", "K Closest Points", "Task Scheduler", "Find Median from Stream"] },
  { week: 8, focus: "System Design", items: ["URL Shortener", "News Feed", "Chat System", "Rate Limiter", "Distributed Cache"] },
  { week: 9, focus: "Behavioral Prep", items: ["3 STAR stories", "Conflict story", "Failure story", "XFN story", "Impact story"] },
  { week: 10, focus: "Full Mock Interviews", items: ["2 coding mocks", "1 system design mock", "1 behavioral mock", "Review all feedback", "Final prep"] },
];

export const INTERVIEW_DAY_CHECKLIST = [
  {
    phase: "Night Before",
    items: [
      "Get 8 hours of sleep",
      "Review your top 3 behavioral STAR stories",
      "Skim your notes on the 5 most common patterns",
      "Prepare 3-5 thoughtful questions to ask the interviewer",
    ],
  },
  {
    phase: "Morning Of",
    items: [
      "Eat a proper meal",
      "Warm up with 1-2 easy LeetCode problems",
      "Review your system design framework (requirements → API → data model → scale)",
      "Check your environment: IDE, webcam, mic, quiet space",
    ],
  },
  {
    phase: "During Interview",
    items: [
      "Clarify constraints before coding",
      "Think out loud — narrate your reasoning",
      "Start with brute force, then optimize",
      "Test with edge cases before declaring done",
    ],
  },
  {
    phase: "After Interview",
    items: [
      "Write down every question asked while fresh",
      "Note what went well and what to improve",
      "Send a thank-you email within 24 hours",
      "Log the session in your Practice Tracker",
    ],
  },
];

export const RESOURCES = [
  { title: "LeetCode", url: "https://leetcode.com", tag: "Practice", desc: "The gold standard for coding interview prep. Filter by company tag to find Meta-specific problems." },
  { title: "NeetCode", url: "https://neetcode.io", tag: "Video", desc: "High-quality video explanations for every major LeetCode pattern. NeetCode 150 is essential." },
  { title: "HelloInterview", url: "https://hellointerview.com", tag: "Mock", desc: "AI-powered mock interviews with real-time feedback. Great for system design practice." },
  { title: "Taro", url: "https://jointaro.com", tag: "Coaching", desc: "Career coaching from ex-Meta/Google engineers. Strong behavioral and leveling guidance." },
  { title: "Coditioning", url: "https://coditioning.com", tag: "Practice", desc: "Curated problem sets with spaced repetition. Tracks your progress across patterns." },
  { title: "igotanoffer", url: "https://igotanoffer.com", tag: "Guide", desc: "Detailed interview guides and salary negotiation resources from offer recipients." },
];
