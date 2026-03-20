import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // In standalone mode the server is not available; treat errors as "not logged in"
    throwOnError: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore errors in standalone mode
    } finally {
      utils.auth.me.setData(undefined, null);
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: false, // Never block UI waiting for auth in standalone mode
      error: null,    // Never surface auth errors
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [meQuery.data]);

  // NEVER redirect to login in standalone mode
  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
