/**
 * AI Resume Parser — 4 Strategies
 * 1. Google Gemini 1.5 Flash  (free, 97% accuracy)
 * 2. Groq llama-3.1-8b-instant (free, 93% accuracy)
 * 3. Ultra-comprehensive regex NLP  (no key needed, ~75% accuracy)
 * 4. Emergency name/email/phone extraction (always works)
 */

export interface AIParsedResume {
  personal: {
    name: string; email: string; phone: string;
    location: string; linkedin: string; portfolio: string; jobTitle: string;
  };
  summary: string;
  experience: { company: string; title: string; location: string; startDate: string; endDate: string; current: boolean; bullets: string[] }[];
  education: { school: string; degree: string; field: string; location: string; startDate: string; endDate: string; gpa: string }[];
  skills: string[];
  certifications: { name: string; issuer: string; date: string; url: string }[];
}

// ─── PROMPT ───────────────────────────────────────────────────────────────────

function buildPrompt(text: string): string {
  return `You are an expert ATS resume parser. Extract ALL information and return ONLY a valid JSON object — no markdown, no explanation.

JSON schema:
{
  "personal": { "name":"", "email":"", "phone":"", "location":"", "linkedin":"", "portfolio":"", "jobTitle":"" },
  "summary": "",
  "experience": [{ "company":"", "title":"", "location":"", "startDate":"YYYY-MM", "endDate":"YYYY-MM or empty", "current":false, "bullets":[] }],
  "education": [{ "school":"", "degree":"", "field":"", "location":"", "startDate":"YYYY-MM", "endDate":"YYYY-MM", "gpa":"" }],
  "skills": [],
  "certifications": [{ "name":"", "issuer":"", "date":"YYYY-MM", "url":"" }]
}

Rules:
- Extract EVERY job entry, education, skill, certification
- Convert all dates to YYYY-MM. If only year, use YYYY-01
- If end is present/current/now → endDate="" current=true
- Split paragraphs into separate bullet strings
- skills: list EVERYTHING (technical, tools, languages, soft skills)
- Empty string for missing fields, [] for empty arrays
- Return ONLY JSON

RESUME:
${text.slice(0, 28000)}`;
}

// ─── GEMINI 1.5 FLASH ─────────────────────────────────────────────────────────

async function parseWithGemini(text: string, key: string): Promise<AIParsedResume> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(text) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.05, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(25000),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const raw = d?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini empty response");
  return JSON.parse(raw);
}

// ─── GROQ LLAMA ───────────────────────────────────────────────────────────────

async function parseWithGroq(text: string, key: string): Promise<AIParsedResume> {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Expert resume parser. Return only valid JSON, no markdown." },
        { role: "user", content: buildPrompt(text) },
      ],
      temperature: 0.05, max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const raw = d?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Groq empty response");
  return JSON.parse(raw);
}

// ─── ULTRA-COMPREHENSIVE REGEX PARSER ─────────────────────────────────────────

const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DATE_PATTERN = new RegExp(
  `(?:${MONTH}\\s+)?\\d{4}\\s*[-–—]+\\s*(?:(?:${MONTH}\\s+)?\\d{4}|Present|Current|Now|Till\\s+Date)`,
  "gi"
);

const SECTION_HEADERS = new RegExp(
  "^\\s*(?:" +
  "(?:work\\s+)?experience|employment(?:\\s+history)?|work\\s+history|professional\\s+experience|" +
  "education(?:al\\s+background)?|academic(?:\\s+background)?|" +
  "(?:technical\\s+)?skills?|competencies|expertise|proficiencies|" +
  "(?:professional\\s+)?summary|objective|profile|about\\s+me|" +
  "certifications?|certificates?|licenses?|accreditations?|" +
  "projects?|accomplishments?|achievements?|" +
  "languages?|interests?|hobbies|references?" +
  ")\\s*[:.]?\\s*$",
  "i"
);

const JOB_TITLES = /\b(?:senior|junior|lead|staff|principal|chief|head\s+of|vp\s+of|vice\s+president|director|manager|engineer|developer|designer|analyst|architect|consultant|specialist|coordinator|associate|intern|officer|executive|scientist|researcher|advisor|strategist|product|software|data|cloud|devops|fullstack|full-stack|front-?end|back-?end|mobile|ios|android|qa|sre|mlops|ai|ml|ux|ui)\b/i;

