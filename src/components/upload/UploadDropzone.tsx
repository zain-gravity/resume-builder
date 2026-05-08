"use client";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, CheckCircle, X, Sparkles, Cpu, Zap } from "lucide-react";

interface UploadDropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

interface AIStatus {
  provider: "gemini" | "groq" | "regex";
  accuracy: number;
  label: string;
  description: string;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "text/plain": [".txt"],
};

const FILE_ICONS: Record<string, string> = {
  pdf: "📄", docx: "📝", doc: "📝", txt: "🗒️",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const PROVIDER_CONFIG = {
  gemini: { icon: Sparkles, color: "#4285F4", bg: "rgba(66,133,244,0.1)", badge: "⚡ Gemini AI" },
  groq:   { icon: Zap,       color: "#F55036", bg: "rgba(245,80,54,0.1)",  badge: "🔥 Groq AI" },
  regex:  { icon: Cpu,       color: "#6B7280", bg: "rgba(107,114,128,0.1)", badge: "🔧 Basic Parser" },
};

export default function UploadDropzone({ onFileAccepted, disabled }: UploadDropzoneProps) {
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then(setAiStatus)
      .catch(() => null);
  }, []);

  const onDrop = useCallback(
    (accepted: File[], rejected: { file: File; errors: { message: string }[] }[]) => {
      setError("");
      if (rejected.length > 0) {
        const msg = rejected[0].errors[0]?.message || "Invalid file";
        setError(msg.includes("too large") ? "File too large. Maximum size is 5MB." : "Unsupported file type. Please use PDF, DOCX, DOC, or TXT.");
        return;
      }
      if (accepted.length > 0) {
        const file = accepted[0];
        setDroppedFile(file);
        onFileAccepted(file);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, maxFiles: 1, maxSize: 5 * 1024 * 1024, disabled,
  });

  const fileExt = droppedFile?.name.split(".").pop()?.toLowerCase() || "";
  const fileIcon = FILE_ICONS[fileExt] || "📄";
  const provider = aiStatus?.provider || "regex";
  const providerCfg = PROVIDER_CONFIG[provider];
  const ProviderIcon = providerCfg.icon;

  return (
    <div className="w-full">
      {/* AI Provider Badge */}
      {aiStatus && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-3 px-4 py-2.5 rounded-2xl border"
          style={{ background: providerCfg.bg, borderColor: `${providerCfg.color}40` }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: providerCfg.color }}>
              <ProviderIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: providerCfg.color }}>{providerCfg.badge}</p>
              <p className="text-xs text-gray-500">{aiStatus.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black" style={{ color: providerCfg.color }}>{aiStatus.accuracy}%</p>
            <p className="text-xs text-gray-400">accuracy</p>
          </div>
        </motion.div>
      )}

      <div
        {...getRootProps()}
        className={`
          relative rounded-3xl border-3 border-dashed transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center text-center
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isDragActive
            ? "border-primary bg-primary/8 scale-[1.01] shadow-primary-glow"
            : droppedFile
            ? "border-success bg-green-50"
            : "border-gray-300 hover:border-primary hover:bg-primary/5"
          }
        `}
        style={{ minHeight: "360px", border: isDragActive ? "3px dashed #2E86AB" : droppedFile ? "3px dashed #28A745" : "3px dashed #D1D5DB" }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {droppedFile ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-7xl">{fileIcon}</div>
              <div>
                <p className="font-poppins font-bold text-gray-900 text-xl">{droppedFile.name}</p>
                <p className="text-gray-500 text-sm mt-1">{formatSize(droppedFile.size)}</p>
              </div>
              <div className="flex items-center gap-2 text-success font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>
                  File ready — parsing with{" "}
                  <span style={{ color: providerCfg.color }}>{aiStatus?.label || "AI"}</span>
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDroppedFile(null); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors mt-1"
              >
                <X className="w-3.5 h-3.5" /> Remove file
              </button>
            </motion.div>
          ) : isDragActive ? (
            <motion.div
              key="drag"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center"
              >
                <Upload className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="font-poppins font-black text-2xl text-primary">Drop it here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 px-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
              >
                <Upload className="w-12 h-12 text-primary" />
              </motion.div>

              <div>
                <p className="font-poppins font-black text-2xl md:text-3xl text-gray-900 mb-2">
                  Drop your resume here
                </p>
                <p className="text-gray-500 font-opensans">
                  or <span className="text-primary font-semibold underline cursor-pointer">click to browse</span>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-center">
                {["PDF", "DOCX", "DOC", "TXT"].map((fmt) => (
                  <span key={fmt} className="badge badge-primary text-xs">{fmt}</span>
                ))}
                <span className="text-xs text-gray-400">Max 5MB</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-2 max-w-sm w-full">
                {[
                  { icon: "🔒", label: "Private & Secure" },
                  { icon: "⚡", label: "AI-Powered" },
                  { icon: "✨", label: "Near 100% Accuracy" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <p className="text-xs text-gray-500 font-opensans">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
