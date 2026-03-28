/**
 * AdminSessions — live view of all active invite-gate sessions.
 * Route: /admin/sessions
 *
 * Features:
 *  - Real-time table of sessions (auto-refreshes every 30s)
 *  - Active / Inactive / Revoked status badges
 *  - Masked IP, user-agent, invite code, first seen, last seen
 *  - Revoke / Restore actions per session
 *  - Toggle to show inactive sessions (last seen > 10 min ago)
 *  - Purge old sessions button
 *  - Session count summary cards
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, RefreshCw, Monitor, Wifi, WifiOff, ShieldBan,
  ShieldCheck, Clock, Trash2, Users, Activity, Eye,
} from "lucide-react";

type SessionRow = {
  id: number;
  sessionToken: string;
  code: string;
  codeId: number;
  ipMasked: string;
  userAgent: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isRevoked: boolean;
  isActive: boolean;
};

/** Parse user-agent into a short human-readable label */
function parseUA(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/iPhone|iPad|iOS/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) {
    if (/Chrome/i.test(ua)) return "Chrome / Win";
    if (/Firefox/i.test(ua)) return "Firefox / Win";
    if (/Edge/i.test(ua)) return "Edge / Win";
    return "Windows";
  }
  if (/Mac OS X/i.test(ua)) {
    if (/Chrome/i.test(ua)) return "Chrome / Mac";
    if (/Firefox/i.test(ua)) return "Firefox / Mac";
    if (/Safari/i.test(ua)) return "Safari / Mac";
    return "macOS";
  }
  if (/Linux/i.test(ua)) return "Linux";
  return ua.slice(0, 30);
}

