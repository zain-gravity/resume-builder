// Shared parsed resume type used across all features

export interface ParsedPersonal {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  portfolio: string;
  jobTitle: string;
}

export interface ParsedExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  bullets: string[];
}

export interface ParsedEducation {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  location: string;
}

export interface ParsedResume {
  id: string;
  filename: string;
  parsedAt: string;
  parseAccuracy: number;
  provider?: string; // "gemini" | "groq" | "regex" | "error"
  warnings: string[];
  personal: ParsedPersonal;
  summary: string;
  experience: ParsedExperience[];
  education: ParsedEducation[];
  skills: string[];
  certifications: { name: string; issuer: string; date: string; url: string }[];
}

export interface ParseProgress {
  step: number; // 0-4
  label: string;
  percent: number;
}

export const PARSE_STEPS = [
  { step: 0, label: "📤 Uploading file…",               percent: 10 },
  { step: 1, label: "📄 Extracting text from file…",    percent: 35 },
  { step: 2, label: "🤖 Running AI parser…",             percent: 65 },
  { step: 3, label: "🔍 Extracting fields & experience…", percent: 85 },
  { step: 4, label: "✨ Finalizing results…",            percent: 95 },
];
