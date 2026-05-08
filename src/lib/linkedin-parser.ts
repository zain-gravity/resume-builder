/**
 * linkedin-parser.ts
 * Specialized parser for LinkedIn PDF exports and pasted profile text.
 * LinkedIn PDFs have a very consistent structure — targeting 95%+ accuracy.
 */
import type { ParsedResume, ParsedPersonal, ParsedExperience, ParsedEducation } from "./parsed-resume.types";

// ─── LINKEDIN PDF SECTION MARKERS ────────────────────────────────────────────
// These appear verbatim in LinkedIn's PDF export
const LI_SECTIONS = {
  experience:     ["Experience", "Work Experience"],
  education:      ["Education"],
  skills:         ["Skills", "Top Skills"],
  summary:        ["Summary", "About"],
  certifications: ["Licenses & Certifications", "Certifications", "Licenses"],
  languages:      ["Languages"],
  volunteer:      ["Volunteer Experience"],
  projects:       ["Projects"],
  publications:   ["Publications"],
  courses:        ["Courses"],
  honors:         ["Honors & Awards"],
  contact:        ["Contact", "Contact Information"],
};

// LinkedIn date format — supports full month names like "February 2025 - Present"
const MONTH_RE = "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
const LI_DATE_RE = new RegExp(
  `(?:${MONTH_RE}\\s+)?\\d{4}\\s*[-–—]\\s*(?:${MONTH_RE}\\s+)?\\d{4}` +
  `|(?:${MONTH_RE}\\s+)?\\d{4}\\s*[-–—]\\s*(?:Present|Current|Now)`,
  "i"
);
const YEAR_ONLY_RE = /^\d{4}\s*[-–—]\s*(?:\d{4}|Present)$/i;
const DURATION_RE = /\(\d+\s+(?:year|yr|month|mo)[^)]*\)|\d+\s+(?:yrs?|mos?|years?|months?)/i;

// ─── LINE CLASSIFICATION ──────────────────────────────────────────────────────
function isSection(line: string): string | null {
  const clean = line.trim();
  for (const [key, markers] of Object.entries(LI_SECTIONS)) {
    if (markers.some((m) => clean === m || clean.toLowerCase() === m.toLowerCase())) {
      return key;
    }
  }
  return null;
}

// Strip trailing duration from a date string
// e.g. "February 2025 - Present (1 year 4 months)" → "February 2025 - Present"
// e.g. "Bachelor's degree, Mathematics · (April 2017 - October 2021)" keeps as-is for education
function stripDuration(line: string): string {
  return line.replace(/\s*[·•]?\s*\([^)]+\)/, "").trim();
}

function isDate(line: string): boolean {
  // Strip trailing duration like "(1 year 4 months)" before testing
  const clean = stripDuration(line);
  return LI_DATE_RE.test(clean) || YEAR_ONLY_RE.test(clean);
}

function isDuration(line: string): boolean {
  return DURATION_RE.test(line);
}

function parseDateRange(s: string): { start: string; end: string; current: boolean } {
  // Strip trailing duration like "(1 year 4 months)" or "· (April 2017)"
  const clean = stripDuration(s);
  const isPresent = /present|current|now/i.test(clean);
  // Split on first dash — full month names like "February 2025 - Present"
  const parts = clean.split(/\s*[-–—]\s*/).map((p) => p.trim()).filter(Boolean);
  return {
    start: parts[0] || "",
    end: isPresent ? "" : (parts[1] || ""),
    current: isPresent,
  };
}

// ─── SPLIT INTO SECTIONS ──────────────────────────────────────────────────────
function splitSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    header: [], summary: [], experience: [], education: [],
    skills: [], certifications: [], other: [],
  };
  let current = "header";
  let headerDone = false;
  let lineCount = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const sec = isSection(line);
    if (sec) {
      current = sec in sections ? sec : "other";
      headerDone = true;
      continue;
    }

    // Auto-end header after first 10 non-empty lines
    if (!headerDone) {
      lineCount++;
      if (lineCount > 10) { headerDone = true; current = "other"; }
    }

    (sections[current] = sections[current] || []).push(line);
  }

  return sections;
}

