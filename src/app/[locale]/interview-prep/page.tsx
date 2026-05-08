"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Copy, CheckCircle, GraduationCap, Lightbulb } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useResumeStore } from "@/lib/store";
import Link from "next/link";

interface InterviewQuestion {
  category: string;
  question: string;
  hint: string;
  type: "behavioral" | "technical" | "situational" | "culture";
}

const TYPE_COLORS: Record<string, string> = {
  behavioral: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-purple-50 text-purple-700 border-purple-200",
  situational: "bg-amber-50 text-amber-700 border-amber-200",
  culture: "bg-green-50 text-green-700 border-green-200",
};

const TYPE_ICONS: Record<string, string> = {
  behavioral: "🎭",
  technical: "⚙️",
  situational: "🌿",
  culture: "🤝",
};

function generateInterviewQuestions(jobTitle: string, skills: string[], experience: { title: string; company: string }[]): InterviewQuestion[] {
  const latestJob = experience[0]?.title || jobTitle || "this role";
  const topSkills = skills.slice(0, 3).join(", ") || "your key skills";
  const company = experience[0]?.company || "your previous company";

  const questions: InterviewQuestion[] = [
    // Behavioral
    {
      category: "Experience",
      question: `Tell me about a time you faced a major challenge in your role as ${latestJob}. How did you handle it?`,
      hint: `Use the STAR method: Situation → Task → Action → Result. Quantify the outcome if possible.`,
      type: "behavioral",
    },
    {
      category: "Leadership",
      question: "Describe a situation where you had to lead a project with a tight deadline. What was your approach?",
      hint: "Focus on how you prioritized tasks, communicated with stakeholders, and what the outcome was.",
      type: "behavioral",
    },
    {
      category: "Conflict",
      question: "Tell me about a time you disagreed with a colleague or manager. How did you resolve it?",
      hint: "Show that you handle conflict professionally, listen to others, and find constructive solutions.",
      type: "behavioral",
    },
    {
      category: "Failure",
      question: "Describe a project that didn't go as planned. What did you learn from it?",
      hint: "Be honest about what went wrong, but focus more on your learnings and how you course-corrected.",
      type: "behavioral",
    },
    // Technical
    {
      category: "Core Skills",
      question: `How have you used ${topSkills} in a real-world project? Walk me through a specific example.`,
      hint: `Prepare a concrete example from your time at ${company}. Include technical decisions you made.`,
      type: "technical",
    },
    {
      category: "Problem Solving",
      question: `What's the most technically complex problem you solved related to your work as a ${latestJob}?`,
      hint: "Break down the complexity, your approach, and why your solution was the right choice.",
      type: "technical",
    },
    {
      category: "Architecture",
      question: "Walk me through how you would design a scalable system for [product feature]. What trade-offs would you consider?",
      hint: "Demonstrate systems thinking — mention scalability, reliability, performance, and cost considerations.",
      type: "technical",
    },
    // Situational
    {
      category: "Prioritization",
      question: "Imagine you have 3 critical tasks due on the same day with no ability to delegate. How do you prioritize?",
      hint: "Show your decision-making framework — urgency vs. importance, stakeholder impact, dependencies.",
      type: "situational",
    },
    {
      category: "Ambiguity",
      question: "You're given a goal but no clear roadmap. How do you approach building a plan from scratch?",
      hint: "Emphasize research, stakeholder alignment, breaking down into milestones, and iterating.",
      type: "situational",
    },
    {
      category: "Stakes",
      question: "How would you handle a critical bug or issue discovered just before a major release or deadline?",
      hint: "Communicate the process: escalation, triage, fix, post-mortem. Show calm under pressure.",
      type: "situational",
    },
    // Culture
    {
      category: "Motivation",
      question: "Why are you interested in this role and our company specifically?",
      hint: "Research the company's mission, recent news, and products. Show genuine alignment with their values.",
      type: "culture",
    },
    {
      category: "Growth",
      question: "Where do you see yourself professionally in 3-5 years?",
      hint: "Show ambition that aligns with the company's trajectory. Mention skills you want to develop.",
      type: "culture",
    },
    {
      category: "Team Fit",
      question: "How do you prefer to collaborate with your team and manager? What does your ideal work environment look like?",
      hint: "Be specific and authentic. Match what you know about the company culture from your research.",
      type: "culture",
    },
    {
      category: "Strengths",
      question: `What would your manager at ${company} say is your biggest strength and area for growth?`,
      hint: "Be balanced — pick a real strength with evidence, and choose a growth area that's genuine but not a critical job skill.",
      type: "culture",
    },
  ];

  return questions;
}

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(q.question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-sm font-black text-primary">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[q.type]}`}>
              {TYPE_ICONS[q.type]} {q.type.charAt(0).toUpperCase() + q.type.slice(1)}
            </span>
            <span className="text-xs text-gray-400">{q.category}</span>
          </div>
          <p className="font-poppins font-semibold text-gray-900 text-sm leading-snug">{q.question}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); copy(); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100 px-5 py-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">💡 How to Answer</p>
              <p className="text-sm text-gray-700 font-opensans leading-relaxed">{q.hint}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

