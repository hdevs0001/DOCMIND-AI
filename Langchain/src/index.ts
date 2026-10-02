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

// async function rerankDocuments(question: string, documents: Document[]) {
//   const documentsText = documents
//     .map(
//       (document, index) => `
// DOCUMENT ${index + 1}
// Page: ${document.metadata.loc?.pageNumber}

// ${document.pageContent}
// `,
//     )
//     .join("\n--------------------\n");

//   const prompt = `
// You are a document relevance reranker.

// Your task is to rank the documents according to how useful they are
// for answering the user's question.

// Question:
// ${question}

// Documents:
// ${documentsText}

// Return ONLY a JSON array.

// The array must contain exactly one score for each document,
// in the same order.

// Use a score from 0 to 10:

// 10 = directly answers the question
// 8-9 = highly relevant
// 5-7 = somewhat relevant
// 1-4 = weakly relevant
// 0 = irrelevant

// Example:
// [9, 2, 7, 1]

// Do not include explanations.
// Do not include markdown.
// `;

//   const response = await llm.invoke(prompt);

//   const raw = response.content.toString().trim();

//   console.log("Reranker response:", raw);

//   let scores: number[];

//   try {
//     scores = JSON.parse(raw);
//   } catch {
//     console.log("Could not parse reranker response.");
//     return documents.map((document) => ({
//       document,
//       score: 0,
//     }));
//   }

//   return documents
//     .map((document, index) => ({
//       document,
//       score: Number(scores[index]) || 0,
//     }))
//     .sort((a, b) => b.score - a.score);
// }
// ===============================
// Stage 4: Metadata Filtering Test
// ===============================

// ------------------------------------
// LLM-based Query Router
// ------------------------------------

async function routeQuery(question: string) {
  const availableSections = [
    {
      name: "1. Pumped Hydro Storage",
      description:
        "Covers pumped hydro storage, how it works, efficiency, advantages, disadvantages, and operating characteristics.",
    },

    {
      name: "2. Lithium-Ion Batteries",
      description:
        "Covers lithium-ion batteries, including LFP batteries, efficiency, characteristics, advantages, disadvantages, and applications.",
    },

    {
      name: "3. Flow Batteries",
      description:
        "Covers flow battery technology, how it works, characteristics, advantages, disadvantages, and applications.",
    },

    {
      name: "4. Compressed Air Energy Storage",
      description:
        "Covers compressed air energy storage, how it works, characteristics, advantages, disadvantages, and applications.",
    },

    {
      name: "5. Thermal Energy Storage",
      description:
        "Covers thermal energy storage, how it works, characteristics, advantages, disadvantages, and applications.",
    },

    {
      name: "6. Hydrogen-Based Storage",
      description:
        "Covers hydrogen energy storage, hydrogen production and storage, efficiency, advantages, disadvantages, and applications.",
    },

    {
      name: "7. Comparing and Choosing Between Technologies",
      description:
        "Compares different energy storage technologies and discusses how to choose between them based on factors such as efficiency, duration, cost, and use case.",
    },

    {
      name: "8. Case Studies",
      description:
        "Contains real-world energy storage case studies, including Bath County Pumped Storage Station, Hornsdale Power Reserve, and other storage projects.",
    },

    {
      name: "9. Glossary",
      description:
        "Defines technical terms and concepts related to grid-scale energy storage.",
    },
  ];
  const prompt = `
You are a query router for a document retrieval system.

Your job is to decide which document sections are needed
to answer the user's question.

Available sections:

${availableSections
  .map((section) => `- ${section.name}\n  Description: ${section.description}`)
  .join("\n")}

User question:
${question}

Choose one strategy:

1. "single_section"
   Use when the question can be answered mainly from one section.

2. "multi_section"
   Use when the question explicitly requires information
   from multiple sections, such as comparison or combining facts.

3. "global_search"
   Use when the question is broad and is not limited to
   a specific section.

Important routing rules:

- Choose the minimum number of sections needed to answer the question.
- Do NOT select a section just because it is related to the topic.
- If the question can be answered from one section, choose "single_section".
- Use "multi_section" ONLY when the question explicitly requires
  information from multiple sections.
- For questions asking about a specific named entity, choose the
  section that directly discusses that entity.
- Use "global_search" when the answer requires searching broadly
  across the document and the relevant sections cannot be determined
  from the question.

- If the question explicitly asks which technologies or topics are
  discussed and those topics correspond directly to known sections,
  "multi_section" is acceptable.

Return ONLY valid JSON.

For single_section:
{
  "strategy": "single_section",
  "sections": ["section name"]
}

For multi_section:
{
  "strategy": "multi_section",
  "sections": ["section name", "section name"]
}

For global_search:
{
  "strategy": "global_search",
  "sections": []
}
`;

  const response = await llm.invoke(prompt);

  const raw = response.content.toString().trim();

  console.log("\nLLM Router Response:");
  console.log(raw);

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.log("Could not parse router response.");

    return {
      strategy: "global_search",
      sections: [],
    };
  }
}

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

