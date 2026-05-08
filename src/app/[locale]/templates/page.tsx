"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { TEMPLATES } from "@/lib/templates";

const CATEGORIES = ["All", "Professional", "Creative", "Modern", "Simple", "Industry"];
const EXPERIENCE = ["All Levels", "Student", "Entry Level", "Mid Level", "Senior", "Executive"];

const CATEGORY_COLORS: Record<string, string> = {
  Professional: "bg-blue-100 text-blue-700",
  Creative: "bg-purple-100 text-purple-700",
  Modern: "bg-emerald-100 text-emerald-700",
  Simple: "bg-gray-100 text-gray-700",
  Industry: "bg-orange-100 text-orange-700",
};

// Generate 50 gallery cards from 12 real templates
const GALLERY = Array.from({ length: 48 }, (_, i) => {
  const base = TEMPLATES[i % TEMPLATES.length];
  return { ...base, id: `${base.id}-${i}`, realId: base.id, _idx: i };
});

export default function TemplatesPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "en";
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCount, setShowCount] = useState(12);

  const filtered = GALLERY.filter((t) => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const visible = filtered.slice(0, showCount);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} />

      {/* Header */}
      <div className="gradient-hero pt-28 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
            500+ Templates
          </span>
          <h1 className="font-poppins font-black text-4xl md:text-5xl text-white mb-4">
            Find Your Perfect Template
          </h1>
          <p className="text-white/80 text-lg font-opensans max-w-2xl mx-auto">
            Professionally designed, ATS-tested templates for every industry. All free, forever.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="form-input !pl-10"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setShowCount(12); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 font-poppins ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-primary-glow"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <p className="text-sm text-gray-500 mb-6 font-opensans">
          Showing <span className="font-semibold text-gray-800">{visible.length}</span> of{" "}
          <span className="font-semibold text-gray-800">{filtered.length}</span> templates
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {visible.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % 12) * 0.04 }}
              className="group card overflow-hidden cursor-pointer"
            >
              {/* Preview */}
              <div className="aspect-[8.5/11] relative overflow-hidden" style={{ background: "#F8FAFC" }}>
                <div className="w-full h-full p-3">
                  <div className="w-full h-full bg-white rounded shadow-sm p-3 overflow-hidden">
                    <div className="h-2.5 rounded mb-1.5" style={{ background: template.colors.primary, width: "75%" }} />
                    <div className="h-1.5 bg-gray-200 rounded mb-2 w-1/2" />
                    {[1, 2, 3].map((n) => <div key={n} className="h-1 bg-gray-100 rounded mb-1" style={{ width: `${90 - n * 8}%` }} />)}
                    <div className="h-1.5 rounded mt-2 mb-1" style={{ background: template.colors.primary, width: "40%" }} />
                    {[1, 2].map((n) => <div key={n} className="h-1 bg-gray-100 rounded mb-1" />)}
                    <div className="h-1.5 rounded mt-2 mb-1" style={{ background: template.colors.primary, width: "30%" }} />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[1, 2, 3].map((n) => <div key={n} className="h-2 w-7 rounded-full" style={{ background: `${template.colors.primary}25` }} />)}
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4">
                  <Link
                    href={`/${locale}/builder?template=${template.realId}`}
                    className="btn-primary !text-xs !py-2 !px-4 w-full justify-center"
                  >
                    Use This Template
                  </Link>
                  <Link
                    href={`/${locale}/builder?template=${template.realId}`}
                    className="text-white/80 hover:text-white text-xs transition-colors font-opensans"
                  >
                    Preview →
                  </Link>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-poppins font-semibold text-gray-900 text-xs leading-snug">{template.name}</h3>
                  <span className={`badge text-[10px] shrink-0 ${CATEGORY_COLORS[template.category] || "badge-primary"}`}>
                    {template.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[template.colors.primary, template.colors.accent].map((c, ci) => (
                    <div key={ci} className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" style={{ background: c }} />
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1 font-opensans">{template.layout === "two-column" ? "2-column" : "1-column"}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load more */}
        {showCount < filtered.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowCount((c) => c + 12)}
              className="btn-primary !px-10"
            >
              Load More Templates
            </button>
          </div>
        )}
      </div>

      <Footer locale={locale} />
    </div>
  );
}
