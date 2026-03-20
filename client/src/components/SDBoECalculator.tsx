// SDBoECalculator — Back-of-Envelope Calculator with Architectural Decision Mapping
// Candidates enter scale parameters; the tool derives QPS, storage, bandwidth, and
// maps each result to concrete architectural implications with Meta-specific context.
import { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronRight, Zap, Database, Globe, Server, AlertTriangle, CheckCircle, BookmarkPlus, Trash2, ClipboardList } from "lucide-react";

const BOE_NOTES_KEY = "sd_boe_notes_v1";

interface BoENote {
  id: string;
  date: number;
  label: string;
  inputs: ScaleInputs;
  derived: Derived;
  implications: { metric: string; value: string; level: string; implication: string }[];
}

function loadBoENotes(): BoENote[] {
  try { return JSON.parse(localStorage.getItem(BOE_NOTES_KEY) || "[]"); } catch { return []; }
}

function saveBoENotes(notes: BoENote[]) {
  localStorage.setItem(BOE_NOTES_KEY, JSON.stringify(notes.slice(-20)));
}

interface ScaleInputs {
  dau: number;           // Daily Active Users (millions)
  postsPerUserPerDay: number;
  readsPerUserPerDay: number;
  avgPostSizeKB: number;
  mediaAttachmentPct: number; // % of posts with media
  avgMediaSizeMB: number;
  retentionYears: number;
  replicationFactor: number;
}

interface Derived {
  writeQPS: number;
  readQPS: number;
  peakWriteQPS: number;
  peakReadQPS: number;
  dailyStorageGB: number;
  yearlyStorageTB: number;
  totalStorageTB: number;
  dailyBandwidthGbps: number;
  peakBandwidthGbps: number;
  rawStorageTB: number;
}

interface ArchImplication {
  metric: string;
  value: string;
  threshold: string;
  level: "green" | "amber" | "red";
  implication: string;
  metaApproach: string;
  interviewSignal: string;
}

const PRESETS: { label: string; inputs: ScaleInputs }[] = [
  {
    label: "News Feed (500M DAU)",
    inputs: { dau: 500, postsPerUserPerDay: 0.2, readsPerUserPerDay: 50, avgPostSizeKB: 2, mediaAttachmentPct: 30, avgMediaSizeMB: 2, retentionYears: 5, replicationFactor: 3 },
  },
  {
    label: "Messenger (1B DAU)",
    inputs: { dau: 1000, postsPerUserPerDay: 20, readsPerUserPerDay: 100, avgPostSizeKB: 0.5, mediaAttachmentPct: 10, avgMediaSizeMB: 1, retentionYears: 3, replicationFactor: 3 },
  },
  {
    label: "Instagram (2B DAU)",
    inputs: { dau: 2000, postsPerUserPerDay: 0.1, readsPerUserPerDay: 200, avgPostSizeKB: 1, mediaAttachmentPct: 90, avgMediaSizeMB: 3, retentionYears: 10, replicationFactor: 3 },
  },
  {
    label: "URL Shortener (100M DAU)",
    inputs: { dau: 100, postsPerUserPerDay: 0.01, readsPerUserPerDay: 5, avgPostSizeKB: 0.1, mediaAttachmentPct: 0, avgMediaSizeMB: 0, retentionYears: 5, replicationFactor: 3 },
  },
  {
    label: "Notifications (2B DAU)",
    inputs: { dau: 2000, postsPerUserPerDay: 5, readsPerUserPerDay: 10, avgPostSizeKB: 0.2, mediaAttachmentPct: 0, avgMediaSizeMB: 0, retentionYears: 1, replicationFactor: 3 },
  },
];

