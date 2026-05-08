/**
 * AI-Powered Resume Parser
 * Primary:  Google Gemini 1.5 Flash (free, fast, 1M context)
 * Fallback: Groq llama-3.1-8b-instant (free, 300+ tok/s)
 * Final:    Robust regex parser (always works, no API key)
 */

export interface AIParsedResume {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
    jobTitle: string;
  };
  summary: string;
  experience: {
    company: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    url: string;
  }[];
}

// ─── PROMPT ──────────────────────────────────────────────────────────────────

function buildPrompt(resumeText: string): string {
  return `You are an expert resume parser. Extract ALL information from the resume below and return a single valid JSON object. Do not include markdown, code fences, or any text outside the JSON.

SCHEMA:
{
  "personal": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1 234 567 8900",
    "location": "City, State/Country",
    "linkedin": "linkedin.com/in/username",
    "portfolio": "portfolio or github URL",
    "jobTitle": "Current or most recent job title"
  },
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty if current",
      "current": false,
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "gpa": "3.8 or empty"
    }
  ],
  "skills": ["Skill1", "Skill2"],
  "certifications": [
    {
      "name": "Cert Name",
      "issuer": "Org",
      "date": "YYYY-MM",
      "url": ""
    }
  ]
}

RULES:
- Extract EVERY job, education, skill, and certification
- Convert dates to YYYY-MM where possible. Use YYYY if only year available
- If end date is "present"/"current"/"now" set endDate="" and current=true
- Split descriptions into individual bullet strings
- Include ALL skills mentioned anywhere (technical + soft + tools)
- Use empty string "" for missing string fields, [] for missing arrays
- Return ONLY the JSON object

RESUME TEXT:
---
${resumeText.slice(0, 28000)}
---`;
}

// ─── GEMINI 1.5 FLASH (Primary — Free) ───────────────────────────────────────

async function parseWithGemini(resumeText: string, apiKey: string): Promise<AIParsedResume> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(resumeText) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  return JSON.parse(text) as AIParsedResume;
}

// ─── GROQ LLAMA (Fallback — Free) ────────────────────────────────────────────

async function parseWithGroq(resumeText: string, apiKey: string): Promise<AIParsedResume> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are an expert resume parser. Always respond with valid JSON only, no markdown." },
        { role: "user", content: buildPrompt(resumeText) },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response");

  return JSON.parse(text) as AIParsedResume;
}

// ─── ROBUST REGEX FALLBACK ────────────────────────────────────────────────────

