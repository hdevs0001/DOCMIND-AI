import type { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export type ChunkMetadata = {
  pages: number[];
  pageStart: number;
  pageEnd: number;
  heading: string | null;
};

export type RAGChunk = {
  content: string;
  metadata: ChunkMetadata;
};

function getPageNumber(
  document: Document,
  fallback: number,
): number {
  const metadata = document.metadata as Record<string, unknown>;

  const pageNumber = metadata["pageNumber"];

  if (typeof pageNumber === "number") {
    return pageNumber;
  }

  const page = metadata["page"];

  if (typeof page === "number") {
    return page;
  }

  const loc = metadata["loc"];

  if (loc && typeof loc === "object") {
    const locObject = loc as Record<string, unknown>;
    const locPageNumber = locObject["pageNumber"];

    if (typeof locPageNumber === "number") {
      return locPageNumber;
    }
  }

  return fallback;
}

/**
 * Generic heading detection.
 *
 * This does not depend on any specific PDF.
 */
function isHeading(line: string): boolean {
  const text = line.trim();

  if (!text) {
    return false;
  }

  // Examples:
  // 1. Introduction
  // 2. Methods
  // 2.1 Dataset
  // 3.2.1 Results
  if (/^\d+(?:\.\d+)*[.)]?\s+\S+/.test(text)) {
    return true;
  }

  // ALL CAPS headings
  if (
    text.length <= 100 &&
    text === text.toUpperCase() &&
    /[A-Z]/.test(text) &&
    !/[.!?]$/.test(text)
  ) {
    return true;
  }

  // Short title-like headings
  const words = text.split(/\s+/);

  if (
    words.length <= 8 &&
    text.length <= 80 &&
    !/[.!?]$/.test(text)
  ) {
    const capitalizedWords = words.filter((word) => {
      const firstLetter = word
        .replace(/^[^A-Za-z]+/, "")
        .charAt(0);

      return (
        firstLetter.length > 0 &&
        firstLetter === firstLetter.toUpperCase()
      );
    });

    if (
      capitalizedWords.length / words.length >= 0.7
    ) {
      return true;
    }
  }

  return false;
}

type Section = {
  text: string;
  pages: number[];
  heading: string | null;
};

function createSections(pages: Document[]): Section[] {
  const sections: Section[] = [];

  let currentLines: string[] = [];
  let currentPages = new Set<number>();
  let currentHeading: string | null = null;

  const flush = () => {
    const text = currentLines.join("\n").trim();

    if (!text) {
      return;
    }

    sections.push({
      text,
      pages: [...currentPages].sort((a, b) => a - b),
      heading: currentHeading,
    });

    currentLines = [];
    currentPages = new Set<number>();
  };

  pages.forEach((page, index) => {
    const pageNumber = getPageNumber(page, index + 1);

    const lines = page.pageContent
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (isHeading(line)) {
        flush();

        currentHeading = line;
        currentLines.push(line);
        currentPages.add(pageNumber);

        continue;
      }

      currentLines.push(line);
      currentPages.add(pageNumber);
    }
  });

  flush();

  return sections;
}

export async function createChunks(
  pages: Document[],
): Promise<RAGChunk[]> {
  const sections = createSections(pages);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1400,
    chunkOverlap: 200,
    separators: [
      "\n\n",
      "\n",
      ". ",
      "? ",
      "! ",
      "; ",
      ", ",
      " ",
      "",
    ],
  });

  const chunks: RAGChunk[] = [];

  for (const section of sections) {
    const pieces = await splitter.splitText(section.text);

    for (const piece of pieces) {
      const pagesForChunk =
        section.pages.length > 0
          ? section.pages
          : [1];

      const pageStart = pagesForChunk.at(0) ?? 1;
      const pageEnd =
        pagesForChunk.at(-1) ?? pageStart;

      chunks.push({
        content: piece,
        metadata: {
          pages: pagesForChunk,
          pageStart,
          pageEnd,
          heading: section.heading,
        },
      });
    }
  }

  return chunks;
}