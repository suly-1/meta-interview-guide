/**
 * SiteFeedbackModal — floating feedback button visible on all pages.
 * Collects category, 1-5 star rating, and a message, then sends to DB + notifies owner.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Star, Send, CheckCircle2, Bug, Lightbulb, BookOpen, Palette, HelpCircle } from "lucide-react";

const CATEGORIES = [
  { id: "bug",     label: "Bug Report",      icon: <Bug size={14} />,        color: "text-red-600 bg-red-100 border-red-200" },
  { id: "feature_request", label: "Feature Request", icon: <Lightbulb size={14} />,  color: "text-amber-800 bg-amber-100 border-amber-200" },
  { id: "content", label: "Content Issue",   icon: <BookOpen size={14} />,   color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "ux",      label: "UX Feedback",     icon: <Palette size={14} />,    color: "text-violet-600 bg-violet-50 border-violet-200" },
  { id: "other",   label: "Other",           icon: <HelpCircle size={14} />, color: "text-gray-600 bg-gray-50 border-gray-200" },
] as const;

type Category = typeof CATEGORIES[number]["id"];

interface Props {
  currentPage?: string;
}

export default function SiteFeedbackModal({ currentPage }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("feature_request");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.feedback.submitGeneral.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage("");
        setRating(0);
        setCategory("feature_request");
      }, 2500);
    },
  });

  const handleSubmit = () => {
    if (!message.trim() || message.length < 10) return;
    submitMutation.mutate({
      category,
      message: message.trim(),
      page: currentPage,
      userAgent: navigator.userAgent,
    });
  };

  const displayRating = hoverRating || rating;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
        title="Share feedback to improve this guide"
      >
        <MessageSquarePlus size={16} />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Help improve this guide</h3>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">Your feedback goes directly to the guide maintainer</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Thank you!</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center">Your feedback has been received and will help improve the guide for all candidates.</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            category === cat.id
                              ? cat.color + " ring-2 ring-offset-1 ring-current"
                              : "text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:border-gray-300"
                          }`}
                        >
                          {cat.icon}
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Star rating */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">
                      Overall Rating <span className="text-gray-600 font-normal normal-case">(optional)</span>
                    </label>
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
                            size={24}
                            className={`transition-colors ${
                              star <= displayRating
                                ? "text-amber-900 fill-amber-400"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 self-center">
                          {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">Your Feedback</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        category === "bug" ? "Describe what happened and what you expected..." :
                        category === "feature_request" ? "What feature would help candidates most?" :
                        category === "content" ? "Which section needs improvement and why?" :
                        category === "ux" ? "What was confusing or hard to use?" :
                        "Share your thoughts..."
                      }
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                    />
                    <p className="text-xs text-gray-600 mt-1 text-right">{message.length}/2000</p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={message.length < 10 || submitMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm transition-all disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send size={14} />
                    )}
                    {submitMutation.isPending ? "Sending..." : "Send Feedback"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
