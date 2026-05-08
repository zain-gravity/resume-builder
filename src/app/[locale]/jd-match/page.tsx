"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Sparkles, CheckCircle, XCircle, AlertCircle, TrendingUp, Loader2, Copy, Zap } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useResumeStore } from "@/lib/store";
import Link from "next/link";

interface MatchResult {
  overallScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  partialKeywords: string[];
  sectionScores: { name: string; score: number; tip: string }[];
  topRecommendations: string[];
  strengths: string[];
}

function analyzeJDMatch(resumeText: string, jd: string): MatchResult {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jd.toLowerCase();

  // Extract meaningful keywords from JD (words > 3 chars, not stop words)
  const stopWords = new Set(["with", "that", "this", "will", "have", "from", "they", "been", "their", "more", "than", "also", "into", "your", "must", "able", "each", "work", "role", "team", "strong", "excellent", "ability", "experience"]);
  const jdWords = [...new Set(
    jdLower.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))
  )];

  // Score each keyword
  const matched: string[] = [];
  const missing: string[] = [];
  const partial: string[] = [];

  jdWords.slice(0, 40).forEach(word => {
    if (resumeLower.includes(word)) {
      matched.push(word);
    } else if (resumeLower.includes(word.substring(0, Math.max(4, word.length - 2)))) {
      partial.push(word);
    } else {
      missing.push(word);
    }
  });

  const keywordScore = Math.round(((matched.length + partial.length * 0.5) / Math.max(jdWords.slice(0, 40).length, 1)) * 40);

  // Section analysis
  const hasQuantMetrics = /\d+%|\$\d+|\d+[kKmM]|\d+ (people|users|clients|team|years)/i.test(resumeText);
  const hasSummary = resumeText.toLowerCase().includes("summary") || resumeText.length > 200;
  const hasSkills = resumeText.toLowerCase().includes("skill") || resumeText.toLowerCase().includes("proficient");
  const hasExp = resumeText.toLowerCase().includes("experience") || resumeText.toLowerCase().includes("engineer") || resumeText.toLowerCase().includes("manager");

  const summaryScore = hasSummary ? 85 : 50;
  const skillsScore = Math.min(100, keywordScore * 2 + (hasSkills ? 20 : 0));
  const expScore = hasExp ? Math.min(100, keywordScore + 40) : 40;
  const metricsScore = hasQuantMetrics ? 90 : 45;

  const sectionScores = [
    { name: "Keywords Match", score: Math.min(100, keywordScore * 2.5), tip: missing.length > 5 ? `Add: ${missing.slice(0, 3).join(", ")}` : "Great keyword coverage!" },
    { name: "Professional Summary", score: summaryScore, tip: summaryScore < 75 ? "Add a targeted summary mentioning the role" : "Summary looks strong" },
    { name: "Skills Section", score: skillsScore, tip: skillsScore < 70 ? "Add more role-specific skills from the JD" : "Skills section is well-aligned" },
    { name: "Experience Relevance", score: expScore, tip: expScore < 70 ? "Highlight accomplishments that match the JD requirements" : "Experience is well-matched" },
    { name: "Quantified Impact", score: metricsScore, tip: !hasQuantMetrics ? "Add numbers: % improvements, $ saved, team sizes, etc." : "Good use of metrics!" },
  ];

  const overallScore = Math.min(98, Math.round(
    sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length
  ));

  const topRecommendations: string[] = [];
  if (missing.length > 0) topRecommendations.push(`Add these missing keywords: "${missing.slice(0, 4).join('", "')}"`);
  if (!hasQuantMetrics) topRecommendations.push("Quantify achievements — use numbers, percentages, and dollar amounts");
  if (!hasSummary) topRecommendations.push("Add a tailored professional summary that mirrors the job description language");
  if (skillsScore < 70) topRecommendations.push("Update your Skills section to include job-specific technologies and tools");
  topRecommendations.push("Mirror exact phrases from the job description in your bullet points");

  const strengths: string[] = [];
  if (matched.length > 5) strengths.push(`Strong keyword overlap (${matched.length} keywords matched)`);
  if (hasQuantMetrics) strengths.push("Resume contains quantified achievements");
  if (hasSummary) strengths.push("Professional summary detected");
  if (hasExp) strengths.push("Relevant work experience present");

  return {
    overallScore,
    matchedKeywords: matched.slice(0, 20),
    missingKeywords: missing.slice(0, 15),
    partialKeywords: partial.slice(0, 10),
    sectionScores,
    topRecommendations: topRecommendations.slice(0, 5),
    strengths,
  };
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent Match! 🎯" : score >= 60 ? "Good Match ⚡" : "Needs Improvement ⚠️";
  const r = 58, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke="#F3F4F6" strokeWidth="14" />
        <motion.circle
          cx="75" cy="75" r={r} fill="none"
          stroke={color} strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: "75px 75px", rotate: "-90deg" }}
        />
        <text x="75" y="70" textAnchor="middle" fontSize="34" fontWeight="900" fill={color} fontFamily="Poppins">{score}</text>
        <text x="75" y="88" textAnchor="middle" fontSize="12" fill="#9CA3AF" fontFamily="Open Sans">/ 100</text>
      </svg>
      <p className="font-poppins font-bold text-lg mt-1" style={{ color }}>{label}</p>
    </div>
  );
}

