export interface ATSResult {
  score: number;
  keywords: { found: string[]; missing: string[]; density: number };
  formatting: { passed: boolean; issues: string[] };
  length: { pages: number; wordCount: number; status: "perfect" | "too-long" | "too-short" };
  readability: { grade: number; status: "excellent" | "good" | "needs-work" };
  quickFixes: string[];
}

const COMMON_KEYWORDS = ["managed","led","developed","implemented","designed","built","achieved","increased","reduced","improved","delivered","launched","collaborated","analyzed","optimized","agile","scrum","project management","team leadership","communication","problem solving","data analysis"];

export function analyzeResume(text: string, jobDescription?: string): ATSResult {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  let score = 0;

  const foundKeywords = COMMON_KEYWORDS.filter((kw) => lowerText.includes(kw));
  const missingKeywords = COMMON_KEYWORDS.filter((kw) => !lowerText.includes(kw)).slice(0, 5);

  let jdFound: string[] = [];
  let jdMissing: string[] = [];
  if (jobDescription) {
    const jdWords = [...new Set(jobDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 4))].slice(0, 20);
    jdFound = jdWords.filter((kw) => lowerText.includes(kw));
    jdMissing = jdWords.filter((kw) => !lowerText.includes(kw)).slice(0, 5);
    score += (jdFound.length / Math.max(jdWords.length, 1)) * 30;
  } else {
    score += (foundKeywords.length / COMMON_KEYWORDS.length) * 30;
  }

  const estimatedPages = wordCount / 350;
  let lengthStatus: "perfect" | "too-long" | "too-short" = "perfect";
  if (wordCount >= 200 && wordCount <= 750) { score += 20; lengthStatus = "perfect"; }
  else if (wordCount < 200) { score += 10; lengthStatus = "too-short"; }
  else { score += 15; lengthStatus = "too-long"; }

  const formattingIssues: string[] = [];
  if (!/\d+%|\$\d+|\d+[kKmM]|\d+ (people|users|clients)/i.test(text)) formattingIssues.push("Add quantifiable metrics");
  if (!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) formattingIssues.push("Add email address");
  score += Math.max(0, 20 - formattingIssues.length * 5);

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSPW = words.reduce((a, w) => a + countSyllables(w), 0) / Math.max(wordCount, 1);
  const fk = 206.835 - 1.015 * (wordCount / Math.max(sentences.length, 1)) - 84.6 * avgSPW;
  const grade = Math.max(1, Math.min(16, Math.round(11.8 * avgSPW + 0.39 * (wordCount / Math.max(sentences.length, 1)) - 15.59)));
  let readStatus: "excellent" | "good" | "needs-work" = "good";
  if (fk >= 60) { readStatus = "excellent"; score += 15; }
  else if (fk >= 30) { readStatus = "good"; score += 10; }
  else { readStatus = "needs-work"; score += 5; }

  const quickFixes: string[] = [];
  if (formattingIssues.length > 0) quickFixes.push(...formattingIssues);
  const km = jobDescription ? jdMissing : missingKeywords;
  if (km.length > 0) quickFixes.push(`Add keywords: "${km.slice(0, 3).join('", "')}"`);
  if (lengthStatus === "too-short") quickFixes.push("Expand experience descriptions (aim for 300-700 words)");
  if (lengthStatus === "too-long") quickFixes.push("Trim to 1-2 pages maximum");

  return {
    score: Math.min(98, Math.round(score)),
    keywords: { found: jobDescription ? jdFound : foundKeywords, missing: jobDescription ? jdMissing : missingKeywords, density: foundKeywords.length },
    formatting: { passed: formattingIssues.length === 0, issues: formattingIssues },
    length: { pages: Math.max(1, Math.round(estimatedPages * 10) / 10), wordCount, status: lengthStatus },
    readability: { grade, status: readStatus },
    quickFixes,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  if (word.length <= 3) return 1;
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
