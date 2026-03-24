// Admin-only page: Disclaimer Acknowledgment Audit Report
// Shows all registered users with their disclaimer acknowledgment status and timestamp.
// Accessible only to users with role="admin"; non-admins see a 403 message.

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ShieldAlert, CheckCircle2, XCircle, ArrowUpDown, ArrowLeft, Download, Users, Settings, BarChart2 } from "lucide-react";

type SortKey = "name" | "email" | "createdAt" | "lastSignedIn" | "acknowledgedAt";
type SortDir = "asc" | "desc";

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function AdminDisclaimerReport() {
  const { user, loading } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>("acknowledgedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "acknowledged" | "pending">("all");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading, error } = trpc.disclaimer.adminReport.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...rows];
    if (filter === "acknowledged") result = result.filter(r => r.acknowledged);
    if (filter === "pending") result = result.filter(r => !r.acknowledged);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let av: string | number | Date | null = null;
      let bv: string | number | Date | null = null;
      if (sortKey === "name") { av = a.name; bv = b.name; }
      else if (sortKey === "email") { av = a.email; bv = b.email; }
      else if (sortKey === "createdAt") { av = a.createdAt ? new Date(a.createdAt).getTime() : 0; bv = b.createdAt ? new Date(b.createdAt).getTime() : 0; }
      else if (sortKey === "lastSignedIn") { av = a.lastSignedIn ? new Date(a.lastSignedIn).getTime() : 0; bv = b.lastSignedIn ? new Date(b.lastSignedIn).getTime() : 0; }
      else if (sortKey === "acknowledgedAt") {
        av = a.acknowledgedAt ? new Date(a.acknowledgedAt).getTime() : -1;
        bv = b.acknowledgedAt ? new Date(b.acknowledgedAt).getTime() : -1;
      }
      if (av === null || av === undefined) av = "";
      if (bv === null || bv === undefined) bv = "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [rows, filter, search, sortKey, sortDir]);

  const acknowledgedCount = rows.filter(r => r.acknowledged).length;
  const pendingCount = rows.length - acknowledgedCount;

  const exportCsv = () => {
    const header = ["ID", "Name", "Email", "Role", "Registered", "Last Sign-in", "Acknowledged", "Acknowledged At"];
    const csvRows = filtered.map(r => [
      r.id,
      r.name,
      r.email,
      r.role,
      formatDate(r.createdAt),
      formatDate(r.lastSignedIn),
      r.acknowledged ? "Yes" : "No",
      formatDate(r.acknowledgedAt),
    ]);
    const csv = [header, ...csvRows].map(row => row.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disclaimer-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  // Not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <ShieldAlert size={40} className="text-amber-400" />
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          This page is restricted to administrators. If you believe this is an error, contact the site owner.
        </p>
        <Link href="/" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Guide
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-400" />
              Disclaimer Acknowledgment Report
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Admin audit — all registered users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/stats"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
          >
            <BarChart2 size={13} />
            Feedback Stats
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-secondary text-gray-400 transition-colors"
          >
            <Settings size={13} />
            Site Settings
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
          >
            <Users size={13} />
            User Management
          </Link>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-2xl font-bold text-foreground">{rows.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Users</div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="text-2xl font-bold text-emerald-400">{acknowledgedCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Acknowledged</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Pending / Not Yet Seen</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-1.5">
            {(["all", "acknowledged", "pending"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Loading report…</div>
        ) : error ? (
          <div className="text-sm text-destructive py-12 text-center">Failed to load report. You may not have admin access.</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    {([
                      { key: "name", label: "Name" },
                      { key: "email", label: "Email" },
                      { key: "createdAt", label: "Registered" },
                      { key: "lastSignedIn", label: "Last Sign-in" },
                      { key: "acknowledgedAt", label: "Acknowledged At" },
                    ] as { key: SortKey; label: string }[]).map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown size={11} className={sortKey === col.key ? "text-foreground" : "opacity-40"} />
                        </span>
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                        No users match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-border last:border-0 transition-colors hover:bg-secondary/20 ${
                          i % 2 === 0 ? "" : "bg-secondary/10"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.email}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(row.createdAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(row.lastSignedIn)}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {row.acknowledged ? (
                            <span className="text-emerald-400">{formatDate(row.acknowledgedAt)}</span>
                          ) : (
                            <span className="text-amber-400/70 italic">Not yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.acknowledged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <XCircle size={11} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            row.role === "admin"
                              ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
                              : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                          }`}>
                            {row.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-secondary/20">
                Showing {filtered.length} of {rows.length} users
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
