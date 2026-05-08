"use client";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, TrendingUp, User, FileText, Briefcase, Wrench, Award } from "lucide-react";
import { useResumeStore } from "@/lib/store";

interface ScoreCategory {
  name: string;
  icon: React.ElementType;
  score: number;
  maxScore: number;
  status: "excellent" | "good" | "needs-work";
  feedback: string;
  tips: string[];
}

function getCategoryScore(category: string, resumeData: ReturnType<typeof useResumeStore.getState>["resumeData"]): ScoreCategory {
  const { personalInfo, summary, workExperience, education, skills } = resumeData;

  switch (category) {
    case "contact": {
      let score = 0;
      if (personalInfo.firstName && personalInfo.lastName) score += 25;
      if (personalInfo.email) score += 25;
      if (personalInfo.phone) score += 20;
      if (personalInfo.location) score += 15;
      if (personalInfo.linkedin) score += 10;
      if (personalInfo.portfolio) score += 5;
      return {
        name: "Contact Info",
        icon: User,
        score,
        maxScore: 100,
        status: score >= 80 ? "excellent" : score >= 60 ? "good" : "needs-work",
        feedback: score >= 80 ? "Complete contact info!" : score >= 60 ? "Missing a few details" : "Add more contact information",
        tips: [
          !personalInfo.linkedin ? "Add your LinkedIn URL — recruiters always check" : "",
          !personalInfo.portfolio ? "Add portfolio/GitHub to stand out" : "",
          !personalInfo.phone ? "Add phone number" : "",
        ].filter(Boolean),
      };
    }
    case "summary": {
      const len = summary.trim().length;
      const wordCount = summary.trim().split(/\s+/).filter(Boolean).length;
      let score = 0;
      if (len > 0) score += 30;
      if (wordCount >= 30) score += 25;
      if (wordCount >= 60) score += 20;
      if (/\d+/.test(summary)) score += 15; // has numbers
      if (/year|experience|proven|result|achiev/i.test(summary)) score += 10;
      return {
        name: "Summary",
        icon: FileText,
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 80 ? "excellent" : score >= 50 ? "good" : "needs-work",
        feedback: score >= 80 ? "Strong professional summary!" : score >= 50 ? "Summary could be more impactful" : "Add a professional summary",
        tips: [
          !summary ? "Write a 2-3 sentence professional summary" : "",
          wordCount < 30 ? "Expand your summary to 50-80 words" : "",
          !/\d+/.test(summary) ? "Add a quantified achievement (e.g. '5+ years', '40% growth')" : "",
        ].filter(Boolean),
      };
    }
    case "experience": {
      const jobCount = workExperience.length;
      let score = 0;
      if (jobCount >= 1) score += 30;
      if (jobCount >= 2) score += 20;
      const hasBullets = workExperience.every(e => e.bullets.filter(b => b.trim()).length >= 2);
      if (hasBullets) score += 25;
      const hasMetrics = workExperience.some(e => e.bullets.some(b => /\d+%|\$\d+|\d+[kKmM]|\d+ (people|team|users)/i.test(b)));
      if (hasMetrics) score += 25;
      return {
        name: "Experience",
        icon: Briefcase,
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 80 ? "excellent" : score >= 50 ? "good" : "needs-work",
        feedback: score >= 80 ? "Well-documented experience!" : score >= 50 ? "Experience section can be stronger" : "Add more work experience",
        tips: [
          jobCount === 0 ? "Add at least 1 work experience entry" : "",
          !hasBullets ? "Add 2-4 bullet points per job entry" : "",
          !hasMetrics ? "Quantify impact: % improvements, $ amounts, team sizes" : "",
        ].filter(Boolean),
      };
    }
    case "skills": {
      const count = skills.length;
      let score = 0;
      if (count >= 3) score += 30;
      if (count >= 6) score += 25;
      if (count >= 9) score += 25;
      if (count >= 12) score += 20;
      return {
        name: "Skills",
        icon: Wrench,
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 80 ? "excellent" : score >= 50 ? "good" : "needs-work",
        feedback: count >= 9 ? "Great skills coverage!" : count >= 5 ? "Good, but add more skills" : "Add more relevant skills",
        tips: [
          count < 5 ? "Add at least 8-12 skills" : "",
          count >= 5 && count < 9 ? `Add ${9 - count} more relevant skills` : "",
        ].filter(Boolean),
      };
    }
    case "education": {
      let score = 0;
      if (education.length >= 1) score += 60;
      const hasGPA = education.some(e => e.gpa);
      if (hasGPA) score += 20;
      if (education.length >= 1 && education[0].field) score += 20;
      return {
        name: "Education",
        icon: Award,
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 80 ? "excellent" : score >= 50 ? "good" : "needs-work",
        feedback: score >= 80 ? "Education complete!" : score >= 50 ? "Education is present but incomplete" : "Add your education",
        tips: [
          education.length === 0 ? "Add your highest education" : "",
          !hasGPA && education.length > 0 ? "Add GPA if 3.5+ (optional but impressive)" : "",
        ].filter(Boolean),
      };
    }
    default:
      return { name: "", icon: FileText, score: 0, maxScore: 100, status: "needs-work", feedback: "", tips: [] };
  }
}

