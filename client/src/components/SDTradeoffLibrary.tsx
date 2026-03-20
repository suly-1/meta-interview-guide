// SDTradeoffLibrary — D1: Meta-Specific Trade-off Library
// 50+ decisions organized by system pattern, with Meta-scale context and "what the interviewer is listening for".
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react";

interface TradeoffEntry {
  id: string;
  category: string;
  decision: string;
  optionA: string;
  optionB: string;
  tradeoffAxes: string;
  metaScaleContext: string;
  recommendation: string;
  whatInterviewerListensFor: string;
}

const TRADEOFFS: TradeoffEntry[] = [
  // Social Feed
  { id: "feed-1", category: "Social Feed", decision: "Fan-out on write vs. fan-out on read", optionA: "Fan-out on write: precompute feed on post creation, push to all followers' feed caches", optionB: "Fan-out on read: compute feed at read time by merging followed users' posts", tradeoffAxes: "Write amplification vs. read latency", metaScaleContext: "At Meta, Beyoncé has 150M followers. Fan-out on write = 150M cache writes per post. Fan-out on read = 150M DB reads per feed load. Meta uses a hybrid: fan-out on write for normal users (<10K followers), fan-out on read for celebrities.", recommendation: "Hybrid approach: fan-out on write for regular users, fan-out on read for high-follower accounts (threshold: ~10K followers)", whatInterviewerListensFor: "Do they identify the celebrity/hot user problem? Do they propose the hybrid without being prompted? Do they quantify the write amplification?" },
  { id: "feed-2", category: "Social Feed", decision: "Chronological vs. ranked feed", optionA: "Chronological: posts ordered by timestamp, simple to implement", optionB: "Ranked: ML-scored relevance ordering, requires ranking service", tradeoffAxes: "Simplicity vs. engagement", metaScaleContext: "Meta moved from chronological to ranked in 2012. Ranked feed requires a separate ranking service (EdgeRank/News Feed Ranking) that scores each post. At scale, pre-ranking is done offline; real-time ranking is done on a smaller candidate set.", recommendation: "For the interview, propose ranked with a candidate generation → scoring → re-ranking pipeline. Show you understand the ML serving layer.", whatInterviewerListensFor: "Do they mention the ranking pipeline? Do they understand that ranking at 500M DAU requires pre-computation?" },
  { id: "feed-3", category: "Social Feed", decision: "Pull vs. push notification for new posts", optionA: "Push: server pushes new post notifications to followers in real time (WebSocket/SSE)", optionB: "Pull: client polls for new posts on a schedule", tradeoffAxes: "Real-time latency vs. server connection overhead", metaScaleContext: "Maintaining WebSocket connections for 3B users is infeasible. Meta uses push for mobile (APNs/FCM) and pull with long-polling for web. Push is reserved for high-priority notifications.", recommendation: "Push via APNs/FCM for mobile, SSE/long-poll for web. Don't maintain persistent WebSocket connections for feed updates.", whatInterviewerListensFor: "Do they distinguish between mobile push and web push? Do they understand the connection overhead at scale?" },
  { id: "feed-4", category: "Social Feed", decision: "Infinite scroll vs. pagination", optionA: "Infinite scroll: load more posts as user scrolls, cursor-based pagination", optionB: "Page-based: explicit page numbers, offset-based pagination", tradeoffAxes: "UX vs. implementation complexity", metaScaleContext: "Offset-based pagination is O(n) at the DB layer — 'skip 10M rows' requires scanning 10M rows. At Meta scale, cursor-based pagination (WHERE id < last_seen_id) is required for performance.", recommendation: "Always use cursor-based pagination for feeds. The cursor is the last seen post ID or timestamp.", whatInterviewerListensFor: "Do they know why offset pagination fails at scale? Do they propose cursor-based without prompting?" },
  // Messaging
  { id: "msg-1", category: "Messaging", decision: "WebSockets vs. SSE vs. long-polling for real-time messaging", optionA: "WebSockets: full-duplex persistent connection, lowest latency", optionB: "SSE (Server-Sent Events): server-to-client only, simpler, HTTP/2 multiplexed", tradeoffAxes: "Bidirectionality vs. infrastructure complexity", metaScaleContext: "Messenger uses WebSockets for active chats. Each WebSocket connection is stateful — requires sticky routing or a connection registry (Redis) to route messages to the right server. At 1B active users, connection management is a major engineering challenge.", recommendation: "WebSockets for active messaging. SSE for notification-style updates. Long-polling as fallback for restrictive networks.", whatInterviewerListensFor: "Do they address the connection routing problem? Do they mention the need for a presence service?" },
  { id: "msg-2", category: "Messaging", decision: "Strong vs. eventual consistency for message delivery", optionA: "Strong consistency: message is only confirmed delivered when written to all replicas", optionB: "Eventual consistency: message confirmed on primary write, replicas catch up asynchronously", tradeoffAxes: "Delivery guarantee vs. write latency", metaScaleContext: "Messenger guarantees at-least-once delivery with deduplication. Messages are written to a primary DB with synchronous replication to 1 replica (semi-sync). Eventual consistency is acceptable for read replicas serving message history.", recommendation: "Semi-synchronous replication for message writes (durability), eventual consistency for read replicas (history). Dedup on client using message ID.", whatInterviewerListensFor: "Do they distinguish between write path (strong) and read path (eventual)? Do they mention deduplication?" },
  { id: "msg-3", category: "Messaging", decision: "Message storage: per-user inbox vs. shared conversation store", optionA: "Per-user inbox: each user has their own copy of every message they received", optionB: "Shared store: one copy of each message, referenced by conversation ID", tradeoffAxes: "Read simplicity vs. storage efficiency", metaScaleContext: "Messenger uses a shared conversation store (Cassandra) keyed by conversation_id + message_id. Per-user inbox would double storage for every 1:1 conversation. For group chats with 1000 members, per-user inbox = 1000× storage amplification.", recommendation: "Shared conversation store. User's inbox is a pointer to conversations, not a copy of messages.", whatInterviewerListensFor: "Do they identify the storage amplification problem for group chats? Do they propose a conversation-centric model?" },
  { id: "msg-4", category: "Messaging", decision: "End-to-end encryption vs. server-side encryption", optionA: "E2E encryption: messages encrypted on sender's device, only recipient can decrypt", optionB: "Server-side encryption: messages encrypted at rest on server, server can decrypt", tradeoffAxes: "Privacy vs. features (moderation, search, backup)", metaScaleContext: "WhatsApp uses E2E encryption (Signal Protocol). Messenger offers optional E2E (Secret Conversations). E2E prevents Meta from reading messages — limits spam detection, content moderation, and cross-device sync.", recommendation: "Mention the trade-off explicitly: E2E = stronger privacy but no server-side search/moderation. Server-side = enables features but Meta can read messages.", whatInterviewerListensFor: "Do they proactively raise the privacy vs. features trade-off? Do they know the Signal Protocol or similar?" },
  // Video Delivery
  { id: "video-1", category: "Video Delivery", decision: "Adaptive bitrate streaming (ABR) vs. fixed quality", optionA: "ABR: client dynamically selects quality based on bandwidth (HLS/DASH)", optionB: "Fixed quality: one quality level for all clients", tradeoffAxes: "User experience vs. encoding complexity", metaScaleContext: "Instagram Reels uses ABR. Each video is transcoded into 5-7 quality levels (240p, 360p, 480p, 720p, 1080p, 4K). Storage cost = 5-7× per video. Encoding pipeline must complete before video is available.", recommendation: "ABR with HLS/DASH. Mention the transcoding pipeline (upload → transcode → CDN). Show you understand the storage multiplier.", whatInterviewerListensFor: "Do they mention the transcoding pipeline? Do they quantify the storage multiplier? Do they know HLS/DASH?" },
  { id: "video-2", category: "Video Delivery", decision: "CDN pull vs. push for video distribution", optionA: "CDN pull: CDN fetches from origin on first request, caches for subsequent requests", optionB: "CDN push: proactively push popular videos to CDN edge nodes before requests arrive", tradeoffAxes: "Storage efficiency vs. first-play latency", metaScaleContext: "For viral videos, CDN pull causes a thundering herd on origin when a video first goes viral. Meta pre-warms CDN for predicted-viral content using engagement signals. Most videos use pull; top 0.1% by engagement use push.", recommendation: "Pull for the long tail, push/pre-warm for predicted-viral content. Mention engagement-based pre-warming.", whatInterviewerListensFor: "Do they identify the thundering herd problem for viral content? Do they propose pre-warming?" },
  { id: "video-3", category: "Video Delivery", decision: "Chunked upload vs. single upload for large videos", optionA: "Chunked (multipart) upload: split video into chunks, upload in parallel, reassemble", optionB: "Single upload: upload entire file in one HTTP request", tradeoffAxes: "Reliability and speed vs. simplicity", metaScaleContext: "A 4K 10-minute video = ~3GB. Single upload: any network interruption = restart from zero. Chunked upload: resume from last successful chunk. Instagram uses multipart upload with chunk size ~5MB.", recommendation: "Always use chunked/multipart upload for large files. Mention resumable uploads (chunk tracking in DB).", whatInterviewerListensFor: "Do they mention resumable uploads? Do they know the chunk size trade-off (too small = overhead, too large = retry cost)?" },
  // Distributed Storage
  { id: "storage-1", category: "Distributed Storage", decision: "SQL vs. NoSQL for social graph storage", optionA: "SQL (MySQL): ACID transactions, complex joins, schema enforcement", optionB: "NoSQL (TAO/Cassandra): horizontal scale, eventual consistency, no joins", tradeoffAxes: "Query flexibility vs. horizontal scalability", metaScaleContext: "Meta's social graph is stored in TAO (The Associations and Objects), a distributed graph store built on MySQL with a caching layer. Pure SQL can't scale to 3B users × avg 300 friends. TAO provides O(1) lookups for common graph traversals.", recommendation: "For social graph: graph-optimized store (TAO-like) or document store. For transactional data (payments, orders): SQL. Mention the specific access patterns driving the choice.", whatInterviewerListensFor: "Do they know about TAO or graph databases? Do they justify their choice with specific access patterns?" },
  { id: "storage-2", category: "Distributed Storage", decision: "Consistent hashing vs. range-based sharding", optionA: "Consistent hashing: keys distributed by hash, minimal resharding on node add/remove", optionB: "Range-based sharding: keys distributed by value range, supports range queries", tradeoffAxes: "Resharding cost vs. range query support", metaScaleContext: "Cassandra uses consistent hashing with virtual nodes. MySQL sharding at Meta uses range-based sharding by user_id for predictable data locality. Consistent hashing is preferred when resharding is frequent; range-based when range queries are needed.", recommendation: "Consistent hashing for cache clusters (frequent node changes). Range-based for DB shards where range queries are needed.", whatInterviewerListensFor: "Do they know both approaches? Do they choose based on access patterns rather than defaulting to one?" },
  { id: "storage-3", category: "Distributed Storage", decision: "Write-through vs. write-behind (write-back) cache", optionA: "Write-through: write to cache and DB synchronously on every write", optionB: "Write-behind: write to cache immediately, async write to DB in background", tradeoffAxes: "Data durability vs. write latency", metaScaleContext: "Write-through: every write hits DB — no write latency benefit from cache. Write-behind: cache acts as write buffer — lower latency but risk of data loss if cache fails before DB write. Meta uses write-through for user data (durability required), write-behind for analytics/counters (eventual consistency acceptable).", recommendation: "Write-through for critical data. Write-behind for counters and analytics where some loss is acceptable.", whatInterviewerListensFor: "Do they identify the data loss risk of write-behind? Do they apply the right pattern to the right data type?" },
  // Notifications
  { id: "notif-1", category: "Notifications", decision: "Synchronous vs. asynchronous notification delivery", optionA: "Synchronous: notification sent inline with the triggering action (e.g., post creation)", optionB: "Asynchronous: triggering action enqueues notification job, worker delivers asynchronously", tradeoffAxes: "Delivery latency vs. system coupling", metaScaleContext: "A single Instagram post by a celebrity triggers 150M notifications. Synchronous delivery would block the post creation API for minutes. Meta uses async: post creation → Kafka event → notification workers → APNs/FCM. Delivery latency: ~1-5 seconds.", recommendation: "Always async for notifications. The triggering action should be decoupled from delivery. Show the event-driven pipeline.", whatInterviewerListensFor: "Do they immediately propose async? Do they show the Kafka → worker → push service pipeline?" },
  { id: "notif-2", category: "Notifications", decision: "Per-event vs. batched notifications", optionA: "Per-event: send notification for every like, comment, follow immediately", optionB: "Batched: aggregate notifications over a time window, send digest", tradeoffAxes: "Real-time feedback vs. notification fatigue", metaScaleContext: "A viral post gets 10K likes in 10 minutes. Per-event = 10K notifications to the poster. Meta batches: '10K people liked your post' sent once per 5-minute window. Batching reduces APNs/FCM calls by 1000×.", recommendation: "Batch low-priority notifications (likes, reactions). Real-time for high-priority (direct messages, mentions).", whatInterviewerListensFor: "Do they identify the notification storm problem? Do they propose batching with priority tiers?" },
  // Search
  { id: "search-1", category: "Search", decision: "Inverted index vs. forward index", optionA: "Inverted index: term → list of documents containing that term (standard for full-text search)", optionB: "Forward index: document → list of terms in that document (used for ranking/features)", tradeoffAxes: "Query performance vs. ranking capability", metaScaleContext: "Elasticsearch uses inverted index for lookup + forward index for BM25 scoring. Both are needed. Inverted index answers 'which docs contain X?' Forward index answers 'what terms does doc Y contain?' (needed for TF-IDF/BM25).", recommendation: "Both. Inverted index for retrieval, forward index for ranking. Show you understand why both exist.", whatInterviewerListensFor: "Do they know why both indexes exist? Do they understand the role of each in the query pipeline?" },
  { id: "search-2", category: "Search", decision: "Real-time indexing vs. batch indexing", optionA: "Real-time: index documents as they are created/updated (near-real-time search)", optionB: "Batch: index documents in periodic bulk jobs (simpler, higher throughput)", tradeoffAxes: "Search freshness vs. indexing throughput", metaScaleContext: "Instagram posts must appear in search within seconds of creation. Real-time indexing via Kafka → Elasticsearch. Batch indexing for historical data migration or index rebuilds. Real-time indexing adds ~20% overhead vs. batch.", recommendation: "Real-time for new content, batch for bulk operations. Mention the Kafka → indexer pipeline.", whatInterviewerListensFor: "Do they propose a streaming pipeline for real-time indexing? Do they understand the freshness vs. throughput trade-off?" },
  // Rate Limiting
  { id: "ratelimit-1", category: "Rate Limiting", decision: "Fixed window vs. sliding window vs. token bucket rate limiting", optionA: "Fixed window: count requests in fixed time windows (e.g., 100 req/minute, reset at :00)", optionB: "Sliding window / token bucket: smooth rate limiting without burst at window boundary", tradeoffAxes: "Implementation simplicity vs. burst protection", metaScaleContext: "Fixed window allows 2× burst at window boundaries (100 req at :59 + 100 req at :00). Token bucket allows controlled bursts. Meta's API gateway uses token bucket for user-facing APIs. Redis INCR + EXPIRE for fixed window; Redis sorted set for sliding window.", recommendation: "Token bucket for user-facing APIs (smooth rate limiting). Fixed window for simple internal rate limiting. Show Redis implementation.", whatInterviewerListensFor: "Do they identify the burst problem with fixed windows? Do they know the Redis implementation for each?" },
  { id: "ratelimit-2", category: "Rate Limiting", decision: "Local vs. distributed rate limiting", optionA: "Local: each API server maintains its own rate limit counter (no coordination)", optionB: "Distributed: shared rate limit state in Redis, all servers coordinate", tradeoffAxes: "Performance vs. accuracy", metaScaleContext: "With 100 API servers and a 100 req/min limit, local rate limiting allows 100 × 100 = 10K req/min per user. Distributed rate limiting with Redis is accurate but adds ~1ms latency per request. Meta uses distributed rate limiting for user-facing APIs.", recommendation: "Distributed (Redis) for user-facing rate limits. Local for internal service-to-service limits where some inaccuracy is acceptable.", whatInterviewerListensFor: "Do they identify the local rate limiting problem with multiple servers? Do they know the Redis implementation?" },
  // Consistency
  { id: "consist-1", category: "Consistency", decision: "Strong vs. eventual consistency for user profile data", optionA: "Strong consistency: all reads see the latest write immediately (synchronous replication)", optionB: "Eventual consistency: reads may see stale data for a short window (async replication)", tradeoffAxes: "Data freshness vs. write latency and availability", metaScaleContext: "User profile updates (name, photo) can tolerate eventual consistency — seeing a 1-second stale profile is acceptable. Payment data requires strong consistency. Meta uses eventual consistency for most user data, strong consistency for financial transactions.", recommendation: "Classify data by consistency requirement. Profile/social data: eventual. Financial/inventory: strong. Show you can apply CAP theorem to specific data types.", whatInterviewerListensFor: "Do they apply consistency requirements to specific data types rather than choosing one globally?" },
  { id: "consist-2", category: "Consistency", decision: "Read-your-writes consistency for social interactions", optionA: "Guarantee: after a user posts, they always see their own post immediately", optionB: "No guarantee: user may not see their own post for up to 1 second (replica lag)", tradeoffAxes: "User experience vs. routing complexity", metaScaleContext: "After posting, routing the poster's reads to the primary DB (or the replica that received the write) ensures read-your-writes. This requires session stickiness or write-tracking. Meta implements this for post creation — you always see your own post immediately.", recommendation: "Implement read-your-writes for user-generated content. Route the author's reads to primary for 5 seconds after write, then allow replica reads.", whatInterviewerListensFor: "Do they identify this as a specific consistency requirement? Do they propose a concrete implementation?" },
  // Caching
  { id: "cache-1", category: "Caching", decision: "Cache-aside vs. read-through vs. write-through", optionA: "Cache-aside (lazy loading): application checks cache, on miss fetches from DB and populates cache", optionB: "Read-through: cache fetches from DB on miss automatically; write-through: cache writes to DB synchronously", tradeoffAxes: "Application complexity vs. cache consistency", metaScaleContext: "Meta's Memcached deployment (TAO) uses cache-aside for most data. Read-through is simpler but requires cache to know DB schema. Cache-aside gives more control over what gets cached and when.", recommendation: "Cache-aside for most use cases — more control, easier to reason about. Read-through for simple key-value lookups where cache and DB schemas align.", whatInterviewerListensFor: "Do they know all three patterns? Do they explain when to use each?" },
  { id: "cache-2", category: "Caching", decision: "TTL-based expiry vs. event-driven invalidation", optionA: "TTL: cache entries expire after a fixed time, stale data served until expiry", optionB: "Event-driven: cache invalidated immediately when underlying data changes", tradeoffAxes: "Stale data window vs. invalidation complexity", metaScaleContext: "TTL is simple but allows stale data for up to TTL seconds. Event-driven invalidation requires publishing cache invalidation events on every DB write — adds complexity but ensures freshness. Meta uses both: short TTL (1-5 min) for most data + event-driven invalidation for critical data (user permissions, auth tokens).", recommendation: "Short TTL as baseline + event-driven invalidation for critical data. Never rely solely on TTL for security-sensitive data.", whatInterviewerListensFor: "Do they identify the stale data risk of TTL-only? Do they propose event-driven invalidation for critical data?" },
  // Authentication
  { id: "auth-1", category: "Authentication", decision: "JWT vs. session tokens for API authentication", optionA: "JWT: stateless, self-contained token, no server-side storage needed", optionB: "Session token: opaque token, server looks up session in DB/cache on every request", tradeoffAxes: "Statelessness vs. revocability", metaScaleContext: "JWT: can't revoke without a blocklist (defeats statelessness). Session token: requires DB/Redis lookup on every request but can be revoked instantly. Meta uses session tokens (not JWT) for user authentication — instant revocation is required for security.", recommendation: "Session tokens for user auth (revocability required). JWT for service-to-service auth (statelessness is fine, short TTL limits revocation window).", whatInterviewerListensFor: "Do they identify the JWT revocation problem? Do they know when statelessness matters vs. when it doesn't?" },
  // Databases
  { id: "db-1", category: "Database Design", decision: "Denormalization vs. normalization for read-heavy workloads", optionA: "Normalized: no data duplication, complex joins for reads", optionB: "Denormalized: data duplicated for fast reads, complex writes to maintain consistency", tradeoffAxes: "Write complexity vs. read performance", metaScaleContext: "At Meta scale, joins across sharded tables are expensive or impossible. Denormalization is the norm — user's name is stored in every post, comment, and notification rather than joined from a users table. Consistency is maintained via event-driven updates.", recommendation: "Denormalize for read-heavy, sharded systems. Accept write complexity in exchange for read performance. Maintain consistency via events.", whatInterviewerListensFor: "Do they understand why joins don't work at scale? Do they propose event-driven consistency maintenance?" },
];

