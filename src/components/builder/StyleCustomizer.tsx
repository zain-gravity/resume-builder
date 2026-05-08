"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Type, Check, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

export interface ResumeStyle {
  accentColor: string;
  fontFamily: string;
  fontSize: "compact" | "normal" | "large";
  sectionSpacing: "tight" | "normal" | "spacious";
}

const ACCENT_COLORS = [
  { name: "Ocean Blue", value: "#2E86AB" },
  { name: "Royal Purple", value: "#7C3AED" },
  { name: "Forest Green", value: "#059669" },
  { name: "Crimson", value: "#DC2626" },
  { name: "Slate Navy", value: "#1E40AF" },
  { name: "Rose Gold", value: "#E11D48" },
  { name: "Amber", value: "#D97706" },
  { name: "Teal", value: "#0D9488" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Charcoal", value: "#374151" },
];

const FONT_OPTIONS = [
  { name: "Poppins", value: "Poppins, sans-serif", preview: "Modern & Clean" },
  { name: "Inter", value: "Inter, sans-serif", preview: "Professional" },
  { name: "Georgia", value: "Georgia, serif", preview: "Classic & Elegant" },
  { name: "Merriweather", value: "Merriweather, serif", preview: "Traditional" },
  { name: "Raleway", value: "Raleway, sans-serif", preview: "Creative & Bold" },
  { name: "Open Sans", value: "Open Sans, sans-serif", preview: "Friendly & Readable" },
];

interface StyleCustomizerProps {
  style: ResumeStyle;
  onChange: (style: ResumeStyle) => void;
}

const DEFAULT_STYLE: ResumeStyle = {
  accentColor: "#2E86AB",
  fontFamily: "Open Sans, sans-serif",
  fontSize: "normal",
  sectionSpacing: "normal",
};

export default function StyleCustomizer({ style, onChange }: StyleCustomizerProps) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof ResumeStyle, value: string) => {
    onChange({ ...style, [key]: value });
  };

  const reset = () => onChange(DEFAULT_STYLE);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Palette className="w-4 h-4 text-accent" />
          <span className="font-poppins font-semibold text-sm text-gray-800">Style Customizer</span>
          <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: style.accentColor }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">{FONT_OPTIONS.find(f => f.value === style.fontFamily)?.name}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100 p-4 space-y-5"
        >
          {/* Accent Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Accent Color</label>
              <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => update("accentColor", c.value)}
                  title={c.name}
                  className="relative w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c.value,
                    borderColor: style.accentColor === c.value ? c.value : "transparent",
                    outline: style.accentColor === c.value ? `3px solid ${c.value}40` : "none",
                  }}
                >
                  {style.accentColor === c.value && (
                    <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
              {/* Custom color input */}
              <label className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden" title="Custom color">
                <input
                  type="color"
                  value={style.accentColor}
                  onChange={e => update("accentColor", e.target.value)}
                  className="opacity-0 absolute w-7 h-7 cursor-pointer"
                />
                <span className="text-gray-400 text-xs font-bold">+</span>
              </label>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Type className="w-3 h-3" /> Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => update("fontFamily", f.value)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                    style.fontFamily === f.value ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-900" style={{ fontFamily: f.value }}>{f.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{f.preview}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {(["compact", "normal", "large"] as const).map(size => (
                <button
                  key={size}
                  onClick={() => update("fontSize", size)}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                    style.fontSize === size ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  {size === "compact" ? "A" : size === "normal" ? "Aa" : "AA"}&nbsp;{size}
                </button>
              ))}
            </div>
          </div>

          {/* Section Spacing */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">Section Spacing</label>
            <div className="flex gap-2">
              {(["tight", "normal", "spacious"] as const).map(spacing => (
                <button
                  key={spacing}
                  onClick={() => update("sectionSpacing", spacing)}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                    style.sectionSpacing === spacing ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  {spacing}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export { DEFAULT_STYLE };
