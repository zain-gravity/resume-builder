import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInText } from "@/lib/linkedin-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    const url: string = body.url || "";

    if (!text && !url) {
      return NextResponse.json({ error: "Provide either text or url" }, { status: 400 });
    }

    if (text.trim().length > 0) {
      // Parse pasted profile text directly
      const parsed = parseLinkedInText(text, "linkedin-paste");

      // If a URL was also provided, inject it
      if (url && !parsed.personal.linkedin) {
        const m = url.match(/linkedin\.com\/in\/([\w-]+)/i);
        if (m) parsed.personal.linkedin = `linkedin.com/in/${m[1]}`;
      }

      return NextResponse.json({
        success: true,
        data: parsed,
        meta: { source: "text-paste", textLength: text.length },
      });
    }

    // URL-only: explain limitation and return instruction
    return NextResponse.json({
      success: false,
      error: "URL-only parsing is not available",
      instruction: "Due to LinkedIn login requirements, please use one of these methods:\n1. 📥 Download LinkedIn PDF: Profile → More → Save to PDF\n2. 📋 Copy + Paste: Select all text from your LinkedIn profile page and paste below",
      meta: { source: "url-only", requiresAlternative: true },
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