// ─── PERSONAL INFO ────────────────────────────────────────────────────────────
function parseLinkedInPersonal(headerLines: string[], allText: string): ParsedPersonal {
  const allLines = allText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Name: look in first 10 lines for 2-4 capitalized words, no digits/@/common-words
  const stopWords = /^(contact|email|phone|linkedin|location|summary|experience|education|skills|about|top|skills|profile)$/i;
  let name = "";
  for (const line of allLines.slice(0, 10)) {
    if (line.includes("@") || line.includes("http") || /\d{3,}/.test(line)) continue;
    if (line.length < 4 || line.length > 70) continue;
    // Match 2-4 capitalized word names (allows hyphenated surnames)
    if (/^[A-Z][a-záéíóúàèìòùäëïöüñ'-]+(?:\s+[A-Z][a-záéíóúàèìòùäëïöüñ'-]+){1,3}$/.test(line)) {
      const words = line.split(" ");
      if (words.every((w) => !stopWords.test(w))) {
        name = line; break;
      }
    }
  }
  // Second pass: less strict — first short non-contact line
  if (!name) {
    for (const line of allLines.slice(0, 8)) {
      if (line.includes("@") || /\d{4}/.test(line) || line.length > 60 || line.length < 4) continue;
      if (stopWords.test(line)) continue;
      if (/^[A-Z]/.test(line) && line.split(" ").length >= 2) {
        name = line; break;
      }
    }
  }

  // Headline: first longer line after name containing title/role indicators, or just the 2nd non-contact line
  let jobTitle = "";
  const titleKw = /engineer|developer|manager|director|lead|senior|analyst|consultant|specialist|architect|scientist|officer|coordinator|president|founder|partner|executive|head\s+of|vp|sales|business|product|marketing|design|data|cloud|software|enterprise/i;
  let foundName = false;
  for (const line of allLines.slice(0, 12)) {
    if (line === name) { foundName = true; continue; }
    if (!foundName) continue;
    if (line.includes("@") || /^[\+\d]/.test(line) || line.length < 8) continue;
    if (line.length > 10 && line.length < 200) {
      jobTitle = line; break;
    }
  }

  const email = (allText.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/i) || [])[0]?.toLowerCase() || "";
  const phone = (allText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) || [])[0]?.trim() || "";
  const linkedinMatch = allText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w-]+)/i);
  const linkedin = linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : "";

  // Location: avoid garbage like "Suite,Global"
  let location = "";
  const locMatch = allText.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?),\s*([A-Z][a-z]{3,}|[A-Z]{2})\b/g) || [];
  // Pick location that's not an org/company name
  for (const m of locMatch) {
    if (m.split(" ").length <= 4 && !m.includes("Suite") && !m.includes("Global")) {
      location = m; break;
    }
  }

  return { name, email, phone, linkedin, location, portfolio: "", jobTitle };
}

// ─── EXPERIENCE ───────────────────────────────────────────────────────────────
function parseLinkedInExperience(lines: string[]): ParsedExperience[] {
  const results: ParsedExperience[] = [];

  interface Draft {
    company: string; title: string;
    startDate: string; endDate: string; current: boolean;
    location: string; bullets: string[]; durationLine: string;
  }
  let cur: Draft | null = null;

  function save() {
    if (cur && (cur.company || cur.title)) {
      results.push({
        company: cur.company,
        title: cur.title,
        startDate: cur.startDate,
        endDate: cur.endDate,
        current: cur.current,
        location: cur.location,
        bullets: cur.bullets.filter((b) => b.length > 10),
      });
    }
    cur = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isDate(line)) {
      // New job block starts here — the title is on the previous line, company before that
      save();
      // Strip the duration part before parsing dates
      const dateStr = stripDuration(line);
      const dates = parseDateRange(dateStr);
      cur = { company: "", title: "", startDate: dates.start, endDate: dates.end, current: dates.current, location: "", bullets: [], durationLine: dateStr };

      // Walk back: LinkedIn format is Company (bigger font) → Title → Date line
      // Skip any line that looks like a duration string (e.g. "4 years 4 months")
      if (i >= 1 && lines[i - 1] && !isDate(lines[i - 1]) && !isDuration(lines[i - 1])) {
        cur.title = lines[i - 1];
      }
      if (i >= 2 && lines[i - 2] && lines[i - 2] !== cur.title && !isDate(lines[i - 2]) && !isDuration(lines[i - 2])) {
        cur.company = lines[i - 2];
      }
      // Fallback: if still no company, walk further back
      if (!cur.company && i >= 3 && lines[i - 3] && lines[i - 3] !== cur.title && !isDate(lines[i - 3]) && !isDuration(lines[i - 3])) {
        cur.company = lines[i - 3];
      }
      continue;
    }

    if (isDuration(line) && cur) {
      cur.durationLine = line; continue;
    }

    if (!cur) continue;

    // Location detection (after duration)
    if (cur.durationLine && !cur.location && line.length < 60 && /[A-Z][a-z]+,\s*[A-Z]/.test(line)) {
      cur.location = line; continue;
    }

    // Fill missing company
    if (!cur.company && cur.title && line !== cur.title && line.length < 80) {
      cur.company = line; continue;
    }

    // Description bullets (longer lines)
    if (line.length > 30) cur.bullets.push(line);
  }
  save();
  return results;
}

