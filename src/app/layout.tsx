import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ResumeAI — Free AI Resume Builder",
  description: "Build a professional, ATS-optimized resume in minutes with AI assistance. 100% free, no watermarks, no paywalls.",
  keywords: ["resume builder", "free resume", "AI resume", "ATS resume", "CV builder"],
  authors: [{ name: "ResumeAI" }],
  openGraph: {
    title: "ResumeAI — Free AI Resume Builder",
    description: "Build a professional resume in minutes with AI. 100% free.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E86AB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