const CATEGORIES = ["All", "behavioral", "technical", "situational", "culture"];

export default function InterviewPrepPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { resumeData } = useResumeStore();
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [jobTitle, setJobTitle] = useState(resumeData.personalInfo.jobTitle || "");

  const generate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const qs = generateInterviewQuestions(
      jobTitle,
      resumeData.skills,
      resumeData.workExperience.map(e => ({ title: e.title, company: e.company }))
    );
    setQuestions(qs);
    setLoading(false);
  };

  const filtered = questions?.filter(q => filter === "All" || q.type === filter) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />

      <div className="gradient-hero pt-28 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
            🎓 Interview Prep
          </span>
          <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4">
            Interview Question Generator
          </h1>
          <p className="text-white/80 text-lg font-opensans max-w-2xl mx-auto">
            Get personalized interview questions based on your resume and role. Practice with AI-guided hints to ace your next interview.
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Input */}
        <div className="card p-6">
          <h2 className="font-poppins font-bold text-xl text-gray-900 mb-4">Customize Your Prep</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Target Job Title</label>
              <input
                className="form-input"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Resume Loaded</label>
              <div className={`form-input flex items-center gap-2 ${resumeData.personalInfo.firstName ? "text-green-700 bg-green-50 border-green-200" : "text-gray-400"}`}>
                {resumeData.personalInfo.firstName ? (
                  <><CheckCircle className="w-4 h-4 text-green-500" /> {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}&apos;s Resume</>
                ) : (
                  <><Link href={`/${locale}/builder`} className="text-primary underline">Build resume first</Link> for personalized Qs</>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="btn-gold w-full justify-center !py-3.5 !text-base"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating questions...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Interview Questions</>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        {questions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 gap-4">
            {CATEGORIES.slice(1).map(cat => {
              const count = questions.filter(q => q.type === cat).length;
              return (
                <div key={cat} className="card p-4 text-center">
                  <p className="text-2xl mb-1">{TYPE_ICONS[cat]}</p>
                  <p className="font-poppins font-black text-2xl text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 capitalize">{cat}</p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Filter */}
        {questions && (
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${filter === cat ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary bg-white"}`}
              >
                {cat === "All" ? "All Questions" : `${TYPE_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </button>
            ))}
          </div>
        )}

        {/* Questions */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} />
            ))}
          </div>
        )}

        {/* Tips */}
        {questions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="font-poppins font-bold text-gray-900">Pro Interview Tips</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: "⏱️", tip: "Use the STAR method (Situation, Task, Action, Result) for all behavioral questions" },
                { icon: "📊", tip: "Quantify every achievement — use percentages, dollar amounts, team sizes" },
                { icon: "🔍", tip: "Research the company's latest news, products, and culture before the interview" },
                { icon: "❓", tip: "Prepare 3-5 thoughtful questions to ask the interviewer" },
              ].map(({ icon, tip }, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                  <span className="text-xl">{icon}</span>
                  <p className="text-sm text-blue-800 font-opensans">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <Footer locale={locale} />
    </div>
  );
}
