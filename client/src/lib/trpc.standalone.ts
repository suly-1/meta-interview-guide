// v25 — full procedure coverage: aiCodingMock stubs added
/**
 * Standalone tRPC mock — used in the self-contained HTML export.
 * All server calls are replaced with localStorage-only implementations
 * so the guide works fully offline with no Manus account.
 *
 * The shape mirrors the real trpc client so components need zero changes.
 */
import * as React from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function ls<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Returns a React-Query-compatible query result object */
function makeQuery<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve({ data }),
  };
}

/** Returns a React-Query-compatible mutation object */
function makeMutation<TInput = unknown, TOutput = unknown>(
  fn: (input: TInput) => TOutput | Promise<TOutput>
) {
  let isPending = false;
  const listeners: Array<() => void> = [];

  return {
    mutate: (
      input: TInput,
      opts?: {
        onSuccess?: (d: TOutput) => void;
        onError?: (e: unknown) => void;
      }
    ) => {
      isPending = true;
      Promise.resolve(fn(input))
        .then(d => {
          isPending = false;
          opts?.onSuccess?.(d);
        })
        .catch(e => {
          isPending = false;
          opts?.onError?.(e);
        });
    },
    mutateAsync: (input: TInput) => Promise.resolve(fn(input)),
    isPending,
    isError: false,
    error: null,
    reset: () => {},
  };
}

// ─── stub implementations ────────────────────────────────────────────────────

const RATINGS_KEY = "meta_prep_ratings_v1";
const BQ_RATINGS_KEY = "meta_prep_bq_ratings_v1";
const CTCI_KEY = "meta_prep_ctci_v1";
const ONBOARDING_KEY = "meta_prep_onboarding_v1";

