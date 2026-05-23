import { createEmbeddings } from "@/lib/together-embeddings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: string };
    const query = body.query?.trim() ?? "";

    if (!query) {
      return Response.json({ error: "A question is required." }, { status: 400 });
    }
    if (query.length > 1000) {
      return Response.json({ error: "Question is too long for PDF search." }, { status: 400 });
    }

    const [embedding] = await createEmbeddings([query]);
    return Response.json({ embedding });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not search PDF.";
    return Response.json({ error: message }, { status: 500 });
  }
}
