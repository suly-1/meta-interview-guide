import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Eye } from "lucide-react";

const SCENARIOS = [
  {
    id: "s1",
    context:
      "You've just finished explaining your system design for a distributed cache. The interviewer nods but says nothing for 8 seconds.",
    signal: "Skeptical silence after design explanation",
    hint: "This usually means: missing component, wrong assumption, or they want you to go deeper on a specific area.",
  },
  {
    id: "s2",
    context:
      "You've described your STAR story about leading a migration project. The interviewer writes a note, then looks up and says 'Interesting.' Then silence.",
    signal: "Neutral response after behavioral answer",
    hint: "This usually means: the impact wasn't quantified, ownership was unclear, or they want a follow-up.",
  },
  {
    id: "s3",
    context:
      "You've explained your O(n log n) solution to a coding problem. The interviewer says 'OK.' and pauses for 10 seconds.",
    signal: "Minimal acknowledgment after coding explanation",
    hint: "This usually means: they want edge cases, a better solution exists, or your explanation was unclear.",
  },
  {
    id: "s4",
    context:
      "You've just proposed using Kafka for a simple notification system. The interviewer raises an eyebrow slightly and says nothing.",
    signal: "Non-verbal skepticism about technology choice",
    hint: "This usually means: over-engineering, wrong tool, or they want you to justify the complexity.",
  },
];

interface Props {
  onComplete?: (score: number) => void;
}

export default function TheSilentSkeptic({ onComplete }: Props) {
  const [phase, setPhase] = useState<
    "intro" | "scenario" | "interpret" | "respond" | "result"
  >("intro");
  const [scenario] = useState(
    () => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
  );
  const [interpretation, setInterpretation] = useState("");
  const [response, setResponse] = useState("");

  const scoreMutation = trpc.failureDrills.scoreSilentSkeptic.useMutation();

  const handleSubmit = () => {
    scoreMutation.mutate(
      {
        scenario: scenario.context,
        silenceType: scenario.signal,
        interpretation,
        response,
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
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-muted-foreground" />
            <span className="font-semibold text-muted-foreground text-sm">
              The Silent Skeptic
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll be shown a scenario where the interviewer goes silent after
            your answer. First interpret what the silence means, then write how
            you'd respond. Trains reading interviewer cues and self-correcting
            in real time.
          </p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            What silence usually means
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• &quot;You missed something important&quot;</li>
            <li>• &quot;Go deeper on that specific point&quot;</li>
            <li>• &quot;I&apos;m skeptical of that choice&quot;</li>
            <li>• &quot;Your answer was too vague&quot;</li>
          </ul>
        </div>
        <Button
          onClick={() => setPhase("scenario")}
          className="w-full bg-slate-500 hover:bg-slate-600 text-white font-semibold"
        >
          Start Drill
        </Button>
      </div>
    );
  }

  if (phase === "scenario") {
    return (
      <div className="space-y-4">
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
            Interview Scenario
          </p>
          <p className="text-sm text-foreground">{scenario.context}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-500/40 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground italic">
              ...silence...
            </span>
          </div>
        </div>
        <Button
          onClick={() => setPhase("interpret")}
          className="w-full bg-slate-500 hover:bg-slate-600 text-white"
        >
          Interpret the Silence →
        </Button>
      </div>
    );
  }

  if (phase === "interpret") {
    return (
      <div className="space-y-4">
        <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            What does this silence mean?
          </p>
          <p className="text-xs text-muted-foreground">{scenario.context}</p>
        </div>
        <Textarea
          value={interpretation}
          onChange={e => setInterpretation(e.target.value)}
          placeholder="The interviewer is probably thinking... This silence signals that... I think they want me to..."
          rows={4}
          className="text-sm resize-none"
          autoFocus
        />
        <Button
          onClick={() => setPhase("respond")}
          disabled={interpretation.trim().length < 20}
          className="w-full"
        >
          Write My Response →
        </Button>
      </div>
    );
  }

  if (phase === "respond") {
    return (
      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Your interpretation
          </p>
          <p className="text-xs text-muted-foreground">{interpretation}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            How would you respond to break the silence?
          </label>
          <Textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="What you'd say out loud to the interviewer..."
            rows={5}
            className="text-sm resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tip: Don&apos;t just ask &quot;Did I miss something?&quot; —
            proactively address what you think they&apos;re skeptical about.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={response.trim().length < 20 || scoreMutation.isPending}
          className="w-full"
        >
          {scoreMutation.isPending ? "Scoring..." : "Score My Response"}
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
          <span className="font-semibold">Silent Skeptic Score</span>
        </div>
        <span
          className={`text-3xl font-bold ${result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"}`}
        >
          {result.score}
        </span>
      </div>
      <Progress value={result.score} className="h-3" />
      <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium">
          What the silence actually meant
        </p>
        <p className="text-sm text-foreground">{scenario.signal}</p>
        <p className="text-xs text-muted-foreground italic">{scenario.hint}</p>
      </div>
      <div className="bg-secondary/40 rounded-lg p-4 text-sm text-muted-foreground">
        {result.feedback}
      </div>
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1.5">
            ✓ Strong reads
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
            <AlertTriangle size={12} /> Missed signals
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
          setInterpretation("");
          setResponse("");
        }}
        variant="outline"
        className="w-full"
      >
        Try Again
      </Button>
    </div>
  );
}
