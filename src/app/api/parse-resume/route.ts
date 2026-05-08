import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── MASTER PROMPT ────────────────────────────────────────────────────────────
function buildPrompt(): string {
  return `You are an expert ATS resume parser with 99% accuracy. Extract ALL information from this resume and return ONLY a valid JSON object. No markdown, no explanation, no code fences.

EXTRACT EVERY SINGLE FIELD. Never skip or abbreviate.

JSON schema (fill all fields, use "" for missing strings, [] for missing arrays):
{
  "personal": {
    "name": "Full Name exactly as written",
    "email": "email@example.com",
    "phone": "+1 555 123 4567",
    "location": "City, State/Country",
    "linkedin": "linkedin.com/in/username",
    "portfolio": "github.com/user or website URL",
    "jobTitle": "Current or most recent job title"
  },
  "summary": "Full professional summary paragraph",
  "experience": [
    {
      "company": "Exact company name",
      "title": "Exact job title",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty string if current",
      "current": false,
      "bullets": ["Achievement or responsibility 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "school": "University/College name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "gpa": "3.8 or empty"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "YYYY-MM",
      "url": ""
    }
  ]
}

CRITICAL RULES:
1. Extract EVERY job entry - do not skip any
2. Extract EVERY bullet point under each job
3. Convert all date formats to YYYY-MM (e.g. "Jan 2022" → "2022-01", "2022" → "2022-01")
4. If end date says "Present", "Current", "Now" → set endDate="" and current=true
5. Extract ALL skills mentioned anywhere in the document
6. Never hallucinate or add data not present in the resume
7. Return ONLY the JSON object, nothing else`;
}

// ─── STRATEGY 1: GEMINI VISION (send PDF directly as document) ───────────────
async function parseWithGeminiVision(fileBuffer: Buffer, mimeType: string, apiKey: string): Promise<object> {
  const base64 = fileBuffer.toString("base64");
  const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash-lite"];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64 } },
                { text: buildPrompt() }
              ]
            }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.05,
              maxOutputTokens: 8192,
            },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (res.status === 429 || res.status === 404) {
        console.warn(`[Vision] Gemini ${model} returned ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`Gemini vision ${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`${model} returned empty`);
      console.log(`[Vision] Gemini ${model} success`);
      return JSON.parse(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429") || msg.includes("404")) continue;
      throw e;
    }
  }
  throw new Error("All Gemini vision models failed");
}

