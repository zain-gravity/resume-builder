import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── MASTER PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume parser with 99% accuracy.
Your job is to extract EVERY piece of information from the resume text and return it as structured JSON.
Never skip fields. Never hallucinate. Return ONLY valid JSON, no markdown, no explanation.`;

function buildUserPrompt(resumeText: string): string {
  return `Extract ALL information from this resume and return ONLY this JSON structure (no markdown):

{
  "personal": {
    "name": "Full name exactly as written",
    "email": "email address",
    "phone": "phone number with country code if present",
    "location": "City, State or City, Country",
    "linkedin": "linkedin.com/in/username or full URL",
    "portfolio": "GitHub, portfolio website, or other URL",
    "jobTitle": "Current or most recent job title"
  },
  "summary": "Complete professional summary paragraph",
  "experience": [
    {
      "company": "Exact company name",
      "title": "Exact job title",
      "location": "City, State",
      "startDate": "YYYY-MM format (e.g. 2021-01)",
      "endDate": "YYYY-MM format, or empty string if current job",
      "current": false,
      "bullets": ["Full bullet point 1", "Full bullet point 2"]
    }
  ],
  "education": [
    {
      "school": "University or College name",
      "degree": "Type of degree (Bachelor, Master, PhD, etc)",
      "field": "Field of study",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "gpa": "GPA value or empty string"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "YYYY-MM",
      "url": ""
    }
  ]
}

IMPORTANT RULES:
- Extract EVERY job, not just recent ones
- Include ALL bullet points under each job
- Convert dates: "Jan 2022" → "2022-01", "January 2022" → "2022-01", "2022" → "2022-01"
- If end date is "Present", "Current", "Now", "Till Date" → set endDate="" and current=true
- Extract EVERY skill mentioned anywhere in the document
- If a field is missing, use "" for strings and [] for arrays
- Return ONLY the JSON object, starting with { and ending with }

RESUME TEXT:
---
${resumeText.slice(0, 30000)}
---`;
}

// ─── GROQ AI PARSER ───────────────────────────────────────────────────────────
async function parseWithGroq(resumeText: string, apiKey: string): Promise<object> {
  // Use the most capable model available, fall through to faster ones
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
  ];

  let lastError = "";
  for (const model of models) {
    try {
      console.log(`[Groq] Trying ${model}...`);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(resumeText) },
          ],
          temperature: 0.05,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (res.status === 429) {
        console.warn(`[Groq] ${model} rate limited, trying next...`);
        lastError = "Rate limited";
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Groq] ${model} HTTP ${res.status}:`, errText.slice(0, 200));
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) { lastError = "Empty response"; continue; }

      const parsed = JSON.parse(raw);
      console.log(`[Groq] ✅ ${model} — name="${parsed?.personal?.name}", ${parsed?.experience?.length || 0} jobs, ${parsed?.skills?.length || 0} skills`);
      return parsed;

    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`[Groq] ${model} error:`, lastError);
      continue;
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError}`);
}

// ─── PDF TEXT EXTRACTION ──────────────────────────────────────────────────────
async function extractPDFText(buffer: Buffer): Promise<string> {
  // Method 1: pdf-parse (fastest, most reliable for text PDFs)
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer, { max: 0 });
    const text = (result.text || "").trim();
    if (text.length > 100) {
      console.log(`[PDF] pdf-parse: ${text.length} chars`);
      return text;
    }
    console.log(`[PDF] pdf-parse returned only ${text.length} chars, trying next...`);
  } catch (e) {
    console.warn("[PDF] pdf-parse failed:", e instanceof Error ? e.message : e);
  }

  // Method 2: pdfjs-dist with spatial sorting (better for multi-column)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
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
          // @ts-expect-error pdfjs
          const y = Math.round(item.transform[5] / 3) * 3; // group nearby y coords
          // @ts-expect-error pdfjs
          const x = Math.round(item.transform[4]);
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y)!.push({ x, str: item.str });
        }
        for (const y of Array.from(byY.keys()).sort((a, b) => b - a)) {
          const row = byY.get(y)!.sort((a, b) => a.x - b.x);
          const line = row.map(r => r.str).join(" ").trim();
          if (line) allLines.push(line);
        }
      } catch { /* skip page */ }
    }
    const text = allLines.join("\n");
    if (text.length > 100) {
      console.log(`[PDF] pdfjs: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.warn("[PDF] pdfjs failed:", e instanceof Error ? e.message : e);
  }

  // Method 3: Raw stream extraction
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
        if (s.trim().length > 1) chunks.push(s);
      }
    }
    const text = chunks.join(" ").replace(/\s+/g, " ").trim();
    if (text.length > 100) {
      console.log(`[PDF] raw stream: ${text.length} chars`);
      return text;
    }
  } catch { /* ignore */ }

  console.log("[PDF] All extraction methods failed — likely scanned/image PDF");
  return "";
}

