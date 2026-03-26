/**
 * SectionErrorBoundary — lightweight inline error boundary for individual
 * AI-powered sections. Unlike the global ErrorBoundary (full-page takeover),
 * this renders a compact error card so one failing component cannot crash
 * the entire tab.
 *
 * Features:
 * - "Try Again" button that resets the boundary (up to MAX_RETRIES attempts)
 * - Brief loading flash on retry so the child remounts cleanly
 * - Collapsible technical details for debugging
 * - Retry counter shown after the first failure
 */
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Component, ReactNode } from "react";

const MAX_RETRIES = 3;

interface Props {
  children: ReactNode;
  /** Human-readable label shown in the error card, e.g. "AI Mock Session" */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
  showDetails: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, isRetrying: false };
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) return;

    // Show a brief loading state so the child fully unmounts before remounting
    this.setState({ isRetrying: true }, () => {
      this.retryTimer = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          isRetrying: false,
          retryCount: prev.retryCount + 1,
          showDetails: false,
        }));
      }, 400);
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    const { hasError, error, retryCount, isRetrying, showDetails } = this.state;
    const label = this.props.label ?? "This section";
    const exhausted = retryCount >= MAX_RETRIES;

    // Brief loading flash during retry
    if (isRetrying) {
      return (
        <div className="rounded-xl border border-border bg-secondary/20 p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 size={16} className="animate-spin" />
          Reloading {label}…
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={16}
              className="shrink-0 text-rose-400 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-400">
                {label} encountered an error
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Retry attempt {retryCount} of {MAX_RETRIES} failed.
                </p>
              )}
              {exhausted && (
                <p className="text-xs text-rose-300/70 mt-0.5">
                  Maximum retries reached. Try refreshing the page.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!exhausted && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
              >
                <RefreshCw size={12} />
                Try Again
                {retryCount > 0 ? ` (${MAX_RETRIES - retryCount} left)` : ""}
              </button>
            )}
            {error && (
              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
                {showDetails ? "Hide" : "Show"} details
              </button>
            )}
          </div>

          {/* Collapsible error details */}
          {showDetails && error && (
            <pre className="text-xs text-muted-foreground bg-secondary/40 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap border border-border">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