// ─── EDUCATION ────────────────────────────────────────────────────────────────
function parseLinkedInEducation(lines: string[]): ParsedEducation[] {
  const results: ParsedEducation[] = [];
  const degreeKw = /bachelor|master|phd|ph\.d|doctor|associate|b\.s|b\.a|m\.s|m\.a|mba|diploma|certificate|engineer/i;
  const schoolKw = /university|college|institute|school|academy|polytechnic/i;

  let cur: ParsedEducation | null = null;

  function save() {
    if (cur && (cur.school || cur.degree)) results.push(cur);
    cur = null;
  }

  // LinkedIn education dates often appear as: "Bachelor's degree, Mathematics · (April 2017 - October 2021)"
  // or on a standalone line: "· (April 2017 - October 2021)" or "(2017 - 2021)"
  function extractParensDate(line: string): { start: string; end: string; current: boolean } | null {
    // Match "· (Month YYYY - Month YYYY)" or "(YYYY - YYYY)" or "(Month YYYY - Present)"
    const m = line.match(/\(([^)]+)\)/);
    if (!m) return null;
    const inner = m[1].trim();
    if (LI_DATE_RE.test(inner) || YEAR_ONLY_RE.test(inner)) {
      return parseDateRange(inner);
    }
    return null;
  }

  for (const line of lines) {
    // Check for paren-wrapped date on any line (even combined with degree text)
    const parenDate = extractParensDate(line);
    if (parenDate && cur) {
      cur.startDate = parenDate.start;
      cur.endDate = parenDate.end;
      // If the line also has degree info before the "·", extract it
      const beforeParen = line.replace(/\s*[·•]?\s*\([^)]+\)/, "").trim();
      if (beforeParen && !cur.degree && degreeKw.test(beforeParen)) {
        cur.degree = beforeParen;
      }
      continue;
    }

    if (schoolKw.test(line)) {
      save();
      cur = { school: line, degree: "", field: "", startDate: "", endDate: "", gpa: "", location: "" };
    } else if (!cur && degreeKw.test(line)) {
      cur = { school: "", degree: line, field: "", startDate: "", endDate: "", gpa: "", location: "" };
    } else if (cur) {
      // Standalone date line (not wrapped in parens)
      if (isDate(line) || YEAR_ONLY_RE.test(stripDuration(line))) {
        const d = parseDateRange(line);
        cur.startDate = d.start; cur.endDate = d.end;
      } else if (degreeKw.test(line) && !cur.degree) {
        cur.degree = line;
      } else if (!cur.field && /science|engineering|arts|commerce|business|computer|information|economics|mathematics|physics|chemistry|biology|psychology|law|medicine|finance|accounting/i.test(line)) {
        cur.field = line;
      } else if (/GPA|Grade/i.test(line)) {
        const m2 = line.match(/[\d.]+/);
        if (m2) cur.gpa = m2[0];
      }
    }
  }
  save();
  return results.filter((e) => e.school || e.degree);
}

