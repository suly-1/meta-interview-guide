/**
 * TabErrorBoundary — a scoped error boundary for individual tabs.
 *
 * When a tab crashes, only that tab shows the error fallback.
 * All other tabs remain fully functional. Users can switch tabs
 * immediately and retry the broken tab at any time.
 *
 * Usage:
 *   <TabErrorBoundary tabName="Coding Interview">
 *     <CodingTab />
 *   </TabErrorBoundary>
 */

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console for debugging — in production you could send to a logging service
    console.error(`[TabErrorBoundary] Tab "${this.props.tabName ?? "unknown"}" crashed:`, error, info);
    this.setState({ errorInfo: info.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { tabName } = this.props;
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">
            {tabName ? `${tabName} encountered an error` : "This section encountered an error"}
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm">
            Other tabs are unaffected. You can switch tabs now and retry this one at any time.
          </p>
          {/* Collapsed error details for debugging */}
          <details className="mb-5 w-full max-w-lg text-left">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors">
              Show error details
            </summary>
            <pre className="mt-2 text-xs text-red-400 bg-gray-950 rounded-xl p-4 overflow-auto max-h-40 border border-gray-800">
              {this.state.error?.message}
              {"\n"}
              {this.state.error?.stack?.split("\n").slice(0, 8).join("\n")}
            </pre>
          </details>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors border border-gray-700"
          >
            <RefreshCw size={14} />
            Retry {tabName ?? "this tab"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TabErrorBoundary;
