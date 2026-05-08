// Rule-based resume parser v2 — improved regex, robust section detection
import type { ParsedResume, ParsedPersonal, ParsedExperience, ParsedEducation } from "./parsed-resume.types";

// ─── PATTERNS ────────────────────────────────────────────────────────────────
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_RE = /(?:(?:\+?1[\s.-]?)?\(?([2-9][0-9]{2})\)?[\s.-]?)?([2-9][0-9]{2})[\s.-]?([0-9]{4})/g;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_%.]+)\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9\-_]+)\/?/i;
const URL_RE = /https?:\/\/[^\s,<>"]+/gi;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const DATE_RANGE_RE = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]+\s*(?:present|current|now|ongoing)/gi;
const BULLET_RE = /^[\s]*([•\-\*·▪▸◆◦‣⁃]|\d+[.)]\s)/;
const ALLCAPS_RE = /^[A-Z][A-Z\s&.,'/()-]{3,}$/;

const DEGREE_KW = ["bachelor", "master", "phd", "ph.d", "doctor", "associate", "b.s.", "b.a.", "m.s.", "m.a.", "mba", "m.b.a", "b.eng", "m.eng", "diploma", "certificate", "llb", "b.sc", "m.sc", "honours", "hons"];
const SCHOOL_KW = ["university", "college", "institute", "school", "academy", "polytechnic", "faculty"];
const TITLE_KW = ["engineer", "developer", "manager", "designer", "analyst", "director", "lead", "senior", "junior", "consultant", "specialist", "architect", "scientist", "officer", "coordinator", "associate", "intern", "vp ", "head of", "chief", "cto", "ceo", "cfo", "president"];
const COMPANY_SUFFIXES = /\b(inc\.?|llc\.?|corp\.?|ltd\.?|co\.?|company|group|technologies|solutions|systems|services|partners|consulting|foundation|international|global)\b/i;

const SECTION_MAP: Record<string, string[]> = {
  summary: ["summary", "objective", "profile", "about me", "about", "overview", "professional summary", "career summary", "professional profile"],
  experience: ["experience", "work history", "employment", "employment history", "career", "work experience", "professional experience", "positions held", "relevant experience"],
  education: ["education", "academic background", "academic history", "qualifications", "schooling", "degrees"],
  skills: ["skills", "technical skills", "core competencies", "competencies", "technologies", "tools", "tech stack", "expertise", "proficiencies", "key skills", "areas of expertise"],
  certifications: ["certifications", "certificates", "licenses", "credentials", "training", "accreditations", "professional development"],
  projects: ["projects", "personal projects", "side projects", "open source", "portfolio"],
  awards: ["awards", "honors", "honours", "achievements", "recognitions"],
  languages: ["languages", "spoken languages"],
  volunteer: ["volunteer", "volunteering", "community service"],
};

const SKILLS_DB = [
  // Languages
  "JavaScript","TypeScript","Python","Java","C++","C#","C","Go","Rust","Swift","Kotlin","Ruby","PHP","Scala","R","Dart","Elixir","Haskell","MATLAB","Bash","Shell","PowerShell","VBA","Assembly",
  // Frontend
  "React","Next.js","Vue.js","Angular","Svelte","Nuxt.js","Gatsby","Redux","MobX","Zustand","HTML","CSS","SASS","SCSS","Tailwind","Bootstrap","Material UI","Chakra UI","Storybook","jQuery","Webpack","Vite","Babel","Parcel",
  // Backend
  "Node.js","Express","FastAPI","Django","Flask","Spring","Spring Boot","Laravel","Rails","ASP.NET","NestJS","Fastify","Hapi","GraphQL","REST","gRPC","WebSockets","tRPC",
  // Databases
  "PostgreSQL","MySQL","SQLite","MongoDB","Redis","DynamoDB","Elasticsearch","Cassandra","Firebase","Supabase","PlanetScale","CockroachDB","Neo4j","InfluxDB",
  // Cloud / DevOps
  "AWS","Azure","GCP","Docker","Kubernetes","Terraform","Ansible","CI/CD","Jenkins","GitHub Actions","GitLab CI","CircleCI","ArgoCD","Helm","Linux","Nginx","Apache","Cloudflare","Vercel","Netlify",
  // AI / Data
  "Machine Learning","Deep Learning","TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy","OpenCV","NLP","LangChain","OpenAI","HuggingFace","Spark","Hadoop","Kafka","Airflow","ETL","Tableau","Power BI",
  // Tools
  "Git","GitHub","GitLab","Bitbucket","Jira","Confluence","Figma","Postman","Swagger","DataDog","Grafana","Prometheus","Sentry",
  // Methodologies
  "Agile","Scrum","Kanban","DevOps","MLOps","TDD","BDD","DDD","Microservices","System Design","API Design","SOA","Event-Driven",
  // Mobile
  "iOS","Android","React Native","Flutter","Xcode","SwiftUI","Jetpack Compose",
  // Business
  "Excel","Google Sheets","Salesforce","HubSpot","Shopify","WordPress","SAP","Tableau","Looker","Mixpanel","Segment",
  // Soft skills
  "Leadership","Communication","Project Management","Problem Solving","Mentoring","Public Speaking","Team Management","Strategic Planning","Cross-functional",
];

// ─── TEXT PRE-PROCESSING ──────────────────────────────────────────────────────
export function preprocessText(text: string): string {
  return text
    // Normalize Unicode dashes/quotes/bullets
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB]/g, "•")
    // Fix merged words from PDF extraction (camelCase from ligatures)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Remove repeated punctuation
    .replace(/([.!?,;:]){2,}/g, "$1")
    // Normalize line endings
    .replace(/\r\n?/g, "\n")
    // Collapse excessive whitespace per line (but keep newlines)
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// ─── SECTION DETECTION ───────────────────────────────────────────────────────
function detectSection(line: string): string | null {
  const l = line.toLowerCase().replace(/[:!*]+$/, "").trim();
  // Must look like a heading: short, possibly all caps or title case
  if (l.length > 50) return null;
  for (const [section, keywords] of Object.entries(SECTION_MAP)) {
    for (const kw of keywords) {
      if (l === kw || l === kw + "s" || l.startsWith(kw + " ") || l.endsWith(" " + kw)) {
        return section;
      }
    }
  }
  return null;
}

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text.split("\n").map((l) => l.trim());
  const sections: Record<string, string[]> = {
    header: [], summary: [], experience: [], education: [],
    skills: [], certifications: [], projects: [], other: [],
  };
  let current = "header";
  let headerLineCount = 0;

  for (const line of lines) {
    if (!line) continue;
    const sec = detectSection(line);
    if (sec) {
      current = sec;
      continue;
    }
    // Auto-detect header end: after 8 lines assume body started
    if (current === "header") {
      headerLineCount++;
      if (headerLineCount > 8) current = "other";
    }
    (sections[current] = sections[current] || []).push(line);
  }
  return sections;
}

