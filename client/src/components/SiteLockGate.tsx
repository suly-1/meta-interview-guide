/**
 * SiteLockGate — blocks access when the site is manually locked or the cohort
 * window has expired. Reads /api/trpc/siteSettings.getStatus (public procedure).
 *
 * Admin routes are excluded from this gate — they are registered before
 * SiteLockGate in App.tsx so admins can always unlock the site.
 */
import { trpc } from "@/lib/trpc";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";

interface SiteLockGateProps {
  children: React.ReactNode;
}

export default function SiteLockGate({ children }: SiteLockGateProps) {
  const [location] = useLocation();
  const { data, isLoading } = trpc.siteSettings.getStatus.useQuery();

  // Always allow admin routes through
  if (
    location.startsWith("/admin") ||
    location.startsWith("/discover") ||
    location.startsWith("/changelog")
  ) {
    return <>{children}</>;
  }

  if (isLoading) return <>{children}</>;

  if (data?.locked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {data.reason === "expired"
                ? "Cohort Window Closed"
                : "Site Temporarily Unavailable"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {(data as { message?: string }).message ??
                "This site is currently locked. Please check back later."}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            If you are an admin, navigate to{" "}
            <a
              href="/#/admin/settings"
              className="underline text-foreground hover:text-primary"
            >
              Admin Settings
            </a>{" "}
            to unlock the site.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
