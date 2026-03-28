# Meta Prep Guide — TODO

## Completed

- [x] Basic prep guide HTML with all tabs
- [x] Dark mode toggle
- [x] Anki/Quizlet CSV export
- [x] Interview day countdown widget
- [x] Progress sharing card
- [x] Full mock history log
- [x] Recruiter-ready summary card
- [x] Daily notification reminder
- [x] Streak tracker
- [x] Weak patterns drill mode
- [x] Peer comparison stats on recruiter card
- [x] React web app with all features
- [x] Upgrade to full-stack (web-db-user)
- [x] Install socket.io and set up WebSocket server
- [x] DB schema: rooms, session_events, scorecards, leaderboard_entries tables
- [x] AI Interviewer Mode (LLM follow-up questions + structured feedback)
- [x] Session Replay engine (event recorder + timeline scrubber)
- [x] Interviewer Scorecard (rubric sliders + AI coaching note + report)
- [x] CollabRoom page with shared whiteboard + live chat + all three features
- [x] TopNav collab tab wired up
- [x] Vitest tests for collab procedures (6 tests passing)
- [x] Replace 8-week timeline with strict 4-week plan
- [x] Add 2-week fast-track plan with toggle between Standard / Fast-Track views
- [x] Voice-to-STAR transcription procedure (Whisper API + LLM structuring)
- [x] Answer Quality Scorer procedure (LLM scoring on Specificity, Impact, L-level)
- [x] Weekly Progress Email Digest procedure (owner notification)

## Pending — Coding Practice Features

- [x] AI-Enabled Round guide (Coditioning article content integrated into Coding tab)
- [x] CTCI 500 Question Tracker (Dinesh Varyani spreadsheet — first 50 shown with search/filter)
- [x] Load all 500 CTCI problems with pagination
- [x] Add Meta Frequency tags to CTCI problems
- [x] Voice-to-STAR recorder UI in BehavioralTab

## Disclaimer Gate

- [x] Full-screen disclaimer gate component (React web app)
- [x] Full-screen disclaimer gate injected into standalone HTML file
- [x] Update disclaimer text to new legal-grade version (both web app + standalone HTML)

## New Features — Round 3

- [x] Pattern Dependency Graph (d3-force, Coding tab, mastered nodes glow green)
- [x] 60-day Heatmap Calendar (Overview tab, daily activity grid)
- [x] Anonymous Leaderboard (server-side DB, opt-in, hero section)

## New Features — Round 4

- [x] ML System Design guide section in System Design tab (from systemdesignhandbook.com)

## New Features — Round 5

- [x] Achievement Badges UI (hero section, unlock on milestones)
- [x] Time-Boxed Pattern Sprint Mode (5 random unmastered patterns, 2 min each)
- [x] Offline PWA support (service worker + manifest.json)

- [ ] Monaco in-browser code editor with test cases for 20 patterns
- [ ] Time-Boxed Pattern Sprint Mode (5 patterns, 2 min each)
- [ ] Pattern Dependency Graph (d3-force interactive graph)

## Pending — Behavioral & STAR Features

- [ ] Voice-to-STAR UI (microphone recording + STAR display in BehavioralTab)
- [ ] Answer Quality Scorer UI (text input + score display in BehavioralTab)
- [ ] Behavioral Question Randomizer (Surprise Me button + hidden focus area)

## Pending — Progress & Analytics Features

- [ ] Heatmap Calendar (GitHub-style 90-day activity grid)
- [ ] Readiness Trend Chart (Recharts line chart with localStorage history)
- [ ] Weekly Progress Email Digest UI (trigger button in OverviewTab)

## Pending — UX & Accessibility Features

- [ ] Focus Mode (F key — hides nav/hero/footer, shows only drill + large timer)
- [ ] Keyboard Navigation overlay (J/K move, Enter expand, R reveal, 1-5 rate, ? overlay)
- [ ] Offline PWA (service worker + manifest.json for offline use)

## Pending — Social & Gamification Features

- [x] Anonymous Leaderboard (opt-in, server-side, top streaks/patterns/mocks)
- [ ] Achievement Badges (First Blood, On Fire, Half-Way There, Mock Veteran, L7 Ready)

## New Features — Round 6

- [x] Behavioral Question Randomizer ("Surprise Me" button, random unrated question, 3-min STAR timer)
- [x] Readiness Trend Chart (14-day line chart in Overview tab, localStorage)
- [x] Focus Mode (F-key toggle, hides nav/hero/footer, shows only active tab + large timer)

## New Features — Round 7

- [x] Interview Day Countdown Widget in top nav (days remaining, links to checklist in Overview tab)

## New Features — Round 8

- [x] Per-Pattern Time Tracker (log drill minutes per pattern, show time-invested bar on pattern cards)
- [x] Spaced Repetition Alerts (due-for-review badge on Coding and Behavioral tab buttons)
- [x] STAR Story PDF Exporter (Export Cheat Sheet button in STAR Story Bank)

## New Features — Round 9

- [x] CTCI Daily Challenge (Problem of the Day auto-highlight, unsolved High-freq)
- [x] Keyboard Navigation Overlay (? key help modal with all shortcuts)
- [x] Monaco In-Browser Code Editor on CTCI problem rows
- [x] Pattern Mastery Heatmap in Coding tab (enhanced: mastery ring, time-invested overlay, category breakdown, tooltips)

## New Features — Round 10

- [x] Weekly Progress Email Digest UI (Send Weekly Digest button in Overview tab)
- [x] CTCI Streak Tracker (consecutive daily challenge completions, flame counter in CTCI banner)
- [x] AI Hint System (Get Hint button in inline code editor, LLM-powered, no spoilers)

## New Features — Round 11

- [x] CTCI Problem Notes (persistent notes panel per problem, Markdown cheat sheet export)
- [x] Behavioral Answer Scorer UI (STAR answer text area + LLM rubric: Specificity, Impact, L-level)
- [x] Readiness Goal Setter (target % + date, daily task card with patterns/stories needed per day)

## New Features — Round 12

- [x] Move CTCI section to top of Coding tab (no content/style changes)
- [x] Mock Interview Simulator (45-min session, 1 coding + 2 behavioral, LLM debrief)
- [x] Pattern Dependency Unlock Flow (grey out advanced patterns until prerequisites rated ≥3)

## New Features — Round 13

- [x] Per-pattern "Stuck?" 3-step hint ladder (gentle → medium → full walkthrough, LLM-powered)

## New Features — Round 14

- [x] Mock Interview History (localStorage persistence + Past Sessions accordion in simulator)
- [x] Prerequisite Unlock Celebration (confetti burst + toast when pattern unlocked)
- [x] Hint Usage Analytics (track hint counts per pattern, Most-hinted badge in Overview)

## New Features — Round 15

- [x] Integrate Meta System Design Interview Prep 2026 guide into System Design tab (highlighted, emoji-rich, fun + challenging)
- [x] CTCI Problem Difficulty Estimator (self-assessment vs official, divergence analytics)
- [x] AI Study Session Planner (30/60/90-min plans, LLM-powered, SR + hint + goal data)

## New Features — Round 16

- [x] CTCI Divergence Report (Perception vs Reality card in Overview tab, top 5 blind spots)
- [x] Behavioral Story Strength Tracker (persist rating history per story, sparkline trend lines)
- [x] System Design Flash Cards (flip-card drill mode in System Design tab, 15 cards, Got it/Review Again)

## New Features — Round 17

