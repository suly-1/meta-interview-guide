/**
 * BannedGate — blocks access for users whose account has been banned.
 *
 * Reads the `blocked` flag from `trpc.auth.me`. If blocked, shows a full-screen
 * lock screen with the ban reason. Does not redirect — the user sees the gate
 * until the ban expires or is lifted by the admin.
 */
import { trpc } from "@/lib/trpc";
import { ShieldX } from "lucide-react";

interface BannedGateProps {
  children: React.ReactNode;
}

export default function BannedGate({ children }: BannedGateProps) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) return <>{children}</>;

  if (user && user.blocked === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Access Suspended
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your access to this site has been suspended.
              {user.blockReason && (
                <>
                  {" "}
                  Reason:{" "}
                  <span className="font-medium text-foreground">
                    {user.blockReason}
                  </span>
                </>
              )}
            </p>
            {(user as { blockedUntil?: string | Date | null }).blockedUntil && (
              <p className="text-xs text-muted-foreground">
                Your access will be restored on{" "}
                <span className="font-medium">
                  {new Date(
                    (
                      user as { blockedUntil?: string | Date | null }
                    ).blockedUntil!
                  ).toLocaleDateString()}
                </span>
                .
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact the site
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
