import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

const loader = new PDFLoader("./pdfs/document.pdf");
const docs = await loader.load();
console.log("Pages:", docs.length);

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

      const subheadingMatch = line.match(/^\d+\.\d+\s+.+$/);

      if (subheadingMatch) {
        // New heading = previous section ends
        flushSection();

        currentSubheading = line;

        continue;
      }

      const mainHeadingMatch = line.match(/^\d+\.\s+.+$/);

      if (mainHeadingMatch) {
        // New heading = previous section ends
        flushSection();

        currentMainHeading = line;
        currentSubheading = null;

        continue;
      }

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

const sectionDocs = createHeadingAwareDocuments(docs);

console.log("Sections:", sectionDocs.length);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(sectionDocs);

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

const embeddings = new OllamaEmbeddings({
  model: "qwen3-embedding:4b",
  baseUrl: "http://localhost:11434",
});

const llm = new ChatOllama({
  model: "gemma3:4b",
  baseUrl: "http://localhost:11434",
  temperature: 0,
});

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
   Use when the question requires information from multiple sections.

3. "global_search"
  Use when the answer requires searching broadly
across the document and the relevant sections cannot be determined
from the question.

4. "not_in_document"
   Use when the question is clearly unrelated to the document
   or asks for information that this document does not cover.
Important:

Before selecting a section, determine whether the question is
actually answerable from this document.

Do NOT force an unrelated question into the closest-looking section.

For example:
- "What is the difference between supervised and unsupervised learning?"
  → "not_in_document"
- "What is the efficiency of lithium-ion batteries?"
  → section 2
- "How does lithium-ion compare with pumped hydro?"
  → sections 1 and 2
  
Important routing rules:

Choose the minimum number of sections that contain the evidence
needed to answer the question.

Think about all constraints and requirements in the question.

Include a section if it contains evidence needed to:
- answer the question directly
- evaluate a constraint
- rule out an option
- compare alternatives
- explain why an option is suitable or unsuitable

Important for constraint-based questions:

When a question contains multiple constraints or conditions,
identify ALL of them before selecting sections.

For example, if a question asks about:
- a specific storage duration
- a geographic limitation
- a technology comparison
- cost or efficiency requirements

select sections containing evidence needed to evaluate each
constraint.

Do not select sections based only on the first part of the question.

For questions involving storage duration, consider sections that
discuss technologies suitable for the requested duration, even if
those technologies are not explicitly named in the question.