- [x] Add Technical Retrospective + XFN Partnership interview guides to Behavioral tab (highlighted, emoji-rich, do/don't sections, animated gradient border)

## New Features — Round 18

- [x] XFN Practice Questions — 6 XFN questions added to behavioral bank with "XFN Partnership" area tag (teal badge)
- [x] Technical Retrospective Project Planner — mini-form (project name, scope, trade-offs, biggest bug, outcome, lessons) + Excalidraw JSON export
- [x] Flash Card Spaced Repetition — "Review Again" schedules SM-2 SR review, "Got it" removes from queue, System Design tab badge shows due count in TopNav

## New Features — Round 19

- [x] Fix broken 8080 sandbox link in SystemDesignTab "Open full guide" button — replaced with permanent CDN URL
- [x] XFN Story Builder — 3 STAR templates, saves to localStorage, auto-populates Tech Retro Planner scope & outcome
- [x] Flash Card Custom Deck — add/edit/delete user Q&A cards, merged into drill mode & SR system
- [x] Tech Retro AI Coach — 🤖 AI Coach button on each saved project, calls LLM to generate 3 probing follow-up questions

## New Features — Round 20

- [x] XFN Question Randomizer — "Surprise Me (XFN)" button picks a random XFN question and starts a 3-min timer (Practice Mode style), teal timer ring
- [x] AI Coach Answer Evaluator — answer textarea + 📊 Score My Answer button per question, shows Specificity/Impact bars, L-level badge, coaching note, strengths, improvements

## New Features — Round 21

- [x] Move Technical Retrospective Project Planner (AI Studio Planner) to the top of the Behavioral tab
- [x] AI Coach Answer Evaluator — completed as part of Round 20

## New Features — Round 22

- [x] XFN Mock Session — 3 XFN questions × 12-min timers + AI scorecard at end (implemented in Round 24 as BehavioralMockSession)
- [x] AI Coach History — persist AI Coach questions + scored answers to localStorage per project (implemented in Round 20)
- [x] Planner PDF Export — PDF export via jsPDF added to ProgressExport in Round 26

## New Features — Round 23

- [x] System Design Mock Session — full 5-phase mock round (~38 min) in System Design tab, random question from all 12 SYSTEM_DESIGN_QUESTIONS, per-phase timers (violet ring → amber → red), answer capture, phase hints, AI scorecard (Overall/Requirements/Architecture/Scalability/Communication, L-level, strengths, improvements, follow-up questions)

## New Features — Round 24

- [x] Mock Session History — persist completed System Design mock sessions to localStorage, review past attempts with scores and answers, delete entries
- [x] Custom Question Picker — choose specific question or filter by L-level (L6+/L7+) before starting mock, 🎲 Random button
- [x] Behavioral Mock Session (XFN) — 3 XFN questions × 12-min timers, STAR phase tabs, teal timer ring, AI scorecard (Collaboration/Conflict/Alignment/Communication, L-level, strengths, improvements, follow-up questions), history with expand/delete

## New Features — Round 25

- [x] Combined Readiness Dashboard — Overview tab aggregates System Design + XFN mock scores into IC readiness gauge with per-dimension breakdown
- [x] Mock Session Comparison — side-by-side diff view in both System Design and XFN History panels, color-coded deltas per dimension
- [x] Coding Mock Session — 5-phase 45-min round (Problem Understanding → Approach → Pseudocode → Complexity → Edge Cases), pattern picker with difficulty filter + random, AI scorecard (Correctness/Complexity/Code Quality/Communication, L-level, optimal hint, follow-ups), history with compare mode

## New Features — Round 26 (previously planned)

- [x] Full Mock Day Simulator — chained Coding + System Design + XFN Behavioral with combined AI scorecard, in Overview tab
- [x] Coding Mock Live Code Editor — Monaco editor in pseudocode phase (language selector: Python/JS/Java/C++)
- [x] Readiness Export PDF — jsPDF one-page PDF from ProgressExport, alongside existing TXT export

## New Features — Round 27 (Coding Tab)

- [x] Pattern Cheat Sheet Overlay — slide-in panel per pattern with canonical template code + 1-click copy
- [x] CTCI Problem Tagging — custom tags per problem with tag filter in search bar
- [x] Complexity Quick-Reference Card — pinned Big-O card for all data structures at top of Coding tab
- [x] Pattern Video Links — curated YouTube link per pattern on the pattern card
- [x] Coding Mock Replay — read-only replay of all 5 phase answers with AI scorecard annotations (via History expand)

## New Features — Round 28 (Behavioral Tab)

- [x] STAR Story Word Count & Pacing Guide — live word count + color-coded target range + speaking time estimate in AnswerScorer
- [x] Behavioral Question Difficulty Tiers — Easy/Medium/Hard tier field on all questions, tier filter dropdown in question list
- [ ] Answer Recording Mode — deferred: requires mic permission flow
- [ ] XFN Stakeholder Map Builder — deferred: requires diagram library
- [ ] Behavioral Mock Difficulty Selector — deferred: small ROI

## New Features — Round 29 (System Design Tab)

- [x] Design Pattern Library — searchable card library of 12 system design patterns (CQRS, Saga, Circuit Breaker, etc.) in SystemDesignExtras
- [x] Capacity Estimation Calculator — interactive calculator: QPS + data size + retention → storage/bandwidth/memory in SystemDesignExtras
- [ ] System Design Diagram Templates — deferred: covered by Excalidraw export
- [x] Flash Card CSV Import — paste CSV (question,answer) to bulk-import custom flash cards in SystemDesignExtras

## New Features — Round 30 (Overview & UX)

- [x] Daily Study Checklist — personalized daily tasks based on SR due items, weakest patterns, interview date; resets at midnight
- [x] Interview Countdown Urgency Mode — Final Sprint banner with 7-day high-ROI checklist when < 7 days remain
- [ ] Progress Snapshot Share Card — deferred: html2canvas has deployment constraints
- [x] Dark/Light Theme Toggle — sun/moon toggle already in TopNav, preference persisted to localStorage
- [x] Global Search — ⌘K command palette searching across 200+ items (patterns, CTCI, behavioral questions, system design topics, flash cards)
- [x] Onboarding Checklist — 5-step guided checklist for new users (set date, rate patterns, add story, flash drill, run mock); dismissible

## New Features — Round 39

- [ ] L-level badge in Coding Mock running session header (next to phase timer)
- [ ] Onboarding step auto-complete: rate 3 patterns auto-checks step 2, mock completion auto-checks step 5
- [ ] Onboarding progress DB sync (tRPC mutation + query, merges with localStorage for logged-in users)

## New Features — Round 38

- [x] Coding Mock L6/L7 difficulty selector on entry card with level-specific AI rubric (mirrors XFN mock toggle; blue for L6, violet for L7)
- [x] Deep-link chips on each Onboarding Checklist step (navigates to correct tab+section via URL params + popstate)

## New Features — Round 37

### Navigation & Discoverability

- [x] ⌥5 keyboard shortcut for Collab tab Quick Action
- [x] ? icon button in every Quick Actions bar to open keyboard shortcut modal
- [x] Deep-link URL routing (?tab=coding&section=mock) with section scroll support
- [x] Interview countdown banner across all tabs (when ≤7 days away, amber banner)

### Coding Tab

- [x] Explain this pattern AI button (LLM, L6/L7 level-aware, expandable panel per card)
- [x] Code snippet library — Cheat Sheet already covers Python templates; sprint timer already exists as SprintMode
- [x] Weak pattern sprint timer — already exists as SprintMode in CodingTab

### Behavioral Tab

- [x] STAR story version history (up to 5 drafts per question, localStorage)
- [x] Behavioral question randomizer with hidden focus (Surprise Me button in Quick Actions)
- [x] XFN mock transcript export (Download .md button in done view)
- [x] STAR answer word-count indicator (green/amber/red per text area)

### System Design Tab

- [x] Diagram template SVG preview thumbnails in the template cards (inline SVG, dark theme)
- [x] Capacity calculator presets (News Feed, Messenger, Instagram one-click buttons)
- [x] Weak areas callout in SD scorecard (lowest 1-2 dimensions in red with progress bars)

### Progress & Gamification

- [x] Achievement badge share card (toast with 📤 Share button at 25/50/75/90/100% milestones)
- [x] Heatmap PNG export (Download PNG button in HeatmapCalendar header)

### Already Exist (skipped)

- [x] Tab badge counters — already in TopNav (SR due counts per tab)
- [x] Breadcrumb trail in mock sessions — breadcrumb.tsx exists; step indicators in XFN/Full Mock sessions
- [x] Spaced repetition scheduler — already in OverviewExtras and CodingTab
- [x] SD mock history log — already in SystemDesignMockSession (HISTORY_KEY, HistoryPanel)
- [x] SD question timer — already in SystemDesignMockSession (per-phase timer with pause/reset)
- [x] Readiness trend sparkline — already in OverviewTab (14-day sparkline chart)
- [x] Peer comparison for behavioral readiness — already in OverviewTab (recruiter card with peer benchmarks)
- [x] Weekly email digest — deferred (requires backend email sending; not in scope)

## New Features — Round 36

- [x] Update ? keyboard shortcut help modal with Alt+1–4 entries (new Quick Actions section with ⌥1–4 entries)
- [x] Share button in streak milestone toasts (custom JSX toast with 📤 Share button, copies tweet to clipboard)
- [x] Quick Actions sticky bar on Collab tab (Start Collab Session scrolls to form, View Leaderboard scrolls to hero-leaderboard)

## New Features — Round 35

- [x] Alt+1–4 keyboard shortcuts for Quick Actions primary buttons with ⌥N badge labels (wired in Home.tsx handleKeyDown)
- [x] Streak milestone toasts at 7, 14, 30, 60, 100 days (fires once per milestone per day, stored in localStorage)
- [x] Start SD Mock third button in System Design Quick Actions bar (scrolls to SystemDesignMockSession)

## New Features — Round 34

- [x] Quick Actions sticky row on SystemDesignTab (Open Diagram Template, Start Capacity Calc)
- [x] Streak tooltip on Overview Quick Actions bar (longest streak + last active date on hover)
- [x] New Plan secondary button alongside Resume Today's Plan (clears today's plan from localStorage and scrolls to planner)

## New Features — Round 33

- [x] Streak counter in Overview Quick Actions row (🔥 N days inline)
- [x] Resume Today's Plan button — replaces Plan Today's Session if a plan was already generated today; full plan stored in localStorage and auto-restored on page load
- [x] Quick Actions sticky row on CodingTab (Start Coding Mock, Jump to Weak Patterns + activates weak-only filter)
- [x] Quick Actions sticky row on BehavioralTab (Record STAR Answer, Start XFN Mock)

## New Features — Round 32

