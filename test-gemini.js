/**
 * Test Gemini API key directly
 * node test-gemini.js YOUR_API_KEY
 */
const key = process.argv[2] || process.env.GOOGLE_AI_API_KEY;
if (!key) { console.log("Usage: node test-gemini.js YOUR_KEY"); process.exit(1); }

async function test() {
  // 1. List available models
  console.log("=== Listing available Gemini models ===\n");
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const d = await r.json();
    if (d.models) {
      const flashModels = d.models.filter(m => m.name.includes("flash") || m.name.includes("pro"));
      console.log("Available flash/pro models:");
      flashModels.forEach(m => console.log(" -", m.name, "|", m.displayName, "|", m.supportedGenerationMethods?.join(", ")));
    } else {
      console.log("Error:", JSON.stringify(d, null, 2));
    }
  } catch(e) { console.error("List models failed:", e.message); }

  // 2. Test with gemini-2.0-flash
  console.log("\n=== Testing gemini-2.0-flash ===\n");
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in one word." }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
        })
      }
    );
    const d = await r.json();
    console.log("Status:", r.status);
    if (r.ok) {
      console.log("✅ Response:", d.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("❌ Error:", d.error?.message);
    }
  } catch(e) { console.error("Test failed:", e.message); }

  // 3. Test with gemini-2.0-flash-lite (free, no billing needed)
  console.log("\n=== Testing gemini-2.0-flash-lite ===\n");
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in one word." }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
        })
      }
    );
    const d = await r.json();
    console.log("Status:", r.status);
    if (r.ok) {
      console.log("✅ Response:", d.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("❌ Error:", d.error?.message);
    }
  } catch(e) { console.error("Test failed:", e.message); }
}

test();
