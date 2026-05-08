// Grammar & Tone Checker — detects weak phrases and suggests improvements

export interface GrammarIssue {
  original: string;
  suggestion: string;
  type: "weak-phrase" | "passive-voice" | "filler-word" | "jargon";
  description: string;
}

const WEAK_PHRASES: Array<{ pattern: RegExp; suggestion: string; desc: string }> = [
  { pattern: /\bresponsible for\b/gi, suggestion: "Led / Managed / Oversaw", desc: "Use an action verb instead" },
  { pattern: /\bhelped (with|to)\b/gi, suggestion: "Contributed to / Supported", desc: "Be more specific about your role" },
  { pattern: /\bworked on\b/gi, suggestion: "Developed / Built / Implemented", desc: "Use a stronger action verb" },
  { pattern: /\bwas involved in\b/gi, suggestion: "Contributed to / Participated in", desc: "Be direct about your contribution" },
  { pattern: /\bassisted (with|in)\b/gi, suggestion: "Collaborated on / Supported", desc: "Show more ownership" },
  { pattern: /\bvarious\b/gi, suggestion: "(Be specific)", desc: "Replace with specific details" },
  { pattern: /\bstuff\b/gi, suggestion: "(Be specific)", desc: "Too informal for a resume" },
  { pattern: /\bgood (at|with)\b/gi, suggestion: "Proficient in / Expert in", desc: "Use stronger skill language" },
  { pattern: /\bhard-working\b/gi, suggestion: "(Show don't tell — use accomplishments)", desc: "Overused buzzword" },
  { pattern: /\bteam player\b/gi, suggestion: "Collaborated with cross-functional teams", desc: "Overused buzzword — show evidence" },
  { pattern: /\bpassionate about\b/gi, suggestion: "(Show via accomplishments)", desc: "Vague — demonstrate passion through results" },
  { pattern: /\bfast learner\b/gi, suggestion: "(Show via accomplishments)", desc: "Vague — prove it with examples" },
  { pattern: /\bdetail.?oriented\b/gi, suggestion: "(Show via accomplishments)", desc: "Overused — prove it with specifics" },
  { pattern: /\bexperience in\b/gi, suggestion: "X years of experience in", desc: "Add specific number of years" },
  { pattern: /\bI (am|was|have|had)\b/gi, suggestion: "(Remove 'I' — start with action verb)", desc: "Resumes should not use first person" },
];

const PASSIVE_VOICE: Array<{ pattern: RegExp; suggestion: string }> = [
  { pattern: /\bwas (managed|led|built|developed|created|designed|implemented|deployed)\b/gi, suggestion: "Use active voice: Managed / Led / Built..." },
  { pattern: /\bwere (responsible|tasked|assigned)\b/gi, suggestion: "Use active voice and own the action" },
];

export function checkGrammar(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];

  WEAK_PHRASES.forEach(({ pattern, suggestion, desc }) => {
    const matches = text.match(pattern);
    if (matches) {
      const unique = [...new Set(matches.map(m => m.toLowerCase()))];
      unique.forEach(match => {
        issues.push({
          original: match,
          suggestion,
          type: "weak-phrase",
          description: desc,
        });
      });
    }
  });

  PASSIVE_VOICE.forEach(({ pattern, suggestion }) => {
    const matches = text.match(pattern);
    if (matches) {
      const unique = [...new Set(matches.map(m => m.toLowerCase()))];
      unique.forEach(match => {
        issues.push({
          original: match,
          suggestion,
          type: "passive-voice",
          description: "Passive voice is weaker — use active verbs",
        });
      });
    }
  });

  return issues;
}

export function getOverallTone(text: string): { tone: "strong" | "moderate" | "weak"; label: string; color: string } {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const issues = checkGrammar(text);
  const hasMetrics = /\d+%|\$\d+|\d+[kKmM]/i.test(text);
  const hasPowerVerbs = /\b(led|managed|built|developed|increased|reduced|launched|delivered|achieved|architected|designed|implemented|optimized|drove|scaled|pioneered|established)/i.test(text);

  const score = (hasMetrics ? 30 : 0) + (hasPowerVerbs ? 30 : 0) + Math.max(0, 30 - issues.length * 5) + (wordCount > 30 ? 10 : 0);

  if (score >= 70) return { tone: "strong", label: "Strong", color: "#22c55e" };
  if (score >= 40) return { tone: "moderate", label: "Moderate", color: "#f59e0b" };
  return { tone: "weak", label: "Needs Work", color: "#ef4444" };
}
