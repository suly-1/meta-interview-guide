# Meta Interview Guide — TODO

## Completed Features
- [x] Coding tab with Quick Drill mode and 14 pattern cards
- [x] Behavioral tab with 28 questions, STAR builder, practice mode
- [x] Timeline tab with 60-day calendar, checklist, pattern heatmap
- [x] Practice Tracker tab with 500 CTCI problems and progress tracking
- [x] Readiness tab with overall score, breakdown bars, pattern radar
- [x] AI-Enabled Round tab with resources and mock problem bank
- [x] System Design tab with 8 patterns and Teach It Back mode
- [x] IC7 Signal Self-Assessment Checklist
- [x] STAR Story Gap Analyzer
- [x] Interviewer Persona Simulator (4 personas)
- [x] IC7 Answer Upgrader
- [x] Mock Interview Scorecard with Markdown export
- [x] Coding Session Debrief Log
- [x] Pattern Mastery Heatmap
- [x] Daily Practice Reminder (Notification API)
- [x] Spaced repetition system
- [x] Streak tracking and calendar
- [x] CTCI Streak Tracker
- [x] AI Hint System (backend + frontend)
- [x] Weekly Progress Email Digest
- [x] CTCI Problem Notes panel
- [x] CTCI Notes Cheat Sheet Export (3rd export mode)
- [x] Behavioral Answer Scorer UI (LLM rubric, 5 dimensions)
- [x] Readiness Goal Setter with daily task calculation

- [x] Add CTCI Progression Tracker banner to all tabs with tab-specific messaging
- [x] Enhance Pattern Mastery Heatmap (attempt counts, last-practiced date, unlock status, tooltips, drill-down) and move to middle of Coding tab
- [x] Remove CTCI banner from Coding tab only

## In Progress
- [x] Add Pattern Dependency Graph to Coding tab (after Pattern Quick Reference)
- [ ] Wire MockInterviewSimulator as its own navigation tab
- [ ] Pattern Dependency Unlock Flow visual indicators in CodingTab PatternRow
- [ ] Per-pattern Stuck? hint ladder (AIHintPanel compact) inside each expanded PatternRow

