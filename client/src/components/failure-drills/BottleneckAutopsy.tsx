import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Search } from "lucide-react";

const SCENARIOS = [
  {
    id: "s1",
    title: "Write-Heavy Social Graph",
    description:
      "A social network stores user relationships in a single MySQL instance. Users can follow/unfollow, and the system computes mutual friends in real-time. At 1M DAU it works fine. At 50M DAU, write latency spikes to 8 seconds and the DB CPU hits 100%.",
    hint: "Think about: single points of failure, read vs write patterns, query complexity",
  },
  {
    id: "s2",
    title: "Synchronous Fan-Out Notification",
    description:
      "When a celebrity with 10M followers posts, the system synchronously writes a notification row for each follower before returning success to the poster. At 1K followers it's fine. At 10M followers, the post API times out after 30 seconds.",
    hint: "Think about: synchronous vs async, fan-out patterns, queue vs direct write",
  },
  {
    id: "s3",
    title: "Global Search Without Cache",
    description:
      "A search service runs a full-text SQL LIKE query across 500M product records on every keystroke. Each query takes 2-3 seconds. At 10K concurrent users, the DB connection pool exhausts and new requests queue indefinitely.",
    hint: "Think about: caching, search indexes, connection pooling, async patterns",
  },
  {
    id: "s4",
    title: "Hot Partition in Messaging",
    description:
      "A chat system partitions messages by conversation_id in Kafka. One viral group chat with 100K active members generates 50K messages/minute, all routed to the same Kafka partition. Consumer lag grows to 10 minutes.",
    hint: "Think about: partition key selection, hot spots, consumer group scaling",
  },
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function BottleneckAutopsy({ onComplete }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [scenario] = useState(
    () => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
  );
  const [bottlenecks, setBottlenecks] = useState("");
  const [mitigations, setMitigations] = useState("");

  const scoreMutation = trpc.failureDrills.scoreBottleneckAutopsy.useMutation();

  const handleSubmit = () => {
    const bList = bottlenecks
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    const mList = mitigations
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    scoreMutation.mutate(
      {
        scenario: scenario.description,
        bottlenecks: bList,
        mitigations: mList,
        elapsedSeconds: 120,
      },
      {
        onSuccess: data => {
          setPhase("result");
          onComplete?.(data.score);
        },
      }
    );
  };

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search size={16} className="text-red-400" />
            <span className="font-semibold text-red-400 text-sm">
              Bottleneck Autopsy
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll be shown a broken system scenario. Identify the bottlenecks
            and propose mitigations. No timer — focus on depth and accuracy.
          </p>
        </div>
        <Button
          onClick={() => setPhase("active")}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          Start Autopsy
        </Button>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wide">
              {scenario.title}
            </p>
            <Badge
              variant="outline"
              className="text-xs text-red-400 border-red-500/30"
            >
              Scenario
            </Badge>
          </div>
          <p className="text-sm text-foreground">{scenario.description}</p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            {scenario.hint}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Bottlenecks (one per line)
            </label>
            <Textarea
              value={bottlenecks}
              onChange={e => setBottlenecks(e.target.value)}
              placeholder={
                "Single MySQL node — no read replicas\nSynchronous writes block the response\n..."
              }
              rows={4}
              className="text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Mitigations (one per line)
            </label>
            <Textarea
              value={mitigations}
              onChange={e => setMitigations(e.target.value)}
              placeholder={
                "Add read replicas for read-heavy queries\nMove to async queue for fan-out writes\n..."
              }
              rows={4}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!bottlenecks.trim() || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Analyzing..." : "Submit Autopsy"}
        </Button>
      </div>
    );
  }

  const result = scoreMutation.data;
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="font-semibold">Autopsy Score</span>
        </div>
        <span
          className={`text-3xl font-bold ${result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"}`}
        >
          {result.score}
        </span>
      </div>
      <Progress value={result.score} className="h-3" />
      <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
        {result.feedback}
      </div>
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Strong identifications
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.strengths.map((s: string, i: number) => (
              <Badge
                key={i}
                className="bg-emerald-500/20 text-emerald-300 text-xs border-0"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {result.missed.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Missed
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missed.map((m: string, i: number) => (
              <Badge
                key={i}
                className="bg-amber-500/20 text-amber-300 text-xs border-0"
              >
                {m}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={() => {
          setPhase("intro");
          setBottlenecks("");
          setMitigations("");
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
