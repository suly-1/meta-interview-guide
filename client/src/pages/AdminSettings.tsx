import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  ArrowLeft, Settings, Lock, Unlock, RotateCcw, Calendar,
  Clock, CheckCircle, Shield, Users, FileText, RefreshCw, ToggleLeft, ToggleRight,
  AlertTriangle, KeyRound, AlertOctagon, Plus, Trash2, Wifi, Bell, BellOff
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminSettings() {
  const { user } = useAuth();
  const push = usePushNotifications();
  const [durationInput, setDurationInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmCohortReset, setConfirmCohortReset] = useState(false);
  const [cohortResetSuccess, setCohortResetSuccess] = useState<string | null>(null);
  const [lockSuccess, setLockSuccess] = useState(false);

  // Change PIN state
  const [showChangePinSection, setShowChangePinSection] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [changePinSuccess, setChangePinSuccess] = useState(false);

  // IP allowlist state
  const [newIpInput, setNewIpInput] = useState("");
  const [ipSaveSuccess, setIpSaveSuccess] = useState(false);

  const utils = trpc.useUtils();

  const { data: disclaimerStatus } = trpc.siteAccess.getDisclaimerEnabled.useQuery(undefined);
  const setDisclaimerEnabled = trpc.siteAccess.setDisclaimerEnabled.useMutation({
    onSuccess: () => {
      utils.siteAccess.getDisclaimerEnabled.invalidate();
      utils.siteAccess.checkAccess.invalidate();
    },
  });

  const { data: lockStatus, isLoading } = trpc.siteSettings.getLockStatus.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: pinAttempts, refetch: refetchPinAttempts } = trpc.adminPin.getPinAttemptHistory.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const { data: ipAllowlistData, refetch: refetchIpAllowlist } = trpc.adminPin.getIpAllowlist.useQuery(undefined);
  const allowedIps: string[] = ipAllowlistData?.ips ?? [];

  const setIpAllowlistMutation = trpc.adminPin.setIpAllowlist.useMutation({
    onSuccess: () => {
      refetchIpAllowlist();
      setNewIpInput("");
      setIpSaveSuccess(true);
      setTimeout(() => setIpSaveSuccess(false), 3000);
    },
  });

  const { data: chartData } = trpc.adminPin.getPinAttemptChart.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const resetClock = trpc.siteSettings.resetClock.useMutation({
    onSuccess: () => utils.siteSettings.getLockStatus.invalidate(),
  });

  const lockNow = trpc.siteSettings.lockNow.useMutation({
    onSuccess: () => {
      utils.siteSettings.getLockStatus.invalidate();
      setConfirmLock(false);
      setLockSuccess(true);
      setTimeout(() => setLockSuccess(false), 8000);
    },
  });

  const unlock = trpc.siteSettings.unlock.useMutation({
    onSuccess: () => {
      utils.siteSettings.getLockStatus.invalidate();
      setConfirmUnlock(false);
    },
  });

  const updateSettings = trpc.siteSettings.updateLockSettings.useMutation({
    onSuccess: () => utils.siteSettings.getLockStatus.invalidate(),
  });

  const changePinMutation = trpc.adminPin.changeAdminPin.useMutation({
    onSuccess: () => {
      setChangePinSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setChangePinError(null);
      setTimeout(() => {
        setChangePinSuccess(false);
        setShowChangePinSection(false);
      }, 4000);
    },
    onError: (err: { message: string }) => {
      setChangePinError(err.message);
    },
  });

  const handleChangePinSubmit = () => {
    setChangePinError(null);
    if (!currentPin || !newPin || !confirmPin) {
      setChangePinError("All fields are required.");
      return;
    }
    if (newPin.length < 4) {
      setChangePinError("New PIN must be at least 4 digits.");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setChangePinError("PIN must contain digits only.");
      return;
    }
    if (newPin !== confirmPin) {
      setChangePinError("New PIN and confirmation do not match.");
      return;
    }
    changePinMutation.mutate({ currentPin, newPin });
  };

  const cohortReset = trpc.admin.cohortReset.useMutation({
    onSuccess: (data) => {
      utils.siteSettings.getLockStatus.invalidate();
      setConfirmCohortReset(false);
      setCohortResetSuccess(`New cohort started. Lock clock reset to ${data.newStartDate}. All disclaimer acknowledgments cleared.`);
      setTimeout(() => setCohortResetSuccess(null), 8000);
    },
  });

  const progressPercent = lockStatus
    ? Math.min(100, Math.round(((lockStatus.daysElapsed ?? 0) / (lockStatus.lockDurationDays ?? 60)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/disclaimer" className="text-gray-600 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-400" />
            <h1 className="font-semibold text-sm">Site Settings</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/users" className="text-xs text-gray-700 hover:text-gray-700 flex items-center gap-1 transition-colors">
              <Users size={13} />
              Users
            </Link>
            <Link href="/admin/disclaimer" className="text-xs text-gray-700 hover:text-gray-700 flex items-center gap-1 transition-colors">
              <FileText size={13} />
              Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Lock success banner */}
        {lockSuccess && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-xl text-sm text-red-200">
            <Lock size={16} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Site is now locked for non-admin visitors.</p>
              <p className="text-xs text-red-300/70 mt-0.5">You can still browse normally because you are an admin. Use "Unlock Site" to re-open.</p>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className={`rounded-2xl border p-6 ${
          lockStatus?.isLocked
            ? "bg-red-950/20 border-red-800/40"
            : lockStatus?.lockEnabled
            ? "bg-amber-950/20 border-amber-800/40"
            : "bg-gray-900 border-gray-800"
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                {lockStatus?.isLocked ? (
                  <><Lock size={16} className="text-red-400" /> Site is Locked</>
                ) : lockStatus?.lockEnabled ? (
                  <><Clock size={16} className="text-amber-900" /> Time-Lock Active</>
                ) : (
                  <><Unlock size={16} className="text-emerald-400" /> Site is Open</>
                )}
              </h2>
              <p className="text-xs mt-0.5">
                {lockStatus?.isOwner && lockStatus?.isLocked ? (
                  <span className="text-amber-900 font-medium">Non-admin visitors are locked out. You bypass the gate as admin.</span>
                ) : lockStatus?.isOwner ? (
                  <span className="text-gray-700">You (admin) always have access regardless of lock status.</span>
                ) : null}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              lockStatus?.isLocked
                ? "bg-red-900/50 text-red-300"
                : lockStatus?.lockEnabled
                ? "bg-amber-900/50 text-amber-800"
                : "bg-emerald-900/50 text-emerald-300"
            }`}>
              {lockStatus?.isLocked ? "LOCKED" : lockStatus?.lockEnabled ? "COUNTING" : "OPEN"}
            </div>
          </div>

          {lockStatus?.lockEnabled && (
            <>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-700 mb-1.5">
                  <span>Day {lockStatus.daysElapsed ?? 0} of {lockStatus.lockDurationDays}</span>
                  <span>{lockStatus.isLocked ? "Expired" : `${lockStatus.daysRemaining} days remaining`}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressPercent >= 100 ? "bg-red-500" : progressPercent >= 80 ? "bg-amber-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-900/60 rounded-lg p-3">
                  <p className="text-gray-700 mb-0.5">Started</p>
                  <p className="text-white font-medium">
                    {lockStatus.lockStartDate
                      ? new Date(lockStatus.lockStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-3">
                  <p className="text-gray-700 mb-0.5">Locks / Locked at</p>
                  <p className="text-white font-medium">
                    {lockStatus.lockStartDate
                      ? new Date(
                          new Date(lockStatus.lockStartDate).getTime() + (lockStatus.lockDurationDays ?? 60) * 86400000
                        ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={15} className="text-blue-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Reset Clock */}
            <button
              onClick={() => resetClock.mutate()}
              disabled={resetClock.isPending}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-900/20 border border-blue-800/40 hover:bg-blue-900/40 text-blue-300 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={20} />
              <div className="text-center">
                <p className="text-sm font-medium">Reset Clock</p>
                <p className="text-xs text-blue-400/70">Start new 60-day cohort from today</p>
              </div>
            </button>

            {/* Lock Now / Unlock Site — requires confirmation for both */}
            {!lockStatus?.isLocked ? (
              <button
                onClick={() => setConfirmLock(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-900/20 border border-red-800/40 hover:bg-red-900/40 text-red-300 transition-colors"
              >
                <Lock size={20} />
                <div className="text-center">
                  <p className="text-sm font-medium">Lock Now</p>
                  <p className="text-xs text-red-400/70">Immediately close the site</p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setConfirmUnlock(true)}
                disabled={unlock.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/40 hover:bg-emerald-900/40 text-emerald-300 transition-colors disabled:opacity-50"
              >
                <Unlock size={20} />
                <div className="text-center">
                  <p className="text-sm font-medium">Unlock Site</p>
                  <p className="text-xs text-emerald-400/70">Re-open access for all users</p>
                </div>
              </button>
            )}

            {/* Disable / Enable Timer */}
            <button
              onClick={() => updateSettings.mutate({ lockEnabled: !lockStatus?.lockEnabled })}
              disabled={updateSettings.isPending}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors disabled:opacity-50 ${
                lockStatus?.lockEnabled
                  ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800/60 text-gray-700"
                  : "bg-emerald-900/20 border-emerald-800/40 hover:bg-emerald-900/40 text-emerald-300"
              }`}
            >
              {lockStatus?.lockEnabled ? <CheckCircle size={20} /> : <Clock size={20} />}
              <div className="text-center">
                <p className="text-sm font-medium">{lockStatus?.lockEnabled ? "Disable Timer" : "Enable Timer"}</p>
                <p className="text-xs opacity-70">{lockStatus?.lockEnabled ? "Turn off the 60-day timer" : "Turn on the 60-day timer"}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-gray-600" />
            Advanced Settings
          </h3>
          <div className="space-y-4">
            {/* Custom start date */}
            <div>
              <label className="block text-xs text-gray-700 mb-1.5">Custom Start Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDateInput}
                  onChange={e => setStartDateInput(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    if (startDateInput) {
                      updateSettings.mutate({ lockStartDate: startDateInput });
                      setStartDateInput("");
                    }
                  }}
                  disabled={!startDateInput || updateSettings.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Set
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">Override when the 60-day clock started</p>
            </div>

            {/* Custom duration */}
            <div>
              <label className="block text-xs text-gray-700 mb-1.5">
                Lock Duration (days) — current: {lockStatus?.lockDurationDays ?? 60}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationInput}
                  onChange={e => setDurationInput(e.target.value)}
                  placeholder="e.g. 90"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const d = parseInt(durationInput, 10);
                    if (d >= 1 && d <= 365) {
                      updateSettings.mutate({ lockDurationDays: d });
                      setDurationInput("");
                    }
                  }}
                  disabled={!durationInput || updateSettings.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Set
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">How many days before the site auto-locks</p>
            </div>
          </div>
        </div>

        {/* Disclaimer Gate Toggle */}
        <div className="bg-gray-900 rounded-2xl border border-blue-800/30 p-6">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <FileText size={15} className="text-blue-400" />
            Disclaimer Gate
          </h3>
          <p className="text-xs text-gray-700 mb-4">
            When enabled, all users must acknowledge the disclaimer before accessing the guide. Disable to let users in without the acknowledgment screen.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">
                {disclaimerStatus?.enabled ? "Gate is enabled" : "Gate is disabled"}
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                {disclaimerStatus?.enabled
                  ? "Users must acknowledge before accessing content"
                  : "Users can access content without acknowledgment"}
              </p>
            </div>
            <button
              onClick={() => setDisclaimerEnabled.mutate({ enabled: !disclaimerStatus?.enabled })}
              disabled={setDisclaimerEnabled.isPending || disclaimerStatus === undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                disclaimerStatus?.enabled
                  ? "bg-blue-900/30 text-blue-300 border border-blue-800/40 hover:bg-blue-900/50"
                  : "bg-gray-800 text-gray-600 border border-gray-700 hover:bg-gray-700"
              }`}
            >
              {disclaimerStatus?.enabled
                ? <><ToggleRight size={18} className="text-blue-400" /> Enabled</>
                : <><ToggleLeft size={18} /> Disabled</>}
            </button>
          </div>
        </div>

        {/* Cohort Reset */}
        <div className="bg-gray-900 rounded-2xl border border-amber-800/30 p-6">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <RefreshCw size={15} className="text-amber-900" />
            Cohort Reset
          </h3>
          <p className="text-xs text-gray-700 mb-4">
            Start a new cohort of candidates. This resets the 60-day clock to today and clears all disclaimer acknowledgments so every user must re-sign before accessing the guide.
          </p>
          {cohortResetSuccess && (
            <div className="mb-4 px-4 py-3 bg-emerald-900/30 border border-emerald-700/40 rounded-xl text-xs text-emerald-300">
              ✓ {cohortResetSuccess}
            </div>
          )}
          <button
            onClick={() => setConfirmCohortReset(true)}
            className="w-full py-3 rounded-xl bg-amber-900/30 border border-amber-700/40 hover:bg-amber-900/50 text-amber-800 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} />
            Start New Cohort
          </button>
        </div>

        {/* Change PIN Section */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Admin PIN</h3>
            </div>
            <button
              onClick={() => {
                setShowChangePinSection(!showChangePinSection);
                setChangePinError(null);
                setChangePinSuccess(false);
                setCurrentPin("");
                setNewPin("");
                setConfirmPin("");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showChangePinSection ? "Cancel" : "Change PIN"}
            </button>
          </div>
          <p className="text-xs text-gray-700 mb-4">
            The admin PIN is a second layer of protection on top of OAuth login.
            It is verified server-side and never stored in the browser.
          </p>

          {changePinSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-sm text-emerald-300 mb-4">
              <CheckCircle size={14} />
              PIN changed successfully. Your new PIN is active immediately.
            </div>
          )}

          {showChangePinSection && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter current PIN"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">New PIN (min 4 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter new PIN"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Re-enter new PIN"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                  autoComplete="new-password"
                />
              </div>

              {changePinError && (
                <p className="text-sm text-red-400">{changePinError}</p>
              )}

              <button
                onClick={handleChangePinSubmit}
                disabled={changePinMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {changePinMutation.isPending ? "Updating…" : "Update PIN"}
              </button>

              <p className="text-xs text-gray-600 text-center">
                The new PIN takes effect immediately — no server restart needed.
                Your current admin session remains valid.
              </p>
            </div>
          )}
        </div>

        {/* PIN Attempt History */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertOctagon size={16} className="text-red-400" />
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Failed PIN Attempts</h4>
            </div>
            <button
              onClick={() => refetchPinAttempts()}
              className="text-xs text-gray-700 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>
          {!pinAttempts || pinAttempts.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">No failed PIN attempts recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 pr-4 text-gray-700 font-medium">Time</th>
                    <th className="text-left py-2 pr-4 text-gray-700 font-medium">IP Address</th>
                    <th className="text-left py-2 text-gray-700 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pinAttempts.map((attempt: { id: number; ipAddress: string; createdAt: Date }) => (
                    <tr key={attempt.id} className="border-b border-gray-800/50 last:border-0">
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                        {new Date(attempt.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 font-mono text-red-400">{attempt.ipAddress}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 text-[10px] font-semibold">
                          Failed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-gray-600 mt-3">Shows the last 10 failed attempts. Auto-lock triggers after 5 failures within 15 minutes.</p>
        </div>

        {/* PIN Attempt Bar Chart */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon size={16} className="text-amber-900" />
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Failed Attempts — Last 7 Days</h4>
          </div>
          {!chartData || chartData.every(d => d.count === 0) ? (
            <p className="text-xs text-gray-600 text-center py-4">No failed PIN attempts in the last 7 days.</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#f87171' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="count" name="Failed Attempts" radius={[4, 4, 0, 0]}>
                  {(chartData ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#ef4444' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] text-gray-600 mt-2">Each bar represents the number of failed PIN attempts on that calendar day.</p>
        </div>

        {/* IP Allowlist */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={16} className="text-emerald-400" />
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Trusted IP Allowlist</h4>
          </div>
          <p className="text-[11px] text-gray-700 mb-4">IPs on this list bypass the PIN gate entirely. Supports exact IPv4 (e.g. <code className="text-gray-600">1.2.3.4</code>) and /24 CIDR (e.g. <code className="text-gray-600">192.168.1.0/24</code>).</p>
          {/* Current IPs */}
          {allowedIps.length === 0 ? (
            <p className="text-xs text-gray-600 mb-3">No trusted IPs configured. All visitors must enter the PIN.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {allowedIps.map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-emerald-300">{ip}</span>
                  <button
                    onClick={() => {
                      const updated = allowedIps.filter((_, i) => i !== idx);
                      setIpAllowlistMutation.mutate({ ips: updated });
                    }}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Add new IP */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newIpInput}
              onChange={e => setNewIpInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newIpInput.trim()) {
                  setIpAllowlistMutation.mutate({ ips: [...allowedIps, newIpInput.trim()] });
                }
              }}
              placeholder="e.g. 203.0.113.42 or 192.168.1.0/24"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={() => {
                if (newIpInput.trim()) {
                  setIpAllowlistMutation.mutate({ ips: [...allowedIps, newIpInput.trim()] });
                }
              }}
              disabled={!newIpInput.trim() || setIpAllowlistMutation.isPending}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {ipSaveSuccess && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle size={12} /> Allowlist saved.</p>
          )}
          {setIpAllowlistMutation.isError && (
            <p className="text-xs text-red-400 mt-2">Failed to save: {setIpAllowlistMutation.error?.message}</p>
          )}
        </div>

        {/* Push Notifications */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-violet-400" />
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Deployment Push Notifications</h4>
          </div>
          <p className="text-[11px] text-gray-700 mb-4">
            Receive a silent browser notification whenever a new version is deployed — no email required.
            Works on Chrome, Edge, and Firefox (not Safari Private Browsing).
          </p>
          {!push.supported ? (
            <p className="text-xs text-amber-900">Push notifications are not supported in this browser.</p>
          ) : push.permission === "denied" ? (
            <p className="text-xs text-red-400">Notifications are blocked. Open browser settings to allow them for this site.</p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={push.subscribed ? push.disable : push.enable}
                disabled={push.loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                  push.subscribed
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30"
                    : "bg-violet-600 text-white hover:bg-violet-500"
                }`}
              >
                {push.loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : push.subscribed ? (
                  <BellOff size={14} />
                ) : (
                  <Bell size={14} />
                )}
                {push.loading ? "Working…" : push.subscribed ? "Disable push" : "Enable push"}
              </button>
              {push.subscribed && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={12} /> Active on this browser
                </span>
              )}
            </div>
          )}
          {push.error && <p className="text-xs text-red-400 mt-2">{push.error}</p>}
        </div>

        {/* How it works */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-5">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">How the Time-Lock Works</h4>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> When the timer is enabled, the site auto-locks after the set number of days from the start date.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> You (the admin) are <strong className="text-gray-700">never locked out</strong> — your login bypasses the gate entirely.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Locked visitors see a "Guide is currently closed" screen with no access to content.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Use <strong className="text-gray-700">Reset Clock</strong> to start a new cohort — this sets today as the new start date and enables the timer.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Use <strong className="text-gray-700">Lock Now</strong> to immediately close the site for all non-admin users.</li>
          </ul>
        </div>
      </div>

      {/* Cohort Reset confirmation modal */}
      {confirmCohortReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-amber-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center">
                <RefreshCw size={18} className="text-amber-900" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Start New Cohort?</h3>
                <p className="text-sm text-gray-600">This will reset the 60-day clock and clear all disclaimer acknowledgments.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCohortReset(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-700 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => cohortReset.mutate()}
                disabled={cohortReset.isPending}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {cohortReset.isPending ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock confirmation modal */}
      {confirmLock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                <Lock size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lock the Site Now?</h3>
                <p className="text-sm text-gray-600">All non-admin users will immediately lose access.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLock(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-700 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => lockNow.mutate()}
                disabled={lockNow.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {lockNow.isPending ? "Locking..." : "Lock Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock confirmation modal */}
      {confirmUnlock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-emerald-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Unlock the Site?</h3>
                <p className="text-sm text-gray-600">All visitors will immediately regain access to the guide.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUnlock(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-700 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => unlock.mutate()}
                disabled={unlock.isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {unlock.isPending ? "Unlocking..." : "Unlock Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
