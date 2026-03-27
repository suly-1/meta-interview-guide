/**
 * pages.render.test.tsx
 *
 * Smoke-tests every page component by rendering it inside a minimal provider
 * tree and asserting it does not throw. This catches broken imports, missing
 * context providers, and component-level crashes before they reach users.
 *
 * Strategy:
 *   - Mock all tRPC hooks to return loading state (no real network calls)
 *   - Mock useAuth to return a logged-in admin user
 *   - Mock wouter's useLocation/useRoute so routing doesn't break
 *   - Each test just asserts the component mounts without throwing
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

// ── Global mocks ─────────────────────────────────────────────────────────────

// Mock useAuth so pages don't need a real OAuth session
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      openId: "owner-open-id",
    },
    loading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

// Mock wouter hooks to avoid router context issues
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useLocation: () => ["/", vi.fn()],
    useRoute: () => [false, {}],
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
    // MemoryRouter is not exported by wouter; use the real Router with memoryHistory
    MemoryRouter: undefined,
  };
});

// Mock analytics hook to avoid real tracking
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ trackEvent: vi.fn(), trackPageView: vi.fn() }),
}));

// Mock route helper
vi.mock("@/const", async () => {
  const actual = await vi.importActual<typeof import("@/const")>("@/const");
  return { ...actual, route: (path: string) => path };
});

// ── Provider wrapper ─────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        transformer: superjson,
      }),
    ],
  });
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" switchable>
          <Router hook={memoryLocation({ path: "/" }).hook}>{children}</Router>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function renderPage(Component: React.ComponentType) {
  return render(
    <Wrapper>
      <Component />
    </Wrapper>
  );
}

// ── Page tests ───────────────────────────────────────────────────────────────

describe("Page render smoke tests", () => {
  beforeEach(() => {
    localStorage.clear();
    // Suppress expected console.error from tRPC network errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("NotFound renders without throwing", async () => {
    const { default: NotFound } = await import("@/pages/NotFound");
    expect(() => renderPage(NotFound)).not.toThrow();
  });

  it("AdminFeedback renders without throwing", async () => {
    const { default: AdminFeedback } = await import("@/pages/AdminFeedback");
    expect(() => renderPage(AdminFeedback)).not.toThrow();
  });

  it("AdminUsers renders without throwing", async () => {
    const { default: AdminUsers } = await import("@/pages/AdminUsers");
    expect(() => renderPage(AdminUsers)).not.toThrow();
  });

  it("AdminAccess renders without throwing", async () => {
    const { default: AdminAccess } = await import("@/pages/AdminAccess");
    expect(() => renderPage(AdminAccess)).not.toThrow();
  });

  it("AdminStats renders without throwing", async () => {
    const { default: AdminStats } = await import("@/pages/AdminStats");
    expect(() => renderPage(AdminStats)).not.toThrow();
  });

  it("AdminAnalytics renders without throwing", async () => {
    const { default: AdminAnalytics } = await import("@/pages/AdminAnalytics");
    expect(() => renderPage(AdminAnalytics)).not.toThrow();
  });

  it("AdminDisclaimerReport renders without throwing", async () => {
    const { default: AdminDisclaimerReport } = await import(
      "@/pages/AdminDisclaimerReport"
    );
    expect(() => renderPage(AdminDisclaimerReport)).not.toThrow();
  });
});

// ── New AI component smoke tests ─────────────────────────────────────────────
describe("New AI component smoke tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("AICodingSimulator renders without throwing", async () => {
    const { AICodingSimulator } = await import(
      "@/components/AICodingSimulator"
    );
    expect(() =>
      render(
        <Wrapper>
          <AICodingSimulator />
        </Wrapper>
      )
    ).not.toThrow();
  });

  it("DebuggingUnderPressure renders without throwing", async () => {
    const { DebuggingUnderPressure } = await import(
      "@/components/DebuggingUnderPressure"
    );
    expect(() =>
      render(
        <Wrapper>
          <DebuggingUnderPressure />
        </Wrapper>
      )
    ).not.toThrow();
  });

  it("ICLevelSignalCalibrator renders without throwing", async () => {
    const { ICLevelSignalCalibrator } = await import(
      "@/components/ICLevelSignalCalibrator"
    );
    expect(() =>
      render(
        <Wrapper>
          <ICLevelSignalCalibrator />
        </Wrapper>
      )
    ).not.toThrow();
  });

  it("MetaProductDesignSimulator renders without throwing", async () => {
    const { MetaProductDesignSimulator } = await import(
      "@/components/MetaProductDesignSimulator"
    );
    expect(() =>
      render(
        <Wrapper>
          <MetaProductDesignSimulator />
        </Wrapper>
      )
    ).not.toThrow();
  });

  it("PassFailVerdictEngine renders without throwing", async () => {
    const { PassFailVerdictEngine } = await import(
      "@/components/PassFailVerdictEngine"
    );
    expect(() =>
      render(
        <Wrapper>
          <PassFailVerdictEngine />
        </Wrapper>
      )
    ).not.toThrow();
  });

  it("HowToUseTab renders without throwing", async () => {
    const { default: HowToUseTab } = await import("@/components/HowToUseTab");
    expect(() =>
      render(
        <Wrapper>
          <HowToUseTab />
        </Wrapper>
      )
    ).not.toThrow();
  });
});
