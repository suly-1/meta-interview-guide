/**
 * trpc.standalone.ts — Mock tRPC client for the standalone static build.
 *
 * This file is aliased to replace @/lib/trpc in vite.standalone.config.ts.
 * Every procedure returns a sensible default so admin pages render without a server.
 * Real data only flows through the live server build.
 *
 * Pattern:
 *   Query stub:    { useQuery: (_?: unknown, _opts?: unknown) => makeQuery(defaultValue) }
 *   Mutation stub: { useMutation: () => makeMutation(() => ({ success: true })) }
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQuery<T>(data: T) {
  return {
    data,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve({ data }),
    status: "success" as const,
    isPending: false,
  };
}

function makeMutation<T>(fn: (...args: unknown[]) => T) {
  return {
    mutate: (..._args: unknown[]) => {},
    mutateAsync: async (...args: unknown[]) => fn(...args),
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    data: undefined as T | undefined,
    reset: () => {},
  };
}

// ── Mock tRPC object ──────────────────────────────────────────────────────────

export const trpc = {
  // ── auth ──────────────────────────────────────────────────────────────────
  auth: {
    me: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({
          id: 1,
          name: "Admin",
          email: "",
          role: "admin" as const,
          openId: "standalone-admin",
          isBanned: 0,
          bannedUntil: null,
          banReason: null,
          disclaimerAcknowledgedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }),
    },
    isOwner: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ isOwner: false }),
    },
    logout: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── system ────────────────────────────────────────────────────────────────
  system: {
    notifyOwner: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── digest ────────────────────────────────────────────────────────────────
  digest: {
    send: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── behavioral ────────────────────────────────────────────────────────────
  behavioral: {
    score: { useMutation: () => makeMutation(() => ({ scores: {}, feedback: "" })) },
  },

  // ── ai ────────────────────────────────────────────────────────────────────
  ai: {
    analyzeComplexity: { useMutation: () => makeMutation(() => ({ analysis: "" })) },
    analyzeDebrief: { useMutation: () => makeMutation(() => ({ debrief: "" })) },
    buildWhyCompanyStory: { useMutation: () => makeMutation(() => ({ story: "" })) },
    calibrateSeniorityLevel: { useMutation: () => makeMutation(() => ({ level: "" })) },
    challengeComplexity: { useMutation: () => makeMutation(() => ({ challenge: "" })) },
    chat: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    codingMockScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    detectAntiPatterns: { useMutation: () => makeMutation(() => ({ patterns: [] })) },
    explainLikeAPM: { useMutation: () => makeMutation(() => ({ explanation: "" })) },
    explainPattern: { useMutation: () => makeMutation(() => ({ explanation: "" })) },
    fullMockDayScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    generateFollowUps: { useMutation: () => makeMutation(() => ({ followUps: [] })) },
    generateReadinessReport: { useMutation: () => makeMutation(() => ({ report: "" })) },
    generateRemediationPlan: { useMutation: () => makeMutation(() => ({ plan: "" })) },
    generateTenDaySprint: { useMutation: () => makeMutation(() => ({ sprint: [] })) },
    getProgressiveHint: { useMutation: () => makeMutation(() => ({ hint: "" })) },
    guidedWalkthroughFeedback: { useMutation: () => makeMutation(() => ({ feedback: "" })) },
    ic7OptimizationChallenge: { useMutation: () => makeMutation(() => ({ challenge: "" })) },
    interruptModeScore: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    interruptModeStart: { useMutation: () => makeMutation(() => ({ prompt: "" })) },
    interviewerPerspective: { useMutation: () => makeMutation(() => ({ perspective: "" })) },
    peerDesignReview: { useMutation: () => makeMutation(() => ({ review: "" })) },
    personaStressTestRespond: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    personaStressTestScore: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    personaStressTestStart: { useMutation: () => makeMutation(() => ({ prompt: "" })) },
    predictInterviewQuestions: { useMutation: () => makeMutation(() => ({ questions: [] })) },
    quantifyImpact: { useMutation: () => makeMutation(() => ({ impact: "" })) },
    reviewSolution: { useMutation: () => makeMutation(() => ({ review: "" })) },
    scoreBoECalculation: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    scorePatternGuess: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    scoreThinkOutLoud: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    scorePeerReviewAnswers: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    scoreTradeoff: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    sysDesignMockScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    tearDownDesign: { useMutation: () => makeMutation(() => ({ teardown: "" })) },
    techRetroCoach: { useMutation: () => makeMutation(() => ({ coaching: "" })) },
    transcribeAndScoreVoice: { useMutation: () => makeMutation(() => ({ transcript: "", score: 0 })) },
    xfnMockScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    drillClarificationInterrogator: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillDevilsAdvocate: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillGotchaFollowUp: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillInterruptor: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillScopeCreep: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillSilentSkeptic: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillTimePressure: { useMutation: () => makeMutation(() => ({ success: true })) },
    drillXFNConflict: { useMutation: () => makeMutation(() => ({ success: true })) },
    detectWeakSignals: { useMutation: () => makeMutation(() => ({ analysis: { topWeakSignals: [], overallPattern: "", priorityAction: "" } })) },
    generateReplayCommentary: { useMutation: () => makeMutation(() => ({ commentary: [] })) },
    generateVerdict: { useMutation: () => makeMutation(() => ({ verdict: { overallScore: 0, verdict: "borderline", icLevel: "IC6", dimensionScores: [], strengths: [], criticalGaps: [], hiringRecommendation: "", nextSteps: [] } })) },
    analyzePrompt: { useMutation: () => makeMutation(() => ({ score: 0, feedback: "Standalone mode — connect to server for AI scoring" })) },
  },

  // ── aiRound ───────────────────────────────────────────────────────────────
  aiRound: {
    debrief: { useMutation: () => makeMutation(() => ({ debrief: "" })) },
    drillDeeper: { useMutation: () => makeMutation(() => ({ reply: "" })) },
  },

  // ── codeExec ──────────────────────────────────────────────────────────────
  codeExec: {
    run: { useMutation: () => makeMutation(() => ({ output: "", error: null })) },
  },

  // ── collab ────────────────────────────────────────────────────────────────
  collab: {
    aiFinalFeedback: { useMutation: () => makeMutation(() => ({ feedback: "" })) },
    aiFollowUp: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    createRoom: { useMutation: () => makeMutation(() => ({ roomId: "" })) },
    saveScorecard: { useMutation: () => makeMutation(() => ({ success: true })) },
    scoreAnswer: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    transcribeAndStructure: { useMutation: () => makeMutation(() => ({ transcript: "", structured: {} })) },
    uploadAudio: { useMutation: () => makeMutation(() => ({ url: "" })) },
  },

  // ── ctci ──────────────────────────────────────────────────────────────────
  ctci: {
    generateDebrief: { useMutation: () => makeMutation(() => ({ debrief: "" })) },
    getHint: { useMutation: () => makeMutation(() => ({ hint: "" })) },
    patternHint: { useMutation: () => makeMutation(() => ({ hint: "" })) },
    scoreAnswer: { useMutation: () => makeMutation(() => ({ icLevelFit: 0, feedback: "" })) },
    studyPlan: { useMutation: () => makeMutation(() => ({ plan: "" })) },
  },

  // ── ctciProgress ──────────────────────────────────────────────────────────
  ctciProgress: {
    get: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery(null) },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── favorites ─────────────────────────────────────────────────────────────
  favorites: {
    list: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    remove: { useMutation: () => makeMutation(() => ({ success: true })) },
    toggle: { useMutation: () => makeMutation(() => ({ favorited: false })) },
    updateNotes: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── deployStatus ──────────────────────────────────────────────────────────
  deployStatus: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ status: "unknown" as const, message: "Standalone mode", updatedAt: null }),
    },
  },

  // ── disclaimer ────────────────────────────────────────────────────────────
  disclaimer: {
    acknowledge: { useMutation: () => makeMutation(() => ({ success: true })) },
    adminReport: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    status: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ acknowledged: true, acknowledgedAt: null }),
    },
  },

  // ── feedback ──────────────────────────────────────────────────────────────
  feedback: {
    submitGeneral: { useMutation: () => makeMutation(() => ({ success: true })) },
    submitSiteFeedback: { useMutation: () => makeMutation(() => ({ success: true })) },
    submitSprintFeedback: { useMutation: () => makeMutation(() => ({ success: true })) },
    shareSprintPlan: { useMutation: () => makeMutation(() => ({ token: null })) },
    getSharedPlan: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery(null),
    },
    getAllSiteFeedback: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    updateFeedbackStatus: { useMutation: () => makeMutation(() => ({ success: true })) },
    // Lightweight new-feedback count for admin badge
    getNewCount: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ newCount: 0 }),
    },
    // New admin procedures
    adminGetAll: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ items: [], total: 0 }),
    },
    adminStats: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ byCategory: [], total: 0, last7Days: 0, newCount: 0 }),
    },
    getDigestPreview: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({
          subject: "Weekly Feedback Digest — MetaEngGuide",
          to: "(standalone mode — no backend)",
          body: "[Standalone mode] No real feedback data available. In production, this would show the last 7 days of feedback items.",
          itemCount: 0,
          items: [] as Array<{ id: number; category: string; rating: number | null; message: string; page: string | null; createdAt: Date; status: string }>,
        }),
    },
    triggerDigest: { useMutation: () => makeMutation(() => ({ success: true })) },
    triggerDailyAlert: { useMutation: () => makeMutation(() => ({ success: true, sent: false })) },
    updateStatus: { useMutation: () => makeMutation(() => ({ success: true })) },
    updateNote: { useMutation: () => makeMutation(() => ({ success: true })) },
    markAllNew: { useMutation: () => makeMutation(() => ({ success: true, updated: 0 })) },
  },

  // ── highImpact ────────────────────────────────────────────────────────────
  highImpact: {
    adversarialAttack: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    generateSprintPlan: { useMutation: () => makeMutation(() => ({ plan: [] })) },
    gradeBoE: { useMutation: () => makeMutation(() => ({ grade: 0 })) },
    ic: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    interruptQuestion: { useMutation: () => makeMutation(() => ({ question: "" })) },
    personaFollowUp: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    personaScore: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    quantifyImpact: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    readinessReport: { useMutation: () => makeMutation(() => ({ report: "" })) },
    remediationPlan: { useMutation: () => makeMutation(() => ({ plan: "" })) },
    scoreDefense: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    scoreInterruptResponse: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    storyGapAnalysis: { useMutation: () => makeMutation(() => ({ gaps: [] })) },
    upgradeAnswer: { useMutation: () => makeMutation(() => ({ upgraded: "" })) },
    ic7SignalCoach: { useMutation: () => makeMutation(() => ({ coaching: "", signals: [] })) },
  },

  // ── hints ─────────────────────────────────────────────────────────────────
  hints: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ hints: [] }),
      useMutation: () => makeMutation(() => ({ hint: "AI hints are only available on the live server. Visit metaengguide.pro to use this feature." })),
    },
  },

  // ── interviewerChat ───────────────────────────────────────────────────────
  interviewerChat: {
    ask: { useMutation: () => makeMutation(() => ({ reply: "" })) },
  },

  // ── leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    remove: { useMutation: () => makeMutation(() => ({ success: true })) },
    upsert: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── mathTrainer ───────────────────────────────────────────────────────────
  mathTrainer: {
    score: { useMutation: () => makeMutation(() => ({ score: 0 })) },
  },

  // ── metaRubric ────────────────────────────────────────────────────────────
  metaRubric: {
    score: { useMutation: () => makeMutation(() => ({ score: 0 })) },
  },

  // ── metaScreenDebrief ─────────────────────────────────────────────────────
  metaScreenDebrief: {
    useMutation: () => makeMutation(() => ({ debrief: "" })),
  },

  // ── mockHistory ───────────────────────────────────────────────────────────
  mockHistory: {
    upsertSession: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── mockInterview ─────────────────────────────────────────────────────────
  mockInterview: {
    debrief: { useMutation: () => makeMutation(() => ({ debrief: "" })) },
    followUps: { useMutation: () => makeMutation(() => ({ questions: [] })) },
  },

  // ── onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    dismiss: { useMutation: () => makeMutation(() => ({ success: true })) },
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ dismissed: false, completedSteps: [] }),
    },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── patternHint ───────────────────────────────────────────────────────────
  patternHint: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ hint: "" }),
      useMutation: () => makeMutation(() => ({ hint: "Pattern hints are only available on the live server." })),
    },
  },

  // ── requirementsTrainer ───────────────────────────────────────────────────
  requirementsTrainer: {
    score: { useMutation: () => makeMutation(() => ({ score: 0 })) },
  },

  // ── scores ────────────────────────────────────────────────────────────────
  scores: {
    getAggregate: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    getMyScores: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── signalDetector ────────────────────────────────────────────────────────
  signalDetector: {
    classify: { useMutation: () => makeMutation(() => ({ signals: [] })) },
  },

  // ── siteSettings ─────────────────────────────────────────────────────────
  siteSettings: {
    getLockStatus: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ locked: false, reason: "no_expiry" as const, message: null, daysRemaining: null }),
    },
    lockNow: { useMutation: () => makeMutation(() => ({ success: true })) },
    resetClock: { useMutation: () => makeMutation(() => ({ success: true })) },
    unlock: { useMutation: () => makeMutation(() => ({ success: true })) },
    updateLockSettings: { useMutation: () => makeMutation(() => ({ success: true })) },
    getDisclaimerEnabled: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ enabled: true }) },
    setDisclaimerEnabled: { useMutation: () => makeMutation(() => ({ success: true, enabled: true })) },
    getCohortHealth: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({
        totalUsers: 0, acknowledgedCount: 0, acknowledgedPct: 0,
        daysRemaining: null, daysElapsed: null,
        lockEnabled: false, lockStartDate: null, lockDurationDays: 60,
      }),
    },
  },

  // ── admin ────────────────────────────────────────────────────────────────────────────────────
  admin: {
    blockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
    blockUserWithExpiry: { useMutation: () => makeMutation(() => ({ success: true })) },
    cohortReset: { useMutation: () => makeMutation(() => ({ success: true })) },
    getUserBlockHistory: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    listAuditLog: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    listLoginActivity: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    listUsers: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    processExpiredBlocks: { useMutation: () => makeMutation(() => ({ success: true })) },
    reBlockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
    unblockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── adminPin ─────────────────────────────────────────────────────────────────────────────────────
  // PIN gate stubs — standalone build bypasses PIN (admin panel is already blocked by isOwner=false)
  adminPin: {
    verifyPin: { useMutation: () => makeMutation(() => ({ token: 'standalone-pin-bypass' })) },
    verifyPinToken: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ valid: true }),
    },
    getPinLockStatus: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ locked: false, secondsRemaining: 0, failedAttempts: 0 }),
    },
    changeAdminPin: { useMutation: () => makeMutation(() => ({ success: true })) },
    getPinAttemptHistory: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    getIpAllowlist: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ ips: [] }),
    },
    setIpAllowlist: { useMutation: () => makeMutation(() => ({ success: true, count: 0 })) },
    getPinAttemptChart: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
  },
  // ── adminUsers ─────────────────────────────────────────────────────────────────────────────────
  adminUsers: {
    listUsers: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    getUserStats: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ total: 0, weeklyActive: 0, blocked: 0 }),
    },
    getUserLoginHistory: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    blockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
    unblockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
    reBlockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
    exportAuditLogCsv: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ csv: '' }),
    },
    listEvents: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    checkInactiveUsers: { useMutation: () => makeMutation(() => ({ notified: false, count: 0 })) },
    getUserBlockHistory: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    listAuditLog: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
  },
  // ── siteAccesss ─────────────────────────────────────────────────────────────────────────────────
  siteAccess: {
    checkAccess: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ locked: false, reason: 'no_expiry' as const, message: null, daysRemaining: null, isAdmin: false }),
    },
    getDisclaimerEnabled: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ enabled: true }),
    },
    getSettings: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ lockEnabled: false, manualLockEnabled: false, lockStartDate: null, lockDays: 60, lockMessage: null, disclaimerEnabled: true }),
    },
    updateSettings: { useMutation: () => makeMutation(() => ({ success: true })) },
    setDisclaimerEnabled: { useMutation: () => makeMutation(() => ({ success: true, enabled: true })) },
    cohortReset: { useMutation: () => makeMutation(() => ({ success: true, newStartDate: '' })) },
  },

  // ── skepticScoring ─────────────────────────────────────────────────────────────────────────────────
  skepticScoring: {
    score: { useMutation: () => makeMutation(() => ({ score: 0 })) },
  },

  // ── stressTest ────────────────────────────────────────────────────────────
  stressTest: {
    score: { useMutation: () => makeMutation(() => ({ score: 0 })) },
  },

  // ── studyPlanner ──────────────────────────────────────────────────────────
  studyPlanner: {
    generate: { useMutation: () => makeMutation(() => ({ plan: [] })) },
  },

  // ── progress ──────────────────────────────────────────────────────────────
  progress: {
    list: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── ratings ───────────────────────────────────────────────────────────────
  ratings: {
    getAll: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ patternRatings: {}, bqRatings: {} }) },
    saveBqRatings: { useMutation: () => makeMutation(() => ({ success: true })) },
    savePatternRatings: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── sprintPlan ────────────────────────────────────────────────────────────
  sprintPlan: {
    generate: { useMutation: () => makeMutation(() => ({ plan: null })) },
    getByShareToken: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery(null) },
    save: { useMutation: () => makeMutation(() => ({ success: true, token: null })) },
  },

  // ── userScores ────────────────────────────────────────────────────────────
  userScores: {
    getAggregateStats: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ totalSessions: 0, avgScore: 0 }) },
    load: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery(null) },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── analytics ──────────────────────────────────────────────────────────
  analytics: {
    endSession: { useMutation: () => makeMutation(() => ({ success: true })) },
    featureClicksToday: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    startSession: { useMutation: () => makeMutation(() => ({ sessionId: 0 })) },
    trackEvent: { useMutation: () => makeMutation(() => ({ success: true })) },
    getSiteAnalytics: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({
        sessions: 0,
        loggedInUsers: 0,
        pageViews: 0,
        avgSessionMinutes: 0,
        totalTimeHours: 0,
        dailyActive: [] as { date: string; sessions: number }[],
      }),
    },
    getTopUnactionedFeedback: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([] as Array<{ id: number; category: string; message: string; createdAt: Date }>),
    },
    sendAnalyticsReport: { useMutation: () => makeMutation(() => ({ success: true })) },
    trackPageView: { useMutation: () => makeMutation(() => ({ ok: true })) },
  },
  // ── systemDesign ──────────────────────────────────────────────────────────
  systemDesign: {
    debrief: { useMutation: () => makeMutation(() => ({ debrief: "" })) },
    followUp: { useMutation: () => makeMutation(() => ({ reply: "" })) },
  },

  // ── tradeoffDrill ─────────────────────────────────────────────────────────
  tradeoffDrill: {
    score: { useMutation: () => makeMutation(() => ({ score: 0 })) },
  },

  // ── push ─────────────────────────────────────────────────────────────────
  push: {
    getVapidPublicKey: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery(null) },
    status: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ subscribed: false, count: 0 }) },
    subscribe: { useMutation: () => makeMutation(() => ({ success: true })) },
    unsubscribe: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── useUtils (no-op cache invalidation) ──────────────────────────────────
  useUtils: () => ({
    auth: {
      me: {
        setData: () => {},
        invalidate: () => {},
        refetch: () => {},
      },
    },
    feedback: {
      getAllSiteFeedback: { invalidate: () => {} },
      getNewCount: { invalidate: () => {} },
      adminStats: { invalidate: () => {} },
      adminGetAll: { invalidate: () => {} },
    },
    siteSettings: {
      getLockStatus: { invalidate: () => {} },
    },
    disclaimer: {
      status: { invalidate: () => {} },
      adminReport: { invalidate: () => {} },
    },
    scores: {
      getMyScores: { invalidate: () => {} },
      getAggregate: { invalidate: () => {} },
    },
    onboarding: {
      get: { invalidate: () => {} },
    },
    leaderboard: {
      invalidate: () => {},
    },
    admin: {
      listUsers: { invalidate: () => {} },
      listAuditLog: { invalidate: () => {} },
    },
    adminUsers: {
      listUsers: { invalidate: () => {} },
      listEvents: { invalidate: () => {} },
    },
    adminPin: {
      getIpAllowlist: { invalidate: () => {} },
      getPinAttemptHistory: { invalidate: () => {} },
      getPinAttemptChart: { invalidate: () => {} },
    },
    analytics: {
      getSiteAnalytics: { invalidate: () => {} },
      getTopUnactionedFeedback: { invalidate: () => {} },
    },
    siteAccess: {
      checkAccess: { invalidate: () => {} },
      getDisclaimerEnabled: { invalidate: () => {} },
      getSettings: { invalidate: () => {} },
    },
  }),

  // ── Provider (no-op in standalone) ───────────────────────────────────────
  Provider: ({ children }: { children: React.ReactNode }) => children,
  createClient: () => ({}),
};
