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

## ZIP Implementation Batch
- [ ] Update DB schema: add disclaimerAcknowledgedAt to users, add collabRooms, sessionEvents, scorecards, leaderboardEntries, onboardingProgress, userRatings, ctciProgress, mockSessions tables
- [ ] Add server router files: disclaimer.ts, collab.ts, leaderboard.ts, ratings.ts, ctci.ts, ctciProgress.ts, mockHistory.ts, onboarding.ts, deployStatus.ts
- [ ] Wire all new sub-routers in server/routers.ts
- [ ] Replace DisclaimerGate.tsx with DB-backed version (metaengguide.pro domain)
- [ ] Add new UI components: AdminDisclaimerReport, SectionErrorBoundary, WeakPatternHeatmap, WeakSpotStudyPlan, HeatmapCalendar, ShareMessageButton, CommunityBanner, NotificationBanner, OverviewTab, OverviewExtras, CollabRoom, Leaderboard, VoiceAnswerMode, VoiceToStar, DayOfMode, FullMockDaySimulator, CrossDeviceSync
- [ ] Run pnpm db:push to migrate schema
- [ ] Wire OverviewTab into main nav in Home.tsx
- [ ] Add Leaderboard tab to main nav in Home.tsx
- [ ] Add 'Practice with a partner' CollabRoom button in SystemDesignTab
- [x] DisclaimerGate: soften body text - replace "not affiliated with Meta, Google, Amazon, or any other company" with "not affiliated with any company"
- [x] DisclaimerGate: update header subtitle from "Takes 10 seconds — worth it" to "A note from the community"
- [x] DisclaimerGate: add "I've seen this before" skip fast path for return visits that bypasses DB check
- [x] DisclaimerGate: auto-skip for DB-acknowledged returning users, no loading spinner

## 10 High-Impact Features (7/10 Candidate Success Rate)
- [x] #7 Story Coverage Matrix — visual grid: STAR stories vs focus areas/values, red = gap
- [x] #9 Impact Quantification Coach — paste STAR answer, AI highlights missing metrics
- [ ] #8 Interviewer Persona Stress Test with Scoring — live 3-turn AI persona exchange, scored
- [x] #4 Think Out Loud Coaching Mode — voice-recorded timed session, AI scores narration
- [x] #5 Pattern Recognition Speed Drill — 90-sec: name pattern + complexity + edge case
- [ ] #6 Personalized Weak Pattern Remediation Plan — AI 5-problem sequence for weakest patterns
- [x] #1 AI Interviewer Interrupt Mode — SD session with AI disruptive questions every 3-5 min
- [ ] #2 BoE Calculator with Show-Your-Work Grading — type estimation steps, AI grades
- [x] #3 Adversarial Design Review — submit design, AI attacks 3 weakest points, candidate defends
- [x] #10 Weekly AI Readiness Report — synthesizes all data → ranked top-3 focus areas + exercises
- [x] Visual highlighting — HIGH IMPACT badges, glow borders, animated pulse labels

## Phase 2 — Onboarding, Sprint Plan, DB Persistence, Tab Reorder

- [ ] DB: user_scores table (userId, feature, scoreType, scoreValue, metadata, createdAt)
- [ ] DB: sprint_plans table (userId, plan JSON, generatedAt)
- [ ] Server: saveScore / getScores / getAggregateStats procedures
- [x] Move all 10 HIGH IMPACT features to top of each tab
- [ ] OnboardingTour component (60-second guided tour → Weekly Readiness Report)
- [ ] Wire OnboardingTour into Home.tsx (show once for new users)
- [ ] SprintPlanGenerator component (7-day plan from readiness data, print/save)
- [x] Wire score persistence into all 10 feature components
- [ ] Aggregate stats display (anonymized pass rates per feature)

## Batch 3 — Feedback, Analytics, Sharing, Onboarding Plan
- [ ] Site-wide feedback modal (DB + owner notification)
- [ ] Sprint plan inline feedback (rating + suggestions)
- [ ] Progress & Analytics Dashboard (radar chart, trends)
- [ ] Sprint plan sharing (shareable link + mentor view)
- [ ] Detailed onboarding flow plan document in-app
- [ ] Fix/document CodingTab JSX structure

## Round 3 Features
- [ ] Admin feedback view at /admin/feedback (owner-only, all site feedback sorted by category/rating)
- [ ] Weekly email digest cron job → owner email
- [ ] Sprint plan completion celebration (confetti + share prompt at 100%)
- [ ] Enhanced admin dashboard: sortable feedback table at /admin/feedback
- [ ] Aggregate anonymous pass-rate stats per feature (68% vs 41% style)
- [x] Feedback status counts in weekly digest email (new/in_progress/done breakdown)
- [x] Instant admin notification email on new feedback submission
- [ ] Weekly analytics report in Monday digest (visitor counts, sessions, page views, feature engagement, device breakdown)
- [ ] Top 3 unactioned feedback items section in Monday digest

## Bundle Optimization (Deployment Fix)
- [x] Convert all tab components (CodingTab, AIRoundTab, BehavioralTab, TimelineTab, CTCITrackerTab, ReadinessTab, SystemDesignTab) to lazy imports in Home.tsx
- [x] Convert MockInterviewSimulator and CodePractice to lazy imports
- [x] Convert Monaco Editor to lazy import in CodingTab, CodePractice, FullMockDaySimulator, DayOfMode, MetaCodingScreenSimulator, CodingMockSession
- [x] Convert ProgressAnalyticsDashboard to lazy import in SprintPlanGenerator
- [x] Convert jsPDF/html2canvas to dynamic imports in usePdfExport hook
- [x] Convert jsPDF to dynamic import in SystemDesignEnhancements
- [x] Update vite.config.ts with comprehensive manual chunk splitting (monaco, pdf, charts, animation, trpc, radix, react, icons, utils)
- [x] Initial load reduced from 5.67MB to ~381KB main entry (284KB gzip total core)

## Bundle Optimization (Deployment Fix)
- [x] Convert all tab components (CodingTab, AIRoundTab, BehavioralTab, TimelineTab, CTCITrackerTab, ReadinessTab, SystemDesignTab) to lazy imports in Home.tsx
- [x] Convert MockInterviewSimulator and CodePractice to lazy imports
- [x] Convert Monaco Editor to lazy import in CodingTab, CodePractice, FullMockDaySimulator, DayOfMode, MetaCodingScreenSimulator, CodingMockSession
- [x] Convert ProgressAnalyticsDashboard to lazy import in SprintPlanGenerator
- [x] Convert jsPDF/html2canvas to dynamic imports in usePdfExport hook
- [x] Convert jsPDF to dynamic import in SystemDesignEnhancements
- [x] Update vite.config.ts with comprehensive manual chunk splitting
- [x] Initial load reduced from 5.67MB to ~381KB main entry (284KB gzip total core)