- [ ] CTCI Streak Tracker (consecutive daily-challenge completions, flame pill in CTCI header)
- [ ] CTCI Daily Challenge banner (deterministic unsolved High-freq problem of day, amber highlight + Today badge)
- [ ] CTCI Problem Notes panel (persistent per-row, exportable as Markdown cheat sheet)
- [ ] Inline Code Editor (VS Code dark, Tab-indent, auto-save, line count) + AI Hint streaming
- [ ] Keyboard Navigation Overlay (? key, 2-column modal, 4 shortcut groups)
- [ ] Enhanced Pattern Mastery Heatmap (SVG mastery ring, time-invested fill bars, Easy/Medium/Hard breakdown)
- [ ] Weekly Progress Email Digest UI (Send button in Overview, compiles session data, notifyOwner)
- [ ] Add CTCI spreadsheet link to Practice Tracker tab header
- [x] Wire MockInterviewSimulator as its own navigation tab
- [x] CTCI Daily Challenge amber banner in Practice Tracker tab
- [x] Per-pattern Stuck? 3-step hint ladder inside expanded PatternRow
- [x] In-app coding practice environment (Monaco editor, language selector, code execution via Judge0, AI hints, timer, solve tracking)
- [x] Code Practice tab (Monaco editor, Judge0 execution, AI hints, timer, session history, solve tracking)
- [x] Custom test case editor in Code Practice (input/expected output pairs, pass/fail summary)
- [x] Per-problem submission history in Code Practice (code snapshot, output, timestamp, language)
- [x] Personal stats dashboard tab (solve counts, avg time per difficulty, most-used language, weekly chart)
- [x] Difficulty progression lock (grey out Hard until ≥60% Easy + ≥40% Medium solved)
- [x] Code export (download file + copy to clipboard) in editor toolbar
- [x] Speed Run timed challenge mode (hidden problem name, 20-min countdown, correctness + time scoring)
- [x] Speed Run leaderboard (localStorage, personal best table in Stats view)
- [x] Hint penalty system (−10 per hint used in Speed Run, deducted from final score)
- [x] Topic Sprint mode (topic selector, 3-problem timed set, aggregate score)
- [x] Choose-your-topic Sprint dropdown (target specific weak area)
- [x] Sprint history (persist completed sprints in localStorage, show in Stats view)
- [x] Speed Run difficulty filter (Easy/Medium/Hard radio buttons in Speed Run start flow)
- [x] Sprint streak badge (flame badge in sidebar when 3+ sprints completed today)
- [x] Weak-topic auto-suggest (pre-select lowest avg-score topic in Sprint dropdown)
- [x] Speed Run score breakdown panel (base score + time bonus - hint penalty breakdown)
- [x] CTCI Difficulty Estimator (self-assessment modal after solve, divergence analytics in Stats)
- [x] Study Session Planner (LLM-powered 30/60/90-min plan from SR dates, hints, readiness pace)
- [x] Sprint personal best per topic (highest single-sprint score per topic in Sprint History)
- [x] Speed Run Rematch button (one-click restart on same problem after Speed Run ends)
- [x] Daily goal banner (progress bar in sidebar, configurable daily target)
- [x] Difficulty Estimator trend chart (avg self-rating vs official rating per difficulty tier in Stats)
- [x] Study plan Markdown export (Copy as Markdown button in generated study plan)
- [x] Speed Run 24-hour problem lock after Rematch (prevent same problem in next different Speed Run)
- [x] Difficulty Estimator clear-ratings button (wipe stale assessments from Difficulty Perception card)
- [x] Study plan .ics calendar export (Add to Calendar button generating one ICS event per block)
- [x] Speed Run consecutive-day streak badge (flame badge next to Speed Run button)
- [x] Speed Run streak stats row in Stats view (current streak, longest streak, last active date)
- [x] ICS block colour metadata (CATEGORIES per block type for Google Calendar / Outlook colour coding)
- [x] Difficulty Estimator CSV export (Copy as CSV button in Difficulty Perception card)
- [x] Mock Interview Simulator: update duration text to 60-min (30 coding + 10×2 behavioral)
- [x] Mock Interview Simulator: rename IC6 tab to "Staff Engineer"
- [x] Mock Interview Simulator: rename IC7 tab to "Principal/Senior Staff"
- [x] Mock Interview Simulator: replace Principal/Senior Staff mock with 60-min behavioral-only interview using IC7 questions
- [x] Weekly email digest (mailto: button with streak stats, weak topics, recent Sprint scores)
- [x] Well-calibrated badge in Stats summary (awarded when <20% of assessments diverge)
- [x] Sprint history CSV export (topic, score, date, per-problem scores)
- [x] IC7+ debrief prompt tuning (behavioral-only prompt: skip coding score, evaluate XFN influence, retrospective ownership, org-wide impact)
- [ ] Sprint history line chart (score-over-time per topic in Sprint History Stats section)
- [x] Mock Interview session replay (collapsible transcript panel in debrief: question + typed answer pairs)
- [x] System Design Mock Session (45-min timed mock in System Design tab, problem picker, answer panel, LLM IC-level debrief using all 8 patterns + key signals)
- [x] AI-Enabled Round Mock Session (timed mock in AI Round tab, scenario picker, answer panels, LLM IC-level debrief using all tab content)
- [x] System Design mock session history (persist results in localStorage, show in Stats view)
- [x] System Design debrief follow-up question mode (Drill deeper button → LLM generates 2-3 probing questions)
- [x] System Design debrief radar chart (spider chart of 5 dimension scores alongside score bars)
- [x] AI Round mock history in Stats (mirror SD history card: scenario, verdict, avg score, date)
- [x] IC7+ behavioral-only debrief prompt tuning (skip coding, evaluate XFN influence, retrospective ownership, org-wide impact)
- [x] Mock Interview session replay (collapsible transcript panel in behavioral debrief: question + typed answer pairs)

