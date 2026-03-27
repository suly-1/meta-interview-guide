// SDMetaBlogReader — D3: Meta Engineering Blog with Interview-Relevance Annotations
// Curated list of Meta Engineering Blog posts with direct interview relevance annotations.
// Tells candidates exactly which system design topic each post covers and what to extract from it.
import { useState } from "react";
import { ExternalLink, Rss, Star, Filter } from "lucide-react";

interface BlogPost {
  title: string;
  url: string;
  year: number;
  tags: string[];
  relevanceScore: 1 | 2 | 3; // 3 = must-read, 2 = high, 1 = good-to-know
  systemDesignTopic: string;
  whatToExtract: string;
  keyInsight: string;
}

const POSTS: BlogPost[] = [
  {
    title: "Scaling Memcache at Facebook",
    url: "https://research.facebook.com/publications/scaling-memcache-at-facebook/",
    year: 2013,
    tags: ["Caching", "Distributed Systems", "Consistency"],
    relevanceScore: 3,
    systemDesignTopic: "Distributed Cache Design",
    whatToExtract: "Lease-based invalidation to prevent thundering herd and stale sets. Regional pools. McSqueal for DB-to-cache invalidation via binlog. The 'gutter' pool for handling node failures.",
    keyInsight: "At Meta scale, cache consistency is a distributed systems problem. The lease mechanism solves both thundering herd AND stale sets in one mechanism.",
  },
  {
    title: "TAO: Facebook's Distributed Data Store for the Social Graph",
    url: "https://www.usenix.org/conference/atc13/technical-sessions/presentation/bronson",
    year: 2013,
    tags: ["Social Graph", "Distributed Storage", "Caching"],
    relevanceScore: 3,
    systemDesignTopic: "Social Graph Storage",
    whatToExtract: "Objects and associations as the two primitives. Read-heavy workload optimization. Tiered architecture (followers → leaders). How TAO handles cross-region consistency.",
    keyInsight: "The social graph is not stored as a graph database — it's stored as objects (nodes) and associations (edges) in MySQL with a caching layer. The access patterns drive the data model.",
  },
  {
    title: "Haystack: Facebook's Photo Storage",
    url: "https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Beaver.pdf",
    year: 2010,
    tags: ["Object Storage", "Media", "Filesystem"],
    relevanceScore: 3,
    systemDesignTopic: "Large-Scale Object Storage",
    whatToExtract: "The 'needle in a haystack' metaphor. Why standard filesystems fail for small files (metadata overhead). The three-tier architecture: directory, store, CDN. Append-only writes for high throughput.",
    keyInsight: "Pack millions of small files into large store files to amortize filesystem metadata overhead. The in-memory index (photo_id → offset) is the key to <10ms reads.",
  },
  {
    title: "Instagram Engineering: Sharding & IDs at Instagram",
    url: "https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c",
    year: 2012,
    tags: ["Database Sharding", "ID Generation", "Distributed Systems"],
    relevanceScore: 3,
    systemDesignTopic: "Distributed ID Generation + Sharding",
    whatToExtract: "Why auto-increment IDs fail at scale (single point of failure, reveal business metrics). Instagram's ID format: 41 bits timestamp + 13 bits shard ID + 10 bits sequence. How this enables time-based sorting without a separate timestamp column.",
    keyInsight: "Embed shard ID in the generated ID — routing becomes O(1) without a lookup table. The timestamp prefix enables chronological sorting by ID.",
  },
  {
    title: "Building Mobile-First Infrastructure for Messenger",
    url: "https://engineering.fb.com/2014/10/09/production-engineering/building-mobile-first-infrastructure-for-messenger/",
    year: 2014,
    tags: ["Messaging", "Real-time", "Mobile"],
    relevanceScore: 3,
    systemDesignTopic: "Real-Time Messaging at Scale",
    whatToExtract: "MQTT for mobile messaging (low overhead vs. HTTP). Iris queue for message ordering and delivery guarantees. The difference between online and offline delivery paths.",
    keyInsight: "Mobile messaging requires a different protocol than web messaging — MQTT's 2-byte header vs. HTTP's 200+ byte header matters at 1B+ devices.",
  },
  {
    title: "How Facebook Live Streams to Millions",
    url: "https://engineering.fb.com/2015/12/03/ios/under-the-hood-broadcasting-live-video-to-millions/",
    year: 2015,
    tags: ["Video Streaming", "CDN", "Real-time"],
    relevanceScore: 3,
    systemDesignTopic: "Live Video Streaming Architecture",
    whatToExtract: "RTMP ingest → HLS output pipeline. The 'ingest PoP' concept — stream ingested at nearest PoP, then distributed globally. Why live streaming has different CDN requirements than VOD.",
    keyInsight: "Live streaming requires a global distribution tree, not just CDN caching — the stream must be pushed to all edges simultaneously, not pulled on demand.",
  },
  {
    title: "Wormhole: Pub/Sub System Moving Data through Space and Time",
    url: "https://engineering.fb.com/2013/06/20/core-data/wormhole-pub-sub-system-moving-data-through-space-and-time/",
    year: 2013,
    tags: ["Messaging", "Event Streaming", "Distributed Systems"],
    relevanceScore: 2,
    systemDesignTopic: "Event Streaming / Change Data Capture",
    whatToExtract: "How Meta uses pub/sub for cross-system data propagation. The difference between Wormhole (CDC from MySQL binlog) and Scribe (application-level logging). Delivery guarantees.",
    keyInsight: "Change Data Capture from MySQL binlog is how Meta propagates data changes to caches, search indexes, and analytics — not application-level event publishing.",
  },
  {
    title: "Scuba: Diving into Data at Facebook",
    url: "https://research.facebook.com/publications/scuba-diving-into-data-at-facebook/",
    year: 2013,
    tags: ["Analytics", "In-Memory Database", "Real-time"],
    relevanceScore: 2,
    systemDesignTopic: "Real-Time Analytics System Design",
    whatToExtract: "In-memory columnar storage for sub-second analytics. Time-based data expiry (last 30 days in memory). The leaf-aggregator architecture for distributed query execution.",
    keyInsight: "For real-time operational analytics, an in-memory columnar store beats a traditional OLAP database by 100×. Sacrifice durability (data in memory only) for query speed.",
  },
  {
    title: "Presto: Interacting with Petabytes of Data at Facebook",
    url: "https://engineering.fb.com/2013/11/06/core-data/presto-interacting-with-petabytes-of-data-at-facebook/",
    year: 2013,
    tags: ["Data Warehouse", "Distributed Query", "Analytics"],
    relevanceScore: 2,
    systemDesignTopic: "Distributed Query Engine",
    whatToExtract: "Coordinator-worker architecture for distributed SQL. How Presto pushes computation to where data lives (data locality). The connector model for querying multiple data sources.",
    keyInsight: "For ad-hoc analytics on petabytes, a MPP (massively parallel processing) query engine that reads data in-place beats ETL into a data warehouse.",
  },
  {
    title: "Facebook's New Real-Time Messaging System: HBase to Store 135+ Billion Messages a Month",
    url: "https://engineering.fb.com/2010/11/15/core-data/the-underlying-technology-of-messages/",
    year: 2010,
    tags: ["Messaging", "HBase", "Storage"],
    relevanceScore: 2,
    systemDesignTopic: "Message Storage at Scale",
    whatToExtract: "Why Facebook moved from Cassandra to HBase for message storage. The trade-off between eventual consistency (Cassandra) and strong consistency (HBase). How message threads are stored as rows.",
    keyInsight: "For messaging, strong consistency (HBase) was worth the operational complexity over eventual consistency (Cassandra) — users notice out-of-order messages.",
  },
  {
    title: "Rebuilding Our Tech Stack for the New Facebook.com",
    url: "https://engineering.fb.com/2020/05/08/web/facebook-redesign/",
    year: 2020,
    tags: ["Frontend", "Performance", "Architecture"],
    relevanceScore: 2,
    systemDesignTopic: "Web Performance at Scale",
    whatToExtract: "Relay for data fetching co-located with components. Code splitting strategy. The 'server-driven UI' concept for dynamic content. How Meta reduced bundle size by 50%.",
    keyInsight: "At Meta scale, every KB of JavaScript has a measurable impact on revenue. Co-locating data requirements with components (Relay) eliminates over-fetching.",
  },
  {
    title: "How Instagram Suggests New Content",
    url: "https://engineering.fb.com/2020/12/09/core-data/instagram-explore/",
    year: 2020,
    tags: ["Recommendation", "ML", "Feed"],
    relevanceScore: 2,
    systemDesignTopic: "Recommendation System Design",
    whatToExtract: "Three-stage pipeline: candidate generation → ranking → policy/diversity. How embedding-based retrieval scales to billions of items. The role of FAISS for approximate nearest neighbor search.",
    keyInsight: "Recommendation at scale is a funnel: start with billions of items, use approximate methods to get to thousands, then apply expensive ML ranking to get to tens.",
  },
  {
    title: "Introducing F4: Facebook's Warm BLOB Storage System",
    url: "https://www.usenix.org/conference/osdi14/technical-sessions/presentation/muralidhar",
    year: 2014,
    tags: ["Object Storage", "Erasure Coding", "Cost Optimization"],
    relevanceScore: 2,
    systemDesignTopic: "Tiered Storage Design",
    whatToExtract: "Hot vs. warm storage tiers. Erasure coding (Reed-Solomon) vs. replication for cost reduction. How F4 reduces storage overhead from 3.6× (3× replication) to 2.1× (erasure coding).",
    keyInsight: "For cold/warm data that is rarely accessed, erasure coding reduces storage cost by 40% vs. replication with the same durability guarantee.",
  },
  {
    title: "Unicorn: A System for Searching the Social Graph",
    url: "https://research.facebook.com/publications/unicorn-a-system-for-searching-the-social-graph/",
    year: 2013,
    tags: ["Search", "Social Graph", "Distributed Systems"],
    relevanceScore: 1,
    systemDesignTopic: "Social Search System Design",
    whatToExtract: "Vertical sharding by entity type (people, pages, groups). The 'hit list' concept for storing social graph edges in the search index. How social context (mutual friends) affects ranking.",
    keyInsight: "Social search is different from web search — the social graph is a first-class ranking signal. The search index must store graph edges, not just text.",
  },
  {
    title: "Cassandra: A Decentralized Structured Storage System",
    url: "https://research.facebook.com/publications/cassandra-a-decentralized-structured-storage-system/",
    year: 2008,
    tags: ["Distributed Storage", "NoSQL", "Consistency"],
    relevanceScore: 1,
    systemDesignTopic: "Distributed NoSQL Design",
    whatToExtract: "Consistent hashing for data distribution. Gossip protocol for cluster membership. Tunable consistency (ONE, QUORUM, ALL). The log-structured merge tree (LSM) for write optimization.",
    keyInsight: "Cassandra's design choices (eventual consistency, no single point of failure, tunable consistency) are directly motivated by the CAP theorem trade-offs.",
  },
];

