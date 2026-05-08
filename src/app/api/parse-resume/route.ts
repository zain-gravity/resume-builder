import { NextRequest, NextResponse } from "next/server";
import { parseResumeWithAI } from "@/lib/ai-resume-parser";

export const runtime = "nodejs";
export const maxDuration = 30;

// ─── SIMPLE PARSER ───────────────────────────────────────────────────────────
// Works on 95%+ resumes without complex regex
function simpleParser(text: string, filename: string) {
  const id = Math.random().toString(36).substring(2, 10);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const warnings: string[] = [];

  // 1. EMAIL — most reliable field
  const emailMatch = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch?.[0]?.toLowerCase() || "";
  if (!email) warnings.push("⚠️ Could not detect email address");

  // 2. PHONE
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch?.[0]?.trim() || "";
  if (!phone) warnings.push("⚠️ Could not detect phone number");

  // 3. LINKEDIN
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch?.[0] || "";

  // 4. NAME — first line that looks like a name (2+ capitalized words, no digits/@)
  let name = "";
  for (const line of lines.slice(0, 5)) {
    if (line.includes("@") || /\d/.test(line) || line.length > 60 || line.length < 3) continue;
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)+$/.test(line)) {
      name = line; break;
    }
  }
  // Fallback: first line without contact info
  if (!name) {
    for (const line of lines.slice(0, 3)) {
      if (!line.includes("@") && !/\d{4}/.test(line) && line.length > 3 && line.length < 60) {
        name = line; break;
      }
    }
  }
  if (!name) warnings.push("⚠️ Could not detect name");

  // 5. LOCATION — "City, ST" or "City, Country"
  const locMatch = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?,\s*(?:[A-Z]{2}|[A-Z][a-z]{3,})\b/);
  const location = locMatch?.[0] || "";

  // 6. JOB TITLE — line near top containing title keywords
  const titleKw = /engineer|developer|manager|designer|analyst|director|lead|senior|junior|consultant|specialist|architect|scientist|officer|coordinator|associate|intern|president|vp|head/i;
  let jobTitle = "";
  for (const line of lines.slice(0, 8)) {
    if (titleKw.test(line) && line.length < 80 && !line.includes("@")) {
      jobTitle = line; break;
    }
  }

  // 7. SECTION DETECTION
  const sectionRe = /^(experience|work\s+(?:experience|history)|employment|education|skills|technical\s+skills|summary|objective|profile|certifications?|projects?)[\s:]*$/i;

  type Section = "header" | "summary" | "experience" | "education" | "skills" | "certifications" | "other";
  let currentSection: Section = "header";
  const sectionLines: Record<Section, string[]> = {
    header: [], summary: [], experience: [], education: [], skills: [], certifications: [], other: [],
  };

  for (const line of lines) {
    if (sectionRe.test(line)) {
      const key = line.toLowerCase().trim().replace(/[:\s]+$/, "");
      if (/summary|objective|profile/.test(key)) currentSection = "summary";
      else if (/experience|employment|work/.test(key)) currentSection = "experience";
      else if (/education/.test(key)) currentSection = "education";
      else if (/skill/.test(key)) currentSection = "skills";
      else if (/cert/.test(key)) currentSection = "certifications";
      else currentSection = "other";
      continue;
    }
    sectionLines[currentSection].push(line);
  }

  // 8. SUMMARY
  const summary = sectionLines.summary.slice(0, 5).join(" ").substring(0, 600);

  // 9. EXPERIENCE — look for date patterns to anchor job blocks
  const dateRe = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|dec)[a-z]*\.?\s+)?\d{4}|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]+\s*(?:Present|Current|Now)/gi;
  const bulletRe = /^[•\-\*·▪]\s+/;

  interface ExpEntry { company: string; title: string; startDate: string; endDate: string; current: boolean; location: string; bullets: string[] }
  const experience: ExpEntry[] = [];
  let curExp: ExpEntry | null = null;

  const expLines = sectionLines.experience.length > 3
    ? sectionLines.experience
    : lines; // Fall back to full text if section detection failed

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    dateRe.lastIndex = 0;
    const dm = dateRe.exec(line);
    if (dm) {
      if (curExp) experience.push(curExp);
      const isPresent = /present|current|now/i.test(dm[0]);
      const parts = dm[0].split(/[-–—]+/);
      const startDate = parts[0]?.trim() || "";
      const endDate = isPresent ? "" : parts[1]?.trim() || "";
      curExp = { company: "", title: "", startDate, endDate, current: isPresent, location: "", bullets: [] };
      // grab company from prev line
      if (i > 0) {
        const prev = expLines[i - 1]?.trim();
        if (prev && !bulletRe.test(prev) && prev.length < 80) {
          if (prev.includes("|") || prev.includes("·")) {
            const [a, b] = prev.split(/[|·]/).map((s) => s.trim());
            curExp.title = a || ""; curExp.company = b || "";
          } else curExp.company = prev;
        }
      }
      continue;
    }
    if (!curExp) continue;
    if (bulletRe.test(line)) {
      curExp.bullets.push(line.replace(bulletRe, "").trim());
    } else if (!curExp.title && titleKw.test(line) && line.length < 80) {
      curExp.title = line;
    } else if (!curExp.company && line.length < 80 && !/^[a-z]/.test(line)) {
      curExp.company = line;
    } else if (line.length > 40 && curExp.startDate) {
      // Long line without bullet — treat as bullet
      curExp.bullets.push(line);
    }
  }
  if (curExp) experience.push(curExp);

  // 10. EDUCATION
  interface EduEntry { school: string; degree: string; field: string; startDate: string; endDate: string; gpa: string; location: string }
  const education: EduEntry[] = [];
  const schoolKw = /university|college|institute|school|academy|polytechnic/i;
  const degreeKw = /bachelor|master|phd|ph\.d|doctor|associate|b\.s|b\.a|m\.s|m\.a|mba|b\.eng|m\.eng|diploma|certificate/i;
  let curEdu: EduEntry | null = null;

  for (const line of sectionLines.education.length > 0 ? sectionLines.education : lines) {
    if (schoolKw.test(line)) {
      if (curEdu) education.push(curEdu);
      curEdu = { school: line, degree: "", field: "", startDate: "", endDate: "", gpa: "", location: "" };
    } else if (degreeKw.test(line) && !curEdu) {
      curEdu = { school: "", degree: line, field: "", startDate: "", endDate: "", gpa: "", location: "" };
    } else if (curEdu) {
      if (degreeKw.test(line) && !curEdu.degree) { curEdu.degree = line; continue; }
      const gm = line.match(/GPA[:\s]+([0-9.]+)/i);
      if (gm) { curEdu.gpa = gm[1]; continue; }
      const yrm = line.match(/\b(19|20)\d{2}\b/);
      if (yrm) { curEdu.endDate = yrm[0]; continue; }
    }
  }
  if (curEdu) education.push(curEdu);

  // 11. SKILLS — match against common tech list
  const SKILLS = [
    "JavaScript","TypeScript","Python","Java","C++","C#","Go","Rust","Swift","Kotlin","Ruby","PHP","R",
    "React","Next.js","Vue.js","Angular","Svelte","Node.js","Express","FastAPI","Django","Spring","Laravel",
    "HTML","CSS","Tailwind","Bootstrap","GraphQL","REST",
    "PostgreSQL","MySQL","MongoDB","Redis","DynamoDB","Elasticsearch",
    "AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","Jenkins","GitHub Actions","Linux",
    "Machine Learning","TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy","NLP",
    "Git","GitHub","Jira","Figma","Postman","Excel","Power BI","Tableau","Salesforce","Shopify","WordPress",
    "Agile","Scrum","DevOps","Microservices","SQL","Spark","Kafka",
    "iOS","Android","React Native","Flutter","SEO",
  ];
  const textLow = text.toLowerCase();
  const skills = SKILLS.filter((s) =>
    new RegExp(`(?:^|[\\s,;|•])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s,;|•]|$)`, "i").test(text)
    || textLow.includes(s.toLowerCase())
  ).slice(0, 25);

  // 12. CERTIFICATIONS
  const certifications = sectionLines.certifications
    .filter((l) => l.length > 5)
    .map((line) => {
      const ym = line.match(/\b(19|20)\d{2}\b/);
      return { name: line.replace(/\b(19|20)\d{2}\b/, "").trim(), issuer: "", date: ym?.[0] || "", url: "" };
    })
    .slice(0, 6);

  // 13. ACCURACY
  let acc = 0;
  if (name) acc += 20;
  if (email) acc += 15;
  if (phone) acc += 10;
  if (location) acc += 5;
  if (linkedin) acc += 5;
  if (summary) acc += 10;
  if (experience.length > 0) acc += 15;
  if (experience.length > 1) acc += 5;
  if (education.length > 0) acc += 10;
  if (skills.length >= 3) acc += 5;

  return {
    id, filename, parsedAt: new Date().toISOString(),
    parseAccuracy: Math.min(100, acc),
    warnings,
    personal: { name, email, phone, linkedin, location, portfolio: "", jobTitle },
    summary,
    experience,
    education,
    skills,
    certifications,
  };
}

