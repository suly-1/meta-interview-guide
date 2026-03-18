// useKeyboardShortcuts — global keyboard shortcuts for the guide
// 1-4: switch tabs | Space: start/pause timer | R: reveal Quick Drill answer
import { useEffect } from "react";

type ShortcutMap = {
  onTabSwitch?: (index: number) => void; // called with 0-3
  onTimerToggle?: () => void;
  onReveal?: () => void;
};

export function useKeyboardShortcuts({ onTabSwitch, onTimerToggle, onReveal }: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) return;

      // 1–4: switch tabs
      if (["1", "2", "3", "4"].includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onTabSwitch?.(parseInt(e.key) - 1);
        return;
      }

      // Space: toggle timer
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onTimerToggle?.();
        return;
      }

      // R: reveal Quick Drill answer
      if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onReveal?.();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onTabSwitch, onTimerToggle, onReveal]);
}
