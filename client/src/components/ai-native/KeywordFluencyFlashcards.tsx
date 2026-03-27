// AI-Native Drill #19 — Keyword Fluency Flashcards
// Candidate is shown an AI-Native term and must explain it in plain English in 30 seconds
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, RefreshCw, ChevronRight, Check, X } from "lucide-react";

const CARDS = [
  {
    term: "RAG",
    category: "Architecture",
    definition:
      "Retrieval-Augmented Generation: augments an LLM's response by retrieving relevant documents at inference time, reducing hallucination and keeping knowledge current without retraining.",
    ic7Caveat:
      "Mention: retrieval quality bottleneck, cost of embedding + vector search, when fine-tuning beats RAG (domain-specific syntax/format).",
  },
  {
    term: "LLM-as-Judge",
    category: "Evals",
    definition:
      "Using a capable LLM to evaluate the output of another LLM (or the same one) against a rubric or reference answer. Scales eval beyond human annotation.",
    ic7Caveat:
      "Mention: judge model bias, self-preference, need for calibration against human labels, cost vs. accuracy trade-off.",
  },
  {
    term: "Agentic Loop",
    category: "Architecture",
    definition:
      "A pattern where an LLM iteratively calls tools, observes results, and decides next actions until a goal is reached. Enables multi-step autonomous task completion.",
    ic7Caveat:
      "Mention: error compounding, cost explosion, need for hard stop conditions, human-in-the-loop checkpoints.",
  },
  {
    term: "Context Window",
    category: "Fundamentals",
    definition:
      "The maximum number of tokens an LLM can process in a single forward pass. Determines how much history, instructions, and retrieved content can be included.",
    ic7Caveat:
      "Mention: 'lost in the middle' degradation, cost scales with tokens, chunking strategies for long documents.",
  },
  {
    term: "Prompt Injection",
    category: "Responsible AI",
    definition:
      "An attack where malicious content in user input or retrieved documents overrides the system prompt, causing the LLM to ignore instructions or leak data.",
    ic7Caveat:
      "Mention: input sanitisation, output validation, sandboxed tool execution, privilege separation.",
  },
  {
    term: "Fine-tuning vs. RAG",
    category: "Architecture",
    definition:
      "Fine-tuning updates model weights for domain-specific behaviour/style; RAG retrieves external knowledge at inference time. Not mutually exclusive.",
    ic7Caveat:
      "IC7 signal: knows when each wins — fine-tuning for format/style/latency, RAG for freshness/factual recall. Mentions eval cost of fine-tuning.",
  },
  {
    term: "Evals Framework",
    category: "Evals",
    definition:
      "A systematic approach to measuring LLM output quality: golden test sets, LLM-as-judge, human spot-checks, regression testing on model upgrades.",
    ic7Caveat:
      "Mention: Anthropic's approach (simple state checks + semantic LLM evals), Braintrust/Ragas/HELM, cost of eval at scale.",
  },
  {
    term: "Token Budget",
    category: "Fundamentals",
    definition:
      "A constraint on the number of tokens consumed per request or session, used to control cost and latency in production AI systems.",
    ic7Caveat:
      "Mention: prompt compression, caching, batching, streaming vs. blocking, cost per 1M tokens for major models.",
  },
  {
    term: "Hallucination",
    category: "Responsible AI",
    definition:
      "When an LLM generates plausible-sounding but factually incorrect or fabricated content, often with high confidence.",
    ic7Caveat:
      "Mention: grounding via RAG, citation enforcement, confidence calibration, factual consistency checks, RLHF limitations.",
  },
  {
    term: "Semantic Search",
    category: "Architecture",
    definition:
      "Retrieval based on meaning/embedding similarity rather than keyword matching. Enables finding conceptually relevant documents even with different wording.",
    ic7Caveat:
      "Mention: embedding model choice, vector DB (Pinecone/Weaviate/pgvector), hybrid search (BM25 + dense), reranking.",
  },
  {
    term: "RLHF",
    category: "Fundamentals",
    definition:
      "Reinforcement Learning from Human Feedback: trains a reward model on human preferences, then uses it to fine-tune the LLM via PPO. Aligns model behaviour with human intent.",
    ic7Caveat:
      "Mention: reward hacking, annotation cost, RLAIF as cheaper alternative, DPO as simpler alternative to PPO.",
  },
  {
    term: "Tool Calling / Function Calling",
    category: "Architecture",
    definition:
      "A capability that allows LLMs to invoke external functions (APIs, databases, code executors) in a structured way, enabling grounded and actionable responses.",
    ic7Caveat:
      "Mention: schema design, error handling for failed tool calls, parallel vs. sequential calls, security of tool permissions.",
  },
  {
    term: "Responsible AI / AI Safety",
    category: "Responsible AI",
    definition:
      "Practices ensuring AI systems are safe, fair, transparent, and aligned with human values. Includes bias audits, explainability, HITL, and policy compliance.",
    ic7Caveat:
      "Mention: specific frameworks (EU AI Act, NIST AI RMF), PII handling, model cards, red-teaming.",
  },
  {
    term: "Embedding",
    category: "Fundamentals",
    definition:
      "A dense vector representation of text (or other data) that captures semantic meaning. The foundation of semantic search, clustering, and RAG.",
    ic7Caveat:
      "Mention: embedding model choice (OpenAI ada-002 vs. open-source), dimensionality, cosine similarity, staleness on model upgrades.",
  },
  {
    term: "Prompt Engineering",
    category: "Fundamentals",
    definition:
      "The craft of designing inputs to LLMs to elicit desired outputs. Includes chain-of-thought, few-shot examples, role assignment, and output format constraints.",
    ic7Caveat:
      "IC7 signal: knows the limits — prompt engineering is fragile at scale, evals are the real discipline. Mentions when to move to fine-tuning.",
  },
];

