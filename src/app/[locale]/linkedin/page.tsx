"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Upload, Clipboard, ArrowRight, Edit3, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, Download, Sparkles } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useResumeStore } from "@/lib/store";
import type { ParsedResume } from "@/lib/parsed-resume.types";

type Method = "pdf" | "paste";
type Phase = "idle" | "parsing" | "success";

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#0077B5] to-[#00A0DC]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────
function ResultCard({ data, locale, onReset }: { data: ParsedResume; locale: string; onReset: () => void }) {
  const { loadParsedResume } = useResumeStore();
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const p = data.personal;

  const chips = [
    { label: "Name",       ok: !!p.name,           val: p.name || "—" },
    { label: "LinkedIn",   ok: !!p.linkedin,        val: p.linkedin || "—" },
    { label: "Email",      ok: !!p.email,           val: p.email || "—" },
    { label: "Experience", ok: data.experience.length > 0, val: `${data.experience.length} jobs` },
    { label: "Education",  ok: data.education.length > 0,  val: `${data.education.length} entries` },
    { label: "Skills",     ok: data.skills.length > 0,     val: `${data.skills.length} skills` },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#0077B5]/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-[#0077B5]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-poppins font-black text-xl text-gray-900">LinkedIn Profile Parsed!</h2>
            <p className="text-sm text-gray-500">Accuracy: {data.parseAccuracy}%</p>
          </div>
          <button onClick={onReset} className="shrink-0 text-sm text-gray-400 hover:text-primary flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>

        {/* Profile preview */}
        {p.name && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#0077B5]/5 to-[#00A0DC]/5 border border-[#0077B5]/10 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0077B5] to-[#00A0DC] flex items-center justify-center text-white font-black text-2xl shrink-0">
              {p.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-poppins font-bold text-gray-900 text-lg">{p.name}</p>
              {p.jobTitle && <p className="text-sm text-gray-600 truncate">{p.jobTitle}</p>}
              {p.location && <p className="text-xs text-gray-400 mt-0.5">📍 {p.location}</p>}
            </div>
            <span className="ml-auto shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-[#0077B5] text-white">
              {data.parseAccuracy}%
            </span>
          </div>
        )}

        {/* Extracted data grid */}
        <div className="space-y-2">
          {chips.map((c) => (
            <div key={c.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${c.ok ? "text-green-500" : "text-red-400"}`}>{c.ok ? "✅" : "❌"}</span>
                <span className="text-sm text-gray-500">{c.label}</span>
              </div>
              <span className={`text-sm font-semibold font-poppins truncate max-w-[180px] ${c.ok ? "text-gray-900" : "text-gray-400"}`}>{c.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Experience preview */}
      {data.experience.length > 0 && (
        <div className="card p-5">
          <h3 className="font-poppins font-bold text-gray-900 mb-3">💼 Experience</h3>
          <div className="space-y-3">
            {data.experience.slice(0, 3).map((exp, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0 font-bold text-gray-600">{i + 1}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{exp.title || "Role"}</p>
                  <p className="text-xs text-gray-500">{exp.company} {exp.startDate && `· ${exp.startDate} – ${exp.current ? "Present" : exp.endDate}`}</p>
                </div>
              </div>
            ))}
            {data.experience.length > 3 && <p className="text-xs text-gray-400">+{data.experience.length - 3} more jobs</p>}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="card p-5">
          <h3 className="font-poppins font-bold text-gray-900 mb-3">🛠️ Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.slice(0, 15).map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-[#0077B5]/8 text-[#0077B5] text-xs font-semibold border border-[#0077B5]/20">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          {data.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{w}
            </p>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href={`/${locale}/builder`}
            onClick={() => loadParsedResume(data)}
            className="btn-primary justify-center !py-4 !text-base"
          >
            <Edit3 className="w-5 h-5" /> ✨ Edit Resume <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-[#0077B5] hover:text-[#0077B5] transition-all"
          >
            <RefreshCw className="w-5 h-5" /> Parse Another
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
function LiDropzone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${drag ? "border-[#0077B5] bg-[#0077B5]/5" : "border-gray-200 hover:border-[#0077B5]/50"}`}
      onClick={() => document.getElementById("li-file-input")?.click()}
    >
      <input id="li-file-input" type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div className="w-14 h-14 rounded-2xl bg-[#0077B5]/10 flex items-center justify-center mx-auto mb-3">
        <Upload className="w-7 h-7 text-[#0077B5]" />
      </div>
      <p className="font-poppins font-bold text-gray-900 mb-1">Drop LinkedIn PDF here</p>
      <p className="text-sm text-gray-500">or <span className="text-[#0077B5] font-semibold">click to browse</span></p>
      <p className="text-xs text-gray-400 mt-2">PDF only · Max 5MB</p>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function LinkedInPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const [method, setMethod] = useState<Method>("pdf");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pct, setPct] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [currentFilename, setCurrentFilename] = useState("");

  const steps = [
    "📥 Reading file…", "📄 Extracting text…", "🔍 Detecting sections…",
    "💼 Parsing experience…", "🛠️ Mapping skills…",
  ];

  async function runProgress() {
    for (let i = 0; i < steps.length; i++) {
      setStepLabel(steps[i]);
      setPct(10 + i * 18);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 200));
    }
  }

  async function handleFile(file: File) {
    setCurrentFilename(file.name);
    setPhase("parsing"); setPct(5); setStepLabel(steps[0]);
    const fd = new FormData(); fd.append("file", file);
    const [res] = await Promise.all([
      fetch("/api/linkedin/pdf", { method: "POST", body: fd }),
      runProgress(),
    ]);
    const json = await res.json();
    setPct(100);
    await new Promise((r) => setTimeout(r, 400));
    setResult(json.data);
    setPhase("success");
  }

  async function handlePaste() {
    if (!pasteText.trim()) return;
    setPhase("parsing"); setPct(5); setStepLabel(steps[0]);
    const [res] = await Promise.all([
      fetch("/api/linkedin/text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: pasteText }) }),
      runProgress(),
    ]);
    const json = await res.json();
    setPct(100);
    await new Promise((r) => setTimeout(r, 400));
    setResult(json.data);
    setPhase("success");
  }

  function reset() { setPhase("idle"); setResult(null); setPct(0); setPasteText(""); setCurrentFilename(""); }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />

      {/* Hero */}
      <div className="pt-28 pb-14 px-6" style={{ background: "linear-gradient(135deg, #0077B5 0%, #00A0DC 50%, #7B2D8B 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn Profile Parser
            </span>
            <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4">
              Import from LinkedIn.<br />
              <span className="text-yellow-300">Build Your Resume Free.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              Export your LinkedIn PDF or paste your profile — we'll convert it into a polished, ATS-ready resume in seconds.
            </p>
          </motion.div>
          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-6 mt-8">
            {["95% Parse Accuracy", "0 Login Required", "Instant Results"].map((s) => (
              <div key={s} className="text-white/90 text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-yellow-300" /> {s}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* How-to banner */}
              <div className="card p-5 bg-[#0077B5]/5 border-[#0077B5]/20">
                <p className="font-poppins font-bold text-[#0077B5] mb-2">📥 How to get your LinkedIn PDF</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Go to your LinkedIn profile page</li>
                  <li>Click <strong>More</strong> → <strong>Save to PDF</strong></li>
                  <li>Upload the downloaded PDF below</li>
                </ol>
              </div>

              {/* Method toggle */}
              <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
                {([["pdf", "📄 Upload PDF", Upload], ["paste", "📋 Paste Text", Clipboard]] as const).map(([m, label, Icon]) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === m ? "bg-white shadow text-[#0077B5]" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {/* PDF method */}
              {method === "pdf" && <LiDropzone onFile={handleFile} />}

              {/* Paste method */}
              {method === "paste" && (
                <div className="card p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paste your LinkedIn profile text</label>
                    <p className="text-xs text-gray-400 mb-2">Open your LinkedIn profile → Ctrl+A → Ctrl+C → paste below</p>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="John Smith&#10;Software Engineer at Google&#10;San Francisco, CA&#10;&#10;Experience&#10;Google&#10;Senior Software Engineer&#10;Jan 2022 – Present&#10;..."
                      rows={10}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-[#0077B5]/30 focus:border-[#0077B5]"
                    />
                    <p className="text-xs text-gray-400 mt-1">{pasteText.length.toLocaleString()} characters</p>
                  </div>
                  <button
                    onClick={handlePaste}
                    disabled={pasteText.trim().length < 50}
                    className="w-full btn-primary justify-center !py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" /> Parse Profile
                  </button>
                </div>
              )}

              {/* Why LinkedIn PDF notice */}
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500">
                  🔒 <strong>100% private</strong> — we never store your data or contact LinkedIn.
                  Files are processed in-memory and discarded immediately.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── PARSING ── */}
          {phase === "parsing" && (
            <motion.div key="parsing" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card p-10 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0077B5, #00A0DC)" }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 23.2 24 22.222 24h.003z"/></svg>
              </div>
              <h2 className="font-poppins font-black text-2xl text-gray-900 mb-1">Parsing LinkedIn Profile…</h2>
              {currentFilename && <p className="text-sm text-gray-500 mb-5">{currentFilename}</p>}
              <ProgressBar pct={pct} />
              <p className="text-sm text-gray-500 mt-3">{stepLabel}</p>
              <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {phase === "success" && result && (
            <ResultCard data={result} locale={locale} onReset={reset} />
          )}

        </AnimatePresence>
      </div>

      <Footer locale={locale} />
    </div>
  );
}
