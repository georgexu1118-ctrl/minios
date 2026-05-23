export interface PdfChunk {
  page: number;
  content: string;
  embedding: number[];
}

export interface IndexedPdf {
  name: string;
  totalPages: number;
  indexedPages: number;
  truncated: boolean;
  chunks: PdfChunk[];
}

function cosineSimilarity(left: number[], right: number[]): number {
  let product = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    product += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (!leftNorm || !rightNorm) return 0;
  return product / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function buildPdfContext(document: IndexedPdf, queryEmbedding: number[]): string {
  const excerpts = document.chunks
    .map(chunk => ({ chunk, score: cosineSimilarity(chunk.embedding, queryEmbedding) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map(({ chunk }) => `[${document.name}, p. ${chunk.page}]\n${chunk.content}`)
    .join("\n\n");

  return [
    `The user attached the PDF "${document.name}".`,
    `Use the retrieved excerpts below to answer document-related questions.`,
    `Cite each supported claim inline as [${document.name}, p. #].`,
    "If the excerpts do not contain the answer, clearly say it was not found in the uploaded PDF.",
    "",
    excerpts,
  ].join("\n");
}
