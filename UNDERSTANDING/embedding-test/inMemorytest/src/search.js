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
      return `[Chunk ${index + 1}]\n${chunk.text}`;
    })
    .join("\n\n");

  // 5. Send context + question to the LLM
  const response = await ollama.chat({
    model: "gemma3:4b",
    messages: [
      {
        role: "system",
        content:
          "Answer the user's question using only the provided context. If the answer is not in the context, say you do not have enough information.",
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
        console.log(`   ${chunk.text}\n`);
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