- [x] Move AI Study Session Planner and Full Mock Day Simulator to top of Overview tab (above LevelCards)
- [x] Quick Actions sticky row at top of Overview (Plan Today's Session / Start Full Mock Day scroll buttons)
- [x] Last Session summary chip on StudySessionPlanner and FullMockDaySimulator
- [x] Collapse L6/L7 comparison cards by default

## New Features — Round 31

- [x] Answer Recording Mode — Voice-to-STAR recorder already implemented in VoiceToStar.tsx (MediaRecorder, S3 upload, Whisper transcription, STAR structuring, AI scoring)
- [x] Behavioral Mock Difficulty Selector — L6 vs L7 toggle added to XFN Behavioral Mock Session entry card; icMode passed to xfnMockScorecard procedure with level-specific rubric
- [x] System Design Diagram Templates — 3 pre-built Excalidraw JSON templates (News Feed, Messenger, Instagram) in SystemDesignDiagramTemplates.tsx with Download + Open buttons

## New Features — Round 40

- [x] Sync patternRatings to DB (new user_ratings table, tRPC get/save, merge on mount)
- [x] Sync bqRatings to DB (same table, separate type field)
- [x] Onboarding all-done confetti burst + share-to-Twitter toast
- [x] Tab badge counters: Coding (weak patterns + SR due), Behavioral (weak BQs), System Design (SR due flash cards)

## New Features — Round 41

- [x] CTCI progress DB sync (solved state + self-difficulty estimates, new ctci_progress table)
- [x] Mock session history DB sync (Coding, System Design, XFN — new mock_sessions table)
- [x] Badge breakdown popover (Coding: weak patterns list; Behavioral: weak BQ stories list)

## New Features — Round 42

- [x] Full-screen disclaimer modal (blocks access, checkbox acknowledgment, localStorage persistence)
- [x] Bump disclaimer key to v2 so all existing users see it fresh on next visit

## New Features — Round 43

- [x] Add disclaimer_acknowledged_at column to users table (DB migration)
- [x] tRPC mutation: disclaimer.acknowledge — writes timestamp for logged-in users
- [x] tRPC query: disclaimer.status — returns acknowledged_at for the current user
- [x] Wire frontend: call mutation on "I Understand" click for logged-in users
- [x] Show "Acknowledged on [date]" status in Overview tab for logged-in users

## New Features — Round 44

- [x] Admin-only tRPC query: disclaimer.adminReport — returns all users with name, email, acknowledgedAt, role
- [x] Admin audit table UI — sortable table showing acknowledged/not-acknowledged users
- [x] Route /admin/disclaimer — protected, only visible to admin role users

## New Features — Round 45

- [x] Block app access until disclaimer acknowledged — for logged-in users verify DB record, not just localStorage

## New Features — Round 46

- [ ] Add pnpm build:standalone script (rebuild + CDN upload in one command, prints new link)

## New Features — Round 47 (PREP SCREEN parity)

- [ ] S/M/L Density Selector in toolbar (compact/comfortable/spacious layout)
- [ ] Gauntlet Mode — 7-tab timed unbroken run challenge
- [ ] Topic Roulette — spin for random pattern/BQ/SD challenge
- [ ] Study Soundtrack — ambient music toggle in toolbar
- [ ] Flashcard Flip Deck in Behavioral tab (type answer, word count, flip to see probes + L6/L7 sample answers)
- [ ] 8 Key Signals That Distinguish L7 from L6 in Behavioral tab
- [ ] Share Prep State URL (encode interview date + checklist progress into shareable URL)
- [ ] 10-Week Study Timeline option (alongside existing 4-week and 2-week plans)

## New Features — Batch 3 (AI Mock Interviewer, Leaderboard, SR Scheduler)

- [ ] AI Mock Interviewer — tRPC LLM procedure scoring STAR answers against L7 signals rubric
- [ ] Peer Comparison Leaderboard — DB schema, opt-in, anonymised leaderboard UI
- [ ] Spaced Repetition Scheduler — daily "3 cards due today" prompt in Quick Actions row

## New Features — Day-Of Preparation

- [x] D-0 Interview Day Mode — 2-hour morning routine (warm-up, STAR reviews, design recap, breathing timer)
- [x] Last-Mile Cheat Sheet Generator — 1-page PDF (top 3 STAR stories, 5 weakest patterns, SD template)
- [x] Confidence Calibration Quiz — 10-question rapid-fire self-assessment with readiness score + focus recs

## New Features (Batch 4)

- [ ] Post-Interview Debrief Form (localStorage + PDF export)
- [ ] Mock Interviewer Persona Selector (tough vs supportive)
- [ ] Recruiter Email Draft Generator (LLM-powered)

## System Design Enhancements (Batch 5)

- [x] Guided Design Walkthrough Mode (LLM step-by-step coach)
- [x] Trade-off Decision Simulator (LLM scoring)
- [x] Meta-Specific Component Library (TAO, Memcache, Scuba, ZippyDB, Laser, Tupperware)
- [x] Scale Estimation Calculator (DAU/QPS/storage)
- [ ] System Design Question Bank with Difficulty Tiers
- [x] Architecture Anti-Pattern Detector (LLM)
- [x] Peer Design Review Simulator (LLM adversarial questions)
- [x] Design Doc Template Generator
- [x] Complexity Cheat Sheet (CAP theorem, latency numbers)
- [x] Explain Like a PM Mode (LLM)
- [x] Time-Boxed Practice Timer with phase checkpoints

## New Features (Batch 6)

- [ ] System Design Diagram Canvas (React Flow, Meta component nodes, PNG export)
- [ ] Mock Full Interview Day (4-round chained session, composite L6/L7 scorecard)
- [ ] Weak Area Auto-Drill (Drill this now button after AI scorecards)

## New Features (Batch 7 — Code Practice AI)

- [x] AI Solution Reviewer (L6/L7 rubric scoring, verdict, coaching note)
- [x] 3-Level Hint System (pattern recognition → approach → pseudocode skeleton)
- [x] Follow-Up Question Generator (2-3 interviewer follow-ups after solution)
- [x] Complexity Analyzer (actual vs optimal time/space with gap explanation)
- [x] Pattern Recognition Trainer (hide label, score candidate's pattern guess)
- [x] L7 Optimization Challenge (auto-challenge after L6-level solution)

## New Features (Batch 6)

- [ ] Session History — localStorage AI review score progression per problem
- [x] Weak Pattern Heatmap — topic score aggregation heatmap in Overview tab
- [ ] Voice Answer Mode — mic recording, Whisper transcription, AI STAR scoring in Behavioral tab

## New Features (Batch 7)

- [x] Score Trend Chart — sparkline in Session History panel showing score progression
- [x] Daily Drill Reminder — 3 weak patterns due today in Overview Quick Actions row
- [x] Voice Answer Replay — audio playback alongside transcript in VoiceAnswerMode

## New Features (Batch 8 — Failure Analysis Enhancements)

- [x] Failure Pattern Self-Assessment (8-question checklist, top-3 risks callout)
- [x] Interviewer Perspective Simulator (LLM design summary reviewer)
- [x] Failure Reason Drill Links (wire each failure to relevant tool)

## New Features (Batch 7)

- [x] Full Mock Interview Scorecard (4-round timed session, LLM composite L6/L7 promotion decision)
- [x] Personalized Weak-Spot Study Plan Generator (7-day plan from actual AI scores)

## Bug Fixes

- [x] System Design tab crash — root cause: useToast undefined in TopicRoulette (cached browser version from 05:04 AM); confirmed TopNav now uses toast from sonner correctly; removed duplicate Google Fonts @import from index.css

## New Features — Stability & DX Round

- [x] Wrap AI components in per-section ErrorBoundaries (SystemDesignMockSession, GuidedDesignWalkthrough, InterviewerPerspectiveSimulator, TradeoffDecisionSimulator, AntiPatternDetector, PeerDesignReview, ExplainLikeAPM)
- [x] Add Clear Site Cache button (footer + PWA service worker cache bust)
- [x] Vitest smoke tests for TopNav components (TopicRoulette, GauntletMode, StudySoundtrack render without throwing)
- [x] Run pnpm build:standalone after all features complete

## Performance & DX Round 2

- [x] Add Try Again retry button to SectionErrorBoundary
- [x] Split large app.js bundle with React.lazy + Suspense for heavy tabs
- [x] Add pnpm test:watch and husky + lint-staged pre-commit hooks
- [x] Run pnpm build:standalone

## Bug Fix — Standalone Build

- [x] Revert React.lazy tab imports to static imports (dynamic imports break standalone CDN build)
- [x] Run pnpm build:standalone

## Hero Banner Redesign

- [x] Generate 3 visual mockup options for new hero banner
- [x] User selects preferred option (Option C — navy/purple gradient, center-aligned)
- [x] Implement chosen banner design (Option A — CommunityBanner component)
- [x] Run pnpm build:standalone

## Banner & Content Round 3

- [ ] Add dismiss (×) button to CommunityBanner with localStorage persistence
- [ ] Add L4/L5 entry-level section to Coding tab
- [ ] Add L4/L5 entry-level section to Behavioral tab
- [ ] Add external link confirmation modal to CommunityBanner official links
- [ ] Run pnpm build:standalone

## Professional Protection Features

- [ ] #5: Rename all Meta-specific branding to FAANG/Staff Engineer framing
- [ ] #4: Add one-click share message copy button in hero section
- [ ] #1: Add Candidate-Initiated Discovery landing page
- [ ] Option A: Persistent "Not affiliated with Meta" banner on every tab
- [ ] Option D: "I am a job seeker" checkbox gate on first visit

## Protection Features Round 4 (from pasted_content_2.txt)

- [x] Update tagline to Option 2: "Everything the community learned the hard way — organized, refined, and ready for your 2026 interviews."
- [x] #2: Add "Community Contributors" author byline + published date to footer and hero
- [x] #5: Add Version E "not intended for distribution by employees" language to footer and How-to-Use section
- [x] #7: Add Terms of Use page accessible from footer
- [x] Deploy to GitHub Pages

## Protection Features Round 5

- [x] Rewrite DisclaimerGate wording to match relaxed footer tone (friendlier, less legal) — Option B4 selected
- [x] Deploy to GitHub Pages

## Deployment Status Badge

- [x] Add GITHUB_TOKEN secret for GitHub API access (public repo — no token needed)
- [x] Add tRPC procedure to fetch latest GitHub Actions run status
- [x] Build DeployStatus badge component (green/yellow/red) in footer
- [x] Deploy to GitHub Pages

## Static Build Fix (GitHub Pages)

- [x] Fix DisclaimerGate — use localStorage-only when no backend available
- [x] Fix DeployStatusBadge — call GitHub API directly from browser (no tRPC)
- [x] Deploy to GitHub Pages

## DisclaimerGate Cleanup

- [x] Remove GitHub repo link from community proof box in DisclaimerGate

## DisclaimerGate Copy Update (Option A + Option 1)

- [x] Update badge to Option A (Free community resource / built and shared by engineers)
- [x] Update checkbox to Option 1 (straightforward, no "found independently" language)

## Branding & Badge Cleanup

- [x] Remove GitHub deploy status badge from footer
- [x] Replace all "Staff Engineer Interview Prep Guide" with "Engineering Interview Prep"
- [x] Remove all "suly" / "suly-1" personal name references from codebase

## DisclaimerGate Improvements

- [x] Soften body text: replace "not affiliated with Meta, Google, Amazon, or any other company" with "not affiliated with any company"
- [x] Add warmer subtitle: replace "Takes 10 seconds — worth it" with "A note from the community"
- [x] Auto-skip gate for returning users already in DB (remove loading spinner delay)

## Level Label + Neutral Language Updates

- [x] Replace all L4/L5/L6/L7 with L4/L5/L6/L7 across entire codebase
- [x] Fix DisclaimerGate recruiter line: "Always pair it with whatever your recruiter sends you" → "Always pair it with any official guidance you receive"
- [x] Remove "Technical Screen Guide" and "Full Loop Interview Guide" buttons and their links
- [x] Fix TypeScript errors from IC→L rename (type union definitions still using L5/L6/L7)
- [x] Make DisclaimerGate domain dynamic via window.location.hostname

## High-Impact Features (Audit Round — 10 Features)

- [ ] #1 AI Interviewer Interrupt Mode — System Design session with disruptive AI questions every 3-5 min, scores pivot/recovery quality
- [ ] #2 Back-of-Envelope Calculator with "Show Your Work" grading — AI grades math correctness, assumptions, and connection to architecture
- [ ] #3 "Tear Down My Design" Adversarial Review — AI finds 3 weakest points, attacks with follow-ups, scores defense quality
- [ ] #4 "Think Out Loud" Coaching Mode — voice memo during coding, AI scores narration quality (pattern named, complexity stated, bugs caught)
- [ ] #5 Pattern Recognition Speed Drill — 90-second drill: name the pattern, state complexity, name one edge case
- [ ] #6 Personalized Weak Pattern Remediation Plan — AI generates 5-problem sequence targeting the 2-3 weakest patterns
- [ ] #7 Story Coverage Matrix — visual matrix of STAR stories vs Meta behavioral focus areas, red cells = gaps
- [ ] #8 Interviewer Persona Stress Test with Scoring — live 3-exchange simulation with AI in character, scores composure/depth/quantification
- [ ] #9 Impact Quantification Coach — paste any STAR answer, AI highlights sentences missing metrics and suggests what to add
- [ ] #10 Personalized Interview Readiness Report — weekly AI-generated 1-page report synthesizing all data into top 3 action items

## New Features (Mar 23 2026)

- [ ] Fix all TypeScript errors in 10 new components (field name mismatches)
- [ ] Move all 10 high-impact features to the top of their respective tabs
- [ ] Add DB schema for score persistence (patterns, behavioral, system design scores per user)
- [ ] tRPC procedures: saveScores, loadScores for cross-device sync
- [ ] Build "Start Here" onboarding flow — 60-second guided tour → Readiness Report
- [ ] Build 7-Day Sprint Plan generator using Readiness Report data (printable/saveable)

## Phase Completion (Mar 23 2026 - Continued)

- [x] Move all 10 high-impact features to the top of their respective tabs
- [x] TypeScript: 0 errors, Tests: 26/26 passing
- [x] Deploy to GitHub Pages (www.metaguide.blog)
- [ ] Build "Start Here" Onboarding Flow (60-second guided tour routing to Readiness Report)
- [ ] Build 7-Day Sprint Plan Generator (day-by-day schedule from Readiness Report, printable)
- [ ] Score Persistence to DB (cross-device tracking with anonymized aggregate stats)

## New Features (Mar 23 2026 - User Requests)

- [ ] Fix CodingTab JSX structure issue (unclosed div from feature-to-top migration)
- [ ] General Feedback Mechanism (site-wide suggestion button → owner notification)
- [ ] 7-Day Sprint Feedback (sprint-specific suggestions sent to owner)
- [ ] Start Here Onboarding Flow (60-second guided tour → Readiness Report)
- [ ] 7-Day Sprint Plan Generator (day-by-day schedule, printable, shareable with mentor/peer)
- [ ] Sprint Plan Sharing (share link/copy for mentor or peer review)
- [ ] Progress & Performance Analytics Dashboard (charts from persistent scores)
- [ ] Score Persistence to DB (cross-device tracking, anonymized aggregate stats)

## Phase 3 Features (Mar 23 2026)

- [x] Fix CodingTab JSX structure (fragment → div wrapper)
- [x] General Feedback Mechanism (floating button + modal, DB + owner notification)
- [x] Start Here Onboarding Flow (60-second guided tour → Readiness Report)
- [x] 7-Day Sprint Plan Generator (AI-generated, printable, shareable)
- [x] Sprint Plan Feedback (sprint-specific suggestions)
- [x] Progress & Performance Analytics Dashboard
- [x] Score Persistence to DB (ScoreSyncBanner, cross-device sync)
- [x] All 10 features moved to top of their respective tabs

## Phase 4 Features (Mar 23 2026)

- [ ] Admin Feedback View (/admin/feedback, owner-only role-gated)
- [ ] Weekly email digest cron job (feedback summary to [owner email])
- [ ] Sprint Plan 100% celebration (confetti + modal)

## Phase 4 Features (Mar 23 2026)

- [ ] Promote owner to admin in DB
- [ ] Admin Feedback Dashboard (/admin/feedback, sortable table)
- [ ] Aggregate Anonymous Stats (feature usage vs pass-rate)
- [ ] Weekly email digest cron job ([owner email])
- [ ] Sprint Plan 100% celebration (confetti + modal)

## Phase 4 Completions (Mar 23, 2026)

- [x] Admin Feedback Dashboard (/admin/feedback) - role-gated, sortable table, CSV export
- [x] Aggregate Anonymous Stats (/admin/stats) - pattern/BQ heatmaps, feature engagement
- [x] Weekly email digest cron (every Monday 08:00 UTC, SMTP + Manus notification fallback)
- [x] Manual "Send Digest" button in admin dashboard
- [x] Sprint Plan 100% celebration - confetti + celebration modal
- [x] Task checkboxes in DayCard with per-day progress bars
- [x] Overall sprint progress bar
- [x] Admin nickname set to "Apex"
- [x] Owner name removed from DB and all code

## Phase 5 (Mar 23, 2026)

- [x] Fix standalone build crash - add sprintPlan/feedback/userScores mocks to trpc.standalone.ts
- [x] SMTP email delivery setup (Gmail, verified via nodemailer.verify())
- [x] Feedback triage status column (new/in_progress/done/dismissed) in DB + admin dashboard

## Phase 6 (Mar 23, 2026)

- [x] Add triage status counts to weekly digest email (New/In Progress/Done/Dismissed summary)
- [x] Instant email notification on new feedback submission (general + sprint plan)

## Phase 7 (Mar 23, 2026)

- [x] Analytics DB table (page_views, sessions, events, device info)
- [x] Client-side analytics tracker (page views, session duration, feature clicks, device)
- [x] Analytics tRPC router (ingest + admin report query)
- [x] Weekly analytics report email (visitors, sessions, hours, top features, device breakdown)
- [x] Top 3 unactioned feedback items section in weekly digest
- [x] /admin/analytics page for live in-app stats

## Phase 8 (Mar 23, 2026)

- [x] "Send Report Now" button on /admin/analytics (manual analytics email trigger)
- [x] DAU 7-day and 30-day line chart on /admin/analytics
- [x] Feature click heatmap badges ("N users today") on main site top-10 features

## Phase 9 (Mar 23, 2026)

- [x] APEX Picks section on homepage (curated feature recommendations for new visitors)
- [x] Admin quick-reply notes on feedback items (DB column + inline edit in /admin/feedback)
- [x] Daily unactioned feedback alert (cron: fires if 3+ new items, email to Apex)

## Phase 10 — APEX Picks A/B Rotation (Mar 24, 2026)

- [ ] apex_picks_sets DB table (id, week_label, picks JSON, is_active, created_at)
- [ ] tRPC: getActivePicks (public, weekly rotation), listPicksSets + upsertPicksSet + deletePicksSet (admin)
- [ ] Admin editor at /admin/apex-picks (CRUD for picks sets, activate toggle, week preview)
- [ ] Homepage ApexPicks component fetches from DB, falls back to hardcoded defaults
- [ ] Tests for getActivePicks rotation logic
- [x] pnpm build:standalone + deploy:github-pages

## Phase 10 — 25 High-Impact Features (Mar 24, 2026)

### TIER 1 — P0 (Week 1, highest offer impact)

- [ ] #3 Impact Quantification Coach — paste STAR answer, AI highlights sentences missing metrics, suggests specific numbers to add
- [ ] #7 Behavioral Story Coverage Matrix — visual matrix of stories vs Meta focus areas, red = gap, green = covered
- [ ] #6 45-Min Pressure Simulation — hard cutoff timer with time-management debrief (phase breakdown)

### TIER 1 — P1 (Week 2)

- [ ] #4 Seniority Level Calibrator — submit STAR story + target level, AI returns "Level Signal" badge + rewrite suggestion
- [ ] #5 Complexity Proof Trainer — AI challenges complexity claim, candidate must prove it, AI evaluates reasoning
- [ ] #9 Post-Interview Debrief Form — structured debrief form + AI analysis → prioritized fix list
- [ ] #10 10-Day Final Sprint Generator — AI reads all performance data, generates day-by-day personalized plan

### TIER 1 — P2 (Week 3)

- [ ] #1 Think Out Loud Trainer — voice recording during coding, AI scores narration quality (pattern named, complexity stated, bugs caught)
- [ ] #2 Adversarial Follow-Up Simulator — AI finds 3 weakest design points, fires follow-up questions, scores pivot quality
- [ ] #8 Interviewer Persona Stress Test — choose persona (skeptical/distracted/impatient), AI plays it throughout mock

### TIER 2 — P3 (Weeks 4-5)

- [ ] #14 Pattern Recognition Speed Drill — 90-sec drill: name pattern + complexity + edge case from problem statement only
- [ ] #20 Daily Warm-Up Routine — 15-min structured daily: 5min flashcards + 5min complexity proofs + 5min easy problem
- [ ] #21 Anti-Pattern Detector (enhanced) — 12 anti-patterns, free-text design input, flags each with fix + interviewer question
- [ ] #25 Offer Probability Dashboard — aggregates all signals into % offer probability with specific improvement actions
- [ ] #13 Back-of-Envelope Grader — grades reasoning chain not just final number (assumptions, units, sanity checks)
- [ ] #11 "Why This Company" Story Builder — 5-question interview → 90-sec genuine Why Meta narrative
- [ ] #15 XFN Stakeholder Map Builder — map real project onto stakeholder diagram, identify STAR story material
- [ ] #17 "Explain to a PM" Communication Trainer — AI plays PM, scores ability to bridge technical and business thinking
- [ ] #18 Weak Pattern Remediation Plan — 5-problem sequence for weakest pattern, ordered by difficulty
- [ ] #19 Story Freshness Tracker — flags over-rehearsed stories based on response time + word repetition
- [ ] #22 Offer Comparison Analyzer — 4-year total comp comparison across base/bonus/equity/signing/COL
- [ ] #23 "Day Before" Checklist and Mindset Protocol — structured day-before routine with breathing exercise
- [ ] #24 Interview Question Prediction Engine — predicts top 5 SD questions + top 3 behavioral areas by team + level
- [ ] #12 Negotiation Prep Module — AI recruiter persona, counter-offer practice, equity vs cash trade-offs
- [ ] #16 Recruiter Email Draft Generator — generates specific thank-you/follow-up email from mock session content

## Phase 10 — 25 High-Impact Features COMPLETED (Mar 24, 2026)

- [x] Offer Probability Dashboard — live signal aggregation from all prep data, weighted % score, top action items
- [x] Daily Warm-Up Routine — 15-min structured: flashcards (weakest patterns first) + complexity proofs + easy warm-up
- [x] 10-Day Final Sprint Generator — reads weak patterns/BQ/stories, generates personalized day-by-day plan
- [x] Seniority Level Calibrator — STAR story + target level → detected level badge + rewrite suggestion
- [x] Complexity Proof Trainer — AI evaluates reasoning chain, not just the answer; model proof provided
- [x] Post-Interview Debrief Form — structured debrief → likely outcome + prioritized fix list
- [x] "Why Meta" Story Builder — 5 inputs → authentic 90-sec narrative, avoids generic red flags
- [x] Interview Question Predictor — team-specific + level-specific question predictions (SD/behavioral/coding)
- [x] "Day Before" Checklist — 18 items across Logistics/Mental Prep/Content Review/Day-Of
- [x] All 9 components added to OverviewTab under "Offer Maximizer" section
- [x] TypeScript: 0 errors | Tests: 27/27 passing

## Phase 11 — Guided Learning Path & UX Polish (Mar 24, 2026)

- [x] Tab progress bars in TopNav (coding/behavioral mastery %, color-coded)
- [x] Section title typography upgrade (1rem, more breathing room)
- [x] Base font size bump (14px → 15px for reduced eye strain)
- [x] Tab labels renamed: Coding → "Drill Patterns", Behavioral → "Tell Stories"
- [x] Remove all guarantee language, replace with recommendation language
- [x] GuidedLearningPath component (4-phase wizard: Calibrate → Fix Gaps → Simulate → Final Sprint)
- [x] Wire GuidedLearningPath to top of OverviewTab above all other sections
- [x] pnpm build:standalone + deploy:github-pages

## Phase 12 — Favorites, Dark/Light Toggle, Progress Tracker (Mar 24, 2026)

- [ ] DB: favorite_questions table (userId, questionId, questionType, questionText, createdAt)
- [ ] tRPC: favorites.add, favorites.remove, favorites.list, favorites.toggle procedures
- [ ] FavoriteButton component (heart icon, optimistic toggle, works on coding + behavioral + design questions)
- [ ] FavoriteQuestions page at /favorites (grouped by type, quick-practice mode)
- [ ] Wire FavoriteButton into CodingTab, BehavioralTab, SystemDesignTab question cards
- [ ] Dark/Light mode toggle button in TopNav (sun/moon icon, uses existing ThemeProvider)
- [ ] Persist theme preference to localStorage
- [ ] InterviewProgressTracker page/component (performance charts over time)
- [ ] Track: pattern mastery trend, behavioral readiness trend, mock session scores, streak history
- [ ] Charts: line chart (readiness over time), bar chart (sessions per week), radar chart (category coverage)
- [ ] Wire InterviewProgressTracker into OverviewTab and add nav entry
- [ ] pnpm build:standalone + deploy:github-pages

## Phase 13 — Owner-Only Disclaimer Report Gate (Mar 24, 2026)

- [ ] Add ownerProcedure middleware (checks ctx.user.openId === OWNER_OPEN_ID)
- [ ] Gate disclaimer.auditReport tRPC procedure behind ownerProcedure
- [ ] Hide "View audit report →" link in DisclaimerStatusBadge for non-owners
- [ ] Add /admin/disclaimer route guard: redirect non-owners to 404
- [ ] pnpm build:standalone + deploy:github-pages

## Phase 14 — Security & Privacy Audit (Mar 24, 2026)

- [x] Full codebase security audit (server, client, DB, auth, API, secrets)
- [x] Fix all critical/high severity issues found (helmet, rate limiting, trust proxy, openId strip, body limit, owner gate)
- [x] Write security audit report for user
- [x] pnpm build:standalone + deploy:github-pages

## Phase 15 — Hybrid Access Gate (Mar 24, 2026)

- [ ] Add site_settings table to DB schema (lock_enabled, lock_start_date, lock_days, lock_message, manual_lock)
- [ ] Add tRPC procedures: checkAccess (public), getSiteSettings (ownerProcedure), updateSiteSettings (ownerProcedure)
- [ ] Build AccessGate component wrapping entire app (auto-lock after N days + manual lock, owner bypass)
- [ ] Build Admin Access Control panel at /admin/access (toggle lock, set start date, set message)
- [ ] Wire AccessGate into App.tsx
- [ ] TypeScript check, tests, build:standalone, deploy:github-pages

## Phase 16 — Security Fixes (Mar 24, 2026)

### HIGH severity

- [x] Fix #1: Move digest.send and collab.sendWeeklyDigest to protectedProcedure
- [x] Fix #2: Move uploadAudio to protectedProcedure + add server-side MIME/size validation
- [x] Fix #3: Add user ownership to leaderboard (require login to upsert/remove, FORBIDDEN on other user's entry)

### MEDIUM severity

- [x] Fix #4: Add typed schema to collab saveEvent (replace z.any() with typed union)
- [x] Fix #5: Move all 39 LLM endpoints to protectedProcedure (require login)
- [x] Fix #6: Add 30-day expiry check to getByShareToken query
- [x] Fix #7: Already using adminProcedure consistently in feedback.ts (verified)

### LOW severity

- [x] Fix #8: Change session cookie SameSite from "none" to "lax" (conditional on HTTPS)
- [x] Fix #9: No skip button exists in DisclaimerGate (verified — checkbox required, no bypass)

### Deploy

- [x] TypeScript check (0 errors), tests (30/30 passing), build:standalone, deploy:github-pages

## Phase 17 — User Blocking + security.txt (Mar 24, 2026)

- [x] Add `blocked` boolean column to users table in drizzle/schema.ts
- [x] Add blockUser / unblockUser procedures (ownerProcedure) in server/routers/adminUsers.ts
- [x] BlockedScreen component shown to blocked users on every page load (BlockedGate in App.tsx)
- [x] Build user management table at /admin/users with instant block/unblock toggle
- [x] Add /.well-known/security.txt (RFC 9116 compliant, contact: sulda00@gmail.com)
- [x] Add Users nav link in AdminFeedback header
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 18 — Block Hardening + Audit Log + Time-Lock Reset (Mar 24, 2026)

- [x] DB: add `block_reason` text column to users table
- [x] DB: add `user_events` table (id, actorId, targetId, eventType, metadata, createdAt)
- [x] Run pnpm db:push to migrate schema
- [x] Server-side block enforcement in protectedProcedure (throw FORBIDDEN if ctx.user.blocked === 1) — already present
- [x] Update blockUser mutation: accept optional reason, write to users.blockReason, write audit log row, send owner Manus notification
- [x] Update unblockUser mutation: write audit log row, send owner notification
- [x] Update /admin/users UI: reason input dialog on block, show blockReason in user row, audit log panel at bottom
- [x] Add "Reset Clock" button to /admin/access (sets lockStartDate to today, saves immediately)
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 19 — Cohort Reset, Login Activity, Export CSV, Block Expiry, Re-block (Mar 24, 2026)

- [x] DB: add `login_events` table (userId, createdAt) to record each login
- [x] DB: add `blockedUntil` timestamp column to users table
- [x] Run migration (direct SQL via mysql2)
- [x] Server: record login event on every successful OAuth callback
- [x] Server: cohortReset procedure — reset lockStartDate to today, clear all disclaimerAcknowledgedAt, send Manus notification
- [x] Server: blockUser mutation — accept optional blockedUntil date (expiryDays input)
- [x] Server: exportAuditLogCsv procedure — return CSV string of full user_events history
- [x] Server: reBlockUser procedure (re-apply block from audit log row)
- [x] Server: getUserLoginHistory procedure — last 5 login timestamps per user
- [x] UI: Cohort Reset card in /admin/access with amber confirmation dialog
- [x] UI: /admin/users — login activity (last 5 logins, expandable per user)
- [x] UI: /admin/users — Export Audit Log CSV download button
- [x] UI: /admin/users — Re-block shortcut in audit log rows (for unblock events)
- [x] UI: /admin/users — block dialog: optional "auto-unblock after N days" input
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 20 — Auto-unblock Middleware + Admin Nav + Feature Audit (Mar 24, 2026)

- [x] Add blockedUntil auto-unblock check to protectedProcedure in server/\_core/trpc.ts
- [x] TopNav: owner-only violet ShieldCheck icon → /admin/feedback (visible only when logged in as owner)
- [x] AdminFeedback header: full hub nav (Stats | Analytics | Access | Users)
- [x] Fix TopNav smoke tests: wrap with tRPC + QueryClient providers
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 21 — User Stats Summary Row + Disclaimer Toggle (Mar 24, 2026)

- [x] Server: getUserStats procedure — total users, weekly active (logged in last 7 days), currently blocked
- [x] UI: /admin/users — summary row at top (3 stat cards: Total Users / Active This Week / Blocked)
- [x] DB: add disclaimerEnabled int column to site_settings (default 1), migration applied
- [x] Server: getDisclaimerEnabled publicProcedure + setDisclaimerEnabled ownerProcedure
- [x] UI: /admin/access — Disclaimer Gate card with Switch (saves immediately, shows current state)
- [x] DisclaimerGate hook: respects disclaimerEnabled server flag (skips gate when disabled)
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 22 — Standalone Mock Hardening + Disclaimer Toggle UX (Mar 24, 2026)

- [x] trpc.standalone.ts: add adminUsers namespace (listUsers, blockUser, unblockUser, getUserStats, getUserLoginHistory, exportAuditLogCsv, reBlockUser, getAuditLog no-ops)
- [x] AdminAccess: add useUtils invalidation for siteAccess.getDisclaimerEnabled in setDisclaimerEnabled mutation onSuccess
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone (app.D7F2H-dN.js), deploy:github-pages, save checkpoint

## Phase 23 — Inactivity Alert, Disclaimer Link, useUtils Stub (Mar 24, 2026)

- [x] trpc.standalone.ts: add siteAccess.getDisclaimerEnabled to useUtils no-op object
- [x] trpc.standalone.ts: add auth.isOwner, favorites, progress namespaces + analytics.startSession/endSession stubs
- [x] Fix corrupted userScores.getAggregateStats and analytics.trackPageView sections in standalone mock
- [x] Server: checkInactiveUsers ownerProcedure — query users with last login > 14 days ago, send Manus notification
- [x] UI: /admin/access — add "View acknowledgment report →" link under Disclaimer Gate card
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone (app.D-C5OvW5.js), deploy:github-pages, save checkpoint

## Phase 24 — Definitive Standalone Mock Fix + Cron Job + Run Now Button (Mar 24, 2026)

- [x] Complete audit of ALL trpc.\* calls across entire client codebase (100+ procedures)
- [x] Fix standalone mock: rename getAuditLog → listEvents, add checkInactiveUsers stub
- [x] Server: inactivityAlert.ts cron job (daily 08:00 UTC) + registered in server/\_core/index.ts
- [x] UI: /admin/users — amber "Check Inactive" Run Now button in header
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 25 — Fix feedback table query failure (Mar 24, 2026)

- [x] Diagnose feedback table SQL error: missing updatedAt column in DB (schema had it, migration was never applied)
- [x] ALTER TABLE feedback ADD COLUMN updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- [x] Create missing tables: apex_picks_sets, favorite_questions, progress_snapshots
- [x] Verified OWNER_OPEN_ID matches user ID 1 openId (6ZvUo3o3...) — admin shield icon works on live server
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] save checkpoint (no rebuild needed — DB-only fix)

## Phase 26 — Fix all standalone TypeError crashes + Feedback Dashboard doc (Mar 24, 2026)

- [x] Audit all tRPC calls in AdminFeedback, AdminUsers, AdminAccess, AdminStats, AdminAnalytics for missing stubs
- [x] Add missing stubs to trpc.standalone.ts (feedback.updateNote, feedback.triggerDailyAlert, getAuditLog, etc.)
- [x] Build standalone and deploy to GitHub Pages
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] Save checkpoint
- [x] Produce complete Feedback Dashboard replication document
- [x] Fix missing React key prop warning in AdminUsers (Fragment key)
- [x] Fix admin panel missing on metaguide.blog: isOwner stub returns true, mock admin user in useAuth.standalone, add admin routes to App.standalone, route() helper for hash routing
- [x] Server-side block enforcement: check blocked flag in protectedProcedure middleware (also fixed adminProcedure + ownerProcedure to chain through requireUser)
- [x] Bulk "Mark all new as in-progress" mutation + UI button on Feedback Dashboard
- [x] Feedback count badge on TopNav admin shield icon (red dot when last7Days > 0)
- [x] Feedback count badge (red dot) on TopNav admin shield icon via adminStats query
- [x] Server-side block enforcement: adminProcedure and ownerProcedure now chain through requireUser so blocked admins/owners are rejected
- [x] Re-block shortcut in audit log (AdminUsers) — one-click re-apply last block reason
- [x] Send Digest button on AdminStats page — reuse triggerDailyAlert mutation
- [x] useUtils invalidation on disclaimer toggle in AdminAccess — instant UI update on flip

