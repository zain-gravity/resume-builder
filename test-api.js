/**
 * Direct API test - runs against localhost:3000
 * node test-api.js
 */
const fs = require("fs");
const path = require("path");
// Node 24 has global FormData, but Blob needs to come from buffer
const { Blob } = require("buffer");

// Use Node 18+ native fetch or polyfill
async function testParseAPI() {
  console.log("=== Testing /api/parse-resume ===\n");

  // Create a simple text resume
  const resumeText = `John Smith
Software Engineer
john.smith@gmail.com
+1 555 123 4567
San Francisco, CA
linkedin.com/in/johnsmith

SUMMARY
Results-driven Software Engineer with 5+ years of experience building scalable web applications.

EXPERIENCE
Google
Senior Software Engineer
January 2021 - Present
- Built React dashboards used by 2M+ users
- Led team of 8 engineers
- Reduced API latency by 60%

Microsoft
Software Engineer
March 2018 - December 2020
- Developed TypeScript libraries
- Improved test coverage from 40% to 90%

EDUCATION
University of California, Berkeley
Bachelor of Science, Computer Science
2014 - 2018
GPA: 3.8

SKILLS
JavaScript, TypeScript, Python, React, Node.js, AWS, Docker, PostgreSQL, Git

CERTIFICATIONS
AWS Solutions Architect
Amazon Web Services
2022`;

  const textPath = path.join(__dirname, "test-resume.txt");
  fs.writeFileSync(textPath, resumeText);

  try {
    const fileBuffer = fs.readFileSync(textPath);
    const blob = new Blob([fileBuffer], { type: "text/plain" });

    const form = new FormData();
    form.append("file", blob, "test-resume.txt");

    console.log("Posting to http://localhost:3000/api/parse-resume ...\n");
    const res = await fetch("http://localhost:3000/api/parse-resume", {
      method: "POST",
      body: form,
    });

    const json = await res.json();

    console.log("Status:", res.status);
    console.log("Provider:", json.meta?.provider || "unknown");
    console.log("Accuracy:", json.meta?.parseAccuracy || 0, "%");
    console.log("Text extracted:", json.meta?.textLength || 0, "chars");
    console.log("\n--- Parsed Data ---");
    console.log("Name:", json.data?.personal?.name || "❌ EMPTY");
    console.log("Email:", json.data?.personal?.email || "❌ EMPTY");
    console.log("Phone:", json.data?.personal?.phone || "❌ EMPTY");
    console.log("Job Title:", json.data?.personal?.jobTitle || "❌ EMPTY");
    console.log("Experience:", json.data?.experience?.length || 0, "jobs");
    if (json.data?.experience?.length > 0) {
      json.data.experience.forEach((e, i) => {
        console.log(`  [${i+1}] ${e.title} @ ${e.company} (${e.startDate} - ${e.endDate || "Present"})`);
      });
    }
    console.log("Education:", json.data?.education?.length || 0, "entries");
    console.log("Skills:", json.data?.skills?.length || 0, "skills");
    if (json.data?.skills?.length > 0) {
      console.log(" ", json.data.skills.join(", "));
    }
    console.log("Warnings:", json.data?.warnings);

    if (json.error) {
      console.log("\n❌ ERROR:", json.error);
    }

  } catch (e) {
    console.error("❌ Request failed:", e.message);
    console.error(e);
  }

  fs.unlinkSync(textPath);
}

testParseAPI();
