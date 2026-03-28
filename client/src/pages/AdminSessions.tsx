/**
 * AdminSessions — /admin/sessions
 * View and manage active invite-gate sessions: revoke, restore, purge old.
 */
import { trpc } from "@/lib/trpc";
import { getAdminToken } from "@/components/AdminPinGate";
import { route } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Monitor,
  ShieldOff,
  ShieldCheck,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NAV_LINKS = [
  { href: route("/admin/feedback"), label: "Feedback" },
  { href: route("/admin/analytics"), label: "Analytics" },
  { href: route("/admin/access"), label: "Access" },
  { href: route("/admin/users"), label: "Users" },
  { href: route("/admin/stats"), label: "Stats" },
  { href: route("/admin/invite-codes"), label: "Invite Codes" },
  { href: route("/admin/sessions"), label: "Sessions" },
  { href: route("/admin/settings"), label: "Settings" },
];

export default function AdminSessions() {
  const token = getAdminToken();
  const isAdmin = !!token;

  const {
    data: sessions,
    refetch,
    isLoading,
  } = trpc.inviteGate.listSessions.useQuery(undefined, { enabled: isAdmin });

  const revokeMutation = trpc.inviteGate.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("Session revoked");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const restoreMutation = trpc.inviteGate.restoreSession.useMutation({
    onSuccess: () => {
      toast.success("Session restored");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const purgeMutation = trpc.inviteGate.purgeOldSessions.useMutation({
    onSuccess: data => {
      toast.success(`Purged ${data.deleted} old sessions`);
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const activeSessions = sessions?.filter(s => !s.isRevoked) ?? [];
  const revokedSessions = sessions?.filter(s => s.isRevoked) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={route("/")}>
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </a>
          </Link>
          <Monitor size={18} className="text-blue-400" />
          <h1 className="text-lg font-semibold">Active Sessions</h1>
          <Badge variant="secondary" className="text-xs">
            {activeSessions.length} active
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-xs h-8"
            onClick={() => refetch()}
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              if (window.confirm("Purge all sessions older than 30 days?")) {
                purgeMutation.mutate();
              }
            }}
          >
            <Trash2 size={13} />
            Purge Old
          </Button>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}>
                <a className="hover:text-foreground transition-colors">
                  {l.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="container max-w-5xl py-8 space-y-6">
        {/* Active sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck size={16} className="text-emerald-400" />
              Active Sessions ({activeSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Loading…
              </p>
            ) : activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active sessions.
              </p>
            ) : (
              <div className="space-y-2">
                {activeSessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-muted-foreground">
                          {s.sessionToken.slice(0, 12)}…
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {s.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{s.ipAddress}</span>
                        <span>
                          Last seen:{" "}
                          {s.lastSeenAt
                            ? new Date(s.lastSeenAt).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() => revokeMutation.mutate({ id: s.id })}
                    >
                      <ShieldOff size={13} />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revoked sessions */}
        {revokedSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldOff size={16} className="text-red-400" />
                Revoked Sessions ({revokedSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {revokedSessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 opacity-70"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-muted-foreground">
                          {s.sessionToken.slice(0, 12)}…
                        </code>
                        <Badge variant="secondary" className="text-xs">
                          {s.code}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          Revoked
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {s.ipAddress}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => restoreMutation.mutate({ id: s.id })}
                    >
                      <ShieldCheck size={13} />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
