import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInText } from "@/lib/linkedin-parser";

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

async function extractPDF(buffer: Buffer): Promise<string> {
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

    const lines: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      try {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const byY = new Map<number, { x: number; str: string }[]>();
        for (const item of content.items) {
          if (!("str" in item) || !item.str) continue;
          // @ts-ignore
          const y = Math.round(item.transform[5]);
          // @ts-ignore
          const x = Math.round(item.transform[4]);
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y)!.push({ x, str: item.str });
        }
        for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
          const row = byY.get(y)!.sort((a, b) => a.x - b.x);
          const line = row.map((r) => r.str).join(" ").trim();
          if (line) lines.push(line);
        }
      } catch { /* skip */ }
    }
    return cleanText(lines.join("\n"));
  } catch (e) {
    console.log("PDF extraction failed:", e instanceof Error ? e.message : e);
    return "";
  }
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

    const isPDF = filename.toLowerCase().endsWith(".pdf") || buffer.slice(0, 4).toString("ascii") === "%PDF";

    let rawText = "";
    if (isPDF) {
      rawText = await extractPDF(buffer);
    } else {
      // Try as plain text (TXT paste)
      rawText = cleanText(buffer.toString("utf-8"));
    }

    console.log(`LinkedIn PDF: ${filename} → ${rawText.length} chars`);

    const parsed = parseLinkedInText(rawText, filename);
    const rawPreview = rawText.substring(0, 2000);

    return NextResponse.json({
      success: true,
      data: parsed,
      rawPreview,
      meta: { textLength: rawText.length, isLinkedIn: true },
    });
  } catch (err) {
    console.error("LinkedIn PDF parse error:", err);
    return NextResponse.json({
      success: true,
      data: parseLinkedInText("", filename),
      rawPreview: "",
      meta: { textLength: 0, isLinkedIn: true },
    });
  }
}
