import { NextRequest, NextResponse } from "next/server";
import { parseResumeWithAI } from "@/lib/ai-resume-parser";

export const runtime = "nodejs";
export const maxDuration = 30;

function cleanText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[\x80-\x9F]/g, " ")
    .replace(/[^\x00-\x7F]{3,}/g, " ")
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

async function extractPDFText(buffer: Buffer): Promise<string> {
  // Layer 1: pdf-parse (most reliable)
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer, { max: 0 });
    const text = (result.text || "").trim();
    if (text.length > 50) {
      console.log(`[LinkedIn PDF] pdf-parse: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[LinkedIn PDF] pdf-parse failed:", e instanceof Error ? e.message : e);
  }

  // Layer 2: pdfjs-dist with coordinate-aware extraction
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      useSystemFonts: true,
      verbosity: 0,
    }).promise;

    const allLines: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      try {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const byY = new Map<number, { x: number; str: string }[]>();
        for (const item of content.items) {
          if (!("str" in item) || !item.str?.trim()) continue;
          // @ts-expect-error pdfjs types
          const y = Math.round(item.transform[5]);
          // @ts-expect-error pdfjs types
          const x = Math.round(item.transform[4]);
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y)!.push({ x, str: item.str });
        }
        for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
          const row = byY.get(y)!.sort((a, b) => a.x - b.x);
          const line = row.map((r) => r.str).join(" ").trim();
          if (line) allLines.push(line);
        }
      } catch { /* skip bad page */ }
    }
    const text = allLines.join("\n").trim();
    if (text.length > 50) {
      console.log(`[LinkedIn PDF] pdfjs: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[LinkedIn PDF] pdfjs failed:", e instanceof Error ? e.message : e);
  }

  // Layer 3: Raw PDF stream extraction
  try {
    const raw = buffer.toString("latin1");
    const chunks: string[] = [];
    const btEt = /BT[\s\S]*?ET/g;
    let m: RegExpExecArray | null;
    while ((m = btEt.exec(raw)) !== null) {
      const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g;
      let sm: RegExpExecArray | null;
      while ((sm = strRe.exec(m[0])) !== null) {
        let s = sm[1] || "";
        s = s.replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
        s = s.replace(/\\n/g, " ").replace(/\\r/g, "").replace(/\\\\/g, "\\").replace(/\\(.)/g, "$1");
        if (s.trim()) chunks.push(s);
      }
    }
    const text = chunks.join(" ").replace(/\s+/g, " ").trim();
    if (text.length > 50) {
      console.log(`[LinkedIn PDF] raw stream: ${text.length} chars`);
      return text;
    }
  } catch { /* ignore */ }

  return "";
}

export async function POST(req: NextRequest) {
  let filename = "linkedin-profile.pdf";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    filename = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text
    let rawText = "";
    const isPDF = filename.toLowerCase().endsWith(".pdf") || buffer.slice(0, 4).toString("ascii") === "%PDF";
    if (isPDF) {
      rawText = await extractPDFText(buffer);
    } else {
      rawText = cleanText(buffer.toString("utf-8"));
    }
    rawText = cleanText(rawText);

    console.log(`[LinkedIn PDF] "${filename}" → ${rawText.length} chars extracted`);

    // AI parsing (Gemini → Groq → regex)
    const aiResult = await parseResumeWithAI(rawText);
    console.log(`[LinkedIn PDF] Provider: ${aiResult.provider}, acc: ${aiResult.parseAccuracy}%, name: "${aiResult.data.personal.name}"`);

    const ai = aiResult.data;
    const warnings: string[] = [];
    if (rawText.length < 100) warnings.push("⚠️ Very little text extracted — LinkedIn PDFs sometimes need the text-based export");
    if (!ai.personal.name) warnings.push("⚠️ Name not detected — try the Paste Text method instead");

    const parsed = {
      id: Math.random().toString(36).substring(2, 10),
      filename,
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
      rawPreview: rawText.substring(0, 2000),
      meta: { textLength: rawText.length, isLinkedIn: true, provider: aiResult.provider, parseAccuracy: aiResult.parseAccuracy },
    });

  } catch (err) {
    console.error("[LinkedIn PDF] Critical error:", err);
    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(2, 10),
        filename,
        parsedAt: new Date().toISOString(),
        parseAccuracy: 0,
        provider: "error",
        warnings: ["⚠️ PDF parsing failed — try the Paste Text method instead"],
        personal: { name: "", email: "", phone: "", linkedin: "", location: "", portfolio: "", jobTitle: "" },
        summary: "", experience: [], education: [], skills: [], certifications: [],
      },
      rawPreview: "",
      meta: { textLength: 0, isLinkedIn: true },
    });
  }
}