// ─── PERSONAL INFO ───────────────────────────────────────────────────────────
function parsePersonal(headerLines: string[], allText: string): { personal: ParsedPersonal; warnings: string[] } {
  const warnings: string[] = [];
  const p: ParsedPersonal = { name: "", email: "", phone: "", linkedin: "", location: "", portfolio: "", jobTitle: "" };

  // Reset regex lastIndex before use
  EMAIL_RE.lastIndex = 0;
  const emailM = EMAIL_RE.exec(allText);
  if (emailM) p.email = emailM[0].toLowerCase();
  else warnings.push("⚠️ Could not detect email address");

  PHONE_RE.lastIndex = 0;
  const phoneM = PHONE_RE.exec(allText);
  if (phoneM) {
    // Rebuild phone from groups
    const full = phoneM[0].trim().replace(/\s+/g, " ");
    p.phone = full;
  } else warnings.push("⚠️ Could not detect phone number");

  const liM = allText.match(LINKEDIN_RE);
  if (liM) p.linkedin = liM[0].replace(/^https?:\/\/(www\.)?/i, "");

  // Portfolio: first URL that's not LinkedIn or GitHub
  URL_RE.lastIndex = 0;
  const allUrls = Array.from(allText.matchAll(URL_RE), (m) => m[0]);
  const portfolio = allUrls.find((u) => !u.includes("linkedin") && !u.includes("github"));
  if (portfolio) p.portfolio = portfolio;

  // Name: first 1–4 word line in header that isn't contact info
  const nameRE = /^([A-Z][a-záéíóúàèìòùäëïöü'-]+(?:\s+[A-Z][a-záéíóúàèìòùäëïöü'-]+){0,3})$/;
  for (const line of headerLines.slice(0, 6)) {
    const clean = line.trim();
    if (!clean || clean.length < 3 || clean.length > 60) continue;
    if (p.email && clean.toLowerCase().includes(p.email.split("@")[0])) continue;
    if (/\d/.test(clean) || clean.includes("@") || clean.includes("http")) continue;
    if (nameRE.test(clean) && clean.split(" ").length >= 2) {
      p.name = clean;
      break;
    }
  }
  // Second pass: less strict
  if (!p.name) {
    for (const line of headerLines.slice(0, 4)) {
      const clean = line.trim();
      if (clean.split(" ").length >= 2 && clean.length < 50 && !/[@\d]/.test(clean)) {
        p.name = clean;
        break;
      }
    }
  }
  if (!p.name) warnings.push("⚠️ Could not detect name");

  // Location
  const locM = allText.match(/\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?),\s*([A-Z]{2,}|[A-Z][a-z]{3,})\b/);
  if (locM) p.location = locM[0];

  // Job title — look in first 6 header lines
  for (const line of headerLines.slice(0, 6)) {
    const l = line.toLowerCase();
    if (TITLE_KW.some((k) => l.includes(k)) && line.length < 80 && line.length > 4) {
      p.jobTitle = line.trim();
      break;
    }
  }

  return { personal: p, warnings };
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
function parseSummary(lines: string[]): string {
  if (!lines.length) return "";
  const joined = lines.join(" ").replace(/\s+/g, " ");
  const sentences = joined.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 5).join(" ").trim();
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function extractDates(dateStr: string): { start: string; end: string; current: boolean } {
  const lower = dateStr.toLowerCase();
  const current = /present|current|now|ongoing/i.test(lower);
  const parts = dateStr.split(/[-–—]+/).map((s) => s.trim());

  const monthYear = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}/i;
  const start = parts[0]?.match(monthYear)?.[0]?.trim() || "";
  const end = current ? "" : parts[1]?.match(monthYear)?.[0]?.trim() || "";
  return { start, end, current };
}

