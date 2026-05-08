"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";
import { useResumeStore } from "@/lib/store";


const ROLE_DATA: Record<string, { title: string; summary: string; topSkills: string[]; avgSalary: string }> = {
  "Software Engineer": {
    title: "Software Engineer",
    summary: "Results-driven Software Engineer with expertise in full-stack development, system design, and cloud architecture. Proven track record of building scalable applications serving millions of users. Skilled in modern frameworks and best practices including CI/CD, code review, and agile methodologies.",
    topSkills: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "PostgreSQL", "Git", "Agile/Scrum"],
    avgSalary: "$95K – $195K/yr",
  },
  "Product Manager": {
    title: "Product Manager",
    summary: "Strategic Product Manager with a track record of launching successful products from concept to market. Expert at translating customer insights into product roadmaps, collaborating with cross-functional teams, and driving measurable business outcomes. Passionate about data-driven decision making and user-centric design.",
    topSkills: ["Product Strategy", "Roadmapping", "Agile/Scrum", "User Research", "A/B Testing", "Jira", "Figma", "Data Analysis", "SQL", "Stakeholder Management"],
    avgSalary: "$100K – $210K/yr",
  },
  "Data Scientist": {
    title: "Data Scientist",
    summary: "Analytical Data Scientist with expertise in machine learning, statistical modeling, and data visualization. Proven ability to extract actionable insights from complex datasets and communicate findings to both technical and non-technical stakeholders. Passionate about using data to drive business decisions.",
    topSkills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Pandas", "NumPy", "Tableau", "Power BI", "Statistics", "Data Visualization"],
    avgSalary: "$90K – $175K/yr",
  },
  "UX Designer": {
    title: "UX Designer",
    summary: "Creative UX Designer combining empathy-driven research with pixel-perfect execution. Expert in user research, wireframing, and prototyping. Track record of improving user satisfaction scores and conversion rates through intuitive, accessible design solutions.",
    topSkills: ["Figma", "User Research", "Wireframing", "Prototyping", "UI Design", "Usability Testing", "Adobe XD", "Design Systems", "Accessibility", "Sketch"],
    avgSalary: "$70K – $150K/yr",
  },
  "Marketing Manager": {
    title: "Marketing Manager",
    summary: "Data-driven Marketing Manager with expertise in multi-channel campaign strategy, brand building, and growth marketing. Proven ability to drive qualified leads, increase brand awareness, and optimize marketing ROI across paid, owned, and earned channels.",
    topSkills: ["Google Analytics", "SEO/SEM", "Content Marketing", "HubSpot", "Facebook Ads", "Email Marketing", "A/B Testing", "Copywriting", "Brand Strategy", "Marketing Automation"],
    avgSalary: "$65K – $140K/yr",
  },
  "DevOps Engineer": {
    title: "DevOps Engineer",
    summary: "Experienced DevOps Engineer with deep expertise in cloud infrastructure, CI/CD pipelines, and site reliability engineering. Skilled at building automated systems that enable engineering teams to ship faster with greater confidence. Focused on scalability, security, and operational excellence.",
    topSkills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Jenkins", "Linux", "Ansible", "Prometheus", "GitHub Actions"],
    avgSalary: "$100K – $200K/yr",
  },
  "Sales Manager": {
    title: "Sales Manager",
    summary: "High-performing Sales Manager with a track record of consistently exceeding quota and building elite sales teams. Expert in full-cycle B2B sales, pipeline management, and consultative selling. Skilled at coaching reps, forecasting accurately, and closing enterprise deals.",
    topSkills: ["Salesforce", "Pipeline Management", "CRM", "Lead Generation", "Negotiation", "Account Management", "Revenue Forecasting", "Cold Calling", "MEDDIC", "Quota Attainment"],
    avgSalary: "$75K – $180K/yr",
  },
  "Financial Analyst": {
    title: "Financial Analyst",
    summary: "Detail-oriented Financial Analyst with expertise in financial modeling, forecasting, and investment analysis. Proven ability to synthesize complex financial data into clear, actionable insights for executive decision-making. Strong foundation in GAAP, FP&A, and corporate finance.",
    topSkills: ["Excel Advanced", "Financial Modeling", "Power BI", "SQL", "Bloomberg", "FP&A", "Budgeting", "Forecasting", "Tableau", "GAAP/IFRS"],
    avgSalary: "$70K – $140K/yr",
  },
};

const ROLES = Object.keys(ROLE_DATA);

export default function RoleAutoFill() {
  const { updateSummary, setSkills, updatePersonalInfo, resumeData } = useResumeStore();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const role = ROLE_DATA[selectedRole];

  const apply = async () => {
    if (!role) return;
    setApplying(true);
    await new Promise(r => setTimeout(r, 800));
    updateSummary(role.summary);
    setSkills(role.topSkills);
    if (!resumeData.personalInfo.jobTitle) {
      updatePersonalInfo({ jobTitle: role.title });
    }
    setApplied(true);
    setApplying(false);
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="font-poppins font-semibold text-sm text-gray-800">Role Auto-Fill</span>
          <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">NEW</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 p-4 space-y-3 overflow-hidden"
          >
            <p className="text-xs text-gray-500 font-opensans">Select your role to auto-fill professional summary and top skills instantly.</p>

            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`text-left px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${selectedRole === r ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-700 hover:border-gray-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>

            {role && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Preview Summary</p>
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{role.summary}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Top Skills ({role.topSkills.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {role.topSkills.slice(0, 6).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">{s}</span>
                    ))}
                    {role.topSkills.length > 6 && <span className="text-[10px] text-gray-400">+{role.topSkills.length - 6} more</span>}
                  </div>
                </div>
                <p className="text-xs text-green-600 font-semibold">💰 Market range: {role.avgSalary}</p>
                <button
                  onClick={apply}
                  disabled={applying}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${applied ? "bg-green-500 text-white" : "btn-gold"}`}
                >
                  {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                    : applied ? <><Check className="w-4 h-4" /> Applied!</>
                    : <><Sparkles className="w-4 h-4" /> Apply to My Resume</>}
                </button>
                <p className="text-[10px] text-gray-400 text-center">Will update: Summary + Skills{!resumeData.personalInfo.jobTitle ? " + Job Title" : ""}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
