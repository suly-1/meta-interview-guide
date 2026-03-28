import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

interface ChangelogEntry {
  date: string;
  title: string;
  items: string[];
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Changelog() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog/history", { cache: "no-store" })
      .then(r => r.json())
      .then((data: ChangelogEntry[]) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-blue-500" />
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              What's New
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-3" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-64 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-3 bg-gray-100 dark:bg-gray-800/60 rounded w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No changelog entries found.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-10">
              {entries.map((entry, idx) => (
                <div key={idx} className="relative pl-8">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                      idx === 0
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
                    }`}
                  />

                  {/* Date */}
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    {formatDate(entry.date)}
                    {idx === 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-semibold normal-case tracking-normal">
                        Latest
                      </span>
                    )}
                  </p>

                  {/* Title */}
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {entry.title}
                  </h2>

                  {/* Items */}
                  <ul className="space-y-2">
                    {entry.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={13}
                          className="flex-shrink-0 text-emerald-500 mt-0.5"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
