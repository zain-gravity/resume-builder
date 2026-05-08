"use client";
import { useResumeStore } from "@/lib/store";
import { generateResumeHTML, getTemplate } from "@/lib/templates";
import { motion } from "framer-motion";
import { Save, Download, FileText, Sparkles, CheckCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ActionBar() {
  const store = useResumeStore();
  const { resumeData, selectedTemplate, getCompletionPercentage } = store;
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const completion = getCompletionPercentage();
  const template = getTemplate(selectedTemplate);

  const handleSave = () => {
    store.saveCurrentResume();
    setSaved(true);
    toast.success("Resume saved!", { description: "Saved to your resume library. View in Dashboard." });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html = generateResumeHTML(resumeData, selectedTemplate);
      const firstName = resumeData.personalInfo.firstName || "Resume";
      const lastName = resumeData.personalInfo.lastName || "";

      // Full print-ready HTML — @page margin:0 removes the browser's
      // URL header and date/time footer that appear with any positive margin.
      // Content padding is handled inside the resume HTML itself.
      const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${firstName} ${lastName} — Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Open+Sans:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Open Sans', sans-serif; background: #fff; }
  @media print {
    @page {
      size: letter;
      margin: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
</head>
<body>${html}</body>
</html>`;

      // ── Use a hidden iframe so no blob:// tab ever opens in the browser ──
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;visibility:hidden;";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!doc) throw new Error("iframe document unavailable");

      doc.open();
      doc.write(fullHTML);
      doc.close();

      // Give fonts/layout time to render before printing
      await new Promise<void>((resolve) => setTimeout(resolve, 900));

      iframe.contentWindow?.print();

      // Clean up the iframe after the print dialog closes
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch { /* already removed */ }
      }, 3000);

      toast.success("Print dialog opened!", {
        description: `Set Destination to "Save as PDF" and Margins to "None" for best results.`,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Download failed. Please try again.");
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs font-poppins font-semibold text-gray-600 whitespace-nowrap">
          {completion}% Complete
        </span>
        <span className="text-xs text-gray-400 font-opensans">{template.name}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-all">
          {saved ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save Draft"}
        </button>

        <button
          onClick={() => toast.info("AI Optimize", { description: "Click ✨ buttons on individual sections to optimize them." })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/40 text-gold-dark text-xs font-semibold hover:bg-gold/5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Optimize
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 btn-primary !py-2 !text-xs justify-center"
        >
          {downloading ? (
            <span className="animate-pulse">Preparing...</span>
          ) : (
            <><Download className="w-3.5 h-3.5" /> Download PDF</>
          )}
        </button>

        <a href="/en/cover-letter" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-all">
          <FileText className="w-3.5 h-3.5" />
          Cover Letter
        </a>
        <a href="/en/share" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/5 transition-all">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </a>
      </div>
    </div>
  );
}
