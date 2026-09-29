// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// const loader = new PDFLoader("./pdfs/document.pdf");

// const docs = await loader.load();

// console.log("Pages:", docs.length);

// if (docs.length === 0) {
//   console.log("No pages were extracted from the PDF.");
//   process.exit(1);
// }

// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 1000,
//   chunkOverlap: 200,
// });

// const chunks = await splitter.splitDocuments(docs);
// console.log("chunks:", chunks.length);

// console.log("\n========== CHUNKS ==========\n");

// chunks.slice(0, 3).forEach((chunk, index) => {
//   console.log(`\n===== CHUNK ${index + 1} =====\n`);

//   console.log(chunk.pageContent);

//   console.log("\n--- Metadata ---\n");

//   console.log(chunk.metadata);
// });

// import { OllamaEmbeddings } from "@langchain/ollama";
// const embeddings = new OllamaEmbeddings({
//   model: "qwen3-embedding:4b",
//   baseUrl: "http://localhost:11434",
// });

// const vector = await embeddings.embedQuery(
//   "what is the round-trip efficiency of lithium-ion batteries?",
// );

// console.log("Embedding dimensions:", vector.length);
// console.log("\n First 10 values:");
// console.log(vector.slice(0, 10));

// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { OllamaEmbeddings } from "@langchain/ollama";

// // ------------------------------------
// // 1. Load PDF
// // ------------------------------------

// const loader = new PDFLoader("./pdfs/document.pdf");

// const docs = await loader.load();

// console.log("Pages:", docs.length);

// // ------------------------------------
// // 2. Split PDF into chunks
// // ------------------------------------

// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 1000,
//   chunkOverlap: 200,
// });

// const chunks = await splitter.splitDocuments(docs);

// console.log("Chunks:", chunks.length);

// // ------------------------------------
// // 3. Connect to Ollama
// // ------------------------------------

// const embeddings = new OllamaEmbeddings({
//   model: "qwen3-embedding:4b",
//   baseUrl: "http://localhost:11434",
// });

// // ------------------------------------
// // 4. Generate embedding for every chunk
// // ------------------------------------

// const chunkEmbeddings = [];

// for (let i = 0; i < chunks.length; i++) {
//   const chunk = chunks[i];

//   if (!chunk) continue;

//   console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);

//   const vector = await embeddings.embedQuery(chunk.pageContent);

//   chunkEmbeddings.push({
//     chunk,
//     vector,
//   });
// }

// // ------------------------------------
// // 5. Inspect one result
// // ------------------------------------

// const first = chunkEmbeddings[0];

// if (!first) {
//   console.log("No embeddings were created.");
//   process.exit(1);
// }

// console.log("\n========== FIRST CHUNK ==========\n");

// console.log(first.chunk.pageContent);

// console.log("\n========== VECTOR INFO ==========\n");

// console.log("Vector dimensions:", first.vector.length);

// console.log("First 10 values:", first.vector.slice(0, 10));

// console.log("\n========== METADATA ==========\n");

// console.log(first.chunk.metadata);

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

// ------------------------------------
// 1. Load PDF
// ------------------------------------

const loader = new PDFLoader("./pdfs/document.pdf");

const docs = await loader.load();

console.log("Pages:", docs.length);

// ------------------------------------
// 2. Split into chunks
// ------------------------------------

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);

console.log("Chunks:", chunks.length);

// ------------------------------------
// 3. Connect to Ollama embeddings
// ------------------------------------

const embeddings = new OllamaEmbeddings({
  model: "qwen3-embedding:4b",
  baseUrl: "http://localhost:11434",
});

//-------------------------------------
// creating the ollama chat
//-------------------------------------

const llm = new ChatOllama({
  model: "gemma3:4b",
  baseUrl: "http://localhost:11434",
  temperature: 0,
});
// ------------------------------------
// 4. Create vector store
// ------------------------------------

console.log("\nCreating vector store...");

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

console.log("Vector store ready!");

// ------------------------------------
// 5. Ask a question
// ------------------------------------

// const question = "What is the round-trip efficiency of nuclear power plants?";

// // ------------------------------------
// // 6. Similarity search
// // ------------------------------------

// const results = await vectorStore.similaritySearchWithScore(question, 3);
// const context = results
//   .map(([document]) => document.pageContent)
//   .join("\n\n --- \n\n");