## Batch-23 Features
- [ ] Sprint history line chart (score-over-time per topic in Sprint History Stats section)
- [ ] Speed Run tournament mode (bracket-style weekly challenge, 8 problems, cumulative score)
- [ ] Code diff viewer (side-by-side diff between current and previous submission in history panel)
- [ ] Pattern unlock celebration (confetti burst + toast when pattern reaches 100% mastery)
- [ ] STAR answer word-count enforcer (live word counter with green/amber/red indicator in behavioral answer textarea)
- [ ] Behavioral flashcard deck (flip-card mode: one question at a time, type answer, flip to see probes + model outline)
- [ ] Mock Interview warm-up mode (5-min pre-session: 1 easy behavioral + 1 simple coding problem)
- [ ] System Design follow-up drill bank (30+ curated follow-up probing questions per pattern, self-quiz mode)
- [ ] AI Round scenario difficulty tiers (Foundational/Intermediate/Advanced tags + difficulty filter in mock session picker)
- [ ] System Design pattern comparison table (side-by-side matrix: read/write-heavy, consistency model, Meta example)
- [ ] SR due-date heatmap (GitHub-style heatmap in Stats showing SR reviews due per day for next 30 days)
- [ ] Weak-pattern drill auto-queue (Fix my weaknesses button: auto-queues 5-problem Sprint on bottom 3 patterns)
- [ ] Time-of-day performance chart (bar chart in Stats of avg score by hour-of-day)
- [ ] Achievement badge wall (dedicated Achievements section in Stats with earned/locked badges)
- [ ] Daily XP system (XP for every action, level bar in sidebar)
- [ ] Interview countdown clock (Days until interview widget in sidebar, adjusts Study Planner recommendations)
- [ ] Meta engineering blog reader (in-app curated feed of 20 relevant Meta Engineering Blog posts)
- [ ] IC6 vs IC7 answer comparison (toggle in Behavioral tab showing IC6-level vs IC7-level sample answers)
- [ ] Coding pattern cheat sheet PDF (one-click export: 14 patterns, key DS, time complexity, canonical problem)
- [ ] Keyboard shortcut help overlay (? key opens two-column modal with all shortcuts)
- [ ] Font size / density toggle (compact/comfortable/spacious density toggle in settings)
- [ ] AI Round follow-up drill (Drill Deeper button in AI Round debrief generating 2-3 probing follow-up questions)
- [ ] Mock session comparison (Compare to last attempt toggle showing score deltas vs previous session)

## Batch-23 Implementation Tracking
- [x] Sprint history line chart (score-over-time per topic)
- [ ] Code diff viewer (side-by-side diff between submissions)
- [x] AI Round Drill Deeper UI (button in debrief)
- [ ] AI Round difficulty tiers (Foundational/Intermediate/Advanced tags)
- [ ] Mock session comparison (score deltas vs previous session)
- [ ] SR due-date heatmap (GitHub-style 30-day calendar)
- [ ] Weak-pattern drill auto-queue (Fix My Weaknesses button)
- [ ] Time-of-day performance chart
- [x] Achievement badge wall
- [x] Daily XP system
- [x] Interview countdown in sticky nav
- [ ] System Design pattern comparison table
- [ ] Keyboard shortcut overlay (? key)
- [ ] Font size/density toggle
- [ ] Coding pattern cheat sheet PDF
- [ ] Speed Run tournament mode
- [ ] Mock warm-up mode (5-min pre-session)
- [ ] IC6 vs IC7 answer comparison in BehavioralTab

## Current Batch (Speed Run Tournament + Weak-Pattern Queue + Density Toggle)
- [x] Speed Run tournament bracket mode (5 problems, 45 min, bracket progression UI in Code Practice)
- [x] Weak-pattern drill auto-queue (Fix My Weaknesses button in Readiness tab)
- [x] Font size/density toggle (compact/comfortable/spacious in sticky nav)

## Current Batch (Leaderboard + Sprint Scheduler + Density Print)
- [x] Tournament leaderboard in Stats view (top-10 all-time, sortable by score/date)
- [x] Scheduled daily weakness sprint toggle (Notification API, user-chosen time)
- [x] Density-aware print styles for Recruiter-Ready Summary PDF