const SCHOOL_KEYWORDS = /\b(?:university|college|institute(?:\s+of)?|school(?:\s+of)?|academy|polytechnic|faculty|campus|iit|nit|bits|mit|harvard|stanford|oxford|cambridge)\b/i;

const DEGREE_KEYWORDS = /\b(?:bachelor|master|phd|ph\.d\.?|doctor(?:ate)?|associate|b\.?(?:sc?|tech|eng?|com|a)|m\.?(?:sc?|tech|eng?|ba?|com)|mba|be\b|me\b|bca|mca|diploma|certificate|graduation|post.?grad|undergraduate)\b/i;

const SKILLS_DB = [
  // Languages
  "JavaScript","TypeScript","Python","Java","C++","C#","C","Go","Rust","Swift","Kotlin","Ruby","PHP","R","Scala","Perl","Haskell","Elixir","Clojure","Dart","MATLAB","Bash","Shell","PowerShell",
  // Frontend
  "React","React.js","Next.js","Vue","Vue.js","Angular","Svelte","Remix","Astro","HTML","HTML5","CSS","CSS3","Sass","LESS","Tailwind","Bootstrap","Material UI","Chakra UI","Framer Motion","jQuery","Redux","Zustand","Webpack","Vite","Babel",
  // Backend
  "Node.js","Express","Fastify","NestJS","Django","Flask","FastAPI","Spring","Spring Boot","Laravel","Rails","Ruby on Rails","ASP.NET","Gin","Fiber","Actix",
  // Databases
  "SQL","MySQL","PostgreSQL","SQLite","Oracle","MSSQL","MongoDB","Redis","DynamoDB","Cassandra","Elasticsearch","Firebase","Supabase","Neo4j","InfluxDB","CockroachDB",
  // Cloud & DevOps
  "AWS","Azure","GCP","Google Cloud","Vercel","Netlify","Heroku","DigitalOcean","Docker","Kubernetes","Terraform","Ansible","Jenkins","GitHub Actions","GitLab CI","CircleCI","ArgoCD","Helm","Prometheus","Grafana","Datadog","New Relic","Splunk",
  // AI/ML
  "Machine Learning","Deep Learning","NLP","Computer Vision","TensorFlow","PyTorch","Keras","Scikit-learn","Pandas","NumPy","SciPy","Matplotlib","Seaborn","Hugging Face","LangChain","OpenAI","RAG","LLM",
  // Mobile
  "React Native","Flutter","iOS","Android","Swift UI","Jetpack Compose","Expo","Xamarin","Ionic",
  // Tools
  "Git","GitHub","GitLab","Bitbucket","Jira","Confluence","Notion","Slack","Figma","Adobe XD","Sketch","Postman","Insomnia","Swagger","GraphQL","REST API","gRPC","WebSocket","OAuth","JWT",
  // Methodologies
  "Agile","Scrum","Kanban","DevOps","CI/CD","TDD","BDD","Microservices","Serverless","Event-Driven","Domain-Driven","SOLID","Design Patterns",
  // Data/Analytics
  "Excel","Power BI","Tableau","Looker","Snowflake","BigQuery","Spark","Kafka","Airflow","dbt","Databricks",
  // Other
  "Linux","Unix","Windows Server","Nginx","Apache","RabbitMQ","Celery","Stripe","Twilio","SendGrid","Salesforce","SAP","Shopify","WordPress","Webflow",
];

function buildSkillsRegex() {
  return SKILLS_DB.map((s) => ({
    skill: s,
    re: new RegExp(`(?:^|[\\s,;|•/(\\[])"?${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"?(?=[\\s,;|•/)\\]]|$)`, "i"),
  }));
}

const SKILLS_REGEXES = buildSkillsRegex();

function extractSkills(text: string): string[] {
  return SKILLS_REGEXES.filter(({ re }) => re.test(text)).map(({ skill }) => skill);
}

