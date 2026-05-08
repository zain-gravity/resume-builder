"use client";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { PARSE_STEPS } from "@/lib/parsed-resume.types";

interface ParserProgressProps {
  currentStep: number; // 0-4
  percent: number;     // 0-100
  filename?: string;
}

const STEP_ICONS = ["📤", "📝", "👤", "💼", "🛠️"];

export default function ParserProgress({ currentStep, percent, filename }: ParserProgressProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Filename */}
      {filename && (
        <div className="flex items-center gap-2 mb-5 text-sm text-gray-600 font-opensans">
          <span className="text-lg">📄</span>
          <span className="font-semibold truncate">{filename}</span>
        </div>
      )}

      {/* Main progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-poppins font-semibold text-gray-700">
            {PARSE_STEPS[currentStep]?.label || "Processing…"}
          </span>
          <span className="text-sm font-bold text-primary font-poppins">{percent}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #2E86AB 0%, #A23B72 60%, #F18F01 100%)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-3">
        {PARSE_STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const pending = i > currentStep;

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: pending ? 0.4 : 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                  done
                    ? "bg-success/15"
                    : active
                    ? "bg-primary/15"
                    : "bg-gray-100"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : active ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-primary" />
                  </motion.div>
                ) : (
                  <span className="text-lg">{STEP_ICONS[i]}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold font-poppins ${
                    done ? "text-success" : active ? "text-primary" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Status dot */}
              {done && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-success"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
