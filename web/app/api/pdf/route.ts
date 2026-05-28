import { extractText } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB hard cap
const MAX_CHARS = 150_000;               // ~37k tokens — covers 50+ page documents

// Fast path: pull text from the PDF, normalize whitespace, return it as one
// blob the chat route can stuff into a system message. Skips embeddings
// entirely — the model handles retrieval implicitly.
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Choose a PDF file to upload." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "Only PDF files are supported." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ error: "PDF is too large. Maximum size is 5 MB." }, { status: 413 });
    }

    const { totalPages, text } = await extractText(new Uint8Array(await file.arrayBuffer()));
    const pages = (Array.isArray(text) ? text : [text]);
    const joined = pages
      .map((pageText, i) => {
        const cleaned = (pageText ?? "").replace(/\s+/g, " ").trim();
        return cleaned ? `[Page ${i + 1}]\n${cleaned}` : "";
      })
      .filter(Boolean)
      .join("\n\n");

    if (!joined) {
      return Response.json({
        error: "No selectable text was found. Scanned / image-only PDFs are not supported.",
      }, { status: 422 });
    }

    const truncated = joined.length > MAX_CHARS;
    const out = truncated ? joined.slice(0, MAX_CHARS) : joined;

    return Response.json({
      name: file.name,
      totalPages,
      chars: joined.length,
      truncated,
      text: out,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process PDF.";
    return Response.json({ error: message }, { status: 500 });
  }
}
