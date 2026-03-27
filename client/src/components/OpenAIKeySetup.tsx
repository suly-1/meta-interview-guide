/**
 * OpenAI API Key Setup component
 * Shows a small inline prompt when the user tries to use an AI feature without a key.
 * The key is stored only in localStorage — never sent to any server.
 */
import { useState } from "react";
import { Key, ExternalLink, X, Eye, EyeOff, CheckCircle } from "lucide-react";
import { setOpenAIKey, clearOpenAIKey, hasOpenAIKey } from "@/lib/openai";

interface OpenAIKeySetupProps {
  onKeySet: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export default function OpenAIKeySetup({
  onKeySet,
  onDismiss,
  compact,
}: OpenAIKeySetupProps) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-")) {
      setError("Key must start with sk-");
      return;
    }
    setSaving(true);
    setError("");
    // Quick validation: try a tiny request
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (res.status === 401) {
        setError("Invalid API key — please check and try again.");
        setSaving(false);
        return;
      }
    } catch {
      // Network error — save anyway, will fail at use time
    }
    setOpenAIKey(trimmed);
    setSaving(false);
    onKeySet();
  };

  if (compact && hasOpenAIKey()) return null;

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-300">
              OpenAI API Key Required
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI features use your own key — stored only in your browser, never
              sent to any server.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={e => {
              setKey(e.target.value);
              setError("");
            }}
            placeholder="sk-..."
            className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm font-mono pr-9 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!key || saving}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium flex items-center gap-1.5 transition-colors"
        >
          {saving ? (
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <CheckCircle size={14} />
          )}
          Save
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ExternalLink size={11} />
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          Get a free key at platform.openai.com
        </a>
        <span className="text-muted-foreground">
          · New accounts get $5 free credits
        </span>
      </div>

      {hasOpenAIKey() && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle size={11} /> Key saved
          </span>
          <button
            onClick={() => {
              clearOpenAIKey();
              onDismiss?.();
            }}
            className="text-muted-foreground hover:text-red-400"
          >
            Remove key
          </button>
        </div>
      )}
    </div>
  );
}
