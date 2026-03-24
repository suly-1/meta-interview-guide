/**
 * Standalone App — uses hash-based routing so it works from any CDN URL.
 * e.g. https://cdn.example.com/guide.html#/ instead of /
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminFeedback from "@/pages/AdminFeedback";
import AdminStats from "@/pages/AdminStats";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminAccess from "@/pages/AdminAccess";
import AdminUsers from "@/pages/AdminUsers";
import AdminDisclaimerReport from "@/pages/AdminDisclaimerReport";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Admin routes — data is mock/empty in standalone mode */}
      <Route path="/admin/feedback" component={AdminFeedback} />
      <Route path="/admin/stats" component={AdminStats} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/access" component={AdminAccess} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/disclaimer" component={AdminDisclaimerReport} />
      {/* Fallback */}
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          {/* Use hash location so the app works from any CDN path */}
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
