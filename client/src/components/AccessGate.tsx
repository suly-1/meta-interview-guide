/**
 * AccessGate — wraps the entire app.
 *
 * Behaviour:
 * - Calls siteAccess.checkAccess on load (public endpoint).
 * - If locked AND the current user is NOT the owner → shows a "closed" screen.
 * - Owner always bypasses the gate (checked via auth.isOwner).
 * - While loading, renders children (fail-open to avoid flash of lock screen).
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Lock, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

interface AccessGateProps {
  children: React.ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  const { user, loading: authLoading } = useAuth();

  // Check if current user is the owner — owner always bypasses the gate
  const { data: ownerData, isLoading: ownerLoading } =
    trpc.auth.isOwner.useQuery(undefined, {
      enabled: !!user,
      retry: false,
    });

  // Check site access state
  const { data: accessData, isLoading: accessLoading } =
    trpc.siteAccess.checkAccess.useQuery(undefined, {
      retry: false,
      staleTime: 30 * 1000, // re-check every 30s so lock changes take effect quickly
      refetchInterval: 60 * 1000, // poll every 60s in background
    });

  // While any loading is in progress, render children (fail-open)
  if (authLoading || accessLoading || (user && ownerLoading)) {
    return <>{children}</>;
  }

  // Owner always gets through
  if (user && ownerData?.isOwner) {
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
            {!user && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Are you the guide owner? Sign in to access.
                </p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In
                </Button>
              </div>
            )}
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
          <p className="text-xs text-muted-foreground/60">
            Meta Interview Prep Guide · IC6/IC7
          </p>
        </div>
      </div>
    );
  }

  // Site is open — render normally
  return <>{children}</>;
}
