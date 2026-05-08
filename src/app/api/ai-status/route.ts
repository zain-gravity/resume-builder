import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasGemini = !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  // Priority: Groq → OpenRouter → Gemini → Regex
  let provider: "groq" | "openrouter" | "gemini" | "regex" = "regex";
  let accuracy = 65;
  let label = "Regex NLP Parser";
  let description = "Regex-based parser (no AI key set). Add GROQ_API_KEY for 95% accuracy.";
  let color = "orange";

  if (hasGroq) {
    provider = "groq";
    accuracy = 95;
    label = "Groq Llama 3.1 (Active)";
    description = "Ultra-fast free AI — 14,400 req/day, no billing needed.";
    color = "green";
  } else if (hasOpenRouter) {
    provider = "openrouter";
    accuracy = 92;
    label = "OpenRouter AI (Active)";
    description = "Free AI models via OpenRouter.";
    color = "green";
  } else if (hasGemini) {
    provider = "gemini";
    accuracy = 97;
    label = "Gemini AI (Active)";
    description = "Google Gemini — may have quota limits on free tier.";
    color = "yellow";
  }

  return NextResponse.json({
    provider, accuracy, label, description, color,
    hasGroq, hasOpenRouter, hasGemini,
    priority: ["groq", "openrouter", "gemini", "regex"],
    activeKey: provider !== "regex",
  });
}
