import { trpc } from "@/lib/trpc";
import { Lock, Calendar, Shield } from "lucide-react";

interface SiteLockGateProps {
  children: React.ReactNode;
}

export default function SiteLockGate({ children }: SiteLockGateProps) {
  const { data, isLoading } = trpc.siteSettings.getLockStatus.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Treat API errors as "not locked" (standalone mode)
    throwOnError: false,
  });

  // While loading or in standalone mode (no server), show content normally
  if (isLoading || !data) return <>{children}</>;

  // Owner always bypasses the lock
  if (data.isOwner) return <>{children}</>;

  // Not locked — show content normally
  if (!data.isLocked) return <>{children}</>;

  // Site is locked — show the closed screen
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Lock icon */}
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-gray-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          This Guide Is Currently Closed
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          The L4/L7 Community Study Resource has reached the end of its current cohort period.
          The guide is periodically opened for new cohorts of candidates.
        </p>

        {/* Info card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={15} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-gray-700 font-medium">Cohort Period</p>
              <p className="text-gray-700 text-xs">
                {data.lockStartDate
                  ? `Started ${new Date(data.lockStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                  : "Cohort period has ended"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield size={15} className="text-amber-900 flex-shrink-0" />
            <div>
              <p className="text-gray-700 font-medium">Access Policy</p>
              <p className="text-gray-700 text-xs">
                Access is managed by the guide administrator. Contact them for the next cohort opening.
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-gray-600 text-xs">
          If you believe you should have access, please contact the administrator.
        </p>
      </div>
    </div>
  );
}