function MiniBar({ score, label, tip }: { score: number; label: string; tip: string }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 font-poppins">{label}</span>
        <span className="text-xs font-bold" style={{ color: score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444" }}>{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-gray-500 font-opensans">{tip}</p>
    </div>
  );
}

export default function JDMatchPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { resumeData } = useResumeStore();
  const [jd, setJD] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildResumeText = () => {
    const { personalInfo, summary, workExperience, education, skills, certifications } = resumeData;
    return [
      `${personalInfo.firstName} ${personalInfo.lastName}`,
      personalInfo.jobTitle,
      personalInfo.email,
      summary,
      workExperience.map(e => `${e.title} ${e.company} ${e.bullets.join(" ")}`).join(" "),
      education.map(e => `${e.school} ${e.degree} ${e.field}`).join(" "),
      skills.join(" "),
      certifications.map(c => c.name).join(" "),
    ].filter(Boolean).join(" ");
  };

  const analyze = async () => {
    if (!jd.trim()) return;
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1600));
    const resumeText = buildResumeText();
    setResult(analyzeJDMatch(resumeText, jd));
    setAnalyzing(false);
  };

  const copyMissingKeywords = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.missingKeywords.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasResume = resumeData.personalInfo.firstName || resumeData.summary || resumeData.skills.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />

      {/* Hero */}
      <div className="gradient-hero pt-28 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
            🎯 AI Job Matcher
          </span>
          <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4">
            Job Description Matcher
          </h1>
          <p className="text-white/80 text-lg font-opensans max-w-2xl mx-auto">
            Paste any job description and see exactly how well your resume matches. Get a score,
            missing keywords, and specific fixes to beat the ATS.
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        {/* Resume Status Banner */}
        {!hasResume && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-poppins font-semibold text-amber-800">No resume found</p>
              <p className="text-sm text-amber-700 font-opensans mt-0.5">
                For best results, <Link href={`/${locale}/builder`} className="underline font-semibold">build your resume first</Link>. Otherwise we&apos;ll analyze based on what&apos;s available.
              </p>
            </div>
          </motion.div>
        )}

        {hasResume && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-poppins font-semibold text-green-800">Resume loaded ✓</p>
              <p className="text-sm text-green-700 font-opensans mt-0.5">
                Your current resume ({resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}) will be compared against the job description.
              </p>
            </div>
          </motion.div>
        )}

        {/* JD Input */}
        <div className="card p-6">
          <h2 className="font-poppins font-bold text-xl text-gray-900 mb-2">Paste Job Description</h2>
          <p className="text-sm text-gray-500 font-opensans mb-4">Copy and paste the full job posting — the more detail, the better the analysis.</p>
          <textarea
            className="form-input !h-48 resize-none"
            placeholder="Paste the full job description here...&#10;&#10;Example:&#10;We're looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS. You will lead a team of 4 engineers, architect scalable systems..."
            value={jd}
            onChange={(e) => setJD(e.target.value)}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">{jd.length} characters</span>
            <button
              onClick={analyze}
              disabled={!jd.trim() || analyzing}
              className="btn-primary !py-3 !px-8 !text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Match...</>
              ) : (
                <><Target className="w-4 h-4" /> Analyze Match</>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score Overview */}
              <div className="card p-8">
                <h2 className="font-poppins font-bold text-xl text-gray-900 mb-6 text-center">Your Match Score</h2>
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                  <ScoreGauge score={result.overallScore} />
                  <div className="flex-1 space-y-4">
                    {result.sectionScores.map(s => (
                      <MiniBar key={s.name} score={s.score} label={s.name} tip={s.tip} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Missing */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Matched */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-poppins font-bold text-gray-900">Matched Keywords ({result.matchedKeywords.length})</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matchedKeywords.map(kw => (
                      <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">{kw}</span>
                    ))}
                    {result.partialKeywords.map(kw => (
                      <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">~{kw}</span>
                    ))}
                  </div>
                  {result.strengths.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      {result.strengths.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <Zap className="w-3 h-3 text-green-500 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missing */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <h3 className="font-poppins font-bold text-gray-900">Missing Keywords ({result.missingKeywords.length})</h3>
                    </div>
                    <button onClick={copyMissingKeywords} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                      <Copy className="w-3 h-3" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map(kw => (
                      <span key={kw} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">{kw}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Add these to your resume where relevant to improve your match score.</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-poppins font-bold text-gray-900">Top Recommendations to Improve Your Score</h3>
                </div>
                <div className="space-y-3">
                  {result.topRecommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-blue-800 font-opensans">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${locale}/builder`} className="btn-primary !text-base !px-10 !py-4">
                  <Sparkles className="w-5 h-5" /> Update My Resume
                </Link>
                <button onClick={() => { setResult(null); setJD(""); }} className="px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
                  Try Another Job
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