// ─── TEXT EXTRACTION ─────────────────────────────────────────────────────────
async function extractPDF(buffer: Buffer): Promise<string> {
  // Strategy 1: pdfjs-dist legacy (no worker required in Node.js)
  try {
    // Use the legacy CJS build which doesn't need worker setup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    // Must set empty workerSrc to disable worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      useSystemFonts: true,
      verbosity: 0,
    }).promise;

    const textParts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        // Group items by Y position to preserve reading order
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
        const sortedY = Array.from(byY.keys()).sort((a, b) => b - a);
        for (const y of sortedY) {
          const row = byY.get(y)!.sort((a, b) => a.x - b.x);
          const line = row.map((r) => r.str).join(" ").trim();
          if (line) textParts.push(line);
        }
      } catch { /* skip bad pages */ }
    }

    const text = textParts.join("\n").trim();
    if (text.length > 50) {
      console.log("pdfjs-dist legacy succeeded:", text.length, "chars");
      return text;
    }
  } catch (e) {
    console.log("pdfjs-dist legacy failed:", e instanceof Error ? e.message : String(e));
  }

  // Strategy 2: manual PDF text stream extraction (works without any npm package)
  try {
    const raw = buffer.toString("binary");
    const chunks: string[] = [];
    // Match BT...ET blocks
    const btEt = /BT[\s\S]*?ET/g;
    let m: RegExpExecArray | null;
    while ((m = btEt.exec(raw)) !== null) {
      const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|\")|(\[[\s\S]*?\])\s*TJ/g;
      let sm: RegExpExecArray | null;
      while ((sm = strRe.exec(m[0])) !== null) {
        let s = sm[1] || "";
        if (!s && sm[2]) {
          const arr = sm[2].match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g) || [];
          s = arr.map((a) => a.slice(1, -1)).join("");
        }
        // Decode PDF octal escapes like \055
        s = s.replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
        s = s.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\\\/g, "\\").replace(/\\([^0-9])/g, "$1");
        if (s.trim()) chunks.push(s);
      }
    }
    const text = chunks.join(" ").replace(/\s+/g, " ").trim();
    if (text.length > 30) {
      console.log("Manual BT/ET extraction:", text.length, "chars");
      return text;
    }
  } catch (e) {
    console.log("Manual PDF extraction failed:", e);
  }

  return "";
}

