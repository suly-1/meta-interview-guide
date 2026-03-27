/**
 * DailyNotificationReminder — Browser Notification API integration.
 * Lets users set a daily reminder time. At that time (checked via a
 * 1-minute interval), a browser notification fires with today's
 * Recommended Today problems from the weakest topics.
 *
 * All state persisted in localStorage. No server required.
 */
import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";

const STORAGE_KEY = "meta-guide-notification-settings";

interface NotificationSettings {
  enabled: boolean;
  time: string; // "HH:MM" in 24h format
  lastFiredDate: string; // "YYYY-MM-DD"
}

function getDefaultSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { enabled: false, time: "09:00", lastFiredDate: "" };
}

function saveSettings(s: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getRecommendedProblems(): string[] {
  // Read CTCI progress and drill ratings to find weakest topics
  try {
    const progress = JSON.parse(localStorage.getItem("ctci_progress_v1") || "{}");
    const drillRatings = JSON.parse(localStorage.getItem("meta-guide-drill-ratings") || "{}");

    // Count solved per topic
    const topicSolved: Record<string, number> = {};
    const topicTotal: Record<string, number> = {};
    CTCI_PROBLEMS.forEach(p => {
      const topic = p.topic;
      topicTotal[topic] = (topicTotal[topic] || 0) + 1;
      if (progress[p.id]?.solved) {
        topicSolved[topic] = (topicSolved[topic] || 0) + 1;
      }
    });

    // Score topics by weakness (low drill rating + low solve %)
    const topics = Object.keys(topicTotal);
    const scored = topics.map(t => {
      const solveRate = (topicSolved[t] || 0) / topicTotal[t];
      const drillRating = drillRatings[t] || 0; // 0 = undrilled
      const weaknessScore = (1 - solveRate) + (drillRating === 0 ? 1 : (5 - drillRating) / 5);
      return { topic: t, weaknessScore };
    });
    scored.sort((a, b) => b.weaknessScore - a.weaknessScore);

    // Pick 3 unsolved problems from the weakest 2 topics
    const weakTopics = scored.slice(0, 2).map(s => s.topic);
    const unsolved = CTCI_PROBLEMS.filter(p =>
      weakTopics.includes(p.topic) && !progress[p.id]?.solved
    );

    // Deterministic daily selection (seeded by date)
    const seed = getTodayStr().replace(/-/g, "");
    const seedNum = parseInt(seed) % unsolved.length || 1;
    const selected = [];
    for (let i = 0; i < Math.min(3, unsolved.length); i++) {
      selected.push(unsolved[(seedNum + i) % unsolved.length]);
    }
    return selected.map(p => p.name);
  } catch {
    return ["Two Sum", "Binary Tree Level Order Traversal", "LRU Cache"];
  }
}

function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return Promise.resolve("denied");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  return Notification.requestPermission();
}

function fireNotification(problems: string[]) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const body = problems.length > 0
    ? `Today's problems:\n• ${problems.join("\n• ")}`
    : "Open the guide to see your recommended problems for today.";
  new Notification("🎯 Meta Interview Prep — Daily Reminder", {
    body,
    icon: "/favicon.ico",
    tag: "meta-guide-daily",
    requireInteraction: false,
  });
}

