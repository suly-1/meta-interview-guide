import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CollabRoom from "@/pages/CollabRoom";
import AdminDisclaimerReport from "@/pages/AdminDisclaimerReport";
import AdminFeedback from "@/pages/AdminFeedback";
import AdminStats from "@/pages/AdminStats";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminAccess from "@/pages/AdminAccess";
import AccessGate from "@/components/AccessGate";
import AdminUsers from "@/pages/AdminUsers";
import BlockedScreen from "@/components/BlockedScreen";
import AdminPinGate from "@/components/AdminPinGate";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/room/:roomId" component={CollabRoom} />
      <Route path="/admin/disclaimer">
        <AdminPinGate>
          <AdminDisclaimerReport />
        </AdminPinGate>
      </Route>
      <Route path="/admin/feedback">
        <AdminPinGate>
          <AdminFeedback />
        </AdminPinGate>
      </Route>
      <Route path="/admin/stats">
        <AdminPinGate>
          <AdminStats />
        </AdminPinGate>
      </Route>
      <Route path="/admin/analytics">
        <AdminPinGate>
          <AdminAnalytics />
        </AdminPinGate>
      </Route>
      <Route path="/admin/access">
        <AdminPinGate>
          <AdminAccess />
        </AdminPinGate>
      </Route>
      <Route path="/admin/users">
        <AdminPinGate>
          <AdminUsers />
        </AdminPinGate>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function BlockedGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  // If user is loaded and has blocked flag set, show the blocked screen
  if (!loading && user && (user as { blocked?: number }).blocked === 1) {
    return <BlockedScreen />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <BlockedGate>
            <AccessGate>
              <Router />
            </AccessGate>
          </BlockedGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