// ─── EXPERIENCE ──────────────────────────────────────────────────────────────
function parseExperience(lines: string[]): ParsedExperience[] {
  const results: ParsedExperience[] = [];
  let cur: ParsedExperience | null = null;

  function saveCurrent() {
    if (cur && (cur.company || cur.title || cur.bullets.length > 0)) {
      results.push(cur);
    }
    cur = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Date range signals a new job block
    DATE_RANGE_RE.lastIndex = 0;
    const dateM = DATE_RANGE_RE.exec(line);
    if (dateM) {
      // Save previous block
      saveCurrent();
      const { start, end, current } = extractDates(dateM[0]);
      cur = { company: "", title: "", startDate: start, endDate: end, current, location: "", bullets: [] };

      // Company/title typically on preceding or following lines
      if (i > 0) {
        const prev = lines[i - 1].trim();
        if (prev && !BULLET_RE.test(prev) && prev.length < 80) {
          if (prev.includes("|") || prev.includes("·")) {
            const [a, b] = prev.split(/[|·]/).map((s) => s.trim());
            cur.title = a || ""; cur.company = b || "";
          } else if (COMPANY_SUFFIXES.test(prev) || ALLCAPS_RE.test(prev)) {
            cur.company = prev;
          } else {
            cur.title = prev;
          }
        }
      }
      const remaining = line.replace(dateM[0], "").trim();
      if (remaining && !cur.company) {
        if (COMPANY_SUFFIXES.test(remaining)) cur.company = remaining;
        else if (!cur.title) cur.title = remaining;
      }
      continue;
    }

    if (!cur) {
      // No active block yet — look for company name markers
      if (ALLCAPS_RE.test(line) && line.length < 60) {
        cur = { company: line, title: "", startDate: "", endDate: "", current: false, location: "", bullets: [] };
      } else if (COMPANY_SUFFIXES.test(line) && line.length < 80) {
        cur = { company: line, title: "", startDate: "", endDate: "", current: false, location: "", bullets: [] };
      }
      continue;
    }

    // Bullet points
    if (BULLET_RE.test(line)) {
      const cleaned = line.replace(BULLET_RE, "").trim();
      if (cleaned.length > 5) cur.bullets.push(cleaned);
      continue;
    }

    // Fill missing company/title
    if (!cur.company && COMPANY_SUFFIXES.test(line) && line.length < 80) {
      cur.company = line; continue;
    }
    if (!cur.company && ALLCAPS_RE.test(line) && line.length < 60) {
      cur.company = line; continue;
    }
    if (!cur.title && TITLE_KW.some((k) => line.toLowerCase().includes(k)) && line.length < 80) {
      cur.title = line; continue;
    }

    // Location
    const locM = line.match(/\b([A-Z][a-z]{2,}),\s*([A-Z]{2})\b/);
    if (locM && line.length < 40 && !cur.location) {
      cur.location = locM[0]; continue;
    }

    // Long text → bullet even without marker
    if (line.length > 40 && cur.startDate) {
      cur.bullets.push(line);
    }
  }
  saveCurrent();
  return results;
}

