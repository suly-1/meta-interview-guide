/**
 * AdminDocs — /admin/docs
 * Internal admin documentation: feature reference, env vars, and quick-start guide.
 */
import { route } from "@/const";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
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
  { href: route("/admin/docs"), label: "Docs" },
];

const PAGES = [
  {
    path: "/admin/feedback",
    label: "Feedback",
    description:
      "View and triage user feedback submissions. Includes sentiment tags, export to CSV, and daily digest trigger.",
    badge: "Data",
  },
  {
    path: "/admin/analytics",
    label: "Analytics",
    description:
      "Page-view counts, unique visitors, and cohort health summary. Powered by the analytics router.",
    badge: "Data",
  },
  {
    path: "/admin/access",
    label: "Access Control",
    description:
      "Toggle the site lock, disclaimer gate, and view the cohort window status.",
    badge: "Control",
  },
  {
    path: "/admin/users",
    label: "Users",
    description:
      "Block/unblock users, view login history, export audit log CSV, and set block expiry.",
    badge: "Users",
  },
  {
    path: "/admin/stats",
    label: "Stats",
    description:
      "Aggregate anonymous pass-rate comparisons by feature usage. Owner-only.",
    badge: "Data",
  },
  {
    path: "/admin/invite-codes",
    label: "Invite Codes",
    description:
      "Create, activate, block, and delete invite codes. Each code can have a custom cohort name and welcome message.",
    badge: "Access",
  },
  {
    path: "/admin/sessions",
    label: "Sessions",
    description:
      "View all active invite-gate sessions. Revoke individual sessions or purge sessions older than 30 days.",
    badge: "Access",
  },
  {
    path: "/admin/settings",
    label: "Settings",
    description:
      "Configure the cohort window (start date + duration), manual lock, disclaimer toggle, and cohort reset.",
    badge: "Config",
  },
  {
    path: "/admin/disclaimer-report",
    label: "Disclaimer Report",
    description:
      "See which users have and have not acknowledged the disclaimer.",
    badge: "Data",
  },
  {
    path: "/changelog",
    label: "Changelog",
    description:
      "Public changelog page showing all deployment history entries.",
    badge: "Public",
  },
];

const ENV_VARS = [
  {
    key: "ADMIN_PIN",
    description: "6-digit PIN for the admin panel. Required.",
  },
  {
    key: "VITE_INVITE_CODE",
    description: "Master invite code (env fallback). DB codes take precedence.",
  },
  {
    key: "CHANGELOG_MESSAGE",
    description: "Message shown in the update toast on next deployment.",
  },
  {
    key: "VITE_BUILD_HASH",
    description:
      "Build hash injected at CI time. Auto-generated from CHECKPOINT_VERSION if not set.",
  },
  {
    key: "DIGEST_EMAIL",
    description: "Email address for the weekly digest and daily alert.",
  },
  {
    key: "DATABASE_URL",
    description: "MySQL/TiDB connection string. Auto-injected by Manus.",
  },
  {
    key: "JWT_SECRET",
    description: "Session cookie signing secret. Auto-injected by Manus.",
  },
];

export default function AdminDocs() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={route("/")}>
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </a>
          </Link>
          <BookOpen size={18} className="text-blue-400" />
          <h1 className="text-lg font-semibold">Admin Docs</h1>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}>
              <a className="hover:text-foreground transition-colors">
                {l.label}
              </a>
            </Link>
          ))}
        </nav>
      </header>

      <div className="container max-w-4xl py-8 space-y-8">
        {/* Quick start */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Access the admin panel by navigating to{" "}
              <code className="text-foreground bg-muted px-1 rounded">
                /admin/feedback
              </code>{" "}
              and entering your PIN. The PIN is set via the{" "}
              <code className="text-foreground bg-muted px-1 rounded">
                ADMIN_PIN
              </code>{" "}
              environment variable.
            </p>
            <p>
              Once authenticated, your session is valid for{" "}
              <strong className="text-foreground">1 hour</strong>. After expiry,
              you will be prompted to re-enter your PIN.
            </p>
            <p>
              All admin pages are protected by{" "}
              <code className="text-foreground bg-muted px-1 rounded">
                AdminPinGate
              </code>
              . The gate issues a signed JWT stored in memory (not localStorage)
              so it is cleared on tab close.
            </p>
          </CardContent>
        </Card>

        {/* Page reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PAGES.map(page => (
                <div
                  key={page.path}
                  className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/10"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={route(page.path)}>
                        <a className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-1">
                          {page.label}
                          <ExternalLink
                            size={11}
                            className="text-muted-foreground"
                          />
                        </a>
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {page.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {page.description}
                    </p>
                    <code className="text-xs text-muted-foreground/60">
                      {page.path}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environment variables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ENV_VARS.map(v => (
                <div
                  key={v.key}
                  className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <code className="text-xs font-mono text-blue-400 shrink-0 mt-0.5 min-w-[200px]">
                    {v.key}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
