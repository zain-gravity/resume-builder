import { NextRequest, NextResponse } from "next/server";
import { toPlainText, toHTML, toDOCX } from "@/lib/resume-export";
import type { ParsedResume } from "@/lib/parsed-resume.types";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { format: string } }
) {
  try {
    const { format } = params;
    const body = await req.json() as { data: ParsedResume; name?: string };
    const { data, name = "resume" } = body;

    if (!data) return NextResponse.json({ error: "No resume data" }, { status: 400 });

    const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, "_");

    switch (format) {
      case "txt": {
        const text = toPlainText(data);
        return new NextResponse(text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${safeName}_ATS.txt"`,
          },
        });
      }

      case "html": {
        const html = toHTML(data, false);
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `attachment; filename="${safeName}.html"`,
          },
        });
      }

      case "html-dark": {
        const html = toHTML(data, true);
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `attachment; filename="${safeName}_dark.html"`,
          },
        });
      }

      case "docx": {
        const buffer = await toDOCX(data);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="${safeName}.docx"`,
          },
        });
      }

      case "pdf":
      case "pdf-dark": {
        // PDF: return HTML for browser print — client handles the print dialog
        const html = toHTML(data, format === "pdf-dark");
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Export-Format": format,
          },
        });
      }

      default:
        return NextResponse.json({ error: `Unknown format: ${format}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
