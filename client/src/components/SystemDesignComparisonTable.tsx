/**
 * SystemDesignComparisonTable — side-by-side matrix comparing all 8 Meta
 * system design patterns across key dimensions:
 *   Read/Write ratio, Consistency model, Primary storage, Scaling strategy,
 *   Meta example system, L7 differentiator.
 */
import { useState } from "react";
import { Table2, ChevronDown, ChevronUp } from "lucide-react";

type PatternRow = {
  name: string;
  shortName: string;
  readWrite: string;
  readWriteColor: string;
  consistency: string;
  consistencyColor: string;
  primaryStorage: string;
  scalingStrategy: string;
  metaExample: string;
  ic7Differentiator: string;
};

const ROWS: PatternRow[] = [
  {
    name: "News Feed (Facebook Feed)",
    shortName: "News Feed",
    readWrite: "Read-heavy (100:1)",
    readWriteColor: "bg-blue-100 text-blue-800",
    consistency: "Eventual",
    consistencyColor: "bg-amber-100 text-amber-800",
    primaryStorage: "Redis sorted set + Cassandra",
    scalingStrategy: "Fan-out on write (< 10K followers), fan-out on read (celebrities)",
    metaExample: "Facebook Feed, Instagram Home",
    ic7Differentiator: "Hybrid fan-out strategy; ML ranking on pre-computed candidates",
  },
  {
    name: "Messaging System (Messenger)",
    shortName: "Messenger",
    readWrite: "Write-heavy (1:3)",
    readWriteColor: "bg-rose-100 text-rose-800",
    consistency: "Strong (ordered)",
    consistencyColor: "bg-emerald-100 text-emerald-800",
    primaryStorage: "Cassandra (messages) + MySQL (metadata)",
    scalingStrategy: "Inbox sharding by user_id; WebSocket server fan-out",
    metaExample: "Messenger, WhatsApp",
    ic7Differentiator: "Message ordering with logical clocks; E2E encryption key management",
  },
  {
    name: "Distributed Rate Limiter",
    shortName: "Rate Limiter",
    readWrite: "Write-heavy (every request)",
    readWriteColor: "bg-rose-100 text-rose-800",
    consistency: "Eventual (acceptable over-limit)",
    consistencyColor: "bg-amber-100 text-amber-800",
    primaryStorage: "Redis (token bucket / sliding window)",
    scalingStrategy: "Local + global counters; Redis Lua scripts for atomicity",
    metaExample: "API Gateway, Login throttle",
    ic7Differentiator: "Distributed sliding window with Redis cluster; handling Redis failure gracefully",
  },
  {
    name: "Search Typeahead / Autocomplete",
    shortName: "Typeahead",
    readWrite: "Read-heavy (1000:1)",
    readWriteColor: "bg-blue-100 text-blue-800",
    consistency: "Eventual (stale OK)",
    consistencyColor: "bg-amber-100 text-amber-800",
    primaryStorage: "Trie (in-memory) + Cassandra (persistence)",
    scalingStrategy: "Prefix-based sharding; async trie rebuild from query logs",
    metaExample: "Facebook Search, Instagram Explore",
    ic7Differentiator: "Personalized ranking on top of global trie; A/B testing suggestion quality",
  },
  {
    name: "Notification Service",
    shortName: "Notifications",
    readWrite: "Write-heavy (push)",
    readWriteColor: "bg-rose-100 text-rose-800",
    consistency: "At-least-once delivery",
    consistencyColor: "bg-purple-100 text-purple-800",
    primaryStorage: "Kafka (queue) + MySQL (preferences)",
    scalingStrategy: "Fan-out workers per channel (push/email/SMS); deduplication layer",
    metaExample: "Facebook Notifications, Instagram alerts",
    ic7Differentiator: "Priority queues for time-sensitive vs. digest; cross-device dedup",
  },
  {
    name: "Ads Targeting System",
    shortName: "Ads Targeting",
    readWrite: "Read-heavy at serving",
    readWriteColor: "bg-blue-100 text-blue-800",
    consistency: "Eventual (ML model updates)",
    consistencyColor: "bg-amber-100 text-amber-800",
    primaryStorage: "Feature store (Redis) + offline warehouse (Hive/Spark)",
    scalingStrategy: "Two-stage retrieval (candidate gen → ranking); budget pacing",
    metaExample: "Meta Ads Platform",
    ic7Differentiator: "Real-time feature serving latency; auction theory (second-price); privacy-preserving targeting",
  },
  {
    name: "Distributed Cache (Memcache at Scale)",
    shortName: "Dist. Cache",
    readWrite: "Read-heavy (cache hit)",
    readWriteColor: "bg-blue-100 text-blue-800",
    consistency: "Eventual (invalidation)",
    consistencyColor: "bg-amber-100 text-amber-800",
    primaryStorage: "Memcached clusters + MySQL (source of truth)",
    scalingStrategy: "Consistent hashing; lease mechanism to prevent thundering herd",
    metaExample: "Meta Memcache (2013 paper)",
    ic7Differentiator: "Cross-region consistency; stale set problem; regional pools vs. cluster pools",
  },
  {
    name: "Video Upload & Processing Pipeline",
    shortName: "Video Pipeline",
    readWrite: "Write-heavy on upload, read-heavy on playback",
    readWriteColor: "bg-violet-100 text-violet-800",
    consistency: "Eventual (async transcode)",
    consistencyColor: "bg-amber-100 text-amber-800",
    primaryStorage: "S3/Blob store + CDN (playback)",
    scalingStrategy: "Chunked parallel upload; async transcode workers; CDN pre-warming for viral",
    metaExample: "Instagram Reels, Facebook Video",
    ic7Differentiator: "Adaptive bitrate (ABR) streaming; viral video CDN pre-warm strategy; content moderation pipeline",
  },
];

