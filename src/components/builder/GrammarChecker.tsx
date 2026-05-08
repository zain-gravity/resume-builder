"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Zap, Info } from "lucide-react";
import { useResumeStore } from "@/lib/store";
import { checkGrammar, getOverallTone } from "@/lib/grammar-checker";

export default function GrammarChecker() {
  const { resumeData } = useResumeStore();

  const allText = useMemo(() => [
    resumeData.summary,
    ...resumeData.workExperience.flatMap(e => [...e.bullets, e.description]),
  ].filter(Boolean).join(" "), [resumeData]);

  const issues = useMemo(() => checkGrammar(allText), [allText]);
  const tone = useMemo(() => getOverallTone(allText), [allText]);
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const hasMetrics = /\d+%|\$\d+|\d+[kKmM]/i.test(allText);
  const hasPowerVerbs = /\b(led|managed|built|developed|increased|reduced|launched|delivered|achieved|architected|optimized|drove|scaled)/i.test(allText);

  const grouped: Record<string, typeof issues> = {};
  issues.forEach(issue => {
    if (!grouped[issue.original]) grouped[issue.original] = [];
    grouped[issue.original].push(issue);
  });
  const uniqueIssues = Object.values(grouped).map(g => g[0]);

  return (
    <div className="p-4 space-y-4">
      {/* Tone Overview */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2" style={{ borderColor: `${tone.color}30`, background: `${tone.color}08` }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tone.color }}>Overall Tone</p>
          <p className="font-poppins font-black text-xl mt-0.5" style={{ color: tone.color }}>{tone.label}</p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div>{wordCount} words analyzed</div>
          <div className={hasMetrics ? "text-green-600 font-semibold" : "text-red-400"}>
            {hasMetrics ? "✓" : "✗"} Quantified metrics
          </div>
          <div className={hasPowerVerbs ? "text-green-600 font-semibold" : "text-red-400"}>
            {hasPowerVerbs ? "✓" : "✗"} Power verbs
          </div>
        </div>
      </div>

      {/* Issues */}
      {uniqueIssues.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="font-poppins font-bold text-green-800 text-sm">No weak phrases detected!</p>
            <p className="text-xs text-green-600 mt-0.5">Your language is strong and professional.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> {uniqueIssues.length} Issue{uniqueIssues.length !== 1 ? "s" : ""} Found
            </p>
          </div>
          {uniqueIssues.slice(0, 8).map((issue, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl border border-amber-100 bg-amber-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">&quot;{issue.original}&quot;</code>
                    <span className="text-[10px] text-gray-400 uppercase">{issue.type.replace("-", " ")}</span>
                  </div>
                  <p className="text-xs text-amber-800">{issue.description}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    <Zap className="w-3 h-3 inline text-primary mr-1" />
                    <span className="text-primary">{issue.suggestion}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tips */}
      {!hasMetrics && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Add numbers to your bullets — e.g. &quot;increased sales by 30%&quot;, &quot;managed team of 8&quot;</p>
        </div>
      )}
      {!hasPowerVerbs && (
        <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
          <Zap className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-700">Start bullets with power verbs: Led, Built, Increased, Launched, Delivered, Optimized</p>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">Analyzed: Summary + all experience bullets</p>
    </div>
  );
}
