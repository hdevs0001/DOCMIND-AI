import ollama from "ollama";
import fs from "fs";
import { text } from "stream/consumers";

const texts = [
  "The quick brown fox jumps over the lazy dog.",
  "The five boxing wizards jump quickly.",
  "Jackdaws love my big sphinx of quartz.",
];

const batch = await ollama.embed({ model: "qwen3-embedding:4b", input: texts });

const result = texts.map((text, index) => ({
  text,
  embedding: batch.embeddings[index],
}));

fs.writeFileSync("./embeddings.json", JSON.stringify(result, null, 2));

