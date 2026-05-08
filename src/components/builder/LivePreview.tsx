"use client";
import { useResumeStore } from "@/lib/store";
import { generateResumeHTML } from "@/lib/templates";
import { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Map each data key → the section ID embedded in the generated HTML
const SECTION_ID_MAP: Record<string, string> = {
  personalInfo: "preview-personal",
  summary: "preview-summary",
  workExperience: "preview-experience",
  education: "preview-education",
  skills: "preview-skills",
  certifications: "preview-certifications",
};

export default function LivePreview() {
  const { resumeData, selectedTemplate } = useResumeStore();
  const [zoom, setZoom] = useState(0.85);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevDataRef = useRef(resumeData);

  const html = generateResumeHTML(resumeData, selectedTemplate);

  // When resume data changes, detect WHICH section changed and scroll the
  // preview to that section so the user can immediately see their edit.
  useEffect(() => {
    const prev = prevDataRef.current;
    prevDataRef.current = resumeData;

    if (!scrollRef.current) return;

    // Find which top-level key changed
    let changedSectionId: string | null = null;
    for (const key of Object.keys(SECTION_ID_MAP)) {
      const k = key as keyof typeof resumeData;
      if (JSON.stringify(prev[k]) !== JSON.stringify(resumeData[k])) {
        changedSectionId = SECTION_ID_MAP[key];
        break;
      }
    }

    if (!changedSectionId) return;

    // Wait one tick for dangerouslySetInnerHTML to re-render, then scroll
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current.querySelector(`#${changedSectionId}`) as HTMLElement | null;
      if (el) {
        // offsetTop is in un-scaled px; multiply by zoom to get visual position.
        // Add 24px (p-6) for the container padding.
        const scrollTop = el.offsetTop * zoom - 24;
        scrollRef.current.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }
    });
  }, [resumeData, zoom]);

  const PreviewFrame = ({ scale }: { scale: number }) => (
    <div
      style={{
        width: "816px",
        minHeight: "1056px",
        transform: `scale(${scale})`,
        transformOrigin: "top center",
        boxShadow: "0 4px 40px rgba(0,0,0,0.15)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return (
    <>
      <div className="flex flex-col h-full bg-gray-100">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
          <span className="text-xs font-semibold text-gray-500 font-poppins uppercase tracking-wider">Live Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-1"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scrollable preview — ref lets us scroll to the edited section */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-6 flex justify-center">
          <div style={{ width: `${816 * zoom}px`, minHeight: `${1056 * zoom}px` }}>
            <PreviewFrame scale={zoom} />
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center p-8"
            onClick={() => setFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative overflow-auto max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <PreviewFrame scale={0.9} />
              <button
                onClick={() => setFullscreen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