// ─── EDUCATION ───────────────────────────────────────────────────────────────
function parseEducation(lines: string[]): ParsedEducation[] {
  const results: ParsedEducation[] = [];
  let cur: ParsedEducation | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const l = line.toLowerCase();

    const isSchool = SCHOOL_KW.some((k) => l.includes(k));
    const isDegree = DEGREE_KW.some((k) => l.includes(k));

    if (isSchool) {
      if (cur) results.push(cur);
      cur = { school: line, degree: "", field: "", startDate: "", endDate: "", gpa: "", location: "" };
      // Degree might be on same line: "Bachelor of Science — MIT"
      if (isDegree) {
        const parts = line.split(/[-–—|]/);
        if (parts.length > 1) {
          cur.degree = parts[0].trim();
          cur.school = parts[1].trim();
        }
      }
      continue;
    }

    if (isDegree && !cur) {
      cur = { school: "", degree: line, field: "", startDate: "", endDate: "", gpa: "", location: "" };
      continue;
    }

    if (!cur) continue;

    if (isDegree && !cur.degree) { cur.degree = line; continue; }

    // Dates
    DATE_RANGE_RE.lastIndex = 0;
    const dm = DATE_RANGE_RE.exec(line);
    if (dm) {
      const { start, end } = extractDates(dm[0]);
      cur.startDate = start; cur.endDate = end; continue;
    }
    const yrM = line.match(YEAR_RE);
    if (yrM && !cur.endDate) { cur.endDate = yrM[0]; continue; }

    const gpaM = line.match(/GPA[:\s]+([0-9.]+)/i);
    if (gpaM) { cur.gpa = gpaM[1]; continue; }

    // Field of study
    if (!cur.field && /\b(science|engineering|arts|commerce|business|computer|information|economics|mathematics|physics|chemistry|biology|psychology|sociology|literature|history|law|medicine|nursing|finance|accounting)\b/i.test(line)) {
      cur.field = line; continue;
    }
  }
  if (cur) results.push(cur);
  return results.filter((e) => e.school || e.degree);
}

// ─── SKILLS ──────────────────────────────────────────────────────────────────
function parseSkills(lines: string[], allText: string): string[] {
  const found = new Set<string>();

  for (const skill of SKILLS_DB) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[\\s,;|•·])${escaped}(?=[\\s,;|•·]|$)`, "i");
    if (re.test(allText)) found.add(skill);
  }

  // Also parse comma/pipe separated skill lists
  for (const line of lines) {
    const parts = line.split(/[,|•·;]/);
    for (const p of parts) {
      const skill = p.trim().replace(/^[-•*]\s*/, "").replace(/\s+/g, " ");
      if (skill.length >= 2 && skill.length <= 40) {
        const match = SKILLS_DB.find((s) => s.toLowerCase() === skill.toLowerCase());
        if (match) found.add(match);
      }
    }
  }

  return Array.from(found).slice(0, 25);
}

// ─── CERTIFICATIONS ──────────────────────────────────────────────────────────
function parseCertifications(lines: string[]): { name: string; issuer: string; date: string; url: string }[] {
  return lines
    .filter((l) => l.trim().length > 5)
    .map((line) => {
      const yrM = line.match(YEAR_RE);
      const name = line.replace(YEAR_RE, "").replace(/[-–|,]/g, " ").replace(/\s+/g, " ").trim();
      return { name, issuer: "", date: yrM?.[0] || "", url: "" };
    })
    .filter((c) => c.name.length > 3)
    .slice(0, 8);
}

// ─── ACCURACY ────────────────────────────────────────────────────────────────
function calculateAccuracy(r: Omit<ParsedResume, "parseAccuracy" | "warnings" | "id" | "filename" | "parsedAt">): number {
  let s = 0;
  if (r.personal.name) s += 15;
  if (r.personal.email) s += 15;
  if (r.personal.phone) s += 10;
  if (r.personal.location) s += 5;
  if (r.personal.linkedin) s += 5;
  if (r.summary?.length > 30) s += 10;
  if (r.experience.length > 0) s += 15;
  if (r.experience.length > 1) s += 5;
  if (r.experience.some((e) => e.bullets.length > 0)) s += 5;
  if (r.education.length > 0) s += 10;
  if (r.skills.length >= 3) s += 5;
  return Math.min(100, s);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export function parseResumeText(rawText: string, filename: string): ParsedResume {
  const id = Math.random().toString(36).substring(2, 11);
  const text = preprocessText(rawText);
  const sections = splitIntoSections(text);

  const { personal, warnings } = parsePersonal(sections.header, text);
  const summary = parseSummary(sections.summary);
  const experience = parseExperience(sections.experience);
  const education = parseEducation(sections.education);
  const skills = parseSkills(sections.skills, text);
  const certifications = parseCertifications(sections.certifications);

  const core = { personal, summary, experience, education, skills, certifications };
  const parseAccuracy = calculateAccuracy(core);

  return { id, filename, parsedAt: new Date().toISOString(), parseAccuracy, warnings, ...core };
}
