import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  ArrowLeft, Settings, Lock, Unlock, RotateCcw, Calendar,
  Clock, CheckCircle, Shield, Users, FileText, RefreshCw, ToggleLeft, ToggleRight,
  AlertTriangle
} from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const [durationInput, setDurationInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmCohortReset, setConfirmCohortReset] = useState(false);
  const [cohortResetSuccess, setCohortResetSuccess] = useState<string | null>(null);
  const [lockSuccess, setLockSuccess] = useState(false);

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
          <Link href="/admin/disclaimer" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-400" />
            <h1 className="font-semibold text-sm">Site Settings</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/users" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
              <Users size={13} />
              Users
            </Link>
            <Link href="/admin/disclaimer" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
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
                  <><Clock size={16} className="text-amber-400" /> Time-Lock Active</>
                ) : (
                  <><Unlock size={16} className="text-emerald-400" /> Site is Open</>
                )}
              </h2>
              <p className="text-xs mt-0.5">
                {lockStatus?.isOwner && lockStatus?.isLocked ? (
                  <span className="text-amber-400 font-medium">Non-admin visitors are locked out. You bypass the gate as admin.</span>
                ) : lockStatus?.isOwner ? (
                  <span className="text-gray-500">You (admin) always have access regardless of lock status.</span>
                ) : null}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              lockStatus?.isLocked
                ? "bg-red-900/50 text-red-300"
                : lockStatus?.lockEnabled
                ? "bg-amber-900/50 text-amber-300"
                : "bg-emerald-900/50 text-emerald-300"
            }`}>
              {lockStatus?.isLocked ? "LOCKED" : lockStatus?.lockEnabled ? "COUNTING" : "OPEN"}
            </div>
          </div>

          {lockStatus?.lockEnabled && (
            <>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
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
                  <p className="text-gray-500 mb-0.5">Started</p>
                  <p className="text-white font-medium">
                    {lockStatus.lockStartDate
                      ? new Date(lockStatus.lockStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-3">
                  <p className="text-gray-500 mb-0.5">Locks / Locked at</p>
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
                  ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800/60 text-gray-300"
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
            <Calendar size={15} className="text-gray-400" />
            Advanced Settings
          </h3>
          <div className="space-y-4">
            {/* Custom start date */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Custom Start Date</label>
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
              <label className="block text-xs text-gray-500 mb-1.5">
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
          <p className="text-xs text-gray-500 mb-4">
            When enabled, all users must acknowledge the disclaimer before accessing the guide. Disable to let users in without the acknowledgment screen.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">
                {disclaimerStatus?.enabled ? "Gate is enabled" : "Gate is disabled"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
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
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
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
            <RefreshCw size={15} className="text-amber-400" />
            Cohort Reset
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Start a new cohort of candidates. This resets the 60-day clock to today and clears all disclaimer acknowledgments so every user must re-sign before accessing the guide.
          </p>
          {cohortResetSuccess && (
            <div className="mb-4 px-4 py-3 bg-emerald-900/30 border border-emerald-700/40 rounded-xl text-xs text-emerald-300">
              ✓ {cohortResetSuccess}
            </div>
          )}
          <button
            onClick={() => setConfirmCohortReset(true)}
            className="w-full py-3 rounded-xl bg-amber-900/30 border border-amber-700/40 hover:bg-amber-900/50 text-amber-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} />
            Start New Cohort
          </button>
        </div>

        {/* How it works */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How the Time-Lock Works</h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> When the timer is enabled, the site auto-locks after the set number of days from the start date.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> You (the admin) are <strong className="text-gray-300">never locked out</strong> — your login bypasses the gate entirely.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Locked visitors see a "Guide is currently closed" screen with no access to content.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Use <strong className="text-gray-300">Reset Clock</strong> to start a new cohort — this sets today as the new start date and enables the timer.</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Use <strong className="text-gray-300">Lock Now</strong> to immediately close the site for all non-admin users.</li>
          </ul>
        </div>
      </div>

      {/* Cohort Reset confirmation modal */}
      {confirmCohortReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-amber-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center">
                <RefreshCw size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Start New Cohort?</h3>
                <p className="text-sm text-gray-400">This will reset the 60-day clock and clear all disclaimer acknowledgments.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCohortReset(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
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
                <p className="text-sm text-gray-400">All non-admin users will immediately lose access.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLock(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
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
                <p className="text-sm text-gray-400">All visitors will immediately regain access to the guide.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUnlock(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
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
