import { extractText } from "unpdf";
import { createEmbeddings } from "@/lib/together-embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_CHUNKS = 140;
const CHUNK_LENGTH = 1300;
const CHUNK_OVERLAP = 180;

interface ChunkDraft {
  page: number;
  content: string;
}

function chunkPage(content: string, page: number): ChunkDraft[] {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: ChunkDraft[] = [];
  for (let start = 0; start < normalized.length; start += CHUNK_LENGTH - CHUNK_OVERLAP) {
    const end = Math.min(normalized.length, start + CHUNK_LENGTH);
    chunks.push({ page, content: normalized.slice(start, end) });
    if (end === normalized.length) break;
  }
  return chunks;
}

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
    const pageChunks = text.flatMap((pageText, index) => chunkPage(pageText, index + 1));

    if (!pageChunks.length) {
      return Response.json({
        error: "No selectable text was found. Scanned/image-only PDFs are not supported yet.",
      }, { status: 422 });
    }

    const chunks = pageChunks.slice(0, MAX_CHUNKS);
    const embeddings = await createEmbeddings(chunks.map(chunk => chunk.content));
    const indexedPages = new Set(chunks.map(chunk => chunk.page)).size;

    return Response.json({
      name: file.name,
      totalPages,
      indexedPages,
      truncated: pageChunks.length > MAX_CHUNKS,
      chunks: chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process PDF.";
    return Response.json({ error: message }, { status: 500 });
  }
}
