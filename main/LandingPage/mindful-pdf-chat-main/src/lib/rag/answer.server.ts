import { ChatOllama } from "@langchain/ollama";

import { retrieveRelevantChunks } from "./retrieval.server";

const llm = new ChatOllama({
  model: "gemma3:4b",
  baseUrl: "http://localhost:11434",
  temperature: 0,
});

export type AnswerResult = {
  answer: string;
  citations: number[];
  chunksUsed: number;
};

export async function answerQuestion(
  documentId: string,
  question: string,
): Promise<AnswerResult> {
  const chunks = await retrieveRelevantChunks(
    documentId,
    question,
    5,
  );

  if (chunks.length === 0) {
    return {
      answer: "I couldn't find relevant information in this document.",
      citations: [],
      chunksUsed: 0,
    };
  }

  const context = chunks
    .map(
      (chunk, index) => `
--- Chunk ${index + 1} ---
Pages: ${chunk.metadata.pages.join(", ")}
Heading: ${chunk.metadata.heading ?? "N/A"}
Similarity: ${chunk.similarity.toFixed(4)}

${chunk.content}
`,
    )
    .join("\n");

  const prompt = `
You are DocMind AI.

Answer the user's question using ONLY the document context below.

Rules:
- Do not use outside knowledge.
- Do not invent facts.
- If the context does not contain the answer, say that you could not find it in the document.
- Keep the answer clear and concise.
- Use the document's wording and facts faithfully.

DOCUMENT CONTEXT:
${context}

USER QUESTION:
${question}
`;

  const response = await llm.invoke(prompt);

  const answer =
    typeof response.content === "string"
      ? response.content
      : response.content
          .map((item) =>
            typeof item === "string" ? item : item.text,
          )
          .join("");

  const citations = [
    ...new Set(
      chunks.flatMap((chunk) => chunk.metadata.pages),
    ),
  ].sort((a, b) => a - b);

  return {
    answer,
    citations,
    chunksUsed: chunks.length,
  };
}