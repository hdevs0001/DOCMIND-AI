import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import { getDb } from "@/lib/db.server";
import { createChunks } from "./chunker";
import { embedChunks } from "./embeddings.server";

export type IngestionResult = {
  documentId: string;
  fileName: string;
  pages: number;
  chunks: number;
};

export async function ingestDocument(
  documentId: string,
): Promise<IngestionResult> {
  const db = getDb();

  console.log("\n================================");
  console.log("DOCUMENT INGESTION");
  console.log("================================");

  // --------------------------------------------------
  // 1. Read the PDF from PostgreSQL using Prisma
  // --------------------------------------------------

  const document = await db.document.findUnique({
    where: {
      id: documentId,
    },
    select: {
      id: true,
      name: true,
      mimeType: true,
      data: true,
    },
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  console.log(`Document: ${document.name}`);

  // --------------------------------------------------
  // 2. Convert PostgreSQL Bytes → Blob
  // --------------------------------------------------

  const pdfBlob = new Blob(
    [new Uint8Array(document.data)],
    {
      type: document.mimeType || "application/pdf",
    },
  );

  // --------------------------------------------------
  // 3. Extract PDF pages using LangChain
  // --------------------------------------------------

  console.log("Extracting PDF...");

  console.time("pdf-extraction");

  const loader = new PDFLoader(pdfBlob);

  const pages = await loader.load();

  console.timeEnd("pdf-extraction");

  if (pages.length === 0) {
    throw new Error(
      "No pages could be extracted from the PDF.",
    );
  }

  console.log(`Pages: ${pages.length}`);

  // --------------------------------------------------
  // 4. Create generic structure-aware chunks
  // --------------------------------------------------

  console.log("Creating chunks...");

  console.time("chunking");

  const chunks = await createChunks(pages);

  console.timeEnd("chunking");

  if (chunks.length === 0) {
    throw new Error(
      "No chunks were created from the PDF.",
    );
  }

  console.log(`Chunks: ${chunks.length}`);

  // --------------------------------------------------
  // Debug chunk size
  // --------------------------------------------------

  const totalCharacters = chunks.reduce(
    (total, chunk) => total + chunk.content.length,
    0,
  );

  const largestChunk = Math.max(
    ...chunks.map((chunk) => chunk.content.length),
  );

  const averageChunkSize =
    totalCharacters / chunks.length;

  console.log(
    `Total characters: ${totalCharacters}`,
  );

  console.log(
    `Largest chunk: ${largestChunk} characters`,
  );

  console.log(
    `Average chunk size: ${Math.round(averageChunkSize)} characters`,
  );

  // --------------------------------------------------
  // 5. Generate Ollama embeddings
  // --------------------------------------------------

  console.log("Generating embeddings...");

  console.time("embedding");

  const vectors = await embedChunks(
    chunks.map((chunk) => chunk.content),
  );

  console.timeEnd("embedding");

  if (vectors.length !== chunks.length) {
    throw new Error(
      `Embedding count mismatch. Chunks: ${chunks.length}, vectors: ${vectors.length}`,
    );
  }

  console.log(`Embeddings: ${vectors.length}`);

  // --------------------------------------------------
  // 6. Replace existing chunks
  //
  // This makes re-ingestion safe.
  // --------------------------------------------------

  console.log("Saving chunks to PostgreSQL...");

  console.time("database-insert");

  await db.$transaction(async (tx) => {
    await tx.documentChunk.deleteMany({
      where: {
        documentId,
      },
    });

    // ------------------------------------------------
    // 7. Store chunks + metadata + vectors
    // ------------------------------------------------

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = vectors[i];

      if (!chunk || !vector) {
        throw new Error(
          `Missing chunk or vector at index ${i}.`,
        );
      }

      const id = crypto.randomUUID();

      const vectorLiteral = `[${vector.join(",")}]`;

      const metadataJson = JSON.stringify(
        chunk.metadata,
      );

      await tx.$executeRaw`
        INSERT INTO "DocumentChunk"
        (
          "id",
          "documentId",
          "content",
          "metadata",
          "embedding",
          "createdAt"
        )
        VALUES
        (
          ${id},
          ${documentId},
          ${chunk.content},
          ${metadataJson}::jsonb,
          ${vectorLiteral}::vector,
          NOW()
        )
      `;
    }
  });

  console.timeEnd("database-insert");

  // --------------------------------------------------
  // 8. Done
  // --------------------------------------------------

  console.log(`Stored chunks: ${chunks.length}`);

  console.log("================================");
  console.log("INGESTION COMPLETE");
  console.log("================================\n");

  return {
    documentId,
    fileName: document.name,
    pages: pages.length,
    chunks: chunks.length,
  };
}