export default function DailyNotificationReminder() {
  const [settings, setSettings] = useState<NotificationSettings>(getDefaultSettings);
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [testFired, setTestFired] = useState(false);
  const [supported] = useState(() => "Notification" in window);

  // Persist settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Check every minute if it's time to fire
  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hh}:${mm}`;
      const today = getTodayStr();

      if (currentTime === settings.time && settings.lastFiredDate !== today) {
        const problems = getRecommendedProblems();
        fireNotification(problems);
        setSettings(prev => {
          const next = { ...prev, lastFiredDate: today };
          saveSettings(next);
          return next;
        });
      }
    };

    check(); // check immediately on mount
    const interval = setInterval(check, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [settings.enabled, settings.time, permission, settings.lastFiredDate]);

  const handleEnable = useCallback(async () => {
    const perm = await requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      setSettings(prev => ({ ...prev, enabled: true }));
    }
  }, []);

  const handleDisable = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: false }));
  }, []);

  const handleTimeChange = useCallback((time: string) => {
    setSettings(prev => ({ ...prev, time, lastFiredDate: "" })); // reset so it fires today if time matches
  }, []);

  const handleTestFire = useCallback(() => {
    const problems = getRecommendedProblems();
    fireNotification(problems);
    setTestFired(true);
    setTimeout(() => setTestFired(false), 3000);
  }, []);

  const todayProblems = getRecommendedProblems();

  // Not supported
  if (!supported) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <AlertCircle size={16} className="text-gray-600 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          Browser notifications are not supported in this browser. Try Chrome or Firefox.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        settings.enabled && permission === "granted"
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-white"
      }`}>
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                settings.enabled && permission === "granted"
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}>
                {settings.enabled && permission === "granted"
                  ? <BellRing size={18} className="text-white" />
                  : <BellOff size={18} className="text-gray-700" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Daily Practice Reminder
                </p>
                <p className="text-xs text-gray-700 mt-0.5">
                  {settings.enabled && permission === "granted"
                    ? `Active — fires daily at ${settings.time}`
                    : "Get a browser notification with today's recommended problems"
                  }
                </p>
              </div>
            </div>

            {/* Toggle */}
            {permission === "granted" ? (
              <button
                onClick={settings.enabled ? handleDisable : handleEnable}
                className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors ${
                  settings.enabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            ) : (
              <button
                onClick={handleEnable}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Bell size={12} /> Enable
              </button>
            )}
          </div>

          {/* Permission denied warning */}
          {permission === "denied" && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-100 border border-red-200 rounded-xl">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700">Notifications blocked</p>
                <p className="text-xs text-red-600 mt-0.5">
                  You've blocked notifications for this site. To enable, click the lock icon in your browser's address bar → Site settings → Notifications → Allow.
                </p>
              </div>
            </div>
          )}

          {/* Time picker (only when enabled) */}
          {settings.enabled && permission === "granted" && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-600" />
                <label className="text-xs font-bold text-gray-600">Reminder time</label>
              </div>
              <input
                type="time"
                value={settings.time}
                onChange={e => handleTimeChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
              <button
                onClick={handleTestFire}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  testFired
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {testFired ? <CheckCircle2 size={12} /> : <Bell size={12} />}
                {testFired ? "Sent!" : "Test notification"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Today's preview */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-blue-100">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
            <Bell size={11} /> Today's Notification Preview
          </p>
        </div>
        <div className="px-4 py-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px]">🎯</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-900">Meta Interview Prep — Daily Reminder</p>
                <p className="text-[10px] text-gray-600">meta-interview-guide.manus.space</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              Today's problems:
            </p>
            <ul className="mt-1 space-y-0.5">
              {todayProblems.map((p, i) => (
                <li key={i} className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <span className="text-blue-400">•</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[10px] text-blue-600 mt-2 flex items-center gap-1">
            <Info size={10} />
            Problems update daily based on your weakest topics and unsolved CTCI problems.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">How It Works</p>
        </div>
        <div className="px-4 py-3 space-y-2">
          {[
            { step: "1", text: "Enable notifications and set your preferred daily time" },
            { step: "2", text: "The guide checks every minute while it's open in a browser tab" },
            { step: "3", text: "At your set time, a notification fires with 3 personalized problems" },
            { step: "4", text: "Problems are selected from your weakest topics (based on Quick Drill ratings and CTCI solve rate)" },
            { step: "5", text: "The notification fires once per day — even if you have multiple tabs open" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                {item.step}
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-amber-100 border-t border-amber-100">
          <p className="text-[11px] text-amber-900 flex items-start gap-1.5">
            <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
            The guide must be open in a browser tab for the reminder to fire. For background notifications, consider bookmarking the guide and opening it each morning.
          </p>
        </div>
      </div>
    </div>
  );
}
