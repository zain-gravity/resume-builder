"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import AIModal from "./AIModal";

interface AIButtonProps {
  type: "bullet" | "summary";
  bullet?: string;
  bulletIndex?: number;
  jobId?: string;
  size?: "sm" | "md";
}

export default function AIButton({ type, bullet, bulletIndex, jobId, size = "sm" }: AIButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`btn-gold flex items-center gap-1 ${size === "sm" ? "!px-2.5 !py-1.5 !text-xs" : "!px-4 !py-2 !text-sm"}`}
        title="AI Improve"
      >
        <Sparkles className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        {size === "md" ? "AI Improve" : "✨"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <AIModal
            type={type}
            bullet={bullet}
            bulletIndex={bulletIndex}
            jobId={jobId}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
