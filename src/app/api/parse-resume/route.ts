import { NextRequest, NextResponse } from "next/server";
import { parseResumeWithAI } from "@/lib/ai-resume-parser";

export const runtime = "nodejs";
export const maxDuration = 30;

// ─── TEXT EXTRACTION: 4-LAYER FALLBACK ──────────────────────────────────────

async function extractPDFText(buffer: Buffer): Promise<string> {
  // Layer 1: pdf-parse (most reliable, simple, battle-tested)
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer, { max: 0 });
    const text = (result.text || "").trim();
    if (text.length > 50) {
      console.log(`[PDF] pdf-parse: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[PDF] pdf-parse failed:", e instanceof Error ? e.message : e);
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
        // Group by Y coordinate to preserve reading order
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
      console.log(`[PDF] pdfjs-dist: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[PDF] pdfjs-dist failed:", e instanceof Error ? e.message : e);
  }

  // Layer 3: Raw PDF stream extraction (works on almost any PDF)
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
      console.log(`[PDF] raw stream: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[PDF] raw stream failed:", e);
  }

  // Layer 4: UTF-8 printable character extraction (last resort)
  try {
    const raw = buffer.toString("utf-8");
    const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
    if (printable.length > 50) {
      console.log(`[PDF] utf8 fallback: ${printable.length} chars`);
      return printable;
    }
  } catch { /* ignore */ }

  return "";
}

async function extractDOCXText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  } catch (e) {
    console.warn("[DOCX] mammoth failed:", e instanceof Error ? e.message : e);
    return "";
  }
}

function extractDOCText(buffer: Buffer): string {
  // Extract ASCII runs from binary DOC
  const raw = buffer.toString("binary");
  const chunks = raw.match(/[\x20-\x7E\n\r\t]{4,}/g) || [];
  return chunks.filter((c) => /[a-zA-Z]{3,}/.test(c)).join("\n").substring(0, 50000);
}

function cleanText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[\x80-\x9F]/g, " ")
    .replace(/[^\x00-\x7F]{3,}/g, " ")
    .replace(/[ \t]{3,}/g, " ")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let filename = "resume";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    filename = file.name;
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Step 1: Detect file type & extract raw text ──
    const isPDF = ext === "pdf" || buffer.slice(0, 4).toString("ascii") === "%PDF";
    const isDOCX = ext === "docx" || (buffer[0] === 0x50 && buffer[1] === 0x4b);
    const isDOC = ext === "doc" || (buffer[0] === 0xd0 && buffer[1] === 0xcf);

    let rawText = "";
    if (isPDF) rawText = await extractPDFText(buffer);
    else if (isDOCX) rawText = await extractDOCXText(buffer);
    else if (isDOC) rawText = extractDOCText(buffer);
    else rawText = buffer.toString("utf-8"); // TXT

    rawText = cleanText(rawText);
    console.log(`[parse-resume] Extracted ${rawText.length} chars from "${filename}" (PDF=${isPDF} DOCX=${isDOCX})`);

    // ── Step 2: AI-powered parsing (Gemini → Groq → robust regex) ──
    const aiResult = await parseResumeWithAI(rawText);
    console.log(`[parse-resume] Provider: ${aiResult.provider}, Accuracy: ${aiResult.parseAccuracy}%, name="${aiResult.data.personal.name}"`);

    const id = Math.random().toString(36).substring(2, 10);
    const ai = aiResult.data;

    const warnings: string[] = [];
    if (rawText.length < 100) warnings.push("⚠️ Very little text extracted — this may be a scanned/image PDF");
    if (!ai.personal.name) warnings.push("⚠️ Name not detected — please fill in manually");
    if (!ai.personal.email) warnings.push("⚠️ Email not found");

    return NextResponse.json({
      success: true,
      data: {
        id,
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
      },
      rawPreview: rawText.substring(0, 2000),
      meta: {
        textLength: rawText.length,
        isLowQuality: rawText.length < 100,
        provider: aiResult.provider,
        parseAccuracy: aiResult.parseAccuracy,
      },
    });

  } catch (err) {
    console.error("[parse-resume] Critical error:", err);
    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(2, 10),
        filename,
        parsedAt: new Date().toISOString(),
        parseAccuracy: 0,
        provider: "error",
        warnings: ["⚠️ Parsing failed — please fill in your details manually"],
        personal: { name: "", email: "", phone: "", linkedin: "", location: "", portfolio: "", jobTitle: "" },
        summary: "", experience: [], education: [], skills: [], certifications: [],
      },
      rawPreview: "",
      meta: { textLength: 0, isLowQuality: true, provider: "error", parseAccuracy: 0 },
    });
  }
}
