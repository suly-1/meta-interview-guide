import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

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
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SiteIdentityInjector />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
