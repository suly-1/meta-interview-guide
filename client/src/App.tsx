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
import CandidateDiscovery from "./pages/CandidateDiscovery";
import DisclaimerGate from "./components/DisclaimerGate";
import PatternUnlockCelebration from "./components/PatternUnlockCelebration";
import { FocusModeProvider } from "./components/FocusMode";

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
              <Switch>
                {/* /discover is accessible without DisclaimerGate — it IS the discovery page */}
                <Route path="/discover" component={CandidateDiscovery} />
                {/* All other routes go through DisclaimerGate */}
                <Route>
                  <DisclaimerGate>
                    <AppRouter />
                    <PatternUnlockCelebration />
                  </DisclaimerGate>
                </Route>
              </Switch>
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