function derive(inputs: ScaleInputs): Derived {
  const dauAbs = inputs.dau * 1_000_000;
  const secondsPerDay = 86_400;
  const peakFactor = 3; // peak is ~3× average

  const writeQPS = (dauAbs * inputs.postsPerUserPerDay) / secondsPerDay;
  const readQPS = (dauAbs * inputs.readsPerUserPerDay) / secondsPerDay;
  const peakWriteQPS = writeQPS * peakFactor;
  const peakReadQPS = readQPS * peakFactor;

  const textBytesPerDay = dauAbs * inputs.postsPerUserPerDay * inputs.avgPostSizeKB * 1024;
  const mediaBytesPerDay = dauAbs * inputs.postsPerUserPerDay * (inputs.mediaAttachmentPct / 100) * inputs.avgMediaSizeMB * 1024 * 1024;
  const dailyStorageBytes = textBytesPerDay + mediaBytesPerDay;
  const dailyStorageGB = dailyStorageBytes / (1024 ** 3);
  const yearlyStorageTB = (dailyStorageGB * 365) / 1024;
  const rawStorageTB = yearlyStorageTB * inputs.retentionYears;
  const totalStorageTB = rawStorageTB * inputs.replicationFactor;

  const readBytesPerDay = dauAbs * inputs.readsPerUserPerDay * inputs.avgPostSizeKB * 1024;
  const dailyBandwidthGbps = (readBytesPerDay * 8) / secondsPerDay / 1e9;
  const peakBandwidthGbps = dailyBandwidthGbps * peakFactor;

  return { writeQPS, readQPS, peakWriteQPS, peakReadQPS, dailyStorageGB, yearlyStorageTB, totalStorageTB, dailyBandwidthGbps, peakBandwidthGbps, rawStorageTB };
}

