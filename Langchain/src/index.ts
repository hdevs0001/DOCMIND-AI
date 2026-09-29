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

// ------------------------------------
// 2. Split into chunks
// ------------------------------------

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
// 4. Create vector store
// ------------------------------------

console.log("\nCreating vector store...");

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

console.log("Vector store ready!");

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

  // commented this part
  // const results = await vectorStore.similaritySearchWithScore(test.question, 3);
  //added this part
  const results = await vectorStore.maxMarginalRelevanceSearch(test.question, {
    k: 3,
    fetchK: 10,
  });
  //commented this part
  // const retrievedPages = results.map(
  //   ([document]) => document.metadata.loc?.pageNumber,
  // );
  const retrievedPages = results.map(
    (document) => document.metadata.loc?.pageNumber,
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

  // results.forEach(([document, score], resultIndex) => {
  //   console.log(`\n--- Result ${resultIndex + 1} ---`);

  //   console.log("Score:", score);

  //   console.log("Page:", document.metadata.loc?.pageNumber);

  //   console.log("Content:");

  //   console.log(document.pageContent);
  // });

  results.forEach((document, resultIndex) => {
    console.log(`\n--- Result ${resultIndex + 1} ---`);
    console.log("Page:", document.metadata.loc?.pageNumber);
    console.log("Main heading:", document.metadata.mainHeading);
    console.log("Subheading:", document.metadata.subheading);
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
