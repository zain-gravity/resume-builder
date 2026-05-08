"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Sparkles, User, Briefcase, GraduationCap, Wrench, Award, FileText, LayoutTemplate, Eye, BarChart2, Palette, LayoutGrid } from "lucide-react";
import { Toaster } from "sonner";
import { useResumeStore } from "@/lib/store";
import TemplateSwitcher from "@/components/builder/TemplateSwitcher";
import CategorySelector from "@/components/builder/CategorySelector";
import PersonalInfoForm, { SummaryForm, WorkExperienceForm, EducationForm, SkillsForm, CertificationsForm } from "@/components/builder/Forms";
import LivePreview from "@/components/builder/LivePreview";
import ActionBar from "@/components/builder/ActionBar";
import ScoreCard from "@/components/builder/ScoreCard";
import SalaryInsights from "@/components/builder/SalaryInsights";
import StyleCustomizer, { DEFAULT_STYLE, type ResumeStyle } from "@/components/builder/StyleCustomizer";
import GrammarChecker from "@/components/builder/GrammarChecker";
import RoleAutoFill from "@/components/builder/RoleAutoFill";
import Link from "next/link";

type SectionId = "personal" | "summary" | "experience" | "education" | "skills" | "certifications" | "score" | "grammar";

function SectionPanel({ label, icon: Icon, emoji, children, defaultOpen = true }: {
  id?: SectionId; label: string; icon: React.ElementType; emoji: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{emoji}</span>
          <span className="font-poppins font-semibold text-sm text-gray-800">{label}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BuilderPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const { loadDemoData, resumeData } = useResumeStore();
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [loaded, setLoaded] = useState(false);
  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>(DEFAULT_STYLE);

  useEffect(() => { setLoaded(true); }, []);

  // Handle template from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const t = urlParams.get("template");
      if (t) useResumeStore.getState().setTemplate(t);
    }
  }, []);

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-opensans">Loading builder...</p>
      </div>
    </div>
  );

  const isEmpty = !resumeData.personalInfo.firstName;

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <Toaster position="top-right" richColors />

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2E86AB, #A23B72)" }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-poppins font-black text-gray-900">Resume<span className="text-primary">AI</span></span>
        </Link>

        <div className="flex items-center gap-2">
          {isEmpty && (
            <button onClick={loadDemoData} className="text-xs text-primary hover:text-primary-dark font-semibold px-3 py-1.5 border border-primary/20 hover:border-primary/40 rounded-lg transition-all">
              <Sparkles className="w-3 h-3 inline mr-1" /> Load Demo
            </button>
          )}
          <Link href={`/${locale}/templates`} className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <LayoutTemplate className="w-3.5 h-3.5" /> Templates
          </Link>
          <Link href={`/${locale}/check`} className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            ATS Check
          </Link>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setMobileTab("editor")} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${mobileTab === "editor" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            Edit
          </button>
          <button onClick={() => setMobileTab("preview")} className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${mobileTab === "preview" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      {/* ── Main Layout ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Editor — fully scrollable, nothing fixed above form */}
        <div className={`w-full md:w-[55%] lg:w-[50%] flex flex-col border-r border-gray-100 ${mobileTab === "preview" ? "hidden md:flex" : "flex"}`}>

          {/* Scrollable area contains EVERYTHING including templates */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3 pb-32">

              {/* ── Template & Style Panel (collapsible, default collapsed) ── */}
              <SectionPanel id="personal" label="Template & Style" icon={LayoutGrid} emoji="🎨" defaultOpen={false}>
                <div className="space-y-0 divide-y divide-gray-50">
                  <CategorySelector />
                  <TemplateSwitcher />
                  <StyleCustomizer style={resumeStyle} onChange={setResumeStyle} />
                  <RoleAutoFill />
                </div>
              </SectionPanel>

              {/* ── Resume Content Sections ── */}
              <SectionPanel id="personal" label="Personal Info" icon={User} emoji="👤">
                <PersonalInfoForm />
              </SectionPanel>

              <SectionPanel id="summary" label="Professional Summary" icon={FileText} emoji="📋">
                <SummaryForm />
              </SectionPanel>

              <SectionPanel id="experience" label="Work Experience" icon={Briefcase} emoji="💼">
                <WorkExperienceForm />
              </SectionPanel>

              <SectionPanel id="education" label="Education" icon={GraduationCap} emoji="🎓">
                <EducationForm />
              </SectionPanel>

              <SectionPanel id="skills" label="Skills" icon={Wrench} emoji="🛠️">
                <SkillsForm />
              </SectionPanel>

              <SectionPanel id="certifications" label="Certifications" icon={Award} emoji="📜">
                <CertificationsForm />
              </SectionPanel>

              <SectionPanel id="score" label="Resume Score Card" icon={BarChart2} emoji="📊" defaultOpen={false}>
                <ScoreCard />
              </SectionPanel>

              <SectionPanel id="grammar" label="Grammar & Tone Check" icon={Palette} emoji="✍️" defaultOpen={false}>
                <GrammarChecker />
              </SectionPanel>

              <SalaryInsights locale={locale} />
            </div>
          </div>

          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 shrink-0">
            <ActionBar />
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div className={`w-full md:w-[45%] lg:w-[50%] h-full ${mobileTab === "editor" ? "hidden md:block" : "block"}`}>
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
