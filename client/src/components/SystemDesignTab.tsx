// SystemDesignTab — 8 Meta system design patterns + Meta Engineering Blog Feed
// Design: clean structured approach cards with expandable sections
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, BookOpen, Zap, Database, Server, Globe, MessageSquare, Search, Bell, BarChart2, Brain, Eye, EyeOff, Target, Table2, AlertTriangle, Layers } from "lucide-react";
import SystemDesignMockSession from "./SystemDesignMockSession";
import SystemDesignComparisonTable from "./SystemDesignComparisonTable";
import SDFailureModeDiagnostic from "./SDFailureModeDiagnostic";
import SDRequirementsTrainer from "./SDRequirementsTrainer";
import SDTradeoffDrill from "./SDTradeoffDrill";

interface DesignPattern {
  id: string;
  title: string;
  icon: React.ReactNode;
  tagline: string;
  difficulty: "Medium" | "Hard" | "Very Hard";
  metaRelevance: string;
  requirements: { functional: string[]; nonFunctional: string[] };
  dataModel: { entities: string[]; keyDecisions: string[] };
  api: { endpoints: string[] };
  scaleBottlenecks: string[];
  metaTips: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Medium: "text-amber-700 bg-amber-50 border-amber-200",
  Hard: "text-orange-700 bg-orange-50 border-orange-200",
  "Very Hard": "text-red-700 bg-red-50 border-red-200",
};

