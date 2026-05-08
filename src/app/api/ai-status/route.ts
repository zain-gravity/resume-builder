import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasGemini = !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
  const hasGroq = !!process.env.GROQ_API_KEY;

  let provider: "gemini" | "groq" | "regex" = "regex";
  let accuracy = 65;
  let label = "Basic Parser";
  let description = "Regex-based parser. Add a free API key to enable AI.";

  if (hasGemini) {
    provider = "gemini";
    accuracy = 97;
    label = "Gemini 1.5 Flash AI";
    description = "Google's fastest AI model. Near-perfect extraction accuracy.";
  } else if (hasGroq) {
    provider = "groq";
    accuracy = 93;
    label = "Groq Llama 3.1 AI";
    description = "Ultra-fast Groq LPU inference. High accuracy extraction.";
  }

  return NextResponse.json({ provider, accuracy, label, description, hasGemini, hasGroq });
}