## Phase 29 — Fix site lock not working

- [ ] Add static-build warning banner in AdminAccess (settings cannot be saved on GitHub Pages)
- [ ] Fix AccessGate staleTime: reduce to 30s and invalidate checkAccess after updateSettings/quickToggle mutations

## Phase 30 — Multiple fixes

- [x] Fix dark/light mode toggle not working
- [x] Fix hints.get.useMutation TypeError in standalone mock
- [x] Add unread feedback count badge to admin shield icon
- [x] Add page-view event tracker on tab switches
- [ ] Add cohortReset server procedure (clears disclaimerAcknowledgedAt for all users)
- [ ] Wire Cohort Reset button to AdminAccess UI with confirmation dialog
- [ ] Add automated stub coverage test for trpc.standalone.ts

## Phase 29 — LLM Sentiment Tagging

- [ ] Add sentiment tagging (positive/neutral/negative) to feedback submission server-side using invokeLLM
- [ ] Store sentiment in metadata JSON column
- [ ] Add sentiment filter pill to Feedback Dashboard
- [ ] Add colored sentiment badge to each feedback row
- [ ] Add standalone mock stub for sentiment field

## Bulletproofing Strategies (High Priority — All Must Be Implemented)

- [x] Strategy 1 (P1): Error boundaries on every tab — wrap each of the 7 main tabs in <ErrorBoundary fallback={<TabErrorFallback />}> in Home.tsx
- [x] Strategy 2 (P2): Feature flags — useFeatureFlag('xyz') hook + FeatureFlag wrapper component reading from VITE*FEATURE*\* env vars
- [x] Strategy 3 (P3): Expand automated tests — server/procedures.smoke.test.ts (23 tests) + client/src/test/pages.render.test.tsx (7 tests) — 61 total tests passing
- [x] Strategy 4 (P4): Smoke test after deploy — scripts/smoke-test.ts using Playwright, wired into deploy:github-pages script (SKIP_SMOKE_TEST=1 to bypass)
- [x] Strategy 5 (P5): Strict TypeScript — strict:true already enabled; added noFallthroughCasesInSwitch + forceConsistentCasingInFileNames; documented why noUnusedLocals is intentionally excluded (style rule, not safety rule)
- [x] Strategy 6 (P6): DB migration safety — scripts/db-migrate-safe.mjs with pre-migration snapshot, failure recovery instructions, and pnpm db:migrate-safe script
- [x] Strategy 7 (P7): LLM graceful degradation — withLLMFallback() + withLLMJsonFallback() added to server/\_core/llm.ts; tagSentiment in feedback.ts now uses withLLMFallback with 12s timeout, falls back to 'neutral'
- [x] Strategy 8 (P8): Dependency locking — .npmrc with save-exact=true + audit-level=moderate; added audit:check and audit:fix npm scripts
- [x] Strategy 9 (P9): RUNBOOK.md rollback playbook — 3 scenarios: bad deploy (Manus UI rollback), DB migration error (exact SQL fixes + nuclear restore), LLM outage (withLLMFallback auto-handles + feature flag disable)
- [x] Strategy 10 (P10): Staging environment guidance — docs/staging-environment.md with step-by-step Manus project setup, workflow, schema migration process, and pre-deploy checklist

