// SDMathTrainer — Back-of-Envelope Math Trainer
// Candidates compute QPS, storage, and bandwidth for Meta-scale scenarios.
// LLM checks arithmetic and flags order-of-magnitude errors.
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Calculator, ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, RefreshCw, BookOpen, Zap } from "lucide-react";

interface Scenario {
  id: string;
  title: string;
  context: string;
  hints: { qps: string; storage: string; bandwidth: string };
  referenceValues: { qps: string; storage: string; bandwidth: string };
  keyFormulas: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "news-feed",
    title: "Facebook News Feed",
    context: "500M DAU. Each user views their feed 5 times/day (read-heavy). Each feed load fetches 20 posts. Each post is ~1KB text + metadata. Users create 100M posts/day. Assume 3× replication and 10% peak multiplier.",
    hints: {
      qps: "Read QPS = DAU × feed_views_per_day / 86400. Write QPS = posts_per_day / 86400.",
      storage: "Storage/year = posts_per_day × post_size × 365 × replication_factor.",
      bandwidth: "Ingress = write QPS × post_size. Egress = read QPS × posts_per_fetch × post_size.",
    },
    referenceValues: {
      qps: "Read: ~58K QPS (avg), ~580K QPS (peak). Write: ~1.2K QPS.",
      storage: "~110 TB/year (raw), ~330 TB/year with 3× replication.",
      bandwidth: "Ingress: ~1.2 MB/s. Egress: ~1.1 GB/s.",
    },
    keyFormulas: [
      "QPS = DAU × actions_per_day / 86,400",
      "Storage/year = events/day × size_per_event × 365 × replication",
      "Bandwidth = QPS × payload_size",
    ],
  },
  {
    id: "messenger",
    title: "Facebook Messenger",
    context: "1B DAU. Each user sends 40 messages/day. Average message size: 100 bytes. 10% of messages include a media attachment averaging 500KB. Assume 3× replication. Peak traffic is 3× average.",
    hints: {
      qps: "Message QPS = DAU × messages_per_day / 86400. Media upload QPS = message QPS × 0.10.",
      storage: "Text storage = messages/day × 100B × 365 × 3. Media storage = media_messages/day × 500KB × 365 × 3.",
      bandwidth: "Ingress = text QPS × 100B + media QPS × 500KB. Egress ≈ 2× ingress (sender + recipient).",
    },
    referenceValues: {
      qps: "Text: ~463K QPS (avg), ~1.4M QPS (peak). Media: ~46K QPS.",
      storage: "Text: ~10 TB/year. Media: ~55 PB/year.",
      bandwidth: "Ingress: ~23 GB/s. Egress: ~46 GB/s.",
    },
    keyFormulas: [
      "Messages/day = DAU × msgs_per_user",
      "Media storage dominates: even 10% media × 500KB >> 90% text × 100B",
      "Always separate text vs media QPS and storage",
    ],
  },
  {
    id: "instagram-photos",
    title: "Instagram Photo Upload",
    context: "500M DAU. 100M photos uploaded/day. Average photo size: 3MB (original), compressed to 300KB for storage. Each photo is served to an average of 200 viewers. CDN serves 90% of reads. Assume 3× replication.",
    hints: {
      qps: "Upload QPS = 100M / 86400. Read QPS = upload QPS × 200 viewers per photo.",
      storage: "Storage/year = uploads/day × compressed_size × 365 × replication.",
      bandwidth: "Upload bandwidth = upload QPS × 3MB. Read bandwidth = read QPS × 300KB × (1 - CDN_hit_rate) for origin.",
    },
    referenceValues: {
      qps: "Upload: ~1.2K QPS. Read: ~231K QPS (origin after CDN). Total read: ~2.3M QPS.",
      storage: "~98 PB/year (compressed, with replication).",
      bandwidth: "Upload ingress: ~3.5 GB/s. Origin egress: ~69 GB/s.",
    },
    keyFormulas: [
      "CDN offloads read bandwidth: origin_egress = total_egress × (1 - hit_rate)",
      "Store compressed size, not original: 3MB → 300KB = 10× savings",
      "Read amplification = uploads × avg_viewers",
    ],
  },
  {
    id: "url-shortener",
    title: "URL Shortener (bit.ly scale)",
    context: "100M DAU. 1M new URLs created/day. 100:1 read-to-write ratio. Each URL record: 500 bytes. URLs expire after 5 years. Cache hit rate: 80%. Peak traffic: 5× average.",
    hints: {
      qps: "Write QPS = 1M / 86400. Read QPS = write QPS × 100.",
      storage: "Total URLs over 5 years = 1M/day × 365 × 5. Storage = total_urls × 500B.",
      bandwidth: "Read bandwidth = read QPS × 500B. Cache reduces DB read bandwidth by 80%.",
    },
    referenceValues: {
      qps: "Write: ~12 QPS. Read: ~1.2K QPS (avg), ~6K QPS (peak).",
      storage: "~912 GB over 5 years (~1 TB with overhead).",
      bandwidth: "Read: ~600 KB/s total, ~120 KB/s to DB (after cache).",
    },
    keyFormulas: [
      "Read QPS = write QPS × read_write_ratio",
      "5-year storage = daily_writes × 365 × 5 × record_size",
      "Effective DB load = QPS × (1 - cache_hit_rate)",
    ],
  },
  {
    id: "video-streaming",
    title: "Video Streaming (YouTube/Reels scale)",
    context: "2B DAU. 500 hours of video uploaded/minute. Average video: 10 min, 720p = 1GB raw, transcoded to 3 quality levels averaging 200MB total. Each video watched by avg 1000 users. CDN hit rate: 95%.",
    hints: {
      qps: "Upload QPS = 500 hours/min × 60min/hr / 60s = 500 videos/sec. Watch QPS = upload QPS × 1000 viewers.",
      storage: "Storage/day = uploads/day × 200MB × 3 quality levels. Replicate 3×.",
      bandwidth: "Upload ingress = 500 videos/sec × 1GB. Watch egress = watch QPS × avg_bitrate (assume 5 Mbps).",
    },
    referenceValues: {
      qps: "Upload: 500 videos/sec. Watch: 500K concurrent streams.",
      storage: "~26 PB/day raw uploads. ~5 PB/day transcoded (3 levels × 200MB).",
      bandwidth: "Upload ingress: ~500 GB/s. Watch egress: ~312 GB/s (after 95% CDN).",
    },
    keyFormulas: [
      "500 hours/min = 500 × 60 × 60 seconds of video per minute = 1.8M sec/min uploaded",
      "Transcoding reduces storage: 1GB raw → 200MB × 3 levels = 600MB",
      "Streaming bandwidth = concurrent_viewers × avg_bitrate",
    ],
  },
  {
    id: "notification-system",
    title: "Push Notification System",
    context: "1B users. 10B notifications sent/day (mix of push, email, SMS). 70% push, 20% email, 10% SMS. Each notification: 1KB payload. Peak: 5× average (breaking news, sports events). Delivery SLA: push < 1s, email < 5min.",
    hints: {
      qps: "Total notification QPS = 10B / 86400. Push QPS = total × 0.70.",
      storage: "Log storage = notifications/day × 1KB × 30 days retention × 3 replication.",
      bandwidth: "Fanout bandwidth = notification QPS × 1KB. Consider push server connection overhead.",
    },
    referenceValues: {
      qps: "Total: ~116K QPS (avg), ~580K QPS (peak). Push: ~81K QPS.",
      storage: "~870 GB/day logs. ~26 TB/month.",
      bandwidth: "~116 MB/s payload. Push servers maintain ~1B persistent connections.",
    },
    keyFormulas: [
      "Notification QPS = total_daily / 86,400",
      "Peak QPS = avg QPS × peak_multiplier",
      "Connection count ≠ QPS: 1B persistent WebSocket/long-poll connections at any time",
    ],
  },
];

