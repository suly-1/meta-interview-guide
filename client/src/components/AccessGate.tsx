/**
 * AccessGate — wraps the entire app.
 *
 * Behaviour:
 * - Calls siteAccess.checkAccess on load (public endpoint).
 * - If locked AND the visitor does NOT have a valid admin PIN token → shows a "closed" screen.
 * - Admin PIN holders always bypass the gate.
 * - While loading, renders children (fail-open to avoid flash of lock screen).
 *
 * NOTE: No Manus OAuth / sign-in logic here. Access control is PIN-only.
 */
import { trpc } from "@/lib/trpc";
import { getAdminToken } from "@/components/AdminPinGate";
import { Lock, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessGateProps {
  children: React.ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  // Check site access state
  const { data: accessData, isLoading: accessLoading } =
    trpc.siteAccess.checkAccess.useQuery(undefined, {
      retry: false,
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    });

  // While loading, render children (fail-open)
  if (accessLoading) {
    return <>{children}</>;
  }

  // Admin PIN holders always bypass the gate
  if (getAdminToken()) {
    return <>{children}</>;
  }

  // Site is locked
  if (accessData?.locked) {
    const isExpired = accessData.reason === "expired";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              {isExpired ? (
                <Clock className="w-10 h-10 text-muted-foreground" />
              ) : (
                <Lock className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {isExpired ? "Access Window Closed" : "Guide Temporarily Closed"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {accessData.message}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground">
            Meta L4/L5/L6/L7 Interview Prep Guide
          </p>
        </div>
      </div>
    );
  }

  // Site is open — render normally
  return <>{children}</>;
}
