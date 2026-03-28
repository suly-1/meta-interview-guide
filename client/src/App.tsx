import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect, lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import VersionUpdateToast from "./components/VersionUpdateToast";
import InviteGate from "./components/InviteGate";

// Admin pages — lazy-loaded so they don't bloat the initial bundle
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminStats = lazy(() => import("./pages/AdminStats"));
const AdminDisclaimerReport = lazy(
  () => import("./pages/AdminDisclaimerReport")
);
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminInviteCodes = lazy(() => import("./pages/AdminInviteCodes"));
const AdminSessions = lazy(() => import("./pages/AdminSessions"));
const AdminDocs = lazy(() => import("./pages/AdminDocs"));
const Changelog = lazy(() => import("./pages/Changelog"));
const AdminHub = lazy(() => import("./pages/AdminHub"));

// Inject site identity onto <body> so CSS overrides in index.css can target it.
// "metaengguide-pro" → deep blue + gold (default, no attribute needed)
// "metaguide-blog"   → warm green + amber
const SITE_ID = import.meta.env.VITE_SITE_ID ?? "metaengguide-pro";

function SiteIdentityInjector() {
  useEffect(() => {
    if (SITE_ID && SITE_ID !== "metaengguide-pro") {
      document.body.setAttribute("data-site", SITE_ID);
    } else {
      document.body.removeAttribute("data-site");
    }
  }, []);
  return null;
}

function Router() {
  return (
    <Suspense fallback={null}>
      <Switch>
        {/* Main app */}
        <Route path={"/"} component={Home} />

        {/* Public pages */}
        <Route path={"/changelog"} component={Changelog} />

        {/* Admin hub — single entry point */}
        <Route path={"/admin"} component={AdminHub} />

        {/* Admin pages — all protected by AdminPinGate inside each page */}
        <Route path={"/admin/feedback"} component={AdminFeedback} />
        <Route path={"/admin/analytics"} component={AdminAnalytics} />
        <Route path={"/admin/access"} component={AdminAccess} />
        <Route path={"/admin/users"} component={AdminUsers} />
        <Route path={"/admin/stats"} component={AdminStats} />
        <Route
          path={"/admin/disclaimer-report"}
          component={AdminDisclaimerReport}
        />
        <Route path={"/admin/settings"} component={AdminSettings} />
        <Route path={"/admin/invite-codes"} component={AdminInviteCodes} />
        <Route path={"/admin/sessions"} component={AdminSessions} />
        <Route path={"/admin/docs"} component={AdminDocs} />

        {/* Fallback */}
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <InviteGate>
          <TooltipProvider>
            <SiteIdentityInjector />
            <Toaster />
            <VersionUpdateToast />
            <Router />
          </TooltipProvider>
        </InviteGate>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
