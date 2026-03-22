// SDComponentStressTest — B4: Component Stress-Test Quiz
// 8 core building blocks × 5 stress scenarios each.
// Candidates reason through failure cascades; LLM scores on 3 dimensions.
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Zap, ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface StressQuestion {
  id: string;
  component: string;
  scenario: string;
  hint: string;
  modelAnswer: string;
}

const COMPONENTS = [
  "Cache (Redis)",
  "Message Queue (Kafka)",
  "Database (MySQL/Postgres)",
  "Load Balancer",
  "CDN",
  "API Gateway",
  "Search Index (Elasticsearch)",
  "Object Storage (S3)",
];

const STRESS_QUESTIONS: StressQuestion[] = [
  // Cache
  { id: "cache-1", component: "Cache (Redis)", scenario: "Your Redis cache hit rate drops from 95% to 5% during a traffic spike after a deployment. Walk me through the failure cascade and how you'd recover.", hint: "Think: thundering herd, origin overload, cache warming strategy.", modelAnswer: "Cache miss storm → all requests hit origin DB → DB overloaded → latency spikes → timeouts → cascading failures. Recovery: (1) Circuit breaker to shed load, (2) Request coalescing / mutex lock per key to prevent thundering herd, (3) Gradual cache warming via background job, (4) Read replicas to absorb DB load during warm-up. Prevention: blue-green cache warm-up before traffic cutover." },
  { id: "cache-2", component: "Cache (Redis)", scenario: "A Redis node in your cluster fails. 1/8 of your keyspace is now unavailable. What happens to your application and how do you handle it?", hint: "Think: consistent hashing, virtual nodes, fallback strategy.", modelAnswer: "With consistent hashing, ~12.5% of keys are unmapped. Requests for those keys miss cache and hit origin. If origin can absorb 12.5% extra load, degrade gracefully. If not: (1) Fail open — serve stale data from another replica if available, (2) Shed non-critical requests, (3) Redis Cluster auto-failover promotes replica in ~10-30s. Design: always run Redis with at least 1 replica per shard. Monitor: alert on hit rate drop > 5% as leading indicator." },
  { id: "cache-3", component: "Cache (Redis)", scenario: "Your cache eviction policy is LRU. A batch job runs nightly and reads 10M rarely-accessed keys, evicting your hot working set. What's the impact and fix?", hint: "Think: cache pollution, eviction policy alternatives.", modelAnswer: "LRU eviction treats batch reads as 'recently used', evicting hot keys. Impact: cache cold start for all production traffic after batch job. Fix: (1) Use allkeys-lfu (Least Frequently Used) instead of LRU — frequency-based eviction resists one-time batch reads, (2) Run batch jobs against a separate read replica, (3) Use key prefixes + separate Redis instance for batch vs. production, (4) Set lower TTL on batch keys to let them expire naturally." },
  { id: "cache-4", component: "Cache (Redis)", scenario: "You need to cache user session data for 1B users. Each session is 2KB. How much memory do you need and how do you shard it?", hint: "Think: 1B × 2KB = 2TB. How many Redis nodes? Sharding strategy?", modelAnswer: "1B × 2KB = 2TB raw. With 3× replication = 6TB. At 64GB per Redis node = ~94 nodes minimum. Sharding: consistent hashing by user_id. Key design: session:{user_id} with TTL = 30 days. Optimization: (1) Compress session data (JSON → MessagePack = 50% reduction), (2) Store only active sessions (DAU << MAU), (3) Tiered storage: hot sessions in Redis, cold in DynamoDB." },
  { id: "cache-5", component: "Cache (Redis)", scenario: "You're using Redis for rate limiting with INCR + EXPIRE. Two servers execute INCR and EXPIRE non-atomically. What race condition exists and how do you fix it?", hint: "Think: INCR succeeds, EXPIRE fails — what happens?", modelAnswer: "Race: Server A does INCR (key now exists, count=1), then crashes before EXPIRE. Key never expires → user permanently rate-limited. Fix: (1) Use Lua script to atomically INCR + EXPIRE in one operation, (2) Use SET key 1 EX ttl NX for first-time creation, then INCR for subsequent. Alternative: Redis MULTI/EXEC transaction, but Lua is preferred for atomicity + performance. Also: use PTTL to check if key has no expiry and set it defensively." },
  // Kafka
  { id: "kafka-1", component: "Message Queue (Kafka)", scenario: "Your Kafka consumer group is processing 10K messages/second but your downstream DB can only handle 2K writes/second. The consumer lag grows unboundedly. What do you do?", hint: "Think: backpressure, batching, consumer scaling, DB optimization.", modelAnswer: "Consumer lag = producer rate > consumer rate. Solutions: (1) Batch DB writes — accumulate 100 messages, write in one transaction (10K/100 = 100 transactions/sec instead of 10K), (2) Scale consumers — add more consumer instances up to partition count, (3) Add DB write replicas or use async write path, (4) Apply backpressure — pause consumer when lag exceeds threshold, (5) Use a write buffer (Redis sorted set) as intermediate store. Long-term: partition by write key to parallelize DB writes." },
  { id: "kafka-2", component: "Message Queue (Kafka)", scenario: "A Kafka broker fails. You have replication factor 3 and min.insync.replicas=2. What happens to producers and consumers?", hint: "Think: leader election, ISR, producer acks.", modelAnswer: "Broker failure: (1) Controller detects failure via ZooKeeper/KRaft heartbeat timeout (~10-30s), (2) Leader election for affected partitions — one of 2 remaining replicas becomes leader, (3) Producers with acks=all: block until new leader elected, then resume. Producers with acks=1: may lose messages written to failed broker if not yet replicated, (4) Consumers: pause during leader election, then resume from last committed offset. No message loss with RF=3, min.insync=2, acks=all. Latency spike during election window (~10-30s)." },
  { id: "kafka-3", component: "Message Queue (Kafka)", scenario: "You have a hot partition — one partition receives 80% of all messages because your partition key is user_id and one celebrity has 50M followers. How do you fix it?", hint: "Think: partition key design, salting, separate topic.", modelAnswer: "Hot partition = throughput bottleneck + storage imbalance. Fixes: (1) Key salting: append random suffix to celebrity user_ids (user_123_0, user_123_1, ...) to distribute across partitions — requires consumer-side aggregation, (2) Separate topic for high-volume producers: detect users above threshold, route to dedicated 'celebrity' topic with more partitions, (3) Round-robin partitioning for events that don't need ordering, (4) Partition by content_id instead of user_id if ordering per-user isn't required. Prevention: monitor per-partition throughput, alert on imbalance > 3×." },
  { id: "kafka-4", component: "Message Queue (Kafka)", scenario: "Your consumer crashes after processing a message but before committing the offset. The message gets reprocessed. How do you ensure idempotency?", hint: "Think: at-least-once delivery, idempotency key, dedup window.", modelAnswer: "At-least-once delivery is Kafka's default. Idempotency strategies: (1) Idempotency key in message payload (e.g., event_id UUID) — consumer checks DB before processing: 'if processed_events.exists(event_id): skip', (2) Upsert instead of insert — DB operation is naturally idempotent, (3) Exactly-once semantics (EOS): Kafka transactions + transactional producer + consumer isolation level 'read_committed' — but adds latency, (4) Dedup window in Redis: SET event_id 1 EX 86400 NX — if SET returns 0, already processed. Choose based on business impact of duplicate processing." },
  { id: "kafka-5", component: "Message Queue (Kafka)", scenario: "You need to replay all events from the last 7 days to rebuild a derived data store after a bug corrupted it. How does Kafka support this and what are the operational considerations?", hint: "Think: retention, consumer group offsets, replay strategy.", modelAnswer: "Kafka supports replay via offset reset. Steps: (1) Ensure retention.ms >= 7 days (default is 7 days, verify), (2) Create new consumer group or reset existing group offsets to 7 days ago: kafka-consumer-groups.sh --reset-offsets --to-datetime, (3) Spin up replay consumers separate from production consumers to avoid affecting live processing, (4) Throttle replay consumers to avoid overwhelming downstream systems, (5) Monitor lag and ETA. Considerations: (a) Log compacted topics may have deleted old versions of keys, (b) Schema evolution — ensure consumer can handle 7-day-old message formats, (c) Replay at 2-5× normal rate to minimize downtime." },
  // Database
  { id: "db-1", component: "Database (MySQL/Postgres)", scenario: "Your primary MySQL instance fails. You have one read replica with async replication. What data loss is possible and how do you minimize it?", hint: "Think: replication lag, RPO, semi-sync replication.", modelAnswer: "Async replication: replica may lag 0-N seconds behind primary. Data loss = all writes in the replication lag window. Typical lag: <1s in healthy systems, up to minutes under load. Minimize: (1) Semi-synchronous replication (MySQL): primary waits for at least 1 replica to acknowledge before committing — reduces lag to near-zero at cost of write latency, (2) Monitor replication lag continuously, alert on lag > 5s, (3) Use GTID-based replication for accurate failover position, (4) For zero RPO: synchronous replication (Galera/Group Replication) — but adds write latency. RTO: ~30-60s for automated failover with ProxySQL or Orchestrator." },
  { id: "db-2", component: "Database (MySQL/Postgres)", scenario: "You need to add a column to a 500M-row table without downtime. What's your strategy?", hint: "Think: online DDL, ghost/pt-online-schema-change, dual-write.", modelAnswer: "Naive ALTER TABLE locks the table for hours. Zero-downtime strategies: (1) pt-online-schema-change (Percona): creates shadow table, copies rows in batches, uses triggers to sync writes, atomically swaps — ~2-4 hours for 500M rows, (2) gh-ost (GitHub): trigger-free, uses binary log for sync — preferred for high-write tables, (3) MySQL 8+ Online DDL: ALGORITHM=INPLACE, LOCK=NONE for many operations — check if your DDL supports it, (4) Expand-contract pattern: add nullable column (instant), backfill in batches, add NOT NULL constraint later. Never run ALTER TABLE directly on large production tables." },
  { id: "db-3", component: "Database (MySQL/Postgres)", scenario: "Your DB query response time spikes from 5ms to 500ms during peak traffic. How do you diagnose and fix it?", hint: "Think: slow query log, EXPLAIN, lock contention, connection pool.", modelAnswer: "Diagnosis: (1) Check slow query log — identify queries > 100ms, (2) EXPLAIN ANALYZE on slow queries — look for full table scans, missing indexes, (3) Check lock contention: SHOW PROCESSLIST, information_schema.innodb_locks, (4) Check connection pool saturation — are connections queued? (5) Check replication lag — are reads hitting a lagging replica? Fixes: (1) Add missing index (most common fix), (2) Optimize query — avoid SELECT *, use covering indexes, (3) Add read replicas to distribute read load, (4) Increase connection pool size (but watch for DB max_connections), (5) Add query result cache (Redis) for expensive, frequently-run queries." },
  { id: "db-4", component: "Database (MySQL/Postgres)", scenario: "You're sharding a user table by user_id. A query needs to find all users in a given city. How do you handle cross-shard queries?", hint: "Think: scatter-gather, secondary index, denormalization.", modelAnswer: "Cross-shard queries are expensive — require scatter-gather across all N shards. Solutions: (1) Secondary index service: maintain a separate lookup table (city → [user_ids]) in a non-sharded store (e.g., Elasticsearch or a dedicated MySQL instance), (2) Denormalize: replicate city-indexed data to a separate analytics DB (e.g., Redshift/BigQuery) for reporting queries, (3) Scatter-gather with timeout: fan out to all shards in parallel, aggregate results — acceptable for low-frequency admin queries but not for user-facing, (4) Re-shard by city for geo-local queries — but then user_id lookups become cross-shard. Design principle: shard key must match your most common query pattern." },
  { id: "db-5", component: "Database (MySQL/Postgres)", scenario: "Your application has a N+1 query problem: for each of 100 posts, it makes a separate DB query to fetch the author. How do you fix it?", hint: "Think: eager loading, DataLoader pattern, batch query.", modelAnswer: "N+1 = 1 query for posts + 100 queries for authors = 101 queries. Fix: (1) JOIN: SELECT posts.*, users.* FROM posts JOIN users ON posts.author_id = users.id — 1 query, (2) Batch fetch: collect all author_ids from posts, then SELECT * FROM users WHERE id IN (...) — 2 queries, (3) DataLoader pattern (Facebook): batches and deduplicates all author lookups within a request lifecycle — ideal for GraphQL, (4) Eager loading in ORM: posts.includes(:author) in Rails, .Include(p => p.Author) in EF Core. Prevention: use query analyzers (Bullet gem, Hibernate statistics) to detect N+1 in development." },
  // Load Balancer
  { id: "lb-1", component: "Load Balancer", scenario: "One of your 10 backend servers is slow (responding in 2000ms instead of 50ms) but not failing health checks. How does this affect your load balancer and users?", hint: "Think: least-connections vs round-robin, slow server problem.", modelAnswer: "Round-robin LB keeps sending requests to the slow server — 10% of users get 2000ms responses. Least-connections LB is worse: slow server accumulates connections (each held for 2000ms), eventually gets most traffic. Fix: (1) Least-response-time algorithm: LB tracks response time per backend and routes to fastest — NGINX Plus, HAProxy, Envoy support this, (2) Circuit breaker: if p99 latency > threshold, temporarily remove server from rotation, (3) Outlier detection (Envoy): automatically eject servers with anomalous latency/error rates, (4) Health check with latency threshold: fail health check if response > 500ms. Monitoring: track per-backend latency distribution, not just error rate." },
  { id: "lb-2", component: "Load Balancer", scenario: "Your load balancer itself becomes a single point of failure. How do you make it highly available?", hint: "Think: active-passive, active-active, anycast, DNS failover.", modelAnswer: "LB HA strategies: (1) Active-passive with VIP: two LB instances share a virtual IP (VRRP/keepalived). Primary holds VIP; secondary monitors and takes over in ~1s on failure. Limitation: standby wastes capacity, (2) Active-active with DNS round-robin: multiple LB instances, DNS returns all IPs, clients distribute. Limitation: DNS TTL delays failover, (3) Anycast routing: multiple LB instances announce same IP via BGP. Traffic routes to nearest. Automatic failover via BGP convergence (~30s), (4) Cloud LBs (AWS ALB, GCP LB): managed HA, no SPOF. At Meta scale: anycast + multiple PoPs globally. Always monitor LB health separately from backend health." },
  { id: "lb-3", component: "Load Balancer", scenario: "You need to implement sticky sessions (same user always hits same server) for a stateful application. What are the trade-offs?", hint: "Think: session affinity, failure modes, stateless alternative.", modelAnswer: "Sticky sessions: LB routes user to same server based on cookie or IP hash. Trade-offs: (1) Uneven load: if one user is heavy, their server gets overloaded while others are idle, (2) Server failure: all sessions on failed server are lost — user must re-authenticate, (3) Deployment: rolling deploy is harder — must drain sessions before taking server down, (4) Scaling: adding servers doesn't redistribute existing sessions. Better alternative: stateless architecture — store session in shared store (Redis). LB can route to any server. Enables horizontal scaling, zero-downtime deploys, and no session loss on server failure. Only use sticky sessions if shared session store is not feasible." },
  { id: "lb-4", component: "Load Balancer", scenario: "Your API receives a DDoS attack — 10M requests/second from 100K IPs. Your LB is overwhelmed before it can even inspect requests. What layers of defense do you add?", hint: "Think: anycast scrubbing, rate limiting at edge, SYN cookies.", modelAnswer: "Defense in depth: (1) Anycast scrubbing center: route attack traffic to scrubbing PoPs that drop malicious traffic before it reaches your infrastructure — Cloudflare, AWS Shield Advanced, (2) SYN cookies: LB responds to SYN without allocating state until handshake complete — prevents SYN flood exhausting connection table, (3) Rate limiting at edge: CDN/WAF rate limits per IP before traffic reaches LB, (4) BGP blackholing: null-route attacking IPs at ISP level, (5) Connection rate limiting: LB drops new connections from IPs exceeding threshold. Key insight: DDoS defense must happen upstream of your infrastructure — by the time traffic reaches your LB, it's too late." },
  { id: "lb-5", component: "Load Balancer", scenario: "You're doing a blue-green deployment. How does your load balancer orchestrate the traffic shift and what can go wrong?", hint: "Think: traffic splitting, health checks, rollback speed.", modelAnswer: "Blue-green with LB: (1) Deploy green (new version) alongside blue (current), (2) Run health checks on green — ensure all instances pass, (3) Shift traffic: 0% → 10% → 50% → 100% to green over 15-30 minutes (canary approach), (4) Monitor error rate and latency at each step — automated rollback if error rate > threshold, (5) Rollback: shift 100% back to blue in <30s. What can go wrong: (1) Green passes health checks but has subtle bugs under real traffic (e.g., DB migration incompatibility), (2) Session state: users mid-session on blue get routed to green — stateful apps need session drain, (3) Database schema: if green requires schema change, blue can't run against new schema — requires backward-compatible migrations." },
  // CDN
  { id: "cdn-1", component: "CDN", scenario: "A viral video gets 10M requests in 60 seconds. Your CDN has it cached. What happens at the CDN and origin layers?", hint: "Think: cache hit rate, origin shield, edge node capacity.", modelAnswer: "With CDN cache hit: 10M requests → CDN serves from edge cache → origin sees ~0 requests (only initial cache fill). CDN capacity: each edge PoP can handle millions of requests/second for cached content. Potential issues: (1) Edge node CPU/bandwidth saturation if video is large (e.g., 500MB × 10M = 5PB egress in 60s — impossible from single PoP), (2) CDN routes to multiple PoPs via anycast — load distributed geographically, (3) Origin shield: if cache miss, only origin shield fetches from origin (1 request), not all edge nodes independently — prevents thundering herd at origin. Monitoring: track edge cache hit rate, origin request rate, and edge bandwidth utilization." },
  { id: "cdn-2", component: "CDN", scenario: "You need to invalidate 10M cached URLs immediately after a data breach exposes private content. How do you do this at CDN scale?", hint: "Think: purge API rate limits, surrogate keys, tag-based invalidation.", modelAnswer: "Purging 10M URLs individually is too slow (CDN purge APIs: ~1000 URLs/request, rate limited). Strategies: (1) Surrogate keys / cache tags: tag all private content with user_id or content_group at cache time. Single purge call invalidates all tagged objects — Fastly, Cloudflare support this, (2) Versioned URLs: append version token to all URLs (e.g., /image.jpg?v=abc123). Change token → all clients fetch new version. Old URLs expire via TTL, (3) CDN-level access control: add auth token validation at edge — CDN checks token before serving, no cache for private content, (4) Emergency: set Cache-Control: no-store on origin response — CDN stops caching immediately for new requests. Existing cached copies expire via TTL." },
  { id: "cdn-3", component: "CDN", scenario: "Your CDN origin is returning 500 errors. How does the CDN behave and how do you protect users?", hint: "Think: stale-while-revalidate, grace period, error caching.", modelAnswer: "CDN behavior on origin 500: (1) By default: CDN forwards 500 to user — bad UX, (2) Stale-while-revalidate: serve stale cached content while revalidating in background. If origin returns 500, continue serving stale — users see old content rather than error, (3) Stale-if-error: explicitly serve stale content for up to N seconds when origin errors — set via Cache-Control header or CDN config, (4) Error page caching: cache a friendly error page at CDN for fast delivery, (5) Circuit breaker at CDN: if origin error rate > threshold, stop forwarding requests (protect origin from overload). Best practice: set stale-if-error=86400 for static assets — users can tolerate 24h stale content over seeing errors." },
  { id: "cdn-4", component: "CDN", scenario: "You need to serve personalized content (e.g., 'Hello, Alice') through a CDN. How do you handle this without caching Alice's response for Bob?", hint: "Think: Vary header, edge-side includes, cache key normalization.", modelAnswer: "Personalized content cannot be cached naively. Options: (1) Don't cache personalized responses: set Cache-Control: private, no-store — CDN passes through to origin. Loses CDN benefit for personalized parts, (2) Cache the page skeleton, fetch personalized parts client-side via JS (API call after page load) — CDN caches static shell, personalization happens in browser, (3) Edge-side includes (ESI): CDN assembles page from cached fragments + dynamic personalized fragment fetched from origin — Varnish, Akamai support ESI, (4) Vary header: Vary: Cookie — CDN caches separate versions per cookie value. Dangerous: explodes cache storage if cookies are unique per user, (5) Signed URLs with short TTL for user-specific content." },
  { id: "cdn-5", component: "CDN", scenario: "Your CDN bill triples unexpectedly. How do you diagnose and reduce it?", hint: "Think: cache hit rate, origin egress, large objects, bot traffic.", modelAnswer: "CDN cost = egress bytes × price/GB. Diagnosis: (1) Check cache hit rate — low hit rate = most traffic going to origin and back through CDN, (2) Identify large objects — a few large files (videos, large images) can dominate egress, (3) Check bot traffic — crawlers/scrapers may be bypassing cache (unique query strings), (4) Check geographic distribution — some regions have higher CDN pricing. Fixes: (1) Improve cache hit rate: increase TTL, normalize cache keys (strip unnecessary query params), (2) Compress assets: gzip/brotli for text, WebP for images, (3) Block bots at CDN edge (WAF rules), (4) Use range requests for large files — only serve requested bytes, (5) Move high-egress content to cheaper storage tier." },
  // API Gateway
  { id: "apigw-1", component: "API Gateway", scenario: "Your API gateway is adding 50ms of latency to every request. What are the likely causes and how do you optimize it?", hint: "Think: TLS termination, auth token validation, plugin chain, connection pooling.", modelAnswer: "API gateway latency sources: (1) TLS handshake: 1-2 RTTs for new connections. Fix: TLS session resumption, connection pooling to backends, (2) Auth token validation: JWT validation is CPU-bound (RSA signature). Fix: cache validated tokens for their TTL, use EdDSA (faster than RSA), (3) Plugin chain: each plugin (rate limiting, logging, auth) adds latency. Fix: profile plugin chain, disable unused plugins, run plugins async where possible, (4) DNS resolution: gateway resolves backend hostname per request. Fix: cache DNS results, use service discovery with local cache, (5) Connection pooling to backends: if gateway opens new TCP connection per request, adds 1-2 RTTs. Fix: maintain persistent connection pool. Target: gateway overhead < 5ms." },
  { id: "apigw-2", component: "API Gateway", scenario: "Your API gateway is the single entry point for 50 microservices. It goes down. What's the blast radius and how do you design for resilience?", hint: "Think: SPOF, multi-region, circuit breaker, bypass path.", modelAnswer: "Gateway SPOF = 100% of traffic affected. Resilience strategies: (1) Active-active multi-region: deploy gateway in 3+ regions with anycast routing. Single region failure = ~33% traffic impact, (2) Horizontal scaling: 10+ gateway instances behind LB. Single instance failure = minimal impact, (3) Circuit breaker: gateway detects backend failures and returns cached/fallback responses rather than propagating errors, (4) Bypass path: for critical services, allow direct service-to-service calls bypassing gateway — emergency fallback, (5) Health check + auto-restart: container orchestration (K8s) restarts failed gateway instances in <30s. Key metric: gateway availability SLA should be higher than any individual service it proxies." },
  { id: "apigw-3", component: "API Gateway", scenario: "A client is sending malformed requests that are crashing your backend services. How does the API gateway protect backends?", hint: "Think: request validation, schema enforcement, WAF, rate limiting.", modelAnswer: "API gateway as defensive layer: (1) Request schema validation: validate request body against OpenAPI/JSON Schema before forwarding — reject malformed requests at gateway with 400, (2) Size limits: reject requests with body > 1MB (or appropriate limit) to prevent memory exhaustion, (3) WAF (Web Application Firewall): detect and block SQL injection, XSS, path traversal patterns, (4) Rate limiting per client: prevent one client from overwhelming backends, (5) Request sanitization: strip unexpected headers, normalize URLs, (6) Timeout enforcement: gateway enforces max request timeout — prevents slow clients from holding backend connections. Principle: validate at the perimeter, trust nothing from the internet." },
  { id: "apigw-4", component: "API Gateway", scenario: "You need to migrate from API v1 to v2 without breaking existing clients. How do you use the API gateway to manage this?", hint: "Think: routing rules, traffic splitting, deprecation timeline.", modelAnswer: "Gateway-managed API versioning: (1) Path-based routing: /v1/* → v1 backends, /v2/* → v2 backends. Clients explicitly choose version, (2) Header-based routing: API-Version: 2 header routes to v2 — cleaner URLs but requires client changes, (3) Traffic splitting: route 5% of /v1 traffic to v2 backends (canary) — validate v2 behavior before full migration, (4) Request transformation: gateway translates v1 request format to v2 format — allows v1 clients to use v2 backends transparently, (5) Deprecation: add Deprecation and Sunset headers to v1 responses with migration deadline, (6) Analytics: track v1 vs v2 usage at gateway to identify clients still on v1. Timeline: announce deprecation 6 months ahead, sunset 12 months." },
  { id: "apigw-5", component: "API Gateway", scenario: "Your API gateway handles authentication for all services. A security researcher reports that JWT tokens are not being validated properly — expired tokens are being accepted. What's the impact and fix?", hint: "Think: blast radius, token revocation, fix deployment.", modelAnswer: "Impact: all services behind gateway accept expired tokens. Any user with an expired token can continue making authenticated requests indefinitely. Blast radius: all authenticated endpoints. Immediate response: (1) Deploy fix to JWT validation (check exp claim) — but this requires a deployment, (2) Rotate JWT signing secret — invalidates all existing tokens, forces re-authentication. Disruptive but immediate. (3) Add token blocklist: Redis set of revoked token IDs — gateway checks blocklist before accepting token. Fix: (1) Validate all JWT claims: iss, aud, exp, nbf, (2) Add unit tests for expired token rejection, (3) Use short-lived tokens (15 min) + refresh tokens — limits blast radius of any future validation bug, (4) Add security scanning to CI pipeline." },
  // Search Index
  { id: "search-1", component: "Search Index (Elasticsearch)", scenario: "Your Elasticsearch cluster is running out of disk space. Indexing starts failing. What's your immediate response and long-term fix?", hint: "Think: disk watermarks, index lifecycle management, data tiering.", modelAnswer: "Immediate: (1) Elasticsearch disk watermarks: at 85% (low) → stops allocating new shards, at 90% (high) → starts relocating shards, at 95% (flood stage) → makes all indices read-only. Check which watermark triggered, (2) Delete old indices: identify and delete indices older than retention window, (3) Force merge: reduce segment count to free disk space (but CPU intensive), (4) Increase disk: add nodes or expand volumes. Long-term: (1) Index Lifecycle Management (ILM): automatically roll over, shrink, and delete indices by age/size, (2) Data tiering: hot (SSD, recent data) → warm (HDD, older data) → cold (frozen, archived) → delete, (3) Monitor disk usage, alert at 70% to allow time to respond before watermarks trigger." },
  { id: "search-2", component: "Search Index (Elasticsearch)", scenario: "A search query that normally takes 50ms is now taking 5000ms. How do you diagnose it?", hint: "Think: slow log, query profiling, shard count, JVM heap.", modelAnswer: "Diagnosis: (1) Enable slow query log: log queries > 1000ms with their query body, (2) Profile API: POST /index/_search?profile=true — shows per-shard, per-phase timing breakdown, (3) Check JVM heap: if heap > 75%, GC pauses cause latency spikes. Fix: reduce heap usage or add nodes, (4) Check shard count: too many small shards = high coordination overhead. Optimal shard size: 10-50GB, (5) Check query type: wildcard/regex queries are expensive — avoid leading wildcards, (6) Check cluster state: is cluster yellow/red? Missing replicas cause read requests to wait, (7) Check hot threads API: identify threads consuming CPU. Common fixes: add index on queried field, reduce shard count via reindex, increase JVM heap, upgrade hardware." },
  { id: "search-3", component: "Search Index (Elasticsearch)", scenario: "You need to reindex 1B documents in Elasticsearch without downtime. What's your strategy?", hint: "Think: reindex API, index aliases, dual-write, cutover.", modelAnswer: "Zero-downtime reindex strategy: (1) Create new index (v2) with updated mapping, (2) Set up index alias: production alias points to v1, (3) Start dual-write: all new documents written to both v1 and v2, (4) Reindex existing documents: POST /_reindex from v1 to v2 — runs in background, throttled to avoid impacting production, (5) Monitor reindex progress: GET /_tasks?actions=*reindex, (6) Verify v2: run test queries, compare results with v1, (7) Atomic alias swap: POST /_aliases — remove v1, add v2 in single atomic operation — zero downtime cutover, (8) Stop dual-write, delete v1. Timeline for 1B docs: ~2-4 hours at 100K docs/sec. Key: alias swap is the only moment of risk — test thoroughly before cutover." },
  { id: "search-4", component: "Search Index (Elasticsearch)", scenario: "Your search results are inconsistent — the same query returns different results on different requests. What's causing this and how do you fix it?", hint: "Think: replica inconsistency, refresh interval, search preference.", modelAnswer: "Inconsistency sources: (1) Replica lag: primary shard indexed a document, but replica hasn't refreshed yet. Query hitting different replicas returns different results. Fix: search_preference=_primary (but loses replica read scaling) or wait for refresh, (2) Refresh interval: default 1s. Documents indexed in the last 1s may not be searchable. Fix: reduce refresh_interval to 100ms for near-real-time, or use refresh=true on index request (expensive), (3) Shard routing: different shards may have different document counts due to indexing order. Fix: use routing to ensure related documents are on same shard, (4) Relevance scoring: BM25 scores differ per shard because IDF is calculated per-shard. Fix: dfs_query_then_fetch search type for consistent scoring (expensive)." },
  { id: "search-5", component: "Search Index (Elasticsearch)", scenario: "You need to support fuzzy search (typo tolerance) for 100M product names. What are the performance trade-offs?", hint: "Think: edit distance, n-gram index, phonetic analysis.", modelAnswer: "Fuzzy search options: (1) Elasticsearch fuzzy query: fuzziness=AUTO (edit distance 0-2 based on term length). Simple but expensive — generates many term variants, (2) N-gram tokenizer: index all n-grams (substrings) of each term. Fast lookup but large index size (3-5× normal). Good for prefix/infix matching, (3) Edge n-gram: only index prefixes — good for autocomplete, smaller than full n-gram, (4) Phonetic analysis (metaphone/soundex): index phonetic representation — catches 'Jon'/'John' but misses other typos, (5) Suggest API (completion suggester): optimized for autocomplete, not full-text fuzzy. Performance: fuzzy query on 100M docs: ~50-200ms. N-gram: ~5-20ms but 3× index size. Recommendation: edge n-gram for autocomplete, fuzzy query for full-text search." },
  // Object Storage
  { id: "s3-1", component: "Object Storage (S3)", scenario: "Your application uploads 10K files/second to S3. You start seeing 503 SlowDown errors. What's happening and how do you fix it?", hint: "Think: S3 prefix partitioning, request rate limits, key naming.", modelAnswer: "S3 throttles at ~3500 PUT/second per prefix. 10K/s exceeds this. Root cause: all files uploaded to same prefix (e.g., uploads/2024/01/01/). Fix: (1) Randomize key prefix: prepend random hex (e.g., a3f2/uploads/2024/01/01/file.jpg) — S3 partitions by prefix, random prefix distributes across partitions, (2) Hash-based prefix: use first 4 chars of file hash as prefix — deterministic but distributed, (3) Date-based prefix with randomization: year/month/day/hour/random_shard/file.jpg. Note: S3 now auto-scales partitions after sustained high request rates (~30 min to adapt). Monitoring: CloudWatch S3 request metrics, alert on 503 rate > 0.1%." },
  { id: "s3-2", component: "Object Storage (S3)", scenario: "A user accidentally deletes a critical file from S3. How do you recover it and how do you prevent this in the future?", hint: "Think: versioning, MFA delete, replication, lifecycle policies.", modelAnswer: "Recovery: (1) If S3 versioning enabled: list versions of deleted object, restore previous version — instant recovery, (2) If versioning not enabled: check if file was replicated to another bucket/region, (3) Check backup: was file backed up to Glacier or another storage tier? Prevention: (1) Enable S3 versioning on all critical buckets — keeps all versions, including delete markers, (2) Enable MFA Delete: require MFA token to permanently delete versions — prevents accidental/malicious deletion, (3) Cross-region replication: replicate to another region with separate IAM permissions — protects against regional issues and accidental deletion, (4) Object Lock (WORM): prevent deletion for a defined retention period — required for compliance, (5) Least-privilege IAM: application should not have s3:DeleteObject permission unless explicitly needed." },
  { id: "s3-3", component: "Object Storage (S3)", scenario: "You're serving 10TB of user-uploaded images through S3 presigned URLs. Users report images loading slowly. How do you diagnose and fix it?", hint: "Think: S3 transfer acceleration, CDN, presigned URL TTL, region proximity.", modelAnswer: "Diagnosis: (1) Check S3 region vs. user location — S3 in us-east-1 serving users in Asia = high latency, (2) Check object size — large images (5MB+) slow to load even with good bandwidth, (3) Check presigned URL TTL — if URLs expire and client must re-request, adds latency. Fixes: (1) CDN in front of S3: CloudFront/Cloudflare caches images at edge nodes globally — most impactful fix. Presigned URLs don't work with CDN caching (unique per request) — use CDN signed URLs instead, (2) S3 Transfer Acceleration: routes uploads/downloads through CloudFront edge network — improves speed for distant users, (3) Image optimization: serve WebP instead of JPEG (30% smaller), resize to display dimensions, (4) Multi-region replication: replicate bucket to regions near users." },
  { id: "s3-4", component: "Object Storage (S3)", scenario: "Your S3 bill is $50K/month and growing. How do you analyze and reduce it?", hint: "Think: storage classes, lifecycle policies, request costs, data transfer.", modelAnswer: "S3 cost components: (1) Storage: $0.023/GB/month (Standard). 50K/month = ~2.2PB. Reduction: lifecycle policies to move old data to cheaper tiers: Standard → Standard-IA (after 30 days, 40% cheaper) → Glacier (after 90 days, 80% cheaper) → Glacier Deep Archive (after 1 year, 95% cheaper), (2) Request costs: GET/PUT requests billed per 1000. Reduction: batch operations, reduce unnecessary requests, (3) Data transfer: S3 → internet = $0.09/GB. Reduction: use CloudFront (cheaper egress) or keep data within AWS (free), (4) Incomplete multipart uploads: accumulate storage cost. Fix: lifecycle rule to abort incomplete uploads after 7 days, (5) S3 Storage Lens: analyze usage patterns to identify optimization opportunities. Quick wins: lifecycle policies + CloudFront can reduce bill 40-60%." },
  { id: "s3-5", component: "Object Storage (S3)", scenario: "You need to process every file uploaded to S3 (e.g., generate thumbnails). How do you build this pipeline reliably?", hint: "Think: S3 event notifications, SQS, Lambda, idempotency.", modelAnswer: "Event-driven processing pipeline: (1) S3 Event Notification → SQS queue: S3 fires event on PUT, SQS buffers events. Decouples upload from processing, (2) Lambda or worker consumes SQS: processes each event (generate thumbnail, update DB), (3) Idempotency: Lambda may process same event twice (SQS at-least-once). Use S3 object ETag or event ID as idempotency key — check if thumbnail already exists before generating, (4) Dead letter queue (DLQ): failed events after N retries go to DLQ for manual inspection, (5) Visibility timeout: set > max processing time to prevent concurrent processing of same message, (6) Scaling: Lambda auto-scales with SQS depth. For CPU-intensive processing (video transcoding), use SQS + EC2 Auto Scaling Group instead of Lambda. Monitor: SQS queue depth, DLQ depth, processing latency." },
];

