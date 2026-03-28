/**
 * AdminSettings — /admin/settings
 * Manage cohort window, manual lock, disclaimer toggle, and cohort reset.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getAdminToken } from "@/components/AdminPinGate";
import { route } from "@/const";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Lock,
  Unlock,
  RotateCcw,
  Calendar,
  Shield,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

export default function AdminSettings() {
  const token = getAdminToken();
  const isAdmin = !!token;

  const { data: settings, refetch } = trpc.siteSettings.getSettings.useQuery(
    undefined,
    {
      enabled: isAdmin,
    }
  );

  const [lockDays, setLockDays] = useState("");
  const [lockStartDate, setLockStartDate] = useState("");
  const [lockMessage, setLockMessage] = useState("");

  const updateMutation = trpc.siteSettings.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const setManualLock = trpc.siteSettings.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Lock state changed");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const setDisclaimerEnabled =
    trpc.siteSettings.setDisclaimerEnabled.useMutation({
      onSuccess: () => {
        toast.success("Disclaimer gate updated");
        refetch();
      },
      onError: e => toast.error(e.message),
    });

  const cohortReset = trpc.siteSettings.cohortReset.useMutation({
    onSuccess: data => {
      toast.success(
        `Cohort reset — ${data.usersReset} disclaimer acknowledgments cleared`
      );
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const { data: pinChart } = trpc.adminPin.getPinAttemptChart.useQuery(
    undefined,
    { enabled: isAdmin, refetchInterval: 60_000 }
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={route("/")}>
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </a>
          </Link>
          <Settings size={18} className="text-blue-400" />
          <h1 className="text-lg font-semibold">Admin Settings</h1>
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

      <div className="container max-w-3xl py-8 space-y-6">
        {/* Cohort Window */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar size={16} className="text-blue-400" />
              Cohort Window
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Current start date
                </Label>
                <p className="text-sm font-mono">
                  {settings?.lockStartDate
                    ? new Date(settings.lockStartDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Window (days)
                </Label>
                <p className="text-sm font-mono">{settings?.lockDays ?? "—"}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="lockStartDate" className="text-xs">
                  New start date
                </Label>
                <Input
                  id="lockStartDate"
                  type="date"
                  value={lockStartDate}
                  onChange={e => setLockStartDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lockDays" className="text-xs">
                  Window (days)
                </Label>
                <Input
                  id="lockDays"
                  type="number"
                  min={1}
                  max={365}
                  placeholder={String(settings?.lockDays ?? 60)}
                  value={lockDays}
                  onChange={e => setLockDays(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lockMessage" className="text-xs">
                Lock message (shown to users)
              </Label>
              <Input
                id="lockMessage"
                placeholder={
                  settings?.lockMessage ?? "The cohort window has closed."
                }
                value={lockMessage}
                onChange={e => setLockMessage(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={() =>
                updateMutation.mutate({
                  ...(lockStartDate ? { lockStartDate } : {}),
                  ...(lockDays ? { lockDays: parseInt(lockDays) } : {}),
                  ...(lockMessage ? { lockMessage } : {}),
                })
              }
              disabled={updateMutation.isPending}
            >
              Save Cohort Settings
            </Button>
          </CardContent>
        </Card>

        {/* Manual Lock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock size={16} className="text-amber-400" />
              Manual Site Lock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Site is currently{" "}
                  <span
                    className={
                      settings?.manualLockEnabled === 1
                        ? "text-red-400 font-bold"
                        : "text-emerald-400 font-bold"
                    }
                  >
                    {settings?.manualLockEnabled === 1 ? "LOCKED" : "OPEN"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manual lock overrides the cohort window.
                </p>
              </div>
              <Switch
                checked={settings?.manualLockEnabled === 1}
                onCheckedChange={checked =>
                  setManualLock.mutate({ lockEnabled: checked })
                }
              />
            </div>
            {settings?.manualLockEnabled === 1 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setManualLock.mutate({ lockEnabled: false })}
              >
                <Unlock size={14} />
                Unlock Site
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer Gate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield size={16} className="text-purple-400" />
              Disclaimer Gate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Disclaimer gate is{" "}
                  <span
                    className={
                      settings?.disclaimerEnabled === 1
                        ? "text-emerald-400 font-bold"
                        : "text-muted-foreground"
                    }
                  >
                    {settings?.disclaimerEnabled === 1 ? "ENABLED" : "DISABLED"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When disabled, all users bypass the disclaimer screen.
                </p>
              </div>
              <Switch
                checked={settings?.disclaimerEnabled === 1}
                onCheckedChange={checked =>
                  setDisclaimerEnabled.mutate({ enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* PIN Attempt Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert size={16} className="text-amber-400" />
              Admin PIN Attempts — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pinChart || pinChart.days.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No PIN attempts recorded in the last 7 days.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={pinChart.days}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={d => d.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelFormatter={d => `Date: ${d}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="failed"
                    name="Failed"
                    fill="#ef4444"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="succeeded"
                    name="Succeeded"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cohort Reset */}
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-400">
              <AlertTriangle size={16} />
              Danger Zone — Cohort Reset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Resets the cohort start date to <strong>today</strong> and clears
              all disclaimer acknowledgments. Users will need to re-acknowledge
              the disclaimer. This action cannot be undone.
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure? This will reset the cohort clock and clear all disclaimer acknowledgments."
                  )
                ) {
                  cohortReset.mutate();
                }
              }}
              disabled={cohortReset.isPending}
            >
              <RotateCcw size={14} />
              Reset Cohort
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