// ─── SANITIZE OUTPUT ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitize(r: any): object {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experience: (Array.isArray(r?.experience) ? r.experience : []).slice(0, 20).map((e: any) => ({
      company: String(e.company || "").slice(0, 150),
      title: String(e.title || "").slice(0, 150),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      current: Boolean(e.current),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bullets: (Array.isArray(e.bullets) ? e.bullets : []).map((b: any) => String(b).slice(0, 500)).filter(Boolean),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    education: (Array.isArray(r?.education) ? r.education : []).map((e: any) => ({
      school: String(e.school || "").slice(0, 200),
      degree: String(e.degree || "").slice(0, 200),
      field: String(e.field || "").slice(0, 200),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      gpa: String(e.gpa || "").slice(0, 15),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skills: (Array.isArray(r?.skills) ? r.skills : []).slice(0, 60).map((s: any) => String(s).slice(0, 100)).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isPDF = ext === "pdf" || buffer.slice(0, 4).toString("ascii") === "%PDF";
    const isDOCX = ext === "docx" || (buffer[0] === 0x50 && buffer[1] === 0x4b);

    // ── Step 1: Extract raw text ──
    let rawText = "";
    if (isPDF) {
      rawText = await extractPDFText(buffer);
    } else if (isDOCX) {
      try {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || "";
      } catch {
        rawText = "";
      }
    } else {
      rawText = buffer.toString("utf-8");
    }

    // Clean control characters
    rawText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ").replace(/\s{4,}/g, "\n").trim();
    console.log(`[parse-resume] "${filename}" → ${rawText.length} chars (PDF=${isPDF} DOCX=${isDOCX})`);

    // ── Step 2: Parse with Groq AI ──
    const groqKey = process.env.GROQ_API_KEY;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = null;
    let provider = "regex";
    let parseAccuracy = 60;

    if (groqKey && rawText.length > 50) {
      try {
        const raw = await parseWithGroq(rawText, groqKey);
        parsed = sanitize(raw);
        provider = "groq";
        parseAccuracy = 93;
      } catch (e) {
        console.warn("[parse-resume] Groq failed:", e instanceof Error ? e.message : e);
      }
    } else if (!groqKey) {
      console.log("[parse-resume] No GROQ_API_KEY set — falling back to regex");
    } else {
      console.log("[parse-resume] Text too short for AI parsing:", rawText.length, "chars");
    }

    // ── Step 3: Regex fallback if Groq failed ──
    if (!parsed) {
      const { parseResumeWithAI } = await import("@/lib/ai-resume-parser");
      const result = await parseResumeWithAI(rawText || "");
      parsed = result.data;
      provider = result.provider;
      parseAccuracy = result.parseAccuracy;
    }

    // ── Build warnings ──
    const warnings: string[] = [];
    if (rawText.length < 100) warnings.push("⚠️ Very little text extracted — this may be a scanned/image PDF. Try uploading a DOCX instead.");
    if (!parsed.personal?.name) warnings.push("⚠️ Name not detected — please fill in manually");
    if (!parsed.personal?.email) warnings.push("⚠️ Email not found");
    if (parsed.experience?.length === 0) warnings.push("⚠️ No work experience found");

    console.log(`[parse-resume] Done — provider=${provider} acc=${parseAccuracy}% name="${parsed.personal?.name}"`);

    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(2, 10),
        filename,
        parsedAt: new Date().toISOString(),
        parseAccuracy,
        provider,
        warnings,
        personal: parsed.personal,
        summary: parsed.summary,
        experience: parsed.experience,
        education: parsed.education,
        skills: parsed.skills,
        certifications: parsed.certifications,
      },
      rawPreview: rawText.substring(0, 2000),
      meta: {
        textLength: rawText.length,
        isLowQuality: rawText.length < 100,
        provider,
        parseAccuracy,
      },
    });

  } catch (err) {
    console.error("[parse-resume] Critical error:", err);
    return NextResponse.json({
      success: true,
      data: {
        id: Math.random().toString(36).substring(2, 10),
        filename, parsedAt: new Date().toISOString(),
        parseAccuracy: 0, provider: "error",
        warnings: ["Parsing failed — please fill in your details manually"],
        personal: { name:"",email:"",phone:"",linkedin:"",location:"",portfolio:"",jobTitle:"" },
        summary:"", experience:[], education:[], skills:[], certifications:[],
      },
      rawPreview: "",
      meta: { textLength: 0, isLowQuality: true, provider: "error", parseAccuracy: 0 },
    });
  }
}