const ALL_TAGS = Array.from(new Set(POSTS.flatMap(p => p.tags))).sort();

const RELEVANCE_LABELS: Record<number, string> = {
  3: "Must-Read",
  2: "High Value",
  1: "Good to Know",
};

const RELEVANCE_COLORS: Record<number, string> = {
  3: "bg-red-100 text-red-800 border-red-300",
  2: "bg-amber-100 text-amber-800 border-amber-300",
  1: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function SDMetaBlogReader() {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [minRelevance, setMinRelevance] = useState<number>(1);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const filtered = POSTS.filter(p => {
    const matchesTag = selectedTag === "All" || p.tags.includes(selectedTag);
    const matchesRelevance = p.relevanceScore >= minRelevance;
    return matchesTag && matchesRelevance;
  }).sort((a, b) => b.relevanceScore - a.relevanceScore || b.year - a.year);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <div className="flex items-start gap-3">
          <Rss size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-teal-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Meta Engineering Blog — Interview-Annotated
            </p>
            <p className="text-xs text-teal-700 mt-1 leading-relaxed">
              Every post is annotated with: the system design topic it covers, what to extract from it, and the single key insight that interviewers want to hear.
              Reading the original papers gives you the credibility to say "Meta solved this by..." — which is an L7-level signal.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-gray-600" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Priority:</span>
          {[1, 2, 3].map(r => (
            <button
              key={r}
              onClick={() => setMinRelevance(r)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                r === minRelevance
                  ? RELEVANCE_COLORS[r]
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              {r === 1 ? "All" : r === 2 ? "High+ only" : "Must-Read only"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...ALL_TAGS].map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                tag === selectedTag
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-teal-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-700">{filtered.length} paper{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {filtered.map((post, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${RELEVANCE_COLORS[post.relevanceScore]}`}>
                    <Star size={9} fill={post.relevanceScore === 3 ? "currentColor" : "none"} />
                    {RELEVANCE_LABELS[post.relevanceScore]}
                  </span>
                  <span className="text-[10px] text-gray-600">{post.year}</span>
                  {post.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                <p className="text-xs text-gray-700 mt-0.5">System Design Topic: {post.systemDesignTopic}</p>
              </div>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex-shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                title="Open original paper"
              >
                <ExternalLink size={13} />
              </a>
            </button>

            {expandedIdx === idx && (
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1">What to Extract</p>
                  <p className="text-xs text-gray-800 leading-relaxed">{post.whatToExtract}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-100 p-3">
                  <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide mb-1">Key Insight for the Interview</p>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">{post.keyInsight}</p>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 hover:text-teal-800"
                >
                  <ExternalLink size={11} />
                  Read the original paper
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
