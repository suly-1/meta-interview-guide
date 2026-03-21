/**
 * ApproachAnalyzer — AI Approach Analyzer + Voice Approach Recorder
 * Scores candidate's verbal approach on 4 dimensions:
 * pattern recognition, complexity mention, edge cases, trade-off discussion.
 * Includes Web Speech API voice transcription.
 */
import { useState, useRef, useCallback } from "react";
import { PATTERNS } from "@/lib/guideData";
import { Mic, MicOff, Send, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import MetaRubricAssessment from "@/components/MetaRubricAssessment";

interface DimensionScore {
  name: string;
  score: number; // 0-3
  feedback: string;
}

interface AnalysisResult {
  dimensions: DimensionScore[];
  totalScore: number;
  maxScore: number;
  overallFeedback: string;
  icLevel: string;
}

function analyzeApproach(text: string, patternName: string): AnalysisResult {
  const lower = text.toLowerCase();

  // Dimension 1: Pattern Recognition
  const patternKeywords = patternName.toLowerCase().split(/[\s/&]+/);
  const complexityWords = ["hash", "map", "set", "pointer", "window", "bfs", "dfs", "dp", "dynamic", "binary", "heap", "stack", "queue", "trie", "graph", "backtrack", "greedy", "sliding", "two pointer", "prefix", "monotonic"];
  const patternMentioned = patternKeywords.some(kw => lower.includes(kw)) || complexityWords.some(kw => lower.includes(kw));
  const patternScore = patternMentioned ? (lower.includes(patternName.toLowerCase()) ? 3 : 2) : 1;
  const patternFeedback = patternScore === 3
    ? `Clearly identified the ${patternName} pattern by name.`
    : patternScore === 2
    ? `Implied the correct approach but didn't name the pattern explicitly. Say "${patternName}" out loud.`
    : `Pattern not identified. Start with: "This looks like a ${patternName} problem because…"`;

  // Dimension 2: Complexity Mention
  const hasTime = /o\s*\(|time.*o\(|o\(.*n|linear|quadratic|log|constant/.test(lower);
  const hasSpace = /space|memory|auxiliary|o\s*\(\s*1\s*\)|o\s*\(\s*n\s*\)/.test(lower);
  const complexityScore = hasTime && hasSpace ? 3 : hasTime || hasSpace ? 2 : 0;
  const complexityFeedback = complexityScore === 3
    ? "Mentioned both time and space complexity — exactly what interviewers want."
    : complexityScore === 2
    ? "Mentioned one complexity dimension. Always state both time AND space."
    : "No complexity mentioned. Always say 'This runs in O(n) time and O(n) space' before coding.";

  // Dimension 3: Edge Cases
  const edgeWords = ["empty", "null", "zero", "negative", "duplicate", "single", "overflow", "edge", "corner", "boundary", "invalid", "none", "base case"];
  const edgeMentioned = edgeWords.filter(w => lower.includes(w)).length;
  const edgeScore = edgeMentioned >= 2 ? 3 : edgeMentioned === 1 ? 2 : 0;
  const edgeFeedback = edgeScore === 3
    ? "Proactively identified multiple edge cases — strong signal."
    : edgeScore === 2
    ? "Mentioned one edge case. Try to name 2–3: empty input, single element, duplicates."
    : "No edge cases mentioned. Ask: 'Can the input be empty? Can values be negative?'";

  // Dimension 4: Trade-off Discussion
  const tradeoffWords = ["trade", "tradeoff", "versus", "vs", "alternative", "instead", "could also", "another approach", "brute force", "optimize", "better", "improve", "downside", "limitation", "however"];
  const tradeoffMentioned = tradeoffWords.filter(w => lower.includes(w)).length;
  const tradeoffScore = tradeoffMentioned >= 2 ? 3 : tradeoffMentioned === 1 ? 2 : 0;
  const tradeoffFeedback = tradeoffScore === 3
    ? "Discussed trade-offs and alternatives — this is IC7-level thinking."
    : tradeoffScore === 2
    ? "Touched on trade-offs. Elaborate: 'The brute force is O(n²) but we can do better with…'"
    : "No trade-offs discussed. Mention the naive approach first, then explain why your solution is better.";

  const totalScore = patternScore + complexityScore + edgeScore + tradeoffScore;
  const maxScore = 12;
  const pct = totalScore / maxScore;

  const icLevel = pct >= 0.85 ? "IC7 Signal" : pct >= 0.65 ? "IC6 Signal" : pct >= 0.45 ? "IC5 Signal" : "Below Bar";
  const overallFeedback = pct >= 0.85
    ? "Excellent approach explanation. You're demonstrating IC7-level communication."
    : pct >= 0.65
    ? "Solid approach. Name the pattern explicitly and discuss trade-offs to reach IC7 level."
    : pct >= 0.45
    ? "Decent start but missing key elements. Practice the formula: Pattern → Complexity → Edge Cases → Trade-offs."
    : "Approach needs significant work. Use the template: 'This is a [pattern] problem. I'll use [data structure] for O(n) time. Edge cases: [list]. Alternative: [brute force].'";

  return {
    dimensions: [
      { name: "Pattern Recognition", score: patternScore, feedback: patternFeedback },
      { name: "Complexity Mention", score: complexityScore, feedback: complexityFeedback },
      { name: "Edge Cases", score: edgeScore, feedback: edgeFeedback },
      { name: "Trade-off Discussion", score: tradeoffScore, feedback: tradeoffFeedback },
    ],
    totalScore,
    maxScore,
    overallFeedback,
    icLevel,
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ApproachAnalyzer() {
  const [pattern] = useState(() => pickRandom(PATTERNS));
  const [problem] = useState(() => pickRandom(pattern.problems));
  const [currentPattern, setCurrentPattern] = useState(pattern);
  const [currentProblem, setCurrentProblem] = useState(problem);
  const [approach, setApproach] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleAnalyze = () => {
    if (!approach.trim()) return;
    const analysis = analyzeApproach(approach, currentPattern.name);
    setResult(analysis);
  };

  const handleNew = () => {
    const p = pickRandom(PATTERNS);
    const prob = pickRandom(p.problems);
    setCurrentPattern(p);
    setCurrentProblem(prob);
    setApproach("");
    setResult(null);
    stopListening();
  };

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setApproach(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const scoreColor = (s: number) =>
    s === 3 ? "text-emerald-600" : s === 2 ? "text-blue-600" : s === 1 ? "text-amber-600" : "text-red-500";

  const scoreBg = (s: number) =>
    s === 3 ? "bg-emerald-50 border-emerald-200" : s === 2 ? "bg-blue-50 border-blue-200" : s === 1 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-teal-100 rounded-xl">
          <Sparkles size={20} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Approach Analyzer
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Type or speak your approach — scored on 4 IC dimensions</p>
        </div>
      </div>

      {/* Problem */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Problem</p>
        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {currentProblem}
        </h4>
        <p className="text-xs text-gray-500 mt-1">Pattern: <span className="font-semibold">{currentPattern.name}</span></p>
      </div>

      {!result ? (
        <>
          {/* Text area */}
          <div className="relative mb-3">
            <textarea
              value={approach}
              onChange={e => setApproach(e.target.value)}
              placeholder="Explain your approach out loud or type it here. Example: 'This is a sliding window problem. I'll use two pointers to maintain a window of size k, giving O(n) time and O(1) space. Edge cases: empty array, k > n. The brute force would be O(n²) with nested loops...'"
              className="w-full h-32 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:border-teal-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400"
            />
            {isListening && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                <Volume2 size={11} /> Recording...
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleVoice}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              {isListening ? "Stop" : "Voice"}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!approach.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors text-sm"
            >
              <Send size={14} /> Analyze Approach
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {/* Overall */}
          <div className={`rounded-xl border p-4 ${
            result.icLevel === "IC7 Signal" ? "bg-emerald-50 border-emerald-200" :
            result.icLevel === "IC6 Signal" ? "bg-blue-50 border-blue-200" :
            result.icLevel === "IC5 Signal" ? "bg-amber-50 border-amber-200" :
            "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">{result.icLevel}</span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">{result.totalScore}/{result.maxScore}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{result.overallFeedback}</p>
          </div>

          {/* Dimensions */}
          {result.dimensions.map(d => (
            <div key={d.name} className={`rounded-xl border p-3 ${scoreBg(d.score)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{d.name}</span>
                <span className={`text-sm font-bold tabular-nums ${scoreColor(d.score)}`}>{d.score}/3</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{d.feedback}</p>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors text-sm"
            >
              Edit Approach
            </button>
            <button
              onClick={handleNew}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw size={13} /> New Problem
            </button>
          </div>

          {/* Meta SWE Rubric — shown after approach analysis */}
          <div className="mt-2">
            <MetaRubricAssessment
              problemName={currentProblem}
              approachText={approach}
              targetLevel="IC6"
            />
          </div>
        </div>
      )}
    </div>
  );
}
