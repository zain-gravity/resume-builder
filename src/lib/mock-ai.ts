// Mock AI suggestions for when no OpenAI API key is configured
// These are high-quality, realistic suggestions that demonstrate the feature

export interface BulletSuggestion {
  text: string;
  improvement: "metrics" | "power-verb" | "ats";
}

export interface AISuggestions {
  bullets?: BulletSuggestion[];
  summaries?: string[];
  error?: string;
}

const POWER_VERBS = [
  "Led", "Managed", "Developed", "Architected", "Implemented", "Delivered",
  "Increased", "Reduced", "Optimized", "Launched", "Built", "Designed",
  "Spearheaded", "Transformed", "Drove", "Accelerated", "Established",
  "Pioneered", "Scaled", "Mentored", "Collaborated", "Automated",
];

const METRICS = [
  "reducing costs by 35%", "increasing revenue by $1.2M", "improving efficiency by 40%",
  "achieving 99.9% uptime", "serving 500K+ users", "cutting time-to-market by 60%",
  "boosting team productivity by 25%", "saving 200+ engineering hours per quarter",
  "generating $2.3M in new revenue", "reducing churn by 18%",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getMockBulletSuggestions(
  bullet: string,
  jobTitle: string
): Promise<AISuggestions> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1200));

  const verb = getRandomItem(POWER_VERBS);
  const metric1 = getRandomItem(METRICS);
  const metric2 = getRandomItem(METRICS.filter((m) => m !== metric1));
  const verb2 = getRandomItem(POWER_VERBS.filter((v) => v !== verb));
  const verb3 = getRandomItem(POWER_VERBS.filter((v) => v !== verb && v !== verb2));

  const base = bullet.trim() || `Worked on ${jobTitle.toLowerCase() || "key projects"}`;
  const shortBase = base.substring(0, 40);

  return {
    bullets: [
      {
        text: `${verb} ${shortBase.toLowerCase().replace(/^(led|managed|developed|built|created|worked on)\s*/i, "")} ${metric1}`,
        improvement: "metrics",
      },
      {
        text: `${verb2} cross-functional initiatives related to ${shortBase.toLowerCase().replace(/^(led|managed|developed|built|created|worked on)\s*/i, "")}, ${metric2}`,
        improvement: "power-verb",
      },
      {
        text: `${verb3} end-to-end solution for ${shortBase.toLowerCase().replace(/^(led|managed|developed|built|created|worked on)\s*/i, "")}, delivering measurable impact across the organization`,
        improvement: "ats",
      },
    ],
  };
}

export async function getMockSummary(
  jobTitle: string,
  skills: string[],
  experience: { title: string; company: string }[]
): Promise<AISuggestions> {
  await new Promise((r) => setTimeout(r, 1500));

  const title = jobTitle || "Professional";
  const topSkills = skills.slice(0, 3).join(", ") || "industry-leading tools";
  const latestExp = experience[0];
  const expStr = latestExp
    ? `at ${latestExp.company}`
    : "across multiple high-impact projects";

  return {
    summaries: [
      `Results-driven ${title} with proven expertise in ${topSkills}. Demonstrated track record of delivering high-impact solutions ${expStr}, consistently exceeding performance targets by 20%+. Passionate about leveraging cutting-edge technology to solve complex business challenges and drive measurable growth.`,
      `Dynamic ${title} combining deep technical expertise with strategic business acumen. Skilled in ${topSkills}, with experience leading cross-functional teams and delivering enterprise-scale projects on time and under budget. Known for translating complex requirements into elegant, scalable solutions that create lasting value.`,
    ],
  };
}

export async function getMockATSAnalysis(resumeText: string): Promise<{
  score: number;
  keywords: { found: string[]; missing: string[] };
  formatting: { passed: boolean; issues: string[] };
  length: { pages: number; status: "perfect" | "too-long" | "too-short" };
  readability: { grade: number; status: "excellent" | "good" | "needs-work" };
  quickFixes: string[];
}> {
  await new Promise((r) => setTimeout(r, 2000));

  const wordCount = resumeText.split(/\s+/).length;
  const score = Math.min(95, Math.max(45, 60 + Math.floor(Math.random() * 35)));

  return {
    score,
    keywords: {
      found: ["Python", "JavaScript", "React", "Team Leadership", "Project Management"],
      missing: ["Agile", "AWS", "CI/CD", "Docker", "SQL"],
    },
    formatting: {
      passed: true,
      issues: score < 70 ? ["Use standard section headers", "Avoid tables in resume"] : [],
    },
    length: {
      pages: wordCount > 600 ? 2 : 1,
      status: wordCount > 800 ? "too-long" : wordCount < 200 ? "too-short" : "perfect",
    },
    readability: {
      grade: 8,
      status: "excellent",
    },
    quickFixes: [
      "Add keywords: Agile, AWS, CI/CD",
      "Start each bullet with a strong action verb",
      "Include at least one metric per job entry",
      "Add a dedicated Skills section with 8-12 skills",
    ].slice(0, score < 80 ? 4 : 2),
  };
}

export async function getMockCoverLetter(data: {
  name: string;
  jobTitle: string;
  company: string;
  skills: string[];
  tone: "professional" | "creative" | "enthusiastic";
}): Promise<string> {
  await new Promise((r) => setTimeout(r, 1800));

  const { name, jobTitle, company, skills, tone } = data;
  const topSkills = skills.slice(0, 2).join(" and ") || "relevant expertise";

  const openers: Record<string, string> = {
    professional: `I am writing to express my strong interest in the ${jobTitle} position at ${company}.`,
    creative: `When I discovered the ${jobTitle} opening at ${company}, I knew immediately this was the opportunity I had been working toward.`,
    enthusiastic: `I am thrilled to apply for the ${jobTitle} role at ${company} — a company whose mission deeply resonates with my professional values!`,
  };

  return `${openers[tone]} With my proven expertise in ${topSkills}, I am confident I would make an immediate and lasting impact on your team.

Throughout my career, I have consistently delivered results that exceed expectations. My experience has equipped me with the technical depth and collaborative mindset needed to thrive in fast-paced, innovative environments like ${company}.

I would welcome the opportunity to discuss how my background aligns with your team's goals. Thank you for considering my application.

Sincerely,
${name || "Your Name"}`;
}