// // ------------------------------------
// // 7. Show results
// // ------------------------------------

// const prompt = `
// You are a helpful question-answering assistant.

// Answer the question using only the provided context.

// If the answer is not present in the context, say:
// "I do not have enough information in the provided context."

// Context:
// ${context}

// Question:
// ${question}

// Answer:
// `;
// // -----------------------------
// // invoking the llm
// // -----------------------------
// const response = await llm.invoke(prompt);

// console.log("\n========== SEARCH RESULTS ==========\n");

// results.forEach(([document, score], index) => {
//   console.log(`\n===== RESULT ${index + 1} =====`);

//   console.log("\nScore:", score);

//   console.log("\nContent:\n");

//   console.log(document.pageContent);

//   console.log("\nMetadata:\n");

//   console.log(document.metadata);
// });
// console.log("\n ================ ANSWER ================= \n");
// console.log(response.content);
// ------------------------------------
// 5. Retrieval evaluation dataset
// ------------------------------------

const evaluationSet = [
  // ------------------------------------
  // Lithium-ion query variations
  // ------------------------------------
  {
    question: "What is the round-trip efficiency of lithium-ion batteries?",
    expectedPage: 1,
  },
  {
    question: "What is the round-trip efficiency of lithium-ion systems?",
    expectedPage: 1,
  },
  {
    question: "What percentage of energy can lithium-ion batteries recover?",
    expectedPage: 1,
  },
  {
    question: "What is the efficiency of lithium-ion battery storage?",
    expectedPage: 1,
  },
  {
    question: "What is the typical round-trip efficiency for lithium-ion?",
    expectedPage: 1,
  },
  {
    question: "How efficient are lithium-ion batteries for grid storage?",
    expectedPage: 1,
  },

  // ------------------------------------
  // Other technologies
  // ------------------------------------
  {
    question: "What is the round-trip efficiency of pumped hydro storage?",
    expectedPage: 1,
  },
  {
    question: "What is the round-trip efficiency of hydrogen storage?",
    expectedPage: 3,
  },

  // ------------------------------------
  // Case study
  // ------------------------------------
  {
    question: "Where is Bath County discussed?",
    expectedPage: 4,
  },
];

// ------------------------------------
// 6. Run retrieval evaluation
// ------------------------------------

console.log("\n========== RETRIEVAL EVALUATION ==========\n");

let hitAt1Count = 0;
let hitAt3Count = 0;

for (const [index, test] of evaluationSet.entries()) {
  console.log(`\n===== QUESTION ${index + 1} =====`);

  console.log("Question:", test.question);

  const results = await vectorStore.similaritySearchWithScore(test.question, 3);

  const retrievedPages = results.map(
    ([document]) => document.metadata.loc?.pageNumber,
  );

  console.log("Expected page:", test.expectedPage);
  console.log("Retrieved pages:", retrievedPages);

  // Hit@1
  const hitAt1 = retrievedPages[0] === test.expectedPage;

  // Hit@3
  const hitAt3 = retrievedPages.includes(test.expectedPage);

  if (hitAt1) {
    console.log("Hit@1: ✅");
    hitAt1Count++;
  } else {
    console.log("Hit@1: ❌");
  }

  if (hitAt3) {
    console.log("Hit@3: ✅");
    hitAt3Count++;
  } else {
    console.log("Hit@3: ❌");
  }

  results.forEach(([document, score], resultIndex) => {
    console.log(`\n--- Result ${resultIndex + 1} ---`);

    console.log("Score:", score);

    console.log("Page:", document.metadata.loc?.pageNumber);

    console.log("Content:");

    console.log(document.pageContent);
  });
}

// ------------------------------------
// 7. Calculate metrics
// ------------------------------------
// Show retrieved results

const totalQuestions = evaluationSet.length;

const hitAt1Rate = (hitAt1Count / totalQuestions) * 100;
const hitAt3Rate = (hitAt3Count / totalQuestions) * 100;

console.log("\n==========================================");

console.log(`Hit@1: ${hitAt1Count}/${totalQuestions}`);
console.log(`Hit@1 Rate: ${hitAt1Rate.toFixed(1)}%`);

console.log("");

console.log(`Hit@3: ${hitAt3Count}/${totalQuestions}`);
console.log(`Hit@3 Rate: ${hitAt3Rate.toFixed(1)}%`);

console.log("==========================================");
