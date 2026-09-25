import ollama from "ollama";
import fs from "fs";


const texts = [
  "A dog us running through a park.",
  "A puppy us playing outside in a garden.",
  "I am learning how databases work.",
];

const batch = await ollama.embed({ model: "qwen3-embedding:4b", input: texts });

const embeddings = batch.embeddings;
// calcuate the cosine similarity between two vectors\
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// Compare text 1 with text 2
const similarity12 = cosineSimilarity(embeddings[0], embeddings[1]);
// Compare text 1 with text 3
const similarity13 = cosineSimilarity(embeddings[0], embeddings[2]);
// Compare text 2 with text 3
const similarity23 = cosineSimilarity(embeddings[1], embeddings[2]);

console.log("Text 1 vs Text 2:", similarity12);
console.log("Text 1 vs Text 3:", similarity13);
console.log("Text 2 vs Text 3:", similarity23);

const result = {
  model: "qwen3-embedding:4b",
  texts,
  similarities: {
    text1_vs_text2: similarity12,
    text1_vs_text3: similarity13,
    text2_vs_text3: similarity23,
  },
  embeddings,
};

fs.writeFileSync("./cosine.json", JSON.stringify(result, null, 2));