function parseWithRegex(text: string): AIParsedResume {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Personal fields
  const emailMatch = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?1[\-.\s]?)?\(?\d{3}\)?[\-.\s]?\d{3}[\-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:github\.com\/[\w-]+(?:\/[\w-]+)?|[\w-]+\.(?:io|dev|me|app)(?:\/[\w-]+)?)/i);

  // Name: first 6 lines, looks like a proper name
  let name = "";
  for (const line of lines.slice(0, 6)) {
    if (line.includes("@") || /\d/.test(line) || line.length > 70 || line.length < 3) continue;
    if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(line)) { name = line; break; }
  }
  if (!name) {
    for (const line of lines.slice(0, 3)) {
      if (!line.includes("@") && !/\d{4}/.test(line) && line.length > 3 && line.length < 60 && /[A-Z]/.test(line[0])) {
        name = line; break;
      }
    }
  }

  // Job title
  const titleKw = /engineer|developer|manager|designer|analyst|director|lead|senior|junior|consultant|specialist|architect|scientist|coordinator|associate|intern|president|vp\b|head\s|officer|executive/i;
  let jobTitle = "";
  for (const line of lines.slice(0, 10)) {
    if (titleKw.test(line) && line.length < 90 && !line.includes("@") && !/^\d/.test(line)) { jobTitle = line; break; }
  }

  // Location
  const locMatch = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?,\s*(?:[A-Z]{2}|[A-Z][a-z]{3,})\b/);

  // Section detection
  const sectionRe = /^(experience|work[\s+](?:experience|history)|employment|education|skills|technical[\s+]skills|summary|objective|profile|certifications?|projects?)\s*[:.\-]?\s*$/i;
  type Sec = "header" | "summary" | "experience" | "education" | "skills" | "certifications" | "other";
  let curSec: Sec = "header";
  const sectionLines: Record<Sec, string[]> = {
    header: [], summary: [], experience: [], education: [], skills: [], certifications: [], other: [],
  };

  for (const line of lines) {
    if (sectionRe.test(line)) {
      const k = line.toLowerCase().trim();
      if (/summary|objective|profile/.test(k)) curSec = "summary";
      else if (/experience|employment|work/.test(k)) curSec = "experience";
      else if (/education/.test(k)) curSec = "education";
      else if (/skill/.test(k)) curSec = "skills";
      else if (/cert/.test(k)) curSec = "certifications";
      else curSec = "other";
      continue;
    }
    sectionLines[curSec].push(line);
  }

  // Summary
  const summary = sectionLines.summary.slice(0, 6).join(" ").substring(0, 800);

  // Experience
  const dateRe = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?\d{4}\s*[-\u2013\u2014]+\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?\d{4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s*[-\u2013\u2014]+\s*(?:Present|Current|Now)/gi;
  const bulletRe = /^[•\-*·▪▸→]\s*/;

  interface ExpEntry { company: string; title: string; location: string; startDate: string; endDate: string; current: boolean; bullets: string[] }
  const experience: ExpEntry[] = [];
  let curExp: ExpEntry | null = null;

  const expLines = sectionLines.experience.length > 3 ? sectionLines.experience : lines;
  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    dateRe.lastIndex = 0;
    const dm = dateRe.exec(line);
    if (dm) {
      if (curExp) experience.push(curExp);
      const isPresent = /present|current|now/i.test(dm[0]);
      const parts = dm[0].split(/[-\u2013\u2014]+/);
      curExp = {
        company: "", title: "", location: "",
        startDate: parts[0]?.trim() || "",
        endDate: isPresent ? "" : (parts[1]?.trim() || ""),
        current: isPresent,
        bullets: [],
      };
      const prev = expLines[i - 1]?.trim();
      if (prev && !bulletRe.test(prev) && prev.length < 100) {
        if (prev.includes("|") || prev.includes("·")) {
          const [a, b] = prev.split(/[|·]/).map((s) => s.trim());
          curExp.title = a || ""; curExp.company = b || "";
        } else { curExp.company = prev; }
      }
      continue;
    }
    if (!curExp) continue;
    if (bulletRe.test(line)) {
      curExp.bullets.push(line.replace(bulletRe, "").trim());
    } else if (!curExp.title && titleKw.test(line) && line.length < 100) {
      curExp.title = line;
    } else if (!curExp.company && line.length < 100 && !/^[a-z]/.test(line)) {
      curExp.company = line;
    } else if (line.length > 40) {
      curExp.bullets.push(line);
    }
  }
  if (curExp) experience.push(curExp);

  // Education
  interface EduEntry { school: string; degree: string; field: string; location: string; startDate: string; endDate: string; gpa: string }
  const education: EduEntry[] = [];
  const schoolKw = /university|college|institute|school|academy|polytechnic|faculty/i;
  const degreeKw = /bachelor|master|phd|ph\.d|doctor|associate|b\.s\b|b\.a\b|m\.s\b|m\.a\b|mba|diploma|certificate/i;
  let curEdu: EduEntry | null = null;

  for (const line of (sectionLines.education.length > 0 ? sectionLines.education : [])) {
    if (schoolKw.test(line)) {
      if (curEdu) education.push(curEdu);
      curEdu = { school: line, degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "" };
    } else if (degreeKw.test(line) && !curEdu) {
      curEdu = { school: "", degree: line, field: "", location: "", startDate: "", endDate: "", gpa: "" };
    } else if (curEdu) {
      const gm = line.match(/GPA[:\s]+([0-9.]+)/i);
      if (gm) { curEdu.gpa = gm[1]; continue; }
      if (degreeKw.test(line) && !curEdu.degree) { curEdu.degree = line; continue; }
      const yrm = line.match(/\b(19|20)\d{2}\b/g);
      if (yrm && yrm.length >= 2) { curEdu.startDate = yrm[0]; curEdu.endDate = yrm[1]; }
      else if (yrm) { curEdu.endDate = yrm[0]; }
    }
  }
  if (curEdu) education.push(curEdu);

  // Skills
  const SKILLS_LIST = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "R",
    "React", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express", "FastAPI", "Django", "Spring", "Laravel",
    "HTML", "CSS", "Tailwind", "Bootstrap", "GraphQL", "REST", "PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions", "Linux",
    "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Git", "Figma", "Agile", "Scrum", "SQL", "Spark",
    "React Native", "Flutter", "iOS", "Android", "Excel", "Power BI", "Tableau", "Salesforce",
  ];
  const skills = SKILLS_LIST.filter((s) =>
    new RegExp(`(?:^|[\\s,;|•(])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s,;|•)]|$)`, "i").test(text)
  ).slice(0, 30);

  // Certifications
  const certifications = sectionLines.certifications
    .filter((l) => l.length > 4)
    .map((line) => {
      const ym = line.match(/\b(19|20)\d{2}\b/);
      return {
        name: line.replace(/\b(19|20)\d{2}\b/, "").replace(/^[-–,\s]+|[-–,\s]+$/g, "").trim(),
        issuer: "", date: ym?.[0] || "", url: "",
      };
    })
    .filter((c) => c.name.length > 3)
    .slice(0, 8);

  return {
    personal: {
      name,
      email: emailMatch?.[0]?.toLowerCase() || "",
      phone: phoneMatch?.[0]?.trim() || "",
      location: locMatch?.[0] || "",
      linkedin: linkedinMatch?.[0] || "",
      portfolio: portfolioMatch?.[0] || "",
      jobTitle,
    },
    summary,
    experience,
    education,
    skills,
    certifications,
  };
}

