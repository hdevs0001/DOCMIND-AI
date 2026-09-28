// import ollama from "ollama";
// import fs from "fs";
// import { cosineSimilarity } from "./cosine.js";

// // 1. Load stored chunks + embeddings
// const data = JSON.parse(fs.readFileSync("./data/embeddings.json", "utf-8"));

// // 2. The user's question
// //const question = "How many people were born in 2001?";
// //const question = "What was the number of births in the city during 2001?";
// //const question = "What happened to the city's population in 2010?";
// // const question = "How many births were recorded in 2009?"
// const question = "Which year had 1,520 children born?";
// // 3. Create embedding for the question
// const response = await ollama.embed({
//   model: "qwen3-embedding:4b",
//   input: question,
// });

// const questionEmbedding = response.embeddings[0];

// // 4. Compare question with every stored chunk
// const results = data.map((item) => {
//   const similarity = cosineSimilarity(questionEmbedding, item.embedding);

//   return {
//     id: item.id,
//     text: item.text,
//     similarity,
//   };
// });

// // 5. Sort by highest similarity
// results.sort((a, b) => b.similarity - a.similarity);

// // 6. Take top 3
// const topK = results.slice(0, 3);

// // 7. Display results
// console.log("\nQuestion:");
// console.log(question);

// console.log("\nTop 3 relevant chunks:\n");

// topK.forEach((result, index) => {
//   console.log(`${index + 1}. Similarity: ${result.similarity.toFixed(4)}`);
//   console.log(`   ${result.text}\n`);
// });

// import ollama from "ollama";
// import fs from "fs";
// import readline from "readline";
// import { cosineSimilarity } from "./cosine.js";

// // Load stored chunks + embeddings
// const data = JSON.parse(
//   fs.readFileSync("./data/embeddings.json", "utf-8")
// );

// // Create terminal input
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// function askQuestion() {
//   rl.question("\nAsk a question (type 'exit' to quit): ", async (question) => {
//     // Exit
//     if (question.toLowerCase() === "exit") {
//       rl.close();
//       return;
//     }

//     // Handle empty question
//     if (!question.trim()) {
//       console.log("Please enter a question.");
//       askQuestion();
//       return;
//     }

//     console.log("\nSearching...\n");

//     // Create embedding for the question
//     const response = await ollama.embed({
//       model: "qwen3-embedding:4b",
//       input: question
//     });

//     const questionEmbedding = response.embeddings[0];

//     // Compare question with every stored chunk
//     const results = data.map((item) => {
//       const similarity = cosineSimilarity(
//         questionEmbedding,
//         item.embedding
//       );

//       return {
//         id: item.id,
//         text: item.text,
//         similarity
//       };
//     });

//     // Sort highest similarity first
//     results.sort((a, b) => b.similarity - a.similarity);

//     // Get top 3
//     const topK = results.slice(0, 3);

//     // Display results
//     console.log("Question:");
//     console.log(question);

//     console.log("\nTop 3 relevant chunks:\n");

//     topK.forEach((result, index) => {
//       console.log(
//         `${index + 1}. Similarity: ${result.similarity.toFixed(4)}`
//       );

//       console.log(`   ${result.text}\n`);
//     });

//     // Ask again
//     askQuestion();
//   });
// }

// console.log("=== DocMind AI Semantic Search ===");

// askQuestion();

import ollama from "ollama";
import fs from "fs";
import readline from "readline";
import { cosineSimilarity } from "./cosine.js";

// Load stored chunks + embeddings
const data = JSON.parse(fs.readFileSync("./data/embeddings.json", "utf-8"));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function search(question) {
  // 1. Create embedding for the question
  const response = await ollama.embed({
    model: "qwen3-embedding:4b",
    input: question,
  });

  const questionEmbedding = response.embeddings[0];

  // 2. Compare question with every stored chunk
  const results = data.map((item) => {
    const similarity = cosineSimilarity(questionEmbedding, item.embedding);

    return {
      id: item.id,
      text: item.text,
      similarity,
      metadata: item.metadata,
    };
  });

  // 3. Sort by similarity
  results.sort((a, b) => b.similarity - a.similarity);

  // 4. Get top 3 chunks
  return results.slice(0, 3);
}

async function generateAnswer(question, topChunks) {
  // Convert retrieved chunks into context
  const context = topChunks
    .map((chunk, index) => {
      const metadata = chunk.metadata;

      let metadataText = "";

      if (metadata?.page != null) {
        metadataText += `Page: ${metadata.page}\n`;
      }

      if (metadata?.mainHeading) {
        metadataText += `Main heading: ${metadata.mainHeading}\n`;
      }

      if (metadata?.subheading) {
        metadataText += `Subheading: ${metadata.subheading}\n`;
      }

      if (metadata?.subPart) {
        metadataText += `Sub-part: ${metadata.subPart}\n`;
      }

      return `[Chunk ${index + 1}]
Metadata:
${metadataText}
Text:
${chunk.text}`;
    })
    .join("\n\n");

  // 5. Send context + question to the LLM
  const response = await ollama.chat({
    model: "gemma3:4b",
    messages: [
      {
        role: "system",
        content: `
You are answering questions about a document.

Use only the provided context.

The context contains:
- Text: the actual document content.
- Metadata: structural information about where the text appears in the document.
  - Page = PDF page number
  - Main heading = highest-level section
  - Subheading = subsection
  - Sub-part = lower-level subsection

Use the text to answer factual questions.
Use the metadata when the question asks about the document's structure, section, subsection, or location.

If the answer cannot be found in the provided context, say:
"I do not have enough information in the provided context."
`,
      },
      {
        role: "user",
        content: `Context:

${context}

Question:
${question}`,
      },
    ],
  });

  return response.message.content;
}

async function askQuestion() {
  rl.question("\nAsk a question (type 'exit' to quit): ", async (question) => {
    if (question.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    if (!question.trim()) {
      console.log("Please enter a question.");
      askQuestion();
      return;
    }

    try {
      console.log("\nSearching...");

      // Retrieve relevant chunks
      const topChunks = await search(question);

      console.log("\nRetrieved chunks:\n");

      topChunks.forEach((chunk, index) => {
        console.log(`${index + 1}. Similarity: ${chunk.similarity.toFixed(4)}`);

        console.log("   Metadata:");

        if (chunk.metadata?.page != null) {
          console.log(`     Page: ${chunk.metadata.page}`);
        }

        if (chunk.metadata?.mainHeading) {
          console.log(`     Main heading: ${chunk.metadata.mainHeading}`);
        }

        if (chunk.metadata?.subheading) {
          console.log(`     Subheading: ${chunk.metadata.subheading}`);
        }

        if (chunk.metadata?.subPart) {
          console.log(`     Sub-part: ${chunk.metadata.subPart}`);
        }

        console.log(`   Text: ${chunk.text}\n`);
      });

      // Generate answer using retrieved chunks
      console.log("Generating answer...\n");

      const answer = await generateAnswer(question, topChunks);

      console.log("Answer:");
      console.log(answer);
    } catch (error) {
      console.error("\nSomething went wrong:", error.message);
    }

    askQuestion();
  });
}

console.log("=== DocMind AI RAG ===");

askQuestion();