// ─── STRATEGY 2: GROQ with extracted text ─────────────────────────────────────
async function parseWithGroq(text: string, apiKey: string): Promise<object> {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama-3.1-8b-instant"];

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert ATS resume parser. Always respond with valid JSON only. Never add markdown, explanations or code fences. Extract every field completely and accurately."
            },
            { role: "user", content: `${buildPrompt()}\n\nRESUME TEXT:\n${text.slice(0, 30000)}` }
          ],
          temperature: 0.05,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (res.status === 429) { console.warn(`[Groq] ${model} rate limited`); continue; }
      if (!res.ok) throw new Error(`Groq ${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) throw new Error(`Groq ${model} empty response`);
      console.log(`[Groq] ${model} success`);
      return JSON.parse(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) continue;
      throw e;
    }
  }
  throw new Error("All Groq models failed");
}

// ─── EXTRACT TEXT (multiple methods) ─────────────────────────────────────────
async function extractText(buffer: Buffer): Promise<string> {
  // Method 1: pdf-parse (most reliable)
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    const text = (result.text || "").trim();
    if (text.length > 100) {
      console.log(`[Extract] pdf-parse: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[Extract] pdf-parse failed:", e instanceof Error ? e.message : e);
  }

  // Method 2: pdfjs-dist with coordinate sort
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;
    const lines: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const byY = new Map<number, {x: number; str: string}[]>();
      for (const item of content.items) {
        if (!("str" in item) || !item.str?.trim()) continue;
        // @ts-expect-error pdfjs
        const y = Math.round(item.transform[5]);
        // @ts-expect-error pdfjs
        const x = Math.round(item.transform[4]);
        if (!byY.has(y)) byY.set(y, []);
        byY.get(y)!.push({ x, str: item.str });
      }
      for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
        const line = byY.get(y)!.sort((a, b) => a.x - b.x).map(r => r.str).join(" ");
        if (line.trim()) lines.push(line.trim());
      }
    }
    const text = lines.join("\n");
    if (text.length > 100) {
      console.log(`[Extract] pdfjs: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[Extract] pdfjs failed:", e instanceof Error ? e.message : e);
  }

  return "";
}

// ─── SANITIZE & VALIDATE ──────────────────────────────────────────────────────
function sanitize(raw: object): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;
  const p = r?.personal || {};
  return {
    personal: {
      name: String(p.name || "").slice(0, 120),
      email: String(p.email || "").toLowerCase().slice(0, 200),
      phone: String(p.phone || "").slice(0, 50),
      location: String(p.location || "").slice(0, 150),
      linkedin: String(p.linkedin || "").slice(0, 300),
      portfolio: String(p.portfolio || "").slice(0, 300),
      jobTitle: String(p.jobTitle || "").slice(0, 150),
    },
    summary: String(r?.summary || "").slice(0, 2000),
    experience: (Array.isArray(r?.experience) ? r.experience : []).slice(0, 20).map((e: any) => ({
      company: String(e.company || "").slice(0, 150),
      title: String(e.title || "").slice(0, 150),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      current: Boolean(e.current),
      bullets: (Array.isArray(e.bullets) ? e.bullets : []).map((b: any) => String(b).slice(0, 500)).filter(Boolean),
    })),
    education: (Array.isArray(r?.education) ? r.education : []).map((e: any) => ({
      school: String(e.school || "").slice(0, 200),
      degree: String(e.degree || "").slice(0, 200),
      field: String(e.field || "").slice(0, 200),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      gpa: String(e.gpa || "").slice(0, 15),
    })),
    skills: (Array.isArray(r?.skills) ? r.skills : []).slice(0, 60).map((s: any) => String(s).slice(0, 100)).filter(Boolean),
    certifications: (Array.isArray(r?.certifications) ? r.certifications : []).slice(0, 10).map((c: any) => ({
      name: String(c.name || "").slice(0, 200),
      issuer: String(c.issuer || "").slice(0, 200),
      date: String(c.date || "").slice(0, 20),
      url: String(c.url || "").slice(0, 300),
    })),
  };
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let filename = "resume";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

    filename = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const geminiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let parsed: object | null = null;
    let provider = "regex";
    let parseAccuracy = 60;

    // ── Detect MIME type ──
    const isPDF = ext === "pdf" || buffer.slice(0, 4).toString("ascii") === "%PDF";
    const isDOCX = ext === "docx" || (buffer[0] === 0x50 && buffer[1] === 0x4b);
    const mimeType = isPDF ? "application/pdf" : isDOCX ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain";

    // ── STRATEGY 1: Gemini Vision (reads PDF natively — best for all PDFs) ──
    if (geminiKey && (isPDF || isDOCX)) {
      try {
        console.log("[Parser] Strategy 1: Gemini Vision PDF...");
        parsed = sanitize(await parseWithGeminiVision(buffer, mimeType, geminiKey));
        provider = "gemini-vision";
        parseAccuracy = 97;
        console.log("[Parser] ✅ Gemini Vision success");
      } catch (e) {
        console.warn("[Parser] Gemini Vision failed:", e instanceof Error ? e.message : e);
      }
    }

    // ── STRATEGY 2: Extract text → Groq (best free AI) ──
    if (!parsed) {
      let rawText = "";
      if (isPDF) {
        rawText = await extractText(buffer);
      } else if (isDOCX) {
        try {
          const mammoth = (await import("mammoth")).default;
          const result = await mammoth.extractRawText({ buffer });
          rawText = result.value || "";
        } catch { rawText = ""; }
      } else {
        rawText = buffer.toString("utf-8");
      }

      rawText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ").trim();
      console.log(`[Parser] Extracted ${rawText.length} chars of text`);

      if (groqKey && rawText.length > 50) {
        try {
          console.log("[Parser] Strategy 2: Groq AI text parsing...");
          parsed = sanitize(await parseWithGroq(rawText, groqKey));
          provider = "groq";
          parseAccuracy = 93;
          console.log("[Parser] ✅ Groq success");
        } catch (e) {
          console.warn("[Parser] Groq failed:", e instanceof Error ? e.message : e);
        }
      }

      // ── STRATEGY 3: Gemini Vision with text as prompt ──
      if (!parsed && geminiKey && rawText.length > 50) {
        try {
          console.log("[Parser] Strategy 3: Gemini text parsing...");
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${buildPrompt()}\n\nRESUME TEXT:\n${rawText.slice(0, 28000)}` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.05, maxOutputTokens: 8192 },
              }),
              signal: AbortSignal.timeout(25000),
            }
          );
          if (res.ok) {
            const d = await res.json();
            const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              parsed = sanitize(JSON.parse(text));
              provider = "gemini";
              parseAccuracy = 95;
              console.log("[Parser] ✅ Gemini text success");
            }
          }
        } catch (e) {
          console.warn("[Parser] Gemini text failed:", e instanceof Error ? e.message : e);
        }
      }
    }

    // ── STRATEGY 4: Robust regex fallback ──
    if (!parsed) {
      console.log("[Parser] Strategy 4: Regex fallback");
      const { parseResumeWithAI } = await import("@/lib/ai-resume-parser");
      const text = await extractText(buffer);
      const result = await parseResumeWithAI(text || buffer.toString("utf-8").slice(0, 10000));
      parsed = result.data;
      provider = "regex";
      parseAccuracy = result.parseAccuracy;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = parsed as any;
    const warnings: string[] = [];
    if (!p.personal?.name) warnings.push("⚠️ Name not detected");
    if (!p.personal?.email) warnings.push("⚠️ Email not found");
    if (p.experience?.length === 0) warnings.push("⚠️ No work experience found");

    const id = Math.random().toString(36).substring(2, 10);
    const rawPreview = (await extractText(buffer)).substring(0, 2000);

    return NextResponse.json({
      success: true,
      data: {
        id, filename,
        parsedAt: new Date().toISOString(),
        parseAccuracy,
        provider,
        warnings,
        ...p,
      },
      rawPreview,
      meta: { provider, parseAccuracy, isLowQuality: parseAccuracy < 70 },
    });

  } catch (err) {
    console.error("[Parser] Critical failure:", err);
    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(2, 10),
        filename, parsedAt: new Date().toISOString(),
        parseAccuracy: 0, provider: "error",
        warnings: ["Parsing failed — please fill in manually"],
        personal: { name: "", email: "", phone: "", linkedin: "", location: "", portfolio: "", jobTitle: "" },
        summary: "", experience: [], education: [], skills: [], certifications: [],
      },
      rawPreview: "", meta: { provider: "error", parseAccuracy: 0, isLowQuality: true },
    });
  }
}
