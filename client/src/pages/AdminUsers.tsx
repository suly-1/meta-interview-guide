import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  ArrowLeft, Shield, ShieldOff, Users, AlertTriangle,
  CheckCircle, Clock, Mail, ScrollText, ChevronDown, ChevronUp,
} from "lucide-react";

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const [confirmBlock, setConfirmBlock] = useState<{ userId: number; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [showAuditLog, setShowAuditLog] = useState(false);

  const { data: userList, isLoading, refetch } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: auditLog, isLoading: auditLoading } = trpc.admin.listAuditLog.useQuery(undefined, {
    enabled: user?.role === "admin" && showAuditLog,
  });

  const blockMutation = trpc.admin.blockUser.useMutation({
    onSuccess: () => {
      refetch();
      setConfirmBlock(null);
      setBlockReason("");
    },
  });

  const unblockMutation = trpc.admin.unblockUser.useMutation({
    onSuccess: () => refetch(),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">You must be signed in to access this page.</p>
          <a href={getLoginUrl()} className="text-blue-400 hover:text-blue-300 underline">Sign in</a>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 text-sm mt-1">This page is restricted to administrators.</p>
          <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300 underline text-sm">
            Return to guide
          </Link>
        </div>
      </div>
    );
  }

  const bannedCount = userList?.filter(u => u.isBanned).length ?? 0;
  const adminCount = userList?.filter(u => u.role === "admin").length ?? 0;

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
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
            <span>{userList?.length ?? 0} total</span>
            {bannedCount > 0 && (
              <span className="text-red-400 font-medium">{bannedCount} blocked</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{userList?.length ?? "—"}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Blocked</p>
            <p className="text-2xl font-bold text-red-400">{bannedCount}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Admins</p>
            <p className="text-2xl font-bold text-amber-400">{adminCount}</p>
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
                  <tr
                    key={u.id}
                    className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                      u.isBanned ? "bg-red-950/20" : idx % 2 === 0 ? "" : "bg-gray-900/50"
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
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 text-xs font-medium">
                            <ShieldOff size={10} />
                            Blocked
                          </span>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Log Section */}
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

      {/* Block confirmation modal */}
      {confirmBlock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                <ShieldOff size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Block User</h3>
                <p className="text-sm text-gray-400">This will immediately revoke access for <strong className="text-white">{confirmBlock.name}</strong></p>
              </div>
            </div>

            <div className="mb-4">
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
                onClick={() => { setConfirmBlock(null); setBlockReason(""); }}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => blockMutation.mutate({ userId: confirmBlock.userId, reason: blockReason || undefined })}
                disabled={blockMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {blockMutation.isPending ? "Blocking..." : "Block User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
