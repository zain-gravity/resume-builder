import { NextResponse } from "next/server";
import { parseResumeWithAI } from "@/lib/ai-resume-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_RESUME = `John Smith
Senior Software Engineer
john.smith@gmail.com | +1 555 123 4567 | San Francisco, CA
linkedin.com/in/johnsmith | github.com/johnsmith

SUMMARY
Experienced software engineer with 7 years building scalable web applications.

EXPERIENCE
Google — Senior Software Engineer
January 2021 - Present
• Built React dashboards serving 2M+ daily active users
• Led team of 8 engineers across 3 time zones
• Reduced API response time by 60% through Redis caching

Microsoft — Software Engineer  
March 2018 - December 2020
• Developed core TypeScript libraries used by 500+ internal teams
• Improved test coverage from 40% to 90%

EDUCATION
UC Berkeley — B.S. Computer Science
2014 - 2018 | GPA: 3.8

SKILLS
JavaScript, TypeScript, Python, React, Node.js, AWS, Docker, PostgreSQL, Redis, Git

CERTIFICATIONS
AWS Solutions Architect Associate — Amazon Web Services — 2022`;

export async function GET() {
  const start = Date.now();

  try {
    const result = await parseResumeWithAI(TEST_RESUME);
    const elapsed = Date.now() - start;

    return NextResponse.json({
      success: true,
      provider: result.provider,
      accuracy: result.parseAccuracy,
      elapsed_ms: elapsed,
      parsed: {
        name: result.data.personal.name,
        email: result.data.personal.email,
        phone: result.data.personal.phone,
        jobTitle: result.data.personal.jobTitle,
        location: result.data.personal.location,
        experience_count: result.data.experience.length,
        education_count: result.data.education.length,
        skills_count: result.data.skills.length,
        skills_sample: result.data.skills.slice(0, 5),
      },
      env: {
        hasGroq: !!process.env.GROQ_API_KEY,
        hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
        hasGemini: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY),
      },
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
      elapsed_ms: Date.now() - start,
      env: {
        hasGroq: !!process.env.GROQ_API_KEY,
        hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
        hasGemini: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY),
      },
    }, { status: 500 });
  }
}
