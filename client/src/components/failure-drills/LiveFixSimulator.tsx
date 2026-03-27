import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Wrench } from "lucide-react";

const TRANSCRIPTS = [
  {
    id: "t1",
    title: "Feed Ranking System Interview",
    transcript: `Interviewer: Design a feed ranking system for 500M DAU.

Candidate: Sure! I'll design a feed ranking system. I'll use a database to store posts and a ranking algorithm. The system will fetch posts from the database and rank them using machine learning. We can use MySQL for storage and Python for the ranking service. The team worked together to improve the feed quality significantly. We also added some caching to make it faster.

Interviewer: What are your NFRs?

Candidate: Oh, I didn't think about those specifically. I assumed the system just needs to be fast and reliable.

Interviewer: Walk me through your data model.

Candidate: I'd use a posts table with user_id, content, timestamp, and a score column. I'll join it with a users table to get follower data. The query would be SELECT * FROM posts JOIN followers WHERE followers.user_id = ? ORDER BY score DESC LIMIT 100.`,
    failures: [
      {
        type: "system-design",
        signal: "Skipping NFRs",
        location:
          "Opening response — no latency, throughput, or consistency requirements stated",
      },
      {
        type: "system-design",
        signal: "Missing bottleneck",
        location:
          "SQL JOIN across posts/followers at 500M DAU — will not scale",
      },
      {
        type: "behavioral",
        signal: "Vague ownership",
        location:
          "'The team worked together to improve feed quality significantly' — no metrics, no individual ownership",
      },
    ],
  },
  {
    id: "t2",
    title: "Distributed Cache Interview",
    transcript: `Interviewer: Design a distributed key-value cache for a social network.

Candidate: I'll design a Redis cluster. We'll have multiple Redis nodes and a load balancer in front. The application servers will connect to the load balancer which routes to the right Redis node. This should handle our traffic fine. I helped the team deploy a similar system at my last job and it worked well.

Interviewer: How do you handle cache invalidation?

Candidate: We'll set TTLs on all keys. If data changes, the TTL will expire and it'll be refreshed. This should work for most cases.

Interviewer: What happens when a node fails?

Candidate: The load balancer will detect the failure and route to another node. We might lose some cached data but that's okay since it's just a cache.`,
    failures: [
      {
        type: "system-design",
        signal: "Shallow trade-offs",
        location:
          "Load balancer routing — doesn't address consistent hashing, hot spots, or replication",
      },
      {
        type: "system-design",
        signal: "Missing failure handling",
        location:
          "Node failure response is vague — no mention of replica sets, sentinel, or cluster mode",
      },
      {
        type: "behavioral",
        signal: "Weak ownership",
        location:
          "'I helped the team deploy a similar system' — contributor language, not owner language",
      },
    ],
  },
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function LiveFixSimulator({ onComplete }: Props) {
  const [phase, setPhase] = useState<
    "intro" | "read" | "diagnose" | "fix" | "result"
  >("intro");
  const [transcript] = useState(
    () => TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)]
  );
  const [diagnoses, setDiagnoses] = useState<string[]>(["", "", ""]);
  const [fixes, setFixes] = useState<string[]>(["", "", ""]);

  const scoreMutation = trpc.failureDrills.scoreLiveFixSimulator.useMutation();

  const handleSubmit = () => {
    scoreMutation.mutate(
      {
        transcript: transcript.transcript,
        diagnosedFailures: diagnoses
          .map((d, i) => ({
            type: (transcript.failures[i]?.type ?? "system-design") as
              | "system-design"
              | "behavioral"
              | "coding",
            signal: d,
            fixTool: fixes[i] ?? "",
            correctedAnswer: fixes[i] ?? "",
          }))
          .filter(df => df.signal.trim().length > 0),
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
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={16} className="text-rose-400" />
            <span className="font-semibold text-rose-400 text-sm">
              Live Fix Simulator
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Read a mock interview transcript with 3 injected failures (one
            System Design, one Coding/Design, one Behavioral). Diagnose each
            failure, identify the weak signal, and rewrite the broken answer.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-500/10 rounded-lg p-3">
            <p className="text-xs text-blue-400 font-medium">System Design</p>
            <p className="text-xs text-muted-foreground mt-1">1 failure</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <p className="text-xs text-emerald-400 font-medium">
              Design/Coding
            </p>
            <p className="text-xs text-muted-foreground mt-1">1 failure</p>
          </div>
          <div className="bg-pink-500/10 rounded-lg p-3">
            <p className="text-xs text-pink-400 font-medium">Behavioral</p>
            <p className="text-xs text-muted-foreground mt-1">1 failure</p>
          </div>
        </div>
        <Button
          onClick={() => setPhase("read")}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
        >
          Start Simulator
        </Button>
      </div>
    );
  }

  if (phase === "read") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {transcript.title}
          </Badge>
          <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">
            3 failures hidden
          </Badge>
        </div>
        <div className="bg-secondary/30 rounded-lg p-4 max-h-64 overflow-y-auto">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {transcript.transcript}
          </pre>
        </div>
        <Button
          onClick={() => setPhase("diagnose")}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
        >
          I've Read It — Start Diagnosis
        </Button>
      </div>
    );
  }

  if (phase === "diagnose") {
    return (
      <div className="space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          <p className="text-xs text-rose-400 font-medium">
            Diagnose all 3 failures — category, signal, and location in the
            transcript
          </p>
        </div>
        {[0, 1, 2].map(i => (
          <div key={i}>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Failure {i + 1}
            </label>
            <Textarea
              value={diagnoses[i]}
              onChange={e => {
                const d = [...diagnoses];
                d[i] = e.target.value;
                setDiagnoses(d);
              }}
              placeholder={`Category: [System Design / Coding / Behavioral]\nSignal: [e.g. Skipping NFRs]\nLocation: [quote or describe where in the transcript]`}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        ))}
        <Button
          onClick={() => setPhase("fix")}
          disabled={diagnoses.filter(d => d.trim().length > 10).length < 2}
          className="w-full"
        >
          Proceed to Rewrites →
        </Button>
      </div>
    );
  }

  if (phase === "fix") {
    return (
      <div className="space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          <p className="text-xs text-rose-400 font-medium">
            Rewrite the broken answer for each failure you identified
          </p>
        </div>
        {[0, 1, 2].map(i => (
          <div key={i}>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Fix for Failure {i + 1}
            </label>
            <div className="text-xs text-muted-foreground bg-secondary/30 rounded p-2 mb-1.5">
              {diagnoses[i] || "(no diagnosis provided)"}
            </div>
            <Textarea
              value={fixes[i]}
              onChange={e => {
                const f = [...fixes];
                f[i] = e.target.value;
                setFixes(f);
              }}
              placeholder="Write the corrected version of the candidate's answer..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        ))}
        <Button
          onClick={handleSubmit}
          disabled={
            fixes.filter(f => f.trim().length > 20).length < 2 ||
            scoreMutation.isPending
          }
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Submit All Fixes"}
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
          <span className="font-semibold">Fix Simulator Score</span>
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

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Actual failures in transcript
        </p>
        {transcript.failures.map((f, i) => (
          <div key={i} className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                className={`text-xs border-0 ${f.type === "system-design" ? "bg-blue-500/20 text-blue-300" : f.type === "coding" ? "bg-emerald-500/20 text-emerald-300" : "bg-pink-500/20 text-pink-300"}`}
              >
                {f.type}
              </Badge>
              <span className="text-xs font-medium text-foreground">
                {f.signal}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{f.location}</p>
          </div>
        ))}
      </div>

      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Strong diagnoses
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
          setDiagnoses(["", "", ""]);
          setFixes(["", "", ""]);
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