const SCORE_COLORS: Record<number, string> = {
  1: "text-red-700 bg-red-100 border-red-200",
  2: "text-orange-900 bg-orange-100 border-orange-200",
  3: "text-amber-900 bg-amber-100 border-amber-200",
  4: "text-emerald-700 bg-emerald-50 border-emerald-200",
  5: "text-green-700 bg-green-50 border-green-200",
};

function ScorePill({ score }: { score: number }) {
  const label = score >= 5 ? "Excellent" : score >= 4 ? "Good" : score >= 3 ? "Acceptable" : score >= 2 ? "Off" : "Wrong OOM";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${SCORE_COLORS[score] ?? SCORE_COLORS[3]}`}>
      {score}/5 · {label}
    </span>
  );
}

function DimensionResult({
  label, score, feedback, modelAnswer,
}: { label: string; score: number; feedback: string; modelAnswer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border p-3 ${score >= 3 ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-100/40"}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-bold text-gray-800">{label}</span>
        <ScorePill score={score} />
      </div>
      <p className="text-xs text-gray-700 leading-relaxed">{feedback}</p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        Model answer
      </button>
      {open && (
        <div className="mt-1.5 font-mono text-[11px] bg-gray-950 text-green-300 px-3 py-2 rounded-lg leading-relaxed whitespace-pre-wrap">
          {modelAnswer}
        </div>
      )}
    </div>
  );
}

const MATH_STORAGE_KEY = "sd_math_trainer_best_scores";

export default function SDMathTrainer() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [qps, setQps] = useState("");
  const [storage, setStorage] = useState("");
  const [bandwidth, setBandwidth] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [result, setResult] = useState<null | {
    qpsScore: number; qpsFeedback: string; qpsModelAnswer: string;
    storageScore: number; storageFeedback: string; storageModelAnswer: string;
    bandwidthScore: number; bandwidthFeedback: string; bandwidthModelAnswer: string;
    overallFeedback: string; passesBar: boolean; keyFormula: string;
  }>(null);
  // localStorage: best avg score per scenario id
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(MATH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const scenario = SCENARIOS[scenarioIdx];
  const scoreMutation = trpc.mathTrainer.score.useMutation({
    onSuccess: (data) => {
      setResult(data);
      // Persist best score for this scenario
      const avg = Math.round((data.qpsScore + data.storageScore + data.bandwidthScore) / 3 * 10) / 10;
      setBestScores(prev => {
        const existing = prev[scenario.id] ?? 0;
        if (avg > existing) {
          const updated = { ...prev, [scenario.id]: avg };
          try { localStorage.setItem(MATH_STORAGE_KEY, JSON.stringify(updated)); } catch {}
          return updated;
        }
        return prev;
      });
    },
  });

  const handleSubmit = () => {
    if (!qps.trim() || !storage.trim() || !bandwidth.trim()) return;
    setResult(null);
    scoreMutation.mutate({
      scenarioTitle: scenario.title,
      scenarioContext: scenario.context,
      qpsAnswer: qps,
      storageAnswer: storage,
      bandwidthAnswer: bandwidth,
    });
  };

  const handleNext = () => {
    setScenarioIdx((i) => (i + 1) % SCENARIOS.length);
    setQps(""); setStorage(""); setBandwidth("");
    setResult(null); setShowHints(false); setShowReference(false);
  };

  const avgScore = result
    ? Math.round((result.qpsScore + result.storageScore + result.bandwidthScore) / 3)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Calculator size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-blue-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Back-of-Envelope Math Trainer
            </p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Interviewers at L6+ expect you to derive QPS, storage, and bandwidth from first principles — not memorize numbers.
              This trainer checks your <strong>order of magnitude</strong> and <strong>reasoning process</strong>, not exact answers.
              Show your formula before your number.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setScenarioIdx(i); setQps(""); setStorage(""); setBandwidth(""); setResult(null); setShowHints(false); setShowReference(false); }}
            className={`flex flex-col items-start text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
              i === scenarioIdx
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            <span>{s.title}</span>
            {bestScores[s.id] !== undefined && (
              <span className={`text-[9px] font-semibold mt-0.5 ${
                i === scenarioIdx ? "text-gray-700" : "text-blue-500"
              }`}>
                Best: {bestScores[s.id]}/5
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Scenario card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {scenario.title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{scenario.context}</p>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
            {scenarioIdx + 1}/{SCENARIOS.length}
          </span>
        </div>

        {/* Key formulas reference */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-1.5">Key Formulas to Apply</p>
          <ul className="space-y-1">
            {scenario.keyFormulas.map((f) => (
              <li key={f} className="font-mono text-[11px] text-indigo-800">{f}</li>
            ))}
          </ul>
        </div>

        {/* Input fields */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1">
              QPS (Queries Per Second) — show your formula
            </label>
            <textarea
              value={qps}
              onChange={(e) => setQps(e.target.value)}
              placeholder="e.g. Read QPS = 500M DAU × 5 views/day / 86,400 = ~29K QPS. Peak = 29K × 10 = 290K QPS"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1">
              Storage (per year) — include replication
            </label>
            <textarea
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              placeholder="e.g. 100M posts/day × 1KB × 365 × 3 replication = ~110 TB/year"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1">
              Bandwidth (ingress + egress) — separate read/write
            </label>
            <textarea
              value={bandwidth}
              onChange={(e) => setBandwidth(e.target.value)}
              placeholder="e.g. Ingress: 1.2K write QPS × 1KB = 1.2 MB/s. Egress: 29K read QPS × 20 posts × 1KB = 580 MB/s"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono"
            />
          </div>
        </div>

        {/* Hints + Reference toggles */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowHints((h) => !h)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 border border-amber-200 bg-amber-100 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <BookOpen size={11} /> {showHints ? "Hide hints" : "Show hints"}
          </button>
          <button
            onClick={() => setShowReference((r) => !r)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Zap size={11} /> {showReference ? "Hide reference" : "Show reference values"}
          </button>
        </div>

        {showHints && (
          <div className="rounded-xl border border-amber-200 bg-amber-100 p-3 space-y-2">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Hints</p>
            <p className="text-xs text-amber-900"><strong>QPS:</strong> {scenario.hints.qps}</p>
            <p className="text-xs text-amber-900"><strong>Storage:</strong> {scenario.hints.storage}</p>
            <p className="text-xs text-amber-900"><strong>Bandwidth:</strong> {scenario.hints.bandwidth}</p>
          </div>
        )}

        {showReference && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Reference Values (ballpark)</p>
            <p className="text-xs text-gray-700"><strong>QPS:</strong> {scenario.referenceValues.qps}</p>
            <p className="text-xs text-gray-700"><strong>Storage:</strong> {scenario.referenceValues.storage}</p>
            <p className="text-xs text-gray-700"><strong>Bandwidth:</strong> {scenario.referenceValues.bandwidth}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={scoreMutation.isPending || !qps.trim() || !storage.trim() || !bandwidth.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {scoreMutation.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Checking your math…</>
          ) : (
            <><Calculator size={14} /> Check My Estimates</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Overall verdict */}
          <div className={`rounded-2xl border p-4 ${result.passesBar ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-100"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.passesBar
                ? <CheckCircle2 size={16} className="text-emerald-600" />
                : <XCircle size={16} className="text-red-600" />}
              <span className={`text-sm font-extrabold ${result.passesBar ? "text-emerald-800" : "text-red-800"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {result.passesBar ? "Passes the Bar" : "Needs Work"} · Avg {avgScore}/5
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{result.overallFeedback}</p>
            <div className="mt-2.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-0.5">Key Formula to Memorize</p>
              <p className="font-mono text-xs text-indigo-900">{result.keyFormula}</p>
            </div>
          </div>

          {/* Per-dimension breakdown */}
          <div className="space-y-3">
            <DimensionResult label="QPS Estimation" score={result.qpsScore} feedback={result.qpsFeedback} modelAnswer={result.qpsModelAnswer} />
            <DimensionResult label="Storage Estimation" score={result.storageScore} feedback={result.storageFeedback} modelAnswer={result.storageModelAnswer} />
            <DimensionResult label="Bandwidth Estimation" score={result.bandwidthScore} feedback={result.bandwidthFeedback} modelAnswer={result.bandwidthModelAnswer} />
          </div>

          {/* Next scenario */}
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 text-sm font-bold hover:border-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} /> Next Scenario
          </button>
        </div>
      )}
    </div>
  );
}
