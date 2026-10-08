import { getDb } from "@/lib/db.server";
import type { ChunkMetadata } from "./chunker";
import { embedQuery } from "./embeddings.server";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
};

export async function retrieveRelevantChunks(
  documentId: string,
  question: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const db = getDb();

  const query = question.trim();

  if (!query) {
    throw new Error("Question cannot be empty.");
  }

  // Convert the question into the same embedding space
  // used when the document chunks were indexed.
  const queryVector = await embedQuery(query);

  const vectorLiteral = `[${queryVector.join(",")}]`;

  const chunks = await db.$queryRaw<RetrievedChunk[]>`
    SELECT
      "id",
      "documentId",
      "content",
      "metadata",
      (1 - ("embedding" <=> ${vectorLiteral}::vector))::float8 AS "similarity"
    FROM "DocumentChunk"
    WHERE "documentId" = ${documentId}
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${vectorLiteral}::vector
    LIMIT ${topK};
  `;

  return chunks;
}