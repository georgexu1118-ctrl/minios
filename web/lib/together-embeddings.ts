import "server-only";
import OpenAI from "openai";

export const PDF_EMBEDDING_MODEL = "intfloat/multilingual-e5-large-instruct";

export async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error("TOGETHER_API_KEY is required for PDF search.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.together.ai/v1",
  });
  const embeddings: number[][] = [];

  for (let start = 0; start < inputs.length; start += 32) {
    const batch = inputs.slice(start, start + 32);
    const response = await client.embeddings.create({
      model: PDF_EMBEDDING_MODEL,
      input: batch,
    });
    embeddings.push(
      ...response.data
        .sort((left, right) => left.index - right.index)
        .map(result => result.embedding)
    );
  }

  return embeddings;
}
