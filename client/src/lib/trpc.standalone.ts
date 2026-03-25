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
    chat: { useMutation: () => makeMutation(() => ({ reply: "" })) },
    codingMockScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    detectAntiPatterns: { useMutation: () => makeMutation(() => ({ patterns: [] })) },
    explainLikeAPM: { useMutation: () => makeMutation(() => ({ explanation: "" })) },
    fullMockDayScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    guidedWalkthroughFeedback: { useMutation: () => makeMutation(() => ({ feedback: "" })) },
    interviewerPerspective: { useMutation: () => makeMutation(() => ({ perspective: "" })) },
    peerDesignReview: { useMutation: () => makeMutation(() => ({ review: "" })) },
    scorePeerReviewAnswers: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    scoreTradeoff: { useMutation: () => makeMutation(() => ({ score: 0 })) },
    sysDesignMockScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
    transcribeAndScoreVoice: { useMutation: () => makeMutation(() => ({ transcript: "", score: 0 })) },
    xfnMockScorecard: { useMutation: () => makeMutation(() => ({ scorecard: {} })) },
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
    uploadAudio: { useMutation: () => makeMutation(() => ({ url: "" })) },
  },

  // ── ctci ──────────────────────────────────────────────────────────────────
  ctci: {
    studyPlan: { useMutation: () => makeMutation(() => ({ plan: "" })) },
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
  },

  // ── admin ────────────────────────────────────────────────────────────────────────────────────
  admin: {
    blockUser: { useMutation: () => makeMutation(() => ({ success: true })) },
    blockUserWithExpiry: { useMutation: () => makeMutation(() => ({ success: true })) },
    cohortReset: { useMutation: () => makeMutation(() => ({ success: true })) },
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
  },

  // ── siteAccess ─────────────────────────────────────────────────────────────────────────────────
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

  // ── analytics ──────────────────────────────────────────────────────────
  analytics: {
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
