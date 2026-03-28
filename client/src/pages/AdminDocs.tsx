/**
 * AdminDocs — Deployment process & admin panel access instructions.
 * Route: /#/admin/docs
 * Accessible without login; token auto-loaded from localStorage.
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  ShieldCheck, GitBranch, Globe, Clock, CheckCircle2, Copy, Check,
  AlertTriangle, ArrowLeft, ExternalLink, Terminal, RefreshCw, Eye, EyeOff,
  Users, MessageSquare, BarChart2, Settings, FileText
} from "lucide-react";
import { getAdminToken } from "@/lib/adminToken";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors ml-2"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-700 my-2">
      {label && (
        <div className="bg-gray-800 px-3 py-1.5 text-[10px] font-mono text-gray-600 border-b border-gray-700 flex items-center justify-between">
          <span>{label}</span>
          <CopyButton value={children} />
        </div>
      )}
      <pre className="bg-gray-900 text-green-400 text-xs font-mono px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </pre>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoBox({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    info:    "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-200",
    warning: "bg-amber-500 border-amber-600 text-white",
    success: "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-600 dark:text-emerald-200",
  };
  const icons = {
    info:    <AlertTriangle size={14} className="shrink-0 mt-0.5" />,
    warning: <AlertTriangle size={14} className="shrink-0 mt-0.5" />,
    success: <CheckCircle2 size={14} className="shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-2 p-3 rounded-lg border text-xs leading-relaxed mb-3 ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}

const ADMIN_TOKEN = "4osu68BZJOzKv4KGapySv1WwDBfu6i1y9euh";
const SITE_URL = "https://metaengguide.pro";
const REPO_URL = "https://github.com/suly-1/meta-interview-guide";

const ADMIN_PAGES = [
  { path: "/admin/feedback", icon: <MessageSquare size={14} />, label: "Feedback", desc: "View and manage all candidate feedback submissions. Mark items as reviewed, add notes, export data." },
  { path: "/admin/users",    icon: <Users size={14} />,         label: "Users",    desc: "List all registered users, view login history, block/unblock users with optional expiry and reason." },
  { path: "/admin/settings", icon: <Settings size={14} />,      label: "Settings", desc: "Toggle site time-lock (open/closed), enable/disable the disclaimer gate, perform cohort resets." },
  { path: "/admin/stats",    icon: <BarChart2 size={14} />,     label: "Stats",    desc: "Site-wide analytics: total users, active sessions, feedback counts, new items since last review." },
  { path: "/admin/disclaimer", icon: <FileText size={14} />,    label: "Disclaimer", desc: "Owner-only audit report hub. Links to all admin sub-pages in one place." },
];

export default function AdminDocs() {
  const [showToken, setShowToken] = useState(false);
  const storedToken = getAdminToken();
  const hasToken = !!storedToken;

  const adminUrl = `${SITE_URL}/#/admin/feedback?key=${ADMIN_TOKEN}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-xs mb-4 transition-colors">
            <ArrowLeft size={13} /> Back to Guide
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Access & Deployment Guide</h1>
              <p className="text-indigo-200 text-xs mt-0.5">L4/L7 Community Study Resource — metaengguide.pro</p>
            </div>
          </div>
          {hasToken && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg px-3 py-2 text-xs text-emerald-200">
              <CheckCircle2 size={13} />
              Admin token is active in this browser. All admin pages are accessible.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Quick Access ── */}
        <Section title="Quick Admin Access" icon={<ShieldCheck size={16} />}>
          <InfoBox type="warning">
            <strong>Keep this URL private.</strong> Anyone with this link has full admin access. Do not share it with candidates.
          </InfoBox>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
            The admin panel uses a secret token in the URL — no login required. Visit the link below to access all admin pages instantly. The token is saved in your browser after the first visit, so you only need the full URL once.
          </p>
          <CodeBlock label="Admin Entry URL (bookmark this)">{adminUrl}</CodeBlock>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {ADMIN_PAGES.map(p => (
              <a
                key={p.path}
                href={`${SITE_URL}/#${p.path}?key=${ADMIN_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-400 hover:shadow-sm transition-all group"
              >
                <span className="text-indigo-500 mt-0.5 shrink-0">{p.icon}</span>
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {p.label}
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">{p.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </Section>

        {/* ── Admin Token ── */}
        <Section title="Admin Token Details" icon={<ShieldCheck size={16} />}>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
            The token is read from the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">?key=</code> URL parameter and stored in <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">localStorage</code>. Once saved, you can navigate directly to any admin URL without the token in the address bar.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-xs">
            <span className="text-gray-700 shrink-0">Token:</span>
            <span className="flex-1 text-gray-900 dark:text-gray-100 break-all">
              {showToken ? ADMIN_TOKEN : "•".repeat(36)}
            </span>
            <button
              onClick={() => setShowToken(v => !v)}
              className="shrink-0 text-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title={showToken ? "Hide token" : "Reveal token"}
            >
              {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            {showToken && <CopyButton value={ADMIN_TOKEN} />}
          </div>
          <InfoBox type="info">
            <strong>Will candidates see the Admin button?</strong> Yes — the floating Admin button in the bottom-left corner is always visible to everyone. However, clicking it without the token in localStorage will open the admin page but all data-fetching calls will return a 403 Forbidden error. Only someone with the token can actually view or modify any admin data.
          </InfoBox>
        </Section>

        {/* ── Deployment Process ── */}
        <Section title="Deployment Process" icon={<GitBranch size={16} />}>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
            The site is deployed automatically to GitHub Pages via a GitHub Actions workflow. Every push to the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">main</code> branch triggers a full rebuild and deployment. No manual steps are needed.
          </p>

          <div className="space-y-3">
            {[
              { step: "1", title: "Code change made", desc: "Any edit to the codebase — whether via Manus checkpoint or direct git commit — is pushed to the main branch on GitHub.", icon: <Terminal size={14} /> },
              { step: "2", title: "GitHub Actions triggers", desc: "The push event automatically starts the 'Deploy to GitHub Pages' workflow in .github/workflows/deploy.yml.", icon: <GitBranch size={14} /> },
              { step: "3", title: "Standalone build runs", desc: "pnpm build:standalone:static executes Vite with vite.standalone.config.ts, which uses mock tRPC stubs so the site works as a pure static SPA with no server required.", icon: <RefreshCw size={14} /> },
              { step: "4", title: "Artifact uploaded", desc: "The dist/standalone/ directory is uploaded as a GitHub Pages artifact.", icon: <CheckCircle2 size={14} /> },
              { step: "5", title: "Pages deployed", desc: "GitHub deploys the artifact to the gh-pages environment. The custom domain metaengguide.pro (configured via CNAME) points to GitHub Pages IPs.", icon: <Globe size={14} /> },
            ].map(s => (
              <div key={s.step} className="flex gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <span className="text-indigo-500">{s.icon}</span>
                    {s.title}
                  </div>
                  <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">Typical deployment time</p>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1"><Clock size={12} /> Build: ~25 seconds</span>
              <span className="flex items-center gap-1"><Globe size={12} /> Deploy: ~10 seconds</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Total: ~35 seconds</span>
            </div>
          </div>
        </Section>

        {/* ── Monitoring ── */}
        <Section title="Daily Automated Monitoring" icon={<Clock size={16} />}>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
            A daily health check runs every morning at 08:00 UTC and verifies four things:
          </p>
          <div className="space-y-2">
            {[
              { check: "GitHub Actions", desc: "Latest workflow run on main branch must have conclusion: success" },
              { check: "Live site HTTP", desc: "GET https://metaengguide.pro must return HTTP 200" },
              { check: "Admin panel base URL", desc: "Admin entry URL must be reachable (HTTP 200)" },
              { check: "DNS records", desc: "metaengguide.pro must resolve to GitHub Pages IPs (185.199.x.x)" },
            ].map(c => (
              <div key={c.check} className="flex items-start gap-2 text-xs">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{c.check}: </span>
                  <span className="text-gray-600 dark:text-gray-300">{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <CodeBlock label="Monitor script location">/home/ubuntu/monitor_deployment.sh</CodeBlock>
          <CodeBlock label="Run manually">{`bash /home/ubuntu/monitor_deployment.sh\n# Log saved to: /home/ubuntu/monitor_log.txt`}</CodeBlock>
        </Section>

        {/* ── GitHub Repo ── */}
        <Section title="Repository & Workflow" icon={<GitBranch size={16} />}>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-xs w-28 shrink-0">GitHub repo</span>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center gap-1">
                suly-1/meta-interview-guide <ExternalLink size={11} />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-xs w-28 shrink-0">Workflow file</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">.github/workflows/deploy.yml</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-xs w-28 shrink-0">Build script</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">pnpm build:standalone:static</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-xs w-28 shrink-0">Build config</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">vite.standalone.config.ts</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-xs w-28 shrink-0">Output dir</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">dist/standalone/</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-xs w-28 shrink-0">Live site</span>
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs flex items-center gap-1">
                metaengguide.pro <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </Section>

        {/* ── Candidate Visibility FAQ ── */}
        <Section title="Candidate Visibility FAQ" icon={<Users size={16} />}>
          <div className="space-y-4">
            {[
              {
                q: "Will candidates see the Admin button?",
                a: "Yes. The floating Admin button in the bottom-left corner is visible to everyone who visits the site. This is intentional — it is a navigation element, not a secret. However, without the admin token stored in their browser, clicking it leads to an admin page where all API calls return 403 Forbidden. They cannot view any data.",
              },
              {
                q: "Can candidates access admin data by guessing the URL?",
                a: "No. Every admin API procedure on the server validates the token via the x-admin-token header. Without the exact token, all requests are rejected with a 403 error. The admin pages are client-side routes that render but show no data without a valid token.",
              },
              {
                q: "What happens if a candidate clicks the Admin button?",
                a: "They are taken to /#/admin/feedback. The page loads but all data-fetching queries fail silently (or show an error state). They see an empty admin panel with no feedback, users, or stats visible.",
              },
              {
                q: "How do I access admin as the owner?",
                a: `Visit: ${SITE_URL}/#/admin/feedback?key=${ADMIN_TOKEN} — the token is saved to localStorage and you never need to include it in the URL again from that browser.`,
              },
            ].map((faq, i) => (
              <div key={i} className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Q: {faq.q}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">A: {faq.a}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-600">
        L4/L7 Community Study Resource — Admin Documentation · Last updated March 2026
      </footer>
    </div>
  );
}
