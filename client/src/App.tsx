import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { XPProvider } from "./contexts/XPContext";
import { DensityProvider } from "./contexts/DensityContext";
import { ICLevelProvider } from "./contexts/ICLevelContext";
import Home from "./pages/Home";
import CandidateDiscovery from "@/pages/CandidateDiscovery";
import TermsOfUse from "@/pages/TermsOfUse";
import SharedPlanView from "@/pages/SharedPlanView";
import AdminFeedback from "@/pages/AdminFeedback";
import AdminDisclaimerReport from "@/components/AdminDisclaimerReport";
import AdminUsers from "@/pages/AdminUsers";
import AdminSettings from "@/pages/AdminSettings";
import AdminStats from "@/pages/AdminStats";
import DisclaimerGate, { useDisclaimerGate } from "./components/DisclaimerGate";
import PatternUnlockCelebration from "./components/PatternUnlockCelebration";
import { FocusModeProvider } from "./components/FocusMode";
import { useAuth } from "./_core/hooks/useAuth";
import { ShieldOff } from "lucide-react";
import SiteLockGate from "./components/SiteLockGate";

function BannedGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && (user as { isBanned?: number | boolean }).isBanned) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Revoked</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your access to this guide has been revoked by the administrator.
            If you believe this is a mistake, please contact the site owner.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function DisclaimerGateWrapper({ children }: { children: React.ReactNode }) {
  const { gateOpen, initializing, confirm } = useDisclaimerGate();
  // While auth/DB check is in-flight, render nothing — no gate, no spinner
  if (initializing) return null;
  if (gateOpen) return <DisclaimerGate onConfirm={confirm} />;
  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ICLevelProvider>
      <DensityProvider>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <XPProvider>
          <FocusModeProvider>
          <TooltipProvider>
            <Toaster />
            {/* Use hash-based routing so the standalone HTML file works without a server */}
            <Router hook={useHashLocation}>
              <BannedGate>
              <SiteLockGate>
              <Switch>
                {/* /discover is accessible without DisclaimerGate — it IS the discovery page */}
                <Route path="/discover" component={CandidateDiscovery} />
        <Route path="/terms" component={TermsOfUse} />
        <Route path="/shared-plan/:token" component={SharedPlanView} />
        <Route path="/admin/feedback" component={AdminFeedback} />
        <Route path="/admin/disclaimer" component={AdminDisclaimerReport} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/stats" component={AdminStats} />
                {/* All other routes go through DisclaimerGate */}
                <Route>
                  <DisclaimerGateWrapper>
                    <AppRouter />
                    <PatternUnlockCelebration />
                  </DisclaimerGateWrapper>
                </Route>
              </Switch>
              </SiteLockGate>
              </BannedGate>
            </Router>
          </TooltipProvider>
          </FocusModeProvider>
        </XPProvider>
      </ThemeProvider>
      </DensityProvider>
      </ICLevelProvider>
    </ErrorBoundary>
  );
}

export default App;
