/**
 * BookmarksPanel — modal showing all saved bookmarks, grouped by tab
 */
import { X, Bookmark, Trash2, ExternalLink } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

const TAB_COLORS: Record<string, string> = {
  ctci:       "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  coding:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  mock:       "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "ai-round": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  behavioral: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-800",
  timeline:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  readiness:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  sysdesign:  "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  practice:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function BookmarksPanel({ open, onClose, onNavigate }: Props) {
  const { bookmarks, removeBookmark, clearAll } = useBookmarks();

  if (!open) return null;

  // Group by tab
  const grouped = bookmarks.reduce<Record<string, typeof bookmarks>>((acc, bm) => {
    if (!acc[bm.tabId]) acc[bm.tabId] = [];
    acc[bm.tabId].push(bm);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Bookmark size={18} className="text-amber-800 dark:text-amber-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bookmarks</h2>
              <p className="text-xs text-gray-600 dark:text-gray-200">{bookmarks.length} saved section{bookmarks.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bookmarks.length > 0 && (
              <button
                onClick={() => { if (confirm("Clear all bookmarks?")) clearAll(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all font-medium"
              >
                <Trash2 size={12} />
                Clear all
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark size={32} className="mx-auto text-gray-200 dark:text-gray-200 mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">No bookmarks yet</p>
              <p className="text-gray-600 dark:text-gray-200 text-xs mt-1">Click the bookmark icon on any section to save it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([tabId, items]) => (
                <div key={tabId}>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider mb-2 px-1">
                    {items[0].tabLabel}
                  </div>
                  <div className="space-y-1.5">
                    {items.map(bm => (
                      <div key={bm.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-800/50 group transition-all">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${TAB_COLORS[tabId] ?? "bg-gray-100 text-gray-600"}`}>
                          {tabId.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug truncate">{bm.title}</div>
                          {bm.subtitle && <div className="text-xs text-gray-600 dark:text-gray-200 mt-0.5 truncate">{bm.subtitle}</div>}
                          <div className="text-[10px] text-gray-700 dark:text-gray-300 mt-1">{new Date(bm.ts).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => { onNavigate(tabId); onClose(); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="Go to tab"
                          >
                            <ExternalLink size={12} />
                          </button>
                          <button
                            onClick={() => removeBookmark(bm.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                            title="Remove bookmark"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
