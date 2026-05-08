/**
 * Test Groq parsing directly
 * node test-groq.js YOUR_GROQ_KEY
 */
const key = process.argv[2];
if (!key) { console.log("Usage: node test-groq.js gsk_YOUR_KEY"); process.exit(1); }

const RESUME = `John Smith
Senior Software Engineer | john.smith@gmail.com | +1 555 123 4567
San Francisco, CA | linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Experienced full-stack engineer with 7+ years building scalable web applications for millions of users.

EXPERIENCE

Google — Senior Software Engineer
January 2021 – Present | Mountain View, CA
• Built React dashboards serving 2M+ daily active users
• Led team of 8 engineers, reducing deployment time by 70%
• Designed REST APIs handling 50K requests/minute

Microsoft — Software Engineer
March 2018 – December 2020 | Seattle, WA
• Developed TypeScript libraries used by 500+ internal teams
• Improved test coverage from 40% to 90%
• Mentored 3 junior developers

EDUCATION
University of California, Berkeley
Bachelor of Science in Computer Science | 2014–2018 | GPA: 3.8

SKILLS
JavaScript, TypeScript, Python, React, Next.js, Node.js, AWS, Docker, PostgreSQL, Redis, Git, CI/CD

CERTIFICATIONS
AWS Solutions Architect Associate | Amazon Web Services | 2022`;

async function testGroq() {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama-3.1-8b-instant"];

  for (const model of models) {
    console.log(`\n=== Testing ${model} ===`);
    const start = Date.now();
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "Expert ATS resume parser. Return ONLY valid JSON, no markdown." },
            { role: "user", content: `Extract all resume fields into this JSON schema and return ONLY JSON:\n{"personal":{"name":"","email":"","phone":"","location":"","linkedin":"","portfolio":"","jobTitle":""},"summary":"","experience":[{"company":"","title":"","location":"","startDate":"YYYY-MM","endDate":"","current":false,"bullets":[]}],"education":[{"school":"","degree":"","field":"","location":"","startDate":"","endDate":"","gpa":""}],"skills":[],"certifications":[{"name":"","issuer":"","date":"","url":""}]}\n\nRESUME:\n${RESUME}` }
          ],
          temperature: 0.05,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      const elapsed = Date.now() - start;
      const data = await res.json();

      if (!res.ok) {
        console.log(`❌ HTTP ${res.status}:`, data.error?.message || JSON.stringify(data));
        continue;
      }

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) { console.log("❌ Empty response"); continue; }

      const parsed = JSON.parse(raw);
      console.log(`✅ ${elapsed}ms`);
      console.log("  Name:", parsed.personal?.name);
      console.log("  Email:", parsed.personal?.email);
      console.log("  Phone:", parsed.personal?.phone);
      console.log("  Title:", parsed.personal?.jobTitle);
      console.log("  Experience:", parsed.experience?.length, "jobs");
      parsed.experience?.forEach((e, i) => console.log(`    [${i+1}] ${e.title} @ ${e.company} ${e.startDate}-${e.endDate||"Present"}`));
      console.log("  Education:", parsed.education?.length, "entries");
      console.log("  Skills:", parsed.skills?.length, "-", parsed.skills?.slice(0,5).join(", "));
      break; // Stop at first working model
    } catch(e) {
      console.log(`❌ Error:`, e.message);
    }
  }
}

testGroq();