const COLUMNS = [
  { key: "readWrite",        label: "Read/Write Ratio",    width: "w-32" },
  { key: "consistency",      label: "Consistency",          width: "w-28" },
  { key: "primaryStorage",   label: "Primary Storage",      width: "w-40" },
  { key: "scalingStrategy",  label: "Scaling Strategy",     width: "w-52" },
  { key: "metaExample",      label: "Meta Example",         width: "w-36" },
  { key: "ic7Differentiator",label: "L7 Differentiator",   width: "w-52" },
] as const;

export default function SystemDesignComparisonTable() {
  const [expanded, setExpanded] = useState(true);
  const [highlightCol, setHighlightCol] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Table2 size={14} className="text-indigo-500" />
          <span className="text-xs font-bold text-gray-900 dark:text-white">Pattern Comparison Matrix</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">— click column headers to highlight</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-3 py-2.5 font-bold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 min-w-[120px]">
                  Pattern
                </th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => setHighlightCol(highlightCol === col.key ? null : col.key)}
                    className={`text-left px-3 py-2.5 font-bold cursor-pointer select-none transition-colors ${col.width} ${
                      highlightCol === col.key
                        ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                        : "text-gray-600 dark:text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50"
                    }`}
                  >
                    {col.label}
                    {highlightCol === col.key && <span className="ml-1 text-indigo-400">▲</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.shortName}
                  className={`border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 ${
                    i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/30"
                  }`}
                >
                  {/* Pattern name — sticky left */}
                  <td className={`px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 z-10 ${
                    i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"
                  }`}>
                    {row.shortName}
                  </td>

                  {/* Read/Write */}
                  <td className={`px-3 py-2.5 ${highlightCol === "readWrite" ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${row.readWriteColor}`}>
                      {row.readWrite}
                    </span>
                  </td>

                  {/* Consistency */}
                  <td className={`px-3 py-2.5 ${highlightCol === "consistency" ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${row.consistencyColor}`}>
                      {row.consistency}
                    </span>
                  </td>

                  {/* Primary Storage */}
                  <td className={`px-3 py-2.5 text-gray-600 dark:text-gray-400 leading-relaxed ${highlightCol === "primaryStorage" ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                    {row.primaryStorage}
                  </td>

                  {/* Scaling Strategy */}
                  <td className={`px-3 py-2.5 text-gray-600 dark:text-gray-400 leading-relaxed ${highlightCol === "scalingStrategy" ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                    {row.scalingStrategy}
                  </td>

                  {/* Meta Example */}
                  <td className={`px-3 py-2.5 ${highlightCol === "metaExample" ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                    <span className="text-blue-700 dark:text-blue-400 font-medium">{row.metaExample}</span>
                  </td>

                  {/* L7 Differentiator */}
                  <td className={`px-3 py-2.5 text-gray-500 dark:text-gray-400 leading-relaxed italic ${highlightCol === "ic7Differentiator" ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                    {row.ic7Differentiator}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer hint */}
      {expanded && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] text-gray-400">
            Click any column header to highlight that dimension across all patterns. Scroll right to see all columns.
          </p>
        </div>
      )}
    </div>
  );
}
