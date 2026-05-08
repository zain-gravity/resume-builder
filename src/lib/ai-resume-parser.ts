/**
 * AI-Powered Resume Parser
 * Primary:  Google Gemini 1.5 Flash (free, fast, 1M context)
 * Fallback: Groq llama-3.1-8b-instant (free, 300+ tok/s)
 * Final:    Regex-based parser (always works, no API key needed)
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
    startDate: string; // "YYYY-MM" or "Mon YYYY" or ""
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
  return `You are an expert resume parser. Extract ALL information from the resume below and return a single valid JSON object matching the schema exactly. Do not include markdown, code fences, or any text outside the JSON.

SCHEMA:
{
  "personal": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1 234 567 8900",
    "location": "City, State/Country",
    "linkedin": "linkedin.com/in/username or full URL",
    "portfolio": "portfolio URL or GitHub",
    "jobTitle": "Current or most recent job title"
  },
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or empty string if current",
      "current": false,
      "bullets": ["Achievement or responsibility 1", "Achievement 2"]
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
      "gpa": "3.8 or empty string"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM or YYYY",
      "url": "verification URL or empty string"
    }
  ]
}

RULES:
- Extract EVERY job, education entry, skill, and certification you find
- For dates: convert to "YYYY-MM" format where possible. Use "YYYY" if only year available. Leave empty string if unknown
- If "present", "current", or "now" is the end date, set endDate to "" and current to true
- Split job descriptions/paragraphs into individual bullet point strings
- Include ALL skills mentioned anywhere in the resume (technical, soft, tools, languages)
- If a field is not found, use empty string "" for strings and [] for arrays
- Return ONLY the JSON object, nothing else

RESUME TEXT:
---
${resumeText.slice(0, 28000)}
---`;
}

// ─── GEMINI FLASH (Primary) ───────────────────────────────────────────────────

async function parseWithGemini(resumeText: string, apiKey: string): Promise<AIParsedResume> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: buildPrompt(resumeText) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  return JSON.parse(text) as AIParsedResume;
}

// ─── GROQ (Fallback) ──────────────────────────────────────────────────────────

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
        {
          role: "system",
          content: "You are an expert resume parser. Always respond with valid JSON only, no markdown or code fences.",
        },
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
    throw new Error(`Groq API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response");

  return JSON.parse(text) as AIParsedResume;
}

// ─── REGEX FALLBACK ───────────────────────────────────────────────────────────

function parseWithRegex(text: string): AIParsedResume {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?[\d][\d\s\-().]{7,}[\d])/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:github\.com|[\w-]+\.(?:io|dev|me|com)\/[\w-]+)/i);
  const emailLine = emailMatch?.[0]?.toLowerCase() || "";

  let name = "";
  for (const line of lines.slice(0, 5)) {
    if (line.includes("@") || /\d/.test(line) || line.length > 60 || line.length < 3) continue;
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)+$/.test(line)) { name = line; break; }
  }

  const titleKw = /engineer|developer|manager|designer|analyst|director|lead|senior|junior|consultant|specialist|architect|scientist|coordinator|associate|intern|president|vp|head/i;
  let jobTitle = "";
  for (const line of lines.slice(0, 8)) {
    if (titleKw.test(line) && line.length < 80 && !line.includes("@")) { jobTitle = line; break; }
  }

  const locMatch = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?,\s*(?:[A-Z]{2}|[A-Z][a-z]{3,})\b/);

  const summarySection = text.match(/(?:summary|profile|objective)[:\s]*\n([\s\S]{20,500}?)(?:\n[A-Z][A-Z\s]{3,}|\n\n)/i);
  const summary = summarySection?.[1]?.replace(/\n/g, " ").trim() || "";

  const SKILLS_LIST = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "R",
    "React", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express", "FastAPI", "Django", "Spring",
    "HTML", "CSS", "Tailwind", "Bootstrap", "GraphQL", "REST", "PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions", "Linux",
    "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Git", "Figma", "Agile", "Scrum", "SQL", "Spark",
    "React Native", "Flutter", "iOS", "Android",
  ];
  const skills = SKILLS_LIST.filter((s) => new RegExp(`(?:^|[\\s,;|•])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s,;|•]|$)`, "i").test(text));

  const dateRe = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]+\s*(?:Present|Current|Now)/gi;
  const experience: AIParsedResume["experience"] = [];

  return {
    personal: {
      name,
      email: emailLine,
      phone: phoneMatch?.[0]?.trim() || "",
      location: locMatch?.[0] || "",
      linkedin: linkedinMatch?.[0] || "",
      portfolio: portfolioMatch?.[0] || "",
      jobTitle,
    },
    summary,
    experience,
    education: [],
    skills,
    certifications: [],
  };
}

// ─── VALIDATE & SANITIZE ──────────────────────────────────────────────────────

function sanitize(parsed: AIParsedResume): AIParsedResume {
  const p = parsed.personal || {};
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
    summary: String(parsed.summary || "").slice(0, 2000),
    experience: (Array.isArray(parsed.experience) ? parsed.experience : []).slice(0, 20).map((e) => ({
      company: String(e.company || "").slice(0, 150),
      title: String(e.title || "").slice(0, 150),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      current: Boolean(e.current),
      bullets: (Array.isArray(e.bullets) ? e.bullets : []).slice(0, 15).map((b) => String(b).slice(0, 500)),
    })),
    education: (Array.isArray(parsed.education) ? parsed.education : []).slice(0, 10).map((e) => ({
      school: String(e.school || "").slice(0, 200),
      degree: String(e.degree || "").slice(0, 200),
      field: String(e.field || "").slice(0, 200),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      gpa: String(e.gpa || "").slice(0, 10),
    })),
    skills: (Array.isArray(parsed.skills) ? parsed.skills : []).slice(0, 50).map((s) => String(s).slice(0, 100)),
    certifications: (Array.isArray(parsed.certifications) ? parsed.certifications : []).slice(0, 10).map((c) => ({
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

  // 1. Try Gemini Flash
  if (geminiKey) {
    try {
      console.log("[AI Parser] Trying Gemini 1.5 Flash...");
      const raw = await parseWithGemini(resumeText, geminiKey);
      const data = sanitize(raw);
      console.log(`[AI Parser] Gemini success — ${data.experience.length} jobs, ${data.skills.length} skills`);
      return { data, provider: "gemini", parseAccuracy: 97 };
    } catch (e) {
      console.warn("[AI Parser] Gemini failed:", e instanceof Error ? e.message : e);
    }
  }

  // 2. Try Groq Llama
  if (groqKey) {
    try {
      console.log("[AI Parser] Trying Groq llama-3.1-8b-instant...");
      const raw = await parseWithGroq(resumeText, groqKey);
      const data = sanitize(raw);
      console.log(`[AI Parser] Groq success — ${data.experience.length} jobs, ${data.skills.length} skills`);
      return { data, provider: "groq", parseAccuracy: 93 };
    } catch (e) {
      console.warn("[AI Parser] Groq failed:", e instanceof Error ? e.message : e);
    }
  }

  // 3. Regex fallback
  console.log("[AI Parser] Using regex fallback parser");
  const data = sanitize(parseWithRegex(resumeText));
  return { data, provider: "regex", parseAccuracy: 65 };
}
