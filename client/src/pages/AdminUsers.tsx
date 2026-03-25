import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft, Shield, ShieldOff, Users,
  CheckCircle, Clock, Mail, ScrollText, ChevronDown, ChevronUp, AlertCircle, Timer, Infinity, History,
} from "lucide-react";

// Duration options for temporary blocks
const BLOCK_DURATIONS: { label: string; shortLabel: string; days: number | null; description: string }[] = [
  { label: "1 Hour",    shortLabel: "1h",   days: 1 / 24, description: "Auto-unblocks in 1 hour" },
  { label: "24 Hours",  shortLabel: "24h",  days: 1,      description: "Auto-unblocks tomorrow" },
  { label: "7 Days",    shortLabel: "7d",   days: 7,      description: "Auto-unblocks in 1 week" },
  { label: "30 Days",   shortLabel: "30d",  days: 30,     description: "Auto-unblocks in 30 days" },
  { label: "Permanent", shortLabel: "∞",    days: null,   description: "Must be manually unblocked" },
];

function formatTimeLeft(bannedUntil: Date | string): string {
  const ms = new Date(bannedUntil).getTime() - Date.now();
  if (ms <= 0) return "Expiry pending";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.ceil(hours * 60)}m left`;
  if (hours < 24) return `${Math.ceil(hours)}h left`;
  const days = Math.ceil(hours / 24);
  return `${days}d left`;
}

// ── Per-user block history row ────────────────────────────────────────────────
function UserBlockHistory({ userId }: { userId: number }) {
  const { data: history, isLoading } = trpc.adminUsers.getUserBlockHistory.useQuery({ userId });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-3 bg-gray-800/40 text-xs text-gray-500 text-center">
          Loading history…
        </td>
      </tr>
    );
  }

  if (!history?.length) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-3 bg-gray-800/40 text-xs text-gray-500 text-center">
          No block/unblock events recorded for this user.
        </td>
      </tr>
    );
  }

  return (
    <>
      {history.map((event: { id: number; action: string; actorId: number; actorName: string | null; targetUserId: number; targetUserName: string | null; reason: string | null; createdAt: Date }) => (
        <tr key={event.id} className="bg-gray-800/40 border-b border-gray-700/30 last:border-0">
          <td className="px-6 py-2 text-[11px] text-gray-500 whitespace-nowrap">
            {new Date(event.createdAt).toLocaleString()}
          </td>
          <td className="px-4 py-2" colSpan={2}>
            {event.action === "block" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 text-[11px] font-semibold">
                <ShieldOff size={9} /> Blocked
              </span>
            ) : event.action === "unblock" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 text-[11px] font-semibold">
                <Shield size={9} /> Unblocked
              </span>
            ) : (
              <span className="text-amber-400 text-[11px] font-semibold">{event.action}</span>
            )}
          </td>
          <td className="px-4 py-2 text-[11px] text-gray-400 hidden md:table-cell">
            by {event.actorName ?? `Admin #${event.actorId}`}
          </td>
          <td className="px-4 py-2 text-[11px] text-gray-500 hidden lg:table-cell max-w-[200px] truncate" title={event.reason ?? ""}>
            {event.reason ?? "—"}
          </td>
          <td />
        </tr>
      ))}
    </>
  );
}

