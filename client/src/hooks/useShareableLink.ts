// useShareableLink — encodes interview date + pattern/story progress into a URL hash
// Format: #share=base64(JSON)
// JSON: { date: string, patterns: string[], stories: string[] }
import { useCallback } from "react";

const PATTERNS_KEY = "meta-guide-progress-patterns";
const STORIES_KEY  = "meta-guide-progress-stories";
const COUNTDOWN_KEY = "meta-guide-interview-date";

function loadSet(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}

function loadDate(): string {
  return localStorage.getItem(COUNTDOWN_KEY) ?? "";
}

export function encodeShareState(): string {
  const payload = {
    date:     loadDate(),
    patterns: loadSet(PATTERNS_KEY),
    stories:  loadSet(STORIES_KEY),
  };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeShareState(hash: string): { date: string; patterns: string[]; stories: string[] } | null {
  try {
    const json = decodeURIComponent(atob(hash));
    const obj  = JSON.parse(json);
    if (typeof obj !== "object" || obj === null) return null;
    return {
      date:     typeof obj.date === "string" ? obj.date : "",
      patterns: Array.isArray(obj.patterns) ? obj.patterns : [],
      stories:  Array.isArray(obj.stories)  ? obj.stories  : [],
    };
  } catch { return null; }
}

export function applyShareState(state: { date: string; patterns: string[]; stories: string[] }) {
  if (state.date) localStorage.setItem(COUNTDOWN_KEY, state.date);
  if (state.patterns.length) localStorage.setItem(PATTERNS_KEY, JSON.stringify(state.patterns));
  if (state.stories.length)  localStorage.setItem(STORIES_KEY,  JSON.stringify(state.stories));
}

export function useShareableLink() {
  const generateLink = useCallback((): string => {
    const encoded = encodeShareState();
    const url = new URL(window.location.href);
    url.hash = `share=${encoded}`;
    return url.toString();
  }, []);

  return { generateLink };
}
