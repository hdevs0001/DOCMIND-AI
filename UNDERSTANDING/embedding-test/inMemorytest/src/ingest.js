import ollama from "ollama";
import fs from "fs";

const chunks = [
  "In 2000, the total population of the city was 45,200 people.",
  "In 2001, the city recorded 1,234 births and 520 deaths.",
  "In 2002, the city recorded 1,350 births and 510 deaths.",
  "In 2003, the population increased to 47,800 people.",
  "In 2004, the city recorded 1,410 births and 495 deaths.",

  "The largest age group in 2005 was people between 20 and 29 years old.",
  "In 2005, the total population reached 50,200 people.",
  "The birth rate in 2006 was estimated at 18.4 births per 1,000 people.",
  "In 2007, approximately 1,520 children were born in the city.",
  "The population growth rate between 2005 and 2010 was approximately 2.1 percent.",

  "In 2008, the city had three major hospitals serving the population.",
  "In 2009, the number of registered births was 1,580.",
  "In 2010, the total population reached 55,600 people.",
  "The average age of the population in 2011 was 31.4 years.",
  "In 2012, the city recorded 1,670 births.",

  "The northern region had the highest population density in 2013.",
  "In 2014, the city population increased by approximately 2.4 percent.",
  "The number of people aged over 65 increased steadily between 2010 and 2015.",
  "In 2015, the total population was estimated at 62,300 people.",
  "Between 2010 and 2015, the city experienced steady population growth."
];

const results = [];

for (let i = 0; i < chunks.length; i++) {
  console.log(`Generating embedding ${i + 1}/${chunks.length}...`);

  const response = await ollama.embed({
    model: "qwen3-embedding:4b",
    input: chunks[i]
  });

  results.push({
    id: i + 1,
    text: chunks[i],
    embedding: response.embeddings[0]
  });
}

fs.mkdirSync("./data", { recursive: true });

fs.writeFileSync(
  "./data/embeddings.json",
  JSON.stringify(results, null, 2)
);

console.log("Done!");
console.log(`Generated ${results.length} embeddings.`);
console.log("Saved to data/embeddings.json");