export default function AdminUsers() {
  const [confirmBlock, setConfirmBlock] = useState<{ userId: number; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockDurationDays, setBlockDurationDays] = useState<number | null>(null); // null = permanent
  const [showAuditLog, setShowAuditLog] = useState(false);
  // Track which user rows have the history panel expanded
  const [expandedHistoryUserId, setExpandedHistoryUserId] = useState<number | null>(null);

  const { data: userList, isLoading, refetch } = trpc.adminUsers.listUsers.useQuery(undefined);

  const { data: auditLog, isLoading: auditLoading } = trpc.adminUsers.listAuditLog.useQuery(undefined, {
    enabled: showAuditLog,
  });

  const blockMutation = trpc.adminUsers.blockUser.useMutation({
    onSuccess: () => {
      refetch();
      setConfirmBlock(null);
      setBlockReason("");
      setBlockDurationDays(null);
    },
  });

  const unblockMutation = trpc.adminUsers.unblockUser.useMutation({
    onSuccess: () => refetch(),
  });

  const [checkInactiveResult, setCheckInactiveResult] = useState<{ notified: boolean; count: number } | null>(null);
  const checkInactiveMutation = trpc.adminUsers.checkInactiveUsers.useMutation({
    onSuccess: (result: { notified: boolean; count: number }) => {
      setCheckInactiveResult(result);
      setTimeout(() => setCheckInactiveResult(null), 5000);
    },
  });

  const bannedCount = userList?.filter(u => u.isBanned).length ?? 0;
  const activeThisWeek = userList?.filter(u => {
    if (!u.lastSignedIn) return false;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(u.lastSignedIn).getTime() > sevenDaysAgo;
  }).length ?? 0;

  const selectedDuration = BLOCK_DURATIONS.find(d => d.days === blockDurationDays) ?? BLOCK_DURATIONS[4];

  const toggleHistory = (userId: number) => {
    setExpandedHistoryUserId(prev => prev === userId ? null : userId);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/disclaimer" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            <h1 className="font-semibold text-sm">User Management</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {checkInactiveResult && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                checkInactiveResult.notified
                  ? "bg-amber-900/50 text-amber-300 border-amber-700"
                  : "bg-gray-800 text-gray-400 border-gray-700"
              }`}>
                {checkInactiveResult.notified
                  ? `⚠️ ${checkInactiveResult.count} inactive users notified`
                  : "No inactive users found"}
              </span>
            )}
            <button
              onClick={() => checkInactiveMutation.mutate()}
              disabled={checkInactiveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-900/30 hover:bg-amber-900/50 rounded-lg border border-amber-700 transition-all disabled:opacity-50"
            >
              <AlertCircle size={13} className={checkInactiveMutation.isPending ? "animate-pulse" : ""} />
              Check Inactive
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users size={11} /> Total Users
            </p>
            <p className="text-3xl font-bold text-white">{userList?.length ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-1">registered accounts</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle size={11} /> Active This Week
            </p>
            <p className="text-3xl font-bold text-blue-400">{activeThisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">logged in last 7 days</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldOff size={11} /> Blocked
            </p>
            <p className="text-3xl font-bold text-red-400">{bannedCount}</p>
            <p className="text-xs text-gray-500 mt-1">access revoked</p>
          </div>
        </div>

        {/* User table */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">Loading users...</div>
        ) : !userList?.length ? (
          <div className="text-center py-16 text-gray-500">No users found.</div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Last Seen</th>
                  <th className="text-left px-4 py-3">Disclaimer</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u, idx) => (
                  <>
                    <tr
                      key={u.id}
                      className={`border-b border-gray-800/50 transition-colors ${
                        expandedHistoryUserId === u.id
                          ? "bg-gray-800/60"
                          : u.isBanned
                            ? "bg-red-950/20"
                            : idx % 2 === 0 ? "" : "bg-gray-900/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(u.name ?? "?")[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white text-xs leading-tight">{u.name}</p>
                            {u.role === "admin" && (
                              <span className="text-[10px] text-amber-400 font-medium">Admin</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Mail size={11} />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(u.lastSignedIn).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.disclaimerAcknowledged ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle size={12} />
                            Signed
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 text-xs font-medium">
                              <ShieldOff size={10} />
                              Blocked
                            </span>
                            {u.bannedUntil ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 text-[10px] font-medium">
                                <Timer size={9} />
                                {formatTimeLeft(u.bannedUntil)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 text-[10px] font-medium">
                                <Infinity size={9} />
                                Permanent
                              </span>
                            )}
                            {u.bannedReason && (
                              <p className="text-[10px] text-gray-600 mt-0.5 max-w-[120px] truncate" title={u.bannedReason}>
                                {u.bannedReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-medium">
                            <CheckCircle size={10} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Block history toggle */}
                          <button
                            onClick={() => toggleHistory(u.id)}
                            title="View block/unblock history"
                            className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              expandedHistoryUserId === u.id
                                ? "bg-indigo-700/60 text-indigo-300 border border-indigo-600"
                                : "bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700"
                            }`}
                          >
                            <History size={11} />
                            <span className="hidden sm:inline">History</span>
                          </button>
                          {/* Block / Unblock */}
                          {u.role === "admin" ? (
                            <span className="text-xs text-gray-600 italic">Protected</span>
                          ) : u.isBanned ? (
                            <button
                              onClick={() => unblockMutation.mutate({ userId: u.id })}
                              disabled={unblockMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <Shield size={12} />
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmBlock({ userId: u.id, name: u.name })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400 text-xs font-medium transition-colors"
                            >
                              <ShieldOff size={12} />
                              Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Inline block history expansion */}
                    {expandedHistoryUserId === u.id && (
                      <UserBlockHistory key={`history-${u.id}`} userId={u.id} />
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit log */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <button
            onClick={() => setShowAuditLog(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ScrollText size={16} className="text-amber-400" />
              <span className="font-semibold text-sm text-white">Admin Audit Log</span>
              <span className="text-xs text-gray-500">— tamper-evident record of all block/unblock actions</span>
            </div>
            {showAuditLog ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>

          {showAuditLog && (
            <div className="border-t border-gray-800">
              {auditLoading ? (
                <div className="text-center py-8 text-gray-500 text-sm">Loading audit log...</div>
              ) : !auditLog?.length ? (
                <div className="text-center py-8 text-gray-600 text-sm">No audit events recorded yet.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-2.5">When</th>
                      <th className="text-left px-5 py-2.5">Action</th>
                      <th className="text-left px-5 py-2.5">Target User</th>
                      <th className="text-left px-5 py-2.5 hidden md:table-cell">Performed By</th>
                      <th className="text-left px-5 py-2.5 hidden lg:table-cell">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map(event => (
                      <tr key={event.id} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-800/20">
                        <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">
                          {new Date(event.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-2.5">
                          {event.action === "block" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 font-semibold">
                              <ShieldOff size={9} />
                              Blocked
                            </span>
                          ) : event.action === "unblock" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 font-semibold">
                              <Shield size={9} />
                              Unblocked
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold">{event.action}</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          <p className="text-white font-medium">{event.targetUserName ?? `#${event.targetUserId}`}</p>
                          {event.targetUserEmail && (
                            <p className="text-gray-600">{event.targetUserEmail}</p>
                          )}
                        </td>
                        <td className="px-5 py-2.5 hidden md:table-cell text-gray-400">
                          {event.actorName ?? `Admin #${event.actorId}`}
                        </td>
                        <td className="px-5 py-2.5 hidden lg:table-cell text-gray-500 max-w-[200px] truncate" title={event.reason ?? ""}>
                          {event.reason ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Block confirmation modal with duration picker */}
      {confirmBlock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <ShieldOff size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Block User</h3>
                <p className="text-sm text-gray-400">
                  Revoke access for <strong className="text-white">{confirmBlock.name}</strong>
                </p>
              </div>
            </div>

            {/* Duration picker */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Timer size={11} /> Block Duration
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {BLOCK_DURATIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setBlockDurationDays(opt.days)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                      blockDurationDays === opt.days
                        ? opt.days === null
                          ? "bg-red-700 border-red-500 text-white"
                          : "bg-amber-700 border-amber-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                    }`}
                    title={opt.description}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {selectedDuration.description}
              </p>
            </div>

            {/* Reason */}
            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1.5">Reason (optional — recorded in audit log)</label>
              <textarea
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="e.g. Violated terms of use"
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmBlock(null); setBlockReason(""); setBlockDurationDays(null); }}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => blockMutation.mutate({
                  userId: confirmBlock.userId,
                  reason: blockReason || undefined,
                  expiryDays: blockDurationDays ?? undefined,
                })}
                disabled={blockMutation.isPending}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${
                  blockDurationDays === null
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {blockMutation.isPending
                  ? "Blocking..."
                  : blockDurationDays === null
                    ? "Block Permanently"
                    : `Block for ${selectedDuration.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