Do NOT select a section merely because it is topically related.

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
  For not_in_document:
{
  "strategy": "not_in_document",
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

const evaluationQuestions = [
  {
    id: 1,
    type: "direct_fact",
    question: "What is the round-trip efficiency of lithium-ion batteries?",
    expectedSections: ["2. Lithium-Ion Batteries"],
  },

  {
    id: 2,
    type: "named_entity",
    question: "How long can Bath County operate at full output?",
    expectedSections: ["8. Case Studies"],
  },

  {
    id: 3,
    type: "comparison",
    question: "How do lithium-ion batteries compare with pumped hydro?",
    expectedSections: [
      "1. Pumped Hydro Storage",
      "2. Lithium-Ion Batteries",
      "7. Comparing and Choosing Between Technologies",
    ],
  },

  {
    id: 4,
    type: "broad",
    question: "What storage technologies are discussed in this document?",
    expectedSections: [
      "1. Pumped Hydro Storage",
      "2. Lithium-Ion Batteries",
      "3. Flow Batteries",
      "4. Compressed Air Energy Storage",
      "5. Thermal Energy Storage",
      "6. Hydrogen-Based Storage",
    ],
  },

  {
    id: 5,
    type: "multi_section",
    question:
      "What are the main differences between lithium-ion and hydrogen storage?",
    expectedSections: [
      "2. Lithium-Ion Batteries",
      "6. Hydrogen-Based Storage",
      "7. Comparing and Choosing Between Technologies",
    ],
  },

  {
    id: 6,
    type: "multi_constraint",
    question:
      "If a grid needs storage for several days and has no suitable mountainous terrain, which technologies discussed in the document could be considered, and why?",
    expectedSections: [
      "1. Pumped Hydro Storage",
      "2. Lithium-Ion Batteries",
      "4. Compressed Air Energy Storage",
      "6. Hydrogen-Based Storage",
      "7. Comparing and Choosing Between Technologies",
    ],
  },

  {
    id: 7,
    type: "paraphrased",
    question:
      "How efficient are lithium-ion systems when charging and discharging?",
    expectedSections: ["2. Lithium-Ion Batteries"],
  },

  {
    id: 8,
    type: "missing_information",
    question:
      "What is the manufacturing cost of lithium-ion batteries in 2026?",
    expectedSections: [],
  },

  {
    id: 9,
    type: "out_of_document",
    question:
      "What is the difference between supervised and unsupervised learning?",
    expectedSections: [],
  },

  {
    id: 10,
    type: "reasoning",
    question:
      "Why might hydrogen be considered for longer-duration storage instead of lithium-ion batteries?",
    expectedSections: [
      "2. Lithium-Ion Batteries",
      "6. Hydrogen-Based Storage",
      "7. Comparing and Choosing Between Technologies",
    ],
  },
  {
    id: 11,
    type: "DSA",
    question: "Give me a Binary search code ?",
    expectedSections: [
      "2. Lithium-Ion Batteries",
      "6. Hydrogen-Based Storage",
      "7. Comparing and Choosing Between Technologies",
    ],
  },
];

for (const question of evaluationQuestions) {
  const route = await routeQuery(question.question);

  console.log("\n==============================");
  console.log("QUERY ROUTING");
  console.log("==============================");

  console.log("Question:", question.question);
  console.log("Route:", route);

let results: [Document, number][] = [];

  if (route.strategy === "single_section") {
    const section = route.sections[0];

    results = await vectorStore.similaritySearchWithScore(
      question.question,
      5,
      (document) => {
        return document.metadata.mainHeading === section;
      },
    );
  } else if (route.strategy === "multi_section") {
    const sectionResults = await Promise.all(
      route.sections.map(async (section: string) => {
        return vectorStore.similaritySearchWithScore(
          question.question,
          3,
          (document) => {
            return document.metadata.mainHeading === section;
          },
        );
      }),
    );

    results = sectionResults.flat();

    results.sort((a, b) => b[1] - a[1]);
  } else if (route.strategy === "not_in_document") {
    console.log("\n==============================");
    console.log("ANSWER");
    console.log("==============================");
    console.log(
      "The provided document does not contain enough information to answer this question.",
    );

    continue;
  } else if (route.strategy === "global_search") {
    results = await vectorStore.similaritySearchWithScore(question.question, 5);
  }

  // console.log("\n==============================");
  // console.log("RETRIEVAL");
  // console.log("==============================");

  // console.log("Strategy:", route.strategy);
  // console.log("Sections:", route.sections);

  // for (const [doc, score] of results) {
  //   console.log("\nScore:", score);
  //   console.log("Main Heading:", doc.metadata.mainHeading);
  //   console.log("Subheading:", doc.metadata.subheading);
  //   console.log("Page:", doc.metadata.loc?.pageNumber);
  //   console.log("Content:", doc.pageContent.slice(0, 300));
  // }

  const context = results.map(([doc]) => doc.pageContent).join("\n\n");

  const answerPrompt = `
You are answering a user's question using ONLY the information provided
in the retrieved document context.

Your goal is to give a concise, accurate, natural answer that is fully
grounded in the retrieved context.

Rules:

1. Use ONLY the retrieved document context to answer the question.

2. Do NOT use general knowledge, outside knowledge, assumptions, or facts
   that are not supported by the retrieved context.

3. If the retrieved context directly supports the answer, answer using
   those facts and paraphrase them naturally.

4. If the retrieved context does not contain enough information to answer
   the question, clearly say:

   "The provided document does not contain enough information to answer
   this question."

5. If only part of the question can be answered, answer the supported
   part and clearly state which part cannot be answered from the document.

6. For comparison questions, use information about ALL relevant subjects
   found in the context. Do not focus on only one subject if the question
   asks for a comparison.

7. For questions asking for multiple items, make sure to include ALL
   relevant items supported by the context.

8. For reasoning questions, you may combine multiple facts from the
   context to form a reasonable conclusion, but do not introduce facts
   that are not present in the context.

9. If the question asks for a specific number, date, cost, efficiency,
   duration, or other factual value, provide it only if that information
   exists in the context.

10. Do not guess, fill gaps, or invent information.

11. Do not reproduce long passages or quotations from the document.
    Paraphrase the relevant information.

12. Keep the answer concise and directly answer the user's question.

13. Do not mention the retrieval process, chunks, embeddings, vector
    search, routing, or the context itself.

Context:
${context}

Question:
${question.question}
`;

  const answer = await llm.invoke(answerPrompt);

  console.log("\n==============================");
  console.log("ANSWER");
  console.log("==============================");
  console.log(answer.content);
}
