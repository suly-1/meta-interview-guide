/**
 * KeyboardShortcutOverlay — Modal listing all keyboard shortcuts.
 * Triggered by pressing ? anywhere in the app (when not in an input).
 * Exported as both the modal component and a hook to wire the ? key.
 */
import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

type ShortcutGroup = {
  title: string;
  shortcuts: Array<{ keys: string[]; description: string }>;
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["1"], description: "Switch to Coding Interview tab" },
      { keys: ["2"], description: "Switch to AI-Enabled Round tab" },
      { keys: ["3"], description: "Switch to Behavioral Interview tab" },
      { keys: ["4"], description: "Switch to Study Timeline tab" },
      { keys: ["5"], description: "Switch to Practice Tracker tab" },
      { keys: ["6"], description: "Switch to Readiness tab" },
      { keys: ["7"], description: "Switch to System Design tab" },
    ],
  },
  {
    title: "Coding Practice",
    shortcuts: [
      { keys: ["Space"], description: "Start / pause practice timer" },
      { keys: ["R"], description: "Reveal Quick Drill answer" },
      { keys: ["Ctrl", "Enter"], description: "Run code in editor" },
    ],
  },
  {
    title: "Behavioral Practice",
    shortcuts: [
      { keys: ["Space"], description: "Start / stop practice session timer" },
      { keys: ["→"], description: "Next question in flashcard deck" },
      { keys: ["←"], description: "Previous question in flashcard deck" },
      { keys: ["F"], description: "Flip flashcard (reveal model outline)" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["?"], description: "Open this keyboard shortcut overlay" },
      { keys: ["Esc"], description: "Close any open modal or overlay" },
    ],
  },
];

function KeyBadge({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 rounded border border-gray-300 bg-gray-100 text-gray-700 text-[11px] font-mono font-bold shadow-sm">
      {k}
    </kbd>
  );
}

interface KeyboardShortcutOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutOverlay({ open, onClose }: KeyboardShortcutOverlayProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-gray-500" />
            <span className="font-bold text-gray-900 dark:text-white text-sm">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content — two-column grid */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{group.title}</p>
              <div className="space-y-2">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{s.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {s.keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          <KeyBadge k={k} />
                          {ki < s.keys.length - 1 && <span className="text-[10px] text-gray-400">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-[10px] text-gray-400 text-center">
            Press <KeyBadge k="?" /> anywhere (outside input fields) to toggle this overlay · <KeyBadge k="Esc" /> to close
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: registers the ? key globally and returns open/close state.
 * Use this in the top-level component (e.g. Home.tsx).
 */
export function useKeyboardShortcutOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
