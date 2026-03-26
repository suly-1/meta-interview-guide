/**
 * SprintPlanFeedback — inline feedback widget for the 7-Day Sprint Plan.
 * Shows after plan is generated. Collects per-day or overall rating + suggestion.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ThumbsUp, ThumbsDown, Star, Send, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  dayNumber?: number; // undefined = overall plan feedback
  compact?: boolean;
}

export default function SprintPlanFeedback({ dayNumber, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.feedback.submitSprintFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) return;
    submitMutation.mutate({
      rating,
      message: suggestion.trim() || (helpful === true ? "Helpful" : helpful === false ? "Not helpful" : "Feedback submitted"),
      dayFeedback: dayNumber ? [{ day: dayNumber, comment: suggestion.trim() || "" }] : undefined,
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold py-2">
        <CheckCircle2 size={14} />
        Thanks for your feedback!
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {dayNumber ? `Day ${dayNumber} helpful?` : "Was this plan helpful?"}
        </span>
        <button
          onClick={() => { setHelpful(true); setRating(5); submitMutation.mutate({ rating: 5, message: 'Helpful', dayFeedback: dayNumber ? [{ day: dayNumber, comment: 'Helpful' }] : undefined }); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border ${helpful === true ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"}`}
        >
          <ThumbsUp size={12} /> Yes
        </button>
        <button
          onClick={() => { setHelpful(false); setExpanded(true); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border ${helpful === false ? "bg-red-100 text-red-700 border-red-300" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-600"}`}
        >
          <ThumbsDown size={12} /> No
        </button>
        <AnimatePresence>
          {expanded && helpful === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full mt-2"
            >
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="What would make this better?"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <button
                onClick={() => submitMutation.mutate({ rating: 2, message: suggestion.trim() || 'Not helpful', dayFeedback: dayNumber ? [{ day: dayNumber, comment: suggestion.trim() || 'Not helpful' }] : undefined })}
                disabled={submitMutation.isPending}
                className="mt-1 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Send size={11} /> Send
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            {dayNumber ? `Rate Day ${dayNumber}` : "Rate this Sprint Plan"}
          </p>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
            Help improve the AI-generated plans for all candidates
          </p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-indigo-500" /> : <ChevronDown size={16} className="text-indigo-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3"
          >
            {/* Star rating */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={`transition-colors ${star <= displayRating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 self-center">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Suggestion */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Suggestion <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="What would make this plan more effective?"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm transition-all disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? (
                <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send size={13} />
              )}
              Submit Feedback
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