## UX & Performance Improvements (Round 2)
- [x] Tab loading skeletons: create TabSkeleton component with content-shaped grey placeholders per tab type
- [x] Replace spinner fallback in main Suspense with TabSkeleton in Home.tsx
- [x] MockInterviewerChat chunk split: move Streamdown to vendor-streamdown chunk in vite.config.ts
- [x] Lazy-load Streamdown inside MockInterviewerChat, MetaCodingScreenSimulator, SystemDesignEnhancements
- [x] PWA Service Worker: install vite-plugin-pwa, configure Workbox to cache vendor chunks
- [x] Add web app manifest (name, icons, theme color) for installability

## UI Fixes Pending
- [x] Fix yellow-on-yellow text contrast in FAANG-Style Coding Screen Simulator box header/title area

## High-Impact Feature Enhancements (Batch-25)
- [ ] IC6→IC7 Answer Upgrader: add live AI scoring mode — paste your own answer, get IC4/IC5/IC6/IC7 rating + exact upgrade instructions
- [ ] Story Coverage Matrix: add AI gap analysis — after mapping stories, AI identifies weakest coverage areas and suggests story angles
- [ ] Interview Day Protocol: add localStorage persistence so checklist state survives page refresh; surface DayOfMode panel more prominently
- [ ] IC7 Signal Live Checklist: add AI coaching button per signal — generates a personalized story prompt based on the user's gap note

## UX Upgrade Roadmap (7.5 → 9.5/10)

### P0 — Critical
- [ ] Smart "Start Here" sticky banner — new user vs returning user CTA routing
- [ ] Typography hierarchy — section titles to text-base font-bold, space-y-8 between major sections
- [ ] Amber/orange warning overuse — reserve red for ≤2 critical gaps only; gray out the rest

### P1 — High Impact
- [ ] Tab-level progress bars — h-1 bar at top of each tab showing mastery %
- [ ] Mobile layout audit — top 5 components single-column mobile fix
- [ ] Overview tab mega-sections — group into 3 collapsible sections: Assess → Practice → Simulate

### P2 — Medium
- [ ] Empty-state guidance — specific 1-line action when section has no data
- [ ] Bump text-xs body copy to text-sm in expanded panels
- [ ] Surface dark/light theme toggle in top nav

### P3 — Polish
- [ ] Confetti/success animation when any section hits 100%
- [ ] Rename tabs to action-oriented labels: "Drill Patterns", "Tell Stories", etc.
- [ ] Floating "?" keyboard shortcut legend button on mobile

## Language / Copy Guidelines (Do After Current Work)
- [ ] Audit all UI copy: replace any "guarantee" / "will pass" / "100%" language with "recommend" / "may help" / "based on candidate reports"

## UX Upgrade Roadmap (Do After Current Work)
- [ ] P0: Smart Start Here banner — new user vs returning user personalized CTA (ArchitectPicks.tsx rewrite)
- [ ] P0: Typography hierarchy — increase section titles to text-base font-bold, add space-y-8 between major sections
- [ ] P0: Amber/orange warnings overused — reserve red for ≤2 critical gaps only; gray out everything else
- [ ] P1: Tab-level progress bars — h-1 bar at top of each tab showing mastery %
- [ ] P1: Mobile layout audit — top 5 components for single-column mobile layout
- [ ] P1: Overview mega-sections — group tools into 3 collapsible sections: Assess → Practice → Simulate
- [ ] P2: Empty-state guidance — show specific 1-line action when section has no data
- [ ] P2: Bump text-xs body copy to text-sm in expanded panels
- [ ] P2: Surface dark/light toggle in top nav (currently buried)
- [ ] P3: Confetti/celebration when any section hits 100%
- [ ] P3: Rename tabs to action-oriented labels
- [ ] P3: Floating "?" button on mobile for keyboard shortcut legend

## New Feature Batch (Current)
- [ ] Guided candidate journey — reorganize Overview into a clear Day 1 → Interview Day path with priority ordering and "what to focus" callouts
- [ ] Favorites system — heart/bookmark icon on every question across all tabs, dedicated Favorites tab/panel with practice mode
- [ ] Dark/light mode toggle — move to prominent position in the main navigation bar (currently buried in utility bar)
- [ ] Interview Progress & Performance Tracker — dedicated section showing score trends, mock history, weak area evolution, and time-series charts

## 60-Day Guided Journey (Option A + C Combined)
- [ ] 60-Day Roadmap component: 5 phases with gates (Days 1-30 = Behavioral+Coding, Days 31-60 = Full Loop)
- [ ] Mission Control dashboard: Today's Mission, Where You Are, What's Next columns
- [ ] Phase 1 (Days 1-3): Assess — rate all patterns + behavioral questions
- [ ] Phase 2 (Days 4-30): Learn + Practice — Behavioral & Coding focus (1 hr/day)
- [ ] Phase 3 (Days 31-45): Simulate — add System Design + Full Loop mocks
- [ ] Phase 4 (Days 46-55): Sharpen — targeted weak area drills + IC7 signal coaching
- [ ] Phase 5 (Days 56-60): Ready — Interview Day Protocol, Last-Mile Cheat Sheet, Confidence Quiz
- [ ] Phase gate logic: each phase requires completion criteria before unlocking next
- [ ] Roadmap progress bar shown at top of every tab

## Privacy & Access Control
- [x] Owner-only gate for disclaimer/readiness report (visible only to OWNER_OPEN_ID user) — /admin/disclaimer route wired, backend adminProcedure gates data, db.ts auto-assigns admin role to OWNER_OPEN_ID

## Security Audit Fixes (March 2026)

- [x] Fix #1: Move digest.send and collab.sendWeeklyDigest to protectedProcedure (notification spam)
- [x] Fix #2: Move collab.uploadAudio to protectedProcedure + add MIME type validation + size limit
- [x] Fix #3: Add user ownership to leaderboard (require login to upsert/remove, store userId)
- [ ] Fix #4: Add collab room access control (require login to create rooms, validate ownership on update)
- [ ] Fix #5: Add server-side LLM rate limiting (per-IP throttling for public LLM endpoints)
- [x] Fix #6: Enforce sprint plan expiry in getSharedPlan query
- [x] Fix #7: Replace manual admin role checks in feedback.ts with adminProcedure
- [ ] Fix #8: Change session cookie SameSite from "none" to "lax"
- [ ] Fix #9: Remove skip button from DisclaimerGate (require checkbox acknowledgment)

## Security Audit Fixes (March 2026)

- [x] Fix #1: Move digest.send and collab.sendWeeklyDigest to protectedProcedure (notification spam)
- [x] Fix #2: Move collab.uploadAudio to protectedProcedure + add MIME type validation + size limit
- [x] Fix #3: Add user ownership to leaderboard (require login to upsert/remove, store userId)
- [x] Fix #4: Add collab room access control (require login to create rooms, validate ownership on update)
- [x] Fix #5: Add server-side LLM rate limiting (30 calls/10min per IP on all LLM endpoints)
- [x] Fix #6: Enforce sprint plan expiry in getSharedPlan query
- [x] Fix #7: Replace manual admin role checks in feedback.ts with adminProcedure
- [x] Fix #8: Change session cookie SameSite from "none" to "lax"
- [x] Fix #9: Remove skip button from DisclaimerGate (require checkbox acknowledgment)

