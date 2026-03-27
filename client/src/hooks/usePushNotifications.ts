/**
 * usePushNotifications — manages browser push subscription lifecycle.
 *
 * Usage:
 *   const { supported, permission, subscribed, loading, enable, disable } = usePushNotifications();
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    staleTime: Infinity,
  });
  const { data: statusData, refetch: refetchStatus } = trpc.push.status.useQuery(undefined, {
    retry: false,
  });
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (statusData) setSubscribed(statusData.subscribed);
  }, [statusData]);

  const enable = useCallback(async () => {
    if (!supported || !vapidData?.publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Notification permission denied.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await subscribeMutation.mutateAsync({
        subscription: json,
        userAgent: navigator.userAgent.slice(0, 256),
      });

      setSubscribed(true);
      await refetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enable push notifications.");
    } finally {
      setLoading(false);
    }
  }, [supported, vapidData, subscribeMutation, refetchStatus]);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
      }
      setSubscribed(false);
      await refetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disable push notifications.");
    } finally {
      setLoading(false);
    }
  }, [unsubscribeMutation, refetchStatus]);

  return { supported, permission, subscribed, loading, error, enable, disable };
}