export const trpc = {
  // ── auth ──────────────────────────────────────────────────────────────────
  auth: {
    me: {
      useQuery: () => makeQuery(null),
    },
    logout: {
      useMutation: () => makeMutation(() => {}),
    },
    isOwner: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ isOwner: false }),
    },
    verifyAdminPin: {
      useMutation: () =>
        makeMutation(() => {
          throw new Error("Admin panel not available in standalone mode");
        }),
    },
    getPinStatus: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ lockedUntil: null, attemptsRemaining: 5 }),
    },
  },

  // ── disclaimer ────────────────────────────────────────────────────────────
  // In standalone mode, the DB is not available.
  // Return acknowledged: false so the gate uses localStorage only
  // (the useDisclaimerGate hook will fall back to localStorage for anonymous users)
  disclaimer: {
    status: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ acknowledged: false, acknowledgedAt: null }),
    },
    acknowledge: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    adminReport: {
      useQuery: () => makeQuery([]),
    },
  },

  // ── ratings ───────────────────────────────────────────────────────────────
  ratings: {
    getAll: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({
          patternRatings: ls<Record<string, number>>(RATINGS_KEY, {}),
          bqRatings: ls<Record<string, number>>(BQ_RATINGS_KEY, {}),
        }),
    },
    savePatternRatings: {
      useMutation: () =>
        makeMutation((input: { ratings: Record<string, number> }) => {
          lsSet(RATINGS_KEY, input.ratings);
          return { success: true };
        }),
    },
    saveBqRatings: {
      useMutation: () =>
        makeMutation((input: { ratings: Record<string, number> }) => {
          lsSet(BQ_RATINGS_KEY, input.ratings);
          return { success: true };
        }),
    },
  },

  // ── ctciProgress ──────────────────────────────────────────────────────────
  ctciProgress: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery(
          ls<{
            solved: Record<string, boolean>;
            difficulty: Record<string, string>;
          }>(CTCI_KEY, { solved: {}, difficulty: {} })
        ),
    },
    save: {
      useMutation: () =>
        makeMutation(
          (input: {
            solved: Record<string, boolean>;
            difficulty: Record<string, string>;
          }) => {
            lsSet(CTCI_KEY, input);
            return { success: true };
          }
        ),
    },
  },

  // ── onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery(
          ls<{ completed: Record<string, boolean>; dismissed: boolean }>(
            ONBOARDING_KEY,
            { completed: {}, dismissed: false }
          )
        ),
    },
    save: {
      useMutation: () =>
        makeMutation(
          (input: {
            completed: Record<string, boolean>;
            dismissed: boolean;
          }) => {
            lsSet(ONBOARDING_KEY, input);
            return { success: true };
          }
        ),
    },
  },

  // ── mockHistory ───────────────────────────────────────────────────────────
  mockHistory: {
    upsertSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    getTop: {
      useQuery: () => makeQuery([]),
    },
    upsert: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    remove: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── AI mutations (no-op in standalone — AI requires server) ───────────────
  ai: {
    chat: {
      useMutation: () =>
        makeMutation(() => ({
          content:
            "⚠️ AI features require the online version at the Manus app.",
        })),
    },
    explainPattern: {
      useMutation: () =>
        makeMutation(() => ({
          explanation: "⚠️ AI explanations require the online version.",
        })),
    },
    codingMockScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    sysDesignMockScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    xfnMockScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    fullMockDayScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    techRetroCoach: {
      useMutation: () =>
        makeMutation(() => ({
          coaching: "⚠️ AI coaching requires the online version.",
        })),
    },
    interruptModeStart: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            interruptions: [
              "⚠️ AI Interrupt Mode requires the online version at the Manus app.",
              "Visit the online version to use this feature.",
              "AI features are not available in the static build.",
            ],
          }),
        })),
    },
    interruptModeScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            feedback: "⚠️ AI scoring requires the online version.",
            betterResponse: "",
          }),
        })),
    },
    scoreBoECalculation: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            orderOfMagnitude: "unknown",
            feedback: "⚠️ AI scoring requires the online version.",
            keyAssumptions: [],
            designImplication: "",
          }),
        })),
    },
    tearDownDesign: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            overallScore: 0,
            verdict: "⚠️ AI review requires the online version.",
            criticalFlaws: [],
            minorIssues: [],
            strengths: [],
            prioritizedFixes: [],
          }),
        })),
    },
    scoreThinkOutLoud: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            overallScore: 0,
            dimensions: [],
            topTip: "⚠️ AI coaching requires the online version.",
            modelThinkAloud: "",
          }),
        })),
    },
    scorePatternDrill: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            correct: false,
            correctPattern: "",
            explanation: "⚠️ AI scoring requires the online version.",
            keySignals: [],
            score: 0,
            speedRating: "",
          }),
        })),
    },
    generateRemediationPlan: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            plan: [],
            weeklyMilestones: [],
            estimatedReadinessGain:
              "⚠️ AI planning requires the online version.",
          }),
        })),
    },
    personaStressTestStart: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            challenges: [
              "⚠️ AI Persona Stress Test requires the online version.",
            ],
          }),
        })),
    },
    personaStressTestRespond: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            feedback: "⚠️ AI scoring requires the online version.",
          }),
        })),
    },
    personaStressTestScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI debrief requires the online version.",
        })),
    },
    quantifyImpact: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            scoreOriginal: 0,
            scoreStrengthened: 0,
            weakClaims: [],
            coaching: "⚠️ AI coaching requires the online version.",
            strengthenedStory: "",
          }),
        })),
    },
    generateReadinessReport: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            verdict: "no-go",
            report:
              "⚠️ AI Readiness Report requires the online version at the Manus app.",
          }),
        })),
    },
    // ── AI stubs added in Phase 26 ────────────────────────────────────────
    analyzeComplexity: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    analyzeDebrief: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    buildWhyCompanyStory: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    calibrateSeniorityLevel: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    challengeComplexity: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    detectAntiPatterns: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    explainLikeAPM: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    generateFollowUps: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    generateTenDaySprint: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    getProgressiveHint: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    guidedWalkthroughFeedback: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    interviewerPerspective: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    peerDesignReview: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    predictInterviewQuestions: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    reviewSolution: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    scorePatternGuess: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    scorePeerReviewAnswers: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    scoreTradeoff: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    transcribeAndScoreVoice: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    ic7OptimizationChallenge: {
      useMutation: () =>
        makeMutation(() => ({
          challenge: "⚠️ AI features require the online version.",
          hints: [],
          optimalApproach: "",
        })),
    },
    aiCodingSimulatorScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    debuggingScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    icLevelSignalCalibrator: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    metaProductDesignScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    passFailVerdict: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    adaptiveStudyPlan: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    peerBenchmark: {
      useMutation: () =>
        makeMutation(() => ({
          percentile: 50,
          message: "⚠️ Benchmark requires the online version.",
        })),
    },
    voiceInterviewScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ Voice scoring requires the online version.",
        })),
    },
    readinessCertificateCheck: {
      useMutation: () =>
        makeMutation(() => ({
          eligible: false,
          message: "⚠️ Certificate check requires the online version.",
        })),
    },
    metaQuestionHint: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI hints require the online version.",
        })),
    },
    transcribeAndScore: {
      useMutation: () =>
        makeMutation(() => ({
          transcript: "",
          score: 0,
          feedback: "⚠️ Voice transcription requires the online version.",
        })),
    },
  },

  // ── collab (no-op in standalone) ─────────────────────────────────────────
  collab: {
    scoreAnswer: {
      useMutation: () =>
        makeMutation(() => ({
          score: "⚠️ Collab features require the online version.",
        })),
    },
    transcribeAndStructure: {
      useMutation: () =>
        makeMutation(() => ({
          structured: "⚠️ Voice features require the online version.",
        })),
    },
    uploadAudio: {
      useMutation: () => makeMutation(() => ({ url: "" })),
    },
    aiFinalFeedback: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ Collab features require the online version.",
        })),
    },
    aiFollowUp: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ Collab features require the online version.",
        })),
    },
    createRoom: {
      useMutation: () => makeMutation(() => ({ roomId: "" })),
    },
    saveScorecard: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── ctci AI hints (no-op in standalone) ──────────────────────────────────
  ctci: {
    getHint: {
      useMutation: () =>
        makeMutation(() => ({
          hint: "⚠️ AI hints require the online version.",
        })),
    },
    patternHint: {
      useMutation: () =>
        makeMutation(() => ({
          hint: "⚠️ AI hints require the online version.",
        })),
    },
    scoreAnswer: {
      useMutation: () =>
        makeMutation(() => ({
          score: "⚠️ AI scoring requires the online version.",
        })),
    },
    generateDebrief: {
      useMutation: () =>
        makeMutation(() => ({
          debrief: "⚠️ AI debrief requires the online version.",
        })),
    },
    studyPlan: {
      useMutation: () =>
        makeMutation(() => ({
          plan: "⚠️ AI study plan requires the online version.",
        })),
    },
  },

  // ── deployStatus ──────────────────────────────────────────────────────────
  // In standalone/GitHub Pages mode, call the GitHub API directly from the browser.
  // The repo is public so no token is needed.
  deployStatus: {
    latest: {
      useQuery: (
        _?: unknown,
        opts?: { refetchInterval?: number; staleTime?: number }
      ) => {
        const [data, setData] = React.useState<{
          status: string;
          conclusion: string | null;
          runUrl: string;
          createdAt: Date | null;
          commitSha: string | null;
        } | null>(null);
        const [isLoading, setIsLoading] = React.useState(true);
        const [isError, setIsError] = React.useState(false);

        const fetchStatus = React.useCallback(async () => {
          try {
            const res = await fetch(
              "https://api.github.com/repos/community-prep/engineering-interview-guide/actions/workflows/1/runs?per_page=1",
              {
                headers: {
                  Accept: "application/vnd.github+json",
                  "X-GitHub-Api-Version": "2022-11-28",
                },
              }
            );
            if (!res.ok) throw new Error("GitHub API error");
            const json = await res.json();
            const run = json.workflow_runs?.[0];
            if (!run) throw new Error("No runs");
            setData({
              status: run.status,
              conclusion: run.conclusion,
              runUrl: run.html_url,
              createdAt: new Date(run.created_at),
              commitSha: run.head_sha?.slice(0, 7) ?? null,
            });
            setIsError(false);
          } catch {
            setIsError(true);
          } finally {
            setIsLoading(false);
          }
        }, []);

        React.useEffect(() => {
          fetchStatus();
          const interval = opts?.refetchInterval;
          if (interval) {
            const id = setInterval(fetchStatus, interval);
            return () => clearInterval(id);
          }
        }, [fetchStatus, opts?.refetchInterval]);

        return { data, isLoading, isError };
      },
    },
  },

  // ── sprintPlan (no-op in standalone) ──────────────────────────────────────
  sprintPlan: {
    generate: {
      useMutation: () =>
        makeMutation(() => ({
          planData: {
            title: "⚠️ Sprint Plan requires the online version",
            summary:
              "Sign in at the Manus app to generate your personalized 7-day sprint plan.",
            targetLevel: "L6",
            timeline: "3-4 weeks",
            days: [],
            keyMetrics: {
              totalHours: 0,
              codingHours: 0,
              behavioralHours: 0,
              systemDesignHours: 0,
            },
            successCriteria: [],
          },
        })),
    },
    save: {
      useMutation: () => makeMutation(() => ({ planId: "", shareToken: "" })),
    },
    getShared: {
      useQuery: () => makeQuery(null),
    },
  },

  // ── feedback (no-op in standalone) ───────────────────────────────────────
  feedback: {
    submitGeneral: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    submitSprintFeedback: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    adminGetAll: {
      useQuery: () => makeQuery({ items: [], total: 0 }),
    },
    adminStats: {
      useQuery: () =>
        makeQuery({ byCategory: [], byType: [], total: 0, last7Days: 0 }),
    },
    triggerDigest: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    triggerDailyAlert: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    updateStatus: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    updateNote: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    markAllNew: {
      useMutation: () => makeMutation(() => ({ success: true, updated: 0 })),
    },
  },

  // ── userScores (no-op in standalone) ─────────────────────────────────────
  userScores: {
    load: {
      useQuery: () => makeQuery(null),
    },
    save: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    getAggregateStats: {
      useQuery: () =>
        makeQuery({ totalUsers: 0, patternAvgRatings: {}, bqAvgRatings: {} }),
    },
  },

  // ── favorites (no-op in standalone) ───────────────────────────────────────────────────────────────────
  favorites: {
    list: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    toggle: { useMutation: () => makeMutation(() => ({ success: true })) },
    remove: { useMutation: () => makeMutation(() => ({ success: true })) },
    updateNotes: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── progress (no-op in standalone) ───────────────────────────────────────────────────────────────────
  progress: {
    list: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── analytics (no-op in standalone) ───────────────────────────────────────────────────────────────────
  analytics: {
    trackSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    updateSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    startSession: {
      useMutation: () => makeMutation(() => ({ sessionId: "standalone" })),
    },
    endSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    trackPageView: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    trackEvent: { useMutation: () => makeMutation(() => ({ success: true })) },
    sendReportNow: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    dauTrend: { useQuery: () => ({ data: { trend: [] }, isLoading: false }) },
    featureClicksToday: {
      useQuery: () => ({ data: { counts: {} }, isLoading: false }),
    },
    adminReport: {
      useQuery: () => ({
        data: {
          sessions: [],
          pageViews: [],
          topEvents: [],
          deviceBreakdown: [],
          browserBreakdown: [],
          top3Unactioned: [],
          summary: {
            totalSessions: 0,
            uniqueVisitors: 0,
            totalPageViews: 0,
            avgSessionMinutes: 0,
            totalHours: 0,
          },
        },
        isLoading: false,
        refetch: () => {},
      }),
    },
  },

  // ── siteAccess ─────────────────────────────────────────────────────────────────────────────
  // In standalone mode, the disclaimer is always enabled (gate uses localStorage).
  // All admin/owner procedures are no-ops.
  siteAccess: {
    checkAccess: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({
          locked: false,
          reason: "no_expiry" as const,
          message: null,
          daysRemaining: null,
        }),
    },
    getDisclaimerEnabled: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ enabled: true }),
    },
    setDisclaimerEnabled: {
      useMutation: () => makeMutation(() => ({ success: true, enabled: true })),
    },
    getSettings: {
      useQuery: () => makeQuery(null),
    },
    updateSettings: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    cohortReset: {
      useMutation: () =>
        makeMutation(() => ({
          success: true,
          newStartDate: new Date().toISOString().slice(0, 10),
        })),
    },
  },

  // ── adminUsers ─────────────────────────────────────────────────────────────────────────────
  // All admin procedures are owner-only and not available in standalone mode.
  // These stubs prevent crashes when navigating to /admin/users on the static build.
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
    blockUser: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    unblockUser: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    reBlockUser: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    extendBlock: {
      useMutation: () =>
        makeMutation(() => ({ success: true, newBlockedUntil: null })),
    },
    exportAuditLogCsv: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ csv: "" }),
    },
    listEvents: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    checkInactiveUsers: {
      useMutation: () => makeMutation(() => ({ notified: false, count: 0 })),
    },
  },

  // ── aiCodingMock ─────────────────────────────────────────────────────────────────────────────
  // AI-enabled coding mock requires server; return empty data in standalone mode
  aiCodingMock: {
    getProblems: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    chat: {
      useMutation: () =>
        makeMutation(() => ({
          content:
            "⚠️ AI Coding Mock requires the online version at metaengguide.pro",
        })),
    },
    scorePhase: {
      useMutation: () =>
        makeMutation(() => ({
          problemSolving: 0,
          codeDevelopment: 0,
          verificationDebugging: 0,
          technicalCommunication: 0,
          phaseVerdict: "⚠️ AI scoring requires the online version.",
          aiUsageAssessment: "",
          keyStrengths: [],
          keyImprovements: [],
          summary: "⚠️ AI scoring requires the online version.",
        })),
    },
    scoreSession: {
      useMutation: () =>
        makeMutation(() => ({
          hiringRecommendation: "⚠️ AI scoring requires the online version.",
          levelAssessment: "",
          executiveSummary: "",
          dimensionScores: {},
          aiCollaborationScore: "",
          strengths: [],
          gaps: [],
          nextSteps: [],
        })),
    },
  },

  // ── aiTraining ────────────────────────────────────────────────────────────────────────────────────
  aiTraining: {
    getHallucinationScenarios: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    checkHallucinationAnswer: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          correct: false,
          score: 1,
          feedback: "",
          hint: "",
        })),
    },
    getClarificationScenarios: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    scoreClarificationQuestions: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          score: 1,
          coverage: 1,
          prioritization: 1,
          missedQuestions: [],
          feedback: "",
          strongPoints: [],
        })),
    },
    getComplexityFlashcards: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    checkComplexityAnswer: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          timeCorrect: false,
          spaceCorrect: false,
          correctTimeComplexity: "",
          correctSpaceComplexity: "",
          explanation: "",
          score: 1,
        })),
    },
    getNavigationChallenges: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    checkNavigationAnswer: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          correct: false,
          feedback: "",
          correctAnswer: "",
          fileHint: "",
          lineHint: 0,
        })),
    },
    scoreExplanation: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          clarity: 1,
          structure: 1,
          correctness: 1,
          overall: 1,
          feedback: "",
          improvements: [],
          strongPoints: [],
        })),
    },
    scoreTechnicalCommunication: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          score: 1,
          levelSignal: "",
          proactiveCommunication: 1,
          tradeoffExplanation: 1,
          complexityExplanation: 1,
          feedback: "",
          improvements: [],
        })),
    },
    getIncrementalChallenges: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    submitIncrementalStep: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          passed: false,
          score: 1,
          feedback: "",
          issues: [],
        })),
    },
    getTestFirstChallenges: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    submitTestFirstFix: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          passed: false,
          score: 1,
          feedback: "",
          testResults: [],
        })),
    },
    scoreVerbalExplanation: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          overall: 1,
          clarity: 1,
          conciseness: 1,
          technicalDepth: 1,
          structureScore: 1,
          feedback: "",
          metaRubricAlignment: "",
          improvements: [],
        })),
    },
    scoreRAGExplanation: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          overall: 1,
          correctness: 1,
          succinctness: 1,
          caveats: 1,
          audienceAdaptation: 1,
          feedback: "",
          strongPoints: [],
          improvements: [],
        })),
    },
    scoreAIStack: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          modelLayer: 1,
          toolingLayer: 1,
          workflowLayer: 1,
          lessonsLearned: 1,
          overall: 1,
          maturityLevel: "",
          feedback: "",
          strongPoints: [],
          improvements: [],
        })),
    },
    scoreAgentEvalDesign: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          taskSuccess: 1,
          hallucinationHandling: 1,
          latencyCost: 1,
          safetyConsiderations: 1,
          overallRigor: 1,
          feedback: "",
          missingDimensions: [],
          strongPoints: [],
        })),
    },
    scoreBottleneckAnalysis: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          dataLayer: 1,
          governanceLayer: 1,
          peopleLayer: 1,
          infraLayer: 1,
          systemsThinking: 1,
          treatsAIAsBlackBox: false,
          feedback: "",
          missedLayers: [],
          strongPoints: [],
        })),
    },
    scoreHumanInLoop: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          safetyRisk: 1,
          hitlMechanism: 1,
          policyCompliance: 1,
          transparentPractices: 1,
          overall: 1,
          feedback: "",
          gaps: [],
          strongPoints: [],
        })),
    },
    scoreEpistemicHumility: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          specificity: 1,
          beliefUpdate: 1,
          failureAcknowledgment: 1,
          learningVelocity: 1,
          overall: 1,
          soundsRehearsed: false,
          feedback: "",
          strongPoints: [],
          improvements: [],
        })),
    },
    scoreMetaValuesAlignment: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          moveFast: 1,
          beOpen: 1,
          focusOnImpact: 1,
          buildAwesomeThings: 1,
          overall: 1,
          verdicts: {} as Record<string, string>,
          overallVerdict: "",
          topStrength: "",
          topGap: "",
        })),
    },
    scoreMaturityClassification: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          fluencyAssessedLevel: "",
          impactAssessedLevel: "",
          responsibleAIAssessedLevel: "",
          continuousLearningAssessedLevel: "",
          overallAssessedLevel: "",
          claimedVsActualGap: "",
          gapAnalysis: "",
          whatAINativeLooksLike: "",
          nextSteps: [] as string[],
        })),
    },
    scoreMockScreeningPhase: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          phaseScore: 1,
          maturityTierSignal: "",
          rubricAxis: "",
          axisScore: 1,
          feedback: "",
          strongSignals: [] as string[],
          weakSignals: [] as string[],
          coachingNote: "",
        })),
    },
  },

  // ── aiNativeHistory ──────────────────────────────────────────────────────────────────────────────────
  aiNativeHistory: {
    saveDrillScore: {
      useMutation: (_?: unknown) => makeMutation(() => ({ id: 1 })),
    },
    saveMaturityLevel: {
      useMutation: (_?: unknown) => makeMutation(() => ({ success: true })),
    },
    saveMockSession: {
      useMutation: (_?: unknown) => makeMutation(() => ({ id: 1 })),
    },
    getMockHistory: {
      useQuery: (_?: unknown) => makeQuery([]),
    },
    deleteMockSession: {
      useMutation: (_?: unknown) => makeMutation(() => ({ success: true })),
    },
    getBestScoresByDrill: {
      useQuery: (_?: unknown) => makeQuery([]),
    },
    getMaturityLevel: {
      useQuery: (_?: unknown) => makeQuery(null),
    },
  },

  // ── drillSessions ─────────────────────────────────────────────────────────────────────────────────
  drillSessions: {
    saveSession: {
      useMutation: (_?: unknown) => makeMutation(() => ({ id: 1 })),
    },
    getBestScoresByWeek: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    evaluatePersonaTurn: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          content: JSON.stringify({
            challenge: "⚠️ AI Persona Stress Test requires the online version.",
            score: 0,
            feedback: "AI features are not available in the static build.",
            betterResponse: "",
          }),
        })),
    },
    generatePersonaScorecard: {
      useMutation: (_?: unknown) =>
        makeMutation(() => ({
          content: JSON.stringify({
            overallScore: 0,
            resilienceRating: "N/A",
            strengths: [],
            weaknesses: [],
            summary: "⚠️ AI scoring requires the online version.",
          }),
        })),
    },
  },

  // ── system ──────────────────────────────────────────────────────────────────────────────────────────
  system: {
    notifyOwner: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── useUtils (no-op) ────────────────────────────────────────────────────────────────────────────────
  useUtils: () => ({
    disclaimer: { status: { invalidate: () => {} } },
    ratings: { getAll: { invalidate: () => {} } },
    ctciProgress: { get: { invalidate: () => {} } },
    onboarding: { get: { invalidate: () => {} } },
    leaderboard: { getTop: { invalidate: () => {} } },
    siteAccess: { getDisclaimerEnabled: { invalidate: () => {} } },
    aiCodingMock: { getProblems: { invalidate: () => {} } },
    adminUsers: {
      listUsers: { invalidate: () => {} },
      listEvents: { invalidate: () => {} },
    },
  }),

  // ── Provider (passthrough) ────────────────────────────────────────────────────────────────
  Provider: ({ children }: { children: React.ReactNode }) => children,
  createClient: () => ({}),
};

export default trpc;