/** Format a timestamp relative to now */
function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function AdminSessions() {
  const utils = trpc.useUtils();
  const [showInactive, setShowInactive] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const { data: sessions = [], isLoading, isFetching, refetch } =
    trpc.inviteGate.listActiveSessions.useQuery(
      { includeInactive: showInactive },
      { refetchInterval: 30_000 }
    );

  const revokeSession = trpc.inviteGate.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("Session revoked — user will be locked out on next heartbeat (within 2 min)");
      utils.inviteGate.listActiveSessions.invalidate();
    },
    onError: () => toast.error("Failed to revoke session"),
  });

  const restoreSession = trpc.inviteGate.restoreSession.useMutation({
    onSuccess: () => {
      toast.success("Session restored — user regains access");
      utils.inviteGate.listActiveSessions.invalidate();
    },
    onError: () => toast.error("Failed to restore session"),
  });

  const purgeOldSessions = trpc.inviteGate.purgeOldSessions.useMutation({
    onSuccess: () => {
      toast.success("Old session records purged");
      utils.inviteGate.listActiveSessions.invalidate();
      setConfirmPurge(false);
    },
    onError: () => toast.error("Purge failed"),
  });

  // Derived counts
  const activeCount   = sessions.filter((s) => s.isActive).length;
  const revokedCount  = sessions.filter((s) => s.isRevoked).length;
  const inactiveCount = sessions.filter((s) => !s.isActive && !s.isRevoked).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/feedback">
            <button className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            <h1 className="font-semibold text-sm">Active Sessions</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/invite-codes">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                <Eye size={13} />
                <span className="hidden sm:inline">Invite Codes</span>
              </button>
            </Link>
            <Link href="/admin/users">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                <Users size={13} />
                <span className="hidden sm:inline">Users</span>
              </button>
            </Link>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <Wifi size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <WifiOff size={18} className="text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inactiveCount}</p>
                <p className="text-xs text-gray-500">Recently inactive</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <ShieldBan size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{revokedCount}</p>
                <p className="text-xs text-gray-500">Revoked</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm text-gray-400 cursor-pointer">
              Show inactive sessions (last seen &gt; 10 min)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            {confirmPurge ? (
              <>
                <span className="text-xs text-amber-400">Purge sessions older than 30 days?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => purgeOldSessions.mutate({ olderThanDays: 30 })}
                  disabled={purgeOldSessions.isPending}
                  className="text-xs h-7"
                >
                  {purgeOldSessions.isPending ? "Purging…" : "Confirm"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmPurge(false)}
                  className="text-xs h-7 bg-transparent border-gray-700 text-gray-400"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmPurge(true)}
                className="text-xs h-7 bg-transparent border-gray-700 text-gray-500 hover:text-white"
              >
                <Trash2 size={12} className="mr-1.5" />
                Purge old records
              </Button>
            )}
          </div>
        </div>

        {/* Sessions table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3 border-b border-gray-800">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Monitor size={15} className="text-blue-400" />
              {showInactive ? "All Sessions" : "Active Sessions"}
              <span className="text-xs font-normal text-gray-600 ml-1">
                — auto-refreshes every 30s · active = last seen within 10 min
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-600">
                <RefreshCw size={20} className="animate-spin mr-2" />
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-2">
                <Wifi size={32} className="opacity-30" />
                <p className="text-sm">No sessions found</p>
                <p className="text-xs text-gray-700">
                  Sessions appear here once a visitor with an invite code loads the site.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-500 text-xs font-medium">Status</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium">Code</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium">Token</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium">IP</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium">Device</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium">First seen</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium">Last seen</TableHead>
                      <TableHead className="text-gray-500 text-xs font-medium text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session as SessionRow}
                        onRevoke={() => revokeSession.mutate({ id: session.id })}
                        onRestore={() => restoreSession.mutate({ id: session.id })}
                        isRevoking={revokeSession.isPending}
                        isRestoring={restoreSession.isPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Active — last heartbeat within 10 min
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
            Inactive — browser tab closed or idle
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Revoked — access denied on next heartbeat
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Session row sub-component ─────────────────────────────────────────────────

interface SessionRowProps {
  session: SessionRow;
  onRevoke: () => void;
  onRestore: () => void;
  isRevoking: boolean;
  isRestoring: boolean;
}

function SessionRow({ session, onRevoke, onRestore, isRevoking, isRestoring }: SessionRowProps) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const statusBadge = session.isRevoked ? (
    <Badge className="bg-red-900/50 text-red-400 border-red-800 text-[10px] gap-1">
      <ShieldBan size={10} /> Revoked
    </Badge>
  ) : session.isActive ? (
    <Badge className="bg-emerald-900/50 text-emerald-400 border-emerald-800 text-[10px] gap-1">
      <Wifi size={10} /> Active
    </Badge>
  ) : (
    <Badge className="bg-gray-800 text-gray-500 border-gray-700 text-[10px] gap-1">
      <WifiOff size={10} /> Inactive
    </Badge>
  );

  return (
    <TableRow className="border-gray-800 hover:bg-gray-800/40">
      <TableCell className="py-2.5">{statusBadge}</TableCell>
      <TableCell className="py-2.5">
        <span className="font-mono text-xs bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded">
          {session.code}
        </span>
      </TableCell>
      <TableCell className="py-2.5">
        <span className="font-mono text-xs text-gray-600">{session.sessionToken}</span>
      </TableCell>
      <TableCell className="py-2.5">
        <span className="text-xs text-gray-400 font-mono">{session.ipMasked}</span>
      </TableCell>
      <TableCell className="py-2.5">
        <span className="text-xs text-gray-400">{parseUA(session.userAgent)}</span>
      </TableCell>
      <TableCell className="py-2.5">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={10} />
          {timeAgo(session.firstSeenAt)}
        </span>
      </TableCell>
      <TableCell className="py-2.5">
        <span className={`text-xs flex items-center gap-1 ${session.isActive ? "text-emerald-400" : "text-gray-500"}`}>
          <Clock size={10} />
          {timeAgo(session.lastSeenAt)}
        </span>
      </TableCell>
      <TableCell className="py-2.5 text-right">
        {session.isRevoked ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onRestore}
            disabled={isRestoring}
            className="text-xs h-7 bg-transparent border-gray-700 text-gray-400 hover:text-emerald-400 hover:border-emerald-700"
          >
            <ShieldCheck size={12} className="mr-1" />
            Restore
          </Button>
        ) : confirmRevoke ? (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[10px] text-amber-400">Revoke?</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => { onRevoke(); setConfirmRevoke(false); }}
              disabled={isRevoking}
              className="text-xs h-6 px-2"
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmRevoke(false)}
              className="text-xs h-6 px-2 bg-transparent border-gray-700 text-gray-400"
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmRevoke(true)}
            className="text-xs h-7 bg-transparent border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-700"
          >
            <ShieldBan size={12} className="mr-1" />
            Revoke
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