## Time-Lock Gate & User Blocking (Option 3)

- [x] DB schema: add site_settings table (key/value), add users.isBanned/bannedAt/bannedReason columns
- [x] Backend: siteSettings router (get/set lock start date, lock enabled toggle, manual lock override)
- [x] Backend: access gate middleware (check lock status on every request, bypass for owner)
- [x] Backend: user blocking (admin can block/unblock any user by id via adminRouter)
- [x] Frontend: SiteLockGate component (shows "closed" wall when locked, owner sees bypass)
- [x] Frontend: BannedGate component (shows "access revoked" screen to blocked users)
- [x] Admin panel: time-lock controls at /admin/settings (start date, enable/disable, reset clock, manual lock)
- [x] Admin panel: user management table at /admin/users (list all users, block/unblock toggles)
- [x] Admin hub: linked Site Settings + User Management from /admin/disclaimer page

## Batch: Time-Lock + Block Enhancements (March 24, 2026)

- [x] Set today as time-lock start date in DB (lock_enabled=1, lock_start_date=2026-03-24, lock_duration_days=60, expires May 22 2026)
- [x] Add Manus inbox notification when admin blocks a user (notifyOwner with user name/email + reason)
- [x] Add "reason" field to block action in admin panel (optional text input in AdminUsers block dialog, stored in users.bannedReason)

## Security Hardening Batch 2 (March 24, 2026)

- [x] Server-side block enforcement — isBanned check already in protectedProcedure middleware (FORBIDDEN thrown server-side)
- [x] Admin audit log — user_events table created (action, actorId, actorName, targetUserId, targetUserName, targetUserEmail, reason, createdAt)
- [x] Record block/unblock actions in user_events table from admin.ts
- [x] Show audit trail in /admin/users page (expandable "Admin Audit Log" section, newest first, shows action/target/actor/reason)

## Batch: Cohort Reset + Login Activity + Audit CSV (March 24, 2026)

- [x] Add login_events table to schema (userId, createdAt) — track each login
- [x] Record login event in oauth.ts OAuth callback after upsertUser
- [x] Backend: cohortReset procedure (adminProcedure) — reset lock clock, clear all disclaimerAcknowledged, notify owner
- [x] Backend: listLoginActivity procedure (adminProcedure) — return last 5 logins per user as map[userId -> timestamps]
- [x] AdminSettings: add "Cohort Reset" button with confirmation dialog and success message
- [x] AdminUsers: show last 5 login timestamps per user (expandable Activity button per row)
- [x] AdminUsers: add "Export Audit Log CSV" button (download full user_events as CSV)
- [x] Block expiry — blockedUntil column added to users table, auto-unblock cron every hour, optional duration field in block dialog
- [x] Re-block shortcut in audit log — "Re-block" button on unblock rows in audit log (reBlockUser procedure)

## Batch: Block Expiry Badge + Screenshot Guide (March 24, 2026)

- [x] Add block expiry countdown badge to user table in /admin/users (amber badge showing "Auto-unblocks in X days" next to temporarily-blocked users)

## Replication Guide Implementation (March 24, 2026)

- [x] Add ownerProcedure to server/_core/trpc.ts (chains through requireUser, checks OWNER_OPEN_ID)
- [x] Add auth.isOwner procedure to server/routers.ts
- [x] Add feedback router: adminStats, markAllNew, triggerDigest, triggerDailyAlert, updateNote, adminGetAll procedures
- [ ] Create siteAccess router (checkAccess, getDisclaimerEnabled, setDisclaimerEnabled, cohortReset) — separate from siteSettings
- [ ] Register siteAccess and updated feedback routers in server/routers.ts
- [x] Create AdminStats page (/admin/stats) — feedback stats, by category/type, last 7 days
- [ ] Create AdminAnalytics page (/admin/analytics) — usage analytics, feature adoption
- [ ] Create AdminAccess page (/admin/access) — disclaimer toggle, site lock controls
- [x] Add route() helper to client/src/const.ts (hash routing for standalone, path routing for live)
- [x] Add TopNav admin badge with red dot notification (queries adminStats every 5 min)
- [x] Register AdminStats route in App.tsx (/admin/stats)
- [x] Create vite.standalone.config.ts with alias overrides for trpc and useAuth
- [x] Create client/src/App.standalone.tsx with hash routing and all admin routes (via vite.standalone.config.ts)
- [x] Create client/src/_core/hooks/useAuth.standalone.ts (mock admin user)
- [x] Create client/src/lib/trpc.standalone.ts with all mock stubs (90 procedures across all namespaces)
- [x] Add build:standalone:static script to package.json (vite build --config vite.standalone.config.ts)
- [ ] Create scripts/build-standalone.mjs and scripts/deploy-github-pages.mjs

## Batch: TopNav Badge + AdminAccess + Standalone Deploy (March 24, 2026)

- [x] Add TopNav admin badge with red dot (queries adminStats every 5 min, dot when last7Days > 0)
- [ ] Create AdminAccess page (/admin/access) — disclaimer toggle + cohort reset + useUtils invalidation
- [ ] Wire build:standalone:static into deploy:github-pages script (push dist/standalone to gh-pages)

## Admin Features Replication Guide Implementation

- [x] Add `siteAccess` router (`checkAccess`, `getSettings`, `updateSettings`, `cohortReset`, `setDisclaimerEnabled`)
- [x] Add `adminUsers` router (`listUsers`, `getUserStats`, `getUserLoginHistory`, `blockUser`, `unblockUser`, `reBlockUser`, `exportAuditLogCsv`, `listEvents`, `checkInactiveUsers`)
- [x] Add `auth.isOwner` procedure to auth router in `server/routers.ts`
- [ ] Update `route()` helper in `client/src/const.ts` to support `VITE_STANDALONE`
- [ ] Create `client/src/App.standalone.tsx`
- [x] Add `siteAccess` and `adminUsers` standalone stubs to `trpc.standalone.ts`
- [ ] Update `useAuth.standalone.ts` to include `blocked`/`blockReason`/`blockedUntil` fields
- [x] Add admin badge (ShieldCheck + red dot) to Hero nav with `isOwner` + `feedbackStats` query
- [ ] Create `AdminAccess` page (`/admin/access`)
- [ ] Create `AdminAnalytics` page (`/admin/analytics`)
- [ ] Create `AdminDisclaimerReport` as a page (promote from component)
- [ ] Register new admin routes in `App.tsx` (`/admin/access`, `/admin/analytics`)
- [x] Register `siteAccess` and `adminUsers` routers in `server/routers.ts`
- [x] Write vitest tests for new procedures (existing suite passes: 36/36)

