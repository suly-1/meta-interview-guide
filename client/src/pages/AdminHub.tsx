/**
 * AdminHub — single entry point at /admin
 *
 * Shows the PIN gate once. After unlocking, renders a card grid
 * linking to every admin section. One URL to bookmark, one PIN to enter.
 */
import { useState } from "react";
import AdminPinGate, {
  getAdminToken,
  clearAdminToken,
} from "@/components/AdminPinGate";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BarChart3,
  MessageSquare,
  LineChart,
  Users,
  ShieldCheck,
  Settings,
  Key,
  Monitor,
  FileText,
  ScrollText,
  Radio,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

const SECTIONS = [
  {
    href: "/admin/stats",
    icon: BarChart3,
    label: "Stats",
    desc: "Aggregate performance data & live visitor tracking",
    color: "text-blue-400",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    href: "/admin/feedback",
    icon: MessageSquare,
    label: "Feedback",
    desc: "Triage user feedback, notes, and daily digest",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    href: "/admin/analytics",
    icon: LineChart,
    label: "Analytics",
    desc: "Page views, tab usage, and engagement trends",
    color: "text-purple-400",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "Users",
    desc: "View, block, and manage registered users",
    color: "text-amber-400",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    href: "/admin/access",
    icon: ShieldCheck,
    label: "Access Control",
    desc: "Kill switch, disclaimer gate, and cohort window",
    color: "text-red-400",
    bg: "bg-red-500/10 hover:bg-red-500/20",
  },
  {
    href: "/admin/invite-codes",
    icon: Key,
    label: "Invite Codes",
    desc: "Create, toggle, and delete invite codes",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  {
    href: "/admin/sessions",
    icon: Monitor,
    label: "Sessions",
    desc: "View and revoke active invite-code sessions",
    color: "text-orange-400",
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Settings",
    desc: "Cohort reset, PIN attempts chart, site lock",
    color: "text-slate-400",
    bg: "bg-slate-500/10 hover:bg-slate-500/20",
  },
  {
    href: "/admin/disclaimer-report",
    icon: FileText,
    label: "Disclaimer Report",
    desc: "Who acknowledged the disclaimer and when",
    color: "text-pink-400",
    bg: "bg-pink-500/10 hover:bg-pink-500/20",
  },
  {
    href: "/admin/docs",
    icon: ScrollText,
    label: "Docs",
    desc: "Admin documentation and implementation notes",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/20",
  },
  {
    href: "/changelog",
    icon: Radio,
    label: "Changelog",
    desc: "Public changelog — version history for users",
    color: "text-teal-400",
    bg: "bg-teal-500/10 hover:bg-teal-500/20",
  },
];

function AdminHubContent() {
  const { data: liveStats } = trpc.visitorTracking.getStats.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );

  function handleLogout() {
    clearAdminToken();
    toast.success("Admin session cleared");
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            ← Back to site
          </Link>
          <div className="flex-1">
            <h1
              className="text-sm font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Admin Hub
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Meta Interview Prep — Control Panel
            </p>
          </div>
          {/* Live badge */}
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {liveStats?.active ?? 0} active now
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            title="Clear admin session"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-6 text-[11px] text-muted-foreground overflow-x-auto">
          <span>
            <span className="text-foreground font-semibold">
              {liveStats?.today ?? "—"}
            </span>{" "}
            visitors today
          </span>
          <span>
            <span className="text-foreground font-semibold">
              {liveStats?.week ?? "—"}
            </span>{" "}
            this week
          </span>
          <span>
            <span className="text-foreground font-semibold">
              {liveStats?.total ?? "—"}
            </span>{" "}
            all time
          </span>
        </div>
      </div>

      {/* Card grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link key={href} href={href}>
              <div
                className={`group rounded-xl border border-border p-4 cursor-pointer transition-all ${bg}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0`}
                  >
                    <Icon size={16} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold group-hover:text-foreground transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-8">
          Admin session expires after 55 minutes · PIN:{" "}
          <span className="font-mono">ADMIN_PIN</span> secret
        </p>
      </div>
    </div>
  );
}

export default function AdminHub() {
  return (
    <AdminPinGate>
      <AdminHubContent />
    </AdminPinGate>
  );
}
