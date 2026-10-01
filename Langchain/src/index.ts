import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
// ------------------------------------
// 1. Load PDF
// ------------------------------------

const loader = new PDFLoader("./pdfs/document.pdf");

const docs = await loader.load();

console.log("Pages:", docs.length);

// ------------------------------------------
// 2. Split into chunks
// ------------------------------------------

// ------------------------------------------
// Structure-aware section chunking
// ------------------------------------------

function createHeadingAwareDocuments(docs: Document[]) {
  const sections: Document[] = [];

  let currentMainHeading: string | null = null;
  let currentSubheading: string | null = null;

  let currentBody = "";
  let currentPages: number[] = [];

  function flushSection() {
    const cleanBody = currentBody.trim();

    if (!cleanBody) return;

    sections.push(
      new Document({
        pageContent: cleanBody,

        metadata: {
          mainHeading: currentMainHeading,
          subheading: currentSubheading,

          pages: [...currentPages],

          // Keep the first page for our current evaluation
          loc: {
            pageNumber: currentPages[0],
          },
        },
      }),
    );

    currentBody = "";
    currentPages = [];
  }

  for (const doc of docs) {
    const pageNumber = doc.metadata.loc?.pageNumber;

    const lines = doc.pageContent.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) continue;

      // ------------------------------------------
      // Subheading
      // Example:
      // 8.1 Bath County Pumped Storage Station
      // 8.2 Hornsdale Power Reserve
      // ------------------------------------------

      const subheadingMatch = line.match(/^\d+\.\d+\s+.+$/);

      if (subheadingMatch) {
        // New heading = previous section ends
        flushSection();

        currentSubheading = line;

        continue;
      }

      // ------------------------------------------
      // Main heading
      // Example:
      // 8. Case Studies
      // ------------------------------------------

      const mainHeadingMatch = line.match(/^\d+\.\s+.+$/);

      if (mainHeadingMatch) {
        // New heading = previous section ends
        flushSection();

        currentMainHeading = line;
        currentSubheading = null;

        continue;
      }

      // ------------------------------------------
      // Normal body text
      // ------------------------------------------

      currentBody += `${line} `;

      if (pageNumber !== undefined && !currentPages.includes(pageNumber)) {
        currentPages.push(pageNumber);
      }
    }
  }

  // Flush final section
  flushSection();

  return sections;
}

// ------------------------------------------
// 1. Create structure-aware sections
// ------------------------------------------

const sectionDocs = createHeadingAwareDocuments(docs);

console.log("Sections:", sectionDocs.length);

// ------------------------------------------
// 2. Split large sections into smaller chunks
// ------------------------------------------

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(sectionDocs);

// ------------------------------------------
// 3. Add heading context to EVERY chunk
// ------------------------------------------

for (const chunk of chunks) {
  const mainHeading = chunk.metadata.mainHeading;
  const subheading = chunk.metadata.subheading;

  const headingContext = [mainHeading, subheading].filter(Boolean).join("\n");

  if (headingContext) {
    chunk.pageContent = `${headingContext}\n\n${chunk.pageContent}`;
  }
}

console.log("Chunks:", chunks.length);
console.log("\n========== CHUNKS ==========\n");

chunks.forEach((chunk, index) => {
  console.log(`\n===== CHUNK ${index + 1} =====`);

  console.log("Page:", chunk.metadata.loc?.pageNumber);

  console.log("\nContent:\n");
  console.log(chunk.pageContent);
});

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
// Reranker
// ------------------------------------

async function rerankDocuments(question: string, documents: Document[]) {
  const documentsText = documents
    .map(
      (document, index) => `
DOCUMENT ${index + 1}
Page: ${document.metadata.loc?.pageNumber}

${document.pageContent}
`,
    )
    .join("\n--------------------\n");

  const prompt = `
You are a document relevance reranker.

Your task is to rank the documents according to how useful they are
for answering the user's question.

Question:
${question}

Documents:
${documentsText}

Return ONLY a JSON array.

The array must contain exactly one score for each document,
in the same order.

Use a score from 0 to 10:

10 = directly answers the question
8-9 = highly relevant
5-7 = somewhat relevant
1-4 = weakly relevant
0 = irrelevant

Example:
[9, 2, 7, 1]

Do not include explanations.
Do not include markdown.
`;

  const response = await llm.invoke(prompt);

  const raw = response.content.toString().trim();

  console.log("Reranker response:", raw);

  let scores: number[];

  try {
    scores = JSON.parse(raw);
  } catch {
    console.log("Could not parse reranker response.");
    return documents.map((document) => ({
      document,
      score: 0,
    }));
  }

  return documents
    .map((document, index) => ({
      document,
      score: Number(scores[index]) || 0,
    }))
    .sort((a, b) => b.score - a.score);
}
// ------------------------------------
// 4. Create vector store
// ------------------------------------