function getImplications(d: Derived, inputs: ScaleInputs): ArchImplication[] {
  const implications: ArchImplication[] = [];

  // Write QPS
  const wLevel: ArchImplication["level"] = d.peakWriteQPS < 1000 ? "green" : d.peakWriteQPS < 50_000 ? "amber" : "red";
  implications.push({
    metric: "Peak Write QPS",
    value: d.peakWriteQPS >= 1000 ? `${(d.peakWriteQPS / 1000).toFixed(1)}K/s` : `${d.peakWriteQPS.toFixed(0)}/s`,
    threshold: d.peakWriteQPS < 1000 ? "< 1K (single DB)" : d.peakWriteQPS < 50_000 ? "1K–50K (sharding needed)" : "> 50K (write fan-out critical)",
    level: wLevel,
    implication: d.peakWriteQPS < 1000
      ? "A single primary MySQL/PostgreSQL instance handles this comfortably."
      : d.peakWriteQPS < 50_000
      ? "Horizontal write sharding required. Consider consistent hashing or range-based sharding."
      : "Write fan-out is the critical bottleneck. Fan-out on write to pre-computed feeds; use async queues (Kafka) to absorb bursts.",
    metaApproach: d.peakWriteQPS < 1000
      ? "Single MySQL primary with read replicas."
      : d.peakWriteQPS < 50_000
      ? "MySQL sharded by user_id. TAO for social graph writes."
      : "Kafka-backed async fan-out. Celebrity accounts use fan-out on read (hybrid). Wormhole for CDC.",
    interviewSignal: "Mention the peak multiplier (3×) and justify your sharding key choice.",
  });

  // Read QPS
  const rLevel: ArchImplication["level"] = d.peakReadQPS < 10_000 ? "green" : d.peakReadQPS < 500_000 ? "amber" : "red";
  implications.push({
    metric: "Peak Read QPS",
    value: d.peakReadQPS >= 1_000_000 ? `${(d.peakReadQPS / 1_000_000).toFixed(1)}M/s` : d.peakReadQPS >= 1000 ? `${(d.peakReadQPS / 1000).toFixed(0)}K/s` : `${d.peakReadQPS.toFixed(0)}/s`,
    threshold: d.peakReadQPS < 10_000 ? "< 10K (DB can handle)" : d.peakReadQPS < 500_000 ? "10K–500K (cache layer needed)" : "> 500K (multi-tier cache)",
    level: rLevel,
    implication: d.peakReadQPS < 10_000
      ? "Read replicas are sufficient. No dedicated cache layer required."
      : d.peakReadQPS < 500_000
      ? "A Redis/Memcached cache layer is required. Cache hit rate must be ≥95% to protect the DB."
      : "Multi-tier caching: L1 in-process cache + L2 Redis cluster + L3 CDN for static content. Cache hit rate must be ≥99%.",
    metaApproach: d.peakReadQPS < 10_000
      ? "MySQL read replicas with connection pooling."
      : d.peakReadQPS < 500_000
      ? "Memcached cluster (Meta's Scaling Memcache paper). Lease-based invalidation to prevent thundering herd."
      : "Memcached + regional pools + CDN. TAO for social graph reads. Scuba for real-time analytics reads.",
    interviewSignal: "Cite the read/write ratio (here: " + Math.round(d.readQPS / Math.max(d.writeQPS, 1)) + ":1). Justify cache eviction policy (LRU vs. LFU).",
  });

  // Storage
  const sLevel: ArchImplication["level"] = d.totalStorageTB < 10 ? "green" : d.totalStorageTB < 1000 ? "amber" : "red";
  implications.push({
    metric: "Total Storage (with replication)",
    value: d.totalStorageTB >= 1000 ? `${(d.totalStorageTB / 1000).toFixed(1)} PB` : `${d.totalStorageTB.toFixed(1)} TB`,
    threshold: d.totalStorageTB < 10 ? "< 10 TB (single cluster)" : d.totalStorageTB < 1000 ? "10 TB–1 PB (distributed storage)" : "> 1 PB (tiered storage)",
    level: sLevel,
    implication: d.totalStorageTB < 10
      ? "A single storage cluster with replication handles this. Standard object store (S3-compatible) is sufficient."
      : d.totalStorageTB < 1000
      ? "Distributed object storage required. Separate hot (recent) from warm (older) data. Consider erasure coding for warm tier."
      : "Tiered storage is mandatory: hot (SSD, 3× replication) → warm (HDD, erasure coding) → cold (tape/glacier). F4-style architecture.",
    metaApproach: d.totalStorageTB < 10
      ? "S3-compatible object store with 3× replication."
      : d.totalStorageTB < 1000
      ? "Haystack for small objects (photos). TAO for graph data. Separate hot/warm tiers."
      : "Haystack (hot) + F4 (warm, erasure coding reduces overhead from 3.6× to 2.1×). Cold tier for archival.",
    interviewSignal: "Show the raw vs replicated math. Mention erasure coding as a cost optimization at PB scale.",
  });

  // Bandwidth
  const bLevel: ArchImplication["level"] = d.peakBandwidthGbps < 10 ? "green" : d.peakBandwidthGbps < 100 ? "amber" : "red";
  implications.push({
    metric: "Peak Egress Bandwidth",
    value: `${d.peakBandwidthGbps.toFixed(1)} Gbps`,
    threshold: d.peakBandwidthGbps < 10 ? "< 10 Gbps (single DC)" : d.peakBandwidthGbps < 100 ? "10–100 Gbps (CDN required)" : "> 100 Gbps (global CDN + PoPs)",
    level: bLevel,
    implication: d.peakBandwidthGbps < 10
      ? "A single data center with standard 10 Gbps uplinks handles this. No CDN strictly required."
      : d.peakBandwidthGbps < 100
      ? "CDN is required to offload bandwidth. Static assets (images, videos) must be served from CDN edge nodes."
      : "Global CDN with 50+ PoPs required. Video content must use adaptive bitrate streaming (HLS/DASH). Live streaming needs ingest PoPs.",
    metaApproach: d.peakBandwidthGbps < 10
      ? "Single region with CDN for static assets."
      : d.peakBandwidthGbps < 100
      ? "Meta CDN with regional PoPs. Images served from Haystack via CDN."
      : "Meta's global CDN. Facebook Live uses RTMP ingest → HLS output pipeline with regional distribution trees.",
    interviewSignal: "Distinguish read bandwidth (egress) from write bandwidth (ingest). Justify CDN placement strategy.",
  });

  // Fan-out decision
  if (inputs.postsPerUserPerDay > 0 && inputs.readsPerUserPerDay > 0) {
    const fanOutRatio = inputs.readsPerUserPerDay / inputs.postsPerUserPerDay;
    const fLevel: ArchImplication["level"] = fanOutRatio < 10 ? "green" : fanOutRatio < 100 ? "amber" : "red";
    implications.push({
      metric: "Read/Write Ratio (Fan-out Signal)",
      value: `${Math.round(fanOutRatio)}:1`,
      threshold: fanOutRatio < 10 ? "< 10:1 (write-heavy)" : fanOutRatio < 100 ? "10–100:1 (balanced)" : "> 100:1 (read-heavy → fan-out on write)",
      level: fLevel,
      implication: fanOutRatio < 10
        ? "Write-heavy system. Fan-out on read is preferred — don't pre-compute feeds. Pull on demand."
        : fanOutRatio < 100
        ? "Balanced. Consider hybrid: fan-out on write for regular users, fan-out on read for high-follower accounts."
        : "Strongly read-heavy. Fan-out on write is preferred — pre-compute and cache feeds. Write amplification is acceptable given the read savings.",
      metaApproach: fanOutRatio < 10
        ? "Pull-based feed generation. No pre-computation."
        : fanOutRatio < 100
        ? "Hybrid: fan-out on write for users with <10K followers, fan-out on read for celebrities."
        : "Fan-out on write to Redis sorted sets. Celebrity accounts (>10K followers) use lazy fan-out + pull hybrid to avoid write amplification.",
      interviewSignal: "This ratio is the single most important number for the fan-out decision. State it explicitly before choosing your strategy.",
    });
  }

  return implications;
}