## Temporary Block Enhancements

- [x] Server: add extendBlock procedure (adjust blockedUntil on an already-blocked user)
- [x] Server: add expiryDays param to reBlockUser so re-blocks can also be temporary
- [x] Server: add cron job that auto-expires blocks every 5 minutes (fire-and-forget)
- [x] Admin UI: upgrade BlockDialog with preset duration buttons (1h, 24h, 3d, 7d, 30d, permanent)
- [x] Admin UI: add live ExpiryCountdown badge in user table status column
- [x] Admin UI: add "Extend" action button on blocked users to modify expiry without unblocking
- [x] Admin UI: update audit log entries to show expiry info clearly
- [x] Admin UI: update reBlockUser call to pass expiryDays from audit log row
- [x] Standalone mock: add extendBlock stub
- [x] Tests: add extendBlock procedure smoke test (65 total tests passing)

## CRITICAL — Admin Access Lockdown (Owner-Only)

- [x] Server: verify ownerProcedure checks OWNER_OPEN_ID, not just role='admin'
- [x] Server: verify adminProcedure does NOT allow regular users
- [x] Frontend: hide admin shield icon from everyone except the owner (check isOwner, not isAuthenticated)
- [x] Frontend: /admin/\* routes redirect non-owners to home (each page checks isOwner)
- [x] Standalone: isOwner stub returns false (trpc.standalone.ts)
- [x] Standalone: removed all admin routes from App.standalone.tsx
- [x] Deploy and verify admin panel is inaccessible to non-owners — deployed to www.metaguide.blog

