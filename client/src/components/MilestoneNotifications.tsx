/**
 * MilestoneNotifications — Interview countdown milestone notifications
 * D-14, D-7, D-3, D-1 browser push notifications using the Notifications API.
 * Falls back to in-app banners if push permission is denied.
 */
import { useState, useEffect } from "react";
import { Bell, BellOff, Calendar, X } from "lucide-react";

interface MilestoneConfig {
  interviewDate: string; // ISO date string
  notificationsEnabled: boolean;
  lastNotifiedMilestone: number | null; // days remaining when last notified
}

const MILESTONES = [14, 7, 3, 1]; // days before interview

function loadConfig(): MilestoneConfig {
  try {
    return JSON.parse(localStorage.getItem("meta_milestone_config") || "null") ?? {
      interviewDate: "",
      notificationsEnabled: false,
      lastNotifiedMilestone: null,
    };
  } catch {
    return { interviewDate: "", notificationsEnabled: false, lastNotifiedMilestone: null };
  }
}

function saveConfig(config: MilestoneConfig) {
  localStorage.setItem("meta_milestone_config", JSON.stringify(config));
}

function getDaysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / 86400000);
}

function getMilestoneMessage(days: number): string {
  if (days === 14) return "2 weeks until your Meta interview! Time to start mock interviews and timed drills.";
  if (days === 7) return "1 week to go! Focus on your top 3 weak patterns and complete a full mock interview.";
  if (days === 3) return "3 days left! Review your STAR stories, system design frameworks, and do a final mock.";
  if (days === 1) return "Interview tomorrow! Rest well, review your notes, and trust your preparation.";
  return `${days} days until your Meta interview!`;
}

export default function MilestoneNotifications() {
  const [config, setConfig] = useState<MilestoneConfig>(() => loadConfig());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [banner, setBanner] = useState<{ days: number; message: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Check milestones on mount and every hour
  useEffect(() => {
    const check = () => {
      const days = getDaysUntil(config.interviewDate);
      if (days === null || days < 0) return;

      const nearestMilestone = MILESTONES.find(m => days <= m && days > 0);
      if (!nearestMilestone) return;

      // Only notify once per milestone
      if (config.lastNotifiedMilestone === nearestMilestone) return;

      const message = getMilestoneMessage(nearestMilestone);

      if (config.notificationsEnabled && permissionStatus === "granted") {
        new Notification("Meta Interview Countdown", {
          body: message,
          icon: "/favicon.ico",
          tag: `meta-milestone-${nearestMilestone}`,
        });
      } else {
        // Show in-app banner
        setBanner({ days: nearestMilestone, message });
      }

      const updated = { ...config, lastNotifiedMilestone: nearestMilestone };
      saveConfig(updated);
      setConfig(updated);
    };

    check();
    const interval = setInterval(check, 3600000); // hourly
    return () => clearInterval(interval);
  }, [config, permissionStatus]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Your browser doesn't support notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    if (result === "granted") {
      const updated = { ...config, notificationsEnabled: true };
      saveConfig(updated);
      setConfig(updated);
    }
  };

  const handleDateChange = (date: string) => {
    const updated = { ...config, interviewDate: date, lastNotifiedMilestone: null };
    saveConfig(updated);
    setConfig(updated);
    setBanner(null);
  };

  const toggleNotifications = () => {
    const updated = { ...config, notificationsEnabled: !config.notificationsEnabled };
    saveConfig(updated);
    setConfig(updated);
  };

  const daysUntil = getDaysUntil(config.interviewDate);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Bell size={20} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Interview Countdown
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">D-14, D-7, D-3, D-1 milestone reminders</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Calendar size={16} />
        </button>
      </div>

      {/* In-app banner */}
      {banner && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Bell size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-800">D-{banner.days} Milestone!</p>
            <p className="text-xs text-blue-600 mt-0.5">{banner.message}</p>
          </div>
          <button onClick={() => setBanner(null)} className="text-blue-400 hover:text-blue-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Countdown display */}
      {config.interviewDate && daysUntil !== null ? (
        <div className={`rounded-xl p-4 mb-4 text-center ${
          daysUntil <= 1 ? "bg-red-50 border border-red-200" :
          daysUntil <= 3 ? "bg-orange-50 border border-orange-200" :
          daysUntil <= 7 ? "bg-amber-50 border border-amber-200" :
          "bg-blue-50 border border-blue-200"
        }`}>
          {daysUntil > 0 ? (
            <>
              <p className="text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                D-{daysUntil}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {daysUntil === 1 ? "Interview tomorrow!" :
                 daysUntil <= 3 ? "Final stretch — stay focused!" :
                 daysUntil <= 7 ? "One week to go — keep grinding!" :
                 "You have time — use it wisely."}
              </p>
            </>
          ) : daysUntil === 0 ? (
            <>
              <p className="text-3xl font-bold text-red-600">Today!</p>
              <p className="text-sm text-gray-600 mt-1">Good luck — you've got this!</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-400">D+{Math.abs(daysUntil)}</p>
              <p className="text-sm text-gray-500 mt-1">Interview has passed</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-gray-500">Set your interview date to start the countdown</p>
        </div>
      )}

      {/* Milestone timeline */}
      {config.interviewDate && daysUntil !== null && daysUntil > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Milestones</p>
          <div className="flex gap-2">
            {MILESTONES.map(m => {
              const isPast = daysUntil <= m;
              const isNext = MILESTONES.find(ms => daysUntil <= ms) === m;
              return (
                <div
                  key={m}
                  className={`flex-1 py-2 rounded-lg text-center text-xs font-bold border transition-all ${
                    isNext ? "bg-blue-100 border-blue-300 text-blue-700" :
                    isPast ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400" :
                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500"
                  }`}
                >
                  D-{m}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Interview Date</label>
            <input
              type="date"
              value={config.interviewDate}
              onChange={e => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Push Notifications</p>
              <p className="text-xs text-gray-400">
                {permissionStatus === "granted" ? "Permission granted" :
                 permissionStatus === "denied" ? "Permission denied — use in-app banners" :
                 "Click to enable browser notifications"}
              </p>
            </div>
            {permissionStatus === "granted" ? (
              <button
                onClick={toggleNotifications}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  config.notificationsEnabled
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {config.notificationsEnabled ? <Bell size={12} /> : <BellOff size={12} />}
                {config.notificationsEnabled ? "On" : "Off"}
              </button>
            ) : (
              <button
                onClick={requestPermission}
                disabled={permissionStatus === "denied"}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}

      {!showSettings && (
        <button
          onClick={() => setShowSettings(true)}
          className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          <Calendar size={14} /> Set Interview Date
        </button>
      )}
    </div>
  );
}