function fmt(n: number, decimals = 1): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

const LEVEL_COLORS = {
  green: { border: "border-emerald-200", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800", icon: "text-emerald-600" },
  amber: { border: "border-amber-200", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-800", icon: "text-amber-600" },
  red: { border: "border-red-200", bg: "bg-red-50", badge: "bg-red-100 text-red-800", icon: "text-red-600" },
};

export default function SDBoECalculator() {
  const [inputs, setInputs] = useState<ScaleInputs>(PRESETS[0].inputs);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [activePreset, setActivePreset] = useState(0);
  const [notes, setNotes] = useState<BoENote[]>(() => loadBoENotes());
  const [showNotes, setShowNotes] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const derived = useMemo(() => derive(inputs), [inputs]);
  const implications = useMemo(() => getImplications(derived, inputs), [derived, inputs]);

  function applyPreset(idx: number) {
    setActivePreset(idx);
    setInputs(PRESETS[idx].inputs);
    setExpandedIdx(0);
  }

  function update(key: keyof ScaleInputs, value: number) {
    setActivePreset(-1);
    setInputs(prev => ({ ...prev, [key]: value }));
  }

  function saveToNotes() {
    const preset = PRESETS[activePreset];
    const note: BoENote = {
      id: Date.now().toString(),
      date: Date.now(),
      label: preset ? preset.label : `Custom (${inputs.dau}M DAU)`,
      inputs: { ...inputs },
      derived: { ...derived },
      implications: implications.map(i => ({ metric: i.metric, value: i.value, level: i.level, implication: i.implication })),
    };
    setNotes(prev => {
      const updated = [...prev, note];
      saveBoENotes(updated);
      return updated;
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function deleteNote(id: string) {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveBoENotes(updated);
      return updated;
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Calculator size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-blue-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Back-of-Envelope Calculator with Decision Mapping
            </p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Enter scale parameters → the calculator derives QPS, storage, and bandwidth, then maps each number to a concrete architectural decision with Meta-specific context. <strong>The goal is not precision — it is to justify your architecture choices with numbers.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Quick Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(i)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                activePreset === i
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scale Parameters</p>
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            {[
              { key: "dau" as const, label: "Daily Active Users (M)", min: 0.1, max: 5000, step: 10, unit: "M" },
              { key: "postsPerUserPerDay" as const, label: "Writes per User per Day", min: 0.001, max: 100, step: 0.1, unit: "" },
              { key: "readsPerUserPerDay" as const, label: "Reads per User per Day", min: 1, max: 1000, step: 10, unit: "" },
              { key: "avgPostSizeKB" as const, label: "Avg Text Size (KB)", min: 0.1, max: 100, step: 0.1, unit: "KB" },
              { key: "mediaAttachmentPct" as const, label: "Posts with Media (%)", min: 0, max: 100, step: 5, unit: "%" },
              { key: "avgMediaSizeMB" as const, label: "Avg Media Size (MB)", min: 0, max: 100, step: 0.5, unit: "MB" },
              { key: "retentionYears" as const, label: "Data Retention (years)", min: 1, max: 20, step: 1, unit: "yr" },
              { key: "replicationFactor" as const, label: "Replication Factor", min: 1, max: 5, step: 1, unit: "×" },
            ].map(({ key, label, min, max, step, unit }) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-xs text-gray-600 flex-1 min-w-0">{label}</label>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={inputs[key]}
                    onChange={e => update(key, parseFloat(e.target.value) || 0)}
                    className="w-20 text-xs text-right border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {unit && <span className="text-[10px] text-gray-400 w-6">{unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derived Metrics */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Derived Metrics</p>
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2.5">
            {[
              { icon: <Zap size={13} className="text-amber-500" />, label: "Avg Write QPS", value: `${fmt(derived.writeQPS)}/s` },
              { icon: <Zap size={13} className="text-amber-500" />, label: "Peak Write QPS (3×)", value: `${fmt(derived.peakWriteQPS)}/s`, highlight: true },
              { icon: <Globe size={13} className="text-blue-500" />, label: "Avg Read QPS", value: `${fmt(derived.readQPS)}/s` },
              { icon: <Globe size={13} className="text-blue-500" />, label: "Peak Read QPS (3×)", value: `${fmt(derived.peakReadQPS)}/s`, highlight: true },
              { icon: <Database size={13} className="text-purple-500" />, label: "Daily New Storage", value: `${derived.dailyStorageGB.toFixed(1)} GB/day` },
              { icon: <Database size={13} className="text-purple-500" />, label: "Yearly Storage (raw)", value: `${derived.yearlyStorageTB.toFixed(1)} TB/yr` },
              { icon: <Database size={13} className="text-purple-500" />, label: "Total Storage (replicated)", value: derived.totalStorageTB >= 1000 ? `${(derived.totalStorageTB / 1000).toFixed(2)} PB` : `${derived.totalStorageTB.toFixed(1)} TB`, highlight: true },
              { icon: <Server size={13} className="text-green-500" />, label: "Avg Egress Bandwidth", value: `${derived.dailyBandwidthGbps.toFixed(2)} Gbps` },
              { icon: <Server size={13} className="text-green-500" />, label: "Peak Egress Bandwidth (3×)", value: `${derived.peakBandwidthGbps.toFixed(2)} Gbps`, highlight: true },
              { icon: <Calculator size={13} className="text-gray-500" />, label: "Read/Write Ratio", value: `${Math.round(derived.readQPS / Math.max(derived.writeQPS, 0.001))}:1` },
            ].map(({ icon, label, value, highlight }) => (
              <div key={label} className={`flex items-center justify-between gap-2 ${highlight ? "py-1 px-2 rounded-lg bg-gray-50 border border-gray-100" : ""}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  {icon}
                  <span className="text-xs text-gray-600 truncate">{label}</span>
                </div>
                <span className={`text-xs font-bold flex-shrink-0 ${highlight ? "text-gray-900" : "text-gray-700"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save to Notes button */}
      <div className="flex items-center gap-2">
        <button
          onClick={saveToNotes}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            savedFlash
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <BookmarkPlus size={11} />
          {savedFlash ? "Saved!" : "Save to Notes"}
        </button>
        {notes.length > 0 && (
          <button
            onClick={() => setShowNotes(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:border-gray-400 transition-all"
          >
            <ClipboardList size={11} />
            {showNotes ? "Hide" : "Show"} Notes ({notes.length})
          </button>
        )}
      </div>

      {/* Notes Log */}
      {showNotes && notes.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Saved BoE Calculations ({notes.length})</p>
          </div>
          <div className="divide-y divide-gray-100">
            {[...notes].reverse().map(note => (
              <details key={note.id} className="group">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{note.label}</p>
                    <p className="text-[10px] text-gray-400">{new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500">{note.inputs.dau}M DAU</span>
                    <span className="text-[10px] text-gray-400">Pk Write: {fmt(note.derived.peakWriteQPS)}/s</span>
                    <span className="text-[10px] text-gray-400">Storage: {note.derived.totalStorageTB >= 1000 ? `${(note.derived.totalStorageTB/1000).toFixed(1)}PB` : `${note.derived.totalStorageTB.toFixed(0)}TB`}</span>
                    <button
                      onClick={e => { e.preventDefault(); deleteNote(note.id); }}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </summary>
                <div className="px-4 pb-3 pt-1 space-y-1.5">
                  {note.implications.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                        imp.level === "green" ? "bg-emerald-100 text-emerald-700" :
                        imp.level === "amber" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>{imp.value}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-700">{imp.metric}</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">{imp.implication}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Architectural Implications */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Architectural Decision Mapping</p>
        <p className="text-xs text-gray-500">Each metric maps to a concrete architecture decision. Expand to see Meta's approach and the interview signal.</p>
        {implications.map((imp, idx) => {
          const colors = LEVEL_COLORS[imp.level];
          const isExpanded = expandedIdx === idx;
          return (
            <div key={idx} className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                <div className="flex-shrink-0">
                  {imp.level === "green" ? <CheckCircle size={14} className={colors.icon} /> : <AlertTriangle size={14} className={colors.icon} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900">{imp.metric}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{imp.value}</span>
                    <span className="text-[10px] text-gray-500">{imp.threshold}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-gray-400">
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200/60 p-4 space-y-3 bg-white/60">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Architectural Implication</p>
                    <p className="text-xs text-gray-800 leading-relaxed">{imp.implication}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Meta's Approach</p>
                    <p className="text-xs text-blue-900 leading-relaxed">{imp.metaApproach}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Interview Signal</p>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">{imp.interviewSignal}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