const CATEGORIES = Array.from(new Set(TRADEOFFS.map(t => t.category)));

export default function SDTradeoffLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = TRADEOFFS.filter(t => {
    const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch = !search || t.decision.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.tradeoffAxes.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <BookOpen size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-indigo-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Meta-Specific Trade-off Library
            </p>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              Trade-off Articulation accounts for ~25% of your score. This is not a pattern library — it is a <strong>reasoning library</strong>.
              For every decision, know: the trade-off axis, the Meta-scale context that tips the balance, and what the interviewer is listening for.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search decisions, categories, trade-off axes..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                cat === selectedCategory
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-500">{filtered.length} decision{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map(entry => (
          <div key={entry.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {entry.category}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">{entry.tradeoffAxes}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{entry.decision}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {entry.optionA.split(":")[0]} vs. {entry.optionB.split(":")[0]}
                </p>
              </div>
              {expandedId === entry.id ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />}
            </button>

            {expandedId === entry.id && (
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Option A</p>
                    <p className="text-xs text-blue-900 leading-relaxed">{entry.optionA}</p>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-1">Option B</p>
                    <p className="text-xs text-purple-900 leading-relaxed">{entry.optionB}</p>
                  </div>
                </div>

                {/* Meta-scale context */}
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Meta-Scale Context</p>
                  <p className="text-xs text-gray-800 leading-relaxed">{entry.metaScaleContext}</p>
                </div>

                {/* Recommendation */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Recommendation</p>
                  <p className="text-xs text-emerald-900 leading-relaxed">{entry.recommendation}</p>
                </div>

                {/* What interviewer listens for */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">What the Interviewer Is Listening For</p>
                  <p className="text-xs text-amber-900 leading-relaxed">{entry.whatInterviewerListensFor}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
