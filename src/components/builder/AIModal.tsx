"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, X, RefreshCw, Check } from "lucide-react";
import { getMockBulletSuggestions, getMockSummary, type AISuggestions } from "@/lib/mock-ai";
import { useResumeStore } from "@/lib/store";

interface AIModalProps {
  type: "bullet" | "summary";
  bullet?: string;
  bulletIndex?: number;
  jobId?: string;
  onClose: () => void;
}

export default function AIModal({ type, bullet, bulletIndex, jobId, onClose }: AIModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const store = useResumeStore();
  const { resumeData, updateBullet, updateSummary } = store;
  const { personalInfo, workExperience, skills } = resumeData;

  const generate = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    try {
      if (type === "bullet") {
        const result = await getMockBulletSuggestions(bullet || "", personalInfo.jobTitle);
        setSuggestions(result);
      } else {
        const expList = workExperience.map((e) => ({ title: e.title, company: e.company }));
        const result = await getMockSummary(personalInfo.jobTitle, skills, expList);
        setSuggestions(result);
      }
    } finally {
      setLoading(false);
    }
  }, [type, bullet, personalInfo.jobTitle, workExperience, skills]);

  const applyBullet = (text: string) => {
    if (type === "bullet" && jobId !== undefined && bulletIndex !== undefined) {
      updateBullet(jobId, bulletIndex, text);
    } else if (type === "summary") {
      updateSummary(text);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-gray-900 text-sm">
                {type === "bullet" ? "AI Bullet Enhancer" : "AI Summary Generator"}
              </h3>
              <p className="text-xs text-gray-500">Powered by AI • Free forever</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Original (for bullet mode) */}
          {type === "bullet" && bullet && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 font-semibold mb-1">ORIGINAL</p>
              <p className="text-sm text-gray-700 font-opensans">{bullet}</p>
            </div>
          )}

          {/* Generate button */}
          {!suggestions && (
            <button
              onClick={generate}
              disabled={loading}
              className="btn-gold w-full justify-center !py-3 !text-sm mb-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating suggestions...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Suggestions</>
              )}
            </button>
          )}

          {/* Loading state */}
          {loading && (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 shimmer rounded-xl" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions && !loading && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {type === "bullet" ? "Choose a variation:" : "Choose a summary:"}
              </p>
              {(type === "bullet" ? suggestions.bullets : suggestions.summaries?.map((s, i) => ({ text: s, improvement: "ats" as const }))).map((item, i) => {
                const text = typeof item === "string" ? item : (item as { text: string }).text;
                const improvement = typeof item === "string" ? undefined : (item as { improvement: string }).improvement;
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                      selected === i
                        ? "border-primary bg-primary/5"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected === i ? "border-primary bg-primary" : "border-gray-300"}`}>
                        {selected === i && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-gray-800 leading-relaxed font-opensans">{text}</p>
                        {improvement && (
                          <span className="badge badge-primary mt-2 text-xs">{improvement === "metrics" ? "📊 Added Metrics" : improvement === "power-verb" ? "⚡ Power Verb" : "🎯 ATS Optimized"}</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}

              <div className="flex gap-2 pt-2">
                <button onClick={generate} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors flex-1 justify-center">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
                <button
                  disabled={selected === null}
                  onClick={() => {
                    const items = type === "bullet" ? suggestions.bullets : suggestions.summaries?.map((s) => ({ text: s }));
                    if (selected !== null && items) applyBullet(typeof items[selected] === "string" ? items[selected] as string : (items[selected] as { text: string }).text);
                  }}
                  className="btn-primary flex-1 justify-center !py-2.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Check className="w-4 h-4" /> Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
