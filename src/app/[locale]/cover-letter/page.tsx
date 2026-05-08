"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useResumeStore } from "@/lib/store";
import { getMockCoverLetter } from "@/lib/mock-ai";
import { Sparkles, Download, Loader2, FileText, RefreshCw } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import Link from "next/link";

const TONES = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "enthusiastic", label: "Enthusiastic", emoji: "🚀" },
] as const;

export default function CoverLetterPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { resumeData } = useResumeStore();
  const { personalInfo, skills } = resumeData;

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState(personalInfo.jobTitle || "");
  const [recipient, setRecipient] = useState("Hiring Manager");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"professional" | "creative" | "enthusiastic">("professional");
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await getMockCoverLetter({
        name: `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || "Your Name",
        jobTitle: position,
        company: company || "the company",
        skills,
        tone,
      });
      setLetter(result);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const name = `${personalInfo.firstName}_${personalInfo.lastName}_Cover_Letter`.replace(/\s+/g, "_");
    const content = `${personalInfo.firstName} ${personalInfo.lastName}\n${personalInfo.email} · ${personalInfo.phone}\n${personalInfo.location}\n\n${new Date().toLocaleDateString()}\n\nDear ${recipient},\n\n${letter}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />
      <div className="gradient-hero pt-28 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4">Cover Letter Builder</h1>
          <p className="text-white/80 text-lg font-opensans max-w-2xl mx-auto">
            AI-generated cover letters tailored to any job. Professional, creative, or enthusiastic tone.
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT: Inputs */}
          <div className="space-y-5">
            <div className="card p-6 space-y-4">
              <h2 className="font-poppins font-bold text-lg text-gray-900">Job Details</h2>
              <div>
                <label className="form-label">Position / Job Title</label>
                <input className="form-input" placeholder="Software Engineer" value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Company Name</label>
                <input className="form-input" placeholder="Google" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Recipient</label>
                <input className="form-input" placeholder="Hiring Manager" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Job Description (Optional)</label>
                <textarea
                  className="form-input !h-24 resize-none"
                  placeholder="Paste job description for a more tailored letter..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-poppins font-bold text-lg text-gray-900 mb-4">Tone</h2>
              <div className="grid grid-cols-3 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${tone === t.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <p className="font-poppins font-semibold text-xs text-gray-700">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={generating} className="btn-gold w-full justify-center !py-4 !text-base">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Cover Letter</>}
            </button>

            {!personalInfo.firstName && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 font-opensans">
                💡 <Link href={`/${locale}/builder`} className="font-semibold underline">Build your resume first</Link> to auto-populate your name and skills.
              </div>
            )}
          </div>

          {/* RIGHT: Preview */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-poppins font-semibold text-sm text-gray-700">Cover Letter Preview</span>
              </div>
              {letter && (
                <div className="flex gap-2">
                  <button onClick={generate} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><RefreshCw className="w-3.5 h-3.5 text-gray-500" /></button>
                  <button onClick={handleDownload} className="btn-primary !py-1.5 !px-3 !text-xs"><Download className="w-3.5 h-3.5" /> Download</button>
                </div>
              )}
            </div>

            <div className="p-6 min-h-[500px] font-opensans text-sm text-gray-800 leading-relaxed">
              {letter ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-6 text-gray-600 text-xs space-y-0.5">
                    <p className="font-semibold text-gray-900">{personalInfo.firstName} {personalInfo.lastName}</p>
                    {personalInfo.email && <p>{personalInfo.email}</p>}
                    {personalInfo.phone && <p>{personalInfo.phone}</p>}
                    <p className="mt-3">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    <p className="mt-3 font-semibold text-gray-900">Dear {recipient},</p>
                  </div>
                  <div className="whitespace-pre-line text-gray-700">{letter}</div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-gray-400">
                  <div className="text-5xl">📝</div>
                  <div>
                    <p className="font-poppins font-semibold text-gray-500">Your cover letter will appear here</p>
                    <p className="text-xs mt-1">Fill in the details and click Generate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
