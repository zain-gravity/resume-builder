// Resume export utilities — PDF (print), DOCX, TXT, HTML
import type { ParsedResume } from "./parsed-resume.types";

/** Convert parsed resume to plain ATS-safe text */
export function toPlainText(data: ParsedResume): string {
  const lines: string[] = [];
  const { personal, summary, experience, education, skills, certifications } = data;

  lines.push(`${personal.name || "Name"}`);
  const contact = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio].filter(Boolean);
  lines.push(contact.join(" | "));
  lines.push("");

  if (summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("─".repeat(40));
    lines.push(summary);
    lines.push("");
  }

  if (experience.length > 0) {
    lines.push("WORK EXPERIENCE");
    lines.push("─".repeat(40));
    for (const exp of experience) {
      const dates = exp.current ? `${exp.startDate} – Present` : `${exp.startDate} – ${exp.endDate}`;
      lines.push(`${exp.title || "Position"} | ${exp.company || "Company"}`);
      lines.push(`${dates}${exp.location ? ` | ${exp.location}` : ""}`);
      for (const b of exp.bullets) lines.push(`• ${b}`);
      lines.push("");
    }
  }

  if (education.length > 0) {
    lines.push("EDUCATION");
    lines.push("─".repeat(40));
    for (const edu of education) {
      const deg = [edu.degree, edu.field].filter(Boolean).join(" in ");
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      lines.push(`${deg || "Degree"} | ${edu.school || "Institution"}`);
      if (dates) lines.push(dates);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      lines.push("");
    }
  }

  if (skills.length > 0) {
    lines.push("SKILLS");
    lines.push("─".repeat(40));
    lines.push(skills.join(" • "));
    lines.push("");
  }

  if (certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    lines.push("─".repeat(40));
    for (const c of certifications) {
      lines.push(`${c.name}${c.issuer ? ` | ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}`);
    }
  }

  return lines.join("\n");
}

/** Convert parsed resume to styled HTML */
export function toHTML(data: ParsedResume, dark = false): string {
  const { personal, summary, experience, education, skills, certifications } = data;
  const bg = dark ? "#0F172A" : "#FFFFFF";
  const text = dark ? "#F8FAFC" : "#1A1A1A";
  const primary = dark ? "#3B82F6" : "#2E86AB";
  const subtle = dark ? "#94A3B8" : "#6B7280";

  const name = personal.name || "Your Name";
  const contact = [personal.email, personal.phone, personal.location, personal.linkedin].filter(Boolean).join(" · ");

  const expHTML = experience.map((exp) => {
    const dates = exp.current ? `${exp.startDate} – Present` : `${exp.startDate} – ${exp.endDate}`;
    return `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div>
            <span style="font-weight:700;font-size:14px">${exp.title || ""}</span>
            <span style="color:${primary};font-weight:600;font-size:13px;margin-left:4px">· ${exp.company || ""}</span>
          </div>
          <span style="font-size:12px;color:${subtle}">${dates}${exp.location ? ` · ${exp.location}` : ""}</span>
        </div>
        ${exp.description
          ? `<p style="font-size:12.5px;line-height:1.6;color:${dark ? "#CBD5E1" : "#374151"};margin-top:6px;white-space:pre-wrap">${exp.description.replace(/\n/g, "<br>")}</p>`
          : exp.bullets.length > 0
            ? `<ul style="margin:6px 0 0 16px;padding:0">${exp.bullets.map((b) => `<li style="font-size:12.5px;margin-bottom:3px;line-height:1.5;color:${dark ? "#CBD5E1" : "#374151"}">${b}</li>`).join("")}</ul>`
            : ""
        }
      </div>`;
  }).join("");

  const eduHTML = education.map((edu) => {
    const deg = [edu.degree, edu.field].filter(Boolean).join(" in ");
    const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
    return `<div style="margin-bottom:8px"><span style="font-weight:700;font-size:13px">${deg}</span><span style="color:${primary};margin-left:4px">· ${edu.school}</span><span style="float:right;font-size:12px;color:${subtle}">${dates}${edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</span></div>`;
  }).join("");

  const skillsHTML = skills.map((s) => `<span style="display:inline-block;background:${dark ? "rgba(59,130,246,0.15)" : `${primary}18`};color:${primary};padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;margin:2px">${s}</span>`).join("");

  const section = (title: string, content: string) =>
    `<div style="margin-bottom:18px"><div style="border-bottom:2px solid ${primary};margin-bottom:8px;padding-bottom:3px"><span style="font-size:13px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:1px;font-family:Poppins,sans-serif">${title}</span></div>${content}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Open Sans',sans-serif;background:${bg};color:${text};padding:40px;max-width:820px;margin:0 auto}
  @media print{body{padding:20px}@page{margin:0.5in;size:letter}}
</style>
</head>
<body>
  <div style="text-align:center;border-bottom:3px solid ${primary};padding-bottom:16px;margin-bottom:20px">
    <h1 style="font-family:Poppins,sans-serif;font-size:28px;font-weight:900;color:${text}">${name}</h1>
    ${personal.jobTitle ? `<div style="font-size:15px;color:${primary};font-weight:600;margin:4px 0">${personal.jobTitle}</div>` : ""}
    <div style="font-size:12px;color:${subtle};margin-top:4px">${contact}</div>
  </div>
  ${summary ? section("Professional Summary", `<div style="font-size:12.5px;line-height:1.6;color:${dark ? "#CBD5E1" : "#374151"};white-space:pre-wrap">${summary.replace(/\n/g, "<br>")}</div>`) : ""}
  ${experience.length > 0 ? section("Work Experience", expHTML) : ""}
  ${education.length > 0 ? section("Education", eduHTML) : ""}
  ${skills.length > 0 ? section("Skills", `<div>${skillsHTML}</div>`) : ""}
  ${certifications.length > 0 ? section("Certifications", certifications.map((c) => `<div style="font-size:12.5px;margin-bottom:4px"><strong>${c.name}</strong>${c.issuer ? ` · ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}</div>`).join("")) : ""}
</body>
</html>`;
}

/** Convert parsed resume to DOCX-compatible XML (simplified Word format) */
export async function toDOCX(data: ParsedResume): Promise<Buffer> {
  const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, BorderStyle, TableRow, TableCell, Table, WidthType } = await import("docx");

  const { personal, summary, experience, education, skills, certifications } = data;
  const contact = [personal.email, personal.phone, personal.location, personal.linkedin].filter(Boolean).join("  |  ");

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      children: [new TextRun({ text: personal.name || "Name", bold: true, size: 52, color: "2E86AB" })],
      alignment: AlignmentType.CENTER,
    }),
  ];

  if (personal.jobTitle) {
    children.push(new Paragraph({
      children: [new TextRun({ text: personal.jobTitle, size: 28, color: "A23B72" })],
      alignment: AlignmentType.CENTER,
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: contact, size: 20, color: "6B7280" })],
    alignment: AlignmentType.CENTER,
  }));

  children.push(new Paragraph({ text: "" }));

  const sectionHeading = (title: string) => new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 24, color: "2E86AB" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E86AB" } },
    spacing: { before: 200, after: 100 },
  });

  if (summary) {
    children.push(sectionHeading("PROFESSIONAL SUMMARY"));
    const summaryParagraphs = summary.split(/\n/);
    for (let i = 0; i < summaryParagraphs.length; i++) {
      const line = summaryParagraphs[i];
      children.push(new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: i < summaryParagraphs.length - 1 ? 80 : 100 },
      }));
    }
  }

  if (experience.length > 0) {
    children.push(sectionHeading("WORK EXPERIENCE"));
    for (const exp of experience) {
      const dates = exp.current ? `${exp.startDate} – Present` : `${exp.startDate} – ${exp.endDate}`;
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.title || "", bold: true, size: 24 }),
          new TextRun({ text: ` · ${exp.company || ""}`, size: 24, color: "2E86AB" }),
        ],
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: dates + (exp.location ? ` · ${exp.location}` : ""), size: 20, color: "6B7280", italics: true })],
      }));
      if (exp.description) {
        // Free-text description: split on newlines for proper DOCX paragraphs
        const descParagraphs = exp.description.split(/\n/);
        for (let i = 0; i < descParagraphs.length; i++) {
          children.push(new Paragraph({
            children: [new TextRun({ text: descParagraphs[i], size: 22 })],
            spacing: { after: i < descParagraphs.length - 1 ? 60 : 100 },
          }));
        }
      } else {
        for (const b of exp.bullets) {
          children.push(new Paragraph({
            children: [new TextRun({ text: b, size: 22 })],
            bullet: { level: 0 },
          }));
        }
      }
      children.push(new Paragraph({ text: "" }));
    }
  }

  if (education.length > 0) {
    children.push(sectionHeading("EDUCATION"));
    for (const edu of education) {
      const deg = [edu.degree, edu.field].filter(Boolean).join(" in ");
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      children.push(new Paragraph({
        children: [
          new TextRun({ text: deg, bold: true, size: 24 }),
          new TextRun({ text: ` · ${edu.school}`, size: 24, color: "2E86AB" }),
        ],
      }));
      if (dates) children.push(new Paragraph({ children: [new TextRun({ text: dates + (edu.gpa ? ` · GPA: ${edu.gpa}` : ""), size: 20, color: "6B7280", italics: true })] }));
      children.push(new Paragraph({ text: "" }));
    }
  }

  if (skills.length > 0) {
    children.push(sectionHeading("SKILLS"));
    children.push(new Paragraph({ children: [new TextRun({ text: skills.join(" • "), size: 22 })] }));
    children.push(new Paragraph({ text: "" }));
  }

  if (certifications.length > 0) {
    children.push(sectionHeading("CERTIFICATIONS"));
    for (const c of certifications) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${c.name}${c.issuer ? ` · ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}`, size: 22 })],
      }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}
