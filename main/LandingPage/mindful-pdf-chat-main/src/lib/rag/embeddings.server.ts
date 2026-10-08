import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "qwen3-embedding:4b",
  baseUrl: "http://localhost:11434",
});

export async function embedChunks(texts: string[]) {
  if (texts.length === 0) {
    return [];
  }

  const vectors = await embeddings.embedDocuments(texts);

  if (vectors.length !== texts.length) {
    throw new Error(
      `Embedding count mismatch. Expected ${texts.length}, got ${vectors.length}.`,
    );
  }

  return vectors;
}

export async function embedQuery(query: string) {
  return embeddings.embedQuery(query);
}