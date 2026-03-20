/**
 * useBookmarks — save/remove/list bookmarked sections across all tabs
 * Storage key: "meta-guide-bookmarks"
 */
import { useState, useCallback } from "react";

export interface Bookmark {
  id: string;           // unique id
  tabId: string;        // which tab (coding, behavioral, sysdesign, etc.)
  tabLabel: string;     // human-readable tab name
  title: string;        // section/question title
  subtitle?: string;    // optional subtitle
  ts: number;           // timestamp added
}

const STORAGE_KEY = "meta-guide-bookmarks";

function load(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") ?? [];
  } catch {
    return [];
  }
}

function save(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {}
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(load);

  const addBookmark = useCallback((bm: Omit<Bookmark, "id" | "ts">) => {
    setBookmarks(prev => {
      // Avoid duplicates by tabId + title
      if (prev.some(b => b.tabId === bm.tabId && b.title === bm.title)) return prev;
      const next = [{ ...bm, id: Math.random().toString(36).slice(2), ts: Date.now() }, ...prev];
      save(next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id);
      save(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((tabId: string, title: string) => {
    return bookmarks.some(b => b.tabId === tabId && b.title === title);
  }, [bookmarks]);

  const toggleBookmark = useCallback((bm: Omit<Bookmark, "id" | "ts">) => {
    const existing = bookmarks.find(b => b.tabId === bm.tabId && b.title === bm.title);
    if (existing) {
      setBookmarks(prev => {
        const next = prev.filter(b => b.id !== existing.id);
        save(next);
        return next;
      });
    } else {
      addBookmark(bm);
    }
  }, [bookmarks, addBookmark]);

  const clearAll = useCallback(() => {
    setBookmarks([]);
    save([]);
  }, []);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark, clearAll };
}
