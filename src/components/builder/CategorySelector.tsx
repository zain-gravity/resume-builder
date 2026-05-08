"use client";
import { useResumeStore } from "@/lib/store";
import { TEMPLATE_PROFESSION_MAP, CATEGORY_SUMMARIES, type ProfessionKey } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface ProfessionConfig {
  key: ProfessionKey;
  templateId: string;
  label: string;
  subLabel: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  roles: string;
}

const PROFESSIONS: ProfessionConfig[] = [
  {
    key: "sales",
    templateId: "prof-sales",
    label: "Sales",
    subLabel: "Professional",
    emoji: "💼",
    color: "#e74c3c",
    bg: "linear-gradient(135deg, #fff5f5 0%, #fde8e8 100%)",
    border: "#fca5a5",
    roles: "Sales Executive · Account Manager · BDR",
  },
  {
    key: "marketing",
    templateId: "prof-marketing",
    label: "Marketing",
    subLabel: "Digital",
    emoji: "📣",
    color: "#f39c12",
    bg: "linear-gradient(135deg, #fffbf0 0%, #fef3c7 100%)",
    border: "#fcd34d",
    roles: "Marketer · SEO Specialist · Content Creator",
  },
  {
    key: "it",
    templateId: "prof-it",
    label: "IT / Tech",
    subLabel: "Engineering",
    emoji: "⚙️",
    color: "#9b59b6",
    bg: "linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%)",
    border: "#d8b4fe",
    roles: "Developer · DevOps · Data Scientist",
  },
  {
    key: "finance",
    templateId: "prof-finance",
    label: "Finance",
    subLabel: "Accounting",
    emoji: "📊",
    color: "#27ae60",
    bg: "linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%)",
    border: "#86efac",
    roles: "Accountant · Analyst · Financial Planner",
  },
  {
    key: "hr",
    templateId: "prof-hr",
    label: "Human",
    subLabel: "Resources",
    emoji: "🤝",
    color: "#3498db",
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "#93c5fd",
    roles: "HR Manager · Recruiter · Talent Acquisition",
  },
];

export default function CategorySelector() {
  const { selectedTemplate, setTemplate, updateSummary, resumeData } = useResumeStore();
  const [expanded, setExpanded] = useState(false);

  const currentProfKey = TEMPLATE_PROFESSION_MAP[selectedTemplate] as ProfessionKey | undefined;
  const activeProfession = PROFESSIONS.find((p) => p.key === currentProfKey);

  const handleSelect = (prof: ProfessionConfig) => {
    // Switch template
    setTemplate(prof.templateId);
    // Auto-fill summary only if currently empty
    if (!resumeData.summary || resumeData.summary.trim() === "") {
      updateSummary(CATEGORY_SUMMARIES[prof.key]);
    }
    setExpanded(false);
  };

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Header Row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[11px]"
            style={{ background: activeProfession?.color ?? "#6B7280" }}
          >
            <span className="text-white text-[10px]">★</span>
          </div>
          <span className="font-poppins font-semibold text-[11px] text-gray-700 uppercase tracking-wider">
            {activeProfession
              ? `${activeProfession.label} ${activeProfession.subLabel} Template`
              : "Choose Your Profession"}
          </span>
          {activeProfession && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: activeProfession.color, background: `${activeProfession.color}15` }}
            >
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-opensans hidden sm:block">
            {expanded ? "Collapse" : "Switch profession"}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded profession grid */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-3">
              <p className="text-[10px] text-gray-400 font-opensans mb-2.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Selecting a profession auto-loads a matching template, skill recommendations, and a professional summary.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {PROFESSIONS.map((prof) => {
                  const isActive = selectedTemplate === prof.templateId;
                  return (
                    <motion.button
                      key={prof.key}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(prof)}
                      className="relative flex flex-col items-center text-center p-2.5 rounded-xl border-2 transition-all duration-200 group overflow-hidden"
                      style={{
                        borderColor: isActive ? prof.color : prof.border,
                        background: prof.bg,
                        boxShadow: isActive ? `0 0 0 2px ${prof.color}40` : "none",
                      }}
                    >
                      {isActive && (
                        <div
                          className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: prof.color }}
                        >
                          <span className="text-white text-[7px] font-bold">✓</span>
                        </div>
                      )}
                      <span className="text-xl mb-1 leading-none">{prof.emoji}</span>
                      <span
                        className="text-[10px] font-bold leading-tight font-poppins"
                        style={{ color: prof.color }}
                      >
                        {prof.label}
                      </span>
                      <span className="text-[9px] text-gray-500 leading-tight font-opensans">
                        {prof.subLabel}
                      </span>
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-900 text-white text-[9px] rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-lg">
                        {prof.roles}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