const SCORE_COLORS: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-800 border-emerald-300",
  4: "bg-blue-100 text-blue-800 border-blue-300",
  3: "bg-amber-100 text-amber-800 border-amber-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  1: "bg-red-100 text-red-800 border-red-300",
};

function ScorePill({ score }: { score: number }) {
  const labels: Record<number, string> = { 5: "Expert", 4: "Strong", 3: "Adequate", 2: "Weak", 1: "Missing" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${SCORE_COLORS[score] ?? SCORE_COLORS[3]}`}>
      {score}/5 · {labels[score] ?? ""}
    </span>
  );
}

export default function SDComponentStressTest() {
  const [selectedComponent, setSelectedComponent] = useState(COMPONENTS[0]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<null | {
    failureModeScore: number; failureModeFeedback: string;
    mitigationScore: number; mitigationFeedback: string;
    quantificationScore: number; quantificationFeedback: string;
    overallFeedback: string; passesBar: boolean;
  }>(null);
  const [showHint, setShowHint] = useState(false);
  const [showModel, setShowModel] = useState(false);

  const questions = STRESS_QUESTIONS.filter(q => q.component === selectedComponent);
  const question = questions[questionIdx] ?? questions[0];

  const scoreMutation = trpc.stressTest.score.useMutation({
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = () => {
    if (!answer.trim() || answer.trim().length < 30) return;
    setResult(null);
    scoreMutation.mutate({
      component: question.component,
      scenario: question.scenario,
      candidateAnswer: answer,
    });
  };

  const handleNext = () => {
    setQuestionIdx((i) => (i + 1) % questions.length);
    setAnswer(""); setResult(null); setShowHint(false); setShowModel(false);
  };

  const handleComponentChange = (comp: string) => {
    setSelectedComponent(comp);
    setQuestionIdx(0);
    setAnswer(""); setResult(null); setShowHint(false); setShowModel(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <Zap size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-orange-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Component Stress-Test Quiz
            </p>
            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
              Meta interviewers probe every component with failure scenarios: <em>"What happens when your cache hit rate drops to 5%?"</em>
              Naming a component is L4. Reasoning through its failure cascade is L6. This quiz trains the 15%-weight <strong>Technical Depth</strong> signal.
            </p>
          </div>
        </div>
      </div>

      {/* Component selector */}
      <div className="flex flex-wrap gap-2">
        {COMPONENTS.map((comp) => (
          <button
            key={comp}
            onClick={() => handleComponentChange(comp)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
              comp === selectedComponent
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {comp}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                {question.component}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {questionIdx + 1}/{questions.length}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{question.scenario}</p>
          </div>
        </div>

        {/* Hint */}
        <button
          onClick={() => setShowHint(h => !h)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {showHint ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {showHint ? "Hide hint" : "Show hint"}
        </button>
        {showHint && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-800 leading-relaxed">
            {question.hint}
          </div>
        )}

        {/* Answer textarea */}
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1">
            Your answer — reason through the failure cascade
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Walk through: (1) What fails first? (2) What's the cascade? (3) How do you mitigate? (4) How do you quantify the impact?"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none min-h-[120px]"
            disabled={scoreMutation.isPending}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={scoreMutation.isPending || answer.trim().length < 30}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {scoreMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {scoreMutation.isPending ? "Scoring..." : "Score My Answer"}
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-400 transition-all"
          >
            <RefreshCw size={11} /> Next scenario
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {result.passesBar
                ? <CheckCircle2 size={16} className="text-emerald-600" />
                : <XCircle size={16} className="text-red-500" />}
              <span className={`text-sm font-extrabold ${result.passesBar ? "text-emerald-700" : "text-red-700"}`}>
                {result.passesBar ? "Passes L6 bar for Technical Depth" : "Does not yet pass L6 bar"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Failure Mode Identification", score: result.failureModeScore, feedback: result.failureModeFeedback },
                { label: "Mitigation Proposal", score: result.mitigationScore, feedback: result.mitigationFeedback },
                { label: "Impact Quantification", score: result.quantificationScore, feedback: result.quantificationFeedback },
              ].map(({ label, score, feedback }) => (
                <div key={label} className={`rounded-xl border p-3 ${score >= 3 ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-800">{label}</span>
                    <ScorePill score={score} />
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{feedback}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-bold text-gray-700 mb-1">Overall feedback</p>
              <p className="text-xs text-gray-700 leading-relaxed">{result.overallFeedback}</p>
            </div>
            {/* Model answer toggle */}
            <button
              onClick={() => setShowModel(m => !m)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {showModel ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {showModel ? "Hide model answer" : "Show model answer"}
            </button>
            {showModel && (
              <div className="font-mono text-[11px] bg-gray-950 text-green-300 px-4 py-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                {question.modelAnswer}
              </div>
            )}
          </div>
        )}

        {/* Model answer (no score yet) */}
        {!result && (
          <>
            <button
              onClick={() => setShowModel(m => !m)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
            >
              {showModel ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {showModel ? "Hide model answer" : "Reveal model answer (without scoring)"}
            </button>
            {showModel && (
              <div className="font-mono text-[11px] bg-gray-950 text-green-300 px-4 py-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                {question.modelAnswer}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
