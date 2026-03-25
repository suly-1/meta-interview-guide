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
 * - localStorage admin tokens are cleared for non-owners so stale tokens
 *   cannot be used to bypass the gate on future visits.
 *
 * Layer 2: PIN gate — after OAuth passes, a PIN modal is shown.
 * The PIN token is stored in React state only (clears on tab close).
 *
 * Session Lock: A floating "Lock session" button is rendered in the bottom-right
 * corner of all admin pages. Clicking it clears the PIN token from React state,
 * forcing re-entry of the PIN without a full page refresh.
 */

import { trpc } from "@/lib/trpc";
import { clearAdminToken } from "@/lib/adminToken";
import { usePinGate } from "@/contexts/PinGateContext";
import PinGateModal, { PinExpiryToast } from "@/components/PinGateModal";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, LogIn, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

interface AdminGateProps {
  children: React.ReactNode;
}

// Detect standalone (static GitHub Pages) build — no server available
const IS_STANDALONE = import.meta.env.VITE_STANDALONE === "true";

/**
 * SessionLockButton — floating button in the bottom-right corner.
 * Clears the PIN token from React state immediately, forcing re-entry.
 */
function SessionLockButton() {
  const { clearPinToken } = usePinGate();
  const [confirmLock, setConfirmLock] = useState(false);

  if (confirmLock) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 border border-red-800/60 rounded-xl shadow-2xl px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <LockKeyhole size={14} className="text-red-400 flex-shrink-0" />
        <span className="text-xs text-gray-300">Lock this session?</span>
        <button
          onClick={() => {
            clearPinToken();
            setConfirmLock(false);
          }}
          className="ml-1 px-3 py-1 text-xs font-bold bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Lock
        </button>
        <button
          onClick={() => setConfirmLock(false)}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmLock(true)}
      title="Lock admin session — requires PIN re-entry"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700/60 hover:border-red-700/60 text-gray-500 hover:text-red-400 rounded-xl shadow-lg transition-all duration-200 text-xs font-medium group"
    >
      <LockKeyhole size={13} className="transition-colors" />
      <span className="hidden sm:inline">Lock session</span>
    </button>
  );
}

export default function AdminGate({ children }: AdminGateProps) {
  const [, navigate] = useLocation();
  const { pinToken } = usePinGate();

  const { data, isLoading, error } = trpc.auth.isOwner.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
    // In standalone mode, skip the query entirely — we know there's no server
    enabled: !IS_STANDALONE,
  });

  const isOwner = !IS_STANDALONE && data?.isOwner === true;

  // Clear stale localStorage token for non-owners
  useEffect(() => {
    if (!isLoading && !isOwner) {
      clearAdminToken();
    }
  }, [isLoading, isOwner]);

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
            className="w-full max-w-xs text-gray-300 border-gray-700 hover:bg-gray-800"
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
              className="w-full max-w-xs text-gray-300 border-gray-700 hover:bg-gray-800"
              onClick={() => navigate("/")}
            >
              Back to guide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Layer 2: PIN gate ────────────────────────────────────────────────────
  // Owner is confirmed. Now require a valid PIN token in React state.
  // PinGateModal handles submission and stores the token via PinGateContext.
  if (!pinToken) {
    return <PinGateModal />;
  }

  // ── Both layers passed — render admin content ────────────────────────────
  return (
    <>
      {children}
      <PinExpiryToast />
      <SessionLockButton />
    </>
  );
}