## Current Batch (Bracket Comparison + Snooze + Print Preview)
- [x] Tournament bracket vs personal-best delta comparison card (after each tournament)
- [x] Sprint notification snooze action (Notification API actions + Service Worker)
- [x] Print preview modal with density label before opening print window

## Current Batch (Tournament Streak + Snooze Cap + Print Miniature)
- [ ] Tournament streak counter badge in Code Practice toolbar
- [ ] Snooze count cap setting in sprint scheduler (max snoozes/day, SW enforcement)
- [ ] Live print miniature (scaled snapshot of print HTML) in print preview modal

## Current Batch (Ambient Motivation)
- [x] XP Decay Warning — Rusty badge + draining mastery bar on patterns idle 7+ days
- [x] Study Soundtrack Mode — Web Audio API lo-fi/white noise/rain toggle in toolbar
- [x] Interview Countdown Clock — D-minus counter in hero section with date setter

## Current Batch (Pomodoro + Rust Buster + Milestone Notifications)
- [ ] Pomodoro 25/5 timer in SoundtrackPlayer (auto-pause on break, session counter)
- [ ] Rust Buster banner in Coding tab (3+ rusty patterns → dismissible sprint prompt)
- [ ] Countdown milestone notifications via sprint SW (D-14, D-7, D-3, D-1)

## Current Batch (Study Variety Mechanics)
- [x] Reverse Engineering Drill — identify pattern/complexity/edge case from a solution in 3 min
- [x] Explain It Back — post-solve explanation box saved alongside solve history
- [x] Topic Roulette — spin-wheel animation picks random tab + problem

## Current Batch (Progression & Mastery Systems)
- [x] Pattern Mastery Tree — SVG skill tree, nodes unlock at 4+/5 drill rating ×3, Pattern Master badge
- [x] Topic Boss Fight — weekly hard boss per topic, crown icon on clear, weekly reset
- [x] Combo Multiplier — back-to-back solve streak ×1→×2→×3 applied to Speed Run and Tournament scores

## Current Batch (Gamified Challenge Modes)
- [x] Blitz Round — 10 problems, 2 min each, no hints/skips, leaderboard if all 10 attempted
- [x] Chaos Mode — random problems with hidden pattern label, revealed after solve/skip
- [x] Gauntlet Mode — 7-tab sequential run with mini-challenges, one-failure-ends, Gauntlet Cleared badge

## Current Batch (Boss Leaderboard + Combo Toast + Mastery Export)
- [ ] Boss Fight leaderboard in Stats view (fastest clear times per topic, personal-best table)
- [ ] Combo milestone toast (animated toast at ×2 and ×3 first-time achievements)
- [ ] Mastery Tree Markdown export (Copy as Markdown button with unlock checklist)

## Current Batch (Mock Interview Realism)
- [x] Pressure Simulator — random interviewer interjections at unpredictable intervals during mock
- [x] Silence Detector — Web Speech API 45s silence prompt during mock
- [x] Follow-up Question Bank — LLM-generated personalized follow-ups after debrief, saved to review queue

## Current Batch (Follow-up Queue + Pressure Intensity + Silence Calibration)
- [x] Follow-up Review Queue panel in Stats view (mark reviewed checkbox, Copy as Markdown export)
- [x] Pressure Simulator intensity levels (Low/Medium/High frequency selector in mock phases)
- [x] Silence Detector threshold calibration (30s/45s/60s settings popover)

## Current Batch (Spaced Repetition + Pressure Log + Silence Stats)
- [ ] Follow-up spaced repetition: "Due today" filter in Review Queue (questions not reviewed in 3+ days)
- [ ] Pressure Simulator session log: track interjection count + dismissal speed per session, show Responsiveness score in debrief
- [ ] Silence Detector stats: show "Longest silence this session" metric in debrief panel

## System Design Pass-Rate Uplift (10% → 60%)
- [x] Server: tRPC procedures for requirementsTrainer.score, tradeoffDrill.score
- [x] SD Tab: "Why 90% Fail" — Failure Mode Diagnostic + Level Calibrator sub-view
- [x] SD Tab: Requirements Clarification Trainer (drill the 30%-weight signal)
- [x] SD Tab: Trade-off Articulation Drill (10 binary decisions with LLM scoring)
- [x] SD Tab: Wire all 3 new views into tab navigation