function CategoryRow({ category }: { category: ScoreCategory }) {
  const { name, icon: Icon, score, status } = category;
  const colors = {
    excellent: { bar: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
    good: { bar: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50" },
    "needs-work": { bar: "bg-red-400", text: "text-red-500", bg: "bg-red-50" },
  };
  const c = colors[status];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 font-poppins">{name}</span>
        </div>
        <span className={`text-xs font-bold ${c.text}`}>{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-gray-400 font-opensans">{category.feedback}</p>
    </div>
  );
}

export default function ScoreCard() {
  const { resumeData, getCompletionPercentage } = useResumeStore();
  const overall = getCompletionPercentage();

  const categories = [
    getCategoryScore("contact", resumeData),
    getCategoryScore("summary", resumeData),
    getCategoryScore("experience", resumeData),
    getCategoryScore("skills", resumeData),
    getCategoryScore("education", resumeData),
  ];

  // Collect all actionable tips
  const allTips = categories.flatMap(c => c.tips).filter(Boolean).slice(0, 4);

  const overallStatus = overall >= 80 ? "excellent" : overall >= 60 ? "good" : "needs-work";
  const statusConfig = {
    excellent: { color: "text-green-600", emoji: "🔥", label: "Excellent Resume!" },
    good: { color: "text-amber-600", emoji: "⚡", label: "Good Progress" },
    "needs-work": { color: "text-red-500", emoji: "⚠️", label: "Needs Improvement" },
  };
  const sc = statusConfig[overallStatus];

  return (
    <div className="p-4 space-y-4">
      {/* Overall Score */}
      <div className="text-center py-3">
        <div className="relative inline-flex">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={overall >= 80 ? "#22c55e" : overall >= 60 ? "#f59e0b" : "#ef4444"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - overall / 100) }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ transformOrigin: "50px 50px", rotate: "-90deg" }}
            />
            <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="900" fill={overall >= 80 ? "#22c55e" : overall >= 60 ? "#f59e0b" : "#ef4444"} fontFamily="Poppins">{overall}</text>
            <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#9CA3AF">/ 100</text>
          </svg>
        </div>
        <p className={`font-poppins font-bold text-sm mt-1 ${sc.color}`}>{sc.emoji} {sc.label}</p>
      </div>

      {/* Category Bars */}
      <div className="space-y-3">
        {categories.map(cat => (
          <CategoryRow key={cat.name} category={cat} />
        ))}
      </div>

      {/* Action Tips */}
      {allTips.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Quick Improvements
          </p>
          {allTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 font-opensans">{tip}</p>
            </div>
          ))}
        </div>
      )}

      {overall >= 85 && (
        <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-xs text-green-700 font-semibold">Your resume is well-optimized! 🎉</p>
        </div>
      )}
    </div>
  );
}