// -----------------------------------
// Query Router
// -----------------------------------

// function routeQuery(question: string) {
//   const AskedQuestion = question.toLowerCase();
//   if (AskedQuestion.includes("lithium-ion")) {
//     return {
//       strategy: "metadata_filter",
//       filter: {
//         mainHeading: "2. Lithium-Ion Batteries",
//       },
//     };
//   }

//   //specific subsection
//   if (AskedQuestion.includes("bath county")) {
//     return {
//       strategy: "metadata_filter",
//       filter: {
//         subheading: "8.1 Bath County Pumped Storage Station (Virginia, USA)",
//       },
//     };
//   }

//   return {
//     strategy: "vector_search",
//   };
// }

//------------------------------------
//Ask a Question
//------------------------------------

const testQuestions = [
  "What is the efficiency of LFP batteries?",
  "How long can the Bath County station operate?",
  "Compare lithium-ion batteries and pumped hydro.",
  "What storage technologies are discussed in this document?",
];

for (const question of testQuestions) {
  const route = await routeQuery(question);

  console.log("\n==============================");
  console.log("QUERY ROUTING");
  console.log("==============================");

  console.log("Question:", question);
  console.log("Route:", route);

  let results;

  if (route.strategy === "single_section") {
    const section = route.sections[0];

    results = await vectorStore.similaritySearchWithScore(
      question,
      5,
      (document) => {
        return document.metadata.mainHeading === section;
      },
    );
  } else if (route.strategy === "multi_section") {
    const sections = route.sections;

    results = await vectorStore.similaritySearchWithScore(
      question,
      5,
      (document) => {
        return sections.includes(document.metadata.mainHeading);
      },
    );
  } else {
    results = await vectorStore.similaritySearchWithScore(question, 5);
  }

  // -----------------------------------
  // Show retrieved chunks
  // -----------------------------------

  console.log("\n==============================");
  console.log("RETRIEVAL");
  console.log("==============================");

  console.log("Strategy:", route.strategy);
  console.log("Sections:", route.sections);

  for (const [doc, score] of results) {
    console.log("\nScore:", score);
    console.log("Main Heading:", doc.metadata.mainHeading);
    console.log("Subheading:", doc.metadata.subheading);
    console.log("Page:", doc.metadata.loc?.pageNumber);
    console.log("Content:", doc.pageContent.slice(0, 300));
  }

  const context = results.map(([doc]) => doc.pageContent).join("\n\n");

  const answerPrompt = `
Answer the user's question using ONLY the provided context.

If the answer is not present in the context,
say: "I do not have enough information in the provided context."

Context:
${context}

Question:
${question}
`;

  const answer = await llm.invoke(answerPrompt);

  console.log("\n==============================");
  console.log("ANSWER");
  console.log("==============================");
  console.log(answer.content);
}

//   let results;

//   if (route.strategy === "metadata_filter") {
//     results = await vectorStore.similaritySearchWithScore(
//       question,
//       5,
//       (document) => {
//         if (route.filter?.mainHeading) {
//           return (
//             document.metadata.mainHeading ===
//             route.filter.mainHeading
//           );
//         }

//         if (route.filter?.subheading) {
//           return (
//             document.metadata.subheading ===
//             route.filter.subheading
//           );
//         }

//         return true;
//       },
//     );
//   } else {
//     results =
//       await vectorStore.similaritySearchWithScore(
//         question,
//         10,
//       );
//   }

//   console.log("\nRETRIEVAL RESULTS");
//   console.log("Results found:", results.length);

//   results.forEach(([document, score], index) => {
//     console.log(`\n--- Result ${index + 1} ---`);

//     console.log("Score:", score);
//     console.log(
//       "Main heading:",
//       document.metadata.mainHeading,
//     );
//     console.log(
//       "Subheading:",
//       document.metadata.subheading,
//     );
//     console.log(
//       "Page:",
//       document.metadata.loc?.pageNumber,
//     );
//   });
// }
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

// console.log("\n========== RETRIEVAL EVALUATION ==========\n");

// let hitAt1Count = 0;
// let hitAt3Count = 0;

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
