"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, CheckCircle } from "lucide-react";
import type { ParsedResume } from "@/lib/parsed-resume.types";

interface FormatOption {
  id: string;
  label: string;
  description: string;
  emoji: string;
  badge?: string;
  badgeColor?: string;
}

const FORMATS: FormatOption[] = [
  { id: "pdf",      label: "PDF (ATS Light)",  description: "Clean white background, ATS-safe fonts", emoji: "📄", badge: "Recommended", badgeColor: "badge-primary" },
  { id: "pdf-dark", label: "PDF (Dark Mode)",  description: "Sleek dark theme for digital sharing",    emoji: "🌙", badge: "Premium Look", badgeColor: "badge-accent" },
  { id: "docx",     label: "Word DOCX",        description: "Editable in Microsoft Word & Google Docs", emoji: "📝" },
  { id: "txt",      label: "Plain Text (ATS)", description: "Guaranteed 100% ATS-parseable format",   emoji: "🗒️", badge: "ATS Safe", badgeColor: "badge-success" },
  { id: "html",     label: "HTML",             description: "Web-ready, shareable via link",            emoji: "🌐" },
];

interface FormatSelectorProps {
  resumeData: ParsedResume;
}

export default function FormatSelector({ resumeData }: FormatSelectorProps) {
  const [selected, setSelected] = useState("pdf");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);

  const handleDownload = async (formatId: string) => {
    setDownloading(formatId);
    try {
      const name = (resumeData.personal?.name || "resume").replace(/\s+/g, "_");

      if (formatId === "pdf" || formatId === "pdf-dark") {
        // Get HTML from API and open for print
        const res = await fetch(`/api/export/${formatId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: resumeData, name }),
        });
        const html = await res.text();
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          setTimeout(() => win.print(), 600);
        }
      } else {
        const res = await fetch(`/api/export/${formatId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: resumeData, name }),
        });
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `${name}.${formatId}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setDownloaded((d) => [...d, formatId]);
      setTimeout(() => setDownloaded((d) => d.filter((x) => x !== formatId)), 3000);
    } catch (e) {
      console.error("Download error:", e);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full">
      <h3 className="font-poppins font-bold text-lg text-gray-900 mb-4">Choose Download Format</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {FORMATS.map((fmt) => (
          <motion.button
            key={fmt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(fmt.id)}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
              selected === fmt.id
                ? "border-primary bg-primary/5 shadow-primary-glow"
                : "border-gray-100 hover:border-gray-200 bg-white"
            }`}
          >
            {fmt.badge && (
              <span className={`badge ${fmt.badgeColor} text-[10px] absolute top-3 right-3`}>
                {fmt.badge}
              </span>
            )}
            <div className="text-3xl mb-2">{fmt.emoji}</div>
            <p className="font-poppins font-bold text-sm text-gray-900">{fmt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-opensans leading-relaxed">{fmt.description}</p>

            {/* Selection indicator */}
            {selected === fmt.id && (
              <motion.div
                layoutId="sel"
                className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                initial={false}
              >
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Download button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleDownload(selected)}
        disabled={!!downloading}
        className="btn-primary w-full justify-center !py-4 !text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {downloading === selected ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Preparing download…</>
        ) : downloaded.includes(selected) ? (
          <><CheckCircle className="w-5 h-5" /> Downloaded!</>
        ) : (
          <><Download className="w-5 h-5" /> Download {FORMATS.find((f) => f.id === selected)?.label}</>
        )}
      </motion.button>

      {/* Quick download all */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {FORMATS.map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => handleDownload(fmt.id)}
            disabled={!!downloading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary transition-all disabled:opacity-40"
          >
            {downloading === fmt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : downloaded.includes(fmt.id) ? <CheckCircle className="w-3 h-3 text-success" /> : <Download className="w-3 h-3" />}
            {fmt.emoji} {fmt.id.toUpperCase().replace("-DARK", "")}
          </button>
        ))}
      </div>
    </div>
  );
}
