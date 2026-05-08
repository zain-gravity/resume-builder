"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Copy, CheckCircle, Globe, Mail, Phone, MapPin, Linkedin, ExternalLink } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useResumeStore } from "@/lib/store";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

function WebResume() {
  const { resumeData } = useResumeStore();
  const { personalInfo, summary, workExperience, education, skills, certifications } = resumeData;

  if (!personalInfo.firstName) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="font-poppins font-bold text-2xl text-gray-900 mb-2">No Resume Yet</h2>
        <p className="text-gray-500 mb-6">Build your resume first, then share it as a beautiful web page.</p>
        <Link href="/en/builder" className="btn-primary">Build My Resume</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-elevated overflow-hidden">
      {/* Header */}
      <div className="gradient-hero px-8 py-10">
        <h1 className="font-poppins font-black text-4xl text-white mb-1">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-white/80 text-xl font-opensans mb-4">{personalInfo.jobTitle}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />{personalInfo.email}
            </a>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1.5 text-white/80"><Phone className="w-4 h-4" />{personalInfo.phone}</span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1.5 text-white/80"><MapPin className="w-4 h-4" />{personalInfo.location}</span>
          )}
          {personalInfo.linkedin && (
            <a href={`https://${personalInfo.linkedin.replace("https://", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
              <Linkedin className="w-4 h-4" />LinkedIn
            </a>
          )}
          {personalInfo.portfolio && (
            <a href={`https://${personalInfo.portfolio.replace("https://", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors">
              <Globe className="w-4 h-4" />Portfolio
            </a>
          )}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Summary */}
        {summary && (
          <section>
            <h2 className="font-poppins font-bold text-lg text-gray-900 border-b-2 border-primary pb-2 mb-4">Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed font-opensans">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {workExperience.length > 0 && (
          <section>
            <h2 className="font-poppins font-bold text-lg text-gray-900 border-b-2 border-primary pb-2 mb-4">Work Experience</h2>
            <div className="space-y-6">
              {workExperience.map(exp => (
                <div key={exp.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-poppins font-bold text-gray-900">{exp.title}</h3>
                      <p className="text-gray-600 text-sm">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                      {formatDate(exp.startDate)} — {exp.current ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.description ? (
                    <p className="text-sm text-gray-700 leading-relaxed">{exp.description}</p>
                  ) : (
                    <ul className="space-y-1">
                      {exp.bullets.filter(b => b.trim()).map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary mt-1 shrink-0">•</span>{b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <h2 className="font-poppins font-bold text-lg text-gray-900 border-b-2 border-primary pb-2 mb-4">Education</h2>
            <div className="space-y-4">
              {education.map(edu => (
                <div key={edu.id} className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-poppins font-bold text-gray-900">{edu.school}</h3>
                    <p className="text-gray-600 text-sm">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</p>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h2 className="font-poppins font-bold text-lg text-gray-900 border-b-2 border-primary pb-2 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section>
            <h2 className="font-poppins font-bold text-lg text-gray-900 border-b-2 border-primary pb-2 mb-4">Certifications</h2>
            <div className="space-y-2">
              {certifications.map(cert => (
                <div key={cert.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                    <p className="text-xs text-gray-500">{cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ""}</p>
                  </div>
                  {cert.url && <ExternalLink className="w-4 h-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">Created with <span className="text-primary font-semibold">ResumeAI</span> · resumeai.com</p>
      </div>
    </div>
  );
}

export default function ShareResumePage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { resumeData } = useResumeStore();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const name = resumeData.personalInfo.firstName
    ? `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`
    : "Your Resume";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />

      <div className="gradient-hero pt-28 pb-12 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
            🌐 Web Resume
          </span>
          <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-3">
            {name}
          </h1>
          <p className="text-white/80 font-opensans mb-6">Share your professional profile as a beautiful web page</p>

          {/* Share Bar */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl p-2 max-w-lg mx-auto border border-white/30">
            <Link2 className="w-4 h-4 text-white/70 ml-2 shrink-0" />
            <p className="flex-1 text-white/90 text-sm font-mono truncate text-left">{shareUrl}</p>
            <button
              onClick={copyLink}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-green-500 text-white" : "bg-white text-primary hover:bg-white/90"}`}
            >
              {copied ? <><CheckCircle className="w-4 h-4 inline mr-1" />Copied!</> : <><Copy className="w-4 h-4 inline mr-1" />Copy Link</>}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-3xl mx-auto px-6 py-4 flex gap-3 flex-wrap justify-center">
        <Link href={`/${locale}/builder`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
          ✏️ Edit Resume
        </Link>
        <Link href={`/${locale}/jd-match`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
          🎯 Match to Job
        </Link>
        <Link href={`/${locale}/cover-letter`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
          ✉️ Cover Letter
        </Link>
      </div>

      {/* Web Resume Preview */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <WebResume />
      </div>

      <Footer locale={locale} />
    </div>
  );
}
