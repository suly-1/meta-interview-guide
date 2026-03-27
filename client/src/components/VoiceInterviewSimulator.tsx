/**
 * Live Interview Simulation with Voice
 * - TTS reads the question aloud (Web Speech API SpeechSynthesis)
 * - User speaks their answer (MediaRecorder → Blob → upload → Whisper transcription)
 * - AI scores the transcribed answer via voiceInterviewScore procedure
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
} from "lucide-react";

// ── question bank ─────────────────────────────────────────────────────────────

const VOICE_QUESTIONS: Record<
  string,
  {
    question: string;
    roundType: "coding" | "sysdesign" | "behavioral" | "xfn";
  }[]
> = {
  behavioral: [
    {
      question:
        "Tell me about a time you had to influence a decision without direct authority. What was the outcome?",
      roundType: "behavioral",
    },
    {
      question:
        "Describe a situation where you had to deliver difficult feedback to a senior engineer. How did you approach it?",
      roundType: "behavioral",
    },
    {
      question:
        "Give me an example of a project where you had to balance technical debt against shipping speed. What did you decide?",
      roundType: "behavioral",
    },
    {
      question:
        "Tell me about a time you disagreed with your manager's technical direction. What happened?",
      roundType: "behavioral",
    },
    {
      question:
        "Describe the most complex system you've designed. Walk me through your key trade-off decisions.",
      roundType: "behavioral",
    },
  ],
  xfn: [
    {
      question:
        "How would you explain a complex technical constraint to a product manager who is pushing for a feature you believe is risky?",
      roundType: "xfn",
    },
    {
      question:
        "A data scientist wants to ship a model that you believe has fairness issues. How do you handle this?",
      roundType: "xfn",
    },
    {
      question:
        "You're in a roadmap planning meeting and a PM wants to cut a feature you believe is critical for scalability. What do you do?",
      roundType: "xfn",
    },
    {
      question:
        "How do you align multiple teams on a shared technical standard when each team has different priorities?",
      roundType: "xfn",
    },
  ],
  sysdesign: [
    {
      question:
        "Design a notification system that can send 10 million push notifications per day with sub-second delivery. Walk me through your architecture.",
      roundType: "sysdesign",
    },
    {
      question:
        "How would you design a rate limiter that works across a distributed system with 50 data centers?",
      roundType: "sysdesign",
    },
    {
      question:
        "Design a feature flag system that can roll out changes to 1% of users without a deployment. What are the key components?",
      roundType: "sysdesign",
    },
  ],
};

const ALL_QUESTIONS = Object.values(VOICE_QUESTIONS).flat();

// ── helpers ──────────────────────────────────────────────────────────────────

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    v => v.lang === "en-US" && v.name.toLowerCase().includes("google")
  );
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
}

// ── component ─────────────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "uploading" | "scoring";

interface ScoreResult {
  overallScore: number;
  clarity: number;
  depth: number;
  structure: number;
  levelSignal: string;
  verdict: string;
  strengths: string[];
  improvements: string[];
  idealAnswerOutline: string;
  nextQuestion: string;
}

export function VoiceInterviewSimulator() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [category, setCategory] =
    useState<keyof typeof VOICE_QUESTIONS>("behavioral");
  const [targetLevel, setTargetLevel] = useState("L6");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  // Custom question override from deep-link (MetaQuestionBank "Practice Now")
  const [customQuestion, setCustomQuestion] = useState<string | null>(null);

  // Auto-populate question from deep-link
  useEffect(() => {
    const q = sessionStorage.getItem("meta_practice_question");
    if (q) {
      setCustomQuestion(q);
      setIsOpen(true);
      sessionStorage.removeItem("meta_practice_question");
    }
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = VOICE_QUESTIONS[category] ?? ALL_QUESTIONS;
  const baseQ = questions[selectedIdx % questions.length];
  // If a question was passed via deep-link, override the current question
  const currentQ = customQuestion
    ? {
        question: customQuestion,
        roundType: category as "behavioral" | "xfn" | "sysdesign" | "coding",
      }
    : baseQ;

  const transcribeMutation = trpc.ai.transcribeAndScore.useMutation({
    onSuccess: data => {
      setTranscript(data.transcript ?? "");
      // now score it
      scoreMutation.mutate({
        question: currentQ.question,
        transcribedAnswer: data.transcript ?? "",
        roundType: currentQ.roundType,
        targetLevel,
      });
    },
    onError: () => {
      setRecordingState("idle");
      toast.error("Transcription failed. Please try again.");
    },
  });

  const scoreMutation = trpc.ai.voiceInterviewScore.useMutation({
    onSuccess: data => {
      setScoreResult(data);
      setRecordingState("idle");
    },
    onError: () => {
      setRecordingState("idle");
      toast.error("Scoring failed. Please try again.");
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          setRecordingState("idle");
          toast.error("Recording too short. Please try again.");
          return;
        }
        setRecordingState("uploading");
        // Convert to base64 and send for transcription
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          transcribeMutation.mutate({
            audioBase64: base64,
            mimeType: "audio/webm",
          });
        };
        reader.readAsDataURL(blob);
      };
      mr.start(500);
      mediaRecorderRef.current = mr;
      setRecordingState("recording");
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error(
        "Microphone access denied. Please allow microphone access in your browser."
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setRecordingState("uploading");
    }
  }, []);

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setTranscript("");
    setScoreResult(null);
    setRecordingState("idle");
    setRecordingTime(0);
  };

  const handleNextQuestion = () => {
    handleReset();
    setSelectedIdx(i => (i + 1) % questions.length);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const scoreColor = (s: number) =>
    s >= 4 ? "text-emerald-400" : s >= 3 ? "text-amber-400" : "text-red-400";

  const verdictColor = (v: string) => {
    if (v.toLowerCase().includes("strong"))
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (v.toLowerCase().includes("hire") && !v.toLowerCase().includes("no"))
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (v.toLowerCase().includes("border"))
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-red-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">
            Voice Interview Simulator
          </span>
          <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-2 py-0.5">
            LIVE
          </span>
        </div>
        <button
          onClick={() => setIsOpen(o => !o)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {isOpen ? "Collapse" : "Start Session"}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Category
              </label>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value as keyof typeof VOICE_QUESTIONS);
                  setSelectedIdx(0);
                  handleReset();
                }}
                className="w-full text-xs rounded-lg bg-background border border-border px-2 py-1.5 text-foreground"
              >
                <option value="behavioral">Behavioral</option>
                <option value="xfn">XFN</option>
                <option value="sysdesign">System Design</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Target Level
              </label>
              <select
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
                className="w-full text-xs rounded-lg bg-background border border-border px-2 py-1.5 text-foreground"
              >
                {["L4", "L5", "L6", "L7"].map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Question
              </label>
              <select
                value={selectedIdx}
                onChange={e => {
                  setSelectedIdx(Number(e.target.value));
                  handleReset();
                }}
                className="w-full text-xs rounded-lg bg-background border border-border px-2 py-1.5 text-foreground"
              >
                {questions.map((_, i) => (
                  <option key={i} value={i}>
                    Q{i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question card */}
          <div className="rounded-xl bg-secondary border border-border p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {currentQ.question}
              </p>
              <button
                onClick={() => speakText(currentQ.question)}
                className="shrink-0 p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                title="Read question aloud"
              >
                <Volume2 size={14} />
              </button>
            </div>
            <div className="text-xs text-muted-foreground">
              Round type:{" "}
              <span className="text-foreground font-medium capitalize">
                {currentQ.roundType}
              </span>
            </div>
          </div>

          {/* Recording controls */}
          <div className="flex items-center gap-3">
            {recordingState === "idle" && (
              <button
                onClick={startRecording}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Mic size={16} /> Start Recording
              </button>
            )}
            {recordingState === "recording" && (
              <button
                onClick={stopRecording}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 animate-pulse"
              >
                <Square size={16} /> Stop Recording ({formatTime(recordingTime)}
                )
              </button>
            )}
            {(recordingState === "uploading" ||
              recordingState === "scoring") && (
              <div className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {recordingState === "uploading"
                  ? "Transcribing..."
                  : "Scoring answer..."}
              </div>
            )}
            {scoreResult && (
              <button
                onClick={handleReset}
                className="p-3 rounded-xl bg-secondary hover:bg-slate-600 text-muted-foreground transition-all"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="rounded-lg bg-secondary border border-border p-3">
              <div className="text-xs text-muted-foreground mb-1.5 font-semibold">
                Transcription
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {transcript}
              </p>
            </div>
          )}

          {/* Score result */}
          {scoreResult && (
            <div className="space-y-3">
              {/* Verdict + overall */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary border border-border p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Overall Score
                  </div>
                  <div
                    className={`text-3xl font-black ${scoreColor(scoreResult.overallScore)}`}
                  >
                    {scoreResult.overallScore}
                    <span className="text-sm">/5</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Level Signal:{" "}
                    <span className="text-foreground font-semibold">
                      {scoreResult.levelSignal}
                    </span>
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-3 text-center ${verdictColor(scoreResult.verdict)}`}
                >
                  <div className="text-xs mb-1 opacity-70">Verdict</div>
                  <div className="text-sm font-bold">{scoreResult.verdict}</div>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Clarity", scoreResult.clarity],
                  ["Depth", scoreResult.depth],
                  ["Structure", scoreResult.structure],
                ].map(([label, val]) => (
                  <div
                    key={label as string}
                    className="rounded-lg bg-secondary border border-border p-2 text-center"
                  >
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {label}
                    </div>
                    <div
                      className={`text-lg font-bold ${scoreColor(val as number)}`}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths + improvements */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <div className="text-xs text-emerald-400 font-semibold mb-1.5">
                    Strengths
                  </div>
                  <ul className="space-y-1">
                    {scoreResult.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <CheckCircle2
                          size={10}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <div className="text-xs text-amber-400 font-semibold mb-1.5">
                    Improvements
                  </div>
                  <ul className="space-y-1">
                    {scoreResult.improvements.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <AlertTriangle
                          size={10}
                          className="text-amber-400 shrink-0 mt-0.5"
                        />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Ideal outline */}
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <div className="text-xs text-blue-400 font-semibold mb-1">
                  Ideal Answer Outline
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {scoreResult.idealAnswerOutline}
                </p>
              </div>

              {/* Follow-up + next */}
              <div className="rounded-lg bg-secondary border border-border p-3">
                <div className="text-xs text-muted-foreground font-semibold mb-1">
                  Follow-up Question
                </div>
                <p className="text-xs text-foreground italic">
                  "{scoreResult.nextQuestion}"
                </p>
              </div>

              <button
                onClick={handleNextQuestion}
                className="w-full py-2 rounded-lg bg-secondary hover:bg-slate-600 text-xs font-semibold text-foreground transition-all flex items-center justify-center gap-2"
              >
                <Play size={12} /> Next Question
              </button>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <div className="text-center py-6 text-muted-foreground">
          <Mic size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            Speak your answers aloud. AI transcribes and scores your verbal
            communication.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-all"
          >
            Start Voice Session
          </button>
        </div>
      )}
    </div>
  );
}