console.log("\nCreating vector store...");

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
// ===============================
// Stage 4: Metadata Filtering Test
// ===============================

const question =
  "What is the round-trip efficiency of lithium-ion batteries?";

const filteredResults =
  await vectorStore.similaritySearchWithScore(
    question,
    3,
    (document) =>
      document.metadata.mainHeading ===
      "2. Lithium-Ion Batteries",
  );

console.log("\n==============================");
console.log("METADATA FILTERING TEST");
console.log("==============================");

filteredResults.forEach(([document, score], index) => {
  console.log(`\n--- Result ${index + 1} ---`);
  console.log("Score:", score);
  console.log("Main heading:", document.metadata.mainHeading);
  console.log("Subheading:", document.metadata.subheading);
  console.log("Content:", document.pageContent);
});

console.log("Vector store ready!");

// ------------------------------------
// 5. Retrieval evaluation dataset
// ------------------------------------

// const evaluationSet = [
//   {
//     question: "What is the round-trip efficiency of lithium-ion batteries?",
//     expectedHeading: "2. Lithium-Ion Batteries",
//   },
//   {
//     question: "What is the round-trip efficiency of lithium-ion systems?",
//     expectedHeading: "2. Lithium-Ion Batteries",
//   },
//   {
//     question: "What percentage of energy can lithium-ion batteries recover?",
//     expectedHeading: "2. Lithium-Ion Batteries",
//   },
//   {
//     question: "What is the efficiency of lithium-ion battery storage?",
//     expectedHeading: "2. Lithium-Ion Batteries",
//   },
//   {
//     question: "What is the typical round-trip efficiency for lithium-ion?",
//     expectedHeading: "2. Lithium-Ion Batteries",
//   },
//   {
//     question: "How efficient are lithium-ion batteries for grid storage?",
//     expectedHeading: "2. Lithium-Ion Batteries",
//   },
//   {
//     question: "What is the round-trip efficiency of pumped hydro storage?",
//     expectedHeading: "1. Pumped Hydro Storage",
//   },
//   {
//     question: "What is the round-trip efficiency of hydrogen storage?",
//     expectedHeading: "6. Hydrogen-Based Storage",
//   },
//   {
//     question: "Where is Bath County discussed?",
//     expectedHeading: "8. Case Studies",
//     expectedSubheading:
//       "8.1 Bath County Pumped Storage Station (Virginia, USA)",
//   },
// ];

// ------------------------------------
// 6. Run retrieval evaluation
// ------------------------------------

console.log("\n========== RETRIEVAL EVALUATION ==========\n");

let hitAt1Count = 0;
let hitAt3Count = 0;

// for (const [index, test] of evaluationSet.entries()) {
//   console.log(`\n===== QUESTION ${index + 1} =====`);

//   console.log("Question:", test.question);
//   console.log("Expected heading:", test.expectedHeading);

//   // ------------------------------------
//   // 1. Retrieve top 3 using normal similarity
//   // ------------------------------------

//   // const results = await vectorStore.similaritySearchWithScore(test.question, 3);
//   // ------------------------------------
//   // 1. Retrieve top 10 candidates
//   // ------------------------------------

// const candidateResults =
//   await vectorStore.similaritySearchWithScore(
//     test.question,
//     10,
//     (document) =>
//       document.metadata.mainHeading ===
//       "2. Lithium-Ion Batteries",
//   );

//   // Remove similarity scores.
//   // Reranker only needs the documents.
//   const candidateDocuments = candidateResults.map(([document]) => document);

//   // ------------------------------------
//   // 2. Rerank top 10 candidates
//   // ------------------------------------

//   const rerankedResults = await rerankDocuments(
//     test.question,
//     candidateDocuments,
//   );

//   // ------------------------------------
//   // 3. Take top 3 after reranking
//   // ------------------------------------

//   const results = rerankedResults.slice(0, 3);

//   // ------------------------------------
//   // 2. Get retrieved headings
//   // ------------------------------------
//   const retrievedHeadings = results.map(
//     ({document}) => document.metadata.mainHeading,
//   );
//   console.log("Retrieved headings:", retrievedHeadings);
//   const hitAt1 = (() => {
//    const document = results[0].document;

//     const headingMatches =
//       document.metadata.mainHeading === test.expectedHeading;

