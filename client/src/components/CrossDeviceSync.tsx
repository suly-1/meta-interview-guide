/**
 * CrossDeviceSync — Lets users save and restore all progress across devices
 * using a short sync code backed by Supabase. No account required.
 */
import { useState } from "react";
import { CloudUpload, CloudDownload, RefreshCw, Copy, Check, X, Info } from "lucide-react";
import { toast } from "sonner";
import { pushSync, pullSync } from "@/lib/supabase";

// All localStorage keys that contain user progress
const SYNC_KEYS = [
  "meta_streak_v1",
  "meta_pattern_ratings_v1",
  "meta_pattern_notes_v1",
  "meta_sr_due_v1",
  "meta_bq_ratings_v1",
  "meta_star_notes_v1",
  "meta_mock_history_v1",
  "meta_coding_sessions_v1",
  "meta_interview_date_v1",
  "meta_readiness_trend_v1",
  "meta_pattern_time_v1",
  "meta_ctci_streak_v1",
  "meta_readiness_goal_v1",
  "meta_simulator_history_v1",
  "meta_hint_counts_v1",
  "meta_difficulty_estimates_v1",
  "meta_story_ratings_v1",
  "meta_tech_retro_projects_v1",
  "meta_sd_flashcard_sr_v1",
  "meta_gauntlet_v1",
  "meta_ai_review_history_v1",
  "meta_leaderboard_handle",
  "meta_prep_leaderboard_handle",
];

const SYNC_CODE_KEY = "meta_sync_code_v1";

function generateSyncCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function collectLocalData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try { data[key] = JSON.parse(val); } catch { data[key] = val; }
    }
  }
  return data;
}

function restoreLocalData(data: Record<string, unknown>) {
  for (const key of SYNC_KEYS) {
    if (key in data) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}

export default function CrossDeviceSync() {
  const [expanded, setExpanded] = useState(false);
  const [syncCode, setSyncCode] = useState(() => localStorage.getItem(SYNC_CODE_KEY) ?? "");
  const [inputCode, setInputCode] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"save" | "restore">("save");

  const handleSave = async () => {
    let code = syncCode;
    if (!code) {
      code = generateSyncCode();
      setSyncCode(code);
      localStorage.setItem(SYNC_CODE_KEY, code);
    }
    setPushing(true);
    try {
      const data = collectLocalData();
      await pushSync(code, data);
      toast.success(`Progress saved! Your sync code: ${code}`);
    } catch {
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setPushing(false);
    }
  };

  const handleRestore = async () => {
    const code = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) {
      toast.error("Please enter a valid sync code.");
      return;
    }
    setPulling(true);
    try {
      const data = await pullSync(code);
      if (!data) {
        toast.error("No data found for that sync code. Check the code and try again.");
        return;
      }
      restoreLocalData(data);
      setSyncCode(code);
      localStorage.setItem(SYNC_CODE_KEY, code);
      toast.success("Progress restored! Refreshing page…");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast.error("Failed to restore progress. Please try again.");
    } finally {
      setPulling(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNewCode = () => {
    const code = generateSyncCode();
    setSyncCode(code);
    localStorage.setItem(SYNC_CODE_KEY, code);
    toast.success("New sync code generated. Click Save to upload your progress.");
  };

  return (
    <div className="prep-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CloudUpload size={14} className="text-blue-400" />
          <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Cross-Device Sync
          </span>
          <span className="text-xs text-muted-foreground">Save & restore progress</span>
        </div>
        <div className="flex items-center gap-2">
          {syncCode && (
            <span className="text-xs text-blue-400 font-mono font-medium">{syncCode}</span>
          )}
          <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("save")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                tab === "save"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CloudUpload size={12} /> Save Progress
            </button>
            <button
              onClick={() => setTab("restore")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                tab === "restore"
                  ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CloudDownload size={12} /> Restore Progress
            </button>
          </div>

          <div className="p-4 space-y-4">
            {tab === "save" ? (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300/80">
                    Save your progress to the cloud with a unique sync code. Use this code on any device to restore your ratings, notes, mock history, and more.
                  </p>
                </div>

                {syncCode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
                        <span className="font-mono text-lg font-bold text-foreground tracking-widest flex-1 text-center">
                          {syncCode}
                        </span>
                        <button
                          onClick={handleCopy}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Copy sync code"
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Write this code down — you'll need it to restore on another device.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={pushing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                      >
                        {pushing ? <RefreshCw size={13} className="animate-spin" /> : <CloudUpload size={13} />}
                        {pushing ? "Saving…" : "Save Progress"}
                      </button>
                      <button
                        onClick={handleNewCode}
                        className="px-3 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs transition-all border border-border"
                        title="Generate new code"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={pushing}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {pushing ? <RefreshCw size={13} className="animate-spin" /> : <CloudUpload size={13} />}
                    {pushing ? "Generating code & saving…" : "Generate Sync Code & Save"}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Info size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300/80">
                    Enter your sync code to restore progress from another device. This will overwrite your current local data.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Your sync code</label>
                    <input
                      type="text"
                      value={inputCode}
                      onChange={e => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                      placeholder="e.g. ABCD1234"
                      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 tracking-widest text-center"
                      maxLength={8}
                      onKeyDown={e => e.key === "Enter" && handleRestore()}
                    />
                  </div>
                  <button
                    onClick={handleRestore}
                    disabled={pulling || inputCode.trim().length < 4}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pulling ? <RefreshCw size={13} className="animate-spin" /> : <CloudDownload size={13} />}
                    {pulling ? "Restoring…" : "Restore Progress"}
                  </button>
                  <p className="text-xs text-muted-foreground/60 text-center">
                    ⚠️ This will replace your current local progress with the saved version.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
