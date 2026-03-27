/**
 * AdminGate — enforces that only the site owner (OWNER_OPEN_ID) can access
 * any /admin/* route.
 *
 * Security model:
 * - In STANDALONE mode (static GitHub Pages build): blocks ALL access unconditionally.
 *   There is no server to verify ownership, so the admin panel cannot be used.
 * - In LIVE mode (Manus-hosted server build): calls trpc.auth.isOwner (protectedProcedure).
 *   The server compares ctx.user.openId === ENV.ownerOpenId.
 *   If the user is not logged in, the protectedProcedure throws UNAUTHORIZED
 *   and the query error is treated as "not owner".
 *
 * No PIN required — authentication is handled entirely by Manus OAuth.
 * Only the account whose openId matches OWNER_OPEN_ID can pass this gate.
 */

import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ShieldAlert, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

interface AdminGateProps {
  children: React.ReactNode;
}

// Detect standalone (static GitHub Pages) build — no server available
const IS_STANDALONE = import.meta.env.VITE_STANDALONE === "true";

export default function AdminGate({ children }: AdminGateProps) {
  const [, navigate] = useLocation();

  const { data, isLoading, error } = trpc.auth.isOwner.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
    // In standalone mode, skip the query entirely — we know there's no server
    enabled: !IS_STANDALONE,
  });

  const isOwner = !IS_STANDALONE && data?.isOwner === true;

  // Standalone build: always block — no server to verify ownership
  if (IS_STANDALONE) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Admin Access Restricted</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            The admin panel is only accessible on the live hosted version of this site.
            This static build does not support admin features.
          </p>
          <Button
            variant="outline"
            className="w-full max-w-xs text-gray-400 border-gray-700 hover:bg-gray-800"
            onClick={() => navigate("/")}
          >
            Back to guide
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    const isUnauthenticated =
      !data && (error as { data?: { code?: string } })?.data?.code === "UNAUTHORIZED";

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Admin Access Restricted</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {isUnauthenticated
              ? "You must be signed in with the owner account to access the admin panel."
              : "This area is restricted to the site owner only. Your account does not have admin privileges."}
          </p>
          <div className="flex flex-col gap-3 items-center">
            {isUnauthenticated && (
              <Button
                variant="default"
                className="w-full max-w-xs"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                <LogIn size={15} className="mr-2" />
                Sign in with owner account
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full max-w-xs text-gray-400 border-gray-700 hover:bg-gray-800"
              onClick={() => navigate("/")}
            >
              Back to guide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Owner confirmed via Manus OAuth — render admin content directly
  return <>{children}</>;
}
