import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === "") return "";

  const s = dateStr.trim();

  // Format: "YYYY-MM" — builder's native format
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [year, month] = s.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Format: "Month YYYY" or "Mon YYYY" — LinkedIn/parsed format e.g. "February 2025", "Feb 2025"
  const monthYearMatch = s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const d = new Date(`${monthYearMatch[1]} 1, ${monthYearMatch[2]}`);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Format: plain year "2024"
  if (/^\d{4}$/.test(s)) return s;

  // Format: "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00");
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Fallback: return as-is if it's human-readable
  if (/[a-zA-Z]/.test(s)) return s;

  return "";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export const SKILLS_DATABASE = [
  // Programming Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "Ruby", "PHP", "Scala", "R", "MATLAB", "Dart", "Elixir",
  // Frontend
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML5", "CSS3",
  "Tailwind CSS", "SASS/SCSS", "Bootstrap", "Material UI", "Framer Motion",
  // Backend
  "Node.js", "Express.js", "FastAPI", "Django", "Spring Boot", "Laravel",
  "Ruby on Rails", "ASP.NET", "NestJS", "Fastify",
  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Elasticsearch",
  "DynamoDB", "Cassandra", "Neo4j", "Supabase",
  // Cloud & DevOps
  "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform",
  "CI/CD", "Jenkins", "GitHub Actions", "Ansible", "Linux", "Nginx",
  // AI/ML
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "OpenAI API",
  "LangChain", "Pandas", "NumPy", "Scikit-learn", "Computer Vision", "NLP",
  // Tools
  "Git", "GitHub", "GitLab", "Jira", "Confluence", "Figma", "Postman",
  "VS Code", "IntelliJ IDEA", "Webpack", "Vite",
  // Soft Skills
  "Team Leadership", "Project Management", "Agile/Scrum", "Problem Solving",
  "Communication", "Mentoring", "Code Review", "System Design",
  // Marketing
  "SEO", "Google Analytics", "Facebook Ads", "Content Marketing", "Email Marketing",
  "Social Media Marketing", "HubSpot", "Salesforce",
  // Finance
  "Financial Modeling", "Excel", "Power BI", "Tableau", "Bloomberg", "QuickBooks",
  // Healthcare
  "Electronic Health Records", "HIPAA Compliance", "Patient Care", "Clinical Research",
  // Design
  "Adobe Photoshop", "Adobe Illustrator", "Adobe XD", "Sketch", "InVision",
  "UI/UX Design", "Wireframing", "Prototyping",
];

// ── Category-specific skill databases for smart recommendations ──
export type ProfessionKey = "sales" | "marketing" | "it" | "finance" | "hr";

export const CATEGORY_SKILLS: Record<ProfessionKey, string[]> = {
  sales: [
    "Salesforce", "CRM", "Lead Generation", "Cold Calling", "Pipeline Management",
    "SPIN Selling", "MEDDIC", "Account Management", "Quota Attainment", "Negotiation",
    "Prospecting", "Territory Management", "Solution Selling", "Revenue Forecasting",
    "Client Retention", "Sales Analytics", "HubSpot CRM", "Outreach.io",
  ],
  marketing: [
    "Google Analytics", "SEO/SEM", "HubSpot", "Content Marketing", "Social Media Ads",
    "A/B Testing", "Email Automation", "Conversion Optimization", "PPC", "Marketo",
    "Google Ads", "Facebook Ads", "Copywriting", "Brand Strategy", "Marketing Automation",
    "Influencer Marketing", "Keyword Research", "Landing Page Optimization",
  ],
  it: [
    "JavaScript", "Python", "React", "Node.js", "AWS", "Azure", "Docker",
    "Kubernetes", "Git", "Agile/Scrum", "TypeScript", "PostgreSQL", "MongoDB",
    "CI/CD", "Terraform", "Linux", "REST APIs", "GraphQL", "System Design",
  ],
  finance: [
    "Excel Advanced", "Financial Modeling", "Power BI", "QuickBooks", "SAP",
    "GAAP/IFRS", "Risk Analysis", "Forecasting", "Budgeting", "Tableau",
    "Bloomberg Terminal", "Variance Analysis", "Cash Flow Management",
    "FP&A", "ERP Systems", "SOX Compliance", "Cost Accounting",
  ],
  hr: [
    "Workday", "ADP", "Talent Acquisition", "Performance Management",
    "Employee Relations", "DEI Initiatives", "Compliance", "Onboarding",
    "Succession Planning", "Applicant Tracking Systems", "Benefits Administration",
    "Compensation & Benefits", "Learning & Development", "HR Analytics",
    "Conflict Resolution", "Culture Building",
  ],
};

// Template ids that map to a profession key
export const TEMPLATE_PROFESSION_MAP: Record<string, ProfessionKey> = {
  "prof-sales": "sales",
  "prof-marketing": "marketing",
  "prof-it": "it",
  "prof-finance": "finance",
  "prof-hr": "hr",
  "industry-it": "it",
  "industry-sales": "sales",
};

// Auto-fill professional summaries per category
export const CATEGORY_SUMMARIES: Record<ProfessionKey, string> = {
  sales:
    "Results-driven Sales Professional with a proven track record of exceeding quota and building high-value client relationships. Expert in full-cycle sales from prospecting through close, with deep expertise in CRM management, consultative selling, and territory expansion. Consistently ranked in the top 10% of sales teams with measurable impact on revenue growth.",
  marketing:
    "Dynamic Digital Marketing Specialist with expertise in data-driven campaign strategy across paid, owned, and earned channels. Proven ability to grow brand presence, drive qualified traffic, and optimize conversion funnels. Skilled in SEO/SEM, marketing automation, and analytics to deliver measurable ROI on marketing investments.",
  it:
    "Full-Stack Software Engineer with extensive experience designing and delivering scalable, high-performance applications. Proficient across the modern web stack with strong foundations in system design, cloud infrastructure, and DevOps. Passionate about clean code, CI/CD practices, and building products that serve millions of users.",
  finance:
    "Detail-oriented Finance Professional with deep expertise in financial modeling, reporting, and strategic analysis. Skilled in FP&A, budgeting, and data visualization to support executive decision-making. Track record of streamlining financial processes, ensuring regulatory compliance, and delivering actionable insights that drive business performance.",
  hr:
    "Strategic Human Resources Leader with comprehensive experience across the full employee lifecycle — from talent acquisition and onboarding through performance management and succession planning. Proven ability to build inclusive cultures, improve employee engagement, and align HR programs with business objectives. Expert in HR technology platforms and data-driven people strategies.",
};
