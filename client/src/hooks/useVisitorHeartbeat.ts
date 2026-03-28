/**
 * useVisitorHeartbeat
 * Fires a heartbeat to the server every 30 seconds so the admin dashboard
 * can show live visitor counts. The sessionId is stable per browser tab
 * (stored in sessionStorage so it resets on tab close).
 */
import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const HEARTBEAT_INTERVAL_MS = 30_000;

function getOrCreateSessionId(): string {
  const KEY = "vt_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function useVisitorHeartbeat(opts?: {
  inviteCode?: string;
  currentTab?: string;
}) {
  const heartbeat = trpc.visitorTracking.heartbeat.useMutation();
  const currentTabRef = useRef(opts?.currentTab);
  currentTabRef.current = opts?.currentTab;

  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    const fire = () => {
      heartbeat.mutate({
        sessionId,
        inviteCode: opts?.inviteCode,
        currentTab: currentTabRef.current,
      });
    };

    // Fire immediately on mount
    fire();

    const interval = setInterval(fire, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.inviteCode]);
}