// ─── SKILLS ───────────────────────────────────────────────────────────────────
function parseLinkedInSkills(lines: string[], allText: string): string[] {
  const found = new Set<string>();

  // LinkedIn lists skills one per line in the Skills section
  for (const line of lines) {
    const clean = line.trim();
    if (clean.length >= 2 && clean.length <= 50 && /[a-zA-Z]/.test(clean)) {
      // Exclude obvious non-skills
      if (!/^\d+$/.test(clean) && !isDate(clean)) {
        found.add(clean);
      }
    }
  }

  // Also scan full text for known tech keywords
  const TECH = ["React","Next.js","Vue","Angular","Node.js","Python","Java","TypeScript","JavaScript","AWS","Azure","GCP","Docker","Kubernetes","PostgreSQL","MongoDB","Redis","Git","GraphQL","REST","Machine Learning","TensorFlow","PyTorch","SQL","Linux","CI/CD","Agile","Scrum","Salesforce","Excel","Power BI","Figma","Jira"];
  for (const t of TECH) {
    if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(allText)) {
      found.add(t);
    }
  }

  return Array.from(found).slice(0, 20);
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
// LinkedIn PDFs interleave sidebar items (skills, cert names) into the summary text.
// Filter those out by removing lines that look like sidebar entries:
// - Short skill names (< 40 chars, no sentence punctuation)
// - Certification titles
// - Top Skills header
const SIDEBAR_LINE_RE = /^(top skills?|certifications?|languages?|contact|honors|publications|courses|projects|volunteer)/i;

function parseLinkedInSummary(lines: string[]): string {
  const summaryLines: string[] = [];
  for (const line of lines) {
    // Skip sidebar header markers
    if (SIDEBAR_LINE_RE.test(line.trim())) continue;
    // Skip very short lines that look like sidebar skill/cert entries (< 45 chars, no sentence-ending punctuation)
    if (line.length < 45 && !/[.!?]/.test(line) && !/\d/.test(line)) continue;
    summaryLines.push(line);
    if (summaryLines.length >= 12) break;
  }
  return summaryLines.join(" ").replace(/\s+/g, " ").substring(0, 1200).trim();
}

// ─── QUALITY SCORING ─────────────────────────────────────────────────────────
function calcAccuracy(r: Pick<ParsedResume, "personal" | "experience" | "education" | "skills" | "summary">): number {
  let s = 0;
  if (r.personal.name) s += 20;
  if (r.personal.email) s += 10;
  if (r.personal.phone) s += 5;
  if (r.personal.linkedin) s += 10;
  if (r.personal.location) s += 5;
  if (r.summary) s += 10;
  if (r.experience.length > 0) s += 15;
  if (r.experience.length > 1) s += 5;
  if (r.experience.some((e) => e.bullets.length > 0)) s += 5;
  if (r.education.length > 0) s += 10;
  if (r.skills.length >= 3) s += 5;
  return Math.min(100, s);
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────
export function parseLinkedInText(rawText: string, filename = "linkedin-profile"): ParsedResume {
  const id = Math.random().toString(36).substring(2, 10);
  const warnings: string[] = [];

  // Normalize whitespace
  const text = rawText
    .replace(/\r\n?/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections = splitSections(lines);

  const personal = parseLinkedInPersonal(sections.header, text);
  const summary = parseLinkedInSummary(sections.summary);
  const experience = parseLinkedInExperience(sections.experience);
  const education = parseLinkedInEducation(sections.education);
  const skills = parseLinkedInSkills(sections.skills, text);
  const certifications = (sections.certifications || [])
    .filter((l) => l.length > 5)
    .map((name) => ({ name, issuer: "", date: "", url: "" }))
    .slice(0, 6);

  if (!personal.name) warnings.push("⚠️ Could not detect name — check if the PDF is a LinkedIn export");
  if (!personal.email) warnings.push("ℹ️ Email not found — add it manually in the Builder");
  if (experience.length === 0) warnings.push("⚠️ No experience found — try using 'Save to PDF' from LinkedIn");

  const core = { personal, summary, experience, education, skills };
  const parseAccuracy = calcAccuracy(core);

  return {
    id, filename, parsedAt: new Date().toISOString(),
    parseAccuracy: Math.max(parseAccuracy, experience.length > 0 ? 70 : 20),
    warnings,
    ...core,
    certifications,
  };
}