## Current Batch (Math Trainer + Skeptic Persona + Label Rename)
- [x] Back-of-Envelope Math Trainer: 4th score booster tool, 6 scale scenarios, LLM checks QPS/storage/bandwidth arithmetic
- [x] Skeptic Persona toggle in System Design Mock: "Why not X instead?" challenges after each section
- [x] Rename "Pass-Rate Uplift:" label to "Score Boosters:" in SystemDesignTab nav row

## Current Batch (IC Signal Detector + Math Progress + Skeptic Expansion)
- [x] IC-Level Signal Detector: LLM classifies each paragraph of mock answer as IC4/5/6/7, color-coded transcript in debrief
- [x] Math Trainer progress tracking: persist best scores per scenario in localStorage, show "Best: X/5" chip on scenario buttons
- [x] Skeptic challenge bank expansion: 3 problem-specific challenges per section per problem (8 problems × 5 sections × 3 = 120 targeted challenges)

## Full Research Roadmap Batch (Sprint 3 + 4 + Enhancements)
- [x] B4: Component Stress-Test Quiz (8 components × 5 stress scenarios, LLM scores cascade reasoning)
- [x] D1: Meta-Specific Trade-off Library (50+ decisions with Meta-scale context and "what interviewer listens for")
- [x] D2: Deep-Dive Question Bank per Component (IC5/IC6/IC7 level questions per component)
- [x] D3: Meta Engineering Blog Integration (15 papers with interview-relevance annotations, whatToExtract, keyInsight)
- [x] Wire all new tools into SystemDesignTab navigation

## Current Batch (BoE Calculator + Skeptic Intensity + IC Signal Trend)
- [x] BoE Calculator with Decision Mapping: DAU/RPS/storage inputs → architectural implications panel
- [x] Skeptic Intensity tiers: Mild (1 challenge/section) vs Aggressive (2 challenges + typed response required)
- [x] IC Signal Detector trend chart: persist per-session distribution in localStorage, line chart in Stats view

## Current Batch (BoE Notes + Skeptic Scoring + Signal Goal Line + Build)
- [x] BoE Calculator "Save to Notes": append calculation to persistent localStorage log, show log panel below calculator
- [x] Aggressive Skeptic response scoring: LLM scores typed challenge responses (1-5), "Challenge Defense Quality" score in debrief
- [x] IC Signal Trend goal line: target IC6+ % input in Readiness Goal Setter, dashed line on trend chart
- [x] Run pnpm build: production build verified clean (0 TypeScript errors, 0 build errors)

## New Features Batch — Progress, Search, Dark Mode, Bookmarks, Mobile

- [ ] Progress Dashboard panel — unified view of all saved progress (XP, streak, problems solved, readiness score, pattern mastery %)
- [ ] Dark/light mode toggle button in the sticky nav bar
- [ ] Custom notes for behavioral questions (extend per-question notes to BehavioralTab)
- [ ] Custom notes for system design topics (extend per-topic notes to SystemDesignTab)
- [ ] Bookmark/favorite sections — save favorite tabs/topics to localStorage with quick-access panel
- [ ] Global search across all tabs and content (search bar in nav, results grouped by tab)
- [ ] Mobile layout improvements — better responsive nav, readable cards on small screens
- [ ] Deploy to GitHub Pages after all features complete (pnpm deploy:github-pages)

## New Features Batch — Progress, Search, Bookmarks, Mobile

- [x] Progress Dashboard panel showing all saved progress at a glance
- [x] Bookmark/favorite sections feature (useBookmarks hook + BookmarksPanel)
- [x] Global search across all tabs with Ctrl+K shortcut (GlobalSearch component)
- [x] Mobile layout improvements (hide density toggle, soundtrack, keyboard shortcut on mobile)
- [x] Dark/light mode toggle already in nav (confirmed working)
- [x] localStorage persistence already covers all major state (confirmed)

## Countdown Milestone Notifications