const DESIGN_PATTERNS: DesignPattern[] = [
  {
    id: "news-feed",
    title: "News Feed (Facebook Feed)",
    icon: <Globe size={16} />,
    tagline: "Fan-out on write vs. fan-out on read",
    difficulty: "Hard",
    metaRelevance: "Core Meta product — expect this at IC6+. Interviewers probe the fan-out trade-off deeply.",
    requirements: {
      functional: ["User can post text/images/videos", "User sees a ranked feed of posts from friends/pages", "Feed updates in near-real-time", "Pagination / infinite scroll"],
      nonFunctional: ["500M DAU, 100M posts/day", "Feed load < 200ms p99", "High availability (99.99%)", "Eventual consistency acceptable"],
    },
    dataModel: {
      entities: ["User(id, name, follower_count)", "Post(id, author_id, content, media_urls, created_at, like_count)", "FeedItem(user_id, post_id, score, created_at)", "Follow(follower_id, followee_id)"],
      keyDecisions: ["Separate post store (Cassandra/MySQL) from feed store (Redis sorted set)", "Pre-compute feed for users with <10K followers (fan-out on write)", "Pull feed for celebrities (fan-out on read) to avoid write amplification", "Score = recency * engagement_weight"],
    },
    api: {
      endpoints: ["GET /feed?user_id={id}&cursor={cursor}&limit=20 → {posts[], next_cursor}", "POST /posts {content, media_ids[]} → {post_id}", "POST /posts/{id}/like → {like_count}", "DELETE /posts/{id}"],
    },
    scaleBottlenecks: ["Celebrity fan-out: 1 Beyoncé post → 100M writes. Solve with lazy fan-out + pull hybrid.", "Feed ranking: can't rank in real-time at scale. Pre-rank on write, re-rank on read with lightweight model.", "Media storage: CDN + object store (S3-like). Never store blobs in DB.", "Cache invalidation: use TTL + event-driven invalidation on new posts."],
    metaTips: ["Always ask: 'Should I use fan-out on write or read?' — answer depends on follower distribution.", "Mention TAO (Meta's graph store) for social graph queries.", "Discuss EdgeRank / ML ranking as a follow-up even if not asked.", "Pagination: cursor-based, not offset-based (offset breaks with new inserts)."],
    color: "#1e3a8a",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  {
    id: "messaging",
    title: "Messaging System (Messenger)",
    icon: <MessageSquare size={16} />,
    tagline: "Real-time delivery, ordering, and at-least-once guarantees",
    difficulty: "Very Hard",
    metaRelevance: "Messenger is a core Meta product. Tests distributed systems depth: ordering, delivery guarantees, presence.",
    requirements: {
      functional: ["1:1 and group messaging (up to 256 members)", "Real-time delivery with read receipts", "Message history / search", "Online presence indicator", "Push notifications for offline users"],
      nonFunctional: ["1B DAU, 100B messages/day", "Message delivery < 100ms p99", "Messages never lost (at-least-once)", "Ordered delivery within a conversation"],
    },
    dataModel: {
      entities: ["Message(id, thread_id, sender_id, content, created_at, client_msg_id)", "Thread(id, type, participants[], last_msg_id)", "UserPresence(user_id, status, last_seen, server_id)", "Inbox(user_id, thread_id, unread_count, last_read_msg_id)"],
      keyDecisions: ["Use client_msg_id for idempotency (dedup on retry)", "Thread-level sequence numbers for ordering (not global)", "Store messages in Cassandra partitioned by thread_id", "Presence via heartbeat to dedicated presence servers"],
    },
    api: {
      endpoints: ["WebSocket /ws?user_id={id} — bidirectional real-time channel", "POST /messages {thread_id, content, client_msg_id} → {msg_id, seq_no}", "GET /threads/{id}/messages?before={seq_no}&limit=50 → {messages[]}", "GET /threads/{id}/presence → {user_id, status}[]"],
    },
    scaleBottlenecks: ["Connection fan-out: 1 message → N recipients on different servers. Use pub/sub (Kafka) + server routing table.", "Group messages: fan-out to 256 recipients. Use async delivery queue.", "Ordering: use Lamport clocks or server-assigned seq_no per thread.", "Offline delivery: push via APNs/FCM with retry + expiry."],
    metaTips: ["Distinguish 'sent', 'delivered', 'read' receipts — each requires a different mechanism.", "Mention MQTT or custom protocol for mobile (vs WebSocket for web).", "Discuss message retention policy and GDPR deletion.", "For group chats: separate 'fan-out service' from 'message store'."],
    color: "#065f46",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  {
    id: "rate-limiter",
    title: "Distributed Rate Limiter",
    icon: <Server size={16} />,
    tagline: "Token bucket vs. sliding window log at distributed scale",
    difficulty: "Medium",
    metaRelevance: "Common infrastructure question. Tests understanding of distributed state, consistency trade-offs, and Redis.",
    requirements: {
      functional: ["Limit requests per user/IP/API key", "Multiple rate limit rules (per second, per minute, per day)", "Return 429 with Retry-After header", "Admin API to update rules without restart"],
      nonFunctional: ["< 5ms overhead per request", "Handles 1M RPS", "Eventual consistency acceptable (some over-counting OK)", "No single point of failure"],
    },
    dataModel: {
      entities: ["RateLimitRule(id, key_type, limit, window_seconds, algorithm)", "Counter(key, window_start, count, expires_at)", "TokenBucket(key, tokens, last_refill_ts)"],
      keyDecisions: ["Token bucket: smooth traffic, allows bursts. Sliding window log: precise but memory-heavy.", "Fixed window counter: simplest, but boundary burst problem.", "Redis INCR + EXPIRE for atomic counter. Lua script for token bucket atomicity.", "Local cache + async sync to Redis for ultra-low latency (accept slight over-counting)."],
    },
    api: {
      endpoints: ["checkLimit(user_id, rule_id) → {allowed: bool, remaining: int, retry_after_ms: int}", "POST /admin/rules {key_type, limit, window_seconds} → {rule_id}", "GET /admin/rules/{key_type} → {rules[]}", "DELETE /admin/rules/{rule_id}"],
    },
    scaleBottlenecks: ["Redis single node: shard by key hash. Use Redis Cluster.", "Race condition: use Lua scripts or WATCH/MULTI for atomicity.", "Rule propagation: pub/sub to invalidate local caches across fleet.", "Sliding window at scale: approximate with sliding window counter (hybrid of fixed windows)."],
    metaTips: ["Always ask: 'What's the acceptable error rate?' — this determines algorithm choice.", "Mention the boundary burst problem with fixed windows and how sliding window solves it.", "Discuss cell-based rate limiting (per datacenter) vs. global rate limiting.", "Redis Lua script is the standard answer for atomic token bucket."],
    color: "#92400e",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  {
    id: "typeahead",
    title: "Search Typeahead / Autocomplete",
    icon: <Search size={16} />,
    tagline: "Trie vs. inverted index, prefix matching at scale",
    difficulty: "Medium",
    metaRelevance: "Search bar autocomplete is everywhere at Meta. Tests data structure knowledge and caching strategy.",
    requirements: {
      functional: ["Return top 5-10 suggestions for a prefix in < 100ms", "Suggestions ranked by popularity/relevance", "Support for typo tolerance (fuzzy matching)", "Personalized suggestions (recent searches, friends)"],
      nonFunctional: ["10B queries/day, 100K QPS peak", "< 100ms p99 end-to-end", "Suggestions update within 1 hour of trending changes", "Multi-language support"],
    },
    dataModel: {
      entities: ["TrieNode(prefix, children{}, top_k_suggestions[])", "SearchLog(query, user_id, timestamp, result_clicked)", "SuggestionScore(query, score, updated_at)", "UserRecentSearch(user_id, query, timestamp)"],
      keyDecisions: ["In-memory trie on each server for O(L) prefix lookup (L = prefix length)", "Pre-compute top-K per prefix offline (Hadoop/Spark job every hour)", "Store trie in Redis as serialized blob, load on server start", "Personalization: merge global suggestions with user's recent searches client-side"],
    },
    api: {
      endpoints: ["GET /suggest?q={prefix}&user_id={id}&limit=10 → {suggestions[]}", "POST /search/log {query, user_id, result_id} — async, fire-and-forget", "GET /suggest/trending?category={cat} → {queries[]}", "DELETE /users/{id}/recent-searches"],
    },
    scaleBottlenecks: ["Trie memory: full trie for all queries is too large. Shard by first 2 chars of prefix.", "Update latency: batch updates every 1h via Spark. For trending, use streaming (Flink) with 5-min lag.", "Cold start: new server loads trie from Redis/S3 on startup (< 30s acceptable).", "Typo tolerance: Levenshtein distance is expensive. Use n-gram index or phonetic hashing for approximation."],
    metaTips: ["Distinguish 'search suggestions' (prefix match) from 'search results' (full-text ranking) — different systems.", "Mention that trie is the classic answer but inverted index scales better for large corpora.", "Discuss how to handle 'did you mean?' separately from autocomplete.", "For Meta specifically: mention social graph signals (friends searched for X) as ranking feature."],
    color: "#4338ca",
    bgColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  {
    id: "notification",
    title: "Notification Service",
    icon: <Bell size={16} />,
    tagline: "Multi-channel delivery, deduplication, and user preferences",
    difficulty: "Medium",
    metaRelevance: "Meta sends billions of notifications daily. Tests async systems, fan-out, and reliability patterns.",
    requirements: {
      functional: ["Send push (iOS/Android), email, and in-app notifications", "User preference management (opt-out per type)", "Deduplication (no duplicate notifications)", "Scheduled and triggered notifications", "Notification history"],
      nonFunctional: ["1B notifications/day", "Delivery within 5 seconds for real-time events", "At-least-once delivery", "Graceful degradation if push provider is down"],
    },
    dataModel: {
      entities: ["Notification(id, user_id, type, content, channel, status, created_at, sent_at)", "UserPreference(user_id, notification_type, channel, enabled)", "DeviceToken(user_id, platform, token, updated_at)", "NotificationTemplate(type, channel, subject_template, body_template)"],
      keyDecisions: ["Event-driven: services publish events to Kafka, notification service consumes", "Template rendering: separate service, supports i18n", "Dedup key: hash(user_id + event_id + notification_type) with Redis TTL", "Retry with exponential backoff + dead letter queue for failures"],
    },
    api: {
      endpoints: ["POST /notifications/send {user_id, type, data} → {notification_id}", "GET /notifications?user_id={id}&cursor={cursor} → {notifications[], next_cursor}", "PUT /preferences/{user_id} {type, channel, enabled}", "POST /devices/register {user_id, platform, token}"],
    },
    scaleBottlenecks: ["Fan-out: 1 event → millions of users (e.g., breaking news). Use tiered fan-out with priority queues.", "Push provider rate limits: APNs/FCM have per-second limits. Use connection pooling + batching.", "Deduplication at scale: Redis SET with TTL. Shard by user_id.", "Notification fatigue: implement frequency capping per user per type."],
    metaTips: ["Always separate 'notification generation' from 'notification delivery' — different scaling profiles.", "Mention priority queues: real-time (like/comment) vs. batch (weekly digest).", "Discuss idempotency: what happens if the same event triggers twice?", "For Meta: mention that push tokens expire and need refresh — device token management is a real problem."],
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
  },
  {
    id: "ads-targeting",
    title: "Ads Targeting System",
    icon: <BarChart2 size={16} />,
    tagline: "Real-time bidding, targeting criteria matching, and impression logging",
    difficulty: "Very Hard",
    metaRelevance: "Ads is Meta's core revenue engine. IC7 questions often involve this. Tests ML systems, real-time bidding, and privacy.",
    requirements: {
      functional: ["Advertisers define targeting criteria (demographics, interests, behaviors)", "Real-time ad selection for each page load (< 50ms)", "Impression and click tracking", "Budget management (daily/lifetime caps)", "A/B testing support"],
      nonFunctional: ["10B ad impressions/day", "Ad selection < 50ms p99", "Budget enforcement within 5% accuracy", "Privacy-preserving (no PII in ad logs)"],
    },
    dataModel: {
      entities: ["Campaign(id, advertiser_id, budget, start_date, end_date, status)", "AdSet(id, campaign_id, targeting_criteria, bid_amount, daily_budget)", "Ad(id, adset_id, creative_url, headline, cta)", "Impression(id, ad_id, user_id_hash, timestamp, placement, cost)", "UserSegment(segment_id, user_ids[], criteria)"],
      keyDecisions: ["Two-stage retrieval: candidate generation (fast, broad) → ranking (ML model, slow)", "User segments pre-computed offline, stored in Redis for real-time lookup", "Budget pacing: token bucket per campaign, distributed with Redis Lua", "Privacy: hash user IDs in logs, use differential privacy for aggregate reporting"],
    },
    api: {
      endpoints: ["GET /ads/select?user_segment_ids[]={ids}&placement={p}&context={c} → {ad, bid_price}", "POST /impressions {ad_id, user_id_hash, placement, timestamp}", "POST /clicks {impression_id, user_id_hash}", "PUT /campaigns/{id}/budget {daily_budget, total_budget}"],
    },
    scaleBottlenecks: ["Candidate retrieval: inverted index on targeting criteria. Shard by targeting dimension.", "Ranking latency: ML model must run in < 10ms. Use ONNX/TensorRT, feature caching.", "Budget enforcement: distributed token bucket. Accept ~5% over-spend for performance.", "Impression logging: write to Kafka, async batch to data warehouse. Never block ad serving on log write."],
    metaTips: ["Mention the two-stage pipeline explicitly: retrieval → ranking → auction.", "Discuss Vickrey (second-price) auction vs. first-price — Meta uses a modified version.", "Privacy is a key concern: mention GDPR, Apple ATT, and how Meta has adapted.", "For IC7: discuss how you'd A/B test the ranking model without biasing the auction."],
    color: "#065f46",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  {
    id: "distributed-cache",
    title: "Distributed Cache (Memcache at Scale)",
    icon: <Database size={16} />,
    tagline: "Look-aside caching, thundering herd, and consistency",
    difficulty: "Hard",
    metaRelevance: "Meta published the famous Memcache paper. Interviewers expect you to know it. Tests caching patterns and consistency.",
    requirements: {
      functional: ["Key-value cache with TTL", "Horizontal scaling (add nodes without downtime)", "Cache invalidation on DB write", "Support for large values (up to 1MB)"],
      nonFunctional: ["1B QPS read, 100M QPS write", "< 1ms p99 read latency", "99.99% availability", "Eventual consistency acceptable"],
    },
    dataModel: {
      entities: ["CacheEntry(key, value, ttl, version)", "CacheCluster(id, nodes[], hash_ring)", "InvalidationLog(key, timestamp, source_db)"],
      keyDecisions: ["Consistent hashing for node assignment (minimal rehashing on scale-out)", "Look-aside (cache-aside) pattern: app checks cache, falls back to DB, populates cache", "Lease mechanism to prevent thundering herd on cache miss", "Invalidation via McSqueal (MySQL binlog → invalidation messages)"],
    },
    api: {
      endpoints: ["get(key) → {value, hit: bool}", "set(key, value, ttl_seconds) → {ok}", "delete(key) → {ok}", "get_many(keys[]) → {key: value}[] — batched for efficiency"],
    },
    scaleBottlenecks: ["Thundering herd: many requests miss cache simultaneously. Solve with leases (one request fetches, others wait).", "Hot keys: single key gets millions of QPS. Replicate hot keys across multiple nodes.", "Regional consistency: use invalidation pipeline (binlog → Kafka → cache delete) across regions.", "Large values: chunk values > 1MB, store chunks separately with manifest key."],
    metaTips: ["Reference the 2013 Facebook Memcache paper — interviewers will be impressed.", "Distinguish 'cache invalidation' (delete on write) from 'cache update' (write-through) — Meta uses invalidation.", "Discuss the 'stale set' problem: delayed invalidation can cause stale data to be re-cached.", "For IC7: discuss cross-region cache consistency and the trade-off with replication lag."],
    color: "#1e3a8a",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  {
    id: "video-upload",
    title: "Video Upload & Processing Pipeline",
    icon: <Zap size={16} />,
    tagline: "Chunked upload, async transcoding, and CDN delivery",
    difficulty: "Hard",
    metaRelevance: "Instagram Reels and Facebook Video are core products. Tests async pipelines, blob storage, and CDN architecture.",
    requirements: {
      functional: ["Upload videos up to 4GB", "Transcode to multiple resolutions (360p, 720p, 1080p, 4K)", "Thumbnail generation", "Video playback with adaptive bitrate streaming (HLS/DASH)", "Content moderation (NSFW detection)"],
      nonFunctional: ["500M video uploads/day", "Transcode within 5 minutes of upload", "Playback start < 2 seconds", "99.99% durability"],
    },
    dataModel: {
      entities: ["Video(id, uploader_id, title, status, created_at, duration)", "VideoFile(video_id, resolution, codec, storage_url, size_bytes)", "TranscodeJob(id, video_id, status, priority, created_at, completed_at)", "VideoSegment(video_id, resolution, segment_no, storage_url, duration_ms)"],
      keyDecisions: ["Chunked upload: split into 5MB chunks, upload in parallel, reassemble server-side", "Object storage (S3-like) for raw and transcoded files — never store in DB", "Async transcode pipeline: Kafka → worker pool → status update", "HLS: segment video into 2-10s chunks, serve via CDN with manifest file"],
    },
    api: {
      endpoints: ["POST /videos/init {filename, size, content_type} → {video_id, upload_urls[]}", "PUT /videos/{id}/chunks/{n} {binary_data} — direct to object store", "POST /videos/{id}/complete → triggers transcode pipeline", "GET /videos/{id}/manifest.m3u8 — HLS manifest (served from CDN)"],
    },
    scaleBottlenecks: ["Upload bandwidth: chunked parallel upload + resumable uploads (handle network drops).", "Transcode capacity: auto-scale worker pool based on queue depth. Priority queue for premium users.", "Storage cost: tiered storage — hot (SSD), warm (HDD), cold (glacier) based on view count.", "CDN cache hit rate: pre-warm CDN for viral videos. Use geo-distributed POPs."],
    metaTips: ["Chunked upload is the key insight — never upload a 4GB file in one HTTP request.", "Mention adaptive bitrate streaming (ABR): client switches quality based on bandwidth.", "Content moderation: async, after upload. Don't block playback for moderation.", "For IC7: discuss how to handle a viral video that gets 100M views in 1 hour — CDN pre-warming strategy."],
    color: "#92400e",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
  },
];

interface BlogPost {
  title: string;
  url: string;
  summary: string;
  tags: string[];
  year: string;
}

const META_BLOG_POSTS: BlogPost[] = [
  {
    title: "Scaling Memcache at Facebook",
    url: "https://research.facebook.com/publications/scaling-memcache-at-facebook/",
    summary: "The seminal 2013 paper describing how Meta scaled Memcache to handle billions of requests per second. Covers look-aside caching, lease mechanism for thundering herd, regional consistency, and the McSqueal invalidation pipeline. Essential reading for any distributed caching question.",
    tags: ["Caching", "Distributed Systems", "Infrastructure"],
    year: "2013",
  },
  {
    title: "TAO: Facebook's Distributed Data Store for the Social Graph",
    url: "https://research.facebook.com/publications/tao-facebooks-distributed-data-store-for-the-social-graph/",
    summary: "TAO is Meta's purpose-built graph store that powers the social graph. Covers the object-association data model, read-heavy workload optimization, tiered caching, and eventual consistency. Relevant for any social graph or news feed design question.",
    tags: ["Graph Store", "Social Graph", "Distributed Systems"],
    year: "2013",
  },
  {
    title: "Cassandra: A Decentralized Structured Storage System",
    url: "https://research.facebook.com/publications/cassandra-a-decentralized-structured-storage-system/",
    summary: "The original Cassandra paper from Facebook engineers. Covers consistent hashing, gossip protocol, vector clocks, and the write-optimized LSM-tree storage engine. Foundational for understanding wide-column stores used throughout Meta's infrastructure.",
    tags: ["Storage", "Distributed Systems", "NoSQL"],
    year: "2010",
  },
  {
    title: "React: A JavaScript Library for Building User Interfaces",
    url: "https://engineering.fb.com/2013/06/05/web/react-a-javascript-library-for-building-user-interfaces/",
    summary: "The original announcement of React, explaining the motivation behind the virtual DOM and one-way data flow. Shows Meta's approach to solving UI complexity at scale — relevant for demonstrating knowledge of Meta's technical culture and open-source contributions.",
    tags: ["Frontend", "React", "Open Source"],
    year: "2013",
  },
  {
    title: "The Technology Behind Inbox by Gmail and Facebook Messenger",
    url: "https://engineering.fb.com/2014/10/09/production-engineering/the-technology-behind-inbox-by-gmail-and-facebook-messenger/",
    summary: "Deep dive into the real-time messaging infrastructure: MQTT protocol for mobile, connection management, message ordering, and delivery guarantees. Directly relevant for messaging system design questions.",
    tags: ["Messaging", "Real-time", "Mobile"],
    year: "2014",
  },
  {
    title: "Rebuilding our tech stack for the new Facebook.com",
    url: "https://engineering.fb.com/2020/05/08/web/facebook-redesign/",
    summary: "How Meta rebuilt Facebook.com using React, GraphQL, and Relay. Covers code splitting, progressive loading, and the architectural decisions behind the 2020 redesign. Shows Meta's approach to large-scale frontend architecture.",
    tags: ["Frontend", "GraphQL", "Performance"],
    year: "2020",
  },
  {
    title: "How Facebook Encodes Your Videos",
    url: "https://engineering.fb.com/2021/04/05/video-engineering/how-facebook-encodes-your-videos/",
    summary: "Explains Meta's video transcoding pipeline at scale: codec selection, quality optimization, adaptive bitrate streaming, and the infrastructure behind encoding billions of videos. Essential for video system design questions.",
    tags: ["Video", "Media Processing", "Infrastructure"],
    year: "2021",
  },
  {
    title: "Introducing the Data Center Fabric, the Next-Generation Facebook Data Center Network",
    url: "https://engineering.fb.com/2014/11/14/production-engineering/introducing-data-center-fabric-the-next-generation-facebook-data-center-network/",
    summary: "Meta's custom data center network architecture: fabric topology, equal-cost multi-path routing, and how they achieved 100x bandwidth improvement. Relevant for system design questions involving data center architecture and network topology.",
    tags: ["Infrastructure", "Networking", "Data Center"],
    year: "2014",
  },
  {
    title: "Open-sourcing Katran, a scalable network load balancer",
    url: "https://engineering.fb.com/2018/05/22/open-source/open-sourcing-katran-a-scalable-network-load-balancer/",
    summary: "Katran is Meta's XDP/eBPF-based L4 load balancer that handles hundreds of millions of packets per second. Covers consistent hashing for backend selection, health checking, and the performance advantages of kernel bypass networking.",
    tags: ["Load Balancing", "Networking", "Infrastructure"],
    year: "2018",
  },
  {
    title: "Instagram Engineering: Sharding & IDs at Instagram",
    url: "https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c",
    summary: "How Instagram generates globally unique, roughly time-sortable IDs at scale without a single point of failure. The solution uses PostgreSQL schemas as logical shards with a custom ID generation function. Classic distributed ID generation problem.",
    tags: ["Distributed Systems", "Sharding", "Database"],
    year: "2012",
  },
  {
    title: "How Instagram Moved to Python 3",
    url: "https://instagram-engineering.com/instagram-moves-to-python-3-5-ef7a47c8d965",
    summary: "A large-scale migration story: how Instagram migrated their entire Python 2 codebase to Python 3 while serving hundreds of millions of users. Covers migration strategy, testing, gradual rollout, and lessons learned. Relevant for technical migration and risk management questions.",
    tags: ["Migration", "Python", "Engineering Culture"],
    year: "2017",
  },
  {
    title: "Efficient Large-Scale Graph Processing at Facebook",
    url: "https://research.facebook.com/publications/efficient-large-scale-graph-processing-at-facebook/",
    summary: "How Meta processes social graph analytics at petabyte scale using custom graph processing frameworks. Covers partitioning strategies, message passing, and the trade-offs between synchronous and asynchronous graph computation.",
    tags: ["Graph Processing", "Big Data", "Analytics"],
    year: "2016",
  },
];

const TAG_COLORS: Record<string, string> = {
  "Caching": "bg-blue-50 text-blue-700 border-blue-200",
  "Distributed Systems": "bg-purple-50 text-purple-700 border-purple-200",
  "Infrastructure": "bg-gray-100 text-gray-700 border-gray-200",
  "Graph Store": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Social Graph": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Storage": "bg-amber-50 text-amber-700 border-amber-200",
  "NoSQL": "bg-amber-50 text-amber-700 border-amber-200",
  "Frontend": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "React": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Open Source": "bg-teal-50 text-teal-700 border-teal-200",
  "Messaging": "bg-rose-50 text-rose-700 border-rose-200",
  "Real-time": "bg-rose-50 text-rose-700 border-rose-200",
  "Mobile": "bg-rose-50 text-rose-700 border-rose-200",
  "GraphQL": "bg-pink-50 text-pink-700 border-pink-200",
  "Performance": "bg-orange-50 text-orange-700 border-orange-200",
  "Video": "bg-red-50 text-red-700 border-red-200",
  "Media Processing": "bg-red-50 text-red-700 border-red-200",
  "Networking": "bg-slate-50 text-slate-700 border-slate-200",
  "Data Center": "bg-slate-50 text-slate-700 border-slate-200",
  "Load Balancing": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Sharding": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Database": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Migration": "bg-lime-50 text-lime-700 border-lime-200",
  "Python": "bg-lime-50 text-lime-700 border-lime-200",
  "Engineering Culture": "bg-violet-50 text-violet-700 border-violet-200",
  "Big Data": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "Analytics": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "Graph Processing": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

function PatternCard({ p }: { p: DesignPattern }) {
  const [expanded, setExpanded] = useState(false);
  const [section, setSection] = useState<string>("requirements");
  const [teachMode, setTeachMode] = useState(false);
  const [userSketch, setUserSketch] = useState("");
  const [revealed, setRevealed] = useState(false);

  const sections = [
    { id: "requirements", label: "Requirements" },
    { id: "datamodel", label: "Data Model" },
    { id: "api", label: "API" },
    { id: "bottlenecks", label: "Scale Bottlenecks" },
    { id: "tips", label: "Meta Tips" },
  ];

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: p.borderColor }}>
      <button
        className="w-full text-left px-5 py-4 hover:opacity-90 transition-opacity"
        style={{ background: p.bgColor }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span style={{ color: p.color }}>{p.icon}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.title}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 italic">{p.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[p.difficulty]}`}>
              {p.difficulty}
            </span>
            {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          </div>
        </div>
        <div className="mt-2 flex items-start gap-1.5">
          <Zap size={10} className="flex-shrink-0 mt-0.5" style={{ color: p.color }} />
          <p className="text-[11px] leading-relaxed" style={{ color: p.color }}>{p.metaRelevance}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-white" style={{ borderColor: p.borderColor }}>
          {/* Teach It Back toggle */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Brain size={13} className="text-purple-500" />
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Teach It Back Mode</span>
            </div>
            <button
              onClick={() => { setTeachMode((t) => !t); setRevealed(false); setUserSketch(""); }}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                teachMode
                  ? "bg-purple-100 text-purple-700 border-purple-300"
                  : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
              }`}
            >
              {teachMode ? <EyeOff size={11} /> : <Eye size={11} />}
              {teachMode ? "Exit Teach Mode" : "Activate"}
            </button>
          </div>

          {/* Teach It Back panel */}
          {teachMode && (
            <div className="px-4 py-4 bg-purple-50/40 border-b border-purple-100 space-y-3">
              <div className="flex items-start gap-2">
                <Brain size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-purple-800">
                  Sketch your approach to <span className="italic">{p.title}</span> from memory before revealing the reference.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wide">Your Architecture Sketch</p>
                <p className="text-xs text-gray-500">Cover: requirements you'd clarify, key components, data model decisions, API design, and 2–3 scale bottlenecks.</p>
                <textarea
                  value={userSketch}
                  onChange={(e) => setUserSketch(e.target.value)}
                  placeholder={`e.g. For ${p.title}:\n\nRequirements: ...\nCore components: ...\nData model: ...\nAPI: ...\nScale bottlenecks: ...`}
                  rows={6}
                  className="w-full text-sm text-gray-800 bg-white border border-purple-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-gray-300"
                />
              </div>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  disabled={userSketch.trim().length < 20}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-sm font-bold transition-all"
                >
                  <Eye size={14} />
                  Reveal Reference Answer
                  {userSketch.trim().length < 20 && <span className="text-[10px] font-normal">(write at least 20 chars first)</span>}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Brain size={14} />
                  <span className="text-xs font-bold">Reference revealed below — compare your sketch to the structured approach</span>
                </div>
              )}
            </div>
          )}

          {/* Section tabs — hidden in teach mode until revealed */}
          {(!teachMode || revealed) && (
          <>
          <div className="flex overflow-x-auto border-b border-gray-100 px-1 pt-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex-shrink-0 text-[11px] font-bold px-3 py-2 border-b-2 transition-colors ${
                  section === s.id
                    ? "border-indigo-500 text-indigo-700"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {section === "requirements" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Functional</p>
                  <ul className="space-y-1.5">
                    {p.requirements.functional.map((r) => (
                      <li key={r} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Non-Functional</p>
                  <ul className="space-y-1.5">
                    {p.requirements.nonFunctional.map((r) => (
                      <li key={r} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {section === "datamodel" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Entities</p>
                  <div className="space-y-1.5">
                    {p.dataModel.entities.map((e) => (
                      <div key={e} className="font-mono text-[11px] bg-gray-950 text-green-300 px-3 py-1.5 rounded-lg">{e}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Key Decisions</p>
                  <ul className="space-y-2">
                    {p.dataModel.keyDecisions.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-xs text-gray-700">
                        <ChevronRight size={11} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {section === "api" && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Endpoints</p>
                <div className="space-y-2">
                  {p.api.endpoints.map((e) => (
                    <div key={e} className="font-mono text-[11px] bg-gray-950 text-green-300 px-3 py-2 rounded-lg leading-relaxed">{e}</div>
                  ))}
                </div>
              </div>
            )}

            {section === "bottlenecks" && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Scale Bottlenecks & Solutions</p>
                <div className="space-y-2.5">
                  {p.scaleBottlenecks.map((b) => {
                    const [problem, solution] = b.split(". Solve with ").length > 1
                      ? [b.split(". Solve with ")[0], "Solve with " + b.split(". Solve with ")[1]]
                      : [b.split(": ")[0], b.split(": ").slice(1).join(": ")];
                    return (
                      <div key={b} className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                        <p className="text-xs font-semibold text-orange-800 mb-1">{problem}</p>
                        {solution && <p className="text-xs text-gray-600">{solution}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {section === "tips" && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Meta-Specific Interview Tips</p>
                <ul className="space-y-2.5">
                  {p.metaTips.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-gray-700">
                      <Zap size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SystemDesignTab() {
  const [activeView, setActiveView] = useState<"patterns" | "blog" | "mock" | "compare" | "diagnostic" | "requirements" | "tradeoffs">("patterns");
  const [blogSearch, setBlogSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const allTags = ["All", ...Array.from(new Set(META_BLOG_POSTS.flatMap((p) => p.tags))).sort()];

  const filteredPosts = META_BLOG_POSTS.filter((post) => {
    const q = blogSearch.toLowerCase();
    const matchesSearch = !q || post.title.toLowerCase().includes(q) || post.summary.toLowerCase().includes(q) || post.tags.some((t) => t.toLowerCase().includes(q));
    const matchesTag = selectedTag === "All" || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          System Design Primer
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          8 design patterns · 12 Meta blog posts · Mock session · Pass-rate uplift tools (10% → 60%)
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveView("patterns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            activeView === "patterns"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          <Server size={12} /> Design Patterns (8)
        </button>
        <button
          onClick={() => setActiveView("blog")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            activeView === "blog"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          <BookOpen size={12} /> Meta Engineering Blog (12)
        </button>
        <button
          onClick={() => setActiveView("mock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            activeView === "mock"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
          }`}
        >
          <Target size={12} /> Mock Session
        </button>
        <button
          onClick={() => setActiveView("compare")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            activeView === "compare"
              ? "bg-violet-600 text-white border-violet-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-violet-400"
          }`}
        >
          <Table2 size={12} /> Compare Patterns
        </button>
        {/* Pass-rate uplift tools */}
        <div className="w-full flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Pass-Rate Uplift:</span>
          <button
            onClick={() => setActiveView("diagnostic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeView === "diagnostic"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-red-600 border-red-200 hover:border-red-400"
            }`}
          >
            <AlertTriangle size={11} /> Why High Fail ratio
          </button>
          <button
            onClick={() => setActiveView("requirements")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeView === "requirements"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
            }`}
          >
            <Layers size={11} /> Requirements Trainer
          </button>
          <button
            onClick={() => setActiveView("tradeoffs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeView === "tradeoffs"
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-violet-700 border-violet-200 hover:border-violet-400"
            }`}
          >
            <BarChart2 size={11} /> Trade-off Drill
          </button>
        </div>
      </div>

      {/* Design Patterns */}
      {activeView === "patterns" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3.5">
            <p className="text-xs text-indigo-800 leading-relaxed">
              <strong>How to use:</strong> Click any card to expand. Use the section tabs (Requirements → Data Model → API → Scale Bottlenecks → Meta Tips) to work through each design systematically. The Meta Tips section contains interviewer-specific advice based on what Meta engineers actually probe for.
            </p>
          </div>
          <div className="space-y-3">
            {DESIGN_PATTERNS.map((p) => (
              <PatternCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mock Session */}
      {activeView === "mock" && (
        <SystemDesignMockSession />
      )}

      {/* Pattern Comparison Table */}
      {activeView === "compare" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5">
            <p className="text-xs text-violet-800 leading-relaxed">
              <strong>How to use:</strong> This matrix lets you compare all 8 patterns side-by-side before a mock session. Click any column header to highlight that dimension across all rows. Use this to quickly recall trade-offs — e.g., which patterns use eventual consistency, or which are read-heavy.
            </p>
          </div>
          <SystemDesignComparisonTable />
        </div>
      )}

      {/* Failure Mode Diagnostic */}
      {activeView === "diagnostic" && <SDFailureModeDiagnostic />}

      {/* Requirements Clarification Trainer */}
      {activeView === "requirements" && <SDRequirementsTrainer />}

      {/* Trade-off Articulation Drill */}
      {activeView === "tradeoffs" && <SDTradeoffDrill />}

      {/* Blog Feed */}
      {activeView === "blog" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Why read these:</strong> Referencing specific Meta engineering papers and blog posts in a system design interview signals genuine interest in Meta's technical culture and demonstrates depth beyond generic answers. Even mentioning "I read the Memcache paper" can shift the conversation.
            </p>
          </div>

          {/* Search + tag filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search blog posts…"
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                    selectedTag === tag
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div key={post.title} className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors leading-tight flex items-start gap-1.5 group"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {post.title}
                      <ExternalLink size={11} className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                    </a>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 font-semibold">{post.year}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2.5">{post.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