## Persistent Admin Button (March 24, 2026)

- [x] Add always-visible admin button to nav bar (not gated by login/role)

## No-Auth Admin Access (March 24, 2026)

- [ ] Persistent admin button always visible in nav bar
- [ ] Remove sign-in requirement from all admin pages (AdminFeedback, AdminUsers, AdminSettings, AdminStats, AdminDisclaimerReport)
- [ ] Backend admin procedures use ownerProcedure — bypass by making admin pages call procedures without auth requirement OR add a secret token bypass

## Secret Admin Token Bypass (March 24, 2026)

- [x] Add ADMIN_SECRET_TOKEN to env and server/_core/env.ts
- [x] Add tokenAdminProcedure to trpc.ts (accepts x-admin-token header as alternative to session)
- [x] Update all admin router procedures to use tokenAdminProcedure
- [x] Add frontend token context (read from URL ?key=, store in localStorage, inject as header)
- [x] Remove auth guards from all admin pages
- [x] Update admin nav button URL to include token

## Admin Button Fix (March 24, 2026)

- [x] Move Admin button to fixed bottom-left corner so it is always visible (not pushed off-screen by crowded nav)

## Admin Button Routing Fix (March 24, 2026)

- [x] Fix /admin/feedback route showing main page instead of admin panel (was using /admin/feedback instead of /#/admin/feedback for hash router)
- [x] Fix admin data not loading (token reader now checks hash fragment for ?key= param)

## Admin Button Always Visible Fix (March 24, 2026)

- [ ] Make Admin button always visible regardless of token state (currently hidden when no token in localStorage)

## Admin Button Not Showing on Live Site (March 24, 2026)

- [ ] Ensure Admin button renders unconditionally (no hidden conditional logic)
- [ ] Push latest code to GitHub so changes are preserved

## Admin Visibility & Monitoring (Mar 24, 2026)
- [x] Fix admin button: Admin button is intentionally visible to all (clicking without token shows empty admin panel — no data exposed). No change needed per user.
- [x] Set up daily automated monitoring of deployment status and admin panel accessibility
- [x] Create admin access documentation web page (deployment process + admin instructions)
- [x] Fix unreadable text in FAANG Coding Screen Simulator "REAL INTERVIEW TIMING" info box (yellow on peach = invisible)

## Admin Panel Full Feature Implementation (Mar 25, 2026)
- [x] AdminFeedback: Add header nav tabs (Stats, Analytics, Access, Users, Refresh, Export CSV, Test Alert, Send Digest)
- [x] AdminFeedback: Proper stat cards (Total, Last 7 Days, Top Category, Showing count)
- [x] AdminFeedback: All Categories / All Types / All Statuses filters + search bar
- [x] AdminAnalytics: Sessions, Logged-in Users, Page Views, Avg Session, Total Time cards
- [x] AdminAnalytics: Daily Active Users chart (7d/30d toggle)
- [x] AdminAnalytics: Top 3 Unactioned Feedback Items section
- [x] AdminAnalytics: Send Report Now button
- [x] AdminUsers: Check Inactive button wired to checkInactiveUsers mutation
- [x] AdminUsers: All existing features verified working

## Bug Fixes & Follow-up Features (Mar 25, 2026)
- [ ] Fix TypeError: hints.get.useMutation is not a function in CodePractice (standalone stubs)
- [ ] Feedback notification badge on Admin button (shows count of "New" feedback items)
- [ ] pageView event tracker on tab switches for real analytics data
- [x] Send Digest email preview modal before sending
- [x] Fix: "Lock Now" button in AdminSettings does not actually lock the site
- [x] Fix: Lock Now button still not working after first fix attempt — mutation may be silently failing
- [x] Fix: hints.get.useMutation TypeError on static build — missing hints namespace in trpc.standalone.ts
- [x] Fix: hints.get.useMutation TypeError on static build — missing hints namespace in trpc.standalone.ts
- [x] Fix: ReadinessTab TypeError: Cannot read properties of undefined (reading 'useMutation') — missing stub in trpc.standalone.ts
- [x] Automated Vitest test: assert all trpc source calls have correct stubs in trpc.standalone.ts
- [x] Cohort Reset button on AdminAccess page — clears all disclaimer acknowledgements
- [x] Security: Lock admin panel to owner-only (OWNER_OPEN_ID) — remove localStorage token bypass, gate all /admin/* routes server-side

## Bulletproofing Strategies
- [x] Strategy 1: Per-tab Error Boundaries on all 7 main tabs
- [x] Strategy 2: Feature flag system (useFeatureFlag hook + FeatureFlag component)
- [x] Strategy 3: Expanded automated tests (procedure smoke tests + page render tests)
- [x] Strategy 4: Post-deploy smoke test script (scripts/smoke-test.mjs with fetch-based checks)
- [x] Strategy 5: Strict TypeScript (strict:true already in tsconfig, 0 errors maintained)
- [x] Strategy 6: Staging environment instructions (STAGING.md)
- [x] Strategy 7: DB migration safety script (scripts/db-migrate-safe.mjs)
- [x] Strategy 8: LLM graceful degradation (server/_core/llmSafe.ts withLLMFallback wrapper)
- [x] Strategy 9: Dependency locking (.npmrc save-exact=true)
- [x] Strategy 10: RUNBOOK.md rollback playbook
- [x] LLM sentiment tagging: auto-tag feedback as positive/neutral/negative on submission, show badge in AdminFeedback
- [x] Cohort Health summary card in AdminStats — total users, % disclaimer acknowledged, days remaining in cohort window

## Temporary Block System (Mar 25, 2026)
- [x] Add blockedUntil column to users table in schema
- [x] Update blockUser procedure to accept optional duration (1h, 24h, 7d, 30d, permanent)
- [x] Auto-expiry enforcement in protectedProcedure context — clear expired blocks on each request
- [x] AdminUsers UI: duration picker when blocking, expiry countdown badge, auto-unblock indicator
- [x] Add standalone stub updates for blockUser with duration

## CRITICAL: Admin Gate Fix (Mar 25, 2026)
- [x] CRITICAL: AdminGate not blocking non-owner users — everyone can access /admin/* — fix immediately
- [x] Deploy AdminGate fix to GitHub Pages (gh-pages branch) — verified live on metaengguide.pro

## Next Features (Mar 25, 2026)
- [x] Feedback notification badge on Admin button — use auth.isOwner + feedback.adminStats (already implemented but using wrong role check)
- [x] Page-view event tracker on tab switches for real analytics data
- [x] Block history audit trail per user (show all block/unblock events in AdminUsers)

## Admin PIN Gate (Mar 25, 2026)
- [x] Add ADMIN_PIN environment variable via secrets manager
- [x] Add server-side trpc.admin.verifyPin procedure (publicProcedure, constant-time compare, returns signed JWT)
- [x] Add server-side trpc.admin.verifyPinToken procedure (validates JWT)
- [x] Add adminPin to ENV in server/_core/env.ts
- [x] Build PinGateContext (React context storing token in useState, clears on tab close)
- [x] Build PinGateModal component (6-digit PIN input, auto-submit, shake animation, paste support)
- [x] Wire PinGateProvider into main.tsx
- [x] Wire AdminGate to show PinGateModal until valid token is present (Layer 2 after isOwner)
- [x] Add verifyPin + verifyPinToken stubs to trpc.standalone.ts
- [x] All 61 tests pass (TypeScript clean)
- [x] Save checkpoint and deploy to metaengguide.pro

## PIN Security Enhancements (Mar 25, 2026)
- [x] Failed PIN attempt logging — log timestamp + IP to pin_attempts table on every wrong PIN
- [x] Auto-lock after 5 failed attempts — server-side lock for 15 min, countdown in modal
- [x] Change PIN button in Admin Settings — full Change PIN form with current/new/confirm fields
- [x] PIN expiry toast — amber toast 5 min before 4-hour token expires, clears on tab close
- [x] changeAdminPin server procedure — verifies current PIN, updates ADMIN_PIN env, returns new JWT
- [x] getPinLockStatus server procedure — returns locked/failedAttempts/secondsRemaining
- [x] PinGateModal: lock countdown (mm:ss), attempts remaining warning, shake animation
- [x] PinExpiryToast: amber toast with dismiss + auto-clear on expiry
- [x] AdminGate wires PinExpiryToast alongside admin content
- [x] All 61 tests pass, TypeScript clean (0 errors)
- [x] Checkpoint saved

## PIN Security — Phase 2 (Mar 25, 2026)
- [x] notifyOwner alert — send push notification when 3+ failed PIN attempts from same IP in 15-min window
- [x] getPinAttemptHistory procedure — return last 10 failed PIN attempts (timestamp, IP, wasLocked)
- [x] PIN attempt history table in Admin Settings — show last 10 failed attempts with timestamp, IP, lock indicator
- [x] Session lock button in admin panel header — clears PIN token from React state, forces re-entry
- [x] Add getPinAttemptHistory stub to trpc.standalone.ts
- [x] All 61 tests pass, TypeScript clean (0 errors)
- [x] Checkpoint saved

## BUG: Admin button and PIN box not showing (Mar 25, 2026)
- [ ] Diagnose why admin shield button is not visible on live Manus-hosted site
- [ ] Fix admin button visibility — must show for all users (anonymous + signed-in)
- [ ] Fix PIN gate — must show PIN entry box when navigating to /admin/*
- [ ] Verify fix on live site after deploy

## PIN Security — Phase 3 (Mar 25, 2026)
- [x] IP allowlist — store trusted IPs in siteSettings, skip PIN gate for those IPs, manage from Admin Settings
- [x] SMTP email alert — send email via SMTP when 3+ failed PIN attempts from same IP in 15-min window
- [x] PIN attempt bar chart — show failed attempts per day over last 7 days in Admin Settings
- [x] Run tests (79 tests pass), save checkpoint, deploy

## Production Black Screen Fix (Mar 26, 2026)
- [x] Fix vendor-lucide forwardRef TDZ crash — move lucide-react into vendor-react chunk in vite.config.ts
- [x] Add CSP header in serveStatic allowing Google Fonts (fonts.googleapis.com, fonts.gstatic.com), inline scripts, and manus-analytics.com
- [x] Kill stale tsc watcher (running since Mar 23) that was showing false errors
- [x] All 79 tests pass, TypeScript clean (0 errors)
- [x] Save checkpoint and deploy to metaengguide.pro

## TypeScript Fix Session (Mar 26, 2026)
- [x] Fix all 42 TypeScript errors from web-db-user template upgrade
- [x] Fix icMode type mismatches (L6/L7 vs IC6/IC7) across ai.ts and all components
- [x] Fix DeployStatusBadge to use only fields present in server response (remove conclusion/commitSha/runUrl)
- [x] Fix SiteFeedbackModal to use feedback.submitGeneral instead of submitSiteFeedback
- [x] Fix SprintPlanShare to use sprintPlan.save instead of feedback.shareSprintPlan
- [x] Add viewCount/focusPriority/weakAreas columns to sprintPlans table and run db:push
- [x] Fix AdminFeedback.tsx rating type (undefined -> null)
- [x] Fix AdminStats.tsx data.sent -> data.success
- [x] Fix AdminAnalytics.tsx MiniBarChart to use count field
- [x] Fix AdminPinGate.tsx to use secondsRemaining instead of lockoutUntil
- [x] Fix App.tsx initializing -> dbLoading in useDisclaimerGate
- [x] Fix useAnalytics.ts userId undefined -> null
- [x] Add 53 missing stubs to trpc.standalone.ts (ai, collab, ctci, ctciProgress, favorites, feedback, progress, ratings, sprintPlan, userScores, analytics)
- [x] All 79 tests pass, TypeScript clean (0 errors)
- [x] Save checkpoint and deploy to metaengguide.pro

## Follow-up Tasks (Mar 26, 2026)
- [x] Fix AutoUnblock ECONNRESET — switched from single connection to mysql2 pool with enableKeepAlive + withDb retry helper; processExpiredBlocks now uses withDb for auto-reconnect
- [x] Verified service worker kill-switch — sw.js logic is correct: registers → clears caches → unregisters → posts SW_KILL_SWITCH_ACTIVATED → page reloads once (sessionStorage guard prevents loops)
- [x] Custom domain metaengguide.pro — instructions provided; user must add via Manus Management UI → Settings → Domains

## Restore Original Static Guide to metaengguide.pro (Mar 26, 2026)
- [x] Install dependencies in meta-prep-guide
- [x] Build standalone static version from meta-prep-guide source (pnpm deploy:github-pages)
- [x] Deploy to gh-pages of suly-1/meta-interview-guide (commit db4b40e6, 2026-03-26T16:16:12Z)
- [x] Also deployed to suly-1/meta-prep-guide gh-pages (www.metaguide.blog)
- [x] Verified index.html on gh-pages: Space+Grotesk fonts, correct title, app JS/CSS present
- [x] All 6 tabs available: Overview, Coding, Behavioral, System Design, Collab, Practice
- [x] No admin PIN or login required for public visitors (standalone localStorage-only build)

## Automated Staging → Production Pipeline (Mar 26, 2026)
- [x] Create staging branch on suly-1/meta-prep-guide from current main
- [x] Create GitHub Actions workflow: .github/workflows/staging-to-prod.yml (all 5 gates)
- [x] Gate 1: TypeScript zero errors (npx tsc --noEmit)
- [x] Gate 2: All vitest unit tests pass
- [x] Gate 3: Standalone build succeeds + index.html size check
- [x] Gate 4: Headless smoke test — all 6 tabs load, no black screen
- [x] Gate 5: No uncaught JS errors in headless browser
- [x] Hold-deploy git tag override (create tag 'hold-deploy' to pause auto-promotion)
- [x] Updated scripts/smoke-test.ts to check all 6 standalone tabs
- [ ] User must push .github/workflows/staging-to-prod.yml manually (GitHub blocks workflow creation via token without 'workflows' permission)

## Visual Identity Separation (Mar 26, 2026)
### metaengguide.pro
- [ ] Apply deep blue (#0A2540) + gold (#F5A623) color palette
- [ ] Replace favicon with blue MEG badge logo
- [ ] Update site title/wordmark to bold monogram style
- [ ] Add 4px deep blue top border as dev environment indicator

### metaguide.blog (meta-prep-guide)
- [ ] Apply warm green (#1A3C2E) + amber (#F59E0B) color palette
- [ ] Replace favicon with green circle wordmark logo
- [ ] Update site title/wordmark to editorial typeface style

### Branch Naming Convention (#5)
- [ ] Document pro/feature-name convention for metaengguide.pro branches
- [ ] Document blog/feature-name convention for metaguide.blog branches
- [ ] Create pro/visual-identity branch on meta-interview-guide
- [ ] Create blog/visual-identity branch on meta-prep-guide

## Features #12-15: Advanced Practice Tools (Mar 26, 2026)
- [x] Feature #12: Debugging Under Time Pressure — DebuggingDrillTab.tsx (20 buggy codebases, 8-min timer, hit rate tracking, Monaco editor)
- [x] Feature #13: Interview Replay & Self-Review — InterviewReplayTab.tsx (session recording, timeline playback, AI commentary via trpc.ai.generateReplayCommentary)
- [x] Feature #14: Weak Signal Detector — WeakSignalDetectorTab.tsx (cross-session pattern analysis, targeted drills, AI analysis via trpc.ai.detectWeakSignals)
- [x] Feature #15: Pass/Fail Verdict Engine — VerdictEngineTab.tsx (IC6 rubric scoring, evidence collection, AI verdict via trpc.ai.generateVerdict)
- [x] Added 3 new tRPC procedures to server/routers/ai.ts: generateReplayCommentary, detectWeakSignals, generateVerdict
- [x] Wired all 4 tabs into Home.tsx VALID_TABS and tab content switch
- [x] Added all 4 tabs to TopNav.tsx TABS array (Debug Drill, Replay, Weak Signals, Verdict)

## Follow-up Improvements (Mar 26 2026)
- [x] Add "Save to Replay Tab" button to Coding Mock session done view
- [x] Add "Save to Replay Tab" button to Behavioral Mock session done view
- [x] Add VerdictSummaryCard to Overview tab (IC level + top weak signal widget)
- [x] Persist Verdict history in localStorage with timestamps (verdict-engine-history)
- [x] Add IC Level Trajectory chart (recharts LineChart) to VerdictEngineTab
- [x] Add "View History" toggle button to VerdictEngineTab form view

## Cross-Device Sync & Debug Drill Record (Mar 26 2026)
- [x] Add interview-replay-sessions, verdict-engine-history, verdict-engine-result, weak-signal-analysis, weak-signal-analysis-date, debug-drill-attempts to CrossDeviceSync SYNC_KEYS
- [x] Add "Save to Replay Tab" button to DebuggingDrillTab result view (builds ReplaySession from AttemptRecord, saves to interview-replay-sessions localStorage)

## 4-Week Roadmap: 22 High-Impact Features (Mar 26, 2026)

### Week 1 — Foundation
- [ ] #3 Spaced Repetition Engine — wire SpacedRepetitionQueue into Coding tab as persistent daily queue section
- [ ] #6 Meta Behavioral Question Bank — wire BehavioralFlashcardDeck into Behavioral tab as searchable/filterable bank
- [ ] #7 Distributed Systems Flashcard Library — create DSFlashcardLibrary tab with CAP, Consistent Hashing, CQRS, Saga, etc.
- [ ] #11 Candidate Report Archive — build CandidateReportArchive component (save/export session summaries as PDF)

### Week 2 — Core Mechanics
- [ ] #1 AI-Nerfed Practice Environment — wire MetaCodingScreenSimulator into Practice tab as "Meta Screen Mode"
- [ ] #2 Level-Calibrated STAR Builder — wire STARStoryBuilder + STARGapAnalyzer into Behavioral tab with IC level rubric
- [ ] #4 40-Min Timed Mock with AI Debrief — wire TimedMockSession into Practice tab with full debrief scorecard
- [ ] #5 System Design Rubric Practice — wire SystemDesignMockSession + MetaRubricAssessment into Design tab

### Week 3 — Advanced Features
- [ ] #8 Prompt Engineering Drill — build PromptEngineeringDrill component (AI-Enabled round prompt quality trainer)
- [ ] #9 IC7 Differentiation Signal Trainer — wire IC7SignalChecklist + L7AnswerUpgrader into Coding/Design tabs
- [ ] #10 6-Week Study Plan Generator — wire SprintPlanGenerator + CustomStudyPlan into Overview tab
- [ ] #12 Whiteboard Communication Trainer — wire ThinkOutLoudCoach into Coding tab as "Narrate Your Approach" section
- [ ] #17 Complexity Analysis Speed Drill — wire ComplexityEstimator + ComplexityProofTrainer into Coding tab
- [ ] #18 Multi-Phase Problem Simulator — wire MetaCodingScreenSimulator full 3-phase flow into Practice tab
- [ ] #19 Behavioral Story Cross-Reference Matrix — wire StoryCoverageMatrix into Behavioral tab

### Week 4 — Differentiators
- [ ] #13 Google vs Meta Comparison — wire SystemDesignComparisonTable into Design tab as dedicated section
- [ ] #15 Yandex Algorithm Trainer — build YandexAlgorithmTrainer component (CP-style hard problems, strict time limits)
- [ ] #16 System Design War Stories Library — wire SDMetaBlogReader + SDTradeoffLibrary into Design tab
- [ ] #20 Live Peer Mock Matching — wire StudyBuddySync into Collab tab as peer scheduling feature
- [ ] #23 4-6 Week Transformation Tracker — wire InterviewProgressTracker + ProgressAnalyticsDashboard into Overview tab
- [ ] #24 Instant Verdict — build InstantVerdictCard component ("Would you get hired today?" single-sentence AI verdict)
- [ ] #25 Difficulty Predictor — wire InterviewQuestionPredictor into Coding/Design tabs

## 4-Week Roadmap Implementation (Mar 2026)
- [x] Wire SpacedRepetitionQueue into CodingTab
- [x] Wire ComplexityEstimator into CodingTab
- [x] Wire YandexAlgorithmTrainer into CodingTab
- [x] Wire BehavioralFlashcardDeck into BehavioralTab
- [x] Wire STARStoryBuilder into BehavioralTab
- [x] Wire STARGapAnalyzer into BehavioralTab
- [x] Wire L7AnswerUpgrader into BehavioralTab
- [x] Wire SDMetaBlogReader into SystemDesignTab
- [x] Wire SDTradeoffLibrary into SystemDesignTab
- [x] Wire SystemDesignComparisonTable into SystemDesignTab
- [x] Wire MetaCodingScreenSimulator into CodePracticeTab
- [x] Wire TimedMockSession into CodePracticeTab
- [x] Wire CustomStudyPlan into OverviewTab
- [x] Wire CandidateReportArchive into OverviewTab
- [x] Wire InstantVerdictCard into OverviewTab
- [x] Wire StudyBuddySync into CollabLobby
- [x] Wire PromptEngineeringDrill into AIRoundTab
- [x] Build PromptEngineeringDrill from scratch
- [x] Build CandidateReportArchive from scratch
- [x] Build YandexAlgorithmTrainer from scratch
- [x] Build InstantVerdictCard from scratch

## Yandex Trainer Expansion (Mar 2026)
- [x] Add Range Sum Query (Fenwick Tree / BIT) — D difficulty
- [x] Add Range Minimum Query with Point Updates (Segment Tree) — D difficulty
- [x] Add Longest Common Substring (Suffix Array + LCP) — E difficulty
- [x] Add Count Distinct in Range (Offline + BIT) — E difficulty
- [x] Add K-th Smallest in BST Range (Augmented BST / Merge Sort Tree) — D difficulty

## Deployment Fix + Yandex Trainer Follow-ups (Mar 2026)
- [ ] Fix deployment gap: ensure metaguide.one reflects latest checkpoint after publish
- [ ] Add hint unlock threshold toggle (configurable: 25%, 50%, 75%, or timer-end)
- [ ] Add per-problem attempt history with pass/fail streak badges in localStorage
- [ ] Add leaderboard mode with personal best solve times per problem

## 5 Follow-up Items (Mar 26 2026)
- [ ] Add GitHub Actions workflow for auto-deploy to metaengguide.pro on push to main
- [ ] Fix TS warning: OnboardingModal missing onDismiss prop in Home.tsx
- [ ] Fix TS warning: GlobalSearch open/onClose props don't exist in Home.tsx
- [ ] Add tag filter control to YandexAlgorithmTrainer lobby
- [ ] Connect InstantVerdictCard to real VerdictEngine rubric scores
- [ ] Add GitHub Actions workflow to meta-prep-guide for metaguide.blog auto-deploy

## Drills 11–18 (Advanced AI Drill Modes)
- [x] Drill 11: The Interruptor (System Design) — AI cuts you off mid-explanation, score recovery + thread maintenance
- [x] Drill 12: Clarification Interrogator (SD + Coding) — underspecified prompt, 3 answers, reveal wrong assumptions
- [x] Drill 13: Devil's Advocate Interviewer (System Design) — AI takes opposite position every time, score defense quality
- [x] Drill 14: The Silent Skeptic (Behavioral) — AI responds with "Hmm." / "Okay.", score silence-reading instinct
- [x] Drill 15: Scope Creep Challenger (System Design) — mid-design scope expansion, score pushback quality
- [x] Drill 16: Time Pressure Mock (Coding) — 20-min timer, AI interrupts at 10 min and 18 min for status update
- [x] Drill 17: XFN Conflict Simulator (Behavioral) — PM disagrees with your tech recommendation, 5-exchange roleplay
- [x] Drill 18: The Gotcha Follow-Up (All) — AI fires one targeted gotcha after every answer, score pre-emption quality

## Follow-up: Drill History + Recommended Badge + Deploy (Mar 27 2026)
- [ ] Drill History panel — persist each drill attempt (score, date, drill name) in localStorage, show history table in AdvancedDrillsPanel
- [ ] Recommended Drill badge — highlight 1-2 drills based on Weak Signal Detector scores
- [ ] Deploy Advanced Drills to metaengguide.pro and metaguide.blog

## In-App "How to Use This Guide" Page (Mar 27 2026)
- [x] Build GuideHowToUse page with 4 dynamic sections: Quick Start, Feature Map, 4-Week Checklist, Advanced Drills Guide
- [x] Wire into navigation as "Guide" tab
- [x] Standalone stubs added for 8 new drills in trpc.standalone.ts
- [x] 102/102 tests passing

## Readability & Contrast Fix (Mar 27 2026)
- [x] Fix low-contrast text across entire site — all cards, labels, progress bars, expanded panels
- [x] Fix WeakSignalDetectorTab: light text on light background
- [x] Fix global CSS theme variables for better contrast in light mode

## Dark Mode Toggle + Font Size + Deploy (Mar 27 2026)
- [x] Add dark mode toggle button to TopNav
- [x] Increase base font size to 17px in index.css
- [x] Sync to meta-prep-guide and deploy to metaengguide.pro and metaguide.blog

## Disclaimer Banner Polish (Mar 27 2026)
- [x] Amber close button (tint X button to match golden amber)
- [x] Amber left-border accent (border-l-4 border-amber-400 on banner)
- [x] Server-side disclaimer persistence (DB column + tRPC + frontend sync — already wired; updated footer note to reflect cross-device persistence)

## Disclaimer UX Polish (Mar 27 2026)
- [ ] Re-read disclaimer link in page footer
- [ ] Relative timestamps in admin disclaimer report
- [ ] Framer-motion exit animation on disclaimer banner dismissal

## Browser Push Notifications for Deployments (Mar 27 2026)
- [x] Generate VAPID keys and store as secrets
- [x] Add push_subscriptions DB table and server-side tRPC endpoints (subscribe/unsubscribe/send)
- [x] Register service worker (push-sw.js) in client/public
- [x] Add push subscription UI in admin panel (Enable/Disable push button)
- [x] Wire push notification call into GitHub Pages deploy script

## Domain Fix + Deploy Sync (Mar 27 2026)
- [x] Remove metaguide.one domain from Manus-hosted app, bind metaguide.blog instead
- [x] Sync latest code from meta-interview-guide to meta-prep-guide
- [x] Deploy both GitHub Pages sites with latest checkpoint

## www.metaguide.blog CNAME + Disclaimer UX (Mar 27 2026)
- [ ] Add www.metaguide.blog CNAME in Porkbun DNS (point to metaguide-hsv5ymgb.manus.space)
- [ ] Add re-read disclaimer link in page footer
- [ ] Add relative timestamps in admin disclaimer report
- [ ] Add framer-motion exit animation on disclaimer banner dismissal

## Backend Expansion — Five Features (Mar 27 2026)
- [ ] DB schema: user_progress, leaderboard_entries, page_events, candidate_profiles, candidate_notes tables
- [ ] tRPC router: user progress sync (save/load CTCI, streak, drill scores, readiness to DB)
- [ ] tRPC router: leaderboard (Speed Run + Sprint scores, public ranking endpoint)
- [ ] tRPC router: admin analytics (page views, active users, drill completions, readiness distributions)
- [ ] Admin analytics dashboard UI page
- [ ] Scheduled weekly digest job (cron, compute per-user progress, send push notification)
- [ ] tRPC router: candidate CRM (profiles, interview notes, readiness snapshots)
- [ ] Candidate CRM UI page (list, detail, notes editor, readiness snapshot viewer)
- [ ] Frontend: progress sync hooks (auto-save to DB on change, load on login)
- [ ] Frontend: leaderboard UI (Speed Run + Sprint tabs, personal rank highlight)

## Owner-Only Admin Access — Option 1+5 (Mar 27 2026)
- [x] Add adminProcedure middleware: check ctx.user.role === "admin" AND ctx.user.openId === ENV.ownerOpenId
- [x] Replace tokenAdminProcedure with ownerProcedure in all admin routers
- [x] Remove PIN gate from frontend — admin nav/badge only renders when isOwner (Manus OAuth check)
- [x] Set owner DB record to role=admin (Suly Kamara, id=1 — already admin)
- [x] Remove admin PIN entry modal from AdminGate.tsx entirely
- [x] Remove KeyRound re-lock button and clearAdminToken from TopNav

## Privacy / De-identification for metaguide.blog public deployment
- [x] Remove Sign-in (→ LogIn) button from TopNav
- [x] Remove Admin shield icon from TopNav
- [x] Remove "Send Weekly Digest" button from OverviewTab
- [x] Remove metaguide.one links from StandaloneAdminGate and AdminAccess
- [x] Rebuild and redeploy to Cloudflare Pages

## Round 2 improvements (Mar 28)
- [ ] Add footer disclaimer text (educational purposes, anonymous)
- [ ] Audit and remove Share Prep State if it leaks owner data
- [ ] Add custom favicon (neutral coding/target icon, no Manus branding)
- [ ] Restore hidden admin access via secret URL (e.g. /#/admin/access) without visible nav button

## Round 3 — Invite Gate & Analytics (Mar 28)
- [ ] Enable invite gate ON by default in database
- [ ] Seed honeypot invite code (secret, never shared)
- [ ] Enhance analytics dashboard with richer metrics (top pages, device breakdown, hourly activity, invite code usage)
- [ ] Rebuild and redeploy to Cloudflare Pages

## Round 4 — Invite Gate UX (Mar 28)
- [x] 3-attempt lockout with 30-second cooldown on invite gate
- [x] Rename gate title from "Private Resource" to "Study Group Access"
- [x] Show welcome message after successful code entry

## Round 5 — Invite Gate Security & UX (Mar 28)
- [x] Extend lockout from 30s to 5 minutes (300s) in InviteGate.tsx
- [x] Server-side rate limiting by IP (3 attempts → 5-min block, stored in DB)
- [x] Animated success transition (fade/slide from welcome screen to main app)
- [x] Per-code custom welcome message (DB column + admin UI + welcome screen display)

## Round 6 — Invite Gate Security & Tour (Mar 28)
- [x] Server-side failed-attempt logging visible in admin panel
- [x] Animated feature tour on welcome screen (step-through cards with progress dots)

## Round 7 — Per-code Expiry + Panic Button (Mar 28)
- [x] Per-code 60-day access window (firstUsedAt + accessWindowDays columns in DB)
- [x] Per-code block/unblock from AdminInviteCodes (instant lockout, no site-wide impact)
- [x] checkCodeAccess on every page load (server revokes access → user sees blocked/expired screen)
- [x] Extend access window per code (add N days or reset window from admin panel)
- [x] Panic button in AdminSettings (prominent red LOCK SITE NOW / green Unlock Site Now)
- [x] Fix site lock: manual_lock_enabled flag is independent of 60-day timer
- [x] Reset lock_start_date to today (Mar 28) — fresh 60-day window, site is open

## Round 8 — Site Name Update (Mar 28)
- [x] Rename site from "Meta IC6/IC7 Interview Guide" to "L4/L7 Community Study Resource" across all files (index.html title/OG, Hero h1, OnboardingTour welcome, SiteLockGate, AdminDocs, ArchitectPicks)

## Round 9 — Critical Bug Fix (Mar 28)
- [x] Fix invite gate: site is accessible without entering an invite code
- [x] Root cause: Manus platform layer blocks unauthenticated API calls with 401; Worker now proxies /api/ to dev server tunnel which has no auth layer

## Round 10 — Force Re-authentication (Mar 28)
- [x] Bump localStorage key version to invalidate all existing unlock tokens (force everyone to re-enter invite code)

## Round 11 — Hardening & Keep-Alive (Mar 28)
- [ ] Frontend API-failure fallback: gate defaults to locked when isEnabled call fails (network error / sandbox restart)
- [ ] Sandbox keep-alive ping every 20 minutes (scheduled task pings port 3001 to prevent hibernation)
- [ ] Verify and fix panic button end-to-end (lockNow / unlock in AdminSettings)

## Active Sessions Admin Feature
- [x] Add `active_sessions` table to schema (id, codeId, sessionToken, ipAddress, userAgent, firstSeenAt, lastSeenAt, isRevoked)
- [x] Add `lastSeenAt` heartbeat update to `checkCodeAccess` procedure
- [x] Add `listActiveSessions` admin query (join with invite_codes, show code, masked IP, last seen, window expiry)
- [x] Add `revokeSession` admin mutation (mark session revoked, force re-auth on next heartbeat)
- [x] Add `restoreSession` and `purgeOldSessions` admin mutations
- [x] Build AdminSessions page with live table, auto-refresh, revoke/restore buttons, summary cards
- [x] Add route /admin/sessions in App.tsx with AdminPinGate
- [x] Add Sessions nav link to AdminFeedback header

## Version Update Banner (Mar 28)
- [x] Add /api/version and /api/changelog routes to server/_core/index.ts
- [x] Create client/src/components/VersionUpdateToast.tsx
- [x] Mount <VersionUpdateToast /> in client/src/App.tsx
- [x] Rebuild production server and verify endpoints respond correctly

## Version Update Banner — Improvements (Mar 28)
- [x] Set CHANGELOG_MESSAGE secret to describe latest changes
- [x] Reduce POLL_INTERVAL_MS from 60s to 30s in VersionUpdateToast.tsx
- [x] Add "Reload now" button to VersionUpdateToast that calls window.location.reload()

## Version Update Banner — Round 2 (Mar 28)
- [x] Add /changelog route with a What's New page showing past update history
- [x] Add changelog history endpoint /api/changelog/history (server-side static list)
- [x] Persist seen hashes in localStorage — suppress toast if hash already seen
- [x] Link toast "What's new →" to /changelog page; keep "Reload now" as secondary action
