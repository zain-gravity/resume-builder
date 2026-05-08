"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Edit3, RefreshCw, AlertCircle, CheckCircle, Sparkles, Shield, Zap, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import UploadDropzone from "@/components/upload/UploadDropzone";
import ParserProgress from "@/components/upload/ParserProgress";
import FormatSelector from "@/components/upload/FormatSelector";
import { PARSE_STEPS, type ParsedResume } from "@/lib/parsed-resume.types";
import { useResumeStore } from "@/lib/store";

type UploadPhase = "idle" | "parsing" | "success";

function ParseQualityBadge({ score, warnings }: { score: number; warnings: string[] }) {
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-gold" : "text-red-500";
  const bg = score >= 80 ? "bg-green-50 border-green-200" : score >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const label = score >= 80 ? "Excellent ✅" : score >= 60 ? "Good ⚡" : "Needs Review ⚠️";

  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-poppins font-bold text-gray-900">Parse Quality</span>
        <span className={`font-poppins font-black text-2xl ${color}`}>{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ background: score >= 80 ? "#28A745" : score >= 60 ? "#F18F01" : "#DC3545" }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className={`text-sm font-semibold ${color} mb-2`}>{label}</p>
      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ParsedSummaryCard({ data }: { data: ParsedResume }) {
  const { personal, experience, education, skills } = data;
  const items = [
    { label: "Name",       found: !!personal.name,  value: personal.name || "Not detected" },
    { label: "Email",      found: !!personal.email, value: personal.email || "Not detected" },
    { label: "Phone",      found: !!personal.phone, value: personal.phone || "Not detected" },
    { label: "Experience", found: experience.length > 0, value: `${experience.length} job${experience.length !== 1 ? "s" : ""} extracted` },
    { label: "Education",  found: education.length > 0,  value: `${education.length} entr${education.length !== 1 ? "ies" : "y"} found` },
    { label: "Skills",     found: skills.length > 0,     value: `${skills.length} skill${skills.length !== 1 ? "s" : ""} detected` },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${item.found ? "text-success" : "text-red-400"}`}>
              {item.found ? "✅" : "❌"}
            </span>
            <span className="text-sm text-gray-600 font-opensans">{item.label}</span>
          </div>
          <span className={`text-sm font-poppins font-semibold ${item.found ? "text-gray-900" : "text-gray-400"}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function UploadPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { loadParsedResume } = useResumeStore();

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [parseStep, setParseStep] = useState(0);
  const [parsePercent, setParsePercent] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isLowQuality, setIsLowQuality] = useState(false);
  const [rawPreview, setRawPreview] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const simulateProgress = useCallback(async (onStep: (step: number, pct: number) => void) => {
    for (let i = 0; i < PARSE_STEPS.length; i++) {
      onStep(i, PARSE_STEPS[i].percent);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setCurrentFile(file);
      setPhase("parsing");
      setParseStep(0);
      setParsePercent(10);

      const progressPromise = simulateProgress((step, pct) => {
        setParseStep(step);
        setParsePercent(pct);
      });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const [res] = await Promise.all([
          fetch("/api/parse-resume", { method: "POST", body: formData }),
          progressPromise,
        ]);

        const json = await res.json();

        // API always returns success:true — even for partial parses
        // The only true errors are 400 (file too large/no file)
        if (res.status === 400) {
          throw new Error(json.error || "Upload failed");
        }

        setIsLowQuality(json.meta?.isLowQuality || false);
        setRawPreview(json.rawPreview || "");
        setParsePercent(100);
        await new Promise((r) => setTimeout(r, 400));
        setParsedData(json.data);
        setPhase("success");
      } catch (err) {
        // Show as partial success — user can still go to builder
        console.error("Upload error:", err);
        setParsedData({
          id: "manual",
          filename: file.name,
          parsedAt: new Date().toISOString(),
          parseAccuracy: 0,
          warnings: ["⚠️ Could not parse file. Open the Builder to fill in your details."],
          personal: { name: "", email: "", phone: "", linkedin: "", location: "", portfolio: "", jobTitle: "" },
          summary: "", experience: [], education: [], skills: [], certifications: [],
        });
        setIsLowQuality(true);
        setParsePercent(100);
        await new Promise((r) => setTimeout(r, 400));
        setPhase("success");
      }
    },
    [simulateProgress]
  );

  const handleLoadIntoBuilder = () => {
    if (!parsedData) return;
    loadParsedResume(parsedData);
  };

  const reset = () => {
    setPhase("idle");
    setParseStep(0);
    setParsePercent(0);
    setParsedData(null);
    setCurrentFile(null);
    setIsLowQuality(false);
    setRawPreview("");
    setShowRaw(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />

      {/* Hero */}
      <div className="gradient-hero pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
              📁 Upload & Parse — 100% Free
            </span>
            <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4 leading-tight">
              Parse Any Resume.<br />
              <span className="text-gold">Edit &amp; Download Free.</span>
            </h1>
            <p className="text-white/80 text-lg font-opensans max-w-2xl mx-auto">
              Upload your existing resume and we'll automatically extract all your data.
              Edit it with our AI builder, then download in any format — no sign-up required.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center mt-6"
          >
            {[
              { icon: Shield, label: "No data stored" },
              { icon: Zap, label: "Instant parsing" },
              { icon: Sparkles, label: "AI-ready edit" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-semibold">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">

          {/* ── IDLE: Show Upload Drop Zone ── */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <UploadDropzone onFileAccepted={handleFile} />

              {/* Supported formats info */}
              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {[
                  { fmt: "PDF", desc: "Most common format. Works best with text-based PDFs.", icon: "📄" },
                  { fmt: "DOCX / DOC", desc: "Microsoft Word format — highest parse accuracy.", icon: "📝" },
                  { fmt: "TXT", desc: "Plain text resume — 100% parse accuracy.", icon: "🗒️" },
                ].map((item) => (
                  <div key={item.fmt} className="card p-4 text-center">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="font-poppins font-bold text-sm text-gray-900">{item.fmt}</p>
                    <p className="text-xs text-gray-500 mt-1 font-opensans">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PARSING: Progress ── */}
          {phase === "parsing" && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="card p-10 text-center"
            >
              <div className="mb-8">
                <div className="text-5xl mb-3">🔍</div>
                <h2 className="font-poppins font-black text-2xl text-gray-900 mb-1">Parsing your resume…</h2>
                <p className="text-gray-500 text-sm font-opensans">Extracting your experience, skills, and education</p>
              </div>
              <ParserProgress
                currentStep={parseStep}
                percent={parsePercent}
                filename={currentFile?.name}
              />
            </motion.div>
          )}

          {/* ── SUCCESS: Results ── */}
          {phase === "success" && parsedData && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* Header */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLowQuality ? "bg-amber-100" : "bg-green-100"}`}>
                    {isLowQuality
                      ? <AlertCircle className="w-6 h-6 text-amber-500" />
                      : <CheckCircle className="w-6 h-6 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-poppins font-black text-xl text-gray-900">
                      {isLowQuality ? "Partial Parse Complete" : "Resume Parsed!"}
                    </h2>
                    <p className="text-sm text-gray-500 truncate">{parsedData.filename} · {new Date(parsedData.parsedAt).toLocaleTimeString()}</p>
                  </div>
                  <button onClick={reset} className="shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
                    <RefreshCw className="w-4 h-4" /> New file
                  </button>
                </div>

                {/* Name avatar row */}
                {parsedData.personal.name ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-lg shrink-0">
                      {parsedData.personal.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-poppins font-bold text-gray-900">{parsedData.personal.name}</p>
                      <p className="text-xs text-gray-500 truncate">{[parsedData.personal.email, parsedData.personal.phone].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="ml-auto shrink-0 badge badge-primary text-xs">{parsedData.parseAccuracy}% parsed</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl mb-4 text-sm text-amber-700">
                    👤 Name not detected — you can add it in the Builder
                  </div>
                )}

                {/* Parse results list */}
                <ParsedSummaryCard data={parsedData} />
              </div>

              {/* Quality badge */}
              <ParseQualityBadge score={parsedData.parseAccuracy} warnings={parsedData.warnings} />

              {/* CTA */}
              <div className="card p-6">
                <h3 className="font-poppins font-bold text-gray-900 mb-1">📊 Parse Results</h3>
                <p className="text-sm text-gray-500 mb-4 font-opensans">
                  {parsedData.parseAccuracy >= 60
                    ? "Good extraction! Review and edit in the Builder."
                    : "Some fields need manual entry. Open the Builder to complete your resume."}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Link
                    href={`/${locale}/builder`}
                    onClick={handleLoadIntoBuilder}
                    className="btn-primary justify-center !py-4 !text-base"
                  >
                    <Edit3 className="w-5 h-5" />
                    ✨ Continue Editing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={reset}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-primary hover:text-primary transition-all"
                  >
                    <RefreshCw className="w-5 h-5" /> 🔄 Try Another File
                  </button>
                </div>
              </div>

              {/* Raw Text Preview */}
              {rawPreview && (
                <div className="card p-5">
                  <button
                    onClick={() => setShowRaw((v) => !v)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary transition-colors w-full"
                  >
                    {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showRaw ? "Hide" : "👀 View"} Extracted Raw Text
                    <span className="ml-auto text-xs text-gray-400 font-normal">
                      {rawPreview.length.toLocaleString()} chars extracted
                    </span>
                  </button>
                  {showRaw && (
                    <div>
                      <pre className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto border border-gray-100">
                        {rawPreview}
                      </pre>
                      <p className="text-xs text-gray-400 mt-2">First 2,000 characters extracted</p>
                    </div>
                  )}
                </div>
              )}

              {!rawPreview && (
                <div className="card p-5 bg-amber-50 border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-1">📋 No text could be extracted</p>
                  <p className="text-xs text-amber-700">
                    This may be a scanned/image PDF. Open the Builder and fill in your details manually — it only takes 5 minutes!
                  </p>
                </div>
              )}

              {/* Download */}
              <div className="card p-6">
                <FormatSelector resumeData={parsedData} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Footer locale={locale} />
    </div>
  );
}