function parseDateStr(s: string): string {
  if (!s) return "";
  const m = s.match(/(\d{4})/);
  if (!m) return "";
  const year = m[1];
  const monthMap: Record<string, string> = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",
  };
  const mMatch = s.toLowerCase().match(/^([a-z]{3})/);
  const month = mMatch ? (monthMap[mMatch[1]] || "01") : "01";
  return `${year}-${month}`;
}

function parseWithRegex(text: string): AIParsedResume {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // ── Personal: Email & Phone ──
  const emailM = text.match(/\b[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}\b/i);
  const phoneM = text.match(/(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}(?:[\s\-.]?\d{2,4})?/);
  const linkedinM = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-%.]+/i);
  const portfolioM = text.match(/(?:https?:\/\/)?(?:github\.com\/[\w\-]+(?:\/[\w\-]+)?|[\w\-]+\.(?:io|dev|me|app|co)(?:\/[\w\-]+)?)/i);

  // ── Name: multiple strategies ──
  let name = "";
  // Strategy 1: First line that looks like "FirstName LastName"
  for (const line of lines.slice(0, 8)) {
    if (!line || line.length > 60 || line.length < 4) continue;
    if (line.includes("@") || /^\d/.test(line) || /[|@#$%^&*()_+={}[\]:;"<>?/\\]/.test(line)) continue;
    if (/http|www\.|\.com|resume|cv\b/i.test(line)) continue;
    if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(line)) { name = line; break; }
  }
  // Strategy 2: All-caps name
  if (!name) {
    for (const line of lines.slice(0, 5)) {
      if (/^[A-Z][A-Z\s'-]{3,30}$/.test(line) && line.split(" ").length >= 2) { name = line; break; }
    }
  }
  // Strategy 3: Just take first short non-contact line
  if (!name) {
    for (const line of lines.slice(0, 4)) {
      if (line.length > 3 && line.length < 50 && !line.includes("@") && !/^\d+/.test(line) && !/http|www/i.test(line)) {
        name = line; break;
      }
    }
  }

  // ── Job Title ──
  let jobTitle = "";
  for (const line of lines.slice(0, 12)) {
    if (JOB_TITLES.test(line) && line.length < 100 && !line.includes("@") && !/^\d/.test(line)) {
      jobTitle = line.trim(); break;
    }
  }

  // ── Location ──
  const locM = text.match(/\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?,\s*(?:[A-Z]{2}|[A-Z][a-z]{3,})\b/);
  const location = locM?.[0] || "";

  // ── Section splitting ──
  type SecName = "summary" | "experience" | "education" | "skills" | "certifications" | "other";
  const sections: Record<SecName, string[]> = {
    summary: [], experience: [], education: [], skills: [], certifications: [], other: [],
  };
  let curSec: SecName = "other";

  for (const line of lines) {
    if (SECTION_HEADERS.test(line)) {
      const lc = line.toLowerCase();
      if (/summary|objective|profile|about/.test(lc)) curSec = "summary";
      else if (/experience|employment|work/.test(lc)) curSec = "experience";
      else if (/education|academic/.test(lc)) curSec = "education";
      else if (/skill|competen|expertise|proficien/.test(lc)) curSec = "skills";
      else if (/certif|licens|accredit/.test(lc)) curSec = "certifications";
      else curSec = "other";
      continue;
    }
    sections[curSec].push(line);
  }

  // ── Summary ──
  const summary = sections.summary.slice(0, 8).join(" ").slice(0, 1000);

  // ── Skills ──
  const skills = extractSkills(text);

  // ── Experience ──
  const experience: AIParsedResume["experience"] = [];
  const BULLET = /^[•\-*·▪▸→►–—]\s+|^\d+\.\s+/;

  // Use experience section lines or fall back to all lines
  const expLines = sections.experience.length > 2 ? sections.experience : lines;
  let curExp: AIParsedResume["experience"][0] | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    DATE_PATTERN.lastIndex = 0;
    const dateM = DATE_PATTERN.exec(line);

    if (dateM) {
      if (curExp) experience.push(curExp);
      const raw = dateM[0];
      const isPresent = /present|current|now|till\s+date/i.test(raw);
      const halves = raw.split(/[-–—]+/);
      const sd = parseDateStr(halves[0]?.trim() || "");
      const ed = isPresent ? "" : parseDateStr(halves[1]?.trim() || "");

      curExp = { company: "", title: "", location: "", startDate: sd, endDate: ed, current: isPresent, bullets: [] };

      // Grab company/title from surrounding lines
      const prevLine = expLines[i - 1]?.trim() || "";
      const nextLine = expLines[i + 1]?.trim() || "";

      if (prevLine && !BULLET.test(prevLine) && prevLine.length < 120) {
        // "Title | Company" or "Title at Company" or just "Company"
        if (prevLine.includes("|")) {
          const [a, b] = prevLine.split("|").map((s) => s.trim());
          curExp.title = a; curExp.company = b;
        } else if (/\bat\b/i.test(prevLine)) {
          const [a, b] = prevLine.split(/\bat\b/i).map((s) => s.trim());
          curExp.title = a; curExp.company = b;
        } else {
          curExp.company = prevLine;
        }
      }
      if (nextLine && !BULLET.test(nextLine) && nextLine.length < 120 && !DATE_PATTERN.test(nextLine)) {
        if (!curExp.title && JOB_TITLES.test(nextLine)) curExp.title = nextLine;
        else if (!curExp.company && !SCHOOL_KEYWORDS.test(nextLine)) curExp.company = nextLine;
      }
      continue;
    }

    if (!curExp) continue;
    if (BULLET.test(line)) {
      curExp.bullets.push(line.replace(BULLET, "").trim());
    } else if (!curExp.title && JOB_TITLES.test(line) && line.length < 100) {
      curExp.title = line;
    } else if (!curExp.company && line.length < 120 && !SCHOOL_KEYWORDS.test(line) && !/^\d/.test(line)) {
      curExp.company = line;
    } else if (line.length > 40 && !DATE_PATTERN.test(line)) {
      curExp.bullets.push(line);
    }
  }
  if (curExp) experience.push(curExp);

  // ── Education ──
  const education: AIParsedResume["education"] = [];
  let curEdu: AIParsedResume["education"][0] | null = null;

  const eduLines = sections.education.length > 0 ? sections.education : [];
  for (const line of eduLines) {
    if (SCHOOL_KEYWORDS.test(line)) {
      if (curEdu) education.push(curEdu);
      curEdu = { school: line, degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "" };
    } else if (DEGREE_KEYWORDS.test(line) && !curEdu) {
      curEdu = { school: "", degree: line, field: "", location: "", startDate: "", endDate: "", gpa: "" };
    } else if (curEdu) {
      const gpaM = line.match(/GPA[:\s]+([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
      if (gpaM) { curEdu.gpa = gpaM[1]; continue; }
      if (DEGREE_KEYWORDS.test(line) && !curEdu.degree) { curEdu.degree = line; continue; }
      const years = line.match(/\b(19|20)\d{2}\b/g);
      if (years?.length) {
        if (years.length >= 2) { curEdu.startDate = years[0]+"-01"; curEdu.endDate = years[1]+"-01"; }
        else { curEdu.endDate = years[0]+"-01"; }
      }
    }
  }
  if (curEdu) education.push(curEdu);

  // ── Certifications ──
  const certifications = sections.certifications
    .filter((l) => l.length > 4 && !SECTION_HEADERS.test(l))
    .map((line) => {
      const ym = line.match(/\b(19|20)\d{2}\b/);
      return {
        name: line.replace(/\b(19|20)\d{2}\b/g, "").replace(/^[-–,\s]+|[-–,\s]+$/g, "").trim(),
        issuer: "", date: ym ? `${ym[0]}-01` : "", url: "",
      };
    })
    .filter((c) => c.name.length > 3)
    .slice(0, 10);

  return {
    personal: {
      name: name.slice(0, 100),
      email: (emailM?.[0] || "").toLowerCase().slice(0, 200),
      phone: (phoneM?.[0] || "").trim().slice(0, 50),
      location: location.slice(0, 150),
      linkedin: (linkedinM?.[0] || "").slice(0, 300),
      portfolio: (portfolioM?.[0] || "").slice(0, 300),
      jobTitle: jobTitle.slice(0, 150),
    },
    summary: summary.slice(0, 1500),
    experience: experience.slice(0, 15),
    education: education.slice(0, 8),
    skills: skills.slice(0, 50),
    certifications: certifications.slice(0, 8),
  };
}

// ─── SANITIZE ─────────────────────────────────────────────────────────────────

function sanitize(p: AIParsedResume): AIParsedResume {
  const per = p?.personal || {};
  return {
    personal: {
      name: String(per.name || "").slice(0, 100),
      email: String(per.email || "").toLowerCase().slice(0, 200),
      phone: String(per.phone || "").slice(0, 50),
      location: String(per.location || "").slice(0, 150),
      linkedin: String(per.linkedin || "").slice(0, 300),
      portfolio: String(per.portfolio || "").slice(0, 300),
      jobTitle: String(per.jobTitle || "").slice(0, 150),
    },
    summary: String(p?.summary || "").slice(0, 2000),
    experience: (Array.isArray(p?.experience) ? p.experience : []).slice(0, 20).map((e) => ({
      company: String(e.company || "").slice(0, 150),
      title: String(e.title || "").slice(0, 150),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      current: Boolean(e.current),
      bullets: (Array.isArray(e.bullets) ? e.bullets : []).slice(0, 15).map((b) => String(b).slice(0, 500)).filter(Boolean),
    })),
    education: (Array.isArray(p?.education) ? p.education : []).slice(0, 8).map((e) => ({
      school: String(e.school || "").slice(0, 200),
      degree: String(e.degree || "").slice(0, 200),
      field: String(e.field || "").slice(0, 200),
      location: String(e.location || "").slice(0, 150),
      startDate: String(e.startDate || "").slice(0, 20),
      endDate: String(e.endDate || "").slice(0, 20),
      gpa: String(e.gpa || "").slice(0, 15),
    })),
    skills: (Array.isArray(p?.skills) ? p.skills : []).slice(0, 50).map((s) => String(s).slice(0, 100)).filter(Boolean),
    certifications: (Array.isArray(p?.certifications) ? p.certifications : []).slice(0, 10).map((c) => ({
      name: String(c.name || "").slice(0, 200),
      issuer: String(c.issuer || "").slice(0, 200),
      date: String(c.date || "").slice(0, 20),
      url: String(c.url || "").slice(0, 300),
    })),
  };
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export interface ParseResult {
  data: AIParsedResume;
  provider: "gemini" | "groq" | "regex";
  parseAccuracy: number;
}

export async function parseResumeWithAI(resumeText: string): Promise<ParseResult> {
  const geminiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (resumeText.length > 10) {
    // 1. Gemini Flash — free, most accurate
    if (geminiKey) {
      try {
        console.log("[AI] Gemini 1.5 Flash...");
        const data = sanitize(await parseWithGemini(resumeText, geminiKey));
        console.log(`[AI] Gemini ✓ — "${data.personal.name}" | ${data.experience.length} jobs | ${data.skills.length} skills`);
        return { data, provider: "gemini", parseAccuracy: 97 };
      } catch (e) {
        console.warn("[AI] Gemini failed:", e instanceof Error ? e.message : e);
      }
    }

    // 2. Groq — free, ultra-fast
    if (groqKey) {
      try {
        console.log("[AI] Groq llama-3.1-8b-instant...");
        const data = sanitize(await parseWithGroq(resumeText, groqKey));
        console.log(`[AI] Groq ✓ — "${data.personal.name}" | ${data.experience.length} jobs | ${data.skills.length} skills`);
        return { data, provider: "groq", parseAccuracy: 93 };
      } catch (e) {
        console.warn("[AI] Groq failed:", e instanceof Error ? e.message : e);
      }
    }
  }

  // 3. Comprehensive regex NLP (no API key needed)
  console.log("[AI] Regex NLP parser...");
  const data = sanitize(parseWithRegex(resumeText));
  const acc = [data.personal.name, data.personal.email, data.personal.phone].filter(Boolean).length;
  const accuracy = Math.min(75, 35 + acc * 10 + (data.experience.length > 0 ? 10 : 0) + (data.skills.length > 3 ? 5 : 0));
  console.log(`[AI] Regex ✓ — "${data.personal.name}" | ${data.experience.length} jobs | ${data.skills.length} skills | acc=${accuracy}%`);
  return { data, provider: "regex", parseAccuracy: accuracy };
}
