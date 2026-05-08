"use client";
import { useResumeStore } from "@/lib/store";
import { TEMPLATES, type Template } from "@/lib/templates";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";

const CATEGORY_META: Record<string, { label: string; emoji: string; desc: string }> = {
  Modern:       { label: "Modern",        emoji: "✨", desc: "Contemporary designs for forward-thinking professionals" },
  Professional: { label: "Professional",  emoji: "💼", desc: "Classic formats trusted by top employers" },
  Creative:     { label: "Creative",      emoji: "🎨", desc: "Bold designs for design, marketing & creative roles" },
  Simple:       { label: "Simple",        emoji: "📄", desc: "Clean & minimal — works for any industry" },
  Industry:     { label: "Industry",      emoji: "🏭", desc: "Tailored formats for specific industries" },
  Company:      { label: "Company Style", emoji: "🏢", desc: "Formats preferred by specific types of companies" },
  Country:      { label: "Country Format",emoji: "🌍", desc: "Culturally appropriate formats for specific countries" },
  Academic:     { label: "Academic/ATS",  emoji: "🎓", desc: "Research CVs and ATS-optimized formats" },
};

const CATEGORY_ORDER = ["Modern", "Professional", "Creative", "Simple", "Industry", "Company", "Country", "Academic"];

function TemplateThumb({ t, isActive }: { t: Template; isActive: boolean }) {
  const isCountry = t.category === "Country";
  const isATS = t.id === "ac-ats-pure";
  const isTwoCo = t.layout === "two-column" || t.layout === "sidebar";

  return (
    <div
      className="w-full h-full rounded p-1.5 overflow-hidden transition-all duration-200"
      style={{
        background: isATS ? "#F9FAFB" : t.colors.bg === "#FFFFFF" ? "#FAFAFA" : t.colors.bg,
        boxShadow: isActive ? `0 0 0 2px ${t.colors.primary}, 0 2px 8px ${t.colors.primary}30` : "0 1px 3px rgba(0,0,0,0.08)",
        borderRadius: "6px",
      }}
    >
      {isTwoCo ? (
        <div className="flex h-full gap-1">
          <div className="w-2/5 space-y-1">
            <div className="h-1.5 rounded" style={{ background: t.colors.primary, width: "90%" }} />
            <div className="h-0.5 bg-gray-300 rounded w-3/4" />
            <div className="h-0.5 bg-gray-300 rounded" />
            <div className="h-0.5 bg-gray-300 rounded w-5/6" />
            <div className="h-1 rounded mt-1" style={{ background: `${t.colors.primary}60`, width: "80%" }} />
            <div className="space-y-0.5 mt-0.5">
              <div className="h-0.5 rounded" style={{ background: `${t.colors.primary}40` }} />
              <div className="h-0.5 rounded w-4/5" style={{ background: `${t.colors.primary}40` }} />
            </div>
          </div>
          <div className="flex-1 space-y-0.5 pt-1">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-4/5" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
            <div className="h-0.5 bg-gray-200 rounded w-3/4" />
            <div className="h-1 rounded mt-1" style={{ background: `${t.colors.primary}50` }} />
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      ) : (
        <>
          <div className="h-1.5 rounded mb-1" style={{ background: isATS ? "#374151" : t.colors.primary, width: "80%" }} />
          <div className="h-0.5 bg-gray-200 rounded mb-1.5 w-3/5" />
          <div className="space-y-0.5 mb-1.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="h-0.5 rounded mb-1" style={{ background: isATS ? "#374151" : `${t.colors.primary}70`, width: "50%" }} />
          <div className="space-y-0.5">
            <div className="h-0.5 bg-gray-200 rounded" />
            <div className="h-0.5 bg-gray-200 rounded w-4/5" />
            <div className="h-0.5 bg-gray-200 rounded w-3/4" />
          </div>
        </>
      )}
    </div>
  );
}

export default function TemplateSwitcher() {
  const { selectedTemplate, setTemplate } = useResumeStore();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Modern");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const byCategory = CATEGORY_ORDER.reduce<Record<string, Template[]>>((acc, cat) => {
    const items = TEMPLATES.filter(t => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Currently selected banner */}
      {activeTemplate && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: activeTemplate.colors.primary }} />
            <span className="text-xs font-semibold text-primary">{activeTemplate.name}</span>
            {activeTemplate.badge && (
              <span className="text-[10px] px-1.5 py-0.5 bg-white border border-primary/20 text-primary/70 rounded-full font-semibold">{activeTemplate.badge}</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 uppercase">{activeTemplate.category}</span>
        </div>
      )}

      <div className="px-3 py-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Template Library ({TEMPLATES.length})</p>

        <div className="space-y-1">
          {Object.entries(byCategory).map(([cat, templates]) => {
            const meta = CATEGORY_META[cat];
            const isOpen = expandedCategory === cat;
            const hasActive = templates.some(t => t.id === selectedTemplate);

            return (
              <div key={cat} className="rounded-xl overflow-hidden border border-gray-100">
                <button
                  onClick={() => setExpandedCategory(isOpen ? null : cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${isOpen ? "bg-gray-50" : "bg-white hover:bg-gray-50/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-none">{meta.label}</p>
                      <p className="text-[9px] text-gray-400">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
                    </div>
                    {hasActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="p-2 bg-gray-50/50">
                        <p className="text-[9px] text-gray-400 mb-2 px-1">{meta.desc}</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
                          {templates.map((t) => {
                            const isActive = selectedTemplate === t.id;
                            return (
                              <div key={t.id} className="relative group">
                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => setTemplate(t.id)}
                                  onMouseEnter={() => setHoveredTemplate(t.id)}
                                  onMouseLeave={() => setHoveredTemplate(null)}
                                  className="flex-shrink-0 w-16 text-left"
                                  title={t.tip || t.description}
                                >
                                  <div className="relative mb-1" style={{ height: "80px" }}>
                                    <TemplateThumb t={t} isActive={isActive} />
                                    {isActive && (
                                      <div
                                        className="absolute inset-0 rounded flex items-center justify-center"
                                        style={{ background: `${t.colors.primary}20` }}
                                      >
                                        <div
                                          className="w-5 h-5 rounded-full flex items-center justify-center shadow"
                                          style={{ background: t.colors.primary }}
                                        >
                                          <Check className="w-3 h-3 text-white" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-center text-gray-700 font-semibold leading-tight truncate">{t.name}</p>
                                  {t.badge && (
                                    <p className="text-[8px] text-center text-gray-400 leading-tight mt-0.5">{t.badge}</p>
                                  )}
                                </motion.button>

                                {/* Tooltip */}
                                {hoveredTemplate === t.id && t.tip && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 z-50 pointer-events-none">
                                    <div className="bg-gray-900 text-white text-[10px] rounded-lg p-2.5 shadow-xl">
                                      <p className="font-bold mb-1">{t.name}</p>
                                      <p className="text-gray-300 leading-relaxed">{t.tip}</p>
                                    </div>
                                    <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
