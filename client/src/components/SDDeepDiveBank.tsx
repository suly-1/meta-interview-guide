// SDDeepDiveBank — D2: Deep-Dive Question Bank per Component
// L5/L6/L7 level questions for each of 8 core components.
// Candidates self-assess which level they operate at and see exactly what to learn to reach the next level.
import { useState } from "react";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";

interface DeepDiveQuestion {
  level: "L5" | "L6" | "L7";
  question: string;
  whatItTests: string;
  modelAnswer: string;
}

interface ComponentBank {
  component: string;
  description: string;
  questions: DeepDiveQuestion[];
}

const BANKS: ComponentBank[] = [
  {
    component: "Cache (Redis/Memcached)",
    description: "Caching is in every Meta system design. L5 knows LRU. L6 knows eviction policies and failure modes. L7 can design a distributed cache from scratch.",
    questions: [
      { level: "L5", question: "What is the difference between LRU and LFU eviction policies? When would you use each?", whatItTests: "Basic cache mechanics", modelAnswer: "LRU (Least Recently Used): evicts the item not accessed for the longest time. Good for temporal locality — recently accessed items are likely to be accessed again. LFU (Least Frequently Used): evicts the item accessed least often. Better for workloads where popular items remain popular over time (e.g., hot posts). Use LRU for general caches; LFU when you have a stable hot set and want to protect it from one-time batch reads." },
      { level: "L5", question: "Explain cache stampede (thundering herd). How do you prevent it?", whatItTests: "Common cache failure mode", modelAnswer: "Cache stampede: a popular cache key expires, and hundreds of concurrent requests all miss the cache simultaneously, all hitting the DB at once. Prevention: (1) Mutex/lock: first request acquires lock, fetches from DB, populates cache. Others wait. (2) Probabilistic early expiry: randomly refresh cache slightly before TTL expires. (3) Background refresh: async refresh before expiry, serve stale while refreshing. (4) Jitter on TTL: add random offset to TTL to prevent synchronized expiry." },
      { level: "L6", question: "You have a Redis cluster with 10 nodes. One node fails. Walk me through exactly what happens to your application and how you recover.", whatItTests: "Production failure mode reasoning", modelAnswer: "With consistent hashing: ~10% of keys are unmapped. Those requests miss cache → hit origin DB. If origin can absorb 10% extra load: degrade gracefully, Redis auto-failover promotes replica in ~10-30s. If origin cannot: circuit breaker to shed non-critical load, serve stale data from other replicas if available. Recovery: Redis Sentinel/Cluster handles failover automatically. Monitor: cache hit rate (should drop ~10%), origin DB latency (should spike briefly). Prevention: always run Redis with replicas (RF≥2), monitor per-node health." },
      { level: "L6", question: "Design a rate limiter using Redis. What are the edge cases and how do you handle them?", whatItTests: "Redis as infrastructure building block", modelAnswer: "Token bucket with Redis: INCR key (atomic), SET key 0 EX ttl NX (set only if not exists). Race: INCR succeeds, crash before EXPIRE → key never expires. Fix: Lua script for atomicity. Sliding window: ZADD key timestamp member, ZREMRANGEBYSCORE key 0 (now-window), ZCARD key. Distributed: all API servers share same Redis — accurate but adds ~1ms latency. Edge cases: (1) Redis unavailable → fail open (allow requests) or fail closed (block all). (2) Clock skew between servers → use Redis server time (TIME command). (3) Key expiry race → use Lua script for atomic check-and-set." },
      { level: "L7", question: "Meta's Memcached deployment serves 1B+ requests/second. How would you design the cache invalidation system to ensure consistency across thousands of cache nodes?", whatItTests: "Novel insights at production scale", modelAnswer: "At Meta scale (TAO architecture): (1) Lease-based invalidation: on cache miss, issue a lease token. Only the lease holder can populate the cache. Prevents thundering herd and stale sets. (2) McSqueal: MySQL binlog → invalidation pipeline. Every DB write generates a cache invalidation event. (3) Regions: cache organized in regions. Cross-region invalidation via dedicated invalidation channel. (4) Mcreplica: read-only cache replicas in each region, invalidated from primary region. (5) Consistency: TAO provides read-your-writes via lease mechanism. Key insight: at this scale, invalidation is a distributed systems problem, not a cache problem." },
    ],
  },
  {
    component: "Message Queue (Kafka)",
    description: "Kafka is Meta's backbone for async processing. L5 knows pub/sub. L6 knows partitioning and consumer groups. L7 can reason about exactly-once semantics and cross-datacenter replication.",
    questions: [
      { level: "L5", question: "Explain Kafka's consumer group concept. How does it enable parallel processing?", whatItTests: "Basic Kafka mechanics", modelAnswer: "Consumer group: a set of consumers that jointly consume a topic. Each partition is consumed by exactly one consumer in the group at a time. Parallelism = number of partitions (not consumers). If consumers > partitions, excess consumers are idle. If consumers < partitions, some consumers handle multiple partitions. Rebalancing: when a consumer joins/leaves, partitions are redistributed. Use case: scale consumption by adding consumers up to the partition count." },
      { level: "L5", question: "What is the difference between at-most-once, at-least-once, and exactly-once delivery in Kafka?", whatItTests: "Delivery semantics fundamentals", modelAnswer: "At-most-once: commit offset before processing. If consumer crashes after commit but before processing, message is lost. Use for: metrics, logging (loss acceptable). At-least-once: commit offset after processing. If consumer crashes after processing but before commit, message is reprocessed. Use for: most use cases with idempotent consumers. Exactly-once: Kafka transactions (EOS) — producer transactions + consumer isolation level 'read_committed'. Highest overhead. Use for: financial transactions, inventory updates." },
      { level: "L6", question: "A Kafka topic has 10 partitions. One partition is receiving 80% of all messages. How do you diagnose and fix this?", whatItTests: "Hot partition problem — common production issue", modelAnswer: "Hot partition = bad partition key. Diagnosis: Kafka consumer lag per partition, producer metrics per partition. Root cause: partition key has low cardinality (e.g., country_code) or one key is extremely hot (celebrity user_id). Fix: (1) Better partition key: use user_id + content_id hash for more uniform distribution. (2) Key salting: append random suffix to hot keys (user_123_0, user_123_1). Consumers must aggregate. (3) Separate topic for hot producers: route celebrity events to a dedicated topic with more partitions. (4) Increase partition count: but requires rebalancing and doesn't fix key skew." },
      { level: "L6", question: "You need to replay 7 days of Kafka events to rebuild a corrupted data store. What are the operational considerations?", whatItTests: "Kafka as a replayable event log", modelAnswer: "Kafka supports replay via offset reset. Steps: (1) Verify retention.ms ≥ 7 days (default is 7 days — confirm). (2) Create new consumer group or reset offsets: kafka-consumer-groups.sh --reset-offsets --to-datetime. (3) Spin up replay consumers separate from production to avoid affecting live processing. (4) Throttle replay: set max.poll.records and processing rate to avoid overwhelming downstream. (5) Schema evolution: ensure consumer handles 7-day-old message formats (Avro/Protobuf schema registry). (6) Log compacted topics: may have deleted old versions of keys — replay may not reconstruct full history. (7) Monitor replay progress and ETA." },
      { level: "L7", question: "Design a system that guarantees exactly-once processing of Kafka events across a distributed pipeline with 5 stages, where each stage can fail independently.", whatItTests: "Distributed systems reasoning at L7 level", modelAnswer: "Exactly-once across a multi-stage pipeline requires: (1) Idempotency at each stage: each stage must be idempotent — processing the same event twice produces the same result. Use event_id as idempotency key in DB. (2) Transactional outbox: each stage writes to DB + publishes to next Kafka topic in a single transaction (outbox pattern). Prevents partial failures. (3) Kafka transactions: producer uses transactional API — all writes in a transaction are atomic. (4) Consumer isolation: read_committed ensures consumers only see committed messages. (5) Dead letter queue: failed events after N retries go to DLQ for manual inspection. (6) Saga pattern: for long-running transactions, use compensating transactions to undo partial work. Key insight: exactly-once is a property of the entire pipeline, not just Kafka." },
    ],
  },
  {
    component: "Database (MySQL/Postgres)",
    description: "Databases are the foundation. L5 knows indexes. L6 knows sharding and replication. L7 can design a distributed database architecture for Meta-scale.",
    questions: [
      { level: "L5", question: "Explain the difference between a clustered index and a non-clustered index.", whatItTests: "Index fundamentals", modelAnswer: "Clustered index: the table data is physically sorted by the index key. InnoDB's primary key is always clustered. Only one clustered index per table. Range queries on the clustered key are fast (sequential I/O). Non-clustered index: a separate data structure that stores the index key + pointer to the row. Multiple non-clustered indexes per table. Lookup requires two steps: find row pointer in index, then fetch row from table (double lookup). Covering index: non-clustered index that includes all columns needed by a query — avoids double lookup." },
      { level: "L5", question: "What is the N+1 query problem and how do you fix it?", whatItTests: "Common ORM anti-pattern", modelAnswer: "N+1: fetching N parent records, then making N separate queries to fetch each parent's children. Example: fetch 100 posts (1 query), then fetch author for each post (100 queries) = 101 queries. Fix: (1) JOIN: SELECT posts.*, users.* FROM posts JOIN users ON posts.author_id = users.id — 1 query. (2) Batch fetch: collect all author_ids, then SELECT * FROM users WHERE id IN (...) — 2 queries. (3) DataLoader pattern: batch and deduplicate all lookups within a request. (4) ORM eager loading: posts.includes(:author). Prevention: use query analyzers (Bullet gem, Hibernate statistics) to detect N+1 in development." },
      { level: "L6", question: "You need to shard a 10TB MySQL database by user_id. Walk me through the migration strategy with zero downtime.", whatItTests: "Database sharding in production", modelAnswer: "Zero-downtime sharding migration: (1) Set up N shard databases (start with 8-16, power of 2 for future resharding). (2) Dual-write: application writes to both old DB and new shards. (3) Backfill: migrate existing data to shards in batches (100K rows/batch, off-peak hours). (4) Verify: compare row counts and checksums between old DB and shards. (5) Read cutover: route reads to shards (while still writing to both). Monitor for errors. (6) Write cutover: stop writing to old DB. (7) Decommission old DB after 1 week (safety window). Key: dual-write window allows rollback at any point. Shard key: user_id % N for even distribution." },
      { level: "L6", question: "Explain MVCC (Multi-Version Concurrency Control) and how it enables non-blocking reads in PostgreSQL.", whatItTests: "Database internals knowledge", modelAnswer: "MVCC: each row has multiple versions with transaction timestamps. Readers see a consistent snapshot of the DB at their transaction start time — they never block writers, and writers never block readers. Implementation: each row has xmin (creating transaction ID) and xmax (deleting transaction ID). A reader with transaction ID T sees rows where xmin ≤ T and xmax > T (or xmax is null). Writes create new row versions rather than overwriting. Vacuum process: periodically removes dead row versions (rows where xmax < oldest active transaction). Trade-off: MVCC enables high concurrency but requires vacuum to prevent table bloat." },
      { level: "L7", question: "Meta's MySQL deployment has 10,000+ database instances. How would you design the schema migration system to safely roll out schema changes across all instances?", whatItTests: "Production database operations at Meta scale", modelAnswer: "Schema migration at Meta scale (Shift/OnlineSchemaChange): (1) Online DDL: use pt-online-schema-change or gh-ost to perform schema changes without locking. (2) Backward-compatible migrations: new schema must be readable by old application code. Deploy in 3 phases: (a) add new column (nullable), (b) deploy new app code that writes to both old and new columns, (c) backfill old rows, (d) make column NOT NULL, (e) remove old column. (3) Canary deployment: apply migration to 1% of shards first, monitor for errors, then roll out. (4) Automated rollback: if error rate exceeds threshold during migration, automatically revert. (5) Migration registry: track migration state per shard — which migrations have been applied, which are in progress. Key insight: at 10K instances, manual migration is impossible — everything must be automated and observable." },
    ],
  },
  {
    component: "Load Balancer",
    description: "Load balancers are the entry point. L5 knows round-robin. L6 knows health checks and algorithms. L7 can design a global load balancing system.",
    questions: [
      { level: "L5", question: "Compare round-robin, least-connections, and IP-hash load balancing algorithms.", whatItTests: "Basic load balancing algorithms", modelAnswer: "Round-robin: distribute requests sequentially. Simple, works well when all backends are equal. Least-connections: route to backend with fewest active connections. Better for variable request duration. IP-hash: route based on client IP hash — ensures same client always hits same backend (sticky sessions). Use case: round-robin for stateless APIs, least-connections for long-lived connections (WebSocket), IP-hash for stateful applications that can't use shared session storage." },
      { level: "L6", question: "One of your 10 backend servers is responding in 2000ms instead of 50ms but passing health checks. How does this affect your load balancer and how do you fix it?", whatItTests: "Slow server problem — subtle production issue", modelAnswer: "Round-robin: 10% of users get 2000ms responses. Least-connections: slow server accumulates connections (each held for 2000ms), eventually gets most traffic — worse than round-robin. Fix: (1) Least-response-time algorithm: LB tracks response time per backend, routes to fastest. (2) Outlier detection (Envoy): automatically eject servers with anomalous latency/error rates. (3) Health check with latency threshold: fail health check if response > 500ms. (4) Circuit breaker: if p99 latency > threshold, temporarily remove server. Monitoring: track per-backend latency distribution (p50, p95, p99), not just error rate." },
      { level: "L6", question: "Design a blue-green deployment using your load balancer. What can go wrong?", whatItTests: "Deployment patterns and LB orchestration", modelAnswer: "Blue-green with LB: (1) Deploy green alongside blue, (2) Health check green, (3) Shift traffic: 0% → 10% → 50% → 100% over 15-30 min (canary), (4) Monitor error rate and latency at each step — automated rollback if error rate > threshold, (5) Rollback: shift 100% back to blue in <30s. What can go wrong: (1) Green passes health checks but has subtle bugs under real traffic (e.g., DB migration incompatibility), (2) Session state: users mid-session on blue get routed to green — stateful apps need session drain, (3) DB schema: if green requires schema change, blue can't run against new schema — requires backward-compatible migrations, (4) Cache warming: green starts cold, higher latency until cache warms." },
      { level: "L7", question: "Design Meta's global load balancing system that routes 3B users across 20+ data centers with sub-10ms routing decisions.", whatItTests: "Global distributed systems design", modelAnswer: "Meta's global LB (similar to Katran): (1) Anycast: multiple data centers announce same IP via BGP. Traffic routes to nearest PoP by network topology. (2) DNS-based routing: GeoDNS returns different IPs based on client location. TTL: 30-60s for fast failover. (3) ECMP (Equal-Cost Multi-Path): within a PoP, traffic distributed across multiple LB instances. (4) Consistent hashing at LB layer: ensures same user routes to same backend for session affinity. (5) Health propagation: backend health signals propagate to DNS/BGP within 30s. (6) Capacity-aware routing: route traffic away from data centers approaching capacity. (7) Latency-based routing: measure RTT to each PoP, route to lowest latency. Key: routing decisions happen at BGP/DNS layer (milliseconds), not at application layer." },
    ],
  },
  {
    component: "CDN",
    description: "CDNs serve Meta's media at scale. L5 knows caching. L6 knows cache invalidation and origin protection. L7 can design a CDN architecture.",
    questions: [
      { level: "L5", question: "Explain the difference between CDN push and CDN pull. When would you use each?", whatItTests: "CDN fundamentals", modelAnswer: "CDN pull: CDN fetches content from origin on first request, caches for subsequent requests. Simple to set up, no pre-population needed. Best for: long-tail content (most content accessed infrequently). CDN push: proactively upload content to CDN edge nodes before requests arrive. Best for: predictably popular content (new product launches, scheduled events). Trade-off: pull is simpler but has higher first-request latency and origin load for popular content. Push eliminates first-request latency but requires managing CDN inventory." },
      { level: "L6", question: "A viral video gets 10M requests in 60 seconds. Your CDN has it cached. Walk me through what happens at each layer.", whatItTests: "CDN behavior under viral load", modelAnswer: "With CDN cache hit: 10M requests → CDN edge nodes serve from cache → origin sees ~0 requests. CDN capacity: each PoP handles millions of requests/second for cached content. Anycast routes requests to nearest PoP, distributing load globally. Potential issues: (1) Single PoP bandwidth saturation if video is large (e.g., 500MB × 10M = 5PB egress — distributed across 20+ PoPs = 250TB each, feasible), (2) Origin shield: if cache miss, only origin shield fetches from origin (1 request), not all edge nodes. (3) Cache warming: if video just went viral and isn't cached yet, first requests from each PoP hit origin — thundering herd. Fix: pre-warm CDN for predicted-viral content using engagement signals." },
      { level: "L6", question: "How do you serve personalized content (e.g., 'Hello, Alice') through a CDN without caching Alice's response for Bob?", whatItTests: "CDN and personalization — common interview trap", modelAnswer: "Personalized content cannot be cached naively. Options: (1) Don't cache personalized responses: Cache-Control: private, no-store. CDN passes through to origin. Loses CDN benefit for personalized parts. (2) Cache the page skeleton, fetch personalized parts client-side via JS (API call after page load). CDN caches static shell, personalization happens in browser. (3) Edge-side includes (ESI): CDN assembles page from cached fragments + dynamic personalized fragment fetched from origin. (4) Vary: Cookie header: CDN caches separate versions per cookie — dangerous, explodes cache storage. (5) Signed URLs with short TTL for user-specific content. Best practice: separate static and dynamic content, cache static aggressively." },
      { level: "L7", question: "Design Instagram's CDN architecture to serve 500M photos/day with <50ms p99 load time globally.", whatItTests: "CDN design at Meta scale", modelAnswer: "Instagram CDN (similar to Meta's Proxygen/CDN): (1) Multi-tier CDN: edge PoPs (100+ globally) → regional PoPs (10-20) → origin shield → origin. (2) Cache hierarchy: edge caches hot content, regional caches warm content, origin shield prevents thundering herd at origin. (3) Image optimization at edge: WebP conversion, responsive sizing, quality adjustment based on network speed. (4) Predictive pre-warming: ML model predicts which photos will go viral based on early engagement signals, pre-warms CDN before traffic spike. (5) Consistent hashing for cache routing: same photo always routes to same edge node (maximizes hit rate). (6) Purge API: instant cache invalidation for deleted/reported content. (7) Monitoring: per-PoP hit rate, origin request rate, p99 latency. Target: >99% cache hit rate for photos older than 1 hour." },
    ],
  },
  {
    component: "API Gateway",
    description: "API gateways are the control plane. L5 knows routing. L6 knows auth and rate limiting. L7 can design a service mesh.",
    questions: [
      { level: "L5", question: "What is the role of an API gateway in a microservices architecture?", whatItTests: "API gateway fundamentals", modelAnswer: "API gateway: single entry point for all client requests. Responsibilities: (1) Routing: route requests to appropriate microservice based on path/method. (2) Authentication: validate tokens before forwarding to services. (3) Rate limiting: enforce per-client request limits. (4) Load balancing: distribute requests across service instances. (5) SSL termination: handle TLS, forward plain HTTP to internal services. (6) Request/response transformation: translate between client format and service format. (7) Observability: centralized logging, metrics, tracing. Benefits: clients talk to one endpoint, services don't need to implement auth/rate limiting individually." },
      { level: "L6", question: "Your API gateway is adding 50ms of latency to every request. Diagnose and fix it.", whatItTests: "API gateway performance optimization", modelAnswer: "Latency sources: (1) TLS handshake: 1-2 RTTs for new connections. Fix: TLS session resumption, connection pooling to backends. (2) Auth token validation: JWT validation is CPU-bound (RSA signature). Fix: cache validated tokens for their TTL, use EdDSA (faster than RSA). (3) Plugin chain: each plugin (rate limiting, logging, auth) adds latency. Fix: profile plugin chain, disable unused plugins, run plugins async where possible. (4) DNS resolution: gateway resolves backend hostname per request. Fix: cache DNS, use service discovery with local cache. (5) Connection pooling to backends: if gateway opens new TCP connection per request, adds 1-2 RTTs. Fix: maintain persistent connection pool. Target: gateway overhead < 5ms." },
      { level: "L6", question: "How do you manage API versioning through an API gateway without breaking existing clients?", whatItTests: "API lifecycle management", modelAnswer: "Gateway-managed versioning: (1) Path-based routing: /v1/* → v1 backends, /v2/* → v2 backends. Clients explicitly choose version. (2) Header-based routing: API-Version: 2 header routes to v2. Cleaner URLs but requires client changes. (3) Traffic splitting: route 5% of /v1 traffic to v2 backends (canary). (4) Request transformation: gateway translates v1 request format to v2 format — allows v1 clients to use v2 backends transparently. (5) Deprecation: add Deprecation and Sunset headers to v1 responses with migration deadline. (6) Analytics: track v1 vs v2 usage at gateway to identify clients still on v1. Timeline: announce deprecation 6 months ahead, sunset 12 months." },
      { level: "L7", question: "Design Meta's internal service mesh for 10,000+ microservices with automatic service discovery, load balancing, and observability.", whatItTests: "Service mesh design at Meta scale", modelAnswer: "Meta's service mesh (similar to Envoy/Istio at scale): (1) Sidecar proxy: each service instance has an Envoy sidecar that handles all network traffic. Services communicate via localhost, sidecars handle service discovery, LB, retries, circuit breaking. (2) Control plane: centralized control plane (xDS API) pushes routing rules, certificates, and policies to all sidecars. (3) Service discovery: Consul/ZooKeeper maintains service registry. Sidecars subscribe to updates. (4) mTLS: automatic mutual TLS between all services — zero-trust networking. (5) Observability: sidecars emit traces (Jaeger), metrics (Prometheus), and logs for every request. (6) Traffic management: canary deployments, A/B testing, fault injection via control plane configuration. (7) Circuit breaking: automatic circuit breakers per upstream service. Key challenge at 10K services: control plane scalability — must push updates to 10K+ sidecars in <1s." },
    ],
  },
  {
    component: "Search Index (Elasticsearch)",
    description: "Search is core to Meta's products. L5 knows inverted index. L6 knows relevance tuning and scaling. L7 can design a distributed search system.",
    questions: [
      { level: "L5", question: "Explain how an inverted index works and why it enables fast full-text search.", whatItTests: "Search fundamentals", modelAnswer: "Inverted index: maps each term to the list of documents containing that term. Example: 'apple' → [doc1, doc3, doc7]. Building: tokenize all documents, for each token, add document ID to the token's posting list. Query: look up each query term in the index, intersect/union the posting lists. Why fast: instead of scanning all documents for a term (O(N)), look up the term in the index (O(log N) for B-tree, O(1) for hash) and get the document list directly. Posting list: sorted by document ID (enables fast intersection) or by relevance score (enables fast top-K retrieval)." },
      { level: "L6", question: "A search query that normally takes 50ms is now taking 5000ms. How do you diagnose it?", whatItTests: "Search performance debugging", modelAnswer: "Diagnosis: (1) Slow query log: log queries > 1000ms with their query body. (2) Profile API: POST /index/_search?profile=true — shows per-shard, per-phase timing breakdown. (3) Check JVM heap: if heap > 75%, GC pauses cause latency spikes. Fix: reduce heap usage or add nodes. (4) Check shard count: too many small shards = high coordination overhead. Optimal shard size: 10-50GB. (5) Check query type: wildcard/regex queries are expensive — avoid leading wildcards. (6) Check cluster state: yellow/red cluster means missing replicas, read requests wait. (7) Check hot threads API: identify CPU-consuming threads. Common fixes: add index on queried field, reduce shard count via reindex, increase JVM heap." },
      { level: "L6", question: "How do you reindex 1B documents in Elasticsearch without downtime?", whatItTests: "Zero-downtime operations at scale", modelAnswer: "Zero-downtime reindex: (1) Create new index (v2) with updated mapping. (2) Set up alias: production alias points to v1. (3) Dual-write: all new documents written to both v1 and v2. (4) Background reindex: POST /_reindex from v1 to v2, throttled to avoid impacting production. (5) Monitor: GET /_tasks?actions=*reindex. (6) Verify v2: run test queries, compare results with v1. (7) Atomic alias swap: POST /_aliases — remove v1, add v2 atomically — zero downtime cutover. (8) Stop dual-write, delete v1. Timeline: ~2-4 hours at 100K docs/sec. Key: alias swap is the only moment of risk." },
      { level: "L7", question: "Design Instagram's search system that indexes 100M new posts/day and serves 1B search queries/day with <100ms p99 latency.", whatItTests: "Search system design at Meta scale", modelAnswer: "Instagram search architecture: (1) Indexing pipeline: post creation → Kafka event → indexing workers → Elasticsearch. Near-real-time: posts searchable within 5-10 seconds. (2) Index design: separate indexes for posts, users, hashtags, locations. Each optimized for its access pattern. (3) Sharding: 100M posts/day × 365 = 36B posts/year. Time-based sharding: separate index per month, alias covers last 12 months. (4) Relevance: BM25 for text relevance + engagement signals (likes, comments) as boosting factors. ML re-ranking for personalization. (5) Caching: cache top-1000 queries per language. Cache user's recent searches. (6) Geo-search: Elasticsearch geo_point field for location-based search. (7) Scaling: 100+ Elasticsearch nodes, 3× replication. Read replicas for search, dedicated nodes for indexing. Target: p99 < 100ms requires shard-level caching and query optimization." },
    ],
  },
  {
    component: "Object Storage (S3)",
    description: "Object storage is the foundation for media. L5 knows basic operations. L6 knows consistency and performance. L7 can design a distributed object store.",
    questions: [
      { level: "L5", question: "Explain S3's consistency model. What changed in 2020?", whatItTests: "S3 consistency fundamentals", modelAnswer: "Before 2020: S3 had eventual consistency for overwrite PUTs and DELETEs. After a PUT, a subsequent GET might return the old version for a short window. After 2020: S3 provides strong read-after-write consistency for all operations (PUTs, DELETEs, LIST). A GET after a PUT always returns the new version. A LIST after a PUT always includes the new object. This change eliminated a major class of bugs in distributed applications that assumed eventual consistency and needed to handle stale reads." },
      { level: "L6", question: "You're uploading 10K files/second to S3 and seeing 503 SlowDown errors. What's happening and how do you fix it?", whatItTests: "S3 performance at scale", modelAnswer: "S3 throttles at ~3500 PUT/second per prefix. 10K/s exceeds this. Root cause: all files uploaded to same prefix (e.g., uploads/2024/01/01/). Fix: (1) Randomize key prefix: prepend random hex (e.g., a3f2/uploads/2024/01/01/file.jpg). S3 partitions by prefix, random prefix distributes across partitions. (2) Hash-based prefix: use first 4 chars of file hash as prefix — deterministic but distributed. (3) Date-based prefix with randomization: year/month/day/hour/random_shard/file.jpg. Note: S3 auto-scales partitions after sustained high request rates (~30 min to adapt). Monitoring: CloudWatch S3 request metrics, alert on 503 rate > 0.1%." },
      { level: "L6", question: "Design a file upload system that handles files up to 5GB with resumable uploads.", whatItTests: "Large file upload architecture", modelAnswer: "Resumable upload architecture: (1) Client requests upload URL from server (POST /uploads). Server creates upload record in DB with status=pending, returns upload_id. (2) Client splits file into 5MB chunks. (3) For each chunk: client requests presigned S3 URL (GET /uploads/{id}/chunk/{n}). Server returns S3 multipart upload URL. (4) Client uploads chunk directly to S3 using presigned URL. (5) Client notifies server of chunk completion (POST /uploads/{id}/chunk/{n}/complete). Server records chunk in DB. (6) After all chunks: client calls POST /uploads/{id}/finalize. Server calls S3 CompleteMultipartUpload. (7) Resume: client calls GET /uploads/{id}/status to get list of completed chunks, resumes from first missing chunk. Lifecycle: abort incomplete multipart uploads after 7 days (S3 lifecycle rule)." },
      { level: "L7", question: "Design Meta's distributed object storage system (similar to Haystack) that stores 100B photos with <10ms read latency.", whatItTests: "Distributed storage system design", modelAnswer: "Meta's Haystack architecture: (1) Problem: standard filesystems have high metadata overhead for small files (photos). Each file = inode + directory entry = multiple disk seeks. (2) Solution: pack multiple photos into large 'haystack store' files (100GB each). Each photo stored as a needle with offset within the store file. (3) Index: in-memory index maps photo_id → (volume_id, offset, size). Fits in RAM for fast lookup. (4) Directory: maps logical photo_id to physical volume. Consistent hashing for volume assignment. (5) CDN layer: 99% of reads served from CDN. Haystack only handles cache misses. (6) Replication: each volume replicated 3× across different racks/DCs. (7) Deletion: mark needle as deleted in index (logical delete). Compaction job reclaims space. (8) Write path: photo → upload server → Haystack store (append-only). Append-only = sequential writes = high throughput. Key insight: pack small files into large files to amortize filesystem metadata overhead." },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  L5: "bg-blue-100 text-blue-800 border-blue-300",
  L6: "bg-amber-100 text-amber-800 border-amber-300",
  L7: "bg-purple-100 text-purple-800 border-purple-300",
};

export default function SDDeepDiveBank() {
  const [selectedComponent, setSelectedComponent] = useState(BANKS[0].component);
  const [selectedLevel, setSelectedLevel] = useState<"All" | "L5" | "L6" | "L7">("All");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});

  const bank = BANKS.find(b => b.component === selectedComponent) ?? BANKS[0];
  const questions = bank.questions.filter(q => selectedLevel === "All" || q.level === selectedLevel);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-start gap-3">
          <Layers size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-purple-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Deep-Dive Question Bank
            </p>
            <p className="text-xs text-purple-700 mt-1 leading-relaxed">
              L5 questions test component mechanics. L6 questions test production failure modes and real experience.
              L7 questions test novel insights and cross-system implications. Find your current level — then see exactly what to learn to reach the next one.
            </p>
          </div>
        </div>
      </div>

      {/* Component selector */}
      <div className="flex flex-wrap gap-1.5">
        {BANKS.map(b => (
          <button
            key={b.component}
            onClick={() => { setSelectedComponent(b.component); setExpandedIdx(null); setShowAnswers({}); }}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
              b.component === selectedComponent
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {b.component.split(" (")[0]}
          </button>
        ))}
      </div>

      {/* Level filter */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Level:</span>
        {(["All", "L5", "L6", "L7"] as const).map(level => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
              level === selectedLevel
                ? level === "L5" ? "bg-blue-600 text-white border-blue-600"
                : level === "L6" ? "bg-amber-600 text-white border-amber-600"
                : level === "L7" ? "bg-purple-600 text-white border-purple-600"
                : "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Component description */}
      <p className="text-xs text-gray-600 leading-relaxed italic">{bank.description}</p>

      {/* Questions */}
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${LEVEL_COLORS[q.level]}`}>
                {q.level}
              </span>
              <p className="text-sm font-semibold text-gray-900 flex-1">{q.question}</p>
              {expandedIdx === idx ? <ChevronDown size={14} className="text-gray-600 flex-shrink-0 mt-0.5" /> : <ChevronRight size={14} className="text-gray-600 flex-shrink-0 mt-0.5" />}
            </button>

            {expandedIdx === idx && (
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-0.5">What this tests</p>
                  <p className="text-xs text-gray-700">{q.whatItTests}</p>
                </div>
                <button
                  onClick={() => setShowAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {showAnswers[idx] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  {showAnswers[idx] ? "Hide model answer" : "Show model answer"}
                </button>
                {showAnswers[idx] && (
                  <div className="font-mono text-[11px] bg-gray-950 text-green-300 px-4 py-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                    {q.modelAnswer}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