async function extractDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  } catch (e) {
    console.log("mammoth failed:", e instanceof Error ? e.message : e);
    return "";
  }
}

function extractDOC(buffer: Buffer): string {
  // Extract printable ASCII runs from binary DOC
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

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
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

    // ── Step 1: Extract raw text from file ──────────────────────────────────
    const isPDF = ext === "pdf" || buffer.slice(0, 4).toString("ascii") === "%PDF";
    const isDOCX = ext === "docx" || (buffer[0] === 0x50 && buffer[1] === 0x4b);
    const isDOC = ext === "doc" || (buffer[0] === 0xd0 && buffer[1] === 0xcf);

    let rawText = "";
    if (isPDF) rawText = await extractPDF(buffer);
    else if (isDOCX) rawText = await extractDOCX(buffer);
    else if (isDOC) rawText = extractDOC(buffer);
    else rawText = buffer.toString("utf-8");

    rawText = cleanText(rawText);
    console.log(`Extracted ${rawText.length} chars from ${filename}`);

    // ── Step 2: AI-powered parsing (Gemini → Groq → regex fallback) ─────────
    const aiResult = await parseResumeWithAI(rawText);
    console.log(`[parse-resume] Provider: ${aiResult.provider}, Accuracy: ${aiResult.parseAccuracy}%`);

    // ── Step 3: Convert AI output to ParsedResume schema ────────────────────
    const id = Math.random().toString(36).substring(2, 10);
    const ai = aiResult.data;

    const parsed = {
      id,
      filename,
      parsedAt: new Date().toISOString(),
      parseAccuracy: aiResult.parseAccuracy,
      provider: aiResult.provider,
      warnings: rawText.length < 100 ? ["⚠️ Very little text extracted — result may be incomplete"] : [],
      personal: {
        name: ai.personal.name,
        email: ai.personal.email,
        phone: ai.personal.phone,
        linkedin: ai.personal.linkedin,
        location: ai.personal.location,
        portfolio: ai.personal.portfolio,
        jobTitle: ai.personal.jobTitle,
      },
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

    const rawPreview = rawText.substring(0, 2000);

    return NextResponse.json({
      success: true,
      data: parsed,
      rawPreview,
      meta: {
        textLength: rawText.length,
        isLowQuality: rawText.length < 100,
        provider: aiResult.provider,
        parseAccuracy: aiResult.parseAccuracy,
      },
    });
  } catch (err) {
    console.error("parse-resume critical:", err);
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
        summary: "",
        experience: [],
        education: [],
        skills: [],
        certifications: [],
      },
      rawPreview: "",
      meta: { textLength: 0, isLowQuality: true, provider: "error", parseAccuracy: 0 },
    });
  }
}
