/**
 * MockInterviewerChat — AI-powered interviewer chat panel for coding simulators.
 * The AI plays the role of a Meta interviewer: asks clarifying questions, probes
 * complexity, nudges on edge cases, and gives hints without revealing the solution.
 *
 * Usage:
 *   <MockInterviewerChat
 *     problemName="Two Sum"
 *     difficulty="Easy"
 *     targetLevel="E6"
 *     currentCode={code}
 *     compact={false}
 *   />
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bot, Send, ChevronDown, ChevronUp, Loader2, MessageSquare, X, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  problemName: string;
  difficulty: "Easy" | "Medium" | "Hard";
  targetLevel: "E4" | "E5" | "E6" | "E6+";
  currentCode?: string;
  /** When true, renders as a collapsible bottom panel. When false, renders inline. */
  compact?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What clarifying questions should I ask?",
  "Is my approach optimal?",
  "What edge cases am I missing?",
  "Can you give me a hint?",
  "What's the expected time complexity?",
];

const DIFF_COLORS: Record<string, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

export default function MockInterviewerChat({ problemName, difficulty, targetLevel, currentCode, compact = false }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(!compact);
  const scrollRef = useRef<HTMLDivElement>(null);

  const askMutation = trpc.interviewerChat.ask.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, askMutation.isPending]);

  const sendMessage = (text: string) => {
    if (!text.trim() || askMutation.isPending) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    askMutation.mutate({
      problemName,
      difficulty,
      targetLevel,
      currentCode: currentCode || undefined,
      messages: newMessages,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([]);

  // ── Compact (collapsible) mode ──────────────────────────────────────────
  if (compact) {
    return (
      <div className="border-t border-border bg-card">
        {/* Toggle header */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Bot size={12} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-xs font-bold text-foreground">Mock Interviewer</span>
            {messages.length > 0 && (
              <span className="ml-2 text-[10px] text-muted-foreground">{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLORS[difficulty]}`}>{difficulty}</span>
          {open ? <ChevronDown size={13} className="text-muted-foreground" /> : <ChevronUp size={13} className="text-muted-foreground" />}
        </button>

        {open && (
          <div className="border-t border-border">
            <ChatBody
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={sendMessage}
              onKeyDown={handleKeyDown}
              onClear={clearChat}
              isPending={askMutation.isPending}
              isError={askMutation.isError}
              scrollRef={scrollRef}
              height="h-52"
            />
          </div>
        )}
      </div>
    );
  }

  // ── Inline (full) mode ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-700 flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <Bot size={12} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Mock Interviewer</div>
          <div className="text-[10px] text-indigo-200 truncate">{problemName}</div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLORS[difficulty]}`}>{difficulty}</span>
        {messages.length > 0 && (
          <button onClick={clearChat} title="Clear chat" className="text-indigo-300 hover:text-white transition-colors ml-1">
            <X size={12} />
          </button>
        )}
      </div>

      <ChatBody
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        onKeyDown={handleKeyDown}
        onClear={clearChat}
        isPending={askMutation.isPending}
        isError={askMutation.isError}
        scrollRef={scrollRef}
        height="flex-1"
      />
    </div>
  );
}

// ── ChatBody sub-component ──────────────────────────────────────────────────
function ChatBody({
  messages, input, setInput, onSend, onKeyDown, onClear, isPending, isError, scrollRef, height,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
  isPending: boolean;
  isError: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  height: string;
}) {
  return (
    <div className="flex flex-col min-h-0">
      {/* Message list */}
      <div ref={scrollRef} className={`${height} overflow-y-auto px-3 py-2 space-y-2 min-h-0`}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <MessageSquare size={18} className="text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">Ask your interviewer</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Clarifying questions, hints, complexity analysis</p>
            </div>
            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
              {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
                <button
                  key={p}
                  onClick={() => onSend(p)}
                  className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={10} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-xs max-w-none dark:prose-invert">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={10} className="text-white" />
            </div>
            <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="text-[10px] text-red-500 text-center py-1">
            Failed to get response. Try again.
          </div>
        )}
      </div>

      {/* Suggested prompts (when there are messages) */}
      {messages.length > 0 && messages.length < 6 && (
        <div className="px-3 pb-1 flex gap-1 flex-wrap">
          {SUGGESTED_PROMPTS.slice(0, 2).map(p => (
            <button
              key={p}
              onClick={() => onSend(p)}
              className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:text-foreground border border-border hover:bg-muted/80 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-2 border-t border-border bg-background flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask your interviewer… (Enter to send)"
          rows={1}
          className="flex-1 text-xs bg-muted border border-border rounded-lg px-2.5 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[32px] max-h-[80px]"
          style={{ overflowY: "auto" }}
          disabled={isPending}
        />
        <button
          onClick={() => onSend(input)}
          disabled={!input.trim() || isPending}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors flex-shrink-0"
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}