- [ ] Service worker milestone scheduler (D-14, D-7, D-3, D-1 notifications)
- [ ] Weak-area detection from readiness/pattern data for notification content
- [ ] Notification settings UI in nav (enable/disable milestones, test notification)
- [ ] Milestone notification messages with personalized weak-area focus tips
- [ ] Deploy to GitHub Pages after feature complete

## New Features Batch — Coding Practice + Notifications

- [ ] Sprint Mode (8 problems, 30s each, pattern identification, scored results)
- [ ] Pattern Dependency Graph (SVG, green=mastered, locked=dimmed)
- [ ] AI Approach Analyzer (4 dimensions: pattern recognition, complexity, edge cases, trade-offs)
- [ ] Voice Approach Recorder (Web Speech API transcription → feeds Approach Analyzer)
- [ ] Scorecard / Rubric (7-criterion checklist, Strong Hire/Hire/Lean Hire/No Hire verdict)
- [ ] Complexity Estimator (dropdown before reveal, brute force vs optimal comparison)
- [ ] Streak & Achievement Badges (6 badges: First Session, 3-Day Streak, Perfect Score, 10 Sessions, All Tests Pass, Hard Problem)
- [ ] Weakness Heatmap (per-pattern bar chart, sorted weakest-first)
- [ ] Spaced Repetition Queue (score-based scheduling: <2.5→1d, 2.5-4→3d, ≥4→7d, due alerts)
- [ ] Focus Mode (hides non-essential UI, Escape to exit)
- [ ] Countdown Milestone Notifications (D-14, D-7, D-3, D-1 with weak-area content)

## New Features Batch (11 Features)
- [x] Interview countdown milestone notifications (D-14, D-7, D-3, D-1 browser push notifications)
- [x] Sprint Mode (8 problems, 30 seconds each, pattern identification)
- [x] Pattern Dependency Graph (visual SVG showing pattern relationships)
- [x] AI Approach Analyzer (scores verbal approach on 4 dimensions)
- [x] Voice Approach Recorder (Web Speech API transcription integrated into Approach Analyzer)
- [x] Scorecard/Rubric (7-criterion self-scoring checklist with Strong Hire/Hire/No Hire verdict)
- [x] Complexity Estimator (select time/space complexity before reveal)
- [x] Streak & Achievement Badges (daily streak, 8 achievement types)
- [x] Weakness Heatmap (per-pattern bar chart sorted weakest-first)
- [x] Spaced Repetition Queue (SM-2 algorithm schedules problems based on recall quality)
- [x] Focus Mode (hides Hero section and non-essential UI, toggle in nav)

## New Features Batch (3 Follow-ups)
- [x] Pomodoro Timer in nav — 25/5 work/break timer in SoundtrackPlayer popover, auto-pauses music on break, session counter
- [x] Weak-Pattern Auto-Sprint — "Fix My Weaknesses" button in Weakness Heatmap launches Sprint Mode pre-loaded with 3 weakest patterns
- [x] SRS Due-Date Calendar — GitHub-style heatmap in Timeline tab showing SRS reviews due per day for next 30 days

## New Features Batch (3 Follow-ups Round 2)
- [x] Pomodoro session history — last 5 session timestamps + total focus minutes today in the Pomodoro popover
- [x] SRS auto-scheduling into Study Planner — prepend due-today patterns as first block when AI generates 30/60/90-min plan
- [x] Weakness Sprint leaderboard — save score + pattern names + date after each "Fix My Weaknesses" sprint; show personal-best table in Stats view

## Meta SWE Rubric Assessment (AI Feedback)
- [x] MetaRubricAssessment component — 4-dimension rubric (Problem Solving, Coding, Verification, Communication) with Insufficient/Moderate/Solid/Strong/Exceptional/Can't Assess ratings
- [x] AI rubric scoring tRPC procedure — LLM scores all 4 dimensions based on candidate's approach text + code
- [x] Integrate rubric into ApproachAnalyzer — show Meta rubric panel after approach is submitted
- [x] Integrate rubric into InterviewScorecard — map existing 7-criterion checklist to Meta 4 dimensions
- [x] Integrate rubric into CodingTab as standalone ⭐ Meta SWE Rubric section
- [x] Integrate rubric into TimedMockSession — show Meta rubric self-assessment in debrief