//     if (test.expectedSubheading) {
//       return (
//         headingMatches &&
//         document.metadata.subheading === test.expectedSubheading
//       );
//     }

//     return headingMatches;
//   })();

//   const hitAt3 = results.some(({document}) => {
//     const headingMatches =
//       document.metadata.mainHeading === test.expectedHeading;

//     if (test.expectedSubheading) {
//       return (
//         headingMatches &&
//         document.metadata.subheading === test.expectedSubheading
//       );
//     }

//     return headingMatches;
//   });

//   if (hitAt1) {
//     console.log("Hit@1: ✅");
//     hitAt1Count++;
//   } else {
//     console.log("Hit@1: ❌");
//   }

//   if (hitAt3) {
//     console.log("Hit@3: ✅");
//     hitAt3Count++;
//   } else {
//     console.log("Hit@3: ❌");
//   }
  

//   // ------------------------------------
//   // 5. Show retrieved documents
//   // ------------------------------------

//   results.forEach(({document, score}, resultIndex) => {
//     console.log(`\n--- Result ${resultIndex + 1} ---`);

//     console.log("Similarity score:", score);

//     console.log("Main heading:", document.metadata.mainHeading);

//     console.log("Subheading:", document.metadata.subheading);

//     console.log("Page:", document.metadata.loc?.pageNumber);
//   });
// }

// ------------------------------------
// 7. Calculate metrics
// ------------------------------------

// const totalQuestions = evaluationSet.length;

// const hitAt1Rate = (hitAt1Count / totalQuestions) * 100;

// const hitAt3Rate = (hitAt3Count / totalQuestions) * 100;

// console.log("\n==========================================");

// console.log(`Hit@1: ${hitAt1Count}/${totalQuestions}`);

// console.log(`Hit@1 Rate: ${hitAt1Rate.toFixed(1)}%`);

// console.log("");

// console.log(`Hit@3: ${hitAt3Count}/${totalQuestions}`);

// console.log(`Hit@3 Rate: ${hitAt3Rate.toFixed(1)}%`);

// console.log("==========================================");
//added this part
// const results = await vectorStore.maxMarginalRelevanceSearch(test.question, {
//   k: 3,
//   fetchK: 10,
// });
//   //commented this part
//   // const retrievedPages = results.map(
//   //   ([document]) => document.metadata.loc?.pageNumber,
//   // );
//   // const retrievedPages = results.map(
//   //   (document) => document.metadata.loc?.pageNumber,
//   // );

//   console.log("Expected page:", test.expectedPage);
//   console.log("Retrieved pages:", retrievedPages);

//   // Hit@1
//   const hitAt1 = retrievedPages[0] === test.expectedPage;

//   // Hit@3
//   const hitAt3 = retrievedPages.includes(test.expectedPage);

//   if (hitAt1) {
//     console.log("Hit@1: ✅");
//     hitAt1Count++;
//   } else {
//     console.log("Hit@1: ❌");
//   }

//   if (hitAt3) {
//     console.log("Hit@3: ✅");
//     hitAt3Count++;
//   } else {
//     console.log("Hit@3: ❌");
//   }

//   results.forEach(([document, score], resultIndex) => {
//     console.log(`\n--- Result ${resultIndex + 1} ---`);

//     console.log("Score:", score);

//     console.log("Page:", document.metadata.loc?.pageNumber);

//     console.log("Content:");

//     console.log(document.pageContent);
//   });

//   // results.forEach((document, resultIndex) => {
//   //   console.log(`\n--- Result ${resultIndex + 1} ---`);
//   //   console.log("Page:", document.metadata.loc?.pageNumber);
//   //   console.log("Main heading:", document.metadata.mainHeading);
//   //   console.log("Subheading:", document.metadata.subheading);
//   //   console.log("Content:");
//   //   console.log(document.pageContent);
//   // });
// }

// // ------------------------------------
// // 7. Calculate metrics
// // ------------------------------------
// // Show retrieved results

// const totalQuestions = evaluationSet.length;

// const hitAt1Rate = (hitAt1Count / totalQuestions) * 100;
// const hitAt3Rate = (hitAt3Count / totalQuestions) * 100;

// console.log("\n==========================================");

// console.log(`Hit@1: ${hitAt1Count}/${totalQuestions}`);
// console.log(`Hit@1 Rate: ${hitAt1Rate.toFixed(1)}%`);

// console.log("");

// console.log(`Hit@3: ${hitAt3Count}/${totalQuestions}`);
// console.log(`Hit@3 Rate: ${hitAt3Rate.toFixed(1)}%`);

// console.log("==========================================");
