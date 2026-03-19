/**
 * XPToast — floating XP gain notification
 * Shown briefly when XP is earned; auto-dismisses after 2.5s
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPToastProps {
  amount: number;
  label: string;
  onDone: () => void;
}

export default function XPToast({ amount, label, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-20 sm:bottom-6 right-4 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-yellow-400 text-yellow-900 shadow-lg border border-yellow-300 font-bold text-sm pointer-events-none"
        >
          <Zap size={16} className="text-yellow-700 fill-yellow-600" />
          <span>+{amount} XP</span>
          <span className="font-normal text-yellow-800 text-xs">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