## Admin PIN Gate

- [x] Add ADMIN_PIN environment secret
- [x] Server: verifyAdminPin procedure — checks PIN, returns signed JWT token (1h expiry)
- [x] Frontend: AdminPinGate component — intercepts all /admin/\* routes, PIN modal, stores token in memory
- [x] Wire AdminPinGate into App.tsx wrapping all admin routes
- [x] Standalone: AdminPinGate returns locked (no PIN check possible without server)
- [x] Tests: verifyAdminPin smoke test (68 total tests passing)
- [x] Deploy and verify PIN gate works

## Admin PIN Enhancements

- [x] Schema: pinAttempts table (id, ip, attemptedAt, succeeded)
- [x] Server: log failed PIN attempts to pinAttempts table in verifyAdminPin
- [x] Server: auto-lock after 5 consecutive wrong PINs for 15 minutes (server-side, by IP)
- [x] Server: verifyAdminPin returns lockoutUntil timestamp when locked
- [x] Frontend: PIN expiry toast — warn 5 minutes before 55-min token expires
- [x] Frontend: lockout countdown in PIN modal (shows time remaining when locked)
- [x] Frontend: Re-lock button (KeyRound icon) in TopNav — clears in-memory token, redirects to PIN gate
- [x] Standalone mock: getPinStatus stub
- [x] Tests: pinAttempts logging + lockout smoke tests (68 total tests passing)
- [x] Deploy and verify all four enhancements work

## New Features — Admin Access

- [ ] Hidden admin shortcut: press A five times on standalone homepage to navigate to /#/admin
- [ ] Document PIN change process (update ADMIN_PIN secret + redeploy)
- [ ] Add metaengguide.pro as custom domain on Manus live app

## Automated Testing & Nightly Health Check

- [ ] Write Playwright interaction tests for all key toggles (dark mode, tabs, mock timer, pattern rating, STAR story expand, streak)
- [ ] Extend smoke-test.ts with full interaction test suite
- [ ] Create GitHub Actions nightly cron workflow (.github/workflows/nightly-health.yml)
- [ ] Configure workflow to email on failure using SMTP secrets
- [ ] Run tests locally against live site to verify all pass
- [ ] Push GitHub Actions workflow to both remotes (metaengguide + metaguide)

## New Features — Round 31 (5 High-Impact AI Features)