## Meta Coding Screen Interview Simulator
- [ ] MetaCodingScreenSimulator component — two-question format, 45-min timer, structured note-taking by focus area
- [ ] 6-point Meta scale per dimension (Insufficient/Moderate/Solid/Strong/Exceptional/Can't Assess) with "Can't Assess" reason field
- [ ] Focus area note panels — Problem Solving, Coding, Verification & Debugging, Technical Communication
- [ ] AI debrief tRPC procedure — scores all 4 dimensions, generates coaching notes, Proceed/Do Not Proceed recommendation
- [ ] Integrate simulator into Code Practice tab as a new section
- [ ] Session history — persist completed screen simulations in localStorage, show in Stats view

## Submit Solution + Judge0 Automated Scoring
- [x] Add Monaco code editor to MetaCodingScreenSimulator per question
- [x] Add Submit Solution button that calls Judge0 via existing tRPC execute procedure
- [x] Feed pass/fail execution results into AI debrief for automated Coding + Verification scoring
- [x] Update metaScreenDebrief procedure to accept testResults field

## Simulator Enhancements Batch 2
- [ ] Hidden test cases per CTCI problem — curated 3–5 test cases in shared constant, fed as stdin to Judge0
- [ ] Execution history per question — collapsible "Previous Runs" section showing last 3 runs (timestamp, language, status, time)
- [ ] Screen simulation session history — persist completed simulations in localStorage, sortable table in Progress Dashboard

## Simulator in Both Tabs
- [ ] Add MetaCodingScreenSimulator to CodingTab (Coding Interview tab)
- [ ] Add screen simulation session history table to ProgressDashboard

## Simulator in Both Tabs
- [ ] Add MetaCodingScreenSimulator to CodingTab (Coding Interview tab)
- [ ] Add screen simulation session history table to ProgressDashboard

## Simulator in Both Tabs + Session History
- [x] Add MetaCodingScreenSimulator to CodingTab (Coding Interview tab)
- [x] Add screen simulation session history table to ProgressDashboard
- [x] Hidden test cases wired into Judge0 per CTCI problem
- [x] Collapsible Previous Runs section per question

## Simulator Round 3 Features
- [ ] E6+ behavioral focus areas (XFN Collaboration + Scope & Conflict Resolution) when E6+ target level selected
- [ ] AI question selection mode — LLM picks two problems calibrated to weakest patterns and target level
- [ ] Shareable debrief link — "Copy Shareable Summary" button formats session as plain text

## Simulator Hero Banner & Reorder
- [x] Move MetaCodingScreenSimulator to top of CodingTab with colorful hero banner
- [x] Add MUST DO callout with emojis and bold colors

## Timer Fix
- [x] Change Meta Coding Screen Simulator from 45 min to 30 min everywhere

## Duration Selector + Interview Structure Note
- [x] Add 30/35/40/45 min duration selector to MetaCodingScreenSimulator setup phase
- [x] Add explanatory note: 45-min interview = 15 min intro/clarification + 30 min coding; recommend 30 min practice
- [x] Start button shows selected duration

## Protection Features (Professional Safety)
- [x] #5 Rename Meta-specific labels to FAANG/Staff Engineer framing across all components
- [x] #4 Add one-click share message button to hero (copies Framing Option A to clipboard)
- [x] #1 Add candidate-initiated discovery landing/splash page

## Protection Features Batch 2
- [ ] #2 Add "Community Contributors" author byline to hero and footer
- [ ] #5 Add Version E relaxed employee-sharing note to footer and Terms of Use page
- [ ] #7 Add Terms of Use page accessible from footer
- [ ] Expand IC level selector to 3 tiers: IC4 (Junior), IC5 (Senior), IC6/IC7 (Staff+)
- [ ] Update BehavioralTab IC6 vs IC7 labels to use correct level names

## Deployment Status Badge
- [x] Live GitHub Actions deployment status badge in UI (green ✅ / yellow 🟡 / red ✗) visible in hero/footer
- [ ] Fix Progress Dashboard not working