export default function KeywordFluencyFlashcards() {
  const [deck, setDeck] = useState(() =>
    [...CARDS].sort(() => Math.random() - 0.5)
  );
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ term: string; knew: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const save = trpc.aiNativeHistory.saveDrillScore.useMutation();

  const card = deck[idx];

  useEffect(() => {
    if (running && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setFlipped(true);
      setRunning(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, timeLeft]);

  const startCard = () => {
    setFlipped(false);
    setTimeLeft(30);
    setRunning(true);
  };

  const reveal = () => {
    setFlipped(true);
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const mark = (knew: boolean) => {
    const newResults = [...results, { term: card.term, knew }];
    setResults(newResults);
    if (idx + 1 >= deck.length) {
      setDone(true);
      if (!saved) {
        const correct = newResults.filter(r => r.knew).length;
        save.mutate({
          drillId: "keyword-flashcards",
          drillLabel: "Keyword Fluency Flashcards",
          coreSkill: "AI Fluency and Tool Orchestration",
          overallScore: Math.round((correct / newResults.length) * 10),
          scores: { correct, total: newResults.length },
        });
        setSaved(true);
      }
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
      setTimeLeft(30);
      setRunning(false);
    }
  };

  const reset = () => {
    setDeck([...CARDS].sort(() => Math.random() - 0.5));
    setIdx(0);
    setFlipped(false);
    setTimeLeft(30);
    setRunning(false);
    setResults([]);
    setDone(false);
  };

  const CATEGORY_COLOR: Record<string, string> = {
    Architecture: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Evals: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    Fundamentals: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    "Responsible AI": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  if (done) {
    const correct = results.filter(r => r.knew).length;
    return (
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <div className="text-5xl font-bold text-violet-400">
            {correct}/{results.length}
          </div>
          <p className="text-sm text-muted-foreground">
            {correct === results.length
              ? "Perfect — IC7 keyword fluency ✦"
              : correct >= results.length * 0.8
                ? "Strong fluency"
                : "Keep drilling"}
          </p>
        </div>
        <div className="space-y-1">
          {results.map(r => (
            <div key={r.term} className="flex items-center gap-2 text-sm">
              {r.knew ? (
                <Check size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <X size={14} className="text-red-400 shrink-0" />
              )}
              <span
                className={r.knew ? "text-foreground" : "text-muted-foreground"}
              >
                {r.term}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={reset}
          className="border-violet-500/30 gap-1 w-full"
        >
          <RefreshCw size={13} /> Shuffle & Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">
            Fluency & Orchestration — Keyword Flashcards
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          30 seconds per card. Explain the term in plain English — then check
          the IC7 caveat you should have mentioned.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {idx + 1} / {deck.length}
        </span>
        <span>
          {results.filter(r => r.knew).length} known ·{" "}
          {results.filter(r => !r.knew).length} missed
        </span>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 min-h-[200px] space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">{card.term}</p>
            <Badge
              className={`text-xs border mt-1 ${CATEGORY_COLOR[card.category] || ""}`}
            >
              {card.category}
            </Badge>
          </div>
          {running && (
            <div
              className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? "text-red-400" : "text-violet-400"}`}
            >
              {timeLeft}s
            </div>
          )}
        </div>

        {!flipped && !running && (
          <Button
            onClick={startCard}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full"
          >
            Start 30-second timer
          </Button>
        )}

        {running && !flipped && (
          <Button
            onClick={reveal}
            variant="outline"
            className="border-violet-500/30 w-full"
          >
            Reveal answer
          </Button>
        )}

        {flipped && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-violet-300 mb-1">
                Definition
              </p>
              <p className="text-sm text-foreground">{card.definition}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">
                IC7 caveat to mention
              </p>
              <p className="text-xs text-muted-foreground">{card.ic7Caveat}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => mark(false)}
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <X size={14} className="mr-1" /> Missed it
              </Button>
              <Button
                onClick={() => mark(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check size={14} className="mr-1" /> Got it
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
