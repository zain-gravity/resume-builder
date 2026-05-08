import { ResumeData } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export interface Template {
  id: string;
  name: string;
  category: "Professional" | "Creative" | "Modern" | "Simple" | "Industry" | "Company" | "Country" | "Academic";
  professionKey?: "sales" | "marketing" | "it" | "finance" | "hr";
  description: string;
  badge?: string; // e.g. "🇩🇪 Germany", "🏢 Google"
  colors: { primary: string; accent: string; text: string; bg: string };
  fonts: { heading: string; body: string };
  layout: "single-column" | "two-column" | "sidebar";
  tip?: string; // usage tip shown in switcher tooltip
}

export const TEMPLATES: Template[] = [
  { id: "modern-minimal", name: "Modern Minimal", category: "Modern", description: "Clean lines, perfect for tech roles", colors: { primary: "#2E86AB", accent: "#1E5F8A", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "professional-blue", name: "Executive Blue", category: "Professional", description: "Classic executive look with blue accents", colors: { primary: "#1E3A5F", accent: "#2E86AB", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Georgia", body: "Arial" }, layout: "single-column" },
  { id: "creative-purple", name: "Creative Purple", category: "Creative", description: "Bold sidebar for creative professionals", colors: { primary: "#A23B72", accent: "#7D2E5A", text: "#FFFFFF", bg: "#A23B72" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "two-column" },
  { id: "modern-dark", name: "Dark Pro", category: "Modern", description: "Sleek dark theme for tech professionals", colors: { primary: "#0F172A", accent: "#3B82F6", text: "#F8FAFC", bg: "#0F172A" }, fonts: { heading: "Inter", body: "Inter" }, layout: "single-column" },
  { id: "professional-classic", name: "Classic Serif", category: "Professional", description: "Timeless serif design for finance & law", colors: { primary: "#1A1A1A", accent: "#8B4513", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Georgia", body: "Times New Roman" }, layout: "single-column" },
  { id: "creative-gradient", name: "Gradient Edge", category: "Creative", description: "Vibrant gradient for marketing & design", colors: { primary: "#F18F01", accent: "#A23B72", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "modern-two-column", name: "Split Modern", category: "Modern", description: "Two-column layout maximizes space", colors: { primary: "#059669", accent: "#065F46", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "two-column" },
  { id: "simple-clean", name: "Clean & Simple", category: "Simple", description: "Minimalist design for any industry", colors: { primary: "#374151", accent: "#6B7280", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Arial", body: "Arial" }, layout: "single-column" },
  { id: "simple-compact", name: "Compact Pro", description: "Dense 1-page format", category: "Simple", colors: { primary: "#2563EB", accent: "#1D4ED8", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "industry-it", name: "Tech Stack", category: "Industry", description: "Dev & engineering focused", colors: { primary: "#7C3AED", accent: "#5B21B6", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "JetBrains Mono", body: "Inter" }, layout: "two-column" },
  { id: "industry-nurse", name: "Healthcare Pro", category: "Industry", description: "Clean & trustworthy for healthcare", colors: { primary: "#0891B2", accent: "#155E75", text: "#1A1A1A", bg: "#F0FAFB" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "industry-sales", name: "Sales Champion", category: "Industry", description: "Results-focused for sales pros", colors: { primary: "#DC2626", accent: "#991B1B", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  // ── 5 NEW PROFESSIONAL CATEGORY TEMPLATES ──
  { id: "prof-sales", name: "Sales Pro", category: "Industry", professionKey: "sales", description: "Tailored for sales executives & account managers", colors: { primary: "#e74c3c", accent: "#c0392b", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "prof-marketing", name: "Digital Marketer", category: "Industry", professionKey: "marketing", description: "Perfect for marketers & content creators", colors: { primary: "#f39c12", accent: "#d68910", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "prof-it", name: "IT Engineer", category: "Industry", professionKey: "it", description: "Developers, engineers & DevOps professionals", colors: { primary: "#9b59b6", accent: "#8e44ad", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "two-column" },
  { id: "prof-finance", name: "Finance Expert", category: "Industry", professionKey: "finance", description: "Accountants, analysts & financial planners", colors: { primary: "#27ae60", accent: "#1e8449", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "prof-hr", name: "HR Leader", category: "Industry", professionKey: "hr", description: "HR managers, recruiters & talent acquisition", colors: { primary: "#3498db", accent: "#2980b9", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },

  // ── COMPANY-SPECIFIC FORMATS ──
  { id: "co-google", name: "Google / FAANG", category: "Company", badge: "🏢 Big Tech", description: "Clean ATS-optimized, single-column. Preferred by Google, Meta, Apple, Netflix, Amazon. No photos, pure text, keyword-rich bullets.", tip: "Used by Google, Meta, Amazon, Netflix, Apple. 1 page max, bullet points with metrics.", colors: { primary: "#4285F4", accent: "#1A73E8", text: "#202124", bg: "#FFFFFF" }, fonts: { heading: "Arial", body: "Arial" }, layout: "single-column" },
  { id: "co-mckinsey", name: "McKinsey / MBB", category: "Company", badge: "🏢 Consulting", description: "Consulting firm preferred: no summary, education first, tight bullet points with action + impact + number formula.", tip: "McKinsey, BCG, Bain style. No summary section, 1 page, every bullet = action + result + number.", colors: { primary: "#003366", accent: "#005288", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Georgia", body: "Arial" }, layout: "single-column" },
  { id: "co-goldman", name: "Goldman Sachs / Finance", category: "Company", badge: "🏢 Finance", description: "Top-tier banking & finance format. Conservative serif fonts, tight margins, education at top, GPA mandatory.", tip: "Goldman Sachs, JP Morgan, Morgan Stanley. Classic black serif, GPA shown, 1 strict page.", colors: { primary: "#1A1A1A", accent: "#4A4A4A", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Times New Roman", body: "Times New Roman" }, layout: "single-column" },
  { id: "co-big4", name: "Big 4 Audit / Accounting", category: "Company", badge: "🏢 Big 4", description: "Deloitte, PwC, EY, KPMG preferred format. Professional blue, certifications prominent, neat section breaks.", tip: "Deloitte, PwC, EY, KPMG. CPA/CFA certifications must be listed. Blue accent, neat borders.", colors: { primary: "#00538B", accent: "#003865", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Calibri", body: "Calibri" }, layout: "single-column" },
  { id: "co-startup", name: "Startup / Unicorn", category: "Company", badge: "🚀 Startup", description: "Modern two-column for tech startups & unicorns. Bold accent, GitHub/portfolio prominent, skills sidebar.", tip: "Y Combinator, Airbnb, Stripe, Figma style. Show GitHub, side projects, impact metrics.", colors: { primary: "#FF5A1F", accent: "#E74011", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Inter", body: "Inter" }, layout: "two-column" },
  { id: "co-law", name: "Law Firm / Legal", category: "Company", badge: "⚖️ Legal", description: "Conservative serif format for law firms, judicial clerkships, and legal roles. Bar admission & publications listed.", tip: "BigLaw firms: Skadden, Latham, Cravath. Bar admission, law school rank, law review at top.", colors: { primary: "#2C2C54", accent: "#40407A", text: "#1A1A1A", bg: "#FFFFF8" }, fonts: { heading: "Georgia", body: "Georgia" }, layout: "single-column" },
  { id: "co-medical", name: "Healthcare / Medical", category: "Company", badge: "🏥 Medical", description: "CV format for physicians, nurses, and healthcare professionals. License numbers, clinical rotations, publications.", tip: "Hospitals, clinics, pharmaceutical. License numbers prominent, clinical experience detailed.", colors: { primary: "#0077B6", accent: "#005F9E", text: "#1A1A1A", bg: "#F0F9FF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "co-teacher", name: "Education / Teacher", category: "Company", badge: "🎓 Education", description: "Format preferred by school districts, universities and educational institutions. Teaching certifications, grade levels.", tip: "K-12 schools, universities. Teaching cert, grade levels, state license, student outcomes.", colors: { primary: "#2D6A4F", accent: "#1B4332", text: "#1A1A1A", bg: "#F8FFF8" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "co-creative", name: "Creative Agency", category: "Company", badge: "🎨 Agency", description: "Bold creative design for advertising agencies, design studios, and media companies. Portfolio-forward layout.", tip: "Agencies, design studios. Portfolio link must be prominent. Show campaigns, brand work.", colors: { primary: "#E040FB", accent: "#AB47BC", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "sidebar" },
  { id: "co-government", name: "Federal / Government", category: "Company", badge: "🏛️ Gov", description: "US Federal resume (USAJOBS) format. Detailed, 2–5 pages, includes salary history, supervisor contacts, hours per week.", tip: "USAJOBS format. Very detailed — include hours/week, salary, supervisor contact. No page limit.", colors: { primary: "#1B3A6B", accent: "#2B4D8E", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Arial", body: "Arial" }, layout: "single-column" },

  // ── COUNTRY-SPECIFIC FORMATS ──
  { id: "cn-germany", name: "German Lebenslauf", category: "Country", badge: "🇩🇪 Germany", description: "Classic German CV: reverse-chronological, formal photo placeholder, date of birth, nationality, marital status optional. Structured & precise.", tip: "German employers expect: photo, DOB, nationality, signature. No gaps allowed. Sehr formal.", colors: { primary: "#000000", accent: "#333333", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Arial", body: "Arial" }, layout: "single-column" },
  { id: "cn-uk", name: "UK CV", category: "Country", badge: "🇬🇧 UK", description: "British CV format: 2 pages A4, personal statement at top, no photo, no DOB, references available on request.", tip: "UK: No photo, no DOB, no marital status. Personal statement at top, 2 pages A4 max.", colors: { primary: "#00247D", accent: "#CF142B", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Georgia", body: "Arial" }, layout: "single-column" },
  { id: "cn-france", name: "French CV", category: "Country", badge: "🇫🇷 France", description: "French curriculum vitae: photo optional (top-right), personal details, career objective (accroche), clean European style.", tip: "France: Photo common but not mandatory. Add accroche (objective). 1 page for <10yr experience.", colors: { primary: "#002395", accent: "#ED2939", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "two-column" },
  { id: "cn-canada", name: "Canadian Resume", category: "Country", badge: "🇨🇦 Canada", description: "Canadian format: hybrid functional/chronological, bilingual-aware layout, no photo, strong skills summary at top.", tip: "Canada: No photo, no DOB. Skills summary prominent. Quebec: add French proficiency.", colors: { primary: "#FF0000", accent: "#CC0000", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "cn-australia", name: "Australian CV", category: "Country", badge: "🇦🇺 Australia", description: "Australian CV: 2-3 pages, referee details included, Key Selection Criteria (KSC) addressed for government jobs.", tip: "Australia: 2-3 pages. Include 2 referees at end. Government roles: address KSC explicitly.", colors: { primary: "#00843D", accent: "#003F2D", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "cn-japan", name: "Japanese Style", category: "Country", badge: "🇯🇵 Japan", description: "Western adaptation of Japanese Shokumu Keirekisho: career summary, detailed professional history, skills, self-promotion section.", tip: "Japan: Formal, structured. Add motivation statement at end. No casual language. Very detail-oriented.", colors: { primary: "#BC002D", accent: "#8B0022", text: "#1A1A1A", bg: "#FFFFF0" }, fonts: { heading: "Georgia", body: "Arial" }, layout: "single-column" },
  { id: "cn-uae", name: "UAE / Gulf (GCC)", category: "Country", badge: "🇦🇪 UAE/Gulf", description: "Middle East format: photo expected, nationality, visa status, current salary (optional), personal details more prominent.", tip: "UAE/KSA/Qatar: Include photo, nationality, visa status. Personal details section expected.", colors: { primary: "#006400", accent: "#004B23", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "two-column" },
  { id: "cn-india", name: "Indian Resume", category: "Country", badge: "🇮🇳 India", description: "Indian format: career objective, declaration at end, father's name optional for govt jobs, detailed personal info common.", tip: "India: Career objective at top. Add declaration at bottom. IT roles: CGPA, college tier matters.", colors: { primary: "#FF9933", accent: "#138808", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },
  { id: "cn-europass", name: "Europass CV", category: "Country", badge: "🇪🇺 Europass", description: "EU standardized CV format. Accepted across all 27 EU member states. Structured sections, language skills grid, digital competencies.", tip: "EU-standard. Recognized across all 27 member states. Language grid with CEFR levels required.", colors: { primary: "#003399", accent: "#FFCC00", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Arial", body: "Arial" }, layout: "single-column" },
  { id: "cn-newzealand", name: "New Zealand CV", category: "Country", badge: "🇳🇿 NZ", description: "NZ format: 2-3 pages, strong personal statement, referee section, tone slightly more personal than UK. ACC-aware for govt.", tip: "NZ: Similar to Australia. Include hobbies/interests. Referees at end. Friendly but professional tone.", colors: { primary: "#00247D", accent: "#CC142B", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Poppins", body: "Open Sans" }, layout: "single-column" },

  // ── ACADEMIC / RESEARCH ──
  { id: "ac-academic", name: "Academic / Research CV", category: "Academic", badge: "🎓 Academic", description: "Full academic CV: publications, grants, conferences, teaching experience, research interests. Unlimited length format.", tip: "Universities, research institutes. List ALL publications, grants, awards. Length = experience.", colors: { primary: "#4A235A", accent: "#6C3483", text: "#1A1A1A", bg: "#FFFFFF" }, fonts: { heading: "Georgia", body: "Times New Roman" }, layout: "single-column" },
  { id: "ac-ats-pure", name: "ATS-Pure (Robot-Safe)", category: "Academic", badge: "🤖 ATS", description: "100% ATS-safe: no graphics, no colors, no tables, plain text structure. Maximum parse accuracy for automated systems.", tip: "Use when applying through ATS systems. All text, no colors, perfect for Indeed/Workday/Taleo.", colors: { primary: "#374151", accent: "#374151", text: "#111827", bg: "#FFFFFF" }, fonts: { heading: "Arial", body: "Arial" }, layout: "single-column" },
];


export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

// Generate HTML preview of the resume
export function generateResumeHTML(data: ResumeData, templateId: string): string {
  const template = getTemplate(templateId);
  const fullName = `${data.personalInfo.firstName} ${data.personalInfo.lastName}`.trim() || "Your Name";

  // Company-specific renderers
  if (templateId === "co-mckinsey") return generateMcKinseyHTML(data, template, fullName);
  if (templateId === "co-goldman") return generateGoldmanHTML(data, template, fullName);
  if (templateId === "cn-germany") return generateGermanHTML(data, template, fullName);
  if (templateId === "cn-uk") return generateUKHTML(data, template, fullName);
  if (templateId === "cn-japan") return generateJapanHTML(data, template, fullName);
  if (templateId === "ac-academic") return generateAcademicHTML(data, template, fullName);
  if (templateId === "ac-ats-pure") return generateATSPureHTML(data, fullName);
  if (templateId === "cn-europass") return generateEuropassHTML(data, template, fullName);
  if (templateId === "cn-india") return generateIndiaHTML(data, template, fullName);

  if (template.layout === "two-column" || template.layout === "sidebar") {
    return generateTwoColumnHTML(data, template, fullName);
  }
  return generateSingleColumnHTML(data, template, fullName);
}

function generateSingleColumnHTML(data: ResumeData, t: Template, fullName: string): string {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const isDark = t.colors.bg === "#0F172A";
  const textColor = isDark ? "#F8FAFC" : t.colors.text;
  const bgColor = t.colors.bg;
  const primary = t.colors.primary;
  const accent = t.colors.accent;

  const contactInfo = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.portfolio,
  ].filter(Boolean).join(" · ");

  const expHTML = workExperience.map((exp) => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <div style="font-weight:700;font-size:14px;color:${textColor}">${exp.title || "Job Title"}</div>
          <div style="font-weight:600;font-size:13px;color:${primary}">${exp.company || "Company"}</div>
        </div>
        <div style="font-size:12px;color:${isDark ? "#94A3B8" : "#6B7280"};white-space:nowrap;margin-left:8px">
          ${formatDate(exp.startDate)} – ${exp.current ? "Present" : formatDate(exp.endDate)}
          ${exp.location ? ` · ${exp.location}` : ""}
        </div>
      </div>
      ${exp.description
        ? `<p style="font-size:12.5px;color:${isDark ? "#CBD5E1" : "#374151"};line-height:1.6;margin-top:6px;white-space:pre-wrap">${exp.description.replace(/\n/g, "<br>")}</p>`
        : `<ul style="margin-top:6px;padding-left:16px">
        ${exp.bullets.filter(Boolean).map((b) => `<li style="font-size:12.5px;color:${isDark ? "#CBD5E1" : "#374151"};margin-bottom:3px;line-height:1.5">${b}</li>`).join("")}
      </ul>`
      }
    </div>`).join("");

  const eduHTML = education.map((edu) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between">
        <div>
          <div style="font-weight:700;font-size:13px;color:${textColor}">${edu.degree} ${edu.field ? `in ${edu.field}` : ""}</div>
          <div style="font-size:12.5px;color:${primary}">${edu.school}</div>
        </div>
        <div style="font-size:12px;color:${isDark ? "#94A3B8" : "#6B7280"}">
          ${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}
          ${edu.gpa ? ` · GPA: ${edu.gpa}` : ""}
        </div>
      </div>
    </div>`).join("");

  const skillsHTML = skills.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${skills.map((s) => `<span style="background:${isDark ? "rgba(255,255,255,0.1)" : `${primary}18`};color:${isDark ? "#93C5FD" : primary};padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600">${s}</span>`).join("")}</div>`
    : "<p style=\"font-size:12px;color:#9CA3AF\">Add your skills</p>";

  const certHTML = certifications.length > 0
    ? certifications.map((c) => `<div style="font-size:12.5px;margin-bottom:4px"><span style="font-weight:600;color:${textColor}">${c.name}</span><span style="color:${isDark ? "#94A3B8" : "#6B7280"}"> · ${c.issuer}${c.date ? ` · ${formatDate(c.date)}` : ""}</span></div>`).join("")
    : "";

  const sectionHeader = (title: string) =>
    `<div style="border-bottom:2px solid ${primary};margin-bottom:8px;padding-bottom:3px"><span style="font-family:'${t.fonts.heading}',sans-serif;font-size:14px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:1px">${title}</span></div>`;

  return `<div style="font-family:'${t.fonts.body}',sans-serif;background:${bgColor};color:${textColor};padding:32px;min-height:100%;max-width:780px;margin:0 auto;box-sizing:border-box">
    <!-- Header -->
    <div id="preview-personal" style="text-align:center;margin-bottom:18px;border-bottom:3px solid ${primary};padding-bottom:16px">
      <h1 style="font-family:'${t.fonts.heading}',sans-serif;font-size:28px;font-weight:900;color:${textColor};margin:0 0 4px">${fullName}</h1>
      ${personalInfo.jobTitle ? `<div style="font-size:15px;color:${primary};font-weight:600;margin-bottom:6px">${personalInfo.jobTitle}</div>` : ""}
      <div style="font-size:12px;color:${isDark ? "#94A3B8" : "#6B7280"}">${contactInfo || "your@email.com · (555) 000-0000 · City, State"}</div>
    </div>
    ${summary ? `<div id="preview-summary" style="margin-bottom:18px">${sectionHeader("Professional Summary")}<p style="font-size:12.5px;line-height:1.6;color:${isDark ? "#CBD5E1" : "#374151"};white-space:pre-wrap">${summary.replace(/\n/g, "<br>")}</p></div>` : ""}
    ${workExperience.length > 0 ? `<div id="preview-experience" style="margin-bottom:18px">${sectionHeader("Work Experience")}${expHTML}</div>` : ""}
    ${education.length > 0 ? `<div id="preview-education" style="margin-bottom:18px">${sectionHeader("Education")}${eduHTML}</div>` : ""}
    ${skills.length > 0 ? `<div id="preview-skills" style="margin-bottom:18px">${sectionHeader("Skills")}${skillsHTML}</div>` : ""}
    ${certifications.length > 0 ? `<div id="preview-certifications" style="margin-bottom:18px">${sectionHeader("Certifications")}${certHTML}</div>` : ""}
  </div>`;
}

function generateTwoColumnHTML(data: ResumeData, t: Template, fullName: string): string {
  const { personalInfo, summary, workExperience, education, skills, certifications } = data;
  const primary = t.colors.primary;
  const accent = t.colors.accent;
  const isSidebar = t.colors.bg === t.colors.primary;
  const sidebarBg = isSidebar ? primary : "#F8FAFC";
  const sidebarText = isSidebar ? "#FFFFFF" : "#1A1A1A";
  const mainBg = "#FFFFFF";
  const mainText = "#1A1A1A";

  const sidebarHeader = (title: string) =>
    `<div style="font-family:'${t.fonts.heading}',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${isSidebar ? "rgba(255,255,255,0.6)" : accent};margin:14px 0 6px;border-bottom:1px solid ${isSidebar ? "rgba(255,255,255,0.3)" : "#E5E7EB"};padding-bottom:4px">${title}</div>`;

  const mainHeader = (title: string) =>
    `<div style="font-family:'${t.fonts.heading}',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${primary};border-bottom:2px solid ${primary};padding-bottom:3px;margin-bottom:8px;margin-top:16px">${title}</div>`;

  const expHTML = workExperience.map((exp) => `
    <div style="margin-bottom:12px">
      <div style="font-weight:700;font-size:13.5px;color:${mainText}">${exp.title || "Job Title"}</div>
      <div style="font-weight:600;font-size:12.5px;color:${primary}">${exp.company || "Company"}${exp.location ? ` · ${exp.location}` : ""}</div>
      <div style="font-size:11.5px;color:#6B7280;margin-bottom:4px">${formatDate(exp.startDate)} – ${exp.current ? "Present" : formatDate(exp.endDate)}</div>
      ${exp.description
        ? `<p style="font-size:12px;color:#374151;line-height:1.6;white-space:pre-wrap">${exp.description.replace(/\n/g, "<br>")}</p>`
        : `<ul style="padding-left:15px;margin:0">${exp.bullets.filter(Boolean).map((b) => `<li style="font-size:12px;color:#374151;margin-bottom:2px;line-height:1.5">${b}</li>`).join("")}</ul>`
      }
    </div>`).join("");

  return `<div style="font-family:'${t.fonts.body}',sans-serif;display:flex;min-height:100%;background:${mainBg}">
    <!-- Sidebar -->
    <div id="preview-personal" style="width:35%;background:${sidebarBg};padding:28px 20px;color:${sidebarText}">
      <h1 style="font-family:'${t.fonts.heading}',sans-serif;font-size:22px;font-weight:900;line-height:1.2;margin:0 0 4px">${fullName}</h1>
      ${personalInfo.jobTitle ? `<div style="font-size:13px;opacity:0.85;font-weight:500;margin-bottom:14px">${personalInfo.jobTitle}</div>` : ""}
      ${sidebarHeader("Contact")}
      <div style="font-size:11.5px;line-height:1.8">
        ${personalInfo.email ? `<div>📧 ${personalInfo.email}</div>` : ""}
        ${personalInfo.phone ? `<div>📱 ${personalInfo.phone}</div>` : ""}
        ${personalInfo.location ? `<div>📍 ${personalInfo.location}</div>` : ""}
        ${personalInfo.linkedin ? `<div>💼 ${personalInfo.linkedin}</div>` : ""}
      </div>
      ${skills.length > 0 ? `<div id="preview-skills">${sidebarHeader("Skills")}<div>${skills.map((s) => `<div style="font-size:11.5px;margin-bottom:4px;padding:3px 8px;background:${isSidebar ? "rgba(255,255,255,0.15)" : "#E5E7EB"};border-radius:4px">${s}</div>`).join("")}</div></div>` : ""}
      ${education.length > 0 ? `<div id="preview-education">${sidebarHeader("Education")}${education.map((edu) => `<div style="margin-bottom:8px"><div style="font-weight:700;font-size:12px">${edu.degree}</div><div style="font-size:11.5px;opacity:0.8">${edu.field}</div><div style="font-size:11px;opacity:0.7">${edu.school}</div><div style="font-size:11px;opacity:0.6">${formatDate(edu.endDate)}</div></div>`).join("")}</div>` : ""}
      ${certifications.length > 0 ? `<div id="preview-certifications">${sidebarHeader("Certifications")}${certifications.map((c) => `<div style="font-size:11.5px;margin-bottom:4px;font-weight:600">${c.name}</div>`).join("")}</div>` : ""}
    </div>
    <!-- Main -->
    <div style="flex:1;padding:28px 24px;background:${mainBg}">
      ${summary ? `<div id="preview-summary">${mainHeader("Summary")}<p style="font-size:12.5px;line-height:1.6;color:#374151;white-space:pre-wrap">${summary.replace(/\n/g, "<br>")}</p></div>` : ""}
      ${workExperience.length > 0 ? `<div id="preview-experience">${mainHeader("Experience")}${expHTML}</div>` : ""}
    </div>
  </div>`;
}
