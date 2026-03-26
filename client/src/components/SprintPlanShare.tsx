/**
 * SprintPlanShare — generates a shareable link for a 7-day sprint plan.
 * Mentors/peers can view the plan without logging in.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Share2, Copy, Check, ExternalLink, Users, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginUrl } from "@/const";

interface DayTask {
  title: string;
  tool: string;
  duration: string;
  description: string;
}

interface DayPlan {
  dayNumber: number;
  theme: string;
  tasks: DayTask[];
}

interface Props {
  planData: DayPlan[];
  targetLevel?: "L4" | "L5" | "L6" | "L7";
  focusPriority?: string;
  weakAreas?: string[];
}

export default function SprintPlanShare({ planData, targetLevel = "L6", focusPriority, weakAreas }: Props) {
  const { isAuthenticated } = useAuth();
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareMutation = trpc.sprintPlan.save.useMutation({
    onSuccess: (data) => {
      if (data.shareToken) setShareToken(data.shareToken);
    },
  });

  const shareUrl = shareToken
    ? `${window.location.origin}/shared-plan/${shareToken}`
    : null;

  const handleShare = () => {
    if (shareToken) { setOpen(true); return; }
    shareMutation.mutate({ planData: { days: planData as unknown[], focusPriority, weakAreas }, targetLevel });
    setOpen(true);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <Lock size={14} className="text-gray-400" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <a href={getLoginUrl()} className="text-indigo-600 hover:underline font-semibold">Sign in</a> to share this plan with a mentor or peer
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={shareMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold text-sm transition-all disabled:opacity-50"
      >
        {shareMutation.isPending ? (
          <span className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
        ) : (
          <Share2 size={14} />
        )}
        Share with Mentor / Peer
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Share Sprint Plan</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Anyone with the link can view — no login required</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {!shareToken ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    {/* Share URL */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Shareable Link</label>
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                          {shareUrl}
                        </div>
                        <button
                          onClick={handleCopy}
                          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            copied
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 space-y-2">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">How to use</p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="font-bold mt-0.5">1.</span>
                          Copy the link above and send it to your mentor, manager, or study partner
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold mt-0.5">2.</span>
                          They can view your full 7-day plan without creating an account
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold mt-0.5">3.</span>
                          Ask them to review your weak areas and suggest adjustments to the daily tasks
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold mt-0.5">4.</span>
                          Link expires in 30 days
                        </li>
                      </ul>
                    </div>

                    {/* Open in new tab */}
                    <a
                      href={shareUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      <ExternalLink size={14} />
                      Preview shared view
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
