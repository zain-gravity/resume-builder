import { NextRequest, NextResponse } from "next/server";
import { parseResumeWithAI } from "@/lib/ai-resume-parser";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    const url: string = body.url || "";

    if (!text && !url) {
      return NextResponse.json({ error: "Provide either text or url" }, { status: 400 });
    }

    if (text.trim().length > 0) {
      console.log(`[LinkedIn Text] Parsing ${text.length} chars of pasted text`);

      // Use the full AI pipeline (Gemini → Groq → regex)
      const aiResult = await parseResumeWithAI(text);
      console.log(`[LinkedIn Text] Provider: ${aiResult.provider}, acc: ${aiResult.parseAccuracy}%, name: "${aiResult.data.personal.name}"`);

      const ai = aiResult.data;

      // If a LinkedIn URL was also provided, inject it
      if (url && !ai.personal.linkedin) {
        const m = url.match(/linkedin\.com\/in\/([\w-]+)/i);
        if (m) ai.personal.linkedin = `linkedin.com/in/${m[1]}`;
      }

      const warnings: string[] = [];
      if (!ai.personal.name) warnings.push("⚠️ Name not detected — make sure you copied the full profile page");
      if (ai.experience.length === 0) warnings.push("⚠️ No experience found — try selecting all text on your LinkedIn profile");

      const parsed = {
        id: Math.random().toString(36).substring(2, 10),
        filename: "linkedin-paste",
        parsedAt: new Date().toISOString(),
        parseAccuracy: aiResult.parseAccuracy,
        provider: aiResult.provider,
        warnings,
        personal: ai.personal,
        summary: ai.summary,
        experience: ai.experience.map((e) => ({
          company: e.company,
          title: e.title,
          location: e.location,
          startDate: e.startDate,
          endDate: e.endDate,
          current: e.current,
          bullets: e.bullets.filter(Boolean),
        })),
        education: ai.education,
        skills: ai.skills,
        certifications: ai.certifications,
      };

      return NextResponse.json({
        success: true,
        data: parsed,
        meta: { source: "text-paste", textLength: text.length, provider: aiResult.provider, parseAccuracy: aiResult.parseAccuracy },
      });
    }

    // URL-only fallback
    return NextResponse.json({
      success: false,
      error: "URL-only parsing is not available",
      instruction: "Due to LinkedIn login requirements, please use:\n1. 📥 Download LinkedIn PDF: Profile → More → Save to PDF\n2. 📋 Copy + Paste: Select all text from your LinkedIn profile page and paste below",
      meta: { source: "url-only", requiresAlternative: true },
    }, { status: 200 });

  } catch (err) {
    console.error("[LinkedIn Text] Error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