// ─── VALIDATE & SANITIZE ──────────────────────────────────────────────────────

function sanitize(parsed: AIParsedResume): AIParsedResume {
  const p = parsed?.personal || {};
  return {
    personal: {
      name: String(p.name || "").slice(0, 100),
      email: String(p.email || "").slice(0, 200),
      phone: String(p.phone || "").slice(0, 50),
      location: String(p.location || "").slice(0, 150),
      linkedin: String(p.linkedin || "").slice(0, 300),
      portfolio: String(p.portfolio || "").slice(0, 300),
      jobTitle: String(p.jobTitle || "").slice(0, 150),
    },
    summary: String(parsed?.summary || "").slice(0, 2000),
    experience: (Array.isArray(parsed?.experience) ? parsed.experience : []).slice(0, 20).map((e) => ({
      company: String(e.company || "").slice(0, 150),
      title: String(e.title || "").slice(0, 150),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      current: Boolean(e.current),
      bullets: (Array.isArray(e.bullets) ? e.bullets : []).slice(0, 15).map((b) => String(b).slice(0, 500)).filter(Boolean),
    })),
    education: (Array.isArray(parsed?.education) ? parsed.education : []).slice(0, 10).map((e) => ({
      school: String(e.school || "").slice(0, 200),
      degree: String(e.degree || "").slice(0, 200),
      field: String(e.field || "").slice(0, 200),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      gpa: String(e.gpa || "").slice(0, 10),
    })),
    skills: (Array.isArray(parsed?.skills) ? parsed.skills : []).slice(0, 50).map((s) => String(s).slice(0, 100)).filter(Boolean),
    certifications: (Array.isArray(parsed?.certifications) ? parsed.certifications : []).slice(0, 10).map((c) => ({
      name: String(c.name || "").slice(0, 200),
      issuer: String(c.issuer || "").slice(0, 200),
      date: String(c.date || "").slice(0, 20),
      url: String(c.url || "").slice(0, 300),
    })),
  };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export interface ParseResult {
  data: AIParsedResume;
  provider: "gemini" | "groq" | "regex";
  parseAccuracy: number;
}

export async function parseResumeWithAI(resumeText: string): Promise<ParseResult> {
  const geminiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Try Gemini Flash (free, fastest, most accurate)
  if (geminiKey && resumeText.length > 10) {
    try {
      console.log("[AI Parser] Trying Gemini 1.5 Flash...");
      const raw = await parseWithGemini(resumeText, geminiKey);
      const data = sanitize(raw);
      console.log(`[AI Parser] Gemini OK — ${data.experience.length} jobs, ${data.skills.length} skills`);
      return { data, provider: "gemini", parseAccuracy: 97 };
    } catch (e) {
      console.warn("[AI Parser] Gemini failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // 2. Try Groq Llama (free, ultra-fast)
  if (groqKey && resumeText.length > 10) {
    try {
      console.log("[AI Parser] Trying Groq llama-3.1-8b-instant...");
      const raw = await parseWithGroq(resumeText, groqKey);
      const data = sanitize(raw);
      console.log(`[AI Parser] Groq OK — ${data.experience.length} jobs, ${data.skills.length} skills`);
      return { data, provider: "groq", parseAccuracy: 93 };
    } catch (e) {
      console.warn("[AI Parser] Groq failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // 3. Robust regex fallback (always works)
  console.log("[AI Parser] Using regex fallback parser");
  const data = sanitize(parseWithRegex(resumeText));
  console.log(`[AI Parser] Regex OK — name="${data.personal.name}", ${data.experience.length} jobs, ${data.skills.length} skills`);
  return { data, provider: "regex", parseAccuracy: data.personal.name ? 65 : 40 };
}
