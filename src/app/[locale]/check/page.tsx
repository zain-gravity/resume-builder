"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, Zap, Target, BookOpen, AlignLeft, Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { analyzeResume, type ATSResult } from "@/lib/ats-analyzer";
import Link from "next/link";

function ScoreRing({ score }: { score: number }) {
  const r = 54, c = 2 * Math.PI * r;
  const color = score >= 80 ? "#28A745" : score >= 60 ? "#F18F01" : "#DC3545";
  const offset = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
        <motion.circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="ats-ring"
          style={{ transformOrigin: "70px 70px", rotate: "-90deg" }}
        />
        <text x="70" y="65" textAnchor="middle" fontSize="32" fontWeight="900" fill={color} fontFamily="Poppins">{score}</text>
        <text x="70" y="83" textAnchor="middle" fontSize="12" fill="#9CA3AF" fontFamily="Open Sans">/100</text>
      </svg>
      <p className="font-poppins font-bold text-lg mt-1" style={{ color }}>
        {score >= 80 ? "🔥 Excellent!" : score >= 60 ? "⚡ Good" : "⚠️ Needs Work"}
      </p>
    </div>
  );
}

export default function ATSCheckerPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const [result, setResult] = useState<ATSResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    try {
      const text = await file.text();
      await new Promise((r) => setTimeout(r, 2000));
      const analysis = analyzeResume(text, jobDescription);
      setResult(analysis);
    } finally {
      setAnalyzing(false);
    }
  }, [jobDescription]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"], "application/pdf": [".pdf"], "application/msword": [".doc", ".docx"] },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />
      <div className="gradient-hero pt-28 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">Free ATS Scanner</span>
          <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4">Free ATS Resume Checker</h1>
          <p className="text-white/80 text-lg font-opensans max-w-2xl mx-auto">
            Get an instant ATS score with actionable recommendations. Know exactly what to fix before applying.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Job Description */}
        <div className="card p-6">
          <h2 className="font-poppins font-bold text-lg text-gray-900 mb-3">1. Paste Job Description (Optional)</h2>
          <textarea
            className="form-input !h-32 resize-none"
            placeholder="Paste the job description here for keyword-specific analysis..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-2">Adding a job description gives you keyword matching analysis</p>
        </div>

        {/* Upload */}
        <div className="card p-6">
          <h2 className="font-poppins font-bold text-lg text-gray-900 mb-4">2. Upload Your Resume</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            {analyzing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-poppins font-semibold text-gray-700">Analyzing your resume...</p>
                <p className="text-sm text-gray-500">Checking ATS compatibility, keywords, formatting...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-poppins font-bold text-gray-800 text-lg">
                    {isDragActive ? "Drop it here!" : "Drop your resume here"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse · PDF, DOC, TXT supported</p>
                </div>
                {fileName && <p className="text-xs text-primary font-semibold">📄 {fileName}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score */}
              <div className="card p-8">
                <h2 className="font-poppins font-bold text-xl text-gray-900 mb-6 text-center">Your ATS Analysis Results</h2>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ScoreRing score={result.score} />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {[
                      { label: "Keywords", icon: Target, value: `${result.keywords.found.length} found`, color: "text-primary" },
                      { label: "Formatting", icon: AlignLeft, value: result.formatting.passed ? "✅ Good" : "⚠️ Issues", color: result.formatting.passed ? "text-success" : "text-warning" },
                      { label: "Length", icon: FileText, value: `${result.length.pages} page${result.length.pages !== 1 ? "s" : ""}`, color: "text-primary" },
                      { label: "Readability", icon: BookOpen, value: `Grade ${result.readability.grade}`, color: "text-accent" },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
                        <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                        <p className="font-poppins font-semibold text-sm text-gray-900">{item.label}</p>
                        <p className={`text-xs mt-0.5 font-bold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="card p-6">
                <h3 className="font-poppins font-bold text-gray-900 mb-4">Keywords Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">✅ Found ({result.keywords.found.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords.found.map((kw) => <span key={kw} className="badge badge-success text-xs">{kw}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">❌ Missing ({result.keywords.missing.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords.missing.map((kw) => <span key={kw} className="badge bg-red-50 text-red-600 text-xs">{kw}</span>)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Fixes */}
              {result.quickFixes.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-poppins font-bold text-gray-900 mb-4">🔧 Quick Fixes</h3>
                  <div className="space-y-2">
                    {result.quickFixes.map((fix, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800 font-opensans">{fix}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="text-center">
                <Link href={`/${locale}/builder`} className="btn-primary !text-base !px-10 !py-4">
                  Open in Resume Builder <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
