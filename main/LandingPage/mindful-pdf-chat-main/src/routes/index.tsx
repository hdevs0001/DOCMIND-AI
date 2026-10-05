import { createFileRoute } from "@tanstack/react-router";
import { DocMindLanding } from "@/components/docmind-landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocMindAI — Chat with your PDFs" },
      {
        name: "description",
        content:
          "Upload a PDF, ask questions in plain English, and get accurate answers with page citations.",
      },
      { property: "og:title", content: "DocMindAI — Chat with your PDFs" },
      {
        property: "og:description",
        content: "Ask any PDF a question and get a grounded answer with exact page citations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocMindLanding,
});
