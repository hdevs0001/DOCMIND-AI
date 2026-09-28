import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const loader = new PDFLoader("./pdfs/document.pdf");

const docs = await loader.load();

console.log("Pages:", docs.length);

if (docs.length === 0) {
  console.log("No pages were extracted from the PDF.");
  process.exit(1);
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);
console.log("chunks:", chunks.length);

const firstChunk = chunks[0];
if (!firstChunk) {
  console.log("No chunks were created.");
  process.exit(1);
}
console.log("\n========== FIRST CHUNK ==========\n");

console.log(firstChunk.pageContent);

console.log("\n========== CHUNK METADATA ==========\n");

console.log(firstChunk.metadata);