- [x] AI-Enabled Coding Simulator (Priority #1) — 3-phase Meta format: Bug Fix → Feature Extension → Optimization, AI scoring per phase, in Coding tab
- [x] IC-Level Signal Calibrator (Priority #2) — paste system design answer, get L5/L6/L7 signal breakdown with gaps, in System Design tab
- [x] Meta Product Design Simulator (Priority #3) — 45-min timed session, 4 phases, Meta rubric scoring, in System Design tab
- [x] Debugging Under Time Pressure (Priority #4) — 20 pre-built buggy codebases, 8-min timer, Meta Phase 1 format, in Coding tab
- [x] Pass/Fail Verdict Engine (Priority #5) — Hire/Borderline/No-Hire verdict with Meta rubric reasoning, in Overview tab
- [x] Fix tRPC context error (main.tsx missing trpc.Provider + QueryClientProvider wrappers)
- [x] Add 5 new AI procedure stubs to trpc.standalone.ts (stub coverage test: 68/68 passing)

## New Features — Round 32

- [x] Smoke tests for 5 new AI components (AICodingSimulator, DebuggingUnderPressure, ICLevelSignalCalibrator, MetaProductDesignSimulator, PassFailVerdictEngine) in pages.render.test.tsx
- [x] useDebuggingHistory hook in useLocalStorage + persist scores in DebuggingUnderPressure component
- [x] Pass/Fail Verdict Engine integrated into Full Mock Day Simulator (auto-feed combined scores after session ends)

## Bug Fix — Round 33

- [x] Fix blank white screen in Management UI preview panel — moved Google Fonts @import to top of index.css before Tailwind imports (CSS ordering violation caused silent stylesheet failure in production build)

## Rename — Round 34

- [x] Replace all IC4/IC5/IC6/IC7 mentions with L4/L5/L6/L7 across entire codebase (components, data, routers, tests, HTML, CSS, markdown) — 387 occurrences replaced, zero remaining

## Rename — Round 35

- [x] Update project title to "Meta L4/L5/L6/L7 Interview Prep Guide" in HTML title, manifest name, AccessGate header, footer text (VITE_APP_TITLE must be updated manually in Settings → General)

## New Features — Round 36

- [x] Update onboarding modal copy from "L6/L7" to "L4 through L7" — now reads "L4 (SWE), L5 (Senior SWE), L6 (Staff), and L7 (Senior Staff)"
- [x] Add Debugging History panel to Coding tab — shows hit rate, avg fix time, trend (last 5 vs prev 5), mini-timeline, unsolved problems to retry
- [x] Add Download Report button to Full Mock Day Simulator — opens print-ready HTML in new tab with scorecard + verdict + coaching + remediation plan

## New Features — Round 37

- [x] Adaptive Study Plan Generator — AI analyzes weak dimensions across all rounds, generates personalized 7-day daily plan, updates dynamically
- [x] Peer Benchmark Mode — anonymous percentile comparison after scored sessions, distribution chart, top-X% callouts per dimension
- [x] Live Interview Simulation with Voice — TTS interviewer speaks questions, Whisper transcribes user answers, AI scores spoken response
- [x] Meta-Specific Question Bank — 200+ verified Meta questions tagged by round/L-level/team/recency/frequency, links to simulators
- [x] Interview Readiness Certificate — shareable PDF + link when combined mock score ≥4.0/5 with Strong Hire verdict

## Fix + New Features — Round 38

- [ ] Force fresh deploy to GitHub Pages with all Round 37 features included
- [ ] Add L-level selector to Peer Benchmark Mode (filter percentile by L4/L5/L6/L7)
- [ ] Add "Practice This Question" button to Meta Question Bank (links to relevant simulator)
- [ ] Add streak-based unlock to Readiness Certificate (require 5-day streak + Strong Hire verdict)

## AI-Enabled Coding Mock Interview (Round 40)

- [x] Add server-side AI procedures: nerfed AI chat, phase evaluation scoring (aiCodingMock router)
- [x] Build MetaAICodingMock component: 3-panel layout (file tree + code editor + AI chat)
- [x] Implement 3-phase flow: Phase 1 bug fix (15 min), Phase 2 feature impl (25 min), Phase 3 optimization (15 min)
- [x] Build post-interview debrief: 4-dimension rubric scoring (Problem Solving, Code Dev, Verification, Communication)
- [x] Add session history: persist completed mock sessions, review past attempts
- [x] Add "🤖 AI Mock" tab to TopNav and wire in Home.tsx
- [x] Write vitest tests for new AI procedures (12 tests passing)
- [x] Add aiCodingMock stubs to trpc.standalone.ts (v25)

## AI Mock Enhancements — Round 41

- [ ] AI Token Budget Trainer: 5-message hard cap per phase, live counter badge, budget-exhausted lockout
- [ ] TDD Mode toggle for Phase 1: hide code, show only failing tests, reveal code button after attempt
- [ ] Add 5 new problems: distributed caching, news feed ranking, rate limiting with burst capacity, graph-based friend recommendations, + distributed counter

## AI Mock Enhancements — Round 41

- [ ] AI Token Budget Trainer: 5-message hard cap per phase, live counter badge, budget-exhausted lockout
- [ ] TDD Mode toggle for Phase 1: hide code, show only failing tests, reveal code button after attempt
- [ ] Add 5 new problems: distributed caching, news feed ranking, rate limiting with burst capacity, graph-based friend recommendations, distributed counter

## Build Fix — Round 42

- [x] Fix package.json build script: server/index.ts → server/\_core/index.ts
- [x] Fix package.json dev script to use tsx watch server/\_core/index.ts

## 10 Research-Backed Features — Round 42

- [ ] Feature 1: AI Hallucination Spotter — AI gives subtly wrong code, candidate finds the error
- [ ] Feature 2: Requirements Clarification Drill — timed practice asking the right clarifying questions
- [ ] Feature 3: Checkpoint Pacer — visual 60-min timeline with phase checkpoints and pacing alerts
- [ ] Feature 4: Complexity Flashcard Trainer — given code snippet, identify Big-O time/space complexity
- [ ] Feature 5: Code Navigation Speed Test — timed multi-file codebase Q&A without running code
- [ ] Feature 6: Rubber Duck Explainer — type explanation of approach, AI scores clarity
- [ ] Feature 7: Incremental Feature Builder — add features one at a time on shared codebase, timed
- [ ] Feature 8: Test-First Debugger — given only failing test output, write the fix (no code shown)
- [ ] Feature 9: Verbal Explanation Scorer — type 90-sec explanation, AI scores Technical Communication
- [ ] Feature 10: Full Session Replay — replay code changes + AI messages on a timeline with annotations

## AI Training Tab — Round 43

- [x] Feature 1: AI Hallucination Spotter — 6 scenarios, AI scores answer, reveals correct explanation
- [x] Feature 2: Requirements Clarification Drill — 3 scenarios, AI scores coverage/prioritization/anti-patterns
- [x] Feature 3: Checkpoint Pacer — 60-min visual timeline, phase bands, pacing alerts, real-time countdown
- [x] Feature 4: Complexity Flashcard Trainer — 8 cards, instant time/space check, explanation reveal
- [x] Feature 5: Code Navigation Speed Test — 3-file codebase, timed Q&A, AI scores answers
- [x] Feature 6: Rubber Duck Explainer — type explanation, AI scores clarity/structure/correctness
- [x] Feature 7: Incremental Feature Builder — step-by-step feature additions, AI evaluates each step
- [x] Feature 8: Test-First Debugger — failing test output only, write fix, AI runs tests
- [x] Feature 9: Verbal Explanation Scorer — 90-sec timed explanation, AI scores 4 sub-dimensions
- [x] Feature 10: Full Session Replay — timeline scrubber with event log, demo session pre-loaded
- [x] Wire all 10 drills into new AITrainingTab component with drill grid + back navigation
- [x] Add "🏋️ Training" tab to TopNav
- [x] Mount AITrainingTab in Home.tsx
- [x] Add 5 missing tRPC procedures to aiTraining router (getIncrementalChallenges, submitIncrementalStep, getTestFirstChallenges, submitTestFirstFix, scoreVerbalExplanation)
- [x] Add all aiTraining stubs to trpc.standalone.ts
- [x] All 85 tests passing

## AI Native Hub — Round 44

- [x] Add 9 new server procedures to aiTraining router (scoreRAGExplanation, scoreAIStack, scoreAgentEvalDesign, scoreBottleneckAnalysis, scoreHumanInLoop, scoreEpistemicHumility, scoreMetaValuesAlignment, scoreMaturityClassification, scoreMockScreeningPhase)
- [x] Build RAGExplainerDrill component
- [x] Build AIStackBuilder component
- [x] Build AgentEvalDesigner component
- [x] Build EnterpriseBottleneckCase component
- [x] Build HumanInLoopChallenge component
- [x] Build EpistemicHumilityCoach component
- [x] Build MetaValuesAlignmentCheck component
- [x] Build MaturitySelfClassifier component
- [x] Build KeywordFluencyFlashcards component
- [x] Build FullMockScreeningCall component
- [x] Build AINativeHubTab with violet/indigo branding, Practice Drills / Maturity Assessment toggle, maturity spectrum bar
- [x] Add ✦ AI Native tab to TopNav TABS array
- [x] Wire ai-native tab in Home.tsx
- [x] Add 9 aiNative stubs to trpc.standalone.ts
- [x] Run pnpm test — 85/85 pass
- [x] Save checkpoint

## Auto Publish Notification — Round 45

- [x] Create server/checkpointNotifier.ts — fires notifyOwner on every production cold-start
- [x] Wire fireCheckpointPublishedNotification() into server/\_core/index.ts startup
- [x] 85/85 tests pass, prettier clean

## AI-Native Persistence & History — Round 46

- [x] Add aiNativeDrillScores, aiNativeMockSessions, aiNativeMaturityLevels tables to drizzle/schema.ts
- [x] Create tables directly via SQL (drizzle-kit migration had env issue)
- [x] Create server/routers/aiNativeHistory.ts with 7 procedures
- [x] Wire aiNativeHistory router into server/routers.ts
- [x] Build AINativeRadarChart component for OverviewTab (4-axis: Fluency, Impact, Responsible, Continuous)
- [x] Add AI-Native Level badge to HeroSection (persisted from MaturitySelfClassifier result)
- [x] Inject AINativeRadarChart into OverviewTab
- [x] Rewrite FullMockScreeningCall with DB persistence and history panel
- [x] Wire saveDrillScore into all 9 drill components (fixed duplicate save declarations)
- [x] Add 7 aiNativeHistory stubs to trpc.standalone.ts
- [x] Add disclaimer banner to TopNav (dark blue bg, white/blue/amber text, dismissible, localStorage)
- [x] 85/85 tests pass, build clean
- [ ] Save checkpoint

## Silent Version Toast — Round 47

- [x] Remove Manus inbox notification import and call from server/\_core/index.ts
- [x] Add GET /api/version endpoint to server (returns BUILD_HASH baked at deploy time)
- [x] Build VersionUpdateToast component (top-right fixed, 5s auto-dismiss, ✦ Updated badge, fade-in animation)
- [x] Wire VersionUpdateToast into App.tsx (polls every 60s, shows on hash change)
- [x] 85/85 tests pass, prettier clean
- [ ] Save checkpoint

## Round 48 — Follow-ups + Learning Path Tab

- [x] Update onboarding modal slide 1 title to "Screen Interview Guide: Meta Style"
- [x] Update onboarding modal slide 1 body copy to reflect new brand and AI-Native tab
- [x] Add AI-Native axis to OverviewTab readiness gauge (coding 50%, behavioral 30%, AI-Native 20%)
- [x] Add AI-Native drills ready count to OverviewTab stats grid (4th column)
- [x] Add best-score badges to featured and all-drills grid cards in AINativeHubTab
- [x] Build LearningPathTab with rejection stats, weak signal catalogue, 4-week path, Apex Picks, High Impact features
- [x] Add 📚 Learning Path tab to TopNav TABS array
- [x] Wire LearningPathTab in Home.tsx
- [x] 85/85 tests pass, build clean
- [ ] Save checkpoint

## Bugfix — bestScores.filter crash (Round 48 hotfix)

- [x] Fix TypeError: bestScores.filter is not a function in ReadinessDashboard (OverviewTab)
- [x] getBestScoresByDrill returns Record<string,{overallScore,coreSkill,drillLabel}> — converted to Object.values() array, fixed field name bestScore→overallScore
- [x] 85/85 tests pass
- [ ] Save checkpoint

## Round 49 — Interactive Learning Path (Hands-On Mock Practice)

- [ ] Redesign LearningPathTab: each week becomes a launchable practice session
- [ ] Week 1 session: Requirements Clarification Drill + Complexity Flashcards + STAR Story prompt
- [ ] Week 2 session: Rubber Duck Explainer + Checkpoint Pacer + Behavioral timed question
- [ ] Week 3 session: Code Navigation Speed Test + AI Hallucination Spotter + AI-Native drill
- [ ] Week 4 session: Verbal Explanation Scorer + Test-First Debugger + Full Mock Screening Call
- [ ] Per-week progress ring showing drills completed
- [ ] Session summary panel with scores after completing all drills in a week
- [ ] Persist session completion to DB (learningPathSessions table)
- [ ] Add server router procedure for saving/loading learning path progress
- [ ] Run pnpm test — all pass
- [ ] Save checkpoint

## New Features — Round 49

- [x] Interactive LearningPathTab with per-week drill sessions (4 weeks × 3 drills each, progress rings, session summaries)
- [x] FailureAnalysisTab — 7-part interactive reference ("Why Candidates Fail") with weak signal drills, stress-test scenarios, behavioral question bank, persona stress tests, 22% down-leveling guide, tools map, and summary fix table
- [x] Register failure-analysis tab in TopNav and Home.tsx
- [x] Vitest tests for FailureAnalysisTab data integrity and LearningPath drill sessions (17 tests passing)

## New Features — Round 50

- [ ] Server-side drill session score persistence (drillSessions table, tRPC procedures)
- [ ] Per-week best-score badges on LearningPathTab cards (wired to DB)
- [ ] Inline drill launchers on Failure Analysis weak signal cards
- [ ] Persona Stress Test simulator (AI plays 5 archetypes, scores resilience)

## Round 50 — Three Follow-Up Features

- [ ] Drill score leaderboard on Overview Readiness Dashboard (per-drill best scores from DB)
- [ ] Failure Analysis Part header drill completion rings (signals drilled / total)
- [ ] Persona Stress Test history panel (last 5 sessions with date, persona, resilience score)

## Round 51 — 18 Failure Analysis Hands-On Mock Drills

- [ ] Drill 1: NFR Ambush Drill (timed NFR enumeration + AI scoring)
- [ ] Drill 2: Bottleneck Autopsy (diagram analysis + bottleneck identification)
- [ ] Drill 3: Scale Jump Stress Test (1K→100K RPS pivot challenge)
- [ ] Drill 4: Edge Case Gauntlet (60s edge case enumeration + coverage scoring)
- [ ] Drill 5: STAR Specificity Rewriter (vague phrase detection + forced rewrite)
- [ ] Drill 6: Ownership Signal Extractor (probing questions + ownership scoring)
- [ ] Drill 7: Down-Level Detector (L5/L6/L7 classification + rewrite loop)
- [ ] Drill 8: Trade-Off Pressure Cooker (60s trade-off + challenge defense)
- [ ] Drill 9: Failure Mode Flashcard Sprint (15-card classification sprint)
- [ ] Drill 10: Live Fix Simulator (15-min end-to-end failure diagnosis)
- [ ] Drill 11: The Interruptor (mid-explanation interruption recovery)
- [ ] Drill 12: Clarification Interrogator (underspecified prompt + assumption design)
- [ ] Drill 13: Devil's Advocate Interviewer (position defense under opposition)
- [ ] Drill 14: The Silent Skeptic (reading interviewer silence)
- [ ] Drill 15: Scope Creep Challenger (mid-interview pivot response)
- [ ] Drill 16: Time Pressure Mock (20-min coding with status updates)
- [ ] Drill 17: XFN Conflict Simulator (PM disagreement roleplay)
- [ ] Drill 18: The Gotcha Follow-Up (weakest assumption challenge)
- [ ] DrillHub component with category tabs, progress tracker, best-score badges
- [ ] Embed DrillHub in FailureAnalysisTab

## Round 51 — Replay, Weekly Challenge, PDF Export

- [ ] Drill replay mode with fresh AI seed and per-drill score history in FailureDrillHub
- [ ] Weekly drill challenge banner with rotating drills and streak counter in FailureAnalysisTab
- [ ] Export Progress Report PDF generator with drill scores, best times, and weak areas

## Round 52 — How to Use This Guide Tab

- [ ] HowToUseTab component with 12 collapsible sections including Customizing Your Learning Path
- [ ] Register Guide tab in TopNav and Home.tsx
- [ ] Smoke test for HowToUseTab

## Round 51 — Engagement & Addictiveness Features

- [ ] Daily Interview Challenge — daily question + AI scoring + leaderboard
- [ ] Streak System with Stakes — streak badge, Hard Mode unlock, Boss Fight unlock
- [ ] The Boss Fight — 45-min Architect mock, L5-L7+ verdict
- [ ] Comeback Arc — post-drill recovery plan + retry delta celebration
- [ ] Adaptive Difficulty Engine — per-user per-drill difficulty tracking and scenario calibration
- [ ] Live Typing Pressure Mode — real-time interruption events during typing with response-time scoring
- [ ] Interview Seasons — 4-week rotating seasons, season leaderboard, champion badges

## Round 53 — Engagement Features + Contrast Overhaul

- [x] Engagement router (server/routers/engagement.ts) — 16 procedures across 7 gamification features
- [x] DailyChallengeCard component — 3 categories, AI scoring, anonymous leaderboard
- [x] StreakDisplay component — streak counter, milestones, Hard Mode / Boss Fight unlock indicators
- [x] BossFightLauncher component — 45-min Architect mock with multi-turn AI persona
- [x] ComebackPlanCard component — post-low-score recovery plan with step-by-step drills
- [x] AdaptiveDifficultyIndicator component — per-drill difficulty tracking with visual level indicator
- [x] LiveTypingPressureDrill component — real-time AI interruptions while typing under time pressure
- [x] SeasonBanner component — active interview season display with leaderboard
- [x] GamificationHub tab — consolidates all 7 engagement features in one view
- [x] Register Challenges tab in TopNav and Home.tsx
- [x] Add engagement stubs to trpc.standalone.ts (stub coverage test passes)
- [x] All 103 tests passing
- [x] Site-wide contrast and readability overhaul:
  - Raised dark-mode muted-foreground from oklch(0.58) → oklch(0.68) — affects every label, hint, caption
  - Raised dark-mode card background from oklch(0.17) → oklch(0.185) for clearer card separation
  - Raised dark-mode border opacity from 8% → 10% for clearer card edges
  - Upgraded light-mode muted-foreground from oklch(0.52) → oklch(0.42) for better contrast on white
  - Replaced all text-zinc-400/slate-400/gray-400 with text-muted-foreground (23 files)
  - Replaced all text-zinc-300/slate-300/gray-300 with text-foreground/80
  - Removed text-muted-foreground/60, /50, /40 opacity variants — raised to full muted-foreground
  - Replaced hardcoded bg-slate-800/700/900 with semantic bg-secondary/bg-background
  - Fixed active tab labels: blue-400 → blue-300, emerald-400 → emerald-300 (more readable on dark)
  - Added kbd styling with border-bottom-width: 2px for clear keyboard shortcut legibility
  - Added code:not([class]) styling for inline code readability
  - Raised base font-size from 14px → 14.5px and line-height from 1.6 → 1.65
  - Fixed OverviewTab comparison table cells: text-muted-foreground → text-foreground/85
  - Fixed Leaderboard opacity variants: /60, /50 → full muted-foreground
  - Added selection highlight color for text selection visibility
  - Added dark-mode scrollbar styling for better usability

## Bug Fix — Round 53b

- [x] Fix TypeError: (a.data ?? []).map is not a function — getBestScoresByDrill returns a Record object; AINativeHubTab.tsx now uses bestEntry?.overallScore instead of calling .map() on the result

## Privacy Cleanup — Round 54

- [x] Remove DeployStatusBadge component and its server-side deployStatus router entirely
- [x] Remove metaguide.blog links from the feedback email template in server/routers/feedback.ts (also cleaned dailyAlert.ts, weeklyAnalytics.ts, weeklyDigest.ts)
- [x] Remove Twitter/Email share buttons from SevenDaySprintPlan (keep Copy Link only)
- [x] Remove GitHub API call from trpc.standalone.ts

## Privacy Cleanup — Round 55

- [x] Remove NotificationBanner component (push notifications) from Home.tsx
- [x] Build 10-second auto-dismissing update toast in top-right corner (no browser permissions)

## UI Polish — Round 56

- [x] Restyle dark/light mode toggle in TopNav to larger pill button with moon/sun icon + "Dark"/"Light" label

## UI Polish — Round 57

- [x] Mobile-responsive dark/light toggle: icon-only on small screens, full pill on md+
- [x] Add /api/changelog endpoint returning latest update message
- [x] Wire changelog message into VersionUpdateToast so it shows what changed

## Privacy Protections — Round 58

- [x] Remove platform branding (Manus/generator meta tags) from HTML source
- [x] Strengthen public-resource disclaimer in TopNav banner and footer
- [x] Remove insider-language from content (replace with public-source framing)
- [x] Build invite-code access gate (env-var: VITE_INVITE_CODE, currently GO0000)
- [x] Wire up Umami analytics script in index.html using existing env vars

## InviteGate Enhancements — Round 59

- [x] Rotate invite code to GO000 (update VITE_INVITE_CODE secret)
- [x] Add 3-attempt lockout with 30-second cooldown timer
- [x] Rename gate title from "Private Resource" to "Study Group Access"
- [x] Show welcome message after successful code entry (3.5s auto-dismiss with feature highlights)

## InviteGate Timing — Round 60

- [x] Extend lockout from 30s to 300s (5 minutes) in LOCKOUT_SECONDS
- [x] Change welcome screen auto-dismiss from 3.5s to 5s in WELCOME_DURATION_MS

## InviteGate Advanced — Round 61

- [x] DB schema: inviteAttemptLog table (ip, code_tried, success, timestamp) + inviteCodes table (code, welcome_message, cohort_name)
- [x] Server-side rate limiting: tRPC verifyInviteCode procedure with IP-based 3-attempt lockout (5 min cooldown)
- [x] Server-side logging: record every failed attempt to inviteAttemptLog
- [x] Per-code welcome messages: seed default GO000 code with welcome text, surface on welcome screen
- [x] Animated fade/slide transition from welcome screen into the main app
- [x] Animated feature tour on welcome screen (4-slide auto-advance tour)

## InviteGate Follow-up — Round 62

- [x] Add Cohort 2 invite code (code: COHORT2) to invite_codes table in the database
- [x] Query and display invite_attempt_log to show access attempt history (0 rows — log is clean, no failed attempts yet)

## Real-Time User Tracking — Round 63

- [ ] Add visitor_sessions DB table (sessionId, ip, inviteCode, firstSeen, lastSeen, userAgent)
- [ ] Record session on successful invite gate pass in invite router
- [ ] Add /api/heartbeat endpoint to update lastSeen every 30s
- [ ] Add admin stats tRPC query (total unique, active now, active today, active this week, per-code breakdown)
- [ ] Build live stats widget in admin dashboard (auto-refreshes every 30s)

## Phase 63 — Code Practice Tab (from uploaded ZIP)

- [x] Copy CodePracticeTab.tsx into client/src/components/
- [x] Copy CodePracticeAIStatic.tsx into client/src/components/
- [x] Add "💻 Code Practice" tab to TopNav TABS array
- [x] Add tab render in Home.tsx
- [x] Verify Monaco editor works (already installed)
- [x] Fix any TypeScript/import errors
- [x] All tests passing

## Phase 64 — Three Improvements

- [ ] Solved-count badge on Code Practice tab in TopNav (reads localStorage, shows X/50)
- [ ] Code Practice completion % as 4th readiness dimension in OverviewTab
- [ ] visitor_sessions DB table + schema migration
- [ ] tRPC heartbeat endpoint (upsert session, 30s TTL)
- [ ] Session creation on invite gate pass
- [ ] Admin dashboard widget: total/active/today/week + per-code breakdown
- [ ] 30-second auto-refresh on admin widget
- [ ] Tests for heartbeat and session query procedures

## Phase 64 — Real-time tracking widget, AdminInviteCodes wiring, Cohort Reset button

- [ ] Build live-stats widget in AdminStats.tsx (total/active users, per-code breakdown)
- [x] Wire AdminInviteCodes to real inviteCodes table via inviteGate router
- [ ] Add cohort reset confirmation dialog + button to AdminSettings
